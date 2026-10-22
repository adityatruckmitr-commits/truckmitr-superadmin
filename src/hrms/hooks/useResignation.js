import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useResignationRequests = (params = {}) => {
  return useQuery({
    queryKey: ['resignation-requests', params],
    queryFn: async () => {
      const { data } = await api.get('/resignation-requests', { params })
      return data.data || []
    },
  })
}

export const useCreateResignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/resignation-requests', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resignation-requests'] }),
  })
}

export const useApproveResignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, approved_by, hr_remarks }) => {
      const { data } = await api.post(`/resignation-requests/${id}/approve`, { approved_by, hr_remarks })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resignation-requests'] }),
  })
}

export const useRejectResignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, approved_by, hr_remarks }) => {
      const { data } = await api.post(`/resignation-requests/${id}/reject`, { approved_by, hr_remarks })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resignation-requests'] }),
  })
}

export const useWithdrawResignation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/resignation-requests/${id}/withdraw`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resignation-requests'] }),
  })
}
