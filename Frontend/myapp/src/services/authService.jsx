import API from "./api";

export const login = async (username, password) => {
  try {
    const response = await API.post("/auth/login/", { username, password });
    const { token, username: user, user_id } = response.data;

    localStorage.setItem("authToken", token);
    localStorage.setItem("username", user);
    if (user_id) {
      localStorage.setItem("userId", user_id.toString());
    }

    return { token, user };
  } catch (error) {
    throw error.response?.data || { error: "Login failed" };
  }
};

export const register = async (username, email, password, name) => {
  try {
    const response = await API.post("/auth/register/", { username, email, password, name });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Registration failed" };
  }
};

export const logout = async () => {
  try {
    await API.post("/auth/logout/");
  } catch (error) {
    console.error("Logout failed on server:", error);
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
  }
};
