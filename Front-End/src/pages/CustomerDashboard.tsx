import { useState, useEffect } from "react";
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
} from "lucide-react";
import ProfileModal from "../components/ProfileModal";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "accounts" | "transactions" | "loans"
  >("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);

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

  // Filter active accounts (for transactions)
  const activeAccounts = visibleAccounts.filter(
    (acc) =>
      acc.status?.toLowerCase() === "active" ||
      acc.status?.toLowerCase() === "approved",
  );

  // Calculate total balance from active accounts only
  const totalBalance = activeAccounts.reduce(
    (sum, acc) => sum + (acc.balance || 0),
    0,
  );

  // Safe date formatter for SQL datetime
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";

    try {
      // Handle SQL Server format: "2026-01-08 14:38:09.140"
      // Replace space with 'T' for ISO parsing
      const isoString = dateString.replace(" ", "T");
      const date = new Date(isoString);

      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Get status badge with proper styling
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
      await Promise.all([
        loadAccounts(),
        activeTab === "transactions" && selectedAccount
          ? loadTransactions()
          : null,
        activeTab === "loans" ? loadLoans() : null,
      ]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    // Refresh any user-specific data if needed
    loadAccounts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Refresh Button */}
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

              {/* Logout Button */}
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
        {/* Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Total Balance (Active Accounts)
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
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setShowTransfer(true)}
                disabled={activeAccounts.length === 0}
                className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
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

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === "accounts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>My Accounts ({visibleAccounts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === "transactions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ArrowDownLeft className="w-5 h-5" />
                <span>Transactions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("loans")}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === "loans"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Loans ({loans.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div>
            {/* Accounts Tab */}
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
                        className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition ${
                          selectedAccount?.id === account.id
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
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

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div>
                {activeAccounts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                    <p className="text-gray-500">No active accounts yet</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Account to View Transactions
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {activeAccounts.map((account) => (
                          <button
                            key={account.id}
                            onClick={() => setSelectedAccount(account)}
                            className={`px-4 py-3 rounded-lg font-medium transition flex-1 min-w-[200px] ${
                              selectedAccount?.id === account.id
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 border hover:bg-gray-50"
                            }`}
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
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Transaction History
                        {selectedAccount && (
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            (Account #{selectedAccount.accountNumber})
                          </span>
                        )}
                      </h3>

                      {transactions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            No transactions yet for this account
                          </p>
                        </div>
                      ) : (
                        transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`p-2 rounded-full ${
                                    transaction.type === "deposit"
                                      ? "bg-green-100"
                                      : transaction.type === "withdrawal"
                                        ? "bg-red-100"
                                        : "bg-blue-100"
                                  }`}
                                >
                                  {transaction.type === "deposit" ? (
                                    <ArrowDownLeft
                                      key={`icon-${transaction.id}-deposit`}
                                      className="w-5 h-5 text-green-600"
                                    />
                                  ) : transaction.type === "withdrawal" ? (
                                    <ArrowUpRight
                                      key={`icon-${transaction.id}-withdraw`}
                                      className="w-5 h-5 text-red-600"
                                    />
                                  ) : (
                                    <Send
                                      key={`icon-${transaction.id}-transfer`}
                                      className="w-5 h-5 text-blue-600"
                                    />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 capitalize">
                                    {transaction.type}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {transaction.description}
                                  </p>
                                  {transaction.type === "transfer" &&
                                    transaction.toAccount && (
                                      <p
                                        key={`to-${transaction.id}`}
                                        className="text-xs text-gray-500 mt-1"
                                      >
                                        To: {transaction.toAccount}
                                      </p>
                                    )}
                                  <p
                                    key={`time-${transaction.id}`}
                                    className="text-xs text-gray-500 mt-1"
                                  >
                                    {formatDate(transaction.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div
                                key={`amount-${transaction.id}`}
                                className={`text-lg font-bold ${
                                  transaction.type === "deposit"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "deposit" ? "+" : "-"}$
                                {transaction.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Loans Tab */}
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
                        {/* Header with Loan Type and Status */}
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

                        {/* Loan Details Grid */}
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

                        {/* Loan Amount Range */}
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

                        {/* Dates */}
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

                        {/* Approval/Rejection Details */}
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

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Account
            </h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountForm({ accountType: "savings" })}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accountForm.accountType === "savings"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">Savings</div>
                    <div className="text-xs text-gray-500 mt-1">
                      • Interest earning
                      <br />• Minimum balance
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountForm({ accountType: "current" })}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      accountForm.accountType === "current"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">Current</div>
                    <div className="text-xs text-gray-500 mt-1">
                      • Daily transactions
                      <br />• No interest
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      visibleAccounts.find(
                        (acc) => acc.id === parseInt(e.target.value),
                      ) || null,
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      visibleAccounts.find(
                        (acc) => acc.id === parseInt(e.target.value),
                      ) || null,
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Enhanced Loan Application Modal */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
