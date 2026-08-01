export const API_URL = import.meta.env.VITE_API_URL;

export const getMediaUrl = (path) => {
  if (!path) return "";
  
  // Handle absolute URLs (including those with missing colons e.g. http// or https//)
  if (path.startsWith("http") || path.startsWith("//") || path.includes("cloudinary.com")) {
    if (path.startsWith("https//")) {
      return "https://" + path.substring(7);
    }
    if (path.startsWith("http//")) {
      return "http://" + path.substring(6);
    }
    return path;
  }
  
  return `${API_URL}${path}`;
};