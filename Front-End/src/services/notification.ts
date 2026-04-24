import { api } from './api';

export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  message: string;
  created_at: string;
  is_read: number | boolean;
}

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },
  
  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
  
  // Delete notification
  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};