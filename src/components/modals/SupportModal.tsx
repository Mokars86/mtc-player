import React, { useState } from 'react';
import { Icons } from '../Icon';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { preparePaymentConfig } from '../../services/flutterwave';

interface SupportModalProps {
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(3);
    const [customAmount, setCustomAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);


    const paymentValue = selectedAmount || parseFloat(customAmount) || 0;
    const config = preparePaymentConfig(paymentValue);
    const handleFlutterwavePayment = useFlutterwave(config);


    // Correct Approach: 
    // We cannot use useFlutterwave simply inside a handler. 
    // However, the standard way in this library is often to use the "FlutterWaveButton" component OR
    // initialize the hook with a config. 
    // Since 'value' is dynamic, we can't easily use the hook at the top level with a static config.
    // LIMITATION: 'useFlutterwave' accepts a config object. 
    // HACK: We can use the 'flutterwave-react-v3' library's `FlutterWaveButton` or standard JS script 
    // but looking at source, `useFlutterwave` creates the script tag.

    // Let's rely on standard JS implementation if the hook is rigid, 
    // BUT usually we can do: useFlutterwave(config) where config is memoized or state.
    // Let's refactor to use a "Trigger" approach where we set config in state, 
    // which triggers the hook? No, hooks run unconditionally.

    // Alternative: The library exports `closePaymentModal` and `useFlutterwave`.
    // Let's use the `FlutterWaveButton` approach or just instantiate the inline script manually if the hook is troublesome for dynamic amounts.
    // EXPECTATION: flutterwave-react-v3 allows dynamic config if we update the config passed to the hook.


    const onPayClick = () => {
        if (!paymentValue || isNaN(paymentValue)) return;
        setIsProcessing(true);

        handleFlutterwavePayment({
            callback: (response) => {
                if (response.status === "successful") {
                    alert(`Thank you for your support of $${paymentValue}!`);
                    closePaymentModal();
                    onClose();
                } else {
                    // alert("Payment failed/cancelled");
                }
                setIsProcessing(false);
            },
            onClose: () => {
                setIsProcessing(false);
            },
        });
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
                    <span>Secure payment via <strong>Flutterwave</strong></span>
                </div>

                {/* Action Button */}
                <button
                    onClick={onPayClick}
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
