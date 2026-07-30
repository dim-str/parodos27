'use client';
import { useState } from 'react';

export default function FinanceTab({ orders }) {
    const [financeFilter, setFinanceFilter] = useState('all');

    const getOrderTotal = (order) => {
        if (!order.items || order.items.length === 0) return 0;
        return order.items.reduce((sum, item) => {
            const price = item.price || item.dailyMenu?.dish?.price || item.dish?.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const filteredCompletedOrders = completedOrders.filter(order => {
        if (financeFilter === 'all') return true;
        const orderDateStr = order.createdAt; 
        const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();
        const nowTime = new Date();
        const diffDays = (nowTime - orderDate) / (1000 * 60 * 60 * 24);

        if (financeFilter === 'today') return orderDate.toDateString() === nowTime.toDateString();
        if (financeFilter === 'week') return diffDays <= 7;
        if (financeFilter === 'month') return diffDays <= 30;
        
        if (financeFilter === 'custom') {
            if (!customStartDate && !customEndDate) return true; 
            const start = customStartDate ? new Date(customStartDate) : new Date('2000-01-01');
            start.setHours(0, 0, 0, 0); 
            const end = customEndDate ? new Date(customEndDate) : new Date('2100-01-01');
            end.setHours(23, 59, 59, 999); 
            return orderDate >= start && orderDate <= end;
        }

        return true;
    });

    const calcTotalRevenue = filteredCompletedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const calcTotalOrders = filteredCompletedOrders.length;
    const averageOrderValue = calcTotalOrders > 0 ? (calcTotalRevenue / calcTotalOrders) : 0;
    const lostRevenue = cancelledOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    
    const totalWoltCost = filteredCompletedOrders.reduce((sum, order) => sum + (order.woltDeliveryCost || 0), 0);
    const netRevenue = calcTotalRevenue - totalWoltCost;

    const deliveryOrdersCount = filteredCompletedOrders.filter(o => o.orderType === 'delivery').length;
    const takeawayOrdersCount = filteredCompletedOrders.filter(o => o.orderType === 'takeaway').length;
    const deliveryRevenue = filteredCompletedOrders.filter(o => o.orderType === 'delivery').reduce((sum, order) => sum + getOrderTotal(order), 0);
    const takeawayRevenue = filteredCompletedOrders.filter(o => o.orderType === 'takeaway').reduce((sum, order) => sum + getOrderTotal(order), 0);
    const deliveryPercentage = calcTotalRevenue > 0 ? (deliveryRevenue / calcTotalRevenue) * 100 : 0;

    const itemCounts = {};
    filteredCompletedOrders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const name = item.dailyMenu?.dish?.name || item.dish?.name || 'Άγνωστο';
                itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
            });
        }
    });
    const bestSellers = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-olive-100">
                <div>
                    <h2 className="text-3xl font-black text-olive-900 uppercase">Οικονομική Επισκόπηση</h2>
                    <p className="text-olive-500 font-bold text-sm">Παρακολουθήστε την απόδοση και τα έσοδα του καταστήματός σας.</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-1 bg-olive-50 p-1.5 rounded-2xl border border-olive-100 flex-wrap justify-end">
                        {[{ id: 'today', l: 'Σήμερα' }, { id: 'week', l: '7 Ημέρες' }, { id: 'month', l: '30 Ημέρες' }, { id: 'custom', l: 'Επιλογή' }, { id: 'all', l: 'Συνολικά' }].map(f => (
                            <button 
                                key={f.id} 
                                onClick={() => setFinanceFilter(f.id)} 
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${financeFilter === f.id ? 'bg-olive-900 text-white shadow-lg scale-105' : 'text-olive-500 hover:bg-olive-200/30'}`}
                            >
                                {f.l}
                            </button>
                        ))}
                    </div>
                    
                    {financeFilter === 'custom' && (
                        <div className="flex flex-wrap items-center gap-3 animate-fade-in bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-olive-600 uppercase">Από:</span>
                                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-xs bg-white focus:border-olive-400" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-olive-600 uppercase">Έως:</span>
                                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-xs bg-white focus:border-olive-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-white to-green-50/50 p-8 rounded-[2rem] shadow-sm border border-green-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl uppercase tracking-widest">Καθαρο Κερδος</div>
                    <p className="text-green-600 font-black uppercase text-[10px] mb-2">Συνολικά Έσοδα</p>
                    <h3 className="text-4xl font-black text-green-700">{netRevenue.toFixed(2)}€</h3>
                    {totalWoltCost > 0 && <p className="text-[10px] font-bold text-green-600/70 mt-2">Μικτά: {calcTotalRevenue.toFixed(2)}€</p>}
                </div>
                
                <div className="bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-[2rem] shadow-sm border border-blue-100">
                    <p className="text-blue-500 font-black uppercase text-[10px] mb-2">Έξοδα Wolt Drive</p>
                    <h3 className="text-4xl font-black text-blue-700">{totalWoltCost.toFixed(2)}€</h3>
                </div>

                <div className="bg-gradient-to-br from-white to-orange-50/50 p-8 rounded-[2rem] shadow-sm border border-orange-100">
                    <p className="text-orange-500 font-black uppercase text-[10px] mb-2">Μέση Παραγγελία</p>
                    <h3 className="text-4xl font-black text-orange-700">{averageOrderValue.toFixed(2)}€</h3>
                    <p className="text-[10px] font-bold text-orange-600/70 mt-2">Από {calcTotalOrders} παραγγελίες</p>
                </div>
                
                <div className="bg-gradient-to-br from-white to-red-50/50 p-8 rounded-[2rem] shadow-sm border border-red-100">
                    <p className="text-red-500 font-black uppercase text-[10px] mb-2">Απώλειες (Ακυρώσεις)</p>
                    <h3 className="text-4xl font-black text-red-600">{lostRevenue.toFixed(2)}€</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-olive-100">
                    <h3 className="text-xl font-black text-olive-900 uppercase mb-4">Κανάλια Πωλήσεων</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between font-bold text-sm mb-1"><span>Delivery ({deliveryOrdersCount})</span><span>{deliveryRevenue.toFixed(2)}€</span></div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${deliveryPercentage}%` }}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between font-bold text-sm mb-1"><span>Παραλαβή ({takeawayOrdersCount})</span><span>{takeawayRevenue.toFixed(2)}€</span></div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="bg-orange-500 h-full" style={{ width: `${100 - deliveryPercentage}%` }}></div></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-olive-100">
                    <h3 className="text-xl font-black text-olive-900 uppercase mb-4">Κορυφαία Πιάτα</h3>
                    <div className="space-y-3">
                        {bestSellers.length > 0 ? bestSellers.map(([name, count], i) => (
                            <div key={name} className="flex justify-between p-3 bg-gray-50 rounded-xl font-bold">
                                <span>{i+1}. {name}</span><span className="text-olive-600">{count} μερ.</span>
                            </div>
                        )) : <div className="text-sm font-bold text-gray-400 p-4 text-center">Δεν υπάρχουν δεδομένα πιάτων</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}