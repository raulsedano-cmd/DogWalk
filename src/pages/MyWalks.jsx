import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MyWalks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        try {
            // For both roles, this endpoint returns relevant assignments
            // Walker: assignments where walkerId = me
            // Owner: assignments where walkRequest.ownerId = me
            const response = await api.get('/walk-assignments');
            setAssignments(response.data);
        } catch (error) {
            console.error('Error loading assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container mx-auto px-4 py-8">Cargando...</div>;

    const pending = assignments.filter(a => ['PENDING', 'IN_PROGRESS'].includes(a.status));
    const completed = assignments.filter(a => ['COMPLETED', 'CANCELLED'].includes(a.status));

    const renderAssignmentCard = (assignment) => (
        <div
            key={assignment.id}
            className={`card hover:shadow-md transition-all cursor-pointer border-l-4 ${assignment.status === 'IN_PROGRESS'
                ? 'border-l-blue-500 bg-blue-50/30'
                : assignment.status === 'PENDING'
                    ? 'border-l-primary-500'
                    : assignment.status === 'CANCELLED'
                        ? 'border-l-red-400 bg-gray-50 opacity-75'
                        : 'border-l-green-500 bg-gray-50 opacity-75'
                }`}
            onClick={() => navigate(`/walk-requests/${assignment.walkRequestId}`)}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{assignment.walkRequest.dog.name}</h3>
                    <p className="text-sm text-gray-500">{assignment.walkRequest.zone}</p>
                </div>
                <span className={`badge badge-${assignment.status.toLowerCase()}`}>
                    {assignment.status === 'IN_PROGRESS' ? 'EN CURSO 🚀' : assignment.status}
                </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(assignment.walkRequest.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🕒</span>
                    <span>{assignment.walkRequest.startTime} ({assignment.walkRequest.durationMinutes} min)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>{user.activeRole === 'OWNER' ? '👤 Paseador:' : '👤 Dueño:'}</span>
                    <span className="font-semibold">
                        {user.activeRole === 'OWNER'
                            ? `${assignment.walker.firstName} ${assignment.walker.lastName}`
                            : `${assignment.walkRequest.owner.firstName} ${assignment.walkRequest.owner.lastName}`}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-primary-600 font-bold text-lg">S/ {assignment.walkRequest.suggestedPrice}</span>
                {assignment.status === 'PENDING' && user.activeRole === 'WALKER' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/walk-requests/${assignment.walkRequestId}`);
                        }}
                        className="btn-primary py-1 px-4 text-sm"
                    >
                        Iniciar Paseo
                    </button>
                )}
                {assignment.status === 'IN_PROGRESS' && user.activeRole === 'WALKER' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/walk-assignments/${assignment.id}/in-progress`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm transition-colors"
                    >
                        Gestionar Paseo
                    </button>
                )}
                <span className="text-xs text-primary-600 font-semibold group-hover:underline">
                    Ver detalles →
                </span>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Mis Paseos</h1>

            <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Próximos y En Curso</h2>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm font-bold">
                        {pending.length}
                    </span>
                </div>
                {pending.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
                        No tienes paseos pendientes en este momento.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pending.map(renderAssignmentCard)}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Historial de Paseos</h2>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm font-bold">
                        {completed.length}
                    </span>
                </div>
                {completed.length === 0 ? (
                    <p className="text-gray-500 italic">No hay historial de paseos aún.</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completed.map(renderAssignmentCard)}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MyWalks;
