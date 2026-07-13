import API from "./api";

// Send follow request (creates FollowRequest)
export const followUser = async (username) => {
  try {
    const response = await API.post(`/api/follow/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to send follow request" };
  }
};

// Unfollow a user (deletes Follow and related FollowRequest)
export const unfollowUser = async (username) => {
  try {
    const response = await API.delete(`/api/follow/unfollow/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to unfollow user" };
  }
};

// Retrieve count of followers (kept for compatibility)
export const getFollowersCount = async (username) => {
  try {
    const response = await API.get(`/api/follow/followers/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get followers count" };
  }
};

// Retrieve count of followed users (kept for compatibility)
export const getFollowingCount = async (username) => {
  try {
    const response = await API.get(`/api/follow/following/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get following count" };
  }
};

// Get pending follow requests received by current user
export const getPendingFollowRequests = async () => {
  try {
    const response = await API.get("/api/follow/requests/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load follow requests" };
  }
};

// Accept a follow request
export const acceptFollowRequest = async (requestId) => {
  try {
    const response = await API.post(`/api/follow/requests/${requestId}/accept/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to accept follow request" };
  }
};

// Reject a follow request
export const rejectFollowRequest = async (requestId) => {
  try {
    const response = await API.post(`/api/follow/requests/${requestId}/reject/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to decline follow request" };
  }
};

// List user followers profiles
export const getFollowersList = async (username) => {
  try {
    const response = await API.get(`/api/follow/followers-list/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get followers list" };
  }
};

// List user following profiles
export const getFollowingList = async (username) => {
  try {
    const response = await API.get(`/api/follow/following-list/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to get following list" };
  }
};

// Check follow status (is_following, pending_sent, pending_received, request_id)
export const getFollowStatus = async (username) => {
  try {
    const response = await API.get(`/api/follow/status/${username}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to check follow status" };
  }
};
