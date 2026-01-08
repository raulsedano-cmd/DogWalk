import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TermsAcceptance = () => {
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const handleAccept = async () => {
        if (!accepted) return;
        setLoading(true);
        try {
            await api.post('/legal/accept', { version: '1.0' });
            // Update local user state
            const response = await api.get('/users/me');
            updateUser(response.data);
            navigate('/');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al aceptar los términos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block">⚖️</span>
                    <h1 className="text-3xl font-black text-gray-800 mb-2">Actualización Legal</h1>
                    <p className="text-gray-500">Para continuar usando DogWalk, debes aceptar nuestros nuevos Términos y Condiciones ajustados a la normativa peruana.</p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-sm text-gray-700 space-y-4 border border-blue-100">
                    <p className="font-bold text-blue-800">Puntos clave que debes conocer:</p>
                    <ul className="space-y-2">
                        <li className="flex gap-2">
                            <span>✅</span>
                            <span><strong>DogWalk es intermediario:</strong> No somos empleadores ni prestadores directos.</span>
                        </li>
                        <li className="flex gap-2">
                            <span>✅</span>
                            <span><strong>Responsabilidad:</strong> El contrato es directo entre dueño y paseador.</span>
                        </li>
                        <li className="flex gap-2">
                            <span>✅</span>
                            <span><strong>Seguridad:</strong> Requerimos verificación de DNI para todos los paseadores.</span>
                        </li>
                    </ul>
                    <a href="/terminos-y-condiciones" target="_blank" className="block text-center text-blue-600 font-bold hover:underline mt-4">
                        Leer Términos y Condiciones completos
                    </a>
                </div>

                <div className="space-y-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-800 transition-colors">
                            Declaro haber leído y aceptado los <strong>Términos y Condiciones</strong> y el <strong>Deslinde de Responsabilidad</strong> de DogWalk. Comprendo que la plataforma actúa solo como intermediario.
                        </span>
                    </label>

                    <button
                        onClick={handleAccept}
                        disabled={!accepted || loading}
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl mb-4 transition-all active:scale-95 ${accepted
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Procesando...' : 'ACEPTAR Y CONTINUAR'}
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors"
                    >
                        Cerrar sesión y salir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsAcceptance;
