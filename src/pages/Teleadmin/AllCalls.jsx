import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import {
  PhoneCall,
  Calendar,
  Download,
  RotateCw,
  Search,
  Filter,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  PhoneOff,
  AlertCircle,
  Play,
  Pause,
  X,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Volume2,
  Loader2
} from 'lucide-react';

export default function AllCalls() {
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [selectedRole, setSelectedRole] = useState('Telecaller');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedProcess, setSelectedProcess] = useState('All');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsList, setRecordsList] = useState([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const itemsPerPage = 6;

  // UI State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedCallModal, setSelectedCallModal] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchAllCalls = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/all-calls', {
        params: {
          search: searchQuery.trim(),
          status: selectedStatus,
          agent: selectedTeam,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data?.data) {
        const mapped = res.data.data.data.map(c => ({
          id: c.id,
          company: c.user_name || 'Caller / Transporter',
          contactPerson: c.user_name || 'Driver / Caller',
          role: c.user_role ? c.user_role.charAt(0).toUpperCase() : 'D',
          tmid: c.user_tmid || `TM${c.caller_id}`,
          regDate: 'Recent',
          phone: c.caller_id || '--',
          email: `${(c.user_name || 'caller').toLowerCase().replace(/[^a-z0-9]/g, '')}@truckmitr.com`,
          telechamp: c.agent_name?.replace('@TruckMitr', '') || 'Telechamp',
          telechampInitials: (c.agent_name || 'TC').slice(0, 2).toUpperCase(),
          location: c.user_city ? `${c.user_city}` : 'India',
          status: c.call_missed_flag === 'C' ? 'Connected' : 'Not Connected',
          time: c.start_time ? new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:45 PM',
          process: 'Telecaller IVR',
          remarks: `Ext ${c.extension_no || '--'} • Duration: ${c.agent_durn || c.durn_formatted || '00:00:10'}`,
          calls: 1,
          duration: c.agent_durn || c.durn_formatted || '00:00:30',
          source: c.call_type || 'Outbound Dialer',
          jobId: `JOB-${c.id}`,
          feedback: c.call_missed_flag === 'C' ? 'Positive' : 'Missed',
          history: [
            {
              id: c.id,
              status: c.call_missed_flag === 'C' ? 'Connected' : 'Not Connected',
              time: c.start_time || 'Recent',
              duration: c.agent_durn || c.durn_formatted || '00:00:30',
              source: c.call_type || 'Outbound Dialer',
              jobId: `JOB-${c.id}`,
              process: 'Telecaller IVR',
              feedback: c.call_missed_flag === 'C' ? 'Answered' : 'Missed',
              remarks: `Call recording logged with extension ${c.extension_no || '--'}`
            }
          ]
        }));
        setRecordsList(mapped);
        setTotalRecordsCount(res.data.data.total);
        setApiTotalPages(res.data.data.last_page);
      }
    } catch (err) {
      console.error('Failed to load call telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllCalls();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedTeam, currentPage]);

  const handleRefresh = () => {
    fetchAllCalls();
    showToast('Call records and IVR telemetry synchronized!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('All');
    setSelectedTeam('All');
    setSelectedRole('Telecaller');
    setSelectedStatus('All');
    setSelectedProcess('All');
    setCurrentPage(1);
    showToast('Filters reset to default.');
  };

  // Audio Play Simulation
  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Export Call History CSV
  const handleExportHistory = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Lead / Company', 'Role', 'TMID', 'Phone', 'Email', 'Telechamp', 'State', 'Status', 'Process', 'Calls', 'Duration', 'Remarks'],
        ...callRecords.map(c => [
          `"${c.company}"`,
          `"${c.role}"`,
          `"${c.tmid}"`,
          `"${c.phone}"`,
          `"${c.email}"`,
          `"${c.telechamp}"`,
          `"${c.location}"`,
          `"${c.status}"`,
          `"${c.process}"`,
          c.calls,
          `"${c.duration}"`,
          `"${c.remarks}"`
        ])
      ]
        .map(e => e.join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `truckmitr_call_records_12-10-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Call history exported successfully.');
  };

  // Performance Summary Dataset
  const agentPerformance = [
    {
      id: 1,
      name: 'Aman Kumar',
      initials: 'AK',
      colorBg: 'bg-indigo-100 text-indigo-700',
      uniqueAttempted: '42 / 55',
      connected: 24,
      duration: '01:45:20',
      notConnected: 28,
      callback: 2,
      feedbackPending: 1
    },
    {
      id: 2,
      name: 'Priya Sharma',
      initials: 'PS',
      colorBg: 'bg-slate-200 text-slate-700',
      uniqueAttempted: '38 / 48',
      connected: 21,
      duration: '01:32:10',
      notConnected: 24,
      callback: 3,
      feedbackPending: 0
    },
    {
      id: 3,
      name: 'Rahul Verma',
      initials: 'RV',
      colorBg: 'bg-blue-100 text-blue-700',
      uniqueAttempted: '50 / 65',
      connected: 32,
      duration: '02:15:40',
      notConnected: 30,
      callback: 1,
      feedbackPending: 2
    }
  ];

  // Call Records Dataset (Matching HTML)
  const callRecords = [
    {
      id: 1,
      company: 'Rajesh Transport Co.',
      contactPerson: 'Rajesh Kumar',
      role: 'D',
      tmid: 'TM-98234',
      regDate: '10 Oct 2026',
      phone: '+91 98765 43210',
      email: 'rajesh.transport@gmail.com',
      telechamp: 'Aman Kumar',
      telechampInitials: 'AK',
      location: 'Haryana (HR)',
      status: 'Connected',
      time: '12:45 PM',
      process: 'Onboarding',
      remarks: 'Interested in FASTag bulk recharge and fleet GPS integration.',
      calls: 2,
      duration: '02:45',
      source: 'Outbound Dialer',
      jobId: 'JOB-88392',
      feedback: 'Positive',
      history: [
        {
          id: 101,
          status: 'Connected',
          time: '12 Oct 2026, 12:45 PM',
          duration: '02:45',
          source: 'Outbound Dialer',
          jobId: 'JOB-88392',
          process: 'Onboarding',
          feedback: 'Positive',
          remarks: 'Fleet owner agreed to onboard 15 trucks onto the TruckMitr platform. Sent payment link for FASTag bulk recharge.'
        },
        {
          id: 102,
          status: 'Not Connected',
          time: '11:10 AM',
          duration: '00:15',
          source: 'Outbound Dialer',
          jobId: 'JOB-88350',
          process: 'Onboarding',
          feedback: 'Unreachable',
          remarks: 'Call dropped due to poor network coverage on receiver end.'
        }
      ]
    },
    {
      id: 2,
      company: 'Balaji Logistics',
      contactPerson: 'Balaji Rao',
      role: 'T',
      tmid: 'TM-98235',
      regDate: '09 Oct 2026',
      phone: '+91 91234 56789',
      email: 'balaji.logistics@yahoo.com',
      telechamp: 'Priya Sharma',
      telechampInitials: 'PS',
      location: 'Maharashtra (MH)',
      status: 'Not Connected',
      time: '11:30 AM',
      process: 'Verification',
      remarks: 'Phone ringing, no response after 6 rings. Will retry.',
      calls: 1,
      duration: '00:30',
      source: 'Outbound Dialer',
      jobId: 'JOB-88344',
      feedback: 'Ringing No Answer',
      history: [
        {
          id: 201,
          status: 'Not Connected',
          time: '12 Oct 2026, 11:30 AM',
          duration: '00:30',
          source: 'Outbound Dialer',
          jobId: 'JOB-88344',
          process: 'Verification',
          feedback: 'Ringing No Answer',
          remarks: 'Phone ringing, no response after 6 rings. Will retry in afternoon slot.'
        }
      ]
    },
    {
      id: 3,
      company: 'Kavita Freight Carriers',
      contactPerson: 'Kavita Singh',
      role: 'D',
      tmid: 'TM-98236',
      regDate: '08 Oct 2026',
      phone: '+91 99887 76655',
      email: 'kavita.freight@outlook.com',
      telechamp: 'Rahul Verma',
      telechampInitials: 'RV',
      location: 'Punjab (PB)',
      status: 'Callback',
      time: '10:15 AM',
      process: 'Support',
      remarks: 'Requested callback at 4:00 PM regarding insurance claim.',
      calls: 3,
      duration: '01:20',
      source: 'Inbound IVR',
      jobId: 'JOB-88320',
      feedback: 'Scheduled Callback',
      history: [
        {
          id: 301,
          status: 'Callback',
          time: '12 Oct 2026, 10:15 AM',
          duration: '01:20',
          source: 'Inbound IVR',
          jobId: 'JOB-88320',
          process: 'Support',
          feedback: 'Scheduled Callback',
          remarks: 'Requested callback at 4:00 PM regarding insurance claim renewal.'
        }
      ]
    },
    {
      id: 4,
      company: 'Om Express Logistics',
      contactPerson: 'Om Prakash',
      role: 'T',
      tmid: 'TM-98237',
      regDate: '07 Oct 2026',
      phone: '+91 98110 22334',
      email: 'om.express@gmail.com',
      telechamp: 'Aman Kumar',
      telechampInitials: 'AK',
      location: 'Delhi NCR',
      status: 'Connected',
      time: '09:50 AM',
      process: 'Onboarding',
      remarks: 'Discussed fleet tracking devices and driver hiring availability.',
      calls: 2,
      duration: '03:10',
      source: 'Outbound Dialer',
      jobId: 'JOB-88310',
      feedback: 'Interested',
      history: [
        {
          id: 401,
          status: 'Connected',
          time: '12 Oct 2026, 09:50 AM',
          duration: '03:10',
          source: 'Outbound Dialer',
          jobId: 'JOB-88310',
          process: 'Onboarding',
          feedback: 'Interested',
          remarks: 'Discussed fleet tracking devices and driver hiring availability.'
        }
      ]
    },
    {
      id: 5,
      company: 'Shrinath Roadlines',
      contactPerson: 'Shrinath Meena',
      role: 'D',
      tmid: 'TM-98238',
      regDate: '06 Oct 2026',
      phone: '+91 94140 11992',
      email: 'shrinath.roadlines@rediffmail.com',
      telechamp: 'Rahul Verma',
      telechampInitials: 'RV',
      location: 'Rajasthan (RJ)',
      status: 'Not Connected',
      time: '09:20 AM',
      process: 'Verification',
      remarks: 'Subscriber temporarily out of coverage area.',
      calls: 1,
      duration: '00:10',
      source: 'Outbound Dialer',
      jobId: 'JOB-88290',
      feedback: 'Out of Coverage',
      history: [
        {
          id: 501,
          status: 'Not Connected',
          time: '12 Oct 2026, 09:20 AM',
          duration: '00:10',
          source: 'Outbound Dialer',
          jobId: 'JOB-88290',
          process: 'Verification',
          feedback: 'Out of Coverage',
          remarks: 'Subscriber temporarily out of coverage area.'
        }
      ]
    },
    {
      id: 6,
      company: 'Golden Highway Carriers',
      contactPerson: 'Hasmukh Patel',
      role: 'T',
      tmid: 'TM-98239',
      regDate: '05 Oct 2026',
      phone: '+91 98980 44556',
      email: 'golden.highway@gmail.com',
      telechamp: 'Priya Sharma',
      telechampInitials: 'PS',
      location: 'Gujarat (GJ)',
      status: 'Connected',
      time: '08:45 AM',
      process: 'Support',
      remarks: 'Driver KYC successfully verified and approved on portal.',
      calls: 2,
      duration: '01:50',
      source: 'Inbound IVR',
      jobId: 'JOB-88275',
      feedback: 'Resolved',
      history: [
        {
          id: 601,
          status: 'Connected',
          time: '12 Oct 2026, 08:45 AM',
          duration: '01:50',
          source: 'Inbound IVR',
          jobId: 'JOB-88275',
          process: 'Support',
          feedback: 'Resolved',
          remarks: 'Driver KYC successfully verified and approved on portal.'
        }
      ]
    }
  ];

  // Filtering Logic
  const filteredRecords = useMemo(() => {
    const sourceRecords = recordsList.length > 0 ? recordsList : callRecords;
    return sourceRecords.filter(record => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesComp = record.company?.toLowerCase().includes(q);
        const matchesPhone = record.phone?.includes(q);
        const matchesTmid = record.tmid?.toLowerCase().includes(q);
        const matchesAgent = record.telechamp?.toLowerCase().includes(q);
        if (!matchesComp && !matchesPhone && !matchesTmid && !matchesAgent) {
          return false;
        }
      }

      if (selectedState !== 'All' && !record.location?.includes(selectedState)) {
        return false;
      }

      if (selectedTeam !== 'All' && record.telechamp !== selectedTeam) {
        return false;
      }

      if (selectedStatus !== 'All' && record.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [recordsList, searchQuery, selectedState, selectedTeam, selectedStatus]);

  // Pagination
  const totalPages = apiTotalPages > 1 ? apiTotalPages : (Math.ceil(filteredRecords.length / itemsPerPage) || 1);
  const paginatedRecords = recordsList.length > 0 ? filteredRecords : filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Connected':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Connected
          </span>
        );
      case 'Not Connected':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Not Connected
          </span>
        );
      case 'Callback':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Callback
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span> Pending
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1">
            Afternoon Greeting
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">WELCOME BACK, CHANDARBHAN</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is the real-time telephony overview and operational call audit log for TruckMitr.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Live Telephony Feed
          </span>
        </div>
      </div>

      {/* Page Header & Date Range Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <PhoneCall className="w-4 h-4" />
            </span>
            All Call Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive tracking of all inbound and outbound telecaller interactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>12 OCTOBER 2026, 12:00 AM - 12 OCTOBER 2026, 11:59 PM</span>
          </div>

          <button
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Call History</span>
          </button>

          <button
            onClick={handleRefresh}
            title="Refresh Call Records"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Calls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Calls</div>
            <div className="text-2xl font-black text-slate-900 mt-1">507</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Inbound / Outbound</span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">100%</span>
          </div>
        </div>

        {/* Connected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">200</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Success Rate</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">39.4%</span>
          </div>
        </div>

        {/* Not Connected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Not Connected</div>
            <div className="text-2xl font-black text-rose-600 mt-1">295</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Busy / Unreachable</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">58.2%</span>
          </div>
        </div>

        {/* Callback */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Callback</div>
            <div className="text-2xl font-black text-amber-600 mt-1">9</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Scheduled</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">1.8%</span>
          </div>
        </div>

        {/* Feedback Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Feedback Pending</div>
            <div className="text-2xl font-black text-purple-600 mt-1">3</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Review Required</span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">0.6%</span>
          </div>
        </div>
      </div>

      {/* Performance Summary Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Performance Summary</h3>
          <span className="text-[11px] font-semibold text-slate-400">Telechamp Agent Metrics</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3 px-4">Telechamp</th>
                <th className="py-3 px-4">Unique / Attempted</th>
                <th className="py-3 px-4 text-emerald-600">Connected</th>
                <th className="py-3 px-4">All Duration</th>
                <th className="py-3 px-4 text-rose-600">Not Connected</th>
                <th className="py-3 px-4 text-amber-600">Callback</th>
                <th className="py-3 px-4 text-purple-600">Feedback Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {agentPerformance.map(agent => (
                <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${agent.colorBg} flex items-center justify-center text-[10px] font-bold`}>
                      {agent.initials}
                    </div>
                    <span>{agent.name}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{agent.uniqueAttempted}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">{agent.connected}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{agent.duration}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{agent.notConnected}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">{agent.callback}</td>
                  <td className="py-3 px-4 text-purple-600 font-semibold">{agent.feedbackPending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Call Records Today Section & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">All Call Records Today</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold">
              318 Total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search phone, lead name..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reset
            </button>

            <button
              onClick={handleRefresh}
              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdown Bar */}
        {showFiltersPanel && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">State</label>
              <select
                value={selectedState}
                onChange={e => { setSelectedState(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="All">All States</option>
                <option value="Haryana">Haryana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Punjab">Punjab</option>
                <option value="Delhi">Delhi</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Gujarat">Gujarat</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Team</label>
              <select
                value={selectedTeam}
                onChange={e => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="All">All Telechamps</option>
                <option value="Aman Kumar">Aman Kumar</option>
                <option value="Priya Sharma">Priya Sharma</option>
                <option value="Rahul Verma">Rahul Verma</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="All">All Call Status</option>
                <option value="Connected">Connected</option>
                <option value="Not Connected">Not Connected</option>
                <option value="Callback">Callback</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Process</label>
              <select
                value={selectedProcess}
                onChange={e => { setSelectedProcess(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="All">All Processes</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Verification">Verification</option>
                <option value="Support">Support</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Active Filter Pills (Matching HTML) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-bold text-slate-800 text-[11px]">Active Filters:</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
            States: {selectedState} <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
            Team: {selectedTeam} <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
            Roles: {selectedRole} <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
            Call Status: {selectedStatus} <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium flex items-center gap-1">
            Processes: {selectedProcess} <ChevronDown className="w-3 h-3 text-slate-400" />
          </span>
        </div>
      </div>

      {/* Comprehensive Call Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Team / Location</th>
                <th className="py-3 px-4">Status & Remarks</th>
                <th className="py-3 px-4 text-center">Calls</th>
                <th className="py-3 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No call records found matching criteria.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-indigo-600 hover:underline font-bold mt-1 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Leads */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{record.company}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              record.role === 'T' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {record.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
                          TMID: {record.tmid} • Reg: {record.regDate}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col">
                        <a
                          href={`tel:${record.phone}`}
                          className="font-semibold text-slate-800 hover:text-indigo-600"
                        >
                          {record.phone}
                        </a>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{record.email}</span>
                      </div>
                    </td>

                    {/* Team / Location */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{record.telechamp}</span>
                        <span className="text-[11px] text-purple-600 font-semibold">{record.location}</span>
                      </div>
                    </td>

                    {/* Status & Remarks */}
                    <td className="py-3.5 px-4 align-top max-w-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {record.time} • {record.process}
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {record.remarks}
                        </span>
                      </div>
                    </td>

                    {/* Calls */}
                    <td className="py-3.5 px-4 align-top text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-700 text-xs">
                        {record.calls} {record.calls === 1 ? 'Call' : 'Calls'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right pr-6">
                      <button
                        onClick={() => setSelectedCallModal(record)}
                        title="View Call Console"
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredRecords.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredRecords.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredRecords.length}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Call Console Modal */}
      {selectedCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Call Console & Interaction History</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Lead ID: {selectedCallModal.tmid} • {selectedCallModal.company}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedCallModal(null); setIsPlayingAudio(false); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Two Columns) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 p-6 text-xs">
              {/* Left Column: Primary Details & Engagement Cards */}
              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Primary Details
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div><span className="text-slate-400 font-medium">Company Name:</span> <span className="font-bold text-slate-900">{selectedCallModal.company}</span></div>
                    <div><span className="text-slate-400 font-medium">Contact Person:</span> <span className="font-semibold text-slate-800">{selectedCallModal.contactPerson}</span></div>
                    <div><span className="text-slate-400 font-medium">Phone Number:</span> <span className="font-semibold text-indigo-600">{selectedCallModal.phone}</span></div>
                    <div><span className="text-slate-400 font-medium">Email:</span> <span className="font-medium text-slate-800 truncate block">{selectedCallModal.email}</span></div>
                    <div><span className="text-slate-400 font-medium">State / Region:</span> <span className="font-semibold text-purple-600">{selectedCallModal.location}</span></div>
                    <div><span className="text-slate-400 font-medium">Registration Date:</span> <span className="font-semibold text-slate-800">{selectedCallModal.regDate}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Engagement Summary
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div><span className="text-slate-400 font-medium">Total Interactions:</span> <span className="font-bold text-slate-900">{selectedCallModal.calls} Calls</span></div>
                    <div><span className="text-slate-400 font-medium">Assigned Telechamp:</span> <span className="font-semibold text-slate-800">{selectedCallModal.telechamp} ({selectedCallModal.telechampInitials})</span></div>
                    <div><span className="text-slate-400 font-medium">Primary Process:</span> <span className="font-semibold text-slate-800">{selectedCallModal.process}</span></div>
                    <div className="flex items-center gap-2 pt-1"><span className="text-slate-400 font-medium">Current Status:</span> {getStatusBadge(selectedCallModal.status)}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Call Activity Log & Audio Player (Span 2) */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Call Activity Log & Recordings
                </h4>

                {/* Call Cards in History */}
                {selectedCallModal.history.map((hist, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(hist.status)}
                        <span className="text-[11px] text-slate-500 font-medium">{hist.time}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 font-mono">Duration: {hist.duration}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <div><span className="text-slate-400 text-[10px] uppercase block">Source</span> <span className="font-semibold text-slate-800">{hist.source}</span></div>
                      <div><span className="text-slate-400 text-[10px] uppercase block">Job ID</span> <span className="font-semibold text-indigo-600 font-mono">{hist.jobId}</span></div>
                      <div><span className="text-slate-400 text-[10px] uppercase block">Process</span> <span className="font-semibold text-slate-800">{hist.process}</span></div>
                      <div><span className="text-slate-400 text-[10px] uppercase block">Feedback</span> <span className="font-semibold text-emerald-600">{hist.feedback}</span></div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remarks:</span>
                      <p className="text-xs text-slate-700 mt-0.5 leading-relaxed bg-white/60 p-2 rounded border border-slate-100">
                        {hist.remarks}
                      </p>
                    </div>

                    {/* Audio Player Widget */}
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-xs cursor-pointer active:scale-95"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Volume2 className="w-3 h-3 text-indigo-600" />
                            Call Recording #{idx + 1}
                          </span>
                          <span className="font-mono text-slate-600">{hist.duration}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: isPlayingAudio ? `${audioProgress}%` : '35%' }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">128kbps</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => { setSelectedCallModal(null); setIsPlayingAudio(false); }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                CLOSE CONSOLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
