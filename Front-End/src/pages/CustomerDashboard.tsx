import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { accountService } from "../services/account";
import { transactionService } from "../services/transaction";
import { loanService } from "../services/loan";
import NotificationBell from "../components/NotificationBell";
import { Account, Transaction, LoanRequest } from "../types";
import {
  LogOut, Building2, Plus, ArrowUpRight, ArrowDownLeft,
  Send, FileText, CreditCard, Wallet, TrendingUp, Clock,
  CheckCircle, XCircle, AlertCircle, Home, Car, GraduationCap,
  Heart, Briefcase, Stethoscope, RefreshCw, User, Calendar,
  ChevronDown, ChevronUp,
} from "lucide-react";
import ProfileModal from "../components/ProfileModal";
import StatementDownload from "../components/StatementDownload";
import { Toast, useToast } from "../components/Toast";

// ── POLICY MAP ────────────────────────────────────────────────────
const LOAN_POLICY_MAP: Record<string, number> = {
  CAR: 1, HOME: 2, PERSONAL: 3, EDUCATION: 4, MARRIAGE: 5, MEDICAL: 6,
};

// ── LOAN POLICY DETAILS (for interest preview on apply form only) ─
const LOAN_POLICY_DETAILS: Record<string, { rate: number; minMonths: number; maxMonths: number; minAmount: number; maxAmount: number }> = {
  CAR: { rate: 12, minMonths: 12, maxMonths: 60, minAmount: 500000, maxAmount: 3000000 },
  HOME: { rate: 9, minMonths: 60, maxMonths: 240, minAmount: 2000000, maxAmount: 20000000 },
  PERSONAL: { rate: 18, minMonths: 6, maxMonths: 36, minAmount: 100000, maxAmount: 1000000 },
  EDUCATION: { rate: 7.5, minMonths: 12, maxMonths: 84, minAmount: 200000, maxAmount: 5000000 },
  MARRIAGE: { rate: 11, minMonths: 12, maxMonths: 60, minAmount: 200000, maxAmount: 3000000 },
  MEDICAL: { rate: 10, minMonths: 6, maxMonths: 48, minAmount: 100000, maxAmount: 2000000 },
};

interface Repayment {
  repayment_id: number;
  installment_no: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | string;
  is_overdue?: boolean;
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { toasts, removeToast, toast } = useToast();

  const [activeTab, setActiveTab] = useState<"accounts" | "transactions" | "loans">("accounts");
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>("all");
  const [startDate, setStartDate] = useState<Date>(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [accountForm, setAccountForm] = useState<{ accountType: "savings" | "current" }>({ accountType: "savings" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", description: "" });
  const [transferForm, setTransferForm] = useState({ toAccountNumber: "", amount: "", description: "" });
  const [loanForm, setLoanForm] = useState({ amount: "", loanType: "", duration: "", account_id: "", autoDeduct: false });

  const [repaymentSchedules, setRepaymentSchedules] = useState<Record<number, Repayment[]>>({});
  const [loadingScheduleId, setLoadingScheduleId] = useState<number | null>(null);

  // balloon payment selection state
  const [selectedRepaymentIds, setSelectedRepaymentIds] = useState<Record<number, Set<number>>>({});

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── HELPERS ──────────────────────────────────────────────────────
  const getLoanIcon = (loanType: string) => {
    switch (loanType?.toUpperCase()) {
      case "HOME": return <Home className="w-5 h-5" />;
      case "CAR": return <Car className="w-5 h-5" />;
      case "EDUCATION": return <GraduationCap className="w-5 h-5" />;
      case "MARRIAGE": return <Heart className="w-5 h-5" />;
      case "BUSINESS": return <Briefcase className="w-5 h-5" />;
      case "MEDICAL": return <Stethoscope className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const visibleAccounts = accounts.filter(a => a.status?.toLowerCase() !== "rejected");
  const activeAccounts = visibleAccounts.filter(a =>
    a.status?.toLowerCase() === "active" || a.status?.toLowerCase() === "approved"
  );
  const totalBalance = activeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const hasSavings = visibleAccounts.some(a => a.accountType?.toUpperCase() === "SAVINGS");
  const hasCurrent = visibleAccounts.some(a => a.accountType?.toUpperCase() === "CURRENT");

  const getStatusBadge = (status: string = "") => {
    switch (status.toLowerCase()) {
      case "active":
      case "approved": return { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle className="w-4 h-4" /> };
      case "pending": return { bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="w-4 h-4" /> };
      case "rejected": return { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-4 h-4" /> };
      case "closed": return { bg: "bg-gray-100", text: "text-gray-700", icon: <CheckCircle className="w-4 h-4" /> };
      case "defaulted": return { bg: "bg-red-200", text: "text-red-800", icon: <XCircle className="w-4 h-4" /> };
      default: return { bg: "bg-gray-100", text: "text-gray-700", icon: <AlertCircle className="w-4 h-4" /> };
    }
  };

  // ── INTEREST PREVIEW CALCULATOR (Simple Interest) ─────────────────
  // Used ONLY for the loan application form preview (hardcoded policy rates)
  const calcLoanPreview = (amount: number, loanType: string, months: number) => {
    const policy = LOAN_POLICY_DETAILS[loanType];
    if (!policy || !amount || !months || months <= 0) return null;
    const years = months / 12;
    const totalInterest = parseFloat(((amount * policy.rate * years) / 100).toFixed(2));
    const totalAmount = parseFloat((amount + totalInterest).toFixed(2));
    const regularEMI = parseFloat((Math.floor((totalAmount / months) * 100) / 100).toFixed(2));
    const lastEMI = parseFloat((totalAmount - regularEMI * (months - 1)).toFixed(2));
    return { principal: amount, rate: policy.rate, totalInterest, totalAmount, regularEMI, lastEMI, months };
  };

  // ── INTEREST SUMMARY using actual backend rate ────────────────────
  // FIX BUG 1: Use loan.interestRate from backend instead of hardcoded LOAN_POLICY_DETAILS
  // This ensures the breakdown shown matches the actual repayment schedule amounts
  const calcInterestSummaryFromRate = (
    principal: number,
    annualRate: number,
    months: number
  ) => {
    if (!principal || !annualRate || !months || months <= 0) return null;
    const years = months / 12;
    const totalInterest = parseFloat(((principal * annualRate * years) / 100).toFixed(2));
    const totalAmount = parseFloat((principal + totalInterest).toFixed(2));
    const regularEMI = parseFloat((Math.floor((totalAmount / months) * 100) / 100).toFixed(2));
    const lastEMI = parseFloat((totalAmount - regularEMI * (months - 1)).toFixed(2));
    return { principal, rate: annualRate, totalInterest, totalAmount, regularEMI, lastEMI, months };
  };

  // ── DATA FETCHING ─────────────────────────────────────────────────
  const silentRefreshAccounts = async () => {
    try {
      const response = await accountService.getMyAccounts();
      const list: Account[] = Array.isArray(response) ? response : (response as any).accounts || [];
      // Only update state if data actually changed — prevents unnecessary re-renders / flicker
      setAccounts(prev => {
        if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
        return list;
      });
      setSelectedAccount(prev => {
        if (!prev) return prev;
        const updated = list.find((a: Account) => a.id === prev.id);
        if (!updated) return prev;
        // Only swap if something changed
        if (JSON.stringify(updated) === JSON.stringify(prev)) return prev;
        return updated;
      });
    } catch (_) { }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountService.getMyAccounts();
      const list = Array.isArray(response) ? response : (response as any).accounts || [];
      setAccounts(list);
      if (list.length > 0 && !selectedAccount) setSelectedAccount(list[0]);
    } catch (err) { console.error("Failed to load accounts:", err); }
    finally { setLoading(false); }
  };

  const loadTransactions = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const response = await transactionService.getByAccount(selectedAccount.id);
      setTransactions((response as any).transactions || []);
    } catch (err) { console.error("Failed to load transactions:", err); }
    finally { setLoading(false); }
  };

  const loadLoans = async () => {
    setLoading(true);
    try {
      const response = await loanService.getAllLoans();
      const raw = Array.isArray(response) ? response : (response as any).loans || [];
      const mapped = raw.map((l: any) => ({
        id: l.loan_id,
        customerId: l.customer_id,
        accountId: l.account_id,
        policyId: l.policy_id,
        loanAmount: l.loan_amount,
        approvedAmount: l.approved_amount,
        durationMonths: l.duration_months,
        startDate: l.start_date,
        endDate: l.end_date,
        status: l.status,
        autoDeduct: l.auto_deduct,
        createdAt: l.created_at,
        loanType: l.loan_type,
        interestRate: l.interest_rate,
        minAmount: l.min_amount,
        maxAmount: l.max_amount,
        minMonths: l.min_months,
        maxMonths: l.max_months,
        staffApprovalStatus: l.staff_approval_status,
        staffApprovalRemarks: l.staff_approval_remarks,
        adminApprovalStatus: l.admin_approval_status,
        adminApprovalRemarks: l.admin_approval_remarks,
      }));
      setLoans(mapped);
    } catch (err) { console.error("Failed to load loans:", err); }
    finally { setLoading(false); }
  };

  const fetchAllData = async () => {
    await loadAccounts();
    if (activeTab === "transactions" && selectedAccount) await loadTransactions();
    else if (activeTab === "loans") await loadLoans();
  };

  // Poll every 10s for balance refresh
  useEffect(() => {
    pollingRef.current = setInterval(silentRefreshAccounts, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  useEffect(() => { setFilteredTransactions(transactions); }, [transactions]);
  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => {
    if (activeTab === "transactions" && selectedAccount) loadTransactions();
    else if (activeTab === "loans") loadLoans();
  }, [activeTab, selectedAccount]);

  // ── ACTION HANDLERS ───────────────────────────────────────────────
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.create(accountForm.accountType.toUpperCase() as "SAVINGS" | "CURRENT");
      toast.success("Account created successfully. Waiting for staff approval.");
      setShowCreateAccount(false);
      loadAccounts();
    } catch (err: any) { toast.error(err.message || "Failed to create account"); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await transactionService.withdraw({
        accountId: selectedAccount.id,
        amount: parseFloat(withdrawForm.amount),
        description: withdrawForm.description,
      });
      toast.success("Withdrawal successful");
      setShowWithdraw(false);
      setWithdrawForm({ amount: "", description: "" });
      loadAccounts(); loadTransactions();
    } catch (err: any) { toast.error(err.message || "Withdrawal failed"); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await transactionService.transfer({
        fromAccountId: selectedAccount.id,
        toAccountNumber: transferForm.toAccountNumber,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description,
      });
      toast.success("Transfer successful");
      setShowTransfer(false);
      setTransferForm({ toAccountNumber: "", amount: "", description: "" });
      loadAccounts(); loadTransactions();
    } catch (err: any) { toast.error(err.message || "Transfer failed"); }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const policy_id = LOAN_POLICY_MAP[loanForm.loanType];
    if (!policy_id) return toast.error("Invalid loan type selected.");
    if (!loanForm.account_id) return toast.error("Please select an account.");
    const amount = parseFloat(loanForm.amount);
    const months = parseInt(loanForm.duration);
    const preview = calcLoanPreview(amount, loanForm.loanType, months);
    if (!preview) return toast.error("Could not calculate loan preview. Check amount and duration.");
    try {
      await loanService.create({
        policy_id,
        account_id: parseInt(loanForm.account_id),
        loan_amount: amount,
        duration_months: months,
        auto_deduct: loanForm.autoDeduct,
      });
      toast.success("Loan application submitted successfully!");
      setShowLoanForm(false);
      setLoanForm({ amount: "", loanType: "", duration: "", account_id: "", autoDeduct: false });
      loadLoans();
    } catch (err: any) { toast.error(err.message || "Loan application failed"); }
  };

  // ── REPAYMENT SCHEDULE ────────────────────────────────────────────
  const loadRepaymentSchedule = async (loanId: number) => {
    // Toggle: if already loaded, hide it
    if (repaymentSchedules[loanId]) {
      setRepaymentSchedules(prev => {
        const next = { ...prev };
        delete next[loanId];
        return next;
      });
      return;
    }
    setLoadingScheduleId(loanId);
    try {
      const response = await loanService.getRepaymentSchedule(loanId);
      setRepaymentSchedules(prev => ({ ...prev, [loanId]: (response as any).schedule || [] }));
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment plan");
    } finally {
      setLoadingScheduleId(null);
    }
  };

  // Toggle a repayment ID in the balloon selection for a given loan
  const toggleRepaymentSelection = (loanId: number, repaymentId: number) => {
    setSelectedRepaymentIds(prev => {
      const set = new Set(prev[loanId] || []);
      if (set.has(repaymentId)) set.delete(repaymentId);
      else set.add(repaymentId);
      return { ...prev, [loanId]: set };
    });
  };

  // Pay selected installments (single or balloon)
  const handlePaySelected = async (loan: LoanRequest) => {
    const selected = selectedRepaymentIds[loan.id];
    if (!selected || selected.size === 0)
      return toast.error("Please select at least one installment to pay.");

    const fromAccountId = loan.accountId || activeAccounts[0]?.id;
    if (!fromAccountId) return toast.error("No active account found for payment.");

    try {
      await loanService.payInstallment(loan.id, {
        repayment_ids: Array.from(selected),
        from_account_id: fromAccountId,
      });

      const count = selected.size;
      toast.success(count > 1
        ? `Balloon payment: ${count} installments paid successfully.`
        : `Installment paid successfully.`
      );

      // Clear selection + refresh schedule + refresh accounts
      setSelectedRepaymentIds(prev => ({ ...prev, [loan.id]: new Set() }));
      const response = await loanService.getRepaymentSchedule(loan.id);
      setRepaymentSchedules(prev => ({ ...prev, [loan.id]: (response as any).schedule || [] }));
      await Promise.all([loadAccounts(), loadLoans()]);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    }
  };

  // ── DATE HELPERS ──────────────────────────────────────────────────
  const toLocalDateString = (d: Date) => d.toLocaleDateString("en-CA");
  const parseDateInput = (v: string): Date => {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // ── LOAN FORM PREVIEW ─────────────────────────────────────────────
  const loanPreview = calcLoanPreview(
    parseFloat(loanForm.amount) || 0,
    loanForm.loanType,
    parseInt(loanForm.duration) || 0
  );

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* NAVBAR */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Dashboard</h1>
                <p className="text-xs text-gray-500">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition">
                <User className="w-5 h-5" />
              </button>
              <button onClick={fetchAllData} disabled={loading}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition">
                <LogOut className="w-5 h-5" /><span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* BALANCE CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Total Balance (All Active Accounts)
                </p>
                <h2 className="text-4xl font-bold mt-2">PKR {totalBalance.toLocaleString()}</h2>
                <p className="text-blue-100 text-sm mt-2">
                  {activeAccounts.length} active account{activeAccounts.length !== 1 ? "s" : ""}
                </p>
                {activeAccounts.length > 1 && (
                  <div className="mt-2 flex gap-3 flex-wrap">
                    {activeAccounts.map(a => (
                      <span key={a.id} className="text-xs bg-blue-700 bg-opacity-60 px-2 py-1 rounded-lg">
                        {a.accountType}: PKR {a.balance?.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <CreditCard className="w-12 h-12 text-blue-200" />
            </div>
            <div className="flex space-x-4 mt-6">
              <button onClick={() => setShowWithdraw(true)} disabled={activeAccounts.length === 0}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50">
                <ArrowUpRight className="w-4 h-4" /><span>Withdraw</span>
              </button>
              <button onClick={() => setShowTransfer(true)} disabled={activeAccounts.length === 0}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50">
                <Send className="w-4 h-4" /><span>Transfer</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-xs text-gray-400">Accounts: {visibleAccounts.length}/2</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => setShowCreateAccount(true)}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                <Plus className="w-5 h-5" /><span className="font-medium">Create New Account</span>
              </button>
              <button onClick={() => setShowLoanForm(true)}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                <FileText className="w-5 h-5" /><span className="font-medium">Apply for Loan</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b">
            {([
              { id: "accounts", label: `My Accounts (${visibleAccounts.length})`, icon: Building2 },
              { id: "transactions", label: "Transactions", icon: ArrowDownLeft },
              { id: "loans", label: `Loans (${loans.length})`, icon: FileText },
            ] as { id: "accounts" | "transactions" | "loans"; label: string; icon: React.ElementType }[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition ${activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="w-5 h-5" /><span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div>

            {/* ── ACCOUNTS TAB ── */}
            {activeTab === "accounts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleAccounts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-sm border">
                    <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No accounts yet. Create your first account!</p>
                  </div>
                ) : visibleAccounts.map(account => {
                  const badge = getStatusBadge(account.status);
                  return (
                    <div key={account.id}
                      className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition cursor-pointer ${selectedAccount?.id === account.id ? "ring-2 ring-blue-500" : ""}`}
                      onClick={() => setSelectedAccount(account)}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{account.accountType} Account</h3>
                          </div>
                          <p className="text-sm text-gray-500 font-mono">#{account.accountNumber}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.icon}{account.status}
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">{account.accountType} Balance</p>
                        <p className="text-3xl font-bold text-gray-900">
                          PKR {account.balance?.toLocaleString() || "0"}
                        </p>
                      </div>
                      {account.status?.toLowerCase() === "active" && (
                        <button onClick={e => { e.stopPropagation(); setSelectedAccount(account); setActiveTab("transactions"); }}
                          className="mt-4 w-full bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4" />View Transactions
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TRANSACTIONS TAB ── */}
            {activeTab === "transactions" && (
              <div>
                {activeAccounts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                    <p className="text-gray-500">No active accounts yet</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Account to View Transactions</label>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {activeAccounts.map(account => (
                          <button key={account.id}
                            onClick={() => { setSelectedAccount(account); setDateRange(null); setFilteredTransactions([]); setActiveFilter("all"); }}
                            className={`px-4 py-3 rounded-lg font-medium transition flex-1 min-w-[200px] ${selectedAccount?.id === account.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-700 border hover:bg-gray-50"}`}>
                            <div className="text-sm font-semibold">{account.accountType} — #{account.accountNumber}</div>
                            <div className="text-xs opacity-75 mt-0.5">Balance: PKR {account.balance?.toLocaleString()}</div>
                          </button>
                        ))}
                      </div>

                      {selectedAccount && (
                        <div className="space-y-4 mb-6">
                          <div className="flex flex-wrap gap-2">
                            {[{ label: "3 Months", key: "3months", months: 3 }, { label: "6 Months", key: "6months", months: 6 }, { label: "12 Months", key: "12months", months: 12 }].map(f => (
                              <button key={f.key}
                                onClick={() => {
                                  const start = new Date(); start.setMonth(start.getMonth() - f.months);
                                  const end = new Date();
                                  setStartDate(start); setEndDate(end);
                                  setFilteredTransactions(transactions.filter((t: any) => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end));
                                  setDateRange({ start, end }); setActiveFilter(f.key);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeFilter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                                {f.label}
                              </button>
                            ))}
                            <button onClick={() => { setDateRange(null); setFilteredTransactions(transactions); setActiveFilter("all"); }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                              All Transactions
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex flex-wrap gap-3 items-center">
                              <span className="text-sm font-medium text-gray-700">Custom Range:</span>
                              <div className="flex items-center gap-2">
                                <input type="date" value={toLocalDateString(startDate)} onChange={e => setStartDate(parseDateInput(e.target.value))}
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                <span className="text-gray-500">to</span>
                                <input type="date" value={toLocalDateString(endDate)} onChange={e => setEndDate(parseDateInput(e.target.value))}
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                                <button onClick={() => {
                                  setActiveFilter(null);
                                  const s = new Date(startDate); s.setHours(0, 0, 0, 0);
                                  const en = new Date(endDate); en.setHours(23, 59, 59, 999);
                                  setFilteredTransactions(transactions.filter((t: any) => { const d = new Date(t.createdAt); return d >= s && d <= en; }));
                                  setDateRange({ start: startDate, end: endDate });
                                }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply</button>
                              </div>
                            </div>
                            <StatementDownload
                              accountId={selectedAccount.id}
                              accountNumber={selectedAccount.accountNumber.toString()}
                              customerName={user?.name || "Customer"}
                              transactions={filteredTransactions}
                              dateRange={dateRange} />
                          </div>

                          {dateRange && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                              <span className="font-medium">Showing:</span>
                              <span>{dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}</span>
                              <span className="text-gray-400">|</span>
                              <span>{filteredTransactions.length} transactions</span>
                              <button onClick={() => { setDateRange(null); setFilteredTransactions(transactions); setActiveFilter("all"); }}
                                className="ml-2 text-xs text-red-500 hover:text-red-700">Clear</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction History
                      {selectedAccount && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({selectedAccount.accountType} — #{selectedAccount.accountNumber} | Balance: PKR {selectedAccount.balance?.toLocaleString()})
                        </span>
                      )}
                    </h3>

                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No transactions found for selected period</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const grouped = filteredTransactions.reduce((groups: any, t: any) => {
                            const date = new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" });
                            if (!groups[date]) groups[date] = [];
                            groups[date].push(t);
                            return groups;
                          }, {});
                          return Object.entries(grouped).map(([date, dayTx]: [string, any]) => (
                            <div key={date}>
                              <div className="sticky top-0 z-10 bg-gray-100 rounded-lg px-4 py-2 mb-3 shadow-sm">
                                <h4 className="font-semibold text-gray-700">{date}</h4>
                              </div>
                              <div className="space-y-3">
                                {dayTx.map((t: any) => {
                                  const isCredit = t.type === "CREDIT" || t.type === "credit" || t.type === "DEPOSIT" || t.type === "LOAN_DISBURSEMENT";
                                  return (
                                    <div key={t.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition ${isCredit ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}>
                                      <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-full ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                                              {isCredit ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                              {isCredit ? "CREDIT" : "DEBIT"}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(t.createdAt).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                                            </span>
                                          </div>
                                          <span className={`text-lg font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                                            {isCredit ? "+" : "-"}PKR {t.amount?.toLocaleString()}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-800 mt-2 mb-2 pl-7">{t.description || t.transaction_reason || "Transaction"}</p>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                          <p className="text-xs text-gray-400">Transaction ID: {t.id}</p>
                                          {t.running_balance !== undefined && (
                                            <p className="text-xs font-medium text-gray-600">Balance: PKR {t.running_balance?.toLocaleString()}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── LOANS TAB ── */}
            {activeTab === "loans" && (
              <div className="space-y-6">
                {loans.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No loan applications yet</p>
                  </div>
                ) : loans.map(loan => {
                  const badge = getStatusBadge(loan.status);
                  const LoanIcon = getLoanIcon(loan.loanType);
                  const displayAmount = loan.approvedAmount ?? loan.loanAmount ?? 0;
                  const schedule = repaymentSchedules[loan.id];
                  const selected = selectedRepaymentIds[loan.id] || new Set<number>();

                  // FIX BUG 1: Use actual interestRate from backend (not hardcoded LOAN_POLICY_DETAILS)
                  // This ensures the breakdown shown matches the actual installment amounts in the schedule
                  const interestSummary =
                    (loan.status === "ACTIVE" || loan.status === "CLOSED") &&
                      displayAmount &&
                      loan.durationMonths &&
                      loan.interestRate
                      ? calcInterestSummaryFromRate(
                        Number(displayAmount),
                        Number(loan.interestRate),
                        loan.durationMonths
                      )
                      : null;

                  // FIX BUG 2: Determine whether to show two-level approval status panel
                  // Hide it once the loan reaches a terminal/active state to avoid
                  // "Awaiting admin" showing on already-approved loans.
                  // Also treat adminApprovalStatus === "APPROVED" as terminal to handle
                  // cases where the DB loan.status may lag behind the approval columns.
                  const isTerminal =
                    ["ACTIVE", "CLOSED", "DEFAULTED"].includes(loan.status?.toUpperCase()) ||
                    loan.adminApprovalStatus?.toUpperCase() === "APPROVED";
                  const isRejected = loan.status?.toUpperCase() === "REJECTED";

                  // FIX BUG 3: Show repayment schedule for ACTIVE and CLOSED loans
                  const canViewSchedule = loan.status === "ACTIVE" || loan.status === "CLOSED";

                  return (
                    <div key={loan.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
                      {/* LOAN HEADER */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">{LoanIcon}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{loan.loanType} Loan</h3>
                            <p className="text-2xl font-bold text-blue-600">PKR {Number(displayAmount).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.icon}{loan.status}
                        </span>
                      </div>

                      {/* LOAN DETAILS GRID */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {loan.interestRate != null && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">Interest Rate (p.a.)</p>
                            <p className="text-lg font-semibold text-gray-900">{loan.interestRate}%</p>
                          </div>
                        )}
                        {loan.durationMonths != null && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-lg font-semibold text-gray-900">{loan.durationMonths} months</p>
                          </div>
                        )}
                      </div>

                      {/* INTEREST BREAKDOWN — for active/closed loans using ACTUAL backend rate */}
                      {interestSummary && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-1 text-sm">
                          <p className="font-semibold text-blue-800 mb-2">
                            Loan Breakdown (Simple Interest @ {interestSummary.rate}% p.a.)
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-gray-600">Principal:</span> <span className="font-medium">PKR {interestSummary.principal.toLocaleString()}</span></div>
                            <div><span className="text-gray-600">Total Interest:</span> <span className="font-medium text-orange-600">PKR {interestSummary.totalInterest.toLocaleString()}</span></div>
                            <div><span className="text-gray-600">Total Repayment:</span> <span className="font-medium">PKR {interestSummary.totalAmount.toLocaleString()}</span></div>
                            <div><span className="text-gray-600">Monthly EMI:</span> <span className="font-medium text-green-700">PKR {interestSummary.regularEMI.toLocaleString()}</span></div>
                          </div>
                          {interestSummary.lastEMI !== interestSummary.regularEMI && (
                            <p className="text-xs text-gray-500 mt-1">* Last installment: PKR {interestSummary.lastEMI.toLocaleString()} (rounding adjustment)</p>
                          )}
                        </div>
                      )}

                      {/* DATES */}
                      <div className="mt-4 space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Applied:</span> {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString("en-PK") : "—"}</p>
                        {loan.startDate && <p><span className="font-medium">Start:</span> {new Date(loan.startDate).toLocaleDateString("en-PK")}</p>}
                        {loan.endDate && <p><span className="font-medium">End:</span> {new Date(loan.endDate).toLocaleDateString("en-PK")}</p>}
                      </div>

                      {/* FIX BUG 2: TWO-LEVEL APPROVAL STATUS
                          Only show this panel when loan is still PENDING (not yet terminal/active).
                          Once active/closed/defaulted the top badge already communicates the final state. */}
                      {!isTerminal && (
                        <div className="mt-3 space-y-2">
                          {/* Staff review row */}
                          <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${loan.staffApprovalStatus === "APPROVED" ? "bg-green-50 text-green-700" :
                            loan.staffApprovalStatus === "REJECTED" ? "bg-red-50 text-red-700" :
                              "bg-yellow-50 text-yellow-700"
                            }`}>
                            {loan.staffApprovalStatus === "APPROVED" ? <CheckCircle className="w-3 h-3" /> :
                              loan.staffApprovalStatus === "REJECTED" ? <XCircle className="w-3 h-3" /> :
                                <Clock className="w-3 h-3" />}
                            <span>
                              <span className="font-medium">Staff Review:</span>{" "}
                              {loan.staffApprovalStatus ?? "Awaiting Staff"}
                              {loan.staffApprovalRemarks && ` — ${loan.staffApprovalRemarks}`}
                            </span>
                          </div>

                          {/* Admin review row — only show if staff has already acted */}
                          {loan.staffApprovalStatus === "APPROVED" && (
                            <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${loan.adminApprovalStatus === "APPROVED" ? "bg-green-50 text-green-700" :
                              loan.adminApprovalStatus === "REJECTED" ? "bg-red-50 text-red-700" :
                                "bg-yellow-50 text-yellow-700"
                              }`}>
                              {loan.adminApprovalStatus === "APPROVED" ? <CheckCircle className="w-3 h-3" /> :
                                loan.adminApprovalStatus === "REJECTED" ? <XCircle className="w-3 h-3" /> :
                                  <Clock className="w-3 h-3" />}
                              <span>
                                <span className="font-medium">Admin Review:</span>{" "}
                                {loan.adminApprovalStatus ?? "Awaiting Admin"}
                                {loan.adminApprovalRemarks && ` — ${loan.adminApprovalRemarks}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show rejection remarks if rejected */}
                      {isRejected && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-700 flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            <span className="font-medium">Rejection Reason:</span>{" "}
                            {loan.staffApprovalStatus === "REJECTED"
                              ? (loan.staffApprovalRemarks || "No reason provided")
                              : (loan.adminApprovalRemarks || "No reason provided")}
                          </span>
                        </div>
                      )}

                      {loan.status === "ACTIVE" && (
                        <div className="mt-2 p-2 bg-green-100 rounded-lg text-xs text-green-800 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Loan is Active — Repayments in Progress
                        </div>
                      )}

                      {loan.status === "CLOSED" && (
                        <div className="mt-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-gray-500" /> Loan Fully Repaid & Closed
                        </div>
                      )}

                      {loan.status === "DEFAULTED" && (
                        <div className="mt-2 p-2 bg-red-100 rounded-lg text-xs text-red-800 font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Loan Defaulted — Please contact support immediately
                        </div>
                      )}

                      {/* FIX BUG 3: REPAYMENT SCHEDULE
                          Show for ACTIVE loans (can pay) and CLOSED loans (read-only history).
                          Closed loans show schedule in read-only mode with no payment options. */}
                      {canViewSchedule && (
                        <div className="mt-4">
                          <button
                            onClick={() => loadRepaymentSchedule(loan.id)}
                            disabled={loadingScheduleId === loan.id}
                            className="w-full flex items-center justify-center gap-2 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm font-medium">
                            {loadingScheduleId === loan.id
                              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Loading schedule...</>
                              : schedule
                                ? <><ChevronUp className="w-4 h-4" /> Hide Payment Schedule</>
                                : <><Calendar className="w-4 h-4" /> {loan.status === "CLOSED" ? "View Payment History" : "View Payment Schedule"}</>
                            }
                          </button>

                          {schedule && (
                            <div className="mt-4 border rounded-lg overflow-hidden">
                              {/* Schedule summary */}
                              <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                  <div className="text-gray-500">Paid</div>
                                  <div className="font-bold text-green-600">{schedule.filter(r => r.status === "PAID").length}/{schedule.length}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Overdue</div>
                                  <div className="font-bold text-red-600">{schedule.filter(r => r.status === "OVERDUE" || r.is_overdue).length}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Remaining</div>
                                  <div className="font-bold text-blue-600">
                                    PKR {schedule.filter(r => r.status !== "PAID").reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Balloon payment controls — only for ACTIVE loans */}
                              {loan.status === "ACTIVE" && schedule.some(r => r.status !== "PAID") && (
                                <div className="px-4 py-3 bg-amber-50 border-b text-xs text-amber-800 flex flex-wrap items-center gap-2">
                                  <span className="font-medium">💡 Balloon payment:</span>
                                  <span>Select multiple installments below and pay them all at once.</span>
                                  {selected.size > 0 && (
                                    <button
                                      onClick={() => handlePaySelected(loan)}
                                      className="ml-auto bg-green-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-green-700 transition">
                                      Pay {selected.size} installment{selected.size > 1 ? "s" : ""} — PKR{" "}
                                      {schedule.filter(r => selected.has(r.repayment_id)).reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Installment rows */}
                              <div className="max-h-80 overflow-y-auto">
                                {schedule.map(r => {
                                  const isPaid = r.status === "PAID";
                                  const isOverdue = r.status === "OVERDUE" || r.is_overdue;
                                  const isChecked = selected.has(r.repayment_id);
                                  const canPay = loan.status === "ACTIVE" && !isPaid;

                                  return (
                                    <div key={r.repayment_id}
                                      className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition ${isPaid ? "bg-green-50" :
                                        isOverdue ? "bg-red-50" :
                                          isChecked ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                                        }`}>

                                      {/* Checkbox for unpaid installments on active loans */}
                                      {canPay && (
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleRepaymentSelection(loan.id, r.repayment_id)}
                                          className="w-4 h-4 text-blue-600 rounded"
                                        />
                                      )}
                                      {isPaid && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                      {!canPay && !isPaid && <div className="w-4 h-4 flex-shrink-0" />}

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-700">
                                            #{r.installment_no}
                                          </span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? "bg-green-100 text-green-700" :
                                            isOverdue ? "bg-red-100 text-red-700" :
                                              "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          Due: {new Date(r.due_date).toLocaleDateString("en-PK")}
                                          {/* FIX BUG 3: Show paid date when installment is paid */}
                                          {isPaid && r.paid_date && (
                                            <span className="ml-1 text-green-600 font-medium">
                                              • Paid: {new Date(r.paid_date).toLocaleDateString("en-PK")}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right flex-shrink-0">
                                        <div className={`text-sm font-bold ${isPaid ? "text-green-600" : isOverdue ? "text-red-600" : "text-gray-900"}`}>
                                          PKR {Number(r.amount).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* MODALS */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} onProfileUpdate={loadAccounts} />

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Account</h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              Available: {!hasSavings && <span className="font-semibold">Savings</span>}{!hasSavings && !hasCurrent && " • "}{!hasCurrent && <span className="font-semibold">Current</span>}
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "savings" as const, label: "Savings Account", desc: "• Interest earning\n• Minimum balance", has: hasSavings },
                  { type: "current" as const, label: "Current Account", desc: "• Daily transactions\n• No interest", has: hasCurrent },
                ].map(opt => (
                  <button key={opt.type} type="button" onClick={() => setAccountForm({ accountType: opt.type })} disabled={opt.has}
                    className={`p-4 border-2 rounded-lg text-left transition ${accountForm.accountType === opt.type ? "border-blue-500 bg-blue-50" : opt.has ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="font-semibold text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-1 whitespace-pre-line">{opt.desc}</div>
                    {opt.has && <div className="text-xs text-green-600 mt-2">✓ Already created</div>}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" disabled={hasSavings && hasCurrent}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${hasSavings && hasCurrent ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  Create Account
                </button>
                <button type="button" onClick={() => setShowCreateAccount(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
              </div>
              {hasSavings && hasCurrent && (
                <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">You already have both account types</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Withdraw Money</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                <select value={selectedAccount?.id || ""}
                  onChange={e => setSelectedAccount(activeAccounts.find(a => a.id === parseInt(e.target.value)) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
                  <option value="">Select account...</option>
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountType} #{a.accountNumber} — PKR {a.balance?.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (PKR)</label>
                <input type="number" step="0.01" value={withdrawForm.amount}
                  onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter amount" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input type="text" value={withdrawForm.description}
                  onChange={e => setWithdrawForm({ ...withdrawForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter description" required />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">Withdraw</button>
                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Money</h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                <select value={selectedAccount?.id || ""}
                  onChange={e => setSelectedAccount(activeAccounts.find(a => a.id === parseInt(e.target.value)) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
                  <option value="">Select account...</option>
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountType} #{a.accountNumber} — PKR {a.balance?.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Account Number</label>
                <input type="text" value={transferForm.toAccountNumber}
                  onChange={e => setTransferForm({ ...transferForm, toAccountNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="e.g. BM1234567890" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (PKR)</label>
                <input type="number" step="0.01" value={transferForm.amount}
                  onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter amount" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input type="text" value={transferForm.description}
                  onChange={e => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter description" required />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Transfer</button>
                <button type="button" onClick={() => setShowTransfer(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Application Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg my-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply for Loan</h2>

            {activeAccounts.length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ You need an active account to apply for a loan.
              </div>
            )}

            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Account</label>
                <select value={loanForm.account_id}
                  onChange={e => setLoanForm({ ...loanForm, account_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
                  <option value="">Select account...</option>
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountType} #{a.accountNumber} — PKR {a.balance?.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                <select value={loanForm.loanType}
                  onChange={e => setLoanForm({ ...loanForm, loanType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
                  <option value="">Select loan type...</option>
                  <option value="CAR">Car Loan — 12–60 months, 12% | PKR 500K–3M</option>
                  <option value="HOME">Home Loan — 60–240 months, 9% | PKR 2M–20M</option>
                  <option value="PERSONAL">Personal Loan — 6–36 months, 18% | PKR 100K–1M</option>
                  <option value="EDUCATION">Education Loan — 12–84 months, 7.5% | PKR 200K–5M</option>
                  <option value="MARRIAGE">Marriage Loan — 12–60 months, 11% | PKR 200K–3M</option>
                  <option value="MEDICAL">Medical Loan — 6–48 months, 10% | PKR 100K–2M</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (PKR)</label>
                <input type="number" step="0.01" min="1000" value={loanForm.amount}
                  onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter amount" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (months)</label>
                <input type="number" min="1" max="240" value={loanForm.duration}
                  onChange={e => setLoanForm({ ...loanForm, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter months" required />
              </div>

              {/* Auto-deduct toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoDeduct"
                  checked={loanForm.autoDeduct}
                  onChange={e => setLoanForm({ ...loanForm, autoDeduct: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="autoDeduct" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">Enable Auto-Deduction</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Monthly installment auto-deducted from selected account on due date
                  </span>
                </label>
              </div>

              {/* LIVE INTEREST PREVIEW */}
              {loanPreview && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                  <p className="font-semibold text-blue-800">📊 Loan Preview (Simple Interest @ {loanPreview.rate}% p.a.)</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-700">
                    <div><span className="text-gray-500">Principal:</span> <span className="font-medium">PKR {loanPreview.principal.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Total Interest:</span> <span className="font-medium text-orange-600">PKR {loanPreview.totalInterest.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Total Repayment:</span> <span className="font-medium">PKR {loanPreview.totalAmount.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Monthly EMI:</span> <span className="font-semibold text-green-700">PKR {loanPreview.regularEMI.toLocaleString()}</span></div>
                  </div>
                  {loanPreview.lastEMI !== loanPreview.regularEMI && (
                    <p className="text-xs text-gray-500">* Last installment: PKR {loanPreview.lastEMI.toLocaleString()} (rounded)</p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button type="submit" disabled={activeAccounts.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  Apply
                </button>
                <button type="button"
                  onClick={() => { setShowLoanForm(false); setLoanForm({ amount: "", loanType: "", duration: "", account_id: "", autoDeduct: false }); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}