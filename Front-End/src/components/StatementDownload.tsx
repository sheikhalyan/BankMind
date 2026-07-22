import { useState, useEffect, useRef } from "react";
import { Download, FileSpreadsheet, FileText, FileOutput, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  transaction_reason?: string;
  description?: string;
  createdAt: string;
  running_balance?: number;
}

interface StatementDownloadProps {
  accountId: number;
  accountNumber: string;
  customerName: string;
  transactions: Transaction[];
  dateRange: { start: Date; end: Date } | null;
}

export default function StatementDownload({
  accountNumber,
  customerName,
  transactions,
  dateRange,
}: StatementDownloadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCredit = (t: Transaction) =>
    t.type === "CREDIT" || t.type === "credit" || t.type === "DEPOSIT" || t.type === "LOAN_DISBURSEMENT";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // newest → oldest (for display in PDF/CSV/Excel)
  const getNewestFirst = (txns: Transaction[]) =>
    [...txns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // oldest → newest (needed to correctly compute opening balance from running_balance)
  const getOldestFirst = (txns: Transaction[]) =>
    [...txns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getBalances = (txns: Transaction[]) => {
    const oldestFirst = getOldestFirst(txns);
    const totalCredit = txns.filter(t => isCredit(t)).reduce((s, t) => s + t.amount, 0);
    const totalDebit = txns.filter(t => !isCredit(t)).reduce((s, t) => s + t.amount, 0);
    // closing = last (most recent) transaction's running_balance
    const closingBalance = oldestFirst[oldestFirst.length - 1]?.running_balance ?? 0;
    const openingBalance = closingBalance - totalCredit + totalDebit;
    return { totalCredit, totalDebit, closingBalance, openingBalance };
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "2-digit" });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: true });

  // ── CSV ─────────────────────────────────────────────────────────────
  const exportToCSV = (txns: Transaction[], start: Date, end: Date) => {
    const display = getNewestFirst(txns);
    const headers = ["#", "Date", "Time", "Type", "Description", "Amount (PKR)", "Balance (PKR)"];
    const rows = display.map((t, i) => [
      i + 1,
      fmtDate(t.createdAt),
      fmtTime(t.createdAt),
      isCredit(t) ? "Credit" : "Debit",
      `"${t.description || t.transaction_reason || "Transaction"}"`,
      isCredit(t) ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
      t.running_balance?.toFixed(2) || "N/A",
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BankMind_Statement_${accountNumber}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── EXCEL ────────────────────────────────────────────────────────────
  const exportToExcel = (txns: Transaction[], start: Date, end: Date) => {
    const { totalCredit, totalDebit, closingBalance, openingBalance } = getBalances(txns);
    const display = getNewestFirst(txns);

    const excelData: any[][] = [];
    excelData.push(["BANKMIND — ACCOUNT STATEMENT"]);
    excelData.push([]);
    excelData.push(["Customer Name:", customerName]);
    excelData.push(["Account Number:", accountNumber]);
    excelData.push(["Statement Period:", `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`]);
    excelData.push(["Generated On:", new Date().toLocaleString()]);
    excelData.push([]);
    excelData.push(["── SUMMARY ──"]);
    excelData.push(["Opening Balance", `PKR ${openingBalance.toFixed(2)}`]);
    excelData.push(["Total Credits", `+PKR ${totalCredit.toFixed(2)}`]);
    excelData.push(["Total Debits", `-PKR ${totalDebit.toFixed(2)}`]);
    excelData.push(["Closing Balance", `PKR ${closingBalance.toFixed(2)}`]);
    excelData.push([]);
    excelData.push(["── TRANSACTIONS (Latest First) ──"]);
    excelData.push([]);
    excelData.push(["#", "Date", "Time", "Type", "Description", "Amount (PKR)", "Balance (PKR)"]);

    display.forEach((t, i) => {
      excelData.push([
        i + 1,
        fmtDate(t.createdAt),
        fmtTime(t.createdAt),
        isCredit(t) ? "Credit" : "Debit",
        t.description || t.transaction_reason || "Transaction",
        isCredit(t) ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
        t.running_balance?.toFixed(2) || "N/A",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    ws["!cols"] = [
      { wch: 5 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 45 }, { wch: 16 }, { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "Statement");
    XLSX.writeFile(workbook, `BankMind_Statement_${accountNumber}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.xlsx`);
  };

  // ── PDF ──────────────────────────────────────────────────────────────
  const exportToPDF = (txns: Transaction[], start: Date, end: Date) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const { totalCredit, totalDebit, closingBalance, openingBalance } = getBalances(txns);
    const display = getNewestFirst(txns); // latest first

    const rows = display.map((t, i) => {
      const credit = isCredit(t);
      const typeLabel = credit
        ? (t.type === "DEPOSIT" ? "Deposit" : t.type === "LOAN_DISBURSEMENT" ? "Loan Credit" : "Credit")
        : "Debit";
      return `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td class="center muted">${i + 1}</td>
          <td>
            <div class="date-primary">${fmtDate(t.createdAt)}</div>
            <div class="date-secondary">${fmtTime(t.createdAt)}</div>
          </td>
          <td><span class="badge ${credit ? "badge-credit" : "badge-debit"}">${typeLabel}</span></td>
          <td class="desc">${t.description || t.transaction_reason || "Transaction"}</td>
          <td class="amount ${credit ? "credit" : "debit"} right">${credit ? "+" : "−"}PKR ${t.amount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</td>
          <td class="right balance">${t.running_balance !== undefined ? "PKR " + t.running_balance.toLocaleString("en-PK", { minimumFractionDigits: 2 }) : "—"}</td>
        </tr>`;
    }).join("");

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Account Statement — ${accountNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 24px;
      font-size: 13px;
    }

    .page {
      max-width: 960px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%);
      padding: 32px 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #fff;
    }
    .bank-logo { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .bank-logo span { color: #93c5fd; }
    .header-right { text-align: right; }
    .header-title { font-size: 15px; font-weight: 600; opacity: 0.9; }
    .header-sub { font-size: 12px; opacity: 0.65; margin-top: 4px; }

    /* ── Account info strip ── */
    .info-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0;
    }
    .info-cell {
      padding: 16px 20px;
      border-right: 1px solid #e2e8f0;
    }
    .info-cell:last-child { border-right: none; }
    .info-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; margin-bottom: 4px; }
    .info-value { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* ── Summary cards ── */
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-card {
      padding: 20px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
      position: relative;
    }
    .summary-card:last-child { border-right: none; }
    .summary-card::after {
      content: '';
      position: absolute;
      bottom: 0; left: 20%; right: 20%;
      height: 3px;
      border-radius: 2px 2px 0 0;
    }
    .summary-card.opening::after  { background: #94a3b8; }
    .summary-card.credits::after  { background: #16a34a; }
    .summary-card.debits::after   { background: #dc2626; }
    .summary-card.closing::after  { background: #2563eb; }
    .s-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 6px; }
    .s-value { font-size: 16px; font-weight: 700; color: #1e293b; }
    .s-value.credit { color: #16a34a; }
    .s-value.debit  { color: #dc2626; }
    .s-value.blue   { color: #2563eb; }

    /* ── Table ── */
    .table-wrap { padding: 24px 28px 32px; }
    .section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #64748b;
      margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after {
      content: ''; flex: 1; height: 1px; background: #e2e8f0;
    }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; }
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
    }
    td { padding: 11px 12px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
    .row-even { background: #fff; }
    .row-odd  { background: #fafafa; }

    .date-primary   { font-weight: 600; font-size: 12px; color: #1e293b; }
    .date-secondary { font-size: 10px; color: #94a3b8; margin-top: 2px; }

    .badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .badge-credit { background: #dcfce7; color: #15803d; }
    .badge-debit  { background: #fee2e2; color: #b91c1c; }

    .desc   { color: #475569; font-size: 12px; max-width: 240px; }
    .amount { font-weight: 700; font-size: 13px; white-space: nowrap; }
    .balance { font-size: 12px; color: #475569; font-weight: 500; white-space: nowrap; }
    .credit { color: #16a34a; }
    .debit  { color: #dc2626; }
    .right  { text-align: right; }
    .center { text-align: center; }
    .muted  { color: #94a3b8; font-size: 11px; }

    /* ── Footer ── */
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .footer strong { color: #64748b; }

    /* ── Print button ── */
    .print-bar {
      text-align: center;
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .print-btn {
      padding: 11px 28px;
      background: #1e40af;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
    }
    .print-btn:hover { background: #1e3a8a; }

    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <div>
        <div class="bank-logo">Bank<span>Mind</span></div>
        <div style="font-size:11px;opacity:0.6;margin-top:4px;">Digital Banking Platform</div>
      </div>
      <div class="header-right">
        <div class="header-title">Account Statement</div>
        <div class="header-sub">Period: ${start.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "2-digit" })} – ${end.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "2-digit" })}</div>
      </div>
    </div>

    <div class="info-strip">
      <div class="info-cell">
        <div class="info-label">Account Holder</div>
        <div class="info-value">${customerName}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Account Number</div>
        <div class="info-value" style="font-family:monospace;letter-spacing:0.5px">${accountNumber}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Total Transactions</div>
        <div class="info-value">${txns.length}</div>
      </div>
      <div class="info-cell">
        <div class="info-label">Generated On</div>
        <div class="info-value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card opening">
        <div class="s-label">Opening Balance</div>
        <div class="s-value">PKR ${openingBalance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="summary-card credits">
        <div class="s-label">Total Credits</div>
        <div class="s-value credit">+PKR ${totalCredit.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="summary-card debits">
        <div class="s-label">Total Debits</div>
        <div class="s-value debit">−PKR ${totalDebit.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
      </div>
      <div class="summary-card closing">
        <div class="s-label">Closing Balance</div>
        <div class="s-value blue">PKR ${closingBalance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="section-title">Transaction Details — Latest First</div>
      <table>
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th>Date & Time</th>
            <th>Type</th>
            <th>Description</th>
            <th class="right">Amount (PKR)</th>
            <th class="right">Balance (PKR)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div>This is a system-generated statement. For discrepancies, contact <strong>BankMind Support</strong>.</div>
      <div>© ${new Date().getFullYear()} BankMind · Confidential</div>
    </div>
  </div>

  <div class="print-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
</body>
</html>`);
    printWindow.document.close();
  };

  // ── HANDLER ──────────────────────────────────────────────────────────
  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setLoading(true);
    setIsOpen(false);
    try {
      if (transactions.length === 0) {
        showToast("error", "No transactions found for the selected period.");
        return;
      }
      const start = dateRange?.start ?? new Date(0);
      const end = dateRange?.end ?? new Date();

      switch (format) {
        case "csv":
          exportToCSV(transactions, start, end);
          setTimeout(() => showToast("success", "CSV downloaded successfully!"), 300);
          break;
        case "excel":
          exportToExcel(transactions, start, end);
          setTimeout(() => showToast("success", "Excel statement downloaded!"), 500);
          break;
        case "pdf":
          exportToPDF(transactions, start, end);
          break;
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────
  return (
    <>
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"}`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          {toast.text}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm whitespace-nowrap shrink-0 disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {loading ? "Exporting..." : "Download Statement"}
          {dateRange && (
            <span className="text-xs bg-green-700 px-2 py-0.5 rounded-full ml-1">
              {dateRange.start.toLocaleDateString()} – {dateRange.end.toLocaleDateString()}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && !loading && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Export As</p>
            <div className="py-1">
              <button onClick={() => handleExport("csv")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">CSV</div>
                  <div className="text-xs text-gray-400">Spreadsheet compatible</div>
                </div>
              </button>
              <button onClick={() => handleExport("excel")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition">
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Excel</div>
                  <div className="text-xs text-gray-400">Formatted workbook</div>
                </div>
              </button>
              <button onClick={() => handleExport("pdf")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition">
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileOutput className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">PDF</div>
                  <div className="text-xs text-gray-400">Print-ready statement</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}