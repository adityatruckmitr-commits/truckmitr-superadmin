import PageJump from '../../components/PageJump';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useExport } from '../context/ExportContext';

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
const AssignmentSummary = ({ assignedCount, title, selectedState, onStateChange, totalUnique, totalAttempted, filteredTelechampId }) => {
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
    try {
      const excelData = assignedCount.map((item) => {
        const uniqueVal = Number(item.unique_users || item.unique || item.UCA || item.unique_attempted_calls || item.unique_leads || item.lead_count || 0);
        const isFiltered = filteredTelechampId && String(filteredTelechampId) === String(item.assigned_to);
        const displayUnique = isFiltered ? (Number(totalUnique || 0) || uniqueVal) : uniqueVal;
        
        const connSecs = parseInt(item.total_connected_duration, 10) || 0;
        const totalSecs = parseInt(item.total_duration, 10) || 0;
        
        return {
          'Telechamp': item.admin_name || 'N/A',
          'Unique': displayUnique,
          'Attempted': item.total || 0,
          'Connected': item.connected || 0,
          'All Duration': formatDuration(totalSecs),
          'Not Connected': item.not_connected || 0,
          'Callback': item.callback_later || 0,
          'Feedback Pending': item.fresh || 0,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance Summary');
      
      const maxColWidths = [
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 18 }
      ];
      worksheet['!cols'] = maxColWidths;

      XLSX.writeFile(workbook, `Performance_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Performance Summary exported to Excel!');
    } catch (err) {
      console.error('Failed to export to Excel:', err);
      toast.error('Failed to export to Excel.');
    }
  };

  if (!assignedCount || assignedCount.length === 0) return null;

  const statsList = [
    { key: 'total', label: 'Unique / Attempted', selectedClasses: 'bg-indigo-50 text-indigo-700 shadow-[inset_0_-1px_0_#c7d2fe,inset_0_1px_0_#c7d2fe]', state: '' },
    { key: 'connected', label: 'Connected', selectedClasses: 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-1px_0_#a7f3d0,inset_0_1px_0_#a7f3d0]', state: 'connected' },
    { key: 'total_connected_duration', label: 'All Duration', selectedClasses: 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-1px_0_#a7f3d0,inset_0_1px_0_#a7f3d0]', state: '' },
    { key: 'not_connected', label: 'Not Connected', selectedClasses: 'bg-red-50 text-red-700 shadow-[inset_0_-1px_0_#fecaca,inset_0_1px_0_#fecaca]', state: 'not_connected' },
    { key: 'callback_later', label: 'Callback', selectedClasses: 'bg-orange-50 text-orange-700 shadow-[inset_0_-1px_0_#fed7aa,inset_0_1px_0_#fed7aa]', state: 'callback_later' },
    { key: 'fresh', label: 'Feedback Pending', selectedClasses: 'bg-blue-50 text-blue-700 shadow-[inset_0_-1px_0_#bfdbfe,inset_0_1px_0_#bfdbfe]', state: 'fresh' },
  ];

  const formatDuration = (secs) => {
    if (!secs || secs === 0) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : (m > 0 ? `${m}m ${s}s` : `${s}s`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-xs" ref={tableRef}>
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            {title || "Performance Summary"}
            {(totalUnique > 0 || totalAttempted > 0) && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-xs uppercase tracking-wider ml-1">
                {totalUnique} Unique / {totalAttempted} Attempted
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2" data-html2canvas-ignore="true">
          <button
            onClick={captureScreenshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            Snapshot
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 border border-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignedCount.map((item) => {
              const isFilteredRow = filteredTelechampId && String(filteredTelechampId) === String(item.assigned_to);
              return (
                <tr key={item.assigned_to} className={`odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/50 transition-colors group ${isFilteredRow ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}>
                  <td className="px-4 py-2 font-bold text-[11px] text-slate-700 uppercase border-r border-slate-200/60">
                    {item.admin_name}
                  </td>
                  {statsList.map(stat => {
                    const isSelected = (selectedState === '' && stat.state === '') || (selectedState === stat.state);
                    let displayValue = item[stat.key] || 0;

                    if (stat.key === 'total') {
                      const uniqueVal = Number(item.unique_users || item.unique || item.UCA || item.unique_attempted_calls || item.unique_leads || item.lead_count || 0);
                      const isFiltered = filteredTelechampId && String(filteredTelechampId) === String(item.assigned_to);
                      const displayUnique = isFiltered ? (Number(totalUnique || 0) || uniqueVal) : uniqueVal;
                      displayValue = `${displayUnique} / ${item.total || 0}`;
                    }

                    if (stat.key === 'connected') {
                      displayValue = item.connected || 0;
                    }

                    if (stat.key === 'total_connected_duration') {
                      const totalSecs = parseInt(item.total_duration, 10) || 0;
                      displayValue = formatDuration(totalSecs);
                    }

                    return (
                      <td
                        key={stat.key}
                        onClick={() => onStateChange(stat.state)}
                        className={`px-4 py-2 text-center cursor-pointer transition-colors border-r border-slate-200/60 ${isSelected
                          ? `${stat.selectedClasses} font-bold`
                          : 'text-slate-600 font-bold hover:bg-slate-100/50'
                          }`}
                      >
                        <span className="text-[12px] tracking-tight tabular-nums font-bold">{displayValue}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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

const MatchMakingNew = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchParams, setSearchParams] = useState({
    unique_id: '', name: '', mobile: '', email: '', state: '', role: '', assigned_to: '', call_status: '', last_call_process: '', start_date: '', end_date: '', per_page: 50, page: 1
  });
  const [selectedLeadState, setSelectedLeadState] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // IVR Export State
  const { isExportingIvr, exportIvrProgress, startIvrExport } = useExport();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  useEffect(() => {
    if (selectedLead) setShowFullHistory(false);
  }, [selectedLead]);

  // Fetching Logic — Match Making Dashboard (does NOT change with filters)
  const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchStats } = useQuery({
    queryKey: ['matchmaking-dashboard', date],
    queryFn: () => leadsApi.getLeadsCallsNew({ date })
  });

  const { data: listData, isLoading: isListLoading, refetch: refetchList, isFetching: isListFetching } = useQuery({
    queryKey: ['matchmaking-list', date, searchParams, selectedLeadState],
    queryFn: () => {
      const finalEndDate = (!searchParams.end_date && searchParams.start_date) ? format(new Date(), 'yyyy-MM-dd') : searchParams.end_date;
      const finalParams = { 
        date, 
        ...searchParams, 
        end_date: finalEndDate,
        call_status: selectedLeadState || searchParams.call_status 
      };
      return leadsApi.getLeadsCallsList(finalParams);
    }
  });

  const { data: statesResponse } = useQuery({ queryKey: ['all-states'], queryFn: () => leadsApi.getStates(), staleTime: Infinity });
  const { data: telechampsResponse } = useQuery({ queryKey: ['all-telechamps'], queryFn: () => leadsApi.getTelechamps(), staleTime: Infinity });

  const { data: callHistoryResponse, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['lead-call-history', selectedLead?.mobile],
    queryFn: () => leadsApi.getCallHistoryByMobile(selectedLead.mobile),
    enabled: !!selectedLead?.mobile
  });

  const callHistory = callHistoryResponse?.data || [];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const hasActiveFilter = !!(searchParams.assigned_to || searchParams.start_date || searchParams.end_date || searchParams.state || searchParams.role || searchParams.search || searchParams.call_status);
  const overall = (hasActiveFilter ? listData?.today_calls : dashboardData?.data?.today_calls)
    || { total_calls: 0, connected: 0, callback_later: 0, not_connected: 0, feedback_pending: 0 };
  const states = statesResponse?.data || [];
  const telechamps = telechampsResponse?.data || [];
  const activeTelechamps = telechamps.filter(t => t.role === 'telecaller');
  const resignedTelechamps = telechamps.filter(t => t.role === 'telecallers');
  const isResignedActive = searchParams.assigned_to === 'others' || 
    resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to);

  // Always use dashboard's assigned_wise for FULL team list (Performance Summary + dropdown)
  const dashboardAssignedWise = dashboardData?.data?.assigned_wise || [];
  const listAssignedWise = listData?.assigned_wise || [];
  const statsMap = new Map(listAssignedWise.map(item => [item.assigned_to, item]));
  const assignedWise = dashboardAssignedWise.map(baseItem => {
    const listStats = statsMap.get(baseItem.assigned_to);
    if (listStats) {
      return { ...baseItem, ...listStats };
    }
    if (hasActiveFilter) {
      return {
        ...baseItem,
        total: 0,
        unique: 0,
        unique_users: 0,
        connected: 0,
        unique_connected: 0,
        callback_later: 0,
        unique_callback: 0,
        not_connected: 0,
        unique_not_connected: 0,
        fresh: 0,
        unique_pending: 0,
        total_connected_duration: 0,
        total_duration: 0
      };
    }
    return baseItem;
  });

  const selectedTelechampName = searchParams.assigned_to
    ? (dashboardAssignedWise.find(t => String(t.assigned_to) === String(searchParams.assigned_to))?.admin_name ||
       telechamps.find(t => String(t.caller_id) === String(searchParams.assigned_to))?.caller_name || 'System')
    : null;

  let leads = listData?.data || [];

  // Simple ID filter
  // Removed frontend filtering for assigned_to and last_call_process because the API handles it

  // Sort leads by last_call_time in descending order (most recent first)
  leads = [...leads].sort((a, b) => {
    const timeA = a.last_call_time ? new Date(a.last_call_time).getTime() : 0;
    const timeB = b.last_call_time ? new Date(b.last_call_time).getTime() : 0;
    return timeB - timeA;
  });
  const pagination = listData?.pagination || {};
  const statusCounts = listData?.status_counts || {};
  const statusCallsCounts = listData?.status_calls_counts || {};

  const renderStatusOption = (val, label) => {
    const leads = statusCounts[val] || 0;
    const calls = statusCallsCounts[val] || 0;
    if (!leads && !calls) return label;
    return `${label} (${leads} leads, ${calls} calls)`;
  };

  const handleExport = async () => {
    try {
      const finalEndDate = (!searchParams.end_date && searchParams.start_date) ? format(new Date(), 'yyyy-MM-dd') : searchParams.end_date;
      const finalParams = { 
        date, 
        ...searchParams, 
        end_date: finalEndDate,
        call_status: selectedLeadState || searchParams.call_status,
        per_page: 9999, // Get all records
        page: 1
      };
      const toastId = toast.loading('Exporting data...');
      const response = await leadsApi.getLeadsCallsList(finalParams);
      
      if (response?.data && response.data.length > 0) {
        let exportLeads = response.data;

        // Apply frontend filters to match UI
        // Removed assigned_to and last_call_process frontend filter since the API handles it

        // Sort export leads by last_call_time in descending order (most recent first) matching the UI
        exportLeads.sort((a, b) => {
          const timeA = a.last_call_time ? new Date(a.last_call_time).getTime() : 0;
          const timeB = b.last_call_time ? new Date(b.last_call_time).getTime() : 0;
          return timeB - timeA;
        });

        const exportData = exportLeads.map(lead => ({
          'Name': lead.name || '',
          'TMID': lead.unique_id || '',
          'Role': lead.role ? lead.role.toLowerCase() : '',
          'Registered Date': lead.registered_at && lead.registered_at !== '0000-00-00 00:00:00' ? formatDate(lead.registered_at).toLowerCase() : 'pending',
          'Assigned Telechamp': lead.telechamp_name || 'System',
          'Location': lead.state_name || 'Others',
          'Call Status': lead.final_status ? lead.final_status.replace(/_/g, ' ').toLowerCase() : '',
          'Last Call Date Time': lead.last_call_time ? formatDate(lead.last_call_time).toLowerCase() : '',
          'Total Calls': lead.total_calls ?? 0,
          'Last Two Calls Difference': lead.total_calls > 1 && lead.last_two_calls_diff ? lead.last_two_calls_diff : ''
        }));

        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(fieldName => `"${String(row[fieldName]).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Call_Records_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export completed!', { id: toastId });
      } else {
        toast.error('No data found to export', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  const handleExportIvr = () => {
    startIvrExport(exportStartDate, exportEndDate);
    setIsExportModalOpen(false);
  };


  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">
      {/* Modern Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Target className="w-5 h-5 text-indigo-600" />
            All Call Records
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
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Call History
          </button>
          
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title="Total Calls" value={overall.total_calls} icon={Users} gradient="bg-indigo-600" isSelected={selectedLeadState === ''} onClick={() => setSelectedLeadState('')} />
        <StatCard title="Connected" value={overall.connected} icon={CheckCircle2} gradient="bg-emerald-600" isSelected={selectedLeadState === 'connected'} onClick={() => setSelectedLeadState('connected')} />
        <StatCard title="Not Connected" value={overall.not_connected} icon={PhoneMissed} gradient="bg-red-600" isSelected={selectedLeadState === 'not_connected'} onClick={() => setSelectedLeadState('not_connected')} />
        <StatCard title="Callback" value={overall.callback_later} icon={PhoneOff} gradient="bg-orange-600" isSelected={selectedLeadState === 'callback_later'} onClick={() => setSelectedLeadState('callback_later')} />
        <StatCard title="Feedback Pending" value={overall.feedback_pending} icon={ListTodo} gradient="bg-blue-600" isSelected={selectedLeadState === 'feedback_pending'} onClick={() => setSelectedLeadState('feedback_pending')} />
      </div>

      <AssignmentSummary assignedCount={assignedWise} selectedState={selectedLeadState} onStateChange={setSelectedLeadState} totalUnique={pagination.total} totalAttempted={overall.total_calls} filteredTelechampId={searchParams.assigned_to} />

      {/* Unified Leads Command Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
        {/* Card Header */}
        <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">All Call Records Today</span>
            {pagination.total > 0 && (
              <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-xs uppercase tracking-wider ml-1">
                {pagination.total} total
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-55 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
        </div>

        {/* Integrated Filter Bar — Clean Professional Styling */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FilterBox
                name="search"
                icon={Search}
                placeholder="Search by ID, Name, Mobile, Email..."
                value={searchParams.search || ""}
                onChange={handleFilterChange}
                className="h-9 text-[12px]"
              />
            </div>
            <button
              onClick={() =>
                setSearchParams({
                  unique_id: '', name: '', mobile: '', email: '', state: '', role: '', assigned_to: '', call_status: '', last_call_process: '', per_page: 50, page: 1, start_date: '', end_date: ''
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
              <option value="">Select Team</option>
              {dashboardAssignedWise.length > 0 ? (
                [...dashboardAssignedWise]
                  .filter(t => t.assigned_to && !resignedTelechamps.some(r => String(r.caller_id) === String(t.assigned_to)))
                  .sort((a, b) => (a.admin_name || '').localeCompare(b.admin_name || ''))
                  .map(t => (
                    <option key={t.assigned_to} value={t.assigned_to}>
                      {t.admin_name}
                    </option>
                  ))
              ) : (
                [...activeTelechamps]
                  .sort((a, b) => (a.caller_name || '').localeCompare(b.caller_name || ''))
                  .map(t => (
                    <option key={t.caller_id} value={t.caller_id}>
                      {t.caller_name}
                    </option>
                  ))
              )}
              <option value="others" style={{ fontWeight: 'bold', backgroundColor: '#fef3c7' }}>Others</option>
            </FilterSelect>

            {isResignedActive && (
              <div className="relative group flex-1">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 z-10" />
                <select
                  name="assigned_to"
                  value={searchParams.assigned_to === 'others' ? "" : searchParams.assigned_to}
                  onChange={(e) => {
                    const val = e.target.value || 'others';
                    setSearchParams(prev => ({ ...prev, assigned_to: val, page: 1 }));
                  }}
                  className="w-full !pl-9 pr-8 py-1.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[12px] font-bold text-amber-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-400 outline-hidden transition-all appearance-none cursor-pointer h-9"
                >
                  <option value="">All Others</option>
                  {resignedTelechamps.map(t => (
                    <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-amber-500" />
              </div>
            )}

            <FilterSelect name="role" icon={Briefcase} value={searchParams.role} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">All Roles</option>
              {['driver', 'transporter', 'dhaba', 'puncture', 'association', 'foreman'].map(r => (
                <option key={r} value={r}>{r.toUpperCase()}</option>
              ))}
            </FilterSelect>

            <FilterSelect name="call_status" icon={Phone} value={searchParams.call_status} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">All Call Status</option>
              <option value="connected">{renderStatusOption('connected', 'Connected')}</option>
              <option value="not_connected">{renderStatusOption('not_connected', 'Not Connected')}</option>
              <option value="callback_later">{renderStatusOption('callback_later', 'Callback Later')}</option>
              <option value="feedback_pending">{renderStatusOption('feedback_pending', 'Feedback Pending')}</option>
              <option value="fresh">{renderStatusOption('fresh', 'Fresh')}</option>
            </FilterSelect>

            <FilterSelect name="last_call_process" icon={ListTodo} value={searchParams.last_call_process} onChange={handleFilterChange} className="h-9 text-[12px]">
              <option value="">All Processes</option>
              {['Onboarding', 'Match Making', 'Job Details', 'Verification', 'Incoming Call', 'Driver Bank', 'Callback Request', 'Agree for Subscription', 'Social Leads', 'Others'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
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

        {/* Clean Data Table */}
        <div className="overflow-x-auto min-h-[400px] w-full bg-white">
          <table className="w-full text-left border-collapse border border-slate-200/60">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="pl-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Leads</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Contact</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Team / Location</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Status</th>
                <th className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200/60">Calls</th>
                <th className="pr-4 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {isListLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-6 border-b border-slate-200/60"><div className="h-10 bg-slate-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching records found for this criteria</p>
                      <button
                        onClick={() => setSearchParams({ unique_id: '', name: '', mobile: '', email: '', state: '', role: '', assigned_to: '', call_status: '', last_call_process: '', start_date: '', end_date: '', per_page: 50, page: 1 })}
                        className="text-indigo-600 font-black text-[10px] uppercase hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : leads.map((lead, index) => (
                <tr key={`${lead.user_id || 'null'}-${lead.mobile || 'nomobile'}-${lead.unique_id || 'nouid'}-${index}`} className="hover:bg-slate-55 transition-colors odd:bg-white even:bg-slate-50/10">
                  <td className="pl-4 py-2 border-r border-slate-200/60">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="font-bold text-slate-900 text-[12px] truncate max-w-[150px]" title={lead.name}>{lead.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider text-white ${lead.role?.toLowerCase() === 'driver' ? 'bg-blue-600' : 'bg-[#7c79f9]'}`}>
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
                      <span className="text-[9px] text-slate-400 font-bold uppercase truncate block">
                        {lead.registered_at && lead.registered_at !== '0000-00-00 00:00:00'
                          ? formatDate(lead.registered_at)
                          : 'REGISTRATION PENDING'}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60">
                    <div className="text-slate-700 font-bold text-[12px] tabular-nums leading-none mb-1.5">{lead.mobile}</div>
                    <div className="text-slate-400 text-[9px] font-bold uppercase truncate max-w-[120px]">{lead.email ? lead.email.toUpperCase() : 'NO EMAIL'}</div>
                  </td>

                  <td className="px-3 py-2 border-r border-slate-200/60 w-[140px]">
                      {selectedTelechampName ? (
                        <>
                          <span className="text-slate-700 font-bold text-[12px] truncate max-w-[100px] block">{selectedTelechampName}</span>
                          <span className="text-slate-500 font-bold text-[9px] uppercase mt-0.5 block">Assignee: {lead.telechamp_name || 'System'}</span>
                        </>
                      ) : (
                        <span className="text-slate-700 font-bold text-[12px] truncate max-w-[100px] block">{lead.last_caller_name || '-'}</span>
                      )}
                      <span className="text-indigo-600 font-bold text-[9px] uppercase mt-0.5 block">{lead.state_name || 'Others'}</span>
                    </td>

                  <td className="px-3 py-2 border-r border-slate-200/60 max-w-[200px]">
                    <div className="flex flex-col w-full">
                      {(() => {
                        const st = lead.final_status;
                        let badgeClass = "text-slate-500 border-slate-200 bg-slate-50/50";
                        if (st === 'fresh') badgeClass = "text-blue-500 border-blue-200 bg-blue-50/50";
                        else if (st === 'not_connected') badgeClass = "text-red-500 border-red-200 bg-red-50/50";
                        else if (st === 'callback_later') badgeClass = "text-orange-500 border-orange-200 bg-orange-50/50";
                        else if (st === 'connected') badgeClass = "text-emerald-500 border-emerald-200 bg-emerald-50/50";

                        const isFeedbackPending = lead.total_calls > 0 && lead.final_status === 'fresh';
                        if (isFeedbackPending) badgeClass = "text-amber-600 border-amber-200 bg-amber-50/50";

                        return (
                          <span className={`text-[11px] font-black uppercase tracking-tight leading-none ${badgeClass} mb-1 w-max border px-1.5 py-0.5 rounded-sm`}>
                            {isFeedbackPending ? 'Feedback Pending' : (st === 'fresh' ? 'Pending' : st?.replace('_', ' '))}
                          </span>
                        );
                      })()}
                      <div className="mt-1.5 flex flex-col gap-0.5 w-full">
                        <span className="text-[8px] text-slate-400 font-bold uppercase leading-none truncate" title="Last Call Start Time">
                          S: {lead.last_call_time ? formatDate(lead.last_call_time) : '-'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase leading-none truncate" title="Last Call End Time">
                          E: {lead.last_call_updated_at ? formatDate(lead.last_call_updated_at) : '-'}
                        </span>
                        <span className="text-[8px] mt-1 text-slate-400 font-bold uppercase leading-tight flex" title={lead.last_call_process || lead.process || "Process"}>
                          <span className="mr-1 shrink-0">Process:</span> <span className="text-slate-600 truncate">{lead.last_call_process || lead.process || '-'}</span>
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase leading-tight mt-0.5 flex" title={lead.last_call_feedback || "Feedback"}>
                          <span className="mr-1 shrink-0">FB:</span> <span className="text-slate-600 truncate">{lead.last_call_feedback || '-'}</span>
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase leading-tight flex" title={lead.last_call_remarks || "Remarks"}>
                          <span className="mr-1 shrink-0">RM:</span> <span className="text-slate-600 truncate">{lead.last_call_remarks || '-'}</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-center border-r border-slate-200/60">
                    <span className="text-[12px] font-black text-slate-700 tabular-nums block">{lead.total_calls ?? 0}</span>
                    {lead.total_calls > 1 && lead.last_two_calls_diff && (
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm uppercase mt-1 block w-max mx-auto" title="Time since previous call">
                        diff: {lead.last_two_calls_diff}
                      </span>
                    )}
                  </td>

                  <td className="pr-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.total_calls === 0 && (
                        <button className="p-1 text-[#2563eb] hover:bg-slate-50 rounded-sm" title="Call">
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}
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
              <PageJump page={pagination.current_page} totalPages={pagination.last_page} onGo={(n) => setSearchParams((p) => ({ ...p, page: n }))} />
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
                    <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Call Activity Log</span>
                      </div>
                      {(() => {
                        const searchFilterText = (searchParams.search || '').trim().toLowerCase();
                        const hasJobIdMatch = searchFilterText ? callHistory.some(call => call.job_id && String(call.job_id).trim().toLowerCase().includes(searchFilterText)) : false;
                        const showFilterButton = searchParams.assigned_to || hasJobIdMatch;

                        return showFilterButton && (
                          <button 
                            onClick={() => setShowFullHistory(!showFullHistory)}
                            className="text-[9px] font-bold px-2 py-1 rounded-sm bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors uppercase"
                          >
                            {showFullHistory ? 'View Filtered Call History' : 'View Full History'}
                          </button>
                        );
                      })()}
                    </div>
                    <div className="p-3">
                      {isHistoryLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map(i => <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-lg" />)}
                        </div>
                      ) : (() => {
                        const searchFilterText = (searchParams.search || '').trim().toLowerCase();
                        const hasJobIdMatch = searchFilterText ? callHistory.some(call => call.job_id && String(call.job_id).trim().toLowerCase().includes(searchFilterText)) : false;

                        let displayHistory = callHistory;
                        if (!showFullHistory) {
                          displayHistory = callHistory.filter(call => {
                            let matchAssigned = true;
                            let matchJob = true;

                            if (searchParams.assigned_to) {
                              matchAssigned = String(call.assigned_to) === String(searchParams.assigned_to);
                            }
                            if (hasJobIdMatch) {
                              matchJob = call.job_id && String(call.job_id).trim().toLowerCase().includes(searchFilterText);
                            }

                            return matchAssigned && matchJob;
                          });
                        }

                        return displayHistory.length > 0 ? (
                          <div className="space-y-3">
                            {displayHistory.map((call, idx) => (
                            <div key={call.id || idx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${call.call_status === 'connected' || call.call_status === 'ANSWER' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    <Phone className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semi-bold text-slate-800 uppercase leading-none mb-1">{call.call_status?.replace('_', ' ')}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{call.call_start_time} • {call.call_type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] sm:self-center">
                                  {call.job_id && (
                                    <div className="text-right">
                                      <span className="text-slate-400 font-bold uppercase text-[8px] block leading-none mb-1">Job ID</span>
                                      <span className="text-indigo-600 font-black bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-100 shadow-xs">{String(call.job_id).trim()}</span>
                                    </div>
                                  )}
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
                      );
                    })()}
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

      {/* IVR Export Modal */}
      {isExportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => !isExportingIvr && setIsExportModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-indigo-600 flex items-center justify-between">
              <h3 className="text-white font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Call History
              </h3>
              <button 
                onClick={() => !isExportingIvr && setIsExportModalOpen(false)}
                className="text-indigo-100 hover:text-white transition-colors"
                disabled={isExportingIvr}
              >
                <FilterX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date (Optional)</label>
                <input 
                  type="date" 
                  value={exportStartDate} 
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  disabled={isExportingIvr}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date (Optional)</label>
                <input 
                  type="date" 
                  value={exportEndDate} 
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  disabled={isExportingIvr}
                />
              </div>

              {isExportingIvr ? (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <span>Exporting in background...</span>
                    <span>{exportIvrProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${exportIvrProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={handleExportIvr}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
                  >
                    Start Export
                  </button>
                </div>
              )}
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

export default MatchMakingNew;
