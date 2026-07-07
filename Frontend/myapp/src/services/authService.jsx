import axios from "axios";

const API_URL = "http://localhost:8000/auth/";

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}login/`, { username, password });
    const { token, username: user } = response.data;

    // Save token for later requests
    localStorage.setItem("authToken", token);

    return { token, user };
  } catch (error) {
    throw error.response?.data || { error: "Login failed" };
  }
};

// Example of using token for protected requests
export const getProfile = async () => {
  const token = localStorage.getItem("authToken");
  const response = await axios.get(`${API_URL}profile/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};
