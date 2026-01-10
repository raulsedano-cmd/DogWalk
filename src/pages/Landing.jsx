import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen bg-[#FDFEFE] selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
            {/* Navigation Layer */}
            <nav className="fixed top-0 inset-x-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6">
                <div className="container mx-auto h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-primary-600 rounded-[12px] flex items-center justify-center text-xl shadow-lg shadow-primary-500/20 group-hover:rotate-12 transition-transform">🐕</div>
                        <span className="text-xl font-black text-navy-900 tracking-tighter">DogWalk <span className="text-primary-600">Pro</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        <a href="#como-funciona" className="hover:text-primary-600 transition-colors">Sistema</a>
                        <a href="#beneficios" className="hover:text-primary-600 transition-colors">Seguridad</a>
                        <Link to="/login" className="bg-navy-900 text-white px-6 py-2.5 rounded-[12px] hover:bg-black transition-all shadow-lg text-[11px]">Acceso</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Scaled Down */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2.5 bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm animate-fadeIn">
                            <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-600"></span>
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Red Lider en Seguridad Canina</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-navy-900 leading-[0.9] tracking-tighter">
                            Bienestar real para <br />
                            <span className="text-primary-600">tu mejor amigo.</span>
                        </h1>

                        <p className="text-base lg:text-lg text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
                            Logística de élite para paseos certificados. <br className="hidden lg:block" />
                            <span className="text-navy-900 font-bold">Monitoreo GPS, Reportes Tácticos y Seguridad.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link to="/register?role=owner" className="btn-primary">
                                Encontrar Paseador 🐕
                            </Link>
                            <Link to="/register?role=walker" className="btn-outline">
                                Ser Paseador Pro ⚡
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Methodology - Refined Scales */}
            <section id="como-funciona" className="py-24 bg-white relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6 text-center lg:text-left">
                        <div className="space-y-3">
                            <h2 className="text-[9px] font-black text-primary-600 uppercase tracking-[0.4em]">Arquitectura Operativa</h2>
                            <p className="text-4xl lg:text-5xl font-black text-navy-900 leading-none">Estándar de Oro.</p>
                        </div>
                        <p className="max-w-xs text-slate-400 font-bold leading-relaxed uppercase text-[9px] tracking-widest">Tecnología diseñada para su tranquilidad y tu tiempo.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: '📝', title: 'Solicitud Smart', desc: 'Alertas instantáneas a la red de paseadores certificados en tu zona operativa.', bg: 'bg-primary-50/30' },
                            { icon: '💎', title: 'Selección de Élite', desc: 'Compara perfiles con verificación de identidad y ratings de misiones anteriores.', bg: 'bg-indigo-50/30' },
                            { icon: '🛰️', title: 'Misión en Vivo', desc: 'Seguimiento satelital en tiempo real con reportes de salud y fotos al concluir.', bg: 'bg-emerald-50/30' }
                        ].map((c, i) => (
                            <div key={i} className="card-premium group hover:border-primary-100 transition-all p-8">
                                <div className={`w-16 h-16 ${c.bg} rounded-[20px] flex items-center justify-center text-3xl mb-8 group-hover:scale-105 transition-transform`}>{c.icon}</div>
                                <h3 className="text-2xl font-black text-navy-900 mb-4">{c.title}</h3>
                                <p className="text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-wide opacity-80">{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - Scaled Down */}
            <section className="py-24 container mx-auto px-6">
                <div className="bg-navy-900 rounded-[40px] p-12 lg:p-24 text-center text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600 rounded-full blur-[120px] opacity-15 -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                        <h2 className="text-4xl lg:text-6xl font-black leading-[1] tracking-tighter">¿Tu mascota está lista para la misión?</h2>
                        <p className="text-lg text-slate-400 font-bold max-w-xl mx-auto">Únete a la mayor red de seguridad canina de la región. <br /><span className="text-white">Registro gratuito hoy.</span></p>
                        <div className="pt-4">
                            <Link to="/register?role=owner" className="inline-flex btn-primary !bg-white !text-navy-900 !border-0 hover:!bg-primary-50 px-10 text-lg">
                                Comenzar ahora 🚀
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer - Scaled Down */}
            <footer className="py-16 border-t border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-navy-900 rounded-[10px] flex items-center justify-center text-lg shadow-lg">🐕</div>
                            <span className="text-lg font-black text-navy-900 tracking-tighter">DogWalk <span className="text-primary-600">Pro</span></span>
                        </div>
                        <div className="flex gap-10 font-bold text-[9px] text-slate-400 uppercase tracking-[0.2em]">
                            <a href="#" className="hover:text-navy-900 transition-colors">Normatividad</a>
                            <a href="#" className="hover:text-navy-900 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-navy-900 transition-colors">Soporte</a>
                        </div>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest text-center">© 2026 Operaciones DogWalk Inc.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
