import { api } from './api';

export const transactionService = {
  // Get transactions for a specific account
  getByAccount: async (accountId: number) => {
    try {
      const response = await api.get(`/transactions/account/${accountId}`);
      return response;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
  
  // Withdraw money
  withdraw: async (data: { accountId: number; amount: number; description: string }) => {
    const response = await api.post('/transactions/withdraw', {
      account_id: data.accountId,
      amount: data.amount,
      description: data.description
    });
    return response;
  },
  
  // Transfer money
  transfer: async (data: { fromAccountId: number; toAccountNumber: string; amount: number; description: string }) => {
    const response = await api.post('/transactions/transfer', {
      from_account_id: data.fromAccountId,
      to_account_number: data.toAccountNumber,
      amount: data.amount,
      description: data.description
    });
    return response;
  },
  
  // Deposit money (for users, not customers)
  deposit: async (data: { accountId: number; amount: number; description: string }) => {
    const response = await api.post('/transactions/deposit', {
      account_id: data.accountId,
      amount: data.amount,
      description: data.description
    });
    return response;
  }
};