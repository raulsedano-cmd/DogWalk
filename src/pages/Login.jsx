import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SocialLogin from '../components/SocialLogin';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
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
            const response = await login(formData.email, formData.password, selectedRole);
            const userData = response.user;

            if (!userData.termsAccepted) {
                localStorage.setItem('preferredRole', selectedRole);
                navigate('/aceptar-terminos');
                return;
            }

            navigate(userData.activeRole === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFEFE] py-16 px-6 relative overflow-hidden">
            {/* Decorative Blobs - Reduced */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary-500/[0.03] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10 space-y-3">
                    <Link to="/" className="inline-flex items-center gap-2 group mb-4">
                        <div className="w-10 h-10 bg-primary-600 rounded-[12px] flex items-center justify-center text-xl shadow-lg shadow-primary-500/10 group-hover:rotate-12 transition-transform">🐕</div>
                        <span className="text-xl font-black text-navy-900 tracking-tighter uppercase">DogWalk <span className="text-primary-600">Pro</span></span>
                    </Link>
                    <h2 className="text-4xl font-black text-navy-900 tracking-tight leading-none italic uppercase">Acceso.</h2>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">Operaciones de Élite</p>
                </div>

                <div className="card-premium !p-10 shadow-xl border-slate-100">
                    {/* Role Selection Tabs - Reduced */}
                    <div className="flex p-1.5 bg-slate-50 rounded-[14px] mb-8 border border-slate-100">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('OWNER')}
                            className={`flex-1 py-2.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all ${selectedRole === 'OWNER'
                                ? 'bg-white text-navy-900 shadow-sm border border-slate-100/50'
                                : 'text-slate-400 hover:text-slate-500'
                                }`}
                        >
                            Dueño
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRole('WALKER')}
                            className={`flex-1 py-2.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all ${selectedRole === 'WALKER'
                                ? 'bg-navy-900 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-500'
                                }`}
                        >
                            Paseador
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-[12px] animate-fadeIn">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-field"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="username email"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-[16px] font-black text-sm transition-all shadow-xl active:scale-95 ${loading
                                ? 'bg-slate-100 cursor-not-allowed text-slate-400'
                                : selectedRole === 'OWNER'
                                    ? 'bg-primary-600 hover:bg-black text-white shadow-primary-500/10'
                                    : 'bg-navy-900 hover:bg-black text-white'
                                }`}
                        >
                            {loading ? 'Entrando...' : `Entrar como ${selectedRole === 'OWNER' ? 'Dueño' : 'Paseador Pro'}`}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-navy-900 transition-colors">
                            Registrarse
                        </Link>
                    </div>

                    <div className="my-8 h-px bg-slate-100 relative">
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[8px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">Social Access</span>
                    </div>

                    <SocialLogin selectedRole={selectedRole} />

                    <div className="mt-8 p-4 bg-slate-50/50 rounded-[18px] text-[8px] text-slate-400 font-bold leading-relaxed border border-slate-100">
                        <p className="font-black text-slate-500 uppercase mb-1">Cuentas Test:</p>
                        <p>DUEÑO: maria@example.com / password123</p>
                        <p>WALKER: carlos@example.com / password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
