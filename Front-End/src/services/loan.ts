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
    amount: number;
    loanType: string;
    duration: number;
  }) => {
    try {
      const response = await api.post("/loans/apply", {
        loan_amount: data.amount,
        loan_type: data.loanType,
        duration_months: data.duration,
      });
      return response;
    } catch (error) {
      console.error("Error creating loan:", error);
      throw error;
    }
  },

  // Get ALL loans for user dashboard
getAllLoans: async () => {
  try {
    const response = await api.get('/loan-approval/all');
    console.log('🔍 loanService.getAllLoans response:', response);
    return response; // Should be the array directly
  } catch (error) {
    console.error('Error in getAllLoans:', error);
    throw error;
  }
},

  // Get all pending loans (for user dashboard)
  getPendingLoans: async () => {
    try {
      const response = await api.get("/loan-approval/pending");
      return response;
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      throw error;
    }
  },

  // Approve loan (user side)
  approveLoan: async (loanId: number, data: { approved_amount: number; duration_months: number }) => {
    try {
      const response = await api.patch(`/loan-approval/approve/${loanId}`, data);
      return response;
    } catch (error) {
      console.error("Error approving loan:", error);
      throw error;
    }
  },

  // Reject loan (user side)
  rejectLoan: async (loanId: number,reason: string) => {
    try {
      const response = await api.patch(`/loan-approval/reject/${loanId}`, { reason });
      return response;
    } catch (error) {
      console.error("Error rejecting loan:", error);
      throw error;
    }
  },

  deleteRejectedLoan: async (loanId: number) => {
    const response = await api.delete(`/loan-approval/rejected/${loanId}`);
    return response;
  }
};

