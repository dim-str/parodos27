// @ts-nocheck
export default function Footer({ storeSettings }) {
    // Βάζουμε την ταμπελίτσα JSDoc εδώ για να καταλαβαίνει το IDE τι περιέχει!
    /** @type {{ monday: string, tuesday: string, wednesday: string, thursday: string, friday: string, saturday: string, sunday: string, open: boolean }} */
    const settings = storeSettings || {};

    return (
        <footer className="bg-olive-900 text-olive-100 py-12 px-6 mt-20 border-t-4 border-olive-400">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

                {/* 1. Πληροφορίες */}
                <div>
                    <h4 className="text-2xl font-black text-white mb-4 uppercase">Το Μαγειρείο</h4>
                    <p className="text-olive-300 text-sm font-bold leading-relaxed">
                        Παραδοσιακές γεύσεις, φρέσκα υλικά και μεράκι σε κάθε πιάτο.
                        Το φαγητό της μαμάς, στην πόρτα σας.
                    </p>
                </div>

                {/* 2. Δυναμικό Ωράριο */}
                <div>
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Ωράριο Delivery</h4>
                    <ul className="text-sm space-y-1 font-bold">
                        <li className="flex justify-between">
                            <span>Δευτέρα - Παρασκευή:</span>
                            <span className="text-olive-400">{settings.monday || '08:00 - 23:00'}</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Σάββατο:</span>
                            <span className="text-olive-400">{settings.saturday || '09:00 - 22:00'}</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Κυριακή:</span>
                            <span className="text-red-400">{settings.sunday || 'Κλειστά'}</span>
                        </li>
                    </ul>
                </div>

                {/* 3. Επικοινωνία */}
                <div>
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Επικοινωνία</h4>
                    <p className="text-sm font-bold">📍 Διεύθυνση Μαγαζιού 27, Θεσσαλονίκη</p>
                    <p className="text-sm font-bold mt-2">📞 2310 000 000</p>
                </div>
            </div>

            <div className="text-center mt-12 pt-8 border-t border-olive-800 text-xs text-olive-500 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} To Mageireio | Built with Love
            </div>
        </footer>
    );
}