import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Keys owned by the embedded teleadmin app (src/teleadmin), which reuses this login's token
const TELEADMIN_KEYS = ['token', 'prod_token', 'refresh_token', 'user'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tm_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tm_admin_token') || null);
  const [loading, setLoading] = useState(false);

  // Real login against the admins table (same endpoint the teleadmin app uses)
  const login = async (mobile, password) => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.post('/telehead/login', { mobile, password });
      } catch (err) {
        const message = err.response?.data?.message;
        if (err.response?.status === 403) throw new Error(message || 'This account does not have access');
        throw new Error(message || 'Invalid mobile number or password');
      }
      if (!res.data?.status || !res.data?.token) {
        throw new Error(res.data?.message || 'Invalid mobile number or password');
      }

      const admin = res.data.data;
      const sessionUser = { name: admin.name, role: admin.role, mobile: admin.mobile, id: admin.id };
      // Console session marker (not sent as a bearer token by services/api.js)
      const sessionToken = 'tm_admin_session_' + Date.now();

      localStorage.setItem('tm_admin_token', sessionToken);
      localStorage.setItem('tm_admin_user', JSON.stringify(sessionUser));
      // Teleadmin API token + user, read by src/teleadmin
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(admin));

      setUser(sessionUser);
      setToken(sessionToken);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const teleadminToken = localStorage.getItem('token');
    if (teleadminToken) {
      // Revoke the teleadmin token; ignore failures (already expired, offline)
      api.post('/telehead/logout', null, { headers: { Authorization: `Bearer ${teleadminToken}` } }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('tm_admin_token');
    localStorage.removeItem('tm_admin_user');
    TELEADMIN_KEYS.forEach((key) => localStorage.removeItem(key));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
