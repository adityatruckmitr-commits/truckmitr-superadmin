import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// HR: every active, verified employee with what their card is missing (photo / blood group).
export const useIdCardList = (enabled = true) =>
  useQuery({
    queryKey: ['id-cards'],
    enabled,
    queryFn: async () => {
      const { data } = await api.get('/id-cards')
      return data
    },
  })

// One card's data, photo included as a data URL. empId 'me' = the signed-in employee.
export const useIdCard = (empId) =>
  useQuery({
    queryKey: ['id-card', empId],
    enabled: !!empId,
    queryFn: async () => {
      const { data } = await api.get(`/id-cards/${empId}`)
      return data.data
    },
  })

export const useUpdateBloodGroup = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, blood_group }) => (await api.put(`/id-cards/${empId}`, { blood_group })).data,
    onSuccess: (res, { empId }) => {
      queryClient.setQueryData(['id-card', empId], res.data)
      queryClient.invalidateQueries({ queryKey: ['id-cards'] })
    },
  })
}

// Reuses the employee documents endpoint, so the photo is the same one shown on their profile.
export const useUploadIdPhoto = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, file }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post(`/employees/${empId}/documents/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: (_res, { empId }) => {
      queryClient.invalidateQueries({ queryKey: ['id-card', empId] })
      queryClient.invalidateQueries({ queryKey: ['id-cards'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
