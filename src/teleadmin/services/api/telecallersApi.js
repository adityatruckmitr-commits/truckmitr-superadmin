import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api.config';

class TelecallersApiService {
  async getEmployeeDetails() {
    const response = await axiosInstance.get(API_ENDPOINTS.TELECALLER_EMP_DETAILS);
    return response.data;
  }

  async getAgentRevenue(date = null) {
    const url = date
      ? `/telehead/agent-revenue4?date=${date}`
      : '/telehead/agent-revenue4';
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async getPayments(range = 'today', fromDate = null, toDate = null) {
    let url = API_ENDPOINTS.PAYMENTS;
    const params = new URLSearchParams();

    params.append('range', range);

    if (range === 'custom' && fromDate && toDate) {
      params.append('from', fromDate);
      params.append('to', toDate);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await axiosInstance.get(url);
    return response.data;
  }

  async searchPayment(searchTerm, page = 1) {
    const url = `${API_ENDPOINTS.PAYMENTS_SEARCH}?search=${encodeURIComponent(searchTerm)}&page=${page}`;
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async moveLeads(payload) {
    const response = await axiosInstance.post(API_ENDPOINTS.MOVE_LEADS, payload);
    return response.data;
  }

  async getLeadsCountSummary(params = {}) {
    const response = await axiosInstance.get(API_ENDPOINTS.LEADS_COUNT_SUMMARY, { params });
    return response.data;
  }

  async getMatchMakingReports(date = null) {
    const url = date
      ? `${API_ENDPOINTS.MATCH_MAKING_REPORTS}?date=${date}`
      : API_ENDPOINTS.MATCH_MAKING_REPORTS;
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async addTelecaller(payload) {
    const response = await axiosInstance.post(API_ENDPOINTS.ADD_TELECALLER, payload);
    return response.data;
  }

  async updateTelecallerProcess(id, tc_for) {
    const url = API_ENDPOINTS.UPDATE_TC_PROCESS.replace(':id', id);
    const response = await axiosInstance.put(url, { tc_for });
    return response.data;
  }

  async getNotListedTeleChamps() {
    const response = await axiosInstance.get('/telehead/not-listed-telechamps');
    return response.data;
  }

  async getMatchmakingTelecallers() {
    const response = await axiosInstance.get('/telehead/match-making-telecallers');
    return response.data;
  }
}

export default new TelecallersApiService();
