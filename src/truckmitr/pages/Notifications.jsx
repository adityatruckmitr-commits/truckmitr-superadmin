import React, { useState } from 'react';
import { Bell, CheckCheck, CheckCircle2, Eye, Send, XCircle, Layers } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmSend, tmError } from '../api';
import { TmBadge, TmButton, TmForm, TmIconButton, TmImage, TmModal, TmSection, TmShell, TmSelect, fmtDate, fmtNum, notify } from '../ui';

const ago = (value) => {
  const d = new Date(String(value).replace(' ', 'T'));
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return '—';
  const units = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [secs, unit] of units) if (s >= secs) { const n = Math.floor(s / secs); return `${n} ${unit}${n > 1 ? 's' : ''} ago`; }
  return 'just now';
};

// truckmitr.com: Admin › Notifications (AdminController@notifications, getBatchStats, markNotificationAsRead)
export function NotificationList() {
  const [listKey, setListKey] = useState(0);
  const [message, setMessage] = useState(null);
  const [batch, setBatch] = useState({ id: '', stats: null });
  const [batches, setBatches] = useState([]);

  const pickBatch = async (id) => {
    setBatch({ id, stats: null });
    if (!id) return;
    try {
      const { data } = await tm.get(`/admin/notifications/batch/${id}`);
      setBatch({ id, stats: data });
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  const readAll = async () => {
    try {
      const result = await tmSend('/admin/notifications/read-all');
      notify.success(result?.message || 'All notifications marked as read');
      setListKey((k) => k + 1);
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  const markRead = async (row) => {
    try {
      const result = await tmSend(`/admin/notifications/read/${row.id}`, {}, 'get');
      notify.success(result?.message || 'Notification marked as read.');
      setListKey((k) => k + 1);
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  const config = {
    title: 'Notifications',
    listTitle: 'Notifications',
    icon: Bell,
    crumbs: [{ label: 'Notifications' }],
    onData: (d) => setBatches(d.batches || []),
    stats: (d) => [
      { label: 'Total', value: fmtNum(d.totalCount), icon: Bell },
      { label: 'Sent', value: fmtNum(d.sentCount), icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Failed', value: fmtNum(d.failedCount), icon: XCircle, iconClass: 'text-rose-600' },
    ],
    headerActions: () => <TmButton icon={CheckCheck} onClick={readAll}>Mark All as Read</TmButton>,
    above: () => (
      <TmSection title="Batch Statistics" subtitle="Delivery of one broadcast" icon={Layers}>
        <div className="flex flex-wrap items-center gap-3">
          <TmSelect
            value={batch.id}
            placeholder="Select a batch"
            onChange={pickBatch}
            options={batches.map((b) => ({ value: b.unique_id, label: `${b.unique_id} — ${fmtDate(b.created_at, true)}` }))}
            className="sm:w-96"
          />
          {batch.stats && (
            <>
              <TmBadge tone="blue">Total: {fmtNum(batch.stats.total)}</TmBadge>
              <TmBadge tone="green">Sent: {fmtNum(batch.stats.sent)}</TmBadge>
              <TmBadge tone="red">Failed: {fmtNum(batch.stats.failed)}</TmBadge>
            </>
          )}
        </div>
      </TmSection>
    ),
    list: {
      path: '/admin/notifications',
      key: 'notifications',
      params: { _only: 'notifications,totalCount,sentCount,failedCount,batches' },
      minWidth: 1200,
      filters: [
        { name: 'unique_id', type: 'text', placeholder: 'Batch ID...' },
        { name: 'status', placeholder: 'All Status', options: [{ value: 'sent', label: 'Sent' }, { value: 'failed', label: 'Failed' }] },
        { name: 'from_date', type: 'date', placeholder: 'From' },
        { name: 'to_date', type: 'date', placeholder: 'To' },
      ],
      columns: () => [
        { key: 'title', label: 'Title', render: (row) => <span className="font-semibold text-slate-900 line-clamp-2 max-w-xs">{row.title}</span> },
        { key: 'role', label: 'Role', render: (row) => row.user?.role || '—' },
        { key: 'tmid', label: 'TM ID', render: (row) => <span className="font-mono text-[11px]">{row.user?.unique_id || '—'}</span> },
        { key: 'user_id', label: 'User Id' },
        {
          key: 'message',
          label: 'Message',
          render: (row) => (
            <button type="button" onClick={() => setMessage(row)} className="text-left text-blue-600 hover:underline cursor-pointer line-clamp-2 max-w-xs">
              {row.message}
            </button>
          ),
        },
        { key: 'image', label: 'Banner', render: (row) => (row.image ? <TmImage src={row.image} /> : '—') },
        { key: 'status', label: 'Status', render: (row) => (row.status ? <TmBadge tone={row.status === 'sent' ? 'green' : 'amber'}>{row.status === 'sent' ? 'Sent' : 'Failed'}</TmBadge> : '—') },
        { key: 'created_at', label: 'Received', render: (row) => <span title={fmtDate(row.created_at, true)}>{ago(row.created_at)}</span> },
      ],
    },
    rowActions: (row) => (
      <>
        <TmIconButton icon={Eye} title="Message" tone="blue" onClick={() => setMessage(row)} />
        {!Number(row.is_read) && <TmIconButton icon={CheckCheck} title="Mark as read" tone="green" onClick={() => markRead(row)} />}
      </>
    ),
  };

  return (
    <>
      <TmCrudPage key={listKey} config={config} />
      <TmModal open={Boolean(message)} title="Notification Message" subtitle={message?.title} onClose={() => setMessage(null)} size="md">
        {message && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700 whitespace-pre-line">{message.message}</p>
            {message.image && <TmImage src={message.image} className="w-full h-auto max-h-80 object-contain" />}
          </div>
        )}
      </TmModal>
    </>
  );
}

const AUDIENCES = [
  ['all_drivers', 'All Drivers'], ['all_transporters', 'All Transporters'], ['all_dhabas', 'All Dhaba Saathi'], ['all_punctures', 'All Puncture Point'],
  ['all_associations', 'All Association'], ['all_foremen', 'All Foreman'], ['all_users', 'All Users (Drivers + Transporters)'],
  ['authenticated_user', 'Authenticated User'], ['selected_numbers', 'Selected Mobile Numbers'], ['app_installed_unregistered', 'App Installed (Not Registered)'],
].map(([value, label]) => ({ value, label }));

// truckmitr.com: Admin › Notifications › Send Notification (AdminController@createNotification, storeNotification)
export function SendNotification() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const send = async () => {
    setSending(true);
    setErrors({});
    try {
      const { title, message, send_to, mobile, image } = values;
      const result = await tmSend('/admin/notifications/store', { title, message, send_to, mobile: send_to === 'selected_numbers' ? mobile : undefined, image });
      notify.success(result?.message || 'Notification sent');
      setValues({});
      setConfirm(false);
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
      setConfirm(false);
    } finally {
      setSending(false);
    }
  };

  const audience = AUDIENCES.find((a) => a.value === values.send_to)?.label;
  return (
    <TmShell title="Send Notification" crumbs={[{ label: 'Notifications', to: '/notifications' }, { label: 'Send Notification' }]}>
      <TmSection title="Push Notification" subtitle="Sent to the app users you choose, as on truckmitr.com" icon={Send}>
        <TmForm
          values={values}
          onChange={setValues}
          errors={errors}
          fields={[
            { name: 'title', label: 'Title', required: true, span: 2 },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
            { name: 'send_to', label: 'Send To', type: 'select', required: true, placeholder: '-- Select Audience --', options: AUDIENCES },
            values.send_to === 'selected_numbers' && { name: 'mobile', label: 'Mobile Numbers', placeholder: '9999999999,8888888888', help: 'Enter one or more mobile numbers separated by commas.' },
            { name: 'image', label: 'Image (optional)', type: 'file', accept: 'image/*', span: 2 },
          ]}
        />
        <div className="flex justify-end pt-5 mt-5 border-t border-slate-100">
          <TmButton tone="primary" icon={Send} disabled={!values.title || !values.message || !values.send_to} onClick={() => setConfirm(true)}>
            Send Notification
          </TmButton>
        </div>
      </TmSection>
      <TmModal
        open={confirm}
        title="Send this notification?"
        onClose={() => setConfirm(false)}
        size="sm"
        footer={
          <>
            <TmButton onClick={() => setConfirm(false)}>Cancel</TmButton>
            <TmButton tone="primary" icon={Send} busy={sending} onClick={send}>Send Now</TmButton>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          “{values.title}” will be pushed to <b>{audience}</b>{values.send_to === 'selected_numbers' && values.mobile ? ` (${values.mobile})` : ''}. This cannot be undone.
        </p>
      </TmModal>
    </TmShell>
  );
}
