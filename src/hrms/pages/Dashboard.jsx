import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from '@hrms/router'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  UserCheck,
  Palmtree,
  UserPlus,
  Plus,
  Cake,
  Briefcase,
  ChevronRight,
  Sparkles,
  Info,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Wallet,
  Calendar as CalendarIcon,
  Laptop,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Building2,
  BarChart3,
  ListTodo,
  CheckCircle,
  CircleDot,
  AlertTriangle,
  Slash,
  Target,
  Activity,
  Ticket,
  ShieldCheck,
  FileBadge,
} from 'lucide-react-teleadmin'
import { format, isValid, addDays } from 'date-fns'
import {
  useDashboardStats,
  useAttendanceGraph,
  useUpcomingBirthdays,
  useDashboardTasks,
  useDepartmentBreakdown,
  usePendingRequests,
  useRecentNotifications,
} from '../hooks/useDashboard'
import { useEmployees } from '../hooks/useEmployees'
import { useOfferLetters } from '../hooks/useOfferLetters'
import { useCalendars } from '../hooks/useOfficeCalendar'
import { useLeaveBalance } from '../hooks/useLeaveRequests'
import { getTeamMembers } from '../utils/teamFilter'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Avatar, Badge } from '../components/ui'

const safeFormat = (dateVal, formatPattern, fallback = '—') => {
  if (!dateVal) return fallback
  const d = new Date(dateVal)
  if (!isValid(d)) return fallback
  try {
    return format(d, formatPattern)
  } catch {
    return fallback
  }
}

// Leave type code -> display label, mirrors LeaveRequests.jsx's LEAVE_TYPES
const LEAVE_TYPE_LABELS = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  annual: 'Annual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
}
const leaveTypeColors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-600', 'bg-purple-600', 'bg-rose-500', 'bg-teal-500']

// Department colors for the horizontal bar chart
const deptColors = [
  '#2C4E7E', '#D2A94A', '#226845', '#A83128', '#6A478F',
  '#3C4A86', '#2F7F7C', '#9C7325', '#C4711F', '#55396F',
  '#5B564B', '#3E6499',
]

/* ------------------------------------------------------------------ *
 * Mini sub-components for the new widgets
 * ------------------------------------------------------------------ */

// Horizontal bar for department breakdown
const DeptBar = ({ dept, maxCount, index }) => {
  const pct = Math.round((dept.count / maxCount) * 100)
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="flex items-center gap-3 group"
    >
      <span className="text-xs font-semibold text-slate-600 w-24 truncate text-right shrink-0">
        {dept.department}
      </span>
      <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden border border-slate-200/60 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-md transition-all"
          style={{ backgroundColor: dept.color }}
        />
        <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-bold text-slate-600">
          {dept.count}
        </span>
      </div>
    </motion.div>
  )
}

// Task status config
const taskStatusConfig = {
  todo: { label: 'To Do', icon: ListTodo, color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  doing: { label: 'In Progress', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  done: { label: 'Done', icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  blocked: { label: 'Blocked', icon: Slash, color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
}

const taskPriorityConfig = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-green-50 text-green-700 border-green-200',
}

// Static class strings per tone so Tailwind's scanner picks them up.
const KPI_TONES = {
  blue:    { icon: 'bg-blue-50 text-blue-600 border-blue-100',       badge: 'bg-blue-50 text-blue-600 border-blue-100',       link: 'text-blue-600' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', link: 'text-emerald-600' },
  red:     { icon: 'bg-red-50 text-red-600 border-red-100',          badge: 'bg-red-50 text-red-600 border-red-100',          link: 'text-red-600' },
  amber:   { icon: 'bg-amber-50 text-amber-600 border-amber-100',    badge: 'bg-amber-50 text-amber-600 border-amber-100',    link: 'text-amber-600' },
  cyan:    { icon: 'bg-cyan-50 text-cyan-600 border-cyan-100',       badge: 'bg-cyan-50 text-cyan-600 border-cyan-100',       link: 'text-cyan-600' },
  purple:  { icon: 'bg-purple-50 text-purple-600 border-purple-100', badge: 'bg-purple-50 text-purple-600 border-purple-100', link: 'text-purple-600' },
  orange:  { icon: 'bg-orange-50 text-orange-600 border-orange-100', badge: 'bg-orange-50 text-orange-600 border-orange-100', link: 'text-orange-600' },
  teal:    { icon: 'bg-teal-50 text-teal-600 border-teal-100',       badge: 'bg-teal-50 text-teal-600 border-teal-100',       link: 'text-teal-600' },
  indigo:  { icon: 'bg-indigo-50 text-indigo-600 border-indigo-100', badge: 'bg-indigo-50 text-indigo-600 border-indigo-100', link: 'text-indigo-600' },
}

// Stacked layout (icon+badge / label / value / footnote) so nothing has to share a row with
// the label — the old side-by-side layout overflowed once 9 cards squeezed into narrow columns.
const KpiCard = ({ icon: Icon, iconClassName = '', tone, label, badge, value, footnote, onClick }) => {
  const t = KPI_TONES[tone]
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-2xs transition-all hover:border-slate-300 sm:p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.icon}`}>
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
        {badge && (
          <span className={`min-w-0 truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold ${t.badge}`}>
            {badge}
          </span>
        )}
      </div>
      <span className="mt-3 text-xs font-semibold leading-snug tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
      <span
        className={`mt-auto flex min-w-0 items-center gap-0.5 pt-2 text-xs ${
          onClick ? `font-semibold ${t.link}` : 'font-medium text-slate-500'
        }`}
      >
        <span className="min-w-0 truncate" title={typeof footnote === 'string' ? footnote : undefined}>{footnote}</span>
        {onClick && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />}
      </span>
    </Wrapper>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [birthdayDays] = useState(30)
  const [peopleTab, setPeopleTab] = useState('birthdays') // 'birthdays' | 'joiners'
  const [taskFilterTab, setTaskFilterTab] = useState('all') // 'all' | 'todo' | 'doing' | 'done' | 'blocked'
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const isViewingToday = selectedDate === todayStr

  const isCTOOrHead =
    (user?.department === 'IT' && user?.designation === 'CTO') ||
    (user?.department === 'Telecalling' && user?.designation === 'Head - Telecalling')
  const isReportingManager = user?.is_reporting_manager === 1

  let filterParams = {}
  if (!['super_admin', 'hr', 'manager'].includes(user?.role)) {
    if (isReportingManager) {
      filterParams = { reporting_manager_id: user.emp_id }
    } else if (isCTOOrHead) {
      filterParams = { department: user.department }
    }
  }
  const statsParams = { ...filterParams, date: selectedDate }

  const selectedMonthStr = format(new Date(), 'yyyy-MM')

  // Hook calls
  const { data: stats } = useDashboardStats(statsParams)
  const { data: rawGraphData } = useAttendanceGraph(selectedMonthStr, filterParams)
  const { data: birthdaysData } = useUpcomingBirthdays(birthdayDays, 10)
  const { data: calendarsData } = useCalendars()
  const { data: rawTasksData } = useDashboardTasks()
  const { data: rawDeptBreakdown, isLoading: deptLoading } = useDepartmentBreakdown()
  const { data: pendingRequestsData } = usePendingRequests(5, filterParams)
  const { data: recentNotifications } = useRecentNotifications(10)
  const { data: rawOfferLetters } = useOfferLetters()

  const graphMeta = rawGraphData?.meta || rawGraphData?.data?.meta || null
  const graphData = Array.isArray(rawGraphData)
    ? rawGraphData
    : Array.isArray(rawGraphData?.data)
    ? rawGraphData.data
    : Array.isArray(rawGraphData?.graph)
    ? rawGraphData.graph
    : Array.isArray(rawGraphData?.days)
    ? rawGraphData.days
    : []

  const { data: employeesData } = useEmployees()
  const allEmployees = Array.isArray(employeesData)
    ? employeesData
    : Array.isArray(employeesData?.data)
    ? employeesData.data
    : Array.isArray(employeesData?.employees)
    ? employeesData.employees
    : []

  const teamMembers = getTeamMembers(allEmployees, user)

  const totalEmployeesCount =
    stats?.total_employees ?? (!['super_admin', 'hr', 'manager'].includes(user?.role) ? teamMembers.length : 0)

  const formattedTodayDate = safeFormat(new Date(), 'EEEE, dd MMMM yyyy')

  const isHistorical = Boolean(stats?.is_historical)
  const effectiveDateLabel = stats?.effective_date ? safeFormat(new Date(stats.effective_date), 'dd MMM yyyy') : null

  const presentCount = stats?.present_today ?? 0
  const absentCount = stats?.absent_today ?? 0
  const lateCount = stats?.late_today ?? 0
  const onTimeCount = stats?.on_time_today ?? Math.max(0, presentCount - lateCount)
  const wfhCount = stats?.wfh_today ?? 0
  const onLeaveCount = stats?.on_leave_today ?? 0
  const shortLeaveCount = stats?.short_leave_today ?? 0
  const onLeaveOrWfhCount = onLeaveCount + wfhCount
  const newJoinersThisMonth = stats?.new_joiners_this_month ?? 0
  const openTicketsCount = stats?.open_helpdesk_tickets ?? 0

  const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)
  const presentPercentage = stats?.attendance_rate != null ? Math.round(stats.attendance_rate) : pct(presentCount, totalEmployeesCount)
  const absentPercentage = pct(absentCount, totalEmployeesCount)
  const latePercentage = pct(lateCount, totalEmployeesCount)
  const onLeavePercentage = pct(onLeaveOrWfhCount, totalEmployeesCount)
  const shortLeavePercentage = pct(shortLeaveCount, totalEmployeesCount)

  const donutData = [
    { name: 'On Time', value: onTimeCount, color: '#22c55e' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
  ]

  // Monthly Overview Chart Data - real day-by-day attendance, no synthetic fill-in
  const monthlyChartData = graphData.map(item => ({
    month: item.day ? `Day ${item.day}` : safeFormat(item.date, 'MMM d'),
    Present: item.on_time_count ?? item.present_count ?? 0,
    Late: item.late_count ?? 0,
    Absent: item.absent_count || 0,
  }))
  const graphMonthLabel = graphMeta?.month ? safeFormat(`${graphMeta.month}-01`, 'MMMM yyyy') : null

  // Real, merged pending-approval queue (leave + WFH + short leave)
  const pendingRequestsTotal = stats?.pending_requests_total ?? pendingRequestsData?.total_pending ?? 0
  // Hiring requirements managers have submitted, awaiting HR review
  const pendingHiringRequirements = stats?.pending_hiring_requirements ?? 0
  // Active employees with an incomplete KYC verification dossier (Aadhaar/PAN/face match/court/address)
  const pendingVerifications = stats?.pending_verifications ?? 0
  // Offer letters somewhere in the HR -> Manager -> CEO -> HR -> Employee pipeline (not yet sent),
  // and, separately, ones the Director has signed and returned for HR's own countersignature.
  const offerLettersList = Array.isArray(rawOfferLetters) ? rawOfferLetters : []
  const pendingOfferLetters = offerLettersList.filter((l) => ['draft', 'pending_manager', 'pending_ceo', 'management_approved'].includes(l.status)).length
  const awaitingHrSignature = offerLettersList.filter((l) => l.des_status === 'pending_hr_signature').length
  const displayPendingRequests = (pendingRequestsData?.items || []).map(r => ({
    id: r.id,
    type: r.type,
    name: r.employee_name || 'Team Member',
    details: `${r.leave_type ? LEAVE_TYPE_LABELS[r.leave_type] || r.leave_type : r.type} • ${safeFormat(r.start_date, 'dd MMM')} - ${safeFormat(r.end_date, 'dd MMM')}`,
    status: r.status || 'pending',
  }))

  // Recent joiners - real, sorted by actual date of joining (most recent first)
  const activeVerifiedEmployees = allEmployees.filter(
    emp => (emp.status === 'Verified' || !emp.status) && (emp.is_active === true || emp.is_active === 1)
  )
  const displayRecentEmployees = [...activeVerifiedEmployees]
    .filter(emp => emp.doj)
    .sort((a, b) => new Date(b.doj) - new Date(a.doj))
    .slice(0, 4)
    .map(emp => ({
      id: emp.id || emp.emp_id,
      name: emp.full_name || emp.name || 'Team Member',
      role: emp.designation || '—',
      joinedDate: safeFormat(emp.doj, 'dd MMM yyyy'),
      photo: emp.photo_path,
    }))

  // Birthdays list - real data from /dashboard/upcoming-birthdays
  const birthdaysList = (birthdaysData?.birthdays || []).slice(0, 4).map(b => ({
    id: b.emp_id,
    name: b.full_name,
    date: safeFormat(b.birthday_date, 'dd MMM'),
    daysLeft: b.days_until_birthday === 0 ? 'Today' : `in ${b.days_until_birthday} days`,
    photo: b.photo_path,
  }))

  // Holidays - flatten the real holidays[] nested under each active calendar
  // (calendars themselves are NOT holidays - each one just groups a year's holidays)
  const upcomingHolidays = (Array.isArray(calendarsData) ? calendarsData : [])
    .filter(c => c.is_active)
    .flatMap(c => c.holidays || [])
    .filter(h => h.holiday_date && new Date(h.holiday_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
    .slice(0, 3)
    .map(h => ({
      id: h.id,
      name: h.holiday_name,
      date: safeFormat(h.holiday_date, 'dd MMM yyyy'),
      type: h.holiday_type || 'Holiday',
      day: safeFormat(h.holiday_date, 'EEEE'),
    }))

  // Recent notifications - real per-user activity, replaces the static notice board
  const recentNotificationsList = (recentNotifications || []).map(n => ({
    id: n.id,
    title: n.data?.title || 'Notification',
    description: n.data?.message || '',
    timeAgo: safeFormat(n.created_at, 'dd MMM, HH:mm'),
  }))

  // Leave balance for the signed-in employee - real hrms_leave_balances rows
  const currentYear = new Date().getFullYear()
  const { data: leaveBalanceResponse } = useLeaveBalance(user?.emp_id, currentYear)
  const leaveBalances = (leaveBalanceResponse?.data || []).map((b, i) => ({
    type: LEAVE_TYPE_LABELS[b.leave_type] || b.leave_type,
    used: Number(b.used) || 0,
    total: Number(b.total_allocated) || 0,
    color: leaveTypeColors[i % leaveTypeColors.length],
  }))

  /* ------------------------------------------------------------------ *
   * Department Breakdown Data
   * ------------------------------------------------------------------ */
  const departmentData = useMemo(() => {
    if (!Array.isArray(rawDeptBreakdown)) return []
    return rawDeptBreakdown
      .map((d, i) => ({
        department: d.department || 'Unassigned',
        count: d.count || 0,
        color: deptColors[i % deptColors.length],
      }))
      .sort((a, b) => b.count - a.count)
  }, [rawDeptBreakdown])

  const maxDeptCount = Math.max(...departmentData.map(d => d.count), 1)
  const totalDeptEmployees = departmentData.reduce((sum, d) => sum + d.count, 0)

  /* ------------------------------------------------------------------ *
   * Task Tracker Data
   * ------------------------------------------------------------------ */
  const allTasks = useMemo(() => (Array.isArray(rawTasksData) ? rawTasksData : []), [rawTasksData])

  const taskCounts = useMemo(() => {
    const counts = { todo: 0, doing: 0, done: 0, blocked: 0, total: 0 }
    allTasks.forEach(t => {
      const status = t.status?.toLowerCase()
      if (counts[status] !== undefined) counts[status]++
      counts.total++
    })
    return counts
  }, [allTasks])

  const filteredTasks = useMemo(() => {
    const tasks = taskFilterTab === 'all'
      ? allTasks
      : allTasks.filter(t => t.status?.toLowerCase() === taskFilterTab)
    return tasks.slice(0, 5)
  }, [allTasks, taskFilterTab])

  const taskCompletionRate = taskCounts.total > 0
    ? Math.round((taskCounts.done / taskCounts.total) * 100)
    : 0

  const displayName = (user?.full_name || user?.name || 'Aditya').split(' ')[0]

  return (
    <div className="space-y-6 bg-slate-50/60 p-3 sm:p-5 md:p-6 rounded-3xl min-h-screen">
      {/* ------------------------------------------------------------------ *
       * Header / Welcome Banner
       * ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span>{formattedTodayDate}</span>
            {!['hr', 'manager'].includes(user?.role) && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Shift: 09:30 AM - 06:30 PM
                </span>
              </>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2 font-display">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Here is your daily HR operations & workforce summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={(e) => setSelectedDate(e.target.value || todayStr)}
              className="text-xs sm:text-sm font-semibold text-slate-700 bg-transparent focus:outline-hidden"
            />
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 border-l border-slate-200 pl-2"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/my-attendance')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
          >
            <Clock3 className="h-4 w-4 text-emerald-600" />
            Attendance / Punch
          </button>

          {!['hr', 'manager'].includes(user?.role) && (
            <button
              onClick={() => navigate('/leave-management')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Palmtree className="h-4 w-4 text-amber-500" />
              Apply Leave
            </button>
          )}

          {['hr', 'super_admin', 'admin', 'manager'].includes(user?.role) && (
            <button
              onClick={() => navigate('/employees', { state: { openAdd: true } })}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 shadow-xs"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * Quick Action Toolbar
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 sm:gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => navigate('/my-attendance')}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 group-hover:scale-105 transition-transform">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Punch Log</div>
            <div className="text-[10px] text-slate-400 font-medium">Clock In/Out</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/leave-management')}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:scale-105 transition-transform">
            <Palmtree className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Leaves</div>
            <div className="text-[10px] text-slate-400 font-medium">Apply & View</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/office-calendar')}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200/80 group-hover:scale-105 transition-transform">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Calendar</div>
            <div className="text-[10px] text-slate-400 font-medium">Holidays & Events</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/helpdesk')}
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 group-hover:scale-105 transition-transform">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Helpdesk</div>
            <div className="text-[10px] text-slate-400 font-medium">Support Tickets</div>
          </div>
        </button>

        {!['hr', 'admin', 'super_admin', 'manager'].includes(user?.role) && (
          <button
            onClick={() => navigate('/my-salary-advance')}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200/80 group-hover:scale-105 transition-transform">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Salary Advance</div>
              <div className="text-[10px] text-slate-400 font-medium">Apply & Track</div>
            </div>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ *
       * KPI cards — attendance snapshot (5) + items awaiting action (4).
       * Two grids so each tiles evenly at every breakpoint instead of 9 cards
       * leaving ragged rows in a 6-column grid.
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 sm:gap-4">
        <KpiCard
          icon={Users}
          tone="blue"
          label="Total Employees"
          badge={newJoinersThisMonth > 0 ? `+${newJoinersThisMonth}` : null}
          value={totalEmployeesCount}
          footnote={newJoinersThisMonth > 0 ? `+${newJoinersThisMonth} joined this month` : 'No new joiners this month'}
        />
        <KpiCard
          icon={UserCheck}
          tone="emerald"
          label={isHistorical ? 'Present' : 'Present Today'}
          badge={`${presentPercentage}%`}
          value={presentCount}
          footnote={isHistorical ? effectiveDateLabel : `${presentPercentage}% of total`}
        />
        <KpiCard
          icon={UserPlus}
          iconClassName="rotate-45"
          tone="red"
          label={isHistorical ? 'Absent' : 'Absent Today'}
          badge={`${absentPercentage}%`}
          value={absentCount}
          footnote={isHistorical ? effectiveDateLabel : (presentCount === 0 ? "Haven't marked attendance" : `${absentPercentage}% of total`)}
        />
        <KpiCard
          icon={Palmtree}
          tone="amber"
          label="On Leave / WFH"
          badge={`${onLeavePercentage}%`}
          value={onLeaveOrWfhCount}
          footnote={isHistorical ? effectiveDateLabel : `${onLeavePercentage}% of workforce`}
        />
        <KpiCard
          icon={Clock3}
          tone="cyan"
          label={isHistorical ? 'Short Leave' : 'Short Leave Today'}
          badge={`${shortLeavePercentage}%`}
          value={shortLeaveCount}
          footnote={isHistorical ? effectiveDateLabel : `${shortLeavePercentage}% of workforce`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <KpiCard
          icon={AlertCircle}
          tone="purple"
          label="Pending Requests"
          badge="Review"
          value={pendingRequestsTotal}
          footnote="Review now"
          onClick={() => navigate('/leave-management')}
        />
        <KpiCard
          icon={Briefcase}
          tone="orange"
          label="Hiring Requirements"
          badge="Review"
          value={pendingHiringRequirements}
          footnote="From managers"
          onClick={() => navigate('/recruitment')}
        />
        <KpiCard
          icon={ShieldCheck}
          tone="teal"
          label="Verification Pending"
          badge="Review"
          value={pendingVerifications}
          footnote="Employees"
          onClick={() => navigate('/employee-verification')}
        />
        {/* Highlights when the Director has sent a letter back for HR's own signature */}
        <KpiCard
          icon={FileBadge}
          tone="indigo"
          label="Offer Letters"
          badge={awaitingHrSignature > 0 ? 'Needs Signature' : 'In Progress'}
          value={pendingOfferLetters}
          footnote={awaitingHrSignature > 0 ? `${awaitingHrSignature} awaiting your signature` : 'View history'}
          onClick={() => navigate('/offer-letter')}
        />
      </div>

      {/* ------------------------------------------------------------------ *
       * Middle Grid (3 Columns)
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Attendance (Doughnut Chart) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-display">{isHistorical ? 'Attendance' : "Today's Attendance"}</h3>
                {isHistorical && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{effectiveDateLabel}</p>}
              </div>
              <button
                onClick={() => navigate('/today-attendance')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
              >
                View Details
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            <div className="my-5 flex items-center justify-between gap-4">
              <div className="relative h-44 w-44 shrink-0 mx-auto sm:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">{totalEmployeesCount}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-3.5 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                    <span className="text-xs font-semibold text-slate-600">Present</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-display">{presentCount} ({presentPercentage}%)</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                    <span className="text-xs font-semibold text-slate-600">Late</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-display">{lateCount} ({latePercentage}%)</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-red-100" />
                    <span className="text-xs font-semibold text-slate-600">Absent</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-display">{absentCount} ({absentPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-blue-50/70 border border-blue-200 px-3.5 py-2.5 text-xs font-medium text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600" />
            <span>
              {totalEmployeesCount === 0
                ? 'No attendance has been recorded yet.'
                : isHistorical
                ? `Showing attendance for ${effectiveDateLabel} — ${presentCount} present, ${absentCount} absent (${presentPercentage}%).`
                : presentCount === 0
                ? `No one has marked attendance yet today — ${absentCount} employee(s) are marked absent until they check in.`
                : presentPercentage >= 90
                ? `Attendance health is good at ${presentPercentage}% today.`
                : presentPercentage >= 70
                ? `Attendance is at ${presentPercentage}% today.`
                : `Attendance is low at ${presentPercentage}% today.`}
            </span>
          </div>
        </div>

        {/* Pending Requests & Approvals */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 font-display">Pending Requests</h3>
                <span className="rounded-full bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5">
                  {pendingRequestsTotal}
                </span>
              </div>
              <button
                onClick={() => navigate('/leave-management')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
              >
                View All
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {displayPendingRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No pending requests</p>
                  <p className="text-xs text-slate-400 mt-0.5">All caught up.</p>
                </div>
              )}
              {displayPendingRequests.map(req => {
                const isPending = req.status?.toLowerCase() === 'pending'
                return (
                  <div key={req.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${req.type === 'Leave' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {req.type}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{req.name}</h4>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 truncate">{req.details}</p>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isPending ? (
                        <button
                          onClick={() => navigate(req.type === 'Leave' ? '/leave-management' : '/wfh-requests')}
                          className="text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Approved
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 font-display">My Leave Balance</h3>
              <button
                onClick={() => navigate('/leave-management')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
              >
                Apply Leave
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {leaveBalances.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Palmtree className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No leave balance on file</p>
                  <p className="text-xs text-slate-400 mt-0.5">HR hasn't set up your {currentYear} allocation yet.</p>
                </div>
              )}
              {leaveBalances.map(leave => (
                <div key={leave.type} className="flex items-center gap-3 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
                    <Palmtree className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">{leave.type}</span>
                      <span className="font-bold text-slate-900 font-display">
                        {leave.used} / {leave.total} days
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full ${leave.color} transition-all duration-500`}
                        style={{ width: `${leave.total > 0 ? Math.min(100, (leave.used / leave.total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * NEW: Department Breakdown & Team Performance Metrics
       * ------------------------------------------------------------------ */}
      {/* ------------------------------------------------------------------ *
       * NEW: Department Breakdown & Team Performance Metrics
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department-wise Headcount Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-display">Department Breakdown</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Headcount distribution across {departmentData.length} departments • {totalDeptEmployees} total
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="space-y-2">
            {departmentData.length === 0 && (
              <p className="text-xs text-slate-400 font-medium text-center py-4">
                {deptLoading ? 'Loading department data…' : 'No department data available.'}
              </p>
            )}
            {departmentData.slice(0, 7).map((dept, index) => (
              <DeptBar key={dept.department} dept={dept} maxCount={maxDeptCount} index={index} />
            ))}
          </div>

          {departmentData.length > 7 && (
            <p className="mt-2 text-[11px] text-slate-400 font-medium text-center">
              + {departmentData.length - 7} more departments
            </p>
          )}
        </div>

        {/* Team Performance Metrics (Compact 2x2 Grid matching height) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">Team Performance</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Key metrics this month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Attendance Rate */}
            <div className="rounded-xl border border-slate-200/80 p-3 hover:border-slate-300 transition-colors bg-slate-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                  <UserCheck className="h-3 w-3" />
                </div>
                <span className="text-xs font-extrabold text-emerald-700 font-display">{presentPercentage}%</span>
              </div>
              <div className="text-[11px] font-bold text-slate-700">Attendance</div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden mt-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${presentPercentage}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>

            {/* Task Completion Rate */}
            <div className="rounded-xl border border-slate-200/80 p-3 hover:border-slate-300 transition-colors bg-slate-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-200/80">
                  <Target className="h-3 w-3" />
                </div>
                <span className="text-xs font-extrabold text-blue-700 font-display">{taskCompletionRate}%</span>
              </div>
              <div className="text-[11px] font-bold text-slate-700">Tasks Done</div>
              <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden mt-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${taskCompletionRate}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
            </div>

            {/* Open Tickets */}
            <div className="rounded-xl border border-slate-200/80 p-3 hover:border-slate-300 transition-colors bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-200/80">
                  <Ticket className="h-3 w-3" />
                </div>
                <span className="text-xs font-extrabold text-amber-700 font-display">{openTicketsCount}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-700">Open Tickets</div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Helpdesk queue</p>
            </div>

            {/* Largest Department */}
            <div className="rounded-xl border border-slate-200/80 p-3 hover:border-slate-300 transition-colors bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-200/80">
                  <Building2 className="h-3 w-3" />
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-200/80">
                  {departmentData[0]?.department || 'N/A'}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-700">Top Dept</div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{departmentData[0]?.count || 0} employees</p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * NEW: Mini Task Tracker Widget
       * ------------------------------------------------------------------ */}
      {!['hr', 'manager'].includes(user?.role) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <ListTodo className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-display">My Tasks</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Quick overview of your task assignments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: 'all', label: 'All', count: taskCounts.total },
                  { key: 'todo', label: 'To Do', count: taskCounts.todo },
                  { key: 'doing', label: 'Active', count: taskCounts.doing },
                  { key: 'done', label: 'Done', count: taskCounts.done },
                  { key: 'blocked', label: 'Blocked', count: taskCounts.blocked },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTaskFilterTab(tab.key)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      taskFilterTab === tab.key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      taskFilterTab === tab.key
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group ml-2"
              >
                View All
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Task status summary strip */}
          <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
            {Object.entries(taskStatusConfig).map(([statusKey, config]) => {
              const StatusIcon = config.icon
              const count = taskCounts[statusKey] || 0
              return (
                <motion.div
                  key={statusKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Object.keys(taskStatusConfig).indexOf(statusKey) * 0.05 }}
                  onClick={() => setTaskFilterTab(statusKey)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-xs ${
                    taskFilterTab === statusKey
                      ? `${config.color} ring-2 ring-offset-1 ring-slate-300`
                      : 'border-slate-200/80 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-lg font-extrabold text-slate-900 font-display">{count}</span>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{config.label}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Task list */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const statusCfg = taskStatusConfig[task.status?.toLowerCase()] || taskStatusConfig.todo
                const StatusIcon = statusCfg.icon
                const priorityClass = taskPriorityConfig[task.priority?.toLowerCase()] || taskPriorityConfig.medium
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 rounded-xl px-3 -mx-3 transition-colors group cursor-pointer"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Status indicator */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusCfg.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{task.title}</h4>
                          {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm border border-red-200 shrink-0">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${priorityClass}`}>
                            {task.priority || 'Medium'}
                          </span>
                          {task.due_date && (
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {safeFormat(task.due_date, 'dd MMM')}
                            </span>
                          )}
                          {task.assigned_user?.name && (
                            <span className="text-[11px] text-slate-400 font-medium truncate">
                              → {task.assigned_user.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-600">No tasks found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {taskFilterTab === 'all' ? 'You have no assigned tasks.' : `No ${taskStatusConfig[taskFilterTab]?.label?.toLowerCase() || ''} tasks.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ *
       * Bottom Grid (3 Columns)
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Attendance Overview (Bar Chart) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900 font-display">Monthly Attendance Overview</h3>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
            >
              View Report
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
          {graphMonthLabel && (
            <p className="text-[11px] text-slate-400 font-medium mb-3">
              {graphMeta?.used_fallback_month ? `Most recent recorded month: ${graphMonthLabel}` : graphMonthLabel}
            </p>
          )}

          <div className="h-64 w-full">
            {monthlyChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-slate-400 font-medium">
                No attendance records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 600 }} />
                  <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming Holidays & Announcements */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 font-display">Upcoming Holidays</h3>
              <button
                onClick={() => navigate('/office-calendar')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group"
              >
                Calendar
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            <div className="space-y-2.5 mb-5">
              {upcomingHolidays.length === 0 && (
                <p className="text-xs text-slate-400 font-medium text-center py-3">No upcoming holidays scheduled.</p>
              )}
              {upcomingHolidays.map(holiday => (
                <div key={holiday.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{holiday.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{holiday.day}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/80 font-display">
                    {holiday.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Notifications - real per-user activity feed */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">Recent Activity</h4>
                {recentNotificationsList.length > 0 && (
                  <button
                    onClick={() => document.getElementById('header-notification-bell')?.click()}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {recentNotificationsList.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium">No recent activity.</p>
                ) : (
                  recentNotificationsList.slice(0, 10).map(item => (
                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800">{item.title}: </span>
                        <span className="text-slate-500">{item.description}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{item.timeAgo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* People Spotlight (Birthdays / Recent Joiners Tab) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPeopleTab('birthdays')}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${peopleTab === 'birthdays' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Birthdays 🎉
              </button>
              <button
                onClick={() => setPeopleTab('joiners')}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${peopleTab === 'joiners' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                New Joiners 👋
              </button>
            </div>
          </div>

          {peopleTab === 'birthdays' ? (
            <div className="divide-y divide-slate-100">
              {birthdaysList.length === 0 && (
                <p className="text-xs text-slate-400 font-medium text-center py-6">No birthdays in the next {birthdayDays} days.</p>
              )}
              {birthdaysList.map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.name} src={b.photo} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-400">{b.date}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                    {b.daysLeft}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayRecentEmployees.length === 0 && (
                <p className="text-xs text-slate-400 font-medium text-center py-6">No recent joiners found.</p>
              )}
              {displayRecentEmployees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} src={emp.photo} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{emp.role}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Joined {emp.joinedDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
