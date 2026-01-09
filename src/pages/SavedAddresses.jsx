import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const SavedAddresses = () => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        zone: '',
        latitude: '',
        longitude: '',
        addressType: '',
        addressReference: '',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const response = await api.get('/saved-addresses');
            setAddresses(response.data);
        } catch (error) {
            console.error('Error al cargar direcciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await api.put(`/saved-addresses/${editingAddress.id}`, formData);
            } else {
                await api.post('/saved-addresses', formData);
            }
            fetchAddresses();
            resetForm();
        } catch (error) {
            console.error('Error al guardar dirección:', error);
            alert(error.response?.data?.error || 'Error al guardar dirección');
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setFormData({
            name: address.name,
            address: address.address,
            city: address.city,
            zone: address.zone,
            latitude: address.latitude.toString(),
            longitude: address.longitude.toString(),
            addressType: address.addressType || '',
            addressReference: address.addressReference || '',
            isDefault: address.isDefault
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
        try {
            await api.delete(`/saved-addresses/${id}`);
            fetchAddresses();
        } catch (error) {
            console.error('Error al eliminar dirección:', error);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.patch(`/saved-addresses/${id}/set-default`);
            fetchAddresses();
        } catch (error) {
            console.error('Error al establecer dirección predeterminada:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            city: '',
            zone: '',
            latitude: '',
            longitude: '',
            addressType: '',
            addressReference: '',
            isDefault: false
        });
        setEditingAddress(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="text-center py-8">Cargando direcciones...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Mis Direcciones Guardadas</h2>
                {addresses.length < 5 && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {showForm ? 'Cancelar' : '+ Nueva Dirección'}
                    </button>
                )}
            </div>

            {addresses.length >= 5 && !showForm && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    ⚠️ Has alcanzado el límite de 5 direcciones guardadas
                </div>
            )}

            {showForm && (
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Nombre de la dirección *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Casa, Trabajo, Parque favorito"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-3">
                                    Ubicación Exacta *
                                </label>
                                <LocationPicker
                                    label="Buscar dirección o seleccionar en el mapa"
                                    lat={formData.latitude ? parseFloat(formData.latitude) : null}
                                    lng={formData.longitude ? parseFloat(formData.longitude) : null}
                                    onChange={(lat, lng) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            latitude: lat,
                                            longitude: lng
                                        }));
                                    }}
                                    onAddressChange={(city, zone, country, fullAddress) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            city: city || prev.city,
                                            zone: zone || city || prev.zone,
                                            country: country || 'Peru',
                                            address: fullAddress || prev.address
                                        }));
                                    }}
                                />
                                {(!formData.latitude || !formData.longitude) && (
                                    <p className="text-red-500 text-xs mt-1">
                                        Debes seleccionar una ubicación en el mapa
                                    </p>
                                )}
                            </div>

                            {/* Hidden fields for validation if needed, though state handles it */}

                            {/* Address details that might need manual correction or confirmation */}
                            <div className="md:col-span-2 mt-4">
                                <label className="block text-sm font-medium mb-1">
                                    Dirección (Autocompletado) *
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                    readOnly // User should use logic picker, but okay to edit? Let's make it editable
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Zona
                                </label>
                                <input
                                    type="text"
                                    name="zone"
                                    value={formData.zone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                    Referencia adicional
                                </label>
                                <textarea
                                    name="addressReference"
                                    value={formData.addressReference}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Edificio azul, tercer piso"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows="2"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={formData.isDefault}
                                        onChange={handleInputChange}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Usar como dirección predeterminada</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                            >
                                {editingAddress ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className={`bg-white shadow-md rounded-lg p-4 border-2 ${address.isDefault ? 'border-blue-500' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{address.name}</h3>
                            {address.isDefault && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                    Predeterminada
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 mb-1">{address.address}</p>
                        <p className="text-sm text-gray-500 mb-3">
                            {address.zone}, {address.city}
                        </p>

                        {address.addressReference && (
                            <p className="text-xs text-gray-500 mb-3 italic">
                                📍 {address.addressReference}
                            </p>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => handleEdit(address)}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Editar
                            </button>
                            {!address.isDefault && (
                                <button
                                    onClick={() => handleSetDefault(address.id)}
                                    className="text-sm text-green-600 hover:underline"
                                >
                                    Predeterminar
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(address.id)}
                                className="text-sm text-red-600 hover:underline"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {addresses.length === 0 && !showForm && (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No tienes direcciones guardadas</p>
                    <p className="text-sm">Agrega tu primera dirección para crear solicitudes más rápido</p>
                </div>
            )}
        </div>
    );
};

export default SavedAddresses;
