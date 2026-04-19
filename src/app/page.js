// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
/* global process */
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCartStore } from '@/store/useCartStore';
import ProductModal from '../components/ProductModal';
import { Plus, Search, Heart, Clock, MapPin, Phone, Utensils, Truck, Star, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';

export default function Home() {
    const [dailyMenu, setDailyMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Όλα');
    const [favorites, setFavorites] = useState([]);
    const [storeSettings, setStoreSettings] = useState({ open: true, categoryOrder: [] });

    const isStoreOpen = storeSettings.open !== false;
    const { openModal } = useCartStore();


    // 1. DATA FETCHING & POLLING
    useEffect(() => {
        const fetchData = async () => {
            try {
                const menuRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dishes/active?t=${new Date().getTime()}`);
                setDailyMenu(menuRes.data);

                const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${new Date().getTime()}`);
                if (settingsRes.data) {
                    setStoreSettings({
                        ...settingsRes.data,
                        categoryOrder: settingsRes.data.categoryOrder || []
                    });
                }
            } catch (error) {
                console.error("Σφάλμα φόρτωσης:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
        const interval = setInterval(fetchData, 30000);
        const savedFavs = localStorage.getItem('mageireio_favorites');
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        return () => clearInterval(interval);
    }, []);

    // 2. LOGIC FUNCTIONS
    const toggleFavorite = (dishId) => {
        let updatedFavs = favorites.includes(dishId)
            ? favorites.filter(id => id !== dishId)
            : [...favorites, dishId];
        setFavorites(updatedFavs);
        localStorage.setItem('mageireio_favorites', JSON.stringify(updatedFavs));
        toast(favorites.includes(dishId) ? 'Αφαιρέθηκε' : 'Προστέθηκε!', { icon: favorites.includes(dishId) ? '💔' : '❤️' });
    };

    // ΝΕΟ SORT: Ταξινομούμε τα ΚΟΥΜΠΙΑ των κατηγοριών με βάση το storeSettings
    const rawCategories = [...new Set(dailyMenu.map(d => d.category).filter(Boolean))];
    rawCategories.sort((catA, catB) => {
        const orderArr = storeSettings.categoryOrder || [];
        let indexA = orderArr.indexOf(catA);
        let indexB = orderArr.indexOf(catB);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
    });
    const categories = ['Όλα', 'Αγαπημένα', ...rawCategories];

    const filteredMenu = dailyMenu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'Όλα' ? true :
            selectedCategory === 'Αγαπημένα' ? favorites.includes(item.id) :
                item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // 3. COMPONENTS
    const DishCard = ({ item }) => {
        const isSoldOut = item.availablePortions === 0;
        const isFav = favorites.includes(item.id);

        return (
            <div className={`bg-white rounded-3xl p-4 shadow-sm border border-olive-100 flex flex-col justify-between transition-all duration-300 relative ${isSoldOut ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1 group'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                    className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur p-2 rounded-full shadow-md hover:scale-110 transition-transform"
                >
                    <Heart size={18} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>

                <div>
                    <div className="w-full h-44 bg-olive-50 rounded-2xl mb-4 overflow-hidden relative">
                        <img src={item?.imageUrl || '/logo.png'} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        {isSoldOut && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
                                <span className="bg-white text-black font-black px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest shadow-xl border-2 border-black">Εξαντλήθηκε</span>
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-olive-900 mb-1 leading-tight">{item.name}</h3>
                    <p className="text-xs text-olive-500 font-bold line-clamp-2 mb-2">{item.description || 'Φρεσκομαγειρεμένο με αγνά υλικά.'}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-olive-50 pt-4">
                    <span className="text-xl font-black text-olive-900">{item.price.toFixed(2)}€</span>
                    <button
                        disabled={isSoldOut || !isStoreOpen}
                        onClick={() => openModal(item)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isSoldOut || !isStoreOpen ? 'bg-gray-100 text-gray-400' : 'bg-olive-900 text-white hover:bg-orange-500 shadow-lg active:scale-90'}`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-olive-50/50">
            <ProductModal />

            {/* --- 1. HERO SECTION --- */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070"
                        className="w-full h-full object-cover scale-105"
                        alt="Hero background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-olive-50"></div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in-up">
                    <span className="inline-block bg-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-lg">
                        Ανοιχτά Καθημερινά από τις 12:00
                    </span>
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
                        Φαγητό <br/> <span className="text-orange-500">με ψυχή.</span>
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl font-bold mb-10 max-w-2xl mx-auto leading-relaxed">
                        Στο Μαγειρείο μας, κάθε πιάτο διηγείται μια ιστορία. Ανακαλύψτε τις γεύσεις που αγαπήσατε, μαγειρεμένες σήμερα.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => document.getElementById('menu-section').scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-white text-olive-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-2xl active:scale-95"
                        >
                            Παραγγείλτε Τώρα
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
                    <ChevronDown size={32} />
                </div>
            </section>

            {/* --- 2. INFO BAR --- */}
            <div className="relative z-20 -mt-12 max-w-6xl mx-auto px-6">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-olive-100 p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="flex items-center gap-5 border-b md:border-b-0 md:border-r border-olive-50 pb-6 md:pb-0">
                        <div className="bg-orange-100 p-4 rounded-2xl text-orange-600"><MapPin size={28} /></div>
                        <div>
                            <p className="text-[10px] font-black text-olive-400 uppercase tracking-widest">Διεύθυνση</p>
                            <p className="font-black text-olive-900 text-lg">Παρόδου 27, Αθήνα</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 border-b md:border-b-0 md:border-r border-olive-50 pb-6 md:pb-0">
                        <div className="bg-green-100 p-4 rounded-2xl text-green-600"><Phone size={28} /></div>
                        <div>
                            <p className="text-[10px] font-black text-olive-400 uppercase tracking-widest">Τηλέφωνο</p>
                            <p className="font-black text-olive-900 text-lg text-nowrap">210 1234567</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${isStoreOpen ? 'bg-olive-100 text-olive-600' : 'bg-red-100 text-red-600'}`}>
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-olive-400 uppercase tracking-widest">Κατάσταση</p>
                            <p className={`font-black text-lg ${isStoreOpen ? 'text-olive-600' : 'text-red-600'}`}>
                                {isStoreOpen ? 'ΑΝΟΙΧΤΟ ΤΩΡΑ' : 'ΚΛΕΙΣΤΟ'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 4. CATALOG SECTION --- */}
            <section id="menu-section" className="bg-white py-16 md:py-24 rounded-t-[5rem] shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
                <div className="max-w-7xl mx-auto px-6">

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 border-b border-olive-50 pb-8">
                        <div className="max-w-md">
                            <h2 className="text-4xl md:text-5xl font-black text-olive-900 uppercase tracking-tighter mb-3 italic">Το Μενού της Ημέρας</h2>
                            <p className="text-olive-400 font-bold text-sm">Χρησιμοποιήστε τα φίλτρα για να βρείτε ακριβώς αυτό που τραβάει η όρεξή σας.</p>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-300" size={18} />
                            <input
                                type="text"
                                placeholder="Αναζήτηση..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-olive-50 border-none font-bold text-olive-900 focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ: Sidebar Κατηγοριών */}
                        <div className="w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-28 z-10 bg-white pt-2 lg:pt-0">
                            <h3 className="hidden lg:block font-black text-olive-900 uppercase tracking-widest mb-4 px-2 text-sm">Κατηγοριες</h3>

                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide snap-x">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`snap-start whitespace-nowrap text-left px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-between gap-2 ${
                                            selectedCategory === cat
                                                ? 'bg-olive-900 text-white shadow-md lg:translate-x-2'
                                                : 'bg-olive-50 text-olive-500 hover:bg-olive-100 hover:text-olive-900'
                                        }`}
                                    >
                            <span className="flex items-center gap-2">
                                {cat === 'Αγαπημένα' && <Heart size={14} className={selectedCategory === cat ? 'fill-white' : 'text-red-500 fill-red-500'} />}
                                {cat}
                            </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ΔΕΞΙΑ ΣΤΗΛΗ: Το Μενού (Η μία κατηγορία κάτω από την άλλη) */}
                        <div className="flex-1 w-full min-w-0">

                            {!isStoreOpen && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest border-2 border-red-100 mb-8 animate-pulse">
                                    <Clock size={16} /> Το κατάστημα είναι κλειστό. Δεν δεχόμαστε νέες παραγγελίες.
                                </div>
                            )}

                            {loading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-56 bg-olive-50 animate-pulse rounded-[1.5rem]"></div>)}
                                </div>
                            ) : (
                                <>
                                    {selectedCategory === 'Όλα' && searchQuery === '' ? (
                                        <div className="flex flex-col space-y-16">
                                            {Object.entries(
                                                filteredMenu.reduce((acc, dish) => {
                                                    const cat = dish.category || 'Διάφορα';
                                                    if (!acc[cat]) acc[cat] = [];
                                                    acc[cat].push(dish);
                                                    return acc;
                                                }, {})
                                            )
                                                // ΝΕΟ SORT: Ταξινομούμε και τα ΠΙΑΤΑ με βάση το storeSettings
                                                .sort(([catA], [catB]) => {
                                                    const orderArr = storeSettings.categoryOrder || [];
                                                    let indexA = orderArr.indexOf(catA);
                                                    let indexB = orderArr.indexOf(catB);
                                                    if (indexA === -1) indexA = 999;
                                                    if (indexB === -1) indexB = 999;
                                                    return indexA - indexB;
                                                })
                                                .map(([categoryName, categoryDishes]) => (
                                                    <div key={categoryName} className="animate-fade-in">
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <h2 className="text-xl md:text-2xl font-black text-olive-900 uppercase tracking-tight">{categoryName}</h2>
                                                            <div className="flex-1 h-px bg-olive-100"></div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {categoryDishes.map(dish => <DishCard key={dish.id} item={dish} />)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                                            {filteredMenu.map((dish) => <DishCard key={dish.id} item={dish} />)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* --- 3. FEATURES --- */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-olive-900 uppercase tracking-tighter mb-4">Γιατί να μας προτιμήσετε</h2>
                    <div className="w-20 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        { icon: <Utensils size={32} />, title: "Αγνά Υλικά", desc: "Κάθε πρωί επιλέγουμε τα καλύτερα λαχανικά και κρέατα από ντόπιους παραγωγούς." },
                        { icon: <Truck size={32} />, title: "Γρήγορη Παράδοσή", desc: "Η παραγγελία σας φτάνει ζεστή και λαχταριστή στην πόρτα σας σε λιγότερο από 30'." },
                        { icon: <Star size={32} />, title: "Σπιτικές Γεύσεις", desc: "Μαγειρεύουμε με τις παραδοσιακές συνταγές που αγαπήσαμε, χωρίς συντηρητικά." }
                    ].map((feat, idx) => (
                        <div key={idx} className="bg-white p-10 rounded-[3rem] shadow-sm border border-olive-50 hover:shadow-xl transition-all text-center group">
                            <div className="w-20 h-20 bg-olive-50 rounded-[2rem] flex items-center justify-center mx-auto text-olive-900 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 mb-6 shadow-inner">
                                {feat.icon}
                            </div>
                            <h3 className="font-black text-xl text-olive-900 uppercase mb-4 tracking-tight">{feat.title}</h3>
                            <p className="text-olive-500 font-bold text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Footer storeSettings={storeSettings} />
        </div>
    );
}
