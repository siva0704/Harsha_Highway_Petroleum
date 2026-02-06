import * as XLSX from 'xlsx';

export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (rawData.length < 2) {
                    resolve([]);
                    return;
                }

                // --- Intelligent Header Detection ---
                let headerRowIndex = 0;
                let maxMatches = 0;

                // Keywords to score rows
                const keywords = ['date', 'bill', 'veh', 'truck', 'indent', 'item', 'product', 'qty', 'quantity', 'rate', 'amount', 'total'];

                // Scan first 10 rows to find the most likely header
                for (let i = 0; i < Math.min(10, rawData.length); i++) {
                    const row = rawData[i];
                    let matches = 0;
                    row.forEach(cell => {
                        if (cell && typeof cell === 'string') {
                            const val = cell.toLowerCase();
                            if (keywords.some(k => val.includes(k))) {
                                matches++;
                            }
                        }
                    });
                    if (matches > maxMatches) {
                        maxMatches = matches;
                        headerRowIndex = i;
                    }
                }

                if (maxMatches === 0) {
                    console.warn("No obvious header found, assuming row 0");
                    headerRowIndex = 0;
                }

                const headers = rawData[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
                const rows = rawData.slice(headerRowIndex + 1);

                // Map columns
                const mapColumn = (possibleNames) => {
                    return headers.findIndex(h => possibleNames.some(name => h.includes(name)));
                };

                const dateIdx = mapColumn(['date', 'dt']);
                const billIdx = mapColumn(['bill', 'inv', 'ref']);
                const vehicleIdx = mapColumn(['veh', 'truck', 'lorry', 'reg']);
                const indentIdx = mapColumn(['indent', 'slip']);
                const itemIdx = mapColumn(['item', 'product', 'part', 'desc']);
                const qtyIdx = mapColumn(['qty', 'quan', 'ltr', 'vol']);
                const rateIdx = mapColumn(['rate', 'price', 'unit']);
                const amountIdx = mapColumn(['amt', 'amount', 'tot', 'val']);

                const cleanRows = rows.map(row => {
                    // Helper to get safe value
                    const getVal = (idx) => (idx !== -1 && row[idx] !== undefined) ? row[idx] : '';

                    // Skip empty rows
                    if (!row || row.length === 0 || row.every(c => !c)) return null;

                    return {
                        id: crypto.randomUUID(),
                        date: parseExcelDate(getVal(dateIdx)),
                        billNo: getVal(billIdx),
                        vehicleNo: String(getVal(vehicleIdx)).toUpperCase(),
                        indent: getVal(indentIdx),
                        itemName: String(getVal(itemIdx) || 'DIESEL [HSD]'),
                        quantity: Number(getVal(qtyIdx)) || 0,
                        rate: Number(getVal(rateIdx)) || 0,
                        amount: Number(getVal(amountIdx)) || 0
                    };
                }).filter(r => r !== null);

                resolve(cleanRows);

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

// Excel Date to JS Date String YYYY-MM-DD
const parseExcelDate = (val) => {
    if (!val) return new Date().toISOString().slice(0, 10);

    // If it's a number (Excel serial date)
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return date.toISOString().slice(0, 10);
    }

    // If string, try to parse or return as is (if YYYY-MM-DD)
    // Simple verification check?
    return String(val);
};
