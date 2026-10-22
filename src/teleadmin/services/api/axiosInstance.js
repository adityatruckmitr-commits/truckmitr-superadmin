import axios from 'axios';
import { API_CONFIG, API_BASE_URL } from '../../config/api.config';

// Teleadmin runs inside the combined console, which owns the login (tm_admin_*) and
// stores the teleadmin API token (token/user) at the same time.
export const endConsoleSession = () => {
  ['token', 'prod_token', 'refresh_token', 'user', 'tm_admin_token', 'tm_admin_user'].forEach((key) => localStorage.removeItem(key));
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      console.log('Headers:', config.headers);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error.response?.status, error.config?.url);
    }

    // Handle 401 Unauthorized.
    // If token is expired or incorrect, try to refresh. If that fails or no refresh token, log out.
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/telehead/refresh`, {
              refresh_token: refreshToken
            });

            const { token } = response.data;
            localStorage.setItem('token', token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Fall through to logout
        }
      }

      // Unrecoverable 401: end the whole console session and go back to the main login
      if (window.location.pathname !== '/login') {
        endConsoleSession();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
