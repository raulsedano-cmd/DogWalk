import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SocialLogin from '../components/SocialLogin';

const Login = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedRole, setSelectedRole] = useState('OWNER');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);
            const userData = response.user;

            // If user has multiple roles and selected one that is not active, switch it
            if (userData.roles.includes(selectedRole) && userData.activeRole !== selectedRole) {
                const updatedUser = await switchRole(selectedRole);
                navigate(selectedRole === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
            } else {
                // Determine final redirect base on current activeRole if selection not possible
                const roleToUse = userData.roles.includes(selectedRole) ? selectedRole : userData.activeRole;
                navigate(roleToUse === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
                    <p className="mt-2 text-gray-600">Ingresa a tu cuenta de DogWalk</p>
                </div>

                <div className="card">
                    {/* Role Selection Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('OWNER')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedRole === 'OWNER'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            🏠 Soy Dueño
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRole('WALKER')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedRole === 'WALKER'
                                ? 'bg-white text-walker-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            🚶 Soy Paseador
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="username email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="input-field"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-95 ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : selectedRole === 'OWNER'
                                    ? 'bg-primary-600 hover:bg-primary-700'
                                    : 'bg-walker-600 hover:bg-walker-700'
                                }`}
                        >
                            {loading ? 'Iniciando sesión...' : `Entrar como ${selectedRole === 'OWNER' ? 'Dueño' : 'Paseador'}`}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Regístrate
                        </Link>
                    </div>

                    <SocialLogin selectedRole={selectedRole} />

                    <div className="mt-6 p-3 bg-gray-100 rounded text-[11px] text-gray-500">
                        <p className="font-semibold mb-1">Cuentas de prueba:</p>
                        <p>Dueño: maria@example.com / password123</p>
                        <p>Paseador: carlos@example.com / password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
