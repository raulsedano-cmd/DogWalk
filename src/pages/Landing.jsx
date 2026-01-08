import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
                <div className="container mx-auto px-4 py-20 text-center text-white">
                    <div className="mb-8">
                        <span className="text-8xl">🐕</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        DogWalk
                    </h1>
                    <p className="text-xl md:text-2xl mb-12 text-primary-100">
                        Conecta con paseadores de perros confiables en tu zona
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/register?role=owner" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                            Soy Dueño de Perro
                        </Link>
                        <Link to="/register?role=walker" className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-400 transition-colors border-2 border-white">
                            Soy Paseador
                        </Link>
                    </div>
                    <div className="mt-8">
                        <Link to="/login" className="text-white hover:text-primary-100 underline">
                            ¿Ya tienes cuenta? Inicia sesión
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        ¿Cómo funciona?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="text-5xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold mb-2">Publica tu Solicitud</h3>
                            <p className="text-gray-600">
                                Dueños: describe tu perro, hora y zona preferida
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">💰</div>
                            <h3 className="text-xl font-semibold mb-2">Recibe Ofertas</h3>
                            <p className="text-gray-600">
                                Paseadores envían sus mejores precios y presentación
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">⭐</div>
                            <h3 className="text-xl font-semibold mb-2">Elige y Califica</h3>
                            <p className="text-gray-600">
                                Acepta la mejor oferta y deja una reseña al finalizar
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
