import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

// Helper: check if a localStorage value is actually usable
const isValidToken = (t) => t && t !== 'undefined' && t !== 'null';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token');
    return isValidToken(t) ? t : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth session on startup
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');

    // No token at all — skip the network call, go straight to logged-out state
    if (!isValidToken(storedToken)) {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await API.get("/auth/check-auth");
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      // Token was present but invalid/expired — wipe everything
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post("/auth/login", { phone, password });
      const { user, accessToken, refreshToken } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(accessToken);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post("/auth/register", userData);
      const { user, accessToken, refreshToken } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(accessToken);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const res = await API.put("/auth/profile", profileData);
      const updatedUser = res.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await API.put("/auth/change-password", { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Password change failed";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    localStorage.setItem('selectedLanguage', lang);
    if (user) {
      try {
        await updateProfile({ language: lang });
      } catch (err) {
        console.error("Failed to sync language:", err);
      }
    }
  }, [user, updateProfile]);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    changeLanguage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
