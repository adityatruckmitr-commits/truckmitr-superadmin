export { default as axiosInstance } from './axiosInstance';
export { default as baseApi } from './baseApi';
export { default as authApi } from './authApi';
export { default as dashboardApi } from './dashboardApi';
export { default as leadsApi } from './leadsApi';
export { userApi } from './userApi';
export { driverBankApi } from './driverBankApi';

import authApi from './authApi';
import dashboardApi from './dashboardApi';
import leadsApi from './leadsApi';
import baseApi from './baseApi';
import { userApi } from './userApi';
import { driverBankApi } from './driverBankApi';

export const apiServices = {
  auth: authApi,
  dashboard: dashboardApi,
  leads: leadsApi,
  base: baseApi,
  users: userApi,
  driverBank: driverBankApi,
};

export default apiServices;
