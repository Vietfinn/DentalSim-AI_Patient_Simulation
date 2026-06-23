import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { getToken, saveToken, removeToken, decodeToken } from '../lib/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup if token is cached
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const meta = decodeToken(token);
      if (!meta) {
        removeToken();
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token } = response.data;
      saveToken(access_token);
      
      // Fetch user profile immediately
      const profileResponse = await api.get('/api/auth/me');
      setUser(profileResponse.data);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const detail = error.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.';
      return { success: false, error: detail };
    }
  };

  const register = async (email, password, fullName, role, university, graduationYear) => {
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        email,
        password,
        full_name: fullName,
        role,
        university: university || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
      });
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const detail = error.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.';
      return { success: false, error: detail };
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
