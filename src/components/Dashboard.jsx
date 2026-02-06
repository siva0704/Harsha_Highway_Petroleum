import React, { useEffect } from 'react';
import useFuelStore from '../store/useFuelStore';
import { Plus, Trash2, Save, RotateCcw, Download, Info, CheckCircle2, ArrowDownCircle } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { parseExcelFile } from '../utils/excelParser';
import { toast } from 'sonner';
import clsx from 'clsx';

function Dashboard() {
    const state = useFuelStore();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isImportModalOpen, setImportModalOpen] = React.useState(false);
    const [importText, setImportText] = React.useState('');
    const itemsPerPage = 10;

    // Strict Date Handler
    const handleDateChange = (field, value, isMeta = false, txnId = null) => {
        const year = value.split('-')[0];
        if (year.length > 4) return; // Prevent 5 digit years

        if (isMeta) {
            state.setMeta(field, value);
        } else if (txnId) {
            state.updateTransaction(txnId, field, value);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await parseExcelFile(file);
            if (data.length > 0) {
                toast.success(`Extracted ${data.length} rows from Excel!`);
                state.importTransactions(data);
                setImportModalOpen(false);
            } else {
                toast.error("No valid data found in file.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse Excel: " + err.message);
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(state.transactions.length / itemsPerPage);
    const currentTransactions = state.transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden text-sm">
            {/* LEFT PANEL: Input Command Center */}
            <div className="w-1/2 h-full flex flex-col border-r border-gray-300 bg-white shadow-xl z-10">
                {/* Header / Meta Config */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-primary">Casi</span>Fuel
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setImportModalOpen(true)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded font-bold text-xs border border-blue-200" title="Import Data">
                                IMPORT
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to RESET all data?")) {
                                        state.resetAll();
                                        toast.success("All data has been reset.");
                                    }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded" title="Reset">
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Proprietor</label>
                            <input
                                className="w-full p-2 border rounded outline-none"
                                value={state.vendor.proprietor}
                                onChange={(e) => state.setVendor('proprietor', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Report Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded outline-none"
                                value={state.meta.reportDate}
                                onChange={(e) => handleDateChange('reportDate', e.target.value, true)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Party Name</label>
                            <input
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none uppercase font-semibold"
                                value={state.client.partyName}
                                onChange={(e) => state.setClient('partyName', e.target.value)}
                                placeholder="Client Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">From Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded outline-none"
                                value={state.meta.fromDate}
                                onChange={(e) => handleDateChange('fromDate', e.target.value, true)}
                            />
                        </div>
                    </div>

                    {/* Big Financial Anchor */}
                    <div className="mt-2 bg-blue-50 p-3 rounded border border-blue-100 flex items-center justify-between">
                        <label className="text-blue-800 font-bold">Opening Balance (₹)</label>
                        <CurrencyInput
                            value={state.meta.openingBalance}
                            onChange={(val) => state.setMeta('openingBalance', val)}
                        />
                    </div>

                    {/* Bank Details Inputs (Footer Data) */}
                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Bank Details (Footer)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="w-full p-2 border rounded outline-none text-xs"
                                value={state.vendor.bankName}
                                onChange={(e) => state.setVendor('bankName', e.target.value)}
                                placeholder="Bank Name"
                            />
                            <input
                                className="w-full p-2 border rounded outline-none text-xs"
                                value={state.vendor.accountNo}
                                onChange={(e) => state.setVendor('accountNo', e.target.value)}
                                placeholder="Account No"
                            />
                            <input
                                className="w-full p-2 border rounded outline-none text-xs"
                                value={state.vendor.ifscCode}
                                onChange={(e) => state.setVendor('ifscCode', e.target.value)}
                                placeholder="IFSC Code"
                            />
                            <input
                                className="w-full p-2 border rounded outline-none text-xs"
                                value={state.vendor.accountName}
                                onChange={(e) => state.setVendor('accountName', e.target.value)}
                                placeholder="Account Name"
                            />
                        </div>
                    </div>
                </div>

                {/* Transaction Grid */}
                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10 text-xs text-gray-600 uppercase">
                            <tr>
                                <th className="p-2 border text-center w-10">S.No</th>
                                <th className="p-2 border text-left w-20">
                                    <div className="flex items-center gap-1">
                                        Bill No
                                        <button
                                            onClick={() => {
                                                if (state.transactions.length > 0) {
                                                    const first = state.transactions[0].billNo;
                                                    if (confirm(`Auto-fill Bill Numbers starting from "${first}"?`)) {
                                                        state.applySmartBillFill(first);
                                                        toast.success("Bill Numbers auto-filled!");
                                                    }
                                                }
                                            }}
                                            title="Smart Fill Down (Increment)"
                                            className="text-blue-400 hover:text-blue-600 transition-colors">
                                            <ArrowDownCircle size={14} />
                                        </button>
                                    </div>
                                </th>
                                <th className="p-2 border text-left w-24">Date</th>
                                <th className="p-2 border text-left w-24">Veh. No</th>
                                <th className="p-2 border text-left w-20">Indent</th>
                                <th className="p-2 border text-left">Item</th>
                                <th className="p-2 border text-right w-20">Qty</th>
                                <th className="p-2 border text-right w-20">
                                    <div className="flex items-center justify-end gap-1">
                                        Rate
                                        <button
                                            onClick={() => {
                                                if (state.transactions.length > 0) {
                                                    const first = state.transactions[0].rate;
                                                    if (confirm(`Copy Rate "${first}" to all rows?`)) {
                                                        state.applyBulkRate(first);
                                                        toast.success("Rate applied to all!");
                                                    }
                                                }
                                            }}
                                            title="Copy Rate to All"
                                            className="text-blue-400 hover:text-blue-600 transition-colors">
                                            <ArrowDownCircle size={14} />
                                        </button>
                                    </div>
                                </th>
                                <th className="p-2 border text-right w-24">Amount</th>
                                <th className="p-2 border w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.map((txn, idx) => {
                                const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                                return (
                                    <tr key={txn.id} className="group hover:bg-gray-50 text-xs">
                                        <td className="p-2 border text-center text-gray-400 font-mono">{globalIndex + 1}</td>
                                        <td className="p-1 border">
                                            <input
                                                className="w-full bg-transparent outline-none font-medium text-blue-900"
                                                value={txn.billNo}
                                                placeholder="B.No"
                                                onChange={(e) => state.updateTransaction(txn.id, 'billNo', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                type="date"
                                                className="w-full bg-transparent outline-none"
                                                value={txn.date}
                                                onChange={(e) => handleDateChange('date', e.target.value, false, txn.id)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                className="w-full bg-transparent outline-none uppercase font-medium"
                                                value={txn.vehicleNo}
                                                placeholder="TN..."
                                                onChange={(e) => state.updateTransaction(txn.id, 'vehicleNo', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                className="w-full bg-transparent outline-none"
                                                value={txn.indent || ''}
                                                onChange={(e) => state.updateTransaction(txn.id, 'indent', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                className="w-full bg-transparent outline-none"
                                                value={txn.itemName}
                                                onChange={(e) => state.updateTransaction(txn.id, 'itemName', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent outline-none text-right"
                                                value={txn.quantity}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => state.updateTransaction(txn.id, 'quantity', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-1 border">
                                            <input
                                                type="number"
                                                className="w-full bg-transparent outline-none text-right text-gray-600"
                                                value={txn.rate}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => state.updateTransaction(txn.id, 'rate', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2 border text-right font-mono font-medium">
                                            {txn.amount.toFixed(2)}
                                        </td>
                                        <td className="p-1 border text-center">
                                            <button
                                                onClick={() => {
                                                    state.deleteTransaction(txn.id);
                                                    toast("Transaction deleted", { duration: 2000 });
                                                }}
                                                // Improved Accessibility: Always visible on touch, darker on hover
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <button
                        onClick={() => {
                            state.addTransaction();
                        }}
                        className="mt-4 flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium">
                        <Plus size={18} className="mr-2" /> Add Transaction Route
                    </button>
                </div>

                {/* Pagination Controls */}
                {state.transactions.length > itemsPerPage && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50">
                            Previous
                        </button>
                        <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50">
                            Next
                        </button>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                    <div className="text-xs text-green-700 font-medium flex items-center gap-2 bg-green-50 px-2 py-1 rounded border border-green-200">
                        <CheckCircle2 size={14} />
                        Changes Saved
                    </div>
                    <button
                        onClick={() => {
                            try {
                                generatePDF(state);
                                toast.success("PDF Downloaded successfully!");
                            } catch (err) {
                                console.error(err);
                                toast.error("Failed to generate PDF: " + err.message);
                            }
                        }}
                        className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow-lg font-bold">
                        <Download size={18} /> GENERATE PDF
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: Live Preview */}
            <div className="w-1/2 h-full bg-gray-500 overflow-auto p-8 flex justify-center">
                <div className="bg-white shadow-2xl min-h-[842px] w-[595px] p-8 text-[10px] font-serif leading-relaxed relative">
                    {/* Preview Header */}
                    <div className="absolute top-2 right-2 text-red-500 font-bold text-[9px] border border-red-200 bg-red-50 px-2 py-1 rounded">
                        PREVIEW MODE (Continuous View)
                    </div>
                    <div className="mb-6 relative">
                        <div className="flex justify-between text-[8px] font-bold mb-2">
                            <span>Proprietor : {state.vendor.proprietor}</span>
                            <span>CC Code: {state.vendor.ccCode}</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold uppercase">{state.vendor.companyName}</h2>
                            <div className="text-blue-700 font-bold">{state.vendor.subtitle}</div>
                            <div className="text-gray-600">{state.vendor.addressLine1}</div>
                            <div className="text-gray-600">{state.vendor.addressLine2}</div>
                        </div>
                        <div className="mt-4 font-bold border-b-2 border-black pb-2 text-center text-lg underline underline-offset-4">
                            INVOICE CUM STATEMENT
                        </div>
                    </div>

                    {/* Preview Meta */}
                    <div className="flex justify-between mb-4 border-b pb-4 mt-4">
                        <div className="w-1/2">
                            <div className="font-bold">Party: {state.client.partyName}</div>
                            <div>{state.client.addressLine1}</div>
                        </div>
                        <div className="w-1/2 text-right">
                            <div>Report Date: {state.meta.reportDate}</div>
                            <div>Period: {state.meta.fromDate} To {state.meta.toDate}</div>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <table className="w-full mb-8 table-fixed border-collapse">
                        <thead>
                            <tr className="border-y-2 border-black text-[9px]">
                                <th className="text-left py-1 w-[10%]">B.No</th>
                                <th className="text-left py-1 w-[14%]">Date</th>
                                <th className="text-left py-1 w-[18%]">Veh.No</th>
                                <th className="text-left py-1 w-[12%]">Indent</th>
                                <th className="text-left py-1 w-[26%]">Item</th>
                                <th className="text-right py-1 w-[8%]">Qty</th>
                                <th className="text-right py-1 w-[12%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-[9px]">
                            {/* Opening Balance Row */}
                            <tr>
                                <td colSpan={6} className="py-1 text-right pr-4 font-bold tracking-wider uppercase opacity-70">Opening Balance</td>
                                <td className="text-right py-1 font-bold">{Number(state.meta.openingBalance).toFixed(2)}</td>
                            </tr>
                            {state.transactions.map(t => (
                                <tr key={t.id} className="border-b border-gray-100 last:border-0">
                                    <td className="py-1 truncate">{t.billNo}</td>
                                    <td className="py-1 truncate">{t.date}</td>
                                    <td className="py-1 truncate uppercase">{t.vehicleNo}</td>
                                    <td className="py-1 truncate">{t.indent}</td>
                                    <td className="py-1 truncate">{t.itemName}</td>
                                    <td className="text-right py-1">{t.quantity}</td>
                                    <td className="text-right py-1 font-medium">{Number(t.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Preview Footer */}
                    <div className="flex justify-end border-t-2 border-black pt-2">
                        <div className="w-64 space-y-2 font-mono text-xs">
                            <div className="flex justify-between">
                                <span>Sales Total:</span>
                                <span>{state.transactions.reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>Gross Total:</span>
                                <span>{(Number(state.meta.openingBalance) + state.transactions.reduce((acc, t) => acc + Number(t.amount), 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Round Off:</span>
                                <span>
                                    {(
                                        Math.round(Number(state.meta.openingBalance) + state.transactions.reduce((acc, t) => acc + Number(t.amount), 0)) -
                                        (Number(state.meta.openingBalance) + state.transactions.reduce((acc, t) => acc + Number(t.amount), 0))
                                    ).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                                <span>Net Total:</span>
                                <span>{Math.round(Number(state.meta.openingBalance) + state.transactions.reduce((acc, t) => acc + Number(t.amount), 0)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bank */}
                    <div className="absolute bottom-8 left-8 text-xs font-bold text-gray-600">
                        <div>IFSC: {state.vendor.ifscCode}</div>
                        <div>BANK: {state.vendor.bankName}</div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg flex flex-col items-center text-center">
                        <div className="bg-green-100 p-4 rounded-full mb-4 text-green-600">
                            <Download size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Import from Excel</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Upload your Excel file (.xlsx) or CSV. The system will automatically detect columns like Date, Vehicle, Qty, etc.
                        </p>

                        <label className="cursor-pointer bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl w-full flex justify-center items-center gap-2">
                            <span>Select Excel File</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>

                        <button
                            onClick={() => setImportModalOpen(false)}
                            className="mt-4 text-gray-400 text-xs hover:text-gray-600 underline">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Component for Currency Input
function CurrencyInput({ value, onChange }) {
    const [isFocused, setIsFocused] = React.useState(false);

    // Format: 1,23,456.00
    const format = (val) => {
        if (!val) return '0.00';
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    return (
        <input
            type="text"
            className="text-right font-mono text-xl font-bold bg-transparent outline-none w-48 text-blue-900 border-b border-blue-300 focus:border-blue-600"
            value={isFocused ? value : format(value)}
            onFocus={(e) => {
                setIsFocused(true);
                e.target.select();
            }}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
                // Allow only numbers and one decimal
                const val = e.target.value;
                if (/^[\d.]*$/.test(val)) {
                    onChange(val);
                }
            }}
        />
    );
}

export default Dashboard;
