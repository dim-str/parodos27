// @ts-nocheck
import Link from 'next/link';

export default function Footer({ storeSettings, storeSlug }) {
    // Βάζουμε την ταμπελίτσα JSDoc εδώ για να καταλαβαίνει το IDE τι περιέχει!
    /** @type {{ storeName: string, address: string, phone: string, monday: string, tuesday: string, wednesday: string, thursday: string, friday: string, saturday: string, sunday: string, open: boolean }} */
    const settings = storeSettings || {};
    
    // 1. Τραβάμε τα δυναμικά δεδομένα (με Fallbacks αν είναι κενά)
    const storeName = settings.storeName || 'Το Κατάστημά μας';
    const address = settings.address || 'Δεν έχει δηλωθεί διεύθυνση';
    const phone = settings.phone || 'Δεν έχει δηλωθεί τηλέφωνο';
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-olive-900 text-olive-100 py-12 px-6 mt-20 border-t-4 border-olive-400">

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">

                {/* 1. Πληροφορίες (ΔΥΝΑΜΙΚΟ ΟΝΟΜΑ ΜΑΓΑΖΙΟΥ) */}
                <div>
                    <h4 className="text-2xl font-black text-white mb-4 uppercase">{storeName}</h4>
                    <p className="text-olive-300 text-sm font-bold leading-relaxed">
                        Παραδοσιακές γεύσεις, φρέσκα υλικά και μεράκι σε κάθε πιάτο.
                        Το φαγητό της μαμάς, στην πόρτα σας.
                    </p>
                </div>

                {/* 2. Δυναμικό Ωράριο (Με την δική σου έξυπνη ομαδοποίηση!) */}
                <div>
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Ωράριο Delivery</h4>
                    <ul className="text-sm space-y-2 font-bold">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((dayKey) => {
                            const dayLabel = { monday: 'Δευτέρα', tuesday: 'Τρίτη', wednesday: 'Τετάρτη', thursday: 'Πέμπτη', friday: 'Παρασκευή', saturday: 'Σάββατο', sunday: 'Κυριακή' }[dayKey];
                            const schedule = settings[dayKey]; // Αυτό τώρα είναι object {open, start, end}

                            // Αν το schedule δεν υπάρχει, δείξε Κλειστά
                            if (!schedule || !schedule.open) {
                                return (
                                    <li key={dayKey} className="flex justify-between gap-4">
                                        <span>{dayLabel}:</span>
                                        <span className="text-red-400">Κλειστά</span>
                                    </li>
                                );
                            }

                            return (
                                <li key={dayKey} className="flex justify-between gap-4">
                                    <span>{dayLabel}:</span>
                                    <span className="text-olive-400">{schedule.start} - {schedule.end}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* 3. Επικοινωνία (ΔΥΝΑΜΙΚΑ ΣΤΟΙΧΕΙΑ) */}
                <div>
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Επικοινωνία</h4>
                    <p className="text-sm font-bold flex items-start gap-2">
                        <span className="shrink-0">📍</span> 
                        <span>{address}</span>
                    </p>
                    <p className="text-sm font-bold mt-3 flex items-center gap-2">
                        <span className="shrink-0">📞</span> 
                        <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
                    </p>
                </div>
                
            </div>

            {/* BOTTOM BAR: Copyright & Νομικά Links (ΑΝΤΙΚΑΤΕΣΤΗΣΕ ΤΟ "BUILT WITH LOVE") */}
            <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-olive-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-olive-500 font-bold uppercase tracking-widest">
                <div className="text-center md:text-left">
                    <img 
                        src="/logo2.png" 
                        alt="Zesto Footer Logo" 
                        className="h-20 w-auto mb-4" 
                    />
                    © {currentYear} ZESTO | ΜΕ ΤΗΝ ΕΠΙΦΥΛΑΞΗ ΠΑΝΤΟΣ ΔΙΚΑΙΩΜΑΤΟΣ
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
                    <Link href={`/${storeSlug}/terms`} className="hover:text-orange-500">
                        Όροι Χρήσης
                    </Link>
                    <Link href={`/${storeSlug}/privacy`} className="hover:text-green-500">
                        Πολιτική Απορρήτου
                    </Link>
                    <Link href={`/${storeSlug}/cookies`} className="hover:text-yellow-500">
                        Πολιτική Cookies
                    </Link>
                </div>
            </div>
        </footer>
    );
}