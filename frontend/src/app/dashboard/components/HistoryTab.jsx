'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Receipt, User, MapPin, Phone, Calendar, Bike } from 'lucide-react';

export default function HistoryTab({ orders, parseAddressInfo }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const ordersPerPage = 20;

    // Βοηθητική συνάρτηση για τον υπολογισμό του συνόλου
    const getOrderTotal = (order) => {
        if (!order.items) return 0;
        return order.items.reduce((sum, item) => {
            const price = item.dailyMenu?.dish?.price || item.dish?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    // ΑΛΛΑΓΗ ΕΔΩ: Ταξινόμηση με βάση το ID (τα μεγαλύτερα/νεότερα ID πρώτα)
    const historyOrders = [...orders]
        .filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')
        .sort((a, b) => b.id - a.id);

    const currentHistoryOrders = historyOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
    const totalPages = Math.ceil(historyOrders.length / ordersPerPage) || 1;

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-6 relative">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-olive-100 shadow-sm">
                <h2 className="text-3xl font-black text-olive-900 uppercase">Ιστορικό</h2>
                <span className="font-bold text-olive-600 bg-olive-100 px-4 py-2 rounded-xl">Σελίδα {currentPage} / {totalPages}</span>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-olive-50 text-olive-800 text-xs font-black uppercase tracking-wider">
                        <tr><th className="p-5">ID</th><th className="p-5">Πελάτης</th><th className="p-5">Πιάτα</th><th className="p-5">Τύπος</th><th className="p-5 text-center">Σύνολο</th></tr>
                    </thead>
                    <tbody className="divide-y cursor-pointer">
                        {currentHistoryOrders.map(order => (
                            <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-olive-50 transition-colors">
                                <td className="p-5 font-black text-olive-400">#{order.id}</td>
                                <td className="p-5">
                                    <div className="font-bold text-olive-900">{order.customerName}</div>
                                    <div className="text-xs text-olive-500">{order.phone}</div>
                                </td>
                                <td className="p-5 text-sm">
                                    {order.items && order.items.map(i => (
                                        <div key={i.id}>{i.quantity}x {i.dailyMenu?.dish?.name || i.dish?.name}</div>
                                    ))}
                                </td>
                                <td className="p-5"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{order.orderType}</span></td>
                                <td className="p-5 text-center font-black text-olive-900">
                                    {getOrderTotal(order).toFixed(2)}€
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center items-center gap-6 pt-4">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-full bg-white border text-olive-900 disabled:opacity-30 hover:bg-olive-100"><ChevronLeft size={24} /></button>
                <span className="font-black text-olive-900">Σελίδα {currentPage}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-full bg-white border text-olive-900 disabled:opacity-30 hover:bg-olive-100"><ChevronRight size={24} /></button>
            </div>

            {/* --- MODAL ΛΕΠΤΟΜΕΡΕΙΩΝ ΠΑΡΑΓΓΕΛΙΑΣ --- */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-olive-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 bg-olive-50 border-b border-olive-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-olive-900 flex items-center gap-2"><Receipt size={24}/> Παραγγελία #{selectedOrder.id}</h2>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md mt-2 inline-block ${selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {selectedOrder.status === 'COMPLETED' ? 'ΟΛΟΚΛΗΡΩΘΗΚΕ' : 'ΑΚΥΡΩΘΗΚΕ'}
                                </span>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                            {/* Πελάτης */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-800"><User size={16} className="text-olive-500"/> {selectedOrder.customerName}</div>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-800"><Phone size={16} className="text-olive-500"/> <a href={`tel:${selectedOrder.phone}`} className="text-blue-600 hover:underline">{selectedOrder.phone}</a></div>
                                {selectedOrder.orderType === 'delivery' && (
                                    <div className="flex items-start gap-3 text-sm font-bold text-gray-800"><MapPin size={16} className="text-blue-500 mt-0.5"/> <span className="flex-1 text-blue-900 bg-blue-50 p-2 rounded-lg">{parseAddressInfo(selectedOrder.address).text}</span></div>
                                )}
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-800"><Calendar size={16} className="text-olive-500"/> {new Date(selectedOrder.createdAt).toLocaleString('el-GR')}</div>
                            </div>

                            {/* Προϊόντα */}
                            <div>
                                <h4 className="font-black text-olive-900 uppercase text-xs mb-3 tracking-widest border-b pb-2">Προϊοντα</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items && selectedOrder.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-start text-sm">
                                            <div className="font-bold text-gray-800">
                                                {item.quantity}x {item.dailyMenu?.dish?.name || item.dish?.name}
                                                {item.extras && <div className="text-[10px] text-olive-500 mt-1 uppercase">↳ {item.extras}</div>}
                                            </div>
                                            <span className="font-black text-olive-900">{( (item.dailyMenu?.dish?.price || item.dish?.price || 0) * item.quantity ).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Σημειώσεις */}
                            {selectedOrder.notes && (
                                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-sm">
                                    <span className="font-black text-yellow-800 block text-xs uppercase mb-1">Σημειωσεις:</span>
                                    <span className="font-bold text-yellow-900">{selectedOrder.notes}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-olive-900 text-white flex flex-col gap-2">
                            {/* Wolt Cost Display */}
                            {selectedOrder.woltDeliveryId && (
                                <div className="flex justify-between text-sm font-bold text-olive-300 border-b border-olive-700 pb-2 mb-2">
                                    <span className="flex items-center gap-2"><Bike size={16}/> Κόστος Wolt Drive:</span>
                                    <span>{selectedOrder.woltDeliveryCost ? selectedOrder.woltDeliveryCost.toFixed(2) : "0.00"}€</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-black">
                                <span>Σύνολο Πελάτη:</span>
                                <span>{getOrderTotal(selectedOrder).toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}