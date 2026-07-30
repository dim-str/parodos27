'use client';
import { Bell, BookOpen, Clock, BarChart3, Settings, Megaphone } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingCount, acceptedCount, wsConnected, handleLogout }) {
    return (
        <aside className="w-full md:w-64 bg-olive-900 text-olive-100 flex flex-col shadow-2xl z-10 sticky top-0 md:h-screen shrink-0">
            <div className="p-6 bg-olive-950 text-center font-black text-2xl uppercase text-white shadow-md relative">
                Admin<span className="text-olive-400">Panel</span>
                <div className="absolute top-2 right-3 flex items-center gap-1.5" title={wsConnected ? 'Συνδεδεμένο' : 'Εκτός Σύνδεσης'}>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${wsConnected ? 'text-green-500' : 'text-red-500'}`}>
                        {wsConnected ? 'Online' : 'Offline'}
                    </span>
                    <div className={`w-3 h-3 rounded-full shadow-lg ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-x-auto flex md:flex-col">
                <button onClick={() => setActiveTab('orders')} className={`flex items-center justify-between w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <div className="flex items-center gap-3">
                        <Bell size={20} className={pendingCount > 0 ? "animate-pulse text-red-400" : ""} /> Live
                    </div>
                    {(pendingCount > 0 || acceptedCount > 0) && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{pendingCount + acceptedCount}</span>
                    )}
                </button>
                <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <BookOpen size={20} /> Κατάλογος
                </button>
                {/* ΝΕΟ ΚΟΥΜΠΙ: ΚΑΜΠΑΝΙΕΣ */}
                <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'campaigns' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <Megaphone size={20} /> Καμπάνιες
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <Clock size={20} /> Ιστορικό
                </button>
                <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'finance' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <BarChart3 size={20} /> Οικονομικά
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-olive-600 text-white' : 'hover:bg-olive-800'}`}>
                    <Settings size={20} /> Ρυθμίσεις
                </button>
                <div className="mt-auto pt-4 border-t border-olive-800 w-full hidden md:block">
                    <button onClick={handleLogout} className="w-full p-4 rounded-xl font-bold text-red-400 hover:bg-olive-800 transition-all text-left">
                        Αποσύνδεση
                    </button>
                </div>
            </nav>
        </aside>
    );
}