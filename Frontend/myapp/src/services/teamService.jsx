import API from "./api";

// List all teams the authenticated user belongs to
export const getTeams = async () => {
  try {
    const response = await API.get("/api/teams/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load teams." };
  }
};

// Get team details
export const getTeam = async (id) => {
  try {
    const response = await API.get(`/api/teams/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load team details." };
  }
};

// Create a new team (accepts FormData for logo upload)
export const createTeam = async (formData) => {
  try {
    const response = await API.post("/api/teams/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to create team." };
  }
};

// Update team details (accepts FormData for logo updates)
export const updateTeam = async (id, formData) => {
  try {
    const response = await API.put(`/api/teams/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to update team details." };
  }
};

// Delete a team
export const deleteTeam = async (id) => {
  try {
    const response = await API.delete(`/api/teams/${id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete team." };
  }
};

// Leave a team
export const leaveTeam = async (id) => {
  try {
    const response = await API.post(`/api/teams/${id}/leave/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to leave team." };
  }
};

// Join requests & invites
export const requestToJoinTeam = async (id) => {
  try {
    const response = await API.post(`/api/teams/${id}/join-request/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to submit join request." };
  }
};

export const inviteUserToTeam = async (id, username) => {
  try {
    const response = await API.post(`/api/teams/${id}/invite/`, { username });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to send invitation." };
  }
};

// Get pending notifications (invitations and join requests)
export const getTeamRequests = async () => {
  try {
    const response = await API.get("/api/teams/requests/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load requests." };
  }
};

// Accept an invitation or join request
export const acceptTeamRequest = async (id) => {
  try {
    const response = await API.post(`/api/teams/requests/${id}/accept/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to accept request." };
  }
};

// Reject an invitation or join request
export const rejectTeamRequest = async (id) => {
  try {
    const response = await API.post(`/api/teams/requests/${id}/reject/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to reject request." };
  }
};

// Remove a member from the team
export const removeTeamMember = async (teamId, userId) => {
  try {
    const response = await API.post(`/api/teams/${teamId}/members/${userId}/remove/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to remove member." };
  }
};

// Get team chat history
export const getTeamMessages = async (teamId) => {
  try {
    const response = await API.get(`/api/teams/${teamId}/messages/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load team chat messages." };
  }
};

// Send a chat message to the team
export const sendTeamMessage = async (teamId, text) => {
  try {
    const response = await API.post(`/api/teams/${teamId}/messages/`, { text });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to send message." };
  }
};

// Get team AI summary
export const getTeamAiSummary = async (teamId) => {
  try {
    const response = await API.post(`/api/teams/${teamId}/ai-summary/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to generate AI summary." };
  }
};
