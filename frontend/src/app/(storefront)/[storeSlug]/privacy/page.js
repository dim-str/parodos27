'use client';

import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FDFCF8] font-sans text-gray-900 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold transition-colors mb-10"
                >
                    <ChevronLeft size={20} /> Επιστροφή
                </button>

                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-green-100 p-4 rounded-full text-green-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight italic">Πολιτική Απορρήτου</h1>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">1. Προστασία Δεδομένων</h2>
                            <p>Η προστασία των προσωπικών σας δεδομένων είναι πρωταρχικής σημασίας για εμάς. Η παρούσα πολιτική περιγράφει πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα δεδομένα σας κατά την υποβολή παραγγελίας, σε πλήρη εναρμόνιση με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR).</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">2. Δεδομένα που Συλλέγουμε</h2>
                            <p>Για την εκτέλεση της παραγγελίας σας συλλέγουμε μόνο τα απολύτως απαραίτητα στοιχεία:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Ονοματεπώνυμο</li>
                                <li>Διεύθυνση παράδοσης (Οδός, αριθμός, Τ.Κ., Όροφος)</li>
                                <li>Τηλέφωνο επικοινωνίας</li>
                                <li>Στοιχεία παραγγελίας (είδος, ποσότητα, σχόλια)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">3. Σκοπός Επεξεργασίας</h2>
                            <p>Τα δεδομένα σας χρησιμοποιούνται αποκλειστικά και μόνο για:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Την ορθή παρασκευή και παράδοση της παραγγελίας σας.</li>
                                <li>Την επικοινωνία μαζί σας σε περίπτωση ανάγκης (π.χ. έλλειψη προϊόντος ή δυσκολία εύρεσης της διεύθυνσης).</li>
                                <li>Την έκδοση του νομίμου παραστατικού (Απόδειξη/Τιμολόγιο).</li>
                            </ul>
                            <p className="mt-2 font-bold text-gray-900">Δεν μοιραζόμαστε, δεν πουλάμε και δεν μεταβιβάζουμε τα δεδομένα σας σε τρίτες διαφημιστικές εταιρείες.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">4. Τοπική Αποθήκευση (Local Storage)</h2>
                            <p>Ορισμένες λειτουργίες, όπως η λίστα με τα "Αγαπημένα" σας πιάτα, αποθηκεύονται αποκλειστικά στην τοπική μνήμη της συσκευής σας (Local Storage) και δεν αποστέλλονται ούτε αποθηκεύονται στους δικούς μας διακομιστές.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-3">5. Τα Δικαιώματά σας</h2>
                            <p>Ως χρήστης, διατηρείτε το δικαίωμα ενημέρωσης, πρόσβασης, διόρθωσης ή διαγραφής των προσωπικών σας δεδομένων. Για την άσκηση των δικαιωμάτων σας, μπορείτε να επικοινωνήσετε μαζί μας τηλεφωνικά στο τηλέφωνο του καταστήματος.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}