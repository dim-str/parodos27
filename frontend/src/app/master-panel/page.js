"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from "react-hot-toast";
import { 
    LayoutDashboard, Store, Activity, LogOut, Settings, 
    ShieldCheck, ChevronRight, Plus, Search, Bell, TrendingUp, Users, UserCog, Bike, Trash2 
} from "lucide-react";
import { resolveApiUrl } from "../../lib/apiUrl";

export default function MasterPanel() {
    const [activeTab, setActiveTab] = useState('overview'); 
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]); 
    const [stats, setStats] = useState({ totalStores: 0, systemStatus: "Φόρτωση..." });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newStore, setNewStore] = useState({ name: '', slug: '', plan: 'BASIC' });

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const authRes = await fetch('/api/auth/check');
                const authData = await authRes.json();

                if (!authData.authenticated || !authData.token) {
                    router.push("/login");
                    return;
                }

                const token = authData.token;
                const decoded = jwtDecode(token);
                
                if (decoded.role !== "ROLE_SUPER_ADMIN") {
                    router.push("/login");
                    return;
                }

                const statsRes = await fetch(resolveApiUrl('/master/stats'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (statsRes.ok) setStats(await statsRes.json());

                const storesRes = await fetch(resolveApiUrl('/master/stores'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (storesRes.ok) setStores(await storesRes.json());

                const usersRes = await fetch(resolveApiUrl('/master/users'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (usersRes.ok) setUsers(await usersRes.json());

            } catch (err) {
                console.error("Error:", err);
                localStorage.removeItem("token");
                localStorage.removeItem("admin_jwt");
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchMasterData();
    }, [router]);

    const handleImpersonate = async (storeId) => {
        const token = localStorage.getItem("token") || localStorage.getItem("admin_jwt");
        try {
            const res = await fetch(resolveApiUrl(`/master/impersonate/${storeId}`), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("admin_jwt", data.token);
                toast.success("Είσοδος στο κατάστημα επιτυχής!");
                router.push("/dashboard"); 
            }
        } catch (err) {
            toast.error("Αποτυχία εισόδου στο κατάστημα");
        }
    };

    const filteredStores = stores.filter(store => 
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.storeName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateStore = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(resolveApiUrl('/master/stores'), {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(newStore)
            });
            if (res.ok) {
                toast.success("Το κατάστημα δημιουργήθηκε!");
                setIsCreateModalOpen(false);
                window.location.reload(); 
            }
        } catch { toast.error("Αποτυχία δημιουργίας"); }
    };

    const handleDeleteStore = async (storeId) => {
        if (!confirm("Είσαι σίγουρος για τη διαγραφή του καταστήματος; Θα διαγραφούν όλα τα δεδομένα του!")) return;
        const token = localStorage.getItem("token");
        try {
            await fetch(resolveApiUrl(`/master/stores/${storeId}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Το κατάστημα διαγράφηκε");
            setStores(stores.filter(s => s.id !== storeId));
        } catch { toast.error("Αποτυχία διαγραφής"); }
    };

    // ΝΕΟ: Αλλαγή κατάστασης καταστήματος (Block/Unblock)
    const handleToggleStoreActive = async (store) => {
        const token = localStorage.getItem("token");
        try {
            const updatedStore = { ...store, active: !store.active };
            const res = await fetch(resolveApiUrl(`/master/stores/${store.id}/toggle`), {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedStore)
            });
            if (res.ok) {
                setStores(stores.map(s => s.id === store.id ? updatedStore : s));
                toast.success(updatedStore.active ? "Το κατάστημα ενεργοποιήθηκε!" : "Το κατάστημα απενεργοποιήθηκε!");
            }
        } catch {
            toast.error("Αποτυχία αλλαγής κατάστασης");
        }
    };

    // ΝΕΟ: Διαγραφή Χρήστη από την πλατφόρμα
    const handleDeleteUser = async (userId) => {
        if (!confirm("Είσαι σίγουρος για τη διαγραφή αυτού του χρήστη;")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(resolveApiUrl(`/master/users/${userId}`), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Ο χρήστης διαγράφηκε");
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch { toast.error("Αποτυχία διαγραφής χρήστη"); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_jwt");
        router.push("/login");
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-bold text-gray-500">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            Φόρτωση Πλατφόρμας...
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col md:flex-row">
            <Toaster position="top-right" />

            {/* --- SIDEBAR --- */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-xl"><ShieldCheck size={24} className="text-white" /></div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight">Master<span className="text-orange-500">Panel</span></h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Super Admin</p>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <LayoutDashboard size={20} /> Επισκόπηση
                    </button>
                    <button 
                        onClick={() => setActiveTab('subscribers')}
                        className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all ${activeTab === 'subscribers' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Store size={20} /> Συνδρομητές
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <Users size={20} /> Χρήστες
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors font-bold text-sm">
                        <LogOut size={18} /> Αποσύνδεση
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                
                {/* TOP HEADER */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">
                            {activeTab === 'overview' && 'Επισκόπηση Πλατφόρμας'}
                            {activeTab === 'subscribers' && 'Διαχείριση Συνδρομητών'}
                            {activeTab === 'users' && 'Χρήστες Συστήματος'}
                        </h2>
                        <p className="text-gray-500 font-medium mt-1">
                            {activeTab === 'overview' && 'Παρακολουθήστε τη δραστηριότητα και τα έσοδα του SaaS.'}
                            {activeTab === 'subscribers' && 'Διαχειριστείτε τα εγγεγραμμένα καταστήματα (εστιατόρια).'}
                            {activeTab === 'users' && 'Δείτε τους Διαχειριστές (Admins) και Διανομείς (Delivery) ανά κατάστημα.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-3 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 shadow-sm transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        {activeTab === 'subscribers' && (
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={18} /> Νεο Καταστημα
                            </button>
                        )}
                    </div>
                </header>

                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Εσοδα Μηνα (MRR)</p>
                                    <p className="text-3xl font-black text-gray-900">€0.00</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                    <Store size={28} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Συνολικα Μαγαζια</p>
                                    <p className="text-3xl font-black text-gray-900">{stats.totalStores || stores.length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Συνδρομες Pro</p>
                                    <p className="text-3xl font-black text-gray-900">0</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Server Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-lg font-black text-gray-900">{stats.systemStatus}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full xl:w-1/2 flex flex-col gap-6">
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                    <Activity size={20} className="text-orange-500" /> Πρόσφατα Γεγονότα
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-green-500 text-white shadow shrink-0 z-10"></div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] ml-4 md:ml-0 md:odd:mr-auto md:even:ml-auto p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-900">Το "Zesto" ανανεώθηκε</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1">Πριν 2 ώρες</p>
                                        </div>
                                    </div>
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 z-10"></div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] ml-4 md:ml-0 md:odd:mr-auto md:even:ml-auto p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-900">Νέα Εγγραφή: "Foodie"</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1">Χθες</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: SUBSCRIBERS (ΣΥΝΔΡΟΜΗΤΕΣ) --- */}
                {activeTab === 'subscribers' && (
                    <div className="animate-fade-in flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-gray-900">Λίστα Καταστημάτων</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5">Ονομα Μαγαζιου</th>
                                    <th className="px-6 py-5">Πλανο</th>
                                    <th className="px-6 py-5">Κατασταση</th>
                                    <th className="px-6 py-5 text-right">Ενεργειες</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                {filteredStores.length > 0 ? filteredStores.map((store) => (
                                    <tr key={store.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                                                {store.name.charAt(0)}
                                            </div>
                                            <div>
                                                {store.name}
                                                <div className="text-xs text-gray-400 font-medium">/{store.slug || 'slug'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                                                {store.plan || 'BASIC'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* ΑΛΛΑΓΗ: Το Badge έγινε clickable κουμπί για γρήγορο Block/Unblock */}
                                            <button 
                                                onClick={() => handleToggleStoreActive(store)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105 ${store.active ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${store.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {store.active ? 'Ενεργό' : 'Ανενεργό'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleImpersonate(store.id)} className="inline-flex items-center gap-1 bg-gray-900 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-95">
                                                Εισοδος <ChevronRight size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteStore(store.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-bold">Δεν βρέθηκαν καταστήματα.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: USERS (ΧΡΗΣΤΕΣ) --- */}
                {activeTab === 'users' && (
                    <div className="animate-fade-in flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-gray-900">Λογαριασμοί Χρηστών</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5">Χρηστης</th>
                                    <th className="px-6 py-5">Καταστημα</th>
                                    <th className="px-6 py-5">Ρολος</th>
                                    <th className="px-6 py-5 text-right">Ενεργειες</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                {users.length > 0 ? filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                                                    <UserCog size={16} />
                                                </div>
                                                <div>
                                                    {user.fullName || user.username}
                                                    <div className="text-xs text-gray-400 font-medium">{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600">
                                            {user.storeName || 'Άγνωστο'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${user.role === 'ROLE_STORE_ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {user.role === 'ROLE_STORE_ADMIN' ? <UserCog size={14}/> : <Bike size={14}/>}
                                                {user.role === 'ROLE_STORE_ADMIN' ? 'Admin' : 'Delivery'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* ΑΛΛΑΓΗ: Το κουμπί ρυθμίσεων έγινε κουμπί διαγραφής χρήστη */}
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-gray-400 font-bold">
                                            Δεν βρέθηκαν χρήστες.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODAL ΔΗΜΙΟΥΡΓΙΑΣ */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-black mb-6">Δημιουργία Καταστήματος</h3>
                            <input 
                                placeholder="Όνομα Μαγαζιού" 
                                className="w-full p-4 mb-4 border rounded-xl font-bold"
                                onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                            />
                            <input 
                                placeholder="Slug (π.χ. zesto)" 
                                className="w-full p-4 mb-4 border rounded-xl font-bold"
                                onChange={(e) => setNewStore({...newStore, slug: e.target.value})}
                            />
                            
                            {/* ΑΛΛΑΓΗ: Προσθήκη Dropdown Επιλογής Πλάνου Συνδρομής */}
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2 px-1">Πλάνο Συνδρομής</label>
                            <select 
                                value={newStore.plan}
                                className="w-full p-4 mb-6 border rounded-xl bg-gray-50 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                onChange={(e) => setNewStore({...newStore, plan: e.target.value})}
                            >
                                <option value="BASIC">BASIC ΠΛΑΝΟ</option>
                                <option value="PRO">PRO ΠΛΑΝΟ</option>
                            </select>

                            <div className="flex gap-3">
                                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Άκυρο</button>
                                <button onClick={handleCreateStore} className="flex-1 py-3 bg-orange-500 text-white font-black rounded-xl hover:bg-orange-600 transition-colors">Δημιουργία</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}