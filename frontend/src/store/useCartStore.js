import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast'; // ΠΡΟΣΘΗΚΗ: Μην το ξεχάσεις για το μήνυμα!

export const useCartStore = create(
    persist(
        (set, get) => ({
            // --- ΔΕΔΟΜΕΝΑ (STATE) ---
            cart: [],
            storeSlug: null, // ΠΡΟΣΘΗΚΗ: Εδώ "κλειδώνει" το μαγαζί
            orderType: 'takeaway',
            customerDetails: {
                name: '',
                phone: '',
                address: '',
                floor: '',
                bell: ''
            },

            // --- ΕΝΕΡΓΕΙΕΣ (ACTIONS) ---

            // Αλλαγή τύπου παραγγελίας
            setOrderType: (type) => set({ orderType: type }),

            // Αποθήκευση στοιχείων πελάτη
            setCustomerDetails: (details) => set((state) => ({
                customerDetails: { ...state.customerDetails, ...details }
            })),

            // ΠΡΟΣΘΗΚΗ: Βάλαμε το currentStoreSlug ως τελευταία παράμετρο
            addToCart: (dish, quantity = 1, extras = null, extrasPrice = 0, comments = "", currentStoreSlug) => {
                set((state) => {
                    // --- ΔΙΑΓΡΑΨΑΜΕ ΤΟΝ ΑΥΣΤΗΡΟ ΕΛΕΓΧΟ ΠΟΥ ΑΔΕΙΑΖΕ ΤΟ ΚΑΛΑΘΙ ---

                    // --- ΚΑΝΟΝΙΚΗ ΡΟΗ ---
                    const existingItemIndex = state.cart.findIndex(
                        (item) => (item.dish?.id || item.id) === (dish.id) && item.extras === extras && item.comments === comments
                    );

                    // Ορίζουμε το slug: αν μας έδωσαν νέο το κρατάμε, αλλιώς κρατάμε το παλιό
                    const targetStoreSlug = currentStoreSlug || state.storeSlug;

                    if (existingItemIndex !== -1) {
                        // Υπάρχει ήδη; Αυξάνουμε ποσότητα!
                        const newCart = [...state.cart];
                        newCart[existingItemIndex].quantity += quantity;
                        return { cart: newCart, storeSlug: targetStoreSlug };
                    }

                    // Νέο πιάτο στο καλάθι
                    return {
                        cart: [...state.cart, { dish, quantity, extras, extrasPrice, comments }],
                        storeSlug: targetStoreSlug
                    };
                });
            },

            // Αλλαγή ποσότητας (+ / -)
            updateQuantity: (index, amount) => {
                set((state) => {
                    const newCart = [...state.cart];
                    newCart[index].quantity += amount;

                    // Αν πάει στο 0, το διαγράφουμε
                    if (newCart[index].quantity <= 0) {
                        newCart.splice(index, 1);
                    }

                    // ΠΡΟΣΘΗΚΗ: Αν άδειασε εντελώς το καλάθι, "ξεκλειδώνουμε" το μαγαζί
                    if (newCart.length === 0) {
                        return { cart: [], storeSlug: null };
                    }

                    return { cart: newCart };
                });
            },

            // Διαγραφή πιάτου
            removeFromCart: (index) => {
                set((state) => {
                    const newCart = [...state.cart];
                    newCart.splice(index, 1);

                    // ΠΡΟΣΘΗΚΗ: Αν άδειασε εντελώς το καλάθι, "ξεκλειδώνουμε" το μαγαζί
                    if (newCart.length === 0) {
                        return { cart: [], storeSlug: null };
                    }

                    return { cart: newCart };
                });
            },

            // Άδειασμα καλαθιού (μετά την παραγγελία)
            clearCart: () => set({ cart: [], storeSlug: null }), // ΠΡΟΣΘΗΚΗ: Καθαρίζουμε και το slug

            // --- ΥΠΟΛΟΓΙΣΜΟΙ (GETTERS) ---

            // Επιστρέφει το συνολικό ποσό
            getTotalPrice: () => {
                const state = get();
                return state.cart.reduce((total, item) => {
                    const itemPrice = (item.dish?.price || item.price || 0) + (item.extrasPrice || 0);
                    return total + (itemPrice * item.quantity);
                }, 0);
            },

            // Επιστρέφει το σύνολο των τεμαχίων
            getTotalItems: () => {
                const state = get();
                return state.cart.reduce((total, item) => total + item.quantity, 0);
            },

            isCartOpen: false,
            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
            closeCart: () => set({ isCartOpen: false }),
            modalDish: null, // Όταν είναι null, το Modal είναι κλειστό
            openModal: (dish) => set({ modalDish: dish }),
            closeModal: () => set({ modalDish: null })
        }),
        {
            name: 'parodos-cart-storage', // όνομα στο localStorage
            partialize: (state) => ({
                cart: state.cart,
                storeSlug: state.storeSlug, // ΠΡΟΣΘΗΚΗ: Σώζουμε το slug στο LocalStorage!
                customerDetails: state.customerDetails,
                orderType: state.orderType
            }),
        }
    )
);