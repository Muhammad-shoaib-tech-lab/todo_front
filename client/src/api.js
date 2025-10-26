import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token automatically in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token (401 → redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
