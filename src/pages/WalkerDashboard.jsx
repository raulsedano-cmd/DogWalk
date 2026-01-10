import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import Avatar from '../components/Avatar';

const WalkerDashboard = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [availableRequests, setAvailableRequests] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: '',
        zone: '',
        size: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    // Status metrics
    const metrics = [
        { label: 'Rating', value: user.averageRating?.toFixed(1) || '5.0', icon: '⭐', color: 'text-amber-400' },
        { label: 'Paseos', value: user.completedWalks || '0', icon: '🐕', color: 'text-emerald-400' },
        { label: 'Nivel', value: 'Pro', icon: '💎', color: 'text-indigo-400' },
        { label: 'Estado', value: user.verificationStatus === 'VERIFIED' ? 'Verificado' : 'Pendiente', icon: '🛡️', color: 'text-blue-400' }
    ];

    useEffect(() => {
        loadData();
    }, [page, filters]);

    const loadData = async () => {
        try {
            const [requestsRes, assignmentsRes] = await Promise.all([
                api.get('/walk-requests', {
                    params: { page, limit: 9, ...filters },
                }),
                api.get('/walk-assignments'),
            ]);

            setAvailableRequests(requestsRes.data.requests || []);
            setTotalPages(requestsRes.data.pagination?.totalPages || 1);
            setMyAssignments(assignmentsRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const toggleAvailability = async () => {
        setAvailabilityLoading(true);
        try {
            const newStatus = !user.isAvailable;
            const response = await api.put('/users/me', { isAvailable: newStatus });
            if (response.data.user) {
                updateUser(response.data.user);
            } else {
                updateUser({ ...user, isAvailable: newStatus });
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            alert('Error al actualizar disponibilidad');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const handleUpdateAssignment = async (assignmentId, action) => {
        try {
            let endpoint = `/walk-assignments/${assignmentId}/${action === 'IN_PROGRESS' ? 'start' : 'status'}`;
            await api.put(endpoint, { status: action === 'IN_PROGRESS' ? undefined : action });

            if (action === 'IN_PROGRESS') {
                navigate(`/walk-assignments/${assignmentId}/in-progress`);
                return;
            }
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar paseo');
        }
    };

    const handleArrived = async (assignmentId) => {
        try {
            await api.put(`/walk-assignments/${assignmentId}/arrived`);
            setMyAssignments(prev => prev.map(a =>
                a.id === assignmentId ? { ...a, walkerArrivedAt: new Date().toISOString() } : a
            ));
        } catch (error) {
            alert("Error al notificar llegada");
        }
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 800) ||
        ('ontouchstart' in window);

    const pendingAssignments = myAssignments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
    const inProgressWalk = pendingAssignments.find(a => a.status === 'IN_PROGRESS');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-emerald-500 font-black tracking-widest text-[10px] uppercase">Sincronizando Terminal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] pb-32 font-sans selection:bg-emerald-500/30">
            {/* Control Center Header */}
            <div className="bg-[#1E293B] border-b border-white/5 pb-20 pt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar
                                    src={user.profilePhotoUrl}
                                    alt="Profile"
                                    size="32"
                                    fallbackText={user.firstName}
                                    className="border-4 border-emerald-500/20 shadow-2xl rounded-[32px] w-24 h-24 lg:w-32 lg:h-32 object-cover"
                                />
                                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-[#1E293B] flex items-center justify-center shadow-lg ${user.isAvailable ? 'bg-emerald-500 pulse-ring' : 'bg-red-500'}`}>
                                    <span className="text-white text-[10px] font-black">{user.isAvailable ? 'ON' : 'OFF'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-none">
                                    {user.firstName} <span className="text-emerald-500">{user.lastName}</span>
                                </h1>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Walker Terminal v2.0</p>
                            </div>
                        </div>

                        {/* Master Availability Toggle */}
                        <div className="bg-[#0F172A]/80 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 w-full lg:w-auto flex flex-col sm:flex-row items-center gap-10 shadow-2xl">
                            <div className="text-center sm:text-left space-y-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Estado Global</p>
                                <p className={`text-2xl font-black ${user.isAvailable ? 'text-white' : 'text-gray-500/50'}`}>
                                    {user.isAvailable ? '📡 RECIBIENDO' : '🚫 DESCONECTADO'}
                                </p>
                            </div>
                            <button
                                onClick={toggleAvailability}
                                disabled={availabilityLoading}
                                className={`h-20 px-12 rounded-[24px] font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl ${user.isAvailable
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
                                    }`}
                            >
                                {availabilityLoading ? 'Cargando...' : (user.isAvailable ? 'Apagar' : 'Encender')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -translate-y-10">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="bg-[#1E293B] p-8 rounded-[32px] border border-white/5 shadow-xl group hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{m.icon}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${m.color}`}>{m.label}</span>
                            </div>
                            <p className="text-4xl font-black text-white tracking-tighter">{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* ACTIVE MISSION (High Urgency) */}
                {inProgressWalk && (
                    <div className="mb-16 animate-fadeIn bg-indigo-600 rounded-[40px] p-8 lg:p-14 shadow-[0_35px_60px_-15px_rgba(79,70,229,0.3)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="bg-white/20 backdrop-blur-xl text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-white/10">
                                🛰️ Tracking Live
                            </div>
                        </div>
                        <div className="flex items-center gap-10 text-white relative z-10">
                            <div className="text-6xl bg-white/10 w-28 h-28 rounded-[36px] flex items-center justify-center border border-white/20 shadow-inner">🐕</div>
                            <div className="space-y-1">
                                <h3 className="text-4xl lg:text-5xl font-black tracking-tight">{inProgressWalk.walkRequest.dog.name}</h3>
                                <p className="text-white/60 font-bold text-xl uppercase tracking-widest text-sm">{inProgressWalk.walkRequest.zone}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/walk-assignments/${inProgressWalk.id}/in-progress`)}
                            className="w-full lg:w-auto bg-white text-indigo-600 px-14 py-7 rounded-[26px] font-black text-xl shadow-2xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-5"
                        >
                            Abrir Radar <span className="text-2xl">→</span>
                        </button>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Main Feed */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Oportunidades</h2>
                            </div>
                            <div className="flex gap-4">
                                <select
                                    name="size"
                                    value={filters.size}
                                    onChange={handleFilterChange}
                                    className="bg-[#1E293B] border border-white/10 text-white text-xs font-black px-6 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 cursor-pointer hover:bg-[#2D3B4E] transition-colors appearance-none pr-10"
                                >
                                    <option value="">Todos los tamaños</option>
                                    <option value="SMALL">Pequeños</option>
                                    <option value="MEDIUM">Medianos</option>
                                    <option value="LARGE">Grandes</option>
                                </select>
                            </div>
                        </div>

                        {availableRequests.length === 0 ? (
                            <div className="bg-[#1E293B] rounded-[48px] p-24 text-center border border-white/5 shadow-2xl space-y-8">
                                <div className="text-8xl grayscale opacity-10 animate-pulse">📡</div>
                                <div className="space-y-4">
                                    <p className="text-white font-black text-2xl">Buscando señales...</p>
                                    <p className="text-gray-500 font-bold max-w-md mx-auto leading-relaxed">No hay solicitudes en tu radio de {user.serviceRadiusKm || 5}km. Mantente alerta a las notificaciones.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8">
                                {availableRequests.map(request => (
                                    <Link key={request.id} to={`/walk-requests/${request.id}`} className="group bg-[#1E293B] rounded-[40px] p-10 border border-white/5 hover:border-emerald-500/40 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.2)] transition-all flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="bg-[#0F172A] w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl group-hover:bg-emerald-500/10 transition-colors">🐕</div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Fee Sugerido</p>
                                                <p className="text-3xl font-black text-white">S/ {request.suggestedPrice}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{request.dog.name}</h3>
                                                <p className="text-gray-500 font-bold">{request.zone}</p>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 border-t border-white/5 pt-6 uppercase tracking-widest">
                                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">🕒 {request.durationMinutes}m</span>
                                                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">📅 {new Date(request.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Tasks */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Agenda</h2>
                        </div>

                        <div className="space-y-6">
                            {pendingAssignments.filter(a => a.status === 'PENDING').length === 0 ? (
                                <div className="bg-[#1E293B]/40 rounded-[32px] p-10 border border-white/5 text-center space-y-3">
                                    <p className="text-4xl opacity-20">📅</p>
                                    <p className="text-gray-600 font-bold text-sm uppercase tracking-widest">Sin tareas pendientes</p>
                                </div>
                            ) : (
                                pendingAssignments.filter(a => a.status === 'PENDING').map(assignment => (
                                    <div key={assignment.id} className="bg-[#1E293B] rounded-[40px] p-8 border border-white/5 space-y-8 shadow-xl">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-[#0F172A] rounded-[24px] flex items-center justify-center text-3xl">🦴</div>
                                            <div>
                                                <h3 className="text-xl font-black text-white">{assignment.walkRequest.dog.name}</h3>
                                                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-1">{assignment.walkRequest.startTime}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {!assignment.walkerArrivedAt ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleArrived(assignment.id); }}
                                                    disabled={!isMobile}
                                                    className={`w-full py-5 rounded-[22px] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 ${isMobile ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                                >
                                                    📍 Marcar Llegada
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateAssignment(assignment.id, 'IN_PROGRESS'); }}
                                                    disabled={!isMobile}
                                                    className={`w-full py-5 rounded-[22px] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 ${isMobile ? 'bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:bg-emerald-400' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}`}
                                                >
                                                    🐕 Iniciar Paseo
                                                </button>
                                            )}
                                            {!isMobile && <p className="text-[10px] text-red-500/60 font-black text-center uppercase tracking-widest">Requiere Celular</p>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Verification Premium Notice */}
                        {user.verificationStatus !== 'VERIFIED' && (
                            <div className="bg-gradient-to-b from-amber-500/20 to-transparent border border-amber-500/20 rounded-[40px] p-10 space-y-6">
                                <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
                                <div className="space-y-2">
                                    <h4 className="text-amber-500 font-black text-2xl leading-tight tracking-tight">Terminal Bloqueada</h4>
                                    <p className="text-gray-400 font-bold text-sm leading-relaxed">Para enviar ofertas y empezar a ganar, primero debemos verificar tu DNI.</p>
                                </div>
                                <Link to="/verificar-paseador" className="block w-full bg-amber-500 text-white py-5 rounded-[22px] font-black text-center shadow-2xl shadow-amber-500/30 hover:bg-amber-400 active:scale-95 transition-all">
                                    Verificar Identidad
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalkerDashboard;
