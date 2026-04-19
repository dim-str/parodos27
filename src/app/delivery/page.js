// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
/* global process */
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bike, Phone, MapPin, CheckCircle, RefreshCcw, Navigation, Lock, X } from 'lucide-react';
import { setupAxiosAuth } from '@/lib/setupAxiosAuth';

setupAxiosAuth();

export default function DeliveryApp() {
    // --- STATE MANAGEMENT ---
    const [authToken, setAuthToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- CHECK AUTH ΣΤΗΝ ΑΡΧΗ ---
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/auth/check');
                if (res.data.authenticated) {
                    setAuthToken(res.data.token || '');
                    if (res.data.token) {
                        localStorage.setItem('admin_jwt', res.data.token);
                    }
                    setIsAuthenticated(true);
                }
            } catch (e) {
                setIsAuthenticated(false);
                setLoading(false);
            }
        };
        void checkAuth();
    }, []);

    // --- FETCH ΣΕ ΠΡΑΓΜΑΤΙΚΟ ΧΡΟΝΟ (ΜΟΝΟ ΑΝ ΕΙΝΑΙ LOGGED IN) ---
    const fetchOrders = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Σφάλμα φόρτωσης παραγγελιών");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders, isAuthenticated]);


    // --- LOGIN / LOGOUT HANDLERS ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Χρησιμοποιούμε το ίδιο endpoint με το Admin
            const res = await axios.post('/api/auth/login', { password: passwordInput });
            if (res.data.success) {
                setAuthToken(res.data.token || '');
                if (res.data.token) {
                    localStorage.setItem('admin_jwt', res.data.token);
                }
                setIsAuthenticated(true);
                toast.success("Επιτυχής Σύνδεση!");
            }
        } catch (error) {
            console.error("Σφάλμα σύνδεσης:", error);
            toast.error("Λάθος κωδικός!");
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout');
            setAuthToken('');
            localStorage.removeItem('admin_jwt');
            setIsAuthenticated(false);
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
    };


    // --- ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ---
    const parseAddressInfo = (fullAddress) => {
        if (!fullAddress) return { text: '', link: null };
        const parts = fullAddress.split('| GPS:');
        return {
            text: parts[0] ? parts[0].trim() : '',
            link: parts[1] ? parts[1].trim() : null
        };
    };

    const groupOrders = (ordersList) => {
        const groups = ordersList.reduce((acc, order) => {
            const timeMatch = order.customerName?.match(/\[(.*?)]/);
            const timeStr = timeMatch ? timeMatch[1] : order.id;
            const key = `${order.phone || 'unknown'}_${timeStr}_${order.orderType}`;

            if (!acc[key]) {
                acc[key] = {
                    id: order.id,
                    customerName: order.customerName?.split(' [')[0] || 'Άγνωστος',
                    phone: order.phone,
                    orderType: order.orderType,
                    address: order.address,
                    items: [], ids: [], totalAmount: 0
                };
            }
            acc[key].items.push(order);
            acc[key].ids.push(order.id);
            const price = order.dailyMenu?.dish?.price || order.dish?.price || 0;
            acc[key].totalAmount += price * order.quantity;
            return acc;
        }, {});
        return Object.values(groups).sort((a, b) => a.id - b.id);
    };

    const onTheWayOrders = groupOrders(orders.filter(o => o.status === 'ON_THE_WAY'));

    // --- ΟΛΟΚΛΗΡΩΣΗ ΠΑΡΑΓΓΕΛΙΑΣ ---
    const completeDelivery = async (group) => {
        if (!window.confirm(`Σίγουρα παραδόθηκε η παραγγελία του/της ${group.customerName};`)) return;

        try {
            await Promise.all(group.ids.map(id => {
                const item = group.items.find(i => i.id === id);
                return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
                    ...item,
                    status: 'COMPLETED'
                }, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
            }));
            toast.success("Η παραγγελία παραδόθηκε!", { icon: '✅' });
            fetchOrders();
        } catch (e) {
            toast.error("Σφάλμα κατά την παράδοση!");
        }
    };


    // --- UI RENDERING: ΟΘΟΝΗ LOGIN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm flex flex-col items-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Bike size={40} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Delivery App</h2>
                    <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">Εισοδος Διανομεα</p>

                    <div className="w-full relative mb-6">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Κωδικός Πρόσβασης"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center font-black text-lg outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest shadow-lg">
                        Συνδεση
                    </button>
                </form>
            </div>
        );
    }

    // --- UI RENDERING: ΚΥΡΙΩΣ ΕΦΑΡΜΟΓΗ ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans pb-24">
            {/* --- HEADER --- */}
            <div className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Bike size={24} className="animate-bounce" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl leading-tight tracking-wide">Διανομέας</h1>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                            {onTheWayOrders.length} Σε αναμονή
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setLoading(true); fetchOrders(); }} className="p-3 bg-blue-700 rounded-xl hover:bg-blue-800 transition-colors active:scale-95">
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={handleLogout} className="p-3 bg-red-500 rounded-xl hover:bg-red-600 transition-colors active:scale-95">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* --- ΚΥΡΙΩΣ ΟΘΟΝΗ (ΛΙΣΤΑ ΠΑΡΑΓΓΕΛΙΩΝ) --- */}
            <div className="p-4 space-y-4">
                {loading && onTheWayOrders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold animate-pulse flex flex-col items-center">
                        <RefreshCcw size={40} className="animate-spin mb-4" />
                        Φόρτωση...
                    </div>
                ) : onTheWayOrders.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center justify-center opacity-50">
                        <CheckCircle size={64} className="text-green-500 mb-4" />
                        <h2 className="text-2xl font-black text-gray-700">Όλα Καθαρά!</h2>
                        <p className="font-bold text-gray-500">Πιες έναν καφέ, δεν υπάρχει καμία παραγγελία στον δρόμο.</p>
                    </div>
                ) : (
                    onTheWayOrders.map(group => {
                        const addressInfo = parseAddressInfo(group.address);

                        return (
                            <div key={group.id} className="bg-white rounded-3xl p-5 shadow-lg border-2 border-blue-100 flex flex-col animate-fade-in-up">

                                {/* Πάνω Μέρος: Όνομα & Τιμή */}
                                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                                            Παραγγελια #{group.id}
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-800 leading-tight">
                                            {group.customerName}
                                        </h2>
                                    </div>
                                    <div className="text-right bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                                        <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-0.5">Να εισπραξεις</div>
                                        <span className="text-2xl font-black text-green-700">{group.totalAmount.toFixed(2)}€</span>
                                    </div>
                                </div>

                                {/* Μεσαίο Μέρος: Διεύθυνση */}
                                {addressInfo.text && (
                                    <div className="mb-6">
                                        <div className="flex items-start gap-3">
                                            <MapPin size={24} className="text-red-500 shrink-0 mt-1" />
                                            <p className="font-bold text-gray-700 text-lg leading-snug">
                                                {addressInfo.text}
                                            </p>
                                        </div>

                                        {/* Σημειώσεις (αν υπάρχουν) */}
                                        {group.items.some(i => i.notes) && (
                                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Σχολια / Κουδουνι</p>
                                                {group.items.filter(i => i.notes).map(i => (
                                                    <p key={i.id} className="text-sm font-bold text-gray-800">{i.notes}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Κάτω Μέρος: Κουμπιά Ενεργειών */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <a href={`tel:${group.phone}`} className="flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-800 py-4 rounded-2xl font-black text-sm hover:bg-gray-100 active:scale-95 transition-all border border-gray-200 shadow-sm">
                                        <Phone size={24} className="text-green-500" />
                                        ΚΛΗΣΗ
                                    </a>

                                    <a href={addressInfo.link || `https://maps.google.com/?q=${encodeURIComponent(addressInfo.text)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 bg-blue-50 text-blue-700 py-4 rounded-2xl font-black text-sm hover:bg-blue-100 active:scale-95 transition-all border border-blue-200 shadow-sm">
                                        <Navigation size={24} className="text-blue-500" />
                                        ΧΑΡΤΗΣ
                                    </a>
                                </div>

                                {/* ΤΕΡΑΣΤΙΟ ΚΟΥΜΠΙ ΠΑΡΑΔΟΣΗΣ */}
                                <button
                                    onClick={() => completeDelivery(group)}
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-wider shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <CheckCircle size={28} />
                                    ΠΑΡΑΔΟΘΗΚΕ
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
