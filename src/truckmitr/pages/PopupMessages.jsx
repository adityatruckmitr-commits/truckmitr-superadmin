import React from 'react';
import { MessageSquareText } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate } from '../ui';

const PRIORITY_TONE = { high: 'red', normal: 'amber', low: 'slate' };
const USER_TYPES = [
  { value: 'driver', label: 'Driver' },
  { value: 'transporter', label: 'Transporter' },
  { value: 'both', label: 'Both' },
];

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');

// truckmitr.com: Admin › Popup Messages (PopupMessageController)
const config = {
  title: 'Popup Messages',
  singular: 'Message',
  icon: MessageSquareText,
  crumbs: [{ label: 'Popup Messages' }],
  list: {
    path: '/admin/popup-messages',
    key: 'messages',
    search: (row, q) => `${row.title} ${row.user_type}`.toLowerCase().includes(q),
    searchPlaceholder: 'Search title...',
    columns: () => [
      { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900" title={row.title}>{row.title?.length > 30 ? `${row.title.slice(0, 30)}…` : row.title}</span> },
      { key: 'user_type', label: 'User Type', render: (row) => <TmBadge tone="blue">{row.user_type?.replace(/^./, (c) => c.toUpperCase())}</TmBadge> },
      { key: 'priority', label: 'Priority', render: (row) => <TmBadge tone={PRIORITY_TONE[row.priority]}>{row.priority?.replace(/^./, (c) => c.toUpperCase())}</TmBadge> },
      { key: 'start_date', label: 'Start Date', render: (row) => (row.start_date ? fmtDate(row.start_date) : 'N/A') },
      { key: 'end_date', label: 'End Date', render: (row) => (row.end_date ? fmtDate(row.end_date) : 'N/A') },
    ],
  },
  toggle: {
    path: (row) => `/admin/popup-messages/${row.id}/toggle-status`,
    isOn: (row) => Boolean(Number(row.status)),
  },
  form: {
    createLabel: 'Create New Message',
    defaults: { priority: 'normal', status: true },
    fields: [
      { name: 'title', label: 'Title', required: true, span: 2 },
      { name: 'user_type', label: 'User Type', type: 'select', required: true, options: USER_TYPES, placeholder: 'Select User Type' },
      { name: 'priority', label: 'Priority', type: 'select', required: true, options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'low', label: 'Low' }] },
      { name: 'message', label: 'Message', type: 'textarea', required: true, rows: 6, help: 'HTML is supported (same as the truckmitr.com editor).' },
      { name: 'start_date', label: 'Start Date', type: 'date' },
      { name: 'end_date', label: 'End Date', type: 'date' },
      { name: 'status', label: 'Active', type: 'checkbox', checkLabel: 'Active (show this popup)' },
    ],
    toValues: (row) => ({ ...row, start_date: dateOnly(row.start_date), end_date: dateOnly(row.end_date), status: Boolean(Number(row.status)) }),
    create: { path: '/admin/popup-messages' },
    update: { path: (row) => `/admin/popup-messages/${row.id}`, method: 'put' },
  },
  remove: {
    path: (row) => `/admin/popup-messages/${row.id}`,
    label: (row) => `Delete "${row.title}"? This action cannot be undone.`,
  },
};

export default function PopupMessages() {
  return <TmCrudPage config={config} />;
}
