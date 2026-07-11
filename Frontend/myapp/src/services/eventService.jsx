import API from "./api";

// Fetch all events
export const getEvents = async () => {
  try {
    const response = await API.get("/api/events/");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to load events." };
  }
};

// Create a new event (FormData is used to support optional banner upload)
export const createEvent = async (formData) => {
  try {
    const response = await API.post("/api/events/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to create event." };
  }
};
