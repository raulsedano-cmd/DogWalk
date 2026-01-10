import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary-100 selection:text-primary-900">
            {/* Navbar (Mini) */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">🐕</span>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">DogWalk</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 font-bold text-sm text-gray-600">
                        <a href="#como-funciona" className="hover:text-primary-600 transition-colors">¿Cómo funciona?</a>
                        <a href="#beneficios" className="hover:text-primary-600 transition-colors">Beneficios</a>
                        <Link to="/login" className="bg-gray-100 px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all">Iniciar Sesión</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary-100 rounded-full blur-[120px] opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-50 z-0"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-100 animate-fadeIn">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            <span className="text-xs font-black text-primary-700 uppercase tracking-widest">Ahora en toda Lima</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                            Tu perro feliz, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">tú tranquilo.</span>
                        </h1>

                        <p className="text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Conectamos dueños de mascotas con los mejores paseadores locales. Seguimiento GPS en tiempo real, reportes detallados y pagos seguros.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/register?role=owner" className="group bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-[24px] font-bold text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                Buscar Paseador
                                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link to="/register?role=walker" className="bg-white hover:bg-gray-50 text-gray-900 px-10 py-5 rounded-[24px] font-bold text-lg border-2 border-gray-100 shadow-lg transition-all active:scale-95 flex items-center justify-center">
                                Quiero Pasear Perros
                            </Link>
                        </div>

                        <div className="pt-12 flex items-center justify-center gap-8 grayscale opacity-50">
                            <span className="font-bold text-xl tracking-tighter">Seguro</span>
                            <span className="font-bold text-xl tracking-tighter">Rápido</span>
                            <span className="font-bold text-xl tracking-tighter">Confiable</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section id="como-funciona" className="py-24 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <h2 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em]">Metodología</h2>
                        <p className="text-4xl font-black text-gray-900">¿Cómo funciona DogWalk?</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="relative group">
                            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-white transition-all group-hover:-translate-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-8">📝</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Pide un Paseo</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Publica los detalles de tu perro y el horario que necesitas. Los paseadores cerca de ti recibirán una alerta instantánea.</p>
                            </div>
                            <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-4xl text-gray-200">→</div>
                        </div>

                        <div className="relative group">
                            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-white transition-all group-hover:-translate-y-2">
                                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-8">💎</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Elige tu Favorito</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Compara ofertas, perfiles verificados y calificaciones reales de otros dueños. Tú tienes el control total del precio.</p>
                            </div>
                            <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-4xl text-gray-200">→</div>
                        </div>

                        <div className="relative group">
                            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-white transition-all group-hover:-translate-y-2">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mb-8">🛰️</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">Síguelo en Vivo</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">Mira el mapa en tiempo real, recibe fotos de las aventuras de tu perro y un reporte detallado al finalizar cada paseo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 container mx-auto px-6">
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-[48px] p-10 lg:p-20 text-center text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600 rounded-full blur-[150px] opacity-20 -translate-y-1/2"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                        <h2 className="text-4xl lg:text-6xl font-black leading-tight">¿Listo para mejorar la vida de tu mascota?</h2>
                        <p className="text-xl text-gray-400 font-medium">Únete hoy a la comunidad de amantes de los animales más grande y tecnológica.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Link to="/register?role=owner" className="bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-all active:scale-95 shadow-2xl">
                                Empezar Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-2xl">🐕</span>
                        <span className="text-xl font-black text-gray-900 tracking-tighter">DogWalk</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">© 2026 DogWalk. Todos los derechos reservados. Seguridad y confianza en cada paso.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
