import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// What can be uploaded for an employee, the accepted formats, and the size limit THIS server can really take.
export const useEmployeeDocuments = (empId, enabled = true) =>
  useQuery({
    queryKey: ['employee-documents', empId],
    queryFn: async () => (await api.get(`/employees/${empId}/documents`)).data.data,
    enabled: !!empId && enabled,
  })

const refreshEverywhereDocsShow = (queryClient) => {
  ;['employee-documents', 'employees', 'employee'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
}

// `onProgress(percent)` lets the card show a progress bar for big scans.
export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, type, file, onProgress }) => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/employees/${empId}/documents/${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      return res.data
    },
    onSuccess: () => refreshEverywhereDocsShow(queryClient),
  })
}

export const useRemoveDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, type }) => (await api.delete(`/employees/${empId}/documents/${type}`)).data,
    onSuccess: () => refreshEverywhereDocsShow(queryClient),
  })
}

export const documentError = (err) =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {})?.[0]?.[0] ||
  (err?.code === 'ERR_NETWORK' ? 'The upload was interrupted. Check your connection and try again.' : err?.message) ||
  'Could not upload the document'
