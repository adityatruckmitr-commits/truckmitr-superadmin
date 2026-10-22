import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export const useMyAttendance = (month, year) => {
  const { user } = useAuth()
  const empId = user?.emp_id

  return useQuery({
    queryKey: ['myAttendance', empId, month, year],
    queryFn: async () => {
      if (!empId) throw new Error('Employee ID not found')
      
      const response = await api.get(`/attendance/employee/${empId}/summary`, {
        params: { month, year }
      })
      return response.data
    },
    enabled: !!empId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
