import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@teleadmin/router';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import leadsApi from '../services/api/leadsApi';
import {
  Search, Phone, Mail, Calendar, Filter, Eye, PhoneCall, Clock,
  User, Target, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Briefcase, Database, Users, MapPin, Hash, UserCircle, CreditCard,
  ChevronLeft, ChevronRight, ArrowRight, PhoneMissed, PhoneOff,
  ListTodo, RefreshCw, Copy, Check, Camera, FilterX, IdCard, Download
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

// Compact Simple Stat Card
const StatCard = ({ title, value, icon: Icon, gradient, onClick, isSelected }) => {
  const colorMap = {
    'bg-indigo-600': { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500 ring-2 ring-indigo-500/20' },
    'bg-emerald-600': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500 ring-2 ring-emerald-500/20' },
    'bg-red-600': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500 ring-2 ring-red-500/20' },
    'bg-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500 ring-2 ring-orange-500/20' },
    'bg-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500 ring-2 ring-blue-500/20' },
  };

  const theme = colorMap[gradient] || colorMap['bg-indigo-600'];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 transition-all cursor-pointer hover:shadow-xs ${isSelected ? theme.border : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${theme.text}`} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-none mb-1">{title}</p>
        <p className="text-lg font-black text-slate-900 leading-none">
          {value ?? 0}
        </p>
      </div>
    </div>
  );
};

// Clean Assignment Summary
const AssignmentSummary = ({ assignedCount, title, selectedState, onStateChange }) => {
  const tableRef = useRef(null);

  const captureScreenshot = async () => {
    if (tableRef.current) {
      try {
        const canvas = await html2canvas(tableRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        toast.success('Stats table copied to clipboard!');
      } catch (err) {
        console.error('Failed to capture:', err);
        toast.error('Failed to copy screenshot');
      }
    }
  };

  const exportToExcel = () => {
    if (!assignedCount || assignedCount.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const wsData = [
      ["Telechamp", "Fresh Assigned", "Connected", "Not Connected", "Callback", "Pending", "Calls Today"]
    ];

    assignedCount.forEach(item => {
      wsData.push([
        item.telechamp_role && item.telechamp_role !== '--' ? `${item.admin_name} (${item.telechamp_role})` : item.admin_name,
        item.total || 0,
        item.connected || 0,
        item.not_connected || 0,
        item.callback_later || 0,
        `${item.fresh || 0} / ${item.total_pending || 0}`,
        item.overall_calls_today?.total_calls || 0
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Performance Summary");
    XLSX.writeFile(wb, "Performance_Summary.xlsx");
    toast.success('Excel downloaded successfully!');
  };

  if (!assignedCount || assignedCount.length === 0) return null;

  const statsList = [
    { key: 'total', label: 'Fresh Assigned', selectedClasses: 'bg-indigo-50 text-indigo-700 shadow-[inset_0_-1px_0_#c7d2fe,inset_0_1px_0_#c7d2fe]', state: '' },
    { key: 'connected', label: 'Connected', selectedClasses: 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-1px_0_#a7f3d0,inset_0_1px_0_#a7f3d0]', state: 'connected' },
    { key: 'not_connected', label: 'Not Connected', selectedClasses: 'bg-red-50 text-red-700 shadow-[inset_0_-1px_0_#fecaca,inset_0_1px_0_#fecaca]', state: 'not_connected' },
    { key: 'callback_later', label: 'Callback', selectedClasses: 'bg-orange-50 text-orange-700 shadow-[inset_0_-1px_0_#fed7aa,inset_0_1px_0_#fed7aa]', state: 'callback_later' },
    { key: 'fresh', label: 'Pending', selectedClasses: 'bg-blue-50 text-blue-700 shadow-[inset_0_-1px_0_#bfdbfe,inset_0_1px_0_#bfdbfe]', state: 'fresh' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-xs" ref={tableRef}>
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            {title || "Performance Summary"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={captureScreenshot}
            data-html2canvas-ignore="true"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            Snapshot
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white">
          <thead className="bg-slate-100/50">
            <tr>
              <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase border-r border-b border-slate-200/60">Telechamp</th>
              {statsList.map(stat => (
                <th key={stat.key} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-center border-r border-b border-slate-200/60">
                  {stat.label}
                </th>
              ))}
              <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-center border-b border-slate-200">Calls Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignedCount.map((item) => (
              <tr key={item.assigned_to} className="odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/50 transition-colors group">
                <td className="px-4 py-2 border-r border-slate-200/60">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 uppercase text-[11px] leading-tight">{item.admin_name}</span>
                    {item.telechamp_role && item.telechamp_role !== '--' && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider leading-none">
                        {item.telechamp_role}
                      </span>
                    )}
                  </div>
                </td>
                {statsList.map(stat => {
                  const isSelected = (selectedState === '' && stat.state === '') || (selectedState === stat.state);
                  return (
                    <td
                      key={stat.key}
                      onClick={() => onStateChange(stat.state)}
                      className={`px-4 py-2 text-center cursor-pointer transition-colors border-r border-slate-200/60 ${isSelected
                        ? `${stat.selectedClasses} font-bold`
                        : 'text-slate-600 font-bold hover:bg-slate-100/50'
                        }`}
                    >
                      <span className="text-[12px] tracking-tight tabular-nums font-bold">
                        {stat.key === 'fresh' 
                          ? `${item.fresh || 0} / ${item.total_pending || 0}` 
                          : (item[stat.key] || 0)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-2">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[12px] font-bold text-slate-900 leading-none">{item.overall_calls_today?.total_calls || 0} Calls</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <div className="flex items-center gap-[1px]" title="Connected">
                        <span className="text-[10px] text-emerald-600 font-bold">{item.overall_calls_today?.connected || 0}</span>
                      </div>
                      <div className="flex items-center gap-[1px]" title="Not Connected">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1"></span>
                        <span className="text-[10px] text-red-600 font-bold">{item.overall_calls_today?.not_connected || 0}</span>
                      </div>
                      <div className="flex items-center gap-[1px]" title="Callback">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1"></span>
                        <span className="text-[10px] text-orange-600 font-bold">{item.overall_calls_today?.callback_later || 0}</span>
                      </div>
                      <div className="flex items-center gap-[1px]" title="Pending">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1"></span>
                        <span className="text-[10px] text-blue-600 font-bold">{item.overall_calls_today?.feedback_pending || 0}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const LeadsManagementNew = () => {
  const [urlSearchParams] = useSearchParams();
  const roleFromUrl = urlSearchParams.get('role') || '';
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchParams, setSearchParams] = useState({
    unique_id: '',
    name: '',
    mobile: '',
    email: '',
    state: '',
    role: roleFromUrl,
    assigned_to: '',
    call_status: '',
    start_date: '',
    end_date: '',
    per_page: 50,
    page: 1
  });
  const [selectedLeadState, setSelectedLeadState] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // Fetching Logic
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchStats } = useQuery({
    queryKey: ['leads-dashboard-new', date, searchParams],
    queryFn: () => leadsApi.getLeadsManagementNew({ date, ...searchParams })
  });

  const { data: listData, isLoading: isListLoading, refetch: refetchList, isFetching: isListFetching } = useQuery({
    queryKey: ['leads-list-new', date, searchParams, selectedLeadState],
    queryFn: () => {
      const finalParams = { date, ...searchParams, call_status: selectedLeadState || searchParams.call_status };
      return leadsApi.getLeadsManagementList(finalParams);
    }
  });

  const { data: statesResponse } = useQuery({ queryKey: ['all-states'], queryFn: () => leadsApi.getStates(), staleTime: Infinity });
  const { data: telechampsResponse } = useQuery({ queryKey: ['all-telechamps'], queryFn: () => leadsApi.getTelechamps(), staleTime: Infinity });

  const { data: callHistoryResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['lead-call-history', selectedLead?.user_id],
    queryFn: () => leadsApi.getCallHistory(selectedLead.user_id),
    enabled: !!selectedLead?.user_id
  });

  const callHistory = callHistoryResponse?.data || [];

  useEffect(() => {
    setSearchParams(prev => ({ ...prev, role: roleFromUrl, page: 1 }));
  }, [roleFromUrl]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const leads = listData?.data || [];
  const pagination = listData?.pagination || {};
  const overall = dashboardData?.data?.overall || { 
    total_leads: 0, connected: 0, callback_later: 0, not_connected: 0, fresh: 0, feedback_pending: 0,
    connected_calls: 0, callback_later_calls: 0, not_connected_calls: 0, feedback_pending_calls: 0, fresh_calls: 0
  };
  const assignedWise = dashboardData?.data?.assigned_wise || [];
  const states = statesResponse?.data || [];
  const telechamps = telechampsResponse?.data || [];
  const activeTelechamps = telechamps.filter(t => t.role === 'telecaller');
  const resignedTelechamps = telechamps.filter(t => t.role === 'telecallers');
  const isResignedActive = searchParams.assigned_to === 'others' || 
    resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to);

  const activeRoleLabel = searchParams.role
    ? searchParams.role.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    : '';

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Target className="w-5 h-5 text-indigo-600" />
            {activeRoleLabel ? `${activeRoleLabel} Registration Leads` : 'Registration Leads'}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {dashboardData?.date_range?.start
                ? `${formatDate(dashboardData?.date_range?.start)} - ${formatDate(dashboardData?.date_range?.end)}`
                : "Live Database Sync"}
            </span>
          </div>
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
            <RefreshCw className={`w-4 h-4 ${(isDashboardLoading || isListFetching) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="Total" value={overall.total_leads} icon={Users} gradient="bg-indigo-600" isSelected={selectedLeadState === ''} onClick={() => setSelectedLeadState('')} />
        <StatCard title="Connected" value={overall.connected} icon={CheckCircle2} gradient="bg-emerald-600" isSelected={selectedLeadState === 'connected'} onClick={() => setSelectedLeadState('connected')} />
        <StatCard title="Not Connected" value={overall.not_connected} icon={PhoneMissed} gradient="bg-red-600" isSelected={selectedLeadState === 'not_connected'} onClick={() => setSelectedLeadState('not_connected')} />
        <StatCard title="Callback" value={overall.callback_later} icon={PhoneOff} gradient="bg-orange-600" isSelected={selectedLeadState === 'callback_later'} onClick={() => setSelectedLeadState('callback_later')} />
        {/* <StatCard title="Pending" value={`${overall.fresh || 0} / ${overall.total_pending || 0}`} icon={ListTodo} gradient="bg-blue-600" isSelected={selectedLeadState === 'fresh'} onClick={() => setSelectedLeadState('fresh')} /> */}
        <StatCard title="Pending" value={`${overall.fresh || 0}`} icon={ListTodo} gradient="bg-blue-600" isSelected={selectedLeadState === 'fresh'} onClick={() => setSelectedLeadState('fresh')} />

      </div>

      {assignedWise.length > 0 && (
        <AssignmentSummary assignedCount={assignedWise} selectedState={selectedLeadState} onStateChange={setSelectedLeadState} />
      )}

      {/* Unified Leads Command Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
        {/* Card Header */}
        <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Registration Leads Records</span>
            {pagination.total > 0 && (
              <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-xs uppercase tracking-wider ml-1">
                {pagination.total} total
              </span>
            )}
          </div>
        </div>

        {/* Integrated Filter Bar — Clean Professional Styling */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FilterBox
                name="search"
                icon={Search}
                placeholder="Search leads..."
                value={searchParams.search || ""}
                onChange={handleFilterChange}
                className="h-9 text-[12px]"
              />
            </div>
            <button
              onClick={() =>
                setSearchParams({
                  unique_id: '', name: '', mobile: '', email: '', state: '', role: '',
                  assigned_to: '', call_status: '', per_page: 50, page: 1, start_date: '', end_date: ''
                })
              }
              className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-55 transition-all flex items-center gap-1.5"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-wider">Reset</span>
            </button>
            <button
              onClick={() => { refetchStats(); refetchList(); }}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px] font-black uppercase tracking-wider">Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <FilterSelect name="state" icon={MapPin} value={searchParams.state} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">All States</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </FilterSelect>

            <FilterSelect 
              name="assigned_to" 
              icon={UserCircle} 
              value={
                resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to)
                  ? "others"
                  : searchParams.assigned_to
              } 
              onChange={handleFilterChange} 
              className="h-9 text-[12px]"
            >
              <option value="">All Team</option>
              {activeTelechamps.map(t => (
                <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
              ))}
              <option value="others" style={{ fontWeight: 'bold', backgroundColor: '#fef3c7' }}>
                Others
              </option>
            </FilterSelect>

            {isResignedActive && (
              <div className="relative group flex-1 animate-in fade-in slide-in-from-left duration-200">
                <UserCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 z-10" />
                <select
                  name="assigned_to"
                  value={searchParams.assigned_to === 'others' ? "" : searchParams.assigned_to}
                  onChange={(e) => {
                    const val = e.target.value || 'others';
                    setSearchParams(prev => ({ ...prev, assigned_to: val, page: 1 }));
                  }}
                  className="w-full !pl-7 pr-6 py-1.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-400 outline-hidden transition-all appearance-none cursor-pointer shadow-xs h-9"
                >
                  <option value="">All Others</option>
                  {resignedTelechamps.map(t => (
                    <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-90 pointer-events-none text-amber-500" />
              </div>
            )}

            <FilterSelect name="role" icon={Briefcase} value={searchParams.role} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">All Roles</option>
              {['driver', 'transporter', 'dhaba', 'puncture', 'association', 'foreman'].map(r => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </FilterSelect>

            <FilterSelect name="call_status" icon={Phone} value={searchParams.call_status} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">Status</option>
              <option value="connected">Connected ({overall.connected || 0} leads, {overall.connected_calls || 0} calls)</option>
              <option value="not_connected">Not Connected ({overall.not_connected || 0} leads, {overall.not_connected_calls || 0} calls)</option>
              <option value="callback_later">Callback ({overall.callback_later || 0} leads, {overall.callback_later_calls || 0} calls)</option>
              <option value="feedback_pending">Feedback Pending ({overall.feedback_pending || 0} leads, {overall.feedback_pending_calls || 0} calls)</option>
              <option value="fresh">Fresh ({overall.fresh || 0} leads, {overall.fresh_calls || 0} calls)</option>
            </FilterSelect>

            <div className="relative group flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <input
                type="date"
                name="start_date"
                value={searchParams.start_date || ""}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-9 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
                placeholder="dd-mm-yyyy"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative group flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
              <input
                type="date"
                name="end_date"
                value={searchParams.end_date || ""}
                onChange={handleFilterChange}
                className="w-full h-9 !pl-9 pr-9 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
                placeholder="dd-mm-yyyy"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clean Data Table with Grid Lines */}
        <div className="overflow-x-auto min-h-[400px] w-full bg-white">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="pl-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Lead Info</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Contact</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Team</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Location</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Status</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200/60">Calls</th>
                <th className="pr-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {isListLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-6 border-b border-slate-200/60"><div className="h-10 bg-slate-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching records found</p>
                      <button
                        onClick={() => setSearchParams({ unique_id: '', name: '', mobile: '', email: '', state: '', role: '', assigned_to: '', call_status: '', start_date: '', end_date: '', per_page: 50, page: 1 })}
                        className="text-indigo-600 font-black text-[10px] uppercase hover:underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : leads.map((lead, index) => (
                <tr key={lead.user_id || `${lead.mobile}-${index}`} className="hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/10">
                  <td className="pl-4 py-2 border-r border-slate-200/60">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-bold text-slate-900 text-[12px] truncate max-w-[150px]" title={lead.name}>{lead.name}</span>
                        <span className={`px-1 py-0 rounded-[4px] text-[8px] font-black uppercase tracking-wider text-white ${lead.role?.toLowerCase() === 'driver' ? 'bg-indigo-500' : 'bg-violet-500'}`}>
                          {lead.role?.charAt(0)}
                        </span>
                      </div>
                      <span
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lead.unique_id); toast.success('ID Copied!'); }}
                        className="text-[9px] text-slate-400 font-bold uppercase truncate cursor-pointer hover:text-indigo-600 transition-colors mb-0.5 block"
                        title="Click to Copy ID"
                      >
                        {lead.unique_id}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase truncate block">{formatDate(lead.registered_at)}</span>
                    </div>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <div className="text-slate-700 font-bold text-[12px] tabular-nums leading-none mb-1.5">{lead.mobile}</div>
                    <div className="text-slate-400 text-[9px] font-bold uppercase truncate max-w-[120px]">{lead.email ? lead.email.toUpperCase() : 'NO EMAIL'}</div>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <span className="text-slate-700 font-bold text-[12px] truncate max-w-[100px] block">{lead.telechamp_name || '—'}</span>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <span className="text-slate-500 font-semibold text-[12px] truncate max-w-[100px] block" title={lead.state_name}>{lead.state_name || 'Others'}</span>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <div className="flex flex-col">
                      {(() => {
                        const st = lead.final_status;
                        let badgeClass = "text-slate-500";
                        if (st === 'connected') badgeClass = "text-emerald-600";
                        else if (st === 'not_connected') badgeClass = "text-red-500";
                        else if (st === 'callback_later') badgeClass = "text-orange-500";
                        else if (st === 'fresh') badgeClass = "text-blue-500";

                        const isFeedbackPending = lead.total_calls > 0 && lead.final_status === 'fresh';
                        if (isFeedbackPending) badgeClass = "text-amber-600";

                        return (
                          <span className={`text-[11px] font-black uppercase tracking-tight leading-none ${badgeClass} mb-1`}>
                            {isFeedbackPending ? 'Feedback Pending' : (st === 'fresh' ? 'Pending' : st?.replace('_', ' '))}
                          </span>
                        );
                      })()}
                      <span className="text-[8px] text-slate-400 font-bold uppercase leading-none">
                        {lead.last_call_time ? formatDate(lead.last_call_time) : 'No Activity'}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-center border-r border-slate-200/60">
                    <span className="text-[12px] font-black text-slate-700 tabular-nums">{lead.total_calls ?? 0}</span>
                  </td>

                  <td className="pr-4 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <button onClick={() => setSelectedLead(lead)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination */}
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

      {/* Compact Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Compact Header */}
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
                {/* Left Column: Info */}
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
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Engagement</span>
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
                      {selectedLead.last_call_time && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-indigo-100">
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Last Activity Session</span>
                          <span className="text-[9px] font-bold text-slate-600">{formatDate(selectedLead.last_call_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Details & Call Log */}
                <div className="lg:col-span-8 space-y-4">
                  {selectedLead.payment_history?.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Revenue Records</span>
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
                      <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
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

                              {call.call_recording && (
                                <div className="mt-1">
                                  <audio controls className="w-full h-8 border border-slate-200 rounded-lg">
                                    <source src={call.call_recording} type="audio/wav" />
                                    Your browser does not support the audio element.
                                  </audio>
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

// Smaller, cleaner filter components
const FilterBox = ({ icon: Icon, placeholder, className, ...props }) => (
  <div className="relative group flex-1">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
    <input
      className={`w-full !pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-hidden transition-all shadow-xs ${className}`}
      placeholder={placeholder}
      {...props}
    />
  </div>
);

const FilterSelect = ({ icon: Icon, children, className, ...props }) => (
  <div className="relative group flex-1">
    <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 z-10" />
    <select
      className={`w-full !pl-7 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-hidden transition-all appearance-none cursor-pointer shadow-xs ${className}`}
      {...props}
    >
      {children}
    </select>
    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-90 pointer-events-none text-slate-400" />
  </div>
);

export default LeadsManagementNew;
