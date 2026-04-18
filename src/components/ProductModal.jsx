// @ts-nocheck
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProductModal() {
    const { modalDish, closeModal, addToCart, toggleCart, isCartOpen } = useCartStore();

    const [selectedExtras, setSelectedExtras] = useState([]);
    const [userNotes, setUserNotes] = useState('');
    const [disabledExtras, setDisabledExtras] = useState([]);
    const [globalExtras, setGlobalExtras] = useState([]);

    useEffect(() => {
        if (modalDish) {
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${new Date().getTime()}`)
                .then(res => {
                    if (res.data) {
                        setDisabledExtras(res.data.disabledExtras || []);
                        setGlobalExtras(res.data.globalExtras || []);
                    }
                })
                .catch(err => console.error("Σφάλμα"));

            setSelectedExtras([]);
            setUserNotes('');
        }
    }, [modalDish]);

    if (!modalDish) return null;

    const extrasList = modalDish.extras
        ? modalDish.extras.split(',')
            .map(item => item.trim())
            .filter(Boolean)
            .filter(name => !disabledExtras.includes(name))
            .map(name => {
                const foundGlobal = globalExtras.find(g => g.split('|')[0] === name);
                const price = foundGlobal ? parseFloat(foundGlobal.split('|')[1]) : 0;
                return { name, price };
            })
        : [];

    const handleToggleExtra = (extraObj) => {
        if (selectedExtras.some(e => e.name === extraObj.name)) {
            setSelectedExtras(selectedExtras.filter(e => e.name !== extraObj.name));
        } else {
            setSelectedExtras([...selectedExtras, extraObj]);
        }
    };

    const handleConfirm = () => {
        let totalExtrasPrice = 0;
        const formattedExtras = selectedExtras.map(extra => {
            totalExtrasPrice += extra.price;
            return extra.price > 0 ? `${extra.name} (+${extra.price.toFixed(2)}€)` : extra.name;
        });

        const extrasString = formattedExtras.length > 0 ? formattedExtras.join(', ') : null;

        addToCart(modalDish, 1, extrasString, totalExtrasPrice, userNotes.trim());

        toast.success(`${modalDish.name} προστέθηκε!`);
        closeModal();

        if (!isCartOpen) {
            toggleCart();
        }
    };

    const finalPrice = modalDish.price + selectedExtras.reduce((sum, e) => sum + e.price, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-olive-900/50 backdrop-blur-sm animate-fade-in">
            {/* Επιστροφή σε max-w-md για άνετο διάβασμα */}
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transform transition-all flex flex-col max-h-[85vh]">

                {/* Επιστροφή σε h-40 για ωραία φωτογραφία */}
                <div className="relative h-40 bg-olive-100 flex-shrink-0">
                    <img src={modalDish.imageUrl || '/logo.png'} alt={modalDish.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <button onClick={closeModal} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur text-white p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-6 pr-6">
                        <h2 className="text-2xl font-black text-white leading-tight">{modalDish.name}</h2>
                        <span className="text-olive-300 font-bold text-lg">{modalDish.price.toFixed(2)}€</span>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto scrollbar-hide">
                    {modalDish.description && (
                        <p className="text-olive-600 text-sm mb-6">{modalDish.description}</p>
                    )}

                    {extrasList.length > 0 && (
                        <div className="mb-6 animate-fade-in">
                            <h3 className="font-black text-olive-900 uppercase text-sm mb-3">Επιλέξτε Συνοδευτικό:</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {extrasList.map(extraObj => {
                                    const isSelected = selectedExtras.some(e => e.name === extraObj.name);
                                    return (
                                        <button
                                            key={extraObj.name}
                                            onClick={() => handleToggleExtra(extraObj)}
                                            className={`p-3.5 rounded-xl border-2 text-sm font-bold flex items-center justify-between transition-all ${
                                                isSelected ? 'border-olive-600 bg-olive-50 text-olive-900 shadow-sm' : 'border-olive-100 text-olive-600 hover:border-olive-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-olive-600 border-olive-600 text-white' : 'border-olive-300'}`}>
                                                    {isSelected && <Check size={14} />}
                                                </div>
                                                <span>{extraObj.name}</span>
                                            </div>
                                            {extraObj.price > 0 && (
                                                <span className={`font-black ${isSelected ? 'text-olive-700' : 'text-olive-400'}`}>
                                                    +{extraObj.price.toFixed(2)}€
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="font-black text-olive-900 uppercase text-sm mb-3">Ειδικές Οδηγίες</h3>
                        <textarea value={userNotes} onChange={(e) => setUserNotes(e.target.value)} placeholder="π.χ. Χωρίς κρεμμύδι, καλοψημένο..." className="w-full p-4 rounded-xl border border-olive-100 bg-olive-50 text-olive-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all resize-none h-24"></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-olive-100 bg-white flex-shrink-0">
                    <button onClick={handleConfirm} className="w-full py-4 bg-olive-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all active:scale-95 flex justify-between px-6 items-center shadow-lg">
                        <span>Προσθήκη</span>
                        <span>{finalPrice.toFixed(2)}€</span>
                    </button>
                </div>
            </div>
        </div>
    );
}