'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { RefreshCcw, Volume2, VolumeX, Bell, Bike, Trash2, Printer, Timer, AlertCircle, X, Settings } from 'lucide-react';

export default function LiveOrdersTab({ 
    orders, fetchOrders, loadingOrders, setLoadingOrders, storeSettings, 
    soundEnabled, setSoundEnabled, acceptingGroup, setAcceptingGroup, 
    rejectingGroup, setRejectingGroup, prepTime, setPrepTime, now, authToken,
    parseAddressInfo, getCleanNotes, getTargetTime, handlePrint
}) {
    const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
        const storeId = storeSettings?.store?.id || storeSettings?.id; 
        if (!storeId) return;

        const socketUrl = `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/ws-orders`;

        const socket = new SockJS(socketUrl);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: (str) => console.log('⚙️ STOMP Debug: ', str), 
            onConnect: () => {
                stompClient.subscribe(`/topic/orders/${storeId}`, (message) => {
                    fetchOrders(); 

                    if (soundEnabled) {
                        try { new Audio('/notification.mp3').play(); } catch(e) {}
                    }
                });
            },
            onStompError: (frame) => {
                console.error("🔴 Σφάλμα Stomp:", frame.headers['message']);
            }
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [storeSettings, soundEnabled]);

    const pendingOrders = orders.filter(o => o.status === 'PENDING' && o.items && o.items.length > 0);
    const acceptedOrders = orders.filter(o => (o.status === 'ACCEPTED' || o.status === 'ON_THE_WAY') && o.items && o.items.length > 0);

    const confirmAcceptance = async () => {
        if (!acceptingGroup) return;
        const targetTimeMs = Date.now() + (prepTime * 60000);
        const estimatedReadyTime = new Date(targetTimeMs).toISOString();
        try {
            const updatedOrder = { ...acceptingGroup, status: 'ACCEPTED', estimatedReadyTime };
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${acceptingGroup.id}`, updatedOrder, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            toast.success("Η παραγγελία έγινε αποδεκτή!");
            setAcceptingGroup(null);
            fetchOrders();
        } catch (e) {
            toast.error("Σφάλμα στην αποδοχή!");
        }
    };

    return (
        <div className="animate-fade-in flex flex-col h-full">
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-olive-100 mb-6 shrink-0">
                <h2 className="text-2xl font-black text-olive-900 uppercase">Live Παραγγελίες</h2>
                <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm ${storeSettings.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {storeSettings.open ? '🟢 ΑΝΟΙΧΤΟ' : '🔴 ΚΛΕΙΣΤΟ'}
                </span>
                <div className="flex gap-3">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-olive-100 text-olive-700' : 'bg-red-50 text-red-400'}`}>
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button onClick={() => { setLoadingOrders(true); fetchOrders(); }} className="flex items-center gap-2 bg-olive-100 text-olive-700 px-4 py-2 rounded-xl font-bold">
                        <RefreshCcw size={18} className={loadingOrders ? "animate-spin" : ""} /> Ανανέωση
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* ΑΡΙΣΤΕΡΑ: ΚΟΥΖΙΝΑ */}
                <div className="flex flex-col bg-gray-50/80 rounded-[2rem] border border-gray-200 overflow-hidden shadow-inner">
                    <div className="p-5 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
                        <h2 className="font-black uppercase tracking-widest text-gray-800 flex items-center gap-3 text-lg">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                            Κουζινα
                        </h2>
                        <div className="flex gap-2">
                            {pendingOrders.length > 0 && (
                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black shadow-sm animate-pulse border border-red-200">
                                    {pendingOrders.length} ΝΕΕΣ
                                </span>
                            )}
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                                {acceptedOrders.filter(o => o.status === 'ACCEPTED').length} ΕΤΟΙΜΑΖΟΝΤΑΙ
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {pendingOrders.map(order => {
                            const hasComments = order.items && order.items.some(i => i.extras && (i.extras.includes('ΣΧΟΛΙΑ') || i.extras.includes('SOS')));
                            return (
                                <div key={order.id} className={`p-5 rounded-2xl shadow-md border-2 bg-white flex flex-col ${hasComments ? 'border-red-500 bg-red-50/30' : 'border-red-400'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-black text-lg text-olive-900">{order.customerName}</h3>
                                            <p className="text-olive-600 font-bold text-xs">📞 {order.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-red-600">#{order.id}</span>
                                            <div className={`text-[10px] block font-black uppercase mt-1 px-2 py-1 rounded-md ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {order.orderType === 'delivery' ? 'DELIVERY' : 'ΠΑΡΑΛΑΒΗ'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`mb-3 p-3 rounded-xl space-y-2 text-sm border ${hasComments ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                        {order.items && order.items.map(item => (
                                            <div key={item.id} className="font-bold text-gray-800">
                                                <div className="flex items-center gap-1">
                                                    {item.quantity}x {item.dish?.name}
                                                </div>
                                                {item.dish?.isCombo && item.dish?.comboItems && (
                                                    <div className="mt-1 pl-4 border-l-2 border-orange-200">
                                                        {item.dish.comboItems.map((ci, idx) => (
                                                            <div key={`ci-${idx}`} className="text-xs text-gray-500 font-medium">
                                                                • {ci.quantity}x {ci.dish?.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.extras && <div className="text-xs text-red-600 mt-1 pl-4 uppercase">↳ {item.extras}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-auto">
                                        <button onClick={() => setAcceptingGroup(order)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-black active:scale-95 text-sm uppercase">Αποδοχη</button>
                                        <button onClick={() => setRejectingGroup(order)} className="px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            );
                        })}

                        {acceptedOrders.filter(o => o.status === 'ACCEPTED').map(order => {
                            const targetMs = order.estimatedReadyTime ? new Date(order.estimatedReadyTime).getTime() : null;
                            const remainingMins = targetMs ? Math.ceil((targetMs - now) / 60000) : null;
                            const isLate = remainingMins !== null && remainingMins < 0;
                            const isWarning = remainingMins !== null && remainingMins <= 3 && remainingMins >= 0;

                            return (
                                <div key={order.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col relative transition-all ${isWarning ? 'bg-yellow-50/50 border-yellow-400' : 'bg-white border-orange-300'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        <div className={`flex-1 text-center font-black py-2 rounded-xl text-sm border shadow-inner ${remainingMins === null ? 'bg-gray-50 text-gray-500 border-gray-200' : isLate ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : isWarning ? 'bg-yellow-100 border-yellow-500 text-yellow-700 animate-pulse' : 'bg-orange-50 border-orange-300 text-orange-600'}`}>
                                            {remainingMins === null ? '⏱️ Ορίστε Χρόνο' : isLate ? `⚠️ ΚΑΘΥΣΤΕΡΗΣΗ: ${Math.abs(remainingMins)}'` : isWarning ? `🔥 ΒΙΑΣΤΕΙΤΕ: ${remainingMins}'` : `⏱️ Έτοιμο σε ${remainingMins}'`}
                                        </div>
                                        <button 
                                            disabled={remainingMins <= 5}
                                            onClick={async () => {
                                                const baseTime = targetMs || Date.now();
                                                const newTime = new Date(baseTime + 5 * 60000).toISOString();
                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}`, { ...order, estimatedReadyTime: newTime }, { headers: { Authorization: `Bearer ${authToken}` }});
                                                fetchOrders();
                                            }} 
                                            className={`px-3 py-2 rounded-lg font-black text-xs shadow-sm border ${remainingMins <= 5 ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                                        >
                                            +5'
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-lg text-olive-900">{order.customerName}</h3>
                                        <span className="text-lg font-black text-orange-600">#{order.id}</span>
                                    </div>
                                    <div className="mb-4 p-3 rounded-xl space-y-1 text-sm border bg-orange-50 border-orange-100">
                                        {order.items && order.items.map(item => (
                                            <div key={item.id} className="font-bold text-olive-900">
                                                {item.quantity}x {item.dish?.name}
                                                {item.dish?.isCombo && item.dish?.comboItems && (
                                                    <div className="mt-1 pl-4 border-l-2 border-orange-200">
                                                        {item.dish.comboItems.map((ci, idx) => (
                                                            <div key={`ci-${idx}`} className="text-xs text-gray-500 font-medium">
                                                                • {ci.quantity}x {ci.dish?.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.extras && <div className="text-xs text-red-600 mt-0.5 pl-4 uppercase">↳ {item.extras}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                                        {order.orderType === 'delivery' ? (
                                            <button onClick={async () => {
                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}`, { ...order, status: 'ON_THE_WAY' }, { headers: { Authorization: `Bearer ${authToken}` }});
                                                toast.success("Μεταφέρθηκε στη Διανομή!"); fetchOrders();
                                            }} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-blue-600">
                                                ➔ ΣΤΗ ΔΙΑΝΟΜΗ
                                            </button>
                                        ) : (
                                            <button onClick={async () => {
                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}`, { ...order, status: 'COMPLETED' }, { headers: { Authorization: `Bearer ${authToken}` }});
                                                toast.success("Ολοκληρώθηκε!"); fetchOrders();
                                            }} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-green-600">
                                                ✅ ΕΤΟΙΜΟ (TAKEAWAY)
                                            </button>
                                        )}
                                        <button onClick={() => handlePrint(order)} className="px-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Printer size={18} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ΔΕΞΙΑ: ΔΙΑΝΟΜΗ (ΜΟΝΟ ΓΙΑ DELIVERY) */}
                <div className="flex flex-col bg-blue-50/30 rounded-[2rem] border border-blue-100 overflow-hidden shadow-inner">
                    <div className="p-5 bg-white border-b border-blue-100 flex justify-between items-center shrink-0">
                        <h2 className="font-black uppercase tracking-widest text-blue-900 flex items-center gap-3 text-lg">
                            <Bike size={20} className="text-blue-500" /> Διανομη
                        </h2>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black">
                            {acceptedOrders.filter(o => o.status === 'ON_THE_WAY').length} DELIVERY
                        </span>
                    </div>

                    <div className="w-full overflow-y-auto p-4 space-y-4">
                        {acceptedOrders.filter(o => o.status === 'ON_THE_WAY' && o.orderType === 'delivery').map(order => {
                            const addressInfo = parseAddressInfo(order.address);
                            return (
                                <div key={order.id} className="p-5 rounded-2xl shadow-sm border border-blue-200 bg-white flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-black text-lg text-olive-900">{order.customerName}</h3>
                                            <p className="text-olive-600 font-bold text-xs">📞 {order.phone}</p>
                                        </div>
                                        <span className="text-lg font-black text-blue-600">#{order.id}</span>
                                    </div>
                                    {addressInfo.text && (
                                        <div className="mb-4 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                                            <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Διευθυνση:</div>
                                            <div className="font-bold text-sm text-blue-900 mb-2">{addressInfo.text}</div>
                                        </div>
                                    )}
                                    
                                    {order.woltDeliveryId ? (
                                        <div className="mt-auto pt-3 border-t border-blue-100 flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-full text-center">
                                                Wolt: {order.woltDeliveryStatus === 'created' ? 'Αναζητηση...' : order.woltDeliveryStatus === 'pickup_done' ? 'Καθ\' οδον' : order.woltDeliveryStatus}
                                            </span>
                                            
                                            <div className="flex w-full gap-2 mt-1">
                                                {order.woltTrackingUrl && (
                                                    <a href={order.woltTrackingUrl} target="_blank" rel="noreferrer" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black py-2.5 rounded-xl transition-colors flex justify-center items-center shadow-sm">
                                                        📍 Live Χάρτης
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={async () => {
                                                        if(window.confirm('Σίγουρα θέλετε να ακυρώσετε τον διανομέα της Wolt;')) {
                                                            const toastId = toast.loading("Ακύρωση διανομέα...");
                                                            try {
                                                                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/cancel-wolt`, { headers: { Authorization: `Bearer ${authToken}` } });
                                                                toast.success("Ο διανομέας ακυρώθηκε!", { id: toastId });
                                                                fetchOrders();
                                                            } catch (error) {
                                                                toast.error("Σφάλμα κατά την ακύρωση.", { id: toastId });
                                                            }
                                                        }
                                                    }} 
                                                    className="px-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 text-xs font-black py-2.5 rounded-xl transition-colors flex justify-center items-center border border-red-100 hover:border-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-auto pt-3 border-t border-blue-100 flex flex-col gap-2">
                                            <button 
                                                onClick={async () => {
                                                    const toastId = toast.loading("Κλήση διανομέα Wolt...");
                                                    try {
                                                        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/call-wolt`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
                                                        toast.success("Ειδοποιήθηκε η Wolt!", { id: toastId });
                                                        fetchOrders();
                                                    } catch (error) {
                                                        toast.error("Σφάλμα σύνδεσης με Wolt.", { id: toastId });
                                                    }
                                                }}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-xs py-3 rounded-xl transition-all uppercase flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <Bike size={16} /> Κληση Διανομεα Wolt
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {acceptingGroup && (
                <div className="fixed inset-0 bg-olive-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col items-center">
                        <Timer size={48} className="text-red-500 mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-olive-900 mb-6 text-center">Χρόνος Προετοιμασίας</h2>
                        <div className="grid grid-cols-3 gap-3 w-full mb-8">
                            {[15, 30, 45, 60].map(time => (
                                <button key={time} onClick={() => setPrepTime(time)} className={`py-4 rounded-xl font-black text-lg ${prepTime === time ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white border-olive-200 text-olive-600'}`}>{time}&apos;</button>
                            ))}
                            <div className="col-span-2 flex items-center gap-2 border-2 rounded-xl px-4 bg-white">
                                <input type="number" value={prepTime} onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)} className="w-full font-black text-lg outline-none text-center" />
                                <span className="font-bold text-olive-400">λεπτά</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setAcceptingGroup(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button onClick={confirmAcceptance} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl">ΕΠΙΒΕΒΑΙΩΣΗ</button>
                        </div>
                    </div>
                </div>
            )}

            {rejectingGroup && (
                <div className="fixed inset-0 bg-olive-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col items-center text-center">
                        <AlertCircle size={48} className="text-red-500 mb-4" />
                        <h2 className="text-2xl font-black text-olive-900 mb-2">Απόρριψη Παραγγελίας</h2>
                        <p className="text-olive-500 font-bold text-sm mb-6">Επιλέξτε τον λόγο απόρριψης για την παραγγελία #{rejectingGroup.id}.</p>
                        <div className="w-full space-y-3 mb-6">
                            {['WORKLOAD', 'STOCK', 'CLOSED'].map((reason, i) => (
                                <button key={reason} onClick={() => setRejectReason(reason)} className={`w-full p-4 rounded-xl font-black border-2 ${rejectReason === reason ? 'border-red-500 bg-red-50 text-red-700' : 'border-olive-100 text-olive-600'}`}>
                                    {i+1}. {reason === 'WORKLOAD' ? 'Φόρτος Εργασίας' : reason === 'STOCK' ? 'Έλλειψη Αποθέματος' : 'Το κατάστημα έκλεισε'}
                                </button>
                            ))}
                        </div>
                        {rejectReason === 'STOCK' && (
                            <div className="w-full bg-orange-50 p-4 rounded-xl mb-6 border border-orange-200">
                                <a href={`tel:${rejectingGroup.phone}`} className="flex items-center justify-center gap-2 bg-orange-500 text-white p-3 rounded-lg font-black">
                                    📞 Κλήση Πελάτη ({rejectingGroup.phone})
                                </a>
                            </div>
                        )}
                        <div className="flex gap-3 w-full border-t pt-6">
                            <button onClick={() => { setRejectingGroup(null); setRejectReason(''); }} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button disabled={!rejectReason} onClick={async () => {
                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${rejectingGroup.id}`, { ...rejectingGroup, status: 'CANCELLED' }, { headers: { Authorization: `Bearer ${authToken}` }});
                                toast.success("Η παραγγελία απορρίφθηκε.");
                                setRejectingGroup(null); setRejectReason(''); fetchOrders();
                            }} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl disabled:opacity-50">ΟΡΙΣΤΙΚΗ ΑΠΟΡΡΙΨΗ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}