import React, { useState } from 'react';
import { PhoneIncoming } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmError } from '../api';
import { TmBadge, TmModal, TmTable, fmtDate, notify } from '../ui';

// truckmitr.com: Admin › Leads (Open Leads Dashboard, AdminController@tollfree)
export default function TollfreeLeads() {
  const [history, setHistory] = useState(null); // { mobile, rows, loading }

  const openHistory = async (mobile) => {
    setHistory({ mobile, rows: [], loading: true });
    try {
      const fd = new FormData();
      fd.append('mobile', mobile);
      const { data } = await tm.post('/admin/get-call-history', fd);
      setHistory({ mobile, rows: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setHistory(null);
    }
  };

  const config = {
    title: 'Open Leads Dashboard',
    listTitle: 'Leads',
    icon: PhoneIncoming,
    crumbs: [{ label: 'Leads' }],
    list: {
      path: '/admin/tollfree-history',
      key: 'tollfree',
      minWidth: 1400,
      filters: [
        { name: 'source', placeholder: 'Source: All', options: (d) => (d?.sources || []).filter(Boolean) },
        { name: 'call_type', placeholder: 'Call Type: All', options: (d) => (d?.callTypes || []).filter(Boolean) },
      ],
      search: (row, q) => `${row.name} ${row.mobile} ${row.assigned_name}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search this page...',
      columns: () => [
        { key: 'assigned_name', label: 'Assigned To', render: (row) => row.assigned_name || '—' },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name || '—'}</span> },
        {
          key: 'mobile',
          label: 'Mobile',
          render: (row) => (
            <button type="button" onClick={() => openHistory(row.mobile)} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-semibold cursor-pointer">
              {row.mobile}
              <TmBadge tone="blue">{row.total_calls}</TmBadge>
            </button>
          ),
        },
        { key: 'source', label: 'Source' },
        { key: 'role', label: 'Role' },
        { key: 'call_status', label: 'Call Status' },
        { key: 'call_duration', label: 'Call Duration' },
        { key: 'call_type', label: 'Call Type' },
        { key: 'call_remarks', label: 'Remarks', render: (row) => <span className="line-clamp-2 max-w-xs">{row.call_remarks || '—'}</span> },
        { key: 'assigned_date', label: 'Assigned Date', render: (row) => fmtDate(row.assigned_date, true) },
        { key: 'chat_date_time', label: 'Chat Date', render: (row) => fmtDate(row.chat_date_time, true) },
        { key: 'created_at', label: 'Call Date', render: (row) => fmtDate(row.created_at, true) },
      ],
    },
  };

  return (
    <>
      <TmCrudPage config={config} />
      <TmModal open={Boolean(history)} title="Call History" subtitle={history?.mobile} onClose={() => setHistory(null)} size="xl">
        {history && (
          <TmTable
            loading={history.loading}
            rows={history.rows}
            rowKey="created_at"
            minWidth={820}
            columns={[
              { key: 'assigned_name', label: 'Assigned To', render: (r) => r.assigned_name || '—' },
              { key: 'call_status', label: 'Status' },
              { key: 'call_duration', label: 'Duration' },
              { key: 'call_type', label: 'Type' },
              { key: 'call_remarks', label: 'Remarks' },
              { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at, true) },
              {
                key: 'recfile',
                label: 'Recording',
                render: (r) =>
                  r.recfile && r.recfile.trim() ? (
                    <audio controls style={{ height: 28 }} src={`https://client.easygoivr.com/monitor//recordings/${r.recfile}`} />
                  ) : 'No Recording',
              },
            ]}
          />
        )}
      </TmModal>
    </>
  );
}
