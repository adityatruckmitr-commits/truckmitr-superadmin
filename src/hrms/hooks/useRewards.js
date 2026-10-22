import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useRecognitions = (params = {}) => {
  return useQuery({
    queryKey: ['recognitions', params],
    queryFn: async () => {
      const { data } = await api.get('/recognitions', { params })
      return data.data || []
    },
  })
}

export const useCreateRecognition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/recognitions', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recognitions'] })
      queryClient.invalidateQueries({ queryKey: ['rewards-stats'] })
      queryClient.invalidateQueries({ queryKey: ['rewards-top-performers'] })
    },
  })
}

export const useDeleteRecognition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/recognitions/${id}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recognitions'] }),
  })
}

export const useToggleRecognitionLike = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, employee_id }) => {
      const { data } = await api.post(`/recognitions/${id}/like`, { employee_id })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recognitions'] }),
  })
}

export const useRewardsTopPerformers = () => {
  return useQuery({
    queryKey: ['rewards-top-performers'],
    queryFn: async () => {
      const { data } = await api.get('/rewards/top-performers')
      return data.data || []
    },
  })
}

export const useRewardsStats = () => {
  return useQuery({
    queryKey: ['rewards-stats'],
    queryFn: async () => {
      const { data } = await api.get('/rewards/stats')
      return data.data
    },
  })
}

export const useNominations = () => {
  return useQuery({
    queryKey: ['nominations'],
    queryFn: async () => {
      const { data } = await api.get('/nominations')
      return data.data || []
    },
  })
}

export const useCreateNomination = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/nominations', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nominations'] }),
  })
}

export const useUpdateNominationStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.post(`/nominations/${id}/status`, { status })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nominations'] }),
  })
}

export const useDeleteNomination = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/nominations/${id}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nominations'] }),
  })
}

export const useGiftCatalog = () => {
  return useQuery({
    queryKey: ['gift-catalog'],
    queryFn: async () => {
      const { data } = await api.get('/gift-catalog')
      return data.data || []
    },
  })
}

export const usePointsBalance = (employeeId) => {
  return useQuery({
    queryKey: ['points-balance', employeeId],
    queryFn: async () => {
      const { data } = await api.get('/rewards/points-balance', { params: { employee_id: employeeId } })
      return data.data
    },
    enabled: !!employeeId,
  })
}

export const useRedeemGift = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/rewards/redeem', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-balance'] })
    },
  })
}
