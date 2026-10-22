import baseApi from './baseApi';
import { API_ENDPOINTS, buildUrl } from '../../config/api.config';

class DriverKiAwazApiService {
  async getPosts(params = {}) {
    return await baseApi.get(API_ENDPOINTS.DRIVER_KI_AWAZ_POSTS, params);
  }

  async createPost(payload, config = {}) {
    return await baseApi.post(API_ENDPOINTS.DRIVER_KI_AWAZ_POSTS, payload, config);
  }

  async getDrivers(params = {}) {
    return await baseApi.get(API_ENDPOINTS.DRIVER_KI_AWAZ_DRIVERS, params);
  }

  async togglePostStatus(id) {
    const endpoint = buildUrl(API_ENDPOINTS.DRIVER_KI_AWAZ_TOGGLE_STATUS, { id });
    return await baseApi.post(endpoint);
  }

  async deletePost(id) {
    const endpoint = buildUrl(API_ENDPOINTS.DRIVER_KI_AWAZ_DELETE, { id });
    return await baseApi.delete(endpoint);
  }
}

export default new DriverKiAwazApiService();
