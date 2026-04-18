// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
/* global process */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
    CheckCircle, Trash2, RefreshCcw, Search,
    Plus, Edit3, Settings, BarChart3, Clock, BookOpen, Bell, X,
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Printer, Volume2, VolumeX, Lock, Trophy, Timer,
    MapPin, Bike, Check, TrendingUp, TrendingDown, Users, Wallet, Percent, Award, Footprints, AlertCircle
} from 'lucide-react';

const COMMON_EXTRAS = [
    "Πατάτες Τηγανητές", "Πατάτες Φούρνου", "Ρύζι", "Πουρές",
    "Μακαρόνια", "Ψητά Λαχανικά", "Σαλάτα", "Ψωμί"
];

/** @typedef {Object} StoreSettings @property {boolean} open @property {string[]} disabledExtras @property {string[]} categoryOrder */

export default function AdminDashboard() {
    // --- 1. STATE MANAGEMENT ---
    const [authToken, setAuthToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [dishes, setDishes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editTab, setEditTab] = useState('basic');
    const [currentPage, setCurrentPage] = useState(1);
    const [storeSettings, setStoreSettings] = useState({ open: true, disabledExtras: [], categoryOrder: [] });
    const [editingDish, setEditingDish] = useState(null);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [acceptingGroup, setAcceptingGroup] = useState(null);
    const [prepTime, setPrepTime] = useState(20);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [now, setNow] = useState(Date.now());
    const [wsConnected, setWsConnected] = useState(false);
    const [financeFilter, setFinanceFilter] = useState('all'); // ΝΕΟ: Φίλτρο Οικονομικών

    const [newExtraName, setNewExtraName] = useState('');
    const [newExtraPrice, setNewExtraPrice] = useState('');

    const [newGlobalExtraName, setNewGlobalExtraName] = useState('');
    const [newGlobalExtraPrice, setNewGlobalExtraPrice] = useState('');

    // --- 2. REFS ---
    const audioRef = useRef(null); // Ήχος νέας παραγγελίας
    const warningAudioRef = useRef(null); // Ήχος ειδοποίησης
    const stompClientRef = useRef(null);
    const alarmedOrders = useRef(new Set());

    const [rejectingGroup, setRejectingGroup] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [categoryOrder, setCategoryOrder] = useState([]);

    // --- 3. FETCH FUNCTIONS ---
    const fetchOrders = useCallback(async () => {
        if (!authToken) return;
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders");
        } finally {
            setLoadingOrders(false);
        }
    }, [authToken]);

    const fetchDishes = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dishes?t=${Date.now()}`);
            setDishes(response.data);
            const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${Date.now()}`);
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
    }, []);

    const handleFileUpload = async (e, dishId) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dishId}/upload`, formData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setEditingDish(prev => ({ ...prev, imageUrl: res.data }));
            toast.success("Η φωτογραφία ανέβηκε!");
        } catch (err) {
            toast.error("Αποτυχία ανεβάσματος");
        }
    };

    // --- 4. EFFECTS ---
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/auth/check');
                if (res.data.authenticated) {
                    setAuthToken(res.data.token || '');
                    setIsAuthenticated(true);
                }
            } catch (e) {
                setIsAuthenticated(false);
            }
        };
        void checkAuth();

        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audioRef.current.loop = true;

            warningAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3');
            warningAudioRef.current.loop = false; // Δεν κάνει λούπα, χτυπάει μια φορά κάθε 10 δευτερόλεπτα
        }

        const timeInterval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(timeInterval);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        void fetchOrders();
        void fetchDishes();

        const client = new Client({
            webSocketFactory: () => new SockJS(process.env.NEXT_PUBLIC_WS_URL || `${process.env.NEXT_PUBLIC_API_URL}/ws-orders`),
            reconnectDelay: 5000,
            onConnect: () => {
                setWsConnected(true);
                client.subscribe('/topic/newOrder', (message) => {
                    const newOrder = JSON.parse(message.body);
                    setOrders(prev => [newOrder, ...prev]);
                    toast.success(`Νέα παραγγελία: ${newOrder.customerName}`, { icon: '🚨' });

                    if (soundEnabled && audioRef.current) {
                        audioRef.current.play().catch(e => console.log("Autoplay blocked by browser", e));
                    }
                });

                client.subscribe('/topic/orderUpdates', (message) => {
                    const updatedOrder = JSON.parse(message.body);
                    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

                    // Αν η παραγγελία ολοκληρώθηκε, βγάζουμε ένα ενημερωτικό toast
                    if (updatedOrder.status === 'COMPLETED') {
                        toast.success(`Η παραγγελία #${updatedOrder.id} παραδόθηκε!`, { icon: '📦' });
                    }
                });
            },
            onDisconnect: () => setWsConnected(false),
            onWebSocketClose: () => setWsConnected(false),
            onWebSocketError: () => setWsConnected(false)
        });
        client.activate();
        stompClientRef.current = client;
        return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
    }, [isAuthenticated, fetchOrders, fetchDishes]);

    // --- 5. HELPER FUNCTIONS & CALCULATIONS ---
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

            // --- ΝΕΑ ΑΛΛΑΓΗ ΕΔΩ ---
            // Το κλειδί πλέον περιέχει ΚΑΙ το orderType.
            // Άρα το Takeaway και το Delivery δεν θα ενωθούν ποτέ!
            const key = `${order.phone || 'unknown'}_${timeStr}_${order.orderType}`;

            if (!acc[key]) {
                acc[key] = {
                    id: order.id,
                    customerName: order.customerName?.split(' [')[0] || 'Άγνωστος',
                    phone: order.phone,
                    orderType: order.orderType,
                    address: order.address,
                    time: timeStr,
                    items: [], ids: [], totalAmount: 0
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

    const groupedPendingOrders = groupOrders(orders.filter(o => o.status === 'PENDING'));
    const groupedAcceptedOrders = groupOrders(orders.filter(o => o.status === 'ACCEPTED' || o.status === 'ON_THE_WAY'));
    const groupedHistoryOrders = groupOrders(orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED'));

    const ordersPerPage = 20;
    const currentHistoryOrders = groupedHistoryOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
    const totalPages = Math.ceil(groupedHistoryOrders.length / ordersPerPage) || 1;

    const groupedDishes = dishes.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase()))
    ).reduce((acc, dish) => {
        const cat = dish.category || 'Χωρίς Κατηγορία';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(dish);
        return acc;
    }, {});
    const existingCategories = [...new Set(dishes.map(d => d.category).filter(Boolean))];

    // --- ΝΕΟΙ ΥΠΟΛΟΓΙΣΜΟΙ ΟΙΚΟΝΟΜΙΚΩΝ & ΣΤΑΤΙΣΤΙΚΩΝ ΜΕ ΦΙΛΤΡΑ ---
    const completedHistory = groupedHistoryOrders.filter(g => g.items && g.items.some(i => i.status === 'COMPLETED'));
    const cancelledHistory = groupedHistoryOrders.filter(g => g.items && g.items.some(i => i.status === 'CANCELLED'));

    // Εφαρμογή Φίλτρου Χρόνου
    const filteredCompletedHistory = completedHistory.filter(g => {
        if (financeFilter === 'all') return true;
        // Αν το backend δεν στέλνει createdAt, θα τα θεωρεί σημερινά. Καλό είναι να το στέλνει.
        const orderDateStr = g.items[0]?.createdAt || g.items[0]?.orderDate;
        const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();
        const nowTime = new Date();
        const diffDays = (nowTime - orderDate) / (1000 * 60 * 60 * 24);

        if (financeFilter === 'today') return orderDate.toDateString() === nowTime.toDateString();
        if (financeFilter === 'week') return diffDays <= 7;
        if (financeFilter === 'month') return diffDays <= 30;
        return true;
    });

    const calcTotalRevenue = filteredCompletedHistory.reduce((sum, g) => sum + g.totalAmount, 0);
    const calcTotalOrders = filteredCompletedHistory.length;
    const averageOrderValue = calcTotalOrders > 0 ? (calcTotalRevenue / calcTotalOrders) : 0;
    const lostRevenue = cancelledHistory.reduce((sum, g) => sum + g.totalAmount, 0);

    const deliveryOrdersCount = filteredCompletedHistory.filter(g => g.orderType === 'delivery').length;
    const takeawayOrdersCount = filteredCompletedHistory.filter(g => g.orderType === 'takeaway').length;
    const deliveryRevenue = filteredCompletedHistory.filter(g => g.orderType === 'delivery').reduce((sum, g) => sum + g.totalAmount, 0);
    const takeawayRevenue = filteredCompletedHistory.filter(g => g.orderType === 'takeaway').reduce((sum, g) => sum + g.totalAmount, 0);
    const deliveryPercentage = calcTotalRevenue > 0 ? (deliveryRevenue / calcTotalRevenue) * 100 : 0;

    const itemCounts = {};
    orders.filter(o => o.status === 'COMPLETED').forEach(o => {
        const name = o.dailyMenu?.dish?.name || o.dish?.name || 'Άγνωστο';
        itemCounts[name] = (itemCounts[name] || 0) + o.quantity;
    });
    const bestSellers = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const customersMap = {};
    filteredCompletedHistory.forEach(g => {
        const key = g.phone || 'Άγνωστο';
        if (!customersMap[key]) {
            customersMap[key] = { name: g.customerName.split(' [')[0], phone: g.phone, spent: 0, orders: 0 };
        }
        customersMap[key].spent += g.totalAmount;
        customersMap[key].orders += 1;
    });
    const topCustomers = Object.values(customersMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

    // --- 6. HANDLERS ---
    const openEditModal = (dish = null) => {
        if (dish) {
            setEditingDish({ ...dish });
        } else {
            setEditingDish({
                name: '', price: 0, category: existingCategories[0] || '',
                availablePortions: -1, active: true, description: '', extras: '', imageUrl: ''
            });
        }
        setEditTab('basic');
        setShowNewCategoryInput(false);
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

    // ΝΕΟ: Λειτουργία Μετακίνησης Κατηγοριών
    const moveCategory = async (categoryName, direction) => {
        const cats = storeSettings.categoryOrder?.length > 0 ? [...storeSettings.categoryOrder] : [...existingCategories];

        // Βεβαιωνόμαστε ότι όλες οι κατηγορίες υπάρχουν στη λίστα διάταξης
        existingCategories.forEach(c => { if (!cats.includes(c)) cats.push(c); });

        const index = cats.indexOf(categoryName);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= cats.length) return;

        // Ανταλλαγή θέσεων
        [cats[index], cats[newIndex]] = [cats[newIndex], cats[index]];

        const updatedSettings = { ...storeSettings, categoryOrder: cats };
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updatedSettings, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        setStoreSettings(updatedSettings);
        toast.success("Η σειρά αποθηκεύτηκε!");
    };

    const confirmAcceptance = async () => {
        if (!acceptingGroup) return;
        const targetTimeMs = Date.now() + (prepTime * 60000);
        const estimatedReadyTime = new Date(targetTimeMs).toISOString();
        try {
            await Promise.all(acceptingGroup.items.map(item => {
                const updatedItem = { ...item, status: 'ACCEPTED', estimatedReadyTime };
                return axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${item.id}`, updatedItem, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
            }));
            toast.success("Η παραγγελία έγινε αποδεκτή!");
            setAcceptingGroup(null);
            void fetchOrders();
        } catch (e) {
            toast.error("Σφάλμα στην αποδοχή!");
        }
    };

    const saveDish = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            if (editingDish.id) {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${editingDish.id}`, editingDish, config);
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dishes`, editingDish, config);
            }
            setEditingDish(null);
            void fetchDishes();
            toast.success("Αποθηκεύτηκε!");
        } catch (error) {
            toast.error("Σφάλμα αποθήκευσης.");
        }
    };

    const handlePrint = (group) => {
        const addressInfo = parseAddressInfo(group.address);
        const printWindow = window.open('', '_blank', 'width=450,height=700');
        const itemsHtml = group.items.map(i => `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            <div style="flex: 1;">
                <span style="font-size: 1.5rem; font-weight: 900; background: #000; color: #fff; padding: 2px 8px; border-radius: 4px; margin-right: 10px;">
                    ${i.quantity}x
                </span>
                <span style="font-size: 1.3rem; font-weight: 800; text-transform: uppercase;">
                    ${i.dailyMenu?.dish?.name || i.dish?.name}
                </span>
                ${i.notes ? `<div style="font-size: 1rem; margin-top: 5px; color: #333; font-style: italic;"> Σημείωση: ${getCleanNotes(i.notes)}</div>` : ''}
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; white-space: nowrap; margin-left: 10px;">
                ${(i.dish?.price * i.quantity).toFixed(2)}€
            </div>
        </div>
        `).join('');

        printWindow.document.write(`
        <html>
            <head><title>Εκτύπωση Παραγγελίας #${group.id}</title></head>
            <body>
                <div style="font-family: monospace; max-width: 400px;">
                    <h2>ΜΑΓΕΙΡΕΙΟ - #${group.id}</h2>
                    <p>Πελάτης: ${group.customerName}<br>Τηλ: ${group.phone}</p>
                    <p>Τύπος: <strong>${group.orderType.toUpperCase()}</strong></p>
                    ${group.orderType === 'delivery' ? `<p>Διεύθυνση: <strong>${addressInfo.text}</strong></p>` : ''}
                    <hr>${itemsHtml}<hr>
                    <h3>Σύνολο: ${group.totalAmount.toFixed(2)}€</h3>
                </div>
                <script>window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
            </body>
        </html>
        `);
        printWindow.document.close();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/login', { password: passwordInput });
            if (res.data.success) {
                setAuthToken(res.data.key || '');
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
            setIsAuthenticated(false);
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (!soundEnabled || !warningAudioRef.current) return;

        let shouldPlay = false;

        groupedAcceptedOrders.filter(g => g.items[0].status === 'ACCEPTED').forEach(group => {
            const targetMs = getTargetTime(group.items[0]);
            if (!targetMs) return;
            const remainingMins = Math.ceil((targetMs - now) / 60000);

            // Αν ο χρόνος είναι 3 (ή λιγότερο) ΚΑΙ η παραγγελία δεν έχει χτυπήσει ξανά...
            if (remainingMins <= 3 && !alarmedOrders.current.has(group.id)) {
                shouldPlay = true;
                alarmedOrders.current.add(group.id); // Βάλε την παραγγελία στη "μαύρη λίστα" για να μην ξαναχτυπήσει
            }
        });

        if (shouldPlay) {
            warningAudioRef.current.play().catch(() => {});
        }
    }, [now, groupedAcceptedOrders, soundEnabled]);

    useEffect(() => {
        if (audioRef.current) {
            // Αν υπάρχουν εκκρεμείς παραγγελίες ΚΑΙ ο Admin ΔΕΝ ασχολείται ήδη με κάποια (δεν έχει ανοιχτό Modal)
            if (groupedPendingOrders.length > 0 && soundEnabled && !acceptingGroup && !rejectingGroup) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn("Ο ήχος μπλοκαρίστηκε από τον browser.");
                    });
                }
            } else {
                // Σταματάει τον ήχο (ή γιατί δεν υπάρχουν παραγγελίες, ή γιατί πατήθηκε "Αποδοχή/Απόρριψη")
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [groupedPendingOrders.length, soundEnabled, acceptingGroup, rejectingGroup]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-olive-900 flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center">
                    <Lock size={32} className="text-olive-600 mb-6" />
                    <h2 className="text-3xl font-black text-olive-900 mb-8">Admin Login</h2>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Κωδικός" className="w-full p-4 bg-olive-50 border-2 rounded-xl mb-6 text-center font-bold outline-none focus:border-olive-500" />
                    <button type="submit" className="w-full bg-olive-900 text-white font-black py-4 rounded-xl hover:bg-olive-800 transition-all uppercase">Είσοδος</button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-olive-50 flex flex-col md:flex-row pb-20 md:pb-0 font-sans">
            <aside className="w-full md:w-64 bg-olive-900 text-olive-100 flex flex-col shadow-2xl z-10 sticky top-0 md:h-screen">
                <div className="p-6 bg-olive-950 text-center font-black text-2xl uppercase text-white shadow-md relative">
                    Admin<span className="text-olive-400">Panel</span>
                    <div className="absolute top-2 right-3 flex items-center gap-1.5" title={wsConnected ? 'Συνδεδεμένο' : 'Εκτός Σύνδεσης'}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${wsConnected ? 'text-green-500' : 'text-red-500'}`}>{wsConnected ? 'Online' : 'Offline'}</span>
                        <div className={`w-3 h-3 rounded-full shadow-lg ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-x-auto flex md:flex-col">
                    <button onClick={() => setActiveTab('orders')} className={`flex items-center justify-between w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                        <div className="flex items-center gap-3"><Bell size={20} className={groupedPendingOrders.length > 0 ? "animate-pulse text-red-400" : ""} /> Live</div>
                        {(groupedPendingOrders.length > 0 || groupedAcceptedOrders.length > 0) && <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{groupedPendingOrders.length + groupedAcceptedOrders.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}><BookOpen size={20} /> Κατάλογος</button>
                    <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}><Clock size={20} /> Ιστορικό</button>
                    <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'finance' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}><BarChart3 size={20} /> Οικονομικά</button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}><Settings size={20} /> Ρυθμίσεις</button>
                    <div className="mt-auto pt-4 border-t border-olive-800">
                        <button onClick={handleLogout} className="w-full p-4 rounded-xl font-bold text-red-400 hover:bg-olive-800 transition-all text-left">Αποσύνδεση</button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 p-6 lg:p-10 overflow-y-auto h-screen">
                {activeTab === 'orders' && (
                    <div className="animate-fade-in flex flex-col h-full">
                        {/* HEADER BAR */}
                        <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-olive-100 mb-6 shrink-0">
                            <h2 className="text-2xl font-black text-olive-900 uppercase">Live Παραγγελίες</h2>
                            <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm ${storeSettings.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {storeSettings.open ? '🟢 ΑΝΟΙΧΤΟ' : '🔴 ΚΛΕΙΣΤΟ'}
                            </span>
                            <div className="flex gap-3">
                                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-olive-100 text-olive-700' : 'bg-red-50 text-red-400'}`}>
                                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </button>
                                <button onClick={() => { setLoadingOrders(true); void fetchOrders(); }} className="flex items-center gap-2 bg-olive-100 text-olive-700 px-4 py-2 rounded-xl font-bold">
                                    <RefreshCcw size={18} className={loadingOrders ? "animate-spin" : ""} /> Ανανέωση
                                </button>
                            </div>
                        </div>

                        {/* --- KDS SPLIT VIEW --- */}
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

                            {/* ΑΡΙΣΤΕΡΑ: ΕΙΣΕΡΧΟΜΕΝΕΣ & ΚΟΥΖΙΝΑ (Pending & Accepted) */}
                            <div className="flex flex-col bg-gray-50/80 rounded-[2rem] border border-gray-200 overflow-hidden shadow-inner">
                                <div className="p-5 bg-white border-b border-gray-200 flex justify-between items-center z-10 shrink-0">
                                    <h2 className="font-black uppercase tracking-widest text-gray-800 flex items-center gap-3 text-lg">
                                        <span className="relative flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                        </span>
                                        Κουζινα
                                    </h2>
                                    <div className="flex gap-2">
                                        {groupedPendingOrders.length > 0 && (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black shadow-sm animate-pulse border border-red-200">
                                                {groupedPendingOrders.length} ΝΕΕΣ
                                            </span>
                                        )}
                                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                                            {groupedAcceptedOrders.filter(g => g.items[0].status === 'ACCEPTED').length} ΕΤΟΙΜΑΖΟΝΤΑΙ
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* 1. ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ (Κόκκινες) */}
                                    {groupedPendingOrders.map(group => {
                                        const addressInfo = parseAddressInfo(group.address);
                                        const hasComments = group.items.some(i => i.notes && (i.notes.includes('ΣΧΟΛΙΑ') || i.notes.includes('SOS')));

                                        return (
                                            <div key={group.id} className={`p-5 rounded-2xl shadow-md border-2 bg-white flex flex-col ${hasComments ? 'border-red-500 bg-red-50/30' : 'border-red-400'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-black text-lg text-olive-900">{group.customerName}</h3>
                                                        <p className="text-olive-600 font-bold text-xs">📞 {group.phone}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xl font-black text-red-600">#{group.id}</span>
                                                        <div className={`text-[10px] block font-black uppercase mt-1 px-2 py-1 rounded-md ${group.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {group.orderType === 'delivery' ? 'DELIVERY' : 'ΠΑΡΑΛΑΒΗ'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`mb-3 p-3 rounded-xl space-y-2 text-sm border ${hasComments ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                                    {group.items.map(item => (
                                                        <div key={item.id} className="font-bold text-gray-800">
                                                            {item.quantity}x {item.dailyMenu?.dish?.name || item.dish?.name}
                                                            {item.notes && <div className="text-xs text-red-600 mt-1 pl-4 uppercase">↳ {item.notes}</div>}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2 mt-auto">
                                                    <button onClick={() => setAcceptingGroup(group)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-black active:scale-95 text-sm uppercase">Αποδοχη</button>
                                                    <button onClick={async () => {
                                                        setRejectingGroup(group);
                                                    }} className="px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 2. ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ (Πορτοκαλί) */}
                                    {groupedAcceptedOrders.filter(g => g.items[0].status === 'ACCEPTED').map(group => {
                                        const targetMs = getTargetTime(group.items[0]);
                                        const remainingMins = targetMs ? Math.ceil((targetMs - now) / 60000) : null;
                                        const isLate = remainingMins !== null && remainingMins < 0;
                                        const hasComments = group.items.some(i => i.notes && (i.notes.includes('ΣΧΟΛΙΑ') || i.notes.includes('SOS')));
                                        const isWarning = remainingMins !== null && remainingMins <= 3 && remainingMins >= 0;

                                        return (
                                            <div key={group.id} className={`p-5 rounded-2xl shadow-sm border flex flex-col relative transition-all ${isWarning ? 'bg-yellow-50/50 border-yellow-400' : 'bg-white border-orange-300'}`}>

                                                {/* ΜΠΑΡΑ ΑΥΞΟΜΕΙΩΣΗΣ ΧΡΟΝΟΥ - ΦΑΙΝΕΤΑΙ ΠΑΝΤΑ */}
                                                <div className="flex items-center justify-between gap-2 mb-4">
                                                    <button onClick={async () => {
                                                        const baseTime = targetMs || Date.now();
                                                        const newTime = new Date(baseTime - 5 * 60000).toISOString();
                                                        await Promise.all(group.ids.map(id => axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, { ...group.items.find(i=>i.id===id), estimatedReadyTime: newTime }, { headers: { Authorization: `Bearer ${authToken}` }})));
                                                        void fetchOrders();
                                                    }} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-black text-xs transition-all active:scale-90 shadow-sm border border-gray-200">-5&apos;</button>

                                                    <div className={`flex-1 text-center font-black py-2 rounded-xl text-sm border shadow-inner ${
                                                        remainingMins === null ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                                            isLate ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' :
                                                                isWarning ? 'bg-yellow-100 border-yellow-500 text-yellow-700 animate-pulse' :
                                                                    'bg-orange-50 border-orange-300 text-orange-600'
                                                    }`}>
                                                        {remainingMins === null ? '⏱️ Ορίστε Χρόνο' : isLate ? `⚠️ ΚΑΘΥΣΤΕΡΗΣΗ: ${Math.abs(remainingMins)}'` : isWarning ? `🔥 ΒΙΑΣΤΕΙΤΕ: ${remainingMins}'` : `⏱️ Έτοιμο σε ${remainingMins}'`}
                                                    </div>

                                                    <button onClick={async () => {
                                                        const baseTime = targetMs || Date.now();
                                                        const newTime = new Date(baseTime + 5 * 60000).toISOString();
                                                        await Promise.all(group.ids.map(id => axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, { ...group.items.find(i=>i.id===id), estimatedReadyTime: newTime }, { headers: { Authorization: `Bearer ${authToken}` }})));
                                                        void fetchOrders();
                                                    }} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-black text-xs transition-all active:scale-90 shadow-sm border border-gray-200">+5&apos;</button>
                                                </div>

                                                <div className="flex justify-between items-start mb-3">
                                                    <div><h3 className="font-black text-lg text-olive-900">{group.customerName}</h3></div>
                                                    <span className="text-lg font-black text-orange-600">#{group.id}</span>
                                                </div>

                                                <div className={`mb-4 p-3 rounded-xl space-y-1 text-sm border ${hasComments ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-100'}`}>
                                                    {group.items.map(item => (
                                                        <div key={item.id} className="font-bold text-olive-900">
                                                            {item.quantity}x {item.dailyMenu?.dish?.name || item.dish?.name}
                                                            {item.notes && <div className="text-xs text-red-600 mt-0.5 pl-4 uppercase">↳ {item.notes}</div>}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                                                    <button onClick={async () => {
                                                        const newStatus = group.orderType === 'delivery' ? 'ON_THE_WAY' : 'COMPLETED';
                                                        await Promise.all(group.ids.map(id => axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, { ...group.items.find(i => i.id === id), status: newStatus }, { headers: { Authorization: `Bearer ${authToken}` }})));
                                                        toast.success(group.orderType === 'delivery' ? "Στον δρόμο!" : "Ολοκληρώθηκε!"); void fetchOrders();
                                                    }} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-bold active:scale-95 uppercase text-xs shadow-md hover:bg-orange-600 transition-colors">
                                                        {group.orderType === 'delivery' ? '🚚 Εφυγε για Delivery' : '✅ Παραδοθηκε (Takeaway)'}
                                                    </button>
                                                    <button onClick={() => handlePrint(group)} className="px-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100"><Printer size={18} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {groupedPendingOrders.length === 0 && groupedAcceptedOrders.filter(g => g.items[0].status === 'ACCEPTED').length === 0 && (
                                        <div className="text-center py-20 text-gray-400 font-bold italic">Η κουζίνα είναι άδεια.</div>
                                    )}
                                </div>
                            </div>

                            {/* ΔΕΞΙΑ: ΣΤΟΝ ΔΡΟΜΟ (ON_THE_WAY) */}
                            <div className="flex flex-col bg-blue-50/30 rounded-[2rem] border border-blue-100 overflow-hidden shadow-inner">
                                <div className="p-5 bg-white border-b border-blue-100 flex justify-between items-center z-10 shrink-0">
                                    <h2 className="font-black uppercase tracking-widest text-blue-900 flex items-center gap-3 text-lg">
                                        <Bike size={20} className="text-blue-500" />
                                        Διανομη
                                    </h2>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                                        {groupedAcceptedOrders.filter(g => g.items[0].status === 'ON_THE_WAY').length} ΣΤΟΝ ΔΡΟΜΟ
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {groupedAcceptedOrders.filter(g => g.items[0].status === 'ON_THE_WAY').map(group => {
                                        const addressInfo = parseAddressInfo(group.address);

                                        return (
                                            <div key={group.id} className="p-5 rounded-2xl shadow-sm border border-blue-200 bg-white flex flex-col">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-black text-lg text-olive-900">{group.customerName}</h3>
                                                        <p className="text-olive-600 font-bold text-xs">📞 {group.phone}</p>
                                                    </div>
                                                    <span className="text-lg font-black text-blue-600">#{group.id}</span>
                                                </div>

                                                {addressInfo.text && (
                                                    <div className="mb-4 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                                                        <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Διευθυνση:</div>
                                                        <div className="font-bold text-sm text-blue-900 mb-2">{addressInfo.text}</div>
                                                        {addressInfo.link && (
                                                            <a href={addressInfo.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-blue-500 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-blue-600 transition-all shadow-sm">
                                                                <MapPin size={14} /> Άνοιγμα Χάρτη (GPS)
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-3 border-t border-gray-100 text-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        Αναμονη επιβεβαιωσης απο τον Διανομεα...
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {groupedAcceptedOrders.filter(g => g.items[0].status === 'ON_THE_WAY').length === 0 && (
                                        <div className="text-center py-20 text-gray-400 font-bold italic">Κανένας διανομέας στο δρόμο.</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* --- TAB: MENU --- */}
                {activeTab === 'menu' && (
                    <div className="animate-fade-in max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-olive-100 gap-4">
                            <h2 className="text-3xl font-black text-olive-900 uppercase">Κατάλογος</h2>
                            <div className="flex w-full md:w-auto gap-3">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400" size={18} />
                                    <input type="text" placeholder="Αναζήτηση..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-olive-100 bg-olive-50 text-black font-bold outline-none focus:border-olive-300 transition-all" />
                                </div>
                                <button onClick={() => openEditModal()} className="flex items-center gap-2 bg-olive-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-olive-800 transition-all"><Plus size={18} /> Νέο</button>
                            </div>
                        </div>
                        {Object.entries(groupedDishes)
                            .sort(([catA], [catB]) => {
                                const orderArr = storeSettings.categoryOrder || existingCategories;
                                let indexA = orderArr.indexOf(catA);
                                let indexB = orderArr.indexOf(catB);
                                if (indexA === -1) indexA = 999;
                                if (indexB === -1) indexB = 999;
                                return indexA - indexB;
                            })
                            .map(([category, categoryDishes]) => (
                                <div key={category} className="mb-12">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => moveCategory(category, 'up')} className="hover:text-olive-900 text-olive-400 bg-olive-50 rounded hover:bg-olive-200 transition-colors"><ChevronUp size={18}/></button>
                                                <button onClick={() => moveCategory(category, 'down')} className="hover:text-olive-900 text-olive-400 bg-olive-50 rounded hover:bg-olive-200 transition-colors"><ChevronDown size={18}/></button>
                                            </div>
                                            <h3 className="text-xl font-black text-olive-900 uppercase border-l-4 border-olive-400 pl-3">{category}</h3>
                                        </div>

                                        {category !== 'Χωρίς Κατηγορία' && (
                                            <button onClick={async () => {
                                                if (window.confirm(`Διαγραφή της κατηγορίας "${category}";\n\n(Τα πιάτα ΔΕΝ θα διαγραφούν, απλά θα μείνουν "Χωρίς Κατηγορία" για να τα βάλετε αλλού).`)) {
                                                    await Promise.all(categoryDishes.map(dish =>
                                                        axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dish.id}`, { ...dish, category: '' }, { headers: { Authorization: `Bearer ${authToken}` } })
                                                    ));
                                                    toast.success('Η κατηγορία διεγράφη!');
                                                    void fetchDishes();
                                                }
                                            }} className="text-red-500 hover:text-white font-bold text-xs flex items-center gap-1.5 bg-red-50 hover:bg-red-500 px-4 py-2 rounded-xl transition-all shadow-sm">
                                                <Trash2 size={16} /> Διαγραφή
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-white rounded-3xl shadow-sm border border-olive-100 divide-y overflow-hidden">
                                        {categoryDishes.map(dish => (
                                            <div key={dish.id} className={`flex items-center justify-between p-4 ${!dish.active && 'opacity-50 grayscale'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-olive-100 overflow-hidden">
                                                        {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍲</div>}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-black text-lg ${!dish.active && 'line-through'}`}>{dish.name}</h4>
                                                        <p className="text-sm font-bold text-olive-600">{dish.price.toFixed(2)}€ | {dish.availablePortions === -1 ? 'Άπειρες' : dish.availablePortions} Μερίδες</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={async () => {
                                                        const updatedDish = { ...dish, active: !dish.active };
                                                        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dish.id}`, updatedDish, {
                                                            headers: { Authorization: `Bearer ${authToken}` }
                                                        });
                                                        void fetchDishes();
                                                    }} className={`w-12 h-6 rounded-full transition-all relative ${dish.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${dish.active ? 'left-7' : 'left-1'}`} />
                                                    </button>
                                                    <button onClick={() => openEditModal(dish)} className="p-2 text-olive-500 hover:bg-olive-100 rounded-xl"><Edit3 size={20} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* --- TAB: HISTORY --- */}
                {activeTab === 'history' && (
                    <div className="animate-fade-in max-w-6xl mx-auto space-y-6">
                        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-olive-100 shadow-sm">
                            <h2 className="text-3xl font-black text-olive-900 uppercase">Ιστορικό</h2>
                            <span className="font-bold text-olive-600 bg-olive-100 px-4 py-2 rounded-xl">Σελίδα {currentPage} / {totalPages}</span>
                        </div>
                        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-olive-50 text-olive-800 text-xs font-black uppercase tracking-wider">
                                <tr><th className="p-5">ID</th><th className="p-5">Πελάτης</th><th className="p-5">Πιάτα</th><th className="p-5">Τύπος</th><th className="p-5 text-center">Σύνολο</th></tr>
                                </thead>
                                <tbody className="divide-y">
                                {currentHistoryOrders.map(group => (
                                    <tr key={group.id} className="hover:bg-olive-50/50 transition-colors">
                                        <td className="p-5 font-black text-olive-400">#{group.id}</td>
                                        <td className="p-5">
                                            <div className="font-bold text-olive-900">{group.customerName}</div>
                                            <div className="text-xs text-olive-500">{group.phone}</div>
                                            {group.orderType === 'delivery' && <div className="text-[10px] text-blue-600 mt-1">{parseAddressInfo(group.address).text}</div>}
                                        </td>
                                        <td className="p-5 text-sm">{group.items.map(i => <div key={i.id}>{i.quantity}x {i.dailyMenu?.dish?.name || i.dish?.name}</div>)}</td>
                                        <td className="p-5"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${group.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{group.orderType}</span></td>
                                        <td className="p-5 text-center font-black text-olive-900">{group.totalAmount.toFixed(2)}€</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center items-center gap-6 pt-4">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 rounded-full bg-white border text-olive-900 disabled:opacity-30 hover:bg-olive-100 shadow-sm transition-all"><ChevronLeft size={24} /></button>
                            <span className="font-black text-olive-900">Σελίδα {currentPage}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 rounded-full bg-white border text-olive-900 disabled:opacity-30 hover:bg-olive-100 shadow-sm transition-all"><ChevronRight size={24} /></button>
                        </div>
                    </div>
                )}

                {/* --- TAB: FINANCE --- */}
                {activeTab === 'finance' && (
                    <div className="animate-fade-in max-w-6xl mx-auto space-y-8">

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-3xl font-black text-olive-900 uppercase">Οικονομικά</h2>
                            {/* ΦΙΛΤΡΑ ΧΡΟΝΟΥ */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-olive-100 shadow-sm">
                                {['today', 'week', 'month', 'all'].map(f => (
                                    <button key={f} onClick={() => setFinanceFilter(f)} className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${financeFilter === f ? 'bg-olive-900 text-white shadow-md' : 'text-olive-500 hover:bg-olive-50'}`}>
                                        {f === 'today' ? 'Σημερα' : f === 'week' ? 'Εβδομαδα' : f === 'month' ? 'Μηνας' : 'Ολα'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 1η Γραμμή: Βασικοί Δείκτες Απόδοσης (KPIs) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-olive-100 flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-olive-50 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform"><Wallet size={48} className="text-olive-200" /></div>
                                <div className="w-12 h-12 bg-olive-100 text-olive-600 rounded-2xl flex items-center justify-center mb-4 relative z-10"><BarChart3 size={24} /></div>
                                <p className="text-olive-500 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Συνολικα Εσοδα</p>
                                <h3 className="text-3xl font-black text-olive-900 relative z-10">{calcTotalRevenue.toFixed(2)}€</h3>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-olive-100 flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform"><CheckCircle size={48} className="text-blue-200" /></div>
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 relative z-10"><CheckCircle size={24} /></div>
                                <p className="text-olive-500 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Παραγγελιες</p>
                                <h3 className="text-3xl font-black text-olive-900 relative z-10">{calcTotalOrders} <span className="text-sm text-olive-400 font-bold">επιτυχείς</span></h3>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-olive-100 flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform"><TrendingUp size={48} className="text-orange-200" /></div>
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 relative z-10"><TrendingUp size={24} /></div>
                                <p className="text-olive-500 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Μεση Αξια (AOV)</p>
                                <h3 className="text-3xl font-black text-olive-900 relative z-10">{averageOrderValue.toFixed(2)}€ <span className="text-sm text-olive-400 font-bold">/ καλάθι</span></h3>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform"><TrendingDown size={48} className="text-red-100" /></div>
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 relative z-10"><TrendingDown size={24} /></div>
                                <p className="text-red-400 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Χαμενα (Ακυρωσεις)</p>
                                <h3 className="text-3xl font-black text-red-600 relative z-10">{lostRevenue.toFixed(2)}€ <span className="text-sm text-red-400 font-bold">({cancelledHistory.length})</span></h3>
                            </div>
                        </div>

                        {/* 2η Γραμμή: Αναλύσεις */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Delivery vs Takeaway (Αριστερά) */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100 flex flex-col">
                                <h3 className="text-lg font-black text-olive-900 uppercase mb-6 flex items-center gap-3"><Percent size={20} className="text-blue-500"/> Κατανομή Τζίρου</h3>

                                <div className="flex-1 flex flex-col justify-center space-y-6">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-2 font-black text-olive-900"><Bike size={18} className="text-blue-500"/> Delivery</div>
                                            <div className="text-right">
                                                <span className="font-black text-lg text-olive-900">{deliveryRevenue.toFixed(2)}€</span>
                                                <span className="text-xs text-olive-400 font-bold ml-2">({deliveryOrdersCount})</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-olive-50 rounded-full h-3 overflow-hidden">
                                            <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${deliveryPercentage}%` }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-2 font-black text-olive-900"><Footprints size={18} className="text-orange-500"/> Παραλαβή</div>
                                            <div className="text-right">
                                                <span className="font-black text-lg text-olive-900">{takeawayRevenue.toFixed(2)}€</span>
                                                <span className="text-xs text-olive-400 font-bold ml-2">({takeawayOrdersCount})</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-olive-50 rounded-full h-3 overflow-hidden">
                                            <div className="bg-orange-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${100 - deliveryPercentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Best Sellers (Δεξιά - 2 στήλες) */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-olive-100">
                                <h3 className="text-lg font-black text-olive-900 uppercase mb-6 flex items-center gap-3"><Trophy size={20} className="text-yellow-500"/> Top 5 Πιάτα</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {bestSellers.map(([name, count], index) => (
                                        <div key={name} className="flex items-center justify-between p-4 bg-olive-50/50 rounded-2xl border border-olive-50 hover:bg-olive-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-olive-100 text-olive-600'}`}>
                                    {index + 1}
                                </span>
                                                <span className="font-black text-sm text-olive-900 truncate max-w-[150px]" title={name}>{name}</span>
                                            </div>
                                            <span className="font-bold text-[11px] uppercase tracking-widest text-olive-500 bg-white px-3 py-1 rounded-lg border border-olive-100 shadow-sm">{count} μεριδες</span>
                                        </div>
                                    ))}
                                    {bestSellers.length === 0 && <div className="col-span-full text-center text-sm font-bold text-olive-400 py-4">Δεν υπάρχουν αρκετά δεδομένα ακόμα.</div>}
                                </div>
                            </div>
                        </div>

                        {/* 3η Γραμμή: Top Πελάτες */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100">
                            <h3 className="text-lg font-black text-olive-900 uppercase mb-6 flex items-center gap-3"><Users size={20} className="text-purple-500"/> Πιο Πιστοί Πελάτες</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-olive-50 text-olive-600 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 rounded-l-2xl">Καταταξη</th>
                                        <th className="p-4">Ονομα</th>
                                        <th className="p-4">Τηλεφωνο</th>
                                        <th className="p-4 text-center">Παραγγελιες</th>
                                        <th className="p-4 text-right rounded-r-2xl">Συνολο Τζιρου</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-olive-50">
                                    {topCustomers.map((customer, index) => (
                                        <tr key={customer.phone} className="hover:bg-olive-50/30 transition-colors">
                                            <td className="p-4">
                                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black text-sm border border-purple-100">#{index + 1}</div>
                                            </td>
                                            <td className="p-4 font-black text-olive-900">{customer.name}</td>
                                            <td className="p-4 text-sm font-bold text-olive-500">{customer.phone}</td>
                                            <td className="p-4 text-center text-sm font-black text-olive-700">{customer.orders}</td>
                                            <td className="p-4 text-right font-black text-lg text-olive-900">{customer.spent.toFixed(2)}€</td>
                                        </tr>
                                    ))}
                                    {topCustomers.length === 0 && (
                                        <tr><td colSpan="5" className="text-center text-sm font-bold text-olive-400 py-8">Δεν υπάρχουν δεδομένα πελατών.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === 'settings' && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <h2 className="text-3xl font-black text-olive-900 uppercase mb-8">Ρυθμίσεις Καταστήματος</h2>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100 space-y-8">
                            <div className="flex items-center justify-between border-b pb-6">
                                <div><h3 className="text-xl font-black text-olive-900">Κατάσταση Λειτουργίας</h3><p className="text-sm font-bold text-olive-500">Κλείσιμο παραγγελιών στο site.</p></div>
                                <button onClick={async () => {
                                    const newStatus = !storeSettings.open;
                                    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, { ...storeSettings, open: newStatus }, {
                                        headers: { Authorization: `Bearer ${authToken}` }
                                    });
                                    setStoreSettings({ ...storeSettings, open: newStatus });
                                    toast.success(newStatus ? "Ανοιχτό!" : "Κλειστό!");
                                }} className={`px-10 py-4 rounded-2xl font-black transition-all ${storeSettings.open ? 'bg-green-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'}`}>
                                    {storeSettings.open ? 'ΑΝΟΙΧΤΟ' : 'ΚΛΕΙΣΤΟ'}
                                </button>
                            </div>

                            {/* ΩΡΑΡΙΟ ΛΕΙΤΟΥΡΓΙΑΣ */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100">
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <h3 className="text-xl font-black text-olive-900 uppercase italic">Ωράριο Λειτουργίας</h3>
                                    <button onClick={async () => {
                                        try {
                                            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, storeSettings, {
                                                headers: { Authorization: `Bearer ${authToken}` }
                                            });
                                            toast.success("Το ωράριο αποθηκεύτηκε!");
                                        } catch (e) {
                                            toast.error("Σφάλμα κατά την αποθήκευση");
                                        }
                                    }} className="bg-olive-900 hover:bg-olive-800 text-white font-black px-6 py-2.5 rounded-xl uppercase transition-colors shadow-md active:scale-95">
                                        Αποθηκευση Ωραριου
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { key: 'monday', label: 'Δευτέρα' },
                                        { key: 'tuesday', label: 'Τρίτη' },
                                        { key: 'wednesday', label: 'Τετάρτη' },
                                        { key: 'thursday', label: 'Πέμπτη' },
                                        { key: 'friday', label: 'Παρασκευή' },
                                        { key: 'saturday', label: 'Σάββατο' },
                                        { key: 'sunday', label: 'Κυριακή' }
                                    ].map(day => (
                                        <div key={day.key} className="flex items-center gap-3 justify-between bg-olive-50 p-3 rounded-2xl border border-olive-100 shadow-sm transition-all focus-within:border-olive-400 focus-within:ring-2 focus-within:ring-olive-100 overflow-hidden">
                                            <span className="font-black text-olive-900 w-20 uppercase text-[11px] tracking-widest shrink-0">{day.label}</span>
                                            <input
                                                type="text"
                                                value={storeSettings[day.key] || ''}
                                                onChange={(e) => setStoreSettings({ ...storeSettings, [day.key]: e.target.value })}
                                                placeholder="π.χ. 12:00 - 00:00"
                                                className="flex-1 min-w-0 w-full p-2 bg-white rounded-xl border border-olive-100 focus:border-olive-300 outline-none font-bold text-center text-sm text-olive-900 shadow-inner"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ΚΕΝΤΡΙΚΟ ΛΕΞΙΚΟ ΣΥΝΟΔΕΥΤΙΚΩΝ */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100">
                                <h3 className="text-xl font-black text-olive-900 mb-6 uppercase italic">Κεντρικό Λεξικό Συνοδευτικών</h3>

                                {/* Φόρμα Δημιουργίας */}
                                <div className="flex flex-col md:flex-row gap-3 mb-8 bg-olive-50 p-4 rounded-2xl border border-olive-100">
                                    <input type="text" placeholder="Όνομα (π.χ. Πατάτες Τηγανητές)" value={newGlobalExtraName} onChange={(e) => setNewGlobalExtraName(e.target.value)} className="flex-1 p-3 bg-white rounded-xl font-bold border focus:border-olive-300 outline-none" />
                                    <input type="number" step="0.1" placeholder="Τιμή (π.χ. 1.50)" value={newGlobalExtraPrice} onChange={(e) => setNewGlobalExtraPrice(e.target.value)} className="w-full md:w-32 p-3 bg-white rounded-xl font-bold border focus:border-olive-300 outline-none" />
                                    <button onClick={async () => {
                                        if (!newGlobalExtraName) return;
                                        const priceStr = newGlobalExtraPrice ? parseFloat(newGlobalExtraPrice).toFixed(2) : "0";
                                        const newExtra = `${newGlobalExtraName}|${priceStr}`;
                                        const updatedExtras = [...(storeSettings.globalExtras || []), newExtra];
                                        const updatedSettings = { ...storeSettings, globalExtras: updatedExtras };
                                        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updatedSettings, { headers: { Authorization: `Bearer ${authToken}` } });
                                        setStoreSettings(updatedSettings);
                                        setNewGlobalExtraName(''); setNewGlobalExtraPrice('');
                                        toast.success("Δημιουργήθηκε!");
                                    }} className="bg-olive-900 text-white font-black px-6 py-3 rounded-xl uppercase">ΠΡΟΣΘΗΚΗ</button>
                                </div>

                                {/* Λίστα Συνοδευτικών */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(storeSettings.globalExtras || []).map(extraRaw => {
                                        const [name, price] = extraRaw.split('|');
                                        const numPrice = parseFloat(price);
                                        const isDisabled = storeSettings.disabledExtras?.includes(name);

                                        return (
                                            <div key={extraRaw} className={`p-4 rounded-2xl border-2 flex flex-col gap-4 transition-all ${isDisabled ? 'bg-red-50 border-red-200' : 'bg-white border-olive-100 shadow-sm'}`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-black text-lg ${isDisabled ? 'text-red-500 line-through' : 'text-olive-900'}`}>{name}</span>
                                                    <span className="font-black text-olive-600 bg-olive-50 px-3 py-1 rounded-lg">+{numPrice.toFixed(2)}€</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={async () => {
                                                        let newDisabled = storeSettings.disabledExtras ? [...storeSettings.disabledExtras] : [];
                                                        if (isDisabled) newDisabled = newDisabled.filter(e => e !== name); else newDisabled.push(name);
                                                        const updated = { ...storeSettings, disabledExtras: newDisabled };
                                                        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updated, { headers: { Authorization: `Bearer ${authToken}` } });
                                                        setStoreSettings(updated);
                                                    }} className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase ${isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isDisabled ? 'ΕΝΕΡΓΟΠΟΙΗΣΗ' : 'ΕΞΑΝΤΛΗΘΗΚΕ'}
                                                    </button>
                                                    <button onClick={async () => {
                                                        if(window.confirm(`Διαγραφή του ${name}; (Θα αφαιρεθεί από όλα τα πιάτα)`)) {
                                                            const updatedExtras = storeSettings.globalExtras.filter(e => e !== extraRaw);
                                                            const updatedDisabled = storeSettings.disabledExtras.filter(e => e !== name);
                                                            const updated = { ...storeSettings, globalExtras: updatedExtras, disabledExtras: updatedDisabled };
                                                            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updated, { headers: { Authorization: `Bearer ${authToken}` } });
                                                            setStoreSettings(updated);
                                                        }
                                                    }} className="px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!storeSettings.globalExtras || storeSettings.globalExtras.length === 0) && (
                                        <div className="col-span-2 text-center text-olive-400 font-bold p-6">Δεν έχετε δημιουργήσει συνοδευτικά.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODAL: PREP TIME --- */}
            {acceptingGroup && (
                <div className="fixed inset-0 bg-olive-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col items-center">
                        <Timer size={48} className="text-red-500 mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-olive-900 mb-6 text-center">Χρόνος Προετοιμασίας</h2>
                        <div className="grid grid-cols-3 gap-3 w-full mb-8">
                            {[15, 30, 45, 60].map(time => (
                                <button key={time} onClick={() => setPrepTime(time)} className={`py-4 rounded-xl font-black text-lg transition-all border-2 ${prepTime === time ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white border-olive-200 text-olive-600'}`}>{time}&apos;</button>
                            ))}
                            <div className="col-span-2 flex items-center gap-2 border-2 rounded-xl px-4 bg-white">
                                <input type="number" value={prepTime} onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)} className="w-full font-black text-lg outline-none text-center" />
                                <span className="font-bold text-olive-400">λεπτά</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setAcceptingGroup(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button onClick={confirmAcceptance} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl shadow-lg active:scale-95">ΕΠΙΒΕΒΑΙΩΣΗ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: EDIT DISH --- */}
            {editingDish && (
                <div className="fixed inset-0 bg-olive-900/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
                        <div className="p-6 border-b border-olive-100 bg-olive-50 flex-shrink-0">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-olive-900">{editingDish.id ? "Επεξεργασία" : "Νέο Πιάτο"}</h2>
                                <button onClick={() => setEditingDish(null)} className="p-2 bg-white rounded-full"><X size={20} /></button>
                            </div>
                            <div className="flex gap-6 border-b border-olive-200">
                                <button onClick={() => setEditTab('basic')} className={`pb-3 font-black text-sm uppercase transition-all ${editTab === 'basic' ? 'border-b-4 border-olive-600 text-olive-900' : 'text-olive-400'}`}>Στοιχεία</button>
                                <button onClick={() => setEditTab('extras')} className={`pb-3 font-black text-sm uppercase transition-all ${editTab === 'extras' ? 'border-b-4 border-olive-600 text-olive-900' : 'text-olive-400'}`}>Συνοδευτικά</button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {editTab === 'basic' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Όνομα</label>
                                        <input type="text" value={editingDish.name || ''} onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-300 outline-none" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Τιμή</label>
                                        <input type="number" step="0.1" value={editingDish.price || ''} onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-300 outline-none" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Κατηγορία</label>
                                        {!showNewCategoryInput ? (
                                            <select value={editingDish.category || ''} onChange={(e) => { if (e.target.value === "NEW") setShowNewCategoryInput(true); else setEditingDish({ ...editingDish, category: e.target.value }); }} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-300 outline-none">
                                                {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                <option value="NEW" className="text-olive-600">+ ΝΕΑ ΚΑΤΗΓΟΡΙΑ</option>
                                            </select>
                                        ) : (
                                            <div className="flex gap-2"><input type="text" autoFocus onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })} className="flex-1 p-3 bg-olive-100 rounded-xl font-bold" /><button onClick={() => setShowNewCategoryInput(false)} className="p-3 bg-olive-200 rounded-xl"><X size={18} /></button></div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Μερίδες (-1=Άπειρες)</label>
                                        <input type="number" value={editingDish.availablePortions} onChange={(e) => setEditingDish({ ...editingDish, availablePortions: parseInt(e.target.value) })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-300 outline-none" />
                                    </div>
                                    <div className="md:col-span-2 flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Εικόνα Πιάτου (URL ή Ανέβασμα)</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Επικόλληση Link..." value={editingDish.imageUrl || ''} onChange={(e) => setEditingDish({ ...editingDish, imageUrl: e.target.value })} className="flex-1 p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-300 outline-none" />
                                            <label className="bg-olive-200 text-olive-900 font-bold px-4 py-3 rounded-xl cursor-pointer hover:bg-olive-300 transition-all flex items-center justify-center">
                                                Ανέβασμα
                                                <input type="file" onChange={(e) => handleFileUpload(e, editingDish.id)} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 flex flex-col gap-1">
                                        <label className="text-xs font-black uppercase text-olive-400 ml-1">Περιγραφή</label>
                                        <textarea value={editingDish.description || ''} onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })} className="p-3 bg-olive-50 rounded-xl font-bold h-24 resize-none border-2 focus:border-olive-300 outline-none"></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    {/* ΤΑ ΝΕΑ ΚΕΝΤΡΙΚΑ ΣΥΝΟΔΕΥΤΙΚΑ */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {(storeSettings.globalExtras || []).map(extraRaw => {
                                            const [name, price] = extraRaw.split('|');
                                            const isSelected = editingDish.extras && editingDish.extras.split(',').map(e=>e.trim()).includes(name);
                                            return (
                                                <button key={name} onClick={() => {
                                                    let curr = editingDish.extras ? editingDish.extras.split(',').map(e => e.trim()).filter(Boolean) : [];
                                                    if (curr.includes(name)) curr = curr.filter(e => e !== name); else curr.push(name);
                                                    setEditingDish({ ...editingDish, extras: curr.join(', ') });
                                                }} className={`p-4 rounded-xl font-bold text-sm transition-all border-2 flex justify-between items-center ${isSelected ? 'border-olive-600 bg-olive-50 text-olive-900' : 'border-olive-100 bg-white text-olive-500'}`}>
                                                    <span>{name}</span>
                                                    {isSelected && <Check size={18} className="text-olive-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {(!storeSettings.globalExtras || storeSettings.globalExtras.length === 0) && (
                                        <div className="text-center text-olive-400 font-bold p-6 border-2 border-dashed border-olive-100 rounded-2xl">
                                            Δεν υπάρχουν συνοδευτικά.<br/>Πηγαίνετε στις &quot;Ρυθμίσεις&quot; για να δημιουργήσετε.
                                        </div>
                                    )}

                                    {/* ΑΝΙΧΝΕΥΤΗΣ ΦΑΝΤΑΣΜΑΤΩΝ (Παλιά Extras) */}
                                    {(() => {
                                        const globalNames = (storeSettings.globalExtras || []).map(e => e.split('|')[0]);
                                        const ghostExtras = (editingDish.extras ? editingDish.extras.split(',').map(e => e.trim()).filter(Boolean) : [])
                                            .filter(name => !globalNames.includes(name));

                                        if (ghostExtras.length > 0) {
                                            return (
                                                <div className="mt-4 p-5 bg-red-50 border border-red-200 rounded-2xl animate-fade-in">
                                                    <h4 className="text-sm font-black text-red-600 uppercase mb-2 flex items-center gap-2">⚠️ Παλια Συνοδευτικα στο πιατο</h4>
                                                    <p className="text-xs text-red-500 mb-4 font-bold">Αυτά τα συνοδευτικά είναι αποθηκευμένα στο πιάτο, αλλά δεν υπάρχουν στο &apos;Κεντρικό Λεξικό&apos; των Ρυθμίσεων. Διαγράψτε τα κάνοντας κλικ!</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ghostExtras.map(ghost => (
                                                            <button key={ghost} onClick={() => {
                                                                const curr = editingDish.extras.split(',').map(e => e.trim()).filter(Boolean);
                                                                const updated = curr.filter(e => e !== ghost);
                                                                setEditingDish({ ...editingDish, extras: updated.join(', ') });
                                                            }} className="flex items-center gap-2 bg-white border-2 border-red-200 text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                                {ghost} <X size={16} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t bg-white flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setEditingDish(null)} className="px-8 py-3 font-bold text-olive-600">ΑΚΥΡΩΣΗ</button>
                            <button onClick={saveDish} className="px-8 py-3 bg-olive-900 text-white font-black rounded-xl uppercase tracking-widest">Αποθήκευση</button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL: ΑΠΟΡΡΙΨΗ ΠΑΡΑΓΓΕΛΙΑΣ --- */}
            {rejectingGroup && (
                <div className="fixed inset-0 bg-olive-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col items-center text-center">
                        <AlertCircle size={48} className="text-red-500 mb-4" />
                        <h2 className="text-2xl font-black text-olive-900 mb-2">Απόρριψη Παραγγελίας</h2>
                        <p className="text-olive-500 font-bold text-sm mb-6">Επιλέξτε τον λόγο απόρριψης για την παραγγελία #{rejectingGroup.id}.</p>

                        <div className="w-full space-y-3 mb-6">
                            <button onClick={() => setRejectReason('WORKLOAD')} className={`w-full p-4 rounded-xl font-black border-2 transition-all ${rejectReason === 'WORKLOAD' ? 'border-red-500 bg-red-50 text-red-700' : 'border-olive-100 text-olive-600 hover:bg-olive-50'}`}>
                                1. Φόρτος Εργασίας
                            </button>
                            <button onClick={() => setRejectReason('STOCK')} className={`w-full p-4 rounded-xl font-black border-2 transition-all ${rejectReason === 'STOCK' ? 'border-red-500 bg-red-50 text-red-700' : 'border-olive-100 text-olive-600 hover:bg-olive-50'}`}>
                                2. Έλλειψη Αποθέματος
                            </button>
                            <button onClick={() => setRejectReason('CLOSED')} className={`w-full p-4 rounded-xl font-black border-2 transition-all ${rejectReason === 'CLOSED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-olive-100 text-olive-600 hover:bg-olive-50'}`}>
                                3. Το κατάστημα έκλεισε
                            </button>
                        </div>

                        {/* Αν επιλέξει "Έλλειψη Αποθέματος", βγάζουμε τηλέφωνο! */}
                        {rejectReason === 'STOCK' && (
                            <div className="w-full bg-orange-50 p-4 rounded-xl mb-6 border border-orange-200">
                                <p className="text-xs font-black uppercase text-orange-600 mb-2 tracking-widest">Προτεινεται</p>
                                <a href={`tel:${rejectingGroup.phone}`} className="flex items-center justify-center gap-2 bg-orange-500 text-white p-3 rounded-lg font-black hover:bg-orange-600 transition-colors">
                                    📞 Κλήση Πελάτη ({rejectingGroup.phone})
                                </a>
                            </div>
                        )}

                        <div className="flex gap-3 w-full border-t border-olive-100 pt-6">
                            <button onClick={() => { setRejectingGroup(null); setRejectReason(''); }} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button disabled={!rejectReason} onClick={async () => {
                                await Promise.all(rejectingGroup.ids.map(id => axios.put(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, { ...rejectingGroup.items.find(i=>i.id===id), status: 'CANCELLED' }, { headers: { Authorization: `Bearer ${authToken}` }})));
                                toast.success("Η παραγγελία απορρίφθηκε.");
                                setRejectingGroup(null); setRejectReason(''); void fetchOrders();
                            }} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">ΟΡΙΣΤΙΚΗ ΑΠΟΡΡΙΨΗ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}