import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // critical for cookie-based authentication
  headers: {
    "Content-Type": "application/json"
  }
});

// Response interceptor to handle token expiry / unauthenticated redirections
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get unauthenticated (401) and have not retried yet, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/login") {
      originalRequest._retry = true;
      try {
        await axios.post("http://localhost:5000/auth/refresh", {}, { withCredentials: true });
        return api(originalRequest); // retry original request
      } catch (refreshError) {
        // Refresh token expired or failed, redirect user to login
        console.error("Refresh token validation failed. Session expired.");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
