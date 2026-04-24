import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/user.ts";
import { accountService } from "../services/account.ts";
import { loanService } from "../services/loan.ts";
import NotificationBell from "../components/NotificationBell";
import {
  Users,
  UserCheck,
  Building,
  RefreshCw,
  LogOut,
  DollarSign,
  CreditCard,
  FileText,
  Eye,
  Search,
  Clock,
  AlertCircle,
  Trash2,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { navigate } from "../components/Router";
import ProfileModal from "../components/ProfileModal";

// ==================== Types ====================
interface Customer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  is_user_approved: number;
  is_admin_approved: number;
  approved_by_user?: number;
  associated_user_name?: string;
  associated_user_email?: string;
}

interface Account {
  account_id: number;
  customer_id: number;
  customer_name: string;
  account_type: string | null;
  balance: number;
  status: string;
  opened_date: string;
  customer_email?: string;
}

interface Loan {
  loan_id: number;
  customer_name: string;
  loan_type: string;
  loan_amount: number;
  interest_rate: number;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

type TabType = "all-customers" | "pending-loans" | "deposit" | "accounts";

// ==================== Helper Functions ====================
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const getStatusBadge = (status: string = "") => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "active":
    case "approved":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <CheckCircle className="w-3 h-3" />,
      };
    case "pending":
    case "inactive":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: <Clock className="w-3 h-3" />,
      };
    case "rejected":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <XCircle className="w-3 h-3" />,
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: <AlertCircle className="w-3 h-3" />,
      };
  }
};

// ==================== Main Component ====================
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("all-customers");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ==================== Data States ====================
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // ==================== UI States ====================
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [showCustomerDeleteConfirm, setShowCustomerDeleteConfirm] = useState<
    number | null
  >(null);
  const [loanFilter, setLoanFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [customerFilter, setCustomerFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // ==================== Deposit Form State ====================
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositData, setDepositData] = useState({
    accountId: "",
    amount: "",
    description: "",
  });

  // ==================== Filtered Data ====================
  const filteredAccounts = accounts.filter((account) => {
    const customerName = account.customer_name?.toLowerCase() || "";
    const accountId = account.account_id?.toString() || "";
    const search = searchTerm.toLowerCase();
    return customerName.includes(search) || accountId.includes(search);
  });

  const getFilteredCustomers = () => {
    if (!Array.isArray(allCustomers)) return [];

    let filtered = [...allCustomers];
    const currentUserId = user?.id;

    if (customerFilter === "all") {
      return filtered;
    } else if (customerFilter === "pending") {
      filtered = filtered.filter((c) => !c.approved_by_user);
    } else if (customerFilter === "approved") {
      filtered = filtered.filter(
        (c) =>
          c.approved_by_user === currentUserId &&
          Number(c.is_user_approved) === 1 &&
          Number(c.is_admin_approved) === 1,
      );
    } else if (customerFilter === "rejected") {
      filtered = filtered.filter(
        (c) =>
          c.approved_by_user === currentUserId &&
          Number(c.is_user_approved) === 0 &&
          Number(c.is_admin_approved) === 0,
      );
    }

    return filtered.filter(
      (c) =>
        (c.customer_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase(),
        ) ||
        (c.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (c.phone || "").includes(searchTerm),
    );
  };

  const filteredCustomers = getFilteredCustomers();

  // ==================== Count Calculations ====================
  const totalCustomers = Array.isArray(allCustomers) ? allCustomers.length : 0;
  const pendingCustomersCount = Array.isArray(allCustomers)
    ? allCustomers.filter((c) => !c.approved_by_user).length
    : 0;

  const associatedCustomersCount = Array.isArray(allCustomers)
    ? allCustomers.filter((c) => c.approved_by_user === user?.id).length
    : 0;

  const approvedCustomersCount = Array.isArray(allCustomers)
    ? allCustomers.filter(
        (c) =>
          c.approved_by_user === user?.id &&
          Number(c.is_user_approved) === 1 &&
          Number(c.is_admin_approved) === 1,
      ).length
    : 0;
  const rejectedCustomersCount = Array.isArray(allCustomers)
    ? allCustomers.filter(
        (c) =>
          c.approved_by_user === user?.id &&
          Number(c.is_user_approved) === 0 &&
          Number(c.is_admin_approved) === 0,
      ).length
    : 0;

  const unclaimedCustomers = Array.isArray(allCustomers)
    ? allCustomers.filter((c) => !c.approved_by_user)
    : [];

  const filteredLoans = Array.isArray(loans)
    ? loans.filter((loan) => {
        if (loanFilter === "all") return true;
        return loan.status?.toLowerCase() === loanFilter;
      })
    : [];

  const totalLoans = Array.isArray(loans) ? loans.length : 0;
  const pendingLoansCount = Array.isArray(loans)
    ? loans.filter((l) => l.status?.toLowerCase() === "pending").length
    : 0;
  const approvedLoansCount = Array.isArray(loans)
    ? loans.filter((l) => l.status?.toLowerCase() === "approved").length
    : 0;
  const rejectedLoansCount = Array.isArray(loans)
    ? loans.filter((l) => l.status?.toLowerCase() === "rejected").length
    : 0;

  // ==================== Data Fetching ====================
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [all, loansData, accountsData] = await Promise.all([
        userService.getAllCustomers(),
        loanService.getAllLoans(),
        accountService.getUserAssociatedAccounts(),
      ]);

      setAllCustomers(Array.isArray(all) ? all : []);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (err: any) {
      console.error("❌ Error fetching data:", err);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ==================== Customer Actions ====================
  const handleApproveCustomer = async (customerId: number) => {
    try {
      await userService.approveCustomer(customerId);
      setMessage({ type: "success", text: "Customer approved successfully!" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to approve customer",
      });
    }
  };

  const handleRejectCustomer = async (customerId: number) => {
    try {
      await userService.rejectCustomer(customerId);
      setMessage({ type: "success", text: "Customer rejected" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to reject customer",
      });
    }
  };

  const handleDeleteRejectedCustomer = async (customerId: number) => {
    try {
      await userService.deleteRejectedCustomer(customerId);
      setMessage({
        type: "success",
        text: "Rejected customer deleted permanently",
      });
      setShowCustomerDeleteConfirm(null);
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete customer",
      });
    }
  };

  // ==================== Loan Actions ====================
  const handleApproveLoan = async (loanId: number) => {
    const approved_amount = prompt("Enter approved amount:");
    if (!approved_amount) return;

    const duration_months = prompt("Enter duration in months:");
    if (!duration_months) return;

    try {
      await loanService.approveLoan(loanId, {
        approved_amount: parseFloat(approved_amount),
        duration_months: parseInt(duration_months),
      });
      setMessage({ type: "success", text: "Loan approved successfully!" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to approve loan",
      });
    }
  };

  const handleRejectLoan = async (loanId: number) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;

    try {
      await loanService.rejectLoan(loanId, reason);
      setMessage({ type: "success", text: "Loan rejected" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to reject loan",
      });
    }
  };

  const handleDeleteRejectedLoan = async (loanId: number) => {
    try {
      await loanService.deleteRejectedLoan(loanId);
      setMessage({
        type: "success",
        text: "Rejected loan deleted permanently",
      });
      setShowDeleteConfirm(null);
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete loan",
      });
    }
  };

  // ==================== Account Actions ====================
  const handleApproveAccount = async (accountId: number) => {
    try {
      await accountService.approve(accountId);
      setMessage({ type: "success", text: "Account approved successfully" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to approve account",
      });
    }
  };

  const handleRejectAccount = async (accountId: number) => {
    try {
      await accountService.reject(accountId);
      setMessage({ type: "success", text: "Account rejected" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to reject account",
      });
    }
  };

  const handleDeleteRejectedAccount = async (accountId: number) => {
    try {
      await accountService.deleteRejected(accountId);
      setMessage({
        type: "success",
        text: "Rejected account deleted permanently",
      });
      setShowDeleteConfirm(null);
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete account",
      });
    }
  };

  // ==================== Deposit Action ====================
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.depositMoney({
        accountId: parseInt(depositData.accountId),
        amount: parseFloat(depositData.amount),
        description: depositData.description,
      });

      setMessage({ type: "success", text: "Deposit successful!" });
      setShowDepositForm(false);
      setDepositData({ accountId: "", amount: "", description: "" });
      fetchAllData();
    } catch (err: any) {
      console.error("❌ Deposit error:", err);
      setMessage({ type: "error", text: err.message || "Deposit failed" });
    } finally {
      setLoading(false);
    }
  };

  // ==================== Profile Update ====================
  const handleProfileUpdate = () => {
    fetchAllData();
  };

  // ==================== Logout ====================
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==================== Effects ====================
  useEffect(() => {
    if (depositData.accountId && activeTab === "deposit") {
      setShowDepositForm(true);
    }
  }, [depositData.accountId, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name} •{" "}
                <span className="font-mono text-blue-600">ID: {user?.id}</span>
              </p>
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
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <QuickStatCard
            label="Pending Customers"
            value={pendingCustomersCount}
            icon={<Users className="w-8 h-8 text-yellow-500" />}
          />
          <QuickStatCard
            label="My Customers"
            value={associatedCustomersCount}
            icon={<Building className="w-8 h-8 text-blue-500" />}
          />
          <QuickStatCard
            label="Total Loans"
            value={totalLoans}
            icon={<FileText className="w-8 h-8 text-orange-500" />}
          />
          <QuickStatCard
            label="Total Accounts"
            value={accounts.length}
            icon={<CreditCard className="w-8 h-8 text-green-500" />}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              <TabButton
                active={activeTab === "all-customers"}
                onClick={() => setActiveTab("all-customers")}
                icon={<Eye className="w-4 h-4" />}
                label="All Customers"
                count={unclaimedCustomers.length}
              />
              <TabButton
                active={activeTab === "accounts"}
                onClick={() => setActiveTab("accounts")}
                icon={<CreditCard className="w-4 h-4" />}
                label="Managed Accounts"
                count={accounts.length}
              />
              <TabButton
                active={activeTab === "pending-loans"}
                onClick={() => setActiveTab("pending-loans")}
                icon={<FileText className="w-4 h-4" />}
                label="Loans"
                count={totalLoans}
              />
              <TabButton
                active={activeTab === "deposit"}
                onClick={() => setActiveTab("deposit")}
                icon={<DollarSign className="w-4 h-4" />}
                label="Deposit Money"
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* All Customers Tab with Filters */}
            {activeTab === "all-customers" && (
              <AllCustomersTable
                customers={filteredCustomers}
                totalCount={totalCustomers}
                pendingCount={pendingCustomersCount}
                approvedCount={approvedCustomersCount}
                rejectedCount={rejectedCustomersCount}
                filter={customerFilter}
                onFilterChange={setCustomerFilter}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onApprove={handleApproveCustomer}
                onReject={handleRejectCustomer}
                onDelete={handleDeleteRejectedCustomer}
                showDeleteConfirm={showCustomerDeleteConfirm}
                setShowDeleteConfirm={setShowCustomerDeleteConfirm}
                currentUserId={user?.id}
              />
            )}

            {/* Loans Tab with Filters */}
            {activeTab === "pending-loans" && (
              <LoansTable
                loans={filteredLoans}
                totalCount={totalLoans}
                pendingCount={pendingLoansCount}
                approvedCount={approvedLoansCount}
                rejectedCount={rejectedLoansCount}
                loading={loading}
                filter={loanFilter}
                onFilterChange={setLoanFilter}
                onApprove={handleApproveLoan}
                onReject={handleRejectLoan}
                onDelete={handleDeleteRejectedLoan}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
              />
            )}

            {/* Deposit Tab */}
            {activeTab === "deposit" && (
              <DepositForm
                accounts={filteredAccounts}
                showForm={showDepositForm}
                setShowForm={setShowDepositForm}
                depositData={depositData}
                setDepositData={setDepositData}
                onDeposit={handleDeposit}
                loading={loading}
              />
            )}

            {/* Accounts Tab */}
            {activeTab === "accounts" && (
              <AccountsTable
                accounts={filteredAccounts}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onApprove={handleApproveAccount}
                onReject={handleRejectAccount}
                onDelete={handleDeleteRejectedAccount}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                onDeposit={(accountId: number) => {
                  setDepositData({
                    accountId: accountId.toString(),
                    amount: "",
                    description: "",
                  });
                  setActiveTab("deposit");
                  setShowDepositForm(true);
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}

// ==================== Subcomponents (keep all your existing subcomponents here) ====================
// QuickStatCard, TabButton, AllCustomersTable, LoansTable, AccountsTable, DepositForm, LoadingSpinner, EmptyState, FilterButton, ActionButton
// ... (all your existing subcomponents remain exactly the same)

// ==================== Subcomponents ====================

const QuickStatCard = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label, count }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 flex items-center gap-2 border-b-2 transition ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    {icon}
    {label}
    {count > 0 && (
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

// Enhanced All Customers Table Component with Filters
const AllCustomersTable = ({
  customers,
  totalCount,
  pendingCount,
  approvedCount,
  rejectedCount,
  filter,
  onFilterChange,
  loading,
  searchTerm,
  onSearchChange,
  onApprove,
  onReject,
  onDelete,
  showDeleteConfirm,
  setShowDeleteConfirm,
  currentUserId,
}: any) => {
  const customerArray = Array.isArray(customers) ? customers : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Management
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <FilterButton
            label="All"
            count={totalCount}
            active={filter === "all"}
            onClick={() => onFilterChange("all")}
            color="blue"
          />
          <FilterButton
            label="Pending"
            count={pendingCount}
            active={filter === "pending"}
            onClick={() => onFilterChange("pending")}
            color="yellow"
          />
          <FilterButton
            label="Approved"
            count={approvedCount}
            active={filter === "approved"}
            onClick={() => onFilterChange("approved")}
            color="green"
          />
          <FilterButton
            label="Rejected"
            count={rejectedCount}
            active={filter === "rejected"}
            onClick={() => onFilterChange("rejected")}
            color="red"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : customerArray.length === 0 ? (
        <EmptyState icon={UserCheck} message={`No ${filter} customers found`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Associated User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                {/* ✅ Only show Actions column when filter is "pending" */}
                {filter === "pending" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerArray.map((customer: any) => {
                const userApproved = Number(customer.is_user_approved);
                const adminApproved = Number(customer.is_admin_approved);

                const isUnclaimed = !customer.approved_by_user;
                const isMyCustomer =
                  customer.approved_by_user === currentUserId;
                const isFullyApproved =
                  userApproved === 1 && adminApproved === 1;
                const isRejected =
                  customer.approved_by_user &&
                  userApproved === 0 &&
                  adminApproved === 0;

                let statusText = "Pending";
                let statusColor = "bg-yellow-100 text-yellow-800";

                if (isFullyApproved) {
                  statusText = "Approved";
                  statusColor = "bg-green-100 text-green-800";
                } else if (isRejected) {
                  statusText = "Rejected";
                  statusColor = "bg-red-100 text-red-800";
                }

                return (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {customer.customer_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {customer.email || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {customer.phone || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.approved_by_user ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          User #{customer.approved_by_user}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusColor}`}
                      >
                        {statusText}
                      </span>
                    </td>

                    {/* ✅ Only show Actions cell when filter is "pending" */}
                    {filter === "pending" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Show Approve/Reject ONLY for unclaimed customers when in pending filter */}
                        {isUnclaimed && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onApprove(customer.customer_id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onReject(customer.customer_id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Show delete button for rejected customers (visible in all filters) */}
                        {isRejected && isMyCustomer && (
                          <>
                            {showDeleteConfirm === customer.customer_id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onDelete(customer.customer_id)}
                                  className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setShowDeleteConfirm(customer.customer_id)
                                }
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
// Enhanced Loans Table Component
const LoansTable = ({
  loans,
  totalCount,
  pendingCount,
  approvedCount,
  rejectedCount,
  loading,
  filter,
  onFilterChange,
  onApprove,
  onReject,
  onDelete,
  showDeleteConfirm,
  setShowDeleteConfirm,
}: any) => {
  const loansArray = Array.isArray(loans) ? loans : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Loan Management</h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <FilterButton
            label="All"
            count={totalCount}
            active={filter === "all"}
            onClick={() => onFilterChange("all")}
            color="blue"
          />
          <FilterButton
            label="Pending"
            count={pendingCount}
            active={filter === "pending"}
            onClick={() => onFilterChange("pending")}
            color="yellow"
          />
          <FilterButton
            label="Approved"
            count={approvedCount}
            active={filter === "approved"}
            onClick={() => onFilterChange("approved")}
            color="green"
          />
          <FilterButton
            label="Rejected"
            count={rejectedCount}
            active={filter === "rejected"}
            onClick={() => onFilterChange("rejected")}
            color="red"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : loansArray.length === 0 ? (
        <EmptyState icon={FileText} message={`No ${filter} loans found`} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {loansArray.map((loan: any) => {
            const statusBadge = getStatusBadge(loan.status);
            return (
              <div
                key={loan.loan_id}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                      >
                        {statusBadge.icon}
                        {loan.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Loan #{loan.loan_id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium text-gray-900">
                          {loan.customer_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Loan Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {loan.loan_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${loan.loan_amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Interest Rate</p>
                        <p className="text-sm font-medium text-gray-900">
                          {loan.interest_rate}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Applied: {new Date(loan.created_at).toLocaleDateString()}
                      {loan.approved_at &&
                        ` • Approved: ${new Date(loan.approved_at).toLocaleDateString()}`}
                      {loan.rejected_at &&
                        ` • Rejected: ${new Date(loan.rejected_at).toLocaleDateString()}`}
                    </div>

                    {loan.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-700">
                          <span className="font-medium">Rejection Reason:</span>{" "}
                          {loan.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {loan.status?.toLowerCase() === "pending" && (
                      <>
                        <ActionButton
                          onClick={() => onApprove(loan.loan_id)}
                          color="green"
                          label="Approve"
                        />
                        <ActionButton
                          onClick={() => onReject(loan.loan_id)}
                          color="red"
                          label="Reject"
                        />
                      </>
                    )}

                    {loan.status?.toLowerCase() === "rejected" && (
                      <>
                        {showDeleteConfirm === loan.loan_id ? (
                          <div className="flex gap-2">
                            <ActionButton
                              onClick={() => onDelete(loan.loan_id)}
                              color="red"
                              label="Confirm"
                            />
                            <ActionButton
                              onClick={() => setShowDeleteConfirm(null)}
                              color="gray"
                              label="Cancel"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(loan.loan_id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Accounts Table Component
const AccountsTable = ({
  accounts,
  loading,
  searchTerm,
  onSearchChange,
  onApprove,
  onReject,
  onDelete,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onDeposit,
}: any) => {
  const accountsArray = Array.isArray(accounts) ? accounts : [];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Customer Accounts Under Your Management
      </h3>

      {/* Search Bar */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer name or account number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : accountsArray.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          message="No accounts found under your management"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Opened
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountsArray.map((account: any) => (
                <tr key={account.account_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {account.customer_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {account.account_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {account.account_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${account.balance?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                        getStatusBadge(account.status).bg
                      } ${getStatusBadge(account.status).text}`}
                    >
                      {getStatusBadge(account.status).icon}
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(account.opened_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(account.status === "PENDING" ||
                      account.status === "INACTIVE") && (
                      <div className="flex gap-2">
                        <ActionButton
                          onClick={() => onApprove(account.account_id)}
                          color="green"
                          label="Approve"
                        />
                        <ActionButton
                          onClick={() => onReject(account.account_id)}
                          color="red"
                          label="Reject"
                        />
                      </div>
                    )}

                    {account.status === "ACTIVE" && (
                      <button
                        onClick={() => onDeposit(account.account_id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        <DollarSign className="w-4 h-4" />
                        Deposit
                      </button>
                    )}

                    {account.status === "REJECTED" && (
                      <>
                        {showDeleteConfirm === account.account_id ? (
                          <div className="flex gap-2">
                            <ActionButton
                              onClick={() => onDelete(account.account_id)}
                              color="red"
                              label="Confirm"
                            />
                            <ActionButton
                              onClick={() => setShowDeleteConfirm(null)}
                              color="gray"
                              label="Cancel"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setShowDeleteConfirm(account.account_id)
                            }
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Deposit Form Component
const DepositForm = ({
  accounts,
  showForm,
  setShowForm,
  depositData,
  setDepositData,
  onDeposit,
  loading,
}: any) => {
  const accountsArray = Array.isArray(accounts) ? accounts : [];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        Deposit Money to Customer Account
      </h3>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <DollarSign className="w-5 h-5" />
          New Deposit
        </button>
      ) : (
        <form onSubmit={onDeposit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <select
              value={depositData.accountId}
              onChange={(e) =>
                setDepositData({ ...depositData, accountId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose account...</option>
              {accountsArray
                .filter((a: any) => a.status?.toUpperCase() !== "REJECTED")
                .map((account: any) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.customer_name} - Account #{account.account_id}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={depositData.amount}
              onChange={(e) =>
                setDepositData({ ...depositData, amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Deposit"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Helper Components
const LoadingSpinner = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  </div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg">
    <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">{message}</p>
  </div>
);

const FilterButton = ({ label, count, active, onClick, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: active
      ? "bg-blue-600 text-white"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100",
    yellow: active
      ? "bg-yellow-600 text-white"
      : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    green: active
      ? "bg-green-600 text-white"
      : "bg-green-50 text-green-700 hover:bg-green-100",
    red: active
      ? "bg-red-600 text-white"
      : "bg-red-50 text-red-700 hover:bg-red-100",
    gray: active
      ? "bg-gray-600 text-white"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };

  const colorClass = colorClasses[color] || colorClasses.gray;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${colorClass}`}
    >
      {label} ({count})
    </button>
  );
};

const ActionButton = ({ onClick, color, label }: any) => {
  const colorClasses: Record<string, string> = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    gray: "bg-gray-500 hover:bg-gray-600 text-white",
  };

  const colorClass = colorClasses[color] || colorClasses.gray;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition ${colorClass}`}
    >
      {label}
    </button>
  );
};
