import baseApi from './baseApi';

class JobMatchingApiService {
  async getTodayStats() {
    return await baseApi.get('/telehead/today-stats');
  }

  async getPaidJobsStats(params = {}) {
    return await baseApi.get('/telehead/paid-jobs-stats', params);
  }

  async getJobs(params = {}) {
    return await baseApi.get('/telehead/jobs', params);
  }

  async getJobDetails(jobId) {
    return await baseApi.get(`/telehead/job-details/${jobId}`);
  }

  async updateJob(jobId, data) {
    return await baseApi.put(`/telehead/jobs/${jobId}`, data);
  }

  async updateJobStatus(jobId, statusData) {
    return await baseApi.patch(`/telehead/jobs/${jobId}/status`, statusData);
  }

  async getApplicants(jobId, params = {}) {
    return await baseApi.get('/telehead/applicants', { job_id: jobId, ...params });
  }

  async getApplicantDetails(jobId, userId) {
    const response = await baseApi.get(`/telehead/applicant-details?job_id=${jobId}&user_id=${userId}`);
    return response;
  }

  async getCallHistory(userId, jobId) {
    const response = await baseApi.get(`/telehead/leads/${userId}/call-history?job_id=${jobId}`);
    return response;
  }
}

export default new JobMatchingApiService();
