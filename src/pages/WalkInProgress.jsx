import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
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

    // Live Tracking Logic (Improved with watchPosition)
    useEffect(() => {
        let watchId;
        let lastSentTime = 0;

        const sendLocation = async (lat, lng) => {
            if (!assignment || assignment.status !== 'IN_PROGRESS') return;
            try {
                // Throttle server updates to every 7 seconds to avoid noise, but keep local map real-time
                const now = Date.now();
                if (now - lastSentTime > 7000) {
                    await api.post(`/walk-assignments/${id}/location`, { latitude: lat, longitude: lng });
                    lastSentTime = now;
                }
            } catch (error) {
                console.error('Error sending location:', error);
            }
        };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                // Solo aceptar posiciones con precisión menor a 100 metros para evitar saltos locos
                if (accuracy > 100) return;

                const newPoint = { lat: latitude, lng: longitude };
                setCurrentPos(newPoint);
                setLocalRoute(prev => [...prev.slice(-50), newPoint]);
                sendLocation(latitude, longitude);
            },
            (err) => {
                if (err.code === 1) alert("⚠️ Error: Permiso de GPS denegado. Actívalo para que el dueño pueda seguirte.");
                console.warn("GPS Warn", err);
            },
            {
                enableHighAccuracy: true, // Forzar GPS satelital
                timeout: 10000,
                maximumAge: 0
            }
        );
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
        <div className="min-h-screen bg-primary-600 pb-20">
            {/* Header Sticky */}
            <div className="bg-primary-700/80 backdrop-blur-md sticky top-0 z-30 p-4 border-b border-primary-500 shadow-lg">
                <div className="max-w-xl mx-auto flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner">🐕</div>
                        <div>
                            <h1 className="font-black text-lg leading-tight">{assignment.walkRequest.dog.name}</h1>
                            <p className="text-xs text-primary-200">En paseo...</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-mono font-black">{formatTime(elapsedTime)}</div>
                        <div className="text-[10px] uppercase font-bold text-primary-300">Tiempo Real</div>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">

                {/* Live Tracker Map */}
                <div className="h-48 w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-primary-400/20 relative">
                    {isLoaded && currentPos ? (
                        <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={currentPos}
                            zoom={18}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                zoomControl: false,
                                fullscreenControl: false,
                                styles: [{ featureType: "all", elementType: "labels", stylers: [{ visibility: "on" }] }]
                            }}
                        >
                            <Marker position={currentPos} icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                scaledSize: { width: 40, height: 40 }
                            }} />
                            <Polyline
                                path={localRoute}
                                options={{ strokeColor: '#3B82F6', strokeWeight: 5, strokeOpacity: 0.8 }}
                            />
                        </GoogleMap>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-primary-200">
                            <span className="text-4xl animate-pulse whitespace-nowrap mb-2">📍 Capturando GPS...</span>
                            <p className="text-[10px] font-black uppercase tracking-widest">Sigue caminando por favor</p>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-primary-700 shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        RASTREO EN VIVO
                    </div>
                    {currentPos && (
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-mono text-white/80">
                            {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
                        </div>
                    )}
                </div>

                {/* Dog Info & Instructions */}
                <div className="bg-white rounded-[40px] p-6 shadow-2xl border border-primary-400/20 overflow-hidden">
                    <div className="flex gap-4 items-center mb-6">
                        {assignment.walkRequest.dog.photoUrl ? (
                            <img src={getImageUrl(assignment.walkRequest.dog.photoUrl)} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="Dog" />
                        ) : (
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🐕</div>
                        )}
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paseando a</p>
                            <h2 className="text-xl font-black text-gray-800 leading-none">{assignment.walkRequest.dog.name}</h2>
                            <p className="text-sm font-bold text-primary-600">{assignment.walkRequest.dog.breed || 'Raza mix'} • {assignment.walkRequest.dog.size}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gray-50 p-4 rounded-3xl text-center border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Dueño</p>
                            <p className="font-bold text-gray-700 leading-tight mb-1">{assignment.walkRequest.owner.firstName}</p>
                            <a href={`tel:${assignment.walkRequest.owner.phone}`} className="text-xs text-primary-600 font-extrabold flex items-center justify-center gap-1">
                                📞 Llamar
                            </a>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl text-center border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Energía</p>
                            <p className={`font-black ${assignment.walkRequest.dog.energyLevel === 'HIGH' ? 'text-red-500' :
                                assignment.walkRequest.dog.energyLevel === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'
                                }`}>
                                {assignment.walkRequest.dog.energyLevel}
                            </p>
                        </div>
                    </div>

                    {/* Alertas Críticas de Manejo */}
                    <div className="space-y-3">
                        {(assignment.walkRequest.dog.reactiveWithDogs || assignment.walkRequest.dog.needsMuzzle || assignment.walkRequest.dog.pullsLeash) && (
                            <div className="flex flex-wrap gap-2">
                                {assignment.walkRequest.dog.reactiveWithDogs && <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">REACTIVO A PERROS</span>}
                                {assignment.walkRequest.dog.needsMuzzle && <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full">USA BOZAL</span>}
                                {assignment.walkRequest.dog.pullsLeash && <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full">JALA CORREA</span>}
                            </div>
                        )}

                        <div className="bg-primary-50 p-5 rounded-3xl border border-primary-100 shadow-inner">
                            <span className="text-[10px] font-black text-primary-600 uppercase block mb-2 leading-none">📢 Notas del Dueño</span>
                            <p className="text-sm text-primary-900 font-bold italic leading-relaxed">
                                "{assignment.walkRequest.dog.notesForWalker || assignment.walkRequest.details || "Sin notas adicionales."}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Photo Upload Section */}
                <div className="bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                        📸 Fotos del Paseo
                        <span className="text-xs font-normal text-gray-400">({photos.length}/5)</span>
                    </h3>

                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                        {photosPreview.map((src, i) => (
                            <div key={i} className="relative flex-shrink-0">
                                <img src={src} className="w-24 h-24 object-cover rounded-2xl border shadow-sm" alt="Preview" />
                                <button
                                    onClick={() => removePhoto(i)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-md"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {photos.length < 5 && (
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="w-24 h-24 flex-shrink-0 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 transition-colors"
                            >
                                <span className="text-2xl">➕</span>
                                <span className="text-[10px] font-bold">Subir</span>
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                    />
                </div>

                {/* Report Form */}
                <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-6">
                    <h3 className="font-black text-gray-800 text-xl border-b pb-4">Reporte del Paseo</h3>

                    {/* Needs */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setReportData({ ...reportData, didPee: !reportData.didPee })}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${reportData.didPee ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                        >
                            <span className="text-3xl">💦</span>
                            <span className="font-black text-sm uppercase">Pipí</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${reportData.didPee ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'}`}>
                                {reportData.didPee && '✓'}
                            </div>
                        </button>
                        <button
                            onClick={() => setReportData({ ...reportData, didPoop: !reportData.didPoop })}
                            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${reportData.didPoop ? 'border-amber-700 bg-amber-50 text-amber-900' : 'border-gray-50 bg-gray-50 text-gray-400'}`}
                        >
                            <span className="text-3xl">💩</span>
                            <span className="font-black text-sm uppercase">Popó</span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${reportData.didPoop ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-200'}`}>
                                {reportData.didPoop && '✓'}
                            </div>
                        </button>
                    </div>

                    {/* Behavior */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-3">Comportamiento del Perro</label>
                        <div className="flex bg-gray-50 p-1 rounded-2xl">
                            {['BUENO', 'NORMAL', 'DIFICIL'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setReportData({ ...reportData, behaviorRating: r })}
                                    className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${reportData.behaviorRating === r ? 'bg-white shadow-md text-primary-600 scale-105 z-10' : 'text-gray-400'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-3">Notas adicionales</label>
                        <textarea
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-gray-300"
                            rows="3"
                            placeholder="Ej: Estuvo muy activo y jugamos con pelotas..."
                            value={reportData.reportNotes}
                            onChange={e => setReportData({ ...reportData, reportNotes: e.target.value })}
                        />
                    </div>

                    {/* Early End Reason (Conditional) */}
                    {isEarly && (
                        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl animate-pulse-slow">
                            <label className="block text-xs font-black text-orange-700 uppercase mb-3">⚠️ Motivo de Término Anticipado (Obligatorio)</label>
                            <textarea
                                className="w-full bg-white border-2 border-orange-100 rounded-xl p-3 text-sm focus:border-orange-400 outline-none"
                                placeholder="Indica por qué terminó antes el paseo..."
                                value={reportData.earlyEndReason}
                                onChange={e => setReportData({ ...reportData, earlyEndReason: e.target.value })}
                            />
                            <p className="text-[10px] text-orange-600 mt-2 italic font-bold">El paseo duró menos de los {assignment.walkRequest.durationMinutes} min programados.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 pt-4">
                    <button
                        onClick={handleFinishWalk}
                        disabled={loading}
                        className="w-full bg-white text-primary-700 font-black py-5 rounded-3xl text-xl shadow-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : '🏁 FINALIZAR PASEO'}
                    </button>

                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full text-white/60 font-bold py-2 text-sm hover:text-white transition-colors"
                    >
                        Cancelar Paseo (Emergencia)
                    </button>
                </div>

            </div>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-[40px] p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Cancelar Paseo</h2>
                        <p className="text-gray-500 text-sm mb-6">Esta acción es solo para emergencias. Se notificará al dueño.</p>

                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Motivo obligatorio</label>
                        <textarea
                            className="input-field mb-6"
                            placeholder="Explica qué sucedió..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3 font-bold text-gray-400"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCancelWalk}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkInProgress;

