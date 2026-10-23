import React, { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Briefcase, CalendarDays, Eye, Handshake, TrendingUp, Users } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmError } from '../api';
import { TmBadge, TmDetails, TmExport, TmIconButton, TmModal, TmSection, fmtDate, fmtNum, notify } from '../ui';

const MATCH = { selected: 'green', pending: 'amber', rejected: 'red' };
const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
const SERIES = '#2563eb'; // the console's blue-600, one hue for single-series charts
const axis = { fontSize: 11, fill: '#64748b' };

const ChartTip = ({ active, payload, label, unit }) =>
  active && payload?.length ? (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{fmtNum(payload[0].value)} {unit}</p>
    </div>
  ) : null;

function Charts({ data }) {
  const perDay = (data?.hiresPerDay || []).map((d) => ({ date: fmtDate(d.date), count: Number(d.count) }));
  const top = (data?.topTransporters || []).map((t) => ({ name: t.name || 'N/A', count: Number(t.hire_count) }));
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <TmSection title="Hires per Day" subtitle="Last 30 days" icon={TrendingUp}>
        {perDay.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={perDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip unit="hires" />} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="count" stroke={SERIES} strokeWidth={2} fill={SERIES} fillOpacity={0.12} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-400 text-center py-16">No data for last 30 days</p>}
      </TmSection>
      <TmSection title="Top Transporters" subtitle="Most drivers hired" icon={Handshake}>
        {top.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={130} interval={0} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip unit="hires" />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-400 text-center py-16">No transporter data yet</p>}
      </TmSection>
    </div>
  );
}

// truckmitr.com: Admin › Driver Management › Driver Hiring (Admin\DriverHiringController)
export default function DriverHiring() {
  const [detail, setDetail] = useState(null);

  const open = async (row) => {
    try {
      const { data } = await tm.get(`/admin/driver-hiring/${row.id}`);
      setDetail(data);
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  const config = {
    title: 'Driver Hiring Management',
    listTitle: 'Hiring Records',
    icon: Briefcase,
    crumbs: [{ label: 'Driver Management' }, { label: 'Driver Hiring' }],
    stats: (d) => [
      { label: 'Total Hires', value: fmtNum(d.summary?.total_hires), icon: Briefcase },
      { label: 'Today', value: fmtNum(d.summary?.today_hires), icon: CalendarDays },
      { label: 'This Week', value: fmtNum(d.summary?.week_hires), icon: TrendingUp },
      { label: 'Transporters', value: fmtNum(d.summary?.unique_transporters), icon: Users },
    ],
    above: ({ data }) => <Charts data={data} />,
    headerActions: (ctx) => <TmExport path="/admin/driver-hiring/export" params={ctx.filters} filename="driver_hirings.csv" />,
    list: {
      path: '/admin/driver-hiring',
      key: 'hirings',
      minWidth: 1300,
      filters: [
        { name: 'search', type: 'text', placeholder: 'Search...' },
        { name: 'job_id', type: 'text', placeholder: 'Job ID' },
        { name: 'transporter', type: 'text', placeholder: 'Transporter' },
        { name: 'driver', type: 'text', placeholder: 'Driver' },
        { name: 'assigned_name', placeholder: 'Assigned: All', options: (d) => (d?.assignedNames || []).filter(Boolean) },
        { name: 'match_status', placeholder: 'All Statuses', options: [{ value: 'selected', label: 'Selected' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }] },
        { name: 'date_from', type: 'date', placeholder: 'From' },
        { name: 'date_to', type: 'date', placeholder: 'To' },
      ],
      columns: () => [
        { key: 'job_id', label: 'Job ID', render: (row) => <span className="font-mono text-[11px] font-semibold">#{row.job_id}</span> },
        { key: 'transporter_name', label: 'Transporter', render: (row) => <span className="font-semibold text-slate-900">{row.transporter_name || 'N/A'}</span> },
        { key: 'driver_name', label: 'Driver', render: (row) => row.driver_name || 'N/A' },
        { key: 'transporter_tm_id', label: 'Trans. TM ID', render: (row) => <span className="font-mono text-[11px]">{row.transporter_tm_id || '—'}</span> },
        { key: 'driver_tm_id', label: 'Driver TM ID', render: (row) => <span className="font-mono text-[11px]">{row.driver_tm_id || '—'}</span> },
        { key: 'assigned_name', label: 'Assigned Name', render: (row) => row.assigned_name || '—' },
        { key: 'match_status', label: 'Match Status', render: (row) => <TmBadge tone={MATCH[String(row.match_status).toLowerCase()]}>{cap(row.match_status)}</TmBadge> },
        { key: 'job_closed_status', label: 'Job Status', render: (row) => (Number(row.job_closed_status) === 1 ? <TmBadge tone="red">Closed</TmBadge> : <TmBadge tone="green">Open</TmBadge>) },
        { key: 'created_at', label: 'Hired Date', render: (row) => fmtDate(row.created_at, true) },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Eye} title="Hiring detail" tone="blue" onClick={() => open(row)} />,
  };

  return (
    <>
      <TmCrudPage config={config} />
      <TmModal open={Boolean(detail)} title="Hiring Detail" subtitle={detail ? `Job #${detail.job_id}` : ''} onClose={() => setDetail(null)} size="lg">
        {detail && (
          <TmDetails
            items={Object.entries(detail)
              .filter(([, v]) => v === null || typeof v !== 'object')
              .map(([k, v]) => [cap(k.replace(/_/g, ' ')), /_at$/.test(k) ? fmtDate(v, true) : v])}
          />
        )}
      </TmModal>
    </>
  );
}
