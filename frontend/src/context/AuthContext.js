import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      // If staff, permissions come from user data
      if (res.data.user.role === 'staff' && res.data.user.permissions) {
        setPermissions(res.data.user.permissions);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    
    // Store permissions if staff
    if (userData.permissions) {
      setPermissions(userData.permissions);
    }
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions(null);
  };

  const refreshUser = () => loadUser();

  // Permission checker
  const hasPermission = (permission) => {
    // Admin has all permissions
    if (user?.role === 'admin') return true;
    
    // Staff - check specific permission
    if (user?.role === 'staff' && permissions) {
      return permissions[permission] === true;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      permissions,
      loading, 
      login, 
      logout, 
      refreshUser, 
      hasPermission,
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff',
      isMember: user?.role === 'member'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};