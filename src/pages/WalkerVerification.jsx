import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const WalkerVerification = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchedStatus, setFetchedStatus] = useState(null);
    const [formData, setFormData] = useState({
        dniNumber: '',
        dniFront: null,
        dniBack: null
    });

    useEffect(() => {
        if (user.role !== 'WALKER') {
            navigate('/');
        }
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const response = await api.get('/walker-verification/status');
            setFetchedStatus(response.data);
            if (response.data.dniNumber) {
                setFormData(prev => ({ ...prev, dniNumber: response.data.dniNumber }));
            }
        } catch (error) {
            console.error("Error checking verification status", error);
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.dniNumber.length !== 8) {
            return alert("El DNI debe tener 8 dígitos");
        }
        if (!formData.dniFront || !formData.dniBack) {
            return alert("Debes subir ambas fotos de tu DNI");
        }

        setLoading(true);
        const data = new FormData();
        data.append('dniNumber', formData.dniNumber);
        data.append('dniFront', formData.dniFront);
        data.append('dniBack', formData.dniBack);

        try {
            await api.post('/walker-verification', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Información enviada correctamente. El equipo de DogWalk revisará tus documentos.");

            // Refresh user state
            const userResponse = await api.get('/users/me');
            updateUser(userResponse.data);
            navigate('/walker/dashboard');
        } catch (error) {
            alert(error.response?.data?.error || 'Error al enviar verificación');
        } finally {
            setLoading(false);
        }
    };

    if (user.verificationStatus === 'VERIFIED') {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl">
                    <span className="text-6xl mb-4 block">✅</span>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Cuenta Verificada!</h1>
                    <p className="text-gray-600 mb-6">Tu identidad ha sido confirmada. Ya puedes recibir ofertas y realizar paseos con total confianza.</p>
                    <button onClick={() => navigate('/walker/dashboard')} className="btn-primary w-full">Ir al Panel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-primary-600 p-8 text-white text-center">
                    <span className="text-5xl mb-4 block">🆔</span>
                    <h1 className="text-3xl font-black mb-2">Verificación de Identidad</h1>
                    <p className="text-primary-100">Es obligatorio para todos los paseadores cumplir con el Deber de Diligencia conforme a la ley peruana.</p>
                </div>

                <div className="p-8">
                    {user.verificationStatus === 'PENDING' && fetchedStatus?.dniNumber ? (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center text-yellow-800 space-y-3">
                            <h2 className="font-bold text-xl">Revisión en Proceso</h2>
                            <p className="text-sm">Hemos recibido tus documentos. Nuestro equipo está validando tu DNI. Este proceso suele tardar de 12 a 24 horas.</p>
                            <div className="text-xs font-mono bg-yellow-100 py-1 rounded">DNI: {fetchedStatus.dniNumber}</div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <section>
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    Número de DNI
                                </h3>
                                <input
                                    type="text"
                                    maxLength="8"
                                    placeholder="8 dígitos"
                                    className="input-field text-2xl tracking-widest text-center font-bold"
                                    value={formData.dniNumber}
                                    onChange={(e) => setFormData({ ...formData, dniNumber: e.target.value.replace(/\D/g, '') })}
                                    required
                                />
                            </section>

                            <section className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                        DNI Frente
                                    </h3>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            name="dniFront"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                            required
                                        />
                                        <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${formData.dniFront ? 'border-green-500 bg-green-50' : 'border-gray-200 group-hover:border-primary-400'}`}>
                                            <span className="text-3xl mb-2">{formData.dniFront ? '📸' : '➕'}</span>
                                            <span className="text-xs font-bold text-gray-500">{formData.dniFront ? 'Imagen cargada' : 'Subir foto frontal'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                        DNI Reverso
                                    </h3>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            name="dniBack"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                            required
                                        />
                                        <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${formData.dniBack ? 'border-green-500 bg-green-50' : 'border-gray-200 group-hover:border-primary-400'}`}>
                                            <span className="text-3xl mb-2">{formData.dniBack ? '📸' : '➕'}</span>
                                            <span className="text-xs font-bold text-gray-500">{formData.dniBack ? 'Imagen cargada' : 'Subir foto reverso'}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 italic">
                                Tu información está protegida por la Ley de Protección de Datos Personales (Ley N° 29733). Solo se usará para fines de seguridad en la plataforma.
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4 text-lg"
                            >
                                {loading ? 'Enviando documentos...' : 'ENVIAR PARA VERIFICACIÓN'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalkerVerification;
