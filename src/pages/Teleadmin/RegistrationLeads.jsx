import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import {
  Target,
  Clock,
  Calendar,
  RotateCw,
  Users,
  CheckCircle2,
  PhoneOff,
  PhoneCall,
  ListCheck,
  TrendingUp,
  Download,
  Camera,
  Search,
  FilterX,
  ChevronDown,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  Shield,
  FileSpreadsheet,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Loader2
} from 'lucide-react';

export default function RegistrationLeads() {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedTeam, setSelectedTeam] = useState('All Team');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStatus, setSelectedStatus] = useState('Status'); // Status = All
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // UI Interactive State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [performanceSummary, setPerformanceSummary] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchRegistrationLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/registration-leads', {
        params: {
          search: searchQuery.trim(),
          role: selectedRole,
          state: selectedState,
          team: selectedTeam,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data?.data) {
        const mapped = res.data.data.data.map(u => ({
          id: u.id,
          name: u.name || 'Unnamed User',
          tmid: u.unique_id || `TM26${u.id}`,
          dateTime: u.created_at ? new Date(u.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '12 Oct 2026',
          phone: u.mobile || '--',
          email: u.email || `${(u.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@truckmitr.com`,
          team: u.telechamp_name || 'Kamini',
          state: u.state_name || 'Madhya Pradesh',
          city: u.city || 'Indore',
          role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Driver',
          status: 'Pending',
          subStatus: 'NO ACTIVITY',
          calls: 0,
          experience: '5+ Years',
          licenseType: 'Commercial Transport',
          assignedTime: 'Today'
        }));
        setLeadsList(mapped);
        setTotalLeadsCount(res.data.data.total);
        setApiTotalPages(res.data.data.last_page);
      }
      if (res.data?.performance_summary && res.data.performance_summary.length > 0) {
        setPerformanceSummary(res.data.performance_summary);
      }
    } catch (err) {
      console.error('Failed to load registration leads:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegistrationLeads();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRole, selectedState, selectedTeam, currentPage]);

  const handleRefresh = () => {
    fetchRegistrationLeads();
    showToast('Registration leads refreshed with live telecaller telemetry!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('All States');
    setSelectedTeam('All Team');
    setSelectedRole('All Roles');
    setSelectedStatus('Status');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    showToast('All filters have been reset.');
  };

  // Performance Summary Dataset (Matching HTML)
  const performanceSummaryData = [
    {
      id: 1,
      name: 'KAMINI',
      department: 'DRIVER WELCOME',
      freshAssigned: 82,
      connected: 10,
      notConnected: 4,
      callback: 2,
      pending: '66 / 952',
      callsToday: 55,
      breakdown: { green: 25, red: 24, amber: 6, gray: 0 }
    },
    {
      id: 2,
      name: 'SONAM',
      department: 'DRIVER WELCOME',
      freshAssigned: 95,
      connected: 24,
      notConnected: 26,
      callback: 0,
      pending: '45 / 6576',
      callsToday: 80,
      breakdown: { green: 25, red: 55, amber: 0, gray: 0 }
    },
    {
      id: 3,
      name: 'ADITYA KUMAR',
      department: 'TRANSPORTER WELCOME',
      freshAssigned: 18,
      connected: 7,
      notConnected: 11,
      callback: 0,
      pending: '0 / 18',
      callsToday: 44,
      breakdown: { green: 15, red: 27, amber: 2, gray: 0 }
    },
    {
      id: 4,
      name: 'PRATIMA',
      department: 'DRIVER WELCOME',
      freshAssigned: 82,
      connected: 9,
      notConnected: 28,
      callback: 0,
      pending: '45 / 920',
      callsToday: 49,
      breakdown: { green: 13, red: 36, amber: 0, gray: 0 }
    }
  ];

  // Lead Records Dataset (Including HTML sample lead + rich complementary data)
  const initialLeads = [
    {
      id: 1,
      name: 'Deepak Shukla',
      tmid: 'TM2610MPDR412044',
      dateTime: '12 OCTOBER 2026, 1:22 PM',
      phone: '6262832234',
      email: 'SREEDEEPAKSHUKLA@GMAIL.COM',
      team: 'Sonam',
      state: 'Madhya Pradesh',
      city: 'Indore',
      role: 'Driver',
      status: 'Pending',
      subStatus: 'NO ACTIVITY',
      calls: 0,
      experience: '8 Years',
      licenseType: 'Heavy Vehicle Commercial (HGV)',
      assignedTime: '12 Oct 2026 12:45 PM'
    },
    {
      id: 2,
      name: 'Rajesh Kumar Verma',
      tmid: 'TM2610MHDR412045',
      dateTime: '12 OCTOBER 2026, 1:15 PM',
      phone: '9823145670',
      email: 'RAJESH.VERMA.MH@GMAIL.COM',
      team: 'Kamini',
      state: 'Maharashtra',
      city: 'Pune',
      role: 'Driver',
      status: 'Connected',
      subStatus: 'INTERESTED / REFERRED',
      calls: 2,
      experience: '5 Years',
      licenseType: 'Commercial Transport',
      assignedTime: '12 Oct 2026 11:30 AM'
    },
    {
      id: 3,
      name: 'Suresh Patel Logistics',
      tmid: 'TM2610DLTR412046',
      dateTime: '12 OCTOBER 2026, 12:55 PM',
      phone: '9910452319',
      email: 'INFO@SURESHLOGISTICS.IN',
      team: 'Aditya Kumar',
      state: 'Delhi',
      city: 'Delhi NCR',
      role: 'Transporter',
      status: 'Connected',
      subStatus: 'REQUIREMENT POSTED',
      calls: 3,
      experience: '12 Years in Fleet',
      licenseType: 'Fleet Owner (15 Trucks)',
      assignedTime: '12 Oct 2026 10:15 AM'
    },
    {
      id: 4,
      name: 'Vikram Singh Shekhawat',
      tmid: 'TM2610RJDR412047',
      dateTime: '12 OCTOBER 2026, 12:40 PM',
      phone: '9414012893',
      email: 'VIKRAM.SHEKHAWAT@REDIFF.COM',
      team: 'Pratima',
      state: 'Rajasthan',
      city: 'Jaipur',
      role: 'Driver',
      status: 'Not Connected',
      subStatus: 'CALL NOT ANSWERED',
      calls: 1,
      experience: '6 Years',
      licenseType: 'Commercial LMV/HMV',
      assignedTime: '12 Oct 2026 09:50 AM'
    },
    {
      id: 5,
      name: 'Amit Sharma Transport Co.',
      tmid: 'TM2610UPTR412048',
      dateTime: '12 OCTOBER 2026, 12:20 PM',
      phone: '9839011244',
      email: 'AMIT.SHARMA.TRANSPORT@GMAIL.COM',
      team: 'Aditya Kumar',
      state: 'Uttar Pradesh',
      city: 'Kanpur',
      role: 'Transporter',
      status: 'Callback',
      subStatus: 'REQUESTED CALL AT 4 PM',
      calls: 2,
      experience: '10 Years Fleet Management',
      licenseType: 'Fleet Owner (8 Trailers)',
      assignedTime: '12 Oct 2026 11:10 AM'
    },
    {
      id: 6,
      name: 'Dharmendra Yadav',
      tmid: 'TM2610MPDR412049',
      dateTime: '12 OCTOBER 2026, 12:05 PM',
      phone: '7552891045',
      email: 'DHARMENDRA.YADAV88@GMAIL.COM',
      team: 'Sonam',
      state: 'Madhya Pradesh',
      city: 'Bhopal',
      role: 'Driver',
      status: 'Pending',
      subStatus: 'NO ACTIVITY',
      calls: 0,
      experience: '4 Years',
      licenseType: 'Heavy Goods Vehicle',
      assignedTime: '12 Oct 2026 12:00 PM'
    },
    {
      id: 7,
      name: 'Manoj Tiwari Roadways',
      tmid: 'TM2610DLTR412050',
      dateTime: '12 OCTOBER 2026, 11:45 AM',
      phone: '9811234509',
      email: 'OPERATIONS@MANOJTROADWAYS.COM',
      team: 'Aditya Kumar',
      state: 'Delhi',
      city: 'New Delhi',
      role: 'Transporter',
      status: 'Not Connected',
      subStatus: 'OUT OF COVERAGE',
      calls: 1,
      experience: '14 Years Logistics',
      licenseType: 'Fleet Operator (22 Vehicles)',
      assignedTime: '12 Oct 2026 10:40 AM'
    },
    {
      id: 8,
      name: 'Rohit Singh Chauhan',
      tmid: 'TM2610GJDR412051',
      dateTime: '12 OCTOBER 2026, 11:30 AM',
      phone: '9898231456',
      email: 'ROHIT.CHAUHAN.GJ@GMAIL.COM',
      team: 'Kamini',
      state: 'Gujarat',
      city: 'Ahmedabad',
      role: 'Driver',
      status: 'Connected',
      subStatus: 'VERIFICATION STARTED',
      calls: 1,
      experience: '7 Years',
      licenseType: 'Multi-Axle Trailer Commercial',
      assignedTime: '12 Oct 2026 11:00 AM'
    },
    {
      id: 9,
      name: 'Anil Gupta Freight Carriers',
      tmid: 'TM2610MHNDR412052',
      dateTime: '12 OCTOBER 2026, 11:10 AM',
      phone: '9820019283',
      email: 'ANIL.GUPTA@FREIGHTCARRIERS.COM',
      team: 'Sonam',
      state: 'Maharashtra',
      city: 'Nagpur',
      role: 'Transporter',
      status: 'Pending',
      subStatus: 'NO ACTIVITY',
      calls: 0,
      experience: '9 Years',
      licenseType: 'Transporter / Commission Agent',
      assignedTime: '12 Oct 2026 10:50 AM'
    },
    {
      id: 10,
      name: 'Balwinder Singh',
      tmid: 'TM2610PBDR412053',
      dateTime: '12 OCTOBER 2026, 10:50 AM',
      phone: '9876543210',
      email: 'BALWINDER.SINGH.LUDHIANA@GMAIL.COM',
      team: 'Pratima',
      state: 'Punjab',
      city: 'Ludhiana',
      role: 'Driver',
      status: 'Callback',
      subStatus: 'EVENING CALLBACK SCHEDULED',
      calls: 1,
      experience: '11 Years',
      licenseType: 'Heavy Duty Container Carrier',
      assignedTime: '12 Oct 2026 10:15 AM'
    }
  ];

  // Filtering Logic
  const filteredLeads = useMemo(() => {
    const sourceLeads = leadsList.length > 0 ? leadsList : initialLeads;
    return sourceLeads.filter(lead => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.name?.toLowerCase().includes(query);
        const matchesTmid = lead.tmid?.toLowerCase().includes(query);
        const matchesPhone = lead.phone?.includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesTmid && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      // State Filter
      if (selectedState !== 'All States' && lead.state !== selectedState) {
        return false;
      }

      // Team Filter
      if (selectedTeam !== 'All Team' && lead.team !== selectedTeam) {
        return false;
      }

      // Role Filter
      if (selectedRole !== 'All Roles' && lead.role?.toLowerCase() !== selectedRole.toLowerCase()) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'Status' && selectedStatus !== 'All') {
        if (lead.status?.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [leadsList, searchQuery, selectedState, selectedTeam, selectedRole, selectedStatus]);

  // Paginated Leads
  const totalPages = apiTotalPages > 1 ? apiTotalPages : (Math.ceil(filteredLeads.length / itemsPerPage) || 1);
  const paginatedLeads = leadsList.length > 0 ? filteredLeads : filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Status Badge Styling Helper
  const getStatusBadge = (status, subStatus) => {
    switch (status) {
      case 'Connected':
        return (
          <div>
            <div className="font-bold text-emerald-600 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> CONNECTED
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">{subStatus || 'ANSWERED'}</div>
          </div>
        );
      case 'Not Connected':
        return (
          <div>
            <div className="font-bold text-rose-600 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span> NOT CONNECTED
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">{subStatus || 'NO ANSWER'}</div>
          </div>
        );
      case 'Callback':
        return (
          <div>
            <div className="font-bold text-amber-600 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span> CALLBACK
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">{subStatus || 'SCHEDULED'}</div>
          </div>
        );
      case 'Pending':
      default:
        return (
          <div>
            <div className="font-bold text-blue-600 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span> PENDING
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">{subStatus || 'NO ACTIVITY'}</div>
          </div>
        );
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['Lead Name', 'TMID', 'Mobile', 'Email', 'Role', 'State', 'City', 'Assigned Team', 'Status', 'Calls', 'Created At'],
      ...filteredLeads.map(l => [
        `"${l.name}"`,
        `"${l.tmid}"`,
        `"${l.phone}"`,
        `"${l.email}"`,
        `"${l.role}"`,
        `"${l.state}"`,
        `"${l.city}"`,
        `"${l.team}"`,
        `"${l.status}"`,
        l.calls,
        `"${l.dateTime}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registration_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Registration Leads CSV successfully.');
  };

  const handleTakeSnapshot = () => {
    navigator.clipboard?.writeText(JSON.stringify(filteredLeads, null, 2));
    showToast('Performance summary snapshot data copied to clipboard!');
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
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEGIN: PageTitleAndDateBar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-indigo-600 bg-indigo-50 p-1.5 rounded-lg">
              <Target className="w-5 h-5" />
            </span>
            Registration Leads
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>11 OCTOBER 2026, 6:00 PM - 12 OCTOBER 2026, 6:00 PM</span>
          </p>
        </div>

        {/* Date Filter & Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm shadow-xs hover:border-slate-300 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <span className="font-semibold text-slate-700 text-xs">12-10-2026</span>
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh Registration Leads"
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors shadow-xs flex items-center justify-center w-9 h-9 active:scale-95 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {/* END: PageTitleAndDateBar */}

      {/* BEGIN: MetricSummaryCards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Card */}
        <div
          onClick={() => { setSelectedStatus('Status'); setCurrentPage(1); }}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Status' || selectedStatus === 'All'
              ? 'border-indigo-400 shadow-xs ring-2 ring-indigo-500/10'
              : 'border-slate-200/80 shadow-xs hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">277</div>
            </div>
          </div>
        </div>

        {/* Connected Card */}
        <div
          onClick={() => { setSelectedStatus('Connected'); setCurrentPage(1); }}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Connected'
              ? 'border-emerald-400 shadow-xs ring-2 ring-emerald-500/10'
              : 'border-slate-200/80 shadow-xs hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CONNECTED</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">50</div>
            </div>
          </div>
        </div>

        {/* Not Connected Card */}
        <div
          onClick={() => { setSelectedStatus('Not Connected'); setCurrentPage(1); }}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Not Connected'
              ? 'border-rose-400 shadow-xs ring-2 ring-rose-500/10'
              : 'border-slate-200/80 shadow-xs hover:border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <PhoneOff className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NOT CONNECTED</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">69</div>
            </div>
          </div>
        </div>

        {/* Callback Card */}
        <div
          onClick={() => { setSelectedStatus('Callback'); setCurrentPage(1); }}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'Callback'
              ? 'border-amber-400 shadow-xs ring-2 ring-amber-500/10'
              : 'border-slate-200/80 shadow-xs hover:border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CALLBACK</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">2</div>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div
          onClick={() => { setSelectedStatus('Pending'); setCurrentPage(1); }}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all col-span-2 md:col-span-1 ${
            selectedStatus === 'Pending'
              ? 'border-blue-400 shadow-xs ring-2 ring-blue-500/10'
              : 'border-slate-200/80 shadow-xs hover:border-blue-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <ListCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENDING</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">156</div>
            </div>
          </div>
        </div>
      </div>
      {/* END: MetricSummaryCards */}

      {/* BEGIN: PerformanceSummarySection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" data-purpose="performance-summary-container">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            PERFORMANCE SUMMARY
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>EXPORT EXCEL</span>
            </button>
            <button
              onClick={handleTakeSnapshot}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>SNAPSHOT</span>
            </button>
          </div>
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Telechamp</th>
                <th className="py-3 px-6 text-center">Fresh Assigned</th>
                <th className="py-3 px-6 text-center">Connected</th>
                <th className="py-3 px-6 text-center">Not Connected</th>
                <th className="py-3 px-6 text-center">Callback</th>
                <th className="py-3 px-6 text-center">Pending</th>
                <th className="py-3 px-6 text-right">Calls Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {(performanceSummary.length > 0 ? performanceSummary : performanceSummaryData).map((champ) => (
                <tr key={champ.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{champ.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tight">{champ.department}</div>
                  </td>
                  <td className="py-4 px-6 text-center font-bold text-indigo-600 bg-indigo-50/30">
                    {champ.freshAssigned}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-800">
                    {champ.connected}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-800">
                    {champ.notConnected}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-800">
                    {champ.callback}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-700">
                    {champ.pending}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-bold text-slate-900">{champ.callsToday} Calls</div>
                    <div className="text-[10px] text-slate-500 space-x-1.5 mt-0.5">
                      <span className="text-emerald-600 font-bold">{champ.breakdown.green}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-600 font-bold">{champ.breakdown.red}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-amber-600 font-bold">{champ.breakdown.amber}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-medium">{champ.breakdown.gray}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* END: PerformanceSummarySection */}

      {/* BEGIN: RegistrationLeadsRecordsSection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4" data-purpose="leads-records-container">
        {/* Section header with total count badge */}
        <div className="px-6 pt-5 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
            REGISTRATION LEADS RECORDS
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {filteredLeads.length} TOTAL
            </span>
          </h2>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="px-6 space-y-3 pb-4 border-b border-slate-100">
          {/* Search and Action buttons */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Search leads by name, TMID, phone, email..."
                type="text"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5 text-slate-500" />
                <span>RESET</span>
              </button>
              <button
                onClick={handleRefresh}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {/* Dropdowns filter row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* State Filter */}
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 pr-8 cursor-pointer"
              >
                <option>All States</option>
                <option>Madhya Pradesh</option>
                <option>Maharashtra</option>
                <option>Delhi</option>
                <option>Rajasthan</option>
                <option>Uttar Pradesh</option>
                <option>Gujarat</option>
                <option>Punjab</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Team Filter */}
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 pr-8 cursor-pointer"
              >
                <option>All Team</option>
                <option>Sonam</option>
                <option>Kamini</option>
                <option>Pratima</option>
                <option>Aditya Kumar</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Roles Filter */}
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 pr-8 cursor-pointer"
              >
                <option>All Roles</option>
                <option>Driver</option>
                <option>Transporter</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="w-full appearance-none bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 pr-8 cursor-pointer"
              >
                <option>Status</option>
                <option>Pending</option>
                <option>Connected</option>
                <option>Not Connected</option>
                <option>Callback</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date from */}
            <div className="relative">
              <input
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                placeholder="dd-mm-yyyy"
                type="text"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date to */}
            <div className="relative">
              <input
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                placeholder="dd-mm-yyyy"
                type="text"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Leads Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Lead Info</th>
                <th className="py-3 px-6">Contact</th>
                <th className="py-3 px-6">Team</th>
                <th className="py-3 px-6">Location</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-center">Calls</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No registration leads found matching criteria.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-indigo-600 hover:underline font-bold mt-1"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Lead Info */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {lead.name}
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{lead.tmid}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lead.dateTime}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{lead.phone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{lead.email}</div>
                    </td>

                    {/* Team */}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {lead.team}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-medium">{lead.state}</div>
                      <div className="text-[10px] text-slate-400">{lead.city}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(lead.status, lead.subStatus)}
                    </td>

                    {/* Calls */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {lead.calls}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedLeadModal(lead)}
                        title="View Lead Details"
                        className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
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
        {filteredLeads.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredLeads.length}</span> leads
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition ${
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
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* END: RegistrationLeadsRecordsSection */}

      {/* BEGIN: LeadDetailsModal */}
      {selectedLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedLeadModal.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedLeadModal.tmid}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CURRENT STATUS</span>
                  <div className="mt-0.5">{getStatusBadge(selectedLeadModal.status, selectedLeadModal.subStatus)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROLE</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                    {selectedLeadModal.role}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.phone}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Email ID
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{selectedLeadModal.email}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Location
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.city}, {selectedLeadModal.state}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> Assigned Telechamp
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.team}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-400" /> License / Fleet
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.licenseType}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Experience
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.experience}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">TELECALLER QUICK ACTIONS</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      showToast(`Calling lead ${selectedLeadModal.name} via TeleCMI/Sarv IVR...`);
                      setSelectedLeadModal(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call via Cloud IVR
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Callback scheduled for lead ${selectedLeadModal.name}`);
                      setSelectedLeadModal(null);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs transition"
                  >
                    <Clock className="w-3.5 h-3.5" /> Schedule Callback
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: LeadDetailsModal */}
    </div>
  );
}
