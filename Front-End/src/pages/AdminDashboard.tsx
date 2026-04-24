import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/admin";
import {
  Users,
  UserCheck,
  Building,
  RefreshCw,
  LogOut,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import ProfileModal from "../components/ProfileModal";
import { navigate } from "../components/Router";

// Types
interface User {
  user_id: number;
  full_name: string;
  email: string;
  created_at: string;
  is_approved: number;
  is_rejected?: number;
}

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
  approved_by_user_name?: string;
}

type TabType = "users" | "customers";
type FilterType = "all" | "pending" | "approved" | "rejected";

// Helper Functions
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [userFilter, setUserFilter] = useState<FilterType>("all");
  const [customerFilter, setCustomerFilter] = useState<FilterType>("all");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Data states
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [users, customers] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllCustomers(),
      ]);
      setAllUsers(users || []);
      setAllCustomers(customers || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setMessage({ type: "error", text: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter users based on selected filter
  const getFilteredUsers = () => {
    let filtered = [...allUsers];

    if (userFilter === "pending") {
      filtered = filtered.filter(
        (u) => Number(u.is_approved) === 0 && Number(u.is_rejected) !== 1,
      );
    } else if (userFilter === "approved") {
      filtered = filtered.filter((u) => Number(u.is_approved) === 1);
    } else if (userFilter === "rejected") {
      filtered = filtered.filter((u) => Number(u.is_rejected) === 1);
    }

    return filtered.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  // Filter customers based on selected filter
  const getFilteredCustomers = () => {
    let filtered = [...allCustomers];

    if (customerFilter === "pending") {
      filtered = filtered.filter((c) => Number(c.is_admin_approved) === 0);
    } else if (customerFilter === "approved") {
      filtered = filtered.filter((c) => Number(c.is_admin_approved) === 1);
    } else if (customerFilter === "rejected") {
      filtered = filtered.filter(
        (c) =>
          Number(c.is_admin_approved) === 0 && Number(c.is_user_approved) === 0,
      );
    }

    return filtered.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm),
    );
  };

  const filteredUsers = getFilteredUsers();
  const filteredCustomers = getFilteredCustomers();

  // Counts for badges
  const userCounts = {
    all: allUsers.length,
    pending: allUsers.filter(
      (u) => Number(u.is_approved) === 0 && Number(u.is_rejected) !== 1,
    ).length,
    approved: allUsers.filter((u) => Number(u.is_approved) === 1).length,
    rejected: allUsers.filter((u) => Number(u.is_rejected) === 1).length,
  };

  const customerCounts = {
    all: allCustomers.length,
    pending: allCustomers.filter((c) => Number(c.is_admin_approved) === 0)
      .length,
    approved: allCustomers.filter((c) => Number(c.is_admin_approved) === 1)
      .length,
    rejected: allCustomers.filter(
      (c) =>
        Number(c.is_admin_approved) === 0 && Number(c.is_user_approved) === 0,
    ).length,
  };

  // Check if there are any pending items for conditional Actions column
  const hasPendingUsers = userCounts.pending > 0;
  const hasPendingCustomers = customerCounts.pending > 0;

  // User Actions
  const handleApproveUser = async (userId: number) => {
    try {
      await adminService.approveUser(userId);
      setMessage({ type: "success", text: "User approved successfully" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to approve user",
      });
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      await adminService.rejectUser(userId);
      setMessage({ type: "success", text: "User rejected" });
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to reject user",
      });
    }
  };

  const handleDeleteRejectedUser = async (userId: number) => {
    try {
      await adminService.deleteRejectedUser(userId);
      setMessage({
        type: "success",
        text: "Rejected user deleted permanently",
      });
      setShowDeleteConfirm(null);
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete user",
      });
    }
  };

  // Customer Actions
  const handleApproveCustomer = async (customerId: number) => {
    try {
      await adminService.approveCustomer(customerId);
      setMessage({ type: "success", text: "Customer approved successfully" });
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
      await adminService.rejectCustomer(customerId);
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
      await adminService.deleteRejectedCustomer(customerId);
      setMessage({
        type: "success",
        text: "Rejected customer deleted permanently",
      });
      setShowDeleteConfirm(null);
      fetchAllData();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to delete customer",
      });
    }
  };

  const handleProfileUpdate = () => {
    fetchAllData();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get status display for user
  const getUserStatus = (user: User) => {
    const isApproved = Number(user.is_approved) === 1;
    const isRejected = Number(user.is_rejected) === 1;

    if (isApproved) return "approved";
    if (isRejected) return "rejected";
    return "pending";
  };

  // Get status display for customer
  const getCustomerStatus = (customer: Customer) => {
    const isAdminApproved = Number(customer.is_admin_approved) === 1;
    const isRejected =
      Number(customer.is_admin_approved) === 0 &&
      Number(customer.is_user_approved) === 0;

    if (isAdminApproved) return "approved";
    if (isRejected) return "rejected";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name} •{" "}
                <span className="font-mono text-blue-600">ID: {user?.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
                title="Profile"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={fetchAllData}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
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

        {/* Quick Stats Cards - Conditional based on active tab */}
        {activeTab === "users" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userCounts.all}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userCounts.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Approved Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userCounts.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Rejected Users</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userCounts.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Customers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerCounts.all}
                  </p>
                </div>
                <Building className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pending Customers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerCounts.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Approved Customers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerCounts.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Rejected Customers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerCounts.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition ${
                  activeTab === "users"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="w-4 h-4" />
                Users Management
                {userCounts.all > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {userCounts.all}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("customers")}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition ${
                  activeTab === "customers"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Building className="w-4 h-4" />
                Customers Management
                {customerCounts.all > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {customerCounts.all}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                {/* Filter Buttons */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Users Management
                  </h3>
                  <div className="flex gap-2">
                    <FilterButton
                      label="All"
                      count={userCounts.all}
                      active={userFilter === "all"}
                      onClick={() => setUserFilter("all")}
                      color="blue"
                    />
                    <FilterButton
                      label="Pending"
                      count={userCounts.pending}
                      active={userFilter === "pending"}
                      onClick={() => setUserFilter("pending")}
                      color="yellow"
                    />
                    <FilterButton
                      label="Approved"
                      count={userCounts.approved}
                      active={userFilter === "approved"}
                      onClick={() => setUserFilter("approved")}
                      color="green"
                    />
                    <FilterButton
                      label="Rejected"
                      count={userCounts.rejected}
                      active={userFilter === "rejected"}
                      onClick={() => setUserFilter("rejected")}
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
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <LoadingSpinner />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    message={`No ${userFilter} users found`}
                  />
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
                            Registered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          {hasPendingUsers && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((userItem) => {
                          const status = getUserStatus(userItem);
                          const badge = getStatusBadge(status);

                          return (
                            <tr
                              key={userItem.user_id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {userItem.full_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {userItem.user_id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {userItem.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {formatDate(userItem.created_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}
                                >
                                  {badge.icon}
                                  {status}
                                </span>
                              </td>
                              {hasPendingUsers && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {status === "pending" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleApproveUser(userItem.user_id)
                                        }
                                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRejectUser(userItem.user_id)
                                        }
                                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                  {status === "rejected" && (
                                    <>
                                      {showDeleteConfirm ===
                                      userItem.user_id ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() =>
                                              handleDeleteRejectedUser(
                                                userItem.user_id,
                                              )
                                            }
                                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() =>
                                              setShowDeleteConfirm(null)
                                            }
                                            className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            setShowDeleteConfirm(
                                              userItem.user_id,
                                            )
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
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
              <div>
                {/* Filter Buttons */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customers Management
                  </h3>
                  <div className="flex gap-2">
                    <FilterButton
                      label="All"
                      count={customerCounts.all}
                      active={customerFilter === "all"}
                      onClick={() => setCustomerFilter("all")}
                      color="blue"
                    />
                    <FilterButton
                      label="Pending"
                      count={customerCounts.pending}
                      active={customerFilter === "pending"}
                      onClick={() => setCustomerFilter("pending")}
                      color="yellow"
                    />
                    <FilterButton
                      label="Approved"
                      count={customerCounts.approved}
                      active={customerFilter === "approved"}
                      onClick={() => setCustomerFilter("approved")}
                      color="green"
                    />
                    <FilterButton
                      label="Rejected"
                      count={customerCounts.rejected}
                      active={customerFilter === "rejected"}
                      onClick={() => setCustomerFilter("rejected")}
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {loading ? (
                  <LoadingSpinner />
                ) : filteredCustomers.length === 0 ? (
                  <EmptyState
                    icon={Building}
                    message={`No ${customerFilter} customers found`}
                  />
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
                            Approved By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          {hasPendingCustomers && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => {
                          const status = getCustomerStatus(customer);
                          const badge = getStatusBadge(status);
                          const needsAction =
                            Number(customer.is_user_approved) === 1 &&
                            Number(customer.is_admin_approved) === 0;

                          return (
                            <tr
                              key={customer.customer_id}
                              className="hover:bg-gray-50"
                            >
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
                                  {customer.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {customer.phone}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {customer.approved_by_user ? (
                                  <span className="text-sm text-gray-900">
                                    {customer.approved_by_user_name ||
                                      `User #${customer.approved_by_user}`}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text}`}
                                >
                                  {badge.icon}
                                  {status === "pending" &&
                                  Number(customer.is_user_approved) === 1
                                    ? "Pending Admin"
                                    : status}
                                </span>
                              </td>
                              {hasPendingCustomers && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {needsAction && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleApproveCustomer(
                                            customer.customer_id,
                                          )
                                        }
                                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRejectCustomer(
                                            customer.customer_id,
                                          )
                                        }
                                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                  {status === "rejected" && (
                                    <>
                                      {showDeleteConfirm ===
                                      customer.customer_id ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() =>
                                              handleDeleteRejectedCustomer(
                                                customer.customer_id,
                                              )
                                            }
                                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() =>
                                              setShowDeleteConfirm(null)
                                            }
                                            className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-lg hover:bg-gray-100"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            setShowDeleteConfirm(
                                              customer.customer_id,
                                            )
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

// ==================== Helper Components ====================

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
  };
  const colorClass = colorClasses[color] || colorClasses.blue;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${colorClass}`}
    >
      {label} ({count})
    </button>
  );
};

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
