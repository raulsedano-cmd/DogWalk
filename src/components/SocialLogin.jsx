import { GoogleLogin } from '@react-oauth/google';
import { FacebookLoginButton, MicrosoftLoginButton } from 'react-social-login-buttons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const SocialLogin = () => {
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSocialLogin = async (provider, token) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post(`/auth/${provider}`, { idToken: token });
            const { token: jwt, user } = response.data;

            loginWithToken(user, jwt);

            // Redirect logic based on user state
            if (!user.termsAccepted) {
                navigate('/aceptar-terminos');
            } else if (user.role === 'WALKER' && user.verificationStatus === 'PENDING') {
                navigate('/verificar-paseador');
            } else {
                navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/walker/dashboard');
            }
        } catch (err) {
            console.error(`${provider} login error:`, err);
            setError(`Error al iniciar sesión con ${provider}. Inténtalo de nuevo.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500 font-medium">O continúa con</span>
                </div>
            </div>

            {error && (
                <div className="p-2 text-xs text-red-600 bg-red-50 rounded border border-red-100 text-center">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-2">
                {/* Google login is centered and standard */}
                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            handleSocialLogin('google', credentialResponse.credential);
                        }}
                        onError={() => {
                            setError('Error con Google. Inténtalo de nuevo.');
                        }}
                        useOneTap={false}
                        width="300"
                        theme="outline"
                        shape="pill"
                        text="continue_with"
                    />
                </div>

                {/* Other buttons via library for consistent UI */}
                <MicrosoftLoginButton
                    onClick={() => alert('La integración de Microsoft requiere configuración de Azure AD. Endpoint: /api/auth/microsoft')}
                    style={{ margin: 0, borderRadius: '9999px', fontSize: '14px', height: '40px', boxShadow: 'none', border: '1px solid #e5e7eb' }}
                    text="Continuar con Microsoft"
                />

                <FacebookLoginButton
                    onClick={() => alert('La integración de Facebook requiere App ID configurado. Endpoint: /api/auth/facebook')}
                    style={{ margin: 0, borderRadius: '9999px', fontSize: '14px', height: '40px', boxShadow: 'none', border: '1px solid #e5e7eb' }}
                    text="Continuar con Facebook"
                />
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-2 px-4">
                Registro rápido sin contraseñas. Al continuar, aceptas nuestros términos y política de privacidad.
            </p>
        </div>
    );
};

export default SocialLogin;
