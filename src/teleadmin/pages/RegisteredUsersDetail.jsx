import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from '@teleadmin/router';
import { Calendar, Clock, Phone, PhoneMissed, RefreshCw, Users, ArrowLeft, Eye } from 'lucide-react-teleadmin';
import dashboardApi from '../services/api/dashboardApi';
import LeadDetailsModal from './TodayLeads/components/LeadDetailsModal';

const roleTitle = (role) => role.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return '-';
  }
};

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-black text-slate-900 tabular-nums">{Number(value || 0).toLocaleString('en-IN')}</p>
  </div>
);

const RegisteredUsersDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'driver';
  const getLocalTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getLocalTodayString();

  const [date, setDate] = useState(today);
  const [callStatus, setCallStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);

  // Fetch filtered data based on role, date, and call status
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['today-leads-by-role', role, date, callStatus],
    queryFn: () => {
      const params = { date };
      if (callStatus !== 'all') {
        params.call_status = callStatus;
      }
      return dashboardApi.getTodayLeadsByRole(role, params);
    },
    keepPreviousData: true,
  });

  // Fetch unfiltered today's leads to get accurate summary statistics
  const { data: allLeadsResponse, error: allLeadsError } = useQuery({
    queryKey: ['today-leads-summary', role, date],
    queryFn: () => dashboardApi.getTodayLeadsByRole(role, { date }),
  });

  const records = Array.isArray(data?.data) ? data.data : [];
  const allRecords = Array.isArray(allLeadsResponse?.data) ? allLeadsResponse.data : [];
  
  // Calculate summary counts
  const summary = useMemo(() => {
    return {
      total_registered: allRecords.length,
      called: allRecords.filter(r => r?.call_status === 'called').length,
      not_called: allRecords.filter(r => r?.call_status === 'not_called').length,
    };
  }, [allRecords]);

  const title = `${roleTitle(role)} Registration Leads`;

  // Client-side pagination
  const itemsPerPage = 50;
  const totalCount = records.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const paginatedRecords = useMemo(() => {
    return records.slice(startIndex, startIndex + itemsPerPage);
  }, [records, startIndex]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const subtitle = useMemo(() => {
    if (!date) return 'Registered users from database';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Registered users from database';
      return `Leads for ${parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } catch (e) {
      return 'Registered users from database';
    }
  }, [date]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-slate-800"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <Calendar className="h-4 w-4 text-indigo-500" />
              {subtitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-700"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Registered Today" value={summary.total_registered} icon={Users} tone="bg-indigo-50 text-indigo-600" />
        <StatCard title="Called" value={summary.called} icon={Phone} tone="bg-emerald-50 text-emerald-600" />
        <StatCard title="Not Called" value={summary.not_called} icon={PhoneMissed} tone="bg-rose-50 text-rose-600" />
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Filter Call Status:</span>
          <div className="flex bg-slate-200/60 p-1 rounded-xl">
            {[
              { value: 'all', label: 'All' },
              { value: 'called', label: 'Called' },
              { value: 'not_called', label: 'Not Called' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setCallStatus(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  callStatus === tab.value
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Date:</span>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between bg-blue-600 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Leads Records</p>
            <p className="mt-1 text-xs font-semibold opacity-80">{Number(totalCount).toLocaleString('en-IN')} matching records</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-bold text-slate-500">
            <Clock className="h-5 w-5 animate-spin text-indigo-500" />
            Loading leads...
          </div>
        ) : error || allLeadsError ? (
          <div className="py-16 text-center text-sm font-bold text-rose-500 bg-rose-50/50 m-4 rounded-xl border border-rose-100">
            <p className="font-extrabold mb-1">Failed to load leads data</p>
            <p className="text-xs font-semibold text-rose-400">{error?.message || allLeadsError?.message || 'Unknown network error'}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm font-bold text-slate-500">No leads registered for this query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-4">Unique ID</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Assigned Agent</th>
                  <th className="px-5 py-4">Registration Time</th>
                  <th className="px-5 py-4 text-center">Call Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedLead(record)}
                        className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors text-left focus:outline-hidden"
                      >
                        {record.unique_id || `ID ${record.id}`}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedLead(record)}
                        className="font-black text-slate-900 hover:text-indigo-600 transition-colors text-left focus:outline-hidden"
                      >
                        {record.name}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">
                      {record.mobile || '-'}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {record.state_detail?.name || record.states || '-'}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {record.assigned_admin?.name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {formatDateTime(record.Created_at || record.created_at || record.registered_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        (record.call_status || '').toLowerCase() === 'called'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.call_status || 'not_called'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedLead(record)}
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 hover:border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Client-side Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-sm font-bold text-slate-500">
              Showing {startIndex + 1} to {endIndex} of {totalCount} leads
            </p>
            <div className="flex gap-2">
              <button
                disabled={!canPrev}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40 focus:outline-hidden"
              >
                Previous
              </button>
              <button
                disabled={!canNext}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40 focus:outline-hidden"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          lead={{
            ...selectedLead,
            name_eng: selectedLead.name_eng || selectedLead.name,
            full_details: selectedLead.full_details || { profile_completion: selectedLead.profile_completion || 0 }
          }}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default RegisteredUsersDetail;
