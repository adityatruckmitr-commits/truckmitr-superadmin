import React from 'react';
import { FileText, Inbox } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmFile } from '../api';
import { fmtDate } from '../ui';

// truckmitr.com: Admin › Inquiry (CareerController@showInquiries)
const config = {
  title: 'Career Inquiries',
  listTitle: 'Inquiry List',
  icon: Inbox,
  crumbs: [{ label: 'Inquiry' }],
  list: {
    path: '/admin/inquiry',
    key: 'inquiries',
    search: (row, q) => `${row.name} ${row.email} ${row.phone}`.toLowerCase().includes(q),
    searchPlaceholder: 'Search name, email, phone...',
    columns: () => [
      { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      {
        key: 'resume',
        label: 'Resume',
        render: (row) =>
          row.resume ? (
            <a href={tmFile(row.resume)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold">
              <FileText className="w-3.5 h-3.5" /> View Resume
            </a>
          ) : '—',
      },
      { key: 'created_at', label: 'Date', render: (row) => fmtDate(row.created_at, true) },
    ],
  },
};

export default function Inquiries() {
  return <TmCrudPage config={config} />;
}
