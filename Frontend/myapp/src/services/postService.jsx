import API from "./api";

export const getFeed = async (params = {}) => {
  try {
    const response = await API.get("/api/content/feed/", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load feed" };
  }
};

export const createPost = async (formData) => {
  try {
    const response = await API.post("/api/content/posts/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to create post" };
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await API.delete(`/api/content/posts/${postId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete post" };
  }
};

export const deletePostAsAdmin = async (postId) => {
  try {
    const response = await API.delete(`/api/admin/delete-post/${postId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete post as admin" };
  }
};

export const toggleLike = async (postId) => {
  try {
    const response = await API.post(`/api/content/posts/${postId}/like/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to toggle like" };
  }
};

export const getComments = async (postId) => {
  try {
    const response = await API.get(`/api/content/posts/${postId}/comment/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch comments" };
  }
};

export const addComment = async (postId, text) => {
  try {
    const response = await API.post(`/api/content/posts/${postId}/comment/`, { text });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to add comment" };
  }
};

export const toggleSave = async (postId) => {
  try {
    const response = await API.post(`/api/content/posts/${postId}/save/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to toggle save post" };
  }
};

export const getSavedPosts = async () => {
  try {
    const response = await API.get("/api/content/posts/saved/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get saved posts" };
  }
};
