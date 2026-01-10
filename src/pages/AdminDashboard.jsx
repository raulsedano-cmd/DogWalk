import { useState, useEffect } from 'react';
import api, { getImageUrl } from '../services/api';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('verifications');

    // Data States
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [historyVerifications, setHistoryVerifications] = useState([]);
    const [walkers, setWalkers] = useState([]);
    const [tickets, setTickets] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Initial Load
    useEffect(() => {
        loadPendingVerifications();
    }, []);

    // Loaders
    const loadPendingVerifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/verifications');
            setPendingVerifications(res.data);
        } catch (e) {
            console.error(e);
            alert('Error cargando verificaciones');
        } finally { setLoading(false); }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/history');
            setHistoryVerifications(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadWalkers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/walkers');
            setWalkers(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/tickets');
            setTickets(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Tab Switch Handler
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'verifications') loadPendingVerifications(); // Refresh Pending
        if (tab === 'history') loadHistory();
        if (tab === 'walkers') loadWalkers();
        if (tab === 'support') loadTickets();
    };

    // Actions
    const handleVerify = async (userId) => {
        if (!confirm('¿Aprobar y verificar a este paseador?')) return;
        try {
            await api.put(`/admin/verify/${userId}`);
            alert('Paseador aprobado');
            loadPendingVerifications();
        } catch (error) { alert('Error al verificar'); }
    };

    const handleReject = async (userId) => {
        const reason = window.prompt('Indica el motivo del rechazo:');
        if (reason === null) return;
        if (!reason.trim()) return alert('Debes indicar un motivo');

        if (!confirm('¿Rechazar solicitud?')) return;
        try {
            await api.put(`/admin/reject/${userId}`, { reason });
            alert('Solicitud rechazada');
            loadPendingVerifications();
        } catch (error) { alert('Error al rechazar'); }
    };

    const handleCloseTicket = async (ticketId) => {
        if (!confirm('¿Marcar ticket como RESUELTO?')) return;
        try {
            await api.put(`/admin/tickets/${ticketId}`, { status: 'CLOSED' });
            loadTickets();
        } catch (error) { alert('Error al cerrar ticket'); }
    };

    const openImage = (url) => setSelectedImage(getImageUrl(url));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="container mx-auto px-4">
                    <div className="flex space-x-8">
                        <TabButton
                            active={activeTab === 'verifications'}
                            onClick={() => handleTabChange('verifications')}
                            label="Verificaciones"
                            count={pendingVerifications.length}
                        />
                        <TabButton
                            active={activeTab === 'history'}
                            onClick={() => handleTabChange('history')}
                            label="Historial"
                        />
                        <TabButton
                            active={activeTab === 'walkers'}
                            onClick={() => handleTabChange('walkers')}
                            label="Paseadores"
                        />
                        <TabButton
                            active={activeTab === 'support'}
                            onClick={() => handleTabChange('support')}
                            label="Reclamos"
                        />
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                {activeTab === 'verifications' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Solicitudes Pendientes</h2>
                        {loading ? <p>Cargando...</p> : (
                            <div className="grid gap-6">
                                {pendingVerifications.length === 0 ? <p className="text-gray-500">No hay verificaciones pendientes.</p> :
                                    pendingVerifications.map(v => (
                                        <VerificationCard
                                            key={v.id}
                                            data={v}
                                            onVerify={handleVerify}
                                            onReject={handleReject}
                                            onImageClick={openImage}
                                        />
                                    ))
                                }
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Historial de Verificaciones</h2>
                        {loading ? <p>Cargando...</p> : (
                            <div className="bg-white rounded-xl shadow overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {historyVerifications.map(h => (
                                            <tr key={h.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">{h.firstName} {h.lastName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{h.dniNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${h.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {h.verificationStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(h.updatedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'walkers' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Directorio de Paseadores</h2>
                        <div className="overflow-x-auto bg-white rounded-xl shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paseador</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciudad</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {walkers.map(w => (
                                        <tr key={w.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{w.firstName} {w.lastName}</div>
                                                <div className="text-sm text-gray-500">
                                                    {w.isVerifiedWalker ? '✅ Verificado' : '❌ No Verificado'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>{w.email}</div>
                                                <div>{w.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{w.city}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">⭐ {w.averageRating.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Reclamos y Soporte</h2>
                        <div className="space-y-4">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className={`bg-white p-6 rounded-xl shadow border-l-4 ${ticket.status === 'CLOSED' ? 'border-gray-400' : 'border-red-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{ticket.subject}</h3>
                                            <p className="text-sm text-gray-500 mb-2">
                                                De: {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.activeRole})
                                            </p>
                                            <p className="text-gray-700 mt-2">{ticket.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                            {ticket.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => handleCloseTicket(ticket.id)}
                                                    className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                                                >
                                                    Marcar Resuelto
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                                        ID: {ticket.id} • {new Date(ticket.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

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

const TabButton = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${active
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
    >
        {label}
        {count > 0 && (
            <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {count}
            </span>
        )}
    </button>
);

const VerificationCard = ({ data, onVerify, onReject, onImageClick }) => (
    <div className="card border-2 border-gray-100 flex flex-col md:flex-row gap-6 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex-1">
            <h3 className="font-bold text-xl">{data.firstName} {data.lastName}</h3>
            <p className="text-sm text-gray-500 mb-2">{data.email}</p>
            <p className="font-mono bg-yellow-50 inline-block px-2 py-1 rounded text-sm mb-4">
                DNI: {data.dniNumber}
            </p>
            <p className="text-xs text-gray-400">Registrado: {new Date(data.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-4">
            <div className="text-center cursor-pointer" onClick={() => onImageClick(data.dniFrontPhotoUrl)}>
                <p className="text-xs font-bold mb-1">Frente</p>
                <img src={getImageUrl(data.dniFrontPhotoUrl)} className="w-32 h-20 object-cover rounded-lg border hover:scale-105 transition-transform" />
            </div>
            <div className="text-center cursor-pointer" onClick={() => onImageClick(data.dniBackPhotoUrl)}>
                <p className="text-xs font-bold mb-1">Dorso</p>
                <img src={getImageUrl(data.dniBackPhotoUrl)} className="w-32 h-20 object-cover rounded-lg border hover:scale-105 transition-transform" />
            </div>
        </div>

        <div className="flex flex-col justify-center gap-2">
            <button onClick={() => onVerify(data.id)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700">
                ✅ Aprobar
            </button>
            <button onClick={() => onReject(data.id)} className="bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-200">
                🚫 Rechazar
            </button>
        </div>
    </div>
);

export default AdminDashboard;
