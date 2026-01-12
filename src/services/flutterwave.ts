
// Mock or inline Flutterwave implementation
// Since we are using flutterwave-react-v3, we often use the hook in the component.
// However, to keep it clean, we can define configuration helpers here.

export const flutterwaveConfig = {
    public_key: 'FLWPUBK_TEST-SANDBOX-DEMO-KEY-X', // Placeholder: User needs to replace this
    tx_ref: Date.now().toString(),
    amount: 0, // dynamic
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
        email: 'user@example.com',
        phone_number: '07070707070',
        name: 'MTC User',
    },
    customizations: {
        title: 'Support MTC Player',
        description: 'Coffee for the developer',
        logo: 'https://ui-avatars.com/api/?name=M&background=0d9488&color=fff&rounded=true',
    },
};

export const preparePaymentConfig = (amount: number, userEmail?: string, userName?: string) => {
    return {
        ...flutterwaveConfig,
        tx_ref: `tx-${Date.now()}`,
        amount,
        customer: {
            email: userEmail || 'guest@mtcplayer.com',
            phone_number: '',
            name: userName || 'Supporter',
        }
    };
};
