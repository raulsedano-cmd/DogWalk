import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                <header className="mb-8 border-b pb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Términos y Condiciones de Uso</h1>
                    <p className="text-gray-500 font-medium">Versión 1.0 – Enero 2026</p>
                </header>

                <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">1. Identificación del Titular</h2>
                        <p>
                            La plataforma digital <strong>DogWalk</strong> es operada por [Nombre de la Empresa/Persona], domiciliada en Lima, Perú. DogWalk pone a disposición una plataforma tecnológica que permite conectar a dueños de perros (OWNERS) con paseadores independientes (WALKERS).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">2. Naturaleza del Servicio: Intermediación Digital</h2>
                        <p>
                            DogWalk actúa exclusivamente como un <strong>intermediario tecnológico</strong>. La plataforma NO presta servicios de paseo de perros por sí misma, no emplea a los paseadores, ni controla la ejecución de los paseos.
                        </p>
                        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 italic">
                            "El contrato de servicio de paseo se celebra única y exclusivamente entre el OWNER y el WALKER. DogWalk no forma parte de dicha relación contractual."
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">3. Deslinde de Responsabilidad</h2>
                        <p>
                            Conforme a la legislación peruana vigente (Art. 1969 y ss. del Código Civil), DogWalk no será responsable por:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Lesiones personales a usuarios o terceros durante el paseo.</li>
                            <li>Ataques o mordidas del perro a personas, otros animales o propiedad privada.</li>
                            <li>Fuga, extravío, robo o pérdida del perro durante la prestación del servicio.</li>
                            <li>Daños materiales causados por el animal o el paseador.</li>
                            <li>Incumplimientos en los horarios o términos acordados entre las partes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">4. Obligaciones de los Usuarios</h2>
                        <h3 className="font-bold mb-2">Para el OWNER:</h3>
                        <p className="mb-4">
                            Debe declarar con veracidad el comportamiento de su perro (agresividad, ansiedad, salud). Es obligatorio el uso de correa y, en razas potencialmente peligrosas conforme a ley, el uso de bozal.
                        </p>
                        <h3 className="font-bold mb-2">Para el WALKER:</h3>
                        <p>
                            Debe actuar con la diligencia debida de un buen padre de familia (Art. 1314 Código Civil), garantizando el bienestar del animal y cumpliendo las normas municipales de limpieza y seguridad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">5. Verificación de Identidad</h2>
                        <p>
                            Para seguridad de la comunidad, los WALKERS deben someterse a un proceso de verificación de identidad mediante la presentación de su DNI. DogWalk se reserva el derecho de rechazar o suspender cuentas que no cumplan con los estándares de seguridad.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-blue-800 mb-3">6. Ley Aplicable y Jurisdicción</h2>
                        <p>
                            Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta ante los jueces y tribunales del Distrito Judicial de Lima Cercado.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        Al usar DogWalk, confirmas que has leído y aceptas estos términos.
                    </p>
                    <Link to="/" className="btn-primary">
                        Entendido
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
