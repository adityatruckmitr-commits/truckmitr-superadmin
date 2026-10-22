import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../services/api'

export const useAttendance = (params = {}) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/attendance${queryString ? `?${queryString}` : ''}`)
      return response.data.data || response.data.attendance || []
    },
  })
}

export const useTodayAttendance = (filter = "") => {
  return useQuery({
    queryKey: ['today-attendance', filter],
    queryFn: async () => {
      const response = await api.get(`/attendance/today${filter ? `?filter=${filter}` : ''}`)
      return response.data
    }
  })
}

export const useEmployeeMonthlyAttendance = (employeeId, month) => {
  return useQuery({
    queryKey: ['employee-monthly-attendance', employeeId, month],
    queryFn: async () => {
      const response = await api.get(`/attendance/employee/${employeeId}/monthly?month=${month}`)
      return response.data
    },
    enabled: !!employeeId && !!month
  })
}

export const useEmployeeAllTimeAttendance = (employeeId, params = {}) => {
  return useQuery({
    queryKey: ['employee-all-time-attendance', employeeId, params],
    queryFn: async () => {
      const response = await api.get(`/attendance/employee/${employeeId}/all-time`, { params })
      return response.data
    },
    enabled: !!employeeId,
  })
}

export const useAttendanceReport = (startDate, endDate) => {
  return useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/attendance/report?start_date=${startDate}&end_date=${endDate}`)
      return response.data.data || response.data
    },
    enabled: !!startDate && !!endDate,
  })
}

export const useHrExport = (month, year) => {
  return useQuery({
    queryKey: ['hr-export', month, year],
    queryFn: async () => {
      const response = await api.get(`/attendance/hr-export?month=${month}&year=${year}`)
      return response.data.data || response.data
    },
    enabled: !!month && !!year,
  })
}

export const useEmployeeAttendanceSummary = (employeeId, startDate, endDate) => {
  return useQuery({
    queryKey: ['employee-attendance-summary', employeeId, startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/attendance/employee/${employeeId}/summary?start_date=${startDate}&end_date=${endDate}`)
      return response.data.data
    },
    enabled: !!employeeId && !!startDate && !!endDate,
  })
}

export const useEmployeeTodayStatus = (employeeId) => {
  return useQuery({
    queryKey: ['employee-today-status', employeeId],
    queryFn: async () => {
      const response = await api.get(`/attendance/employee/${employeeId}/today`)
      return response.data.data
    },
    enabled: !!employeeId,
  })
}

export const useDepartmentSummary = (startDate, endDate) => {
  return useQuery({
    queryKey: ['department-summary', startDate, endDate],
    queryFn: async () => {
      const response = await api.get(`/attendance/department-summary?start_date=${startDate}&end_date=${endDate}`)
      return response.data.data
    },
    enabled: !!startDate && !!endDate,
  })
}

export const useCheckIn = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/attendance/check-in', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['employee-today-status'] })
    },
  })
}

export const useCheckOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/attendance/check-out', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['employee-today-status'] })
    },
  })
}

export const useCreateAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (attendanceData) => {
      const response = await api.post('/attendance', attendanceData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/attendance/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/attendance/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (records) => {
      const response = await api.post('/attendance/bulk', { records })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

/* ------------------------------------------------------------------ *
 * All Attendance — month-wise register for every employee
 * ------------------------------------------------------------------ */

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))

// keepPreviousData: switching month/filter keeps the old grid on screen until the new one arrives.
export const useAttendanceSheet = (params) => {
  return useQuery({
    queryKey: ['attendance-sheet', params],
    queryFn: async () => (await api.get('/attendance/monthly-sheet', { params: cleanParams(params) })).data.data,
    enabled: !!params.month,
    placeholderData: keepPreviousData,
  })
}

// Streams the .xlsx / .csv from the API (needs the auth header, so a plain link would not work).
export const downloadAttendanceSheet = async (params, format = 'xlsx') => {
  const res = await api.get('/attendance/monthly-sheet/export', {
    params: { ...cleanParams(params), format },
    responseType: 'blob',
  })
  const filename = `attendance_sheet_${params.month}_${params.filter}_${params.source}.${format}`
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return filename
}

// The bulk-upload sample for any month (employees listed, one column per day). Needs the auth header, so it is a blob download.
export const downloadAttendanceUploadSample = async ({ month, includeInactive }) => {
  const res = await api.get('/attendance/bulk-template', {
    params: { month, include_inactive: includeInactive ? 1 : 0 },
    responseType: 'blob',
  })
  const filename = `attendance_upload_sample_${month}.xlsx`
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return filename
}

// dryRun = true only reports what the file would change; false saves it (the server re-reads the file and refuses on any problem).
export const useBulkAttendanceUpload = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ month, file, dryRun }) => {
      const form = new FormData()
      form.append('month', month)
      form.append('file', file)
      form.append('dry_run', dryRun ? '1' : '0')
      return (await api.post('/attendance/bulk-upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: (_data, vars) => {
      if (!vars.dryRun) {
        queryClient.invalidateQueries({ queryKey: ['attendance-sheet'] })
        queryClient.invalidateQueries({ queryKey: ['attendance'] })
        ;['payroll', 'employee-payroll', 'payroll-summary'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      }
    },
  })
}

// With responseType 'blob' an error body arrives as a Blob - read the message out of it.
export const readBlobError = async (err) => {
  const data = err?.response?.data
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text())
      return body.message || Object.values(body.errors || {})?.[0]?.[0]
    } catch {
      return null
    }
  }
  return err?.response?.data?.message || null
}

/* ------------------------------------------------------------------ *
 * Edit one employee's attendance for one day (HR)
 * ------------------------------------------------------------------ */

// `target` = { employeeId, date: 'yyyy-MM-dd', source: 'live' | 'approved' } or null (closed).
export const useDayRecord = (target) => {
  return useQuery({
    queryKey: ['attendance-day-record', target?.employeeId, target?.date, target?.source],
    queryFn: async () =>
      (await api.get('/attendance/day-record', {
        params: { employee_id: target.employeeId, date: target.date, source: target.source },
      })).data.data,
    enabled: !!target,
    gcTime: 0, // always show what is stored right now, never a cached copy
  })
}

export const useSaveDayRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.put('/attendance/day-record', body)).data,
    onSuccess: () => {
      // The edit can change the register, today's list, and (for approved data) payroll figures.
      ;['attendance-sheet', 'today-attendance', 'attendance-day-record', 'attendance', 'payroll', 'payroll-summary', 'employee-payroll']
        .forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    },
  })
}
