import API from "./api";

export const searchUsers = async (query) => {
  try {
    const response = await API.get(`/api/search/users/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to search users" };
  }
};

export const searchPosts = async (query) => {
  try {
    const response = await API.get(`/api/search/posts/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to search posts" };
  }
};

export const searchTopics = async (query) => {
  try {
    const response = await API.get(`/api/search/topics/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to search topics" };
  }
};

export const liveSearch = async (query) => {
  try {
    const response = await API.get(`/api/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to run live search" };
  }
};
