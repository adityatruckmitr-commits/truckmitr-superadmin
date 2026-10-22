import axiosInstance from './axiosInstance';
import { buildUrl } from '../../config/api.config';

class BaseApiService {
  async get(endpoint, params = {}, config = {}) {
    try {
      const response = await axiosInstance.get(endpoint, { params, ...config });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await axiosInstance.post(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await axiosInstance.put(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await axiosInstance.patch(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(endpoint, config = {}) {
    try {
      const response = await axiosInstance.delete(endpoint, config);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  handleResponse(response) {
    const apiData = response.data;
    
    return {
      ...apiData,
      success: apiData.status !== undefined ? apiData.status : true,
      data: apiData.data || apiData,
      message: apiData.message || 'Success',
      token: apiData.token || null,
      meta: apiData.meta || null,
      pagination: apiData.pagination || null,
      records: apiData.records || null,
      status: response.status,
    };
  }

  handleError(error) {
    const errorResponse = {
      success: false,
      data: null,
      message: 'An error occurred',
      errors: null,
      status: error.response?.status || 500,
    };

    if (error.response) {
      errorResponse.message = error.response.data?.message || error.message;
      errorResponse.errors = error.response.data?.errors || null;
    } else if (error.request) {
      errorResponse.message = 'No response from server';
    } else {
      errorResponse.message = error.message;
    }

    throw errorResponse;
  }

  buildUrl(endpoint, params = {}) {
    return buildUrl(endpoint, params);
  }
}

export default new BaseApiService();
