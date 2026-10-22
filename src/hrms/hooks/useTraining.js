import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useTrainingPrograms = () => {
  return useQuery({
    queryKey: ['training-programs'],
    queryFn: async () => {
      const { data } = await api.get('/training-programs')
      return data.data || []
    },
  })
}

export const useCreateTrainingProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/training-programs', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] })
      queryClient.invalidateQueries({ queryKey: ['training-stats'] })
    },
  })
}

export const useCompleteTrainingProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/training-programs/${id}/complete`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] })
      queryClient.invalidateQueries({ queryKey: ['training-stats'] })
      queryClient.invalidateQueries({ queryKey: ['training-top-learners'] })
    },
  })
}

export const useDeleteTrainingProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/training-programs/${id}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-programs'] }),
  })
}

export const useEnrollInProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, employee_ids }) => {
      const { data } = await api.post(`/training-programs/${id}/enroll`, { employee_ids })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training-programs'] }),
  })
}

export const useTrainingStats = () => {
  return useQuery({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const { data } = await api.get('/training/stats')
      return data.data
    },
  })
}

export const useTopLearners = () => {
  return useQuery({
    queryKey: ['training-top-learners'],
    queryFn: async () => {
      const { data } = await api.get('/training/top-learners')
      return data.data || []
    },
  })
}
