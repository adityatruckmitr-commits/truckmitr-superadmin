import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost/truckmitr/api';
    }
    // Production on truckmitr.com/superadmin
    return `${window.location.origin}/superadmin/backend/api`;
  }
  return '/superadmin/backend/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_admin_token') || localStorage.getItem('token');
  if (token && !token.startsWith('tm_admin_session_')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // The login token has expired (3-hour session) or was revoked: end the whole console session
      ['tm_admin_token', 'tm_admin_user', 'tm_hrms_user', 'token', 'prod_token', 'refresh_token', 'user'].forEach((key) => localStorage.removeItem(key));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;