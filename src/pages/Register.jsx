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
            navigate(formData.role === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFEFE] py-16 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

            <div className="max-w-xl w-full relative z-10 animate-fadeIn">
                <div className="text-center mb-10 space-y-3">
                    <Link to="/" className="inline-flex items-center gap-2 group mb-4">
                        <div className="w-10 h-10 bg-navy-900 rounded-[12px] flex items-center justify-center text-xl shadow-lg shadow-navy-500/10 group-hover:rotate-12 transition-transform text-white">🐕</div>
                        <span className="text-xl font-black text-navy-900 tracking-tighter uppercase">DogWalk <span className="text-primary-600">Pro</span></span>
                    </Link>
                    <h2 className="text-4xl lg:text-5xl font-black text-navy-900 tracking-tight leading-[0.9] uppercase italic">
                        Únete.
                    </h2>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em]">Inicia como {formData.role === 'OWNER' ? 'Dueño' : 'Paseador Pro'}</p>
                </div>

                <div className="card-premium !p-10">
                    {error && (
                        <div className="mb-6 px-5 py-3.5 bg-red-50 border border-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-[12px]">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Nombre</label>
                                <input type="text" name="firstName" required className="input-field" placeholder="Ej: María" value={formData.firstName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Apellido</label>
                                <input type="text" name="lastName" required className="input-field" placeholder="Ej: García" value={formData.lastName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Email</label>
                            <input type="email" name="email" required className="input-field" placeholder="tu@email.com" value={formData.email} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Teléfono</label>
                            <input type="tel" name="phone" required className="input-field" value={formData.phone} onChange={handleChange} placeholder="999 999 999" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Ciudad</label>
                                <input type="text" name="city" required className="input-field" placeholder="Ej: Lima" value={formData.city} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Zona</label>
                                <input type="text" name="zone" required className="input-field" placeholder="Ej: Miraflores" value={formData.zone} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Password</label>
                                <input type="password" name="password" required className="input-field" value={formData.password} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Confirmar</label>
                                <input type="password" name="confirmPassword" required className="input-field" value={formData.confirmPassword} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Perfil</label>
                            <select name="role" className="input-field font-black uppercase text-[10px] tracking-widest bg-white" value={formData.role} onChange={handleChange}>
                                <option value="OWNER">Dueño de Mascota</option>
                                <option value="WALKER">Paseador Pro</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" className="mt-1 w-4 h-4 rounded-[5px] border-slate-100 text-primary-600 focus:ring-primary-500/20" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
                                <span className="text-slate-400 text-[9px] font-bold leading-relaxed uppercase tracking-widest group-hover:text-navy-900 transition-colors">
                                    Acepto los <Link to="/terminos-y-condiciones" target="_blank" className="text-primary-600 font-black underline underline-offset-2">Términos</Link> oficiales.
                                </span>
                            </label>
                        </div>

                        <button type="submit" disabled={loading || !acceptTerms} className={`w-full py-4 rounded-[16px] font-black text-sm transition-all shadow-xl active:scale-95 ${acceptTerms && !loading ? 'bg-navy-900 text-white hover:bg-black shadow-navy-500/10' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                            {loading ? 'Creando...' : 'REGISTRARME 🚀'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ¿Ya eres miembro?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-navy-900 transition-colors">Iniciar sesión</Link>
                    </div>

                    <div className="my-8 h-px bg-slate-100 relative">
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[8px] font-black text-slate-300 uppercase tracking-widest">Social</span>
                    </div>

                    <SocialLogin />
                </div>
            </div>
        </div>
    );
};

export default Register;
