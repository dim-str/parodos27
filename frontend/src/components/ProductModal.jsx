// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Check, Plus, Minus, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';

// --- Υπολογισμός Αντίθεσης ---
const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#ffffff';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

export default function ProductModal() {
    const { modalDish, closeModal, addToCart, toggleCart, isCartOpen } = useCartStore();
    const params = useParams();
    const storeSlug = params.storeSlug;

    const [quantity, setQuantity] = useState(1); 
    const [userNotes, setUserNotes] = useState('');
    
    // STATE: Κρατάει επιλογές ανά συγκεκριμένο πιάτο
    const [groupSelections, setGroupSelections] = useState({});
    const [selectedUpsells, setSelectedUpsells] = useState([]); 
    const [openDropdowns, setOpenDropdowns] = useState({});

    const [upsellItems, setUpsellItems] = useState([]);
    const [modifierGroups, setModifierGroups] = useState([]);

    const [storeSettings, setStoreSettings] = useState(null);

    // --- ΔΗΛΩΣΗ ΧΡΩΜΑΤΟΣ ΓΙΑ ΟΛΟ ΤΟ MODAL ---
    const themeColor = storeSettings?.primaryColor || '#F97316';
    const themeContrast = getContrastColor(themeColor);

    useEffect(() => {
        if (modalDish && storeSlug) {
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${storeSlug}/settings?t=${new Date().getTime()}`)
                .then(res => {
                    if (res.data) {
                        setModifierGroups(res.data.modifierGroups || []);
                        setUpsellItems(res.data.upsellItems || []);
                        setStoreSettings(res.data);
                    }
                })
                .catch(err => console.error("Σφάλμα φόρτωσης ρυθμίσεων"));
            
            setSelectedUpsells([]);
            setUserNotes('');
            setQuantity(1);
        }
    }, [modalDish, storeSlug]);

    // --- ΔΗΜΙΟΥΡΓΙΑ ΞΕΧΩΡΙΣΤΩΝ "ΕΝΟΤΗΤΩΝ" (Instances) ΓΙΑ ΚΑΘΕ ΠΙΑΤΟ ΣΤΟ COMBO ---
    const modifierInstances = [];
    if (modalDish) {
        if (modalDish.isCombo && modalDish.comboItems && modalDish.comboItems.length > 0) {
            modalDish.comboItems.forEach((ci, ciIndex) => {
                const matchingGroups = modifierGroups.filter(g => 
                    g.linkedCategories?.includes(ci.dish?.category) || 
                    g.linkedDishes?.includes(ci.dish?.id)
                );
                if (matchingGroups.length > 0) {
                    for (let q = 1; q <= ci.quantity; q++) {
                        modifierInstances.push({
                            instanceId: `combo_${ciIndex}_${q}`,
                            title: ci.quantity > 1 ? `${ci.dish?.name} (${q}o τεμάχιο)` : ci.dish?.name,
                            groups: matchingGroups
                        });
                    }
                }
            });
        } else {
            const matchingGroups = modifierGroups.filter(g => 
                g.linkedCategories?.includes(modalDish.category) || 
                g.linkedDishes?.includes(modalDish.id)
            );
            if (matchingGroups.length > 0) {
                modifierInstances.push({
                    instanceId: 'main',
                    title: null,
                    groups: matchingGroups
                });
            }
        }
    }

    // Προεπιλογή (Defaults) & Αρχικό Άνοιγμα των Dropdowns
    useEffect(() => {
        if (modalDish && modifierGroups.length > 0) {
            const initials = {};
            const initialOpen = {};

            modifierInstances.forEach(instance => {
                instance.groups.forEach(g => {
                    const key = `${instance.instanceId}_${g.name}`;
                    initialOpen[key] = g.isRequired; // Ανοίγει αυτόματα μόνο αν είναι υποχρεωτικό

                    const defaults = g.items
                        .filter(i => i.split('|')[2] === 'true')
                        .map(i => {
                            const [name, price] = i.split('|');
                            return { name, price: parseFloat(price) };
                        });
                    if (defaults.length > 0) initials[key] = defaults;
                });
            });
            
            setGroupSelections(initials);
            setOpenDropdowns(initialOpen);
        } else {
            setGroupSelections({});
            setOpenDropdowns({});
        }
    }, [modalDish, modifierGroups]);

    if (!modalDish) return null;

    const parsedUpsells = upsellItems.map((raw, index) => {
        const [name, price, emoji] = raw.split('|');
        return { id: `upsell_${index}`, name, price: parseFloat(price), emoji: emoji || '✨' };
    });

    const handleToggleDropdown = (key) => {
        setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleModifierSelect = (key, group, itemRaw) => {
        const [itemName, itemPriceStr] = itemRaw.split('|');
        const itemObj = { name: itemName, price: parseFloat(itemPriceStr) };

        const currentSelections = groupSelections[key] || [];
        const isSingle = group.selectionType === 'single';
        const isSelected = currentSelections.some(i => i.name === itemName);

        if (isSingle) {
            setGroupSelections({ ...groupSelections, [key]: [itemObj] });
        } else {
            if (isSelected) {
                setGroupSelections({ ...groupSelections, [key]: currentSelections.filter(i => i.name !== itemName) });
            } else {
                setGroupSelections({ ...groupSelections, [key]: [...currentSelections, itemObj] });
            }
        }
    };

    const handleToggleUpsell = (upsell) => {
        if (selectedUpsells.find(u => u.id === upsell.id)) setSelectedUpsells(selectedUpsells.filter(u => u.id !== upsell.id));
        else setSelectedUpsells([...selectedUpsells, upsell]);
    };

    const calculateModifiersPrice = () => {
        let total = 0;
        modifierInstances.forEach(instance => {
            instance.groups.forEach(group => {
                const key = `${instance.instanceId}_${group.name}`;
                const selections = groupSelections[key] || [];
                const freeAllowed = group.freeSelections || 0;
                
                const sortedByPrice = [...selections].sort((a, b) => a.price - b.price);
                sortedByPrice.forEach((sel, index) => {
                    if (index >= freeAllowed) total += sel.price; 
                });
            });
        });
        return total;
    };

    const handleConfirm = () => {
        // --- ΕΛΕΓΧΟΣ ΥΠΟΧΡΕΩΤΙΚΩΝ ---
        for (const instance of modifierInstances) {
            for (const group of instance.groups) {
                if (group.isRequired) {
                    const key = `${instance.instanceId}_${group.name}`;
                    const current = groupSelections[key] || [];
                    if (current.length === 0) {
                        toast.error(`Παρακαλώ επιλέξτε από: ${instance.title ? instance.title + ' - ' : ''}${group.name}`);
                        setOpenDropdowns(prev => ({ ...prev, [key]: true })); // Το ανοίγει για να το δει ο πελάτης
                        return; 
                    }
                }
            }
        }

        let formattedExtrasArray = [];
        let totalExtrasPrice = 0;

        modifierInstances.forEach(instance => {
            instance.groups.forEach(group => {
                const key = `${instance.instanceId}_${group.name}`;
                const selections = groupSelections[key] || [];
                if (selections.length > 0) {
                    const freeAllowed = group.freeSelections || 0;
                    const sortedByPrice = [...selections].sort((a, b) => a.price - b.price);
                    
                    const names = sortedByPrice.map((s, index) => {
                        const isFree = index < freeAllowed;
                        if (!isFree) totalExtrasPrice += s.price;
                        return (s.price > 0 && !isFree) ? `${s.name} (+${s.price.toFixed(2)}€)` : s.name;
                    });
                    
                    const prefix = instance.title ? `[${instance.title}] ` : '';
                    formattedExtrasArray.push(`${prefix}${group.name}: ${names.join(', ')}`);
                }
            });
        });

        const extrasString = formattedExtrasArray.length > 0 ? formattedExtrasArray.join(' | ') : null;

        addToCart(modalDish, quantity, extrasString, totalExtrasPrice, userNotes.trim(), storeSlug);

        selectedUpsells.forEach(upsell => {
            addToCart({ id: upsell.id, name: `${upsell.emoji} ${upsell.name}`, price: upsell.price, imageUrl: null }, 1, null, 0, '', storeSlug);
        });

        toast.success(`${modalDish.name} προστέθηκε!`);
        closeModal();
        if (!isCartOpen) toggleCart();
    };

    const totalItemPrice = (modalDish.price + calculateModifiersPrice()) * quantity;
    const totalUpsellsPrice = selectedUpsells.reduce((sum, u) => sum + u.price, 0);
    const finalPrice = totalItemPrice + totalUpsellsPrice;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-olive-900/60 backdrop-blur-sm" onClick={closeModal}></div>

            <div className="bg-white w-full md:max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden flex flex-col relative z-10 max-h-[90vh] shadow-2xl">
                <div className="relative h-48 md:h-56 bg-olive-100 flex-shrink-0">
                    <img src={modalDish.imageUrl || '/logo.png'} alt={modalDish.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Αλλαγή: Το X έγινε μαύρο (text-black) με λευκό φόντο (bg-white) */}
                    <button onClick={closeModal} className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-black p-2 rounded-full transition-all shadow-md">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                    
                    <div className="absolute bottom-4 left-6 pr-6">
                        <h2 className="text-2xl font-black text-white leading-tight mb-1">{modalDish.name}</h2>
                        {/* Αλλαγή: Η τιμή έγινε σταθερά λευκή (text-white) */}
                        <span className="font-black text-xl text-white">{modalDish.price.toFixed(2)}€</span>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-gray-50/30">
                    {modalDish.description && <p className="text-olive-600 text-sm font-medium leading-relaxed">{modalDish.description}</p>}

                    {/* --- SMART MODIFIER GROUPS (DROPDOWNS) --- */}
                    {modifierInstances.length > 0 && (
                        <div className="space-y-6 animate-fade-in">
                            {modifierInstances.map((instance, idx) => (
                                <div key={idx} className="space-y-4">
                                    
                                    {instance.title && (
                                        <h3 className="font-black text-olive-900 border-b-2 border-olive-100 pb-2 text-lg">
                                            🥢 {instance.title}
                                        </h3>
                                    )}

                                    {instance.groups.map(group => {
                                        const key = `${instance.instanceId}_${group.name}`;
                                        const currentSelections = groupSelections[key] || [];
                                        const isSatisfied = !group.isRequired || currentSelections.length > 0;
                                        const freeUsed = currentSelections.length;
                                        const freeAllowed = group.freeSelections || 0;
                                        const isOpen = openDropdowns[key]; 

                                        return (
                                            <div key={key} className={`bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${!isSatisfied ? 'border-red-300' : 'border-gray-100'}`}>
                                                
                                                <div 
                                                    onClick={() => handleToggleDropdown(key)}
                                                    className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${!isSatisfied ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide">{group.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isSatisfied ? (group.isRequired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500') : 'bg-red-100 text-red-700 animate-pulse'}`}>
                                                                {group.isRequired ? (isSatisfied ? 'ΕΠΙΛΕΧΘΗΚΕ' : 'ΥΠΟΧΡΕΩΤΙΚΟ') : 'ΠΡΟΑΙΡΕΤΙΚΟ'}
                                                            </span>
                                                            {currentSelections.length > 0 && !isOpen && (
                                                                <span className="text-[10px] font-bold text-olive-600">{currentSelections.length} επιλογές</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`p-1.5 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-gray-100 text-gray-900' : 'bg-white text-gray-400 border shadow-sm'}`}>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>
                                                
                                                {isOpen && (
                                                    <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/20 animate-fade-in">
                                                        {freeAllowed > 0 && (
                                                            <div className="text-xs text-green-600 font-bold mt-3 mb-3 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-1">
                                                                <span>Δικαιούστε {freeAllowed} δωρεάν</span>
                                                                <span className="text-green-400">({freeAllowed - freeUsed > 0 ? freeAllowed - freeUsed : 0} απομένουν)</span>
                                                            </div>
                                                        )}

                                                        <div className="space-y-3 mt-4">
                                                            {group.items.map((item, idx) => {
                                                                const parts = item.split('|');
                                                                const name = parts[0];
                                                                const price = parts[1];
                                                                const inStock = parts[3] !== 'false'; 

                                                                const isSingle = group.selectionType === 'single';
                                                                const isChecked = currentSelections.some(i => i.name === name);

                                                                return (
                                                                    <label 
                                                                        key={idx} 
                                                                        className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${
                                                                            !inStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : (isChecked ? 'bg-orange-50/30 cursor-pointer' : 'bg-white hover:bg-gray-50 cursor-pointer')
                                                                        }`}
                                                                        style={{ borderColor: isChecked && inStock ? themeColor : '#f3f4f6' }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <input
                                                                                type={isSingle ? "radio" : "checkbox"}
                                                                                name={`group-${key}`}
                                                                                checked={isChecked}
                                                                                disabled={!inStock}
                                                                                onChange={() => {
                                                                                    if (inStock) handleModifierSelect(key, group, item);
                                                                                }}
                                                                                className={`w-6 h-6 border-2 border-gray-300 ${isSingle ? 'rounded-full' : 'rounded-md'} appearance-none flex items-center justify-center ${inStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                                                                style={{ backgroundColor: isChecked && inStock ? themeColor : 'transparent', borderColor: isChecked && inStock ? themeColor : '#d1d5db' }}
                                                                            />
                                                                            <span className={`font-bold text-sm ${isChecked ? 'text-gray-900' : 'text-gray-700'} ${!inStock ? 'line-through' : ''}`}>
                                                                                {name} 
                                                                                {!inStock && <span className="text-[10px] text-red-500 ml-2 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md">(Εξαντληθηκε)</span>}
                                                                            </span>
                                                                        </div>
                                                                        {parseFloat(price) > 0 && (
                                                                            <span className="text-sm font-black text-gray-500">
                                                                                +{parseFloat(price).toFixed(2)}€
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- SMART UPSELLING SECTION --- */}
                    {parsedUpsells.length > 0 && (
                        <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl animate-fade-in">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 text-sm">
                                <Sparkles size={18} className="text-orange-500" /> Προτάσεις Ταμείου
                            </h3>
                            <div className="space-y-2">
                                {parsedUpsells.map(upsell => {
                                    const isSelected = selectedUpsells.some(u => u.id === upsell.id);
                                    return (
                                        <button key={upsell.id} onClick={() => handleToggleUpsell(upsell)} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-gray-50'}`}>
                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                </div>
                                                <span className="font-bold text-gray-800 text-sm">{upsell.emoji} {upsell.name}</span>
                                            </div>
                                            <span className="font-black text-gray-900 text-sm">+{upsell.price.toFixed(2)}€</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ΕΙΔΙΚΕΣ ΟΔΗΓΙΕΣ */}
                    <div>
                        <h3 className="font-black text-olive-900 uppercase text-xs tracking-widest mb-3">Ειδικες Οδηγιες</h3>
                        <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} placeholder="π.χ. Χωρίς κρεμμύδι..." className="w-full p-4 rounded-xl border-2 border-gray-100 bg-white text-gray-900 focus:outline-none focus:border-gray-400 transition-all resize-none h-20 text-sm font-medium shadow-sm"></textarea>
                    </div>

                    {/* ΠΟΣΟΤΗΤΑ */}
                    <div className="flex items-center justify-between bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-sm">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 hover:bg-gray-200 active:scale-95 transition-all"><Minus size={20} /></button>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-gray-900">{quantity}</span>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Τεμαχια</span>
                        </div>
                        <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 hover:bg-gray-200 active:scale-95 transition-all"><Plus size={20} /></button>
                    </div>
                </div>

                <div className="p-4 md:p-6 border-t border-gray-100 bg-white flex-shrink-0">
                    <button 
                        onClick={handleConfirm} 
                        className="w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98] flex justify-between px-6 items-center shadow-xl"
                        style={{ backgroundColor: themeColor, color: themeContrast }}
                    >
                        <span>Προσθηκη στο Καλαθι</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-black/10 px-3 py-1 rounded-lg">{finalPrice.toFixed(2)}€</span>
                            <ChevronRight size={20} className="opacity-70" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}