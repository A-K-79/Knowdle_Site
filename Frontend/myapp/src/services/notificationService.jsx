import API from "./api";

// Fetch notifications for logged-in user
export const getNotifications = async () => {
  try {
    const response = await API.get("/api/profile/notifications/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get notifications" };
  }
};

// Fetch unread count for logged-in user
export const getUnreadCount = async () => {
  try {
    const response = await API.get("/api/profile/notifications/unread-count/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get unread count" };
  }
};

// Mark a notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await API.post(`/api/profile/notifications/${notificationId}/read/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to mark notification as read" };
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await API.post("/api/profile/notifications/read-all/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to mark all notifications as read" };
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    const response = await API.post("/api/profile/notifications/clear-all/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to clear notifications" };
  }
};
