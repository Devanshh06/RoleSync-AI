import apiClient from '../api/client';

export const fetchNotifications = async (userId) => {
  const { data } = await apiClient.get(`/notifications/${userId}`);
  return data;
};

export const markAsRead = async (notificationId) => {
  const { data } = await apiClient.put(`/notifications/${notificationId}/read`);
  return data;
};

export const markAllAsRead = async (userId) => {
  const { data } = await apiClient.put(`/notifications/read-all/${userId}`);
  return data;
};

export const deleteNotification = async (notificationId) => {
  await apiClient.delete(`/notifications/${notificationId}`);
};
