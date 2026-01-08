import { useState, useEffect } from 'react';
import api from '../services/api';

const Payments = () => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [filters, setFilters] = useState({
        onlyPending: false,
        from: '',
        to: ''
    });

    useEffect(() => {
        loadPayments();
    }, [filters]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.onlyPending) params.append('onlyPending', 'true');
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);

            const response = await api.get(`/walker/payments?${params.toString()}`);
            setPayments(response.data.items);
            setSummary(response.data.summary);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !summary) return <div className="text-center py-20 animate-pulse font-black text-primary-600">Calculando tus ganancias... 💰</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-gray-800 mb-2">Mi Billetera</h1>
                <p className="text-gray-500 font-medium tracking-tight uppercase text-xs">Control de ingresos y comisiones de la plataforma</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[35px] shadow-xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ganancia Total (Bruta)</p>
                        <p className="text-3xl font-black text-gray-800">S/ {summary.totalEarningsGross.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-[35px] shadow-xl border border-green-100">
                        <p className="text-[10px] font-black text-green-600 uppercase mb-2">Pagado por Dueños</p>
                        <p className="text-3xl font-black text-green-700">S/ {summary.totalPaidByOwners.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-[35px] shadow-xl border border-orange-100">
                        <p className="text-[10px] font-black text-orange-600 uppercase mb-2">Pendiente Cobro</p>
                        <p className="text-3xl font-black text-orange-700">S/ {summary.totalUnpaidByOwners.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-[35px] shadow-xl border border-red-100">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-2">Comisión App (Pendiente)</p>
                        <p className="text-3xl font-black text-red-700">S/ {summary.totalPlatformFeesDue.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-gray-50 p-6 rounded-[35px] mb-8 flex flex-col md:flex-row gap-6 items-end border border-gray-100">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Desde</label>
                    <input
                        type="date"
                        className="bg-white border-transparent rounded-2xl p-3 text-sm font-bold shadow-sm focus:ring-primary-500"
                        value={filters.from}
                        onChange={e => setFilters({ ...filters, from: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Hasta</label>
                    <input
                        type="date"
                        className="bg-white border-transparent rounded-2xl p-3 text-sm font-bold shadow-sm focus:ring-primary-500"
                        value={filters.to}
                        onChange={e => setFilters({ ...filters, to: e.target.value })}
                    />
                </div>
                <div className="flex-1 flex items-center gap-4 h-[45px]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-6 h-6 rounded-lg border-2 border-primary-300 text-primary-600 focus:ring-primary-400"
                            checked={filters.onlyPending}
                            onChange={e => setFilters({ ...filters, onlyPending: e.target.checked })}
                        />
                        <span className="text-sm font-black text-gray-700 group-hover:text-primary-600 transition-colors">Solo pendientes</span>
                    </label>
                </div>
                <button
                    onClick={() => setFilters({ onlyPending: false, from: '', to: '' })}
                    className="text-xs font-black text-primary-600 hover:underline uppercase"
                >
                    Limpiar Filtros
                </button>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-100 border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha / Perro</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dueño</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Bruto</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado Pago</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Comisión App</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado Com.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <p className="text-gray-400 font-bold italic">No se encontraron registros de paseos completados.</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.map(item => (
                                    <tr key={item.id} className="hover:bg-primary-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-gray-400 text-[10px] font-black leading-none mb-1">
                                                {new Date(item.actualEndTime).toLocaleDateString()}
                                            </p>
                                            <p className="font-black text-gray-800">{item.walkRequest.dog.name}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-700">{item.walkRequest.owner.firstName} {item.walkRequest.owner.lastName}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-gray-800">S/ {item.agreedPrice.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-red-500">- S/ {item.platformFeeAmount.toFixed(2)}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.platformFeeStatus === 'SETTLED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.platformFeeStatus === 'SETTLED' ? 'LIQUIDADO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {payments.length === 0 ? (
                        <div className="px-8 py-20 text-center">
                            <p className="text-gray-400 font-bold italic">No se encontraron registros.</p>
                        </div>
                    ) : (
                        payments.map(item => (
                            <div key={item.id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-black uppercase">{new Date(item.actualEndTime).toLocaleDateString()}</p>
                                        <p className="font-black text-lg text-gray-800">{item.walkRequest.dog.name}</p>
                                        <p className="text-sm font-bold text-gray-500">{item.walkRequest.owner.firstName} {item.walkRequest.owner.lastName}</p>
                                    </div>
                                    <p className="text-xl font-black text-gray-800">S/ {item.agreedPrice.toFixed(2)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Pago Dueño</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                                        </span>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                                        <p className="text-[8px] font-black text-red-400 uppercase mb-1">Comisión App</p>
                                        <p className="text-xs font-black text-red-600 leading-none">-S/ {item.platformFeeAmount.toFixed(2)}</p>
                                        <span className="text-[9px] font-black text-red-400 uppercase">{item.platformFeeStatus === 'SETTLED' ? 'LIQUIDADO' : 'PENDIENTE'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 bg-primary-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-black mb-2">¿Cómo funcionan los pagos?</h3>
                        <p className="text-primary-200 text-sm font-medium leading-relaxed">
                            DogWalk es un intermediario digital. Los cobros se realizan directamente con el dueño (Efectivo o Transferencia). Una vez recibas tu pago, el dueño debe marcar el paseo como pagado para actualizar tu balance aquí.
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Comisión de la Plataforma</p>
                        <p className="text-5xl font-black">15%</p>
                        <p className="text-xs text-primary-400 font-bold mt-2">Deducidos por servicio tecnológico</p>
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-800 rounded-full opacity-50 blur-3xl"></div>
            </div>
        </div>
    );
};

export default Payments;
