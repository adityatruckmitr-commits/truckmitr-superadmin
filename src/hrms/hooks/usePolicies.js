import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const usePolicies = () => {
  return useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const { data } = await api.get('/policies')
      return data.data || []
    },
  })
}

export const usePolicyDetail = (id) => {
  return useQuery({
    queryKey: ['policy', id],
    queryFn: async () => {
      const { data } = await api.get(`/policies/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export const useCreatePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/policies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  })
}

export const useAcknowledgePolicy = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, employee_id }) => {
      const { data } = await api.post(`/policies/${id}/acknowledge`, { employee_id })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  })
}
