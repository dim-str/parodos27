'use client';

import { ChevronLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FDFCF8] font-sans text-gray-900 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-gray-500 hover:text-orange-500 font-bold transition-colors mb-10"
                >
                    <ChevronLeft size={20} /> Επιστροφή
                </button>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-orange-100 p-4 rounded-full text-orange-500">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight italic">Όροι Χρήσης</h1>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">1. Εισαγωγή</h2>
                            <p>Η χρήση της πλατφόρμας παραγγελιοληψίας μας και η υποβολή παραγγελιών προϋποθέτει την ανεπιφύλακτη αποδοχή των παρακάτω όρων. Το κατάστημά μας διατηρεί το δικαίωμα να τροποποιεί τους όρους ανά πάσα στιγμή χωρίς προηγούμενη ειδοποίηση.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">2. Προϊόντα & Τιμές</h2>
                            <p>Οι παραγγελίες εκτελούνται αυστηρά εντός του δηλωμένου ωραρίου λειτουργίας. Οι φωτογραφίες των προϊόντων είναι ενδεικτικές. Όλες οι τιμές που αναγράφονται στην ιστοσελίδα περιλαμβάνουν τον νόμιμο ΦΠΑ (13% ή 24% ανάλογα το είδος) και τις λοιπές κρατήσεις. Το κατάστημα διατηρεί το δικαίωμα αναπροσαρμογής των τιμών.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">3. Ελάχιστη Παραγγελία & Διανομή (Delivery)</h2>
                            <p>Η υπηρεσία διανομής κατ' οίκον (delivery) είναι διαθέσιμη για συγκεκριμένες περιοχές εξυπηρέτησης και υπόκειται σε όριο ελάχιστης παραγγελίας (π.χ. 5.00€). Ο αναγραφόμενος εκτιμώμενος χρόνος παράδοσης είναι ενδεικτικός και ενδέχεται να μεταβληθεί λόγω φόρτου εργασίας, καιρικών συνθηκών ή κυκλοφοριακού προβλήματος.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">4. Τροποποίηση & Ακύρωση Παραγγελίας</h2>
                            <p>Ακύρωση ή τροποποίηση της παραγγελίας γίνεται δεκτή μόνο τηλεφωνικά, και αυστηρά εντός 5 λεπτών από την ώρα υποβολής της. Εφόσον το κατάστημα έχει ξεκινήσει την παρασκευή των προϊόντων, η παραγγελία δεν μπορεί να ακυρωθεί.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">5. Υποχρεώσεις Πελάτη</h2>
                            <p>Ο πελάτης οφείλει να καταχωρεί τα ακριβή στοιχεία παράδοσης (διεύθυνση, τηλέφωνο, όνομα) για την ορθή εκτέλεση της παραγγελίας. Σε περίπτωση αδυναμίας εντοπισμού του πελάτη από τον διανομέα λόγω λανθασμένων στοιχείων, η παραγγελία θεωρείται ολοκληρωμένη και χρεώνεται κανονικά.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}