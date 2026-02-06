import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize fonts - Robust check for different build environments
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
} else if (pdfFonts) {
    // Sometimes the default export IS the vfs object (rare but possible in some bundlers)
    pdfMake.vfs = pdfFonts;
} else {
    console.error("PDFFonts import failed or structure unknown", pdfFonts);
}

export const generatePDF = (state) => {
    try {
        const { vendor, client, meta, transactions } = state;

        // Validation
        if (!transactions || transactions.length === 0) {
            alert("No data to print!");
            return;
        }

        // Helpers
        const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(Number(val));
        const formatDate = (dateStr) => {
            if (!dateStr) return "";
            const parts = dateStr.split('-');
            if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            return dateStr;
        };

        // --- Data Prep ---
        const totalSales = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
        const grossTotal = Number(meta.openingBalance) + totalSales;
        const netTotal = Math.round(grossTotal);
        const roundOff = netTotal - grossTotal;

        // Group Items for Abstract
        const itemMap = {};
        transactions.forEach(t => {
            const name = t.itemName || 'Item';
            if (!itemMap[name]) itemMap[name] = 0;
            itemMap[name] += Number(t.quantity);
        });

        // --- Document Definition ---
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 60], // [left, top, right, bottom]

            // Header / Footer logic if needed, but we'll stick to body for simplicity first.
            // PDFMake allows dynamic headers/footers.

            content: [
                // 1. Header Section
                {
                    columns: [
                        { text: `Proprietor : ${vendor.proprietor}`, bold: true, fontSize: 10 },
                        { text: `CC Code: ${vendor.ccCode}`, alignment: 'right', bold: true, fontSize: 10 }
                    ],
                    margin: [0, 0, 0, 5]
                },
                { text: vendor.companyName.toUpperCase(), style: 'header', alignment: 'center', color: 'black' },
                { text: vendor.subtitle, style: 'subheader', alignment: 'center', color: 'blue' },
                { text: [vendor.addressLine1, '\n', vendor.addressLine2], fontSize: 10, alignment: 'center', margin: [0, 5, 0, 10] },

                { text: 'INVOICE CUM STATEMENT', style: 'title', alignment: 'center', decoration: 'underline' },

                // 2. Meta Data
                {
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: 'Party : ', bold: true },
                                client.partyName, '\n',
                                { text: client.addressLine1 || '', fontSize: 9 }
                            ]
                        },
                        {
                            width: 'auto',
                            stack: [
                                { text: `Report Date : ${formatDate(meta.reportDate)}`, alignment: 'right', bold: true },
                                { text: `Period : ${formatDate(meta.fromDate)} To ${formatDate(meta.toDate)}`, alignment: 'right', bold: true, margin: [0, 5, 0, 0] }
                            ]
                        }
                    ],
                    margin: [0, 10, 0, 10]
                },

                // 3. Table
                {
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        widths: [35, 55, 60, 35, '*', 35, 50], // Fixed widths for better alignment
                        body: [
                            // Header
                            [
                                { text: 'B.No', style: 'tableHeader' },
                                { text: 'Date', style: 'tableHeader', alignment: 'center' },
                                { text: 'Veh.No', style: 'tableHeader' },
                                { text: 'Indent', style: 'tableHeader', alignment: 'center' },
                                { text: 'Item', style: 'tableHeader' },
                                { text: 'Qty', style: 'tableHeader', alignment: 'right' },
                                { text: 'Amount', style: 'tableHeader', alignment: 'right' }
                            ],
                            // Opening Balance
                            [
                                { text: '', border: [false, false, false, false] },
                                { text: '', border: [false, false, false, false] },
                                { text: '', border: [false, false, false, false] },
                                { text: '', border: [false, false, false, false] },
                                { text: 'Opening', colSpan: 1, bold: true, alignment: 'right', border: [false, false, false, false] },
                                { text: '', border: [false, false, false, false] },
                                { text: formatCurrency(meta.openingBalance), bold: true, alignment: 'right', border: [false, false, false, false] }
                            ],
                            // Transactions
                            ...transactions.map(t => [
                                { text: t.billNo || '', fontSize: 9 },
                                { text: formatDate(t.date), alignment: 'center', fontSize: 9 },
                                { text: t.vehicleNo || '', fontSize: 9 },
                                { text: t.indent || '', alignment: 'center', fontSize: 9 },
                                { text: t.itemName || '', fontSize: 9 },
                                { text: Number(t.quantity).toString(), alignment: 'right', fontSize: 9 },
                                { text: formatCurrency(t.amount), alignment: 'right', fontSize: 9 }
                            ])
                        ]
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            return (rowIndex === 0) ? '#eeeeee' : null;
                        }
                    }
                },

                // 4. Footer Section (Abstract & Totals)
                {
                    margin: [0, 20, 0, 0],
                    columns: [
                        // Left: Abstract
                        {
                            width: '50%',
                            stack: [
                                { text: 'Abstract:', bold: true, margin: [0, 0, 0, 5] },
                                ...Object.entries(itemMap).map(([name, qty]) => ({
                                    columns: [
                                        { text: `• ${name}`, width: 100, fontSize: 9 },
                                        { text: qty.toFixed(3), width: 50, fontSize: 9, bold: true }
                                    ],
                                    margin: [0, 2, 0, 0]
                                }))
                            ]
                        },
                        // Right: Totals
                        {
                            width: '50%',
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 250, y2: 0, lineWidth: 1 }] },

                                { columns: [{ text: 'Sales Total', width: '*' }, { text: formatCurrency(totalSales), alignment: 'right', width: 100 }], margin: [0, 5, 0, 0] },
                                { columns: [{ text: 'Gross Total', width: '*', bold: true }, { text: formatCurrency(grossTotal), alignment: 'right', width: 100, bold: true }], margin: [0, 5, 0, 0] },
                                { columns: [{ text: 'Round Off', width: '*', fontSize: 9, color: 'gray' }, { text: roundOff.toFixed(2), alignment: 'right', width: 100, fontSize: 9, color: 'gray' }], margin: [0, 5, 0, 5] },

                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 250, y2: 0, lineWidth: 1 }] },

                                { columns: [{ text: 'Net Total', width: '*', bold: true, fontSize: 12 }, { text: formatCurrency(netTotal), alignment: 'right', width: 100, bold: true, fontSize: 12 }], margin: [0, 5, 0, 0] }
                            ]
                        }
                    ]
                },

                // 5. Bank Details
                {
                    margin: [0, 30, 0, 0],
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: 'BANK DETAILS\n', bold: true, fontSize: 9, decoration: 'underline' },
                                { text: `A/C NO: ${vendor.accountNo}\n`, fontSize: 9, bold: true },
                                { text: `A/C NAME: ${vendor.accountName}\n`, fontSize: 9, bold: true },
                                { text: `IFSC: ${vendor.ifscCode}\n`, fontSize: 9, bold: true },
                                { text: `BANK: ${vendor.bankName}`, fontSize: 9, bold: true }
                            ],
                            color: '#444'
                        },
                        {
                            width: '*',
                            text: [
                                '\n\n',
                                { text: `For ${vendor.companyName}`, alignment: 'right', bold: true }
                            ]
                        }
                    ]
                }
            ],

            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 2] },
                subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 2] },
                title: { fontSize: 14, bold: true, margin: [0, 10, 0, 10] },
                tableHeader: { bold: true, fontSize: 10, color: 'black' },
                tableExample: { margin: [0, 5, 0, 15] }
            },

            defaultStyle: {
                font: 'Roboto' // PDFMake default
            },

            // Footer (Page Numbers)
            footer: function (currentPage, pageCount) {
                return {
                    text: `Page ${currentPage} of ${pageCount}`,
                    alignment: 'right',
                    fontSize: 8,
                    margin: [0, 0, 40, 0] // right margin
                };
            }
        };

        const safePartyName = (client.partyName || 'Client').replace(/[^a-z0-9]/gi, '_').toUpperCase();
        const safeDate = (meta.reportDate || new Date().toISOString().slice(0, 10)).replace(/[^a-z0-9-]/gi, '_');

        pdfMake.createPdf(docDefinition).download(`Statement_${safePartyName}_${safeDate}.pdf`);

    } catch (err) {
        console.error(err);
        alert("PDF Generation Error: " + err.message);
    }
};
