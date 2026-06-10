// src/components/StatementDownload.tsx
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileOutput } from "lucide-react";
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

  const exportToCSV = (
    filteredTransactions: Transaction[],
    start: Date,
    end: Date,
  ) => {
    const headers = [
      "Date",
      "Time",
      "Type",
      "Description",
      "Amount",
      "Balance",
    ];
    const rows = filteredTransactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" }),
      new Date(t.createdAt).toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      t.type === "CREDIT" ? "Credit" : "Debit",
      t.description || t.transaction_reason || "Transaction",
      t.type === "CREDIT" ? `+${t.amount}` : `-${t.amount}`,
      t.running_balance?.toFixed(2) || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement_${accountNumber}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (
    filteredTransactions: Transaction[],
    start: Date,
    end: Date,
  ) => {
    console.log(
      "📊 Exporting to Excel - Transactions count:",
      filteredTransactions.length,
    );

    // Sort transactions by date (oldest first)
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const totalCredit = filteredTransactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = filteredTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);

    const closingBalance = filteredTransactions[0]?.running_balance ?? 0;
    const openingBalance = closingBalance - totalCredit + totalDebit;

    // Create data array for ONE sheet
    const excelData: any[][] = [];

    // Add Header
    excelData.push(["ACCOUNT STATEMENT"]);
    excelData.push([]);

    // Add Bank Info
    excelData.push(["Bank Name:", "BankMind"]);
    excelData.push(["Customer Name:", customerName]);
    excelData.push(["Account Number:", accountNumber]);
    excelData.push([
      "Statement Period:",
      `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
    ]);
    excelData.push(["Generated On:", new Date().toLocaleString()]);
    excelData.push([]);

    // Add Summary Section
    excelData.push(["SUMMARY"]);
    excelData.push([
      "Opening Balance",
      "",
      "",
      "",
      `$${openingBalance.toFixed(2)}`,
    ]);
    excelData.push([
      "Total Credits",
      "",
      "",
      "",
      `+$${totalCredit.toFixed(2)}`,
    ]);
    excelData.push(["Total Debits", "", "", "", `-$${totalDebit.toFixed(2)}`]);
    excelData.push([
      "Closing Balance",
      "",
      "",
      "",
      `$${closingBalance.toFixed(2)}`,
    ]);
    excelData.push([]);

    // Add Transactions Header
    excelData.push(["TRANSACTION DETAILS"]);
    excelData.push([]);

    // Add column headers
    excelData.push([
      "Transaction ID",
      "Date",
      "Time",
      "Type",
      "Description",
      "Amount",
      "Balance",
    ]);

    // Add transaction rows
    sortedTransactions.forEach((t) => {
      const date = new Date(t.createdAt);
      excelData.push([
        t.id,
        date.toLocaleDateString("en-US", { timeZone: "UTC" }),
        date.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        t.type === "CREDIT" ? "Credit" : "Debit",
        t.description || t.transaction_reason || "Transaction",
        t.type === "CREDIT" ? `+${t.amount}` : `-${t.amount}`,
        t.running_balance?.toFixed(2) || "N/A",
      ]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    ws["!cols"] = [
      { wch: 14 }, // Transaction ID
      { wch: 14 }, // Date
      { wch: 10 }, // Time
      { wch: 8 }, // Type
      { wch: 50 }, // Description
      { wch: 12 }, // Amount
      { wch: 12 }, // Balance
    ];

    // Create workbook with ONE sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, "Account Statement");

    // Save file
    XLSX.writeFile(
      workbook,
      `statement_${accountNumber}_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.xlsx`,
    );
  };
  const exportToPDF = (
    filteredTransactions: Transaction[],
    start: Date,
    end: Date,
  ) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCredit = filteredTransactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = filteredTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const closingBalance =
      filteredTransactions[filteredTransactions.length - 1]?.running_balance ??
      0;
    const openingBalance = closingBalance - totalCredit + totalDebit;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Statement - ${accountNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
          .statement-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e40af, #1e3a8a); color: white; padding: 30px; text-align: center; }
          .bank-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
          .statement-title { font-size: 18px; opacity: 0.9; }
          .account-info { padding: 20px 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { display: flex; }
          .info-label { font-weight: 600; width: 120px; color: #475569; }
          .info-value { color: #1e293b; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px 30px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
          .summary-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .summary-label { font-size: 12px; color: #64748b; margin-bottom: 5px; }
          .summary-value { font-size: 20px; font-weight: bold; color: #1e293b; }
          .credit { color: #16a34a; }
          .debit { color: #dc2626; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; color: #475569; }
          tr:hover { background: #f8fafc; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          @media print { body { background: white; padding: 0; } .statement-container { box-shadow: none; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="statement-container">
          <div class="header">
            <div class="bank-name">BankMind</div>
            <div class="statement-title">Account Statement</div>
          </div>
          <div class="account-info">
            <div class="info-item"><span class="info-label">Customer Name:</span><span class="info-value">${customerName}</span></div>
            <div class="info-item"><span class="info-label">Account Number:</span><span class="info-value">${accountNumber}</span></div>
            <div class="info-item"><span class="info-label">Statement Period:</span><span class="info-value">${start.toLocaleDateString("en-US", { timeZone: "UTC" })} - ${end.toLocaleDateString("en-US", { timeZone: "UTC" })}</span></div>
            <div class="info-item"><span class="info-label">Generated On:</span><span class="info-value">${new Date().toLocaleString()}</span></div>
          </div>
          <div class="summary">
            <div class="summary-card"><div class="summary-label">Opening Balance</div><div class="summary-value">$${openingBalance.toFixed(2)}</div></div>
            <div class="summary-card"><div class="summary-label">Total Credits</div><div class="summary-value credit">+$${totalCredit.toFixed(2)}</div></div>
            <div class="summary-card"><div class="summary-label">Total Debits</div><div class="summary-value debit">-$${totalDebit.toFixed(2)}</div></div>
            <div class="summary-card"><div class="summary-label">Closing Balance</div><div class="summary-value">$${closingBalance.toFixed(2)}</div></div>
          </div>
          <div style="overflow-x: auto; padding: 0 30px 30px 30px;">
            <table>
              <thead>
                <tr><th>Date</th><th>Time</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance</th></tr>
              </thead>
              <tbody>
                ${filteredTransactions
                  .map(
                    (t) => `
                  <tr>
                    <td>${new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</td>
                    <td>${new Date(t.createdAt).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</td>
                    <td class="${t.type === "CREDIT" ? "credit" : "debit"}">${t.type === "CREDIT" ? "Credit" : "Debit"}</td>
                    <td>${t.description || t.transaction_reason || "Transaction"}</td>
                    <td class="${t.type === "CREDIT" ? "credit" : "debit"}">${t.type === "CREDIT" ? "+" : "-"}$${t.amount.toFixed(2)}</td>
                    <td>$${t.running_balance?.toFixed(2) || "N/A"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>This is a system-generated statement. For any discrepancies, please contact bank support.</p>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setLoading(true);
    try {
      const filteredTransactions = transactions;
      const start = dateRange?.start ?? new Date(0);
      const end = dateRange?.end ?? new Date();

      if (filteredTransactions.length === 0) {
        alert("No transactions found for the selected period");
        setLoading(false);
        return;
      }

      switch (format) {
        case "csv":
          exportToCSV(filteredTransactions, start, end);
          // Small delay so download completes before any state changes
          setTimeout(
            () => alert("CSV statement downloaded successfully!"),
            300,
          );
          break;
        case "excel":
          exportToExcel(filteredTransactions, start, end);
          // Delay alert so it doesn't block/cancel the XLSX.writeFile download
          setTimeout(
            () => alert("Excel statement downloaded successfully!"),
            500,
          );
          break;
        case "pdf":
          exportToPDF(filteredTransactions, start, end);
          // No alert for PDF — new window opens, user prints from there
          break;
      }
    } catch (error) {
      console.error("Failed to export statement:", error);
      alert("Failed to export statement");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm whitespace-nowrap shrink-0"
        disabled={loading}
      >
        <Download className="w-4 h-4" />
        {loading ? "Exporting..." : "Download Statement"}
        {dateRange && (
          <span className="text-xs bg-green-700 px-2 py-0.5 rounded-full ml-1">
            {dateRange.start.toLocaleDateString()} –{" "}
            {dateRange.end.toLocaleDateString()}
          </span>
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 transition"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span>CSV Format</span>
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Excel Format</span>
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 transition"
            >
              <FileOutput className="w-4 h-4 text-red-500" />
              <span>PDF Format</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
