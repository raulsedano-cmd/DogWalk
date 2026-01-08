import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SocialLogin from '../components/SocialLogin';

const Register = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const defaultRole = searchParams.get('role') === 'walker' ? 'WALKER' : 'OWNER';

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        city: '',
        zone: '',
        bio: '',
        role: defaultRole,
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [acceptTerms, setAcceptTerms] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!acceptTerms) {
            setError('Debes aceptar los Términos y Condiciones para continuar');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
            // Optionally auto-accept terms on backend or let the redirect handle it
            navigate(formData.role === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 text-gray-800">
            <div className="max-w-md w-full animate-in fade-in duration-500">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🐕</div>
                    <h2 className="text-3xl font-black text-gray-900">Crear Cuenta</h2>
                    <p className="mt-2 text-gray-600 font-medium">
                        Únete a DogWalk como <span className="text-primary-600 uppercase font-bold">{formData.role === 'OWNER' ? 'Dueño' : 'Paseador'}</span>
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* ... Existing fields remain same, wrapping with premium styles if possible but keeping logic ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    className="input-field"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    className="input-field"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="input-field"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Ej: 999 999 999"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    className="input-field"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Zona
                                </label>
                                <input
                                    type="text"
                                    name="zone"
                                    required
                                    className="input-field"
                                    value={formData.zone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="input-field"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Confirmar
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    className="input-field"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Soy
                            </label>
                            <select
                                name="role"
                                className="input-field font-bold"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="OWNER">Dueño de Perro</option>
                                <option value="WALKER">Paseador</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                />
                                <span className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-700 transition-colors">
                                    Declaro haber leído y aceptado los <Link to="/terminos-y-condiciones" target="_blank" className="text-primary-600 font-bold hover:underline">Términos y Condiciones</Link> y el <strong>Deslinde de Responsabilidad</strong> de DogWalk.
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !acceptTerms}
                            className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 ${acceptTerms && !loading
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? 'Registrando...' : 'CREAR CUENTA'}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Inicia sesión
                        </Link>
                    </div>

                    <SocialLogin />
                </div>
            </div>
        </div>
    );
};

export default Register;
