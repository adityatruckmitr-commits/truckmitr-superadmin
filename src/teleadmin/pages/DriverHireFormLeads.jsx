import PageJump from '../../components/PageJump';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import leadsApi from '../services/api/leadsApi';
import { toast } from 'react-hot-toast';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  RefreshCw,
  Phone
} from 'lucide-react-teleadmin';
import { format } from 'date-fns';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return format(date, 'dd MMM yyyy, hh:mm a');
};

const DriverHireFormLeads = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
    page: 1,
    per_page: 50,
    search: '',
    location: '',
    assigned_to: ''
  });

  const { data: listResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['driver-hire-leads', searchParams],
    queryFn: () => leadsApi.getDriverHireLeads(searchParams),
  });

  const { data: telechampsResponse } = useQuery({
    queryKey: ['all-telechamps'],
    queryFn: () => leadsApi.getTelechamps(),
    staleTime: Infinity
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, assignedTo }) => leadsApi.reassignDriverHireLead(id, assignedTo),
    onSuccess: () => {
      toast.success('Lead reassigned successfully');
      queryClient.invalidateQueries(['driver-hire-leads']);
    },
    onError: () => {
      toast.error('Failed to reassign lead');
    }
  });

  const leadsData = listResponse?.data || [];
  const totalLeadsCount = listResponse?.total || 0;
  const totalPages = listResponse?.last_page || 0;
  
  const telechamps = telechampsResponse?.data || [];
  const activeTelechamps = telechamps.filter(t => t.role === 'telecaller');

  const handlePageChange = (newPage) => setSearchParams(prev => ({ ...prev, page: newPage }));
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleReassign = (id, e) => {
    const assignedTo = e.target.value;
    if (!assignedTo) return;
    
    const telechampName = e.target.options[e.target.selectedIndex].text;
    if (window.confirm(`Are you sure you want to assign this lead to ${telechampName}?`)) {
      reassignMutation.mutate({ id, assignedTo });
    } else {
      // Revert select back by causing a re-render or resetting state (value is bound to lead.assigned_to)
      e.target.value = e.target.getAttribute('data-current-value');
    }
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-indigo-600" />
            Driver Hire Form Leads
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Manage requirements submitted from the public website
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => refetch()}
            className={`flex items-center justify-center p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-300 ${isFetching ? 'opacity-70 cursor-wait' : ''}`}
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="search"
              placeholder="Search by name or mobile..."
              value={searchParams.search}
              onChange={handleFilterChange}
              className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="w-48 relative">
            <input
              type="text"
              name="location"
              placeholder="Filter by location..."
              value={searchParams.location}
              onChange={handleFilterChange}
              className="w-full h-9 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="w-full md:w-64 relative group">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              name="assigned_to"
              value={searchParams.assigned_to}
              onChange={handleFilterChange}
              className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-hidden transition-all appearance-none cursor-pointer"
            >
              <option value="">Filter by Team Member</option>
              {activeTelechamps.map(t => (
                <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={() => setSearchParams({ page: 1, per_page: 50, search: '', location: '', assigned_to: '' })}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 text-xs font-bold uppercase transition-all"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto w-full bg-white min-h-[400px]">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="pl-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">ID & Date</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Customer</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Requirement</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Location / Notes</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right pr-4">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-4 py-4 border-b border-slate-200/60"><div className="h-10 bg-slate-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : leadsData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-6 h-6 text-slate-300" />
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No leads found</p>
                    </div>
                  </td>
                </tr>
              ) : leadsData.map((lead) => (
                <tr key={lead.id} className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/50 transition-colors">
                  <td className="pl-4 py-2 border-r border-slate-200/60">
                    <div className="text-[11px] font-bold text-slate-700">#{lead.id}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">{formatDate(lead.created_at)}</div>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200/60 align-top">
                    <div className="font-bold text-[12px] text-slate-800">{lead.name}</div>
                    {lead.company_name && <div className="text-[10px] text-slate-500 truncate">{lead.company_name}</div>}
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      {lead.mobile}
                    </div>
                    {lead.tmid ? (
                      <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
                        <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Registered User (TMID: {lead.tmid})
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1 grid grid-cols-1 gap-0.5">
                          <div><span className="font-semibold">Reg:</span> {formatDate(lead.registered_at)}</div>
                          {lead.subscription_at && <div><span className="font-semibold">Sub:</span> {formatDate(lead.subscription_at)}</div>}
                          <div><span className="font-semibold">Jobs Posted:</span> {lead.job_count || 0}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold uppercase rounded-sm border border-amber-200">
                          Not Registered
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <div className="text-[11px] font-bold text-slate-700">Drivers Needed: {lead.drivers_needed}</div>
                    <div className="text-[10px] text-slate-500">Vehicle: {lead.vehicle_type || 'N/A'}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Salary: {lead.offered_salary || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200/60 max-w-[200px]">
                    <div className="text-[11px] font-bold text-slate-700 mb-0.5">
                      {lead.is_pan_india ? 'Pan India' : lead.state_name}
                    </div>
                    {lead.notes && (
                      <div className="text-[9px] text-slate-500 leading-tight line-clamp-2 italic" title={lead.notes}>
                        "{lead.notes}"
                      </div>
                    )}
                  </td>
                  <td className="pr-4 py-2 text-right border-r border-slate-200/60 align-top">
                    <div className="relative inline-block w-48">
                      <select
                        className="w-full h-8 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 outline-hidden focus:ring-1 focus:ring-indigo-400 cursor-pointer shadow-xs hover:bg-slate-50 transition-colors"
                        value={lead.assigned_to || ''}
                        data-current-value={lead.assigned_to || ''}
                        onChange={(e) => handleReassign(lead.id, e)}
                        disabled={reassignMutation.isPending}
                      >
                        <option value="">-- Unassigned --</option>
                        {activeTelechamps.map(t => (
                          <option key={t.caller_id} value={t.caller_id}>
                            {t.caller_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-500">
              Showing page {searchParams.page} of {totalPages} ({totalLeadsCount} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={searchParams.page === 1}
                onClick={() => handlePageChange(searchParams.page - 1)}
                className="p-1.5 border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold px-2">{searchParams.page}</span>
              <button
                disabled={searchParams.page === totalPages}
                onClick={() => handlePageChange(searchParams.page + 1)}
                className="p-1.5 border border-slate-200 rounded-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <PageJump page={searchParams.page} totalPages={totalPages} onGo={handlePageChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverHireFormLeads;
