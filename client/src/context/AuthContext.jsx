import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, getMe } from '../api/authApi';
import { getStaffByEmail } from '../services/staffService';

const AuthContext = createContext(null);

// Mock user data removed to enforce real authentication

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
            const parsedUser = JSON.parse(savedUser);
            // Force clear if they have the old non-UUID mock ids
            if (parsedUser.id === 'u1' || parsedUser.id === 'u2') {
              throw new Error('Old mock session format');
            }
            setUser(parsedUser);
          } catch {
            // Corrupted data or old format — clear everything
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
      // API failed — try Supabase staff table lookup
      try {
        const staffRow = await getStaffByEmail(email);
        // Compare password (plain-text for now; TODO: hash server-side)
        if (staffRow && staffRow.password_hash === password) {
          const userData = {
            id: staffRow.id,
            name: staffRow.full_name,
            email: staffRow.email,
            department: staffRow.department,
            designation: staffRow.designation,
            contact: staffRow.contact,
            status: staffRow.status,
            userType: staffRow.user_type,
            avatarUrl: staffRow.avatar_url,
          };
          const supaToken = 'supabase_session_' + Date.now();
          localStorage.setItem('rolesync_token', supaToken);
          localStorage.setItem('rolesync_user', JSON.stringify(userData));
          setToken(supaToken);
          setUser(userData);
          return { success: true };
        }
      } catch (err) {
        // Supabase lookup failed
        console.error('Login error:', err);
      }

      // Nothing matched
      return { success: false, error: 'Invalid email or password.' };
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
