// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
/* global process */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { setupAxiosAuth } from '../../lib/setupAxiosAuth';
import { resolveSockJsUrl } from '../../lib/wsUrl';
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

// Εισαγωγή των νέων Tabs
import Sidebar from './components/Sidebar';
import LiveOrdersTab from './components/LiveOrdersTab';
import MenuEditorTab from './components/MenuEditorTab';
import HistoryTab from './components/HistoryTab';
import FinanceTab from './components/FinanceTab';
import SettingsTab from './components/SettingsTab';
import CampaignsTab from './components/CampaignsTab';

setupAxiosAuth();

export default function AdminDashboard() {
    // --- 1. STATE MANAGEMENT ---
    const router = useRouter();
    const [authToken, setAuthToken] = useState('');
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [dishes, setDishes] = useState([]);
    const [storeSettings, setStoreSettings] = useState({ open: true, disabledExtras: [], categoryOrder: [] });
    const [acceptingGroup, setAcceptingGroup] = useState(null);
    const [rejectingGroup, setRejectingGroup] = useState(null);
    const [prepTime, setPrepTime] = useState(20);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [now, setNow] = useState(Date.now());
    const [wsConnected, setWsConnected] = useState(false);

    // --- 2. REFS ---
    const audioRef = useRef(null);
    const warningAudioRef = useRef(null);
    const stompClientRef = useRef(null);
    const alarmedOrders = useRef(new Set());

    // --- 3. FETCH FUNCTIONS ---
    const fetchOrders = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setOrders(response.data);
        } catch (error) {
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("admin_jwt");
                router.push("/login");
            }
        } finally {
            setLoadingOrders(false);
        }
    }, [authToken, router]);

    const fetchDishes = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dishes?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setDishes(response.data);
            const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (settingsRes.data) {
                setStoreSettings({
                    open: settingsRes.data.open !== undefined ? settingsRes.data.open : true,
                    disabledExtras: settingsRes.data.disabledExtras || [],
                    categoryOrder: settingsRes.data.categoryOrder || [],
                    ...settingsRes.data
                });
            }
        } catch (error) {
            console.error("Σφάλμα φόρτωσης καταλόγου", error);
        }
    }, [authToken]);

    const handleFileUpload = async (e, dishId) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dishId}/upload`, formData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            void fetchDishes();
            toast.success("Η φωτογραφία ανέβηκε!");
            return res.data;
        } catch (err) {
            toast.error("Αποτυχία ανεβάσματος");
        }
    };

    // --- 4. GLOBAL LOGIC HELPERS ---
    const parseAddressInfo = (fullAddress) => {
        if (!fullAddress) return { text: '', link: null };
        const parts = fullAddress.split('| GPS:');
        return { text: parts[0] ? parts[0].trim() : '', link: parts[1] ? parts[1].trim() : null };
    };

    const groupOrders = (ordersList) => {
        const groups = ordersList.reduce((acc, order) => {
            const timeMatch = order.customerName?.match(/\[(.*?)]/);
            const timeStr = timeMatch ? timeMatch[1] : order.id;
            const key = `${order.phone || 'unknown'}_${timeStr}_${order.orderType}`;

            if (!acc[key]) {
                acc[key] = {
                    id: order.id, customerName: order.customerName?.split(' [')[0] || 'Άγνωστος',
                    phone: order.phone, orderType: order.orderType, address: order.address,
                    time: timeStr, items: [], ids: [], totalAmount: 0
                };
            }
            acc[key].items.push(order);
            acc[key].ids.push(order.id);
            const price = order.dailyMenu?.dish?.price || order.dish?.price || 0;
            acc[key].totalAmount += price * order.quantity;
            return acc;
        }, {});
        return Object.values(groups).sort((a, b) => b.id - a.id);
    };

    const getCleanNotes = (notes) => {
        if (!notes) return '';
        if (notes.startsWith('TARGET:')) return notes.split('|').slice(1).join('|').trim();
        return notes;
    };

    const getTargetTime = (order) => {
        if (order.estimatedReadyTime) return new Date(order.estimatedReadyTime).getTime();
        if (order.notes && order.notes.startsWith('TARGET:')) return parseInt(order.notes.split('|')[0].replace('TARGET:', ''));
        return null;
    };

   const handlePrint = (orderOrGroup) => {
        const addressInfo = parseAddressInfo(orderOrGroup.address);
        const printWindow = window.open('', '_blank', 'width=450,height=700');
        
        if (!printWindow) {
            toast.error("Παρακαλώ επιτρέψτε τα pop-ups στον browser σας για να εκτυπώσετε!", { duration: 5000 });
            return;
        }

        // ΑΣΦΑΛΗΣ ΥΠΟΛΟΓΙΣΜΟΣ: Αν δεν υπάρχει το totalAmount, το υπολογίζουμε επιτόπου αθροίζοντας τα πιάτα!
        const safeTotal = orderOrGroup.totalAmount !== undefined 
            ? orderOrGroup.totalAmount 
            : (orderOrGroup.items || []).reduce((sum, i) => sum + ((i.dailyMenu?.dish?.price || i.dish?.price || 0) * (i.quantity || 1)), 0);

        const itemsHtml = (orderOrGroup.items || []).map(i => {
            const itemPrice = i.dailyMenu?.dish?.price || i.dish?.price || 0;
            const itemTotal = itemPrice * (i.quantity || 1);
            return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <div style="flex: 1;">
                    <span style="font-size: 1.5rem; font-weight:900; background:#000; color:#fff; padding:2px 8px; border-radius:4px; margin-right:10px;">${i.quantity || 1}x</span>
                    <span style="font-size: 1.3rem; font-weight:800; text-transform:uppercase;">${i.dailyMenu?.dish?.name || i.dish?.name || 'Πιάτο'}</span>
                    ${i.notes ? `<div style="font-size:1rem; margin-top:5px; color:#333; font-style:italic;">Σημείωση: ${getCleanNotes(i.notes)}</div>` : ''}
                </div>
                <div style="font-size: 1.1rem; font-weight: 600;">${itemTotal.toFixed(2)}€</div>
            </div>`;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Εκτύπωση Παραγγελίας #${orderOrGroup.id}</title>
                    <style>
                        body { font-family: monospace; padding: 10px; color: #000; }
                    </style>
                </head>
                <body>
                    <div style="max-width:400px;">
                        <h2>ΜΑΓΕΙΡΕΙΟ - #${orderOrGroup.id}</h2>
                        <p>Πελάτης: ${orderOrGroup.customerName || '-'}<br>Τηλ: ${orderOrGroup.phone || '-'}</p>
                        <p>Τύπος: <strong>${(orderOrGroup.orderType || '').toUpperCase()}</strong></p>
                        ${orderOrGroup.orderType === 'delivery' ? `<p>Διεύθυνση: <strong>${addressInfo.text}</strong></p>` : ''}
                        <hr>
                        ${itemsHtml}
                        <hr>
                        <h3>Σύνολο: ${safeTotal.toFixed(2)}€</h3>
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const toggleQuickItem = async (dish) => {
        const currentQuickItemsCount = dishes.filter(d => d.isQuickItem).length;
        if (!dish.isQuickItem && currentQuickItemsCount >= 4) {
            toast.error("Μπορείτε να έχετε το πολύ 4 Quick Items!");
            return;
        }
        try {
            const updatedDish = { ...dish, isQuickItem: !dish.isQuickItem };
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dish.id}`, updatedDish, { headers: { Authorization: `Bearer ${authToken}` } });
            setDishes(dishes.map(d => d.id === dish.id ? updatedDish : d));
            toast.success(updatedDish.isQuickItem ? "Μπήκε στα Quick Items!" : "Βγήκε από τα Quick Items");
        } catch { toast.error("Σφάλμα κατά την ενημέρωση"); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_jwt");
        window.location.href = "/login";
    };

    // --- 5. AUTOMATION EFFECTS (AUDIO & AUTH) ---
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const res = await axios.get('/api/auth/check');
                if (res.data.authenticated && res.data.token) {
                    const token = res.data.token;
                    const decoded = jwtDecode(token);
                    if (decoded.role !== "ROLE_STORE_ADMIN" && decoded.role !== "ROLE_SUPER_ADMIN") {
                        router.push("/login");
                        return;
                    }
                    setAuthToken(token);
                } else { router.push("/login"); }
            } catch { router.push("/login"); }
        };
        verifyAuth();

        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audioRef.current.loop = true;
            warningAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3');
        }
        const timeInterval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(timeInterval);
    }, [router]);

    // WEBSOCKET CONNECTION
    useEffect(() => {
        if (!authToken) return; // Βγάλαμε το storeSettings.id από εδώ!
        
        void fetchOrders();
        void fetchDishes();

        // Αν το Backend δεν μας στέλνει το ID, χρησιμοποιούμε το 1 (το κεντρικό σου κατάστημα)
        const currentStoreId = storeSettings.id || 1; 

        console.log("🚀 Προσπάθεια σύνδεσης WebSocket για Store ID:", currentStoreId);

        const client = new Client({
            webSocketFactory: () => new SockJS(resolveSockJsUrl()),

            connectHeaders: {
                Authorization: `Bearer ${authToken}` // ΠΡΟΣΘΗΚΗ ΑΥΤΗΣ ΤΗΣ ΓΡΑΜΜΗΣ
            },

            reconnectDelay: 5000,
            
            debug: (str) => {
                console.log('STOMP DEBUG:', str);
            },
            
            onConnect: () => {
                console.log("✅ ΣΥΝΔΕΘΗΚΕ ΕΠΙΤΥΧΩΣ!");
                setWsConnected(true);
                
                client.subscribe(`/topic/orders/${currentStoreId}`, (message) => {
                    const incomingOrder = JSON.parse(message.body);
                    console.log("📩 ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ/UPDATE:", incomingOrder);
                    
                    // --- ΝΕΟ: Ανανέωση του καταλόγου για να φανούν Live οι μειωμένες μερίδες! ---
                    fetchDishes(); 
                    
                    setOrders(prev => {
                        const exists = prev.find(o => o.id === incomingOrder.id);
                        if (!exists) return [incomingOrder, ...prev];
                        return prev.map(o => o.id === incomingOrder.id ? incomingOrder : o);
                    });
                    if (!orders.find(o => o.id === incomingOrder.id)) {
                        toast.success(`Νέα παραγγελία: ${incomingOrder.customerName}`, { icon: '🚨' });
                    }
                });
            },
            onStompError: (frame) => {
                console.error('❌ STOMP ERROR:', frame.headers['message']);
                console.error('Λεπτομέρειες:', frame.body);
            },
            onDisconnect: () => {
                console.log("⚠️ ΑΠΟΣΥΝΔΕΘΗΚΕ");
                setWsConnected(false);
            },
            onWebSocketClose: () => {
                console.log("🔌 ΤΟ WEBSOCKET ΕΚΛΕΙΣΕ");
                setWsConnected(false);
            }
        });
        
        client.activate();
        stompClientRef.current = client;
        
        return () => { 
            if (stompClientRef.current) stompClientRef.current.deactivate(); 
        };
    }, [authToken, storeSettings.id, fetchOrders, fetchDishes]);

    // Καθυστέρηση Παραγγελίας - Ήχος Προειδοποίησης
    useEffect(() => {
        if (!soundEnabled || !warningAudioRef.current) return;
        let shouldPlay = false;
        groupOrders(orders.filter(o => o.status === 'ACCEPTED')).forEach(group => {
            const targetMs = getTargetTime(group.items[0]);
            if (!targetMs) return;
            const remainingMins = Math.ceil((targetMs - now) / 60000);
            if (remainingMins <= 3 && !alarmedOrders.current.has(group.id)) {
                shouldPlay = true;
                alarmedOrders.current.add(group.id);
            }
        });
        if (shouldPlay) warningAudioRef.current.play().catch(() => {});
    }, [now, orders, soundEnabled]);

    useEffect(() => {
        if (!orders || orders.length === 0 || !authToken) return;

        const interval = setInterval(() => {
            const nowTime = Date.now();
            
            orders.forEach(order => {
                // Ελέγχουμε μόνο τις PENDING παραγγελίες
                if (order.status === 'PENDING') {
                    // Αν δεν υπάρχει createdAt, αγνοούμε
                    if (!order.createdAt) return;
                    
                    const orderTime = new Date(order.createdAt).getTime();
                    const diffMins = (nowTime - orderTime) / (1000 * 60);
                    
                    if (diffMins >= 3) {
                        // Ακύρωση μέσω API
                        axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}`, 
                            { ...order, status: 'CANCELLED', notes: (order.notes || '') + ' [ΑΥΤΟΜΑΤΗ ΑΠΟΡΡΙΨΗ ΛΟΓΩ ΠΑΡΕΛΕΥΣΗΣ 3 ΛΕΠΤΩΝ]' }, 
                            { headers: { Authorization: `Bearer ${authToken}` } }
                        ).then(() => {
                            toast.error(`Η παραγγελία #${order.id} απορρίφθηκε αυτόματα (3 λεπτά).`, { duration: 5000 });
                            fetchOrders(); // Ανανεώνουμε τη λίστα
                        }).catch(err => console.error("Σφάλμα αυτόματης ακύρωσης:", err));
                    }
                }
            });
        }, 15000); // Ελέγχει κάθε 15 δευτερόλεπτα

        return () => clearInterval(interval);
    }, [orders, authToken, fetchOrders]);

    // Ήχος Νέας Παραγγελίας (Loop)
    useEffect(() => {
        if (!audioRef.current) return;
        // Το ηχητικό χτυπάει μόνο για "κανονικές" νέες παραγγελίες που έχουν πιάτα!
        const pendingCount = orders.filter(o => o.status === 'PENDING' && o.items && o.items.length > 0).length;
        if (pendingCount > 0 && soundEnabled && !acceptingGroup && !rejectingGroup) {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [orders, soundEnabled, acceptingGroup, rejectingGroup]);

    return (
        <div className="min-h-screen bg-olive-50 flex flex-col md:flex-row pb-20 md:pb-0 font-sans">
            <Toaster position="top-right" />
            
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                // ΔΙΟΡΘΩΣΗ ΜΕΤΡΗΤΗ: Αγνοούμε τα "κουφάρια" του Stripe
                pendingCount={orders.filter(o => o.status === 'PENDING' && o.items && o.items.length > 0).length} 
                acceptedCount={orders.filter(o => (o.status === 'ACCEPTED' || o.status === 'ON_THE_WAY') && o.items && o.items.length > 0).length} 
                wsConnected={wsConnected} 
                handleLogout={handleLogout} 
            />

            <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen">
                {activeTab === 'orders' && (
                    <LiveOrdersTab 
                        orders={orders} fetchOrders={fetchOrders} loadingOrders={loadingOrders} setLoadingOrders={setLoadingOrders}
                        storeSettings={storeSettings} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
                        acceptingGroup={acceptingGroup} setAcceptingGroup={setAcceptingGroup} rejectingGroup={rejectingGroup} setRejectingGroup={setRejectingGroup}
                        prepTime={prepTime} setPrepTime={setPrepTime} now={now} authToken={authToken} parseAddressInfo={parseAddressInfo}
                        groupOrders={groupOrders} getCleanNotes={getCleanNotes} getTargetTime={getTargetTime} handlePrint={handlePrint}
                    />
                )}

                {activeTab === 'menu' && (
                    <MenuEditorTab dishes={dishes} fetchDishes={fetchDishes} storeSettings={storeSettings} setStoreSettings={setStoreSettings} authToken={authToken} toggleQuickItem={toggleQuickItem} handleFileUpload={handleFileUpload} />
                )}

                {activeTab === 'history' && (
                    <HistoryTab orders={orders} parseAddressInfo={parseAddressInfo} groupOrders={groupOrders} />
                )}

                {activeTab === 'finance' && (
                    <FinanceTab orders={orders} groupOrders={groupOrders} />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab storeSettings={storeSettings} setStoreSettings={setStoreSettings} authToken={authToken} />
                )}

                {activeTab === 'campaigns' && (
                    <CampaignsTab dishes={dishes} fetchDishes={fetchDishes} storeSettings={storeSettings} setStoreSettings={setStoreSettings} authToken={authToken} orders={orders} />
                )}
            </main>
        </div>
    );
}