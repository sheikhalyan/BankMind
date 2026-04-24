import { api } from './api';

export interface UserProfile {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const profileService = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/user/profile');
      console.log('📊 Profile API response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data: UpdateProfileData): Promise<{ message: string }> => {
    try {
      const response = await api.put('/user/profile', data);
      return response;
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    try {
      const response = await api.put('/user/change-password', data);
      return response;
    } catch (error) {
      console.error('❌ Error in changePassword:', error);
      throw error;
    }
  },
};