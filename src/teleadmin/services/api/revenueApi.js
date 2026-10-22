import axiosInstance from './axiosInstance';

class RevenueApiService {
  async getRevenueRecords(params = {}) {
    const response = await axiosInstance.get('/telehead/revenue', { params });
    return response.data;
  }

  async addRevenueRecord(data) {
    const response = await axiosInstance.post('/telehead/revenue', data);
    return response.data;
  }

  async updateRevenueRecord(id, data) {
    const response = await axiosInstance.put(`/telehead/revenue/${id}`, data);
    return response.data;
  }

  async bulkUpdateRecords(updates) {
    const response = await axiosInstance.post('/telehead/revenue/bulk-update', { updates });
    return response.data;
  }

  async deleteRevenueRecord(id) {
    const response = await axiosInstance.delete(`/telehead/revenue/${id}`);
    return response.data;
  }

  async refundPayment(id, data) {
    const response = await axiosInstance.post(`/telehead/revenue/${id}/refund`, data);
    return response.data;
  }

  async syncRefund(id) {
    const response = await axiosInstance.post(`/telehead/revenue/${id}/sync-refund`);
    return response.data;
  }

  async addToPayments(id, data) {
    const response = await axiosInstance.post(`/telehead/revenue/${id}/add-to-payments`, data);
    return response.data;
  }

  async splitSelected(ids) {
    const response = await axiosInstance.post('/telehead/revenue/split-selected', { selected_ids: ids.join(',') });
    return response.data;
  }

  async exportDailyReport(startDate, endDate) {
    const response = await axiosInstance.get('/telehead/revenue/export-daily', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  async exportTelechampReport(startDate, endDate) {
    const response = await axiosInstance.get('/telehead/revenue/export-telechamp', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  async exportTodayReport(date) {
    const response = await axiosInstance.get('/telehead/revenue/export-today', {
      params: { date },
      responseType: 'blob'
    });
    return response.data;
  }

  async exportAttemptsReport() {
    const response = await axiosInstance.get('/telehead/revenue/export-attempts', {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const revenueApi = new RevenueApiService();
