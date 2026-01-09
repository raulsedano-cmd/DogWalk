import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleSelection = () => {
    const { user, switchRole, activateRole } = useAuth();
    const navigate = useNavigate();

    const handleRoleChoice = async (role) => {
        try {
            if (!user.roles.includes(role)) {
                // If they choose WALKER but don't have it, activate it
                // In a real app, this might redirect to a "Complete Walker Profile" form first
                await activateRole(role);
            } else {
                // Just switch the active role
                await switchRole(role);
            }

            // Redirect based on the chosen role
            navigate(role === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
        } catch (error) {
            alert('Error al seleccionar el modo');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-gray-800 mb-4">¿Cómo quieres usar DogWalk hoy?</h1>
                    <p className="text-gray-500 text-lg">Puedes cambiar entre estos perfiles en cualquier momento desde tu cuenta.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Owner Card */}
                    <button
                        onClick={() => handleRoleChoice('OWNER')}
                        className="group bg-white rounded-3xl p-8 shadow-xl border-4 border-transparent hover:border-primary-500 transition-all text-left relative overflow-hidden active:scale-95"
                    >
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🏡</div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Soy Dueño</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Busca paseadores confiables para tus perros y gestiona sus paseos diarios.
                        </p>
                        <div className="inline-flex items-center text-primary-600 font-bold group-hover:translate-x-2 transition-transform">
                            Entrar como Dueño →
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] text-primary-50 text-9xl font-black -rotate-12 pointer-events-none opacity-50">
                            🐶
                        </div>
                    </button>

                    {/* Walker Card */}
                    <button
                        onClick={() => handleRoleChoice('WALKER')}
                        className="group bg-white rounded-3xl p-8 shadow-xl border-4 border-transparent hover:border-blue-500 transition-all text-left relative overflow-hidden active:scale-95"
                    >
                        <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🚶‍♂️</div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">Soy Paseador</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Encuentra paseos cerca de ti, gana dinero y ayuda a los perros de tu zona.
                        </p>
                        <div className="inline-flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                            {user?.roles.includes('WALKER') ? 'Entrar como Paseador →' : 'Activar Perfil Paseador →'}
                        </div>
                        {!user?.roles.includes('WALKER') && (
                            <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                                NUEVO
                            </span>
                        )}
                        <div className="absolute top-[-20px] right-[-20px] text-blue-50 text-9xl font-black -rotate-12 pointer-events-none opacity-50">
                            👟
                        </div>
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">DogWalk • Conectando Huellas</p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
