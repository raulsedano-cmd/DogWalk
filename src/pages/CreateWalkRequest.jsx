import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const CreateWalkRequest = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [dogs, setDogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialRequest = location.state?.originalRequest;

    const [formData, setFormData] = useState({
        dogId: initialRequest?.dogId || '',
        date: initialRequest?.date ? new Date(initialRequest.date).toISOString().split('T')[0] : '',
        startTime: initialRequest?.startTime || '',
        durationMinutes: initialRequest?.durationMinutes?.toString() || '30',
        zone: initialRequest?.zone || '',
        suggestedPrice: initialRequest?.suggestedPrice?.toString() || '',
        details: initialRequest?.details || '',
        latitude: initialRequest?.latitude || null,
        longitude: initialRequest?.longitude || null,
        country: initialRequest?.country || '',
        city: initialRequest?.city || '',
        addressType: initialRequest?.addressType || 'Casa',
        addressReference: initialRequest?.addressReference || '',
    });

    useEffect(() => {
        loadDogs();
    }, []);

    const loadDogs = async () => {
        try {
            const response = await api.get('/dogs');
            setDogs(response.data);

            // If we have an initial request, try to find that dog, otherwise use first
            if (response.data.length > 0) {
                const foundDog = response.data.find(d => d.id === initialRequest?.dogId);
                if (foundDog) {
                    setFormData(prev => ({ ...prev, dogId: foundDog.id }));
                } else if (!formData.dogId) {
                    setFormData(prev => ({ ...prev, dogId: response.data[0].id }));
                }
            }
        } catch (error) {
            console.error('Error loading dogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.latitude || !formData.longitude) {
            alert('Por favor selecciona la ubicación exacta en el mapa');
            return;
        }

        try {
            await api.post('/walk-requests', formData);
            alert('Solicitud creada exitosamente');
            navigate('/owner/dashboard');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al crear solicitud');
        }
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Cargando...</div>;
    }

    if (dogs.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="card text-center">
                    <h2 className="text-2xl font-bold mb-4">No tienes perros registrados</h2>
                    <p className="text-gray-600 mb-4">
                        Necesitas registrar al menos un perro antes de crear una solicitud de paseo
                    </p>
                    <button
                        onClick={() => navigate('/dogs')}
                        className="btn-primary"
                    >
                        Ir a Mis Perros
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-2 text-center">Nueva Solicitud de Paseo</h1>
            {initialRequest && (
                <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                    <span className="text-2xl">🔄</span>
                    <p className="text-blue-800 text-sm font-medium">
                        Hemos rellenado los datos con la información de tu paseo anterior para que sea más rápido.
                    </p>
                </div>
            )}

            <div className="card shadow-xl border-0 bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dog Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            1. Selecciona tu Perro
                        </label>
                        <select
                            required
                            className="input-field bg-white"
                            value={formData.dogId}
                            onChange={e => setFormData({ ...formData, dogId: e.target.value })}
                        >
                            {dogs.map(dog => (
                                <option key={dog.id} value={dog.id}>
                                    {dog.name} ({dog.size})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Schedule */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            2. Fecha y Duración
                        </label>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1 ml-1">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    className="input-field bg-white"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 ml-1">Hora Inicio</label>
                                <input
                                    type="time"
                                    required
                                    className="input-field bg-white"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-gray-500 mb-1 ml-1">Duración del Paseo</label>
                            <select
                                className="input-field bg-white"
                                value={formData.durationMinutes}
                                onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                            >
                                <option value="30">30 minutos</option>
                                <option value="45">45 minutos</option>
                                <option value="60">60 minutos</option>
                                <option value="90">90 minutos</option>
                                <option value="120">2 horas</option>
                            </select>
                        </div>
                    </div>

                    {/* Precise Location */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            3. Ubicación Exacta de Recogida
                        </label>

                        <LocationPicker
                            label="Punto en el Mapa"
                            lat={formData.latitude}
                            lng={formData.longitude}
                            onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                            onAddressChange={(city, zone, country) => {
                                // Fallback: If zone is not found, use city or a generic value to avoid validation block
                                const finalZone = zone || city || '';
                                setFormData(prev => ({
                                    ...prev,
                                    city: city || prev.city,
                                    zone: finalZone,
                                    country: country || prev.country
                                }));
                            }}
                        />

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 ml-1">Tipo de Vivienda</label>
                                <select
                                    className="input-field bg-white"
                                    value={formData.addressType}
                                    onChange={e => setFormData({ ...formData, addressType: e.target.value })}
                                >
                                    <option value="Casa">Casa</option>
                                    <option value="Departamento">Departamento</option>
                                    <option value="Manzana/Lote">Manzana / Lote</option>
                                    <option value="Condominio">Condominio</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 ml-1">Referencia / Cómo llegar</label>
                                <input
                                    type="text"
                                    className="input-field bg-white"
                                    value={formData.addressReference}
                                    onChange={e => setFormData({ ...formData, addressReference: e.target.value })}
                                    placeholder="Ej: Portón verde, frente al parque"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs text-gray-500 mb-1 ml-1">Distrito / Zona (Confirmar)</label>
                            <input
                                type="text"
                                required
                                className="input-field bg-white"
                                value={formData.zone}
                                onChange={e => setFormData({ ...formData, zone: e.target.value })}
                                placeholder="Ej: Miraflores"
                            />
                        </div>
                    </div>

                    {/* Price & Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            4. Precio y Comentarios
                        </label>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 ml-1">Precio Sugerido (S/)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="input-field bg-white"
                                value={formData.suggestedPrice}
                                onChange={e => setFormData({ ...formData, suggestedPrice: e.target.value })}
                                placeholder="Ej: 30"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-gray-500 mb-1 ml-1">Notas para el Paseador</label>
                            <textarea
                                className="input-field bg-white"
                                rows="3"
                                value={formData.details}
                                onChange={e => setFormData({ ...formData, details: e.target.value })}
                                placeholder="Escribe aquí si tu perro tiene necesidades especiales, miedos o juguetes favoritos..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button type="submit" className="btn-primary py-3 text-lg flex-1 order-1 sm:order-2">
                            Publicar Solicitud
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/dashboard')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors flex-1 order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWalkRequest;
