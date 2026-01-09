import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';

const OwnerDashboard = () => {
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
            setWalkRequests(requestsRes.data.requests);
            setFavorites(favRes.data);
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
            alert('Solicitud eliminada');
            loadData();
        } catch (error) {
            alert('Error al eliminar solicitud');
        }
    };

    const openRequests = walkRequests.filter(r => r.status === 'OPEN');
    const assignedRequests = walkRequests.filter(r => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
    const completedRequests = walkRequests.filter(r => r.status === 'COMPLETED');

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Cargando...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800">Mis Solicitudes de Paseo</h1>
                <div className="flex w-full sm:w-auto gap-2 flex-wrap">
                    <Link to="/owner/saved-addresses" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg flex-1 sm:flex-none text-center py-2.5 px-3 text-xs sm:text-sm font-medium transition-colors">
                        📍 Mis Direcciones
                    </Link>
                    <Link to="/dogs" className="btn-secondary flex-1 sm:flex-none text-center py-2.5 px-3 text-xs sm:text-sm">
                        Gestionar Perros
                    </Link>
                    <Link to="/walk-requests/new" className="btn-primary flex-1 sm:flex-none text-center py-2.5 px-3 text-xs sm:text-sm whitespace-nowrap">
                        + Nueva Solicitud
                    </Link>
                </div>
            </div>

            {/* Favorite Walkers */}
            {favorites.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Mis Paseadores Favoritos ❤️</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {favorites.map(fav => (
                            <Link key={fav.id} to={`/profile/${fav.walker.id}`} className="card min-w-[250px] flex items-center gap-3 hover:shadow-md transition-all">
                                <img
                                    src={getImageUrl(fav.walker.profilePhotoUrl)}
                                    alt="profile"
                                    className="w-14 h-14 rounded-full object-cover border-2 border-primary-100"
                                />
                                <div>
                                    <h3 className="font-semibold">{fav.walker.firstName} {fav.walker.lastName}</h3>
                                    <p className="text-sm text-gray-500">⭐ {fav.walker.averageRating.toFixed(1)}</p>
                                    <p className="text-xs text-gray-400">{fav.walker.baseCity}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Open Requests */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Solicitudes Abiertas</h2>
                {openRequests.length === 0 ? (
                    <p className="text-gray-600">No tienes solicitudes abiertas</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {openRequests.map(request => (
                            <div key={request.id} className="card hover:shadow-md transition-shadow relative">
                                <Link to={`/walk-requests/${request.id}`} className="absolute inset-0 z-0"></Link>
                                <div className="relative z-10 pointer-events-none">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{request.dog.name}</h3>
                                        <span className="badge badge-open">{request.status}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2">{request.zone}</p>
                                    <p className="text-gray-600 text-sm mb-2">
                                        {new Date(request.date).toLocaleDateString()} - {request.startTime}
                                    </p>
                                    <p className="text-gray-600 text-sm">{request.durationMinutes} min</p>
                                    <p className="text-primary-600 font-semibold mt-2">S/ {request.suggestedPrice}</p>
                                    <p className="text-sm text-gray-500 mt-2">{request.offers?.length || 0} ofertas</p>
                                </div>
                                <div className="mt-4 flex flex-col gap-2 relative z-20">
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/walk-requests/${request.id}/edit`}
                                            className="btn-secondary text-xs py-1.5 flex-1 text-center"
                                        >
                                            ✏️ Editar
                                        </Link>
                                        <Link
                                            to={`/walk-requests/${request.id}`}
                                            className="btn-primary text-xs py-1.5 flex-1 text-center"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(request.id)}
                                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-xs py-1.5 rounded-lg font-semibold transition-colors border border-red-200"
                                    >
                                        🗑️ Eliminar Solicitud
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Assigned Requests */}
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Paseos Asignados</h2>
                {assignedRequests.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500">No tienes paseos próximos.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedRequests.map(request => (
                            <Link key={request.id} to={`/walk-requests/${request.id}`} className="card hover:shadow-md transition-shadow border-l-4 border-l-primary-500">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{request.dog.name}</h3>
                                    <span className="badge badge-assigned">{request.status}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{request.zone}</p>
                                <p className="text-gray-600 text-sm">
                                    📅 {new Date(request.date).toLocaleDateString()} 🕒 {request.startTime}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Requests */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">Paseos Completados</h2>
                {completedRequests.length === 0 ? (
                    <p className="text-gray-600">No tienes paseos completados</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedRequests.map(request => (
                            <Link key={request.id} to={`/walk-requests/${request.id}`} className="card hover:shadow-md transition-shadow opacity-75">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{request.dog.name}</h3>
                                    <span className="badge badge-completed">{request.status}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2">{request.zone}</p>
                                <p className="text-gray-600 text-sm">
                                    {new Date(request.date).toLocaleDateString()}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default OwnerDashboard;
