'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Plus, Edit3, X, Filter, Settings2, Trash2, Star, ArrowUp, ArrowDown, WifiOff, ListOrdered, Palette } from 'lucide-react';

axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

const normalizeGreeklish = (text) => {
        if (!text) return '';
        let str = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const grMap = { 'α':'a', 'β':'v', 'γ':'g', 'δ':'d', 'ε':'e', 'ζ':'z', 'η':'i', 'θ':'th', 'ι':'i', 'κ':'k', 'λ':'l', 'μ':'m', 'ν':'n', 'ξ':'x', 'ο':'o', 'π':'p', 'ρ':'r', 'σ':'s', 'ς':'s', 'τ':'t', 'υ':'y', 'φ':'f', 'χ':'x', 'ψ':'ps', 'ω':'o' };
        return str.split('').map(char => grMap[char] || char).join('');
    };

export default function MenuEditorTab({ dishes, fetchDishes, storeSettings, setStoreSettings, authToken }) {
    // ΝΕΟ TAB: Προστέθηκε το 'settings' για το χρώμα
    const [mainTab, setMainTab] = useState('menu'); 
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);
        const handleOnline = () => { setIsOffline(false); toast.success('Η σύνδεση επανήλθε!', { icon: '🟢' }); };
        const handleOffline = () => { setIsOffline(true); toast.error('Εκτός σύνδεσης! Ελέγξτε το ίντερνετ σας.', { icon: '🔴', duration: 5000 }); };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleError = (error, defaultMsg) => {
        if (isOffline) toast.error("Αδυναμία αποθήκευσης. Είστε εκτός σύνδεσης!");
        else if (!error.response) toast.error("Ο server δεν απαντά. Δοκιμάστε ξανά σε λίγο.");
        else toast.error(defaultMsg);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [editingDish, setEditingDish] = useState(null);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [deactivatingDish, setDeactivatingDish] = useState(null);

    const [editingGroup, setEditingGroup] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemDefault, setNewItemDefault] = useState(false);
    const [dishSearchTerm, setDishSearchTerm] = useState('');
    const [dishCategoryFilter, setDishCategoryFilter] = useState('all');

    const [showCategoryManager, setShowCategoryManager] = useState(false);
    
    const normalDishes = dishes.filter(d => !d.isCombo);
    const dynamicCategories = [...new Set(normalDishes.map(d => d.category).filter(Boolean))];
    const savedOrder = storeSettings?.categoryOrder || [];
    
    const existingCategories = [
        ...savedOrder.filter(c => dynamicCategories.includes(c)),
        ...dynamicCategories.filter(c => !savedOrder.includes(c))
    ];

    const searchNorm = normalizeGreeklish(searchTerm);
    const groupedDishes = normalDishes.filter(d => {
        const matchesSearch = normalizeGreeklish(d.name).includes(searchNorm) || (d.category && normalizeGreeklish(d.category).includes(searchNorm));
        const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }).reduce((acc, dish) => {
        const cat = dish.category || 'Χωρίς Κατηγορία';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(dish);
        return acc;
    }, {});

    // --- ΣΥΝΑΡΤΗΣΗ ΑΠΟΘΗΚΕΥΣΗΣ ΡΥΘΜΙΣΕΩΝ (ΧΡΩΜΑ) ---
    const saveSettings = async () => {
        if (isOffline) return toast.error("Είστε εκτός σύνδεσης.");
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, storeSettings, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success("Οι ρυθμίσεις αποθηκεύτηκαν!");
        } catch (error) {
            handleError(error, "Σφάλμα αποθήκευσης ρυθμίσεων.");
        }
    };

    const moveCategory = async (index, direction) => {
        const newOrder = [...existingCategories];
        if (direction === 'up' && index > 0) [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        else if (direction === 'down' && index < newOrder.length - 1) [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        else return;

        const updatedSettings = { ...storeSettings, categoryOrder: newOrder };
        setStoreSettings(updatedSettings);
        try { await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updatedSettings, { headers: { Authorization: `Bearer ${authToken}` } }); } 
        catch (error) { handleError(error, "Σφάλμα κατά την αποθήκευση της σειράς."); }
    };

    const openEditModal = (dish = null) => {
        if (dish) setEditingDish({ ...dish }); 
        else setEditingDish({ name: '', price: 0, category: existingCategories[0] || '', availablePortions: -1, active: true, description: '', imageUrl: '', isCombo: false, comboItems: [] }); 
        setShowNewCategoryInput(false);
    };

    const saveDish = async () => {
        if (isOffline) return toast.error("Δεν μπορείτε να αποθηκεύσετε όσο είστε εκτός σύνδεσης.");
        try {
            const payload = { ...editingDish, isCombo: false, comboItems: [], discountPrice: null, extras: '' };
            let targetStoreId = 1; 
            if (storeSettings && storeSettings.id) targetStoreId = storeSettings.id;
            else if (storeSettings && storeSettings.storeId) targetStoreId = storeSettings.storeId;
            else if (normalDishes.length > 0) {
                if (normalDishes[0].store?.id) targetStoreId = normalDishes[0].store.id;
                else if (normalDishes[0].storeId) targetStoreId = normalDishes[0].storeId;
            }

            payload.store = { id: targetStoreId }; 
            payload.storeId = targetStoreId; 

            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            if (payload.id) await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${payload.id}`, payload, config); 
            else await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dishes`, payload, config); 
            
            setEditingDish(null);
            fetchDishes();
            toast.success("Το πιάτο αποθηκεύτηκε!");
        } catch (error) { handleError(error, "Σφάλμα αποθήκευσης πιάτου."); }
    };

    const handleToggleActive = async (dish) => {
        if (isOffline) return toast.error("Η ενέργεια απαιτεί σύνδεση στο internet.");
        if (dish.active) setDeactivatingDish(dish);
        else {
            try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${dish.id}`, { ...dish, active: true, deactivationPolicy: 'FOREVER', availablePortions: -1 }, { headers: { Authorization: `Bearer ${authToken}` } });
                fetchDishes();
                toast.success("Το πιάτο ενεργοποιήθηκε!");
            } catch (e) { handleError(e, "Σφάλμα ενεργοποίησης!"); }
        }
    };

    const confirmDeactivation = async (policy) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dishes/${deactivatingDish.id}`, { ...deactivatingDish, active: false, deactivationPolicy: policy }, { headers: { Authorization: `Bearer ${authToken}` } });
            fetchDishes();
            setDeactivatingDish(null);
            toast.success("Το πιάτο απενεργοποιήθηκε!");
        } catch (e) { handleError(e, "Σφάλμα απενεργοποίησης!"); }
    };

    const openGroupEditor = (group = null) => {
        setDishSearchTerm('');
        setDishCategoryFilter('all');
        if (group) setEditingGroup({ ...group, freeSelections: group.freeSelections || 0, linkedCategories: group.linkedCategories || [], linkedDishes: group.linkedDishes || [], items: group.items || [], selectionType: group.selectionType || 'multiple' });
        else setEditingGroup({ name: '', isRequired: false, freeSelections: 0, selectionType: 'multiple', linkedCategories: [], linkedDishes: [], items: [] });
    };

    const saveGroup = async () => {
        if (isOffline) return toast.error("Είστε εκτός σύνδεσης.");
        if (!editingGroup.name) { toast.error("Δώστε όνομα στην ομάδα!"); return; }
        
        const currentGroups = storeSettings.modifierGroups || [];
        let newGroups;
        if (editingGroup.id) newGroups = currentGroups.map(g => g.id === editingGroup.id ? editingGroup : g);
        else newGroups = [...currentGroups, { ...editingGroup, id: Date.now() }];

        const updatedSettings = { ...storeSettings, modifierGroups: newGroups };
        if (typeof setStoreSettings === 'function') setStoreSettings(updatedSettings);

        try {
            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updatedSettings, { headers: { Authorization: `Bearer ${authToken}` } });
            if (typeof setStoreSettings === 'function') setStoreSettings(res.data);
            setEditingGroup(null);
            toast.success("Η ομάδα αποθηκεύτηκε!");
        } catch (error) { handleError(error, "Λήξη συνεδρίας ή σφάλμα διακομιστή."); fetchDishes(); }
    };

    const deleteGroup = async (groupId) => {
        if (isOffline) return toast.error("Είστε εκτός σύνδεσης.");
        if(!window.confirm("Σίγουρα θέλετε να διαγράψετε αυτή την ομάδα;")) return;
        const newGroups = (storeSettings.modifierGroups || []).filter(g => g.id !== groupId);
        const updatedSettings = { ...storeSettings, modifierGroups: newGroups };
        
        if (typeof setStoreSettings === 'function') setStoreSettings(updatedSettings); 
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updatedSettings, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success("Η ομάδα διαγράφηκε!");
        } catch (e) { handleError(e, "Σφάλμα διαγραφής!"); }
    };

    const toggleCategoryLink = (catName) => {
        const current = editingGroup.linkedCategories || [];
        if (current.includes(catName)) setEditingGroup({ ...editingGroup, linkedCategories: current.filter(c => c !== catName) });
        else setEditingGroup({ ...editingGroup, linkedCategories: [...current, catName] });
    };

    const removeLinkedDish = (dishId) => {
        setEditingGroup({ ...editingGroup, linkedDishes: (editingGroup.linkedDishes || []).filter(id => id !== dishId) });
    };

    const addGroupItem = () => {
        if (!newItemName) return;
        const priceStr = newItemPrice ? parseFloat(newItemPrice).toFixed(2) : "0.00";
        const isDef = newItemDefault ? "true" : "false";
        const itemStr = `${newItemName}|${priceStr}|${isDef}|true`;  // Το |true σημαίνει In Stock
        setEditingGroup({ ...editingGroup, items: [...(editingGroup.items || []), itemStr] });
        setNewItemName('');
        setNewItemPrice('');
        setNewItemDefault(false);
    };

    // --- ΛΟΓΙΚΗ ΓΙΑ ΤΟ "ΕΞΑΝΤΛΗΘΗΚΕ" ΣΤΑ ΥΛΙΚΑ ---
    const toggleGroupItemStock = (index) => {
        const newItems = [...editingGroup.items];
        const parts = newItems[index].split('|');
        const currentStatus = parts[3] !== 'false'; 
        parts[3] = currentStatus ? 'false' : 'true'; 
        newItems[index] = parts.join('|');
        setEditingGroup({ ...editingGroup, items: newItems });
    };

    const removeGroupItem = (index) => {
        const newItems = [...editingGroup.items];
        newItems.splice(index, 1);
        setEditingGroup({ ...editingGroup, items: newItems });
    };

    const availableFilteredDishes = normalDishes.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(dishSearchTerm.toLowerCase());
        const matchesCategory = dishCategoryFilter === 'all' || d.category === dishCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-6 pb-12">
            {isOffline && (
                <div className="bg-red-500 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md animate-pulse">
                    <WifiOff size={20} /> Είστε εκτός σύνδεσης! Οι αλλαγές δεν θα αποθηκευτούν μέχρι να επανέλθει το δίκτυο.
                </div>
            )}

            {/* TABS ΕΠΙΛΟΓΗΣ */}
            <div className="flex gap-4 border-b border-gray-200">
                <button onClick={() => setMainTab('menu')} className={`pb-4 px-4 font-black text-sm uppercase transition-all flex items-center gap-2 ${mainTab === 'menu' ? 'border-b-4 border-olive-600 text-olive-900' : 'text-gray-400 hover:text-gray-700'}`}>Καταλογος Πιατων</button>
                <button onClick={() => setMainTab('extras')} className={`pb-4 px-4 font-black text-sm uppercase transition-all flex items-center gap-2 ${mainTab === 'extras' ? 'border-b-4 border-olive-600 text-olive-900' : 'text-gray-400 hover:text-gray-700'}`}>Ομαδες Συνοδευτικων</button>
            </div>

            {/* TAB: ΜΕΝΟΥ */}
            {mainTab === 'menu' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-olive-100 gap-4">
                        <div className="flex w-full md:w-auto gap-3 flex-1">
                            <div className="relative flex-1 md:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400" size={18} />
                                <input type="text" placeholder="Αναζήτηση..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-olive-100 bg-olive-50 text-black font-bold outline-none" />
                            </div>
                            <div className="relative md:w-48">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400" size={18} />
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-olive-100 bg-olive-50 text-black font-bold outline-none appearance-none cursor-pointer">
                                    <option value="all">Όλες οι Κατηγορίες</option>
                                    {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setShowCategoryManager(true)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors justify-center">
                                <ListOrdered size={18} /> Σειρά
                            </button>
                            <button onClick={() => openEditModal()} disabled={isOffline} className="flex items-center gap-2 bg-olive-900 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-olive-800 transition-colors flex-1 md:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={18} /> Νέο Πιάτο
                            </button>
                        </div>
                    </div>

                    {existingCategories.map((category) => {
                        const categoryDishes = groupedDishes[category];
                        if (!categoryDishes) return null; 
                        return (
                            <div key={category} className="mb-12">
                                <h3 className="text-xl font-black text-olive-900 uppercase border-l-4 border-olive-400 pl-3 mb-4">{category}</h3>
                                <div className="bg-white rounded-3xl shadow-sm border border-olive-100 divide-y overflow-hidden">
                                    {categoryDishes.map(dish => (
                                        <div key={dish.id} className={`flex items-center justify-between p-4 ${!dish.active && 'opacity-50 grayscale'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-olive-100 overflow-hidden flex-shrink-0">
                                                    {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🍲</div>}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg">{dish.name}</h4>
                                                    <p className="text-sm font-bold text-olive-600">{dish.price.toFixed(2)}€ | {dish.availablePortions === -1 ? 'Άπειρες' : dish.availablePortions} μερίδες</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => handleToggleActive(dish)} disabled={isOffline} className={`w-12 h-6 rounded-full relative transition-all ${dish.active ? 'bg-green-500' : 'bg-gray-300'} disabled:cursor-not-allowed`}>
                                                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${dish.active ? 'left-7' : 'left-1'}`} />
                                                </button>
                                                <button onClick={() => openEditModal(dish)} className="p-2 text-olive-500 hover:text-olive-700"><Edit3 size={20} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </>
            )}

            {/* TAB: ΣΥΝΟΔΕΥΤΙΚΑ */}
            {mainTab === 'extras' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-olive-100">
                        <div>
                            <h3 className="text-xl font-black text-olive-900 uppercase mb-1">Έξυπνες Ομάδες Επιλογών</h3>
                            <p className="text-xs font-bold text-olive-500">Ορίστε συνοδευτικά, δωρεάν επιλογές, και συνδέστε τα σε κατηγορίες ή πιάτα.</p>
                        </div>
                        <button onClick={() => openGroupEditor()} disabled={isOffline} className="flex items-center gap-2 bg-olive-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition-colors shrink-0 disabled:opacity-50">
                            <Plus size={18} /> Νέα Ομάδα
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(storeSettings.modifierGroups || []).map(group => (
                            <div key={group.id} className="bg-white p-6 rounded-3xl border border-olive-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                {group.isRequired && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm">Υποχρεωτικο</div>}
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                                        <div>
                                            <h4 className="font-black text-lg text-olive-900">{group.name}</h4>
                                            {group.freeSelections > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-md mt-1 inline-block">🎁 Πρώτες {group.freeSelections} δωρεάν</span>}
                                        </div>
                                        <div className="flex gap-2 relative z-10">
                                            <button onClick={() => openGroupEditor(group)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg"><Settings2 size={18}/></button>
                                            <button onClick={() => deleteGroup(group.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Εφαρμοζεται στις Κατηγοριες:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {group.linkedCategories?.length > 0 ? group.linkedCategories.map(cat => (
                                                    <span key={cat} className="text-xs font-bold bg-olive-50 border border-olive-100 text-olive-700 px-2 py-0.5 rounded-md">{cat}</span>
                                                )) : <span className="text-[10px] font-bold text-gray-400">-</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Υλικα ({group.items?.length || 0}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(group.items || []).map((item, idx) => {
                                            const parts = item.split('|');
                                            const name = parts[0], price = parts[1], isDef = parts[2], inStock = parts[3] !== 'false';
                                            return (
                                                <span key={idx} className={`text-xs font-bold border px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 ${!inStock ? 'opacity-50 line-through bg-gray-200 text-gray-500 border-gray-300' : (isDef === 'true' ? 'bg-olive-600 text-white border-olive-700' : 'bg-white border-gray-200 text-olive-900')}`}>
                                                    {isDef === 'true' && inStock && <Star size={10} className="fill-white"/>}
                                                    {name} {parseFloat(price) > 0 && <span className={!inStock ? 'text-gray-400' : (isDef === 'true' ? 'text-olive-200' : 'text-olive-500')}>+{price}€</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- MODAL ΕΠΕΞΕΡΓΑΣΙΑΣ ΟΜΑΔΑΣ --- */}
            {editingGroup && (
                <div className="fixed inset-0 bg-olive-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-black text-olive-900 uppercase">
                                {editingGroup.id ? "Επεξεργασία Ομάδας" : "Νέα Ομάδα Επιλογών"}
                            </h2>
                            <button onClick={() => setEditingGroup(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-8">
                            {/* Βασικά Στοιχεία */}
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex flex-col gap-1 w-full md:w-1/2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ονομασια Ομαδας</label>
                                    <input type="text" value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="p-3 bg-gray-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none" placeholder="π.χ. Επιλογή Σως"/>
                                </div>
                                <div className="flex flex-col gap-1 w-full md:w-1/4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Δωρεαν Επιλογες</label>
                                    <input type="number" min="0" value={editingGroup.freeSelections} onChange={(e) => setEditingGroup({ ...editingGroup, freeSelections: parseInt(e.target.value) || 0 })} className="p-3 bg-gray-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none text-center" placeholder="π.χ. 1"/>
                                </div>
                                <div className="flex flex-col gap-1 w-full md:w-1/3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Τυπος Επιλογης</label>
                                    <select 
                                        value={editingGroup.selectionType || 'multiple'} 
                                        onChange={(e) => {
                                            const isSingle = e.target.value === 'single';
                                            setEditingGroup({ ...editingGroup, selectionType: e.target.value, isRequired: isSingle });
                                        }}
                                        className="p-3 bg-gray-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none cursor-pointer"
                                    >
                                        <option value="multiple">Πολλαπλές (Checkbox)</option>
                                        <option value="single">Αυστηρά Μία (Radio)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Υλικά (Items) με δυνατότητα Εξάντλησης */}
                            <div>
                                <h4 className="font-black text-olive-900 text-sm uppercase mb-3">Υλικα & Προεπιλογη</h4>
                                <div className="flex flex-col md:flex-row gap-3 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 items-center">
                                    <input type="text" placeholder="Όνομα (π.χ. Ketchup)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 p-3 bg-white rounded-lg font-bold border-2 focus:border-olive-400 outline-none w-full" />
                                    <input type="number" step="0.1" placeholder="Τιμή (€)" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full md:w-24 p-3 bg-white rounded-lg font-bold border-2 focus:border-olive-400 outline-none" />
                                    
                                    {editingGroup.selectionType === 'single' && (
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-3 rounded-lg border-2 hover:bg-gray-50">
                                            <input type="checkbox" checked={newItemDefault} onChange={(e) => setNewItemDefault(e.target.checked)} className="w-4 h-4 accent-olive-600" />
                                            <span className="text-xs font-black text-gray-700 whitespace-nowrap">Προεπιλογή</span>
                                        </label>
                                    )}

                                    <button onClick={addGroupItem} className="bg-olive-900 text-white font-black px-5 py-3 rounded-lg uppercase hover:bg-black transition-colors shrink-0 w-full md:w-auto">Προσθηκη</button>
                                </div>

                                <div className="space-y-2">
                                    {(editingGroup.items || []).map((item, idx) => {
                                        const parts = item.split('|');
                                        const name = parts[0], price = parts[1], inStock = parts[3] !== 'false';
                                        
                                        return (
                                            <div key={idx} className={`flex justify-between items-center border-2 p-3 rounded-xl shadow-sm ${!inStock ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black ${!inStock ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {name} <span className="text-olive-600 ml-1">+{price}€</span>
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {/* Κουμπί Εξάντλησης (Toggle Stock) */}
                                                    <button onClick={() => toggleGroupItemStock(idx)} className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all shadow-sm ${inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                                        {inStock ? 'Διαθέσιμο' : 'Εξαντλήθηκε'}
                                                    </button>
                                                    <button onClick={() => removeGroupItem(idx)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded-md"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setEditingGroup(null)} className="px-8 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl">ΑΚΥΡΩΣΗ</button>
                            <button onClick={saveGroup} className="px-8 py-3 bg-olive-900 text-white font-black rounded-xl uppercase hover:bg-black shadow-md">Αποθήκευση Ομάδας</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal Απενεργοποίησης & Επεξεργασίας Πιάτου ... */}
            {editingDish && (
                 <div className="fixed inset-0 bg-olive-900/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
                 <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
                     <div className="p-6 border-b border-olive-100 bg-olive-50 flex-shrink-0">
                         <div className="flex justify-between items-center mb-6">
                             <h2 className="text-2xl font-black text-olive-900">{editingDish.id ? "Επεξεργασία Πιάτου" : "Νέο Πιάτο"}</h2>
                             <button onClick={() => setEditingDish(null)} className="p-2 bg-white rounded-full hover:bg-gray-100"><X size={20} /></button>
                         </div>
                     </div>
                     <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Όνομα Πιάτου</label>
                                <div className="md:col-span-2 flex items-center gap-3 bg-orange-50 p-4 rounded-xl border border-orange-100 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="isComboCheck"
                                        checked={editingDish.isCombo || false} 
                                        onChange={(e) => setEditingDish({ ...editingDish, isCombo: e.target.checked })} 
                                        className="w-5 h-5 accent-orange-600 cursor-pointer" 
                                    />
                                    <label htmlFor="isComboCheck" className="text-sm font-black text-orange-900 cursor-pointer">
                                        Είναι Combo Deal; (Θα μεταφερθεί στην ειδική κατηγορία Combo)
                                    </label>
                                </div>
                                <input type="text" value={editingDish.name || ''} onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Τιμή</label>
                                <input type="number" step="0.1" value={editingDish.price || ''} onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Κατηγορία</label>
                                {!showNewCategoryInput ? (
                                    <select value={editingDish.category || ''} onChange={(e) => { if (e.target.value === "NEW") setShowNewCategoryInput(true); else setEditingDish({ ...editingDish, category: e.target.value }); }} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none">
                                        {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        <option value="NEW">+ ΝΕΑ ΚΑΤΗΓΟΡΙΑ</option>
                                    </select>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="text" autoFocus onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })} className="flex-1 p-3 bg-olive-100 rounded-xl font-bold outline-none" />
                                        <button onClick={() => setShowNewCategoryInput(false)} className="p-3 bg-olive-200 rounded-xl hover:bg-olive-300"><X size={18} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Μερίδες (-1 για άπειρες)</label>
                                <input type="number" value={editingDish.availablePortions} onChange={(e) => setEditingDish({ ...editingDish, availablePortions: parseInt(e.target.value) })} className="p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none" />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Φωτογραφία URL</label>
                                <input type="text" placeholder="URL..." value={editingDish.imageUrl || ''} onChange={(e) => setEditingDish({ ...editingDish, imageUrl: e.target.value })} className="flex-1 p-3 bg-olive-50 rounded-xl font-bold border-2 focus:border-olive-400 outline-none" />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-black text-olive-400">Περιγραφή</label>
                                <textarea value={editingDish.description || ''} onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })} className="p-3 bg-olive-50 rounded-xl font-bold h-24 resize-none border-2 focus:border-olive-400 outline-none"></textarea>
                            </div>
                        </div>
                     </div>
                     <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                         <button onClick={() => setEditingDish(null)} className="px-8 py-3 font-bold text-olive-600 hover:bg-olive-100 rounded-xl transition-colors">ΑΚΥΡΩΣΗ</button>
                         <button onClick={saveDish} className="px-8 py-3 bg-olive-900 text-white font-black rounded-xl uppercase hover:bg-black transition-all shadow-md">Αποθήκευση</button>
                     </div>
                 </div>
             </div>
            )}
            
            {deactivatingDish && (
                 <div className="fixed inset-0 bg-olive-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-fade-in">
                        <h3 className="text-xl font-black text-olive-900 mb-2">Απενεργοποίηση</h3>
                        <p className="text-olive-500 text-sm font-bold mb-6">Πώς θέλετε να κλείσετε το "{deactivatingDish.name}";</p>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => confirmDeactivation('FOREVER')} className="w-full p-4 rounded-xl font-black border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">Για Πάντα</button>
                            <div className="relative w-full">
                                <button disabled={!storeSettings.open} onClick={() => confirmDeactivation('UNTIL_NEXT_OPENING')} className={`w-full p-4 rounded-xl font-black border-2 transition-all shadow-sm ${storeSettings.open ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white' : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Μέχρι το επόμενο άνοιγμα</button>
                                {!storeSettings.open && <span className="block mt-1 text-[10px] font-bold text-red-500 uppercase">Απαγορεύεται διότι το κατάστημα είναι κλειστό</span>}
                            </div>
                        </div>
                        <button onClick={() => setDeactivatingDish(null)} className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600">ΑΚΥΡΩΣΗ</button>
                    </div>
                </div>
            )}
        </div>
    );
}