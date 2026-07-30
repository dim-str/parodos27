'use client';

import { ChevronLeft, Cookie } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CookiesPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FDFCF8] font-sans text-gray-900 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-gray-500 hover:text-yellow-600 font-bold transition-colors mb-10"
                >
                    <ChevronLeft size={20} /> Επιστροφή
                </button>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
                            <Cookie size={32} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight italic">Πολιτική Cookies</h1>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">1. Τι είναι τα Cookies;</h2>
                            <p>Τα cookies είναι μικρά αρχεία κειμένου τα οποία αποθηκεύονται στον browser (π.χ. Chrome, Safari) της συσκευής σας (υπολογιστής, smartphone) κατά την πλοήγησή σας στην ιστοσελίδα μας. Βοηθούν την πλατφόρμα να λειτουργεί ομαλά και να σας παρέχει την καλύτερη δυνατή εμπειρία.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">2. Πώς χρησιμοποιούμε τα Cookies & το Local Storage;</h2>
                            <p>Η ιστοσελίδα μας χρησιμοποιεί αυστηρά **μόνο τα απαραίτητα** ψηφιακά ίχνη για τη λειτουργία της παραγγελίας, και συγκεκριμένα:</p>
                            
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <strong className="text-gray-900 block">Απολύτως Απαραίτητα (Λειτουργικότητας)</strong>
                                    Είναι αναγκαία για να λειτουργήσει το ηλεκτρονικό καλάθι αγορών. Χωρίς αυτά, το σύστημα δεν θα μπορούσε να θυμάται ποια προϊόντα έχετε επιλέξει καθώς προχωράτε προς το ταμείο.
                                </li>
                                <li>
                                    <strong className="text-gray-900 block">Προτιμήσεις Χρήστη (Local Storage)</strong>
                                    Χρησιμοποιούμε την τοπική μνήμη της συσκευής σας (Local Storage) για να "θυμόμαστε" τα αγαπημένα σας προϊόντα ή το αν έχετε κλείσει κάποιο ενημερωτικό παράθυρο. Αυτά τα δεδομένα παραμένουν στη συσκευή σας.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-800 text-sm font-medium">
                                <span className="font-black uppercase tracking-widest block mb-1">Σημαντικη Ενημερωση:</span>
                                Η πλατφόρμα μας **ΔΕΝ** χρησιμοποιεί cookies παρακολούθησης (Tracking Cookies), διαφημιστικά cookies ή εργαλεία τρίτων που καταγράφουν τη δραστηριότητά σας στο διαδίκτυο. Η εμπειρία σας είναι απόλυτα ιδιωτική.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">3. Διαχείριση Cookies</h2>
                            <p>Μπορείτε ανά πάσα στιγμή να διαγράψετε ή να απενεργοποιήσετε τα cookies μέσα από τις ρυθμίσεις του browser σας. Ωστόσο, σας ενημερώνουμε ότι η απενεργοποίηση των απαραίτητων cookies θα σας εμποδίσει από το να προσθέσετε προϊόντα στο καλάθι και να ολοκληρώσετε την παραγγελία σας.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}