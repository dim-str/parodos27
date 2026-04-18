'use client';

import {useEffect, useState} from 'react';
import { ShoppingCart, UserCog, Clock } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
    const [activeOrderId, setActiveOrderId] = useState(null);

    useEffect(() => {
        const checkActiveOrder = () => {
            const savedOrderId = localStorage.getItem('activeOrderId');
            setActiveOrderId(savedOrderId);
        };

        // Ελέγχει με το που φορτώνει η σελίδα
        checkActiveOrder();

        // Ακούει για αλλαγές που κάνουμε εμείς (custom event)
        window.addEventListener('orderUpdated', checkActiveOrder);

        return () => {
            window.removeEventListener('orderUpdated', checkActiveOrder);
        };
    }, []);

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const totalItems = useCartStore((state) => state.getTotalItems());
    const toggleCart = useCartStore((state) => state.toggleCart);
    const customerDetails = useCartStore((state) => state.customerDetails);
    const setCustomerDetails = useCartStore((state) => state.setCustomerDetails);

    const handleInputChange = (e) => {
        setCustomerDetails({ [e.target.name]: e.target.value });
    };

    const [isMounted, setIsMounted] = useState(false);
    // 2. Μόλις φορτώσει το component στον browser, το κάνουμε true
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const pathname = usePathname();

    // ΑΝ είμαστε στο /admin (ή σε οποιαδήποτε υποσελίδα του), μην εμφανίσεις ΤΙΠΟΤΑ
    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    if (pathname && pathname.startsWith('/delivery')) {
        return null;
    }

    return (
        <header className="bg-olive-900 border-b border-olive-800 sticky top-0 z-50 shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* LOGO */}
                <div className="flex items-center gap-3">
                    <h1 className="text-white font-black text-xl tracking-tighter uppercase">
                        Πάροδος <span className="text-olive-500">27</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* CART BUTTON */}
                    <div className="flex items-center gap-4">
                        {/* ΝΕΟ: Κουμπί Ενεργής Παραγγελίας */}
                        {activeOrderId && (
                            <Link href={`/order-status/${activeOrderId}`} className="hidden md:flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-200 transition-colors animate-pulse">
                                <Clock size={16} /> Η Παραγγελία μου
                            </Link>
                        )}

                        {/* Το κουμπί του Καλαθιού σου */}
                        <button onClick={toggleCart}> ... </button>
                    </div>

                    <button
                        onClick={toggleCart}
                        className="relative text-white hover:text-olive-200 transition-all p-2 bg-olive-800 rounded-full flex items-center justify-center w-10 h-10 shadow-lg border border-olive-700"
                    >
                        <ShoppingCart size={18} />
                        <span className="absolute -top-1 -right-1 bg-olive-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-olive-900">
                            {isMounted ? totalItems : 0}
                        </span>
                    </button>

                </div>
            </div>
        </header>
    );
}