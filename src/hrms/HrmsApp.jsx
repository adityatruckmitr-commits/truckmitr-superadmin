// TM-Manavsetu HRMS (replica of hrms_react) mounted at /hrms/* inside the combined console.
// The console sidebar replaces the HRMS sidebar and the HRMS header widgets (screen search,
// notifications, HRMS account) sit in the console header; the pages, hooks and API calls are
// the original HRMS app, served by the main backend under /api/hrms.
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from '@hrms/router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { queryClient } from './lib/queryClient'
import ProtectedRoute from './components/ProtectedRoute'
import HeaderWidgets from './components/HeaderWidgets'
import CommandPalette from './components/CommandPalette'
import DeepLinkHighlighter from './components/DeepLinkHighlighter'
import './hrms.css'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'))
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'))
const CEODashboard = lazy(() => import('./pages/CEODashboard'))
const EmployeeRequests = lazy(() => import('./pages/EmployeeRequests'))
const MyDocuments = lazy(() => import('./pages/MyDocuments'))
const Employees = lazy(() => import('./pages/Employees'))
const EmployeeVerification = lazy(() => import('./pages/EmployeeVerification'))
const Attendance = lazy(() => import('./pages/Attendance'))
const TodayAttendance = lazy(() => import('./pages/TodayAttendance'))
const AllAttendance = lazy(() => import('./pages/AllAttendance'))
const EmployeeMonthlyAttendance = lazy(() => import('./pages/EmployeeMonthlyAttendance'))
const MyAttendance = lazy(() => import('./pages/MyAttendance'))
const Tasks = lazy(() => import('./pages/Tasks'))
const WfhRequests = lazy(() => import('./pages/WfhRequests'))
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'))
const Helpdesk = lazy(() => import('./pages/Helpdesk'))
const Payroll = lazy(() => import('./pages/Payroll'))
const SalaryAdvance = lazy(() => import('./pages/SalaryAdvance'))
const EmployeeSalaryAdvance = lazy(() => import('./pages/EmployeeSalaryAdvance'))
const Reports = lazy(() => import('./pages/Reports'))
const OfficeCalendar = lazy(() => import('./pages/OfficeCalendar'))
const ShortLeave = lazy(() => import('./pages/ShortLeave'))
const AssetsManagement = lazy(() => import('./pages/AssetsManagement'))
const EmployeeAssets = lazy(() => import('./pages/EmployeeAssets'))
const AssetsCategory = lazy(() => import('./pages/AssetsCategory'))
const AssetsSubCategory = lazy(() => import('./pages/AssetsSubCategory'))
const HRRewards = lazy(() => import('./pages/HRRewards'))
const EmployeeRewards = lazy(() => import('./pages/EmployeeRewards'))
const HRPolicies = lazy(() => import('./pages/HRPolicies'))
const EmployeePolicies = lazy(() => import('./pages/EmployeePolicies'))
const Profile = lazy(() => import('./pages/Profile'))
const OfferLetterGenerator = lazy(() => import('./pages/OfferLetterGenerator'))
const IdCards = lazy(() => import('./pages/IdCards'))
const AssetScan = lazy(() => import('./pages/AssetScan'))
const Recruitment = lazy(() => import('./pages/Recruitment'))
const Performance = lazy(() => import('./pages/Performance'))
const TrainingManagement = lazy(() => import('./pages/TrainingManagement'))
const Settings = lazy(() => import('./pages/Settings'))
const Resignation = lazy(() => import('./pages/Resignation'))

// Old combined-console HRMS URLs -> their HRMS equivalents
const LEGACY_REDIRECTS = {
  // the console login is the HRMS login
  login: '/dashboard',
  'forgot-password': '/dashboard',
  leaves: '/leave-management',
  workplace: '/assets-management',
}

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
  </div>
)

// Component to handle role-based redirect
const RoleBasedRedirect = () => {
  const { user } = useAuth()
  const hasDashboard = ['hr', 'admin', 'employee', 'manager', 'ceo', 'super_admin'].includes(user?.role)
  return <Navigate to={hasDashboard ? '/dashboard' : '/my-attendance'} replace />
}

// Manager has full HR-level power, so gets the same company dashboard HR does (not the scoped-down
// team view) - CEO/Management still gets its own (company-wide + final-approval-stage) home.
const DashboardRouter = () => {
  const { user } = useAuth()
  if (user?.role === 'employee') return <EmployeeDashboard />
  if (user?.role === 'ceo') return <CEODashboard />
  return <Dashboard />
}

// Replaces the HRMS Layout: no own sidebar/header inside the console
const HrmsFrame = () => {
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Global shortcut: Cmd/Ctrl+K opens the jump bar from anywhere in the HRMS.
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openSearch = useCallback(() => setPaletteOpen(true), [])

  return (
    <NotificationsProvider>
      <HeaderWidgets onOpenSearch={openSearch} />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8"
      >
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        <DeepLinkHighlighter />
      </motion.main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </NotificationsProvider>
  )
}

export default function HrmsApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="hrms-scope hrms-canvas flex-1 flex flex-col min-w-0">
          <Routes>
            {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            <Route element={<ProtectedRoute><HrmsFrame /></ProtectedRoute>}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="my-team" element={<ManagerDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="employee-verification" element={<EmployeeVerification />} />
              <Route path="employee-requests" element={<EmployeeRequests />} />
              <Route path="my-documents" element={<MyDocuments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="today-attendance" element={<TodayAttendance />} />
              <Route path="all-attendance" element={<AllAttendance />} />
              <Route path="employee-monthly-attendance/:employeeId/:month" element={<EmployeeMonthlyAttendance />} />
              <Route path="my-attendance" element={<MyAttendance />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="leave-management" element={<LeaveRequests />} />
              <Route path="wfh-requests" element={<WfhRequests />} />
              <Route path="short-leave" element={<ShortLeave />} />
              <Route path="helpdesk" element={<Helpdesk />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="salary-advance" element={<SalaryAdvance />} />
              <Route path="my-salary-advance" element={<EmployeeSalaryAdvance />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="offer-letter" element={<OfferLetterGenerator />} />
              <Route path="id-cards" element={<IdCards />} />
              <Route path="asset/:tag" element={<AssetScan />} />
              <Route path="performance" element={<Performance />} />
              <Route path="training" element={<TrainingManagement />} />
              <Route path="rewards-recognition" element={<HRRewards />} />
              <Route path="my-rewards" element={<EmployeeRewards />} />
              <Route path="policies" element={<HRPolicies />} />
              <Route path="my-policies" element={<EmployeePolicies />} />
              <Route path="reports" element={<Reports />} />
              <Route path="office-calendar" element={<OfficeCalendar />} />
              <Route path="assets-management" element={<AssetsManagement />} />
              <Route path="my-assets" element={<EmployeeAssets />} />
              <Route path="assets-category" element={<AssetsCategory />} />
              <Route path="assets-sub-category" element={<AssetsSubCategory />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="my-profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="resignation" element={<Resignation />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#2D2A24',
              border: '1px solid #E6E3DB',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '14px',
              boxShadow: '0 12px 24px -6px rgba(27, 25, 21, 0.10), 0 4px 8px -2px rgba(27, 25, 21, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#226845',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#A83128',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
