export interface User {
  id: number;
  email: string;
  role: "admin" | "user" | "customer";
  name: string;
  phone?: string;
  status?: "pending" | "approved" | "rejected";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Account {
  id: number; // maps to account_id
  customerId: number; // maps to customer_id
  customerName?: string; // optional - might need JOIN with Customers table
  accountNumber: number; // maps to account_id (same as id)
  accountType: string; // maps to account_type
  balance: number;
  status: "pending" | "approved" | "rejected" | "user_approved" | "active"; // added more status options
  createdAt: string; // maps to opened_date
  is_user_approved?: number; // from your table
  approved_by_user?: number; // from your table
  rejected_by_user?: number; // from your table
}

export interface Transaction {
  id: number;
  accountId: number;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  fromAccount?: string;
  toAccount?: string;
  description: string;
  createdAt: string;
  createdBy?: string;
}

export interface LoanRequest {
  id: number;
  amount: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "PENDING"
    | "APPROVED"
    | "REJECTED";
  createdAt: string;
  loanType: string; // From Loan_Policies
  interestRate: number; // From Loan_Policies
  startDate?: string;
  endDate?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  // Optional policy details for display
  minAmount?: number;
  maxAmount?: number;
  minMonths?: number;
  maxMonths?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
