import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
const TeleadminApp = lazy(() => import('./teleadmin/TeleadminApp'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PerformanceReport = lazy(() => import('./pages/Performance/PerformanceReport'));
const UpdateRevenue = lazy(() => import('./pages/Revenue/UpdateRevenue'));
const DriverFulfillment = lazy(() => import('./pages/DriverFulfillment/DriverFulfillment'));
const TeamMembers = lazy(() => import('./pages/Members/TeamMembers'));
const EditMember = lazy(() => import('./pages/Members/EditMember'));
const DepartmentMaster = lazy(() => import('./pages/Departments/DepartmentMaster'));
const SurveysList = lazy(() => import('./pages/Surveys/SurveysList'));
const CreateSurvey = lazy(() => import('./pages/Surveys/CreateSurvey'));
const ViewSurvey = lazy(() => import('./pages/Surveys/ViewSurvey'));
const Brand = lazy(() => import('./pages/OEM/Brand'));
const BrandList = lazy(() => import('./pages/OEM/BrandList'));
const OEMFilterHub = lazy(() => import('./pages/OEM/OEMFilterHub'));
const VerificationHub = lazy(() => import('./pages/Verifications/VerificationHub'));
const JobsList = lazy(() => import('./pages/Jobs/JobsList'));
const ActiveJobsList = lazy(() => import('./pages/Jobs/ActiveJobsList'));
const ExpiredJobsList = lazy(() => import('./pages/Jobs/ExpiredJobsList'));
const InactiveJobsList = lazy(() => import('./pages/Jobs/InactiveJobsList'));
const PendingApprovalJobsList = lazy(() => import('./pages/Jobs/PendingApprovalJobsList'));
const RevenueReport = lazy(() => import('./pages/Revenue/RevenueReport'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const SocialCommunicationHub = lazy(() => import('./pages/Communications/SocialCommunicationHub'));

// truckmitr.com admin panel screens (served through /api/tm)
import { TM_ROUTES } from './truckmitr/routes';

// Human Resources (TM-Manavsetu HRMS, replica of hrms_react)
const HrmsApp = lazy(() => import('./hrms/HrmsApp'));
const ExpensesControls = lazy(() => import('./pages/Expenses/ExpensesControls'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Operational Core */}
        <Route path="performance" element={<PerformanceReport />} />
        <Route path="performance-report" element={<PerformanceReport />} />
        <Route path="revenue" element={<UpdateRevenue />} />
        <Route path="update-revenue" element={<UpdateRevenue />} />
        <Route path="expenses" element={<ExpensesControls />} />
        <Route path="expense" element={<ExpensesControls />} />
        <Route path="expenses-controls" element={<ExpensesControls />} />
        <Route path="driver-fulfillment" element={<DriverFulfillment />} />

        {/* Engagement & Insights */}
        <Route path="surveys" element={<SurveysList />} />
        <Route path="surveys/view/:id" element={<ViewSurvey />} />
        <Route path="surveys/:id" element={<ViewSurvey />} />
        <Route path="surveys/create" element={<CreateSurvey />} />
        <Route path="surveys/edit/:id" element={<CreateSurvey />} />
        <Route path="poll-survey" element={<SurveysList />} />
        <Route path="poll-survey/view/:id" element={<ViewSurvey />} />
        <Route path="poll-survey/:id" element={<ViewSurvey />} />
        <Route path="poll-survey/create" element={<CreateSurvey />} />
        <Route path="poll-survey/edit/:id" element={<CreateSurvey />} />

        {/* Administration */}
        <Route path="team-members" element={<TeamMembers />} />
        <Route path="team-members/edit/:id" element={<EditMember />} />
        <Route path="members" element={<TeamMembers />} />
        <Route path="members/edit/:id" element={<EditMember />} />
        <Route path="departments" element={<DepartmentMaster />} />
        <Route path="department/add" element={<DepartmentMaster />} />
        <Route path="department/list" element={<DepartmentMaster />} />

        
        {/* Automotive Masters (OEM) */}
        <Route path="oem/brands" element={<BrandList />} />
        <Route path="oem/brand" element={<BrandList />} />
        <Route path="oem/brand-list" element={<BrandList />} />
        <Route path="oem/filters" element={<OEMFilterHub />} />
        <Route path="oem/filter" element={<OEMFilterHub />} />
        <Route path="oem/budget" element={<OEMFilterHub />} />
        <Route path="oem/fuel-type" element={<OEMFilterHub />} />
        <Route path="oem/vehicle-application" element={<OEMFilterHub />} />
        <Route path="oem/gvw" element={<OEMFilterHub />} />
        <Route path="oem/gvm" element={<OEMFilterHub />} />
        <Route path="oem/vehicle-type" element={<OEMFilterHub />} />
        <Route path="oem/vehicletype" element={<OEMFilterHub />} />
        <Route path="oem/tyres-count" element={<OEMFilterHub />} />

        {/* Direct Admin routes matching web routes */}
        <Route path="brand" element={<BrandList />} />
        <Route path="budget" element={<OEMFilterHub />} />
        <Route path="fuel-type" element={<OEMFilterHub />} />
        <Route path="vehicle-application" element={<OEMFilterHub />} />
        <Route path="gvm" element={<OEMFilterHub />} />
        <Route path="gvw" element={<OEMFilterHub />} />
        <Route path="vehicletype" element={<OEMFilterHub />} />
        <Route path="vehicle-type" element={<OEMFilterHub />} />
        <Route path="tyres-count" element={<OEMFilterHub />} />

        {/* Social & Communication Hub */}
        <Route path="whatsapp-groups" element={<SocialCommunicationHub />} />
        <Route path="blogs" element={<SocialCommunicationHub />} />
        <Route path="add-blog" element={<SocialCommunicationHub />} />
        <Route path="blog-categories" element={<SocialCommunicationHub />} />
        <Route path="quiz" element={<SocialCommunicationHub />} />
        <Route path="driver-videos" element={<SocialCommunicationHub />} />
        <Route path="driver-video" element={<SocialCommunicationHub />} />
        <Route path="videos" element={<SocialCommunicationHub />} />
        <Route path="video" element={<SocialCommunicationHub />} />
        <Route path="social" element={<SocialCommunicationHub />} />
        <Route path="social/:tab" element={<SocialCommunicationHub />} />

        {/* Notifications & Campaigns */}

        {/* Compliance & Verifications Routes */}
        <Route path="verifications" element={<VerificationHub />} />
        <Route path="verifications/user-overview" element={<VerificationHub />} />
        <Route path="verification-hub" element={<VerificationHub />} />
        <Route path="court-verifications" element={<VerificationHub />} />
        <Route path="verifications/court" element={<VerificationHub />} />
        <Route path="court-verifications-by-transporter" element={<VerificationHub />} />
        <Route path="verifications/court-transporter" element={<VerificationHub />} />
        <Route path="dav-verifications" element={<VerificationHub />} />
        <Route path="verifications/digital-address" element={<VerificationHub />} />
        <Route path="dav-verifications-by-transporter" element={<VerificationHub />} />
        <Route path="verifications/dav-transporter" element={<VerificationHub />} />
        <Route path="physical-verifications-by-transporter" element={<VerificationHub />} />
        <Route path="verifications/physical" element={<VerificationHub />} />

        {/* Subscriptions */}

        {/* Drivers */}

        {/* Transporters */}

        {/* Jobs & Requisitions Dropdown Routes */}
        <Route path="jobs" element={<JobsList />} />
        <Route path="jobs/list" element={<JobsList />} />
        <Route path="active-jobs" element={<ActiveJobsList />} />
        <Route path="jobs/active" element={<ActiveJobsList />} />
        <Route path="expired-jobs" element={<ExpiredJobsList />} />
        <Route path="jobs/expired" element={<ExpiredJobsList />} />
        <Route path="inactive-jobs" element={<InactiveJobsList />} />
        <Route path="jobs/inactive" element={<InactiveJobsList />} />
        <Route path="pending-jobs" element={<PendingApprovalJobsList />} />
        <Route path="jobs/pending" element={<PendingApprovalJobsList />} />
        <Route path="pending-for-approval-jobs" element={<PendingApprovalJobsList />} />

        {/* Teleadmin console (replica of the standalone teleadmin app, see src/teleadmin) */}
        {TM_ROUTES.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}

        <Route path="job-applications" element={<Navigate to="/jobs" replace />} />

        <Route path="teleadmin/*" element={<TeleadminApp />} />
        <Route path="registration-leads" element={<Navigate to="/teleadmin/leads-management-new" replace />} />
        <Route path="leads-assignment" element={<Navigate to="/teleadmin/leads-assignment" replace />} />
        <Route path="assign-leads" element={<Navigate to="/teleadmin/leads-assignment" replace />} />
        <Route path="add-new-lead" element={<Navigate to="/teleadmin/social-leads/create" replace />} />
        <Route path="social-leads-list" element={<Navigate to="/teleadmin/social-media-leads" replace />} />
        <Route path="outbound-leads" element={<Navigate to="/teleadmin/social-media-leads" replace />} />
        <Route path="driver-hire-form-leads" element={<Navigate to="/teleadmin/driver-hire-form-leads" replace />} />
        <Route path="calls" element={<Navigate to="/teleadmin/matchmaking-new" replace />} />
        <Route path="job-calls" element={<Navigate to="/teleadmin/job-wise-calls" replace />} />
        <Route path="pipeline-drivers" element={<Navigate to="/teleadmin/pipeline-drivers" replace />} />
        <Route path="subadmin/pipeline-drivers" element={<Navigate to="/teleadmin/pipeline-drivers" replace />} />
        <Route path="driver-bank" element={<Navigate to="/teleadmin/driver-bank" replace />} />
        <Route path="subadmin/driver-bank" element={<Navigate to="/teleadmin/driver-bank" replace />} />
        <Route path="driver-ki-awaz" element={<Navigate to="/teleadmin/driver-ki-awaz" replace />} />
        <Route path="settings" element={<Settings />} />

        {/* Human Resources (TM-Manavsetu HRMS) */}
        <Route path="hrms/*" element={<HrmsApp />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}