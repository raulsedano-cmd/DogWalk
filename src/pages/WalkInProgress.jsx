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
    const [signalQuality, setSignalQuality] = useState('BUSCANDO');
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
        if (assignment && assignment.actualStartTime && assignment.status === 'IN_PROGRESS') {
            const startTime = new Date(assignment.actualStartTime).getTime();
            interval = setInterval(() => {
                const now = new Date().getTime();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [assignment]);

    useEffect(() => {
        let watchId;
        let lastSentTime = 0;

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3;
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

                        if (accuracy > 60) return;

                        const newPoint = { lat: latitude, lng: longitude };

                        if (!lastCoordsRef.current) {
                            const startLat = assignment?.walkRequest?.latitude;
                            const startLng = assignment?.walkRequest?.longitude;
                            if (startLat && startLng) {
                                const distFromStart = calculateDistance(latitude, longitude, startLat, startLng);
                                if (distFromStart > 200) return;
                            }
                        }

                        if (lastCoordsRef.current) {
                            const dist = calculateDistance(latitude, longitude, lastCoordsRef.current.lat, lastCoordsRef.current.lng);
                            if (dist < 3) return;
                            if (dist > 300) return;
                        }

                        lastCoordsRef.current = newPoint;
                        setCurrentPos(newPoint);
                        setLocalRoute(prev => [...prev.slice(-100), newPoint]);
                        sendLocation(latitude, longitude);
                    },
                    (err) => {
                        setSignalQuality('SIN SEÑAL');
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
            if (data.walkerId !== user.id) return navigate('/walker/dashboard');
            if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
                return navigate(`/walk-requests/${data.walkRequestId}`);
            }
            setAssignment(data);
        } catch (error) {
            navigate('/walker/dashboard');
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
            alert("Máximo 5 fotos permitidas por paseo.");
            return;
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
        const requiredMins = assignment.walkRequest.durationMinutes;

        if (elapsedMins < requiredMins && !reportData.earlyEndReason.trim()) {
            return alert(`El tiempo transcurrido (${elapsedMins}m) es menor al programado (${requiredMins}m). Por favor, indica el motivo del término anticipado en el reporte.`);
        }

        if (!window.confirm("¿Confirmas que has regresado a la mascota y deseas finalizar la misión?")) return;

        setLoading(true);
        try {
            // 1. Upload Photos first
            if (photos.length > 0) {
                setUploadingPhotos(true);
                const formData = new FormData();
                photos.forEach(p => formData.append('photos', p));
                await api.post(`/walk-assignments/${id}/photos`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Complete the Assignment
            await api.put(`/walk-assignments/${id}/complete`, {
                ...reportData,
                didPee: !!reportData.didPee,
                didPoop: !!reportData.didPoop
            });

            alert("Misión cumplida. El reporte ha sido enviado al dueño.");
            // NAVIGATION FIX: Use replace to avoid "push" issues if they try to go back
            navigate(`/walk-requests/${assignment.walkRequestId}`, { replace: true });
        } catch (error) {
            alert(error.response?.data?.error || "Error al sincronizar el cierre de misión.");
        } finally {
            setLoading(false);
            setUploadingPhotos(false);
        }
    };

    const handleCancelWalk = async () => {
        if (!cancelReason.trim()) return alert("El motivo es obligatorio");
        try {
            await api.put(`/walk-assignments/${id}/cancel`, { reason: cancelReason });
            navigate('/walker/dashboard', { replace: true });
        } catch (error) {
            alert(error.response?.data?.error || "Error al cancelar la misión.");
        }
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 800);

    if (!isMobile) {
        return (
            <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6 text-center">
                <div className="max-w-md bg-white rounded-[40px] p-10 shadow-2xl space-y-8 animate-fadeIn">
                    <div className="text-7xl">📱</div>
                    <h2 className="text-3xl font-black text-navy-900 tracking-tight uppercase italic">Protocolo Móvil</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        Esta sección requiere sensores GPS activos. Accede desde tu dispositivo móvil certificado.
                    </p>
                    <button onClick={() => navigate('/walker/dashboard')} className="btn-navy w-full">Volver a Base</button>
                </div>
            </div>
        );
    }

    if (loading && !assignment) return (
        <div className="h-screen bg-navy-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="text-white/30 font-black text-[9px] uppercase tracking-widest">Sincronizando Satélites...</p>
            </div>
        </div>
    );

    const isEarly = Math.floor(elapsedTime / 60) < (assignment?.walkRequest?.durationMinutes || 0);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-900 font-['Inter']">
            {/* Background Map */}
            <div className="absolute inset-0 z-0 opacity-80">
                {isLoaded && (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={currentPos || { lat: assignment?.walkRequest?.latitude || 0, lng: assignment?.walkRequest?.longitude || 0 }}
                        zoom={18}
                        options={mapOptions}
                        onDragStart={() => setIsFollowing(false)}
                    >
                        {currentPos && (
                            <Marker position={currentPos} icon={{ url: "https://img.icons8.com/ios-filled/100/FF6B00/dog.png", scaledSize: { width: 40, height: 40 }, anchor: { x: 20, y: 20 } }} />
                        )}
                        <Polyline path={localRoute} options={{ strokeColor: '#FF6B00', strokeWeight: 6, strokeOpacity: 0.7 }} />
                    </GoogleMap>
                )}
            </div>

            {/* Status Layer */}
            <div className="absolute top-0 inset-x-0 p-4 z-20">
                <div className="max-w-xl mx-auto flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-2">
                        {isOffline && (
                            <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-2xl animate-pulse">OFFLINE</div>
                        )}
                        <div className="bg-navy-900/90 backdrop-blur-2xl px-4 py-2 rounded-full shadow-2xl border border-white/10 flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${signalQuality === 'EXCELENTE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">{signalQuality}</span>
                        </div>
                    </div>

                    <div className="bg-primary-600 text-white px-6 py-3 rounded-[24px] shadow-2xl border-4 border-white/20 flex flex-col items-center min-w-[110px]">
                        <span className="text-2xl font-black tracking-tighter italic leading-none mb-1">{formatTime(elapsedTime)}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-70">En Misión</span>
                    </div>
                </div>
            </div>

            {/* Re-center */}
            {!isFollowing && (
                <button onClick={() => setIsFollowing(true)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-[16px] shadow-2xl flex items-center justify-center text-xl z-20 border border-slate-100 transition-all active:scale-95">🎯</button>
            )}

            {/* Control Sheet */}
            <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
                <div className="max-w-xl mx-auto px-4 pb-4 pointer-events-auto">
                    <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden max-h-[70vh] flex flex-col animate-fadeIn">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto my-3" />

                        <div className="overflow-y-auto px-6 pb-6 space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                                    {assignment.walkRequest.dog.photoUrl ? (
                                        <img src={getImageUrl(assignment.walkRequest.dog.photoUrl)} className="w-full h-full rounded-[20px] object-cover" alt="D" />
                                    ) : '🐕'}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-black text-navy-900 tracking-tighter uppercase leading-none mb-1">{assignment.walkRequest.dog.name}</h2>
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{assignment.walkRequest.dog.breed || 'DogWalk Pro'}</p>
                                </div>
                                <a href={`tel:${assignment.walkRequest.owner.phone}`} className="w-12 h-12 bg-emerald-50 rounded-[16px] flex items-center justify-center text-xl shadow-inner text-emerald-600 active:scale-90 transition-all">📞</a>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setReportData({ ...reportData, didPee: !reportData.didPee })} className={`py-4 rounded-[20px] border-2 transition-all flex flex-col items-center gap-1 ${reportData.didPee ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>
                                    <span className="text-2xl">💦</span>
                                    <span className="font-black text-[9px] uppercase tracking-widest">Pipí</span>
                                </button>
                                <button onClick={() => setReportData({ ...reportData, didPoop: !reportData.didPoop })} className={`py-4 rounded-[20px] border-2 transition-all flex flex-col items-center gap-1 ${reportData.didPoop ? 'border-primary-600 bg-primary-50 text-primary-900' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>
                                    <span className="text-2xl">💩</span>
                                    <span className="font-black text-[9px] uppercase tracking-widest">Popó</span>
                                </button>
                            </div>

                            <details className="group" open={isEarly}>
                                <summary className="flex justify-between items-center cursor-pointer list-none py-3 px-5 rounded-[16px] bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reporte Táctico</span>
                                    <span className="transition-transform group-open:rotate-180 text-slate-400 text-[10px]">▼</span>
                                </summary>
                                <div className="space-y-6 pt-5 animate-fadeIn">
                                    <div>
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Comportamiento</label>
                                        <div className="flex bg-slate-50 p-1 rounded-[14px] border border-slate-100">
                                            {['BUENO', 'NORMAL', 'DIFICIL'].map(r => (
                                                <button key={r} onClick={() => setReportData({ ...reportData, behaviorRating: r })} className={`flex-1 py-3 text-[9px] font-black rounded-[10px] transition-all ${reportData.behaviorRating === r ? 'bg-white shadow-md text-primary-600' : 'text-slate-400 opacity-60'}`}>{r}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Fotos ({photos.length}/5)</label>
                                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                            {photosPreview.map((src, i) => (
                                                <div key={i} className="relative flex-shrink-0">
                                                    <img src={src} className="w-20 h-20 object-cover rounded-[16px] border-2 border-white shadow-md" alt="P" />
                                                    <button onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 bg-navy-900 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-black shadow-lg">✕</button>
                                                </div>
                                            ))}
                                            {photos.length < 5 && (
                                                <button onClick={() => fileInputRef.current.click()} className="w-20 h-20 flex-shrink-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[16px] flex items-center justify-center text-2xl text-slate-300 hover:text-primary-600 transition-all">➕</button>
                                            )}
                                        </div>
                                    </div>

                                    <textarea className="input-field min-h-[80px] !py-4 !text-xs" placeholder="Notas del paseo..." value={reportData.reportNotes} onChange={e => setReportData({ ...reportData, reportNotes: e.target.value })} />

                                    {isEarly && (
                                        <div className="p-4 bg-amber-50 rounded-[20px] border-2 border-amber-200/40">
                                            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-2 italic">⚠️ Cierre Anticipado</p>
                                            <textarea className="w-full bg-white border-none rounded-[12px] p-3 text-[10px] font-bold text-navy-900 focus:ring-1 focus:ring-amber-500" placeholder="Indica el motivo (ej: lluvia intensa)..." value={reportData.earlyEndReason} onChange={e => setReportData({ ...reportData, earlyEndReason: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                            </details>

                            <div className="space-y-3 pt-2">
                                <button onClick={handleFinishWalk} disabled={loading || isOffline} className="btn-primary w-full py-5 !rounded-[24px] shadow-primary-500/20 text-lg uppercase tracking-tighter">
                                    {loading ? 'Sincronizando...' : 'Finalizar Paseo 🏁'}
                                </button>
                                <button onClick={() => setShowCancelModal(true)} className="w-full text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 hover:text-red-500 transition-colors">Emergencia / Abortar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />

            {showCancelModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-navy-900/40 transition-all">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-fadeIn">
                        <h2 className="text-2xl font-black text-navy-900 mb-2 uppercase italic">Abortar.</h2>
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-6">Indica el motivo de fuerza mayor.</p>
                        <textarea className="input-field min-h-[100px] mb-6" placeholder="Escribe aquí..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                        <div className="flex gap-4">
                            <button onClick={() => setShowCancelModal(false)} className="flex-1 font-black text-slate-400 uppercase text-[9px] tracking-widest">Volver</button>
                            <button onClick={handleCancelWalk} className="flex-1 py-4 bg-red-600 text-white rounded-[16px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkInProgress;
