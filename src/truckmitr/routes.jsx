// Console routes for the truckmitr.com admin panel screens (src/truckmitr/pages), mounted by App.jsx
import { lazy } from 'react';

const named = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));

const Payments = lazy(() => import('./pages/Payments'));
const Referrals = lazy(() => import('./pages/Referrals'));
const CallLogs = lazy(() => import('./pages/CallLogs'));
const TruckList = lazy(() => import('./pages/Trucks'));
const TruckEditor = named(() => import('./pages/Trucks'), 'TruckEditor');
const GreenlineJobs = lazy(() => import('./pages/GreenlineJobs'));
const TeleChamp = lazy(() => import('./pages/TeleChamp'));
const videos = () => import('./pages/Videos');
const banners = () => import('./pages/Banners');
const drivers = () => import('./pages/Drivers');
const transporters = () => import('./pages/Transporters');
const SubscriptionPlans = lazy(() => import('./pages/SubscriptionPlans'));
const DriverList = named(drivers, 'DriverList');
const TransporterList = named(transporters, 'TransporterList');
const TransporterDetail = named(transporters, 'TransporterDetail');
const DrivingSchools = lazy(() => import('./pages/DrivingSchools'));

const Partners = lazy(() => import('./pages/Partners'));
const Matchmaking = lazy(() => import('./pages/Matchmaking'));
const MasterJobs = lazy(() => import('./pages/MasterJobs'));

const notifications = () => import('./pages/Notifications');
const NotificationList = named(notifications, 'NotificationList');
const SendNotification = named(notifications, 'SendNotification');

const checks = () => import('./pages/IdRcChecks');
const RcCheck = named(checks, 'RcCheck');

export const TM_ROUTES = [
  { path: 'id-check', Component: named(checks, 'IdCheck') },
  { path: 'rc-verifications', Component: RcCheck },
  { path: 'rc-verifications/:userId', Component: RcCheck },
  { path: 'notifications', Component: NotificationList },
  { path: 'notifications/list', Component: NotificationList },
  { path: 'notification', Component: NotificationList },
  { path: 'notification-tracking', Component: NotificationList },
  { path: 'notifications/create', Component: SendNotification },
  { path: 'notifications/broadcast', Component: SendNotification },
  { path: 'partners', Component: Partners },
  { path: 'partner-dashboard', Component: Partners },
  { path: 'partners/:id/referrals', Component: Partners },
  { path: 'matchmaking', Component: Matchmaking },
  { path: 'matchmaking/details', Component: Matchmaking },
  { path: 'user-notes', Component: lazy(() => import('./pages/UserNotes')) },
  { path: 'master-jobs', Component: MasterJobs },
  { path: 'jobs/master', Component: MasterJobs },
  { path: 'popup-messages', Component: lazy(() => import('./pages/PopupMessages')) },
  { path: 'call-logs/transporters', Component: CallLogs },
  { path: 'call-logs/drivers', Component: CallLogs },
  { path: 'referrals', Component: Referrals },
  { path: 'referrals/:userId', Component: Referrals },
  { path: 'referral-earn', Component: lazy(() => import('./pages/ReferralEarn')) },
  { path: 'payments-reward', Component: lazy(() => import('./pages/RewardPayments')) },
  { path: 'callback-requests', Component: lazy(() => import('./pages/CallbackRequests')) },
  { path: 'payments', Component: Payments },
  { path: 'payments/failed', Component: Payments },
  { path: 'subscription', Component: lazy(() => import('./pages/Subscriptions')) },
  { path: 'users', Component: lazy(() => import('./pages/Users')) },
  { path: 'career', Component: lazy(() => import('./pages/Careers')) },
  { path: 'inquiry', Component: lazy(() => import('./pages/Inquiries')) },
  { path: 'truck-list', Component: TruckList },
  { path: 'truck-list/edit/:id', Component: TruckEditor },
  { path: 'add-truck', Component: TruckEditor },
  { path: 'leads', Component: lazy(() => import('./pages/TollfreeLeads')) },
  { path: 'dts', Component: DrivingSchools },
  { path: 'view-truck-institute', Component: DrivingSchools },
  { path: 'banners', Component: named(banners, 'Banners') },
  { path: 'mobile-popups', Component: named(banners, 'MobilePopups') },
  { path: 'popups/mobile', Component: named(banners, 'MobilePopups') },
  { path: 'popup-banners', Component: named(banners, 'PopupBanners') },
  { path: 'banners/popups', Component: named(banners, 'PopupBanners') },
  { path: 'subscriptionplans', Component: SubscriptionPlans },
  { path: 'subscriptionplans/create', Component: SubscriptionPlans },
  { path: 'driver-list', Component: DriverList },
  { path: 'drivers', Component: DriverList },
  { path: 'subscribed-drivers', Component: DriverList },
  { path: 'driver-list/edit/:id', Component: named(drivers, 'DriverEdit') },
  { path: 'driver-verifications', Component: lazy(() => import('./pages/DriverVerifications')) },
  { path: 'driver-hiring', Component: lazy(() => import('./pages/DriverHiring')) },
  { path: 'transporter', Component: TransporterList },
  { path: 'transporters', Component: TransporterList },
  { path: 'subscribed-transporters', Component: TransporterList },
  { path: 'transporter/:id/:view', Component: TransporterDetail },
  { path: 'transporter-driver-verification', Component: named(transporters, 'TransporterDriverVerification') },
  { path: 'greenline-pending-jobs', Component: GreenlineJobs },
  { path: 'greenline-submitted-jobs', Component: GreenlineJobs },
  { path: 'telechamp-dashboard', Component: TeleChamp },
  { path: 'telechamp-dashboard/role/:role', Component: TeleChamp },
  { path: 'telechamp-dashboard/telecaller/:id', Component: TeleChamp },
  { path: 'telechamp-dashboard/telecaller/:id/users/:type', Component: TeleChamp },
  { path: 'telechamp', Component: named(() => import('./pages/TeleChamp'), 'TeleChampList') },
  { path: 'video-modules', Component: named(videos, 'VideoModules') },
  { path: 'module-topics', Component: named(videos, 'VideoTopics') },
  { path: 'training-videos', Component: named(videos, 'TrainingVideos') },
  { path: 'health-hygiene', Component: named(videos, 'HealthHygiene') },
  { path: 'driver-welfare', Component: named(videos, 'DriverWelfare') },
  { path: 'driver-welfare/topics', Component: named(videos, 'WelfareTopics') },
  { path: 'add-dhaba', Component: lazy(() => import('./pages/Dhabas')) },
];
