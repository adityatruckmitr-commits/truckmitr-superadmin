// The HRMS pages were written for a router mounted at the site root (basename VITE_BASE_PATH).
// Inside the combined console they are mounted under /hrms/*, so this module re-exports
// react-router-dom, prefixes absolute paths with the HRMS base and reports locations
// relative to it (the pages compare location.pathname against '/dashboard', '/profile', ...).
import React, { forwardRef, useCallback, useMemo } from 'react';
import {
  useNavigate as useRouterNavigate,
  useLocation as useRouterLocation,
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate as RouterNavigate,
} from 'react-router-dom';

export * from 'react-router-dom';

export const HRMS_BASE = '/hrms';

export const withBase = (to) => {
  if (typeof to === 'string') {
    if (!to.startsWith('/') || to === HRMS_BASE || to.startsWith(`${HRMS_BASE}/`) || to.startsWith(`${HRMS_BASE}?`)) {
      return to;
    }
    return to === '/' ? HRMS_BASE : `${HRMS_BASE}${to}`;
  }
  if (to && typeof to === 'object' && typeof to.pathname === 'string') {
    return { ...to, pathname: withBase(to.pathname) };
  }
  return to;
};

export const stripBase = (pathname) => {
  if (pathname === HRMS_BASE) return '/';
  return pathname.startsWith(`${HRMS_BASE}/`) ? pathname.slice(HRMS_BASE.length) : pathname;
};

export function useLocation() {
  const location = useRouterLocation();
  return useMemo(() => ({ ...location, pathname: stripBase(location.pathname) }), [location]);
}

export function useNavigate() {
  const navigate = useRouterNavigate();
  return useCallback(
    (to, options) => (typeof to === 'number' ? navigate(to) : navigate(withBase(to), options)),
    [navigate]
  );
}

export const Link = forwardRef((props, ref) => <RouterLink ref={ref} {...props} to={withBase(props.to)} />);
Link.displayName = 'HrmsLink';

export const NavLink = forwardRef((props, ref) => <RouterNavLink ref={ref} {...props} to={withBase(props.to)} />);
NavLink.displayName = 'HrmsNavLink';

export function Navigate(props) {
  return <RouterNavigate {...props} to={withBase(props.to)} />;
}
