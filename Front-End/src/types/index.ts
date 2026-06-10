// ================================================================
//  USER  (Staff + Admin — from Users table)
// ================================================================
export interface User {
  id: number;
  email: string;
  role: 'STAFF' | 'ADMIN' | 'CUSTOMER';
  name: string;
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
}

// ================================================================
//  AUTH STATE
// ================================================================
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ================================================================
//  ACCOUNT  (from Accounts table)
// ================================================================
export interface Account {
  id: number;          // account_id
  accountNumber: string;          // account_number e.g. "BM1234567890"
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'FROZEN' | 'CLOSED' | string;
  openedDate?: string;          // opened_date
  createdAt?: string;          // alias used in some components
  customerId?: number;
  customerName?: string;
}

// ================================================================
//  TRANSACTION  (from Transactions table)
// ================================================================
export interface Transaction {
  id: number;
  fromAccountId?: number;
  toAccountId?: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT'
  | 'CREDIT' | 'DEBIT' | 'credit' | 'debit';  // display aliases
  amount: number;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  description?: string;
  transaction_reason?: string;
  isFraud?: boolean;
  createdAt: string;
  displayType?: 'CREDIT' | 'DEBIT';
  running_balance?: number;
}

// ================================================================
//  LOAN  (from Loans + Loan_Policies join)
// ================================================================
export interface LoanRequest {
  id: number;         // loan_id
  customerId?: number;
  customerName?: string;
  accountId?: number;
  policyId?: number;

  // Amount — backend sends loan_amount; dashboard uses amount
  loanAmount?: number;
  amount?: number;         // display alias
  approvedAmount?: number;

  durationMonths?: number;
  startDate?: string;
  endDate?: string;

  // Status — includes both new schema values and legacy 'APPROVED'
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'CLOSED' | 'DEFAULTED' | 'APPROVED' | string;

  autoDeduct?: boolean;
  createdAt: string;

  // From Loan_Policies join
  loanType: string;
  interestRate?: number;
  minAmount?: number;
  maxAmount?: number;
  minMonths?: number;
  maxMonths?: number;

  // Two-level approval info (new schema)
  staffApprovalStatus?: string;
  staffApprovalRemarks?: string;
  adminApprovalStatus?: string;
  adminApprovalRemarks?: string;

  // Legacy display fields — kept for dashboard compatibility
  approvedAt?: string;
  approvedBy?: number;
  rejectionReason?: string;
}

// ================================================================
//  CUSTOMER  (from Customers table)
// ================================================================
export interface Customer {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  assignedStaffId?: number;
  assignedStaffName?: string;
  createdAt: string;
  staffApprovalStatus?: string;
  staffApprovalRemarks?: string;
  adminApprovalStatus?: string;
  adminApprovalRemarks?: string;
}

// ================================================================
//  NOTIFICATION  (from Notifications table)
// ================================================================
export interface Notification {
  notificationId: number;
  recipientId: number;
  recipientType: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  type: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

// ================================================================
//  SUPPORT TICKET
// ================================================================
export interface SupportTicket {
  ticketId: number;
  customerId: number;
  assignedTo?: number;
  subject: string;
  description: string;
  category: 'ACCOUNT' | 'TRANSACTION' | 'LOAN' | 'GENERAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  resolvedAt?: string;
}

// ================================================================
//  GENERIC API RESPONSE
// ================================================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}