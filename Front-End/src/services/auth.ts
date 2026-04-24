import { api } from './api';

export const authService = {
  // For USER/ADMIN
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  // For CUSTOMER
  customerLogin: (credentials: { email: string; password: string }) => 
    api.post('/auth/customer/login', credentials),
  
  // For OTP verification
  verifyOTP: (data: {entity_id: number; entity_type: string;  otp_code: string }) => 
    api.post('/auth/verify-otp', data),
  
  // For registration
// ✅ USER REGISTRATION
  register: (userData: {
    fullName: string;
    email: string;
    password: string;
    phone : string;
  }) => api.post('/auth/register', userData),
  
  // ✅ CUSTOMER REGISTRATION  
  customerRegister: (customerData: {
    customer_name: string;  
    email: string;
    password: string;
    phone: string;
    address: string;
  }) => api.post('/auth/customer/register', customerData),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  }
};