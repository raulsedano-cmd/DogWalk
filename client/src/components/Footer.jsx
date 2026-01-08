import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-400 mt-auto border-t border-gray-800">
            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-white font-black text-xl mb-1">DogWalk 🐕</h2>
                        <p className="text-xs max-w-xs">La plataforma de intermediación digital para conectar a los mejores paseadores con los vecinos más perrunos.</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
                        <Link to="/terminos-y-condiciones" className="hover:text-white transition-colors">Legal</Link>
                        <Link to="/ayuda" className="hover:text-white transition-colors">Ayuda y Reportes</Link>
                        <Link to="/verificar-paseador" className="hover:text-white transition-colors">Servicios</Link>
                    </div>

                    <div className="text-sm text-center md:text-right">
                        <p>© 2026 DogWalk Perú.</p>
                        <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Digital Intermediary Platform</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
