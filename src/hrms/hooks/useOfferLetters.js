import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// The employee's own finalized offer letter (matched by their login email) - has_hr_signed tells
// the page whether the real signed PDF is available to download yet, not just the letter's data.
export const useMyOfferLetter = () => {
  return useQuery({
    queryKey: ['my-offer-letter'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/my/offer-letter')
        return data.data
      } catch (e) {
        if (e.response?.status === 404) return null
        throw e
      }
    },
  })
}

// The signed-in user's real users.id (a UUID). AuthContext's stored `user` object merges the
// users row with the employee profile, and the employee profile's own numeric `id` (tm_emp_details)
// overwrites it - so `user.id` from useAuth() is NOT the users.id that manager_user_id references.
// This re-fetches the untouched users row so a manager's offer letters can be matched correctly.
export const useMyUserId = () => {
  return useQuery({
    queryKey: ['my-user-id'],
    queryFn: async () => {
      const { data } = await api.get('/profile')
      return data?.id || null
    },
    staleTime: Infinity,
  })
}

// Managers HR can route a letter to when the department -> manager map has no entry for it
// (the map only covers a couple of departments today - see hrms_department_managers).
export const useManagerUsers = () => {
  return useQuery({
    queryKey: ['manager-users'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return (Array.isArray(data) ? data : []).filter((u) => u.role === 'manager')
    },
  })
}

export const useOfferLetters = (params = {}) => {
  return useQuery({
    queryKey: ['offer-letters', params],
    queryFn: async () => {
      const { data } = await api.get('/offer-letters', { params })
      return data.data || []
    },
  })
}

// Create or update by ref_no (upsert) - mirrors "save draft" / "generate" semantics
export const useSaveOfferLetter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/offer-letters', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

export const useDeleteOfferLetter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/offer-letters/${id}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

// HR sends a draft/rejected letter into the approval chain: HR -> Manager -> CEO -> HR -> Employee.
// manager_user_id is optional - when omitted the backend falls back to the department -> manager map.
export const useSubmitOfferLetterForApproval = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, manager_user_id }) => {
      const { data } = await api.post(`/offer-letters/${id}/submit`, manager_user_id ? { manager_user_id } : {})
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

export const useOfferLetterManagerDecision = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, decision, remarks }) => {
      const { data } = await api.post(`/offer-letters/${id}/manager-decision`, { decision, remarks })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

export const useOfferLetterCeoDecision = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, decision, remarks }) => {
      const { data } = await api.post(`/offer-letters/${id}/ceo-decision`, { decision, remarks })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

// HR's final step once management has approved AND the signature round-trip below is complete:
// mark it sent (this also emails the final signed PDF to the candidate).
export const useUpdateOfferLetterStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.post(`/offer-letters/${id}/status`, { status })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

/* ------------------------------------------------------------------ *
 * Signature round-trip: HR sends for signature -> Director signs (uploads a real signed PDF) ->
 * HR downloads that, adds their own signature, uploads the final PDF -> HR sends it (above).
 * Nothing here is signed by the app itself - these just move a real PDF file between people.
 * ------------------------------------------------------------------ */

export const useSendOfferLetterForSignature = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/offer-letters/${id}/send-for-signature`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

export const useDirectorUploadSignedOfferLetter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }) => {
      const form = new FormData()
      form.append('document', file)
      const { data } = await api.post(`/offer-letters/${id}/director-signed`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

export const useHrUploadSignedOfferLetter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }) => {
      const form = new FormData()
      form.append('document', file)
      const { data } = await api.post(`/offer-letters/${id}/hr-signed`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offer-letters'] }),
  })
}

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const downloadDirectorSignedOfferLetter = async (id, filename) => {
  const res = await api.get(`/offer-letters/${id}/director-signed`, { responseType: 'blob' })
  saveBlob(res.data, filename || 'director-signed-offer-letter.pdf')
}

export const downloadFinalSignedOfferLetter = async (id, filename) => {
  const res = await api.get(`/offer-letters/${id}/final-signed`, { responseType: 'blob' })
  saveBlob(res.data, filename || 'signed-offer-letter.pdf')
}

// The employee's own copy, from My Documents.
export const downloadMySignedOfferLetter = async (filename) => {
  const res = await api.get('/my/offer-letter/document', { responseType: 'blob' })
  saveBlob(res.data, filename || 'signed-offer-letter.pdf')
}
