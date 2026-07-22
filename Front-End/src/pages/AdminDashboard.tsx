import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/admin";
import { loanService } from "../services/loan";
import { api } from "../services/api";
import { usePolling } from "../hooks/usePolling";
import {
  UserCheck, Building, RefreshCw, LogOut, Search, Clock,
  AlertCircle, CheckCircle, XCircle, User as UserIcon,
  FileText, BarChart2, Plus, Shield, Edit2, Save, X,
  ChevronDown, ChevronUp, CreditCard, Calendar, ToggleLeft, ToggleRight,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import ProfileModal from "../components/ProfileModal";
import { navigate } from "../components/Router";
import { accountService } from "../services/account";

// ================================================================
//  TYPES
// ================================================================
interface StaffMember {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  created_at: string;
  last_login: string | null;
}

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
  staff_approved_at?: string;
  staff_name?: string;
}

interface DashboardStats {
  total_staff: number;
  pending_staff: number;
  active_staff: number;
  total_customers: number;
  pending_customers: number;
  active_customers: number;
  rejected_customers: number;
  suspended_customers: number;
  customers_awaiting_admin: number;
  total_accounts: number;
  pending_accounts: number;
  active_accounts: number;
  total_loans: number;
  pending_loans: number;
  active_loans: number;
  loans_awaiting_admin: number;
  open_fraud_flags: number;
  open_tickets: number;
  transactions_today: number;
  total_deposits: number;
}

interface LoanPolicy {
  policy_id: number;
  loan_type: string;
  min_amount: number;
  max_amount: number;
  min_months: number;
  max_months: number;
  interest_rate: number;
  is_active: boolean;
  created_at: string;
}

interface EditingPolicy {
  min_amount: string;
  max_amount: string;
  min_months: string;
  max_months: string;
  interest_rate: string;
}

interface Loan {
  loan_id: number;
  customer_id: number;
  account_id: number;
  policy_id: number;
  loan_amount: number;
  approved_amount: number | null;
  disbursed_amount: number | null;
  duration_months: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  auto_deduct: boolean;
  created_at: string;
  customer_name: string;
  assigned_staff_id: number | null;
  loan_type: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  min_months: number;
  max_months: number;
  staff_approval_status: string | null;
  staff_approval_remarks: string | null;
  admin_approval_status: string | null;
  admin_approval_remarks: string | null;
}

interface Repayment {
  repayment_id: number;
  loan_id: number;
  installment_no: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "FAILED";
  transaction_id: number | null;
}

type TabType = "overview" | "staff" | "customers" | "loans" | "loan-policies" | "accounts";
type StaffFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
type CustomerFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "AWAITING_ADMIN";
type LoanFilter = "AWAITING_ADMIN" | "ALL" | "PENDING" | "ACTIVE" | "REJECTED";

// ================================================================
//  HELPERS
// ================================================================
const formatDate = (d: string | null) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return "N/A"; }
};
const formatCurrency = (n: number) => `PKR ${Number(n).toLocaleString("en-PK")}`;

const getStatusBadge = (status: string = "") => {
  switch (status.toUpperCase()) {
    case "ACTIVE": return { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
    case "PENDING": return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <Clock className="w-3 h-3" /> };
    case "REJECTED": return { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> };
    case "SUSPENDED": return { bg: "bg-orange-100", text: "text-orange-800", icon: <AlertCircle className="w-3 h-3" /> };
    case "PAID": return { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
    case "OVERDUE": return { bg: "bg-red-100", text: "text-red-800", icon: <AlertCircle className="w-3 h-3" /> };
    case "FAILED": return { bg: "bg-red-100", text: "text-red-800", icon: <XCircle className="w-3 h-3" /> };
    case "FROZEN": return { bg: "bg-blue-100", text: "text-blue-800", icon: <AlertCircle className="w-3 h-3" /> };
    default: return { bg: "bg-gray-100", text: "text-gray-800", icon: <AlertCircle className="w-3 h-3" /> };
  }
};


// ================================================================
//  LOAN DETAIL MODAL
// ================================================================
function LoanDetailModal({
  loan,
  onClose,
  onApprove,
  onReject,
  onToggleAutoDeduct,
  showMsg,
}: {
  loan: Loan;
  onClose: () => void;
  onApprove: (loanId: number, remarks: string) => Promise<void>;
  onReject: (loanId: number, remarks: string) => Promise<void>;
  onToggleAutoDeduct: (loanId: number, current: boolean) => Promise<void>;
  showMsg: (type: "success" | "error", text: string) => void;
}) {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [repLoading, setRepLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const needsAdminApproval =
    loan.status === "PENDING" &&
    loan.staff_approval_status === "APPROVED" &&
    !loan.admin_approval_status;

  const loadSchedule = async () => {
    if (repayments.length > 0) { setShowSchedule(s => !s); return; }
    setRepLoading(true);
    try {
      const res = await api.get(`/loan-repayments/${loan.loan_id}/schedule`);
      const list = Array.isArray(res) ? res : (res as any).schedule || (res as any).repayments || [];
      setRepayments(list);
      setShowSchedule(true);
    } catch (e) { showMsg("error", "Failed to load repayment schedule."); }
    finally { setRepLoading(false); }
  };

  const handleApprove = async () => {
    setActing(true);
    try { await onApprove(loan.loan_id, remarks); onClose(); }
    catch { /* handled in parent */ }
    finally { setActing(false); }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) { showMsg("error", "Rejection reason is required."); return; }
    setActing(true);
    try { await onReject(loan.loan_id, rejectRemarks); onClose(); }
    catch { /* handled in parent */ }
    finally { setActing(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleAutoDeduct(loan.loan_id, loan.auto_deduct); }
    catch { /* handled in parent */ }
    finally { setToggling(false); }
  };

  const paidCount = repayments.filter(r => r.status === "PAID").length;
  const overdueCount = repayments.filter(r => r.status === "OVERDUE").length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{loan.loan_type} Loan #{loan.loan_id}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Customer: <span className="font-medium text-gray-700">{loan.customer_name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-xs text-blue-500 font-medium">Requested Amount</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(loan.loan_amount)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-xs text-green-500 font-medium">Approved Amount</p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {loan.approved_amount ? formatCurrency(loan.approved_amount) : "—"}
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Loan Type", value: loan.loan_type },
              { label: "Duration", value: `${loan.duration_months} months` },
              { label: "Interest Rate", value: `${loan.interest_rate}%` },
              { label: "Status", value: loan.status },
              { label: "Applied On", value: formatDate(loan.created_at) },
              { label: "Start Date", value: formatDate(loan.start_date) },
              { label: "End Date", value: formatDate(loan.end_date) },
              { label: "Account ID", value: `#${loan.account_id}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Approval trail */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Approval Trail</p>
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${loan.staff_approval_status === "APPROVED" ? "bg-green-50 text-green-700" :
              loan.staff_approval_status === "REJECTED" ? "bg-red-50 text-red-700" :
                "bg-yellow-50 text-yellow-700"
              }`}>
              <span className="font-medium">Staff:</span>
              {loan.staff_approval_status ?? "Pending"}
              {loan.staff_approval_remarks && ` — ${loan.staff_approval_remarks}`}
            </div>
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${loan.admin_approval_status === "APPROVED" ? "bg-green-50 text-green-700" :
              loan.admin_approval_status === "REJECTED" ? "bg-red-50 text-red-700" :
                "bg-yellow-50 text-yellow-700"
              }`}>
              <span className="font-medium">Admin:</span>
              {loan.admin_approval_status ?? "Pending"}
              {loan.admin_approval_remarks && ` — ${loan.admin_approval_remarks}`}
            </div>
          </div>

          {/* Auto-deduct toggle — only for ACTIVE loans */}
          {loan.status === "ACTIVE" && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
              <div>
                <p className="text-sm font-semibold text-gray-800">Auto-Deduction</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {loan.auto_deduct
                    ? "System deducts EMI automatically each month"
                    : "Customer pays manually each month"}
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${loan.auto_deduct
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  } disabled:opacity-50`}
              >
                {loan.auto_deduct
                  ? <><ToggleRight className="w-5 h-5" /> Auto ON</>
                  : <><ToggleLeft className="w-5 h-5" /> Manual</>}
              </button>
            </div>
          )}

          {/* Repayment schedule */}
          {loan.status === "ACTIVE" && (
            <div>
              {/* Interest summary panel — gives admin context on what each EMI consists of */}
              {(() => {
                const principal = loan.approved_amount || loan.loan_amount;
                const rate = loan.interest_rate;
                const months = loan.duration_months;
                if (!principal || !rate || !months) return null;
                const totalInterest = parseFloat(((principal * rate * (months / 12)) / 100).toFixed(2));
                const totalRepayment = parseFloat((principal + totalInterest).toFixed(2));
                const regularEMI = parseFloat((Math.floor((totalRepayment / months) * 100) / 100).toFixed(2));
                const lastEMI = parseFloat((totalRepayment - regularEMI * (months - 1)).toFixed(2));
                return (
                  <div className="mb-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
                    <p className="font-semibold text-indigo-800 mb-2">
                      EMI Breakdown — Simple Interest @ {rate}% p.a.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Principal:</span> <span className="font-medium">{formatCurrency(principal)}</span></div>
                      <div><span className="text-gray-500">Total Interest:</span> <span className="font-medium text-orange-600">{formatCurrency(totalInterest)}</span></div>
                      <div><span className="text-gray-500">Total Repayment:</span> <span className="font-medium">{formatCurrency(totalRepayment)}</span></div>
                      <div><span className="text-gray-500">Monthly EMI:</span> <span className="font-medium text-green-700">{formatCurrency(regularEMI)}</span></div>
                    </div>
                    {lastEMI !== regularEMI && (
                      <p className="text-xs text-gray-500 mt-1">* Last installment: {formatCurrency(lastEMI)} (rounding adjustment)</p>
                    )}
                  </div>
                );
              })()}
              <button
                onClick={loadSchedule}
                className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium text-sm"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Repayment Schedule ({loan.duration_months} installments)</span>
                  {repayments.length > 0 && (
                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                      {paidCount} paid {overdueCount > 0 && `• ${overdueCount} overdue`}
                    </span>
                  )}
                </div>
                {repLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSchedule && repayments.length > 0 && (
                <div className="mt-2 border rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["#", "Amount", "Due Date", "Paid Date", "Status"].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {repayments.map(r => {
                        const badge = getStatusBadge(r.status);
                        return (
                          <tr key={r.repayment_id} className={`${r.status === "OVERDUE" ? "bg-red-50" : r.status === "PAID" ? "bg-green-50" : ""}`}>
                            <td className="px-4 py-2 font-medium text-gray-700">{r.installment_no}</td>
                            <td className="px-4 py-2 text-gray-800">{formatCurrency(r.amount)}</td>
                            <td className="px-4 py-2 text-gray-600">{formatDate(r.due_date)}</td>
                            <td className="px-4 py-2 text-gray-600">{r.paid_date ? formatDate(r.paid_date) : "—"}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.bg} ${badge.text}`}>
                                {badge.icon}{r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Admin approval actions — only when awaiting admin */}
          {needsAdminApproval && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Admin Action Required</p>

              {/* Approve */}
              {!showReject && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={acting}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {acting ? "Approving…" : "Approve Loan"}
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {showReject && (
                <div className="space-y-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-medium text-red-700">Rejection Reason <span className="text-red-500">*</span></p>
                  <textarea
                    rows={3}
                    value={rejectRemarks}
                    onChange={e => setRejectRemarks(e.target.value)}
                    placeholder="Explain why this loan is being rejected..."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={acting}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {acting ? "Rejecting…" : "Confirm Rejection"}
                    </button>
                    <button
                      onClick={() => { setShowReject(false); setRejectRemarks(""); }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
//  MAIN COMPONENT
// ================================================================
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("ALL");
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("ALL");
  const [loanFilter, setLoanFilter] = useState<LoanFilter>("AWAITING_ADMIN");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loanPolicies, setLoanPolicies] = useState<LoanPolicy[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [closureActionLoading, setClosureActionLoading] = useState<number | null>(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>("ALL");
  const [freezeModal, setFreezeModal] = useState<{ account: any } | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Staff creation
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: "", email: "", password: "" });

  // Policy editing
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<EditingPolicy | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);




  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // ----------------------------------------------------------------
  // FETCH
  // ----------------------------------------------------------------
  const fetchStats = async () => { try { setStats(await adminService.getStats()); } catch (e) { console.error(e); } };
  const fetchStaff = async () => { try { setStaffList((await adminService.getAllStaff()) || []); } catch (e) { console.error(e); } };
  const fetchCustomers = async () => { try { setCustomers((await adminService.getAllCustomers()) || []); } catch (e) { console.error(e); } };
  const fetchLoanPolicies = async () => { try { setLoanPolicies((await adminService.getLoanPolicies()) || []); } catch (e) { console.error(e); } };

  const fetchLoans = async () => {
    try {
      const res = await api.get("/loans");
      const raw = Array.isArray(res) ? res : (res as any).loans || [];
      setLoans(raw);
    } catch (e) { console.error("fetchLoans", e); }
  };

  const fetchAllAccounts = async () => {
    try {
      const res = await accountService.getAllWithDetails();
      const list = Array.isArray(res) ? res : (res as any).accounts || [];
      setAllAccounts(list);
    } catch (e) { console.error("fetchAllAccounts", e); }
  };



  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchStaff(), fetchCustomers(), fetchLoanPolicies(), fetchLoans(), fetchAllAccounts()]);
    setLoading(false);
  };


  const silentFetchAll = async () => {
    await Promise.all([fetchStats(), fetchStaff(), fetchCustomers(), fetchLoanPolicies(), fetchLoans(), fetchAllAccounts()]);
  };

  // Pause polling when a modal is open (loan detail modal etc.)
  const anyModalOpen = !!selectedLoan || showCreateStaff || showProfileModal || !!editingPolicyId || !!freezeModal;

  usePolling(silentFetchAll, {
    intervalMs: 5000,
    paused: anyModalOpen,
  });

  // Keep the initial full-loading fetch:
  useEffect(() => { fetchAll(); }, []);


  // ----------------------------------------------------------------
  // FILTERED LISTS
  // ----------------------------------------------------------------
  const filteredStaff = staffList
    .filter(s => staffFilter === "ALL" || s.status === staffFilter)
    .filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredCustomers = customers
    .filter(c => {
      if (customerFilter === "ALL") return true;
      if (customerFilter === "AWAITING_ADMIN") return c.status === "PENDING" && c.staff_approved_at;
      return c.status === customerFilter;
    })
    .filter(c =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );

  const filteredLoans = loans.filter(l => {
    if (loanFilter === "AWAITING_ADMIN")
      return l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status;
    if (loanFilter === "ALL") return true;
    return l.status === loanFilter;
  }).filter(l =>
    l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.loan_id).includes(searchTerm)
  );

  const awaitingAdminCount = loans.filter(
    l => l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status
  ).length;

  const closurePendingCount = allAccounts.filter(a => a.status === "CLOSURE_PENDING").length;

  const filteredAccounts = allAccounts
    .filter(a => accountStatusFilter === "ALL" || a.status === accountStatusFilter)
    .filter(a =>
      a.account_number?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.customer_name?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      a.customer_email?.toLowerCase().includes(accountSearch.toLowerCase())
    );

  // ----------------------------------------------------------------
  // STAFF ACTIONS
  // ----------------------------------------------------------------
  const handleCreateStaff = async () => {
    if (!newStaff.fullName || !newStaff.email || !newStaff.password)
      return showMsg("error", "All fields are required.");
    try {
      await adminService.createStaff(newStaff);
      showMsg("success", "Staff account created.");
      setShowCreateStaff(false); setNewStaff({ fullName: "", email: "", password: "" });
      fetchStaff(); fetchStats();
    } catch (e: any) { showMsg("error", e.message); }
  };
  const handleApproveStaff = async (id: number) => { try { await adminService.approveStaff(id); showMsg("success", "Staff approved."); fetchStaff(); fetchStats(); } catch (e: any) { showMsg("error", e.message); } };
  const handleRejectStaff = async (id: number) => { try { await adminService.rejectStaff(id, rejectRemarks); showMsg("success", "Staff rejected."); setRejectingId(null); setRejectRemarks(""); fetchStaff(); fetchStats(); } catch (e: any) { showMsg("error", e.message); } };
  const handleSuspendStaff = async (id: number) => { try { await adminService.suspendStaff(id); showMsg("success", "Staff suspended."); fetchStaff(); } catch (e: any) { showMsg("error", e.message); } };
  const handleReactivateStaff = async (id: number) => { try { await adminService.reactivateStaff(id); showMsg("success", "Staff reactivated."); fetchStaff(); } catch (e: any) { showMsg("error", e.message); } };

  // ----------------------------------------------------------------
  // CUSTOMER ACTIONS
  // ----------------------------------------------------------------
  const handleApproveCustomer = async (id: number) => { try { await adminService.approveCustomer(id); showMsg("success", "Customer approved."); fetchCustomers(); fetchStats(); } catch (e: any) { showMsg("error", e.message); } };
  const handleRejectCustomer = async (id: number) => { try { await adminService.rejectCustomer(id, rejectRemarks); showMsg("success", "Customer rejected."); setRejectingId(null); setRejectRemarks(""); fetchCustomers(); fetchStats(); } catch (e: any) { showMsg("error", e.message); } };
  const handleSuspendCustomer = async (id: number) => { try { await adminService.suspendCustomer(id); showMsg("success", "Customer suspended."); fetchCustomers(); } catch (e: any) { showMsg("error", e.message); } };
  const handleReactivateCustomer = async (id: number) => { try { await adminService.reactivateCustomer(id); showMsg("success", "Customer reactivated."); fetchCustomers(); } catch (e: any) { showMsg("error", e.message); } };

  // ----------------------------------------------------------------
  // LOAN ACTIONS
  // ----------------------------------------------------------------
  const handleAdminApproveLoan = async (loanId: number, remarks: string) => {
    try {
      await loanService.adminApproveLoan(loanId, { approved_amount: 0, duration_months: 0, remarks } as any);
      showMsg("success", "Loan approved and activated.");
      fetchLoans(); fetchStats();
    } catch (e: any) { showMsg("error", e.message || "Failed to approve loan."); throw e; }
  };

  const handleAdminRejectLoan = async (loanId: number, remarks: string) => {
    try {
      await loanService.adminRejectLoan(loanId, remarks);
      showMsg("success", "Loan rejected.");
      fetchLoans(); fetchStats();
    } catch (e: any) { showMsg("error", e.message || "Failed to reject loan."); throw e; }
  };

  const handleToggleAutoDeduct = async (loanId: number, current: boolean) => {
    try {
      await api.put(`/loans/${loanId}/toggle-auto-deduct`, { auto_deduct: !current });
      showMsg("success", `Auto-deduction ${!current ? "enabled" : "disabled"}.`);
      // Update loan in state immediately
      setLoans(prev => prev.map(l => l.loan_id === loanId ? { ...l, auto_deduct: !current } : l));
      if (selectedLoan?.loan_id === loanId)
        setSelectedLoan(prev => prev ? { ...prev, auto_deduct: !current } : prev);
    } catch (e: any) { showMsg("error", e.message || "Failed to toggle auto-deduction."); throw e; }
  };

  const handleApproveClosure = async (accountId: number) => {
    setClosureActionLoading(accountId);
    try {
      await accountService.approveClosure(accountId);
      showMsg("success", "Account closed successfully.");
      fetchAllAccounts();
      fetchStats();
    } catch (e: any) {
      showMsg("error", e.response?.data?.message || e.message || "Failed to close account.");
    } finally {
      setClosureActionLoading(null);
    }
  };

  const handleFreezeAccount = async () => {
    if (!freezeModal) return;
    if (!freezeReason.trim()) return showMsg("error", "Freeze reason is required.");
    setFreezeLoading(true);
    try {
      await accountService.freeze(freezeModal.account.account_id, freezeReason);
      showMsg("success", `Account ${freezeModal.account.account_number} frozen.`);
      setFreezeModal(null);
      setFreezeReason("");
      fetchAllAccounts();
    } catch (e: any) {
      showMsg("error", e.response?.data?.message || "Failed to freeze account.");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleUnfreezeAccount = async (accountId: number) => {
    try {
      await accountService.unfreeze(accountId);
      showMsg("success", "Account unfrozen successfully.");
      fetchAllAccounts();
    } catch (e: any) {
      showMsg("error", e.response?.data?.message || "Failed to unfreeze account.");
    }
  };

  // ----------------------------------------------------------------
  // POLICY ACTIONS
  // ----------------------------------------------------------------
  const handleTogglePolicy = async (policyId: number) => {
    try { await adminService.toggleLoanPolicy(policyId); showMsg("success", "Policy status updated."); fetchLoanPolicies(); }
    catch (e: any) { showMsg("error", e.message || "Failed."); }
  };
  const startEditing = (p: LoanPolicy) => { setEditingPolicyId(p.policy_id); setEditingValues({ min_amount: String(p.min_amount), max_amount: String(p.max_amount), min_months: String(p.min_months), max_months: String(p.max_months), interest_rate: String(p.interest_rate) }); };
  const cancelEditing = () => { setEditingPolicyId(null); setEditingValues(null); };
  const savePolicy = async (policyId: number) => {
    if (!editingValues) return;
    setSavingPolicy(true);
    try {
      await adminService.updateLoanPolicy(policyId, { min_amount: parseFloat(editingValues.min_amount), max_amount: parseFloat(editingValues.max_amount), min_months: parseInt(editingValues.min_months), max_months: parseInt(editingValues.max_months), interest_rate: parseFloat(editingValues.interest_rate) });
      showMsg("success", "Policy updated."); setEditingPolicyId(null); setEditingValues(null); fetchLoanPolicies();
    } catch (e: any) { showMsg("error", e.message || "Failed to update policy."); }
    finally { setSavingPolicy(false); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // ================================================================
  //  RENDER
  // ================================================================
  return (
    <div className="min-h-screen bg-gray-50">

      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name} • <span className="font-mono text-blue-600">ID: {user?.id}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button onClick={() => setShowProfileModal(true)} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"><UserIcon className="w-5 h-5" /></button>
              <button onClick={fetchAll} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"><RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} /></button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              {([
                { id: "overview", label: "Overview", icon: BarChart2, badge: undefined },
                { id: "staff", label: "Staff", icon: Shield, badge: stats?.pending_staff },
                { id: "customers", label: "Customers", icon: Building, badge: stats?.customers_awaiting_admin },
                { id: "loans", label: "Loans", icon: CreditCard, badge: awaitingAdminCount || undefined },
                { id: "loan-policies", label: "Loan Policies", icon: FileText, badge: undefined },
                { id: "accounts", label: "Accounts", icon: CreditCard, badge: closurePendingCount || undefined },
              ] satisfies { id: TabType; label: string; icon: React.ElementType; badge: number | undefined }[]).map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge ? <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && stats && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Staff" value={stats.total_staff} sub={`${stats.pending_staff} pending`} color="blue" />
                  <StatCard label="Total Customers" value={stats.total_customers} sub={`${stats.active_customers} active`} color="green" />
                  <StatCard label="Total Accounts" value={stats.total_accounts} sub={`${stats.pending_accounts} pending`} color="purple" />
                  <StatCard label="Total Loans" value={stats.total_loans} sub={`${stats.active_loans} active`} color="yellow" />
                  <StatCard label="Awaiting Admin" value={stats.customers_awaiting_admin} sub="customers" color="orange" />
                  <StatCard label="Loans Awaiting" value={stats.loans_awaiting_admin} sub="admin approval" color="orange" />
                  <StatCard label="Fraud Flags" value={stats.open_fraud_flags} sub="open" color="red" />
                  <StatCard label="Support Tickets" value={stats.open_tickets} sub="open" color="red" />
                  <StatCard label="Today Transactions" value={stats.transactions_today} sub="completed" color="blue" />
                  <StatCard label="Total Deposits" value={formatCurrency(stats.total_deposits)} sub="across all accounts" color="green" isText />
                </div>
              </div>
            )}

            {/* ── STAFF ── */}
            {activeTab === "staff" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
                  <button onClick={() => setShowCreateStaff(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Create Staff
                  </button>
                </div>
                {showCreateStaff && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-3">New Staff Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" placeholder="Full Name" value={newStaff.fullName} onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input type="email" placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      <input type="password" placeholder="Temporary Password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleCreateStaff} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create</button>
                      <button onClick={() => setShowCreateStaff(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(["ALL", "PENDING", "ACTIVE", "REJECTED", "SUSPENDED"] as StaffFilter[]).map(f => (
                    <FilterBtn key={f} label={f} active={staffFilter === f} onClick={() => setStaffFilter(f)} />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                {filteredStaff.length === 0 ? <EmptyState icon={UserCheck} message="No staff found" /> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>{["Name", "Email", "Status", "Created", "Last Login", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStaff.map(s => {
                          const badge = getStatusBadge(s.status);
                          return (
                            <tr key={s.user_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3"><p className="text-sm font-medium">{s.full_name}</p><p className="text-xs text-gray-400">ID: {s.user_id}</p></td>
                              <td className="px-4 py-3 text-sm text-gray-500">{s.email}</td>
                              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>{badge.icon} {s.status}</span></td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.last_login)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {s.status === "PENDING" && (<>
                                    <ActionBtn label="Approve" color="green" onClick={() => handleApproveStaff(s.user_id)} />
                                    {rejectingId === s.user_id ? (
                                      <div className="flex gap-1">
                                        <input type="text" placeholder="Reason" value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
                                        <ActionBtn label="Confirm" color="red" onClick={() => handleRejectStaff(s.user_id)} />
                                        <ActionBtn label="Cancel" color="gray" onClick={() => setRejectingId(null)} />
                                      </div>
                                    ) : <ActionBtn label="Reject" color="red" onClick={() => setRejectingId(s.user_id)} />}
                                  </>)}
                                  {s.status === "ACTIVE" && <ActionBtn label="Suspend" color="orange" onClick={() => handleSuspendStaff(s.user_id)} />}
                                  {s.status === "SUSPENDED" && <ActionBtn label="Reactivate" color="green" onClick={() => handleReactivateStaff(s.user_id)} />}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── CUSTOMERS ── */}
            {activeTab === "customers" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Management</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(["ALL", "PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "AWAITING_ADMIN"] as CustomerFilter[]).map(f => (
                    <FilterBtn key={f} label={f === "AWAITING_ADMIN" ? "Awaiting Admin" : f} active={customerFilter === f} onClick={() => setCustomerFilter(f)} highlight={f === "AWAITING_ADMIN"} />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                {filteredCustomers.length === 0 ? <EmptyState icon={Building} message="No customers found" /> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>{["Name", "Contact", "Location", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map(c => {
                          const badge = getStatusBadge(c.status);
                          const needsAdminApproval = c.status === "PENDING" && !!c.staff_approved_at;
                          return (
                            <tr key={c.customer_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3"><p className="text-sm font-medium">{c.full_name}</p><p className="text-xs text-gray-400">ID: {c.customer_id}</p></td>
                              <td className="px-4 py-3"><p className="text-sm text-gray-500">{c.email}</p><p className="text-xs text-gray-400">{c.phone}</p></td>
                              <td className="px-4 py-3 text-sm text-gray-500">{c.city ? `${c.city}, ` : ""}{c.country}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full w-fit ${badge.bg} ${badge.text}`}>{badge.icon} {c.status}</span>
                                  {needsAdminApproval && <span className="text-xs text-yellow-700 font-medium">⚠ Needs Admin Approval</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {needsAdminApproval && (<>
                                    <ActionBtn label="Approve" color="green" onClick={() => handleApproveCustomer(c.customer_id)} />
                                    {rejectingId === c.customer_id ? (
                                      <div className="flex gap-1">
                                        <input type="text" placeholder="Reason" value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs w-28" />
                                        <ActionBtn label="Confirm" color="red" onClick={() => handleRejectCustomer(c.customer_id)} />
                                        <ActionBtn label="Cancel" color="gray" onClick={() => setRejectingId(null)} />
                                      </div>
                                    ) : <ActionBtn label="Reject" color="red" onClick={() => setRejectingId(c.customer_id)} />}
                                  </>)}
                                  {c.status === "ACTIVE" && <ActionBtn label="Suspend" color="orange" onClick={() => handleSuspendCustomer(c.customer_id)} />}
                                  {c.status === "SUSPENDED" && <ActionBtn label="Reactivate" color="green" onClick={() => handleReactivateCustomer(c.customer_id)} />}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── LOANS TAB ── */}
            {activeTab === "loans" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Loan Management</h2>
                  {awaitingAdminCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">
                      {awaitingAdminCount} awaiting your approval
                    </span>
                  )}
                </div>

                {/* Filters + Search */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {([
                    { key: "AWAITING_ADMIN", label: "Awaiting Admin" },
                    { key: "ALL", label: "All" },
                    { key: "PENDING", label: "Pending" },
                    { key: "ACTIVE", label: "Active" },
                    { key: "REJECTED", label: "Rejected" },
                  ] as { key: LoanFilter; label: string }[]).map(f => (
                    <FilterBtn key={f.key} label={f.label} active={loanFilter === f.key}
                      onClick={() => setLoanFilter(f.key)}
                      highlight={f.key === "AWAITING_ADMIN"} />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search by customer or loan ID..." value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64" />
                  </div>
                </div>

                {filteredLoans.length === 0 ? (
                  <EmptyState icon={FileText} message={loanFilter === "AWAITING_ADMIN" ? "No loans awaiting admin approval" : "No loans found"} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Loan ID", "Customer", "Type", "Amount", "Duration", "Status", "Staff", "Admin", "Auto-Deduct", "Actions"].map(h => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLoans.map(l => {
                          const statusBadge = getStatusBadge(l.status);
                          const staffBadge = getStatusBadge(l.staff_approval_status || "PENDING");
                          const adminBadge = getStatusBadge(l.admin_approval_status || "PENDING");
                          const isAwaiting = l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status;
                          return (
                            <tr key={l.loan_id} className={`hover:bg-gray-50 ${isAwaiting ? "bg-yellow-50" : ""}`}>
                              <td className="px-3 py-3 text-sm font-mono text-gray-700">#{l.loan_id}</td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-medium text-gray-900">{l.customer_name}</p>
                                <p className="text-xs text-gray-400">ID: {l.customer_id}</p>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-700 font-medium">{l.loan_type}</td>
                              <td className="px-3 py-3 text-sm text-gray-800 font-semibold whitespace-nowrap">{formatCurrency(l.loan_amount)}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{l.duration_months}m</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                                  {statusBadge.icon} {l.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${staffBadge.bg} ${staffBadge.text}`}>
                                  {staffBadge.icon} {l.staff_approval_status || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${adminBadge.bg} ${adminBadge.text}`}>
                                  {adminBadge.icon} {l.admin_approval_status || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${l.auto_deduct ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {l.auto_deduct ? "Auto" : "Manual"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  onClick={() => setSelectedLoan(l)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition whitespace-nowrap"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── LOAN POLICIES ── */}
            {activeTab === "loan-policies" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Policies</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>{["Type", "Min Amount (PKR)", "Max Amount (PKR)", "Min Months", "Max Months", "Interest Rate (%)", "Status", "Actions"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loanPolicies.map(p => {
                        const isEditing = editingPolicyId === p.policy_id;
                        return (
                          <tr key={p.policy_id} className={`hover:bg-gray-50 ${isEditing ? "bg-blue-50" : ""}`}>
                            <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{p.loan_type}</td>
                            {isEditing && editingValues ? (
                              <>
                                <td className="px-3 py-3"><input type="number" value={editingValues.min_amount} onChange={e => setEditingValues({ ...editingValues, min_amount: e.target.value })} className="w-28 border border-blue-300 rounded px-2 py-1 text-sm" /></td>
                                <td className="px-3 py-3"><input type="number" value={editingValues.max_amount} onChange={e => setEditingValues({ ...editingValues, max_amount: e.target.value })} className="w-32 border border-blue-300 rounded px-2 py-1 text-sm" /></td>
                                <td className="px-3 py-3"><input type="number" value={editingValues.min_months} onChange={e => setEditingValues({ ...editingValues, min_months: e.target.value })} className="w-20 border border-blue-300 rounded px-2 py-1 text-sm" /></td>
                                <td className="px-3 py-3"><input type="number" value={editingValues.max_months} onChange={e => setEditingValues({ ...editingValues, max_months: e.target.value })} className="w-20 border border-blue-300 rounded px-2 py-1 text-sm" /></td>
                                <td className="px-3 py-3"><input type="number" step="0.01" value={editingValues.interest_rate} onChange={e => setEditingValues({ ...editingValues, interest_rate: e.target.value })} className="w-20 border border-blue-300 rounded px-2 py-1 text-sm" /></td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-3 text-sm text-gray-600">{formatCurrency(p.min_amount)}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{formatCurrency(p.max_amount)}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{p.min_months}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{p.max_months}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{p.interest_rate}%</td>
                              </>
                            )}
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                {p.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => savePolicy(p.policy_id)} disabled={savingPolicy}
                                      className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                                      <Save className="w-3 h-3" /> {savingPolicy ? "Saving…" : "Save"}
                                    </button>
                                    <button onClick={cancelEditing} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing(p)} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100">
                                      <Edit2 className="w-3 h-3" /> Edit
                                    </button>
                                    <ActionBtn label={p.is_active ? "Deactivate" : "Activate"} color={p.is_active ? "orange" : "green"} onClick={() => handleTogglePolicy(p.policy_id)} />
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ACCOUNTS TAB ── */}
            {activeTab === "accounts" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">All Accounts</h2>
                  {closurePendingCount > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">
                      {closurePendingCount} pending closure
                    </span>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {["ALL", "ACTIVE", "FROZEN", "PENDING", "CLOSURE_PENDING", "CLOSED", "REJECTED"].map(f => (
                    <FilterBtn
                      key={f}
                      label={f === "CLOSURE_PENDING" ? "Closure Pending" : f}
                      active={accountStatusFilter === f}
                      onClick={() => setAccountStatusFilter(f)}
                      highlight={f === "CLOSURE_PENDING"}
                    />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by account, customer..."
                      value={accountSearch}
                      onChange={e => setAccountSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
                    />
                  </div>
                </div>

                {filteredAccounts.length === 0 ? (
                  <EmptyState icon={CreditCard} message="No accounts found" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Account No.", "Customer", "Assigned Staff", "Type", "Balance", "Status", "Opened", "Closed", "Actions"].map(h => (
                            <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAccounts.map(account => {
                          const badge = getStatusBadge(account.status);
                          const isClosure = account.status === "CLOSURE_PENDING";
                          return (
                            <tr key={account.account_id} className={`hover:bg-gray-50 ${isClosure ? "bg-orange-50" : ""}`}>
                              <td className="px-3 py-3 text-sm font-mono text-gray-700">{account.account_number}</td>
                              <td className="px-3 py-3">
                                <p className="text-sm font-medium text-gray-900">{account.customer_name}</p>
                                <p className="text-xs text-gray-400">{account.customer_email}</p>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-sm text-gray-700">{account.assigned_staff_name || "—"}</p>
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {account.account_type}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                                {formatCurrency(account.balance)}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>
                                  {badge.icon}{account.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(account.opened_date)}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                                {account.closed_date ? formatDate(account.closed_date) : "—"}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {account.status === "ACTIVE" && (
                                    <ActionBtn
                                      label="Freeze"
                                      color="orange"
                                      onClick={() => setFreezeModal({ account })}
                                    />
                                  )}
                                  {account.status === "FROZEN" && (
                                    <ActionBtn
                                      label="Unfreeze"
                                      color="green"
                                      onClick={() => handleUnfreezeAccount(account.account_id)}
                                    />
                                  )}
                                  {account.status === "CLOSURE_PENDING" && (
                                    <ActionBtn
                                      label={closureActionLoading === account.account_id ? "Processing..." : "Approve Closure"}
                                      color="red"
                                      onClick={() => handleApproveClosure(account.account_id)}
                                    />
                                  )}
                                  {!["ACTIVE", "FROZEN", "CLOSURE_PENDING"].includes(account.status) && (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} onProfileUpdate={fetchAll} />

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onApprove={handleAdminApproveLoan}
          onReject={handleAdminRejectLoan}
          onToggleAutoDeduct={handleToggleAutoDeduct}
          showMsg={showMsg}
        />
      )}

      {/* ── FREEZE ACCOUNT MODAL ── */}
      {freezeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Freeze Account</h3>
                <p className="text-sm text-gray-500">{freezeModal.account.account_number}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span className="text-gray-500">Customer:</span> <span className="font-medium">{freezeModal.account.customer_name}</span></p>
              <p><span className="text-gray-500">Type:</span> <span className="font-medium">{freezeModal.account.account_type}</span></p>
              <p><span className="text-gray-500">Balance:</span> <span className="font-medium">{formatCurrency(freezeModal.account.balance)}</span></p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-orange-800 font-medium mb-1">What freezing does:</p>
              <p className="text-xs text-orange-700">Blocks all withdrawals and transfers on this account. The customer will be notified. Balance is preserved. You can unfreeze at any time.</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for freezing <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={freezeReason}
                onChange={e => setFreezeReason(e.target.value)}
                placeholder="e.g. Suspicious transaction activity, AML hold, customer request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleFreezeAccount}
                disabled={freezeLoading}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-60"
              >
                {freezeLoading ? "Freezing..." : "Confirm Freeze"}
              </button>
              <button
                onClick={() => { setFreezeModal(null); setFreezeReason(""); }}
                disabled={freezeLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ================================================================
//  HELPER COMPONENTS
// ================================================================
const StatCard = ({ label, value, sub, color, isText }: any) => {
  const colors: Record<string, string> = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600", yellow: "text-yellow-600", orange: "text-orange-600", red: "text-red-600" };
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color] || "text-gray-900"} ${isText ? "text-base" : ""}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
};

const FilterBtn = ({ label, active, onClick, highlight }: any) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? (highlight ? "bg-yellow-500 text-white" : "bg-blue-600 text-white") : (highlight ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}`}>
    {label}
  </button>
);

const ActionBtn = ({ label, color, onClick }: any) => {
  const colors: Record<string, string> = { green: "text-green-700 bg-green-50 hover:bg-green-100", red: "text-red-700 bg-red-50 hover:bg-red-100", orange: "text-orange-700 bg-orange-50 hover:bg-orange-100", gray: "text-gray-700 bg-gray-100 hover:bg-gray-200" };
  return <button onClick={onClick} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${colors[color] || colors.gray}`}>{label}</button>;
};

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg">
    <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">{message}</p>
  </div>
);