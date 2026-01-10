import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';

const OwnerDashboard = () => {
    const { user } = useAuth();
    const [walkRequests, setWalkRequests] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [requestsRes, favRes] = await Promise.all([
                api.get('/walk-requests'),
                api.get('/social/favorites')
            ]);
            setWalkRequests(requestsRes.data.requests || []);
            setFavorites(favRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) return;
        try {
            await api.delete(`/walk-requests/${id}`);
            loadData();
        } catch (error) {
            alert('Error al eliminar solicitud');
        }
    };

    const openRequests = walkRequests.filter(r => r.status === 'OPEN');
    const assignedRequests = walkRequests.filter(r => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
    const completedRequests = walkRequests.filter(r => r.status === 'COMPLETED');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black tracking-widest text-[9px] uppercase">Sincronizando Perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFEFE] pb-24 font-['Inter'] selection:bg-primary-50">
            {/* Header Section - Refined Scales */}
            <div className="bg-white border-b border-slate-100 pb-16 pt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-600"></span>
                                </span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Actividad</span>
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-black text-navy-900 tracking-tighter leading-[0.8] italic">
                                Hola, <span className="text-primary-600">{user?.firstName || 'Dueño'}</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">Cuidando a tus mascotas</p>
                        </div>

                        <div className="flex gap-4 w-full lg:w-auto">
                            <Link to="/walk-requests/new" className="btn-primary flex-1 lg:flex-none">
                                + Pedir Paseo
                            </Link>
                            <Link to="/dogs" className="btn-outline flex-1 lg:flex-none">
                                🐕 Mis Perros
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -translate-y-8">
                {/* Stats Grid - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {[
                        { label: 'Paseando', val: assignedRequests.length, color: 'text-indigo-600', bg: 'bg-indigo-500/5' },
                        { label: 'Esperando', val: openRequests.length, color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
                        { label: 'Favoritos', val: favorites.length, color: 'text-primary-600', bg: 'bg-primary-500/5' },
                        { label: 'Anteriores', val: completedRequests.length, color: 'text-navy-900', bg: 'bg-navy-900/5' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:border-primary-100 transition-all flex items-center justify-between">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                                <p className={`text-3xl font-black ${s.color} tracking-tighter italic`}>{s.val}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-[12px] ${s.bg} flex items-center justify-center text-sm`}>📊</div>
                        </div>
                    ))}
                </div>

                {/* Priority Section */}
                {assignedRequests.length > 0 && (
                    <section className="mb-20 animate-fadeIn">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-2 h-8 bg-primary-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-navy-900 tracking-tight uppercase">Paseos en curso</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedRequests.map(request => (
                                <Link key={request.id} to={`/walk-requests/${request.id}`} className="group card-premium !p-8 hover:border-primary-600/20 transition-all relative overflow-hidden flex flex-col justify-between">
                                    {request.status === 'IN_PROGRESS' && (
                                        <div className="absolute top-0 right-0 p-6">
                                            <span className="bg-navy-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse border border-primary-600/10">🛰️ EN VIVO</span>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-3xl shadow-inner">🐕</div>
                                            <div>
                                                <h3 className="text-xl font-black text-navy-900 group-hover:text-primary-600 transition-colors tracking-tighter mb-1">{request.dog.name}</h3>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{request.zone}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-[18px] p-5 grid grid-cols-2 gap-4 border border-slate-100">
                                            <div className="space-y-0.5">
                                                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Fecha</p>
                                                <p className="text-navy-900 font-bold text-[11px]">{new Date(request.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                            <div className="space-y-0.5 border-l border-slate-200 pl-4">
                                                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Hora</p>
                                                <p className="text-navy-900 font-bold text-[11px] font-mono">{request.startTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-primary-600">
                                        <span>Seguir paseo</span>
                                        <span className="w-8 h-8 rounded-[12px] bg-slate-50 flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-all text-slate-400 text-sm">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Marketplace Flow */}
                <section className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-2xl font-black text-navy-900 uppercase">Mis Solicitudes</h2>
                    </div>

                    {openRequests.length === 0 ? (
                        <div className="card-premium !p-16 text-center bg-slate-50/20 border-dashed border-2">
                            <div className="text-6xl mb-6 grayscale opacity-10">🛡️</div>
                            <h3 className="text-lg font-black text-navy-900 mb-2">Sin misiones activas.</h3>
                            <Link to="/walk-requests/new" className="text-[9px] font-black text-primary-600 uppercase tracking-[0.3em] hover:text-navy-900 transition-colors">Iniciar nueva misión →</Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {openRequests.map(request => (
                                <div key={request.id} className="card-premium !p-8 hover:shadow-lg transition-all border border-slate-100 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-navy-900 tracking-tighter mb-1">{request.dog.name}</h3>
                                            <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{request.zone}</p>
                                        </div>
                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Online</span>
                                    </div>
                                    <div className="border-t border-slate-100 py-6 mb-6 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <div>
                                            <p className="mb-1 opacity-60">Presupuesto</p>
                                            <p className="text-primary-600 text-xl italic tracking-tighter">S/ {request.suggestedPrice}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="mb-1 opacity-60">Ofertas</p>
                                            <p className="text-navy-900 text-xl tracking-tighter">{request.offers?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link to={`/walk-requests/${request.id}`} className="flex-1 btn-navy !py-3 !text-[10px] !rounded-[12px]">Candidatos</Link>
                                        <Link to={`/walk-requests/${request.id}/edit`} className="w-12 h-12 bg-slate-50 text-navy-900 rounded-[12px] hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center text-sm shadow-inner italic">Edit</Link>
                                    </div>
                                    <button onClick={() => handleDelete(request.id)} className="w-full text-center text-red-500/30 font-black text-[8px] uppercase tracking-[0.4em] mt-4 hover:text-red-600 transition-colors">Eliminar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Trusted Circuit */}
                {favorites.length > 0 && (
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-2 h-8 bg-primary-600 rounded-full"></div>
                            <h2 className="text-2xl font-black text-navy-900 uppercase italic">Favoritos</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 no-scrollbar">
                            {favorites.map(fav => (
                                <Link key={fav.id} to={`/profile/${fav.walker.id}`} className="min-w-[280px] card-premium !p-6 flex items-center gap-5 hover:-translate-y-1 transition-all group">
                                    <div className="relative">
                                        <img src={getImageUrl(fav.walker.profilePhotoUrl)} alt="P" className="w-16 h-16 rounded-[18px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform" />
                                        <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-xl border-2 border-white">⭐</div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-navy-900 leading-tight uppercase italic">{fav.walker.firstName}</h3>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{fav.walker.baseZone || 'Base Lima'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;
