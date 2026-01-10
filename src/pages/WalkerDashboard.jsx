import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const WalkerDashboard = () => {
    const { user, setUser } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState({ totalWalks: 0, rating: 5, earnings: 0 });
    const [loading, setLoading] = useState(true);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [assignRes, statsRes] = await Promise.all([
                api.get('/walk-assignments/my-missions'),
                api.get('/walk-assignments/stats')
            ]);
            setAssignments(assignRes.data || []);
            setStats(statsRes.data || { totalWalks: 0, rating: 5, earnings: 0 });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async () => {
        setAvailabilityLoading(true);
        try {
            const response = await api.put('/users/availability', { isAvailable: !user.isAvailable });
            setUser({ ...user, isAvailable: response.data.isAvailable });
        } catch (error) {
            console.error('Error toggling availability');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            // STATUS TRANSITIONS AS DEFINED IN BACKEND
            if (status === 'ARRIVED') {
                await api.put(`/walk-assignments/${id}/arrived`);
            } else if (status === 'IN_PROGRESS') {
                await api.put(`/walk-assignments/${id}/start`);
            }
            loadData();
            alert('Estado actualizado correctamente');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar estado');
        }
    };

    const activeMissions = assignments.filter(a => ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(a.status));

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-navy-900">
            <div className="w-10 h-10 border-4 border-white/5 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFEFE] pb-24 font-['Inter']">
            {/* Mission Control Header */}
            <div className="bg-navy-900 pb-20 pt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${user.isAvailable ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-slate-600'} animate-pulse`}></div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Walker Terminal • {user.isAvailable ? 'En Línea' : 'Desconectado'}</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.8] tracking-tighter italic">
                                Ready for <span className="text-primary-600">Duty.</span>
                            </h1>
                            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.4em] max-w-xs">{user.isAvailable ? 'Sincronizando señal GPS con la red central' : 'Terminal en espera de activación'}</p>
                        </div>

                        <button
                            onClick={toggleAvailability}
                            disabled={availabilityLoading}
                            className={`h-16 px-10 rounded-[16px] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl ${user.isAvailable
                                ? 'bg-slate-700 text-white hover:bg-slate-800'
                                : 'bg-primary-600 text-white hover:bg-black shadow-primary-500/20'
                                }`}
                        >
                            {availabilityLoading ? 'Sincronizando...' : (user.isAvailable ? 'Finalizar Turno' : 'Iniciar Turno 🔥')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -translate-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    {[
                        { label: 'Rating', val: stats.rating.toFixed(1), icon: '⭐', color: 'text-amber-500' },
                        { label: 'Paseos', val: stats.totalWalks, icon: '🐕', color: 'text-primary-600' },
                        { label: 'Ingresos', val: `S/ ${stats.earnings}`, icon: '💰', color: 'text-emerald-500' },
                        { label: 'Historial', val: assignments.length, icon: '📋', color: 'text-navy-900' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-primary-100 transition-all">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                                <p className={`text-2xl font-black ${s.color} tracking-tighter`}>{s.val}</p>
                            </div>
                            <div className="text-xl group-hover:scale-110 transition-transform">{s.icon}</div>
                        </div>
                    ))}
                </div>

                {/* Tactical Missions Container */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-2xl font-black text-navy-900 uppercase">Misiones Activas</h2>
                    </div>

                    {activeMissions.length === 0 ? (
                        <div className="card-premium !p-16 text-center bg-slate-50/20 border-dashed border-2">
                            <h3 className="text-lg font-black text-navy-900 mb-2">Sin misiones asignadas.</h3>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em]">Permanece en línea para recibir solicitudes.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {activeMissions.map(m => (
                                <div key={m.id} className="bg-navy-900 rounded-[28px] p-8 border border-white/5 flex flex-col justify-between group hover:border-primary-500/20 transition-all backdrop-blur-3xl shadow-2xl">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-white/5 rounded-[18px] flex items-center justify-center text-3xl">🐕</div>
                                            <div>
                                                <h3 className="text-xl font-black text-white tracking-tighter leading-none mb-1">{m.walkRequest.dog.name}</h3>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.walkRequest.zone}</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary-600/10 text-primary-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-primary-500/10">S/ {m.walkRequest.suggestedPrice}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-white/5 p-4 rounded-[16px]">
                                            <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Duración</p>
                                            <p className="text-white font-bold text-xs">{m.walkRequest.durationMinutes} Min</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-[16px]">
                                            <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Hora inicio</p>
                                            <p className="text-white font-bold text-xs">{m.walkRequest.startTime}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {m.status === 'ASSIGNED' && (
                                            <button onClick={() => handleUpdateStatus(m.id, 'ARRIVED')} className="w-full btn-primary !h-12 !text-[11px] !rounded-[14px]">He llegado 📍</button>
                                        )}
                                        {m.status === 'ARRIVED' && (
                                            <button onClick={() => handleUpdateStatus(m.id, 'IN_PROGRESS')} className="w-full btn-primary !bg-emerald-600 hover:!bg-emerald-700 !h-12 !text-[11px] !rounded-[14px]">Iniciar Misión 🐕</button>
                                        )}
                                        {m.status === 'IN_PROGRESS' && (
                                            <Link to={`/walk-assignments/${m.id}/in-progress`} className="w-full btn-primary !bg-indigo-600 hover:!bg-indigo-700 !h-12 !text-[11px] !rounded-[14px] animate-pulse">Consola en Vivo 🛰️</Link>
                                        )}
                                        <Link to={`/walk-requests/${m.walkRequestId}`} className="block text-center text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] py-2 hover:text-white transition-colors">Ver Detalles</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default WalkerDashboard;
