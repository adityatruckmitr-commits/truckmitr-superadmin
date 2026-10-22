import React from 'react';
import { useLocation } from 'react-router-dom';
import { PhoneCall, PhoneForwarded } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate, fmtNum } from '../ui';

const tel = (n) => (n ? <a href={`tel:${n}`} className="text-blue-600 hover:underline">{n}</a> : '—');

// truckmitr.com: Admin › Call Logs Tracking › Transporters / Drivers (CallLogController)
export default function CallLogs() {
  const drivers = useLocation().pathname.endsWith('/drivers');
  const config = {
    title: drivers ? 'Call Drivers Logs' : 'Call Transporter Logs',
    listTitle: 'Call Logs',
    icon: drivers ? PhoneForwarded : PhoneCall,
    crumbs: [{ label: 'Call Logs Tracking' }, { label: drivers ? 'Drivers' : 'Transporters' }],
    stats: (d) => [{ label: 'Total Call Count', value: fmtNum(d.totalCallCount), icon: PhoneCall, hint: 'Calls on this page' }],
    list: {
      path: drivers ? '/admin/call-logs/drivers' : '/admin/call-logs/transporters',
      key: 'callLogs',
      params: { _only: 'callLogs,totalCallCount' },
      minWidth: 1300,
      filters: [
        { name: 'driver_search', type: 'text', placeholder: 'Driver name, TM ID or mobile...' },
        { name: 'date_from', type: 'date', placeholder: 'From date' },
        { name: 'date_to', type: 'date', placeholder: 'To date' },
      ],
      columns: () => [
        { key: 'job_id', label: 'Job ID', render: (row) => <span className="font-mono text-[11px]">{row.job_id || '—'}</span> },
        { key: 'job_name', label: 'Job Name', render: (row) => <span className="font-semibold text-slate-900">{row.job_name || '—'}</span> },
        { key: 'transporter_tm_id', label: 'Transporter ID', render: (row) => <span className="font-mono text-[11px]">{row.transporter_tm_id || '—'}</span> },
        { key: 'transporter_name', label: 'Transporter Name' },
        { key: 'transporter_mobile', label: 'Transporter Mobile', render: (row) => tel(row.transporter_mobile) },
        { key: 'driver_tm_id', label: 'Driver ID', render: (row) => <span className="font-mono text-[11px]">{row.driver_tm_id || '—'}</span> },
        { key: 'driver_name', label: 'Driver Name' },
        { key: 'driver_mobile', label: 'Driver Mobile', render: (row) => tel(row.driver_mobile) },
        { key: 'call_count', label: 'Call Count', align: 'center', render: (row) => <TmBadge tone="blue">{row.call_count}</TmBadge> },
        { key: 'created_at', label: 'Date/Time', render: (row) => fmtDate(row.created_at, true) },
      ],
    },
  };
  return <TmCrudPage key={drivers ? 'drivers' : 'transporters'} config={config} />;
}
