'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CreditCard, Bike, Save } from 'lucide-react';

export default function SettingsTab({ storeSettings, setStoreSettings, authToken }) {
    const [isEditingStripe, setIsEditingStripe] = useState(false);
    const [isEditingWolt, setIsEditingWolt] = useState(false);
    
    // Τοπικό state για την επιδότηση ώστε να μην χάνεται στην πληκτρολόγηση
    const [deliveryFeePercentage, setDeliveryFeePercentage] = useState(storeSettings.customerDeliveryFeePercentage ?? 100);

    const [stripeKeys, setStripeKeys] = useState({
        publicKey: storeSettings.stripePublicKey || '',
        secretKey: storeSettings.stripeSecretKey || ''
    });

    const [woltKeys, setWoltKeys] = useState({
        merchantId: storeSettings.woltMerchantId || '',
        apiKey: storeSettings.woltApiKey || ''
    });
    
    // Συγχρονισμός state όταν έρχονται νέα settings
    useEffect(() => {
        setDeliveryFeePercentage(storeSettings.customerDeliveryFeePercentage ?? 100);
    }, [storeSettings.customerDeliveryFeePercentage]);

    const isStripeConnected = stripeKeys.publicKey && stripeKeys.secretKey && !isEditingStripe;
    const isWoltConnected = woltKeys.merchantId && woltKeys.apiKey && !isEditingWolt;

    const saveStripeKeys = async () => {
        try {
            const updated = { ...storeSettings, stripePublicKey: stripeKeys.publicKey, stripeSecretKey: stripeKeys.secretKey };
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updated, { headers: { Authorization: `Bearer ${authToken}` } });
            setStoreSettings(updated);
            setIsEditingStripe(false); 
            toast.success("Τα κλειδιά πληρωμών αποθηκεύτηκαν!");
        } catch { 
            toast.error("Σφάλμα κατά την αποθήκευση."); 
        }
    };

    const saveWoltKeys = async () => {
        const toastId = toast.loading("Αποθήκευση ρυθμίσεων Wolt...");
        try {
            const updated = { 
                ...storeSettings, 
                woltMerchantId: woltKeys.merchantId, 
                woltApiKey: woltKeys.apiKey,
                customerDeliveryFeePercentage: deliveryFeePercentage 
            };
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, updated, { headers: { Authorization: `Bearer ${authToken}` } });
            setStoreSettings(updated);
            setIsEditingWolt(false);
            toast.success("Τα δεδομένα Wolt αποθηκεύτηκαν!", { id: toastId });
        } catch (error) {
            toast.error("Σφάλμα αποθήκευσης!", { id: toastId });
        }
    };

    const saveColor = async () => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, storeSettings, { headers: { Authorization: `Bearer ${authToken}` } });
            toast.success("Το χρώμα αποθηκεύτηκε επιτυχώς!");
        } catch (error) {
            toast.error("Αδυναμία αποθήκευσης χρώματος.");
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-olive-900 uppercase">Ρυθμίσεις Καταστήματος</h2>

            {/* STRIPE INTEGRATION */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-olive-100">
                <h3 className="text-xl font-black text-olive-900 uppercase mb-6 flex items-center gap-2"><CreditCard size={24}/> Διασύνδεση Πληρωμών (Stripe)</h3>

                {isStripeConnected ? (
                    <div className="bg-green-50/50 border border-green-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500 text-white p-3 rounded-2xl shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-green-800 font-black text-lg">Συνδέθηκε Επιτυχώς</h4>
                                <p className="text-green-600/80 text-sm font-bold">Το σύστημα πληρωμών είναι ενεργό και δέχεται κάρτες.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditingStripe(true)}
                            className="px-6 py-2.5 bg-white border border-green-200 text-green-700 rounded-xl text-sm font-black hover:bg-green-50 transition-colors shadow-sm"
                        >
                            Αλλαγή Κλειδιών
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-xs font-black text-olive-500 uppercase mb-2">Stripe Publishable Key</label>
                            <input type="text" value={stripeKeys.publicKey} onChange={(e) => setStripeKeys({...stripeKeys, publicKey: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-olive-500 font-mono text-sm" placeholder="pk_test_..."/>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-olive-500 uppercase mb-2">Stripe Secret Key</label>
                            <input type="password" value={stripeKeys.secretKey} onChange={(e) => setStripeKeys({...stripeKeys, secretKey: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-olive-500 font-mono text-sm" placeholder="sk_test_..."/>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={saveStripeKeys} className="px-6 py-3 bg-olive-900 text-white rounded-xl text-sm font-black hover:bg-olive-800 transition-colors shadow-md">Αποθήκευση Σύνδεσης</button>
                            {(storeSettings.stripePublicKey || storeSettings.stripeSecretKey) && (
                                <button onClick={() => { setIsEditingStripe(false); setStripeKeys({ publicKey: storeSettings.stripePublicKey || '', secretKey: storeSettings.stripeSecretKey || '' }); }} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-black hover:bg-gray-200 transition-colors">Ακύρωση</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* WOLT DRIVE SETTINGS */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <Bike size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase">Διασύνδεση Wolt Drive</h3>
                        <p className="text-sm font-medium text-gray-500">Απαραίτητα για την αυτόματη κλήση διανομέων Wolt</p>
                    </div>
                </div>

                {isWoltConnected ? (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in mb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500 text-white p-3 rounded-2xl shadow-sm">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-blue-800 font-black text-lg">Συνδέθηκε Επιτυχώς</h4>
                                <p className="text-blue-600/80 text-sm font-bold">Οι κλήσεις προς το Wolt API είναι ενεργές.</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEditingWolt(true)} className="px-6 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl text-sm font-black hover:bg-blue-50 transition-colors shadow-sm">
                            Αλλαγή Κλειδιών
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fade-in">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Wolt Merchant ID</label>
                            <input type="text" value={woltKeys.merchantId} onChange={(e) => setWoltKeys({...woltKeys, merchantId: e.target.value})} placeholder="π.χ. 65a4f..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-2">Wolt API Key</label>
                            <input type="password" value={woltKeys.apiKey} onChange={(e) => setWoltKeys({...woltKeys, apiKey: e.target.value})} placeholder="Επικόλληση Wolt API Key..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 outline-none focus:border-blue-500" />
                        </div>
                    </div>
                )}

                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-6">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-blue-900 block">Επιδότηση Μεταφορικών (Wolt)</label>
                            <p className="text-[10px] font-bold text-blue-600 mt-1">Επιλέξτε πόσο % του κόστους Wolt θα πληρώνει ο πελάτης.</p>
                        </div>
                        <span className="text-2xl font-black text-blue-600">{deliveryFeePercentage}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" step="5"
                        value={deliveryFeePercentage} 
                        onChange={(e) => setDeliveryFeePercentage(parseInt(e.target.value))}
                        className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-black uppercase text-blue-400 mt-3">
                        <span>0% (Δωρεάν)</span>
                        <span>50% (Μισά-Μισά)</span>
                        <span>100% (Πελάτης)</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={saveWoltKeys} className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                        <Save size={18} /> Αποθήκευση Ρυθμίσεων Wolt
                    </button>
                    {(isEditingWolt && (storeSettings.woltMerchantId || storeSettings.woltApiKey)) && (
                        <button onClick={() => { setIsEditingWolt(false); setWoltKeys({ merchantId: storeSettings.woltMerchantId || '', apiKey: storeSettings.woltApiKey || '' }); setDeliveryFeePercentage(storeSettings.customerDeliveryFeePercentage ?? 100); }} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black hover:bg-gray-200">Ακύρωση</button>
                    )}
                </div>
            </div>

            {/* ΚΑΤΑΣΤΑΣΗ ΛΕΙΤΟΥΡΓΙΑΣ */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100 flex items-center justify-between">
                <div><h3 className="text-xl font-black text-olive-900">Κατάσταση Λειτουργίας</h3><p className="text-sm font-bold text-olive-500">Κλείσιμο παραγγελιών στο site.</p></div>
                <button onClick={async () => {
                    const newStatus = !storeSettings.open;
                    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, { ...storeSettings, open: newStatus }, { headers: { Authorization: `Bearer ${authToken}` } });
                    setStoreSettings({ ...storeSettings, open: newStatus });
                    toast.success(newStatus ? "Ανοιχτό!" : "Κλειστό!");
                }} className={`px-10 py-4 rounded-2xl font-black text-white ${storeSettings.open ? 'bg-green-500' : 'bg-red-500'}`}>{storeSettings.open ? 'ΑΝΟΙΧΤΟ' : 'ΚΛΕΙΣΤΟ'}</button>
            </div>

            {/* ΩΡΑΡΙΟ ΛΕΙΤΟΥΡΓΙΑΣ */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-black text-olive-900 uppercase">Ωράριο Λειτουργίας</h3>
                    <button onClick={async () => { 
                        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/settings`, storeSettings, { headers: { Authorization: `Bearer ${authToken}` } }); 
                        toast.success("Το ωράριο αποθηκεύτηκε!"); 
                    }} className="bg-olive-900 text-white font-black px-6 py-2.5 rounded-xl uppercase hover:bg-black transition-all">Αποθηκευση</button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const daySchedule = storeSettings[day] || { open: true, start: '12:00', end: '23:00' };
                        return (
                            <div key={day} className="flex items-center gap-4 bg-olive-50 p-4 rounded-2xl border border-olive-100">
                                <label className="flex items-center gap-3 w-32">
                                    <input type="checkbox" checked={daySchedule.open} onChange={(e) => setStoreSettings({ ...storeSettings, [day]: { ...daySchedule, open: e.target.checked } })} className="w-5 h-5 rounded"/>
                                    <span className="font-black text-olive-900 uppercase text-xs">{day}</span>
                                </label>

                                {daySchedule.open ? (
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                        <input type="time" value={daySchedule.start} onChange={(e) => setStoreSettings({ ...storeSettings, [day]: { ...daySchedule, start: e.target.value } })} className="p-2 rounded-lg font-bold text-sm bg-white border outline-none" />
                                        <span className="font-black text-olive-400">έως</span>
                                        <input type="time" value={daySchedule.end} onChange={(e) => setStoreSettings({ ...storeSettings, [day]: { ...daySchedule, end: e.target.value } })} className="p-2 rounded-lg font-bold text-sm bg-white border outline-none" />
                                    </div>
                                ) : (
                                    <span className="text-red-500 font-black text-xs uppercase flex-1 text-right">Κλειστά</span>
                                )}
                            </div>
                        );
                    })}
                </div>

    
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-black text-gray-900">Χρωματική Παλέτα</h3>
                        <button 
                            onClick={saveColor} 
                            className="bg-olive-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-black transition-all shadow-md"
                        >
                            Αποθηκευση Χρωματος
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner border-2 border-gray-200">
                            <input
                                type="color"
                                value={storeSettings?.primaryColor || '#F97316'}
                                onChange={(e) => setStoreSettings({ ...storeSettings, primaryColor: e.target.value })}
                                className="absolute -top-2 -left-2 w-24 h-24 cursor-pointer"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-sm">Βασικό Χρώμα (Brand Color)</p>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                Επιλέξτε το χρώμα και πατήστε "Αποθήκευση Χρώματος" για να εφαρμοστεί στο κατάστημά σας.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}