import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useAppSettings = () => {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/settings', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
  })
}
