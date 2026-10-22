import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// A requirement IS a job opening, so any recruitment write can move the requirement cards, the job
// table and the KPI/funnel numbers at once - refresh all of them together.
const RECRUITMENT_KEYS = ['job-openings', 'recruitment-funnel', 'hiring-requirements', 'candidates', 'interviews']
const invalidateRecruitment = (queryClient) =>
  RECRUITMENT_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))

export const useJobOpenings = () => {
  return useQuery({
    queryKey: ['job-openings'],
    queryFn: async () => {
      const { data } = await api.get('/job-openings')
      return data.data || []
    },
  })
}

export const useCreateJobOpening = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/job-openings', payload)
      return data
    },
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.post(`/job-openings/${id}/status`, { status })
      return data
    },
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useUpdateJobOpening = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/job-openings/${id}`, payload)
      return data
    },
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

// HR can only delete a job opening they posted themselves - admin/super_admin/ceo can delete any.
export const useDeleteJobOpening = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/job-openings/${id}`)
      return data
    },
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useCandidates = (params = {}) => {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn: async () => {
      const { data } = await api.get('/candidates', { params })
      return data.data || []
    },
  })
}

export const useCreateCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/candidates', payload)
      return data
    },
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

// scope: 'upcoming' (still scheduled) | 'past' (completed/cancelled) | 'all'
export const useInterviews = (scope = 'upcoming') => {
  return useQuery({
    queryKey: ['interviews', scope],
    queryFn: async () => {
      const { data } = await api.get('/interviews', { params: { scope } })
      return data.data || []
    },
  })
}

export const useRecruitmentFunnel = () => {
  return useQuery({
    queryKey: ['recruitment-funnel'],
    queryFn: async () => {
      const { data } = await api.get('/recruitment/funnel')
      return data.data
    },
  })
}

// Hiring Requirements: a manager raises a need, it shows on HR/CEO dashboards, HR reviews it and
// tracks recruitment progress (total applicants / hired / rejected) directly on it.
export const useHiringRequirements = () => {
  return useQuery({
    queryKey: ['hiring-requirements'],
    queryFn: async () => {
      const { data } = await api.get('/hiring-requirements')
      return data.data || []
    },
  })
}

export const useSubmitHiringRequirement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post('/hiring-requirements', payload)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useDecideHiringRequirement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, decision, remarks }) => (await api.post(`/hiring-requirements/${id}/decide`, { decision, remarks })).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useUpdateRequirementStats = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.post(`/hiring-requirements/${id}/stats`, body)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

// HR/manager/CEO edit the requirement itself (title, department, positions, priority, reason).
export const useUpdateHiringRequirement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.put(`/hiring-requirements/${id}`, body)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useUpdateCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.put(`/candidates/${id}`, body)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useDeleteCandidate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/candidates/${id}`)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useUpdateCandidateStage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage }) => (await api.post(`/candidates/${id}/stage`, { stage })).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

// After HR creates the employee record for a hired candidate, remember which employee they became.
export const useLinkCandidateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, emp_id }) => (await api.post(`/candidates/${id}/employee`, { emp_id })).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

export const useScheduleInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post('/interviews', body)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}

// Reschedule, or record the outcome: { status: 'completed'|'cancelled', feedback, result: 'hired'|'rejected'|'shortlisted' }
export const useUpdateInterview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await api.put(`/interviews/${id}`, body)).data,
    onSuccess: () => invalidateRecruitment(queryClient),
  })
}
