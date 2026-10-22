import { API_ENDPOINTS, buildUrl } from '../../config/api.config';
import baseApi from './baseApi';

export const userApi = {
  searchUsers: async (searchQuery) => {
    try {
      const response = await baseApi.get(API_ENDPOINTS.USER_SEARCH, {
        search: searchQuery 
      });
      return response;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  getUserDetail: async (id, params = {}) => {
    try {
      const url = buildUrl(API_ENDPOINTS.USER_DETAIL, { id });
      const response = await baseApi.get(url, { params });
      return response;
    } catch (error) {
      console.error('Error fetching user detail:', error);
      throw error;
    }
  },

  getTransporterJobDetail: async (transporter_id, job_id, params = {}) => {
    try {
      const url = buildUrl(API_ENDPOINTS.TRANSPORTER_JOB_DETAIL, { transporter_id, job_id });
      const response = await baseApi.get(url, params);
      return response;
    } catch (error) {
      console.error('Error fetching transporter job detail:', error);
      throw error;
    }
  },

  getAllTelecallers: async () => {
    try {
      const response = await baseApi.get(API_ENDPOINTS.TELECALLER_EMP_DETAILS);
      return response;
    } catch (error) {
      console.error('Error fetching telecallers:', error);
      throw error;
    }
  },

  updateUserAssignee: async (userId, assignedToId) => {
    try {
      const url = buildUrl(API_ENDPOINTS.USER_DETAIL, { id: userId }) + '/assignee';
      const response = await baseApi.post(url, { assigned_to: assignedToId });
      return response;
    } catch (error) {
      console.error('Error updating user assignee:', error);
      throw error;
    }
  },

  markApplicantPlaced: async (transporterId, jobId, driverId, placedDate) => {
    try {
      const url = `/telehead/user-detail/${transporterId}/job/${jobId}/applicant/${driverId}/place`;
      const response = await baseApi.post(url, { placed_date: placedDate });
      return response;
    } catch (error) {
      console.error('Error marking applicant as placed:', error);
      throw error;
    }
  },

  resetJobStatusToPending: async (driverId, jobUniqueId) => {
    try {
      const url = '/telehead/user-detail/reset-job-status';
      const response = await baseApi.post(url, { driver_id: driverId, job_unique_id: jobUniqueId });
      return response;
    } catch (error) {
      console.error('Error resetting job status to pending:', error);
      throw error;
    }
  }
};
