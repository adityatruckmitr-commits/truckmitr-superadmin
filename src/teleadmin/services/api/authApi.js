import baseApi from './baseApi';
import { API_ENDPOINTS } from '../../config/api.config';

class AuthApiService {
  async login(mobile, password) {
    // Attempt to fetch CSRF cookie (typical for Laravel Sanctum/Web routes)
    // try {
      // Use raw axios to avoid baseURL prefixing (we need /sanctum/... not /api/sanctum/...)
      // But we must pass withCredentials: true so cookies are handled
    //   const axios = (await import('axios')).default;
    //   await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    // } catch (e) {
      // Ignore error if route doesn't exist; we proceeded anyway
    //   console.log('CSRF cookie fetch skipped/failed', e);
    // }

    const response = await baseApi.post(API_ENDPOINTS.LOGIN, {
      mobile,
      password,
    });

    // API returns: { status: true, token: "...", data: {...} }
    if (response.success) {
      const token = response.token || response.data?.token;
      const userData = response.data;

      if (token) {
        localStorage.setItem('token', token);
        console.log('Token stored:', token);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // ---------------------------------------------------------
      // GENERATE PRODUCTION TOKEN (Dual Login)
      // ---------------------------------------------------------
      try {
        console.log('Attempting Production Login...');
        const axios = (await import('axios')).default;

        // Determine Base URL
        const baseUrl = import.meta.env.DEV ? '/prod-api' : 'https://truckmitr.com/api';

        // We use the proxy '/prod-api' which forwards to 'https://truckmitr.com/api'
        const prodResponse = await axios.post(baseUrl + API_ENDPOINTS.LOGIN, {
          mobile,
          password,
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const prodData = prodResponse.data;
        const prodToken = prodData.token || prodData.data?.token;

        if (prodToken) {
          localStorage.setItem('prod_token', prodToken);
          console.log('✅ Production Token generated and stored:', prodToken.substring(0, 10) + '...');
        } else {
          console.warn('⚠️ Production login succeeded but no token found in response.');
        }
      } catch (prodError) {
        console.warn('⚠️ Failed to generate Production token. Agent Live View may show Unauthorized.', prodError.response?.status || prodError.message);
      }
    }

    return response;
  }

  async logout() {
    try {
      await baseApi.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('prod_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async refreshToken(refreshToken) {
    const response = await baseApi.post(API_ENDPOINTS.REFRESH_TOKEN, {
      refresh_token: refreshToken,
    });

    if (response.success && response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async me() {
    return await baseApi.get(API_ENDPOINTS.ME);
  }

  async forgotPassword(mobile) {
    const response = await baseApi.post(API_ENDPOINTS.FORGOT_PASSWORD, {
      mobile,
    });
    return response;
  }

  async resetPassword(mobile, token, password, password_confirmation) {
    const response = await baseApi.post(API_ENDPOINTS.RESET_PASSWORD, {
      mobile,
      token,
      password,
      password_confirmation,
    });
    return response;
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthApiService();
