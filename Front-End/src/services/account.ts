import { api } from './api';

export const accountService = {

  // ----------------------------------------------------------------
  // STAFF / ADMIN
  // ----------------------------------------------------------------

  /** All accounts — Staff: assigned customers only | Admin: all */
  getAll: async () => {
    return api.get('/accounts');
  },

  /** Accounts pending staff approval */
  getPending: async () => {
    return api.get('/accounts/pending');
  },

  /** Accounts for a specific customer (staff/admin) */
  getByCustomer: async (customerId: number) => {
    return api.get(`/accounts/customer/${customerId}`);
  },

  /** Approve an account */
  approve: async (accountId: number, remarks?: string) => {
    return api.put(`/accounts/${accountId}/approve`, { remarks });
  },

  /** Reject an account */
  reject: async (accountId: number, remarks?: string) => {
    return api.put(`/accounts/${accountId}/reject`, { remarks });
  },

  // ----------------------------------------------------------------
  // CUSTOMER
  // ----------------------------------------------------------------

  /** Customer creates a new account request */
  create: async (account_type: 'SAVINGS' | 'CURRENT') => {
    return api.post('/accounts', { account_type });
  },

  /** Customer views their own accounts */
  /** Customer views their own accounts — maps snake_case → camelCase */
  getMyAccounts: async () => {
    const data = await api.get('/accounts/my');
    const list = Array.isArray(data) ? data : (data as any)?.accounts ?? [];
    return list.map((a: any) => ({
      id: a.account_id,
      accountNumber: a.account_number,
      accountType: a.account_type,
      balance: a.balance,
      status: a.status,
      openedDate: a.opened_date,
    }));
  },

};