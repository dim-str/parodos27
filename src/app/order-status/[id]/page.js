'use client';

import { useEffect, useState, use } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, Bike, Utensils, AlertCircle, Sparkles, Check } from 'lucide-react';

export default function OrderStatusPage({ params }) {
    const { id } = use(params);
    const [orderInfo, setOrderInfo] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`);
                const myOrder = res.data.find(o => o.id.toString() === id);

                if (myOrder) {
                    setOrderInfo(myOrder);

                    if (myOrder.status === 'COMPLETED' || myOrder.status === 'CANCELLED') {
                        localStorage.removeItem('activeOrderId');
                        window.dispatchEvent(new Event('orderUpdated'));
                    }
                }
            } catch (err) { console.error(err); }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, [id]);

    // Animated Loading Screen
    if (!orderInfo) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-olive-50">
            <div className="w-16 h-16 border-4 border-olive-200 border-t-olive-900 rounded-full animate-spin mb-4"></div>
            <div className="font-black text-olive-400 animate-pulse tracking-widest uppercase text-sm">Εύρεση Παραγγελίας...</div>
        </div>
    );

    // Βελτιωμένα Χρώματα, Gradients και Animations
    const statusMap = {
        'PENDING': { step: 1, text: 'Αναμονή Αποδοχής', icon: <Clock size={40} />, color: 'text-gray-600', bg: 'bg-gradient-to-br from-gray-100 to-gray-200', shadow: 'shadow-gray-200/50', ring: '' },
        'ACCEPTED': { step: 2, text: 'Ετοιμάζεται', icon: <Utensils size={40} className="animate-pulse" />, color: 'text-orange-600', bg: 'bg-gradient-to-br from-orange-100 to-orange-200', shadow: 'shadow-orange-300/50', ring: 'animate-ping' },
        'ON_THE_WAY': { step: 3, text: orderInfo?.orderType === 'delivery' ? 'Στον Δρόμο' : 'Έτοιμο για Παραλαβή', icon: orderInfo?.orderType === 'delivery' ? <Bike size={40} className="animate-bounce" /> : <Sparkles size={40} className="animate-pulse"/>, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-100 to-blue-200', shadow: 'shadow-blue-300/50', ring: 'animate-pulse' },
        'COMPLETED': { step: 4, text: orderInfo?.orderType === 'delivery' ? 'Παραδόθηκε' : 'Παραλήφθηκε', icon: <CheckCircle size={44} />, color: 'text-green-600', bg: 'bg-gradient-to-br from-green-100 to-green-300', shadow: 'shadow-green-300/50', ring: '' },
        'CANCELLED': { step: -1, text: 'Ακυρώθηκε', icon: <AlertCircle size={40} />, color: 'text-red-600', bg: 'bg-gradient-to-br from-red-100 to-red-200', shadow: 'shadow-red-300/50', ring: '' }
    };

    const currentStatus = statusMap[orderInfo.status] || statusMap['PENDING'];

    return (
        <div className="min-h-screen bg-olive-50 flex items-center justify-center p-4 overflow-hidden relative">

            {/* Ambient Background Glow (Αλλάζει χρώμα ανάλογα με το status) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full opacity-40 blur-[100px] transition-colors duration-1000 ${currentStatus.bg.split(' ')[1]}`}></div>
                <div className={`absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full opacity-30 blur-[100px] transition-colors duration-1000 ${currentStatus.bg.split(' ')[1]}`}></div>
            </div>

            {/* Κεντρική Κάρτα */}
            <div className="bg-white/90 backdrop-blur-xl max-w-lg w-full rounded-[3rem] p-8 md:p-10 shadow-2xl border border-white/50 text-center relative z-10 transform transition-all duration-700 animate-fade-in hover:-translate-y-1">

                <div className="inline-block px-4 py-1.5 rounded-full bg-olive-50 text-[10px] font-black text-olive-400 uppercase tracking-[0.3em] mb-4 border border-olive-100">
                    Παραγγελια #{id}
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-olive-900 to-olive-600 mb-10">
                    {orderInfo.customerName.split(' [')[0]}
                </h2>

                {/* Main Status Icon with Animations */}
                <div className="relative w-36 h-36 mx-auto mb-8">
                    {/* Εξωτερικό δαχτυλίδι που κάνει "παλμό" */}
                    {currentStatus.ring && (
                        <div className={`absolute inset-0 rounded-full ${currentStatus.bg.split(' ')[1]} opacity-40 ${currentStatus.ring}`}></div>
                    )}
                    {/* Κεντρικός Κύκλος */}
                    <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${currentStatus.bg} ${currentStatus.color} ${currentStatus.shadow} transition-all duration-500 transform hover:scale-105`}>
                        {currentStatus.icon}
                    </div>
                </div>

                <h3 className={`text-2xl font-black mb-3 transition-colors duration-500 ${currentStatus.color}`}>
                    {currentStatus.text}
                </h3>

                {orderInfo.status === 'PREPARING' && orderInfo.estimatedReadyTime && (
                    <div className="inline-flex items-center gap-2 font-bold text-orange-700 mb-8 bg-orange-50 border border-orange-100 px-5 py-2.5 rounded-2xl shadow-sm animate-fade-in">
                        <Clock size={16} className="animate-spin-slow" />
                        Έτοιμο στις {new Date(orderInfo.estimatedReadyTime).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}

                {/* Progress Bar (Stepper) - Πιο ζωντανό */}
                {currentStatus.step > 0 && (
                    <div className="mt-12 px-2">
                        <div className="flex justify-between items-center relative">
                            {/* Γκρι γραμμή background */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-100 -z-10 rounded-full"></div>
                            {/* Γραμμή που γεμίζει με gradient */}
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-olive-400 to-olive-900 -z-10 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(currentStatus.step - 1) * 33.33}%` }}
                            ></div>

                            {[1, 2, 3, 4].map(step => {
                                const isActive = currentStatus.step >= step;
                                const isCurrent = currentStatus.step === step;
                                return (
                                    <div key={step} className="relative">
                                        <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-black text-sm transition-all duration-700 shadow-md ${
                                            isActive ? 'bg-olive-900 text-white scale-110' : 'bg-gray-100 text-gray-400 scale-100'
                                        } ${isCurrent ? 'ring-4 ring-olive-100' : ''}`}>
                                            {isActive ? <Check size={16} /> : step}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Ταμπελάκια κάτω από τις τελείες */}
                        <div className="flex justify-between mt-4">
                            <span className="text-[9px] font-black uppercase text-olive-400 tracking-wider w-10 text-center">Αποδοχη</span>
                            <span className="text-[9px] font-black uppercase text-olive-400 tracking-wider w-10 text-center">Κουζινα</span>
                            <span className="text-[9px] font-black uppercase text-olive-400 tracking-wider w-10 text-center">Διανομη</span>
                            <span className="text-[9px] font-black uppercase text-olive-400 tracking-wider w-10 text-center">Τελος</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}