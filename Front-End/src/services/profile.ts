import { api } from './api';

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at: string;
  last_login?: string;
}

export interface UpdateProfileData {
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const profileService = {

  getProfile: async (): Promise<UserProfile> => {
    return api.get('/user/profile');
  },

  updateProfile: async (data: UpdateProfileData): Promise<{ message: string }> => {
    return api.put('/user/profile', data);
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    return api.put('/user/change-password', data);
  },

};