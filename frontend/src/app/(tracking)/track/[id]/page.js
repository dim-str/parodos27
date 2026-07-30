'use client';
import { useEffect, useState, use } from 'react';
import axios from 'axios';
import ProgressBar from './_components/ProgressBar';
import StatusHero from './_components/StatusHero'; 

export default function OrderStatusPage({ params }) {
    const { id } = use(params);
    const [orderInfo, setOrderInfo] = useState(null);

    useEffect(() => {
        if (!id || id === 'undefined') return;

        const fetchStatus = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/orders/track/${id}`);
                const myOrder = res.data;

                if (myOrder) {
                    setOrderInfo(myOrder);

                    if (myOrder.status === 'COMPLETED' || myOrder.status === 'CANCELLED') {
                        localStorage.removeItem('activeOrderId');
                        window.dispatchEvent(new Event('orderUpdated'));
                    }
                }
            } catch (err) {
                console.error("Η παραγγελία δεν βρέθηκε:", err);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, [id]);

    if (!orderInfo) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">
            Φόρτωση παραγγελίας...
        </div>
    );

    const getStepFromStatus = (status) => {
        if (status === 'PENDING') return 1;
        if (status === 'ACCEPTED' || status === 'PREPARING') return 2;
        if (status === 'ON_THE_WAY') return 3;
        if (status === 'COMPLETED') return 4;
        return 0; 
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 md:pt-24 p-4 font-sans">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-gray-100 shadow-sm text-center">

                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 bg-gray-50 inline-block px-3 py-1 rounded-lg">
                    ΚΩΔΙΚΟΣ: {id}
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2">
                    {orderInfo.customerName.split(' [')[0]}
                </h2>

                <StatusHero
                    status={orderInfo.status}
                    orderType={orderInfo.orderType}
                    estimatedReadyTime={orderInfo.estimatedReadyTime}
                />

                {orderInfo.status !== 'CANCELLED' && (
                    <ProgressBar currentStep={getStepFromStatus(orderInfo.status)} orderType={orderInfo.orderType} />
                )}

                {/* --- LIVE WOLT TRACKING MAP --- */}
                {orderInfo.woltTrackingUrl && orderInfo.status !== 'COMPLETED' && orderInfo.status !== 'CANCELLED' && (
                    <div className="mt-8 w-full animate-fade-in flex flex-col items-center">
                        <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-[2rem] overflow-hidden shadow-inner relative" style={{ height: '350px' }}>
                            <iframe 
                                src={orderInfo.woltTrackingUrl} 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                allow="geolocation"
                                className="absolute inset-0"
                            ></iframe>
                        </div>
                        
                        <a 
                            href={orderInfo.woltTrackingUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-sm transition-all shadow-md active:scale-95"
                        >
                            Προβολή σε πλήρη οθόνη
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}