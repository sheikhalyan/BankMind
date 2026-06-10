import { api } from './api';

export const userService = {

  // ----------------------------------------------------------------
  // CUSTOMER MANAGEMENT (Staff actions)
  // ----------------------------------------------------------------

  /** All customers — Staff sees only assigned, Admin sees all */
  getAllCustomers: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/customers${query}`);
  },

  /** Customers pending staff approval (no staff approval row yet) */
  getPendingCustomers: async () => {
    return api.get('/customers/pending/staff');
  },

  /** Staff approves a customer (first level) */
  approveCustomer: async (customerId: number, remarks?: string) => {
    return api.put(`/customers/${customerId}/staff-approve`, { remarks });
  },

  /** Staff rejects a customer (first level) */
  rejectCustomer: async (customerId: number, remarks: string) => {
    return api.put(`/customers/${customerId}/staff-reject`, { remarks });
  },

  // ----------------------------------------------------------------
  // DEPOSIT (Staff deposits cash into customer account)
  // ----------------------------------------------------------------
  depositMoney: async (data: { accountId: number; amount: number; description?: string }) => {
    return api.post('/transactions/deposit', {
      account_id: data.accountId,
      amount: data.amount,
      description: data.description || '',
    });
  },

};