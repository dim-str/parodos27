// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
/* global process */
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '../../../store/useCartStore';
import ProductModal from '../../../components/ProductModal';
import Footer from '../../../components/Footer';
import { Plus, Search, Heart, Clock, ShoppingBag, Tag, Percent, Info, Utensils } from 'lucide-react';

const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#ffffff';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

const normalizeGreeklish = (text) => {
    if (!text) return '';
    let str = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const grMap = { 'α':'a', 'β':'v', 'γ':'g', 'δ':'d', 'ε':'e', 'ζ':'z', 'η':'i', 'θ':'th', 'ι':'i', 'κ':'k', 'λ':'l', 'μ':'m', 'ν':'n', 'ξ':'x', 'ο':'o', 'π':'p', 'ρ':'r', 'σ':'s', 'ς':'s', 'τ':'t', 'υ':'y', 'φ':'f', 'χ':'x', 'ψ':'ps', 'ω':'o' };
    return str.split('').map(char => grMap[char] || char).join('');
};

export default function StoreMenu() {
    const params = useParams();
    const storeSlug = params.storeSlug;

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const [dailyMenu, setDailyMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeError, setStoreError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Όλα');
    const [favorites, setFavorites] = useState([]);
    const [storeSettings, setStoreSettings] = useState({ open: true, categoryOrder: [], primaryColor: '#F97316' });

    const isStoreOpen = storeSettings.open !== false;
    
    // ZUSTAND
    const items = useCartStore((state) => state.items) || [];
    const openModal = useCartStore((state) => state.openModal);
    const toggleCart = useCartStore((state) => state.toggleCart);
    
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const themeColor = storeSettings.primaryColor || '#F97316';
    const themeContrast = getContrastColor(themeColor);

    useEffect(() => {
        if (!storeSlug) return;
        const fetchData = async () => {
            try {
                setStoreError(false);
                const menuRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${storeSlug}/dishes?t=${new Date().getTime()}`);
                setDailyMenu(menuRes.data);

                const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${storeSlug}/settings?t=${new Date().getTime()}`);
                if (settingsRes.data) {
                    setStoreSettings({
                        ...settingsRes.data,
                        categoryOrder: settingsRes.data.categoryOrder || [],
                        primaryColor: settingsRes.data.primaryColor || '#F97316'
                    });
                }
            } catch (error) {
                setStoreError(true);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
        const savedFavs = localStorage.getItem(`mageireio_favorites_${storeSlug}`);
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
    }, [storeSlug]);

    const toggleFavorite = (dishId) => {
        let updatedFavs = favorites.includes(dishId) ? favorites.filter(id => id !== dishId) : [...favorites, dishId];
        setFavorites(updatedFavs);
        localStorage.setItem(`mageireio_favorites_${storeSlug}`, JSON.stringify(updatedFavs));
    };

    const calculateFinalPrice = (dish) => {
        let currentPrice = dish.discountPrice !== null && dish.discountPrice !== undefined ? dish.discountPrice : dish.price;
        if (storeSettings?.globalDiscountPercentage > 0) currentPrice = currentPrice - (currentPrice * (storeSettings.globalDiscountPercentage / 100));
        else if (storeSettings?.categoryDiscountName === dish.category && storeSettings?.categoryDiscountPercentage > 0) currentPrice = currentPrice - (currentPrice * (storeSettings.categoryDiscountPercentage / 100));
        return dish.isCombo ? dish.price : currentPrice;
    };

    const discountedDishes = dailyMenu.filter(d => calculateFinalPrice(d) < d.price && !d.isCombo);
    const comboDishes = dailyMenu.filter(d => d.isCombo);

    const rawCategories = [...new Set(dailyMenu.map(d => d.category).filter(Boolean))];
    rawCategories.sort((catA, catB) => {
        const orderArr = storeSettings.categoryOrder || [];
        let indexA = orderArr.indexOf(catA);
        let indexB = orderArr.indexOf(catB);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const cleanCategories = rawCategories.filter(c => c !== 'Combo Deals' && c !== 'Combos');
    
    const categories = ['Όλα', 'Αγαπημένα'];
    if (discountedDishes.length > 0) categories.push('Προσφορές');
    if (comboDishes.length > 0) categories.push('Combo Deals');
    categories.push(...cleanCategories);

    const filteredMenu = dailyMenu.filter(item => {
        const searchNorm = normalizeGreeklish(searchQuery);
        const matchesSearch = normalizeGreeklish(item.name).includes(searchNorm) || (item.description && normalizeGreeklish(item.description).includes(searchNorm));
        let matchesCategory = true;
        
        if (selectedCategory === 'Όλα') {
            matchesCategory = !item.isCombo; 
        } else if (selectedCategory === 'Αγαπημένα') {
            matchesCategory = favorites.includes(item.id);
        } else if (selectedCategory === 'Προσφορές') {
            matchesCategory = discountedDishes.some(d => d.id === item.id);
        } else if (selectedCategory === 'Combo Deals') {
            matchesCategory = item.isCombo;
        } else {
            matchesCategory = item.category === selectedCategory && !item.isCombo;
        }

        return matchesSearch && matchesCategory;
    });

    const DishCard = ({ item }) => {
        const isSoldOut = item.availablePortions === 0;
        const isFav = favorites.includes(item.id);
        const hasImage = item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0;
        const finalPrice = calculateFinalPrice(item);
        const itemForModal = { ...item, price: finalPrice };

        return (
            <div
                className={`flex flex-row gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all ${isSoldOut ? 'opacity-50 grayscale' : 'cursor-pointer hover:shadow-md'}`}
                onClick={() => !isSoldOut && isStoreOpen && openModal(itemForModal)}
            >
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-black text-gray-900 leading-tight mb-1 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description || 'Φρέσκα υλικά, μαγειρεμένα σήμερα.'}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-black text-gray-900">{finalPrice.toFixed(2)}€</span>
                        {finalPrice < item.price && <span className="text-xs text-red-500 line-through">{item.price.toFixed(2)}€</span>}
                    </div>
                </div>

                <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                    {hasImage ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><Utensils size={24} /></div>
                    )}
                    
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} className="absolute top-2 left-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                        <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    </button>

                    <button
                        disabled={!isStoreOpen || isSoldOut}
                        className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full shadow-md transition-all ${!isStoreOpen || isSoldOut ? 'bg-gray-100 text-gray-400' : 'bg-white hover:scale-110'}`}
                        style={{ color: (!isStoreOpen || isSoldOut) ? '#9ca3af' : themeColor }}
                        onClick={(e) => { e.stopPropagation(); !isSoldOut && isStoreOpen && openModal(itemForModal); }}
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>
        );
    };

    if (storeError) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><h1 className="text-2xl font-bold">Το κατάστημα δεν βρέθηκε.</h1></div>;

    return (
        // Αφαιρέθηκε το lg:pr-[450px] ώστε το layout να πιάνει όλη την οθόνη.
        <div className="min-h-screen bg-[#F9FAFB] font-sans pb-32 lg:pb-0">
            <ProductModal />

            {/* HERO SECTION */}
            <section className="relative w-full bg-white pb-6">
                <div className="relative w-full h-48 md:h-72 bg-gray-200">
                    <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="Cover" />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-6 relative -mt-12 md:-mt-16 z-10">
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-100">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{storeSettings.storeName || 'Το Μαγειρειο'}</h1>
                                <span className="relative flex h-3 w-3">
                                    {isStoreOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: themeColor }}></span>}
                                    <span className={`relative inline-flex rounded-full h-full w-full ${isStoreOpen ? '' : 'bg-red-500'}`} style={{ backgroundColor: isStoreOpen ? themeColor : undefined }}></span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                                <span className="flex items-center gap-1.5"><Clock size={16}/> 30-40 min</span>
                                <span className="flex items-center gap-1.5"><ShoppingBag size={16}/> Ελάχιστη: 5.00€</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" placeholder="Αναζήτηση πιάτου..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100/50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-4 transition-all outline-none text-gray-900 font-bold text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STICKY CATEGORY NAV */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex overflow-x-auto py-4 px-4 md:px-6 gap-3 pb-4 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-black text-sm transition-all duration-300 border-2 flex items-center gap-2`}
                                style={
                                    selectedCategory === cat 
                                    ? { backgroundColor: themeColor, borderColor: themeColor, color: themeContrast } 
                                    : { backgroundColor: 'transparent', borderColor: '#f3f4f6', color: '#6b7280' }
                                }
                            >
                                {cat === 'Προσφορές' && <Percent size={14} />}
                                {cat === 'Combo Deals' && <Tag size={14} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MENU GRID */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 lg:py-12">
                {!isStoreOpen && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm mb-8 border border-red-100">
                        <Info size={20} /> Το κατάστημα είναι κλειστό. Δεν δεχόμαστε παραγγελίες αυτή τη στιγμή.
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl w-full"></div>)}
                    </div>
                ) : (
                    <>
                        {selectedCategory === 'Όλα' && searchQuery === '' ? (
                            <>
                                {/* ΕΝΟΤΗΤΑ 1: ΠΡΟΣΦΟΡΕΣ (Πάνω-πάνω) */}
                                {discountedDishes.length > 0 && (
                                    <div className="mb-12">
                                        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
                                            <Percent className="text-red-500" size={24} />
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Προσφορές</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {discountedDishes.map(dish => <DishCard key={dish.id} item={dish} />)}
                                        </div>
                                    </div>
                                )}

                                {/* ΕΝΟΤΗΤΑ 2: COMBO DEALS */}
                                {comboDishes.length > 0 && (
                                    <div className="mb-12">
                                        <div className="flex items-center gap-2 mb-4 border-b-2 border-gray-100 pb-2">
                                            <Tag className="text-orange-500" size={24} />
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Combo Deals</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {comboDishes.map(combo => <DishCard key={combo.id} item={combo} />)}
                                        </div>
                                    </div>
                                )}

                                {/* ΕΝΟΤΗΤΑ 3: ΟΛΕΣ ΟΙ ΚΑΤΗΓΟΡΙΕΣ (Ομαδοποιημένες) */}
                                {cleanCategories.map(category => {
                                    const categoryItems = filteredMenu.filter(item => item.category === category);
                                    if (categoryItems.length === 0) return null;

                                    return (
                                        <div key={category} className="mb-12">
                                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4 border-b-2 border-gray-100 pb-2">
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                {categoryItems.map(dish => <DishCard key={dish.id} item={dish} />)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredMenu.map((dish) => <DishCard key={dish.id} item={dish} />)}
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer storeSettings={storeSettings} storeSlug={storeSlug} />

            {/* FLOATING CART (Κρύβεται στους υπολογιστές με το lg:hidden καθώς έχουν το header cart button) */}
            {isMounted && cartItemCount > 0 && (
                <div className="fixed lg:hidden bottom-6 left-4 right-4 z-50 animate-fade-in">
                    <button 
                        onClick={toggleCart} 
                        className="w-full py-4 rounded-2xl font-black shadow-2xl flex items-center justify-between px-6 transition-transform active:scale-95"
                        style={{ backgroundColor: themeColor, color: themeContrast }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-sm">{cartItemCount}</div>
                            <span>Το Καλάθι μου</span>
                        </div>
                        <span className="text-lg">{cartTotal.toFixed(2)}€</span>
                    </button>
                </div>
            )}

            <style jsx global>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 6px; }`}</style>
        </div>
    );
}