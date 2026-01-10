import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { uberMapStyle } from '../helpers/mapStyles';

const mapContainerStyle = {
    width: '100%',
    height: '100vh',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    styles: uberMapStyle
};

const libraries = ['places'];

const WalkInProgress = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [photosPreview, setPhotosPreview] = useState([]);
    const fileInputRef = useRef();
    const [localRoute, setLocalRoute] = useState([]);
    const [currentPos, setCurrentPos] = useState(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const [reportData, setReportData] = useState({
        didPee: false,
        didPoop: false,
        behaviorRating: 'NORMAL',
        reportNotes: '',
        earlyEndReason: ''
    });
    const [isLowAccuracy, setIsLowAccuracy] = useState(false);
    const [signalQuality, setSignalQuality] = useState('BUSCANDO'); // 'Pobre', 'Buena', 'Excelente'
    const lastCoordsRef = useRef(null);
    const [isFollowing, setIsFollowing] = useState(true);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        loadAssignment();
    }, [id]);

    useEffect(() => {
        let interval;
        // Timer logic
        if (assignment && assignment.actualStartTime && assignment.status === 'IN_PROGRESS') {
            const startTime = new Date(assignment.actualStartTime).getTime();
            interval = setInterval(() => {
                const now = new Date().getTime();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [assignment]);

    // Live Tracking Logic (Pro-Style: Distance & Accuracy Filters)
    useEffect(() => {
        let watchId;
        let lastSentTime = 0;

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3; // metres
            const φ1 = lat1 * Math.PI / 180;
            const φ2 = lat2 * Math.PI / 180;
            const Δφ = (lat2 - lat1) * Math.PI / 180;
            const Δλ = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const sendLocation = async (lat, lng) => {
            if (!assignment || assignment.status !== 'IN_PROGRESS') return;
            try {
                const now = Date.now();
                // Send if at least 7 seconds passed
                if (now - lastSentTime > 7000) {
                    await api.post(`/walk-assignments/${id}/location`, { latitude: lat, longitude: lng });
                    lastSentTime = now;
                }
            } catch (error) {
                console.error('Error sending location:', error);
            }
        };

        if (assignment && assignment.status === 'IN_PROGRESS') {
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude, longitude, accuracy } = pos.coords;

                        // 1. DYNAMIC QUALITY INDICATOR
                        if (accuracy > 100) {
                            setSignalQuality('POBRE');
                            setIsLowAccuracy(true);
                        } else if (accuracy > 40) {
                            setSignalQuality('BUENA');
                            setIsLowAccuracy(false);
                        } else {
                            setSignalQuality('EXCELENTE');
                            setIsLowAccuracy(false);
                        }

                        // 2. STRICTOR FILTERING (UBER LEVEL)
                        // Ignore any point from a PC or bad GPS provider (> 60m error)
                        if (accuracy > 60) return;

                        // Calculate distance from last valid position to prevent "jumpy" points
                        if (lastCoordsRef.current) {
                            const dist = calculateDistance(
                                lastCoordsRef.current.lat, lastCoordsRef.current.lng,
                                latitude, longitude
                            );

                            // If user moved less than 4 meters, it's just GPS "noise" while standing still
                            if (dist < 4) return;

                            // If user "jumps" more than 300 meters, it's a glitch
                            if (dist > 300) return;
                        }

                        const newPoint = { lat: latitude, lng: longitude };
                        lastCoordsRef.current = newPoint;
                        setCurrentPos(newPoint);
                        setLocalRoute(prev => [...prev.slice(-100), newPoint]); // Store longer local route
                        sendLocation(latitude, longitude);
                    },
                    (err) => {
                        setSignalQuality('SIN SEÑAL');
                        if (err.code === 1) alert("⚠️ El GPS es obligatorio para rastrear el paseo. Por favor actívalo.");
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            }
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [assignment, id]);

    const loadAssignment = async () => {
        try {
            const response = await api.get(`/walk-assignments/${id}`);
            const data = response.data;

            if (data.walkerId !== user.id) {
                alert("Acceso denegado");
                return navigate('/my-walks');
            }

            if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
                return navigate(`/walk-requests/${data.walkRequestId}`);
            }

            setAssignment(data);
        } catch (error) {
            console.error(error);
            navigate('/my-walks');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            return alert("Máximo 5 fotos");
        }

        setPhotos(prev => [...prev, ...files]);

        const previews = files.map(file => URL.createObjectURL(file));
        setPhotosPreview(prev => [...prev, ...previews]);
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotosPreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinishWalk = async () => {
        const elapsedMins = Math.floor(elapsedTime / 60);
        if (elapsedMins < assignment.walkRequest.durationMinutes && !reportData.earlyEndReason) {
            return alert("El paseo duró menos de lo programado. Por favor indica el motivo del término anticipado.");
        }

        if (!window.confirm("¿Confirmas que el paseo ha terminado?")) return;

        setLoading(true);
        try {
            // 1. Upload Photos if any
            if (photos.length > 0) {
                setUploadingPhotos(true);
                const formData = new FormData();
                photos.forEach(p => formData.append('photos', p));
                await api.post(`/walk-assignments/${id}/photos`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Complete Walk
            await api.put(`/walk-assignments/${id}/complete`, reportData);

            alert("¡Paseo finalizado! El dueño recibirá tu reporte.");
            navigate(`/walk-requests/${assignment.walkRequestId}`);
        } catch (error) {
            alert(error.response?.data?.error || "Error al finalizar el paseo");
        } finally {
            setLoading(false);
            setUploadingPhotos(false);
        }
    };

    const handleCancelWalk = async () => {
        if (!cancelReason.trim()) return alert("El motivo es obligatorio");

        try {
            await api.put(`/walk-assignments/${id}/cancel`, { reason: cancelReason });
            alert("Paseo cancelado correctamente");
            navigate('/walker/dashboard');
        } catch (error) {
            alert(error.response?.data?.error || "Error al cancelar");
        }
    };

    if (loading && !assignment) return <div className="text-center py-20">Cargando paseo...</div>;

    const isEarly = Math.floor(elapsedTime / 60) < (assignment?.walkRequest?.durationMinutes || 0);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-gray-100 font-sans">
            {/* BACKGROUND MAP */}
            <div className="absolute inset-0 z-0">
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={currentPos || { lat: assignment?.walkRequest?.latitude || 0, lng: assignment?.walkRequest?.longitude || 0 }}
                        zoom={18}
                        options={mapOptions}
                        onDragStart={() => setIsFollowing(false)}
                    >
                        {currentPos && (
                            <>
                                <Marker
                                    position={currentPos}
                                    icon={{
                                        url: "https://img.icons8.com/ios-filled/100/3B82F6/dog.png", // Perro azul profesional
                                        scaledSize: { width: 40, height: 40 },
                                        anchor: { x: 20, y: 20 }
                                    }}
                                />
                                {/* Pulsing Ring Effect */}
                                <Marker
                                    position={currentPos}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        fillColor: '#3B82F6',
                                        fillOpacity: 0.15,
                                        strokeWeight: 0,
                                        scale: 30,
                                    }}
                                />
                            </>
                        )}
                        <Polyline
                            path={localRoute}
                            options={{ strokeColor: '#3B82F6', strokeWeight: 6, strokeOpacity: 0.8 }}
                        />
                    </GoogleMap>
                )}
            </div>

            {/* OVERLAY: Status Center */}
            <div className="absolute top-0 inset-x-0 p-4 z-20 space-y-2">
                <div className="max-w-xl mx-auto flex justify-between items-start">
                    {/* Signal & Connection */}
                    <div className="flex flex-col gap-2">
                        {isOffline && (
                            <div className="bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-lg animate-pulse">
                                SIN CONEXIÓN
                            </div>
                        )}
                        <div className={`bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 ${signalQuality === 'EXCELENTE' ? 'border-green-500' : signalQuality === 'BUENA' ? 'border-yellow-500' : 'border-red-500'} flex items-center gap-2`}>
                            <span className={`w-2 h-2 rounded-full ${signalQuality === 'EXCELENTE' ? 'bg-green-500' : signalQuality === 'BUENA' ? 'bg-yellow-500' : 'bg-red-500'} animate-ping`}></span>
                            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">GPS: {signalQuality}</span>
                        </div>
                    </div>

                    {/* Timer Card */}
                    <div className="bg-primary-600 text-white px-6 py-3 rounded-[32px] shadow-2xl border-2 border-white/20 flex flex-col items-center min-w-[120px]">
                        <span className="text-2xl font-mono font-black tracking-widest">{formatTime(elapsedTime)}</span>
                        <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">Tiempo de Paseo</span>
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION: Re-center */}
            {!isFollowing && currentPos && (
                <button
                    onClick={() => setIsFollowing(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-full shadow-2xl border-2 border-primary-100 flex items-center justify-center text-xl z-20 hover:scale-110 active:scale-95 transition-all"
                >
                    🎯
                </button>
            )}

            {/* BOTTOM SHEET: Dog Info & Controls */}
            <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
                <div className="max-w-xl mx-auto px-4 pb-4 pointer-events-auto">
                    <div className="bg-white rounded-[48px] shadow-2xl border-t border-gray-100 overflow-hidden max-h-[70vh] flex flex-col">
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 flex-shrink-0" />

                        <div className="overflow-y-auto px-6 pb-6 space-y-6">
                            {/* Dog & Owner Info */}
                            <div className="flex items-center gap-4">
                                {assignment.walkRequest.dog.photoUrl ? (
                                    <img src={getImageUrl(assignment.walkRequest.dog.photoUrl)} className="w-16 h-16 rounded-[24px] object-cover shadow-md" alt="Dog" />
                                ) : (
                                    <div className="w-16 h-16 bg-primary-50 rounded-[24px] flex items-center justify-center text-3xl">🐕</div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-xl font-black text-gray-800 leading-none mb-1">{assignment.walkRequest.dog.name}</h2>
                                    <p className="text-xs font-bold text-primary-600">{assignment.walkRequest.dog.breed || 'Raza mix'} • {assignment.walkRequest.dog.size}</p>
                                </div>
                                <a href={`tel:${assignment.walkRequest.owner.phone}`} className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl shadow-inner text-green-600">
                                    📞
                                </a>
                            </div>

                            {/* Signal Warning Overlay (Inside bottom sheet if bad accuracy) */}
                            {isLowAccuracy && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 flex gap-3 animate-fadeIn">
                                    <span className="text-2xl">🚧</span>
                                    <div>
                                        <p className="text-red-900 font-extrabold text-xs uppercase mb-1">Señal poco confiable</p>
                                        <p className="text-red-700 text-[10px] leading-tight font-medium">Uber/InDrive recomiendan usar tu celular al aire libre para mejorar la ubicación.</p>
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions (Report) */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setReportData({ ...reportData, didPee: !reportData.didPee })}
                                    className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-center gap-3 ${reportData.didPee ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                                >
                                    <span className="text-2xl">💦</span>
                                    <span className="font-black text-xs uppercase">Pipí</span>
                                </button>
                                <button
                                    onClick={() => setReportData({ ...reportData, didPoop: !reportData.didPoop })}
                                    className={`p-4 rounded-[28px] border-2 transition-all flex items-center justify-center gap-3 ${reportData.didPoop ? 'border-amber-700 bg-amber-50 text-amber-900' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                                >
                                    <span className="text-2xl">💩</span>
                                    <span className="font-black text-xs uppercase">Popó</span>
                                </button>
                            </div>

                            {/* Full Report Toggle / Expandable */}
                            <details className="group">
                                <summary className="flex justify-between items-center cursor-pointer list-none py-2 px-2 rounded-2xl bg-gray-50 mb-4">
                                    <span className="text-xs font-black text-gray-500 uppercase">Ver Reporte Completo</span>
                                    <span className="transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <div className="space-y-6 pt-2 animate-slideDown">
                                    {/* Behavior */}
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3">Estado de {assignment.walkRequest.dog.name}</label>
                                        <div className="flex bg-gray-50 p-1 rounded-2xl">
                                            {['BUENO', 'NORMAL', 'DIFICIL'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setReportData({ ...reportData, behaviorRating: r })}
                                                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${reportData.behaviorRating === r ? 'bg-white shadow-md text-primary-600' : 'text-gray-400'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Photo Upload */}
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 px-2">Fotos del Paseo ({photos.length}/5)</label>
                                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                            {photosPreview.length > 0 && photosPreview.map((src, i) => (
                                                <div key={i} className="relative flex-shrink-0">
                                                    <img src={src} className="w-16 h-16 object-cover rounded-xl border" alt="Preview" />
                                                    <button onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[8px] font-bold">✕</button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                className="w-16 h-16 flex-shrink-0 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400"
                                            >
                                                ➕
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        rows="2"
                                        placeholder="Alguna nota extra para el dueño..."
                                        value={reportData.reportNotes}
                                        onChange={e => setReportData({ ...reportData, reportNotes: e.target.value })}
                                    />

                                    {isEarly && (
                                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                            <p className="text-[10px] font-black text-orange-700 uppercase mb-2">⚠️ Motivo Fin Anticipado</p>
                                            <textarea
                                                className="w-full bg-white border border-orange-100 rounded-xl p-2 text-xs"
                                                value={reportData.earlyEndReason}
                                                onChange={e => setReportData({ ...reportData, earlyEndReason: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </details>

                            {/* Main Action Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleFinishWalk}
                                    disabled={loading || isOffline}
                                    className="w-full bg-primary-600 text-white font-black py-4 rounded-[32px] text-lg shadow-xl shadow-primary-200 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {loading ? 'Subiendo reporte...' : '🏁 FINALIZAR PASEO'}
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="w-full text-gray-400 font-bold py-4 text-xs hover:text-red-500 transition-colors"
                                >
                                    Reportar Emergencia / Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invisibility Layer for Input */}
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />

            {/* Cancel Modal (unchanged but standard) */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl">
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Emergencia</h2>
                        <textarea
                            className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-red-500 mb-6"
                            placeholder="Describe qué sucedió..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setShowCancelModal(false)} className="flex-1 font-bold text-gray-400">Volver</button>
                            <button onClick={handleCancelWalk} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold">CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkInProgress;

