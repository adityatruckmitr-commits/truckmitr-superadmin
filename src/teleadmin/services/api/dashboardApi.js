import baseApi from './baseApi';
import { API_ENDPOINTS } from '../../config/api.config';

class DashboardApiService {
  async getStats() {
    return await baseApi.get(API_ENDPOINTS.DASHBOARD_STATS);
  }

  async getProcessSnapshot() {
    return await baseApi.get(API_ENDPOINTS.PROCESS_SNAPSHOT);
  }

  async getAgentRevenue(date = null) {
    const params = date ? { date } : {};
    return await baseApi.get(API_ENDPOINTS.AGENT_REVENUE, params);
  }

  async getTelechampsSummary(date = null) {
    const params = date ? { date } : {};
    return await baseApi.get(API_ENDPOINTS.TELECHAMPS_SUMMARY, params);
  }

  async getAgentLiveView() {
    // Previously, this was hardcoded to hit the production server (truckmitr.com/api).
    // Switched to local baseApi so you can see the new Agent Idle Tracker backend updates!
    return await baseApi.get(API_ENDPOINTS.AGENT_LIVE_VIEW);
  }

  async getTodayStats() {
    return await baseApi.get(API_ENDPOINTS.TODAY_STATS);
  }

  async getTotalPending() {
    return await baseApi.get(API_ENDPOINTS.TOTAL_PENDING);
  }

  async getCallReport(date = null) {
    const params = date ? { date } : {};
    return await baseApi.get(API_ENDPOINTS.CALL_REPORT, params);
  }

  async getMatchMakingReports(date = null) {
    const params = date ? { date } : {};
    return await baseApi.get(API_ENDPOINTS.MATCH_MAKING_REPORTS, params);
  }

  async getStatsCards() {
    return await baseApi.get(`${API_ENDPOINTS.DASHBOARD_STATS_CARDS}?_t=${Date.now()}`);
  }

  async getRegisteredUsers(params = {}) {
    return await baseApi.get(API_ENDPOINTS.DASHBOARD_REGISTERED_USERS, params);
  }

  async getTodayLeadsByRole(role, params = {}) {
    const endpoints = {
      driver: '/telehead/today-drivers',
      transporter: '/telehead/today-transporters',
      foreman: '/telehead/today-foremen',
      association: '/telehead/today-associations',
      dhaba: '/telehead/today-dhabas',
      puncture: '/telehead/today-punctures',
    };
    const endpoint = endpoints[role] || `/telehead/today-${role}s`;
    return await baseApi.get(endpoint, params);
  }
}

export default new DashboardApiService();
