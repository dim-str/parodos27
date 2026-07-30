'use client';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Megaphone, Activity, Tag, Gift, Plus, X, Trash2, Filter } from 'lucide-react';

export default function CampaignsTab({ dishes, fetchDishes, storeSettings, setStoreSettings, authToken, orders }) {
    const [subTab, setSubTab] = useState('analytics'); 
    
    // States για Εκπτώσεις
    const [globalDiscount, setGlobalDiscount] = useState(storeSettings.globalDiscountPercentage || 0);
    const [categoryDiscountPercentage, setCategoryDiscountPercentage] = useState(storeSettings.categoryDiscountPercentage || 0);
    const [categoryDiscountName, setCategoryDiscountName] = useState(storeSettings.categoryDiscountName || '');

    // States για Combos
    const [editingCombo, setEditingCombo] = useState(null);
    const [comboSearch, setComboSearch] = useState('');
    const [comboCategoryFilter, setComboCategoryFilter] = useState('all'); // Το νέο state του φίλτρου
    const [showComboSearch, setShowComboSearch] = useState(false);

    const normalDishes = dishes.filter(d => !d.isCombo);
    const comboDishes = dishes.filter(d => d.isCombo);
    const existingCategories = [...new Set(normalDishes.map(d => d.category).filter(Boolean))];

    // Υπολογισμός Happy Hour (σταθερός)
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
    const timeZoneTraffic = { '12:00 - 15:00': 0, '15:00 - 18:00': 0, '18:00 - 21:00': 0, '21:00 - 00:00': 0 };
    const dayTraffic = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

    completedOrders.forEach(order => {
        const date = order.createdAt ? new Date(order.createdAt) : new Date();
        const dayIdx = date.getDay();
        const hour = date.getHours();
        dayTraffic[dayIdx] += 1;
        if (hour >= 12 && hour < 15) timeZoneTraffic['12:00 - 15:00'] += 1;
        else if (hour >= 15 && hour < 18) timeZoneTraffic['15:00 - 18:00'] += 1;
        else if (hour >= 18 && hour < 21) timeZoneTraffic['18:00 - 21:00'] += 1;
        else if (hour >= 21 || hour < 1) timeZoneTraffic['21:00 - 00:00'] += 1;
    });

    const sortedDays = Object.entries(dayTraffic).sort((a, b) => a[1] - b[1]);
    const lowestDayName = dayNames[sortedDays[0] ? parseInt(sortedDays[0][0]) : 3];
    const sortedHours = Object.entries(timeZoneTraffic).sort((a, b) => a[1] - b[1]);
    const lowestHourBlock = sortedHours[0] ? sortedHours[0][0] : '15:00 - 18:00';

    const saveDiscounts = async () => {
        try {
            const payload = { 
                ...storeSettings, 
                globalDiscountPercentage: parseFloat(globalDiscount) || 0,
                categoryDiscountPercentage: parseFloat(categoryDiscountPercentage) || 0,
                categoryDiscountName: categoryDiscountName
            };
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, payload, { headers: { Authorization: `Bearer ${authToken}` } });
            setStoreSettings(payload);
            toast.success("Οι εκπτώσεις αποθηκεύτηκαν!");
        } catch { toast.error("Αποτυχία αποθήκευσης εκπτώσεων"); }
    };

    const calculateOriginalPrice = (items) => {
        return items.reduce((sum, ci) => {
            const fullDish = dishes.find(d => d.id === ci.dish?.id);
            return sum + ((fullDish?.price || 0) * ci.quantity);
        }, 0);
    };

    const openComboModal = (combo = null) => {
        if (combo) setEditingCombo({ ...combo, comboItems: combo.comboItems || [] });
        else setEditingCombo({ name: '', price: 0, category: 'Combo Deals', availablePortions: -1, active: true, description: '', imageUrl: '', isCombo: true, originalPrice: 0, comboItems: [] });
        setShowComboSearch(false);
        setComboSearch('');
        setComboCategoryFilter('all');
    };

    const saveCombo = async () => {
        if (!editingCombo.name || !editingCombo.comboItems || editingCombo.comboItems.length === 0) {
            toast.error("Συμπληρώστε όνομα και επιλέξτε τουλάχιστον ένα πιάτο!"); 
            return;
        }

        try {
            const payload = { ...editingCombo };
            let targetStoreId = storeSettings?.id || 1;
            if (dishes.length > 0 && dishes[0].store?.id) {
                targetStoreId = dishes[0].store.id;
            }
            payload.storeId = targetStoreId;
            payload.store = { id: targetStoreId };
            payload.originalPrice = calculateOriginalPrice(payload.comboItems);
            payload.comboItems = payload.comboItems.map(ci => ({ quantity: ci.quantity, dish: { id: ci.dish.id } }));
            payload.isCombo = true;
            payload.discountPrice = null;

            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            if (payload.id) await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${payload.id}`, payload, config); 
            else await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dishes`, payload, config); 
            
            setEditingCombo(null);
            fetchDishes();
            toast.success("Το Combo αποθηκεύτηκε με επιτυχία!");
        } catch (error) { 
            toast.error("Σφάλμα αποθήκευσης. Ελέγξτε την κονσόλα."); 
        }
    };

    const deleteCombo = async (id) => {
        if(!window.confirm("Σίγουρα θέλετε να διαγράψετε αυτό το Combo;")) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${id}`, { headers: { Authorization: `Bearer ${authToken}` } });
            fetchDishes();
            toast.success("Το Combo διαγράφηκε!");
        } catch { toast.error("Σφάλμα διαγραφής."); }
    };

    // Προφιλτραρισμένα πιάτα για την αναζήτηση εντός του Combo
    const availableFilteredDishes = normalDishes.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(comboSearch.toLowerCase());
        const matchesCategory = comboCategoryFilter === 'all' || d.category === comboCategoryFilter;
        return d.active && matchesSearch && matchesCategory;
    });

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-olive-100 flex items-center gap-5">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Megaphone size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Καμπάνιες & Marketing</h2>
                    <p className="text-gray-500 font-bold text-sm">Διαχειριστείτε τις εκπτώσεις, τα πακέτα και αναλύστε τη ζήτηση.</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 border-b border-gray-200">
                <button onClick={() => setSubTab('analytics')} className={`pb-4 px-4 font-black text-sm uppercase transition-all flex items-center gap-2 ${subTab === 'analytics' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}><Activity size={18}/> Αναλυση Πωλησεων</button>
                <button onClick={() => setSubTab('discounts')} className={`pb-4 px-4 font-black text-sm uppercase transition-all flex items-center gap-2 ${subTab === 'discounts' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}><Tag size={18}/> Εκπτωσεις Μενού</button>
                <button onClick={() => setSubTab('combos')} className={`pb-4 px-4 font-black text-sm uppercase transition-all flex items-center gap-2 ${subTab === 'combos' ? 'border-b-4 border-orange-500 text-orange-600' : 'text-gray-400 hover:text-gray-700'}`}><Gift size={18}/> Combo Deals</button>
            </div>

            {subTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                    <div className="space-y-6 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h4 className="text-sm font-black uppercase text-gray-800 tracking-wider">Δείκτης Κίνησης ανά Ζώνη Ώρας</h4>
                        {Object.entries(timeZoneTraffic).map(([block, count]) => {
                            const maxCount = Math.max(...Object.values(timeZoneTraffic)) || 1;
                            const percentage = (count / maxCount) * 100;
                            return (
                                <div key={block} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-gray-600"><span>{block}</span><span>{count} παραγγελίες</span></div>
                                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${percentage < 40 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${percentage || 5}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white p-10 rounded-[2rem] flex flex-col justify-center shadow-xl relative overflow-hidden">
                        <div className="space-y-5 z-10">
                            <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-sm">Προτεινόμενη Καμπάνια</span>
                            <h4 className="text-3xl font-black tracking-tight leading-tight">Ενεργοποίηση Happy Hour</h4>
                            <p className="text-gray-400 text-sm font-bold leading-relaxed">Η επιχείρησή σας παρουσιάζει τη χαμηλότερη ροή εσόδων κάθε <span className="text-white font-black bg-gray-800 px-2 py-0.5 rounded">{lowestDayName}</span> στη ζώνη <span className="text-white font-black bg-gray-800 px-2 py-0.5 rounded">{lowestHourBlock}</span>.</p>
                            <button onClick={() => setSubTab('discounts')} className="mt-4 bg-orange-500 text-white font-black px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors">Δημιουργία Έκπτωσης</button>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'discounts' && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-10 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2"><Tag size={20} className="text-orange-500"/> Έκπτωση σε όλο το Μενού</h3>
                            <p className="text-xs font-bold text-gray-500">Μειώνει άμεσα τις τιμές σε όλα τα πιάτα.</p>
                            <div className="flex items-center gap-3">
                                <input type="number" value={globalDiscount} onChange={(e) => setGlobalDiscount(e.target.value)} className="w-24 p-3 bg-gray-50 rounded-xl font-black text-xl text-center border-2 border-gray-200 outline-none focus:border-orange-500" placeholder="0" />
                                <span className="text-2xl font-black text-gray-400">%</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2"><Tag size={20} className="text-blue-500"/> Έκπτωση Κατηγορίας</h3>
                            <p className="text-xs font-bold text-gray-500">Ισχύει μόνο για συγκεκριμένη κατηγορία.</p>
                            <div className="flex flex-col gap-3">
                                <select value={categoryDiscountName} onChange={(e) => setCategoryDiscountName(e.target.value)} className="p-3 bg-gray-50 rounded-xl font-bold border-2 border-gray-200 outline-none focus:border-blue-500">
                                    <option value="">Επιλέξτε Κατηγορία...</option>
                                    {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <div className="flex items-center gap-3">
                                    <input type="number" disabled={!categoryDiscountName} value={categoryDiscountPercentage} onChange={(e) => setCategoryDiscountPercentage(e.target.value)} className="w-24 p-3 bg-gray-50 rounded-xl font-black text-xl text-center border-2 border-gray-200 disabled:opacity-50" placeholder="0" />
                                    <span className="text-2xl font-black text-gray-400">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button onClick={saveDiscounts} className="bg-black text-white font-black px-8 py-4 rounded-xl uppercase hover:bg-gray-800 transition-all shadow-xl">Εφαρμογη Εκπτωσεων</button>
                    </div>
                </div>
            )}

            {subTab === 'combos' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-sm font-bold text-gray-500 max-w-lg">Ενώστε διαφορετικά πιάτα σε ένα πακέτο.</p>
                        <button onClick={() => openComboModal()} className="bg-orange-500 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-all shadow-md"><Plus size={18}/> Νέο Combo</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {comboDishes.map(combo => (
                            <div key={combo.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-black text-lg text-gray-900">{combo.name}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => openComboModal(combo)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"><Megaphone size={16}/></button>
                                            <button onClick={() => deleteCombo(combo.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        {combo.comboItems?.map((ci, idx) => (
                                            <div key={idx} className="text-xs font-bold text-gray-500 flex items-center gap-2"><span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{ci.quantity}x</span> {ci.dish?.name}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-end gap-2 pt-4 border-t border-gray-50">
                                    <span className="text-2xl font-black text-gray-900">{combo.price.toFixed(2)}€</span>
                                    {combo.originalPrice > 0 && <span className="text-sm font-bold text-red-400 line-through mb-1">{combo.originalPrice.toFixed(2)}€</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Δημιουργίας/Επεξεργασίας Combo */}
            {editingCombo && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-2"><Gift size={24} className="text-orange-500"/> {editingCombo.id ? "Επεξεργασία Combo" : "Νέο Combo"}</h2>
                            <button onClick={() => setEditingCombo(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-black text-gray-400 uppercase">Ονομασια Πακετου</label>
                                    <input type="text" value={editingCombo.name} onChange={(e) => setEditingCombo({ ...editingCombo, name: e.target.value })} className="p-3 bg-gray-50 rounded-xl font-bold border-2 focus:border-orange-400 outline-none" placeholder="π.χ. Burger Menu 2 Ατόμων"/>
                                </div>
                                <div className="col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-black text-gray-400 uppercase">Περιγραφη (Προαιρετικο)</label>
                                    <textarea value={editingCombo.description || ''} onChange={(e) => setEditingCombo({ ...editingCombo, description: e.target.value })} className="p-3 bg-gray-50 rounded-xl font-bold h-20 resize-none border-2 focus:border-orange-400 outline-none"></textarea>
                                </div>
                            </div>

                            <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
                                <h4 className="font-black text-gray-900 text-sm uppercase mb-4">Επιλογη Πιατων</h4>
                                <div className="space-y-2 mb-4">
                                    {editingCombo.comboItems.map((ci, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-gray-600">{ci.quantity}x</div>
                                                <span className="font-bold text-sm text-gray-800">{ci.dish?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-gray-50 rounded-lg border">
                                                    <button onClick={() => { const n = [...editingCombo.comboItems]; if(n[idx].quantity > 1) { n[idx].quantity -= 1; setEditingCombo({...editingCombo, comboItems: n}); } }} className="px-3 py-1 font-black text-gray-500 hover:text-black">-</button>
                                                    <span className="text-xs font-black">{ci.quantity}</span>
                                                    <button onClick={() => { const n = [...editingCombo.comboItems]; n[idx].quantity += 1; setEditingCombo({...editingCombo, comboItems: n}); }} className="px-3 py-1 font-black text-gray-500 hover:text-black">+</button>
                                                </div>
                                                <button onClick={() => { const n = editingCombo.comboItems.filter((_, i) => i !== idx); setEditingCombo({...editingCombo, comboItems: n}); }} className="text-red-400 p-2"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {!showComboSearch ? (
                                    <button onClick={() => setShowComboSearch(true)} className="w-full py-3 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 font-black text-sm hover:bg-orange-100 transition-colors flex justify-center gap-2"><Plus size={16}/> Προσθήκη Πιάτου</button>
                                ) : (
                                    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-black text-gray-800 uppercase">Αναζητηση</span>
                                            <button onClick={() => setShowComboSearch(false)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-2 mb-3">
                                            <input type="text" placeholder="Αναζήτηση πιάτου..." value={comboSearch} onChange={(e) => setComboSearch(e.target.value)} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-orange-400"/>
                                            
                                            {/* ΦΙΛΤΡΟ ΚΑΤΗΓΟΡΙΑΣ ΕΝΤΟΣ COMBO */}
                                            <div className="relative w-full md:w-1/3">
                                                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                <select value={comboCategoryFilter} onChange={(e) => setComboCategoryFilter(e.target.value)} className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none cursor-pointer text-gray-700">
                                                    <option value="all">Όλες</option>
                                                    {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                            {availableFilteredDishes.map(d => {
                                                const isAdded = editingCombo.comboItems.some(ci => ci.dish?.id === d.id);
                                                return (
                                                    <button key={d.id} disabled={isAdded} onClick={() => { const n = [...editingCombo.comboItems, { dish: { id: d.id, name: d.name }, quantity: 1 }]; setEditingCombo({ ...editingCombo, comboItems: n }); }} className={`w-full flex justify-between items-center p-3 rounded-lg text-sm font-bold ${isAdded ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-100 text-left'}`}>
                                                        <span>{d.name}</span><span>{isAdded ? '✓' : '+'}</span>
                                                    </button>
                                                );
                                            })}
                                            {availableFilteredDishes.length === 0 && <div className="text-center text-gray-400 font-bold text-sm py-4">Δεν βρέθηκαν πιάτα</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Πραγματικη Αξια</span>
                                    <span className="text-2xl font-black text-gray-400 line-through">{calculateOriginalPrice(editingCombo.comboItems).toFixed(2)}€</span>
                                </div>
                                <div className="flex-1 bg-black p-4 rounded-xl shadow-md flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Τελικη Τιμη Combo</span>
                                    <div className="flex items-center"><input type="number" step="0.1" value={editingCombo.price || ''} onChange={(e) => setEditingCombo({ ...editingCombo, price: parseFloat(e.target.value) })} className="w-full bg-transparent text-white text-3xl font-black outline-none" placeholder="0.00"/><span className="text-white text-2xl font-black">€</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setEditingCombo(null)} className="px-8 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button onClick={saveCombo} className="px-8 py-3 bg-orange-500 text-white font-black rounded-xl uppercase hover:bg-orange-600 shadow-md">Αποθήκευση Combo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}