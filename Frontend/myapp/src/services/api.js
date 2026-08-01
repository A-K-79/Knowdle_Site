import axios from "axios";
import { API_URL } from "../config";
const API = axios.create({
    baseURL: `${API_URL}`,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }

    return config;
});

export default API;