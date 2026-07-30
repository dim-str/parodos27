'use client';

import {useEffect, useState} from 'react';
import { ShoppingCart, UserCog, Clock, X, User, CreditCard, MapPin, ChevronLeft, ChevronRight, LogOut, Package, Home, Briefcase, Navigation, Trash2, Plus } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import axios from 'axios';

export default function Header() {
    const [activeOrderId, setActiveOrderId] = useState(null);

    useEffect(() => {
        const checkActiveOrder = () => setActiveOrderId(localStorage.getItem('activeOrderId'));
        checkActiveOrder();
        window.addEventListener('orderUpdated', checkActiveOrder);
        return () => window.removeEventListener('orderUpdated', checkActiveOrder);
    }, []);

    const totalItems = useCartStore((state) => state.getTotalItems());
    const toggleCart = useCartStore((state) => state.toggleCart);

    const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false); 
    const [userProfile, setUserProfile] = useState(null);
    const [authView, setAuthView] = useState('menu'); 

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [userOrders, setUserOrders] = useState([]);
    const [userAddresses, setUserAddresses] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [newAddr, setNewAddr] = useState({ label: 'Σπίτι', street: '', floor: '', bell: '' });

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { 
        setIsMounted(true); 
        const savedUser = localStorage.getItem('zesto_user');
        if (savedUser) {
            setUserProfile(JSON.parse(savedUser));
            setIsLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        if (!userProfile?.firebaseUid) return;
        if (authView === 'orders') {
            setLoadingData(true);
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${userProfile.firebaseUid}/orders`)
                .then(res => setUserOrders(res.data)).catch(console.error).finally(() => setLoadingData(false));
        } else if (authView === 'addresses') {
            setLoadingData(true);
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${userProfile.firebaseUid}/addresses`)
                .then(res => setUserAddresses(res.data)).catch(console.error).finally(() => setLoadingData(false));
        }
    }, [authView, userProfile]);

    const pathname = usePathname();
    if (pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/login') || pathname.startsWith('/master-panel'))) return null;

    const syncUserWithBackend = async (firebaseUser, displayName) => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/sync`, {
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                name: displayName || firebaseUser.displayName || 'Πελάτης'
            });
            localStorage.setItem('zesto_user', JSON.stringify(res.data));
            setUserProfile(res.data);
            setIsLoggedIn(true);
            setAuthView('menu');
            toast.dismiss();
            toast.success("Επιτυχής Σύνδεση!");
        } catch (error) {
            console.error("Σφάλμα Backend", error);
            toast.dismiss(); toast.error("Πρόβλημα σύνδεσης με τον διακομιστή");
        }
    };

    const handleGoogleLogin = async () => {
        toast.loading("Σύνδεση με Google...");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await syncUserWithBackend(result.user, result.user.displayName);
        } catch (error) { toast.dismiss(); toast.error("Η σύνδεση ακυρώθηκε"); }
    };

    const handleAppleLogin = async () => {
        // Η σύνδεση με Apple απαιτεί Developer Account, οπότε προς το παρόν βάζουμε ένα μήνυμα
        toast.success("Η σύνδεση με Apple θα ενεργοποιηθεί σύντομα!");
    };
    
    const handleEmailAuth = async (e) => {
        e.preventDefault();
        toast.loading(authView === 'login' ? "Σύνδεση..." : "Δημιουργία...");
        try {
            if (authView === 'login') {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await syncUserWithBackend(result.user, null);
            } else {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await syncUserWithBackend(result.user, name);
            }
        } catch (error) {
            toast.dismiss(); toast.error("Σφάλμα σύνδεσης. Ελέγξτε τα στοιχεία σας.");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem('zesto_user');
        setUserProfile(null); setIsLoggedIn(false); setAuthView('menu');
        toast.success("Αποσυνδεθήκατε");
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        if(!newAddr.street) return toast.error("Συμπληρώστε την οδό!");
        const toastId = toast.loading("Αποθήκευση...");
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/${userProfile.firebaseUid}/addresses`, newAddr);
            setUserAddresses([...userAddresses, res.data]);
            setShowNewAddressForm(false);
            setNewAddr({ label: 'Σπίτι', street: '', floor: '', bell: '' });
            toast.success("Αποθηκεύτηκε!", { id: toastId });
        } catch(e) { toast.error("Σφάλμα", { id: toastId }); }
    };

    const handleDeleteAddress = async (id) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${userProfile.firebaseUid}/addresses/${id}`);
            setUserAddresses(userAddresses.filter(a => a.id !== id));
            toast.success("Διαγράφηκε");
        } catch(e) { toast.error("Σφάλμα διαγραφής"); }
    };

    const closeMenu = () => { setIsCustomerMenuOpen(false); setTimeout(() => setAuthView('menu'), 300); };

    return (
        <>
            <header className="bg-olive-900 border-b border-olive-800 sticky top-0 z-50 shadow-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo1.png" alt="Zesto Logo" className="h-14 w-auto" />
                        <h1 className="text-white font-black text-xl tracking-tighter uppercase">ZESTO</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleCart} className="relative text-white hover:text-olive-200 transition-all p-2 bg-olive-800 rounded-full flex items-center justify-center w-10 h-10 shadow-lg border border-olive-700">
                            <ShoppingCart size={18} />
                            <span className="absolute -top-1 -right-1 bg-olive-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-olive-900">{isMounted ? totalItems : 0}</span>
                        </button>
                        <button onClick={() => setIsCustomerMenuOpen(true)} className="relative text-white hover:text-olive-200 transition-all p-2 bg-olive-800 rounded-full flex items-center justify-center w-10 h-10 shadow-lg border border-olive-700">
                            <UserCog size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {isCustomerMenuOpen && (
                <div className="fixed inset-0 z-[150] flex">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMenu}></div>
                    <div className="relative w-96 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in-left ml-auto">
                        
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div className="flex items-center gap-2">
                                {authView !== 'menu' && <button onClick={() => { setAuthView('menu'); setShowNewAddressForm(false); }} className="p-1 -ml-2 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft size={20} /></button>}
                                <h2 className="text-xl font-black text-gray-900 uppercase">
                                    {authView === 'menu' ? 'Λογαριασμος' : authView === 'profile' ? 'Προφιλ' : authView === 'orders' ? 'Ιστορικο' : authView === 'addresses' ? 'Διευθυνσεις' : 'Συνδεση'}
                                </h2>
                            </div>
                            <button onClick={closeMenu} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
                            {authView === 'menu' && (
                                <>
                                    {!isLoggedIn ? (
                                        <div className="flex flex-col gap-3 mb-4 animate-fade-in">
                                            <button onClick={handleGoogleLogin} className="w-full bg-white border border-gray-200 text-gray-800 p-3.5 rounded-2xl font-black shadow-sm hover:bg-gray-50 flex items-center justify-center gap-3 transition-colors">
                                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google
                                            </button>
                                            
                                            {/* ΕΔΩ ΠΡΟΣΤΕΘΗΚΕ ΞΑΝΑ ΤΟ APPLE SIGN IN */}
                                            <button onClick={handleAppleLogin} className="w-full bg-black text-white p-3.5 rounded-2xl font-black shadow-md hover:bg-gray-800 flex items-center justify-center gap-3 transition-colors">
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.34-.73 3.83-.61 1.2.14 2.28.66 2.94 1.55-2.55 1.42-2.12 4.88.35 5.86-.54 1.5-1.26 3.16-2.2 4.37zm-3.32-14.4c.16-1.57-1.12-3.1-2.66-3.23-.26 1.63 1.2 3.09 2.66 3.23z"/></svg>
                                                Apple
                                            </button>
                                            
                                            <div className="relative flex py-2 items-center">
                                                <div className="flex-grow border-t border-gray-200"></div>
                                                <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Η</span>
                                                <div className="flex-grow border-t border-gray-200"></div>
                                            </div>
                                            
                                            <button onClick={() => setAuthView('login')} className="w-full bg-olive-900 text-white p-3.5 rounded-2xl font-black uppercase tracking-widest shadow-md hover:bg-black transition-colors">
                                                Με Email
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-olive-50 p-4 rounded-2xl border border-olive-100 mb-2 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-olive-200 rounded-full flex items-center justify-center text-olive-800 font-black">{userProfile?.name?.charAt(0) || 'U'}</div>
                                            <div>
                                                <p className="font-black text-olive-900 text-sm">{userProfile?.name}</p>
                                                <p className="text-[10px] text-olive-500 font-bold">{userProfile?.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setAuthView('profile')} disabled={!isLoggedIn} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 font-bold transition-all ${isLoggedIn ? 'bg-gray-50 hover:bg-gray-100 text-gray-800' : 'bg-transparent text-gray-300 cursor-not-allowed'}`}><User size={20} /> Το Προφίλ μου</button>
                                        <button onClick={() => setAuthView('orders')} disabled={!isLoggedIn} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 font-bold transition-all ${isLoggedIn ? 'bg-gray-50 hover:bg-gray-100 text-gray-800' : 'bg-transparent text-gray-300 cursor-not-allowed'}`}><Package size={20} /> Ιστορικό Παραγγελιών</button>
                                        <button onClick={() => setAuthView('addresses')} disabled={!isLoggedIn} className={`w-full text-left p-4 rounded-xl flex items-center gap-4 font-bold transition-all ${isLoggedIn ? 'bg-gray-50 hover:bg-gray-100 text-gray-800' : 'bg-transparent text-gray-300 cursor-not-allowed'}`}><MapPin size={20} /> Οι Διευθύνσεις μου</button>
                                        {isLoggedIn && <button onClick={handleLogout} className="w-full text-left p-4 rounded-xl flex items-center gap-4 font-bold text-red-500 hover:bg-red-50 mt-4 border border-transparent hover:border-red-100 transition-all"><LogOut size={20} /> Αποσύνδεση</button>}
                                    </div>

                                    {/* --- ΝΕΟ: ΕΝΕΡΓΗ ΠΑΡΑΓΓΕΛΙΑ (GUEST ΚΑΙ LOGGED IN) --- */}
                                    {activeOrderId && (
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Ενεργη Παραγγελια</p>
                                            <Link 
                                                href={`/track/${activeOrderId}`} 
                                                onClick={closeMenu} 
                                                className="w-full bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-orange-100 transition-colors shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-md">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-black text-orange-900 text-sm">Προβολή Εξέλιξης</h4>
                                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Live Tracking</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}

                            {(authView === 'login' || authView === 'register') && (
                                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                                    {authView === 'register' && <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Ονομα</label><input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 font-bold" /></div>}
                                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Email</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 font-bold" /></div>
                                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Κωδικός</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 font-bold" /></div>
                                    <button type="submit" className="w-full bg-olive-900 text-white p-4 rounded-2xl font-black uppercase shadow-md mt-2">{authView === 'login' ? 'Εισοδος' : 'Δημιουργια'}</button>
                                    <div className="text-center mt-2 font-bold text-sm text-gray-500">{authView === 'login' ? <span onClick={()=>setAuthView('register')} className="cursor-pointer text-olive-600">Νέος χρήστης; Εγγραφή</span> : <span onClick={()=>setAuthView('login')} className="cursor-pointer text-olive-600">Έχετε λογαριασμό; Σύνδεση</span>}</div>
                                </form>
                            )}

                            {authView === 'profile' && (
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Ονομα</label><input type="text" defaultValue={userProfile?.name} className="w-full p-4 rounded-xl border border-gray-200 bg-white font-bold" /></div>
                                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Email</label><input type="email" defaultValue={userProfile?.email} disabled className="w-full p-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 font-bold cursor-not-allowed" /></div>
                                    <button className="w-full bg-olive-900 text-white p-4 rounded-2xl font-black uppercase shadow-md mt-4" onClick={() => toast.success("Αποθηκεύτηκαν!")}>Αποθηκευση</button>
                                </div>
                            )}

                            {authView === 'orders' && (
                                <div className="flex flex-col h-full">
                                    {loadingData ? <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-900"></div></div>
                                    : userOrders.length === 0 ? <div className="text-center py-10"><Package size={48} className="mx-auto text-gray-200 mb-4" /><p className="font-bold text-gray-400">Δεν υπάρχουν παραγγελίες.</p></div>
                                    : <div className="space-y-4">{userOrders.map((order, idx) => (
                                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                                            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                                                <div><span className="text-[10px] font-black uppercase text-gray-400">Κωδικός: {order.trackingCode}</span><h4 className="font-black text-gray-900 text-sm mt-1">{order.orderType === 'delivery' ? 'Διανομή' : 'Παραλαβή'}</h4></div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${order.status === 'PENDING' || order.status === 'ACCEPTED' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{order.status === 'PENDING' ? 'Σε αναμονη' : order.status === 'ACCEPTED' ? 'Ετοιμαζεται' : 'Ολοκληρωθηκε'}</span>
                                            </div>
                                            <div className="space-y-1 mb-3">{order.items?.map((item, i) => <p key={i} className="text-xs font-bold text-gray-600">{item.quantity}x {item.dish?.name}</p>)}</div>
                                        </div>
                                    ))}</div>}
                                </div>
                            )}

                            {authView === 'addresses' && (
                                <div className="flex flex-col h-full gap-4">
                                    {showNewAddressForm ? (
                                        <form onSubmit={handleSaveAddress} className="space-y-4 animate-fade-in bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={()=>setNewAddr({...newAddr, label:'Σπίτι'})} className={`flex-1 py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-1 ${newAddr.label==='Σπίτι'?'bg-olive-900 text-white':'bg-white text-gray-500 border border-gray-200'}`}><Home size={14}/> Σπίτι</button>
                                                <button type="button" onClick={()=>setNewAddr({...newAddr, label:'Γραφείο'})} className={`flex-1 py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-1 ${newAddr.label==='Γραφείο'?'bg-olive-900 text-white':'bg-white text-gray-500 border border-gray-200'}`}><Briefcase size={14}/> Γραφείο</button>
                                                <button type="button" onClick={()=>setNewAddr({...newAddr, label:'Άλλο'})} className={`flex-1 py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-1 ${newAddr.label==='Άλλο'?'bg-olive-900 text-white':'bg-white text-gray-500 border border-gray-200'}`}><Navigation size={14}/> Άλλο</button>
                                            </div>
                                            <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Οδός & Αριθμός</label><input required type="text" value={newAddr.street} onChange={(e)=>setNewAddr({...newAddr, street: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" placeholder="π.χ. Ερμού 12"/></div>
                                            <div className="flex gap-3">
                                                <div className="flex-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Όροφος</label><input type="text" value={newAddr.floor} onChange={(e)=>setNewAddr({...newAddr, floor: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm"/></div>
                                                <div className="flex-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Κουδούνι</label><input type="text" value={newAddr.bell} onChange={(e)=>setNewAddr({...newAddr, bell: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm"/></div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={()=>setShowNewAddressForm(false)} className="flex-1 p-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200">Ακύρωση</button>
                                                <button type="submit" className="flex-1 p-3 rounded-xl font-black text-white bg-olive-900 shadow-md">Αποθήκευση</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <button onClick={() => setShowNewAddressForm(true)} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-olive-500 hover:text-olive-700 transition-colors"><Plus size={18}/> Νέα Διεύθυνση</button>
                                            
                                            {loadingData ? <div className="flex justify-center items-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-olive-900"></div></div>
                                            : userAddresses.length === 0 ? <div className="text-center py-6 text-sm font-bold text-gray-400">Δεν υπάρχουν αποθηκευμένες διευθύνσεις.</div>
                                            : <div className="space-y-3">{userAddresses.map((addr) => (
                                                <div key={addr.id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center group">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {addr.label==='Σπίτι'?<Home size={14} className="text-olive-600"/>:addr.label==='Γραφείο'?<Briefcase size={14} className="text-olive-600"/>:<Navigation size={14} className="text-olive-600"/>}
                                                            <span className="text-xs font-black text-olive-900 uppercase">{addr.label}</span>
                                                        </div>
                                                        <p className="font-bold text-gray-900 text-sm">{addr.street}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold">Ορ: {addr.floor || '-'} | Κουδ: {addr.bell || '-'}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                                                </div>
                                            ))}</div>}
                                        </>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}