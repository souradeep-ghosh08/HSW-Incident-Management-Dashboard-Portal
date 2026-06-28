import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp > now) {
          setUser(decoded);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (err) {
        console.error('Token decode error:', err);
        localStorage.removeItem('access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      const decoded = jwtDecode(access_token);
      setUser(decoded);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Request failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, password });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Reset failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
