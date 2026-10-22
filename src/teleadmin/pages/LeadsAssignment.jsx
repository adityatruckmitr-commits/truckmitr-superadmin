import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import leadsApi from '../services/api/leadsApi';
import {
  Search, Calendar, Filter, Eye, User, Briefcase, Database, MapPin,
  Hash, UserCircle, ChevronLeft, ChevronRight, RefreshCw, XCircle,
  CheckCircle2, UserPlus, FilterX, Clock, Phone, Mail, AlertCircle, ListTodo
} from 'lucide-react-teleadmin';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString('en-GB', { month: 'long' }).toUpperCase();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const getThisMonthDates = () => {
  const now = new Date();
  const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return (new Date(date - tzOffset)).toISOString().slice(0, 16);
  };
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  return {
    start: toLocalISOString(start),
    end: toLocalISOString(now)
  };
};

const initialDates = getThisMonthDates();

const LeadsAssignment = () => {
  const [searchParams, setSearchParams] = useState({
    unique_id: '',
    name: '',
    mobile: '',
    email: '',
    state: '',
    role: '',
    assigned_to: '',
    start_date: initialDates.start,
    end_date: initialDates.end,
    subscription: '',
    search: '',
    per_page: 50,
    page: 1
  });

  const [datePreset, setDatePreset] = useState('this_month');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [toAdminId, setToAdminId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [bulkSelectCount, setBulkSelectCount] = useState('');
  const [pendingSelectionCount, setPendingSelectionCount] = useState(null);

  // Fetching Not Called Leads
  const { data: listData, isLoading: isListLoading, refetch: refetchList, isFetching: isListFetching } = useQuery({
    queryKey: ['not-called-leads-list', searchParams],
    queryFn: () => leadsApi.getNotCalledLeads(searchParams)
  });

  const { data: statesResponse } = useQuery({ queryKey: ['all-states'], queryFn: () => leadsApi.getStates(), staleTime: Infinity });
  const { data: telechampsResponse } = useQuery({ queryKey: ['all-telechamps'], queryFn: () => leadsApi.getTelechamps(), staleTime: Infinity });
  const { data: callHistoryResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['lead-call-history', selectedLead?.user_id],
    queryFn: () => leadsApi.getCallHistory(selectedLead.user_id),
    enabled: !!selectedLead?.user_id
  });

  const callHistory = callHistoryResponse?.data || [];
  const leads = listData?.data || [];
  const pagination = listData?.pagination || {};
  const assigneeCounts = listData?.assignee_counts || {};
  const states = statesResponse?.data || [];
  const telechamps = telechampsResponse?.data || [];
  const activeTelechamps = telechamps.filter(t => t.role === 'telecaller').sort((a, b) => (assigneeCounts[b.caller_id] || 0) - (assigneeCounts[a.caller_id] || 0));
  const resignedTelechamps = telechamps.filter(t => t.role === 'telecallers').sort((a, b) => (assigneeCounts[b.caller_id] || 0) - (assigneeCounts[a.caller_id] || 0));
  const isResignedActive = searchParams.assigned_to === 'others' || 
    resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to);

  // Reset checkboxes on search/page change unless there's a pending selection
  useEffect(() => {
    if (pendingSelectionCount === null) {
      setSelectedLeadIds([]);
    }
  }, [searchParams]);

  // Handle pending selection after data load
  useEffect(() => {
    if (pendingSelectionCount !== null && !isListFetching) {
      const idsToSelect = leads.slice(0, pendingSelectionCount).map(l => l.user_id);
      setSelectedLeadIds(idsToSelect);
      setPendingSelectionCount(null);
    }
  }, [leads, isListFetching, pendingSelectionCount]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'start_date' || name === 'end_date') {
      setDatePreset('custom');
    }
    setSearchParams(prev => {
      const updated = { ...prev, [name]: value, page: 1 };
      if (name === 'start_date' && value && !prev.end_date) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        updated.end_date = now.toISOString().slice(0, 16);
      }
      return updated;
    });
  };

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    
    if (preset === '') {
      setSearchParams(prev => ({ ...prev, start_date: '', end_date: '', page: 1 }));
      return;
    }

    const now = new Date();
    const toLocalISOString = (date) => {
      const tzOffset = date.getTimezoneOffset() * 60000;
      return (new Date(date - tzOffset)).toISOString().slice(0, 16);
    };

    let start = new Date();
    let end = new Date();

    if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (preset === 'this_week') {
      const day = now.getDay() || 7; // Sunday is 0, make it 7
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - day + 1);
    } else if (preset === 'last_7_days') {
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - 7);
    } else if (preset === 'yesterday_6pm') {
      start.setDate(now.getDate() - 1);
      start.setHours(18, 0, 0, 0);
    }

    setSearchParams(prev => ({
      ...prev,
      start_date: toLocalISOString(start),
      end_date: toLocalISOString(end),
      page: 1
    }));
  };

  const handleResetFilters = () => {
    const defaultDates = getThisMonthDates();
    setDatePreset('this_month');
    setSearchParams({
      unique_id: '', name: '', mobile: '', email: '', state: '', role: '',
      assigned_to: '', per_page: 50, page: 1, start_date: defaultDates.start, end_date: defaultDates.end, subscription: '', search: ''
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(lead => lead.user_id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (userId) => {
    setSelectedLeadIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkSelectSubmit = () => {
    const num = parseInt(bulkSelectCount, 10);
    if (isNaN(num) || num <= 0) return;
    if (num > 150) {
      toast.error('Maximum 150 leads can be selected at once');
      return;
    }
    setPendingSelectionCount(num);
    if (leads.length < num) {
      setSearchParams(prev => ({ ...prev, per_page: Math.max(prev.per_page, num), page: 1 }));
    }
  };

  const handleAssignLeads = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    if (!toAdminId) {
      toast.error('Please select a telecaller to assign to');
      return;
    }

    const targetTelecaller = telechamps.find(t => t.caller_id === parseInt(toAdminId));
    const confirmMessage = `Are you sure you want to assign ${selectedLeadIds.length} leads to ${targetTelecaller ? targetTelecaller.caller_name : 'the selected telecaller'}?`;
    
    if (!window.confirm(confirmMessage)) return;

    setIsAssigning(true);
    try {
      await leadsApi.bulkAssignLeads({
        user_ids: selectedLeadIds,
        to_admin_id: parseInt(toAdminId)
      });
      toast.success('Leads assigned successfully!');
      setSelectedLeadIds([]);
      setToAdminId('');
      refetchList();
    } catch (err) {
      toast.error('Failed to assign leads: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Leads Assignment
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Uncalled Leads Base</span>
          </div>
        </div>
        <button
          onClick={() => refetchList()}
          className={`flex items-center justify-center p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-300 ${isListFetching ? 'opacity-70 cursor-wait' : ''}`}
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isListFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
        <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest font-mono">Filter Uncalled Leads</span>
            {pagination.total > 0 && (
              <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-xs uppercase tracking-wider ml-1">
                {pagination.total} leads
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-white flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
              <input
                name="search"
                type="text"
                className="w-full !pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-hidden transition-all shadow-xs h-9"
                placeholder="Search by ID, Name or Mobile..."
                value={searchParams.search}
                onChange={handleFilterChange}
              />
            </div>
            <button
              onClick={handleResetFilters}
              className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-wider">Reset</span>
            </button>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isResignedActive ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2 mb-2`}>
            <div className="relative group flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                name="state"
                value={searchParams.state}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-4 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="relative group flex-1">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                name="assigned_to"
                value={
                  resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to)
                    ? "others"
                    : searchParams.assigned_to
                }
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-4 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned Only {assigneeCounts[''] || assigneeCounts[null] ? `(${assigneeCounts[''] || assigneeCounts[null]})` : '(0)'}</option>
                {activeTelechamps.map(t => (
                  <option key={t.caller_id} value={t.caller_id}>{t.caller_name} {assigneeCounts[t.caller_id] ? `(${assigneeCounts[t.caller_id]})` : '(0)'}</option>
                ))}
                <option value="others" style={{ fontWeight: 'bold', backgroundColor: '#fef3c7' }}>Others {resignedTelechamps.reduce((sum, t) => sum + (assigneeCounts[t.caller_id] || 0), 0) > 0 ? `(${resignedTelechamps.reduce((sum, t) => sum + (assigneeCounts[t.caller_id] || 0), 0)})` : '(0)'}</option>
              </select>
            </div>

            {isResignedActive && (
              <div className="relative group flex-1 animate-in fade-in slide-in-from-left duration-200">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 z-10 pointer-events-none" />
                <select
                  name="assigned_to"
                  value={searchParams.assigned_to === 'others' ? "" : searchParams.assigned_to}
                  onChange={(e) => {
                    const val = e.target.value || 'others';
                    setSearchParams(prev => ({ ...prev, assigned_to: val, page: 1 }));
                  }}
                  className="w-full h-9 !pl-9 pr-4 bg-amber-50/50 border border-amber-200 rounded-lg text-[12px] font-bold text-amber-900 outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-400 transition-all cursor-pointer appearance-none"
                >
                  <option value="">All Others</option>
                  {resignedTelechamps.map(t => (
                    <option key={t.caller_id} value={t.caller_id}>{t.caller_name} {assigneeCounts[t.caller_id] ? `(${assigneeCounts[t.caller_id]})` : '(0)'}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative group flex-1">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                name="role"
                value={searchParams.role}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-4 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              >
                <option value="">All Roles</option>
                {['driver', 'transporter', 'dhaba', 'puncture', 'association', 'foreman'].map(r => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="relative group flex-1">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                name="subscription"
                value={searchParams.subscription}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-4 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              >
                <option value="">All Subscriptions</option>
                <option value="subscribed">Subscribed</option>
                <option value="not_subscribed">Not Subscribed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative group flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <select
                value={datePreset}
                onChange={handlePresetChange}
                className="w-full h-9 !pl-9 pr-4 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer appearance-none"
              >
                <option value="">All Time</option>
                <option value="this_month">This Month</option>
                <option value="this_week">This Week</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="yesterday_6pm">From Yesterday 6 PM</option>
                <option value="custom" disabled hidden>Custom Range</option>
              </select>
            </div>

            <div className="relative group flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <input
                type="datetime-local"
                name="start_date"
                value={searchParams.start_date}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-9 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer"
                placeholder="From Date"
              />
            </div>

            <div className="relative group flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <input
                type="datetime-local"
                name="end_date"
                value={searchParams.end_date}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-9 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 transition-all cursor-pointer"
                placeholder="To Date"
              />
            </div>
          </div>
          
          {/* Bulk Select Utility */}
          <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Auto-Select:</span>
              <input
                type="number"
                min="1"
                max="150"
                value={bulkSelectCount}
                onChange={(e) => setBulkSelectCount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBulkSelectSubmit()}
                placeholder="No. of leads (max 150)"
                className="w-36 h-7 px-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-sm outline-hidden focus:border-indigo-400 transition-all"
              />
              <button
                onClick={handleBulkSelectSubmit}
                className="px-3 h-7 bg-indigo-600 text-white font-bold text-[10px] uppercase rounded-sm hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Check
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px] w-full bg-white">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="!pl-4 py-2.5 w-12 border-r border-slate-200/60 text-center">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                    onChange={handleSelectAll}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Lead Info</th>
                {/* <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Contact</th> */}
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Current Assignee</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Location</th>
                <th className="pr-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {isListLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-6 border-b border-slate-200/60">
                      <div className="h-10 bg-slate-50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching leads found</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-indigo-600 font-black text-[10px] uppercase hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, index) => (
                  <tr
                    key={lead.user_id || `${lead.mobile}-${index}`}
                    className={`hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/10 ${selectedLeadIds.includes(lead.user_id) ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="!pl-4 py-2 border-r border-slate-200/60 text-center">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.user_id)}
                        onChange={() => handleSelectLead(lead.user_id)}
                        className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200/60">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-bold text-slate-900 text-[12px] truncate max-w-[150px]" title={lead.name}>{lead.name}</span>
                          <span className={`px-1 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider text-white bg-indigo-500`}>
                            {lead.role?.charAt(0)}
                          </span>
                        </div>
                        <span
                          onClick={() => { navigator.clipboard.writeText(lead.unique_id); toast.success('ID Copied!'); }}
                          className="text-[9px] text-slate-400 font-bold uppercase truncate cursor-pointer hover:text-indigo-600 transition-colors mb-0.5 block"
                          title="Click to Copy ID"
                        >
                          {lead.unique_id}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase truncate block">Reg: {formatDate(lead.registered_at)}</span>
                      </div>
                    </td>

                    {/* <td className="px-3 py-2 border-r border-slate-200/60">
                      <div className="text-slate-700 font-bold text-[12px] tabular-nums leading-none mb-1">{lead.mobile}</div>
                      <div className="text-slate-400 text-[9px] font-bold uppercase truncate max-w-[120px]">{lead.email ? lead.email.toUpperCase() : 'NO EMAIL'}</div>
                    </td> */}

                    <td className="px-3 py-2 border-r border-slate-200/60">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[12px] font-bold ${lead.telechamp_name === 'Unassigned' ? 'text-amber-600' : 'text-slate-700'}`}>
                          {lead.telechamp_name}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 border-r border-slate-200/60">
                      <span className="text-slate-500 font-semibold text-[12px] truncate max-w-[100px] block" title={lead.state_name}>{lead.state_name || 'Others'}</span>
                    </td>

                    <td className="pr-4 py-2 text-center">
                      <button onClick={() => setSelectedLead(lead)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total: {pagination.total} Records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setSearchParams(p => ({ ...p, page: p.page - 1 }))}
                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-black text-slate-700 px-2">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => setSearchParams(p => ({ ...p, page: p.page + 1 }))}
                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-64 bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-40 transition-all border border-slate-800 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1">Bulk Lead Assignment</p>
              <p className="text-sm font-bold text-slate-200 leading-none">
                Selected: <span className="text-indigo-400 font-extrabold">{selectedLeadIds.length} leads</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={toAdminId}
              onChange={(e) => setToAdminId(e.target.value)}
              className="flex-1 md:flex-none h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-[12px] font-bold text-white outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400"
            >
              <option value="">Select Target Telecaller</option>
              {activeTelechamps.map(t => (
                <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
              ))}
            </select>
            <button
              onClick={handleAssignLeads}
              disabled={isAssigning}
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              {isAssigning ? 'Assigning...' : 'Assign Selected'}
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-lg font-black shadow-xs">
                  {selectedLead.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    {selectedLead.name}
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] rounded-sm border border-indigo-100">{selectedLead.role}</span>
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {selectedLead.lead_type} • {selectedLead.unique_id}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0 h-fit">
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Primary Details</span>
                    </div>
                    <div className="p-3 space-y-3">
                      {[
                        { label: 'User ID', value: selectedLead.user_id, icon: Hash },
                        { label: 'Mobile', value: selectedLead.mobile, icon: Phone },
                        { label: 'Email', value: selectedLead.email || 'N/A', icon: Mail },
                        { label: 'State', value: selectedLead.state_name || 'N/A', icon: MapPin },
                        { label: 'Reg. Date', value: formatDate(selectedLead.registered_at), icon: Calendar },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <item.icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 truncate text-right uppercase">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 overflow-hidden">
                    <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest font-mono">Engagement</span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total Calls</span>
                        <span className="text-[14px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-sm border border-indigo-100 shadow-xs">{selectedLead.total_calls ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-sm border border-emerald-100 shadow-xs uppercase">{selectedLead.final_status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 space-y-4">
                  {selectedLead.payment_history?.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono">Revenue Records</span>
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedLead.payment_history.map((pay, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-xs">
                            <div>
                              <p className="text-lg font-black text-slate-800">₹{parseFloat(pay.amount).toLocaleString()}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{pay.payment_type?.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm font-black uppercase inline-block">{pay.payment_status}</span>
                              <p className="text-[8px] font-bold text-slate-500 mt-1">Expires: {pay.end_at ? formatDate(pay.end_at) : 'Active'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Call Activity Log</span>
                    </div>
                    <div className="p-3">
                      {isHistoryLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-lg" />)}
                        </div>
                      ) : callHistory.length > 0 ? (
                        <div className="space-y-3">
                          {callHistory.map((call, idx) => (
                            <div key={call.id || idx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${call.call_status === 'connected' || call.call_status === 'ANSWER' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    <Phone className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{call.call_status?.replace('_', ' ')}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{call.call_start_time} • {call.call_type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] sm:self-center">
                                  <div className="text-right">
                                    <span className="text-slate-400 font-bold uppercase text-[8px] block leading-none mb-1">Duration</span>
                                    <span className="text-slate-700 font-black bg-white px-1.5 py-0.5 rounded-sm border border-slate-200 shadow-xs">{call.call_duration}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-400 font-bold uppercase text-[8px] block leading-none mb-1">Assigned</span>
                                    <span className="text-slate-700 font-bold">{call.assigned_name}</span>
                                  </div>
                                </div>
                              </div>

                              {(call.call_feedback || call.call_remarks) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-slate-100 text-[10px]">
                                  {call.call_feedback && (
                                    <div>
                                      <span className="text-indigo-500 font-bold uppercase text-[8px] block">Feedback</span>
                                      <p className="text-slate-600 font-medium leading-normal">{call.call_feedback}</p>
                                    </div>
                                  )}
                                  {call.call_remarks && (
                                    <div>
                                      <span className="text-orange-500 font-bold uppercase text-[8px] block">Remarks</span>
                                      <p className="text-slate-600 font-medium leading-normal">{call.call_remarks}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No detailed call logs found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedLead(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-xs">
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsAssignment;
