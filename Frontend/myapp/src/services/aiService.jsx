import API from "./api";

export const summarizeNotes = async (text) => {
  try {
    const response = await API.post("/api/ai/summarize/", { text });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to summarize study notes" };
  }
};
