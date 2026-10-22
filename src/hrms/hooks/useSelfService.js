import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { downloadPayslipPdf } from '../components/payroll/payslipPdf'

/* ------------------------------------------------------------------ *
 * Employee dashboard: own payout, own document requests
 * ------------------------------------------------------------------ */

// Salary breakup, the deductions that apply, and FINALIZED payslips (never drafts).
export const useMyPayout = () =>
  useQuery({
    queryKey: ['my-payout'],
    queryFn: async () => (await api.get('/payroll/my')).data.data,
  })

export const useMyRequests = (options = {}) =>
  useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => (await api.get('/my/requests')).data.data,
    ...options,
  })

export const useCreateMyRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post('/my/requests', body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-requests'] }),
  })
}

// Fetches one finalized payslip and turns it into the same PDF HR gets.
export const downloadMyPayslip = async (month) => {
  const { data } = await api.get(`/payroll/my/payslips/${month}`)
  const slip = data.data
  await downloadPayslipPdf(slip, { startDate: slip.period.start_date, endDate: slip.period.end_date })
  return slip
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

// The attached file is private, so it has to be fetched with the auth header.
export const downloadRequestDocument = async (id, filename, { hr = false } = {}) => {
  const res = await api.get(hr ? `/employee-requests/${id}/document` : `/my/requests/${id}/document`, { responseType: 'blob' })
  saveBlob(res.data, filename || 'document')
}

// A blob response hides the JSON error body; read the message back out of it.
export const blobErrorMessage = async (err) => {
  const data = err?.response?.data
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message
    } catch {
      return null
    }
  }
  return data?.message || null
}

/* ------------------------------------------------------------------ *
 * HR: handle employees' document requests
 * ------------------------------------------------------------------ */

export const useEmployeeRequests = (filters = {}) =>
  useQuery({
    queryKey: ['employee-requests', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const res = await api.get('/employee-requests', { params })
      return { rows: res.data.data, counts: res.data.counts || {} }
    },
  })

const useRequestMutation = (fn) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employee-requests'] }),
  })
}

export const useFulfilRequest = () =>
  useRequestMutation(async ({ id, remarks, file }) => {
    const form = new FormData()
    if (remarks) form.append('remarks', remarks)
    if (file) form.append('document', file)
    return (await api.post(`/employee-requests/${id}/fulfil`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  })

// The offer letter pre-filled from the employee's own record. Never cached: HR may have just edited it.
export const useOfferLetterDraft = (id) =>
  useQuery({
    queryKey: ['offer-letter-draft', id],
    queryFn: async () => (await api.get(`/employee-requests/${id}/offer-letter-draft`)).data.data,
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false, // a refetch would replace what HR is in the middle of editing
  })

// Uploads the generated PDF with the letter's fields; the server files it in Offer Letter history and completes the request.
export const useIssueOfferLetter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file, remarks, fields }) => {
      const form = new FormData()
      form.append('document', file)
      if (remarks) form.append('remarks', remarks)
      Object.entries(fields).forEach(([k, v]) => { if (v !== '' && v != null) form.append(k, v) })
      return (await api.post(`/employee-requests/${id}/offer-letter`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: () => {
      ;['employee-requests', 'offer-letters', 'my-requests'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    },
  })
}

export const useRejectRequest = () =>
  useRequestMutation(async ({ id, remarks }) => (await api.post(`/employee-requests/${id}/reject`, { remarks })).data)

// Turns an axios error into one readable sentence (validation errors first).
export const errorText = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {})?.[0]?.[0] ||
  err?.message ||
  fallback
