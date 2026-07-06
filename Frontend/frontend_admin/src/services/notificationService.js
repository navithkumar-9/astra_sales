import API from '../api/axios';

/**
 * Notification API service - centralizes notification API calls.
 */
export const notificationService = {
    getNotifications: () => API.get('/notifications/'),
    getUnreadCount: () => API.get('/notifications/unread-count/'),
    markAsRead: (id) => API.patch(`/notifications/${id}/read/`),
    markAllRead: () => API.post('/notifications/mark-all-read/'),
};
