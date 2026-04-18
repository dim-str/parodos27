'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Bike, Footprints, ShoppingBag, MapPin, ChevronLeft, Send } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import DeliveryMap from './DeliveryMap';
import { useRouter } from 'next/navigation';
import DeliveryAddressSearch from "@/components/DeliveryAddressSearch";

const QUICK_ITEM_IDS = [4, 5, 3];

export default function CartDrawer() {
    const router = useRouter();
    const [step, setStep] = useState(1); // Step 1: Items, Step 2: Checkout Form
    const {
        cart, isCartOpen, closeCart, updateQuantity, removeFromCart,
        getTotalPrice, orderType, setOrderType, customerDetails, setCustomerDetails, clearCart, addToCart
    } = useCartStore();

    const totalPrice = getTotalPrice();
    const MIN_ORDER = 5.00;
    const shortfall = orderType === 'delivery' ? MIN_ORDER - totalPrice : 0;
    const [quickItemsData, setQuickItemsData] = useState([]);
    const [mapCoordinates, setMapCoordinates] = useState(null);

    // Επαναφορά στο Step 1 όταν κλείνει ή ανοίγει το καλάθι
    useEffect(() => {
        if (!isCartOpen) setStep(1);
    }, [isCartOpen]);

    useEffect(() => {
        const fetchQuickItems = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dishes`);
                setQuickItemsData(response.data.filter(dish => QUICK_ITEM_IDS.includes(dish.id)));
            } catch (error) { console.error("Σφάλμα γρήγορων προϊόντων"); }
        };
        void fetchQuickItems();
    }, []);

    const handleInputChange = (e) => {
        setCustomerDetails({ [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (!customerDetails.name || !customerDetails.phone) {
            toast.error("⚠️ Συμπληρώστε Όνομα και Τηλέφωνο!");
            return;
        }
        if (orderType === 'delivery' && (!customerDetails.address || customerDetails.address.length < 3)) {
            toast.error("⚠️ Συμπληρώστε τη Διεύθυνση!");
            return;
        }

        const toastId = toast.loading("Αποστολή παραγγελίας...");

        try {
            const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${Date.now()}`);
            if (settingsRes.data?.open === false) {
                toast.error("Το κατάστημα έκλεισε!", { id: toastId });
                return;
            }

            let finalAddress = orderType === 'delivery'
                ? `${customerDetails.address} (${customerDetails.floor || ''} ορ., κουδ.: ${customerDetails.bell || ''})`
                : "ΠΑΡΑΛΑΒΗ ΑΠΟ ΤΟ ΚΑΤΑΣΤΗΜΑ";

            if (mapCoordinates && orderType === 'delivery') {
                finalAddress += ` | GPS: https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}`;
            }

            const orderTime = new Date().toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'});
            let firstOrderId = null;

            for (const item of cart) {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                    dish: { id: item.dish?.id || item.id },
                    customerName: `${customerDetails.name} [${orderTime}]`,
                    orderType,
                    address: finalAddress,
                    phone: customerDetails.phone,
                    quantity: item.quantity,
                    notes: [
                        item.extras ? `ΕΠΙΛΟΓΕΣ: ${item.extras}` : "",
                        item.comments ? `ΣΧΟΛΙΑ: ${item.comments}` : ""
                    ].filter(Boolean).join(" | "),
                    status: "PENDING"
                });
                if (!firstOrderId) firstOrderId = response.data.id;
            }

            toast.success("🚀 Η παραγγελία στάλθηκε!", { id: toastId });
            clearCart();
            useCartStore.getState().closeCart();
            localStorage.setItem('activeOrderId', firstOrderId);
            window.dispatchEvent(new Event('orderUpdated'));
            if (firstOrderId) router.push(`/order-status/${firstOrderId}`);

        } catch (error) {
            toast.error("Πρόβλημα σύνδεσης με τον server", { id: toastId });
        }
    };

    return (
        <>
            {isCartOpen && <div className="fixed inset-0 bg-olive-900/40 backdrop-blur-sm z-[110]" onClick={closeCart}></div>}

            <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[120] shadow-2xl flex flex-col transform transition-transform duration-300 md:rounded-l-[2rem] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* HEADER */}
                <div className="p-6 flex justify-between items-center border-b border-olive-50">
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} className="p-2 -ml-2 hover:bg-olive-50 rounded-full transition-colors text-olive-900">
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <h3 className="text-xl font-black text-olive-900 uppercase">
                            {step === 1 ? 'Το Καλαθι μου' : 'Στοιχεια Παραδοσης'}
                        </h3>
                    </div>
                    <button onClick={closeCart} className="p-2 hover:bg-red-50 text-olive-400 hover:text-red-500 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {step === 1 ? (
                        /* STEP 1: ITEMS LIST */
                        <div className="p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-olive-300">
                                    <ShoppingBag size={64} className="mb-4 opacity-20" />
                                    <p className="font-bold">Το καλάθι είναι άδειο</p>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={index} className="flex gap-4 bg-white p-4 rounded-3xl border border-olive-100 shadow-sm">
                                        <div className="flex-1">
                                            <h4 className="font-black text-olive-900">{item.dish?.name || item.name}</h4>
                                            {item.extras && (
                                                <p className="text-[10px] text-olive-600 font-bold leading-tight flex justify-between w-full pr-4">
                                                    <span>+ {item.extras}</span>
                                                    {item.extrasPrice > 0 && (
                                                        <span className="text-olive-400">+{item.extrasPrice.toFixed(2)}€</span>
                                                    )}
                                                </p>
                                            )}
                                            <p className="text-olive-900 font-black mt-2 text-sm">{((item.dish?.price || item.price) * item.quantity).toFixed(2)}€</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button onClick={() => removeFromCart(index)} className="text-olive-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            <div className="flex items-center bg-olive-50 rounded-xl p-1 border border-olive-100">
                                                <button onClick={() => updateQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm"><Minus size={12}/></button>
                                                <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm"><Plus size={12}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* QUICK ADD SECTION (Ultra Compact) */}
                            {cart.length > 0 && quickItemsData.length > 0 && (
                                <div className="py-4 px-6 bg-olive-50/50 border-t border-b border-olive-100/50">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-olive-400 mb-2.5">
                                        Μηπως ξεχασατε;
                                    </h4>
                                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                                        {quickItemsData.map(dish => (
                                            <button
                                                key={dish.id}
                                                onClick={() => {
                                                    addToCart(dish, 1, null, 0, "");
                                                    toast.success(`Προστέθηκε ${dish.name}!`);
                                                }}
                                                className="flex-shrink-0 flex items-center gap-2.5 bg-white pr-3 pl-1.5 py-1.5 rounded-xl shadow-sm border border-olive-100 hover:border-olive-300 transition-all active:scale-95 group"
                                            >
                                                <div className="w-9 h-9 bg-olive-50 rounded-lg overflow-hidden relative">
                                                    <img src={dish.imageUrl || '/logo.png'} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black text-olive-900 leading-none mb-1">{dish.name}</p>
                                                    <p className="text-[10px] font-bold text-olive-500 leading-none">+{dish.price.toFixed(2)}€</p>
                                                </div>
                                                <div className="w-5 h-5 ml-1 rounded-md bg-olive-50 text-olive-600 flex items-center justify-center group-hover:bg-olive-600 group-hover:text-white transition-colors">
                                                    <Plus size={12} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STEP 2: CHECKOUT FORM */
                        <div className="p-6 space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* ΟΝΟΜΑΤΕΠΩΝΥΜΟ */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">
                                            Ονοματεπώνυμο
                                        </label>
                                        <input
                                            name="name"
                                            value={customerDetails.name}
                                            onChange={handleInputChange}
                                            type="text"
                                            placeholder="Πληκτρολογήστε το όνομά σας..."
                                            className="w-full p-4 rounded-2xl border border-olive-100 bg-white outline-none focus:ring-2 focus:ring-olive-500 font-bold text-olive-900 shadow-sm"
                                        />
                                    </div>

                                    {/* ΤΗΛΕΦΩΝΟ */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">
                                            Τηλέφωνο Επικοινωνίας
                                        </label>
                                        <input
                                            name="phone"
                                            value={customerDetails.phone}
                                            onChange={handleInputChange}
                                            type="tel"
                                            placeholder="69XXXXXXXX"
                                            className="w-full p-4 rounded-2xl border border-olive-100 bg-white outline-none focus:ring-2 focus:ring-olive-500 font-bold text-olive-900 shadow-sm"
                                        />
                                    </div>
                                    {orderType === 'delivery' && (
                                        <>
                                            <DeliveryAddressSearch
                                                initialAddress={customerDetails.address}
                                                onLocationSelect={(data) => {
                                                    // Ενημερώνουμε τα στοιχεία πελάτη με την επιλεγμένη διεύθυνση
                                                    setCustomerDetails({ address: data.address });
                                                    // Αποθηκεύουμε τις συντεταγμένες για το GPS link
                                                    setMapCoordinates({ lat: data.lat, lng: data.lng });
                                                }}
                                            />

                                            {/* ΟΡΟΦΟΣ & ΚΟΥΔΟΥΝΙ */}
                                            <div className="flex gap-4">
                                                <div className="w-1/2">
                                                    <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">
                                                        Όροφος
                                                    </label>
                                                    <input
                                                        name="floor"
                                                        value={customerDetails.floor}
                                                        onChange={handleInputChange}
                                                        placeholder="π.χ. 3ος"
                                                        className="w-full p-4 rounded-2xl border border-olive-100 bg-white outline-none focus:ring-2 focus:ring-olive-500 font-bold text-olive-900 shadow-sm"
                                                    />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">
                                                        Κουδούνι
                                                    </label>
                                                    <input
                                                        name="bell"
                                                        value={customerDetails.bell}
                                                        onChange={handleInputChange}
                                                        placeholder="Όνομα στο κουδούνι"
                                                        className="w-full p-4 rounded-2xl border border-olive-100 bg-white outline-none focus:ring-2 focus:ring-olive-500 font-bold text-olive-900 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTIONS */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-olive-50 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                        {step === 1 ? (
                            <>
                                <div className="flex bg-olive-50 rounded-2xl p-1 mb-4 shadow-inner">
                                    <button onClick={() => setOrderType('takeaway')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${orderType === 'takeaway' ? 'bg-white shadow-sm text-olive-900' : 'text-olive-400'}`}><Footprints size={16}/> ΠΑΡΑΛΑΒΗ</button>
                                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${orderType === 'delivery' ? 'bg-white shadow-sm text-olive-900' : 'text-olive-400'}`}><Bike size={16}/> DELIVERY</button>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={shortfall > 0}
                                    className={`w-full p-5 rounded-2xl font-black uppercase flex justify-between items-center transition-all ${shortfall > 0 ? 'bg-gray-100 text-gray-400' : 'bg-olive-900 text-white hover:bg-orange-500 shadow-xl'}`}
                                >
                                    <span>Συνεχεια</span>
                                    <span>{totalPrice.toFixed(2)}€</span>
                                </button>
                                {shortfall > 0 && <p className="text-[10px] text-center mt-3 font-bold text-red-500 uppercase tracking-widest">Υπολειπονται {shortfall.toFixed(2)}€ για Delivery</p>}
                            </>
                        ) : (
                            <button onClick={handleCheckout} className="w-full p-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase flex justify-between items-center shadow-xl transition-all active:scale-95">
                                <span>Ολοκληρωση Παραγγελιας</span>
                                <Send size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}