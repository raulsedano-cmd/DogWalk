import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Cargando...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.activeRole !== requiredRole) {
        // Redirigir al dashboard correcto según el rol activo actual
        return <Navigate to={user?.activeRole === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard'} replace />;
    }

    return children;
};
