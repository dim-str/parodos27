import { CheckCircle2, Clock, Bike, ChefHat, XCircle, Store } from 'lucide-react';

export default function StatusHero({ status, orderType, estimatedReadyTime }) {
    
    const getIcon = () => {
        if (status === 'ON_THE_WAY') {
            return orderType === 'delivery' ? <Bike size={40} /> : <Store size={40} />;
        }
        if (status === 'PENDING') return <Clock size={40} />;
        if (status === 'ACCEPTED' || status === 'PREPARING') return <ChefHat size={40} />;
        if (status === 'COMPLETED') return <CheckCircle2 size={40} />;
        if (status === 'CANCELLED') return <XCircle size={40} />;
        return <Clock size={40} />;
    };

    const statusMap = {
        'PENDING': { step: 1, text: 'Αναμονή', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' },
        'ACCEPTED': { step: 2, text: 'Ετοιμάζεται', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
        'PREPARING': { step: 2, text: 'Ετοιμάζεται', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
        'ON_THE_WAY': { step: 3, text: orderType === 'delivery' ? 'Στον Δρόμο' : 'Έτοιμο για Παραλαβή', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        'COMPLETED': { step: 4, text: orderType === 'delivery' ? 'Παραδόθηκε' : 'Παραλήφθηκε', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
        'CANCELLED': { step: -1, text: 'Ακυρώθηκε', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
    };

    const currentStatus = statusMap[status] || statusMap['PENDING'];

    return (
        <div className="flex flex-col items-center">
            <div className="flex justify-center mb-6 mt-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}>
                    {getIcon()}
                </div>
            </div>

            <h3 className={`text-2xl font-black mb-4 uppercase tracking-tight ${currentStatus.color}`}>
                {currentStatus.text}
            </h3>

            {(status === 'ACCEPTED' || status === 'PREPARING') && estimatedReadyTime && (
                <div className="inline-flex items-center gap-2 text-sm font-bold text-orange-800 bg-orange-50 border border-orange-100 px-5 py-2.5 rounded-xl mb-4">
                    <Clock size={16} />
                    Έτοιμο στις {new Date(estimatedReadyTime).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            )}
        </div>
    );
}