import API from "./api";

export const getProfile = async (username = "") => {
    try {
        const params = username ? { username } : {};
        const response = await API.get("/api/profile/", { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to get profile" };
    }
};

export const updateProfile = async (formData) => {
    try {
        const response = await API.put("/api/profile/update/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to update profile" };
    }
};

export const removeProfilePicture = async () => {
    try {
        const response = await API.put("/api/profile/update/", { remove_picture: "true" });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Failed to remove profile picture" };
    }
};