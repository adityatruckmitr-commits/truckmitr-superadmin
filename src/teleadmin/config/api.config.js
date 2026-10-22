// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/truckmitr/api/',
  IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_BASE_URL || 'https://truckmitr.com/public/',
  TIMEOUT: 300000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_BASE_URL = API_CONFIG.BASE_URL;
export const IMAGE_BASE_URL = API_CONFIG.IMAGE_BASE_URL;

// API Endpoints - Update these based on actual backend endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/telehead/login',
  LOGOUT: '/telehead/logout',
  REFRESH_TOKEN: '/telehead/refresh',
  ME: '/telehead/me',
  FORGOT_PASSWORD: '/telehead/forgot-password',
  RESET_PASSWORD: '/telehead/reset-password',
  STATES: '/states',

  // Dashboard
  DASHBOARD_STATS: '/telehead/dashboard',
  DASHBOARD_DATA_EXPORT: '/telehead/export-dashboard-data',
  DASHBOARD_DATA_EXPORT_PROGRESS: '/telehead/export-progress',
  PROCESS_SNAPSHOT: '/telehead/process-snapshot',
  AGENT_REVENUE: '/telehead/agent-revenue4',
  TELECHAMPS_SUMMARY: '/telehead/telechamps-summary2',
  TODAY_STATS: '/telehead/today-stats',
  TOTAL_PENDING: '/telehead/total-pending',
  CALL_REPORT: '/telehead/call-report',
  CONNECTED_CALL_HISTORY: '/telehead/connected-call-history',
  MATCH_MAKING_REPORTS: '/telehead/match-making-reports',
  LEADS_COUNT_SUMMARY: '/telehead/leadsCountSummaryNew',
  DASHBOARD_STATS_CARDS: '/admin/dashboard/stats-cards',
  DASHBOARD_REGISTERED_USERS: '/dashboard-registered-users.php',

  // Leads
  TODAY_LEADS: '/telehead/today-leads',

  // Payments
  PAYMENTS: '/telehead/payments',
  PAYMENTS_SEARCH: '/telehead/payments/search',

  // Telecallers
  TELECALLER_EMP_DETAILS: '/telehead/all_telecallers_list',
  MOVE_LEADS: '/telehead/move-leads',
  ADD_TELECALLER: '/telehead/add',
  UPDATE_TC_PROCESS: '/telehead/tele-champ/:id/update-tc',
  AGENT_LIVE_VIEW: '/telehead/agent-live-view',
  LEADS_MANAGEMENT_NEW: 'telehead/leads-management-new',
  LEADS_MANAGEMENT_LIST: 'telehead/leads-management-list',
  NOT_CALLED_LEADS: '/telehead/not-called-leads',
  BULK_ASSIGN_LEADS: '/telehead/bulk-assign-leads',
  SOCIAL_LEADS_STATS: '/telehead/social-leads-stats',
  SOCIAL_LEADS_LIST: '/telehead/social-leads-list',
  CREATE_SOCIAL_LEAD: '/telehead/social-leads/store',
  IMPORT_SOCIAL_LEADS: '/telehead/social-leads/import',
  LEADS_CALLS_NEW: '/telehead/leads-calls-new',
  LEADS_CALLS_LIST: '/telehead/leads-calls-list',

  // Driver Ki Awaz
  DRIVER_KI_AWAZ_POSTS: '/admin/driver-ki-awaz',
  DRIVER_KI_AWAZ_DRIVERS: '/admin/driver-ki-awaz/drivers',
  DRIVER_KI_AWAZ_TOGGLE_STATUS: '/admin/driver-ki-awaz/:id/toggle-status',
  DRIVER_KI_AWAZ_DELETE: '/admin/driver-ki-awaz/:id',

  // Global Search
  USER_SEARCH: '/telehead/user-search',
  USER_DETAIL: '/telehead/user-detail/:id',
  TRANSPORTER_JOB_DETAIL: '/telehead/transporter-job-detail/:transporter_id/:job_id',
  
  // Driver Hire Form Leads
  DRIVER_HIRE_LEADS: '/telehead/driver-hire-leads',
  REASSIGN_DRIVER_HIRE_LEAD: '/telehead/driver-hire-leads/:id/reassign',
};

export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

export default {
  API_CONFIG,
  API_BASE_URL,
  API_ENDPOINTS,
  buildUrl,
};
