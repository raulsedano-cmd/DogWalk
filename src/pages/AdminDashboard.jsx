import { useState, useEffect } from 'react';
import api, { getImageUrl } from '../services/api';

const AdminDashboard = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVerifications();
    }, []);

    const loadVerifications = async () => {
        try {
            const res = await api.get('/admin/verifications');
            setVerifications(res.data);
        } catch (error) {
            console.error(error);
            alert('Error cargando verificaciones. ¿Tienes permisos?');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId) => {
        if (!confirm('¿Aprobar y verificar a este paseador?')) return;
        try {
            await api.put(`/admin/verify/${userId}`);
            alert('Paseador aprobado');
            loadVerifications();
        } catch (error) {
            alert('Error al verificar');
        }
    };

    const handleReject = async (userId) => {
        const reason = window.prompt('Indica el motivo del rechazo (se le enviará una notificación al paseador):');
        if (reason === null) return; // Cancelado por usuario
        if (!reason.trim()) {
            return alert('Debes indicar un motivo para rechazar.');
        }

        if (!confirm('¿Seguro que deseas rechazar esta solicitud?')) return;

        try {
            await api.put(`/admin/reject/${userId}`, { reason });
            alert('Solicitud rechazada y usuario notificado.');
            loadVerifications();
        } catch (error) {
            console.error(error);
            alert('Error al rechazar solicitud.');
        }
    };

    const [selectedImage, setSelectedImage] = useState(null);

    if (loading) return <div className="p-8">Cargando admin...</div>;

    const openImage = (url) => {
        setSelectedImage(getImageUrl(url));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-black mb-8 text-gray-800">🕵️ Admin Dashboard - Verificaciones</h1>

            <div className="grid gap-6">
                {verifications.length === 0 ? (
                    <p>No hay verificaciones pendientes.</p>
                ) : (
                    verifications.map(v => (
                        <div key={v.id} className="card border-2 border-gray-100 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <h3 className="font-bold text-xl">{v.firstName} {v.lastName}</h3>
                                <p className="text-sm text-gray-500 mb-2">{v.email}</p>
                                <p className="font-mono bg-yellow-50 inline-block px-2 py-1 rounded text-sm mb-4">
                                    DNI: {v.dniNumber}
                                </p>
                                <p className="text-xs text-gray-400">Registrado: {new Date(v.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="text-center cursor-pointer" onClick={() => openImage(v.dniFrontPhotoUrl)}>
                                    <p className="text-xs font-bold mb-1">Frente</p>
                                    <img src={getImageUrl(v.dniFrontPhotoUrl)} className="w-32 h-20 object-cover rounded-lg border hover:scale-105 transition-transform" />
                                </div>
                                <div className="text-center cursor-pointer" onClick={() => openImage(v.dniBackPhotoUrl)}>
                                    <p className="text-xs font-bold mb-1">Dorso</p>
                                    <img src={getImageUrl(v.dniBackPhotoUrl)} className="w-32 h-20 object-cover rounded-lg border hover:scale-105 transition-transform" />
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-2">
                                <button onClick={() => handleVerify(v.id)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700">
                                    ✅ Aprobar
                                </button>
                                <button onClick={() => handleReject(v.id)} className="bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-200">
                                    🚫 Rechazar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex justify-center">
                        <img
                            src={selectedImage}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            alt="Document Full"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className="absolute -top-12 right-0 text-white text-4xl font-bold hover:text-gray-300"
                            onClick={() => setSelectedImage(null)}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
