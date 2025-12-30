import React, { useState } from 'react';
import { Icons } from '../Icon';
import { stripeService } from '../../services/stripe';

interface SupportModalProps {
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(3);
    const [customAmount, setCustomAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        const value = selectedAmount || parseFloat(customAmount);
        if (!value || isNaN(value)) return;

        setIsProcessing(true);

        try {
            const response = await stripeService.createCheckoutSession(value);

            if (response.success) {
                // In a real app, we would redirect: window.location.href = response.url;
                alert(`SUCCESS! \n\nBackend processed Stripe payment for $${value}\nMessage: ${response.message}\n(Mock Redirect to: ${response.url})`);
                onClose();
            } else {
                alert("Payment Failed: " + response.message);
            }
        } catch (e) {
            alert("An unexpected error occurred processing payment.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-app-card border border-app-border w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 flex flex-col gap-6" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-orange-500/20 rounded-full text-orange-500">
                                <Icons.Coffee className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-app-text">Buy me a Coffee</h2>
                        </div>
                        <p className="text-sm text-app-subtext">Support the development of MTc Player.</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-app-bg rounded-lg text-app-subtext transition-colors"><Icons.X className="w-5 h-5" /></button>
                </div>

                {/* Amount Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 3, 5].map(amount => (
                        <button
                            key={amount}
                            onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                            className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${selectedAmount === amount ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-app-surface border-app-border text-app-text hover:border-orange-500/50'}`}
                        >
                            <span className="text-2xl font-bold">${amount}</span>
                            <span className="text-xs opacity-80">{amount === 1 ? 'Espresso' : amount === 3 ? 'Cappuccino' : 'Latte'}</span>
                        </button>
                    ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtext font-bold">$</span>
                    <input
                        type="number"
                        placeholder="Custom Amount"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className={`w-full bg-app-surface border ${customAmount ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-app-border'} rounded-lg py-3 pl-8 pr-4 text-app-text outline-none focus:border-orange-500 transition-colors`}
                    />
                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-app-subtext">
                    <Icons.Lock className="w-3 h-3" />
                    <span>Secure payment via <strong>Stripe</strong></span>
                </div>

                {/* Action Button */}
                <button
                    onClick={handlePayment}
                    disabled={isProcessing || (!selectedAmount && !customAmount)}
                    className="w-full py-3 rounded-xl bg-app-text text-app-bg font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Icons.Loader className="w-5 h-5 animate-spin" /> Processing...
                        </>
                    ) : (
                        `Support with $${selectedAmount || customAmount || '0'}`
                    )}
                </button>

            </div>
        </div>
    );
};
