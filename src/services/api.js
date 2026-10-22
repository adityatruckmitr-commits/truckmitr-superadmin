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
      localStorage.removeItem('tm_admin_token');
      localStorage.removeItem('tm_admin_user');
      if (window.location.pathname !== '/superadmin/login' && window.location.pathname !== '/login') {
        window.location.href = '/superadmin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;