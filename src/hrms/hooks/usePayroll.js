import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export const usePayroll = (params = {}) => {
  const { start_date, end_date, employee_id, department, active } = params

  return useQuery({
    queryKey: ['payroll', start_date, end_date, employee_id, department, !!active],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (start_date) queryParams.append('start_date', start_date)
      if (end_date) queryParams.append('end_date', end_date)
      if (employee_id) queryParams.append('employee_id', employee_id)
      if (department) queryParams.append('department', department)
      if (active) queryParams.append('active', '1')

      const response = await api.get(`/payroll?${queryParams.toString()}`)
      return response.data.data
    },
    enabled: !!start_date && !!end_date,
  })
}

export const usePayrollSummary = (startDate, endDate) => {
  return useQuery({
    queryKey: ['payroll-summary', startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/payroll/summary?start_date=${startDate}&end_date=${endDate}`)
      return response.data.data
    },
    enabled: !!startDate && !!endDate,
  })
}

// `withDays` also returns the day-by-day attendance list (only the payslip modal needs it).
export const useEmployeePayroll = (employeeId, startDate, endDate, { withDays = false } = {}) => {
  return useQuery({
    queryKey: ['employee-payroll', employeeId, startDate, endDate, withDays],
    queryFn: async () => {
      const response = await api.get(`/payroll/employee/${employeeId}`, {
        params: { start_date: startDate, end_date: endDate, ...(withDays && { days: 1 }) },
      })
      return response.data.data
    },
    enabled: !!employeeId && !!startDate && !!endDate,
  })
}

// Salary structure + deduction rules for every verified employee (Salary Details / Deductions tabs).
export const usePayrollStructures = () => {
  return useQuery({
    queryKey: ['payroll-structures'],
    queryFn: async () => (await api.get('/payroll/structures')).data.data,
  })
}

export const usePayrollSettings = () => {
  return useQuery({
    queryKey: ['payroll-settings'],
    queryFn: async () => (await api.get('/payroll/settings')).data.data,
  })
}

export const usePayrollAdjustments = (month, type) => {
  return useQuery({
    queryKey: ['payroll-adjustments', month, type],
    queryFn: async () => (await api.get('/payroll/adjustments', { params: { month, type } })).data.data,
    enabled: !!month,
  })
}

export const useLoanDeductions = (month) => {
  return useQuery({
    queryKey: ['payroll-loans', month],
    queryFn: async () => (await api.get('/payroll/loan-deductions', { params: { month } })).data.data,
    enabled: !!month,
  })
}

export const usePayrollRuns = () => {
  return useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const res = await api.get('/payroll/runs')
      return { runs: res.data.data, attendanceMonths: res.data.attendance_months || [] }
    },
  })
}

/* ------------------------------------------------------------------ *
 * Writes — every one refreshes whatever payroll numbers it can change
 * ------------------------------------------------------------------ */

const useInvalidatingMutation = (mutationFn) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      ;['payroll', 'payroll-summary', 'employee-payroll', 'payroll-structures', 'payroll-settings',
        'payroll-adjustments', 'payroll-loans', 'payroll-runs', 'payroll-approvals'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    },
  })
}

export const useUpdateSalaryStructure = () =>
  useInvalidatingMutation(async ({ employeeId, ...body }) =>
    (await api.put(`/payroll/salary-structures/${employeeId}`, body)).data
  )

export const useUpdateDeductionRules = () =>
  useInvalidatingMutation(async ({ employeeId, ...body }) =>
    (await api.put(`/payroll/deduction-rules/${employeeId}`, body)).data
  )

export const useUpdatePayrollSettings = () =>
  useInvalidatingMutation(async (body) => (await api.put('/payroll/settings', body)).data)

export const useAddAdjustment = () =>
  useInvalidatingMutation(async (body) => (await api.post('/payroll/adjustments', body)).data)

export const useDeleteAdjustment = () =>
  useInvalidatingMutation(async (id) => (await api.delete(`/payroll/adjustments/${id}`)).data)

export const useRunPayroll = () =>
  useInvalidatingMutation(async ({ month, force = false }) => (await api.post('/payroll/runs', { month, force })).data)

export const useReopenPayroll = () =>
  useInvalidatingMutation(async ({ month, force = false }) =>
    (await api.delete(`/payroll/runs/${month}`, { data: { force } })).data
  )

export const usePayStatus = () =>
  useInvalidatingMutation(async ({ month, status, employeeIds }) =>
    (await api.post(`/payroll/runs/${month}/pay-status`, { status, employee_ids: employeeIds })).data
  )

// One submit for a month: `selected` move to initiated/credited, everyone in `hold` goes on hold with a reason.
export const useDisburseSalary = () =>
  useInvalidatingMutation(async ({ month, action, selected, hold }) =>
    (await api.post(`/payroll/runs/${month}/disburse`, { action, selected, hold })).data
  )

/* ------------------------------------------------------------------ *
 * Payslip approvals - Manager -> CEO gate a payslip must clear before
 * HR can move it past pending via pay-status/disburse above.
 * ------------------------------------------------------------------ */

export const usePayslipApprovals = (stage) => {
  return useQuery({
    queryKey: ['payroll-approvals', stage],
    queryFn: async () => (await api.get('/payroll/approvals', { params: { stage } })).data.data,
  })
}

export const usePayslipManagerDecision = () =>
  useInvalidatingMutation(async ({ id, decision, remarks }) =>
    (await api.post(`/payroll/approvals/${id}/manager-decision`, { decision, remarks })).data
  )

export const usePayslipCeoDecision = () =>
  useInvalidatingMutation(async ({ id, decision, remarks }) =>
    (await api.post(`/payroll/approvals/${id}/ceo-decision`, { decision, remarks })).data
  )

// Pulls the most useful message out of an axios error (validation errors first).
export const apiError = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message ||
  Object.values(err?.response?.data?.errors || {})?.[0]?.[0] ||
  err?.message ||
  fallback
