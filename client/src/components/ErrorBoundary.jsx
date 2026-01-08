import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center">
                        <span className="text-6xl mb-4 block">⚠️</span>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal</h1>
                        <p className="text-gray-600 mb-6">
                            Ha ocurrido un error inesperado. Intenta recargar la página o volver al inicio.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-primary w-full"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
