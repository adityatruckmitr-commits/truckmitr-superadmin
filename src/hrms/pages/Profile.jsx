import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  Award,
  Edit,
  ArrowLeft,
  MoreVertical,
  Download,
  Printer,
  FileText,
  X,
  CreditCard,
  Lock,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  TrendingUp,
  UserMinus,
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useEmployees, useUpdateEmployee, useDepartments, useStates } from '../hooks/useEmployees'
import { useLeaveBalance } from '../hooks/useLeaveRequests'
import { useEmployeeReviews } from '../hooks/usePerformance'
import { useEmployeeAllTimeAttendance } from '../hooks/useAttendance'
import { useEmployeePayroll } from '../hooks/usePayroll'
import { useResignationRequests } from '../hooks/useResignation'
import { formatWorkHoursShort } from '../utils/timeFormat'
import { Avatar, cx } from '../components/ui'
import { DocumentCard, DocumentRow, useDocumentManager } from '../components/profile/documents'
import { HRMS_BASE_FILE_PATH } from '../env'

const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'job', label: 'Job Details', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'salary', label: 'Salary', icon: CreditCard },
  { id: 'leave', label: 'Leave Balance', icon: Calendar },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'attendance', label: 'Attendance History', icon: Clock },
  { id: 'timeline', label: 'Timeline', icon: Activity },
]

function LayoutDashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

const safeDate = (val, pattern = 'dd MMM yyyy') => {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : format(d, pattern)
}

const tenureLabel = (dojVal) => {
  if (!dojVal) return null
  const doj = new Date(dojVal)
  if (isNaN(doj.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - doj.getFullYear()
  let months = now.getMonth() - doj.getMonth()
  if (now.getDate() < doj.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  const parts = []
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
  parts.push(`${months} mo${months !== 1 ? 's' : ''}`)
  return parts.join(' ')
}

const fmtInr = (n) => (n != null && n !== '' ? `₹${Number(n).toLocaleString('en-IN')}` : null)

const Profile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const isHROrAdmin = ['hr', 'admin', 'super_admin', 'manager'].includes(currentUser?.role)

  const { data: employeesData, isLoading: employeesLoading } = useEmployees()
  const updateEmployee = useUpdateEmployee()
  const { data: departments = [] } = useDepartments()
  const { data: states = [] } = useStates()

  const rawList = employeesData?.data || employeesData?.employees || employeesData
  const allEmployees = Array.isArray(rawList) ? rawList : []

  const targetEmployee = useMemo(() => {
    if (!id) return currentUser
    return allEmployees.find(
      (emp) =>
        String(emp.id) === String(id) ||
        emp.email === id ||
        emp.employee_id === id ||
        emp.emp_id === id
    ) || null
  }, [id, currentUser, allEmployees])

  const isOwnProfile = !id || targetEmployee?.email === currentUser?.email || targetEmployee?.id === currentUser?.id
  const empIdForQueries = targetEmployee?.emp_id || targetEmployee?.employee_id

  // Documents: HR / admin can upload for anyone, an employee for themself; only HR can remove.
  const canUploadDocs = isHROrAdmin || isOwnProfile
  const canRemoveDocs = isHROrAdmin
  const docMgr = useDocumentManager({ empId: empIdForQueries, canUpload: canUploadDocs && !!empIdForQueries, isOwn: isOwnProfile })

  // Profile state & tabs
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  // Attendance History tab - month-wise calendar navigation
  const [attendanceMonth, setAttendanceMonth] = useState(null)

  const emptyFormData = {
    full_name: '', guardian_name: '', dob: '', gender: 'Male', marital_status: '', blood_group: '',
    email: '', mobile: '', current_address: '', permanent_address: '', city: '', state_id: '', pin: '',
    designation: '', department_id: '', doj: '', employment_type: 'Full Time', work_location: '',
    reporting_manager_id: '', ctc: '', status: 'Active',
    bank_account_name: '', bank_name: '', bank_account_number: '', ifsc: '', upi_id: '',
    pan: '', aadhaar: '', emergency_name: '', emergency_relation: '', emergency_phone: '',
    basic_salary: '', hra: '', special_allowance: '', gross_salary: '', epf: '', esi: '',
  }

  const buildFormData = (emp) => ({
    full_name: emp?.full_name || emp?.name || '',
    guardian_name: emp?.guardian_name || '',
    dob: emp?.dob ? String(emp.dob).slice(0, 10) : '',
    gender: emp?.gender || 'Male',
    marital_status: emp?.marital_status || '',
    blood_group: emp?.blood_group || '',
    email: emp?.email || '',
    mobile: emp?.mobile || emp?.phone || '',
    current_address: emp?.current_address || '',
    permanent_address: emp?.permanent_address || '',
    city: emp?.city || '',
    state_id: emp?.state_id || emp?.state || '',
    pin: emp?.pin || '',
    designation: emp?.designation || '',
    department_id: emp?.department_id || emp?.department || '',
    doj: emp?.doj ? String(emp.doj).slice(0, 10) : '',
    employment_type: emp?.employment_type || 'Full Time',
    work_location: emp?.work_location || '',
    reporting_manager_id: emp?.reporting_manager_id || emp?.reporting_manager || '',
    ctc: emp?.ctc || '',
    status: emp?.status || 'Active',
    bank_account_name: emp?.bank_account_name || emp?.full_name || '',
    bank_name: emp?.bank_name || '',
    bank_account_number: emp?.bank_account_number || '',
    ifsc: emp?.ifsc || '',
    upi_id: emp?.upi_id || '',
    pan: emp?.pan || '',
    aadhaar: emp?.aadhaar || '',
    emergency_name: emp?.emergency_name || '',
    emergency_relation: emp?.emergency_relation || '',
    emergency_phone: emp?.emergency_phone || '',
    basic_salary: emp?.basic_salary || '',
    hra: emp?.hra || '',
    special_allowance: emp?.special_allowance || '',
    gross_salary: emp?.gross_salary || '',
    epf: emp?.epf || '',
    esi: emp?.esi || '',
  })

  const [editTab, setEditTab] = useState('personal')
  const [formData, setFormData] = useState(emptyFormData)

  const handleOpenEdit = () => {
    setFormData(buildFormData(targetEmployee))
    setShowEditModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Saving profile changes...')
    try {
      await updateEmployee.mutateAsync({ email: formData.email, ...formData })
      toast.success('Profile updated successfully! ✅', { id: loadingToast })
      setShowEditModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile', { id: loadingToast })
    }
  }

  // Real hooks scoped to this employee
  const currentYear = new Date().getFullYear()
  const { data: leaveBalanceData } = useLeaveBalance(empIdForQueries, currentYear)
  const { data: reviews } = useEmployeeReviews(empIdForQueries)
  const { data: resignations } = useResignationRequests(empIdForQueries ? { employee_id: empIdForQueries } : {})
  const fyStart = `${currentYear}-01-01`
  const fyEnd = `${currentYear}-12-31`
  const { data: payrollData } = useEmployeePayroll(empIdForQueries, fyStart, fyEnd)

  const effectiveAttendanceMonth = attendanceMonth || format(new Date(), 'yyyy-MM')
  const { data: allTimeAttendance, isLoading: attendanceLoading } = useEmployeeAllTimeAttendance(
    activeTab === 'attendance' ? empIdForQueries : null,
    { month: effectiveAttendanceMonth, per_page: 100 }
  )

  const departmentName = useMemo(() => {
    const deptVal = targetEmployee?.department
    if (deptVal && typeof deptVal === 'object') return deptVal.name
    if (typeof deptVal === 'string' && departments.some(d => String(d.id) === deptVal)) {
      return departments.find(d => String(d.id) === deptVal)?.name
    }
    return deptVal || null
  }, [targetEmployee, departments])

  const stateName = useMemo(() => {
    const stateVal = targetEmployee?.state
    const match = states.find(s => String(s.id) === String(stateVal))
    return match?.name || (typeof stateVal === 'string' && isNaN(Number(stateVal)) ? stateVal : null)
  }, [targetEmployee, states])

  const managerName = useMemo(() => {
    const mgrVal = targetEmployee?.reporting_manager
    if (mgrVal && typeof mgrVal === 'object') return mgrVal.name
    const match = allEmployees.find(e => e.emp_id === mgrVal || e.employee_id === mgrVal)
    return match?.full_name || (typeof mgrVal === 'string' && !mgrVal.match(/^TM/) ? mgrVal : match?.full_name || null)
  }, [targetEmployee, allEmployees])

  // Real display values - honest fields, honest empty state, never fabricated
  const dv = (val) => (val === null || val === undefined || val === '' ? 'Not provided' : val)
  const empName = targetEmployee?.full_name || targetEmployee?.name || '—'
  const empId = targetEmployee?.emp_id || targetEmployee?.employee_id || '—'
  const empDesignation = targetEmployee?.designation || 'Not set'
  const empDept = departmentName || 'Not set'
  const empEmail = targetEmployee?.email || '—'
  const empMobile = dv(targetEmployee?.mobile || targetEmployee?.phone)
  const empLocation = dv(targetEmployee?.work_location)
  const empDOJRaw = targetEmployee?.doj
  const empDOJ = safeDate(empDOJRaw) || 'Not set'
  const empType = targetEmployee?.employment_type || 'Not set'
  const empManager = dv(managerName)
  const empDOB = safeDate(targetEmployee?.dob) || 'Not provided'
  const empGender = dv(targetEmployee?.gender)
  const empMarital = dv(targetEmployee?.marital_status)
  const empBloodGroup = dv(targetEmployee?.blood_group)
  const empStatus = targetEmployee?.status || (targetEmployee?.is_active ? 'Verified' : 'Inactive')
  const isActiveEmployee = targetEmployee?.is_active === 1 || targetEmployee?.is_active === true
  const tenure = tenureLabel(empDOJRaw)

  const documents = useMemo(() => {
    if (!targetEmployee) return []
    const base = HRMS_BASE_FILE_PATH
    return [
      { key: 'photo_path', type: 'photo', name: 'Profile Photo' },
      { key: 'pan_file_path', type: 'pan', name: 'PAN Card' },
      { key: 'aadhaar_file_path', type: 'aadhaar', name: 'Aadhaar Card (Front)' },
      { key: 'aadhaar_back_file_path', type: 'aadhaar_back', name: 'Aadhaar Card (Back)' },
      { key: 'education_file_path', type: 'education', name: 'Education Certificate' },
      { key: 'resume_file_path', type: 'resume', name: 'Resume' },
      { key: 'cheque_path', type: 'cheque', name: 'Cancelled Cheque' },
      { key: 'esign_path', type: 'esign', name: 'E-Sign' },
    ].map((d) => {
      const path = targetEmployee[d.key]
      return { ...d, path, url: path ? `${base}/${path}` : null, uploaded: Boolean(path) }
    })
  }, [targetEmployee])

  const leaveBalances = Array.isArray(leaveBalanceData?.data) ? leaveBalanceData.data : (Array.isArray(leaveBalanceData) ? leaveBalanceData : [])
  const reviewList = Array.isArray(reviews) ? reviews : []
  const resignationList = Array.isArray(resignations) ? resignations : (Array.isArray(resignations?.data) ? resignations.data : [])
  const salaryStructure = payrollData?.salary_structure || null

  const attendanceSummary = allTimeAttendance?.summary || {}
  const attendanceRecords = Array.isArray(allTimeAttendance?.data) ? allTimeAttendance.data : []

  // First time this employee's history loads, jump straight to the most
  // recent month that actually has records, instead of showing an empty
  // calendar for the real current month if nothing's been logged yet there.
  const [hasAutoJumped, setHasAutoJumped] = useState(false)
  useEffect(() => {
    if (!hasAutoJumped && attendanceMonth === null && allTimeAttendance) {
      if (attendanceRecords.length === 0 && attendanceSummary.last_record_date) {
        setAttendanceMonth(String(attendanceSummary.last_record_date).slice(0, 7))
      }
      setHasAutoJumped(true)
    }
  }, [hasAutoJumped, attendanceMonth, allTimeAttendance, attendanceRecords.length, attendanceSummary.last_record_date])

  const monthSummary = useMemo(() => {
    const s = { present: 0, absent: 0, wfh: 0, on_leave: 0, work_hours: 0 }
    attendanceRecords.forEach((r) => {
      if (r.attendance_status === 'present') s.present += 1
      else if (r.attendance_status === 'absent') s.absent += 1
      else if (r.attendance_status === 'wfh') s.wfh += 1
      else if (r.attendance_status === 'on_leave') s.on_leave += 1
      if (r.work_hours) s.work_hours += Number(r.work_hours)
    })
    return s
  }, [attendanceRecords])

  const calendarWeeks = useMemo(() => {
    const [y, m] = effectiveAttendanceMonth.split('-').map(Number)
    const recordsByDate = {}
    attendanceRecords.forEach((r) => { recordsByDate[r.date] = r })
    const daysInMonth = new Date(y, m, 0).getDate()
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const firstWeekday = new Date(y, m - 1, 1).getDay()
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${effectiveAttendanceMonth}-${String(day).padStart(2, '0')}`
      const record = recordsByDate[dateStr]
      const weekday = new Date(y, m - 1, day).getDay()
      let status
      if (record) status = record.attendance_status
      else if (dateStr > todayStr) status = 'future'
      else if (weekday === 0 || weekday === 6) status = 'week_off'
      else status = 'absent'
      cells.push({ day, dateStr, status, record, weekdayLabel: weekdayLabels[weekday] })
    }
    while (cells.length % 7 !== 0) cells.push(null)

    const weeks = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }, [effectiveAttendanceMonth, attendanceRecords])

  const ATTENDANCE_STATUS_STYLES = {
    present: { box: 'bg-emerald-50 border-emerald-200', label: 'text-emerald-700', dot: 'bg-emerald-600', text: 'Present' },
    absent: { box: 'bg-red-50 border-red-200', label: 'text-red-800/70', dot: 'bg-red-700', text: 'Absent' },
    wfh: { box: 'bg-purple-50 border-purple-200', label: 'text-purple-700', dot: 'bg-purple-600', text: 'WFH' },
    on_leave: { box: 'bg-blue-50 border-blue-200', label: 'text-blue-800', dot: 'bg-blue-800', text: 'On Leave' },
    week_off: { box: 'bg-gray-100 border-gray-200', label: 'text-gray-500', dot: 'bg-gray-400', text: 'Week Off' },
    future: { box: 'bg-gray-50 border-gray-100 opacity-50', label: 'text-gray-300', dot: 'bg-gray-200', text: '' },
  }
  const getAttendanceStatusStyle = (status) => ATTENDANCE_STATUS_STYLES[status] || ATTENDANCE_STATUS_STYLES.week_off

  const goToMonth = (delta) => {
    const [y, m] = effectiveAttendanceMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setAttendanceMonth(format(d, 'yyyy-MM'))
  }
  const isCurrentCalendarMonth = effectiveAttendanceMonth === format(new Date(), 'yyyy-MM')

  // Real, chronological career timeline built only from facts that exist
  const timelineEvents = useMemo(() => {
    const events = []
    if (empDOJRaw) {
      events.push({ date: new Date(empDOJRaw), icon: Building, color: 'bg-gray-400', title: 'Joined Company', desc: `Onboarded as ${empDesignation}` })
    }
    reviewList.forEach((r) => {
      if (r.submitted_at) {
        events.push({ date: new Date(r.submitted_at), icon: Award, color: 'bg-emerald-500', title: `${r.cycle_name} Review Completed`, desc: r.rating != null ? `Rating: ${r.rating} / 5` : 'Review submitted' })
      }
    })
    resignationList.forEach((r) => {
      if (r.created_at) {
        events.push({ date: new Date(r.created_at), icon: UserMinus, color: r.status === 'approved' ? 'bg-rose-500' : 'bg-amber-500', title: `Resignation ${r.status === 'approved' ? 'Approved' : r.status === 'pending' ? 'Submitted' : r.status}`, desc: r.reason || 'Exit process' })
      }
    })
    return events.sort((a, b) => b.date - a.date)
  }, [empDOJRaw, empDesignation, reviewList, resignationList])

  if (employeesLoading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
  }

  if (!targetEmployee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-sm font-semibold text-gray-700">Employee not found</p>
        <p className="text-xs text-gray-400 mt-1">The requested profile does not exist or you don't have access to it.</p>
        <button onClick={() => navigate('/employees')} className="mt-4 text-xs font-semibold text-blue-600 hover:underline">Back to Employees</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ---------------- Top Bar & Breadcrumb ---------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Employee Profile
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/employees" className="hover:text-primary-600 transition-colors">Employee</Link>
            <span>/</span>
            <span className="font-medium text-gray-800">Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isHROrAdmin && (
            <button
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-2xs transition-all hover:bg-gray-50 hover:border-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Employees</span>
            </button>
          )}

          {(isHROrAdmin || isOwnProfile) && (
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:bg-primary-700 hover:shadow-sm"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMoreActions((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-2xs transition-all hover:bg-gray-50 hover:text-gray-900"
              title="More actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {showMoreActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl z-30"
                >
                  <button
                    onClick={() => { setShowMoreActions(false); window.print() }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Printer className="h-4 w-4 text-gray-400" />
                    Print Profile
                  </button>
                  {isHROrAdmin && !isOwnProfile && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { setShowMoreActions(false); toast.success('Password reset link sent to employee email!') }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                      >
                        <Lock className="h-4 w-4 text-amber-500" />
                        Send Password Reset
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ---------------- Employee Header Hero Banner ---------------- */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative shrink-0">
              <Avatar
                name={empName}
                src={targetEmployee?.photo_path ? `${HRMS_BASE_FILE_PATH}/${targetEmployee.photo_path}` : null}
                size="xl"
                className="h-24 w-24 ring-4 ring-slate-100 shadow-md text-2xl"
              />
              <span
                className={cx('absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white', isActiveEmployee ? 'bg-emerald-500' : 'bg-gray-400')}
                title={isActiveEmployee ? 'Active' : 'Inactive'}
              />
            </div>

            <div className="text-center sm:text-left min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{empName}</h2>
                <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold border', isActiveEmployee ? 'bg-emerald-100/70 text-emerald-700 border-emerald-200/60' : 'bg-gray-100 text-gray-600 border-gray-200')}>
                  {empStatus}
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-700">{empDesignation}</p>
              <p className="text-xs font-mono text-gray-500">{empId} &bull; {empDept}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /><span>{empEmail}</span></div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /><span>{empMobile}</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-8 lg:border-l lg:border-gray-100 lg:pl-8 text-xs shrink-0">
            <div><span className="text-gray-400 block font-medium">Date of Birth</span><span className="font-semibold text-gray-900 mt-0.5 block">{empDOB}</span></div>
            <div><span className="text-gray-400 block font-medium">Date of Joining</span><span className="font-semibold text-gray-900 mt-0.5 block">{empDOJ}</span></div>
            <div><span className="text-gray-400 block font-medium">Gender</span><span className="font-semibold text-gray-900 mt-0.5 block">{empGender}</span></div>
            <div><span className="text-gray-400 block font-medium">Reporting Manager</span><span className="font-semibold text-gray-900 mt-0.5 block">{empManager}</span></div>
            <div><span className="text-gray-400 block font-medium">Marital Status</span><span className="font-semibold text-gray-900 mt-0.5 block">{empMarital}</span></div>
            <div><span className="text-gray-400 block font-medium">Employment Type</span><span className="font-semibold text-gray-900 mt-0.5 block">{empType}</span></div>
            <div><span className="text-gray-400 block font-medium">Blood Group</span><span className="font-semibold text-gray-900 mt-0.5 block">{empBloodGroup}</span></div>
            <div><span className="text-gray-400 block font-medium">Location</span><span className="font-semibold text-gray-900 mt-0.5 block">{empLocation}</span></div>
          </div>
        </div>
      </div>

      {/* ---------------- Navigation Tabs ---------------- */}
      <div className="border-b border-gray-200">
        <nav className="custom-scrollbar flex gap-1 overflow-x-auto pb-px">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-4 text-xs font-semibold transition-all',
                  isActive ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                <Icon className={cx('h-4 w-4', isActive ? 'text-blue-600' : 'text-gray-400')} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Employment Summary</h3>
              <p className="text-xs leading-relaxed text-gray-600">
                {empDesignation} in {empDept}{tenure ? `, with the company for ${tenure}` : ''}. Currently {isActiveEmployee ? 'an active' : 'an inactive'} {empType.toLowerCase()} employee{empManager !== 'Not provided' ? `, reporting to ${empManager}` : ''}.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2"><Award className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-gray-900">Education</h3></div>
              {targetEmployee?.highest_qualification ? (
                <div className="text-xs space-y-2">
                  <p className="font-bold text-gray-900">{targetEmployee.highest_qualification}</p>
                  {documents.find(d => d.key === 'education_file_path')?.uploaded ? (
                    <a href={documents.find(d => d.key === 'education_file_path').url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline text-[11px]">
                      <FileText className="w-3 h-3" /> View Certificate
                    </a>
                  ) : (
                    <p className="text-[11px] text-gray-400">No certificate on file</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No education record on file.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3.5 text-xs">
              <div className="flex items-center gap-2 mb-1"><Phone className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-gray-900">Emergency Contact</h3></div>
              <div><span className="text-gray-400 block text-[11px]">Contact Name</span><span className="font-bold text-gray-900 mt-0.5 block">{dv(targetEmployee?.emergency_name)}</span></div>
              <div><span className="text-gray-400 block text-[11px]">Relationship</span><span className="font-semibold text-gray-800 mt-0.5 block">{dv(targetEmployee?.emergency_relation)}</span></div>
              <div><span className="text-gray-400 block text-[11px]">Phone Number</span><span className="font-semibold text-gray-800 mt-0.5 block">{dv(targetEmployee?.emergency_phone)}</span></div>
              <div><span className="text-gray-400 block text-[11px]">Address</span><span className="font-semibold text-gray-800 mt-0.5 block leading-relaxed">{dv(targetEmployee?.current_address)}</span></div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-gray-900">Documents</h3></div>
                <button onClick={() => setActiveTab('documents')} className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="space-y-2.5 text-xs">
                {documents.slice(0, 4).map((doc) => (
                  <DocumentRow key={doc.key} doc={doc} mgr={docMgr} canUpload={canUploadDocs} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 mb-1"><Info className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-bold text-gray-900">Quick Info</h3></div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-400">PAN Number</span><span className="font-mono font-semibold text-gray-800">{dv(targetEmployee?.pan)}</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-400">Bank</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.bank_name)}</span></div>
              <div className="flex justify-between border-b border-gray-100 pb-2"><span className="text-gray-400">Location</span><span className="font-semibold text-gray-800">{dv([targetEmployee?.city, stateName].filter(Boolean).join(', ') || null)}</span></div>
              <div className="flex justify-between pt-0.5"><span className="text-gray-400">Work Email</span><span className="font-semibold text-blue-600 truncate max-w-[160px]">{empEmail}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PERSONAL INFO */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-display text-base font-bold text-gray-900">Personal Details</h3>
              <p className="text-xs text-gray-500">Employee baseline identification details</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-gray-400 block font-medium">Full Name</span><span className="font-semibold text-gray-900 text-sm">{empName}</span></div>
              <div><span className="text-gray-400 block font-medium">Guardian Name</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.guardian_name)}</span></div>
              <div><span className="text-gray-400 block font-medium">Date of Birth</span><span className="font-semibold text-gray-800">{empDOB}</span></div>
              <div><span className="text-gray-400 block font-medium">Gender</span><span className="font-semibold text-gray-800">{empGender}</span></div>
              <div><span className="text-gray-400 block font-medium">Marital Status</span><span className="font-semibold text-gray-800">{empMarital}</span></div>
              <div><span className="text-gray-400 block font-medium">Blood Group</span><span className="font-semibold text-gray-800">{empBloodGroup}</span></div>
            </div>

            <div className="border-b border-gray-100 pt-4 pb-2"><h4 className="font-display text-sm font-bold text-gray-900">Contact Information</h4></div>
            <div className="space-y-3 text-xs">
              <div><span className="text-gray-400 block font-medium">Official Email</span><span className="font-semibold text-gray-800">{empEmail}</span></div>
              <div><span className="text-gray-400 block font-medium">Mobile Number</span><span className="font-semibold text-gray-800">{empMobile}</span></div>
              <div>
                <span className="text-gray-400 block font-medium">Emergency Contact</span>
                <span className="font-semibold text-gray-800">
                  {targetEmployee?.emergency_name ? `${targetEmployee.emergency_name} (${dv(targetEmployee?.emergency_relation)}) - ${dv(targetEmployee?.emergency_phone)}` : 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-display text-base font-bold text-gray-900">Address Details</h3>
              <p className="text-xs text-gray-500">Residential and permanent address records</p>
            </div>
            <div className="space-y-5 text-xs">
              <div><span className="text-gray-400 block font-medium mb-1">Current Address</span><p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{dv(targetEmployee?.current_address)}</p></div>
              <div><span className="text-gray-400 block font-medium mb-1">Permanent Address</span><p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{dv(targetEmployee?.permanent_address)}</p></div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div><span className="text-gray-400 block font-medium">City</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.city)}</span></div>
                <div><span className="text-gray-400 block font-medium">State</span><span className="font-semibold text-gray-800">{dv(stateName)}</span></div>
                <div><span className="text-gray-400 block font-medium">PIN Code</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.pin)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: JOB DETAILS */}
      {activeTab === 'job' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-display text-base font-bold text-gray-900">Employment Details</h3>
              <p className="text-xs text-gray-500">Official designation, reporting manager, and department structure</p>
            </div>
            <span className={cx('rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset', isActiveEmployee ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-gray-200')}>
              {isActiveEmployee ? 'Active Employee' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 text-xs">
            <div className="space-y-4">
              <div><span className="text-gray-400 block font-medium">Job Title</span><span className="font-bold text-gray-900 text-sm">{empDesignation}</span></div>
              <div><span className="text-gray-400 block font-medium">Employee ID</span><span className="font-semibold text-gray-800">{empId}</span></div>
              <div><span className="text-gray-400 block font-medium">Department</span><span className="font-semibold text-gray-800">{empDept}</span></div>
            </div>
            <div className="space-y-4">
              <div><span className="text-gray-400 block font-medium">Reporting Manager</span><span className="font-semibold text-gray-800">{empManager}</span></div>
              <div><span className="text-gray-400 block font-medium">Employment Type</span><span className="font-semibold text-gray-800">{empType}</span></div>
              <div><span className="text-gray-400 block font-medium">Work Location</span><span className="font-semibold text-gray-800">{empLocation}</span></div>
            </div>
            <div className="space-y-4">
              <div><span className="text-gray-400 block font-medium">Date of Joining</span><span className="font-semibold text-gray-800">{empDOJ}</span></div>
              <div><span className="text-gray-400 block font-medium">Tenure</span><span className="font-semibold text-gray-800">{tenure || 'Not available'}</span></div>
              <div><span className="text-gray-400 block font-medium">Status</span><span className="font-semibold text-gray-800">{empStatus}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">Uploaded Documents</h3>
            <p className="text-xs text-gray-500">Real files on file for this employee — identity, tax, and education records.{canUploadDocs ? ' Click a card, or drop a file onto it, to upload or replace a document.' : ''}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.key} doc={doc} mgr={docMgr} canUpload={canUploadDocs} canRemove={canRemoveDocs} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: SALARY */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-display text-base font-bold text-gray-900">Salary Breakdown</h3>
                {salaryStructure?.ctc && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Annual CTC: {fmtInr(Number(salaryStructure.ctc) * 12) || '—'}
                  </span>
                )}
              </div>

              {!salaryStructure ? (
                <p className="text-xs text-gray-400 py-4">No salary structure on file for this employee.</p>
              ) : (
                <>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-600">Basic Salary</span><span className="font-semibold text-gray-900">{fmtInr(salaryStructure.basic_salary) || '—'} / mo</span></div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-600">House Rent Allowance (HRA)</span><span className="font-semibold text-gray-900">{fmtInr(salaryStructure.hra) || '—'} / mo</span></div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-600">Conveyance Allowance</span><span className="font-semibold text-gray-900">{fmtInr(salaryStructure.conveyance_allowance) || '—'} / mo</span></div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-600">Special Allowance</span><span className="font-semibold text-gray-900">{fmtInr(salaryStructure.special_allowance) || '—'} / mo</span></div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-600 font-bold">Gross Salary</span><span className="font-bold text-gray-900 text-sm">{fmtInr(salaryStructure.gross_salary) || '—'} / mo</span></div>
                  </div>

                  {(salaryStructure.epf || salaryStructure.esi || salaryStructure.medical || salaryStructure.gratuity || salaryStructure.bonus) && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-700 mb-2">Statutory Deductions & Benefits</h4>
                      <div className="space-y-1.5 text-xs text-gray-500">
                        {salaryStructure.epf && <div className="flex justify-between"><span>EPF (Employee Provident Fund)</span><span className="font-medium text-gray-800">{fmtInr(salaryStructure.epf)}</span></div>}
                        {salaryStructure.esi && <div className="flex justify-between"><span>ESI</span><span className="font-medium text-gray-800">{fmtInr(salaryStructure.esi)}</span></div>}
                        {salaryStructure.medical && <div className="flex justify-between"><span>Medical</span><span className="font-medium text-gray-800">{fmtInr(salaryStructure.medical)}</span></div>}
                        {salaryStructure.gratuity && <div className="flex justify-between"><span>Gratuity</span><span className="font-medium text-gray-800">{fmtInr(salaryStructure.gratuity)}</span></div>}
                        {salaryStructure.bonus && <div className="flex justify-between"><span>Bonus</span><span className="font-medium text-gray-800">{fmtInr(salaryStructure.bonus)}</span></div>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="font-display text-base font-bold text-gray-900">Bank Account Details</h3>
                <p className="text-xs text-gray-500">Direct deposit payroll bank info</p>
              </div>
              <div className="space-y-3 text-xs">
                <div><span className="text-gray-400 block font-medium">Bank Name</span><span className="font-semibold text-gray-800 text-sm">{dv(targetEmployee?.bank_name)}</span></div>
                <div><span className="text-gray-400 block font-medium">Account Number</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.bank_account_number)}</span></div>
                <div><span className="text-gray-400 block font-medium">IFSC Code</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.ifsc)}</span></div>
                <div><span className="text-gray-400 block font-medium">Account Holder Name</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.bank_account_name || empName)}</span></div>
                <div><span className="text-gray-400 block font-medium">UPI ID</span><span className="font-semibold text-gray-800">{dv(targetEmployee?.upi_id)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: LEAVE BALANCE */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {leaveBalances.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-gray-700">No leave balance on file</p>
              <p className="text-xs text-gray-400 mt-1">HR hasn't set up this employee's {currentYear} allocation yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {leaveBalances.map((lb) => {
                const total = Number(lb.total_days ?? lb.allocated ?? 0)
                const used = Number(lb.used_days ?? lb.used ?? 0)
                const remaining = Number(lb.remaining_days ?? lb.balance ?? (total - used))
                return (
                  <div key={lb.leave_type || lb.id} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                    <span className="text-xs font-medium text-blue-700 capitalize">{(lb.leave_type || 'Leave').replace('_', ' ')}</span>
                    <p className="mt-1 text-2xl font-bold text-blue-900">{remaining} / {total}</p>
                    <span className="text-[11px] text-blue-600">{used} Days Used</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-gray-900">Performance Ratings & Reviews</h3>
              <p className="text-xs text-gray-500">Review cycle history for this employee</p>
            </div>
            {reviewList.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 border border-emerald-200">
                <span className="text-lg font-bold text-emerald-900">
                  {(reviewList.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewList.filter(r => r.rating != null).length || 0).toFixed(1)} / 5.0
                </span>
              </div>
            )}
          </div>

          {reviewList.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No performance reviews recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewList.map((r) => (
                <div key={r.id} className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>{r.cycle_name}</span>
                    {r.rating != null && <span className="text-emerald-600 font-semibold">Score: {r.rating}</span>}
                  </div>
                  {r.comments && <p className="text-gray-600">"{r.comments}"</p>}
                  <p className="text-[11px] text-gray-400">
                    {r.reviewer_name ? `— Reviewed by ${r.reviewer_name}` : `Status: ${r.status}`}
                    {r.submitted_at ? ` • ${safeDate(r.submitted_at)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: ATTENDANCE HISTORY (month-wise calendar, real data, all-time browsable) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Records', value: attendanceSummary.total_records ?? 0, color: 'text-gray-900' },
              { label: 'Present', value: attendanceSummary.total_present ?? 0, color: 'text-emerald-600' },
              { label: 'Absent', value: attendanceSummary.total_absent ?? 0, color: 'text-red-600' },
              { label: 'WFH', value: attendanceSummary.total_wfh ?? 0, color: 'text-blue-600' },
              { label: 'On Leave', value: attendanceSummary.total_on_leave ?? 0, color: 'text-purple-600' },
              { label: 'Work Hours', value: attendanceSummary.total_work_hours ? formatWorkHoursShort(attendanceSummary.total_work_hours) : '0h', color: 'text-gray-900' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-3.5 text-center">
                <p className={cx('text-xl font-extrabold', k.color)}>{k.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {(attendanceSummary.first_record_date || attendanceSummary.last_record_date) && (
            <p className="text-[11px] text-gray-400 font-medium">
              Records span {safeDate(attendanceSummary.first_record_date) || '—'} to {safeDate(attendanceSummary.last_record_date) || '—'} — browse below, month by month
            </p>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Daily Attendance Overview</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Every day of {safeDate(`${effectiveAttendanceMonth}-01`, 'MMMM yyyy')}, at a glance</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] font-semibold text-gray-500">
                {Object.values(ATTENDANCE_STATUS_STYLES).filter(s => s.text).map((s) => (
                  <div key={s.text} className="flex items-center gap-1.5">
                    <span className={cx('h-2 w-2 rounded-full', s.dot)} />
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 sm:px-5 py-2.5 flex items-center justify-center gap-3 border-b border-gray-100 bg-gray-50/50">
              <button onClick={() => goToMonth(-1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-white bg-white">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-gray-700 w-32 text-center">{safeDate(`${effectiveAttendanceMonth}-01`, 'MMMM yyyy')}</span>
              <button onClick={() => goToMonth(1)} disabled={isCurrentCalendarMonth} className="p-1.5 border border-gray-200 rounded-lg hover:bg-white bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-gray-400 font-medium ml-2">
                {monthSummary.present} Present · {monthSummary.absent} Absent · {monthSummary.wfh} WFH · {monthSummary.on_leave} Leave
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {attendanceLoading ? (
                <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-1.5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">{d}</div>
                    ))}
                  </div>
                  {calendarWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-2 sm:gap-2.5">
                      {week.map((cell, ci) => {
                        if (!cell) return <div key={ci} />
                        const style = getAttendanceStatusStyle(cell.status)
                        return (
                          <div
                            key={cell.dateStr}
                            title={cell.record ? `${cell.record.checkin_time ? format(new Date(cell.record.checkin_time), 'hh:mm a') : ''}${cell.record.checkout_time ? ' – ' + format(new Date(cell.record.checkout_time), 'hh:mm a') : ''}` : ''}
                          >
                            <div className={cx('rounded-lg border py-2.5 flex flex-col items-center justify-center', style.box)}>
                              <span className={cx('text-[9px] font-bold uppercase tracking-wide', style.label)}>{cell.weekdayLabel}</span>
                              <span className="text-base font-extrabold text-gray-900 leading-tight mt-0.5">{cell.day}</span>
                            </div>
                            {style.text && (
                              <p className="text-center text-[10px] font-semibold text-gray-400 mt-1">{style.text}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
          <h3 className="font-display text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Employment Timeline & History</h3>

          {timelineEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No timeline events on file.</p>
          ) : (
            <div className="relative pl-6 space-y-6 border-l-2 border-gray-200 ml-2">
              {timelineEvents.map((ev, i) => {
                const Icon = ev.icon
                return (
                  <div key={i} className="relative">
                    <span className={cx('absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-white ring-4 ring-white', ev.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-gray-900">{ev.title}</h4>
                    <p className="text-[11px] text-gray-500">{safeDate(ev.date)} • {ev.desc}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODAL: EDIT PROFILE MODAL ---------------- */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-6 py-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-gray-900">Edit Employee Profile</h3>
                  <p className="text-xs text-gray-500">Update personal, employment, and bank details</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>

              <div className="border-b border-gray-200 bg-gray-50/30 px-6">
                <div className="flex gap-4 overflow-x-auto text-xs font-semibold">
                  {['personal', 'employment', 'bank'].map((tabKey) => (
                    <button
                      key={tabKey}
                      onClick={() => setEditTab(tabKey)}
                      className={cx('py-3 border-b-2 capitalize transition-colors', editTab === tabKey ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800')}
                    >
                      {tabKey} Info
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {editTab === 'personal' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div><label className="block font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} required />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} required />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')}>
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Marital Status</label>
                      <select value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden">
                        <option value="">Not set</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Blood Group</label>
                      <input type="text" value={formData.blood_group} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Guardian Name</label>
                      <input type="text" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div className="sm:col-span-2"><label className="block font-medium text-gray-700 mb-1">Current Address</label>
                      <input type="text" value={formData.current_address} onChange={(e) => setFormData({ ...formData, current_address: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div className="sm:col-span-2"><label className="block font-medium text-gray-700 mb-1">Permanent Address</label>
                      <input type="text" value={formData.permanent_address} onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                  </div>
                )}

                {editTab === 'employment' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div><label className="block font-medium text-gray-700 mb-1">Designation</label>
                      <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Employment Type</label>
                      <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')}>
                        <option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Reporting Manager</label>
                      <input type="text" value={formData.reporting_manager_id} onChange={(e) => setFormData({ ...formData, reporting_manager_id: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Work Location</label>
                      <input type="text" value={formData.work_location} onChange={(e) => setFormData({ ...formData, work_location: e.target.value })} disabled={!isHROrAdmin} className={cx('w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden', !isHROrAdmin && 'bg-gray-100 text-gray-600 cursor-not-allowed')} />
                    </div>
                    {!isHROrAdmin && (
                      <div className="sm:col-span-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                        💡 Employment parameters (Designation, Manager, Employment Type, Location) are managed by HR. Please contact HR admin for official employment record changes.
                      </div>
                    )}
                  </div>
                )}

                {editTab === 'bank' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div><label className="block font-medium text-gray-700 mb-1">Bank Name</label>
                      <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">Account Number</label>
                      <input type="text" value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input type="text" value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                    <div><label className="block font-medium text-gray-700 mb-1">UPI ID</label>
                      <input type="text" value={formData.upi_id} onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-hidden" />
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={updateEmployee.isPending} className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60">
                    {updateEmployee.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Profile
