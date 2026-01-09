import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import Avatar from '../components/Avatar';

const WalkerDashboard = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth(); // Assuming updateUser updates context
    const [availableRequests, setAvailableRequests] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        city: '',
        zone: '',
        size: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Status Toggle State
    const [availabilityLoading, setAvailabilityLoading] = useState(false);

    // Report Form State
    const [reportingAssignmentId, setReportingAssignmentId] = useState(null);
    const [reportData, setReportData] = useState({
        didPee: false,
        didPoop: false,
        behaviorRating: 5,
        reportNotes: ''
    });

    useEffect(() => {
        loadData();
    }, [page, filters]);

    const loadData = async () => {
        try {
            const [requestsRes, assignmentsRes] = await Promise.all([
                api.get('/walk-requests', {
                    params: { page, limit: 9, ...filters },
                }),
                api.get('/walk-assignments'),
            ]);

            setAvailableRequests(requestsRes.data.requests);
            setTotalPages(requestsRes.data.pagination.totalPages);
            setMyAssignments(assignmentsRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const toggleAvailability = async () => {
        setAvailabilityLoading(true);
        try {
            const newStatus = !user.isAvailable;
            // Update via API
            const response = await api.put('/users/me', { isAvailable: newStatus });

            // Update context and storage immediately
            // Backend returns { message: '...', user: updatedUser }
            if (response.data.user) {
                updateUser(response.data.user);
            } else {
                // Fallback if backend structure differs, though controller sends { user }
                updateUser({ ...user, isAvailable: newStatus });
            }

        } catch (error) {
            console.error('Error updating availability:', error);
            alert('Error al actualizar disponibilidad');
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const handleCompleteClick = (assignmentId) => {
        if (reportingAssignmentId === assignmentId) {
            setReportingAssignmentId(null); // Toggle off
        } else {
            setReportingAssignmentId(assignmentId);
            setReportData({
                didPee: false,
                didPoop: false,
                behaviorRating: 5,
                reportNotes: ''
            });
        }
    };

    const submitCompletion = async (assignmentId) => {
        try {
            await api.put(`/walk-assignments/${assignmentId}/status`, {
                status: 'COMPLETED',
                ...reportData
            });
            alert('¡Paseo completado y reporte enviado!');
            setReportingAssignmentId(null);
            loadData();
        } catch (error) {
            console.error('Error completing walk:', error);
            alert('Error al completar el paseo');
        }
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Cargando...</div>;
    }

    const handleUpdateAssignment = async (assignmentId, action) => {
        try {
            let endpoint = `/walk-assignments/${assignmentId}/${action === 'IN_PROGRESS' ? 'start' : 'status'}`;
            let payload = {};

            if (action === 'IN_PROGRESS') {
                // No payload needed for start endpoint currently as per my previous backend implementation
            } else {
                payload = { status: action };
                if (action === 'COMPLETED') {
                    Object.assign(payload, reportData);
                }
            }

            await api.put(endpoint, payload);

            if (action === 'IN_PROGRESS') {
                navigate(`/walk-assignments/${assignmentId}/in-progress`);
                return;
            }

            loadData();
            setReportingAssignmentId(null);
            alert(`Paseo ${action === 'COMPLETED' ? 'finalizado' : 'actualizado'}`);
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar paseo');
        }
    };

    const pendingAssignments = myAssignments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
    const completedAssignments = myAssignments.filter(a => a.status === 'COMPLETED');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Avatar
                        src={user.profilePhotoUrl}
                        alt="Profile"
                        size="16"
                        fallbackText={user.firstName}
                        className="border-2 border-primary-500 shadow-sm"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Panel de Paseador</h1>
                        <p className="text-gray-500">Bienvenido de nuevo, {user.firstName || 'Paseador'}</p>
                    </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border w-full md:w-auto">
                    <div className="mr-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Tu Estado</p>
                        <p className={`font-bold ${user.isAvailable ? 'text-green-600' : 'text-red-500 flex items-center gap-1'}`}>
                            {user.isAvailable ? '● DISPONIBLE' : '○ NO DISPONIBLE'}
                        </p>
                    </div>
                    <button
                        onClick={toggleAvailability}
                        disabled={availabilityLoading}
                        className={`px-6 py-2 rounded-lg font-bold transition-all shadow-sm ${user.isAvailable
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                    >
                        {availabilityLoading ? '...' : (user.isAvailable ? 'Desactivar' : 'Activar')}
                    </button>
                </div>
            </div>

            {/* Legal Verification Alert */}
            {user.role === 'WALKER' && user.verificationStatus !== 'VERIFIED' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-xl shadow-sm animate-pulse-slow">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">🆔</div>
                        <div className="flex-1">
                            <h3 className="text-blue-900 font-black text-lg mb-1">Verificación de Identidad Requerida</h3>
                            <p className="text-blue-800 text-sm mb-4">
                                Según los <strong>Términos y Condiciones</strong>, debes completar tu verificación de identidad (DNI) para poder enviar ofertas y realizar paseos. Esto nos ayuda a mantener una comunidad segura.
                            </p>
                            <Link
                                to="/verificar-paseador"
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                            >
                                {user.verificationStatus === 'PENDING' ? 'Ver Estado de Verificación' : 'Verificar Mi Identidad Ahora'}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Config Validity Alert */}
            {user.role === 'WALKER' && (!user.baseCity || !user.baseZone) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                ⚠️ Configura tu <strong>Ciudad Base</strong> y <strong>Zona Base</strong> en tu <Link to="/profile" className="underline font-bold">Perfil</Link> para recibir solicitudes relevantes.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold mb-4">Solicitudes Disponibles</h2>

            {/* Filters */}
            <div className="card mb-8">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad
                        </label>
                        <input
                            type="text"
                            name="city"
                            className="input-field"
                            value={filters.city}
                            onChange={handleFilterChange}
                            placeholder="Ej: Ciudad de México"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zona
                        </label>
                        <input
                            type="text"
                            name="zone"
                            className="input-field"
                            value={filters.zone}
                            onChange={handleFilterChange}
                            placeholder="Ej: Condesa"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamaño del Perro
                        </label>
                        <select
                            name="size"
                            className="input-field"
                            value={filters.size}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todos</option>
                            <option value="SMALL">Pequeño</option>
                            <option value="MEDIUM">Mediano</option>
                            <option value="LARGE">Grande</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Available Requests */}
            <section className="mb-8">
                {availableRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        <p className="font-semibold text-gray-700">No hay solicitudes disponibles actualmente.</p>
                        <div className="mt-2 text-sm">
                            <p>Tu ubicación base: <span className="text-primary-600 font-bold">{user.baseCity || 'No configurada'} {user.baseZone && `- ${user.baseZone}`}</span></p>
                            <p>Radio de servicio: <span className="font-bold">{user.serviceRadiusKm || 5} km</span></p>
                            <p>Estado: {user.isAvailable ? <span className="text-green-600 font-bold">Disponible</span> : <span className="text-red-600 font-bold">No Disponible</span>}</p>
                        </div>
                        {!user.isAvailable && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg inline-block">
                                ⚠️ Debes activar tu estado como <strong>DISPONIBLE</strong> para recibir solicitudes.
                            </div>
                        )}
                        {user.isAvailable && (
                            <div className="mt-4 text-xs space-y-2">
                                <p className="italic">
                                    Si no ves solicitudes cercanas, verifica que hayas seleccionado tu ubicación exacta en el mapa de tu perfil.
                                </p>
                                <p className="text-blue-600">
                                    💡 El sistema ahora usa <strong>GPS (Mapas)</strong> para encontrar paseos cerca de ti de forma precisa.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {availableRequests.map(request => (
                                <Link key={request.id} to={`/walk-requests/${request.id}`} className="card hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg">{request.dog.name}</h3>
                                        <span className="badge badge-open">{request.dog.size}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-1">{request.zone}</p>
                                    <p className="text-gray-600 text-sm mb-1">
                                        {new Date(request.date).toLocaleDateString()} - {request.startTime}
                                    </p>
                                    <p className="text-gray-600 text-sm mb-2">{request.durationMinutes} min</p>
                                    <p className="text-primary-600 font-semibold">S/ {request.suggestedPrice}</p>
                                    {request.details && (
                                        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{request.details}</p>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="btn-secondary disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <span className="px-4 py-2">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="btn-secondary disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* My Assignments */}
            <section className="mb-8" id="assignments">
                <h2 className="text-2xl font-semibold mb-4">Mis Paseos Asignados</h2>
                {pendingAssignments.length === 0 ? (
                    <p className="text-gray-600">No tienes paseos asignados</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingAssignments.map(assignment => (
                            <div
                                key={assignment.id}
                                className="card border-l-4 border-l-primary-500 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={(e) => {
                                    // Prevent navigation if clicking on buttons
                                    if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                        navigate(`/walk-requests/${assignment.walkRequestId}`);
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{assignment.walkRequest.dog.name}</h3>
                                    <span className={`badge badge-${assignment.status.toLowerCase()}`}>{assignment.status === 'IN_PROGRESS' ? 'EN CURSO' : assignment.status}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-1">{assignment.walkRequest.zone}</p>
                                <p className="text-gray-600 text-sm mb-2">
                                    📅 {new Date(assignment.walkRequest.date).toLocaleDateString()} 🕒 {assignment.walkRequest.startTime}
                                </p>

                                {assignment.status === 'PENDING' ? (
                                    <button
                                        onClick={() => handleUpdateAssignment(assignment.id, 'IN_PROGRESS')}
                                        className="btn-primary w-full mt-2 bg-green-600 hover:bg-green-700"
                                    >
                                        🚀 Iniciar Paseo
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/walk-assignments/${assignment.id}/in-progress`)}
                                        className="btn-primary w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        📱 Gestionar Paseo
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed Assignments */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">Paseos Completados</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedAssignments.slice(0, 3).map(assignment => (
                        <div key={assignment.id} className="card bg-gray-50 opacity-75">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold">{assignment.walkRequest.dog.name}</h3>
                                <span className="badge badge-completed">COMPLETADO</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                {new Date(assignment.actualEndTime || assignment.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
                {completedAssignments.length > 3 && (
                    <p className="text-gray-500 mt-2 text-sm">... y {completedAssignments.length - 3} más.</p>
                )}
            </section>
        </div>
    );
};

export default WalkerDashboard;
