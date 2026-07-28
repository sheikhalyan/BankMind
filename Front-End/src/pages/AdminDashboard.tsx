import React, { useState, useEffect, useCallback } from "react";
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
  TrendingUp, Users, DollarSign, Activity, ShieldAlert, Banknote,
  Eye, Lock, Unlock, MessageSquare, Send,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import ProfileModal from "../components/ProfileModal";
import { navigate } from "../components/Router";
import { accountService } from "../services/account";
import { supportService } from "../services/support";

// ================================================================
//  TYPES
// ================================================================
interface StaffMember {
  user_id: number; full_name: string; email: string;
  role: string; status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  created_at: string; last_login: string | null;
}
interface Customer {
  customer_id: number; full_name: string; email: string; phone: string;
  city: string | null; country: string;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  created_at: string; assigned_staff_id: number | null;
  assigned_staff_name: string | null; staff_approved_at?: string; staff_name?: string;
}
interface DashboardStats {
  total_staff: number; pending_staff: number; active_staff: number;
  total_customers: number; pending_customers: number; active_customers: number;
  rejected_customers: number; suspended_customers: number; customers_awaiting_admin: number;
  total_accounts: number; pending_accounts: number; active_accounts: number;
  total_loans: number; pending_loans: number; active_loans: number;
  loans_awaiting_admin: number; open_fraud_flags: number; open_tickets: number;
  in_progress_tickets: number; transactions_today: number; total_deposits: number;
}
interface LoanPolicy {
  policy_id: number; loan_type: string; min_amount: number; max_amount: number;
  min_months: number; max_months: number; interest_rate: number;
  is_active: boolean; created_at: string;
}
interface EditingPolicy {
  min_amount: string; max_amount: string; min_months: string;
  max_months: string; interest_rate: string;
}
interface Loan {
  loan_id: number; customer_id: number; account_id: number; policy_id: number;
  loan_amount: number; approved_amount: number | null; disbursed_amount: number | null;
  duration_months: number; start_date: string | null; end_date: string | null;
  status: string; auto_deduct: boolean; created_at: string; customer_name: string;
  assigned_staff_id: number | null; loan_type: string; interest_rate: number;
  min_amount: number; max_amount: number; min_months: number; max_months: number;
  staff_approval_status: string | null; staff_approval_remarks: string | null;
  admin_approval_status: string | null; admin_approval_remarks: string | null;
}
interface Repayment {
  repayment_id: number; loan_id: number; installment_no: number; amount: number;
  due_date: string; paid_date: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "FAILED"; transaction_id: number | null;
}
interface FraudLog {
  fraud_id: number; transaction_id: number; fraud_score: number; fraud_type: string;
  action_taken: string; reviewed_by: number | null; resolved_at: string | null;
  detected_at: string; amount: number; transaction_type: string;
  from_account: string | null; to_account: string | null;
  customer_name?: string; account_number?: string;
}
interface TicketReply {
  reply_id: number; ticket_id: number; sender_id: number;
  sender_type: "CUSTOMER" | "STAFF" | "ADMIN"; sender_name?: string;
  message: string; created_at: string;
}
interface SupportTicket {
  ticket_id: number; customer_id: number; customer_name: string;
  assigned_to: number | null; assigned_to_name: string | null;
  subject: string; description: string;
  category: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string; resolved_at: string | null;
  replies?: TicketReply[];
}

type TabType = "overview" | "staff" | "customers" | "loans" | "loan-policies" | "accounts" | "fraud" | "tickets";
type StaffFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
type CustomerFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "AWAITING_ADMIN";
type LoanFilter = "AWAITING_ADMIN" | "ALL" | "PENDING" | "ACTIVE" | "REJECTED";
type TicketStatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

// ================================================================
//  HELPERS
// ================================================================
const formatDate = (d: string | null) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return "N/A"; }
};
const formatDateTime = (d: string | null) => {
  if (!d) return "N/A";
  try { return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
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
    case "FROZEN": return { bg: "bg-blue-100", text: "text-blue-800", icon: <Lock className="w-3 h-3" /> };
    case "FLAGGED": return { bg: "bg-red-100", text: "text-red-800", icon: <ShieldAlert className="w-3 h-3" /> };
    case "CLEARED": return { bg: "bg-green-100", text: "text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
    case "BLOCKED": return { bg: "bg-gray-100", text: "text-gray-800", icon: <XCircle className="w-3 h-3" /> };
    default: return { bg: "bg-gray-100", text: "text-gray-800", icon: <AlertCircle className="w-3 h-3" /> };
  }
};

// ================================================================
//  LOAN DETAIL MODAL (unchanged from original)
// ================================================================
function LoanDetailModal({ loan, onClose, onApprove, onReject, onToggleAutoDeduct, showMsg }: {
  loan: Loan; onClose: () => void;
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

  const needsAdminApproval = loan.status === "PENDING" && loan.staff_approval_status === "APPROVED" && !loan.admin_approval_status;

  const loadSchedule = async () => {
    if (repayments.length > 0) { setShowSchedule(s => !s); return; }
    setRepLoading(true);
    try {
      const res = await api.get(`/loan-repayments/${loan.loan_id}/schedule`);
      const list = Array.isArray(res) ? res : (res as any).schedule || (res as any).repayments || [];
      setRepayments(list); setShowSchedule(true);
    } catch { showMsg("error", "Failed to load repayment schedule."); }
    finally { setRepLoading(false); }
  };

  const handleApprove = async () => { setActing(true); try { await onApprove(loan.loan_id, remarks); onClose(); } catch { } finally { setActing(false); } };
  const handleReject = async () => {
    if (!rejectRemarks.trim()) { showMsg("error", "Rejection reason is required."); return; }
    setActing(true); try { await onReject(loan.loan_id, rejectRemarks); onClose(); } catch { } finally { setActing(false); }
  };
  const handleToggle = async () => { setToggling(true); try { await onToggleAutoDeduct(loan.loan_id, loan.auto_deduct); } catch { } finally { setToggling(false); } };
  const paidCount = repayments.filter(r => r.status === "PAID").length;
  const overdueCount = repayments.filter(r => r.status === "OVERDUE").length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{loan.loan_type} Loan #{loan.loan_id}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Customer: <span className="font-medium text-gray-700">{loan.customer_name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl"><p className="text-xs text-blue-500 font-medium">Requested Amount</p><p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(loan.loan_amount)}</p></div>
            <div className="bg-green-50 p-4 rounded-xl"><p className="text-xs text-green-500 font-medium">Approved Amount</p><p className="text-xl font-bold text-green-700 mt-1">{loan.approved_amount ? formatCurrency(loan.approved_amount) : "—"}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[{ label: "Loan Type", value: loan.loan_type }, { label: "Duration", value: `${loan.duration_months} months` }, { label: "Interest Rate", value: `${loan.interest_rate}%` }, { label: "Status", value: loan.status }, { label: "Applied On", value: formatDate(loan.created_at) }, { label: "Start Date", value: formatDate(loan.start_date) }, { label: "End Date", value: formatDate(loan.end_date) }, { label: "Account ID", value: `#${loan.account_id}` }].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-400">{label}</p><p className="font-medium text-gray-800 mt-0.5">{value}</p></div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Approval Trail</p>
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${loan.staff_approval_status === "APPROVED" ? "bg-green-50 text-green-700" : loan.staff_approval_status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
              <span className="font-medium">Staff:</span>{loan.staff_approval_status ?? "Pending"}{loan.staff_approval_remarks && ` — ${loan.staff_approval_remarks}`}
            </div>
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${loan.admin_approval_status === "APPROVED" ? "bg-green-50 text-green-700" : loan.admin_approval_status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
              <span className="font-medium">Admin:</span>{loan.admin_approval_status ?? "Pending"}{loan.admin_approval_remarks && ` — ${loan.admin_approval_remarks}`}
            </div>
          </div>
          {loan.status === "ACTIVE" && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
              <div><p className="text-sm font-semibold text-gray-800">Auto-Deduction</p><p className="text-xs text-gray-500 mt-0.5">{loan.auto_deduct ? "System deducts EMI automatically each month" : "Customer pays manually each month"}</p></div>
              <button onClick={handleToggle} disabled={toggling} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${loan.auto_deduct ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-200 text-gray-600 hover:bg-gray-300"} disabled:opacity-50`}>
                {loan.auto_deduct ? <><ToggleRight className="w-5 h-5" /> Auto ON</> : <><ToggleLeft className="w-5 h-5" /> Manual</>}
              </button>
            </div>
          )}
          {loan.status === "ACTIVE" && (
            <div>
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
                    <p className="font-semibold text-indigo-800 mb-2">EMI Breakdown — Simple Interest @ {rate}% p.a.</p>
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
              <button onClick={loadSchedule} className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Repayment Schedule ({loan.duration_months} installments)</span>
                  {repayments.length > 0 && (
                    <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                      {paidCount} paid {overdueCount > 0 && `• ${overdueCount} overdue`}
                    </span>
                  )}
                </div>
                {repLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showSchedule && repayments.length > 0 && (
                <div className="mt-2 border rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>{["#", "Amount", "Due Date", "Paid Date", "Status"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
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
                            <td className="px-4 py-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.bg} ${badge.text}`}>{badge.icon}{r.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {needsAdminApproval && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-semibold text-gray-700">Admin Action</p>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-400" />
              <div className="flex gap-2">
                <button onClick={handleApprove} disabled={acting} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">{acting ? "Approving…" : "Approve Loan"}</button>
                <button onClick={() => setShowReject(s => !s)} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-100 transition">Reject</button>
              </div>
              {showReject && (
                <div className="space-y-2">
                  <textarea value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} placeholder="Rejection reason (required)..." rows={2} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400" />
                  <div className="flex gap-2">
                    <button onClick={handleReject} disabled={acting} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50">{acting ? "Rejecting…" : "Confirm Rejection"}</button>
                    <button onClick={() => { setShowReject(false); setRejectRemarks(""); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
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
//  FRAUD REVIEW MODAL
// ================================================================
function FraudReviewModal({ fraud, adminId, onClose, onResolved, showMsg }: {
  fraud: FraudLog; adminId: number; onClose: () => void;
  onResolved: () => void; showMsg: (type: "success" | "error", text: string) => void;
}) {
  const [acting, setActing] = useState(false);

  const handleResolve = async (action: "CLEARED" | "BLOCKED") => {
    setActing(true);
    try {
      await api.put(`/admin/fraud/${fraud.fraud_id}/resolve`, {
        action_taken: action,
        reviewed_by: adminId,
      });
      showMsg("success", action === "CLEARED"
        ? "Fraud flag cleared — marked as false alarm."
        : "Account blocked and fraud confirmed.");
      onResolved();
      onClose();
    } catch (e: any) {
      showMsg("error", e.message || "Failed to resolve fraud flag.");
    } finally { setActing(false); }
  };

  const reasons = fraud.fraud_type?.split(" | ") || [];
  const scoreColor = fraud.fraud_score >= 3 ? "text-red-600" : fraud.fraud_score === 2 ? "text-orange-600" : "text-yellow-600";
  const scoreBg = fraud.fraud_score >= 3 ? "bg-red-50 border-red-200" : fraud.fraud_score === 2 ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Fraud Review</h3>
              <p className="text-sm text-gray-500">Flag #{fraud.fraud_id} · Transaction #{fraud.transaction_id}</p>
              {fraud.customer_name && <p className="text-sm font-medium text-gray-700 mt-0.5">{fraud.customer_name}{fraud.account_number && <span className="text-xs font-mono text-gray-400 ml-2">{fraud.account_number}</span>}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Risk score */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${scoreBg}`}>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</p>
              <p className={`text-3xl font-black mt-1 ${scoreColor}`}>{fraud.fraud_score.toFixed(0)}/4</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detected</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{formatDateTime(fraud.detected_at)}</p>
            </div>
          </div>

          {/* Transaction info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Amount</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(fraud.amount)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-400 mb-1">Type</p>
              <p className="text-sm font-semibold text-gray-800">{fraud.transaction_type}</p>
            </div>
            {fraud.from_account && (
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">From Account</p>
                <p className="text-sm font-mono text-gray-800">{fraud.from_account}</p>
              </div>
            )}
            {fraud.to_account && (
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">To Account</p>
                <p className="text-sm font-mono text-gray-800">{fraud.to_account}</p>
              </div>
            )}
          </div>

          {/* Fraud reasons */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Triggered Rules</p>
            <div className="space-y-2">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t space-y-3">
            <p className="text-sm font-semibold text-gray-700">Take Action</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleResolve("CLEARED")} disabled={acting}
                className="flex flex-col items-center gap-1 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition disabled:opacity-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Clear Flag</span>
                <span className="text-xs text-green-600 text-center">False alarm — no action needed</span>
              </button>
              <button onClick={() => handleResolve("BLOCKED")} disabled={acting}
                className="flex flex-col items-center gap-1 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition disabled:opacity-50">
                <Lock className="w-6 h-6 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Block Account</span>
                <span className="text-xs text-red-600 text-center">Freeze account + suspend if only one</span>
              </button>
            </div>
            {acting && <p className="text-center text-sm text-gray-500">Processing...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
//  SUPPORT TICKET DETAIL MODAL
// ================================================================
const TICKET_STATUSES: SupportTicket["status"][] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function TicketDetailModal({ ticket, staffOptions, onClose, onChanged, showMsg }: {
  ticket: SupportTicket; staffOptions: StaffMember[]; onClose: () => void;
  onChanged: () => Promise<void>; showMsg: (type: "success" | "error", text: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      await supportService.reply(ticket.ticket_id, replyText.trim());
      setReplyText("");
      await onChanged();
    } catch (e: any) { showMsg("error", e.message || "Failed to send reply."); }
    finally { setBusy(false); }
  };

  const changeStatus = async (status: SupportTicket["status"]) => {
    setBusy(true);
    try { await supportService.updateStatus(ticket.ticket_id, status); showMsg("success", "Ticket status updated."); await onChanged(); }
    catch (e: any) { showMsg("error", e.message || "Failed to update status."); }
    finally { setBusy(false); }
  };

  const assignTo = async (userId: string) => {
    if (!userId) return;
    setBusy(true);
    try { await supportService.assign(ticket.ticket_id, Number(userId)); showMsg("success", "Ticket assigned."); await onChanged(); }
    catch (e: any) { showMsg("error", e.message || "Failed to assign ticket."); }
    finally { setBusy(false); }
  };

  const badge = getStatusBadge(ticket.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{ticket.subject}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {ticket.customer_name} · {ticket.category} · #{ticket.ticket_id}
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full mt-2 ${badge.bg} ${badge.text}`}>
              {badge.icon} {ticket.status.replace("_", " ")}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-sm text-gray-700">{ticket.description}</p>
          <hr />
          {(ticket.replies || []).map(r => (
            <div key={r.reply_id} className="text-sm bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-900">{r.sender_name || r.sender_type}</p>
              <p className="text-gray-700 mt-0.5">{r.message}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t space-y-3">
          <div className="flex flex-wrap gap-2">
            <select value={ticket.status} onChange={e => changeStatus(e.target.value as SupportTicket["status"])} disabled={busy}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
              {TICKET_STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <select value={ticket.assigned_to || ""} onChange={e => assignTo(e.target.value)} disabled={busy}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
              <option value="">Assign to…</option>
              {staffOptions.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} ({s.role})</option>)}
            </select>
          </div>
          <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={sendReply} disabled={busy || !replyText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send reply"}
          </button>
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

  // Fraud
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [fraudFilter, setFraudFilter] = useState<"UNRESOLVED" | "ALL">("UNRESOLVED");
  const [selectedFraud, setSelectedFraud] = useState<FraudLog | null>(null);

  // Support Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<TicketStatusFilter>("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

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
    try { const res = await api.get("/loans"); setLoans(Array.isArray(res) ? res : (res as any).loans || []); }
    catch (e) { console.error(e); }
  };
  const fetchAllAccounts = async () => {
    try { const res = await accountService.getAllWithDetails(); setAllAccounts(Array.isArray(res) ? res : (res as any).accounts || []); }
    catch (e) { console.error(e); }
  };
  const fetchFraudLogs = async () => {
    try {
      const endpoint = fraudFilter === "UNRESOLVED" ? "/admin/fraud" : "/admin/fraud/all";
      const res = await api.get(endpoint);
      setFraudLogs(Array.isArray(res) ? res : (res as any).logs || []);
    } catch (e) { console.error(e); }
  };

  const fetchTickets = async () => {
    try {
      const res = await supportService.getAll({ status: ticketStatusFilter === "ALL" ? undefined : ticketStatusFilter });
      setTickets(Array.isArray(res) ? res : (res as any).tickets || []);
    } catch (e) { console.error(e); }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchStaff(), fetchCustomers(), fetchLoanPolicies(), fetchLoans(), fetchAllAccounts(), fetchFraudLogs(), fetchTickets()]);
    setLoading(false);
  };

  const silentFetchAll = async () => {
    await Promise.all([fetchStats(), fetchStaff(), fetchCustomers(), fetchLoanPolicies(), fetchLoans(), fetchAllAccounts(), fetchFraudLogs(), fetchTickets()]);
  };

  const anyModalOpen = !!selectedLoan || showCreateStaff || showProfileModal || !!editingPolicyId || !!freezeModal || !!selectedFraud || !!selectedTicket;
  usePolling(silentFetchAll, { intervalMs: 5000, paused: anyModalOpen });
  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === "fraud") fetchFraudLogs(); }, [fraudFilter, activeTab]);
  useEffect(() => { if (activeTab === "tickets") fetchTickets(); }, [ticketStatusFilter, activeTab]);

  const openTicket = async (ticketId: number) => {
    try { setSelectedTicket(await supportService.getById(ticketId)); }
    catch (e: any) { showMsg("error", e.message || "Failed to load ticket."); }
  };
  const refreshSelectedTicket = async () => {
    await fetchTickets();
    if (selectedTicket) setSelectedTicket(await supportService.getById(selectedTicket.ticket_id));
  };

  // ----------------------------------------------------------------
  // FILTERED LISTS
  // ----------------------------------------------------------------
  const filteredStaff = staffList
    .filter(s => staffFilter === "ALL" || s.status === staffFilter)
    .filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredCustomers = customers
    .filter(c => {
      if (customerFilter === "ALL") return true;
      if (customerFilter === "AWAITING_ADMIN") return c.status === "PENDING" && !!c.staff_approved_at;
      return c.status === customerFilter;
    })
    .filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm));

  const filteredLoans = loans.filter(l => {
    if (loanFilter === "AWAITING_ADMIN") return l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status;
    if (loanFilter === "ALL") return true;
    return l.status === loanFilter;
  }).filter(l => l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || String(l.loan_id).includes(searchTerm));

  const awaitingAdminCount = loans.filter(l => l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status).length;
  const closurePendingCount = allAccounts.filter(a => a.status === "CLOSURE_PENDING").length;
  const filteredAccounts = allAccounts
    .filter(a => accountStatusFilter === "ALL" || a.status === accountStatusFilter)
    .filter(a => a.account_number?.toLowerCase().includes(accountSearch.toLowerCase()) || a.customer_name?.toLowerCase().includes(accountSearch.toLowerCase()) || a.customer_email?.toLowerCase().includes(accountSearch.toLowerCase()));

  const unresolvedFraudCount = fraudLogs.filter(f => !f.resolved_at).length;

  // ----------------------------------------------------------------
  // STAFF ACTIONS
  // ----------------------------------------------------------------
  const handleCreateStaff = async () => {
    if (!newStaff.fullName || !newStaff.email || !newStaff.password) return showMsg("error", "All fields are required.");
    try { await adminService.createStaff(newStaff); showMsg("success", "Staff account created."); setShowCreateStaff(false); setNewStaff({ fullName: "", email: "", password: "" }); fetchStaff(); fetchStats(); }
    catch (e: any) { showMsg("error", e.message); }
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
    try { await loanService.adminApproveLoan(loanId, { approved_amount: 0, duration_months: 0, remarks } as any); showMsg("success", "Loan approved and activated."); fetchLoans(); fetchStats(); }
    catch (e: any) { showMsg("error", e.message || "Failed to approve loan."); throw e; }
  };
  const handleAdminRejectLoan = async (loanId: number, remarks: string) => {
    try { await loanService.adminRejectLoan(loanId, remarks); showMsg("success", "Loan rejected."); fetchLoans(); fetchStats(); }
    catch (e: any) { showMsg("error", e.message || "Failed to reject loan."); throw e; }
  };
  const handleToggleAutoDeduct = async (loanId: number, current: boolean) => {
    try {
      await api.put(`/loans/${loanId}/toggle-auto-deduct`, { auto_deduct: !current });
      showMsg("success", `Auto-deduction ${!current ? "enabled" : "disabled"}.`);
      setLoans(prev => prev.map(l => l.loan_id === loanId ? { ...l, auto_deduct: !current } : l));
      if (selectedLoan?.loan_id === loanId) setSelectedLoan(prev => prev ? { ...prev, auto_deduct: !current } : prev);
    } catch (e: any) { showMsg("error", e.message || "Failed to toggle auto-deduction."); throw e; }
  };

  // ----------------------------------------------------------------
  // ACCOUNT ACTIONS
  // ----------------------------------------------------------------
  const handleApproveClosure = async (accountId: number) => {
    setClosureActionLoading(accountId);
    try { await accountService.approveClosure(accountId); showMsg("success", "Account closed successfully."); fetchAllAccounts(); fetchStats(); }
    catch (e: any) { showMsg("error", e.response?.data?.message || e.message || "Failed to close account."); }
    finally { setClosureActionLoading(null); }
  };
  const handleFreezeAccount = async () => {
    if (!freezeModal) return;
    if (!freezeReason.trim()) return showMsg("error", "Freeze reason is required.");
    setFreezeLoading(true);
    try { await accountService.freeze(freezeModal.account.account_id, freezeReason); showMsg("success", `Account ${freezeModal.account.account_number} frozen.`); setFreezeModal(null); setFreezeReason(""); fetchAllAccounts(); }
    catch (e: any) { showMsg("error", e.response?.data?.message || "Failed to freeze account."); }
    finally { setFreezeLoading(false); }
  };
  const handleUnfreezeAccount = async (accountId: number) => {
    try { await accountService.unfreeze(accountId); showMsg("success", "Account unfrozen successfully."); fetchAllAccounts(); }
    catch (e: any) { showMsg("error", e.response?.data?.message || "Failed to unfreeze account."); }
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

      {/* Header */}
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
                { id: "accounts", label: "Accounts", icon: Banknote, badge: closurePendingCount || undefined },
                { id: "fraud", label: "Fraud", icon: ShieldAlert, badge: stats?.open_fraud_flags || undefined },
                { id: "tickets", label: "Support", icon: MessageSquare, badge: stats?.open_tickets || undefined },
              ] satisfies { id: TabType; label: string; icon: React.ElementType; badge: number | undefined }[]).map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                  className={`px-5 py-3 flex items-center gap-2 border-b-2 transition ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge ? (
                    <span className={`text-white text-xs px-2 py-0.5 rounded-full ${tab.id === "fraud" ? "bg-red-500 animate-pulse" : "bg-red-500"}`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && stats && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">System Overview</h2>
                  <p className="text-xs text-gray-400">Live · updates every 5s</p>
                </div>

                {/* Top KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <KpiCard label="Total Deposits" value={formatCurrency(stats.total_deposits)} sub="across active accounts" icon={<DollarSign className="w-5 h-5 text-green-600" />} accent="green" />
                  <KpiCard label="Today's Transactions" value={stats.transactions_today} sub="completed today" icon={<Activity className="w-5 h-5 text-blue-600" />} accent="blue" />
                  <KpiCard label="Active Loans" value={stats.active_loans} sub={`of ${stats.total_loans} total`} icon={<TrendingUp className="w-5 h-5 text-purple-600" />} accent="purple" />
                  <KpiCard label="Active Customers" value={stats.active_customers} sub={`of ${stats.total_customers} total`} icon={<Users className="w-5 h-5 text-indigo-600" />} accent="indigo" />
                </div>

                {/* Action required row */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Action Required</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <AlertCard label="Pending Staff" value={stats.pending_staff} sub="awaiting approval" color="yellow" onClick={() => { setActiveTab("staff"); setStaffFilter("PENDING"); }} />
                  <AlertCard label="Customers Awaiting" value={stats.customers_awaiting_admin} sub="need admin approval" color="orange" onClick={() => { setActiveTab("customers"); setCustomerFilter("AWAITING_ADMIN"); }} />
                  <AlertCard label="Loans Awaiting" value={stats.loans_awaiting_admin} sub="need admin approval" color="orange" onClick={() => { setActiveTab("loans"); setLoanFilter("AWAITING_ADMIN"); }} />
                  <AlertCard label="Fraud Flags" value={stats.open_fraud_flags} sub="unresolved" color="red" onClick={() => setActiveTab("fraud")} pulse={stats.open_fraud_flags > 0} />
                </div>

                {/* Info row */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System Health</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Staff" value={stats.total_staff} sub={`${stats.active_staff} active`} color="blue" />
                  <StatCard label="Total Accounts" value={stats.total_accounts} sub={`${stats.active_accounts} active · ${stats.pending_accounts} pending`} color="purple" />
                  <AlertCard label="Support Tickets" value={stats.open_tickets} sub="open" color="red" onClick={() => setActiveTab("tickets")} pulse={stats.open_tickets > 0} />
                  <StatCard label="Suspended Customers" value={stats.suspended_customers} sub={`${stats.rejected_customers} rejected`} color="red" />
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
                  {awaitingAdminCount > 0 && <span className="bg-red-100 text-red-700 text-sm font-medium px-3 py-1 rounded-full">{awaitingAdminCount} awaiting your approval</span>}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {([{ key: "AWAITING_ADMIN", label: "Awaiting Admin" }, { key: "ALL", label: "All" }, { key: "PENDING", label: "Pending" }, { key: "ACTIVE", label: "Active" }, { key: "REJECTED", label: "Rejected" }] as { key: LoanFilter; label: string }[]).map(f => (
                    <FilterBtn key={f.key} label={f.label} active={loanFilter === f.key} onClick={() => setLoanFilter(f.key)} highlight={f.key === "AWAITING_ADMIN"} />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search by customer or loan ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64" />
                  </div>
                </div>
                {filteredLoans.length === 0 ? <EmptyState icon={FileText} message={loanFilter === "AWAITING_ADMIN" ? "No loans awaiting admin approval" : "No loans found"} /> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>{["Loan ID", "Customer", "Type", "Amount", "Duration", "Status", "Staff", "Admin", "Auto-Deduct", "Actions"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLoans.map(l => {
                          const statusBadge = getStatusBadge(l.status);
                          const staffBadge = getStatusBadge(l.staff_approval_status || "PENDING");
                          const adminBadge = getStatusBadge(l.admin_approval_status || "PENDING");
                          const isAwaiting = l.status === "PENDING" && l.staff_approval_status === "APPROVED" && !l.admin_approval_status;
                          return (
                            <tr key={l.loan_id} className={`hover:bg-gray-50 ${isAwaiting ? "bg-yellow-50" : ""}`}>
                              <td className="px-3 py-3 text-sm font-mono text-gray-700">#{l.loan_id}</td>
                              <td className="px-3 py-3"><p className="text-sm font-medium text-gray-900">{l.customer_name}</p><p className="text-xs text-gray-400">ID: {l.customer_id}</p></td>
                              <td className="px-3 py-3 text-sm text-gray-700 font-medium">{l.loan_type}</td>
                              <td className="px-3 py-3 text-sm text-gray-800 font-semibold whitespace-nowrap">{formatCurrency(l.loan_amount)}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{l.duration_months}m</td>
                              <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.icon} {l.status}</span></td>
                              <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${staffBadge.bg} ${staffBadge.text}`}>{staffBadge.icon} {l.staff_approval_status || "—"}</span></td>
                              <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${adminBadge.bg} ${adminBadge.text}`}>{adminBadge.icon} {l.admin_approval_status || "—"}</span></td>
                              <td className="px-3 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${l.auto_deduct ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{l.auto_deduct ? "Auto" : "Manual"}</span></td>
                              <td className="px-3 py-3"><ActionBtn label="View" color="gray" onClick={() => setSelectedLoan(l)} /></td>
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
                    <thead className="bg-gray-50"><tr>{["Type", "Min Amount", "Max Amount", "Min Months", "Max Months", "Interest Rate", "Status", "Actions"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
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
                            <td className="px-3 py-3"><span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1 flex-wrap">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => savePolicy(p.policy_id)} disabled={savingPolicy} className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"><Save className="w-3 h-3" /> {savingPolicy ? "Saving…" : "Save"}</button>
                                    <button onClick={cancelEditing} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"><X className="w-3 h-3" /> Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing(p)} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"><Edit2 className="w-3 h-3" /> Edit</button>
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
                  {closurePendingCount > 0 && <span className="bg-orange-100 text-orange-700 text-sm font-medium px-3 py-1 rounded-full">{closurePendingCount} pending closure</span>}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["ALL", "ACTIVE", "FROZEN", "PENDING", "CLOSURE_PENDING", "CLOSED", "REJECTED"].map(f => (
                    <FilterBtn key={f} label={f === "CLOSURE_PENDING" ? "Closure Pending" : f} active={accountStatusFilter === f} onClick={() => setAccountStatusFilter(f)} highlight={f === "CLOSURE_PENDING"} />
                  ))}
                  <div className="ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Search by account, customer..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64" />
                  </div>
                </div>
                {filteredAccounts.length === 0 ? <EmptyState icon={CreditCard} message="No accounts found" /> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>{["Account No.", "Customer", "Assigned Staff", "Type", "Balance", "Status", "Opened", "Closed", "Actions"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAccounts.map(account => {
                          const badge = getStatusBadge(account.status);
                          const isClosure = account.status === "CLOSURE_PENDING";
                          return (
                            <tr key={account.account_id} className={`hover:bg-gray-50 ${isClosure ? "bg-orange-50" : ""}`}>
                              <td className="px-3 py-3 text-sm font-mono text-gray-700">{account.account_number}</td>
                              <td className="px-3 py-3"><p className="text-sm font-medium text-gray-900">{account.customer_name}</p><p className="text-xs text-gray-400">{account.customer_email}</p></td>
                              <td className="px-3 py-3 text-sm text-gray-700">{account.assigned_staff_name || "—"}</td>
                              <td className="px-3 py-3"><span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{account.account_type}</span></td>
                              <td className="px-3 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(account.balance)}</td>
                              <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}>{badge.icon}{account.status}</span></td>
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(account.opened_date)}</td>
                              <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{account.closed_date ? formatDate(account.closed_date) : "—"}</td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {account.status === "ACTIVE" && <ActionBtn label="Freeze" color="orange" onClick={() => setFreezeModal({ account })} />}
                                  {account.status === "FROZEN" && <ActionBtn label="Unfreeze" color="green" onClick={() => handleUnfreezeAccount(account.account_id)} />}
                                  {account.status === "CLOSURE_PENDING" && <ActionBtn label={closureActionLoading === account.account_id ? "Processing..." : "Approve Closure"} color="red" onClick={() => handleApproveClosure(account.account_id)} />}
                                  {!["ACTIVE", "FROZEN", "CLOSURE_PENDING"].includes(account.status) && <span className="text-xs text-gray-400">—</span>}
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

            {/* ── FRAUD TAB ── */}
            {activeTab === "fraud" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Fraud Management</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Review flagged transactions and take action</p>
                  </div>
                  {unresolvedFraudCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> {unresolvedFraudCount} unresolved
                    </span>
                  )}
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4">
                  <FilterBtn label="Unresolved" active={fraudFilter === "UNRESOLVED"} onClick={() => setFraudFilter("UNRESOLVED")} highlight />
                  <FilterBtn label="All Flags" active={fraudFilter === "ALL"} onClick={() => setFraudFilter("ALL")} />
                </div>

                {fraudLogs.length === 0 ? (
                  <div className="text-center py-16 bg-green-50 rounded-xl border border-green-100">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">No fraud flags to review</p>
                    <p className="text-green-600 text-sm mt-1">All transactions look clean</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fraudLogs.map(f => {
                      const isResolved = !!f.resolved_at;
                      const scoreColor = f.fraud_score >= 3 ? "text-red-600" : f.fraud_score === 2 ? "text-orange-600" : "text-yellow-600";
                      const scoreBg = f.fraud_score >= 3 ? "border-red-300 bg-red-50" : f.fraud_score === 2 ? "border-orange-300 bg-orange-50" : "border-yellow-300 bg-yellow-50";
                      return (
                        <div key={f.fraud_id} className={`border rounded-xl p-4 transition ${isResolved ? "bg-gray-50 border-gray-200 opacity-70" : `${scoreBg} hover:shadow-md`}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Score badge */}
                              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2 ${isResolved ? "bg-gray-100 border-gray-200" : scoreBg}`}>
                                <span className={`text-lg font-black ${isResolved ? "text-gray-400" : scoreColor}`}>{f.fraud_score.toFixed(0)}</span>
                                <span className="text-xs text-gray-400">risk</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-gray-900">Transaction #{f.transaction_id}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isResolved ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-700"}`}>
                                    {isResolved ? f.action_taken : "FLAGGED"}
                                  </span>
                                  <span className="text-xs font-semibold text-red-700">{formatCurrency(f.amount)}</span>
                                  <span className="text-xs text-gray-400">{f.transaction_type}</span>
                                </div>
                                {f.customer_name && (
                                  <p className="text-sm font-medium text-gray-700 mb-0.5">{f.customer_name}{f.account_number && <span className="text-xs font-mono text-gray-400 ml-2">{f.account_number}</span>}</p>
                                )}
                                <p className="text-xs text-gray-500 mb-1.5">
                                  {f.from_account && `From: ${f.from_account}`}
                                  {f.from_account && f.to_account && " → "}
                                  {f.to_account && `To: ${f.to_account}`}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {f.fraud_type?.split(" | ").map((reason, i) => (
                                    <span key={i} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{reason}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className="text-xs text-gray-400">{formatDateTime(f.detected_at)}</p>
                              {!isResolved ? (
                                <button onClick={() => setSelectedFraud(f)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                                  <Eye className="w-3.5 h-3.5" /> Review
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">Resolved {formatDateTime(f.resolved_at)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SUPPORT TICKETS TAB ── */}
            {activeTab === "tickets" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Customer tickets across all categories</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatusFilter[]).map(f => (
                    <FilterBtn key={f} label={f.replace("_", " ")} active={ticketStatusFilter === f} onClick={() => setTicketStatusFilter(f)} highlight={f === "OPEN"} />
                  ))}
                </div>

                {tickets.length === 0 ? <EmptyState icon={MessageSquare} message="No support tickets found" /> : (
                  <div className="space-y-2">
                    {tickets.map(t => {
                      const badge = getStatusBadge(t.status);
                      const isOpen = t.status === "OPEN";
                      return (
                        <button key={t.ticket_id} onClick={() => openTicket(t.ticket_id)}
                          className={`w-full text-left border rounded-xl p-4 hover:shadow-md transition ${isOpen ? "border-yellow-300 bg-yellow-50 hover:border-yellow-400" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-gray-900 truncate">{t.subject}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.priority === "HIGH" ? "bg-red-100 text-red-700" : t.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                                  {t.priority}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {t.customer_name} · {t.category} · {formatDate(t.created_at)}
                                {t.assigned_to_name ? ` · Assigned to ${t.assigned_to_name}` : " · Unassigned"}
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>
                              {badge.icon} {t.status.replace("_", " ")}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── MODALS ── */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} user={user} onProfileUpdate={fetchAll} />

      {selectedLoan && (
        <LoanDetailModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} onApprove={handleAdminApproveLoan} onReject={handleAdminRejectLoan} onToggleAutoDeduct={handleToggleAutoDeduct} showMsg={showMsg} />
      )}

      {selectedFraud && (
        <FraudReviewModal fraud={selectedFraud} adminId={user?.id || 0} onClose={() => setSelectedFraud(null)} onResolved={() => { fetchFraudLogs(); fetchStats(); }} showMsg={showMsg} />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          staffOptions={staffList.filter(s => s.status === "ACTIVE")}
          onClose={() => setSelectedTicket(null)}
          onChanged={refreshSelectedTicket}
          showMsg={showMsg}
        />
      )}

      {/* ── FREEZE ACCOUNT MODAL ── */}
      {freezeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Freeze Account</h3><p className="text-sm text-gray-500">{freezeModal.account.account_number}</p></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              <p><span className="text-gray-500">Customer:</span> <span className="font-medium">{freezeModal.account.customer_name}</span></p>
              <p><span className="text-gray-500">Type:</span> <span className="font-medium">{freezeModal.account.account_type}</span></p>
              <p><span className="text-gray-500">Balance:</span> <span className="font-medium">{formatCurrency(freezeModal.account.balance)}</span></p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-orange-800 font-medium mb-1">What freezing does:</p>
              <p className="text-xs text-orange-700">Blocks all withdrawals and transfers. Balance is preserved. You can unfreeze at any time.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason <span className="text-red-500">*</span></label>
              <textarea rows={3} value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="e.g. Suspicious transaction activity..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleFreezeAccount} disabled={freezeLoading} className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-60">{freezeLoading ? "Freezing..." : "Confirm Freeze"}</button>
              <button onClick={() => { setFreezeModal(null); setFreezeReason(""); }} disabled={freezeLoading} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
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
const KpiCard = ({ label, value, sub, icon, accent }: any) => {
  const accents: Record<string, string> = { green: "border-green-400", blue: "border-blue-400", purple: "border-purple-400", indigo: "border-indigo-400" };
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${accents[accent] || "border-gray-300"}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
};

const AlertCard = ({ label, value, sub, color, onClick, pulse }: any) => {
  const colors: Record<string, { bg: string; text: string; num: string }> = {
    yellow: { bg: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200", text: "text-yellow-700", num: "text-yellow-600" },
    orange: { bg: "bg-orange-50 hover:bg-orange-100 border-orange-200", text: "text-orange-700", num: "text-orange-600" },
    red: { bg: "bg-red-50 hover:bg-red-100 border-red-200", text: "text-red-700", num: "text-red-600" },
  };
  const isActive = value > 0;
  const c = isActive ? (colors[color] || colors.yellow) : { bg: "bg-gray-50 border-gray-200", text: "text-gray-400", num: "text-gray-400" };
  return (
    <button onClick={onClick} disabled={!isActive}
      className={`${c.bg} border rounded-xl p-4 text-left transition w-full relative ${isActive ? "hover:shadow-md cursor-pointer" : "cursor-default"}`}>
      {pulse && value > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-black ${c.num}`}>{value}</p>
      <p className={`text-xs mt-1 ${c.text}`}>{sub}</p>
    </button>
  );
};

const StatCard = ({ label, value, sub, color }: any) => {
  const colors: Record<string, string> = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600", yellow: "text-yellow-600", orange: "text-orange-600", red: "text-red-600", gray: "text-gray-600" };
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color] || "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
};

const FilterBtn = ({ label, active, onClick, highlight }: any) => (
  <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${active ? (highlight ? "bg-yellow-500 text-white" : "bg-blue-600 text-white") : (highlight ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}`}>
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