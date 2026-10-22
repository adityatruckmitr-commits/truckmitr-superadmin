import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Get all office calendars
export const useCalendars = () => {
  return useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      try {
        const response = await api.get('/calendars')
        const data = response?.data?.data || response?.data || []
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.warn('Could not fetch office calendars:', err)
        return []
      }
    }
  })
}

// Create new calendar
export const useCreateCalendar = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/calendars', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    }
  })
}

// Update calendar
export const useUpdateCalendar = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/calendars/${id}`, data)
      return response.data
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
      queryClient.invalidateQueries({ queryKey: ['calendar', id] })
    }
  })
}

// Delete calendar
export const useDeleteCalendar = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/calendars/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    }
  })
}

// Activate calendar
export const useActivateCalendar = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/calendars/${id}/activate`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendars'] })
    }
  })
}
