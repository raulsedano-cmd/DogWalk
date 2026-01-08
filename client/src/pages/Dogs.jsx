import { useState, useEffect } from 'react';
import api, { getImageUrl } from '../services/api';

const Dogs = () => {
    const [dogs, setDogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDog, setEditingDog] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        size: 'MEDIUM',
        breed: '',
        behavior: '',
        age: '',
        energyLevel: 'MEDIUM',
        reactiveWithDogs: false,
        reactiveWithPeople: false,
        needsMuzzle: false,
        pullsLeash: false,
        notesForWalker: '',
        specialNotes: '',
    });

    useEffect(() => {
        loadDogs();
    }, []);

    const loadDogs = async () => {
        try {
            const response = await api.get('/dogs');
            setDogs(response.data);
        } catch (error) {
            console.error('Error loading dogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDog) {
                await api.put(`/dogs/${editingDog.id}`, formData);
            } else {
                await api.post('/dogs', formData);
            }
            setShowModal(false);
            setEditingDog(null);
            resetForm();
            loadDogs();
        } catch (error) {
            alert('Error al guardar perro');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            size: 'MEDIUM',
            breed: '',
            behavior: '',
            age: '',
            energyLevel: 'MEDIUM',
            reactiveWithDogs: false,
            reactiveWithPeople: false,
            needsMuzzle: false,
            pullsLeash: false,
            notesForWalker: '',
            specialNotes: '',
        });
    };

    const handlePhotoUpload = async (dogId, file) => {
        if (!file) return;
        setUploading(true);
        console.log(`[DEBUG] Iniciando subida de foto para perro: ${dogId}`, file);

        const uploadData = new FormData();
        uploadData.append('photo', file);

        try {
            const response = await api.post(`/dogs/${dogId}/photo`, uploadData);
            console.log('[DEBUG] Respuesta exitosa:', response.data);
            loadDogs();
            alert('¡Foto actualizada con éxito!');
        } catch (error) {
            console.error('[DEBUG] Error al subir foto:', error);
            console.error('[DEBUG] Detalle Error:', error.response?.data);
            alert(`Error al subir foto: ${error.response?.data?.error || error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este perro? Entenderemos que ya no forma parte de la familia DogWalk.')) return;

        try {
            await api.delete(`/dogs/${id}`);
            loadDogs();
        } catch (error) {
            alert('Error al eliminar perro');
        }
    };

    const openModal = (dog = null) => {
        if (dog) {
            setEditingDog(dog);
            setFormData({
                name: dog.name,
                size: dog.size,
                breed: dog.breed || '',
                behavior: dog.behavior || '',
                age: dog.age || '',
                energyLevel: dog.energyLevel || 'MEDIUM',
                reactiveWithDogs: dog.reactiveWithDogs || false,
                reactiveWithPeople: dog.reactiveWithPeople || false,
                needsMuzzle: dog.needsMuzzle || false,
                pullsLeash: dog.pullsLeash || false,
                notesForWalker: dog.notesForWalker || '',
                specialNotes: dog.specialNotes || '',
            });
        } else {
            setEditingDog(null);
            resetForm();
        }
        setShowModal(true);
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8 text-center font-black animate-pulse">Cargando la manada... 🐕</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-gray-800 tracking-tight mb-2">Mis Perros</h1>
                    <p className="text-gray-500 font-medium">Gestiona los perfiles de tus mejores amigos para paseos seguros.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-primary-600 text-white px-8 py-4 rounded-3xl font-black text-lg shadow-xl shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2"
                >
                    <span className="text-2xl leading-none">+</span> Registrar Nuevo Perro
                </button>
            </div>

            {dogs.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[50px] py-20 text-center">
                    <span className="text-8xl mb-6 block">🦴</span>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Tu lista está vacía</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Agrega a tu perro para que los paseadores puedan conocerlo y postularse.</p>
                    <button onClick={() => openModal()} className="bg-white border-2 border-primary-100 text-primary-600 px-10 py-4 rounded-2xl font-black hover:bg-primary-50 transition-all">
                        ¡Comenzar ahora!
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {dogs.map(dog => (
                        <div key={dog.id} className="bg-white rounded-[40px] shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div className="relative h-56 bg-gray-100">
                                {dog.photoUrl ? (
                                    <img
                                        src={getImageUrl(dog.photoUrl)}
                                        alt={dog.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <span className="text-6xl">🐕</span>
                                        <p className="text-xs font-black uppercase mt-2">Sin foto</p>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-4 py-2 rounded-2xl font-black text-xs shadow-lg ${dog.size === 'LARGE' ? 'bg-orange-600 text-white' :
                                        dog.size === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                        }`}>
                                        {dog.size === 'SMALL' ? 'Pequeño' : dog.size === 'MEDIUM' ? 'Mediano' : 'Grande'}
                                    </span>
                                </div>
                                <label className="absolute bottom-4 right-4 cursor-pointer bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50 hover:bg-white transition-all active:scale-95">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(dog.id, e.target.files[0])}
                                    />
                                    <span className="text-xl">📸</span>
                                </label>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-800 leading-none mb-1">{dog.name}</h3>
                                        <p className="text-primary-600 font-bold text-sm">{dog.breed || 'Raza no especificada'} • {dog.age || '?'} años</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energía</p>
                                        <p className={`font-black ${dog.energyLevel === 'HIGH' ? 'text-red-500' :
                                            dog.energyLevel === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'
                                            }`}>
                                            {dog.energyLevel === 'HIGH' ? 'Alta' : dog.energyLevel === 'MEDIUM' ? 'Media' : 'Baja'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex flex-wrap gap-2">
                                        {dog.reactiveWithDogs && <span className="px-3 py-1 bg-red-50 text-red-600 rounded-xl text-xs font-black border border-red-100 italic">Reactivo 🐕</span>}
                                        {dog.reactiveWithPeople && <span className="px-3 py-1 bg-red-50 text-red-600 rounded-xl text-xs font-black border border-red-100 italic">Reactivo 👤</span>}
                                        {dog.needsMuzzle && <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-xl text-xs font-black border border-orange-100 italic">Bozal 🎭</span>}
                                        {dog.pullsLeash && <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-xs font-black border border-blue-100 italic">Jala correa ⛓️</span>}
                                    </div>

                                    {dog.notesForWalker && (
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Notas para el paseo:</p>
                                            <p className="text-xs text-gray-600 font-medium italic">"{dog.notesForWalker}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => openModal(dog)}
                                        className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        Editar Perfil
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dog.id)}
                                        className="px-4 py-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-all"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-gray-800">
                                    {editingDog ? 'Editar Amigo' : 'Nuevo Integrante'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Nombre del Perro</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ej: Max"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Raza</label>
                                        <input
                                            type="text"
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.breed}
                                            onChange={e => setFormData({ ...formData, breed: e.target.value })}
                                            placeholder="Ej: Golden Retriever"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Tamaño</label>
                                        <select
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.size}
                                            onChange={e => setFormData({ ...formData, size: e.target.value })}
                                        >
                                            <option value="SMALL">Pequeño (Up to 10kg)</option>
                                            <option value="MEDIUM">Mediano (10-25kg)</option>
                                            <option value="LARGE">Grande (+25kg)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Edad (Años)</label>
                                        <input
                                            type="number"
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="Ej: 3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Nivel de Energía</label>
                                        <select
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.energyLevel}
                                            onChange={e => setFormData({ ...formData, energyLevel: e.target.value })}
                                        >
                                            <option value="LOW">Bajo - Muy tranquilo</option>
                                            <option value="MEDIUM">Medio - Normal</option>
                                            <option value="HIGH">Alto - Muy activo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Comportamiento General</label>
                                        <input
                                            type="text"
                                            className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                            value={formData.behavior}
                                            onChange={e => setFormData({ ...formData, behavior: e.target.value })}
                                            placeholder="Ej: Sociable, miedoso..."
                                        />
                                    </div>
                                </div>

                                <div className="bg-primary-50/50 p-6 rounded-[30px] border border-primary-100">
                                    <h4 className="text-sm font-black text-primary-900 mb-4 flex items-center gap-2">
                                        🛡️ Manejo en el Paseo <span className="text-[10px] text-primary-500 font-bold">(Selecciona los que apliquen)</span>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-primary-300 text-primary-600 focus:ring-primary-400"
                                                checked={formData.reactiveWithDogs}
                                                onChange={e => setFormData({ ...formData, reactiveWithDogs: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">Reactivo con perros</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-primary-300 text-primary-600 focus:ring-primary-400"
                                                checked={formData.reactiveWithPeople}
                                                onChange={e => setFormData({ ...formData, reactiveWithPeople: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">Reactivo con personas</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-primary-300 text-primary-600 focus:ring-primary-400"
                                                checked={formData.needsMuzzle}
                                                onChange={e => setFormData({ ...formData, needsMuzzle: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">Requiere bozal</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-2 border-primary-300 text-primary-600 focus:ring-primary-400"
                                                checked={formData.pullsLeash}
                                                onChange={e => setFormData({ ...formData, pullsLeash: e.target.checked })}
                                            />
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-primary-600 transition-colors">Jala mucho la correa</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-2">Notas Críticas para el Paseador</label>
                                    <textarea
                                        className="input-field bg-gray-50 border-transparent focus:border-primary-400"
                                        rows="3"
                                        value={formData.notesForWalker}
                                        onChange={e => setFormData({ ...formData, notesForWalker: e.target.value })}
                                        placeholder="Ej: No soltar correa nunca, se asusta con motos, avisar 5 min antes de llegar..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-[2] bg-primary-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-primary-100 hover:bg-primary-700 active:scale-95 transition-all">
                                        {editingDog ? 'Guardar Cambios' : 'Registrar Amigo'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-3xl font-black text-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dogs;
