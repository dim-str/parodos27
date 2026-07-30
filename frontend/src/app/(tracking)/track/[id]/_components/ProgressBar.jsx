import { Check } from 'lucide-react';

export default function ProgressBar({ currentStep, orderType }) {
    return (
        <div className="mt-8 px-4">
            <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-olive-900 -z-10 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep - 1) * 33.33}%` }}
                ></div>

                {[1, 2, 3, 4].map(step => {
                    const isActive = currentStep >= step;
                    return (
                        <div key={step} className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs font-bold transition-colors duration-300 ${isActive ? 'bg-olive-900 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {isActive ? <Check size={14} strokeWidth={3} /> : step}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-3 px-1 text-[10px] font-semibold text-gray-400 uppercase">
                <span>Αποδοχη</span>
                <span>Κουζινα</span>
                <span>{orderType === 'takeaway' ? 'Ετοιμο' : 'Διανομη'}</span>
                <span>Τελος</span>
            </div>
        </div>
    );
}