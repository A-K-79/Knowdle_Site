import API from "./api";

export const getDashboardStats = async () => {
  try {
    const response = await API.get("/api/admin/dashboard/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get admin dashboard stats" };
  }
};

export const listUsers = async () => {
  try {
    const response = await API.get("/api/admin/users/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to list users" };
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await API.patch(`/api/admin/users/${userId}/deactivate/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to deactivate user" };
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await API.delete(`/api/admin/users/${userId}/delete/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete user" };
  }
};
