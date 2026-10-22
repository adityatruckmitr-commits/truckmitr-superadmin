import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useReviewCycles = () => {
  return useQuery({
    queryKey: ['review-cycles'],
    queryFn: async () => {
      const { data } = await api.get('/review-cycles')
      return data.data || []
    },
  })
}

export const useEmployeeReviews = (employeeId) => {
  return useQuery({
    queryKey: ['employee-reviews', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/performance/employee/${employeeId}/reviews`)
      return data.data || []
    },
    enabled: !!employeeId,
  })
}

export const useCreateReviewCycle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/review-cycles', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-stats'] })
    },
  })
}

export const useCompleteReviewCycle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/review-cycles/${id}/complete`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['performance-stats'] })
    },
  })
}

export const useDeleteReviewCycle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/review-cycles/${id}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-cycles'] }),
  })
}

export const usePerformanceStats = () => {
  return useQuery({
    queryKey: ['performance-stats'],
    queryFn: async () => {
      const { data } = await api.get('/performance/stats')
      return data.data
    },
  })
}

export const usePerformanceTopPerformers = () => {
  return useQuery({
    queryKey: ['performance-top-performers'],
    queryFn: async () => {
      const { data } = await api.get('/performance/top-performers')
      return data.data || []
    },
  })
}

export const useGoals = (params = {}) => {
  return useQuery({
    queryKey: ['goals', params],
    queryFn: async () => {
      const { data } = await api.get('/goals', { params })
      return data.data || []
    },
  })
}
