import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/user";
import { accountService } from "../services/account";
import { loanService } from "../services/loan";
import { api } from "../services/api";
import NotificationBell from "../components/NotificationBell";
import ProfileModal from "../components/ProfileModal";
import { navigate } from "../components/Router";
import { usePolling } from "../hooks/usePolling";
import {
  Users, UserCheck, Building, RefreshCw, LogOut,
  DollarSign, CreditCard, FileText, Eye, Search,
  Clock, AlertCircle, CheckCircle, XCircle, User,
  Calendar, ChevronDown, ChevronUp, MessageSquare, Send, X,
  TrendingUp, Shield,
} from "lucide-react";
import { supportService } from "../services/support";

// ================================================================
//  TYPES
// ================================================================
interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string | null;
  country: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  created_at: string;
  assigned_staff_id: number | null;
  assigned_staff_name: string | null;
  staff_approval_status: string | null;
  admin_approval_status: string | null;
}

interface Account {
  account_id: number;
  customer_id: number;
  account_number: string;
  account_type: "CURRENT" | "SAVINGS";
  balance: number;
  status: string;
  opened_date: string;
  closed_date: string | null;
  customer_name: string;
  customer_email: string;
}

interface Loan {
  loan_id: number;
  customer_id: number;
  customer_name: string;
  loan_type: string;
  loan_amount: number;
  approved_amount: number | null;
  disbursed_amount: number | null;
  disbursed_at: string | null;
  duration_months: number;
  interest_rate: number;
  status: string;
  auto_deduct: boolean;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  staff_approval_status: string | null;
  staff_approval_remarks: string | null;
  admin_approval_status: string | null;
  admin_approval_remarks: string | null;
}

interface Repayment {
  repayment_id: number;
  installment_no: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "FAILED";
}

interface Transaction {
  transaction_id: number;
  transaction_type: string;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  description: string;
  transaction_time: string;
  is_fraud: number;
}

interface TicketReply {
  reply_id: number;
  sender_type: "CUSTOMER" | "STAFF" | "ADMIN";
  sender_name?: string;
  message: string;
  created_at: string;
}

interface SupportTicket {
  ticket_id: number;
  customer_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  subject: string;
  description: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
  replies?: TicketReply[];
}

type TabType = "customers" | "accounts" | "loans" | "deposit" | "tickets";
type LoanFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "CLOSED";
type CustomerFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "MY_CUSTOMERS";
type AccountFilter = "ALL" | "PENDING" | "ACTIVE" | "FROZEN" | "CLOSURE_PENDING" | "CLOSED";
type TicketStatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// ================================================================
//  HELPER COMPONENTS (defined before main component)
// ================================================================
const formatDate = (d: string | null) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return "N/A"; }
};

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString("en-PK")}`;

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toUpperCase();
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    ACTIVE: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Clock className="w-3 h-3" /> },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> },
    SUSPENDED: { bg: "bg-orange-100", text: "text-orange-800", icon: <AlertCircle className="w-3 h-3" /> },
    APPROVED: { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
    FROZEN: { bg: "bg-blue-100", text: "text-blue-800", icon: <Shield className="w-3 h-3" /> },
    CLOSURE_PENDING: { bg: "bg-orange-100", text: "text-orange-800", icon: <Clock className="w-3 h-3" /> },
    CLOSED: { bg: "bg-gray-100", text: "text-gray-800", icon: <XCircle className="w-3 h-3" /> },
    DEFAULTED: { bg: "bg-red-200", text: "text-red-900", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const style = map[s] || { bg: "bg-gray-100", text: "text-gray-800", icon: <AlertCircle className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${style.bg} ${style.text}`}>
      {style.icon} {status}
    </span>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const SearchBar = ({ value, onChange, placeholder }: any) => (
  <div className="mb-4 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
  </div>
);

const FilterBtn = ({ label, active, onClick }: any) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
    {label}
  </button>
);

const Btn = ({ label, color, onClick, disabled }: any) => {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    gray: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${colors[color] || colors.gray} disabled:opacity-50`}>
      {label}
    </button>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

const Spinner = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
  </div>
);

const Empty = ({ icon: Icon, message }: any) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg">
    <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">{message}</p>
  </div>
);

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("customers");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [loanFilter, setLoanFilter] = useState<LoanFilter>("ALL");
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("ALL");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("ALL");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [depositData, setDepositData] = useState({ accountId: "", amount: "", description: "" });

  const [loanApproveModal, setLoanApproveModal] = useState<Loan | null>(null);
  const [loanApproveData, setLoanApproveData] = useState({ amount: "", months: "" });

  const [loanRejectModal, setLoanRejectModal] = useState<{ loanId: number } | null>(null);
  const [loanRejectReason, setLoanRejectReason] = useState("");

  const [accountRejectModal, setAccountRejectModal] = useState<{ accountId: number } | null>(null);
  const [accountRejectReason, setAccountRejectReason] = useState("");

  // Account transactions view
  const [viewingAccountTx, setViewingAccountTx] = useState<Account | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Repayment schedule per loan
  const [repaymentSchedules, setRepaymentSchedules] = useState<Record<number, Repayment[]>>({});
  const [loadingScheduleId, setLoadingScheduleId] = useState<number | null>(null);

  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<TicketStatusFilter>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // ----------------------------------------------------------------
  //  FETCH
  // ----------------------------------------------------------------
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cust, accs, loansData, ticketsData] = await Promise.all([
        userService.getAllCustomers(),
        accountService.getAll(),
        loanService.getAllLoans(),
        supportService.getAll({ assigned_to: Number(user?.id), status: ticketStatusFilter === "ALL" ? undefined : ticketStatusFilter }),
      ]);
      setCustomers(Array.isArray(cust) ? cust : []);
      setAccounts(Array.isArray(accs) ? accs : (accs as any)?.accounts || []);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData as any)?.tickets || []);
    } catch (err: any) {
      showMsg("error", "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const silentRefreshAll = async () => {
    try {
      const [custRes, accRes, loanRes, ticketRes] = await Promise.all([
        userService.getAllCustomers().catch(() => []),
        accountService.getAll().catch(() => []),
        loanService.getAllLoans().catch(() => []),
        supportService.getAll({ assigned_to: Number(user?.id) }).catch(() => []),
      ]);
      setCustomers(Array.isArray(custRes) ? custRes : (custRes as any).customers || []);
      setAccounts(Array.isArray(accRes) ? accRes : (accRes as any).accounts || []);
      setLoans(Array.isArray(loanRes) ? loanRes : (loanRes as any).loans || []);
      setTickets(Array.isArray(ticketRes) ? ticketRes : (ticketRes as any).tickets || []);
    } catch (_) { }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === "tickets") fetchAll(); }, [ticketStatusFilter]);

  // Load transactions for a specific account
  const loadAccountTransactions = async (account: Account) => {
    setViewingAccountTx(account);
    setTxLoading(true);
    try {
      const res = await api.get(`/transactions/account/${account.account_id}`);
      const txList = Array.isArray(res) ? res : (res as any).transactions || [];
      setAccountTransactions(txList);
    } catch {
      showMsg("error", "Failed to load transactions.");
    } finally {
      setTxLoading(false);
    }
  };

  const openTicket = async (ticketId: number) => {
    try { setSelectedTicket(await supportService.getById(ticketId) as any); }
    catch (err: any) { showMsg("error", err.message || "Failed to load ticket."); }
  };

  const refreshSelectedTicket = async () => {
    await fetchAll();
    if (selectedTicket) setSelectedTicket(await supportService.getById(selectedTicket.ticket_id) as any);
  };

  const handleTicketReply = async () => {
    if (!selectedTicket || !ticketReplyText.trim()) return;
    setTicketBusy(true);
    try {
      await supportService.reply(selectedTicket.ticket_id, ticketReplyText.trim());
      setTicketReplyText("");
      await refreshSelectedTicket();
    } catch (err: any) { showMsg("error", err.message || "Failed to send reply."); }
    finally { setTicketBusy(false); }
  };

  const handleTicketStatusChange = async (status: SupportTicket["status"]) => {
    if (!selectedTicket) return;
    setTicketBusy(true);
    try {
      await supportService.updateStatus(selectedTicket.ticket_id, status);
      showMsg("success", "Ticket status updated.");
      await refreshSelectedTicket();
    } catch (err: any) { showMsg("error", err.message || "Failed to update status."); }
    finally { setTicketBusy(false); }
  };

  const anyModalOpenStaff = showProfileModal || !!loanApproveModal || !!loanRejectModal || !!accountRejectModal || !!selectedTicket || !!viewingAccountTx;

  usePolling(silentRefreshAll, { intervalMs: 5000, paused: anyModalOpenStaff });

  // ----------------------------------------------------------------
  //  FILTERED DATA
  // ----------------------------------------------------------------
  const filteredCustomers = customers
    .filter(c => {
      if (customerFilter === "ALL") return true;
      if (customerFilter === "PENDING") return c.status === "PENDING" && !c.assigned_staff_id;
      if (customerFilter === "MY_CUSTOMERS") return c.assigned_staff_id === Number(user?.id);
      if (customerFilter === "ACTIVE") return c.assigned_staff_id === Number(user?.id) && c.status === "ACTIVE";
      if (customerFilter === "REJECTED") return c.assigned_staff_id === Number(user?.id) && c.status === "REJECTED";
      return true;
    })
    .filter(c =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );

  const filteredLoans = loans
    .filter(l => loanFilter === "ALL" || l.status === loanFilter)
    .filter(l => l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredAccounts = accounts
    .filter(a => accountFilter === "ALL" || a.status?.toUpperCase() === accountFilter)
    .filter(a =>
      a.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.account_number?.includes(searchTerm)
    );

  // Counts for badges
  const pendingCustomers = customers.filter(c =>
    c.status === "PENDING" && c.assigned_staff_id === Number(user?.id) && !c.staff_approval_status
  ).length;
  const pendingAccounts = accounts.filter(a => a.status === "PENDING").length;
  const pendingLoans = loans.filter(l => l.status === "PENDING" && !l.staff_approval_status).length;
  const openTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  // ----------------------------------------------------------------
  //  CUSTOMER ACTIONS
  // ----------------------------------------------------------------
  const handleApproveCustomer = async (customerId: number) => {
    try {
      await userService.approveCustomer(customerId);
      showMsg("success", "Customer approved at staff level. Awaiting admin final approval.");
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  const handleRejectCustomer = async (customerId: number) => {
    if (!rejectRemarks.trim()) return showMsg("error", "Please provide a rejection reason.");
    try {
      await userService.rejectCustomer(customerId, rejectRemarks);
      showMsg("success", "Customer rejected.");
      setRejectingId(null); setRejectRemarks("");
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  // ----------------------------------------------------------------
  //  ACCOUNT ACTIONS
  // ----------------------------------------------------------------
  const handleApproveAccount = async (accountId: number) => {
    try {
      await accountService.approve(accountId);
      showMsg("success", "Account approved.");
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  const handleRejectAccount = async () => {
    if (!accountRejectModal) return;
    try {
      await accountService.reject(accountRejectModal.accountId, accountRejectReason || undefined);
      showMsg("success", "Account rejected.");
      setAccountRejectModal(null);
      setAccountRejectReason("");
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  // ----------------------------------------------------------------
  //  LOAN ACTIONS
  // ----------------------------------------------------------------
  const handleApproveLoan = async () => {
    if (!loanApproveModal) return;
    const amount = parseFloat(loanApproveData.amount);
    const months = parseInt(loanApproveData.months);
    if (!amount || amount <= 0) return showMsg("error", "Enter a valid amount.");
    if (!months || months <= 0) return showMsg("error", "Enter valid duration.");
    try {
      await loanService.staffApproveLoan(loanApproveModal.loan_id, {
        approved_amount: amount,
        duration_months: months,
      });
      showMsg("success", "Loan approved at staff level. Awaiting admin approval.");
      setLoanApproveModal(null);
      setLoanApproveData({ amount: "", months: "" });
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  const handleRejectLoan = async () => {
    if (!loanRejectModal) return;
    if (!loanRejectReason.trim()) return showMsg("error", "Rejection reason is required.");
    try {
      await loanService.staffRejectLoan(loanRejectModal.loanId, loanRejectReason);
      showMsg("success", "Loan rejected.");
      setLoanRejectModal(null);
      setLoanRejectReason("");
      fetchAll();
    } catch (err: any) { showMsg("error", err.message || "Failed."); }
  };

  // ── REPAYMENT SCHEDULE ────────────────────────────────────────────
  const loadRepaymentSchedule = async (loanId: number) => {
    if (repaymentSchedules[loanId]) {
      setRepaymentSchedules(prev => { const next = { ...prev }; delete next[loanId]; return next; });
      return;
    }
    setLoadingScheduleId(loanId);
    try {
      const res = await api.get(`/loan-repayments/${loanId}/schedule`);
      const list: Repayment[] = Array.isArray(res) ? res : (res as any).schedule || (res as any).repayments || [];
      setRepaymentSchedules(prev => ({ ...prev, [loanId]: list }));
    } catch {
      showMsg("error", "Failed to load repayment schedule.");
    } finally {
      setLoadingScheduleId(null);
    }
  };

  // ----------------------------------------------------------------
  //  DEPOSIT
  // ----------------------------------------------------------------
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.depositMoney({
        accountId: parseInt(depositData.accountId),
        amount: parseFloat(depositData.amount),
        description: depositData.description,
      });
      showMsg("success", "Deposit successful!");
      setDepositData({ accountId: "", amount: "", description: "" });
      fetchAll();
    } catch (err: any) {
      showMsg("error", err.message || "Deposit failed.");
    } finally { setLoading(false); }
  };

  // ================================================================
  //  RENDER
  // ================================================================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name} •{" "}
                <span className="font-mono text-blue-600">ID: {user?.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                <User className="w-5 h-5" />
              </button>
              <button onClick={fetchAll}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => { logout(); navigate("/login"); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Pending Customers" value={pendingCustomers} icon={<Users className="w-7 h-7 text-yellow-500" />} />
          <StatCard label="Pending Accounts" value={pendingAccounts} icon={<CreditCard className="w-7 h-7 text-blue-500" />} />
          <StatCard label="Pending Loans" value={pendingLoans} icon={<FileText className="w-7 h-7 text-orange-500" />} />
          <StatCard label="My Customers" value={customers.filter(c => c.assigned_staff_id === Number(user?.id)).length} icon={<Building className="w-7 h-7 text-green-500" />} />
          <StatCard label="Open Tickets" value={openTicketsCount} icon={<MessageSquare className="w-7 h-7 text-purple-500" />} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              {([
                { id: "customers", label: "Customers", icon: Eye, badge: pendingCustomers },
                { id: "accounts", label: "Accounts", icon: CreditCard, badge: pendingAccounts },
                { id: "loans", label: "Loans", icon: FileText, badge: pendingLoans },
                { id: "deposit", label: "Deposit", icon: DollarSign, badge: undefined },
                { id: "tickets", label: "My Tickets", icon: MessageSquare, badge: openTicketsCount || undefined },
              ] satisfies { id: TabType; label: string; icon: React.ElementType; badge: number | undefined }[]).map(tab => (
                <button key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge ? (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ── CUSTOMERS TAB ── */}
            {activeTab === "customers" && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Customer Management</h2>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "PENDING", "MY_CUSTOMERS", "ACTIVE", "REJECTED"] as CustomerFilter[]).map(f => (
                      <FilterBtn key={f} label={f === "MY_CUSTOMERS" ? "My Customers" : f} active={customerFilter === f} onClick={() => setCustomerFilter(f)} />
                    ))}
                  </div>
                </div>

                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, email or phone..." />

                {loading ? <Spinner /> : filteredCustomers.length === 0 ? (
                  <Empty icon={UserCheck} message="No customers found" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Name", "Email", "Phone", "City", "Assigned Staff", "Status", "Staff Approval", "Actions"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map(c => (
                          <tr key={c.customer_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{c.full_name}</p>
                              <p className="text-xs text-gray-500">ID: {c.customer_id}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{c.phone}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{c.city || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {c.assigned_staff_name
                                ? <span className="inline-flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-500" />{c.assigned_staff_name}</span>
                                : <span className="text-xs text-gray-400 italic">Unassigned</span>}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                            <td className="px-4 py-3">
                              {c.staff_approval_status ? <StatusBadge status={c.staff_approval_status} /> : <span className="text-xs text-gray-400">Pending</span>}
                            </td>
                            <td className="px-4 py-3">
                              {(!c.assigned_staff_id || c.assigned_staff_id === Number(user?.id)) && c.status === "PENDING" && !c.staff_approval_status && (
                                <div className="flex flex-wrap gap-1">
                                  <Btn label="Approve" color="green" onClick={() => handleApproveCustomer(c.customer_id)} />
                                  {rejectingId === c.customer_id ? (
                                    <div className="flex gap-1 items-center">
                                      <input type="text" placeholder="Reason (required)" value={rejectRemarks}
                                        onChange={e => setRejectRemarks(e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-36" />
                                      <Btn label="Confirm" color="red" onClick={() => handleRejectCustomer(c.customer_id)} />
                                      <Btn label="Cancel" color="gray" onClick={() => { setRejectingId(null); setRejectRemarks(""); }} />
                                    </div>
                                  ) : (
                                    <Btn label="Reject" color="red" onClick={() => setRejectingId(c.customer_id)} />
                                  )}
                                </div>
                              )}
                              {c.staff_approval_status === "APPROVED" && c.status !== "ACTIVE" && c.admin_approval_status !== "APPROVED" && (
                                <span className="text-xs text-blue-600 font-medium">Awaiting Admin</span>
                              )}
                              {c.assigned_staff_id !== null && c.assigned_staff_id !== Number(user?.id) && (
                                <span className="text-xs text-gray-400">Not assigned to you</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── ACCOUNTS TAB ── */}
            {activeTab === "accounts" && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "PENDING", "ACTIVE", "FROZEN", "CLOSURE_PENDING", "CLOSED"] as AccountFilter[]).map(f => (
                      <FilterBtn key={f}
                        label={f === "CLOSURE_PENDING" ? "Closure Pending" : f}
                        active={accountFilter === f}
                        onClick={() => setAccountFilter(f)} />
                    ))}
                  </div>
                </div>

                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by customer or account number..." />

                {loading ? <Spinner /> : filteredAccounts.length === 0 ? (
                  <Empty icon={CreditCard} message="No accounts found" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Customer", "Account No.", "Type", "Balance", "Status", "Opened", "Closed", "Actions"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAccounts.map(a => (
                          <tr key={a.account_id} className={`hover:bg-gray-50 ${a.status === "FROZEN" ? "bg-blue-50" : a.status === "CLOSURE_PENDING" ? "bg-orange-50" : ""}`}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{a.customer_name}</p>
                              <p className="text-xs text-gray-400">{a.customer_email}</p>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-700">{a.account_number}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">{a.account_type}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(a.balance)}</td>
                            <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(a.opened_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{a.closed_date ? formatDate(a.closed_date) : "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {a.status === "PENDING" && (
                                  <>
                                    <Btn label="Approve" color="green" onClick={() => handleApproveAccount(a.account_id)} />
                                    <Btn label="Reject" color="red" onClick={() => { setAccountRejectModal({ accountId: a.account_id }); setAccountRejectReason(""); }} />
                                  </>
                                )}
                                {a.status === "ACTIVE" && (
                                  <>
                                    <Btn label="Deposit" color="blue"
                                      onClick={() => { setDepositData({ accountId: a.account_id.toString(), amount: "", description: "" }); setActiveTab("deposit"); }} />
                                    <Btn label="Transactions" color="gray"
                                      onClick={() => loadAccountTransactions(a)} />
                                  </>
                                )}
                                {a.status === "FROZEN" && (
                                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Frozen — Admin action required
                                  </span>
                                )}
                                {a.status === "CLOSURE_PENDING" && (
                                  <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Awaiting Admin Closure
                                  </span>
                                )}
                                {(a.status === "CLOSED" || a.status === "REJECTED") && (
                                  <Btn label="View Transactions" color="gray" onClick={() => loadAccountTransactions(a)} />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── LOANS TAB ── */}
            {activeTab === "loans" && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Loan Management</h2>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "PENDING", "ACTIVE", "REJECTED", "CLOSED"] as LoanFilter[]).map(f => (
                      <FilterBtn key={f} label={f} active={loanFilter === f} onClick={() => setLoanFilter(f)} />
                    ))}
                  </div>
                </div>

                {loading ? <Spinner /> : filteredLoans.length === 0 ? (
                  <Empty icon={FileText} message="No loans found" />
                ) : (
                  <div className="space-y-4">
                    {filteredLoans.map(loan => {
                      const schedule = repaymentSchedules[loan.loan_id];
                      const canViewSchedule = loan.status === "ACTIVE" || loan.status === "CLOSED";
                      const paidCount = schedule ? schedule.filter(r => r.status === "PAID").length : 0;
                      const overdueCount = schedule ? schedule.filter(r => r.status === "OVERDUE").length : 0;
                      const isTerminal = ["ACTIVE", "CLOSED", "DEFAULTED"].includes(loan.status?.toUpperCase());
                      const showAwaitingAdmin = !isTerminal && loan.staff_approval_status === "APPROVED" && loan.admin_approval_status?.toUpperCase() !== "APPROVED";

                      return (
                        <div key={loan.loan_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <StatusBadge status={loan.status} />
                                <span className="text-sm text-gray-500">Loan #{loan.loan_id}</span>
                                {loan.staff_approval_status && (
                                  <span className="text-xs text-gray-500">Staff: <StatusBadge status={loan.staff_approval_status} /></span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Info label="Customer" value={loan.customer_name} />
                                <Info label="Type" value={loan.loan_type} />
                                <Info label="Amount" value={formatCurrency(loan.loan_amount)} />
                                <Info label="Interest" value={`${loan.interest_rate}%`} />
                                <Info label="Duration" value={`${loan.duration_months} months`} />
                                {loan.approved_amount && (
                                  <Info label="Approved Amt" value={formatCurrency(loan.approved_amount)} />
                                )}
                                {/* Disbursement info — visible to staff */}
                                {loan.disbursed_amount && (
                                  <Info label="Disbursed" value={formatCurrency(loan.disbursed_amount)} />
                                )}
                                {loan.disbursed_at && (
                                  <Info label="Disbursed On" value={formatDate(loan.disbursed_at)} />
                                )}
                                {loan.start_date && (
                                  <Info label="Start Date" value={formatDate(loan.start_date)} />
                                )}
                                {loan.end_date && (
                                  <Info label="End Date" value={formatDate(loan.end_date)} />
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">Applied: {formatDate(loan.created_at)}</p>
                              {loan.staff_approval_remarks && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                                  Remarks: {loan.staff_approval_remarks}
                                </div>
                              )}
                              {loan.status === "CLOSED" && (
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-gray-500" /> Loan fully repaid and closed
                                </div>
                              )}
                              {loan.status === "DEFAULTED" && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Loan defaulted — contact customer immediately
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              {loan.status === "PENDING" && !loan.staff_approval_status && (
                                <div className="flex gap-2">
                                  <Btn label="Approve" color="green" onClick={() => { setLoanApproveModal(loan); setLoanApproveData({ amount: "", months: "" }); }} />
                                  <Btn label="Reject" color="red" onClick={() => { setLoanRejectModal({ loanId: loan.loan_id }); setLoanRejectReason(""); }} />
                                </div>
                              )}
                              {showAwaitingAdmin && (
                                <span className="text-xs text-blue-600 font-medium">Awaiting Admin</span>
                              )}
                            </div>
                          </div>

                          {/* Repayment timeline */}
                          {canViewSchedule && (
                            <div className="mt-4">
                              <button
                                onClick={() => loadRepaymentSchedule(loan.loan_id)}
                                disabled={loadingScheduleId === loan.loan_id}
                                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Repayment Timeline ({loan.duration_months} installments)</span>
                                  {schedule && (
                                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                                      {paidCount} paid{overdueCount > 0 ? ` • ${overdueCount} overdue` : ""}
                                    </span>
                                  )}
                                </div>
                                {loadingScheduleId === loan.loan_id
                                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                                  : schedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {schedule && schedule.length > 0 && (
                                <div className="mt-2 border rounded-xl overflow-hidden">
                                  <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b ${loan.auto_deduct ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                                    {loan.auto_deduct
                                      ? <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Auto-deduction ON</>
                                      : <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Manual payment</>}
                                  </div>
                                  <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-3 gap-2 text-center text-xs">
                                    <div><div className="text-gray-500">Paid</div><div className="font-bold text-green-600">{paidCount}/{schedule.length}</div></div>
                                    <div><div className="text-gray-500">Overdue</div><div className="font-bold text-red-600">{overdueCount}</div></div>
                                    <div>
                                      <div className="text-gray-500">Remaining</div>
                                      <div className="font-bold text-blue-600">
                                        PKR {schedule.filter(r => r.status !== "PAID").reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                                    {schedule.map(r => {
                                      const isPaid = r.status === "PAID";
                                      const isOverdue = r.status === "OVERDUE";
                                      return (
                                        <div key={r.repayment_id}
                                          className={`flex items-center gap-3 px-4 py-3 ${isPaid ? "bg-green-50" : isOverdue ? "bg-red-50" : "bg-white"}`}>
                                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isPaid ? "bg-green-500" : isOverdue ? "bg-red-500" : "bg-gray-300"}`} />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-medium text-gray-700">Installment #{r.installment_no}</span>
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPaid ? "bg-green-100 text-green-700" : isOverdue ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                {r.status}
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {isPaid
                                                ? <><span>Due: {formatDate(r.due_date)}</span>{r.paid_date && <span className="ml-2 text-green-600 font-medium">• Paid: {formatDate(r.paid_date)}</span>}</>
                                                : <span className={isOverdue ? "text-red-600 font-medium" : ""}>Due: {formatDate(r.due_date)}</span>}
                                            </div>
                                          </div>
                                          <div className={`text-sm font-bold flex-shrink-0 ${isPaid ? "text-green-600" : isOverdue ? "text-red-600" : "text-gray-900"}`}>
                                            {formatCurrency(r.amount)}
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

            {/* ── DEPOSIT TAB ── */}
            {activeTab === "deposit" && (
              <div className="max-w-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Deposit to Customer Account</h2>
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                    <select value={depositData.accountId}
                      onChange={e => setDepositData({ ...depositData, accountId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Select account...</option>
                      {accounts.filter(a => a.status === "ACTIVE").map(a => (
                        <option key={a.account_id} value={a.account_id}>
                          {a.customer_name} — {a.account_number} ({a.account_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                    <input type="number" min="1" step="0.01"
                      value={depositData.amount}
                      onChange={e => setDepositData({ ...depositData, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                    <input type="text"
                      value={depositData.description}
                      onChange={e => setDepositData({ ...depositData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Cash deposit" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                      {loading ? "Processing..." : "Confirm Deposit"}
                    </button>
                    <button type="button"
                      onClick={() => setDepositData({ accountId: "", amount: "", description: "" })}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TICKETS TAB ── */}
            {activeTab === "tickets" && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Support Tickets</h2>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatusFilter[]).map(f => (
                      <FilterBtn key={f} label={f === "IN_PROGRESS" ? "In Progress" : f} active={ticketStatusFilter === f} onClick={() => setTicketStatusFilter(f)} highlight={f === "OPEN"} />
                    ))}
                  </div>
                </div>

                {loading ? <Spinner /> : tickets.length === 0 ? (
                  <Empty icon={MessageSquare} message="No tickets assigned to you" />
                ) : (
                  <div className="space-y-3">
                    {tickets
                      .filter(t => ticketStatusFilter === "ALL" || t.status === ticketStatusFilter)
                      .map(ticket => {
                        const priorityColors: Record<string, string> = {
                          HIGH: "bg-red-100 text-red-700",
                          MEDIUM: "bg-yellow-100 text-yellow-700",
                          LOW: "bg-green-100 text-green-700",
                        };
                        const isOpen = ticket.status === "IN_PROGRESS";
                        return (
                          <div key={ticket.ticket_id}
                            className={`border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${isOpen ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}
                            onClick={() => openTicket(ticket.ticket_id)}>
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{ticket.subject}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[ticket.priority] || "bg-gray-100 text-gray-700"}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">Customer: {ticket.customer_name} • #{ticket.ticket_id} • {ticket.category}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.created_at)}</p>
                              </div>
                              <StatusBadge status={ticket.status} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── LOAN APPROVE MODAL ── */}
        {loanApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Approve Loan</h3>
              <p className="text-sm text-gray-500 mb-4">Review the application then enter your approved terms.</p>
              <div className="bg-gray-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3">
                <Info label="Customer" value={loanApproveModal.customer_name} />
                <Info label="Loan Type" value={loanApproveModal.loan_type} />
                <Info label="Applied Amount" value={formatCurrency(loanApproveModal.loan_amount)} />
                <Info label="Requested Duration" value={`${loanApproveModal.duration_months} months`} />
                <Info label="Interest Rate" value={`${loanApproveModal.interest_rate}%`} />
                <Info label="Applied On" value={formatDate(loanApproveModal.created_at)} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Amount (PKR)
                    <span className="text-gray-400 font-normal ml-1">— applied for {formatCurrency(loanApproveModal.loan_amount)}</span>
                  </label>
                  <input type="number" min="1" autoFocus
                    value={loanApproveData.amount}
                    onChange={e => setLoanApproveData(p => ({ ...p, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    placeholder={`Max: ${formatCurrency(loanApproveModal.loan_amount)}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (months)
                    <span className="text-gray-400 font-normal ml-1">— requested {loanApproveModal.duration_months} months</span>
                  </label>
                  <input type="number" min="1"
                    value={loanApproveData.months}
                    onChange={e => setLoanApproveData(p => ({ ...p, months: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    placeholder={`e.g. ${loanApproveModal.duration_months}`} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleApproveLoan} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">Confirm Approval</button>
                <button onClick={() => setLoanApproveModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── LOAN REJECT MODAL ── */}
        {loanRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Loan</h3>
              <p className="text-sm text-gray-500 mb-5">Provide a reason — the customer will see this.</p>
              <textarea autoFocus rows={3} value={loanRejectReason}
                onChange={e => setLoanRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="e.g. Insufficient income documentation..." />
              <div className="flex gap-3 mt-4">
                <button onClick={handleRejectLoan} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium">Confirm Rejection</button>
                <button onClick={() => setLoanRejectModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT REJECT MODAL ── */}
        {accountRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Account</h3>
              <p className="text-sm text-gray-500 mb-5">Reason is optional but helps the customer.</p>
              <textarea autoFocus rows={3} value={accountRejectReason}
                onChange={e => setAccountRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="e.g. Invalid documents submitted..." />
              <div className="flex gap-3 mt-4">
                <button onClick={handleRejectAccount} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium">Confirm Rejection</button>
                <button onClick={() => setAccountRejectModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TICKET DETAIL MODAL ── */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    #{selectedTicket.ticket_id} • {selectedTicket.category} • {selectedTicket.customer_name} • {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status controls */}
              <div className="px-5 py-3 bg-gray-50 border-b flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-gray-600">Status:</span>
                {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as SupportTicket["status"][]).map(s => (
                  <button key={s} disabled={ticketBusy || selectedTicket.status === s}
                    onClick={() => handleTicketStatusChange(s)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition ${selectedTicket.status === s ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"}`}>
                    {s === "IN_PROGRESS" ? "In Progress" : s}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div className="px-5 py-3 border-b bg-blue-50">
                <p className="text-xs font-medium text-blue-700 mb-1">Customer's issue:</p>
                <p className="text-sm text-gray-800">{selectedTicket.description}</p>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-4">No replies yet. Be the first to respond.</p>
                ) : selectedTicket.replies.map(r => {
                  const isStaff = r.sender_type === "STAFF";
                  const isAdmin = r.sender_type === "ADMIN";
                  return (
                    <div key={r.reply_id} className={`flex ${isStaff || isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isStaff ? "bg-blue-600 text-white rounded-br-sm" : isAdmin ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                        <p className={`text-xs font-medium mb-1 ${isStaff || isAdmin ? "text-blue-100" : "text-gray-500"}`}>
                          {r.sender_name || r.sender_type}
                        </p>
                        <p>{r.message}</p>
                        <p className={`text-xs mt-1 ${isStaff || isAdmin ? "text-blue-200" : "text-gray-400"}`}>{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply input */}
              {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                <div className="p-4 border-t flex gap-2">
                  <input
                    type="text"
                    value={ticketReplyText}
                    onChange={e => setTicketReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTicketReply(); } }}
                    placeholder="Type your reply..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    disabled={ticketBusy} />
                  <button onClick={handleTicketReply} disabled={ticketBusy || !ticketReplyText.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACCOUNT TRANSACTIONS MODAL ── */}
        {viewingAccountTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {viewingAccountTx.account_number} • {viewingAccountTx.account_type} • {viewingAccountTx.customer_name}
                  </p>
                </div>
                <button onClick={() => { setViewingAccountTx(null); setAccountTransactions([]); }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {txLoading ? <Spinner /> : accountTransactions.length === 0 ? (
                  <Empty icon={TrendingUp} message="No transactions found" />
                ) : (
                  <div className="space-y-3">
                    {accountTransactions.map((t: any) => {
                      const isCredit = t.direction === "CREDIT";
                      return (
                        <div key={t.transaction_id}
                          className={`border rounded-xl p-4 ${isCredit ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"} ${t.is_fraud ? "bg-red-50 border-red-200" : "bg-white"}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCredit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {isCredit ? "CREDIT" : "DEBIT"}
                                </span>
                                <span className="text-xs text-gray-400">{t.transaction_type}</span>
                                {t.is_fraud === 1 && (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> FRAUD FLAG
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800">{t.description || "Transaction"}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(t.transaction_time || t.created_at)}</p>
                            </div>
                            <span className={`text-base font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                              {isCredit ? "+" : "-"}PKR {Number(t.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}
        user={user} onProfileUpdate={fetchAll} />
    </div>
  );
}