import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  Calendar,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronDown,
  Briefcase,
  Users,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  Shield,
  Eye,
  X,
  Layers,
  ArrowRight,
  MapPin,
  Building2,
  Phone,
  HelpCircle
} from 'lucide-react';
import PageJump from '../../components/PageJump';

export default function DriverFulfillment() {
  // Telemetry & Loading State
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search, Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('All Executives');
  const [selectedJobType, setSelectedJobType] = useState('All Job Types');
  const [selectedInterviewFilter, setSelectedInterviewFilter] = useState('All Interviews');
  const [currentPage, setCurrentPage] = useState(1);
  const [deadlinePage, setDeadlinePage] = useState(1);
  const [activeJobModal, setActiveJobModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch live telemetry from Laravel API
  const fetchTelemetry = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/admin/driver-fulfillment-telemetry');
      if (res.data && res.data.status === 'success') {
        setTelemetry(res.data);
      }
    } catch (err) {
      console.warn('Driver fulfillment telemetry warning:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleManualRefresh = async () => {
    await fetchTelemetry();
    showToast('Driver Fulfillment metrics refreshed successfully!');
  };

  // Safe fallback bindings to live API telemetry
  const kpis = telemetry?.kpis || {
    active_jobs: 0,
    required_drivers: 0,
    total_applications: 0,
    unique_drivers: 0,
    jobs_with_apps: 0,
    jobs_without_apps: 0,
    payment_pending_standard: 0,
    payment_pending_premium: 0,
    payment_pending_super_premium: 0,
    jobs_posted_today: 0,
    jobs_posted_7d: 0,
    jobs_posted_30d: 0,
    closing_next_7d: 0,
    closing_next_2d: 0,
  };

  const riskData = telemetry?.risk_analysis || {
    green_jobs: 0,
    yellow_jobs: 0,
    red_jobs: 0,
  };

  const typeSummary = telemetry?.job_type_summary || {
    Premium: { jobs: 0, required: 0, applied: 0, joined: 0, balance: 0, risk: 0 },
    Standard: { jobs: 0, required: 0, applied: 0, joined: 0, balance: 0, risk: 0 },
    'Super Premium': { jobs: 0, required: 0, applied: 0, joined: 0, balance: 0, risk: 0 }
  };

  // (unused) old static sample rows
  const defaultActiveJobs = [
    {
      id: 'TMJB01868',
      transporter: 'Satish Vashistha',
      executive: 'Aayushi Verma',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 2,
      applications: 14,
      uniqueDrivers: 14,
      joined: 0,
      balance: 2,
      interviewDone: 1,
      deadline: '07 Oct 2026',
      status: 'RED',
      location: 'Gurugram, Haryana',
      vehicleType: '24ft Container'
    },
    {
      id: 'TMJB01860',
      transporter: 'Pankaj Nandankar',
      executive: 'Angad',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 1,
      applications: 4,
      uniqueDrivers: 4,
      joined: 0,
      balance: 1,
      interviewDone: 0,
      deadline: '09 Oct 2026',
      status: 'RED',
      location: 'Nagpur, Maharashtra',
      vehicleType: 'Trailer 40ft'
    },
    {
      id: 'TMJB01863',
      transporter: 'Sunil Phogat',
      executive: 'Chandarbhan',
      type: 'Premium',
      typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      reqDrivers: 2,
      applications: 10,
      uniqueDrivers: 10,
      joined: 0,
      balance: 2,
      interviewDone: 1,
      deadline: '09 Oct 2026',
      status: 'RED',
      location: 'Rohtak, Haryana',
      vehicleType: 'Open Truck 10-Wheeler'
    },
    {
      id: 'TMJB01762',
      transporter: 'Hitendrakumar Rajendrabhai Solanki',
      executive: 'Chandarbhan',
      type: 'Premium',
      typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      reqDrivers: 1,
      applications: 56,
      uniqueDrivers: 56,
      joined: 0,
      balance: 1,
      interviewDone: 4,
      deadline: '10 Oct 2026',
      status: 'RED',
      location: 'Ahmedabad, Gujarat',
      vehicleType: 'Tanker'
    },
    {
      id: 'TMJB01847',
      transporter: 'Shyam Sharma',
      executive: 'Aayushi Verma',
      type: 'Premium',
      typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      reqDrivers: 1,
      applications: 53,
      uniqueDrivers: 53,
      joined: 0,
      balance: 1,
      interviewDone: 2,
      deadline: '10 Oct 2026',
      status: 'RED',
      location: 'Jaipur, Rajasthan',
      vehicleType: '14-Wheeler Multi-Axle'
    },
    {
      id: 'TMJB01815',
      transporter: 'Somnath Dhuriya Roadways',
      executive: 'Angad',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 5,
      applications: 32,
      uniqueDrivers: 28,
      joined: 0,
      balance: 5,
      interviewDone: 3,
      deadline: '10 Oct 2026',
      status: 'RED',
      location: 'Indore, Madhya Pradesh',
      vehicleType: 'Flatbed Trailer'
    },
    {
      id: 'TMJB01812',
      transporter: 'Balaji Freight Movers',
      executive: 'Raksha',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 3,
      applications: 41,
      uniqueDrivers: 39,
      joined: 0,
      balance: 3,
      interviewDone: 5,
      deadline: '12 Oct 2026',
      status: 'YELLOW',
      location: 'Pune, Maharashtra',
      vehicleType: '32ft MX Container'
    },
    {
      id: 'TMJB01804',
      transporter: 'Khurana Logistics Corp',
      executive: 'Chandarbhan',
      type: 'Premium',
      typeBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      reqDrivers: 4,
      applications: 68,
      uniqueDrivers: 62,
      joined: 0,
      balance: 4,
      interviewDone: 7,
      deadline: '14 Oct 2026',
      status: 'GREEN',
      location: 'Ludhiana, Punjab',
      vehicleType: '22ft Closed Body'
    },
    {
      id: 'TMJB01799',
      transporter: 'Apex Supply Chain India',
      executive: 'Aayushi Verma',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 2,
      applications: 24,
      uniqueDrivers: 24,
      joined: 0,
      balance: 2,
      interviewDone: 2,
      deadline: '15 Oct 2026',
      status: 'GREEN',
      location: 'Chennai, Tamil Nadu',
      vehicleType: 'Car Carrier'
    },
    {
      id: 'TMJB01785',
      transporter: 'Vikas Roadlines Pvt Ltd',
      executive: 'Angad',
      type: 'Standard',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      reqDrivers: 3,
      applications: 47,
      uniqueDrivers: 45,
      joined: 0,
      balance: 3,
      interviewDone: 4,
      deadline: '16 Oct 2026',
      status: 'GREEN',
      location: 'Surat, Gujarat',
      vehicleType: 'Heavy Tipper'
    }
  ];

  const activeJobsData = telemetry?.active_jobs || [];

  // Applications per day, last 7 days (from the API)
  const trend = telemetry?.applications_trend || [];
  const trendPeak = Math.max(0, ...trend.map(t => t.count));
  const trendPts = trend.map((t, i) => ({
    ...t,
    x: trend.length > 1 ? 40 + (i * 420) / (trend.length - 1) : 250,
    y: 150 - (t.count / Math.max(1, trendPeak)) * 120,
    label: new Date(t.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  }));
  const upcomingDeadlines = telemetry?.upcoming_deadlines || [];

  // Distinct Executives for Dropdown
  const executiveOptions = useMemo(() => {
    const list = new Set();
    activeJobsData.forEach((j) => {
      if (j.executive && j.executive !== 'Unassigned') list.add(j.executive);
    });
    return ['All Executives', ...Array.from(list)];
  }, [activeJobsData]);

  // Filtered Active Jobs
  const filteredJobs = useMemo(() => {
    return activeJobsData.filter((job) => {
      const matchSearch =
        searchTerm === '' ||
        (job.id && job.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.transporter && job.transporter.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.executive && job.executive.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchExec =
        selectedExecutive === 'All Executives' || job.executive === selectedExecutive;

      const matchType =
        selectedJobType === 'All Job Types' || job.type === selectedJobType;

      const matchInterview =
        selectedInterviewFilter === 'All Interviews' ||
        (selectedInterviewFilter === 'Interviewed' && (job.interviewDone || 0) > 0) ||
        (selectedInterviewFilter === 'Not Interviewed' && (!job.interviewDone || job.interviewDone === 0));

      return matchSearch && matchExec && matchType && matchInterview;
    });
  }, [activeJobsData, searchTerm, selectedExecutive, selectedJobType, selectedInterviewFilter]);

  // Paginated Rows
  const pageSize = 5;
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Job ID',
      'Transporter Name',
      'Executive',
      'Job Type',
      'Req. Drivers',
      'Applications',
      'Unique Drivers',
      'Joined',
      'Balance',
      'Interview Done',
      'Deadline',
      'Location'
    ];

    const rows = filteredJobs.map((j) => [
      j.id,
      `"${j.transporter || ''}"`,
      j.executive || '',
      j.type || 'Standard',
      j.reqDrivers || 0,
      j.applications || 0,
      j.uniqueDrivers || 0,
      j.joined || 0,
      j.balance || 0,
      j.interviewDone || 0,
      j.deadline || '',
      `"${j.location || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TruckMitr_Driver_Fulfillment_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Driver Fulfillment dataset exported to CSV successfully!');
  };

  // Compute Total Row for Type Summary Table
  const totalSummary = {
    jobs: (typeSummary.Premium?.jobs || 0) + (typeSummary.Standard?.jobs || 0) + (typeSummary['Super Premium']?.jobs || 0),
    required: (typeSummary.Premium?.required || 0) + (typeSummary.Standard?.required || 0) + (typeSummary['Super Premium']?.required || 0),
    applied: (typeSummary.Premium?.applied || 0) + (typeSummary.Standard?.applied || 0) + (typeSummary['Super Premium']?.applied || 0),
    joined: (typeSummary.Premium?.joined || 0) + (typeSummary.Standard?.joined || 0) + (typeSummary['Super Premium']?.joined || 0),
    balance: (typeSummary.Premium?.balance || 0) + (typeSummary.Standard?.balance || 0) + (typeSummary['Super Premium']?.balance || 0),
    risk: (typeSummary.Premium?.risk || 0) + (typeSummary.Standard?.risk || 0) + (typeSummary['Super Premium']?.risk || 0),
  };

  return (
    <div className="flex flex-col w-full space-y-4 bg-slate-100 font-sans text-slate-800 antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP CONTROL & METADATA BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white px-5 py-4 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
            Driver Fulfillment Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and monitor active jobs, driver demand, candidate pipelines, and fulfillment progress
          </p>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">
              {telemetry?.timestamp ? telemetry.timestamp.split(' ')[0] + ' ' + telemetry.timestamp.split(' ')[1] + ' ' + telemetry.timestamp.split(' ')[2] : '07 Oct 2026'}
            </span>
            <span className="text-slate-300 font-normal">|</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">
              Last Updated: <strong className="text-slate-800 font-bold">{telemetry?.timestamp ? telemetry.timestamp.split(' ').slice(3).join(' ') : '10:57 AM'}</strong>
            </span>
            <button
              onClick={handleManualRefresh}
              className="ml-1 p-1 hover:bg-slate-200/80 rounded-full text-blue-600 transition-colors cursor-pointer"
              title="Sync now"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & ACTION TOOLBAR */}
      <div className="bg-white rounded-xl shadow-xs p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Job ID / Transporter / Location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Executive Dropdown */}
          <div className="relative">
            <select
              value={selectedExecutive}
              onChange={(e) => {
                setSelectedExecutive(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
            >
              {executiveOptions.map((exec) => (
                <option key={exec} value={exec}>
                  {exec}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Job Type Dropdown */}
          <div className="relative">
            <select
              value={selectedJobType}
              onChange={(e) => {
                setSelectedJobType(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
            >
              <option value="All Job Types">All Job Types</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
              <option value="Super Premium">Super Premium</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualRefresh}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedExecutive('All Executives');
              setSelectedJobType('All Job Types');
              setSelectedInterviewFilter('All Interviews');
              showToast('Filters reset to default view');
            }}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* PRIMARY KPI ROW: 6 BALANCED METRIC CARDS (ZERO WASTED SPACE, CLEAN COUNTS ONLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Active Jobs */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 truncate">
                Active Jobs
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
              {Number(kpis.active_jobs || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Open active listings
            </span>
          </div>
        </div>

        {/* 2. Required Drivers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 truncate">
                Required Drivers
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
              {Number(kpis.required_drivers || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Total positions needed
            </span>
          </div>
        </div>

        {/* 3. Total Applications */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-purple-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 truncate">
                Total Applications
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
              {Number(kpis.total_applications || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Cumulative driver leads
            </span>
          </div>
        </div>

        {/* 4. Unique Drivers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 hover:border-cyan-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 truncate">
                Unique Drivers
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
              {Number(kpis.unique_drivers || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Distinct candidate pool
            </span>
          </div>
        </div>

        {/* 5. Jobs With Applications */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200/90 hover:border-emerald-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 truncate">
                With Applications
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums block">
              {Number(kpis.jobs_with_apps || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Active candidate pipeline
            </span>
          </div>
        </div>

        {/* 6. Jobs Without Applications */}
        <div className="bg-white rounded-xl p-4 border border-rose-200/90 bg-rose-50/20 hover:border-rose-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-rose-800 truncate">
                No Applications
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
              Urgent
            </span>
          </div>
          <div className="pt-1">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums block">
              {Number(kpis.jobs_without_apps || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">
              Needs immediate action
            </span>
          </div>
        </div>
      </div>

      {/* SECONDARY OPERATIONAL METRICS: 2 BALANCED TIERS (COVERS ALL PREVIOUS EMPTY SPACE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Payments Breakdown */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Payments Breakdown by Tier
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Active job count classified across service tiers
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              3 Tiers
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Standard Tier */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-center transition-all hover:bg-blue-50">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block truncate mb-1">
                Standard
              </span>
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums block">
                {Number(kpis.payment_pending_standard || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Standard listings</span>
            </div>

            {/* Premium Tier */}
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3 text-center transition-all hover:bg-amber-50">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate mb-1">
                Premium
              </span>
              <span className="text-2xl font-extrabold text-amber-900 tabular-nums block">
                {Number(kpis.payment_pending_premium || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Priority placement</span>
            </div>

            {/* Super Premium Tier */}
            <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-3 text-center transition-all hover:bg-purple-50">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block truncate mb-1">
                Super Premium
              </span>
              <span className="text-2xl font-extrabold text-purple-900 tabular-nums block">
                {Number(kpis.payment_pending_super_premium || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-600 font-medium">Enterprise VIP</span>
            </div>
          </div>
        </div>

        {/* Card 2: Posting & Closing Timelines */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Posting &amp; Closing Timelines
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Recent job creation velocity and urgent deadline alerts
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Timeline Activity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Posted Today */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                Posted Today
              </span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums my-0.5">
                {Number(kpis.jobs_posted_today || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Today</span>
            </div>

            {/* Posted 7 Days */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                Posted 7D
              </span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums my-0.5">
                {Number(kpis.jobs_posted_7d || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Last 7 Days</span>
            </div>

            {/* Posted 30 Days */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                Posted 30D
              </span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums my-0.5">
                {Number(kpis.jobs_posted_30d || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Last 30 Days</span>
            </div>

            {/* Closing Next 7 Days */}
            <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-2.5 text-center flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block truncate">
                Closing 7D
              </span>
              <span className="text-xl font-extrabold text-amber-700 tabular-nums my-0.5">
                {Number(kpis.closing_next_7d || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">In 7 Days</span>
            </div>

            {/* Closing Next 2 Days */}
            <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-2.5 text-center flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block truncate">
                Closing 2D
              </span>
              <span className="text-xl font-extrabold text-rose-600 tabular-nums my-0.5">
                {Number(kpis.closing_next_2d || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-600 font-bold uppercase">Urgent</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: JOB TYPE SUMMARY & UPCOMING DEADLINES (2 BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Job Type Summary */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Job Type Summary
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Operational breakdown across service tiers
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                3 Tiers
              </span>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <th className="py-2.5 px-3">Job Type</th>
                    <th className="py-2.5 px-3 text-right">Jobs</th>
                    <th className="py-2.5 px-3 text-right">Req.</th>
                    <th className="py-2.5 px-3 text-right">Applied</th>
                    <th className="py-2.5 px-3 text-right">Joined</th>
                    <th className="py-2.5 px-3 text-right">Bal.</th>
                    <th className="py-2.5 px-3 text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Premium */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Premium
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Premium?.jobs || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Premium?.required || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Premium?.applied || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary.Premium?.joined || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-900 font-semibold">
                      {typeSummary.Premium?.balance || 0}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {typeSummary.Premium?.risk || 0}
                      </span>
                    </td>
                  </tr>

                  {/* Standard */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Standard
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Standard?.jobs || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Standard?.required || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 font-medium">
                      {typeSummary.Standard?.applied || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary.Standard?.joined || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-900 font-semibold">
                      {typeSummary.Standard?.balance || 0}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {typeSummary.Standard?.risk || 0}
                      </span>
                    </td>
                  </tr>

                  {/* Super Premium */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Super Premium
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary['Super Premium']?.jobs || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary['Super Premium']?.required || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary['Super Premium']?.applied || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-medium">
                      {typeSummary['Super Premium']?.joined || 0}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-semibold">
                      {typeSummary['Super Premium']?.balance || 0}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {typeSummary['Super Premium']?.risk || 0}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-semibold text-slate-900">
                    <td className="py-3 px-3 font-bold text-slate-900">Total</td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{totalSummary.jobs}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{totalSummary.required}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{totalSummary.applied}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-bold">{totalSummary.joined}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{totalSummary.balance}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        {totalSummary.risk}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100/70 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Upcoming Deadlines
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    {upcomingDeadlines.length} Urgent
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedJobType('All Job Types');
                  setSelectedInterviewFilter('All Interviews');
                  showToast(`Viewing all ${upcomingDeadlines.length} urgent job deadlines`);
                }}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium inline-flex items-center gap-1 transition-colors hover:underline cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Transporter</th>
                    <th className="py-2.5 px-3">Exec.</th>
                    <th className="py-2.5 px-3">Drivers</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {upcomingDeadlines.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            const match = activeJobsData.find((j) => j.id === item.id);
                            if (match) setActiveJobModal(match);
                          }}
                          className="text-blue-600 hover:underline font-mono font-semibold text-xs tracking-tight cursor-pointer"
                        >
                          {item.id}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[130px]">
                        {item.transporter}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{item.executive}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                          {item.drivers} Drivers
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums">{item.deadline}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            item.status === 'RED'
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'RED' ? 'bg-rose-600' : 'bg-amber-500'
                            }`}
                          ></span>{' '}
                          {item.status || 'RED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mini Info Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs text-slate-500">
            <span>Showing top urgent jobs closing soon</span>
            <span className="text-rose-600 font-semibold">{kpis.closing_next_7d || 0} jobs expiring in 7 days</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: RISK ANALYSIS & JOB PIPELINE FUNNEL (2 BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Analysis & Recruitment Funnel */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/70 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 leading-tight">Risk Analysis</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Portfolio Health &amp; Operational Exposure
                </p>
              </div>
            </div>

            {/* 3 Health Cards - Clean counts */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Green Jobs */}
              <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-between transition-all hover:border-emerald-300 hover:shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                  {riskData.green_jobs || 0}
                </span>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mt-0.5">
                  Green Jobs
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> On Track
                </div>
              </div>

              {/* Yellow Jobs */}
              <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-between transition-all hover:border-amber-300 hover:shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-3xl font-extrabold text-amber-600 tracking-tight tabular-nums">
                  {riskData.yellow_jobs || 0}
                </span>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">
                  Yellow Jobs
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> At Risk
                </div>
              </div>

              {/* Red Jobs */}
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-3.5 text-center flex flex-col items-center justify-between transition-all hover:border-rose-300 hover:shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-1.5 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums">
                  {riskData.red_jobs || 0}
                </span>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 mt-0.5">
                  Red Jobs
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> High Risk
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 pt-2 border-t border-slate-100">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recruitment Funnel
              </h3>
            </div>

            {/* Custom SVG Recruitment Funnel with Live Counts */}
            <div className="relative w-full flex items-center justify-center py-1">
              <svg
                aria-label="Recruitment Funnel Visualization"
                className="w-full max-w-lg h-auto overflow-visible"
                viewBox="0 0 540 280"
              >
                <defs>
                  <linearGradient id="funnel1" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="funnel2" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#591fc3" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="funnel3" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="funnel4" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                  <linearGradient id="funnel5" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                  <linearGradient id="funnel6" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                </defs>

                {/* Stage 1 */}
                <polygon fill="url(#funnel1)" points="40,10 320,10 300,50 60,50" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="35">
                  {kpis.active_jobs || 0}
                </text>
                <path d="M 320 30 L 370 30" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="34">
                  Active Jobs
                </text>

                {/* Stage 2 */}
                <polygon fill="url(#funnel2)" points="62,54 298,54 280,94 80,94" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="79">
                  {kpis.required_drivers || 0}
                </text>
                <path d="M 298 74 L 370 74" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="78">
                  Required Drivers
                </text>

                {/* Stage 3 */}
                <polygon fill="url(#funnel3)" points="82,98 278,98 258,138 102,138" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="123">
                  {kpis.total_applications || 0}
                </text>
                <path d="M 278 118 L 370 118" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="122">
                  Applications
                </text>

                {/* Stage 4 */}
                <polygon fill="url(#funnel4)" points="104,142 256,142 236,182 124,182" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="167">
                  {kpis.unique_drivers || 0}
                </text>
                <path d="M 256 162 L 370 162" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="166">
                  Unique Drivers
                </text>

                {/* Stage 5 */}
                <polygon fill="url(#funnel5)" points="126,186 234,186 216,226 144,226" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="211">
                  {kpis.interview_done || 0}
                </text>
                <path d="M 234 206 L 370 206" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="210">
                  Interview Done
                </text>

                {/* Stage 6 */}
                <polygon fill="url(#funnel6)" points="146,230 214,230 200,270 160,270" />
                <text fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle" x="180" y="255">
                  {kpis.matchmaking_done || 0}
                </text>
                <path d="M 214 250 L 370 250" stroke="#757684" strokeDasharray="3 3" strokeWidth="1.5" />
                <text fill="#0d1c2e" fontSize="13" fontWeight="600" x="380" y="254">
                  Matchmaking Done
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Job Status Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Job Status Overview
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Pipeline fulfillment metrics
                  </p>
                </div>
              </div>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>

            <div className="flex flex-col gap-4 my-3">
              {/* Item 1: Active Jobs */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Active Jobs</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{kpis.active_jobs || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Item 2: Applications */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Applications</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {Number(kpis.total_applications || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* Item 3: Joined */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Joined</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{totalSummary.joined || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: totalSummary.joined > 0 ? `${Math.min(100, (totalSummary.joined / (totalSummary.required || 1)) * 100)}%` : '0%' }}></div>
                </div>
              </div>

              {/* Item 4: Balance */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Balance</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{kpis.required_drivers || 0}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-cyan-600 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            {/* Alert Box */}
            <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3.5 mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    Recruitment Target Health
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {kpis.required_drivers || 0} balance positions pending fulfillment
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-[11px]">
                In Progress
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: APPLICATIONS TREND & JOBS BY STATUS (2 BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Applications Trend (Last 7 Days) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Applications Trend
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Last 7 Days recruitment volume
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs">
                Peak: {trendPeak.toLocaleString()}
              </span>
            </div>

            <div className="w-full pt-2">
              <svg
                aria-label="Applications 7 Day Trend Chart"
                className="w-full h-auto overflow-visible"
                viewBox="0 0 500 180"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0%" x2="0%" y1="0%" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="20" x2="480" y1="30" y2="30" />
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="20" x2="480" y1="80" y2="80" />
                <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="20" x2="480" y1="130" y2="130" />
                {trend.length > 1 && (
                  <>
                    <path d={`M ${trendPts.map(p => `${p.x} ${p.y}`).join(' L ')} L 460 160 L 40 160 Z`} fill="url(#areaGradient)" />
                    <polyline fill="none" points={trendPts.map(p => `${p.x},${p.y}`).join(' ')} stroke="#2563eb" strokeLinejoin="round" strokeWidth="2.5" />
                  </>
                )}
                {trendPts.map((p, i) => (
                  <g key={p.date}>
                    <circle cx={p.x} cy={p.y} fill="#ffffff" r="4" stroke="#2563eb" strokeWidth="2.5">
                      <title>{`${p.label}: ${p.count} applications`}</title>
                    </circle>
                    <text fill="#64748b" fontSize="11" fontWeight="600" textAnchor="middle" x={p.x} y={p.y - 9}>{p.count}</text>
                    <text fill="#94a3b8" fontSize="10" textAnchor="middle" x={p.x} y="175">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Jobs by Status (Distribution - Clean Counts Only, NO fake %) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 leading-tight">
                    Jobs by Status
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Distribution across operational stages
                  </p>
                </div>
              </div>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="14" stroke="#f1f5f9" strokeWidth="4" />
                  {/* share of active jobs that have applications (the legend counts overlap, so no pie split) */}
                  <circle
                    cx="18"
                    cy="18"
                    fill="transparent"
                    r="14"
                    stroke="#10b981"
                    strokeDasharray={`${kpis.active_jobs ? ((kpis.jobs_with_apps || 0) / kpis.active_jobs) * 88 : 0} 88`}
                    strokeDashoffset="0"
                    strokeWidth="4"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums leading-tight">
                    {kpis.active_jobs || 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    TOTAL JOBS
                  </span>
                </div>
              </div>

              {/* Clean Counts (No Fake Percentages) */}
              <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-slate-700">Active Hiring</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {kpis.jobs_with_apps || 0} Jobs
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-semibold text-slate-700">Standard Tier</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {kpis.payment_pending_standard || 0} Jobs
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold text-slate-700">Closing This Week</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {kpis.closing_next_7d || 0} Jobs
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-semibold text-slate-700">Urgent (2 Days)</span>
                  </div>
                  <span className="text-xs font-bold text-rose-600 tabular-nums">
                    {kpis.closing_next_2d || 0} Jobs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACTIVE JOBS DETAIL (FULL WIDTH DATA GRID) */}
      <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Jobs Detail
            </h2>
            <p className="text-xs text-slate-500">
              Live registry and candidate conversion pipelines
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <div className="relative">
              <select
                value={selectedJobType}
                onChange={(e) => {
                  setSelectedJobType(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
              >
                <option value="All Job Types">All Job Types</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Super Premium">Super Premium</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedInterviewFilter}
                onChange={(e) => {
                  setSelectedInterviewFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
              >
                <option value="All Interviews">All Interviews</option>
                <option value="Interviewed">Interviewed</option>
                <option value="Not Interviewed">Not Interviewed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="overflow-x-auto custom-scroll rounded-lg border border-slate-200/80">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <th className="py-3 px-3">Job ID</th>
                <th className="py-3 px-3">Transporter Name</th>
                <th className="py-3 px-3">Executive</th>
                <th className="py-3 px-3">Job Type</th>
                <th className="py-3 px-3 text-right">Req. Drivers</th>
                <th className="py-3 px-3 text-right">Applications</th>
                <th className="py-3 px-3 text-right">Unique Drivers</th>
                <th className="py-3 px-3 text-right">Joined</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-right">Interview Done</th>
                <th className="py-3 px-3 text-right">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No active jobs match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-blue-600 font-mono tabular-nums">
                      <button
                        onClick={() => setActiveJobModal(row)}
                        className="hover:underline cursor-pointer"
                      >
                        {row.id}
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-slate-900 font-medium">{row.transporter}</td>
                    <td className="py-3.5 px-3 text-slate-600">{row.executive}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          row.type === 'Premium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : row.type === 'Super Premium'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums">{row.reqDrivers}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <button
                        onClick={() => setActiveJobModal(row)}
                        className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline cursor-pointer"
                      >
                        <span>{row.applications}</span>
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums">{row.uniqueDrivers}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums">{row.joined}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-slate-900">
                      {row.balance}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-emerald-700">
                      {row.interviewDone}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-600">
                      {row.deadline}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 mt-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 font-semibold">{filteredJobs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredJobs.length)}</strong> of <strong className="text-slate-800 font-semibold">{filteredJobs.length}</strong> entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              type="button"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-semibold shadow-xs cursor-pointer ${
                  currentPage === p
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                type="button"
              >
                {p}
              </button>
            ))}
            {totalPages > 5 && (
              <>
                <span className="text-slate-400 text-xs px-1">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs font-semibold shadow-xs cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  type="button"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              type="button"
            >
              ›
            </button>
            <PageJump page={currentPage} totalPages={totalPages} onGo={setCurrentPage} />
          </div>
        </div>
      </div>

      {/* JOB APPLICANTS MODAL */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{activeJobModal.id}</h3>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${activeJobModal.typeBadge || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {activeJobModal.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{activeJobModal.transporter} · {activeJobModal.location || 'Pan India'}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveJobModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[11px] text-slate-500 block">Required Drivers</span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">{activeJobModal.reqDrivers}</span>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-center">
                <span className="text-[11px] text-blue-700 block">Total Applications</span>
                <span className="text-xl font-bold text-blue-800 tabular-nums">{activeJobModal.applications}</span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                <span className="text-[11px] text-emerald-700 block">Interviews Done</span>
                <span className="text-xl font-bold text-emerald-800 tabular-nums">{activeJobModal.interviewDone}</span>
              </div>
            </div>

            {/* Candidate Sample List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Candidate Drivers</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {[
                  { name: 'Rameshwar Yadav', phone: '+91 98234 11234', exp: '8 Yrs Heavy Trailer', status: 'Interviewed', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { name: 'Sukhwinder Singh', phone: '+91 98112 55678', exp: '6 Yrs Container', status: 'Shortlisted', statusColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { name: 'Dinesh Kumar Meena', phone: '+91 97234 99012', exp: '5 Yrs Multi-Axle', status: 'Pending Call', statusColor: 'bg-amber-50 text-amber-700 border-amber-200' },
                ].map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {c.name[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                        <span className="text-[11px] text-slate-500">{c.phone} · {c.exp}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${c.statusColor}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveJobModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveJobModal(null);
                  showToast(`Assigned candidate interviews for ${activeJobModal.id}`);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Schedule New Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}