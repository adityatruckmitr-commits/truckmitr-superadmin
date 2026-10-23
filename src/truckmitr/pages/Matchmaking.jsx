import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Briefcase, CheckCircle2, ClipboardList, Clock, IndianRupee, PhoneCall, PhoneOff, Radio, Users, Video,
} from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, TmButton, TmDate, TmRefresh, TmSection, TmShell, TmTable, cx, fmtDate, fmtNum, rowsOf, useTmView } from '../ui';

const FILTERS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['last_7_days', 'Last 7 Days'], ['this_month', 'This Month']];
const CARDS = [
  ['jobs_posted', 'Jobs Posted', 'jobsPosted', ClipboardList],
  ['live_jobs', 'Live Jobs', 'liveJobs', Radio],
  ['driver_requirements', 'Driver Requirements', 'driverRequirements', Users],
  ['applications_received', 'Applications Received', 'applicationsReceived', Briefcase],
  ['connected_calls', 'Connected Calls', 'connectedCalls', PhoneCall],
  ['not_connected_calls', 'Not Connected Calls', 'notConnectedCalls', PhoneOff],
  ['pending_calls', 'Pending Calls', 'pendingCalls', Clock],
  ['interviews_done', 'Interviews Done', 'interviewsDone', Video],
  ['paid_jobs', 'Paid Jobs', 'paidJobs', IndianRupee],
];
const TYPE_TONE = { 'Super Premium': 'purple', Premium: 'amber', Standard: 'blue' };

// truckmitr.com: Admin › Matchmaking (AdminController@Admin_matchmaking)
function MatchmakingOverview() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(params.entries());
  const filter = query.filter || (query.from_date ? 'custom' : 'today');
  const { data, loading, error, reload } = useTmView('/admin/matchmaking', query);
  const [range, setRange] = useState({ from_date: query.from_date || '', to_date: query.to_date || '' });

  // the view's date range is end-inclusive in IST; the bridge sends it in UTC
  const from = data?.startDate ? new Date(data.startDate) : null;
  const to = data?.endDate ? new Date(data.endDate) : null;
  const detailsQuery = (type) => {
    const q = new URLSearchParams({ type, filter, from_date: from ? from.toLocaleDateString('en-CA') : '', to_date: to ? to.toLocaleDateString('en-CA') : '' });
    return `/matchmaking/details?${q}`;
  };

  return (
    <TmShell
      title="Matchmaking & Activity"
      crumbs={[{ label: 'Matchmaking' }]}
      subtitle={from && to ? `Showing data from ${fmtDate(from)} to ${fmtDate(to)}` : ''}
      actions={<TmRefresh onClick={reload} loading={loading} />}
    >
      <div className="flex flex-wrap items-end gap-2 bg-white rounded-xl border border-slate-200 shadow-xs p-3">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams({ filter: key })}
            className={cx('px-3.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer', filter === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}
          >
            {label}
          </button>
        ))}
        <div className="flex flex-wrap items-end gap-2 ml-auto">
          <TmDate title="From" value={range.from_date} onChange={(v) => setRange((r) => ({ ...r, from_date: v }))} />
          <TmDate title="To" value={range.to_date} onChange={(v) => setRange((r) => ({ ...r, to_date: v }))} />
          <TmButton tone={filter === 'custom' ? 'primary' : 'soft'} disabled={!range.from_date || !range.to_date} onClick={() => setParams({ filter: 'custom', ...range })}>
            Custom Range
          </TmButton>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {CARDS.map(([type, title, key, Icon]) => (
          <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{loading && !data ? '…' : fmtNum(data?.[key] ?? 0)}</p>
              <button type="button" onClick={() => navigate(detailsQuery(type))} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <TmSection title="TeleChamp / Assignee Summary Performance" icon={Users} flush>
        <TmTable
          loading={loading}
          rows={rowsOf(data?.summaryData)}
          rowKey="name"
          minWidth={760}
          columns={[
            { key: 'name', label: 'TeleChamp / Assigned To', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
            { key: 'count', label: 'Total Jobs (Count)', align: 'center' },
            {
              key: 'types',
              label: 'Job Type Breakdown',
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(r.types || {}).map(([label, cnt]) => <TmBadge key={label} tone={TYPE_TONE[label]}>{label}: {cnt}</TmBadge>)}
                </div>
              ),
            },
            { key: 'amount', label: 'Total Amount Paid', align: 'right', render: (r) => `₹${fmtNum(r.amount)}` },
            { key: 'drivers', label: 'Total Drivers Required', align: 'center' },
          ]}
        />
      </TmSection>
    </TmShell>
  );
}

// truckmitr.com: Matchmaking details (AdminController@getMatchmakingDetails)
function MatchmakingDetails() {
  const [params] = useSearchParams();
  const query = Object.fromEntries(params.entries());
  const config = {
    title: 'Matchmaking Details',
    listTitle: 'Details',
    icon: CheckCircle2,
    crumbs: [{ label: 'Matchmaking', to: `/matchmaking?filter=${query.filter || 'today'}` }, { label: 'Details' }],
    stats: (d) => [{ label: d.title || 'Records', value: fmtNum(rowsOf(d.data).length) }],
    list: {
      path: '/admin/matchmaking/details',
      key: 'data',
      params: query,
      minWidth: 1500,
      search: (row, q) => `${row.tm_id} ${row.transporter_name} ${row.job_id} ${row.job_title} ${row.driver_name}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'tm_id', label: 'TM ID (Transporter)', render: (r) => <span className="font-mono text-[11px]">{r.tm_id}</span> },
        { key: 'transporter_name', label: 'Transporter Name', render: (r) => <span className="font-semibold text-slate-900">{r.transporter_name}</span> },
        { key: 'transporter_mobile', label: 'Mobile', render: (r) => (r.transporter_mobile && r.transporter_mobile !== 'N/A' ? <a href={`tel:${r.transporter_mobile}`} className="text-blue-600">{r.transporter_mobile}</a> : 'N/A') },
        { key: 'job_id', label: 'Job ID', render: (r) => <span className="font-mono text-[11px]">{r.job_id}</span> },
        { key: 'job_title', label: 'Job Title', render: (r) => <span className="line-clamp-2 max-w-xs" title={r.job_title}>{r.job_title}</span> },
        { key: 'date', label: 'Date', render: (r) => fmtDate(r.date, true) },
        { key: 'number_of_drivers_required', label: 'Drivers Required', align: 'center', render: (r) => r.number_of_drivers_required ?? 0 },
        { key: 'payment_type', label: 'Job Type', render: (r) => String(r.payment_type || 'N/A').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) },
        { key: 'amount', label: 'Amount Paid', align: 'right', render: (r) => `₹${fmtNum(r.amount ?? 0)}` },
        {
          key: 'driver',
          label: 'Driver Details',
          render: (r) => (r.driver_name ? <div><p className="font-semibold">{r.driver_name}</p><p className="text-[11px] text-slate-500 font-mono">{r.driver_tm_id}</p></div> : '—'),
        },
        { key: 'extra_info', label: 'Status', render: (r) => (r.extra_info ? <TmBadge tone="blue">{r.extra_info}</TmBadge> : '—') },
      ],
    },
  };
  return <TmCrudPage key={params.toString()} config={config} />;
}

export default function Matchmaking() {
  const [params] = useSearchParams();
  return params.get('type') ? <MatchmakingDetails /> : <MatchmakingOverview />;
}

