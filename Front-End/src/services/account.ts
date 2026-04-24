import { api } from "./api";

export const accountService = {
  // Get accounts for a specific customer (for customer dashboard)
  getByCustomer: async (customerId: number) => {
    try {
      const response = await api.get(`/accounts/customer/${customerId}`);
      return response;
    } catch (error) {
      console.error("Error fetching customer accounts:", error);
      throw error;
    }
  },

  // Get all accounts
  getAll: async () => {
    try {
      const response = await api.get("/accounts/all");
      return response;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
  },

  // Get all accounts for customers associated with this user
  getUserAssociatedAccounts: async () => {
    try {
      const response = await api.get("/accounts/user-associated");
      return response;
    } catch (error) {
      console.error("Error fetching user associated accounts:", error);
      throw error;
    }
  },

  // Get pending accounts
  getPending: async () => {
    try {
      const response = await api.get("/accounts/pending");
      return response;
    } catch (error) {
      console.error("Error fetching pending accounts:", error);
      throw error;
    }
  },

  // Create account (customer side)
  create: async (accountData: { accountType: string }) => {
    try {
      // Convert to format expected by backend
      const payload = {
        account_type: accountData.accountType,
      };
      const response = await api.post("/accounts/create", payload);
      return response;
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  },

  // Approve account (user side)
  approve: async (accountId: number) => {
    try {
      const response = await api.put(`/accounts/approve/${accountId}`);
      return response;
    } catch (error) {
      console.error("Error approving account:", error);
      throw error;
    }
  },

  // Reject account (user side)
  reject: async (accountId: number) => {
    try {
      const response = await api.put(`/accounts/reject/${accountId}`);
      return response;
    } catch (error) {
      console.error("Error rejecting account:", error);
      throw error;
    }
  },
  // Delete rejected account (user side)
  deleteRejected: async (accountId: number) => {
    const response = await api.delete(`/accounts/rejected/${accountId}`);
    return response;
  },
};
