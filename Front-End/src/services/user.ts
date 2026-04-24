import { api } from './api';

export const userService = {
  // Get pending customers (waiting for user approval)
  getPendingCustomers: async () => {
    try {
      const response = await api.get('/customer/pending-user-approval');
      return response;
    } catch (error) {
      console.error('Error fetching pending customers:', error);
      throw error;
    }
  },
  
  // Get ALL customers
  getAllCustomers: async () => {
    try {
      const response = await api.get('/customer/all');
      return response;
    } catch (error) {
      console.error('Error fetching all customers:', error);
      throw error;
    }
  },
  
  // Approve customer (user approval)
  approveCustomer: async (customerId: number) => {
    const response = await api.put(`/customer/user-approve/${customerId}`);
    return response;
  },
  
  // Reject customer
  rejectCustomer: async (customerId: number) => {
    const response = await api.put(`/customer/user-reject/${customerId}`);
    return response;
  },

  // Delete rejected customer
  deleteRejectedCustomer: async (customerId: number) => {
    try {
      const response = await api.delete(`/customer/rejected/${customerId}`);
      return response;
    } catch (error) {
      console.error('Error deleting rejected customer:', error);
      throw error;
    }
  },
  
  // Get pending loan requests
  getPendingLoans: async () => {
    try {
      const response = await api.get('/loan-approval/pending');
      return response;
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      throw error;
    }
  },
  
    // Deposit money to customer account
    depositMoney: async (data: { accountId: number; amount: number; description: string }) => {
    // Convert camelCase to snake_case for backend
    const payload = {
        account_id: data.accountId,  // 👈 Convert to snake_case
        amount: data.amount
        // Note: description is NOT used by your backend!
    };
    
    console.log('📤 Sending deposit payload:', payload);
    const response = await api.post('/transactions/deposit', payload);
    return response;
}
};