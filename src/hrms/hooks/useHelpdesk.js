import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useHelpdeskTickets = (params = {}) => {
  return useQuery({
    queryKey: ['helpdesk-tickets', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/helpdesk-tickets?${queryString}`)
      return response.data.data || []
    },
  })
}

export const useHelpdeskTicket = (id) => {
  return useQuery({
    queryKey: ['helpdesk-ticket', id],
    queryFn: async () => {
      const response = await api.get(`/helpdesk-tickets/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export const useTicketComments = (id) => {
  return useQuery({
    queryKey: ['ticket-comments', id],
    queryFn: async () => {
      const response = await api.get(`/helpdesk-tickets/${id}/comments`)
      return response.data.data || []
    },
    enabled: !!id,
  })
}

export const useCreateHelpdeskTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/helpdesk-tickets', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useUpdateHelpdeskTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/helpdesk-tickets/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useAssignTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, assigned_to }) => {
      const response = await api.post(`/helpdesk-tickets/${id}/assign`, { assigned_to })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useResolveTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, resolution }) => {
      const response = await api.post(`/helpdesk-tickets/${id}/resolve`, { resolution })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useCloseTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/helpdesk-tickets/${id}/close`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useReopenTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/helpdesk-tickets/${id}/reopen`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}

export const useAddTicketComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, comment }) => {
      const response = await api.post(`/helpdesk-tickets/${id}/comments`, { comment })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', variables.id] })
    },
  })
}

export const useDeleteHelpdeskTicket = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/helpdesk-tickets/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
  })
}
