import PageJump from '../../components/PageJump';
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, LogIn, LogOut, Clock, CheckCircle, XCircle, User, ArrowUpDown, X, Download, Upload, FileText } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import { useAttendance, useCheckIn, useCheckOut, useEmployeeTodayStatus } from '../hooks/useAttendance'
import { useDashboardStats } from '../hooks/useDashboard'
import { useEmployees, useDepartments } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { formatWorkHours } from '../utils/timeFormat'
import toast from 'react-hot-toast'
import { getTeamMembers, getTeamMemberIds, canManageTeam, hasFullAccess } from '../utils/teamFilter'
import axios from 'axios'
import { HRMS_API_BASE, HRMS_SELFIE_PATH, HRMS_TOKEN_KEY } from '../env'

const Attendance = () => {
  const { user } = useAuth()
  console.log(user)
  const isHR = hasFullAccess(user) // HR, admin, super admin, CEO and manager see everyone's records
  const canManage = canManageTeam(user)
  
  // Check-in/out states
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isCheckingIn, setIsCheckingIn] = useState(true)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // HR filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedShift, setSelectedShift] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [showSelfie, setShowSelfie] = useState(null)
  const [exportMonth, setExportMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [exportDepartment, setExportDepartment] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // CSV Upload states
  const [uploadMonth, setUploadMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [uploadFile, setUploadFile] = useState(null)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Queries
  const { data: todayStatus, refetch: refetchStatus } = useEmployeeTodayStatus(user?.emp_id)
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  // Get all employees and filter by team
  const { data: employeesData } = useEmployees()
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments()
  const allEmployees = employeesData?.data || employeesData || []
  const teamMembers = getTeamMembers(allEmployees, user)
  const teamMemberIds = getTeamMemberIds(allEmployees, user)

  const params = canManage ? {
    ...(selectedDate && !startDate && !endDate && { date: selectedDate }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
    ...(selectedEmployee && { employee_id: selectedEmployee }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(selectedShift && { shift_id: selectedShift }),
    ...(selectedType && { is_manual: selectedType === 'manual' ? '1' : '0' }),
    sort_by: sortBy,
    sort_order: sortOrder,
    page: currentPage,
    per_page: perPage
  } : {}

  const { data: attendanceResponse, isLoading: loading } = useAttendance(params)
  
  const attendanceData = attendanceResponse?.data || attendanceResponse || {}
  const allAttendance = Array.isArray(attendanceData) ? attendanceData : (attendanceData.data || [])
  // Filter attendance by team if user is a team manager (not admin/HR)
  const attendance = (canManage && !isHR) 
    ? allAttendance.filter(record => teamMemberIds.includes(record.employee_id))
    : allAttendance
  const pagination = attendanceData.data ? attendanceData : null
  const employees = teamMembers

  // Real day-level KPI summary for the currently selected single date (HR/manager view only)
  const kpiDate = selectedDate || format(new Date(), 'yyyy-MM-dd')
  const { data: dayStats } = useDashboardStats({ date: kpiDate }, { enabled: canManage && Boolean(selectedDate) })
  const isTodayKpi = kpiDate === format(new Date(), 'yyyy-MM-dd')

  const checkedIn = todayStatus?.checked_in || false
  const checkedOut = todayStatus?.checked_out || false

  // Camera functions
  const startCamera = async (checkIn = true) => {
    setIsCheckingIn(checkIn)
    setShowCamera(true)
    setCapturedImage(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      })
      console.log(stream);
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      toast.error('Camera access denied')
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setCapturedImage(null)
  }

const capturePhoto = () => {
  const video = videoRef.current
  const canvas = canvasRef.current

  if (!video || !canvas) {
    toast.error('Camera not ready.')
    return
  }

  // Check if video stream is active
  if (!streamRef.current || streamRef.current.getTracks().length === 0) {
    toast.error('Camera not active. Please try again.')
    return
  }

  // Check if video has loaded
  if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
    toast.error('Camera not loaded yet. Please wait a moment.')
    return
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error('Failed to capture image.')
      return
    }

    console.log('Image blob created:', blob)
    setCapturedImage(blob)
    
    // Stop camera stream but keep modal open
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    toast.success('Selfie captured! Click Submit to check in.')
  }, 'image/jpeg', 0.8)
}

  const submitAttendance = async () => {
    // For check-in, selfie is required
    if (isCheckingIn && !capturedImage) {
      toast.error('Please capture a selfie first')
      return
    }

    try {
      if (isCheckingIn) {
        console.log('Starting check-in...', { emp_id: user.emp_id, hasImage: !!capturedImage })
        
        const formData = new FormData()
        formData.append('employee_id', user.emp_id)
        formData.append('selfie', capturedImage, 'selfie.jpg')
        
        console.log('FormData created, calling mutation...')
        const result = await checkInMutation.mutateAsync(formData)
        console.log('Check-in result:', result)
        
        toast.success('Checked in successfully!')
        setCapturedImage(null)
        setShowCamera(false)
        refetchStatus()
      } else {
        // For check-out, no selfie needed
        console.log('Starting check-out...', { emp_id: user.emp_id })
        
        const result = await checkOutMutation.mutateAsync({ employee_id: user.emp_id })
        console.log('Check-out result:', result)
        
        toast.success('Checked out successfully!')
        setCapturedImage(null)
        setShowCamera(false)
        refetchStatus()
      }
    } catch (error) {
      console.error('Attendance submission error:', error)
      console.error('Error response:', error.response)
      toast.error(error.response?.data?.message || error.message || 'Failed to submit attendance')
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      half_day: 'bg-yellow-100 text-yellow-700',
      late: 'bg-orange-100 text-orange-700',
      on_leave: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  // const handleExportCSV = async () => {
  //   if (!exportMonth) {
  //     toast.error('Please select a month to export')
  //     return
  //   }

  //   setIsExporting(true)
  //   try {
  //     const token = localStorage.getItem(HRMS_TOKEN_KEY)
  //     const params = new URLSearchParams({
  //       month: exportMonth,
  //       ...(exportDepartment && { department_id: exportDepartment })
  //     })

  //     const response = await axios.get(`${HRMS_API_BASE}/attendance/hr-export-csv?${params.toString()}`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       },
  //       responseType: 'blob'
  //     })

  //     // Create download link
  //     const blob = new Blob([response.data], { type: 'text/csv' })
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement('a')
  //     link.href = url
  //     link.download = `attendance_${exportMonth}_dept_${exportDepartment || 'all'}.csv`
  //     document.body.appendChild(link)
  //     link.click()
  //     document.body.removeChild(link)
  //     window.URL.revokeObjectURL(url)

  //     toast.success('Attendance exported successfully!')
  //   } catch (error) {
  //     console.error('Export error:', error)
  //     toast.error(error.response?.data?.message || 'Failed to export attendance')
  //   } finally {
  //     setIsExporting(false)
  //   }
  // }

const handleDetailedExport = async () => {
  if (!exportMonth) {
    toast.error('Please select a month to export')
    return
  }

  setIsExporting(true)
  try {
    // Convert month to start and end dates
    const monthStart = format(new Date(exportMonth + '-01'), 'yyyy-MM-dd')
    const monthEnd = format(new Date(new Date(exportMonth + '-01').getFullYear(), new Date(exportMonth + '-01').getMonth() + 1, 0), 'yyyy-MM-dd')

    const token = localStorage.getItem(HRMS_TOKEN_KEY)
    const params = new URLSearchParams({
      start_date: monthStart,
      end_date: monthEnd,
      ...(exportDepartment && { department_id: exportDepartment })
    })

    const response = await axios.get(
      `${HRMS_API_BASE}/attendance/detailed-export?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    )

    // Create download link
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `detailed_attendance_${exportMonth}_dept_${exportDepartment || 'all'}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Detailed attendance report exported successfully!')
  } catch (error) {
console.error('Export error:', error)
toast.error(error.response?.data?.message || 'Failed to export detailed report')
} finally {
setIsExporting(false)
}
}

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
        toast.error('Please select a CSV or Excel file')
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setUploadFile(file)
    }
  }

  const handleUploadCSV = async () => {
    if (!uploadMonth) {
      toast.error('Please select a month')
      return
    }
    if (!uploadFile) {
      toast.error('Please select a CSV or Excel file')
      return
    }

    setIsUploading(true)
    try {
      const token = localStorage.getItem(HRMS_TOKEN_KEY)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('month', uploadMonth)
      formData.append('uploaded_by', user?.full_name || 'HR')
      formData.append('approved_by', user?.full_name || 'HR')
      formData.append('replace_existing', replaceExisting ? '1' : '0')

      const response = await axios.post(
        `${HRMS_API_BASE}/approved-attendance/upload-csv`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        const data = response.data.data
        toast.success(
          `Upload successful! Created: ${data.created}, Updated: ${data.updated}, Errors: ${data.errors}`,
          { duration: 5000 }
        )
        
        // Reset form
        setUploadFile(null)
        setReplaceExisting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload CSV')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
          Attendance Register
        </p>
        <h1 className="font-sans text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Attendance Register
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
          {isHR ? 'Manage employee attendance & revised records' : canManage ? 'Manage team attendance' : 'Mark your daily attendance'}
        </p>
      </div>

      {/* User Punch Card - Sleek Dark Classic Style */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 text-white shadow-md">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center text-base font-bold shrink-0">
              {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'HR'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{user?.full_name}</h2>
              <p className="text-xs font-semibold text-slate-300">{user?.emp_id}</p>
            </div>
          </div>

          {todayStatus?.attendance?.work_hours && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-200">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Work Hours Today: <strong className="text-white font-bold">{formatWorkHours(todayStatus.attendance.work_hours)}</strong></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
          <div className={`p-4 rounded-xl border transition-all ${checkedIn ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700/70'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {checkedIn ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Punch In</span>
            </div>
            <p className={`text-base sm:text-lg font-bold ${checkedIn ? 'text-emerald-300' : 'text-slate-300'}`}>
              {todayStatus?.attendance?.checkin_time 
                ? format(new Date(todayStatus.attendance.checkin_time), 'hh:mm a')
                : 'Not marked'}
            </p>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${checkedOut ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700/70'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {checkedOut ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Punch Out</span>
            </div>
            <p className={`text-base sm:text-lg font-bold ${checkedOut ? 'text-emerald-300' : 'text-slate-300'}`}>
              {todayStatus?.attendance?.checkout_time 
                ? format(new Date(todayStatus.attendance.checkout_time), 'hh:mm a')
                : 'Not marked'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          {!checkedIn && (
            <button
              onClick={() => startCamera(true)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Punch In</span>
            </button>
          )}
          
          {checkedIn && !checkedOut && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to punch out?')) {
                  try {
                    await checkOutMutation.mutateAsync({ employee_id: user.emp_id })
                    toast.success('Checked out successfully!')
                    refetchStatus()
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to punch out')
                  }
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Punch Out</span>
            </button>
          )}

          {checkedIn && checkedOut && (
            <div className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-800/90 border border-slate-700 text-amber-200 rounded-xl text-sm font-semibold">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Attendance Marked for Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  {isCheckingIn ? 'Punch In' : 'Punch Out'} — Take Photo
                </h3>
                <button onClick={stopCamera} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-slate-950 aspect-video">
                {!capturedImage ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="p-4 flex gap-3 bg-slate-50 border-t border-slate-100">
                {!capturedImage ? (
                  <>
                    <button
                      onClick={capturePhoto}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={submitAttendance}
                      disabled={checkInMutation.isPending || checkOutMutation.isPending}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {checkInMutation.isPending || checkOutMutation.isPending ? 'Submitting...' : 'Submit Attendance'}
                    </button>
                    <button
                      onClick={async () => {
                        setCapturedImage(null)
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: 'user', width: 1280, height: 720 } 
                          })
                          streamRef.current = stream
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream
                          }
                        } catch {
                          toast.error('Camera access denied')
                        }
                      }}
                      className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Retake
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HR/Manager Section - Only visible to HR and Team Managers */}
      {canManage && (
        <>
          {isHR && selectedDate && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-slate-900">
                  {isTodayKpi ? "Today's Summary" : `Summary for ${format(new Date(kpiDate), 'dd MMM yyyy')}`}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">{dayStats?.total_employees ?? 0} active employees</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Present', value: dayStats?.present_today, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Absent', value: dayStats?.absent_today, color: 'text-red-600 bg-red-50 border-red-100' },
                  { label: 'Late', value: dayStats?.late_today, color: 'text-orange-600 bg-orange-50 border-orange-100' },
                  { label: 'On Leave', value: dayStats?.on_leave_today, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { label: 'WFH', value: dayStats?.wfh_today, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                  { label: 'Short Leave', value: dayStats?.short_leave_today, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl border p-3 text-center ${item.color}`}>
                    <p className="text-xl font-extrabold">{item.value ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              {isTodayKpi && dayStats?.present_today === 0 && (
                <p className="text-[11px] text-slate-400 font-medium mt-3">No one has punched in yet today — employees are counted absent until they check in.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-bold text-slate-900">
                {isHR ? 'Filter Attendance Records' : 'Filter Team Records'}
              </h3>
              <button
                onClick={() => {
                  setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
                  setStartDate('')
                  setEndDate('')
                  setSelectedEmployee('')
                  setSelectedStatus('')
                  setSelectedShift('')
                  setSelectedType('')
                  setSortBy('date')
                  setSortOrder('desc')
                  setCurrentPage(1)
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Single Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setStartDate('')
                    setEndDate('')
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setSelectedDate('')
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setSelectedDate('')
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all truncate"
                >
                  <option value="">{isHR ? 'All Employees' : 'All Team Members'}</option>
                  {employees.map((emp) => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.full_name} ({emp.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="late">Late</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift</label>
                <select
                  value={selectedShift}
                  onChange={(e) => {
                    setSelectedShift(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Shifts</option>
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Types</option>
                  <option value="regular">Regular</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Per Page</label>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export & Upload Tools for HR */}
          {isHR && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3.5 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Export Monthly Report</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Download detailed Excel/CSV attendance sheet</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
                      <input
                        type="month"
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                      <select
                        value={exportDepartment}
                        onChange={(e) => setExportDepartment(e.target.value)}
                        disabled={departmentsLoading}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden"
                      >
                        <option value="">All Departments</option>
                        {departments?.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDetailedExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? 'Exporting Report...' : 'Export Detailed CSV/Excel'}
                </button>
              </div>

              {/* Upload Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3.5 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Upload Revised Attendance</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Upload CSV to bulk update attendance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Month</label>
                      <input
                        type="month"
                        value={uploadMonth}
                        onChange={(e) => setUploadMonth(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">CSV File</label>
                      <div className="flex gap-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 bg-slate-50/50 text-xs text-slate-700 truncate"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{uploadFile ? uploadFile.name : 'Choose file'}</span>
                        </label>
                        {uploadFile && (
                          <button
                            onClick={() => {
                              setUploadFile(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-slate-600">Replace existing records for this month</span>
                  </label>
                </div>

                <button
                  onClick={handleUploadCSV}
                  disabled={isUploading || !uploadFile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Uploading...' : 'Upload Revised CSV'}
                </button>
              </div>
            </div>
          )}

          {/* Main Records Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/80">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-800"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Log</h3>
                  <p className="text-xs text-slate-400 font-medium">Showing {attendance.length} entries</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th 
                        className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100/60"
                        onClick={() => {
                          setSortBy('employee_id')
                          setSortOrder(sortBy === 'employee_id' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Employee
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100/60"
                        onClick={() => {
                          setSortBy('date')
                          setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Punch In</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Punch Out</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hours</th>
                      <th 
                        className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100/60"
                        onClick={() => {
                          setSortBy('attendance_status')
                          setSortOrder(sortBy === 'attendance_status' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Selfie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-10 text-center text-slate-400 font-medium">
                          No attendance records found for selected filters
                        </td>
                      </tr>
                    ) : (
                      attendance.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-6 py-3.5">
                            <div>
                              <div className="font-medium text-slate-900">
                                {record.employee?.full_name || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {record.employee_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-700 font-medium">
                            {format(new Date(record.date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {record.checkin_time ? format(new Date(record.checkin_time), 'hh:mm a') : '—'}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">
                            {record.checkout_time ? format(new Date(record.checkout_time), 'hh:mm a') : '—'}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-900">
                            {record.work_hours ? formatWorkHours(record.work_hours) : '—'}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${getStatusColor(record.attendance_status)}`}>
                              {record.attendance_status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${
                              record.is_manual ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
                            }`}>
                              {record.is_manual ? 'Manual' : 'Auto'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            {record.selfie ? (
                              <img
                                src={`${HRMS_SELFIE_PATH}/${record.selfie}`}
                                alt="selfie"
                                onClick={() => setShowSelfie(record.selfie)}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform ring-1 ring-slate-200"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs">No selfie</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-500">
                    Showing {pagination.from} to {pagination.to} of {pagination.total} records
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.last_page}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                    >
                      Next
                    </button>
                    <PageJump page={currentPage} totalPages={pagination.last_page} onGo={setCurrentPage} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Selfie Preview Modal */}
      <AnimatePresence>
        {showSelfie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowSelfie(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Selfie Preview</h3>
                <button
                  onClick={() => setShowSelfie(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center bg-slate-950">
                <img
                  src={`${HRMS_SELFIE_PATH}/${showSelfie}`}
                  alt="Selfie"
                  className="rounded-xl w-full object-contain max-h-[300px]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

}

export default Attendance
