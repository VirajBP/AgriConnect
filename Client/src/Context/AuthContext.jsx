import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios'; // Import the configured axios instance
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resetTheme } = useTheme();

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn(
          'Auth check timed out - continuing without authentication'
        );
        setLoading(false);
      }, 5000); // 5 second timeout

      fetchUserData(token).finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async token => {
    try {
      // Decode token to get user type and ID
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const { id, type } = tokenData.user;

      // Fetch full user profile based on type and ID with timeout
      const profileEndpoint =
        type === 'farmer' ? '/api/farmer/profile' : '/api/consumer/profile';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await axios.get(profileEndpoint, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.data.success) {
        // Set user data including name
        setUser({ ...response.data.data, type });
      } else {
        console.error('Failed to fetch user profile:', response.data.message);
        localStorage.removeItem('token'); // Clear invalid token
        setUser(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Auth request timed out - server may be down');
      } else {
        console.error('Error fetching user data:', error);
      }
      localStorage.removeItem('token'); // Clear invalid token
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, userType) => {
    try {
      const response = await axios.post(
        `/api/auth/${userType}/login`,
        credentials
      );
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', userType);
        // Fetch full user data after successful login
        await fetchUserData(response.data.token);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  const register = async (userData, userType) => {
    try {
      const response = await axios.post(`/${userType}/register`, userData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        // Fetch full user data after successful registration
        await fetchUserData(response.data.token);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error(
        'Registration error:',
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    resetTheme(); // Reset theme when logging out
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
