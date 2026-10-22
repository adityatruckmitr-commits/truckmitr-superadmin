import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export const useVerificationQueue = (params = {}) => {
  return useQuery({
    queryKey: ['employee-verifications', params],
    queryFn: async () => {
      const { data } = await api.get('/employee-verifications', { params })
      return data
    },
  })
}

export const useVerificationSummary = () => {
  return useQuery({
    queryKey: ['employee-verifications-summary'],
    queryFn: async () => {
      const { data } = await api.get('/employee-verifications/summary')
      return data.data
    },
  })
}

export const useVerificationDossier = (empId) => {
  return useQuery({
    queryKey: ['employee-verification-dossier', empId],
    queryFn: async () => {
      const { data } = await api.get(`/employee-verifications/${empId}`)
      return data.data
    },
    enabled: !!empId,
  })
}

// Actually sends a real ₹1 transfer via the configured payout gateway (App\Services\PayoutGatewayService).
// Fails with a clear "gateway not configured" message until real RazorpayX/Cashfree credentials are set.
export const useTriggerPennyCheck = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, account_number, ifsc, account_holder_name }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/penny-check/trigger`, { account_number, ifsc, account_holder_name })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
    },
  })
}

// Real BEFISC PAN lookup - same vendor/payload the driver side uses (App\Services\PanVerificationService).
// Fails with a clear "not configured" message until PAN_API_URL/SMARTAUTH_API_AUTHKEY are set.
export const useVerifyPan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, pan }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/pan/verify`, pan ? { pan } : {})
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}

// Real BEFISC court-record check (App\Services\CourtCheckVerificationService) - files a case using
// only what's already on the employee's profile, then polls for the report (not instant).
// Real BEFISC Aadhaar OCR (App\Services\AadhaarVerificationService) - reads the document already on
// the employee's profile, nothing typed in by HR.
// `consent` is the real, per-action checkbox value - BEFISC requires it on every Aadhaar call, and
// the server refuses the request without it rather than asserting a consent nobody confirmed.
export const useVerifyAadhaar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, consent }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/aadhaar/verify`, { consent })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}

// Real BEFISC face match (App\Services\FaceMatchVerificationService) - compares the employee's own
// on-file ID photo and profile photo, nothing typed in by HR.
export const useVerifyFaceMatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/face-match/verify`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}

export const useVerifyCourtCheck = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/court-check/verify`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}

export const useCourtCheckStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId }) => {
      const { data } = await api.get(`/employee-verifications/${empId}/court-check/status`)
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}

export const useSaveVerificationCheck = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ empId, checkType, status, details, remarks }) => {
      const { data } = await api.post(`/employee-verifications/${empId}/${checkType}`, { status, details, remarks })
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-verification-dossier', variables.empId] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications'] })
      queryClient.invalidateQueries({ queryKey: ['employee-verifications-summary'] })
    },
  })
}
