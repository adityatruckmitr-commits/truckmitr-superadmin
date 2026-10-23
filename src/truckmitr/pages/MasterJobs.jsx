import React from 'react';
import { Database } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate } from '../ui';

const mono = (v) => <span className="font-mono text-[11px]">{v || '—'}</span>;
const text = (v) => v || '—';

// truckmitr.com: Admin › Job › Master Job (AdminController@master_jobs)
const config = {
  title: 'Master of Jobs List',
  listTitle: 'Master Jobs',
  icon: Database,
  crumbs: [{ label: 'Job', to: '/jobs' }, { label: 'Master Job' }],
  list: {
    path: '/admin/master-jobs',
    key: 'master_jobs',
    rowKey: 'job_id',
    minWidth: 3600,
    search: (row, q) => Object.values(row).join(' ').toLowerCase().includes(q),
    searchPlaceholder: 'Search this page...',
    columns: () => [
      { key: 'transporter_tm_id', label: 'Transporter TM ID', render: (r) => mono(r.transporter_tm_id) },
      { key: 'transporter_name', label: 'Transporter Name', render: (r) => <span className="font-semibold text-slate-900">{text(r.transporter_name)}</span> },
      { key: 'transporter_mobile', label: 'Transporter Mobile', render: (r) => text(r.transporter_mobile) },
      { key: 'transporter_state', label: 'Transporter State', render: (r) => text(r.transporter_state) },
      { key: 'job_id', label: 'Job ID', render: (r) => mono(r.job_id) },
      { key: 'job_title', label: 'Job Title', render: (r) => <span className="line-clamp-2 max-w-xs">{text(r.job_title)}</span> },
      { key: 'job_location', label: 'Job Location', render: (r) => text(r.job_location) },
      { key: 'Created_at', label: 'Created At', render: (r) => fmtDate(r.Created_at) },
      { key: 'required_experience', label: 'Required Experience', render: (r) => text(r.required_experience) },
      { key: 'salary_range', label: 'Salary Range', render: (r) => text(r.salary_range) },
      { key: 'type_of_license', label: 'License Type', render: (r) => text(r.type_of_license) },
      { key: 'preferred_skills', label: 'Preferred Skills', render: (r) => <span className="line-clamp-2 max-w-xs">{text(r.preferred_skills)}</span> },
      { key: 'application_deadline', label: 'Application Deadline', render: (r) => fmtDate(r.application_deadline) },
      { key: 'number_of_drivers_required', label: 'Drivers Required', align: 'center' },
      { key: 'status', label: 'Job Status', render: (r) => <TmBadge tone="blue">{r.status ?? 'N/A'}</TmBadge> },
      { key: 'applied_driver_tm_id', label: 'Applied Driver TM ID', render: (r) => mono(r.applied_driver_tm_id) },
      { key: 'applied_driver_name', label: 'Applied Driver Name', render: (r) => text(r.applied_driver_name) },
      { key: 'applied_driver_mobile', label: 'Applied Driver Mobile', render: (r) => text(r.applied_driver_mobile) },
      { key: 'selected_driver_tm_id', label: 'Selected Driver TM ID', render: (r) => mono(r.selected_driver_tm_id) },
      { key: 'selected_driver_name', label: 'Selected Driver Name', render: (r) => text(r.selected_driver_name) },
      { key: 'selected_driver_mobile', label: 'Selected Driver Mobile', render: (r) => text(r.selected_driver_mobile) },
      { key: 'get_job_created', label: 'Get Job Created', render: (r) => (r.get_job_created ? fmtDate(r.get_job_created) : 'N/A') },
      { key: 'get_job_updated', label: 'Get Job Updated', render: (r) => (r.get_job_updated ? fmtDate(r.get_job_updated) : 'N/A') },
      { key: 'payment_id', label: 'Payment ID', render: (r) => mono(r.payment_id ?? 'N/A') },
      { key: 'payment_status', label: 'Payment Status', render: (r) => <TmBadge tone={r.payment_status === 'captured' ? 'green' : 'slate'}>{r.payment_status ?? 'N/A'}</TmBadge> },
    ],
  },
};

export default function MasterJobs() {
  return <TmCrudPage config={config} />;
}
