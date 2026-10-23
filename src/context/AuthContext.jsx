import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Keys owned by the embedded teleadmin app (src/teleadmin), which reuses this login's token
const TELEADMIN_KEYS = ['token', 'prod_token', 'refresh_token', 'user'];
const SESSION_KEYS = ['tm_admin_token', 'tm_admin_user', 'tm_hrms_user', ...TELEADMIN_KEYS];

// A console login lasts 3 hours, then the user is signed out (the API token expires at the same time)
export const SESSION_MS = 3 * 60 * 60 * 1000;
const SESSION_PREFIX = 'tm_admin_session_';

// The session marker is tm_admin_session_<login time in ms>
const sessionExpiry = (marker) => {
  const startedAt = Number(String(marker || '').slice(SESSION_PREFIX.length));
  return marker && marker.startsWith(SESSION_PREFIX) && startedAt ? startedAt + SESSION_MS : 0;
};

const clearSession = () => SESSION_KEYS.forEach((key) => localStorage.removeItem(key));

// Read the saved session once at start-up; an expired one is cleared before anything renders
const savedSession = () => {
  const marker = localStorage.getItem('tm_admin_token');
  const saved = localStorage.getItem('tm_admin_user');
  if (!marker || !saved || Date.now() >= sessionExpiry(marker)) {
    if (marker || saved) clearSession();
    return { user: null, token: null };
  }
  try {
    return { user: JSON.parse(saved), token: marker };
  } catch {
    clearSession();
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [initial] = useState(savedSession);
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
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
      // Console session marker (not sent as a bearer token by services/api.js); it also records the login time
      const sessionToken = SESSION_PREFIX + Date.now();

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

  const logout = useCallback(() => {
    const teleadminToken = localStorage.getItem('token');
    if (teleadminToken) {
      // Revoke the teleadmin token; ignore failures (already expired, offline)
      api.post('/telehead/logout', null, { headers: { Authorization: `Bearer ${teleadminToken}` } }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    clearSession();
  }, []);

  // Sign out when the 3 hours are up: on a timer, and whenever the tab comes back into view
  // (timers are paused while a laptop sleeps), then show the login page
  useEffect(() => {
    if (!token) return undefined;
    const expire = () => {
      if (Date.now() < sessionExpiry(localStorage.getItem('tm_admin_token') || token)) return false;
      logout();
      if (window.location.pathname !== '/login') window.location.replace('/login?expired=1');
      return true;
    };
    if (expire()) return undefined;
    const timer = setTimeout(expire, Math.max(0, sessionExpiry(token) - Date.now()) + 1000);
    const onFocus = () => document.visibilityState === 'visible' && expire();
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
