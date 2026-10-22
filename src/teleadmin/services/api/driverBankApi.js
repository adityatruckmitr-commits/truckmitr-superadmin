import axiosInstance from './axiosInstance';

export const driverBankApi = {
    getDriverBank: async (params) => {
        const response = await axiosInstance.get('/telehead/driver-bank', { params });
        return response.data;
    },
    getDriverBankFilters: async () => {
        const response = await axiosInstance.get('/telehead/driver-bank-filters');
        return response.data;
    },
    getCallHistory: async (params) => {
        const response = await axiosInstance.get('/telehead/leads/call-history', { params });
        return response.data;
    }
};
