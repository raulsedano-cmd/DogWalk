import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const EditWalkRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dogs, setDogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        dogId: '',
        date: '',
        startTime: '',
        durationMinutes: '30',
        zone: '',
        suggestedPrice: '',
        details: '',
        latitude: null,
        longitude: null,
        country: '',
        city: '',
        addressType: 'Casa',
        addressReference: '',
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [dogsRes, requestRes] = await Promise.all([
                api.get('/dogs'),
                api.get(`/walk-requests/${id}`)
            ]);

            setDogs(dogsRes.data);

            const req = requestRes.data;
            if (req.status !== 'OPEN') {
                alert('Solo puedes editar solicitudes que aún estén abiertas.');
                navigate('/owner/dashboard');
                return;
            }

            setFormData({
                dogId: req.dogId,
                date: req.date.split('T')[0],
                startTime: req.startTime,
                durationMinutes: req.durationMinutes.toString(),
                zone: req.zone,
                suggestedPrice: req.suggestedPrice.toString(),
                details: req.details || '',
                latitude: req.latitude,
                longitude: req.longitude,
                country: req.country || '',
                city: req.city || '',
                addressType: req.addressType || 'Casa',
                addressReference: req.addressReference || '',
            });
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error al cargar la solicitud');
            navigate('/owner/dashboard');
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
            await api.put(`/walk-requests/${id}`, formData);
            alert('Solicitud actualizada exitosamente');
            navigate('/owner/dashboard');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar solicitud');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta solicitud de forma permanente?')) return;
        try {
            await api.delete(`/walk-requests/${id}`);
            alert('Solicitud eliminada exitosamente');
            navigate('/owner/dashboard');
        } catch (error) {
            alert('Error al eliminar solicitud');
        }
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Cargando...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Editar Solicitud de Paseo</h1>

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
                            3. Modificar Ubicación de Recogida
                        </label>

                        <LocationPicker
                            label="Mueve el marcador si es necesario"
                            lat={formData.latitude}
                            lng={formData.longitude}
                            onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                            onAddressChange={(city, zone, country) => {
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
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-gray-500 mb-1 ml-1">Notas para el Paseador</label>
                            <textarea
                                className="input-field bg-white"
                                rows="3"
                                value={formData.details}
                                onChange={e => setFormData({ ...formData, details: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="submit" className="btn-primary py-3 text-lg flex-1 order-1 sm:order-2">
                                Guardar Cambios
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/owner/dashboard')}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors flex-1 order-2 sm:order-1"
                            >
                                Cancelar
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="w-full bg-red-100 text-red-700 hover:bg-red-200 font-bold py-3 px-6 rounded-lg transition-colors mt-2"
                        >
                            🗑️ Eliminar Solicitud Permanentemente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditWalkRequest;
