import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useSalaryAdvanceRequests = (params = {}) => {
  return useQuery({
    queryKey: ['salary-advance-requests', params],
    queryFn: async () => {
      const { data } = await api.get('/salary-advance-requests', { params })
      return data.data || []
    },
  })
}

export const useCreateSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/salary-advance-requests', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary-advance-requests'] }),
  })
}

export const useApproveSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, approved_by }) => {
      const { data } = await api.post(`/salary-advance-requests/${id}/approve`, { approved_by })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary-advance-requests'] }),
  })
}

export const useRejectSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, approved_by, rejection_reason }) => {
      const { data } = await api.post(`/salary-advance-requests/${id}/reject`, { approved_by, rejection_reason })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salary-advance-requests'] }),
  })
}
