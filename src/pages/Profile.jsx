import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import LocationPicker from '../components/LocationPicker';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        city: '',
        zone: '',
        bio: '',
        role: '',
        // Enhanced Walker Fields
        profilePhotoUrl: '',
        baseCity: '',
        baseZone: '',
        serviceRadiusKm: 5,
        experienceText: '',
        maxDogsAtOnce: 1,
        acceptsSmall: true,
        acceptsMedium: true,
        acceptsLarge: true,
        isAvailable: true,
        latitude: null,
        longitude: null,
        addressType: 'Casa',
        addressReference: '',
        profilePhoto: null,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                city: user.city,
                zone: user.zone,
                bio: user.bio || '',
                // Walker specifics (defaults if null)
                profilePhotoUrl: user.profilePhotoUrl || '',
                baseCity: user.baseCity || user.city || '',
                baseZone: user.baseZone || user.zone || '',
                serviceRadiusKm: user.serviceRadiusKm || 5,
                experienceText: user.experienceText || '',
                maxDogsAtOnce: user.maxDogsAtOnce || 1,
                acceptsSmall: user.acceptsSmall ?? true,
                acceptsMedium: user.acceptsMedium ?? true,
                acceptsLarge: user.acceptsLarge ?? true,
                isAvailable: user.isAvailable ?? true,
                latitude: user.latitude || null,
                longitude: user.longitude || null,
                addressType: user.addressType || 'Casa',
                addressReference: user.addressReference || '',
            });

            if (user.roles.includes('WALKER')) {
                loadReviews();
            }
        }
    }, [user]);

    const loadReviews = async () => {
        try {
            const response = await api.get(`/reviews/walker/${user.id}`);
            setReviews(response.data.reviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            // Append all fields to FormData
            Object.keys(formData).forEach(key => {
                if (key === 'profilePhoto' && formData[key]) {
                    data.append('profilePic', formData[key]);
                } else if (key !== 'role' && formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            const response = await api.put('/users/me', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Perfil actualizado exitosamente');

            // Update context
            if (response.data.user) {
                updateUser(response.data.user);
            }

            setEditing(false);
        } catch (error) {
            console.error('Update profile error:', error);
            alert('Error al actualizar perfil');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl mt-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Mi Perfil</h1>

            <div className="card mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Información Personal</h2>
                    <button
                        onClick={() => setEditing(!editing)}
                        className="btn-secondary"
                    >
                        {editing ? 'Cancelar' : 'Editar'}
                    </button>
                </div>

                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <img
                            src={(!user.profilePhotoUrl || imgError)
                                ? `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=CBD5E0&color=fff&size=200`
                                : getImageUrl(user.profilePhotoUrl)
                            }
                            onError={() => setImgError(true)}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-200"
                        />
                        {user.isVerifiedWalker && (
                            <span className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-sm" title="Paseador Verificado">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                        )}
                    </div>
                    {user.averageRating > 0 && (
                        <div className="mt-2 flex items-center">
                            <span className="text-yellow-500 mr-1">⭐</span>
                            <span className="font-semibold">{user.averageRating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" className="input-field" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                <input type="text" className="input-field" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center">
                                    Modo Actual
                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{user.activeRole}</span>
                                </label>
                                <div className="input-field bg-gray-50 text-gray-500 flex items-center">
                                    {user.roles.join(' & ')}
                                </div>
                            </div>
                        </div>

                        {/* Location Fields for Everyone */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Distrito (Residencia)</label>
                                <select
                                    className="input-field"
                                    value={formData.zone}
                                    onChange={e => setFormData({ ...formData, zone: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {[
                                        'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Cercado de Lima', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo',
                                        'Callao', 'Bellavista', 'Carmen de La Legua', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'
                                    ].sort().map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                                <select
                                    className="input-field"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                >
                                    <option value="Lima">Lima</option>
                                    <option value="Callao">Callao</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end -mt-2 mb-2">
                            <Link to="/owner/saved-addresses" className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                                <span className="text-lg">📍</span> Gestionar mis direcciones guardadas y favoritas
                            </Link>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                            <textarea className="input-field" rows="3" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                        </div>

                        {/* Walker Specific Fields */}
                        {user.roles.includes('WALKER') && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-semibold mb-3">Perfil de Paseador</h3>

                                <div className="space-y-4">
                                    <div className="bg-primary-50 p-4 rounded-lg">
                                        <label className="block text-sm font-semibold text-primary-900 mb-2">📸 Foto de Perfil</label>
                                        <input
                                            type="file"
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                            accept="image/*"
                                            onChange={e => setFormData({ ...formData, profilePhoto: e.target.files[0] })}
                                        />
                                        <p className="mt-1 text-xs text-gray-500 italic">Sube una foto clara de tu cara para generar confianza.</p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} className="h-4 w-4 text-primary-600 rounded" />
                                        <label htmlFor="isAvailable" className="font-medium">Disponible para paseos</label>
                                    </div>

                                    <LocationPicker
                                        label="Ubicación Base (Punto Central)"
                                        lat={formData.latitude}
                                        lng={formData.longitude}
                                        onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                        onAddressChange={(city, zone, country) => {
                                            const finalZone = zone || city || '';
                                            setFormData(prev => ({
                                                ...prev,
                                                baseCity: city || prev.baseCity,
                                                baseZone: finalZone,
                                                city: city || prev.city,
                                                zone: finalZone
                                            }));
                                        }}
                                    />

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vivienda</label>
                                            <select
                                                className="input-field"
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Cómo llegar</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={formData.addressReference}
                                                onChange={e => setFormData({ ...formData, addressReference: e.target.value })}
                                                placeholder="Ej: Portón verde, frente al parque"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Radio de Servicio (Km)</label>
                                            <input type="number" className="input-field" value={formData.serviceRadiusKm} onChange={e => setFormData({ ...formData, serviceRadiusKm: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Perros a la vez</label>
                                            <input type="number" className="input-field" value={formData.maxDogsAtOnce} onChange={e => setFormData({ ...formData, maxDogsAtOnce: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia / Certificaciones</label>
                                        <textarea className="input-field" rows="3" value={formData.experienceText} onChange={e => setFormData({ ...formData, experienceText: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tamaños Aceptados</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={formData.acceptsSmall} onChange={e => setFormData({ ...formData, acceptsSmall: e.target.checked })} className="rounded text-primary-600" />
                                                <span>Pequeños</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={formData.acceptsMedium} onChange={e => setFormData({ ...formData, acceptsMedium: e.target.checked })} className="rounded text-primary-600" />
                                                <span>Medianos</span>
                                            </label>
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={formData.acceptsLarge} onChange={e => setFormData({ ...formData, acceptsLarge: e.target.checked })} className="rounded text-primary-600" />
                                                <span>Grandes</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-primary w-full">
                            Guardar Cambios
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                            <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Teléfono:</strong> {user.phone}</p>
                            <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
                            <p><strong>Modo Actual:</strong> {user.activeRole === 'OWNER' ? 'Dueño' : 'Paseador'}</p>
                            <p><strong>Ubicación:</strong> {[user.zone, user.city, 'Perú'].filter(Boolean).join(', ')}</p>
                        </div>

                        {user.bio && (
                            <div className="mt-2">
                                <strong>Biografía:</strong>
                                <p className="text-gray-600">{user.bio}</p>
                            </div>
                        )}

                        {user.roles.includes('WALKER') && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-semibold mb-2">Perfil Profesional</h3>
                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <p><strong>Estado:</strong> {user.isAvailable ? <span className="text-green-600">Disponible ✅</span> : <span className="text-red-500">No disponible ❌</span>}</p>
                                    <p><strong>Verificado:</strong> {user.isVerifiedWalker ? 'Sí ✅' : 'No ❌'}</p>
                                    <p><strong>Tipo de Vivienda:</strong> {user.addressType}</p>
                                    <p><strong>Referencia:</strong> {user.addressReference || 'N/A'}</p>
                                    <p><strong>Radio de Servicio:</strong> {user.serviceRadiusKm}km</p>
                                    <p><strong>Máx Perros:</strong> {user.maxDogsAtOnce}</p>
                                    <div className="col-span-2">
                                        <strong>Tamaños aceptados:</strong>
                                        <div className="flex gap-2 mt-1">
                                            {user.acceptsSmall && <span className="badge badge-blue">Pequeños</span>}
                                            {user.acceptsMedium && <span className="badge badge-blue">Medianos</span>}
                                            {user.acceptsLarge && <span className="badge badge-blue">Grandes</span>}
                                        </div>
                                    </div>
                                    {user.experienceText && (
                                        <div className="col-span-2 mt-2">
                                            <strong>Experiencia:</strong>
                                            <p className="text-gray-600">{user.experienceText}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {user.roles.includes('WALKER') && reviews.length > 0 && (
                <div className="card">
                    <h2 className="text-2xl font-semibold mb-4">Reseñas Recibidas ({user.averageRating?.toFixed(1)} ⭐)</h2>
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-semibold">
                                            {review.author.firstName} {review.author.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-lg text-yellow-500">{'⭐'.repeat(review.rating)}</p>
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
