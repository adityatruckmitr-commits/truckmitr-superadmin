// Console routes for the truckmitr.com admin panel screens (src/truckmitr/pages), mounted by App.jsx
import { lazy } from 'react';

const Payments = lazy(() => import('./pages/Payments'));

export const TM_ROUTES = [
  { path: 'popup-messages', Component: lazy(() => import('./pages/PopupMessages')) },
  { path: 'callback-requests', Component: lazy(() => import('./pages/CallbackRequests')) },
  { path: 'payments', Component: Payments },
  { path: 'payments/failed', Component: Payments },
  { path: 'subscription', Component: lazy(() => import('./pages/Subscriptions')) },
  { path: 'users', Component: lazy(() => import('./pages/Users')) },
  { path: 'career', Component: lazy(() => import('./pages/Careers')) },
  { path: 'inquiry', Component: lazy(() => import('./pages/Inquiries')) },
];
