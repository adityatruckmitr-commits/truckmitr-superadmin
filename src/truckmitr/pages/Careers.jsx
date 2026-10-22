import React from 'react';
import { Briefcase } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { fmtDate } from '../ui';

const text = (name, label, extra = {}) => ({ name, label, required: true, ...extra });

// truckmitr.com: Admin › Career (CareerController)
const config = {
  title: 'Career',
  singular: 'Career',
  listTitle: 'Career List',
  icon: Briefcase,
  list: {
    path: '/admin/career',
    key: 'careers',
    search: (row, q) => `${row.position_title} ${row.position_location}`.toLowerCase().includes(q),
    searchPlaceholder: 'Search position or location...',
    columns: () => [
      { key: 'id', label: 'ID' },
      { key: 'position_title', label: 'Position Title', render: (row) => <span className="font-semibold text-slate-900">{row.position_title}</span> },
      { key: 'position_location', label: 'Location' },
      { key: 'date_posted', label: 'Date Posted', render: (row) => fmtDate(row.date_posted) },
    ],
  },
  form: {
    createLabel: 'Add New Career',
    size: 'xl',
    fields: [
      text('position_title', 'Position Title'),
      text('position_location', 'Position Location'),
      text('description', 'Description', { type: 'textarea' }),
      text('key_responsibilities', 'Key Responsibilities', { type: 'textarea' }),
      text('qualification', 'Qualification', { type: 'textarea' }),
      text('hiring_organization', 'Hiring Organization'),
      text('job_location', 'Job Location'),
      text('date_posted', 'Date Posted', { type: 'date' }),
      { name: 'contact_email', label: 'Contact Email', type: 'email' },
      { name: 'contact_phone', label: 'Contact Phone' },
      { name: 'contact_address', label: 'Contact Address', type: 'textarea', rows: 2 },
    ],
    toValues: (row) => ({ ...row, date_posted: row.date_posted ? String(row.date_posted).slice(0, 10) : '' }),
    prepare: (values) => {
      const { id, created_at, updated_at, ...rest } = values;
      return rest;
    },
    create: { path: '/admin/career/store' },
    update: { path: (row) => `/admin/career/update/${row.id}` },
  },
  remove: {
    path: (row) => `/admin/career/delete/${row.id}`,
    method: 'get',
    label: (row) => `Delete the "${row.position_title}" opening?`,
  },
};

export default function Careers() {
  return <TmCrudPage config={config} />;
}
