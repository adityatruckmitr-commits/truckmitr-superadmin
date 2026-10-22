import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Briefcase, Clock, CreditCard, Eye, Headphones, PhoneCall, PhoneMissed, PhoneOutgoing, Plus, RefreshCw, Users, Building2,
} from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmSend, tmError, tmView } from '../api';
import {
  TmBadge, TmButton, TmDate, TmDetails, TmForm, TmIconButton, TmModal, TmSection, TmShell, useTmView, fmtDate, fmtNum, notify,
} from '../ui';

const label = (s) => String(s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const recording = (url) =>
  url ? <audio controls style={{ height: 28 }} src={/^https?:/.test(url) ? url : `${(import.meta.env.VITE_IMAGE_BASE_URL || 'https://truckmitr.com/public/').replace(/public\/?$/, '')}${url}`} /> : <span className="text-slate-400">No recording</span>;

// truckmitr.com: Admin › Tele Champ › Dashboard (ManagerController@dashboard)
function ManagerDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useTmView('/manager/dashboard');
  return (
    <TmShell
      title="Tele Champ Dashboard"
      crumbs={[{ label: 'Tele Champ' }, { label: 'Dashboard' }]}
      actions={<TmButton icon={RefreshCw} onClick={reload}>Refresh</TmButton>}
    >
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button type="button" onClick={() => navigate('/jobs')} className="text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-blue-300 cursor-pointer">
          <Briefcase className="w-6 h-6 text-blue-600 mb-2" />
          <p className="font-bold text-slate-900">All Jobs</p>
          <TmBadge tone="blue" className="mt-1">{loading ? '…' : fmtNum(data?.totalJobsCount ?? 0)} Jobs</TmBadge>
        </button>
        <button type="button" onClick={() => navigate('/pending-jobs')} className="text-left bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-amber-300 cursor-pointer">
          <Clock className="w-6 h-6 text-amber-600 mb-2" />
          <p className="font-bold text-slate-900">Pending for Approval</p>
          <TmBadge tone="amber" className="mt-1">{loading ? '…' : fmtNum(data?.pendingJobsCount ?? 0)} Jobs</TmBadge>
        </button>
      </div>
      <TmSection title="TeleChamp Departments" subtitle="Open a department to see its TeleChamps" icon={Headphones}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(data?.roles || []).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => navigate(`/telechamp-dashboard/role/${encodeURIComponent(role)}`)}
              className="rounded-xl border border-slate-200 p-4 text-center hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
            >
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">{label(role)}</p>
              <p className="text-[11px] text-slate-500">View TeleChamp</p>
            </button>
          ))}
          {!loading && !data?.roles?.length && <p className="text-sm text-slate-400 col-span-full text-center py-6">No departments</p>}
        </div>
      </TmSection>
    </TmShell>
  );
}

// ManagerController@telecallersByRole
function RoleTelecallers({ role }) {
  const navigate = useNavigate();
  const config = {
    title: `${label(role)} TeleChamp`,
    listTitle: 'TeleChamps',
    icon: Users,
    crumbs: [{ label: 'Tele Champ', to: '/telechamp-dashboard' }, { label: label(role) }],
    list: {
      path: `/manager/role/${encodeURIComponent(role)}`,
      key: 'telecallers',
      columns: () => [
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'mobile', label: 'Mobile' },
      ],
    },
    rowActions: (row) => <TmButton tone="soft" icon={Eye} className="!px-2.5 !py-1" onClick={() => navigate(`/telechamp-dashboard/telecaller/${row.id}`)}>Report</TmButton>,
  };
  return <TmCrudPage key={role} config={config} />;
}

const STAT_BOXES = (d) => [
  ['total_calls', 'Total Calls', d.totalCalls, PhoneCall, 'text-blue-600'],
  ['total_pending', 'Pending', d.totalPending, PhoneMissed, 'text-amber-600'],
  ['total_connected', 'Connected', d.totalConnected, PhoneOutgoing, 'text-emerald-600'],
  ['total_followup', 'Follow Up', d.totalFollowUp, Clock, 'text-purple-600'],
  ['total_subscription', 'Subscription', d.totalSub, CreditCard, 'text-indigo-600'],
];
const TODAY_BOXES = (d) => [
  ['today_calls', 'Calls', d.todayCalls, PhoneCall, 'text-blue-600'],
  ['today_connected', 'Connected', d.todayConnected, PhoneOutgoing, 'text-emerald-600'],
  ['today_pending', 'Pending', d.todayPending, PhoneMissed, 'text-amber-600'],
  ['today_followup', 'Follow Up', d.todayFollowUp, Clock, 'text-purple-600'],
  ['today_subscription', 'Subscription', d.todaySub, CreditCard, 'text-indigo-600'],
];

function StatGrid({ boxes, onOpen }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {boxes.map(([type, title, value, Icon, tone]) => (
        <button key={type} type="button" onClick={() => onOpen(type)} className="text-left bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3.5 hover:border-blue-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <Icon className={`w-4 h-4 ${tone}`} />
          </div>
          <p className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">{fmtNum(value ?? 0)}</p>
        </button>
      ))}
    </div>
  );
}

// ManagerController@telecallerReport
function TelecallerReport({ id }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const date = params.get('date') || new Date().toISOString().slice(0, 10);
  const { data, loading, error, reload } = useTmView(`/manager/telecaller/${id}`, { date });
  const open = (type) => navigate(`/telechamp-dashboard/telecaller/${id}/users/${type}?date=${date}`);
  return (
    <TmShell
      title={data?.telecaller ? `${data.telecaller.name}'s Work Report` : 'Work Report'}
      crumbs={[{ label: 'Tele Champ', to: '/telechamp-dashboard' }, { label: 'Work Report' }]}
      actions={
        <>
          <TmDate value={date} onChange={(v) => setParams(v ? { date: v } : {})} title="Report date" />
          <TmButton icon={RefreshCw} onClick={reload}>{loading ? 'Loading…' : 'Refresh'}</TmButton>
        </>
      }
    >
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <TmSection title="Total Overview" icon={PhoneCall}>{data && <StatGrid boxes={STAT_BOXES(data)} onOpen={open} />}</TmSection>
      <TmSection title={`Report for ${fmtDate(date)}`} icon={Clock}>{data && <StatGrid boxes={TODAY_BOXES(data)} onOpen={open} />}</TmSection>
    </TmShell>
  );
}

// ManagerController@telecallerUsers (+ telecallerUserView)
function TelecallerUsers({ id, type }) {
  const [params] = useSearchParams();
  const date = params.get('date') || '';
  const [viewing, setViewing] = useState(null);
  const config = {
    title: `${label(type)} - Users`,
    listTitle: 'Users',
    icon: Users,
    crumbs: [{ label: 'Tele Champ', to: '/telechamp-dashboard' }, { label: 'Work Report', to: `/telechamp-dashboard/telecaller/${id}?date=${date}` }, { label: label(type) }],
    list: {
      path: `/manager/telecaller/${id}/users/${type}`,
      key: 'users',
      params: { date },
      filters: [{ name: 'search', type: 'text', placeholder: 'Search name or mobile...' }],
      columns: () => [
        { key: 'driver_name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.driver_name || 'N/A'}</span> },
        { key: 'user_number', label: 'Mobile', render: (row) => row.user_number || 'N/A' },
        { key: 'recording', label: 'Call Recording', render: (row) => recording(row.manual_call_recording_url) },
        { key: 'created_at', label: 'Date', render: (row) => fmtDate(row.created_at) },
        { key: 'call_status', label: 'Status', render: (row) => <TmBadge tone="blue">{label(row.call_status)}</TmBadge> },
      ],
    },
    rowActions: (row) => (
      <TmIconButton
        icon={Eye}
        title="View"
        tone="blue"
        onClick={async () => {
          try {
            const d = await tmView(`/manager/telecaller/user/${row.user_id}/view`);
            setViewing(d.user || row);
          } catch (err) {
            notify.error(tmError(err).message);
          }
        }}
      />
    ),
  };
  return (
    <>
      <TmCrudPage key={`${id}-${type}-${date}`} config={config} />
      <TmModal open={Boolean(viewing)} title="User Details" onClose={() => setViewing(null)} size="md">
        {viewing && (
          <TmDetails
            items={[
              ['Name', viewing.driver_name || 'N/A'],
              ['Mobile', viewing.user_number || 'N/A'],
              ['Call Status', label(viewing.call_status)],
              ['Date', fmtDate(viewing.created_at, true)],
              ['Call Recording', recording(viewing.manual_call_recording_url)],
            ]}
          />
        )}
      </TmModal>
    </>
  );
}

// truckmitr.com: Admin › Tele Champ › Add Department (TelecallerReportController@index, store, department)
export function TeleChampList() {
  const [listKey, setListKey] = useState(0);
  const [dialog, setDialog] = useState(null); // 'department' | 'telechamp'
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const result = await tmSend(dialog === 'department' ? '/admin/telechamp/department' : '/admin/telechamp/store', values);
      notify.success(result?.message || 'Saved');
      setDialog(null);
      setListKey((k) => k + 1);
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const open = (type) => {
    setValues({});
    setErrors({});
    setDialog(type);
  };

  const config = {
    title: 'TeleChamp List',
    listTitle: 'TeleChamp Overview',
    icon: Headphones,
    crumbs: [{ label: 'Tele Champ' }, { label: 'Add Department' }],
    onData: (data) => setDepartments(data?.department || []),
    headerActions: () => (
      <>
        <TmButton tone="soft" icon={Building2} onClick={() => open('department')}>Create Department</TmButton>
        <TmButton tone="primary" icon={Plus} onClick={() => open('telechamp')}>Add New TeleChamp</TmButton>
      </>
    ),
    list: {
      path: '/admin/telechamp',
      key: 'telecallers',
      search: (row, q) => `${row.name} ${row.mobile} ${row.tc_for}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{label(row.name)}</span> },
        { key: 'mobile', label: 'Mobile' },
        { key: 'tc_for', label: 'Department', render: (row) => (row.tc_for ? <TmBadge tone="blue">{label(row.tc_for)}</TmBadge> : '—') },
      ],
    },
  };

  return (
    <>
      <TmCrudPage key={listKey} config={config} />
      <TmModal
        open={Boolean(dialog)}
        title={dialog === 'department' ? 'Create Department' : 'Add New TeleChamp'}
        onClose={() => setDialog(null)}
        size="md"
        footer={
          <>
            <TmButton onClick={() => setDialog(null)}>Cancel</TmButton>
            <TmButton tone="primary" busy={saving} onClick={save}>Save</TmButton>
          </>
        }
      >
        <TmForm
          values={values}
          onChange={setValues}
          errors={errors}
          fields={
            dialog === 'department'
              ? [{ name: 'name', label: 'Department Name', required: true, span: 2 }]
              : [
                  { name: 'name', label: 'Name', required: true },
                  { name: 'mobile', label: 'Mobile', required: true },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'password', label: 'Password', type: 'password', required: true, help: 'At least 6 characters' },
                  { name: 'role', label: 'Role', type: 'select', required: true, options: [{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'telecaller', label: 'TeleChamp' }] },
                  { name: 'tc_for', label: 'Department', type: 'select', required: true, placeholder: 'Select Department', options: departments.map((d) => ({ value: d.name, label: label(d.name) })) },
                ]
          }
        />
      </TmModal>
    </>
  );
}

export default function TeleChamp() {
  const { role, id, type } = useParams();
  if (role) return <RoleTelecallers role={role} />;
  if (id && type) return <TelecallerUsers id={id} type={type} />;
  if (id) return <TelecallerReport id={id} />;
  return <ManagerDashboard />;
}

