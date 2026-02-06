import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useFuelStore = create(
    persist(
        (set, get) => ({
            vendor: {
                companyName: 'HARSHA HIGHWAY PETROLEUM',
                subtitle: 'Bharat Petroleum Corporation Ltd Dealer',
                addressLine1: 'Solapur-Bijapur National Highway(NH-52), Agasanal',
                addressLine2: 'Tq: INDI Dist : Vijayapur',
                proprietor: 'Harsha Mathapati',
                ccCode: '222406',
                bankName: 'HDFC BANK, PERUMANALLUR',
                accountNo: '50200102961948',
                ifscCode: 'HDFC0007082',
                accountName: 'SVS FUELS',
            },
            client: {
                partyName: 'THIRUCHENDUR MURUGAN TRANSPORT',
                addressLine1: '',
                addressLine2: '',
            },
            meta: {
                reportDate: new Date().toISOString().slice(0, 10),
                fromDate: new Date().toISOString().slice(0, 10),
                toDate: new Date().toISOString().slice(0, 10),
                openingBalance: 0,
            },
            transactions: [],

            // Actions
            setVendor: (field, value) =>
                set((state) => ({ vendor: { ...state.vendor, [field]: value } })),

            setClient: (field, value) =>
                set((state) => ({ client: { ...state.client, [field]: value } })),

            setMeta: (field, value) =>
                set((state) => ({ meta: { ...state.meta, [field]: value } })),

            addTransaction: () => {
                const { transactions } = get();
                const lastTxn = transactions.length > 0 ? transactions[transactions.length - 1] : null;
                const lastDate = lastTxn ? lastTxn.date : new Date().toISOString().slice(0, 10);

                // Smart Bill Increment Logic
                let nextBillNo = '';
                if (lastTxn && lastTxn.billNo) {
                    const match = lastTxn.billNo.match(/^([a-zA-Z]*)(\d+)$/);
                    if (match) {
                        const prefix = match[1];
                        const numberPart = match[2];
                        const nextNum = String(Number(numberPart) + 1).padStart(numberPart.length, '0');
                        nextBillNo = `${prefix}${nextNum}`;
                    } else {
                        // Try to parse simple number
                        const simpleNum = Number(lastTxn.billNo);
                        if (!isNaN(simpleNum)) {
                            nextBillNo = String(simpleNum + 1);
                        }
                    }
                }

                const newTxn = {
                    id: crypto.randomUUID(),
                    billNo: nextBillNo,
                    date: lastDate, // Smart Default: Use last row's date
                    vehicleNo: '',
                    indent: '',
                    itemName: 'DIESEL [HSD]', // Default
                    quantity: 0,
                    rate: 0,
                    amount: 0,
                };
                set((state) => ({ transactions: [...state.transactions, newTxn] }));
            },

            updateTransaction: (id, field, value) =>
                set((state) => {
                    const updated = state.transactions.map((txn) => {
                        if (txn.id === id) {
                            const newTxn = { ...txn, [field]: value };
                            // Auto-calculate logic
                            if (field === 'quantity' || field === 'rate') {
                                newTxn.amount = Number(newTxn.quantity) * Number(newTxn.rate);
                            }
                            return newTxn;
                        }
                        return txn;
                    });
                    return { transactions: updated };
                }),

            deleteTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),

            resetAll: () => {
                set({
                    transactions: [],
                    meta: { ...get().meta, openingBalance: 0 }
                })
            },

            importTransactions: (newTxns) => {
                set((state) => ({
                    transactions: [...state.transactions, ...newTxns]
                }));
            },

            // Bulk Actions
            applyBulkRate: (rate) =>
                set((state) => ({
                    transactions: state.transactions.map(t => ({
                        ...t,
                        rate: rate,
                        amount: Number(t.quantity) * Number(rate)
                    }))
                })),

            applySmartBillFill: (startBillNo) =>
                set((state) => {
                    let currentBillNo = startBillNo;
                    // Logic to extract prefix/suffix
                    const match = startBillNo.match(/^([a-zA-Z]*)(\d+)$/);
                    let prefix = '';
                    let numberPart = '';

                    if (match) {
                        prefix = match[1];
                        numberPart = match[2];
                    } else {
                        // Numeric fallback
                        const n = Number(startBillNo);
                        if (!isNaN(n)) {
                            numberPart = String(n);
                        }
                    }

                    const updated = state.transactions.map((t, idx) => {
                        if (idx === 0) return { ...t, billNo: startBillNo };

                        let nextNo = startBillNo; // Default fallback
                        if (numberPart) {
                            const nextNum = String(Number(numberPart) + idx).padStart(numberPart.length, '0');
                            nextNo = `${prefix}${nextNum}`;
                        } else {
                            nextNo = startBillNo;
                        }

                        return { ...t, billNo: nextNo };
                    });
                    return { transactions: updated };
                }),
        }),
        {
            name: 'fuel-flow-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        }
    )
);

export default useFuelStore;
