import { api } from './api';

export const authService = {

  // ── STAFF / ADMIN ──────────────────────────────────────────────
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),

  register: (userData: {
    full_name: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', userData),

  // ── CUSTOMER ───────────────────────────────────────────────────
  customerLogin: (credentials: { email: string; password: string }) =>
    api.post('/auth/customer/login', credentials),

  customerRegister: (customerData: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
  }) => api.post('/auth/customer/register', customerData),

  // ── SHARED ─────────────────────────────────────────────────────
  verifyOTP: (data: {
    entity_id: number;
    entity_type: 'STAFF' | 'ADMIN' | 'CUSTOMER';
    otp_code: string;
  }) => api.post('/auth/verify-otp', data),

  resendOTP: (data: {
    entity_id: number;
    entity_type: 'STAFF' | 'ADMIN' | 'CUSTOMER';
  }) => api.post('/auth/resend-otp', data),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  },

};