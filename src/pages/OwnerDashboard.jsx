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
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black tracking-widest text-[10px] uppercase">Preparando tu Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFEFE] pb-32">
            {/* Premium Header/Hero Section */}
            <div className="bg-white border-b border-gray-100 pb-20 pt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">Panel de Propietario</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[0.9]">
                                Hola, <span className="text-primary-600">{user?.firstName || 'Dueño'}</span> 👋
                            </h1>
                            <p className="text-gray-400 font-bold text-xl max-w-xl leading-relaxed">Gestiona los paseos y seguridad de tus mejores amigos desde un solo lugar.</p>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                            <Link to="/walk-requests/new" className="flex-1 lg:flex-none bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-[24px] font-black shadow-[10px_20px_40px_rgba(0,0,0,0.15)] transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group">
                                <span className="text-2xl group-hover:rotate-90 transition-transform">+</span> Nueva Solicitud
                            </Link>
                            <Link to="/dogs" className="flex-1 lg:flex-none bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-[24px] font-black transition-all active:scale-95 flex items-center justify-center gap-3 text-lg">
                                🐕 Mis Perros
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -translate-y-12">
                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {[
                        { label: 'Activos', val: assignedRequests.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Abiertos', val: openRequests.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Favoritos', val: favorites.length, color: 'text-red-500', bg: 'bg-red-50' },
                        { label: 'Total Historial', val: completedRequests.length, color: 'text-gray-900', bg: 'bg-gray-50' }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-8 rounded-[36px] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all group">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{s.label}</p>
                            <div className="flex items-center gap-4">
                                <p className={`text-4xl font-black ${s.color} tracking-tighter`}>{s.val}</p>
                                <div className={`w-10 h-1 h-3 rounded-full ${s.bg}`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Priority: Live Tracking or Upcoming Walks */}
                {assignedRequests.length > 0 && (
                    <section className="mb-20 animate-fadeIn">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-2 h-10 bg-primary-600 rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]"></div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Atención Prioritaria</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {assignedRequests.map(request => (
                                <Link key={request.id} to={`/walk-requests/${request.id}`} className="group bg-white rounded-[40px] p-10 shadow-[0_15px_45px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-primary-200 transition-all relative overflow-hidden flex flex-col justify-between">
                                    {request.status === 'IN_PROGRESS' && (
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border-4 border-indigo-50 shadow-lg">
                                                🛰️ GPS En Vivo
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-primary-50 rounded-[28px] flex items-center justify-center text-4xl group-hover:rotate-6 transition-transform shadow-inner">🐕</div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight">{request.dog.name}</h3>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{request.zone}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#F8FAFC] rounded-[24px] p-6 grid grid-cols-2 gap-4 font-black text-xs text-gray-500 border border-gray-50">
                                            <div className="space-y-1">
                                                <p className="text-[9px] uppercase tracking-widest opacity-50">Fecha</p>
                                                <p className="text-gray-900">{new Date(request.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                            <div className="space-y-1 border-l border-gray-200 pl-4">
                                                <p className="text-[9px] uppercase tracking-widest opacity-50">Salida</p>
                                                <p className="text-gray-900 font-black">{request.startTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">Gestionar Paseo</span>
                                        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all text-gray-400">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Open Requests Feed */}
                <section className="mb-20">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Solicitudes Abiertas</h2>
                        </div>
                        {openRequests.length > 0 && <span className="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest">{openRequests.length} Publicadas</span>}
                    </div>

                    {openRequests.length === 0 ? (
                        <div className="bg-white rounded-[50px] p-24 text-center border border-gray-100 shadow-[0_10px_60px_-15px_rgba(0,0,0,0.03)] group">
                            <div className="text-8xl mb-8 grayscale opacity-10 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700">📋</div>
                            <div className="space-y-4 max-w-md mx-auto">
                                <h3 className="text-2xl font-black text-gray-900">¿Listo para un paseo?</h3>
                                <p className="text-gray-400 font-bold leading-relaxed mb-8">No tienes solicitudes activas buscando paseador en este momento.</p>
                                <Link to="/walk-requests/new" className="inline-block bg-primary-600 text-white px-12 py-5 rounded-[22px] font-black hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all active:scale-95">
                                    Publicar Paseo Ahora
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {openRequests.map(request => (
                                <div key={request.id} className="bg-white rounded-[40px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:shadow-2xl transition-all">
                                    <div>
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{request.dog.name}</h3>
                                                <p className="text-xs font-black text-gray-400 tracking-widest uppercase mt-1">{request.zone}</p>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                Abierta
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-[#F8FAFC] p-5 rounded-[24px] border border-gray-50">
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Fee</p>
                                                <p className="text-xl font-black text-primary-600">S/ {request.suggestedPrice}</p>
                                            </div>
                                            <div className="bg-[#F8FAFC] p-5 rounded-[24px] border border-gray-50">
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Candidatos</p>
                                                <p className="text-xl font-black text-gray-900">{request.offers?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <Link to={`/walk-requests/${request.id}`} className="flex-1 bg-gray-900 hover:bg-black text-white py-4 rounded-[18px] font-black text-center text-sm shadow-xl transition-all active:scale-95">
                                                Ver Ofertas
                                            </Link>
                                            <Link to={`/walk-requests/${request.id}/edit`} className="p-4 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center">
                                                ✏️
                                            </Link>
                                        </div>
                                        <button onClick={() => handleDelete(request.id)} className="w-full text-center text-red-500/50 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors py-2">
                                            Eliminar Solicitud
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Trusted Walkers Section */}
                {favorites.length > 0 && (
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-2 h-10 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tus Paseadores</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-10 -mx-6 px-6 no-scrollbar">
                            {favorites.map(fav => (
                                <Link key={fav.id} to={`/profile/${fav.walker.id}`} className="min-w-[320px] bg-white rounded-[40px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-6 hover:shadow-2xl hover:-translate-y-2 transition-all group">
                                    <div className="relative">
                                        <img
                                            src={getImageUrl(fav.walker.profilePhotoUrl)}
                                            alt="profile"
                                            className="w-20 h-20 rounded-[28px] object-cover border-4 border-white shadow-lg group-hover:scale-110 transition-transform"
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg border-4 border-white">❤️</div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-gray-900 leading-none">{fav.walker.firstName}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 text-sm">⭐</span>
                                            <span className="text-xs font-black text-gray-700">{fav.walker.averageRating.toFixed(1)}</span>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-1">• {fav.walker.baseZone || 'Lima'}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* History Memories */}
                {completedRequests.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-2 h-10 bg-gray-200 rounded-full"></div>
                            <h2 className="text-3xl font-black text-gray-400 tracking-tight">Historial de Confianza</h2>
                        </div>
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {completedRequests.slice(0, 4).map(request => (
                                <Link key={request.id} to={`/walk-requests/${request.id}`} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 opacity-60 hover:opacity-100 hover:shadow-xl transition-all flex flex-col items-center text-center gap-4 group">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🦴</div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight">{request.dog.name}</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                            {new Date(request.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </p>
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
