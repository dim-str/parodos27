import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            // --- ΔΕΔΟΜΕΝΑ (STATE) ---
            cart: [],
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

            // Προσθήκη στο καλάθι
            addToCart: (dish, quantity = 1, extras = null, extrasPrice = 0, comments = "") => {
                set((state) => {
                    const existingItemIndex = state.cart.findIndex(
                        (item) => (item.dish?.id || item.id) === (dish.id) && item.extras === extras && item.comments === comments
                    );

                    if (existingItemIndex !== -1) {
                        // Υπάρχει ήδη; Αυξάνουμε ποσότητα!
                        const newCart = [...state.cart];
                        newCart[existingItemIndex].quantity += quantity;
                        return { cart: newCart };
                    }

                    // Νέο πιάτο στο καλάθι
                    return {
                        cart: [...state.cart, { dish, quantity, extras, extrasPrice, comments }]
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
                    return { cart: newCart };
                });
            },

            // Διαγραφή πιάτου
            removeFromCart: (index) => {
                set((state) => {
                    const newCart = [...state.cart];
                    newCart.splice(index, 1);
                    return { cart: newCart };
                });
            },

            // Άδειασμα καλαθιού (μετά την παραγγελία)
            clearCart: () => set({ cart: [] }),

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
                customerDetails: state.customerDetails,
                orderType: state.orderType
            }),
        }
    )
);