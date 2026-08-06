import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getMe } from '../api/authApi';

const AuthContext = createContext(null);

// Mock user data for development without backend
const MOCK_USERS = {
  'admin@rolesync.edu': {
    id: 'u1',
    name: 'Dr. Raghav Mehta',
    email: 'admin@rolesync.edu',
    department: 'Computer Science',
    designation: 'Head of Department',
    contact: '+91-9876543210',
    status: 'Active',
    userType: 'Admin',
  },
  'faculty@rolesync.edu': {
    id: 'u2',
    name: 'Devansh Sharma',
    email: 'faculty@rolesync.edu',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    contact: '+91-9876543211',
    status: 'Leaving',
    userType: 'Faculty',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rolesync_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Validate existing token on mount
  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('rolesync_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
        setToken(savedToken);
      } catch {
        // API not available — try mock fallback
        const savedUser = localStorage.getItem('rolesync_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // Corrupted data — clear everything
            localStorage.removeItem('rolesync_token');
            localStorage.removeItem('rolesync_user');
            setToken(null);
          }
        } else {
          localStorage.removeItem('rolesync_token');
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // Try real API first
      const response = await apiLogin(email, password);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('rolesync_token', newToken);
      localStorage.setItem('rolesync_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (apiError) {
      // Fallback to mock auth for development
      const mockUser = MOCK_USERS[email];
      if (mockUser && password === 'password123') {
        const mockToken = 'mock_jwt_' + Date.now();
        localStorage.setItem('rolesync_token', mockToken);
        localStorage.setItem('rolesync_user', JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        return { success: true };
      }

      // Determine error message
      if (apiError.response?.status === 401) {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (apiError.code === 'ERR_NETWORK') {
        // No backend — mock auth failed too
        return { success: false, error: 'Invalid credentials. Try admin@rolesync.edu / password123' };
      }
      return { success: false, error: apiError.response?.data?.message || 'Login failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rolesync_token');
    localStorage.removeItem('rolesync_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
