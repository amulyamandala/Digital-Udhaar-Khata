import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth session on startup
  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/check-auth");
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { phone, password });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", userData);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.get("/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put("/auth/profile", profileData);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Failed to update profile" };
    }
  };

  const changeLanguage = async (lang) => {
    if (user) {
      try {
        await updateProfile({ language: lang });
      } catch (err) {
        console.error("Failed to sync language selection with server:", err.message);
      }
    } else {
      // Allow switching language on login/register pages
      setUser((prev) => (prev ? { ...prev, language: lang } : { language: lang }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        updateProfile,
        changeLanguage
      }}
    >
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
