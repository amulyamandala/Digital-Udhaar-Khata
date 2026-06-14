import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://digital-udhaar-khata-onrr.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Guard against invalid values like 'undefined' or 'null' stored as strings
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token === 'undefined' || token === 'null') {
      // Clean up bad values immediately
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try refresh token
    // Skip refresh for check-auth — a 401 there simply means the user is not logged in
    const isCheckAuth = originalRequest.url?.includes('check-auth');
    if (error.response?.status === 401 && !originalRequest._retry && !isCheckAuth) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'https://digital-udhaar-khata-onrr.onrender.com/api'}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login if not already there
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
