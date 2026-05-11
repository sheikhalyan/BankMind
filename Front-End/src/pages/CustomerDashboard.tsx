import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { accountService } from "../services/account";
import { transactionService } from "../services/transaction";
import { loanService } from "../services/loan";
import NotificationBell from "../components/NotificationBell";
import { Account, Transaction, LoanRequest } from "../types";
import {
  LogOut,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  FileText,
  CreditCard,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Car,
  GraduationCap,
  Heart,
  Briefcase,
  Stethoscope,
  RefreshCw,
  User,
  Download,
} from "lucide-react";
import ProfileModal from "../components/ProfileModal";
import StatementDownload from "../components/StatementDownload";

// ==================== MAIN COMPONENT ====================
export default function CustomerDashboard() {
  const { user, logout } = useAuth();

  // ==================== UI STATE ====================
  const [activeTab, setActiveTab] = useState<
    "accounts" | "transactions" | "loans"
  >("accounts");
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ==================== DATA STATE ====================
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [existingAccountTypes, setExistingAccountTypes] = useState<string[]>(
    [],
  );

  // ==================== MODAL STATES ====================
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [accountLimitReached, setAccountLimitReached] = useState(false);

  // ==================== FILTER STATES ====================
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<string | null>("all");
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  // ==================== FORM STATES ====================
  const [accountForm, setAccountForm] = useState<{
    accountType: "savings" | "current";
  }>({ accountType: "savings" });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    description: "",
  });
  const [transferForm, setTransferForm] = useState({
    toAccountNumber: "",
    amount: "",
    description: "",
  });
  const [loanForm, setLoanForm] = useState({
    amount: "",
    loanType: "",
    duration: "",
  });

  // ==================== HELPER FUNCTIONS ====================

  // Get icon for loan type
  const getLoanIcon = (loanType: string) => {
    switch (loanType?.toUpperCase()) {
      case "HOME":
        return <Home className="w-5 h-5" />;
      case "CAR":
        return <Car className="w-5 h-5" />;
      case "EDUCATION":
        return <GraduationCap className="w-5 h-5" />;
      case "MARRIAGE":
        return <Heart className="w-5 h-5" />;
      case "BUSINESS":
        return <Briefcase className="w-5 h-5" />;
      case "MEDICAL":
        return <Stethoscope className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Filter accounts - hide rejected ones
  const visibleAccounts = accounts.filter(
    (acc) => acc.status?.toLowerCase() !== "rejected",
  );
  const activeAccounts = visibleAccounts.filter(
    (acc) =>
      acc.status?.toLowerCase() === "active" ||
      acc.status?.toLowerCase() === "approved",
  );
  const totalBalance = activeAccounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0,
  );

  // Get status badge styling
  const getStatusBadge = (status: string = "") => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "active":
      case "approved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      case "pending":
      case "inactive":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          icon: <Clock className="w-4 h-4" />,
        };
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  };

  // Add this function to check account limits when loading accounts
  const checkAccountLimits = useCallback(() => {
    const activeAccountTypes = visibleAccounts.map((acc) =>
      acc.accountType?.toUpperCase(),
    );
    setExistingAccountTypes(activeAccountTypes);
    setAccountLimitReached(visibleAccounts.length >= 2);
  }, [visibleAccounts]);

  useEffect(() => {
    checkAccountLimits();
  }, [visibleAccounts, checkAccountLimits]);

  // Add these after your visibleAccounts definition
  const hasSavings = visibleAccounts.some(
    (acc) => acc.accountType?.toUpperCase() === "SAVINGS",
  );
  const hasCurrent = visibleAccounts.some(
    (acc) => acc.accountType?.toUpperCase() === "CURRENT",
  );

  // ==================== DATA FETCHING ====================
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountService.getByCustomer(user!.id);
      setAccounts(response.accounts || []);
      if (response.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(response.accounts[0]);
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const response = await transactionService.getByAccount(
        selectedAccount.id,
      );
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoans = async () => {
    setLoading(true);
    try {
      const response = await loanService.getByCustomer(user!.id);
      setLoans(response.loans || []);
    } catch (error) {
      console.error("Failed to load loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await loadAccounts();
      if (activeTab === "transactions" && selectedAccount) {
        await loadTransactions();
      } else if (activeTab === "loans") {
        await loadLoans();
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset filtered transactions when transactions change
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (activeTab === "transactions" && selectedAccount) {
      loadTransactions();
    } else if (activeTab === "loans") {
      loadLoans();
    }
  }, [activeTab, selectedAccount]);

  // ==================== ACTION HANDLERS ====================
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.create({
        accountType: accountForm.accountType.toUpperCase(),
      });
      alert("Account created successfully. Waiting for approval.");
      setShowCreateAccount(false);
      loadAccounts();
    } catch (error: any) {
      alert(error.message || "Failed to create account");
    }
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
      alert("Withdrawal successful");
      setShowWithdraw(false);
      setWithdrawForm({ amount: "", description: "" });
      loadAccounts();
      loadTransactions();
    } catch (error: any) {
      alert(error.message || "Withdrawal failed");
    }
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
      alert("Transfer successful");
      setShowTransfer(false);
      setTransferForm({ toAccountNumber: "", amount: "", description: "" });
      loadAccounts();
      loadTransactions();
    } catch (error: any) {
      alert(error.message || "Transfer failed");
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loanService.create({
        amount: parseFloat(loanForm.amount),
        loanType: loanForm.loanType,
        duration: parseInt(loanForm.duration),
      });
      alert("Loan application submitted successfully");
      setShowLoanForm(false);
      setLoanForm({ amount: "", loanType: "", duration: "" });
      loadLoans();
    } catch (error: any) {
      alert(error.message || "Loan application failed");
    }
  };

  const handleProfileUpdate = () => {
    loadAccounts();
  };

  // ==================== DATE HELPERS ====================
  const toLocalDateString = (date: Date) => date.toLocaleDateString("en-CA");
  const parseDateInput = (value: string): Date => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== NAVBAR ==================== */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Customer Dashboard
                </h1>
                <p className="text-xs text-gray-500">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={fetchAllData}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== BALANCE CARD ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Total Balance (Active Accounts)
                </p>
                <h2 className="text-4xl font-bold mt-2">
                  ${totalBalance.toFixed(2)}
                </h2>
                <p className="text-blue-100 text-sm mt-2">
                  {activeAccounts.length} active account
                  {activeAccounts.length !== 1 ? "s" : ""}
                </p>
              </div>
              <CreditCard className="w-12 h-12 text-blue-200" />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowWithdraw(true)}
                disabled={activeAccounts.length === 0}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setShowTransfer(true)}
                disabled={activeAccounts.length === 0}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              {/* Account Limit Info - Subtle and discreet */}
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  Accounts: {visibleAccounts.length}/2
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Account</span>
              </button>
              <button
                onClick={() => setShowLoanForm(true)}
                className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Apply for Loan</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== TABS ==================== */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 px-6 py-4 font-medium transition ${activeTab === "accounts" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>My Accounts ({visibleAccounts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 px-6 py-4 font-medium transition ${activeTab === "transactions" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowDownLeft className="w-5 h-5" />
                <span>Transactions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("loans")}
              className={`flex-1 px-6 py-4 font-medium transition ${activeTab === "loans" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Loans ({loans.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* ==================== CONTENT ==================== */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div>
            {/* ACCOUNTS TAB */}
            {activeTab === "accounts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleAccounts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-sm border">
                    <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No accounts yet. Create your first account!
                    </p>
                  </div>
                ) : (
                  visibleAccounts.map((account) => {
                    const statusBadge = getStatusBadge(account.status);
                    return (
                      <div
                        key={account.id}
                        className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition cursor-pointer ${selectedAccount?.id === account.id ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {account.accountType}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 font-mono">
                              Account #{account.accountNumber}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.icon}
                            {account.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Current Balance
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            ${account.balance?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        {(account.status?.toLowerCase() === "active" ||
                          account.status?.toLowerCase() === "approved") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccount(account);
                              setActiveTab("transactions");
                            }}
                            className="mt-4 w-full bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
                          >
                            <TrendingUp className="w-4 h-4" />
                            View Transactions
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === "transactions" && (
              <div>
                {activeAccounts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                    <p className="text-gray-500">No active accounts yet</p>
                  </div>
                ) : (
                  <>
                    {/* Account Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Account to View Transactions
                      </label>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {activeAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => {
                              setSelectedAccount(account);
                              setDateRange(null);
                              setFilteredTransactions(transactions);
                              setActiveFilter("all");
                            }}
                            className={`px-4 py-3 rounded-lg font-medium transition flex-1 min-w-[200px] ${selectedAccount?.id === account.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-700 border hover:bg-gray-50"}`}
                          >
                            <div className="text-sm">
                              Account #{account.accountNumber}
                            </div>
                            <div className="text-xs opacity-75">
                              ${account.balance?.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedAccount && (
                        <div className="space-y-4 mb-6">
                          {/* Filter Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "3 Months", key: "3months", months: 3 },
                              { label: "6 Months", key: "6months", months: 6 },
                              {
                                label: "12 Months",
                                key: "12months",
                                months: 12,
                              },
                            ].map((filter) => (
                              <button
                                key={filter.key}
                                onClick={() => {
                                  const start = new Date();
                                  start.setMonth(
                                    start.getMonth() - filter.months,
                                  );
                                  const end = new Date();
                                  setStartDate(start);
                                  setEndDate(end);
                                  setFilteredTransactions(
                                    transactions.filter(
                                      (t: any) =>
                                        new Date(t.createdAt) >= start &&
                                        new Date(t.createdAt) <= end,
                                    ),
                                  );
                                  setDateRange({ start, end });
                                  setActiveFilter(filter.key);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeFilter === filter.key ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                {filter.label}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setDateRange(null);
                                setFilteredTransactions(transactions);
                                setActiveFilter("all");
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeFilter === "all" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                            >
                              All Transactions
                            </button>
                          </div>

                          {/* Custom Date Range */}
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex flex-wrap gap-3 items-center">
                              <span className="text-sm font-medium text-gray-700">
                                Custom Range:
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={toLocalDateString(startDate)}
                                  onChange={(e) =>
                                    setStartDate(parseDateInput(e.target.value))
                                  }
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="date"
                                  value={toLocalDateString(endDate)}
                                  onChange={(e) =>
                                    setEndDate(parseDateInput(e.target.value))
                                  }
                                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => {
                                    setActiveFilter(null);
                                    const filtered = transactions.filter(
                                      (t: any) => {
                                        const tDate = new Date(t.createdAt);
                                        const startOfDay = new Date(startDate);
                                        startOfDay.setHours(0, 0, 0, 0);
                                        const endOfDay = new Date(endDate);
                                        endOfDay.setHours(23, 59, 59, 999);
                                        return (
                                          tDate >= startOfDay &&
                                          tDate <= endOfDay
                                        );
                                      },
                                    );
                                    setFilteredTransactions(filtered);
                                    setDateRange({
                                      start: startDate,
                                      end: endDate,
                                    });
                                  }}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            {/* Statement Download Component */}
                            <StatementDownload
                              accountId={selectedAccount.id}
                              accountNumber={selectedAccount.accountNumber.toString()}
                              customerName={user?.name || "Customer"}
                              transactions={filteredTransactions}
                              dateRange={dateRange}
                            />
                          </div>

                          {/* Selected Period Indicator */}
                          {dateRange && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                              <span className="font-medium">Showing:</span>
                              <span>
                                {dateRange.start.toLocaleDateString()} -{" "}
                                {dateRange.end.toLocaleDateString()}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span>
                                {filteredTransactions.length} transactions
                              </span>
                              <button
                                onClick={() => {
                                  setDateRange(null);
                                  setFilteredTransactions(transactions);
                                  setActiveFilter("all");
                                }}
                                className="ml-2 text-xs text-red-500 hover:text-red-700"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Transaction History */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction History
                      {selectedAccount && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (Account #{selectedAccount.accountNumber})
                        </span>
                      )}
                    </h3>

                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No transactions found for selected period
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          const grouped = filteredTransactions.reduce(
                            (groups: any, transaction: any) => {
                              const date = new Date(
                                transaction.createdAt,
                              ).toLocaleDateString("en-US", {
                                timeZone: "UTC",
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                              if (!groups[date]) groups[date] = [];
                              groups[date].push(transaction);
                              return groups;
                            },
                            {},
                          );
                          return Object.entries(grouped).map(
                            ([date, dayTransactions]: [string, any]) => (
                              <div key={date}>
                                <div className="sticky top-0 z-10 bg-gray-100 rounded-lg px-4 py-2 mb-3 shadow-sm">
                                  <h4 className="font-semibold text-gray-700">
                                    {date}
                                  </h4>
                                </div>
                                <div className="space-y-3">
                                  {dayTransactions.map((transaction: any) => {
                                    const isCredit =
                                      transaction.type === "CREDIT" ||
                                      transaction.type === "credit";
                                    const isDebit =
                                      transaction.type === "DEBIT" ||
                                      transaction.type === "debit";
                                    const displayText =
                                      transaction.description ||
                                      transaction.transaction_reason ||
                                      "Transaction";
                                    const formattedAmount =
                                      transaction.amount.toLocaleString();
                                    const transactionDate = new Date(
                                      transaction.createdAt,
                                    );

                                    return (
                                      <div
                                        key={transaction.id}
                                        className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 ${
                                          isCredit
                                            ? "border-l-4 border-l-green-500"
                                            : "border-l-4 border-l-red-500"
                                        }`}
                                      >
                                        <div className="p-4">
                                          {/* Top Row: Type + Time + Amount */}
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                              <div
                                                className={`p-1.5 rounded-full ${isCredit ? "bg-green-100" : "bg-red-100"}`}
                                              >
                                                {isCredit ? (
                                                  <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                                ) : (
                                                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                                                )}
                                              </div>
                                              <span
                                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                  isCredit
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                              >
                                                {isCredit ? "CREDIT" : "DEBIT"}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                •
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {transactionDate.toLocaleTimeString(
                                                  "en-US",
                                                  {
                                                    timeZone: "UTC",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: false,
                                                  },
                                                )}
                                              </span>
                                            </div>
                                            <div
                                              className={`text-right ${isCredit ? "text-green-600" : "text-red-600"}`}
                                            >
                                              <span className="text-lg font-bold">
                                                {isCredit ? "+" : "-"}$
                                                {formattedAmount}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Description */}
                                          <p className="text-sm text-gray-800 mt-2 mb-2 pl-7">
                                            {displayText}
                                          </p>

                                          {/* Bottom Row: Transaction ID (left) + Balance (right) */}
                                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-400">
                                              Transaction ID: {transaction.id}
                                            </p>
                                            {transaction.running_balance !==
                                              undefined && (
                                              <p className="text-xs font-medium text-gray-600">
                                                Balance: $
                                                {transaction.running_balance.toFixed(
                                                  2,
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ),
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* LOANS TAB */}
            {activeTab === "loans" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loans.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-sm border">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No loan applications yet</p>
                  </div>
                ) : (
                  loans.map((loan) => {
                    const statusBadge = getStatusBadge(loan.status);
                    const LoanIcon = getLoanIcon(loan.loanType);
                    return (
                      <div
                        key={loan.id}
                        className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {LoanIcon}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {loan.loanType} Loan
                              </h3>
                              <p className="text-2xl font-bold text-blue-600">
                                ${loan.amount?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                          >
                            {statusBadge.icon}
                            {loan.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {loan.interestRate && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">
                                Interest Rate
                              </p>
                              <p className="text-lg font-semibold text-gray-900">
                                {loan.interestRate}%
                              </p>
                            </div>
                          )}
                          {loan.minMonths && loan.maxMonths && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {loan.minMonths}-{loan.maxMonths} months
                              </p>
                            </div>
                          )}
                        </div>
                        {loan.minAmount && loan.maxAmount && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">
                              Eligible Amount Range
                            </p>
                            <p className="text-sm font-medium text-blue-700">
                              ${loan.minAmount?.toLocaleString()} - $
                              {loan.maxAmount?.toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Applied:</span>{" "}
                            {new Date(loan.createdAt).toLocaleDateString()}
                          </p>
                          {loan.status === "APPROVED" && loan.startDate && (
                            <p>
                              <span className="font-medium">Start Date:</span>{" "}
                              {new Date(loan.startDate).toLocaleDateString()}
                            </p>
                          )}
                          {loan.status === "APPROVED" && loan.endDate && (
                            <p>
                              <span className="font-medium">End Date:</span>{" "}
                              {new Date(loan.endDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {loan.status === "APPROVED" && loan.approvedAt && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Approved on{" "}
                              {new Date(loan.approvedAt).toLocaleDateString()}
                              {loan.approvedBy &&
                                ` by User #${loan.approvedBy}`}
                            </p>
                          </div>
                        )}
                        {loan.status === "REJECTED" && loan.rejectionReason && (
                          <div className="mt-4 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-700 flex items-center gap-1">
                              <XCircle className="w-4 h-4" />
                              Rejected: {loan.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Create Account Modal */}
      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Account
            </h2>

            {/* Show which accounts are available */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Available account types:
                {!hasSavings && (
                  <span className="font-semibold ml-1">Savings</span>
                )}
                {!hasSavings && !hasCurrent && <span className="mx-1">•</span>}
                {!hasCurrent && <span className="font-semibold">Current</span>}
              </p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Savings Option - Disabled if already have Savings */}
                  <button
                    type="button"
                    onClick={() => setAccountForm({ accountType: "savings" })}
                    disabled={hasSavings}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accountForm.accountType === "savings"
                        ? "border-blue-500 bg-blue-50"
                        : hasSavings
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      Savings Account
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      • Interest earning
                      <br />• Minimum balance
                    </div>
                    {hasSavings && (
                      <div className="text-xs text-green-600 mt-2">
                        ✓ Already created
                      </div>
                    )}
                  </button>

                  {/* Current Option - Disabled if already have Current */}
                  <button
                    type="button"
                    onClick={() => setAccountForm({ accountType: "current" })}
                    disabled={hasCurrent}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accountForm.accountType === "current"
                        ? "border-blue-500 bg-blue-50"
                        : hasCurrent
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      Current Account
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      • Daily transactions
                      <br />• No interest
                    </div>
                    {hasCurrent && (
                      <div className="text-xs text-green-600 mt-2">
                        ✓ Already created
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    !hasSavings && !hasCurrent
                      ? false
                      : hasSavings && hasCurrent
                        ? true
                        : false
                  }
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    hasSavings && hasCurrent
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAccount(false);
                    setAccountForm({ accountType: "savings" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>

              {/* Show message when both accounts already exist */}
              {hasSavings && hasCurrent && (
                <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg mt-2">
                  You already have both Savings and Current accounts
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Withdraw Money
            </h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account
                </label>
                <select
                  value={selectedAccount?.id || ""}
                  onChange={(e) =>
                    setSelectedAccount(
                      activeAccounts.find(
                        (acc) => acc.id === parseInt(e.target.value),
                      ) || null,
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account...</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      Account #{account.accountNumber} - $
                      {account.balance?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawForm.amount}
                  onChange={(e) =>
                    setWithdrawForm({ ...withdrawForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={withdrawForm.description}
                  onChange={(e) =>
                    setWithdrawForm({
                      ...withdrawForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Transfer Money
            </h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account
                </label>
                <select
                  value={selectedAccount?.id || ""}
                  onChange={(e) =>
                    setSelectedAccount(
                      activeAccounts.find(
                        (acc) => acc.id === parseInt(e.target.value),
                      ) || null,
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select account...</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      Account #{account.accountNumber} - $
                      {account.balance?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account Number
                </label>
                <input
                  type="text"
                  value={transferForm.toAccountNumber}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      toAccountNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter recipient account number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transferForm.amount}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransfer(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Application Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Apply for Loan
            </h2>
            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Type
                </label>
                <select
                  value={loanForm.loanType}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, loanType: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select loan type...</option>
                  <option value="CAR">
                    Car Loan (12-60 months, 12% interest)
                  </option>
                  <option value="HOME">
                    Home Loan (60-240 months, 9% interest)
                  </option>
                  <option value="PERSONAL">
                    Personal Loan (6-36 months, 18% interest)
                  </option>
                  <option value="EDUCATION">
                    Education Loan (12-84 months, 7.5% interest)
                  </option>
                  <option value="MARRIAGE">
                    Marriage Loan (12-60 months, 11% interest)
                  </option>
                  <option value="MEDICAL">
                    Medical Loan (6-48 months, 10% interest)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1000"
                  value={loanForm.amount}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter loan amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={loanForm.duration}
                  onChange={(e) =>
                    setLoanForm({ ...loanForm, duration: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter duration in months"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoanForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
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
