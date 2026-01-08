import { useState } from 'react';
import api from '../services/api';

const Help = () => {
    const [formData, setFormData] = useState({
        category: 'Seguridad',
        subject: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const faqs = [
        {
            q: "¿Cómo funciona el proceso de pago?",
            a: "Actualmente los pagos se coordinan directamente entre el dueño y el paseador. El precio sugerido sirve como base para la negociación."
        },
        {
            q: "¿Qué pasa si mi paseador llega tarde?",
            a: "Te recomendamos contactar al paseador a través del chat interno. Si no responde en 15 minutos, puedes cancelar la asignación sin penalización."
        },
        {
            q: "¿Los paseadores están verificados?",
            a: "Sí, todos los paseadores deben pasar por un proceso de verificación de identidad (DNI) antes de poder postularse a cualquier paseo."
        },
        {
            q: "¿Cómo reporto un incidente durante un paseo?",
            a: "Usa el formulario de 'Reportar un Problema' en esta página o contacta a soporte inmediatamente a través de nuestras redes oficiales."
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/support/tickets', formData);
            setSubmitted(true);
            setFormData({ category: 'Seguridad', subject: '', description: '' });
        } catch (error) {
            alert('Error al enviar el reporte. Por favor intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-black text-gray-800 mb-2">Centro de Ayuda</h1>
            <p className="text-gray-500 mb-12">Estamos aquí para ayudarte a ti y a tu mascota.</p>

            <div className="grid md:grid-cols-2 gap-12">
                {/* FAQs */}
                <div>
                    <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                        <span>❓</span> Preguntas Frecuentes
                    </h2>
                    <div className="space-y-6">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-800 mb-2">{faq.q}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report Form */}
                <div>
                    <div className="bg-primary-50 rounded-[40px] p-8 border-2 border-primary-100 shadow-xl shadow-primary-50">
                        <h2 className="text-2xl font-black text-primary-900 mb-2">Reportar un Problema</h2>
                        <p className="text-primary-800 text-sm mb-6">Si tuviste algún inconveniente o necesitas ayuda urgente, escríbenos.</p>

                        {submitted ? (
                            <div className="bg-white p-8 rounded-3xl text-center shadow-lg border-2 border-green-100">
                                <span className="text-5xl mb-4 block animate-bounce">✅</span>
                                <h3 className="text-xl font-black text-gray-800 mb-2">¡Reporte Enviado!</h3>
                                <p className="text-gray-600 text-sm">Nuestro equipo revisará tu caso y te contactará a la brevedad posible.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 text-primary-600 font-bold hover:underline"
                                >
                                    Enviar otro reporte
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-primary-700 uppercase mb-2 ml-2">Categoría</label>
                                    <select
                                        className="input-field bg-white border-transparent focus:border-primary-400"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Seguridad">Seguridad (Emergencia)</option>
                                        <option value="Incidente">Incidente con el Perro</option>
                                        <option value="Pago">Duda sobre Pago</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-primary-700 uppercase mb-2 ml-2">Asunto</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field bg-white border-transparent focus:border-primary-400"
                                        placeholder="Ej: Problema con un pago, Incidente en paseo..."
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-primary-700 uppercase mb-2 ml-2">Descripción Detallada</label>
                                    <textarea
                                        required
                                        className="input-field bg-white border-transparent focus:border-primary-400"
                                        rows="5"
                                        placeholder="Por favor describe lo sucedido con el mayor detalle posible..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-primary-200 active:scale-95 transition-all hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Enviando...' : 'Enviar Reporte a Soporte'}
                                </button>
                                <p className="text-center text-[10px] text-primary-400 font-black uppercase tracking-widest mt-4">
                                    Conforme a Normas de Atención al Cliente
                                </p>
                            </form>
                        )}
                    </div>

                    <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4 transition-all hover:bg-white hover:shadow-md">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">📧</div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase">Contacto Directo</p>
                            <p className="font-bold text-gray-700">soporte@dogwalk.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;
