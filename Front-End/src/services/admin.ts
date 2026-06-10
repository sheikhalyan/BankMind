import { api } from './api';

export const adminService = {

  // ----------------------------------------------------------------
  // DASHBOARD STATS
  // ----------------------------------------------------------------
  getStats: async () => {
    return api.get('/admin/stats');
  },

  // ----------------------------------------------------------------
  // STAFF MANAGEMENT
  // ----------------------------------------------------------------
  getAllStaff: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/admin/staff${query}`);
  },

  getPendingStaff: async () => {
    return api.get('/admin/staff/pending');
  },

  getStaffById: async (userId: number) => {
    return api.get(`/admin/staff/${userId}`);
  },

  createStaff: async (data: { fullName: string; email: string; password: string }) => {
    return api.post('/admin/staff', data);
  },

  approveStaff: async (userId: number) => {
    return api.put(`/admin/staff/${userId}/approve`);
  },

  rejectStaff: async (userId: number, remarks?: string) => {
    return api.put(`/admin/staff/${userId}/reject`, { remarks });
  },

  suspendStaff: async (userId: number) => {
    return api.put(`/admin/staff/${userId}/suspend`);
  },

  reactivateStaff: async (userId: number) => {
    return api.put(`/admin/staff/${userId}/reactivate`);
  },

  // ----------------------------------------------------------------
  // CUSTOMER MANAGEMENT
  // ----------------------------------------------------------------
  getAllCustomers: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/admin/customers${query}`);
  },

  getPendingAdminApproval: async () => {
    return api.get('/admin/customers/pending-approval');
  },

  approveCustomer: async (customerId: number) => {
    return api.put(`/admin/customers/${customerId}/approve`);
  },

  rejectCustomer: async (customerId: number, remarks?: string) => {
    return api.put(`/admin/customers/${customerId}/reject`, { remarks });
  },

  suspendCustomer: async (customerId: number) => {
    return api.put(`/admin/customers/${customerId}/suspend`);
  },

  reactivateCustomer: async (customerId: number) => {
    return api.put(`/admin/customers/${customerId}/reactivate`);
  },

  // ----------------------------------------------------------------
  // LOAN POLICIES
  // ----------------------------------------------------------------
  getLoanPolicies: async () => {
    return api.get('/admin/loan-policies');
  },

  createLoanPolicy: async (data: {
    loan_type: string;
    min_amount: number;
    max_amount: number;
    min_months: number;
    max_months: number;
    interest_rate: number;
  }) => {
    return api.post('/admin/loan-policies', data);
  },

  updateLoanPolicy: async (policyId: number, data: {
    min_amount: number;
    max_amount: number;
    min_months: number;
    max_months: number;
    interest_rate: number;
  }) => {
    return api.put(`/admin/loan-policies/${policyId}`, data);
  },

  toggleLoanPolicy: async (policyId: number) => {
    return api.put(`/admin/loan-policies/${policyId}/toggle`);
  },
};
