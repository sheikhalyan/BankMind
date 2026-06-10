import { api } from "./api";

export const loanService = {
  // Get loans for a specific customer (for customer dashboard)
  getByCustomer: async (customerId: number) => {
    try {
      const response = await api.get(`/loans/customer/${customerId}`);
      return response;
    } catch (error) {
      console.error("Error fetching customer loans:", error);
      throw error;
    }
  },

  // Apply for a loan
  create: async (data: {
    policy_id: number;
    account_id: number;
    loan_amount: number;
    duration_months: number;
    auto_deduct?: boolean;
  }) => {
    try {
      const response = await api.post("/loans", data);  // send as-is, no remapping
      return response;
    } catch (error) {
      console.error("Error creating loan:", error);
      throw error;
    }
  },

  // Get ALL loans — GET /api/loans
  getAllLoans: async () => {
    try {
      const response = await api.get("/loans");
      console.log("🔍 loanService.getAllLoans response:", response);
      return response;
    } catch (error) {
      console.error("Error in getAllLoans:", error);
      throw error;
    }
  },

  // Get pending loans for staff — GET /api/loans/pending/staff
  getPendingLoans: async () => {
    try {
      const response = await api.get("/loans/pending/staff");
      return response;
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      throw error;
    }
  },

  // Approve loan (staff) — PUT /api/loans/:loanId/staff-approve
  approveLoan: async (loanId: number, data: { approved_amount: number; duration_months: number }) => {
    try {
      const response = await api.put(`/loans/${loanId}/staff-approve`, data);
      return response;
    } catch (error) {
      console.error("Error approving loan:", error);
      throw error;
    }
  },

  // Staff approve loan — PUT /api/loans/:loanId/staff-approve
  staffApproveLoan: async (loanId: number, data: { approved_amount: number; duration_months: number }) => {
    try {
      const response = await api.put(`/loans/${loanId}/staff-approve`, data);
      return response;
    } catch (error) {
      console.error("Error approving loan:", error);
      throw error;
    }
  },

  // Reject loan (staff) — PUT /api/loans/:loanId/staff-reject
  rejectLoan: async (loanId: number, reason: string) => {
    try {
      const response = await api.put(`/loans/${loanId}/staff-reject`, { reason });
      return response;
    } catch (error) {
      console.error("Error rejecting loan:", error);
      throw error;
    }
  },

  // Staff reject loan — PUT /api/loans/:loanId/staff-reject
  staffRejectLoan: async (loanId: number, reason: string) => {
    try {
      const response = await api.put(`/loans/${loanId}/staff-reject`, { reason });
      return response;
    } catch (error) {
      console.error("Error rejecting loan:", error);
      throw error;
    }
  },

  // Admin approve — PUT /api/loans/:loanId/admin-approve
  adminApproveLoan: async (loanId: number, data: { approved_amount: number; duration_months: number }) => {
    try {
      const response = await api.put(`/loans/${loanId}/admin-approve`, data);
      return response;
    } catch (error) {
      console.error("Error admin approving loan:", error);
      throw error;
    }
  },

  // Admin reject — PUT /api/loans/:loanId/admin-reject
  adminRejectLoan: async (loanId: number, reason: string) => {
    try {
      const response = await api.put(`/loans/${loanId}/admin-reject`, { reason });
      return response;
    } catch (error) {
      console.error("Error admin rejecting loan:", error);
      throw error;
    }
  },

  deleteRejectedLoan: async (loanId: number) => {
    const response = await api.delete(`/loans/${loanId}`);
    return response;
  },

  getRepaymentSchedule: async (loanId: number) => {
    try {
      return await api.get(`/loan-repayments/${loanId}/schedule`);
    } catch (error) {
      console.error("Error fetching repayment schedule:", error);
      throw error;
    }
  },

  payInstallment: async (
    loanId: number,
    data: {
      repayment_ids: number[];
      from_account_id: number;
    }
  ) => {
    try {
      return await api.post(`/loan-repayments/${loanId}/pay`, data);
    } catch (error) {
      console.error("Error paying loan installment:", error);
      throw error;
    }
  },
};
