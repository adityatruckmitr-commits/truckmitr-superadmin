import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Get all leave requests with filters
export const useLeaveRequests = (params = {}) => {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/leave-requests${queryString ? `?${queryString}` : ''}`)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get single leave request
export const useLeaveRequest = (id) => {
  return useQuery({
    queryKey: ['leave-request', id],
    queryFn: async () => {
      const response = await api.get(`/leave-requests/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Create leave request
export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/leave-requests', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

// Update leave request
export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Laravel doesn't support PUT with multipart/form-data, so we use POST with _method
      if (data instanceof FormData) {
        data.append('_method', 'PUT')
        const response = await api.post(`/leave-requests/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } else {
        const response = await api.put(`/leave-requests/${id}`, data)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

// Approve leave request
export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by }) => {
      const response = await api.post(`/leave-requests/${id}/approve`, { approved_by })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

// Reject leave request
export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by, rejection_reason }) => {
      const response = await api.post(`/leave-requests/${id}/reject`, { 
        approved_by, 
        rejection_reason 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

// Cancel leave request (for pending leaves only)
export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/leave-requests/${id}/cancel`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

// Request cancellation for approved leave
export const useRequestCancellation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, cancellation_reason }) => {
      const response = await api.post(`/leave-requests/${id}/request-cancellation`, { 
        cancellation_reason 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

// Approve cancellation request (HR only)
export const useApproveCancellation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by }) => {
      const response = await api.post(`/leave-requests/${id}/approve-cancellation`, { 
        approved_by 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

// Reject cancellation request (HR only)
export const useRejectCancellation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by, cancellation_rejection_reason }) => {
      const response = await api.post(`/leave-requests/${id}/reject-cancellation`, { 
        approved_by,
        cancellation_rejection_reason 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    },
  })
}

// Delete leave request
export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/leave-requests/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}

// Get leave balance
export const useLeaveBalance = (employeeId, year) => {
  return useQuery({
    queryKey: ['leave-balance', employeeId, year],
    queryFn: async () => {
      const params = new URLSearchParams({ employee_id: employeeId })
      if (year) params.append('year', year)
      const response = await api.get(`/leave-balance?${params.toString()}`)
      return response.data
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Set leave balance
export const useSetLeaveBalance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/leave-balance', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
  })
}
