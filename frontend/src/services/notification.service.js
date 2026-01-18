import { apiService } from './api.service';

export const notificationService = {
  // Get all notifications for a user
  getAll: (uid) => apiService.get(`/notifications/${uid}`),

  // Get unread notifications
  getUnread: (uid) => apiService.get(`/notifications/${uid}/unread`),

  // Get unread count
  getUnreadCount: (uid) => apiService.get(`/notifications/${uid}/count`),

  // Mark notification as read
  markAsRead: (id) => apiService.put(`/notifications/${id}/read`),

  // Mark all as read
  markAllAsRead: (uid) => apiService.put(`/notifications/${uid}/read-all`)
};
