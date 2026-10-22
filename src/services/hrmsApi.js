import axios from 'axios';

const getHrmsBaseUrl = () => {
  if (import.meta.env.VITE_HRMS_API_BASE_URL) {
    return import.meta.env.VITE_HRMS_API_BASE_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/hrms`;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost/truckmitr/api/hrms';
    }
    // Production on truckmitr.com/superadmin
    return `${window.location.origin}/superadmin/backend/api/hrms`;
  }
  return '/superadmin/backend/api/hrms';
};

// TruckMitr HRMS (TM-Manavsetu) API Client
const hrmsApi = axios.create({
  baseURL: getHrmsBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

hrmsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_hrms_token') || localStorage.getItem('tm_admin_token') || localStorage.getItem('token');
  if (token && !token.startsWith('tm_admin_session_')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

hrmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[HRMS API Warning]:', error?.response?.status, error?.message);
    return Promise.reject(error);
  }
);

export default hrmsApi;
