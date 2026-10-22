import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Get all short leave requests with filters
export const useShortLeaves = (params = {}) => {
  return useQuery({
    queryKey: ['shortLeaves', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/short-leaves${queryString ? `?${queryString}` : ''}`)
      return response.data
    },
    staleTime: 0,
  })
}

// Get single short leave request
export const useShortLeave = (id) => {
  return useQuery({
    queryKey: ['shortLeave', id],
    queryFn: async () => {
      const response = await api.get(`/short-leaves/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Create short leave request
export const useCreateShortLeave = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/short-leaves', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortLeaves'] })
    },
  })
}

// Update short leave request
export const useUpdateShortLeave = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (data instanceof FormData) {
        data.append('_method', 'PUT')
        const response = await api.post(`/short-leaves/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } else {
        const response = await api.put(`/short-leaves/${id}`, data)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortLeaves'] })
    },
  })
}

// Approve short leave request
export const useApproveShortLeave = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, action_by }) => {
      const response = await api.post(`/short-leaves/${id}/approve`, { action_by })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortLeaves'] })
    },
  })
}

// Reject short leave request
export const useRejectShortLeave = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, action_by, rejection_reason }) => {
      const response = await api.post(`/short-leaves/${id}/reject`, { 
        action_by, 
        rejection_reason 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortLeaves'] })
    },
  })
}

// Delete short leave request
export const useDeleteShortLeave = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/short-leaves/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortLeaves'] })
    },
  })
}
