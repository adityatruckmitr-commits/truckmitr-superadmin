import { useState } from 'react';
import { Link } from '@teleadmin/router';
import { useQuery } from '@tanstack/react-query';
import leadsApi from '../services/api/leadsApi';
import {
  TrendingUp, Users, PhoneCall, CheckCircle2,
  Clock, RefreshCw, Calendar, Target,
  UserPlus, Search, Phone, User,
  ChevronLeft, ChevronRight, Hash, Database,
  Eye, UserCircle, Briefcase, XCircle, PhoneIncoming,
  MessageSquare, FilterX, Copy, Check, ShieldCheck,
  Play,
  Download,
  PhoneOff
} from 'lucide-react-teleadmin';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);

  const day = date.getDate();
  const year = date.getFullYear();

  const month = date
    .toLocaleString('en-GB', { month: 'long' })
    .toUpperCase();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // convert 0 → 12

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

// White Stat Card — with interactive filtering like Registration Leads
const StatCard = ({ title, value, icon: Icon, gradient, onClick, isSelected }) => {
  const colorMap = {
    'bg-indigo-600': { text: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-400' },
    'bg-emerald-600': { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-400' },
    'bg-red-600': { text: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-400' },
    'bg-amber-500': { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-400' },
    'bg-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-400' },
    'bg-purple-600': { text: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-400' },
  };
  const theme = colorMap[gradient] || colorMap['bg-indigo-600'];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 transition-all cursor-pointer hover:shadow-xs ${isSelected ? `ring-2 ring-inset ${theme.ring} bg-slate-50/50` : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${theme.text}`} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-none mb-1">{title}</p>
        <p className="text-lg font-bold text-slate-900 leading-none">
          {value ?? 0}
        </p>
      </div>
    </div>
  );
};

// Copyable Lead ID Component
const LeadIdPill = ({ id }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-sm text-[8px] font-bold text-slate-400 transition-all uppercase"
    >
      {copied ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Hash className="w-2.5 h-2.5" />}
      ID: {id?.toString().slice(-6)}
    </button>
  );
};

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('not_called')) return 'text-slate-500 border-slate-200 bg-slate-50/50';
  if (s.includes('not') || s.includes('busy') || s.includes('noanswer') || s.includes('failed')) return 'text-red-500 border-red-200 bg-red-50/50';
  if (s.includes('connected') || s === 'answer') return 'text-emerald-500 border-emerald-200 bg-emerald-50/50';
  if (s.includes('callback') || s === 'callback_later') return 'text-amber-500 border-amber-200 bg-amber-50/50';
  if (s === 'fresh' || s === 'pending' || s === 'feedback_pending') return 'text-blue-500 border-blue-200 bg-blue-50/50';
  return 'text-slate-500 border-slate-200 bg-slate-50/50';
};

const SocialMediaLeads = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchParams, setSearchParams] = useState({
    page: 1,
    per_page: 50,
    search: '',
    final_status: '',
    registration_status: '',
    assigned_id: '',
    source: '',
    from_date: '',
    to_date: ''
  });
  const [selectedLead, setSelectedLead] = useState(null);

  const { data: statsResponse, isLoading: isStatsLoading, refetch: refetchStats, isFetching: isStatsFetching } = useQuery({
    queryKey: ['social-leads-stats', date],
    queryFn: () => leadsApi.getSocialLeadsStats({ date }),
  });

  const { data: listResponse, isLoading: isListLoading, refetch: refetchList, isFetching: isListFetching } = useQuery({
    queryKey: ['social-leads-list', date, searchParams],
    queryFn: () => {
      const { from_date, to_date, ...rest } = searchParams;
      // If date range is set, use from_date/to_date; otherwise fall back to single date
      if (from_date && to_date) {
        return leadsApi.getSocialLeadsList({ from_date, to_date, ...rest });
      }
      return leadsApi.getSocialLeadsList({ date, ...rest });
    },
  });

  const { data: telechampsResponse } = useQuery({
    queryKey: ['all-telechamps'],
    queryFn: () => leadsApi.getTelechamps(),
    staleTime: Infinity
  });

  const { data: callHistoryResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['lead-call-history', selectedLead?.mobile],
    queryFn: () => leadsApi.getCallHistoryByMobile(selectedLead.mobile),
    enabled: !!selectedLead,
  });

  const statsData = statsResponse?.data || [];
  const leadsData = listResponse?.data?.data || [];
  const totalLeadsCount = listResponse?.data?.total || 0;
  const totalPages = listResponse?.data?.last_page || 0;
  const telechamps = telechampsResponse?.data || [];
  const activeTelechamps = telechamps.filter(t => t.role === 'telecaller');
  const resignedTelechamps = telechamps.filter(t => t.role === 'telecallers');
  const isResignedActive = searchParams.assigned_id === 'others' || 
    resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_id);
  const callHistory = callHistoryResponse?.data || [];

  const totals = statsData.reduce((acc, curr) => ({
    total_assigned: acc.total_assigned + parseInt(curr.total_assigned || 0),
    total_called: acc.total_called + parseInt(curr.total_called || 0),
    connected: acc.connected + parseInt(curr.connected || 0),
    registered: acc.registered + parseInt(curr.registered || 0),
    total_remaining: acc.total_remaining + parseInt(curr.total_remaining || 0)
  }), { total_assigned: 0, total_called: 0, connected: 0, registered: 0, total_remaining: 0 });

  const handlePageChange = (newPage) => setSearchParams(prev => ({ ...prev, page: newPage }));
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  const clearFilters = () => setSearchParams({ page: 1, per_page: 50, search: '', final_status: '', registration_status: '', assigned_id: '', source: '', from_date: '', to_date: '' });

  // Quick stats filtering logic
  const toggleQuickFilter = (type, value) => {
    setSearchParams(prev => {
      const isCurrentlySelected = prev[type] === value;
      return {
        ...prev,
        page: 1,
        [type]: isCurrentlySelected ? '' : value,
        // Reset other mutually exclusive filters if needed
        ...(type === 'final_status' ? { registration_status: '' } : { final_status: '' })
      };
    });
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Outbound Leads
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            Live Performance Tracking • {date}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex items-center bg-white rounded-lg px-2 py-1 border border-slate-100 transition-colors min-w-[130px]">
            <Calendar className="w-3 h-3 text-indigo-500 mr-2 flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[12px] font-bold text-slate-700 cursor-pointer w-full outline-none p-0 relative z-10 
              [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <button
            onClick={() => { refetchStats(); refetchList(); }}
            className={`flex items-center justify-center p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all duration-300 ${isListFetching ? 'opacity-70 cursor-wait' : ''}`}
            title="Sync Records"
          >
            <RefreshCw className={`w-4 h-4 ${(isStatsFetching || isListFetching) ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/social-leads/create"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all duration-300 text-xs font-bold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Stat Grid — Interactive Filtering */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Total Assigned" value={totals.total_assigned} icon={Users} gradient="bg-indigo-600"
          onClick={() => clearFilters()} isSelected={!searchParams.final_status && !searchParams.registration_status && !searchParams.search}
        />
        <StatCard
          title="Total Attempted" value={totals.total_called} icon={PhoneCall} gradient="bg-blue-600"
          onClick={() => toggleQuickFilter('final_status', 'feedback_pending')} isSelected={searchParams.final_status === 'feedback_pending'}
        />
        <StatCard
          title="Total Connected" value={totals.connected} icon={CheckCircle2} gradient="bg-emerald-600"
          onClick={() => toggleQuickFilter('final_status', 'connected')} isSelected={searchParams.final_status === 'connected'}
        />
        <StatCard
          title="Pending" value={totals.total_remaining} icon={Clock} gradient="bg-amber-500"
          onClick={() => toggleQuickFilter('final_status', 'not_called')} isSelected={searchParams.final_status === 'not_called'}
        />
        <StatCard
          title="Total Registered" value={totals.registered} icon={UserPlus} gradient="bg-purple-600"
          onClick={() => toggleQuickFilter('registration_status', 'registered')} isSelected={searchParams.registration_status === 'registered'}
        />
      </div>

      {/* Performance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-slate-500" /> Performance Breakdown
          </h3>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{statsData.length} telechamps</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-200">
                <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/60">Telecaller</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-r border-slate-200/60">Assigned</th>
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-r border-slate-200/60">Attempted</th>
                <th className="px-3 py-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center border-r border-slate-200/60">Connected</th>
                <th className="px-3 py-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center border-r border-slate-200/60">Callback</th>
                <th className="px-3 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest text-center border-r border-slate-200/60">Not Connected</th>
                <th className="px-3 py-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest text-center border-r border-slate-200/60">Registered</th>
                <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isStatsLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="8" className="px-4 py-3"><div className="h-6 bg-slate-50 rounded-lg" /></td>
                  </tr>
                ))
              ) : statsData.map((agent) => {
                const pct = Math.round((parseInt(agent.total_called || 0) / Math.max(parseInt(agent.total_assigned || 1), 1)) * 100);
                return (
                  <tr key={agent.assigned_id} className="odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/50 transition-colors group">
                    <td className="px-4 py-2 border-r border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                          {agent.telechamp_name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wide truncate max-w-[120px]">{agent.telechamp_name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center border-r border-slate-200/60">
                      <span className="font-bold text-slate-900 text-[13px]">{agent.total_assigned || 0}</span>
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200/60">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-900 text-[13px]">{agent.total_called || 0}</span>
                        <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center border-r border-slate-200/60">
                      <span className="text-emerald-700 font-bold text-[13px]">{agent.connected || 0}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-600 text-[13px] border-r border-slate-200/60">{agent.callback_later || 0}</td>
                    <td className="px-3 py-2 text-center font-bold text-red-500 text-[13px] border-r border-slate-200/60">{agent.not_connected || 0}</td>
                    <td className="px-3 py-2 text-center border-r border-slate-200/60">
                      <div className="flex flex-col items-center">
                        <span className="text-indigo-600 font-bold text-[13px]">{agent.registered || 0}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Unreg: {agent.unregistered || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm text-[11px] font-bold">{agent.total_remaining || 0}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Leads Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">

        {/* Compact List Header */}
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Detailed Leads List</span>
            {totalLeadsCount > 0 && (
              <span className="bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-sm text-[9px] font-bold ml-1">
                {totalLeadsCount} total
              </span>
            )}
          </div>
        </div>

        {/* Filter Section - More Compact */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <FilterBox
                name="search"
                icon={Search}
                placeholder="Name or Mobile..."
                value={searchParams.search || ""}
                onChange={handleFilterChange}
                className="h-8 text-[12px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="h-8 px-3 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-55 text-[10px] font-bold uppercase transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => { refetchStats(); refetchList(); }}
                className="h-8 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[10px] font-bold uppercase transition-all shadow-xs"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <FilterSelect 
              name="assigned_id" 
              icon={UserCircle} 
              value={
                resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_id)
                  ? "others"
                  : searchParams.assigned_id
              } 
              onChange={handleFilterChange} 
              className="h-8 text-[11px]"
            >
              <option value="">Select Team</option>
              {activeTelechamps.map(t => <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>)}
              <option value="others" style={{ fontWeight: 'bold', backgroundColor: '#fef3c7' }}>Others</option>
            </FilterSelect>

            {isResignedActive && (
              <div className="relative group flex-1">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 z-10" />
                <select
                  name="assigned_id"
                  value={searchParams.assigned_id === 'others' ? "" : searchParams.assigned_id}
                  onChange={(e) => {
                    const val = e.target.value || 'others';
                    setSearchParams(prev => ({ ...prev, assigned_id: val, page: 1 }));
                  }}
                  className="w-full !pl-9 pr-8 py-1.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[12px] font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 outline-hidden transition-all appearance-none cursor-pointer h-8"
                >
                  <option value="">All Others</option>
                  {resignedTelechamps.map(t => <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-amber-500" />
              </div>
            )}

            <FilterSelect name="source" icon={MessageSquare} value={searchParams.source} onChange={handleFilterChange} className="h-8 text-[11px]">
              <option value="">Select Source</option>
              {['WhatsApp', 'Facebook', 'Instagram', 'TollFree', 'OBD', 'Other'].map(src => <option key={src} value={src}>{src}</option>)}
            </FilterSelect>

            <FilterSelect name="final_status" icon={PhoneIncoming} value={searchParams.final_status} onChange={handleFilterChange} className="h-8 text-[11px]">
              <option value="">Call Status</option>
              <option value="connected">Connected</option>
              <option value="not_connected">Not Connected</option>
              <option value="callback_later">Callback Later</option>
              <option value="feedback_pending">Feedback Pending</option>
              <option value="not_called">Not Called</option>
            </FilterSelect>

            <FilterSelect name="registration_status" icon={ShieldCheck} value={searchParams.registration_status} onChange={handleFilterChange} className="h-8 text-[11px]">
              <option value="">Reg Status</option>
              <option value="registered">Registered</option>
              <option value="unregistered">Unregistered</option>
            </FilterSelect>

            <div className="relative group flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
              <input
                type="date"
                name="from_date"
                value={searchParams.from_date || ""}
                onChange={handleFilterChange}
                className="w-full h-8 !pl-8 pr-8 bg-[#f8fafc] border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
              />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group flex-1">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
              <input
                type="date"
                name="to_date"
                value={searchParams.to_date || ""}
                onChange={handleFilterChange}
                className="w-full h-8 !pl-8 pr-8 bg-[#f8fafc] border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
              />
              <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto min-h-[400px] w-full bg-white">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="pl-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Lead Info</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Contact</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Team / Source</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Status</th>
                <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center border-r border-slate-200/60">Calls</th>
                <th className="pr-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isListLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-4 py-4 border-b border-slate-200/60"><div className="h-8 bg-slate-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : leadsData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">No matching leads found</p>
                      <button
                        onClick={clearFilters}
                        className="text-indigo-600 font-bold text-[9px] uppercase hover:underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : leadsData.map((lead) => (
                <tr key={lead.id} className="odd:bg-white even:bg-slate-200/50 hover:bg-indigo-50/50 transition-colors group">
                  <td className="pl-4 py-1.5 border-r border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-[12px] truncate max-w-[120px]" title={lead.name}>{lead.name || 'Anonymous'}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase truncate mb-0.5">ID: {lead.id}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-1.5 border-r border-slate-200/60">
                    <div className="text-slate-700 font-bold text-[12px] tabular-nums leading-none">{lead.mobile}</div>
                    <span className={`inline-block px-1 py-0 rounded-[4px] text-[8px] font-bold uppercase tracking-wider mt-0.5 ${lead.registration_status === 'registered' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {lead.registration_status || 'unreg'}
                    </span>
                  </td>

                  <td className="px-3 py-1.5 border-r border-slate-200/60">
                    <span className="text-slate-600 font-bold text-[11px] truncate max-w-[100px] block">{lead.telecaller_name || 'System'}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Hash className="w-2 h-2 text-slate-400" />
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{lead.source || 'N/A'}</span>
                    </div>
                  </td>

                  <td className="px-3 py-1.5 border-r border-slate-200/60">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-black tracking-wider uppercase border w-max ${getStatusColor(lead.final_status)}`}>
                        {lead.final_status?.replace('_', ' ') || 'not called'}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-1.5 text-center border-r border-slate-200/60">
                    <span className="text-[12px] font-bold text-slate-700 tabular-nums">{lead.call_count ?? 0}</span>
                  </td>

                  <td className="pr-4 py-1.5 text-right">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors ml-auto"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-5 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {searchParams.page} of {totalPages} • {totalLeadsCount} Records</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button disabled={searchParams.page === 1} onClick={() => handlePageChange(searchParams.page - 1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {(() => {
                const current = searchParams.page;
                const pages = [];
                const range = 1;
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= current - range && i <= current + range)) {
                    pages.push(i);
                  } else if (i === current - range - 1 || i === current + range + 1) {
                    pages.push('...');
                  }
                }
                return pages.filter((v, i, a) => a.indexOf(v) === i).map((pg, idx) =>
                  pg === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">...</span>
                  ) : (
                    <button
                      key={pg}
                      onClick={() => handlePageChange(pg)}
                      className={`min-w-[32px] h-9 px-2 rounded-xl font-bold text-[10px] border transition-all ${current === pg
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                        }`}
                    >
                      {pg}
                    </button>
                  )
                );
              })()}
              <button disabled={searchParams.page === totalPages} onClick={() => handlePageChange(searchParams.page + 1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Call History Modal — Consistent UI */}
      {/* Compact Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Compact Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-lg font-bold shadow-xs">
                  {(selectedLead.name || selectedLead.mobile)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    {selectedLead.name || 'Anonymous Lead'}
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] rounded-sm border border-indigo-100">{selectedLead.registration_status || 'Unreg'}</span>
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {selectedLead.mobile} • ID: {selectedLead.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Info */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0 h-fit">
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Primary Details</span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 truncate text-right">{selectedLead.mobile}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 truncate text-right">{selectedLead.source || 'Direct'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reg. Status</span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 truncate text-right uppercase">{selectedLead.registration_status || 'Unreg'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 overflow-hidden">
                    <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Engagement</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 text-center">
                        <p className="text-[8px] text-indigo-400 font-bold uppercase mb-0.5">Total Calls</p>
                        <p className="text-xl font-bold text-indigo-700">{selectedLead.call_count ?? 0}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100 text-center flex flex-col justify-center">
                        <p className="text-[8px] text-indigo-400 font-bold uppercase mb-1">Status</p>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-indigo-600">
                          {selectedLead.final_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Call Log */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Call Activity History</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
                    {isHistoryLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg border border-slate-200" />)}
                      </div>
                    ) : callHistory.length > 0 ? (
                      <div className="space-y-2">
                        {callHistory.map((call, idx) => (
                          <div key={call.id || idx} className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(call.call_status)}`}>
                                  <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-[11px] font-bold uppercase leading-none ${getStatusColor(call.call_status).split(' ')[0]}`}>{call.call_status?.replace('_', ' ')}</p>
                                    <span className="text-[9px] px-1 bg-slate-100 text-slate-500 rounded-sm font-bold uppercase">{call.call_type}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{formatDate(call.created_at)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                <div className="text-right">
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Duration</p>
                                  <p className="text-[10px] font-bold text-slate-700">{call.call_duration}</p>
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">TeleChamp</p>
                                  <p className="text-[10px] font-bold text-slate-700 truncate">{call.assigned_name}</p>
                                </div>
                              </div>
                            </div>

                            {(call.call_feedback || call.call_remarks) && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                {call.call_feedback && <div><p className="text-[8px] text-indigo-500 uppercase font-bold mb-0.5">Feedback</p><p className="text-[10px] text-slate-600 font-bold leading-tight">{call.call_feedback}</p></div>}
                                {call.call_remarks && <div><p className="text-[8px] text-orange-500 uppercase font-bold mb-0.5">Remarks</p><p className="text-[10px] text-slate-600 font-bold leading-tight">{call.call_remarks}</p></div>}
                              </div>
                            )}

                            {call.call_recording && (
                              <div className="mt-2.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[8px] text-emerald-600 uppercase font-bold">Call Recording</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <audio controls className="flex-1 h-8 border border-emerald-100 rounded-md">
                                    <source src={call.call_recording} type="audio/wav" />
                                  </audio>
                                  <a
                                    href={call.call_recording}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-xl">
                        <PhoneOff className="w-6 h-6 text-slate-300 mb-3" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No activity logs found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setSelectedLead(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-300 transition-all">Close Console</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Smaller, cleaner filter components
const FilterBox = ({ icon: Icon, placeholder, className, ...props }) => (
  <div className={`relative group flex-1 ${className}`}>
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
    <input
      className="w-full !pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-hidden transition-all"
      placeholder={placeholder}
      {...props}
    />
  </div>
);

const FilterSelect = ({ icon: Icon, children, className, ...props }) => (
  <div className={`relative group flex-1 ${className}`}>
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
    <select
      className="w-full !pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-hidden transition-all appearance-none cursor-pointer"
      {...props}
    >
      {children}
    </select>
    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-slate-400" />
  </div>
);

export default SocialMediaLeads;
