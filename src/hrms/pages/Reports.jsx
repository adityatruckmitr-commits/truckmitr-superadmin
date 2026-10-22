import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Download, TrendingUp, Users } from 'lucide-react-teleadmin'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useAttendanceReport } from '../hooks/useAttendance'
import toast from 'react-hot-toast'

const Reports = () => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [shouldFetch, setShouldFetch] = useState(true)

  const { data: reportData, isLoading: loading, refetch } = useAttendanceReport(
    shouldFetch ? { start_date: startDate, end_date: endDate } : {}
  )

  const fetchReport = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }
    setShouldFetch(true)
    refetch()
  }

  const calculateAttendanceRate = (present, total) => {
    if (!total) return 0
    return Math.round((present / total) * 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">View attendance and payroll reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-xs border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                  <h3 className="text-2xl font-bold text-gray-900">{reportData.report?.length || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-xs border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {reportData.report?.length > 0
                      ? Math.round(
                        reportData.report.reduce((acc, emp) =>
                          acc + calculateAttendanceRate(emp.present, emp.total_days), 0
                        ) / reportData.report.length
                      )
                      : 0}%
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-xs border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Present</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {reportData.report?.reduce((acc, emp) => acc + (emp.present || 0), 0) || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-xs border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Absent</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {reportData.report?.reduce((acc, emp) => acc + (emp.absent || 0), 0) || 0}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Attendance Report</h2>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Half Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.report?.map((employee) => (
                    <motion.tr
                      key={employee.employee_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employee?.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.employee?.emp_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.total_days}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">{employee.present}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">{employee.absent}</td>
                      <td className="px-6 py-4 text-sm text-yellow-600 font-medium">{employee.half_day}</td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-medium">{employee.late}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.total_work_hours ? parseFloat(employee.total_work_hours).toFixed(1) : '0'}h
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${calculateAttendanceRate(employee.present, employee.total_days)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {calculateAttendanceRate(employee.present, employee.total_days)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
