import React from 'react';
import { ShieldCheck } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate } from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
const TONE = { verified: 'green', rejected: 'red', pending: 'amber' };
const status = (value) => <TmBadge tone={TONE[value] || 'slate'}>{cap(value)}</TmBadge>;
const STATUSES = ['pending', 'verified', 'rejected'].map((s) => ({ value: s, label: cap(s) }));

// truckmitr.com: Admin › Driver Management › Driver Verifications (DriverVerificationController)
const config = {
  title: 'Driver Verifications',
  singular: 'Verification',
  listTitle: 'Driver Verification List',
  icon: ShieldCheck,
  crumbs: [{ label: 'Driver Management' }, { label: 'Driver Verifications' }],
  list: {
    path: '/admin/driver-verifications',
    key: 'verifications',
    minWidth: 1000,
    filters: [
      { name: 'status', placeholder: 'All Status', options: STATUSES },
      { name: 'driver_name', type: 'text', placeholder: 'Driver name...' },
      { name: 'driver_mobile', type: 'text', placeholder: 'Driver mobile...' },
      { name: 'date_from', type: 'date', placeholder: 'From date' },
      { name: 'date_to', type: 'date', placeholder: 'To date' },
    ],
    columns: () => [
      {
        key: 'driver',
        label: 'Driver Name',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.driver?.name || 'N/A'}</p>
            {row.driver?.email && <p className="text-[11px] text-slate-500">{row.driver.email}</p>}
          </div>
        ),
      },
      { key: 'mobile', label: 'Mobile', render: (row) => row.driver?.mobile || 'N/A' },
      { key: 'id_verification_status', label: 'ID Verification', render: (row) => status(row.id_verification_status) },
      { key: 'address_verification_status', label: 'Address Verification', render: (row) => status(row.address_verification_status) },
      { key: 'court_check_status', label: 'Court Check', render: (row) => status(row.court_check_status) },
      { key: 'final_status', label: 'Final Status', render: (row) => status(row.final_status) },
      { key: 'created_at', label: 'Created At', render: (row) => fmtDate(row.created_at, true) },
    ],
  },
  form: {
    editTitle: 'Edit Driver Verification',
    fields: [
      { name: 'id_verification_status', label: 'ID Verification', type: 'select', required: true, options: STATUSES },
      { name: 'address_verification_status', label: 'Address Verification', type: 'select', required: true, options: STATUSES },
      { name: 'court_check_status', label: 'Court Check', type: 'select', required: true, options: STATUSES },
      { name: 'notes', label: 'Notes', type: 'textarea', rows: 4 },
    ],
    prepare: ({ id_verification_status, address_verification_status, court_check_status, notes }) => ({
      id_verification_status, address_verification_status, court_check_status, notes,
    }),
    update: { path: (row) => `/admin/driver-verifications/${row.id}`, method: 'put' },
  },
};

export default function DriverVerifications() {
  return <TmCrudPage config={config} />;
}
