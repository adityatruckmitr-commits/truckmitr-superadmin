import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

// Get dashboard statistics
export const useDashboardStats = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats', { params })
      return data.data || data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options.enabled !== false,
  })
}

// Get attendance graph data
export const useAttendanceGraph = (month, params = {}) => {
  return useQuery({
    queryKey: ['attendance-graph', month, params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/attendance-graph', {
        params: { month, ...params }
      })
      return data.data || data
    },
    enabled: !!month,
    staleTime: 1000 * 60 * 5,
  })
}

// Get recent WFH requests
export const useRecentWfh = (limit = 5, params = {}) => {
  return useQuery({
    queryKey: ['recent-wfh', limit, params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/recent-wfh', {
        params: { limit, ...params }
      })
      return data.data || data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Get recent leave requests
export const useRecentLeaves = (limit = 5, params = {}) => {
  return useQuery({
    queryKey: ['recent-leaves', limit, params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/recent-leaves', {
        params: { limit, ...params }
      })
      return data.data || data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Get upcoming birthdays
export const useUpcomingBirthdays = (days = 30, limit = 5) => {
  return useQuery({
    queryKey: ['upcoming-birthdays', days, limit],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/upcoming-birthdays', {
        params: { days, limit }
      })
      return data.data || data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Get user's tasks for dashboard mini tracker
export const useDashboardTasks = () => {
  return useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks')
      return Array.isArray(data) ? data : data.data || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Get department-wise employee breakdown (verified + active workforce only,
// so this always reconciles with the total_employees KPI)
export const useDepartmentBreakdown = () => {
  return useQuery({
    queryKey: ['department-breakdown'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/department-breakdown')
      return data.data || data
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Get the real, merged queue of pending leave / WFH / short-leave requests
export const usePendingRequests = (limit = 5, params = {}) => {
  return useQuery({
    queryKey: ['pending-requests', limit, params],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/pending-requests', {
        params: { limit, ...params }
      })
      return data.data || data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Department Manager dashboard: team + pending approvals across leave/offer-letter/payslip/reimbursement
export const useManagerDashboard = () => {
  return useQuery({
    queryKey: ['manager-dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/manager/stats')
      return data.data || data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// CEO/Management dashboard: company-wide headcount + pending management-stage approvals
export const useManagementDashboard = () => {
  return useQuery({
    queryKey: ['management-dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/management/stats')
      return data.data || data
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Get the current user's real, recent notifications (replaces the static
// "Notice Board" mock with actual system activity for this account)
export const useRecentNotifications = (perPage = 3) => {
  return useQuery({
    queryKey: ['recent-notifications', perPage],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: { page: 1, per_page: perPage } })
      return data.data?.data || data.data || []
    },
    staleTime: 1000 * 60 * 2,
  })
}
