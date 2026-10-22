// The teleadmin pages were written for a router with basename="/teleadmin".
// Inside the combined console they are mounted under /teleadmin/*, so this module
// re-exports react-router-dom and prefixes absolute paths with the teleadmin base.
import React, { forwardRef, useCallback } from 'react';
import {
  useNavigate as useRouterNavigate,
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate as RouterNavigate,
} from 'react-router-dom';

export * from 'react-router-dom';

export const TELEADMIN_BASE = '/teleadmin';

export const withBase = (to) => {
  if (typeof to === 'string') {
    if (!to.startsWith('/') || to === TELEADMIN_BASE || to.startsWith(`${TELEADMIN_BASE}/`) || to.startsWith(`${TELEADMIN_BASE}?`)) {
      return to;
    }
    return `${TELEADMIN_BASE}${to}`;
  }
  if (to && typeof to === 'object' && typeof to.pathname === 'string') {
    return { ...to, pathname: withBase(to.pathname) };
  }
  return to;
};

export function useNavigate() {
  const navigate = useRouterNavigate();
  return useCallback(
    (to, options) => (typeof to === 'number' ? navigate(to) : navigate(withBase(to), options)),
    [navigate]
  );
}

export const Link = forwardRef((props, ref) => <RouterLink ref={ref} {...props} to={withBase(props.to)} />);
Link.displayName = 'TeleadminLink';

export const NavLink = forwardRef((props, ref) => <RouterNavLink ref={ref} {...props} to={withBase(props.to)} />);
NavLink.displayName = 'TeleadminNavLink';

export function Navigate(props) {
  return <RouterNavigate {...props} to={withBase(props.to)} />;
}
