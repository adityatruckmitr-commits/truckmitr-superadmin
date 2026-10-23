import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// Other URLs that open the same screen as a menu link ('*' = any path starting with it)
const LINK_ALIASES = {
  '/jobs': ['/jobs/list'],
  '/active-jobs': ['/jobs/active'],
  '/expired-jobs': ['/jobs/expired'],
  '/inactive-jobs': ['/jobs/inactive'],
  '/pending-jobs': ['/jobs/pending', '/pending-for-approval-jobs'],
  '/master-jobs': ['/jobs/master'],
  '/expenses': ['/expense*', '/expenses-controls*'],
  '/verifications': ['/verifications/user-overview', '/verification-hub'],
  '/court-verifications': ['/verifications/court'],
  '/court-verifications-by-transporter': ['/verifications/court-transporter'],
  '/dav-verifications': ['/verifications/digital-address'],
  '/dav-verifications-by-transporter': ['/verifications/dav-transporter'],
  '/physical-verifications-by-transporter': ['/verifications/physical'],
  '/team-members': ['/members', '/members/*', '/team-members/*'],
  '/departments': ['/department*'],
  '/surveys': ['/poll-survey', '/surveys/view*'],
  '/whatsapp-groups': ['/social/whatsapp*'],
  '/blogs': ['/add-blog', '/social/blog-list*', '/social/add-blog*'],
  '/blog-categories': ['/social/blog-categories*'],
  '/banners': ['/create-banner', '/social/banners*', '/social/create-banner*'],
  '/quiz': ['/social/quiz*'],
  '/teleadmin/dashboard': ['/teleadmin'],
  '/teleadmin/driver-hire-form-leads': ['/teleadmin/driver-hire-leads', '/driver-hire-form-leads'],
  '/teleadmin/pipeline-drivers': ['/teleadmin/hiring-pipeline', '/teleadmin/pipeline', '/subadmin/pipeline-drivers', '/pipeline-drivers'],
  '/teleadmin/driver-bank': ['/teleadmin/drivers-bank', '/driver-bank', '/subadmin/driver-bank'],
  '/teleadmin/driver-ki-awaz': ['/driver-ki-awaz'],
  '/notifications': ['/notification-tracking', '/notification', '/notifications/tracking'],
  '/notifications/create': ['/notifications/broadcast'],
};

// Groups that also count as open for URLs outside their own links
const GROUP_PREFIXES = {
  Jobs: ['/job', '/active-job', '/expired-job', '/inactive-job', '/pending', '/master-job'],
  'Verification Hub': ['/verification', '/court-verification', '/dav-verification', '/physical-verification'],
  'Team Members': ['/members', '/team-members', '/department'],
  Blogs: ['/blog', '/add-blog', '/social/blog'],
  Transporter: ['/transporter/'],
  'Driver Management': ['/driver-list/'],
  'Truck Listings': ['/truck-list/'],
  Teleadmin: ['/teleadmin', '/subadmin', '/pipeline-drivers', '/driver-bank', '/assign-leads', '/add-new-lead', '/social-leads-list'],
  Notifications: ['/notification'],
};

const matches = (pathname, pattern) =>
  pattern.endsWith('*') ? pathname.startsWith(pattern.slice(0, -1)) : pathname === pattern;

export const isLinkActive = (link, location) => {
  const { pathname, search } = location;
  if (link.exact) return pathname === link.path;
  if (pathname === link.path) return true;
  if ((LINK_ALIASES[link.path] || []).some((alias) => matches(pathname, alias))) return true;
  if (link.prefix && pathname.startsWith(`${link.path}/`)) return true;
  if (link.path === '/notifications/list') return search.includes('tab=list');
  if (link.path === '/notifications/analytics') return search.includes('tab=analytics');
  return false;
};

// A group is open when the current page is one of its links (at any depth)
export const isGroupActive = (group, location) => {
  if ((GROUP_PREFIXES[group.label] || []).some((prefix) => location.pathname.startsWith(prefix))) return true;
  return group.subItems.some((child) =>
    child.subItems
      ? isGroupActive(child, location)
      : isLinkActive(child, location) || (child.path !== '/' && location.pathname.startsWith(`${child.path.split('?')[0]}/`))
  );
};

const Badge = ({ text, className }) => (
  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className || 'bg-slate-100 text-slate-600'}`}>{text}</span>
);

/**
 * Sidebar menu tree: every item with subItems is a dropdown (closed until clicked), any depth.
 * `expanded`/`onToggle` hold the open dropdowns, keyed by their label path.
 */
export default function SidebarNav({ items, expanded, onToggle, onNavigate, depth = 0, parentKey = '' }) {
  const location = useLocation();

  return items.map((item) => {
    const key = parentKey ? `${parentKey} › ${item.label}` : item.label;
    const Icon = item.icon;

    if (item.subItems) {
      const active = isGroupActive(item, location);
      const open = Boolean(expanded[key]);
      const top = depth === 0;

      return (
        <div key={key} className={top ? 'space-y-1 mb-1' : 'space-y-1'}>
          <button
            type="button"
            onClick={() => onToggle(key)}
            className={`w-full flex items-center justify-between transition-colors cursor-pointer ${
              top ? 'px-3 py-2 rounded-lg' : 'px-2.5 py-1.5 rounded-md text-xs'
            } ${
              active
                ? top ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-blue-700 font-semibold bg-blue-50/60'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              {Icon && <Icon className={`${top ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />}
              <span className="truncate text-left">{item.label}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {item.badge && <Badge text={item.badge} className={item.badgeClass} />}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
            </span>
          </button>
          {open && (
            <div className={top ? 'pl-3 pr-1 py-1 space-y-1 border-l-2 border-blue-200 ml-3.5' : 'pl-2.5 py-0.5 space-y-1 border-l border-slate-200 ml-3'}>
              <SidebarNav
                items={item.subItems}
                expanded={expanded}
                onToggle={onToggle}
                onNavigate={onNavigate}
                depth={depth + 1}
                parentKey={key}
              />
            </div>
          )}
        </div>
      );
    }

    const active = isLinkActive(item, location);

    // Link with its own quick filters, shown while it is open (Driver Ki Awaz)
    if (item.children) {
      const currentUrl = location.pathname + location.search;
      return (
        <div key={key} className="space-y-1 mb-1">
          <NavLink
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              active
                ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60'
                : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600 font-medium'
            }`}
          >
            <span>{item.label}</span>
            {item.badge && <Badge text={item.badge} className={item.badgeClass} />}
          </NavLink>
          {active && (
            <div className="pl-3 pr-1 py-1 space-y-1">
              {item.children.map((child) => {
                const isChildActive = currentUrl === child.path;
                return (
                  <NavLink
                    key={child.label}
                    to={child.path}
                    end
                    onClick={onNavigate}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all ${
                      isChildActive
                        ? 'font-bold text-indigo-700 bg-indigo-100/70'
                        : 'font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{child.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isChildActive ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={key}
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
          active
            ? 'bg-blue-600 text-white font-semibold shadow-xs'
            : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 font-medium'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />}
          <span className="truncate">{item.label}</span>
        </span>
        {item.badge && !active && <Badge text={item.badge} className={item.badgeClass} />}
      </NavLink>
    );
  });
}
