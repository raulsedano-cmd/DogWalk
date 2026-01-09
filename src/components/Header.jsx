import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    const isWalker = user?.activeRole === 'WALKER';
    const linkColor = isWalker ? 'hover:text-walker-600' : 'hover:text-primary-600';

    const NavLinks = () => (
        <>
            {user.activeRole === 'OWNER' ? (
                <>
                    <Link to="/owner/dashboard" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0`}>
                        Solicitudes
                    </Link>
                    <Link to="/dogs" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0`}>
                        Mis Perros
                    </Link>
                </>
            ) : (
                <>
                    <Link to="/walker/dashboard" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0`}>
                        Ver Solicitudes
                    </Link>
                    <Link to="/payments" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors font-semibold py-2 md:py-0`}>
                        Pagos
                    </Link>
                </>
            )}

            {user.roles && user.roles.length > 1 && (
                <Link
                    to="/seleccionar-rol"
                    onClick={closeMenu}
                    className={`font-black py-2 md:py-0 hover:scale-105 transition-transform ${isWalker ? 'text-walker-600' : 'text-primary-600'
                        }`}
                >
                    🔄 Cambiar Modo
                </Link>
            )}

            <Link to="/my-walks" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0 text-sm md:text-base`}>
                Mis Paseos
            </Link>

            <Link to="/profile" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0 text-sm md:text-base`}>
                Perfil
            </Link>

            <Link to="/ayuda" onClick={closeMenu} className={`text-gray-700 ${linkColor} transition-colors py-2 md:py-0 text-sm md:text-base`}>
                Ayuda
            </Link>
        </>
    );

    return (
        <header className={`shadow-sm border-b sticky top-0 z-[100] transition-colors ${isWalker
                ? 'bg-gradient-to-r from-walker-50 to-white border-walker-200'
                : 'bg-white border-gray-200'
            }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3 z-10">
                        <span className="text-2xl">🐕</span>
                        <span className="text-xl font-bold text-primary-600">DogWalk</span>
                        {isAuthenticated && user && (
                            <span className={`hidden sm:inline-block text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${isWalker
                                    ? 'bg-walker-100 text-walker-800 border border-walker-300'
                                    : 'bg-primary-100 text-primary-800 border border-primary-300'
                                }`}>
                                {isWalker ? '🚶 Paseador' : '🏠 Dueño'}
                            </span>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    {isAuthenticated ? (
                        <div className="hidden md:flex items-center space-x-6">
                            <NavLinks />
                            <NotificationDropdown />
                            <button
                                onClick={logout}
                                className="text-gray-700 hover:text-red-600 transition-colors ml-4"
                            >
                                Salir
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="btn-primary">
                                Registrarse
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center space-x-4 md:hidden">
                        {isAuthenticated && <NotificationDropdown />}
                        <button
                            onClick={toggleMenu}
                            className="p-2 text-gray-600 focus:outline-none z-20"
                        >
                            <span className="text-2xl">{isMenuOpen ? '✕' : '☰'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 flex flex-col space-y-4 px-2 absolute top-16 left-0 right-0 bg-white shadow-xl animate-in slide-in-from-top duration-200">
                        {isAuthenticated ? (
                            <>
                                <NavLinks />
                                <button
                                    onClick={() => { logout(); closeMenu(); }}
                                    className="text-left py-2 text-red-600 font-bold"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={closeMenu} className="text-gray-700 hover:text-primary-600 transition-colors py-2">
                                    Iniciar Sesión
                                </Link>
                                <Link to="/register" onClick={closeMenu} className="btn-primary text-center">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
