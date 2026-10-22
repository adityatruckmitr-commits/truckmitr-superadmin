import React, { useState } from 'react';
import { Eye, PhoneCall } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmSend, tmError } from '../api';
import {
  TmBadge, TmButton, TmDate, TmDetails, TmExport, TmForm, TmIconButton, TmModal, TmSection, fmtDate, notify,
} from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
const STATUS_TONE = { pending: 'amber', contacted: 'blue', resolved: 'green' };
const STATUSES = ['pending', 'contacted', 'resolved'].map((s) => ({ value: s, label: cap(s) }));
// Same lists as the truckmitr.com create/edit forms (they depend on the app type)
const REASONS = {
  driver: ['For Jobs', 'For Verification', 'For Training', 'Others'],
  transporter: ['For Hiring Driver', 'For Driver Verification', 'For Bulk Drivers Requirement', 'Others'],
};
const toLocalInput = (value) => (value ? String(value).replace(' ', 'T').slice(0, 16) : '');

// truckmitr.com: Admin › Callback Requests (CallbackRequestController)
export default function CallbackRequests() {
  const [viewing, setViewing] = useState(null);
  const [statusForm, setStatusForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState({ from_date: '', to_date: '' });

  const config = {
    title: 'Callback Request Management',
    singular: 'Callback Request',
    listTitle: 'Callback Requests',
    icon: PhoneCall,
    crumbs: [{ label: 'Callback Requests' }],
    list: {
      path: '/admin/callback-requests',
      key: 'callbackRequests',
      filters: [{ name: 'per_page', placeholder: '20 per page', options: [10, 20, 50, 100].map((n) => ({ value: n, label: `${n} per page` })) }],
      search: (row, q) => `${row.unique_id} ${row.user_name} ${row.mobile_number} ${row.telecaller?.name}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search this page...',
      minWidth: 1100,
      columns: () => [
        { key: 'unique_id', label: 'Unique ID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id || '—'}</span> },
        { key: 'telecaller', label: 'Telecaller', render: (row) => row.telecaller?.name || <span className="text-slate-400">Unassigned</span> },
        { key: 'user_name', label: 'User Name', render: (row) => <span className="font-semibold text-slate-900">{row.user_name}</span> },
        { key: 'mobile_number', label: 'Mobile Number', render: (row) => <a href={`tel:${row.mobile_number}`} className="text-blue-600 hover:underline">{row.mobile_number}</a> },
        { key: 'request_date_time', label: 'Request Date & Time', render: (row) => fmtDate(row.request_date_time, true) },
        { key: 'contact_reason', label: 'Contact Reason' },
        { key: 'app_type', label: 'User Type', render: (row) => <TmBadge tone={row.app_type === 'driver' ? 'blue' : 'purple'}>{cap(row.app_type)}</TmBadge> },
        { key: 'status', label: 'Status', render: (row) => <TmBadge tone={STATUS_TONE[row.status]}>{cap(row.status)}</TmBadge> },
      ],
    },
    rowActions: (row) => (
      <TmIconButton
        icon={Eye}
        title="View"
        tone="blue"
        onClick={() => {
          setViewing(row);
          setStatusForm({ status: row.status, notes: row.notes || '' });
        }}
      />
    ),
    above: () => (
      <TmSection title="Export Callback Requests" subtitle="Download requests received between two dates">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            From Date
            <div className="mt-1"><TmDate value={range.from_date} onChange={(v) => setRange((r) => ({ ...r, from_date: v }))} /></div>
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            To Date
            <div className="mt-1"><TmDate value={range.to_date} onChange={(v) => setRange((r) => ({ ...r, to_date: v }))} /></div>
          </label>
          <TmExport tone="success" path="/admin/export" method="post" params={range} filename="callback_request_export.xlsx" label="Export Excel" />
        </div>
      </TmSection>
    ),
    form: {
      createLabel: 'Add New Callback Request',
      defaults: { status: 'pending' },
      fields: (row, data, formData, values) => [
        { name: 'user_name', label: 'User Name', required: true },
        { name: 'mobile_number', label: 'Mobile Number', type: 'tel', required: true },
        { name: 'request_date_time', label: 'Request Date & Time', type: 'datetime-local', required: Boolean(row) },
        {
          name: 'app_type', label: 'App Type', type: 'select', required: true, placeholder: 'Select App Type',
          options: [{ value: 'driver', label: 'Driver App' }, { value: 'transporter', label: 'Transporter App' }],
        },
        {
          name: 'contact_reason', label: 'Contact Reason', type: 'select', required: true, placeholder: 'Select Contact Reason',
          options: REASONS[values?.app_type] || REASONS.transporter,
        },
        row && { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
      ],
      toValues: (row) => ({ ...row, request_date_time: toLocalInput(row.request_date_time) }),
      prepare: ({ user_name, mobile_number, request_date_time, app_type, contact_reason, status, notes }, row) =>
        row
          ? { user_name, mobile_number, request_date_time, app_type, contact_reason, status, notes }
          : { user_name, mobile_number, request_date_time, app_type, contact_reason, notes },
      create: { path: '/admin/callback-requests' },
      update: { path: (row) => `/admin/callback-requests/${row.id}`, method: 'put' },
    },
    remove: {
      path: (row) => `/admin/callback-requests/${row.id}`,
      label: (row) => `Delete the callback request from ${row.user_name}?`,
    },
  };

  const [reloadKey, setReloadKey] = useState(0);
  const saveStatus = async () => {
    setSaving(true);
    try {
      const result = await tmSend(`/admin/callback-requests/${viewing.id}/update-status`, statusForm);
      notify.success(result?.message || 'Status updated');
      setViewing(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      notify.error(tmError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TmCrudPage key={reloadKey} config={config} />
      <TmModal
        open={Boolean(viewing)}
        title="Callback Request Details"
        onClose={() => setViewing(null)}
        size="lg"
        footer={
          <>
            <TmButton onClick={() => setViewing(null)}>Close</TmButton>
            <TmButton tone="primary" busy={saving} onClick={saveStatus}>Update Status</TmButton>
          </>
        }
      >
        {viewing && (
          <div className="space-y-5">
            <TmDetails
              items={[
                ['Unique ID', viewing.unique_id],
                ['Telecaller', viewing.telecaller?.name || 'Unassigned'],
                ['User Name', viewing.user_name],
                ['Mobile Number', viewing.mobile_number],
                ['Request Date & Time', fmtDate(viewing.request_date_time, true)],
                ['Contact Reason', viewing.contact_reason],
                ['App Type', cap(viewing.app_type)],
                ['Status', <TmBadge key="s" tone={STATUS_TONE[viewing.status]}>{cap(viewing.status)}</TmBadge>],
                ['Notes', viewing.notes],
                ['Created', fmtDate(viewing.created_at, true)],
              ]}
            />
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Update Status</h4>
              <TmForm
                values={statusForm}
                onChange={setStatusForm}
                fields={[
                  { name: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
                  { name: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
                ]}
              />
            </div>
          </div>
        )}
      </TmModal>
    </>
  );
}
