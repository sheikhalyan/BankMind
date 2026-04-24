import { api } from './api';

export const adminService = {
  // Get all users (for admin dashboard)
  getAllUsers: async () => {
    const response = await api.get('/admin/all-users');
    return response;
  },
  
  // Get all customers (for admin dashboard)
  getAllCustomers: async () => {
    const response = await api.get('/admin/all-customers');
    return response;
  },
  
  // Get pending users
  getPendingUsers: async () => {
    const response = await api.get('/admin/pending-users');
    return response;
  },
  
  // Get pending customers
  getPendingCustomers: async () => {
    const response = await api.get('/admin/pending-customers');
    return response;
  },
  
  // Get rejected users
  getRejectedUsers: async () => {
    const response = await api.get('/admin/rejected-users');
    return response;
  },
  
  // Get rejected customers
  getRejectedCustomers: async () => {
    const response = await api.get('/admin/rejected-customers');
    return response;
  },
  
  // Approve user
  approveUser: async (userId: number) => {
    const response = await api.put(`/admin/approve-user/${userId}`);
    return response;
  },
  
  // Reject user
  rejectUser: async (userId: number) => {
    const response = await api.put(`/admin/reject-user/${userId}`);
    return response;
  },
  
  // Delete rejected user
  deleteRejectedUser: async (userId: number) => {
    const response = await api.delete(`/admin/rejected-user/${userId}`);
    return response;
  },
  
  // Approve customer (admin approval)
  approveCustomer: async (customerId: number) => {
    const response = await api.put(`/admin/approve-customer/${customerId}`);
    return response;
  },
  
  // Reject customer
  rejectCustomer: async (customerId: number) => {
    const response = await api.put(`/admin/reject-customer/${customerId}`);
    return response;
  },
  
  // Delete rejected customer
  deleteRejectedCustomer: async (customerId: number) => {
    const response = await api.delete(`/admin/rejected-customer/${customerId}`);
    return response;
  }
};