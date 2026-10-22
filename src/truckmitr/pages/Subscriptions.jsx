import React from 'react';
import { CreditCard } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtMoney } from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');

// truckmitr.com: Admin › Subscription (SubscriptionController)
const config = {
  title: 'Manage Subscriptions',
  singular: 'Subscription',
  listTitle: 'Subscriptions',
  icon: CreditCard,
  crumbs: [{ label: 'Subscription' }],
  list: {
    path: '/admin/subscription',
    key: 'subscriptions',
    search: (row, q) => `${row.role} ${row.title} ${row.description}`.toLowerCase().includes(q),
    columns: () => [
      { key: 'role', label: 'Role', render: (row) => <TmBadge tone="blue">{cap(row.role)}</TmBadge> },
      { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900">{row.title || '—'}</span> },
      { key: 'description', label: 'Description', render: (row) => <span className="line-clamp-2 max-w-md">{row.description || '—'}</span> },
      { key: 'amount', label: 'Amount (INR)', align: 'right', render: (row) => fmtMoney(row.amount) },
      { key: 'duration', label: 'Duration (Months)', align: 'center' },
    ],
  },
  form: {
    createLabel: 'Create Subscription',
    load: (row) => (row ? `/admin/subscription/${row.id}/edit` : '/admin/subscription/create'),
    fields: (row, data, formData) => [
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        placeholder: formData ? '-- Select Role --' : 'Loading roles...',
        options: (formData?.roles || []).map((role) => ({ value: role, label: cap(role) })),
      },
      { name: 'title', label: 'Title' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'amount', label: 'Amount (INR)', type: 'number', required: true, step: '0.01' },
      { name: 'duration', label: 'Duration (Months)', type: 'number', required: true },
    ],
    prepare: ({ role, title, description, amount, duration }) => ({ role, title, description, amount, duration }),
    create: { path: '/admin/subscription' },
    update: { path: (row) => `/admin/subscription/${row.id}`, method: 'put' },
  },
  remove: {
    path: (row) => `/admin/subscription/${row.id}`,
    label: (row) => `Delete the ${cap(row.role)} subscription "${row.title || row.amount}"?`,
  },
};

export default function Subscriptions() {
  return <TmCrudPage config={config} />;
}
