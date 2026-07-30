'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Bike, Footprints, ShoppingBag, MapPin, ChevronLeft, Send, CreditCard, Banknote, FileText, Home, Briefcase, Navigation } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import DeliveryAddressSearch from "./DeliveryAddressSearch";
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#ffffff';
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};

const StripeInlineForm = ({ onSuccess, themeColor, themeContrast }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setIsProcessing(true);
        const toastId = toast.loading("Επεξεργασία πληρωμής...");

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.origin + '/success' },
            redirect: 'if_required'
        });

        if (error) {
            toast.error(error.message, { id: toastId });
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast.success("Η πληρωμή εγκρίθηκε!", { id: toastId });
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <PaymentElement />
            <button disabled={isProcessing} className="w-full p-5 rounded-2xl font-black uppercase shadow-xl transition-all disabled:opacity-50 mt-6" style={{ backgroundColor: themeColor, color: themeContrast }}>
                {isProcessing ? 'Επεξεργασια...' : 'Πληρωμη & Ολοκληρωση'}
            </button>
        </form>
    );
};

export default function CartDrawer() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const params = useParams();
    const urlSlug = params.storeSlug;
    
    const [paymentMethod, setPaymentMethod] = useState('cash'); 
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState('');
    const [activeTab, setActiveTab] = useState('details'); 
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [storeSettings, setStoreSettings] = useState(null);

    const CARD_FEE = 0.20;

    const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart, getTotalPrice, orderType, setOrderType, customerDetails, setCustomerDetails, clearCart, addToCart, storeSlug } = useCartStore();

    const totalPrice = getTotalPrice();
    const MIN_ORDER = 5.00;
    const shortfall = orderType === 'delivery' ? MIN_ORDER - totalPrice : 0;
    const [quickItemsData, setQuickItemsData] = useState([]);
    const [mapCoordinates, setMapCoordinates] = useState(null);

    // ΝΕΟ: Αποθηκευμένες διευθύνσεις και Χρήστης
    const [userProfile, setUserProfile] = useState(null);
    const [savedAddresses, setSavedAddresses] = useState([]);

    const finalTotal = totalPrice + (orderType === 'delivery' ? deliveryFee : 0) + (paymentMethod === 'card' ? CARD_FEE : 0);
    const themeColor = storeSettings?.primaryColor || '#F97316';
    const themeContrast = getContrastColor(themeColor);

    useEffect(() => {
        if (!isCartOpen) { setStep(1); setActiveTab('details'); }
    }, [isCartOpen]);

    useEffect(() => {
        const fetchStoreData = async () => {
            if (!urlSlug) return;
            try {
                const dishesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${urlSlug}/dishes?t=${Date.now()}`);
                setQuickItemsData(dishesRes.data.filter(dish => dish.isQuickItem === true));
                
                const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${urlSlug}/settings?t=${Date.now()}`);
                if (settingsRes.data) setStoreSettings(settingsRes.data);
            } catch (error) { console.error("Σφάλμα φόρτωσης δεδομένων καλαθιού"); }
        };
        void fetchStoreData();

        // Έλεγχος χρήστη για να φέρουμε διευθύνσεις (και Stripe ID αργότερα)
        const checkUser = async () => {
            const lsUser = localStorage.getItem('zesto_user');
            if(lsUser) {
                const parsed = JSON.parse(lsUser);
                setUserProfile(parsed);
                // Αυτόματα συμπληρώνουμε το όνομα και το τηλέφωνο αν υπάρχουν
                setCustomerDetails({ 
                    ...customerDetails, 
                    name: customerDetails.name || parsed.fullName || parsed.name || '',
                    phone: customerDetails.phone || parsed.phone || ''
                });
                
                // Φέρνουμε τις διευθύνσεις του
                if(parsed.firebaseUid) {
                    try {
                        const addrRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${parsed.firebaseUid}/addresses`);
                        setSavedAddresses(addrRes.data || []);
                    } catch(e) {}
                }
            }
        };
        checkUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlSlug, isCartOpen]); // Επαναφόρτωση διευθύνσεων όταν ανοίγει το καλάθι

    const handleInputChange = (e) => { setCustomerDetails({ [e.target.name]: e.target.value }); };

    const handleSelectSavedAddress = async (addr) => {
        setCustomerDetails({ ...customerDetails, address: addr.street, floor: addr.floor || '', bell: addr.bell || '' });
        // Αν η διεύθυνση είχε συντεταγμένες στη DB, υπολογίζουμε το fee. Αλλιώς, ίσως χρειαστεί να το αφήσουμε μηδέν (ή να γίνει validation). 
        // Εδώ θεωρούμε ότι θα χρεωθεί standard αν δεν έχουμε lat/lng.
        toast.success(`Επιλέχθηκε: ${addr.label}`);
    };

    const handleProceed = async () => {
        if (!customerDetails.phone) return toast.error("⚠️ Συμπληρώστε Τηλέφωνο!");
        if (orderType === 'delivery' && (!customerDetails.address || customerDetails.address.length < 3)) return toast.error("⚠️ Συμπληρώστε τη Διεύθυνση!");

        const toastId = toast.loading("Προετοιμασία παραγγελίας...");
        let currentOrderId = null; let databaseId = null;

        try {
            const targetSlug = storeSlug || urlSlug;
            const settingsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/settings?t=${Date.now()}`);
            if (settingsRes.data?.open === false) return toast.error("Το κατάστημα έκλεισε!", { id: toastId });

            let finalAddress = orderType === 'delivery' ? `${customerDetails.address} (${customerDetails.floor || ''} ορ., κουδ.: ${customerDetails.bell || ''})` : "ΠΑΡΑΛΑΒΗ ΑΠΟ ΤΟ ΚΑΤΑΣΤΗΜΑ";
            if (mapCoordinates && orderType === 'delivery') finalAddress += ` | GPS: https://www.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}`;

            const randomGuestId = "Guest-" + Math.random().toString(36).substring(2, 7).toUpperCase();
            const finalCustomerName = customerDetails.name && customerDetails.name.trim() !== "" ? customerDetails.name : randomGuestId;
            const orderTime = new Date().toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'});
            
            const orderPayload = {
                customerName: `${finalCustomerName} [${orderTime}]`, phone: customerDetails.phone, address: finalAddress,
                orderType: orderType, paymentMethod: paymentMethod === 'card' ? 'ΚΑΡΤΑ' : 'ΜΕΤΡΗΤΑ', notes: "",
                cartItems: cart.map(item => ({ dishId: item.dish?.id || item.id, quantity: item.quantity, extras: [item.extras, item.comments].filter(Boolean).join(" | ") }))
            };

            const initRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${targetSlug}/orders`, orderPayload);
            currentOrderId = initRes.data.orderId; databaseId = initRes.data.databaseId;      
            toast.dismiss(toastId);
        } catch (error) { return toast.error("Αποτυχία δημιουργίας παραγγελίας.", { id: toastId }); }

        if (paymentMethod === 'cash') {
            handleCheckout(currentOrderId); 
        } else {
            const stripeToastId = toast.loading("Σύνδεση με τράπεζα...");
            try {
                // ΣΤΕΛΝΟΥΜΕ ΤΟ stripeCustomerId ΣΤΟ BACKEND ΓΙΑ ΝΑ ΕΜΦΑΝΙΣΟΥΜΕ ΤΙΣ ΑΠΟΘΗΚΕΥΜΕΝΕΣ ΚΑΡΤΕΣ ΤΟΥ!
                const reqPayload = { amount: finalTotal, orderId: databaseId || currentOrderId, customerName: customerDetails.name };
                if (userProfile?.stripeCustomerId) reqPayload.stripeCustomerId = userProfile.stripeCustomerId;

                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, reqPayload);
                setStripePromise(loadStripe(res.data.publicKey));
                setClientSecret(res.data.clientSecret);
                toast.dismiss(stripeToastId);
                setStep(3); 
            } catch (error) { toast.error("Σφάλμα σύνδεσης. Δοκιμάστε μετρητά.", { id: stripeToastId }); }
        }
    };

    const handleCheckout = async (orderId = null) => {
        const toastId = toast.loading("Ολοκλήρωση παραγγελίας...");
        try {
            const targetSlug = storeSlug || urlSlug;
            if (orderId && paymentMethod === 'card') await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/store/${targetSlug}/orders/${orderId}/confirm`);
            toast.success("🚀 Η παραγγελία στάλθηκε!", { id: toastId });
            clearCart(); useCartStore.getState().closeCart();
            if (orderId) { localStorage.setItem('activeOrderId', orderId); window.dispatchEvent(new Event('orderUpdated')); router.push(`/track/${orderId}`); }   
        } catch (error) { toast.error("Πρόβλημα σύνδεσης με τον server", { id: toastId }); }
    };

    return (
        <>
            {isCartOpen && <div className="fixed inset-0 bg-olive-900/40 backdrop-blur-sm z-[110]" onClick={closeCart}></div>}

            <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[120] shadow-2xl flex flex-col transform transition-transform duration-300 md:rounded-l-[2rem] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="p-6 flex justify-between items-center border-b border-olive-50 shrink-0">
                    <div className="flex items-center gap-2">
                        {(step === 2 || step === 3) && <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 hover:bg-olive-50 rounded-full transition-colors text-olive-900"><ChevronLeft size={24} /></button>}
                        <h3 className="text-xl font-black text-olive-900 uppercase">{step === 1 ? 'Το Καλαθι μου' : step === 2 ? 'Ολοκληρωση' : 'Πληρωμη'}</h3>
                    </div>
                    <button onClick={closeCart} className="p-2 hover:bg-red-50 text-olive-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
                    {step === 1 && (
                        <div className="p-6 space-y-4 h-full bg-white">
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
                                            
                                            {(item.dish?.isCombo || item.isCombo) && (item.dish?.comboItems?.length > 0 || item.comboItems?.length > 0) && (
                                                <div className="flex flex-wrap gap-1 mt-1.5 mb-1">
                                                    {(item.dish?.comboItems || item.comboItems).map((ci, idx) => (
                                                        <span key={idx} className="bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                            {ci.quantity}x {ci.dish?.name || 'Πιάτο'}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {item.extras && (
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {item.extras.split('|').map((extra, idx) => {
                                                        const cleanExtra = extra.trim();
                                                        if (!cleanExtra) return null;
                                                        return (
                                                            <div key={idx} className="flex items-start gap-2 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg w-fit shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1 shrink-0"></div>
                                                                <span className="text-[11px] font-bold text-gray-600 leading-tight">
                                                                    {cleanExtra.replace('+', '').trim()}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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

                            {cart.length > 0 && quickItemsData.length > 0 && (
                                <div className="py-4 px-6 bg-olive-50/50 border-t border-b border-olive-100/50">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-olive-400 mb-2.5">Μηπως ξεχασατε;</h4>
                                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                                        {quickItemsData.map(dish => (
                                            <button key={dish.id} onClick={() => { addToCart({...dish, storeSlug: urlSlug, store:{slug:urlSlug}}, 1, null, 0, ""); toast.success(`Προστέθηκε ${dish.name}!`); }} className="flex-shrink-0 flex items-center gap-2.5 bg-white pr-3 pl-1.5 py-1.5 rounded-xl shadow-sm border border-olive-100 hover:border-olive-300 transition-all active:scale-95 group">
                                                <div className="w-9 h-9 bg-olive-50 rounded-lg overflow-hidden relative"><img src={dish.imageUrl || '/logo.png'} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /></div>
                                                <div className="text-left"><p className="text-[11px] font-black text-olive-900 leading-none mb-1">{dish.name}</p><p className="text-[10px] font-bold text-olive-500 leading-none">+{dish.price.toFixed(2)}€</p></div>
                                                <div className="w-5 h-5 ml-1 rounded-md bg-olive-50 text-olive-600 flex items-center justify-center group-hover:bg-olive-600 group-hover:text-white transition-colors"><Plus size={12} /></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col h-full bg-white">
                            <div className="flex p-4 border-b border-gray-100 bg-gray-50 gap-2 shrink-0">
                                <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'details' ? 'bg-olive-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}><MapPin size={14} /> Στοιχεια Παραδοσης</button>
                                <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-olive-900 text-white shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}><FileText size={14} /> Αναλυτικη</button>
                            </div>

                            {activeTab === 'details' && (
                                <div className="p-6 space-y-6 animate-fade-in flex-1 overflow-y-auto">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block tracking-widest">Ονοματεπώνυμο <span className="text-gray-300 font-bold lowercase tracking-normal">(Προαιρετικό)</span></label>
                                                <input name="name" value={customerDetails.name} onChange={handleInputChange} type="text" placeholder="π.χ. Γιώργος Π." className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-olive-500 font-bold text-gray-900 shadow-sm" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-1 block tracking-widest">Τηλέφωνο Επικοινωνίας</label>
                                                <input name="phone" value={customerDetails.phone} onChange={handleInputChange} type="tel" className="w-full p-4 rounded-2xl border border-olive-100 bg-gray-50 outline-none focus:ring-2 focus:ring-olive-500 font-bold text-olive-900 shadow-sm" />
                                            </div>
                                            {orderType === 'delivery' && (
                                                <>
                                                    {/* Γρήγορη Επιλογή Αποθηκευμένης Διεύθυνσης */}
                                                    {savedAddresses.length > 0 && (
                                                        <div className="mb-2">
                                                            <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-2 block tracking-widest">Οι Διευθυνσεις μου</label>
                                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                                {savedAddresses.map(addr => (
                                                                    <button key={addr.id} onClick={() => handleSelectSavedAddress(addr)} className="shrink-0 flex items-center gap-2 px-3 py-2 bg-olive-50 text-olive-900 rounded-xl border border-olive-100 hover:bg-olive-100 transition-colors">
                                                                        {addr.label==='Σπίτι'?<Home size={14}/>:addr.label==='Γραφείο'?<Briefcase size={14}/>:<Navigation size={14}/>}
                                                                        <span className="text-xs font-bold">{addr.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <DeliveryAddressSearch
                                                        initialAddress={customerDetails.address}
                                                        onLocationSelect={async (data) => {
                                                            setCustomerDetails({ ...customerDetails, address: data.address });
                                                            setMapCoordinates({ lat: data.lat, lng: data.lng });
                                                            const toastId = toast.loading("Υπολογισμός κόστους...");
                                                            try {
                                                                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/public/wolt/delivery-fee`, { lat: data.lat, lng: data.lng, address: data.address, storeSlug: urlSlug || storeSlug });
                                                                setDeliveryFee(res.data.fee || 0);
                                                                toast.success("Το κόστος ενημερώθηκε!", { id: toastId });
                                                            } catch (error) { toast.error("Σφάλμα Wolt", { id: toastId }); }
                                                        }}
                                                    />
                                                    <div className="flex gap-4 mt-2">
                                                        <div className="w-1/2">
                                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block tracking-widest">Όροφος</label>
                                                            <input name="floor" value={customerDetails.floor} onChange={handleInputChange} className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none font-bold text-sm" />
                                                        </div>
                                                        <div className="w-1/2">
                                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block tracking-widest">Κουδούνι</label>
                                                            <input name="bell" value={customerDetails.bell} onChange={handleInputChange} className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none font-bold text-sm" />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <div className="mt-2">
                                                <label className="text-[10px] font-black uppercase text-olive-400 ml-2 mb-2 block tracking-widest">Τρόπος Πληρωμής</label>
                                                <div className="flex bg-gray-100 rounded-2xl p-1 shadow-inner border border-gray-200">
                                                    <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-white shadow-sm text-olive-900' : 'text-gray-400'}`}><Banknote size={16}/> Μετρητά</button>
                                                    <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-white shadow-sm text-olive-900' : 'text-gray-400'}`}><CreditCard size={16}/> Κάρτα</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'summary' && (
                                <div className="p-6 space-y-4 animate-fade-in flex-1 overflow-y-auto">
                                    <div className="space-y-3 mb-6">
                                        {cart.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <div className="flex-1">
                                                    <span className="font-black text-olive-900">{item.quantity}x {item.dish?.name || item.name}</span>
                                                </div>
                                                <div className="font-black text-olive-900">{((item.dish?.price || item.price) * item.quantity).toFixed(2)}€</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 space-y-3 bg-gray-50 p-5 rounded-3xl">
                                        <div className="flex justify-between text-sm font-bold text-gray-500"><span>Αξία Προϊόντων</span><span>{totalPrice.toFixed(2)}€</span></div>
                                        {orderType === 'delivery' && <div className="flex justify-between text-sm font-bold text-blue-500"><span>Διανομή</span><span>+{deliveryFee.toFixed(2)}€</span></div>}
                                        {paymentMethod === 'card' && <div className="flex justify-between text-sm font-bold text-purple-500"><span>Κάρτα</span><span>+{CARD_FEE.toFixed(2)}€</span></div>}
                                        <div className="flex justify-between text-lg font-black text-olive-900 pt-3 border-t border-gray-200"><span>Τελικό Σύνολο</span><span>{finalTotal.toFixed(2)}€</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="p-6 animate-fade-in h-full bg-white">
                            <div className="bg-olive-50 p-4 rounded-3xl border border-olive-100 flex justify-between items-center mb-4">
                                <span className="font-bold text-olive-600 text-sm">Σύνολο:</span>
                                <span className="font-black text-olive-900 text-xl">{finalTotal.toFixed(2)}€</span>
                            </div>
                            {clientSecret && stripePromise ? (
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                                    <StripeInlineForm onSuccess={handleCheckout} themeColor={themeColor} themeContrast={themeContrast} />
                                </Elements>
                            ) : (
                                <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-900 mx-auto mb-4"></div></div>
                            )}
                        </div>
                    )}
                </div>

                {cart.length > 0 && step < 3 && (
                    <div className="p-6 border-t border-olive-50 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)] shrink-0">
                        {step === 1 ? (
                            <>
                                <div className="flex bg-olive-50 rounded-2xl p-1 mb-4 shadow-inner">
                                    <button onClick={() => setOrderType('takeaway')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${orderType === 'takeaway' ? 'bg-white shadow-sm text-olive-900' : 'text-olive-400'}`}><Footprints size={16}/> ΠΑΡΑΛΑΒΗ</button>
                                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${orderType === 'delivery' ? 'bg-white shadow-sm text-olive-900' : 'text-olive-400'}`}><Bike size={16}/> DELIVERY</button>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={shortfall > 0}
                                    className={`w-full p-5 rounded-2xl font-black uppercase flex justify-between items-center transition-all shadow-xl ${shortfall > 0 ? 'bg-gray-100 text-gray-400' : ''}`}
                                    style={shortfall <= 0 ? { backgroundColor: themeColor, color: themeContrast } : {}}
                                >
                                    <span>Συνεχεια</span>
                                    <span>{totalPrice.toFixed(2)}€</span>
                                </button>
                                {shortfall > 0 && <p className="text-[10px] text-center mt-3 font-bold text-red-500 uppercase tracking-widest">Υπολειπονται {shortfall.toFixed(2)}€ για Delivery</p>}
                            </>
                        ) : (
                            <button 
                                onClick={handleProceed} 
                                className="w-full p-5 rounded-2xl font-black uppercase flex justify-between items-center shadow-xl transition-all active:scale-95"
                                style={{ backgroundColor: themeColor, color: themeContrast }}
                            >
                                <span>{paymentMethod === 'cash' ? 'Ολοκληρωση Παραγγελιας' : 'Πληρωμη με Καρτα'}</span>
                                <Send size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}