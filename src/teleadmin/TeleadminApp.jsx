// Teleadmin console (replica of teleadmin_aditya) mounted at /teleadmin/* inside the combined console.
// The combined sidebar replaces the original teleadmin sidebar; everything else (header, pages,
// auth against /telehead/*) is the original teleadmin app.
import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from '@teleadmin/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExportProvider } from './context/ExportContext';
import { endConsoleSession } from './services/api/axiosInstance';
import NetworkStatus from './components/NetworkStatus';
import './teleadmin.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const TodayLeads = lazy(() => import('./pages/TodayLeads/index'));
const TelecallerEmployees = lazy(() => import('./pages/TelecallerEmployees/index'));
const PerformanceReport = lazy(() => import('./pages/PerformanceReport/index'));
const MoveLeads = lazy(() => import('./pages/MoveLeads/index'));
const AddTelecaller = lazy(() => import('./pages/AddTelecaller/index'));
const LeadsManagementNew = lazy(() => import('./pages/LeadsManagementNew'));
const LeadsAssignment = lazy(() => import('./pages/LeadsAssignment'));
const MatchMakingNew = lazy(() => import('./pages/MatchMakingNew'));
const JobMatching = lazy(() => import('./pages/JobMatching'));
const JobWiseCalls = lazy(() => import('./pages/JobWiseCalls'));
const EditFullJob = lazy(() => import('./pages/EditFullJob'));
const DriverKiAwazPosts = lazy(() => import('./pages/DriverKiAwazPosts'));
const RegisteredUsersDetail = lazy(() => import('./pages/RegisteredUsersDetail'));
const UserDetail = lazy(() => import('./pages/UserDetail'));
const TransporterJobDetail = lazy(() => import('./pages/TransporterJobDetail'));
const Revenue = lazy(() => import('./pages/Revenue'));
const DailyAnalytics = lazy(() => import('./pages/DailyAnalytics'));
const SocialMediaLeads = lazy(() => import('./pages/SocialMediaLeads'));
const SocialLeadsCreate = lazy(() => import('./pages/SocialLeadsCreate'));
const DriverBank = lazy(() => import('./pages/DriverBank'));
const PipelineDrivers = lazy(() => import('./pages/PipelineDrivers'));
const DriverHireFormLeads = lazy(() => import('./pages/DriverHireFormLeads'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Old combined-console teleadmin URLs -> their teleadmin equivalents
const LEGACY_REDIRECTS = {
  // the console login replaces the teleadmin login pages
  login: '/dashboard',
  'forgot-password': '/dashboard',
  'reset-password': '/dashboard',
  'registration-leads': '/leads-management-new',
  'assign-leads': '/leads-assignment',
  'add-new-lead': '/social-leads/create',
  'social-leads': '/social-media-leads',
  'outbound-leads': '/social-media-leads',
  'driver-hire-leads': '/driver-hire-form-leads',
  'all-calls': '/matchmaking-new',
  calls: '/matchmaking-new',
  'job-calls': '/job-wise-calls',
  'hiring-pipeline': '/pipeline-drivers',
  pipeline: '/pipeline-drivers',
  'drivers-bank': '/driver-bank',
};

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
  </div>
);

// The console login stores the teleadmin API token; without it, start a fresh console login
function ConsoleSession({ children }) {
  const { user, loading } = useAuth();
  const hasToken = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    if (!loading && (!user || !hasToken)) {
      endConsoleSession();
      window.location.replace('/login');
    }
  }, [loading, user, hasToken]);

  if (loading || !user || !hasToken) return <PageLoader />;
  return children;
}

// Content area for teleadmin pages; header, search and profile come from the combined console layout
function TeleadminFrame() {
  return (
    <div className="flex-1 min-w-0 p-4 sm:p-6">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default function TeleadminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ExportProvider>
          <div className="teleadmin-scope flex-1 flex flex-col min-w-0">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<ConsoleSession><TeleadminFrame /></ConsoleSession>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="telecaller-employees" element={<TelecallerEmployees />} />
                  <Route path="subscription-report" element={<PerformanceReport />} />
                  <Route path="leads" element={<TodayLeads />} />
                  <Route path="leads-management-new" element={<LeadsManagementNew />} />
                  <Route path="leads-assignment" element={<LeadsAssignment />} />
                  <Route path="move-leads" element={<MoveLeads />} />
                  <Route path="add-telecaller" element={<AddTelecaller />} />
                  <Route path="matchmaking-new" element={<MatchMakingNew />} />
                  <Route path="daily-analytics" element={<DailyAnalytics />} />
                  <Route path="job-matching" element={<JobMatching />} />
                  <Route path="job-matching/edit-full/:job_id" element={<EditFullJob />} />
                  <Route path="job-wise-calls" element={<JobWiseCalls />} />
                  <Route path="driver-ki-awaz" element={<DriverKiAwazPosts />} />
                  <Route path="registered-users" element={<RegisteredUsersDetail />} />
                  <Route path="revenue" element={<Revenue />} />
                  <Route path="user-detail/:id" element={<UserDetail />} />
                  <Route path="user-detail/:id/job/:job_id" element={<TransporterJobDetail />} />
                  <Route path="social-media-leads" element={<SocialMediaLeads />} />
                  <Route path="social-leads/create" element={<SocialLeadsCreate />} />
                  <Route path="driver-bank" element={<DriverBank />} />
                  <Route path="pipeline-drivers" element={<PipelineDrivers />} />
                  <Route path="driver-hire-form-leads" element={<DriverHireFormLeads />} />
                  {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
                    <Route key={from} path={from} element={<Navigate to={to} replace />} />
                  ))}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </Suspense>
            <NetworkStatus />
            <Toaster position="top-right" />
          </div>
        </ExportProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
