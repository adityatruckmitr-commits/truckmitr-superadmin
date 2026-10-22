import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

/* ------------------------------------------------------------------ *
 * HR: generate one employee's payslip for a finished month, on the spot
 * ------------------------------------------------------------------ */

// The calculated payslip (attendance, LOP, deductions applied) plus the editable lines it starts from.
// Never cached: attendance may have been corrected since HR last looked.
export const useInstantPreview = (employeeId, month, enabled = true) =>
  useQuery({
    queryKey: ['instant-payslip', employeeId, month],
    queryFn: async () => (await api.get(`/payroll/instant/${employeeId}/${month}`)).data.data,
    enabled: !!(enabled && employeeId && month),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false, // a refetch would replace what HR is in the middle of editing
  })

export const useIssuePayslip = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employeeId, month, lines, message, requestId }) =>
      (await api.post(`/payroll/instant/${employeeId}/${month}`, {
        ...(lines && { lines }),
        message: message || null,
        request_id: requestId || null,
      })).data,
    onSuccess: () => {
      ;['employee-requests', 'payroll', 'employee-payroll', 'payroll-summary', 'payroll-runs', 'my-payout', 'my-requests']
        .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    },
  })
}
