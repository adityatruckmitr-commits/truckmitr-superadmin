import React from 'react';
import { StickyNote } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate } from '../ui';

// truckmitr.com: Admin › User Notes (AdminController@userNotesList)
const config = {
  title: 'User Notes Report',
  listTitle: 'User Notes',
  icon: StickyNote,
  crumbs: [{ label: 'User Notes' }],
  list: {
    path: '/admin/user-notes',
    key: 'userNotes',
    minWidth: 1100,
    filters: [
      { name: 'search', type: 'text', placeholder: 'Search name, mobile, ID, notes...' },
      { name: 'lead_type', placeholder: 'All Lead Types', options: [{ value: 'hot', label: 'Hot' }, { value: 'warm', label: 'Warm' }] },
    ],
    columns: () => [
      { key: 'user_id', label: 'User ID' },
      { key: 'unique_id', label: 'Unique ID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id || '—'}</span> },
      { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name || '—'}</span> },
      { key: 'mobile_number', label: 'Mobile Number', render: (row) => row.mobile_number || '—' },
      {
        key: 'lead_type',
        label: 'Lead Type',
        render: (row) => (row.lead_type === 'hot' ? <TmBadge tone="red">Hot</TmBadge> : row.lead_type === 'warm' ? <TmBadge tone="amber">Warm</TmBadge> : '—'),
      },
      { key: 'notes', label: 'Notes', render: (row) => <span className="whitespace-pre-line max-w-md block">{row.notes}</span> },
      { key: 'created_at', label: 'Created At', render: (row) => fmtDate(row.created_at, true) },
      { key: 'updated_at', label: 'Updated At', render: (row) => fmtDate(row.updated_at, true) },
    ],
  },
};

export default function UserNotes() {
  return <TmCrudPage config={config} />;
}
