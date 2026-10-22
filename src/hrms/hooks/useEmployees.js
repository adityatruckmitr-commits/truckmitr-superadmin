import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useEmployees = (filters = {}) => {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.department) params.append('department', filters.department)

      const queryString = params.toString()
      const url = `/employees${queryString ? `?${queryString}` : ''}`
      const response = await api.get(url)
      return response.data.employees || []
    },
  })
}

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export const useEmployeeStats = (id) => {
  return useQuery({
    queryKey: ['employee-stats', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}/stats`)
      return response.data.data
    },
    enabled: !!id,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (employeeData) => {
      const response = await api.post('/employees/create', employeeData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (employeeData) => {
      const { email, ...data } = employeeData
      const response = await api.post('/employees/update-by-email', { email, ...data })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (email) => {
      const response = await api.delete(`/users/${email}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments')
      return response.data.departments || []
    },
  })
}

export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const response = await api.get('/states')
      return response.data.states || []
    },
  })
}
