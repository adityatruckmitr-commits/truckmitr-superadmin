import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api.config';

class LeadsApiService {
  async getTodayLeads(params = {}) {
    // params can include: page, per_page, telecaller_id, role, call_status, date
    const response = await axiosInstance.get(API_ENDPOINTS.TODAY_LEADS, { params });
    return response.data;
  }

  async getBacklogLeads(page = 1) {
    const response = await axiosInstance.get(`/telehead/backlog-leads?page=${page}&per_page=1000`);
    return response.data;
  }

  async getConnectedCallHistory(params = {}) {
    // params can include: date, search (mobile number)
    const response = await axiosInstance.get(API_ENDPOINTS.CONNECTED_CALL_HISTORY, { params });
    return response.data;
  }

  async getLeadsManagementNew(params = {}) {
    // params can include: date
    const response = await axiosInstance.get(API_ENDPOINTS.LEADS_MANAGEMENT_NEW, { params });
    return response.data;
  }

  async getLeadsManagementList(params = {}) {
    // params can include: date, unique_id, name, mobile, email, state, role, assigned_to, call_status, per_page, page
    const response = await axiosInstance.get(API_ENDPOINTS.LEADS_MANAGEMENT_LIST, { params });
    return response.data;
  }

  async getStates() {
    const response = await axiosInstance.get(API_ENDPOINTS.STATES);
    return response.data;
  }

  async getTelechamps() {
    const response = await axiosInstance.get(API_ENDPOINTS.TELECALLER_EMP_DETAILS);
    return response.data;
  }

  async getCallHistory(userId) {
    const response = await axiosInstance.get(`/telehead/leads/call-history?user_id=${userId}`);
    return response.data;
  }

  async getCallHistoryByMobile(mobile) {
    const response = await axiosInstance.get(`/telehead/leads/call-history?mobile=${mobile}`);
    return response.data;
  }

  async getSocialLeadsStats(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.SOCIAL_LEADS_STATS, { params });
    return response.data;
  }

  async getSocialLeadsList(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.SOCIAL_LEADS_LIST, { params });
    return response.data;
  }

  async getLeadsCallsNew(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.LEADS_CALLS_NEW, { params });
    return response.data;
  }

  async getLeadsCallsList(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.LEADS_CALLS_LIST, { params });
    return response.data;
  }
  async getJobWiseCalls(params = {}) {
    const response = await axiosInstance.get('/telehead/job-wise-calls', { params });
    return response.data;
  }

  async getJobWiseCallsList(params = {}) {
    const response = await axiosInstance.get('/telehead/job-wise-calls-list', { params });
    return response.data;
  }

  async getNotCalledLeads(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.NOT_CALLED_LEADS, { params });
    return response.data;
  }

  async bulkAssignLeads(data = {}) {
    const response = await axiosInstance.post(API_ENDPOINTS.BULK_ASSIGN_LEADS, data);
    return response.data;
  }

  async exportCallHistoryIvr(params = {}) {
    const response = await axiosInstance.get('/telehead/export-call-history-ivr', { params });
    return response.data;
  }

  async getDailyAnalytics(params = {}) {
    const response = await axiosInstance.get('/telehead/daily-analytics', { params });
    return response.data;
  }

  async createSocialLead(data) {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_SOCIAL_LEAD, data);
    return response.data;
  }

  async importSocialLeads(formData) {
    const response = await axiosInstance.post(API_ENDPOINTS.IMPORT_SOCIAL_LEADS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getPipelineDrivers(params = {}) {
    const response = await axiosInstance.get('/telehead/pipeline-drivers', { params });
    return response.data;
  }

  async getDriverHireLeads(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.DRIVER_HIRE_LEADS, { params });
    return response.data;
  }

  async reassignDriverHireLead(id, assignedTo) {
    const url = API_ENDPOINTS.REASSIGN_DRIVER_HIRE_LEAD.replace(':id', id);
    const response = await axiosInstance.post(url, { assigned_to: assignedTo });
    return response.data;
  }
}

export default new LeadsApiService();
