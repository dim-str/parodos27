"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, Utensils, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { resolveApiUrl } from "../../lib/apiUrl";

export default function UnifiedLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Χρησιμοποιούμε το Next.js API route για να μπει σωστά το Cookie
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                console.error("Login failed with status:", res.status);
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Λάθος στοιχεία σύνδεσης");
            }

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("username", data.username);

                toast.success(`Καλώς ήρθες, ${data.username}!`, { icon: '👋' });

                // Καθυστέρηση μισού δευτερολέπτου για να φανεί το animation
                setTimeout(() => {
                    switch (data.role) {
                        case "ROLE_SUPER_ADMIN":
                            router.push("/master-panel");
                            break;
                        case "ROLE_STORE_ADMIN":
                            router.push("/dashboard");
                            break;
                        case "ROLE_DELIVERY":
                            router.push("/delivery");
                            break;
                        default:
                            router.push("/");
                    }
                }, 800);
            } else {
                toast.error(data.message || "Λάθος στοιχεία σύνδεσης", {
                    style: { background: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }
                });
                setLoading(false);
            }
        } catch (err) {
            toast.error("Σφάλμα σύνδεσης με τον διακομιστή");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            <Toaster position="top-center" />

            {/* --- ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: Εικόνα / Branding --- */}
            <div className="hidden lg:flex lg:w-1/2 bg-olive-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                {/* Εδώ μπορείς να βάλεις μια αληθινή εικόνα στο src */}
                <img
                    src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=2070&auto=format&fit=crop"
                    alt="Restaurant Kitchen"
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                />
                <div className="relative z-20 text-center text-white px-12 animate-fade-in-up">
                    <div className="bg-orange-500/90 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm border border-orange-400">
                        <Utensils size={40} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight drop-shadow-lg">Mageireio <span className="text-orange-400">Platform</span></h1>
                    <p className="text-lg font-medium text-gray-200 max-w-md mx-auto drop-shadow-md">
                        Το απόλυτο λειτουργικό σύστημα για το εστιατόριο και το delivery σας.
                    </p>
                </div>
            </div>

            {/* --- ΔΕΞΙΑ ΠΛΕΥΡΑ: Φόρμα Login --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <div className="w-full max-w-md">

                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Καλώς Ήρθατε</h2>
                        <p className="text-gray-500 font-medium">Συνδεθείτε στον λογαριασμό σας για να συνεχίσετε.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700 ml-1">Όνομα Χρήστη</label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    placeholder="admin_username"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-gray-900"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700 ml-1">Κωδικός Πρόσβασης</label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-gray-900"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full bg-gray-900 hover:bg-black text-black-500 font-black text-lg py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden relative"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    ΕΙΣΟΔΟΣ
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center flex items-center justify-center gap-2 text-sm font-bold text-gray-400">
                        <Lock size={14} /> Ασφαλής σύνδεση μέσω κρυπτογράφησης
                    </div>
                </div>
            </div>
        </div>
    );
}
