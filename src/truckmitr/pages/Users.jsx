import React from 'react';
import { Users as UsersIcon } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge } from '../ui';

// truckmitr.com: Admin › Users › View Users (UserController)
const config = {
  title: 'Manage Users',
  listTitle: 'Users',
  icon: UsersIcon,
  crumbs: [{ label: 'Users' }],
  list: {
    path: '/users',
    key: 'users',
    columns: () => [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name || '—'}</span> },
      { key: 'email', label: 'Email', render: (row) => row.email || '—' },
      {
        key: 'subscription',
        label: 'Subscription',
        render: (row) => (row.subscription ? <TmBadge tone="green">{row.subscription.role}</TmBadge> : <TmBadge>No Subscription</TmBadge>),
      },
    ],
  },
};

export default function Users() {
  return <TmCrudPage config={config} />;
}
