import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Get all WFH requests with filters
export const useWfhRequests = (params = {}) => {
  return useQuery({
    queryKey: ['wfh-requests', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/wfh-requests${queryString ? `?${queryString}` : ''}`)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get single WFH request
export const useWfhRequest = (id) => {
  return useQuery({
    queryKey: ['wfh-request', id],
    queryFn: async () => {
      const response = await api.get(`/wfh-requests/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

// Create WFH request
export const useCreateWfhRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/wfh-requests', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wfh-requests'] })
    },
  })
}

// Update WFH request
export const useUpdateWfhRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/wfh-requests/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wfh-requests'] })
    },
  })
}

// Approve WFH request
export const useApproveWfhRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by }) => {
      const response = await api.post(`/wfh-requests/${id}/approve`, { approved_by })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wfh-requests'] })
    },
  })
}

// Reject WFH request
export const useRejectWfhRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, approved_by, rejection_reason }) => {
      const response = await api.post(`/wfh-requests/${id}/reject`, { 
        approved_by, 
        rejection_reason 
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wfh-requests'] })
    },
  })
}

// Delete WFH request
export const useDeleteWfhRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/wfh-requests/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wfh-requests'] })
    },
  })
}
