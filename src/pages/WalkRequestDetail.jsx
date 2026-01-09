import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import Avatar from '../components/Avatar';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const libraries = ['places'];

const WalkRequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    // States
    const [offerData, setOfferData] = useState({ offeredPrice: '', message: '' });
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [favorites, setFavorites] = useState([]);
    const [blocked, setBlocked] = useState([]);
    const [photos, setPhotos] = useState([]);

    const handleCancelAssignment = async (reason) => {
        try {
            await api.put(`/walk-assignments/${request.assignment.id}/cancel`, { reason });
            alert("Paseo cancelado con éxito");
            loadRequest();
        } catch (error) {
            alert("Error al cancelar paseo");
        }
    };

    const handleMarkPaid = async () => {
        if (!confirm('¿Confirmas que ya entregaste el pago acordado al paseador?')) return;
        try {
            await api.put(`/walk-assignments/${request.assignment.id}/mark-paid`);
            alert("¡Pago registrado! Gracias por confiar en DogWalk.");
            loadRequest();
        } catch (error) {
            alert(error.response?.data?.error || "Error al registrar el pago");
        }
    };

    const handleUpdateAssignment = async (action, reason = '') => {
        try {
            let endpoint = `/walk-assignments/${request.assignment.id}/${action}`;
            let payload = {};

            if (action === 'cancel') {
                payload = { reason };
            }

            const response = await api.put(endpoint, payload);

            if (action === 'start') {
                navigate(`/walk-assignments/${request.assignment.id}/in-progress`);
                return;
            }

            loadRequest();
            alert(response.data.message || 'Acción realizada exitosamente');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar paseo');
        }
    };

    const loadPhotos = async (assignmentId) => {
        try {
            const res = await api.get(`/walk-assignments/${assignmentId}/photos`);
            setPhotos(res.data);
        } catch (error) {
            console.error('Error loading photos:', error);
        }
    };

    useEffect(() => {
        loadRequest();
        if (user.role === 'OWNER') {
            loadSocialStatus();
        }
    }, [id]);

    const loadRequest = async () => {
        try {
            const response = await api.get(`/walk-requests/${id}`);
            const data = response.data;
            setRequest(data);
            setOfferData({ offeredPrice: data.suggestedPrice, message: '' });

            if (data.assignment) {
                loadPhotos(data.assignment.id);
            }

            loadMessages();
        } catch (error) {
            console.error('Error loading request:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        try {
            const res = await api.get(`/messages/walk-request/${id}`);
            setMessages(res.data);
        } catch (error) {
            if (error.response?.status !== 403) console.error(error);
        }
    };

    const loadSocialStatus = async () => {
        try {
            const [favRes, blockRes] = await Promise.all([
                api.get('/social/favorites'),
                api.get('/social/blocked')
            ]);
            setFavorites(favRes.data.map(f => f.walker.id));
            setBlocked(blockRes.data.map(b => b.walker.id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/offers', { walkRequestId: id, ...offerData });
            loadRequest();
            alert('Oferta enviada exitosamente');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al crear oferta');
        }
    };

    const handleAcceptOffer = async (offerId) => {
        try {
            await api.put(`/offers/${offerId}/accept`);
            loadRequest();
            alert('Oferta aceptada exitosamente');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al aceptar oferta');
        }
    };

    const handleCreateReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews', { walkAssignmentId: request.assignment.id, ...reviewData });
            loadRequest();
            alert('Reseña creada exitosamente');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al crear reseña');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            let receiverId;
            if (user.role === 'OWNER') {
                if (request.assignment) receiverId = request.assignment.walkerId;
                else if (request.offers.length === 1) receiverId = request.offers[0].walkerId;
                else {
                    alert("Selecciona un walker para mensaje");
                    return;
                }
            } else {
                receiverId = request.ownerId;
            }

            await api.post('/messages', { walkRequestId: id, receiverId, content: newMessage });
            setNewMessage('');
            loadMessages();
        } catch (error) {
            alert('Error al enviar mensaje');
        }
    };

    const toggleFavorite = async (walkerId) => {
        const isFav = favorites.includes(walkerId);
        try {
            if (isFav) {
                await api.delete(`/social/favorites/${walkerId}`);
                setFavorites(favorites.filter(id => id !== walkerId));
            } else {
                await api.post(`/social/favorites/${walkerId}`);
                setFavorites([...favorites, walkerId]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleBlock = async (walkerId) => {
        const isBlocked = blocked.includes(walkerId);
        if (!isBlocked && !window.confirm("¿Bloquear walker? No podrá enviar ofertas.")) return;

        try {
            if (isBlocked) {
                await api.delete(`/social/blocked/${walkerId}`);
                setBlocked(blocked.filter(id => id !== walkerId));
            } else {
                await api.post(`/social/blocked/${walkerId}`);
                setBlocked([...blocked, walkerId]);
                setFavorites(favorites.filter(id => id !== walkerId));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="container mx-auto px-4 py-8">Cargando...</div>;
    if (!request) return <div className="container mx-auto px-4 py-8">Solicitud no encontrada</div>;

    const isOwner = user.role === 'OWNER' && request.ownerId === user.id;
    const isWalker = user.role === 'WALKER';
    const canChat = (isOwner || (isWalker && (request.offers.some(o => o.walkerId === user.id) || request.assignment?.walkerId === user.id)));

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:text-primary-700 font-bold">← Volver</button>

            <div className="card mb-6 overflow-hidden border-2 border-primary-50">
                <div className="flex justify-between items-start mb-6 p-2">
                    <h1 className="text-3xl font-black text-gray-800">Paseo para {request.dog.name}</h1>
                    <span className={`badge text-lg px-4 py-2 badge-${request.status.toLowerCase()}`}>{request.status}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4">
                        {request.dog.photoUrl ? (
                            <img src={getImageUrl(request.dog.photoUrl)} className="w-24 h-24 rounded-2xl object-cover shadow-sm" alt="Dog" />
                        ) : (
                            <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner">🐕</div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-xs font-black text-gray-400 uppercase mb-1">🐕 Información Perro</h3>
                            <p className="text-xl font-black text-gray-800 leading-none mb-1">{request.dog.name}</p>
                            <p className="text-sm font-bold text-primary-600 mb-2">{request.dog.breed || 'Sin raza'} • {request.dog.size}</p>
                            <div className="flex flex-wrap gap-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${request.dog.energyLevel === 'HIGH' ? 'bg-red-100 text-red-600' :
                                    request.dog.energyLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    Energía {request.dog.energyLevel}
                                </span>
                                {request.dog.reactiveWithDogs && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">Reactiv. Perros</span>}
                                {request.dog.needsMuzzle && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-600 text-white">Usa Bozal</span>}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-primary-50 p-6 rounded-3xl border border-primary-100">
                        <h3 className="text-xs font-black text-primary-400 uppercase mb-2">📢 Instrucciones de Manejo Críticas</h3>
                        <p className="text-sm text-primary-900 font-bold leading-relaxed italic">
                            "{request.dog.notesForWalker || "No hay notas específicas de manejo."}"
                        </p>
                        {request.dog.pullsLeash && <p className="text-[10px] font-black text-red-500 uppercase mt-2">⚠️ Recordatorio: Jala mucho la correa</p>}
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-3">📅 Cita y Pago</h3>
                        <p className="text-sm font-bold text-gray-700">{new Date(request.date).toLocaleDateString()} - {request.startTime}</p>
                        <p className="text-gray-500 text-sm">Previsto: {request.durationMinutes} min</p>
                        <p className="text-primary-700 font-black text-2xl mt-2">S/ {request.suggestedPrice}</p>
                    </div>

                    <div className="md:col-span-2 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-3">📍 Ubicación de Recojo</h3>
                        {request.addressType && (
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border mb-4 shadow-sm">
                                <span className="text-xl">🏠</span>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none">{request.addressType}</p>
                                    <p className="text-sm font-bold text-gray-800">{request.addressReference || 'Sin referencia'}</p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mb-4 bg-primary-50 inline-block px-3 py-1 rounded-full">{request.zone}</p>

                        {request.latitude && request.longitude && (
                            <div className="h-64 w-full rounded-3xl overflow-hidden border-4 border-white shadow-lg z-0 relative">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={{ lat: request.latitude, lng: request.longitude }}
                                        zoom={17}
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: false,
                                        }}
                                    >
                                        <Marker position={{ lat: request.latitude, lng: request.longitude }} />
                                    </GoogleMap>
                                ) : (
                                    <div className="h-full w-full bg-gray-200 animate-pulse flex items-center justify-center">
                                        Cargando mapa...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Photo Gallery */}
            {photos.length > 0 && (
                <div className="card mb-6">
                    <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                        📸 Fotos enviadas por el paseador
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {photos.map(p => (
                            <a key={p.id} href={getImageUrl(p.url)} target="_blank" rel="noreferrer" className="group">
                                <img
                                    src={getImageUrl(p.url)}
                                    className="w-full h-32 object-cover rounded-2xl shadow-sm group-hover:shadow-md transition-shadow"
                                    alt="Walk"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Messaging Section */}
            {canChat && (
                <div className="card mb-6 bg-blue-50/50 border-blue-100 border-2">
                    <h2 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2">
                        💬 Mensajes del Paseo
                    </h2>
                    <div className="max-h-60 overflow-y-auto mb-4 space-y-3 bg-white/60 p-4 rounded-3xl border border-blue-100 backdrop-blur-sm">
                        {messages.length === 0 ? (
                            <div className="text-center py-4">
                                <span className="text-4xl block mb-2 opacity-30">💬</span>
                                <p className="text-gray-400 text-sm">Sin mensajes aún. ¡Escríbele!</p>
                            </div>
                        ) : messages.map(msg => (
                            <div key={msg.id} className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white ml-auto rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-blue-50'}`}>
                                <p className={`text-[10px] font-black uppercase mb-1 ${msg.senderId === user.id ? 'text-blue-200' : 'text-primary-500'}`}>
                                    {msg.sender.firstName}
                                </p>
                                <p className="text-sm font-medium">{msg.content}</p>
                            </div>
                        ))}
                    </div>
                    {(request.assignment || (request.offers.length > 0)) && (
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                className="input-field flex-1 mb-0 bg-white border-2 border-blue-100 focus:border-blue-400 rounded-2xl px-6 py-3"
                                placeholder="Escribe un mensaje..."
                                required
                            />
                            <button type="submit" className="bg-blue-600 text-white px-6 rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all">Enviar</button>
                        </form>
                    )}
                </div>
            )}

            {/* Walker: Create Offer */}
            {isWalker && request.status === 'OPEN' && !request.offers.some(o => o.walkerId === user.id) && (
                <div className="card mb-6 overflow-hidden border-2 border-primary-100">
                    <h2 className="text-2xl font-black text-gray-800 mb-4">Hacer Oferta</h2>
                    {user.verificationStatus === 'VERIFIED' ? (
                        <form onSubmit={handleCreateOffer} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Precio (S/)</label>
                                    <input type="number" required className="input-field" value={offerData.offeredPrice} onChange={e => setOfferData({ ...offerData, offeredPrice: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Mensaje personal</label>
                                    <textarea className="input-field" rows="1" value={offerData.message} onChange={e => setOfferData({ ...offerData, message: e.target.value })} placeholder="Ej: Me encanta pasear por esta zona..." />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary-200 active:scale-95 transition-all">Enviar Mi Oferta</button>
                        </form>
                    ) : (
                        <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl text-center">
                            <span className="text-5xl mb-4 block">🆔</span>
                            <h3 className="text-blue-900 font-extrabold text-xl mb-3">Verificación de Identidad Requerida</h3>
                            <p className="text-blue-800 text-sm mb-6 max-w-sm mx-auto">
                                Para la seguridad de la comunidad, debes verificar tu DNI antes de postularte a paseos.
                            </p>
                            <button onClick={() => navigate('/verificar-paseador')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl active:scale-95">
                                Completar Verificación Ahora
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Owner: View Offers */}
            {isOwner && request.offers && request.offers.length > 0 && (
                <div className="card mb-6">
                    <h2 className="text-2xl font-black text-gray-800 mb-6">Ofertas Recibidas</h2>
                    <div className="space-y-4">
                        {request.offers.map(offer => (
                            <div key={offer.id} className={`group border-2 rounded-3xl p-6 transition-all hover:border-primary-200 ${blocked.includes(offer.walker.id) ? 'opacity-50 bg-gray-50' : 'bg-white shadow-sm'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="relative">
                                                <Avatar
                                                    src={offer.walker.profilePhotoUrl}
                                                    alt="profile"
                                                    size="14"
                                                    fallbackText={offer.walker.firstName}
                                                    className="border-2 border-white shadow-md rounded-2xl"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                                                {offer.walker.firstName} {offer.walker.lastName}
                                                {offer.walker.verificationStatus === 'VERIFIED' && <span className="text-blue-500" title="Identidad Verificada">🛡️</span>}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-yellow-500 font-black">★ {offer.walker.averageRating.toFixed(1)}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-500 font-medium truncate max-w-[200px]">{offer.walker.bio || "Paseador DogWalk"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleFavorite(offer.walker.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-gray-50 hover:bg-gray-100 ${favorites.includes(offer.walker.id) ? 'text-red-500' : 'text-gray-300'}`}>
                                            {favorites.includes(offer.walker.id) ? '❤️' : '🤍'}
                                        </button>
                                        <button onClick={() => toggleBlock(offer.walker.id)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                                            🚫
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-primary-700 font-black text-2xl leading-none">S/ {offer.offeredPrice}</p>
                                        <p className="text-gray-500 text-xs font-bold mt-1 uppercase italic">Total por el paseo</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {offer.status === 'PENDING' && request.status === 'OPEN' && !blocked.includes(offer.walker.id) && (
                                            <button onClick={() => handleAcceptOffer(offer.id)} className="bg-primary-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary-200 hover:scale-105 active:scale-95 transition-all">Aceptar</button>
                                        )}
                                        {offer.status !== 'PENDING' && <span className={`badge px-4 py-2 font-black badge-${offer.status.toLowerCase()}`}>{offer.status}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* WALKER: Assignment Status Page */}
            {isWalker && request.assignment && request.assignment.walkerId === user.id && request.assignment.status !== 'COMPLETED' && request.assignment.status !== 'CANCELLED' && (
                <div className="card mb-6 border-4 border-primary-200 bg-primary-50/30 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 animate-bounce">🚀</div>
                    <h2 className="text-2xl font-black text-primary-900 mb-4">Panel de Control: Tu Paseo</h2>
                    {request.assignment.status === 'PENDING' ? (
                        <div className="space-y-4">
                            <p className="font-bold text-primary-800">Has sido seleccionado. Dale a "Iniciar" cuando tengas al perro contigo.</p>
                            <div className="flex gap-4">
                                <button onClick={() => handleUpdateAssignment('start')} className="flex-1 bg-primary-600 text-white py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-primary-700 active:scale-95 transition-all">
                                    🚀 ¡INICIAR PASEO YA!
                                </button>
                                <button
                                    onClick={() => {
                                        const r = prompt("Motivo de cancelación (Obligatorio):");
                                        if (r) handleUpdateAssignment('cancel', r);
                                    }}
                                    className="text-red-500 font-black text-sm hover:underline"
                                >
                                    No puedo ir
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-primary-800 font-extrabold flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                </span>
                                El paseo está actualmente en progreso
                            </p>
                            <button
                                onClick={() => navigate(`/walk-assignments/${request.assignment.id}/in-progress`)}
                                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all"
                            >
                                📱 Ver Dashboard en Vivo
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* OWNER: View Final Report */}
            {isOwner && request.assignment && request.assignment.status === 'COMPLETED' && (
                <div className="space-y-6">
                    <div className="card bg-green-50 border-2 border-green-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 scale-150 rotate-12">✅</div>
                        <h2 className="text-2xl font-black text-green-900 mb-6 flex items-center gap-2">
                            🏁 Resumen Final del Paseo
                        </h2>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-6 bg-green-50/50 rounded-3xl border border-green-100">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Duración</p>
                                <p className="text-xl font-black text-gray-800">{request.assignment.actualDurationMinutes}m</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Comportamiento</p>
                                <p className="text-xl font-black text-green-600">{request.assignment.behaviorRating || 'NORMAL'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Pipí</p>
                                <p className="text-2xl">{request.assignment.didPee ? '💧' : '❌'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Popó</p>
                                <p className="text-2xl">{request.assignment.didPoop ? '💩' : '❌'}</p>
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="mt-6 bg-white p-6 rounded-[35px] shadow-xl border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                                💳 Estado del Pago
                            </h3>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <p className="text-3xl font-black text-gray-800 leading-none mb-1">S/ {request.assignment.agreedPrice.toFixed(2)}</p>
                                    <p className="text-xs font-bold text-primary-600">Método: {request.assignment.paymentMethod}</p>
                                </div>
                                <div className="text-center md:text-right">
                                    {request.assignment.paymentStatus === 'PAID' ? (
                                        <div className="flex flex-col items-center md:items-end">
                                            <span className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-black text-xs mb-1">PAGADO ✅</span>
                                            {request.assignment.paidAt && <p className="text-[10px] text-gray-400 font-bold">Fecha: {new Date(request.assignment.paidAt).toLocaleString()}</p>}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <span className="bg-orange-100 text-orange-700 px-6 py-2 rounded-full font-black text-xs inline-block">PENDIENTE ⌛</span>
                                            {isOwner && (
                                                <button
                                                    onClick={handleMarkPaid}
                                                    className="bg-primary-600 text-white px-6 py-2 rounded-2xl font-black text-xs hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                                                >
                                                    Confirmar Pago
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {user.role === 'WALKER' && (
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Comisión Plataforma (15%)</p>
                                    <p className="font-black text-red-500">- S/ {request.assignment.platformFeeAmount.toFixed(2)}</p>
                                </div>
                            )}
                        </div>

                        {request.assignment.reportNotes && (
                            <div className="mt-6 p-6 bg-white rounded-3xl border border-green-100 shadow-sm relative italic text-gray-700">
                                <span className="absolute top-2 left-2 text-4xl text-green-100 font-serif leading-none">“</span>
                                <p className="relative pl-4">{request.assignment.reportNotes}</p>
                            </div>
                        )}

                        {request.assignment.earlyEndReason && (
                            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                <p className="text-xs font-black text-orange-700 uppercase mb-1">⚠️ Término Anticipado</p>
                                <p className="text-sm text-orange-800 font-medium">{request.assignment.earlyEndReason}</p>
                            </div>
                        )}
                    </div>

                    {!request.assignment.review && (
                        <div className="card border-2 border-yellow-100 shadow-2xl">
                            <h2 className="text-2xl font-black text-gray-800 mb-6">Valora el servicio</h2>
                            <form onSubmit={handleCreateReview} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-3">Tu calificación</label>
                                    <div className="flex gap-2">
                                        {[5, 4, 3, 2, 1].reverse().map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setReviewData({ ...reviewData, rating: num })}
                                                className={`flex-1 py-4 text-2xl rounded-2xl transition-all ${reviewData.rating >= num ? 'bg-yellow-100 text-yellow-600 scale-105 shadow-md' : 'bg-gray-50 text-gray-300'}`}
                                            >
                                                ⭐
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="input-field bg-gray-50 border-none rounded-2xl p-6"
                                    rows="4"
                                    placeholder="¿Qué tal estuvo el paseo? Tu opinión nos ayuda a todos."
                                    value={reviewData.comment}
                                    onChange={e => setReviewData({ ...reviewData, comment: e.target.value })}
                                />
                                <button type="submit" className="w-full bg-gray-800 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-black transition-all active:scale-95">
                                    Enviar Mi Reseña
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* BOTH: Cancelled view */}
            {request.assignment && request.assignment.status === 'CANCELLED' && (
                <div className="card bg-red-50 border-2 border-red-200 shadow-lg p-8 rounded-[40px] text-center">
                    <span className="text-6xl mb-4 block">🚫</span>
                    <h2 className="text-3xl font-black text-red-900 mb-2">Paseo Cancelado</h2>
                    <p className="text-red-800 font-bold mb-6 italic">"Motivo: {request.assignment.cancelReason || 'Sin motivo especificado'}"</p>
                    <div className="text-xs text-red-500 font-black uppercase tracking-widest mb-6">
                        Cancelado por: {request.assignment.cancelledBy || 'Sistema'}
                    </div>

                    {isOwner && request.assignment.cancelledBy === 'WALKER' && (
                        <div className="mt-4 p-6 bg-white rounded-3xl border border-red-100 shadow-inner">
                            <p className="text-gray-700 font-bold mb-4">¿Deseas publicar esta solicitud nuevamente para encontrar otro paseador?</p>
                            <button
                                onClick={() => navigate('/walk-requests/new', { state: { originalRequest: request } })}
                                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-primary-700 active:scale-95 transition-all"
                            >
                                🔄 Publicar Solicitud Nuevamente
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Owner: Assignment Management */}
            {isOwner && request.assignment && request.assignment.status !== 'COMPLETED' && request.assignment.status !== 'CANCELLED' && (
                <div className="card mb-6 border-l-8 border-yellow-400 bg-yellow-50/20 shadow-lg">
                    <h2 className="text-xl font-black text-gray-800 mb-2 leading-none">Estado de la Asignación</h2>
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                                {request.assignment.status === 'PENDING'
                                    ? '⏳ El paseador ya confirmó la asignación y está en camino al punto de encuentro.'
                                    : '🚀 El paseo ha iniciado. ¡Tu perro está en buenas manos!'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const r = prompt("Motivo de cancelación (Obligatorio para cancelar un paseo asignado):");
                                if (r) handleUpdateAssignment('cancel', r);
                            }}
                            className="bg-white text-red-600 border-2 border-red-100 px-6 py-3 rounded-2xl hover:bg-red-50 text-sm font-black transition-all shadow-sm active:scale-95"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkRequestDetail;
