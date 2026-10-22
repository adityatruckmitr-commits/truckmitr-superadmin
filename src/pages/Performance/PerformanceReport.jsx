import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Headphones, 
  Download, 
  Calendar, 
  IndianRupee, 
  Award, 
  CheckCircle2, 
  PhoneMissed, 
  Clock, 
  Search, 
  ChevronDown, 
  Users, 
  UserPlus, 
  RefreshCw,
  X,
  Loader2
} from 'lucide-react';
import api from '../../services/api';

export default function PerformanceReport() {
  // Helper to format date YYYY-MM-DD
  const formatDateISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const todayObj = new Date();
  const todayISO = formatDateISO(todayObj);
  const firstDayOfMonthISO = formatDateISO(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));

  // Timeframe and filter state
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [specificMonth, setSpecificMonth] = useState(`${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`);
  const [customRange, setCustomRange] = useState({ from: firstDayOfMonthISO, to: todayISO });
  const [selectedRole, setSelectedRole] = useState('ALL');
  
  // Table search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [processFilter, setProcessFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  // Backend Data State
  const [reportData, setReportData] = useState({
    filter_label: 'Current Month',
    month_title: '',
    kpis: {
      registrations: { title: 'Registrations Driven', value: '0', subtext: '0 Calls Made' },
      revenue: { title: 'Total Revenue', value: '₹0', subtext: 'Realized Revenue' },
      connected_rate: { title: 'Connected Rate', value: '0%', subtext: '0 Connected of 0 Dialled' },
      paid_subscribers: { title: 'Paid Conversions', value: '0', subtext: 'Subscribers' },
    },
    revenue_mix: [],
    driver_tier_mix: [],
    call_outcomes: {
      connected: { count: '0', raw: 0, percent: 0, color: '#10b981', label: 'Connected' },
      not_connected: { count: '0', raw: 0, percent: 0, color: '#f87171', label: 'Not Connected' },
      callback_later: { count: '0', raw: 0, percent: 0, color: '#f59e0b', label: 'Callback Later' },
    },
    agent_rows: [],
    summary: {}
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch Report Data from Live Laravel AdminController API
  const fetchReport = useCallback(async (period = selectedPeriod, role = selectedRole, start = customRange.from, end = customRange.to, month = specificMonth) => {
    try {
      setLoading(true);
      const params = {
        filter: period,
      };

      if (period === 'custom') {
        params.start_date = start;
        params.end_date = end;
      } else if (period === 'specific_month') {
        params.month = month;
      }

      if (role && role !== 'ALL') {
        params.user_role = role;
      }

      const res = await api.get('/admin/telecaller-performance-report', { params });
      if (res.data?.status === 'success') {
        setReportData(res.data);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Error fetching telecaller performance report:', err);
      showToast('Error loading live performance metrics. Please retry.');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [selectedPeriod, selectedRole, customRange.from, customRange.to, specificMonth]);

  // Initial fetch
  useEffect(() => {
    fetchReport(selectedPeriod, selectedRole, customRange.from, customRange.to, specificMonth);
  }, []);

  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    fetchReport(periodId, selectedRole, customRange.from, customRange.to, specificMonth);
  };

  const handleSpecificMonthApply = () => {
    setSelectedPeriod('specific_month');
    fetchReport('specific_month', selectedRole, customRange.from, customRange.to, specificMonth);
    showToast(`Loaded data for month: ${specificMonth}`);
  };

  const handleCustomRangeApply = () => {
    setSelectedPeriod('custom');
    fetchReport('custom', selectedRole, customRange.from, customRange.to, specificMonth);
    showToast(`Loaded data from ${customRange.from} to ${customRange.to}`);
  };

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    fetchReport(selectedPeriod, newRole, customRange.from, customRange.to, specificMonth);
  };

  const handleSyncFeeds = () => {
    setIsSyncing(true);
    fetchReport(selectedPeriod, selectedRole, customRange.from, customRange.to, specificMonth);
    showToast('Telemetry feeds updated from live database!');
  };

  // Filtered Telecallers based on Client Search & Process
  const filteredAgents = useMemo(() => {
    const list = reportData.agent_rows || [];
    return list.filter(agent => {
      const matchSearch = searchTerm === '' || (agent.name && agent.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchProcess = processFilter === 'ALL' || agent.process === processFilter;
      return matchSearch && matchProcess;
    });
  }, [reportData.agent_rows, searchTerm, processFilter]);

  // Aggregate Totals for Table Footer
  const totals = useMemo(() => {
    let reg = 0, cb = 0, conn = 0, notConn = 0, nullOth = 0, totalC = 0, uniqD = 0, subs = 0, rev = 0;
    
    filteredAgents.forEach(a => {
      if (typeof a.registrations === 'number') reg += a.registrations;
      if (typeof a.callbackLater === 'number') cb += a.callbackLater;
      if (typeof a.connected === 'number') conn += a.connected;
      if (typeof a.notConnected === 'number') notConn += a.notConnected;
      if (typeof a.nullOther === 'number') nullOth += a.nullOther;
      if (typeof a.totalCalls === 'number') totalC += a.totalCalls;
      if (typeof a.uniqueDialled === 'number') uniqD += a.uniqueDialled;
      if (typeof a.subsCount === 'number') subs += a.subsCount;
      if (typeof a.revenue === 'number') rev += a.revenue;
    });

    const connRate = totalC > 0 ? ((conn / totalC) * 100).toFixed(1) + '%' : '0%';

    return { reg, cb, conn, notConn, nullOth, totalC, connRate, uniqD, subs, rev };
  }, [filteredAgents]);

  // Export CSV Action
  const handleExportCSV = () => {
    const headers = ['#', 'Telecaller', 'Process', 'Registrations', 'Callback Later', 'Connected', 'Not Connected', 'Null/Other', 'Total Calls', 'Connect Rate', 'Unique Dialled', 'Subs Count', 'Revenue (INR)'];
    const rows = filteredAgents.map(a => [
      a.id,
      a.name,
      a.process,
      a.registrations || 0,
      a.callbackLater || 0,
      a.connected || 0,
      a.notConnected || 0,
      a.nullOther || 0,
      a.totalCalls || 0,
      a.connectRate || '0%',
      a.uniqueDialled || 0,
      a.subsCount || 0,
      a.revenue || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TruckMitr_Telecaller_Performance_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Telecaller Performance Report CSV exported successfully!');
  };

  return (
    <div className="flex flex-col w-full space-y-5 bg-slate-100 font-sans text-slate-800 antialiased min-h-screen">
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

      {/* BEGIN: Page Header & Action Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white px-5 py-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">Telecaller Performance Report</h1>
            <p className="text-xs text-slate-500 leading-normal mt-1">
              Live operational metrics · calls, conversions, revenue &amp; agent breakdown
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={handleSyncFeeds}
            disabled={isSyncing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync Feeds</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>
      {/* END: Page Header & Action Strip */}

      {/* BEGIN: Filter Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs space-y-3.5 border border-slate-200">
        {/* Top Row: Timeframe Switcher & Live Telemetry Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Period Label + Segmented Control */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Period:
            </span>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 gap-1 text-xs">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'current_month', label: 'Current Month' },
                { id: 'previous_month', label: 'Previous Month' }
              ].map((item) => (
                <button 
                  key={item.id}
                  type="button" 
                  onClick={() => handlePeriodChange(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                    selectedPeriod === item.id 
                      ? 'bg-blue-600 text-white shadow-xs inline-flex items-center gap-1.5' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {selectedPeriod === item.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Right: Status Indicators */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{reportData.filter_label || 'Current Month'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Refreshed: {lastRefreshed}</span>
            </span>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-slate-100 my-1"></div>

        {/* Bottom Row: Specific Month, Range Picker, Role Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Month Selector */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>Specific Month</span>
              <span className="text-[10px] text-slate-400 font-normal">Select period</span>
            </label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input 
                  type="month"
                  value={specificMonth}
                  onChange={(e) => setSpecificMonth(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSpecificMonthApply(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer" 
                />
              </div>
              <button 
                type="button" 
                onClick={handleSpecificMonthApply}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 text-xs font-medium transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>Custom Range</span>
              <span className="text-[10px] text-slate-400 font-normal">YYYY-MM-DD</span>
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input 
                  type="date" 
                  value={customRange.from}
                  onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomRangeApply(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer" 
                />
              </div>
              <span className="text-xs text-slate-400 font-medium px-0.5">to</span>
              <div className="relative flex-1">
                <input 
                  type="date" 
                  value={customRange.to}
                  onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomRangeApply(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer" 
                />
              </div>
              <button 
                type="button" 
                onClick={handleCustomRangeApply}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                Apply
              </button>
            </div>
          </div>

          {/* User Role Dropdown */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">User Role</label>
              <span className="text-[10px] text-slate-400 font-normal truncate">Filters database by role</span>
            </div>
            <div className="relative">
              <select 
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white appearance-none cursor-pointer transition-all" 
              >
                <option value="ALL">All Roles (Pan-India Dataset)</option>
                <option value="driver">Driver</option>
                <option value="transporter">Transporter</option>
                <option value="foreman">Foreman</option>
                <option value="association">Association</option>
                <option value="dhaba">Dhaba</option>
                <option value="puncture">Puncture Shop</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      {/* END: Filter Card */}

      {/* BEGIN: 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Registrations Driven */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : reportData.kpis?.registrations?.value || '0'}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">REGISTRATIONS DRIVEN</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="truncate">{reportData.kpis?.registrations?.subtext || 'Calls Made across Telecallers'}</span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 mt-3 tabular-nums">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-600" /> : reportData.kpis?.revenue?.value || '₹0'}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">TOTAL REVENUE</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="truncate">{reportData.kpis?.revenue?.subtext || 'Realized Revenue'}</span>
          </div>
        </div>

        {/* Card 3: Connected Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                <Headphones className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-cyan-600" /> : reportData.kpis?.connected_rate?.value || '0%'}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">CONNECTED RATE</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="truncate">{reportData.kpis?.connected_rate?.subtext || 'Connected of Dialled'}</span>
          </div>
        </div>

        {/* Card 4: Paid Conversions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-600" /> : reportData.kpis?.paid_subscribers?.value || '0'}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">PAID CONVERSIONS</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="truncate">{reportData.kpis?.paid_subscribers?.subtext || 'Subscribers'}</span>
          </div>
        </div>
      </div>
      {/* END: 4 Primary KPI Summary Cards */}

      {/* BEGIN: Secondary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card 1: Revenue Mix */}
        <div className="bg-white rounded-xl p-4 shadow-xs space-y-3.5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Revenue Mix Breakdown</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Total: {reportData.kpis?.revenue?.value || '₹0'}</span>
          </div>
          {/* Segmented Bar */}
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {reportData.revenue_mix?.map((item, idx) => (
              <div 
                key={idx}
                className="h-full transition-all duration-500" 
                style={{ 
                  width: `${item.percent || 0}%`, 
                  backgroundColor: item.color,
                  borderTopLeftRadius: idx === 0 ? '9999px' : 0,
                  borderBottomLeftRadius: idx === 0 ? '9999px' : 0,
                  borderTopRightRadius: idx === reportData.revenue_mix.length - 1 ? '9999px' : 0,
                  borderBottomRightRadius: idx === reportData.revenue_mix.length - 1 ? '9999px' : 0,
                }} 
                title={`${item.name}: ${item.percent}%`}
              />
            ))}
          </div>
          {/* Details List */}
          <div className="space-y-2 pt-1">
            {reportData.revenue_mix?.map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs ${item.raw === 0 ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 tabular-nums">{item.amount}</span>
                  <span className="text-slate-400 text-[11px]">({item.percent}% · {item.count} {item.name === 'Matchmaking' ? 'Jobs' : (item.name === 'Verification' ? 'Verifications' : 'Subs')})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Driver Tier Mix */}
        <div className="bg-white rounded-xl p-4 shadow-xs space-y-3.5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Driver Tier Mix</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Subscription Tiers</span>
          </div>
          {/* Tier Multi-Segment Bar */}
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {reportData.driver_tier_mix?.map((item, idx) => (
              <div 
                key={idx}
                className="h-full transition-all duration-500" 
                style={{ 
                  width: `${item.percent || 0}%`, 
                  backgroundColor: item.color,
                  borderTopLeftRadius: idx === 0 ? '9999px' : 0,
                  borderBottomLeftRadius: idx === 0 ? '9999px' : 0,
                  borderTopRightRadius: idx === reportData.driver_tier_mix.length - 1 ? '9999px' : 0,
                  borderBottomRightRadius: idx === reportData.driver_tier_mix.length - 1 ? '9999px' : 0,
                }} 
                title={`${item.tier}: ${item.percent}%`}
              />
            ))}
          </div>
          {/* Tier Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {reportData.driver_tier_mix?.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <div>
                    <div className="text-xs text-slate-800 font-medium">{item.tier}</div>
                    <div className="text-[10px] text-slate-400">{item.count} Subscriptions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800 text-xs tabular-nums">{item.amount}</div>
                  <div className="text-[10px] font-semibold" style={{ color: item.color }}>{item.percent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* END: Secondary Analytics Grid */}

      {/* BEGIN: Full Width Card - Call Outcomes */}
      <div className="bg-white rounded-xl p-4 shadow-xs space-y-3 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Call Disposition &amp; Dialler Outcomes</h2>
          </div>
          <span className="text-xs text-slate-500">
            {reportData.summary?.grand_total_calls ? `${Number(reportData.summary.grand_total_calls).toLocaleString()} Total Contact Attempts` : ''}
          </span>
        </div>
        {/* Segmented Outcome Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500" 
            style={{ width: `${reportData.call_outcomes?.connected?.percent || 0}%` }} 
            title={`Connected: ${reportData.call_outcomes?.connected?.percent}%`}
          />
          <div 
            className="h-full bg-rose-500 transition-all duration-500" 
            style={{ width: `${reportData.call_outcomes?.not_connected?.percent || 0}%` }} 
            title={`Not Connected: ${reportData.call_outcomes?.not_connected?.percent}%`}
          />
          <div 
            className="h-full bg-amber-500 rounded-r-full transition-all duration-500" 
            style={{ width: `${reportData.call_outcomes?.callback_later?.percent || 0}%` }} 
            title={`Callback Later: ${reportData.call_outcomes?.callback_later?.percent}%`}
          />
        </div>
        {/* Outcome Badges / Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-xs text-emerald-900 font-semibold">Connected</div>
                <div className="text-[11px] text-emerald-700">Successful conversation</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-900 tabular-nums">
                {reportData.call_outcomes?.connected?.count || 0} Calls
              </span>
              <span className="block text-[11px] font-semibold text-emerald-700">
                {reportData.call_outcomes?.connected?.percent || 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
            <div className="flex items-center gap-2">
              <PhoneMissed className="w-5 h-5 text-rose-600" />
              <div>
                <div className="text-xs text-rose-900 font-semibold">Not Connected</div>
                <div className="text-[11px] text-rose-700">Ringing, declined, switch off</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-rose-900 tabular-nums">
                {reportData.call_outcomes?.not_connected?.count || 0} Calls
              </span>
              <span className="block text-[11px] font-semibold text-rose-700">
                {reportData.call_outcomes?.not_connected?.percent || 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-xs text-amber-900 font-semibold">Callback Later</div>
                <div className="text-[11px] text-amber-700">Follow-up requested</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-900 tabular-nums">
                {reportData.call_outcomes?.callback_later?.count || 0} Calls
              </span>
              <span className="block text-[11px] font-semibold text-amber-700">
                {reportData.call_outcomes?.callback_later?.percent || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* END: Full Width Card - Call Outcomes */}

      {/* BEGIN: Core Operational Section - Agent Performance Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden space-y-0 border border-slate-200">
        {/* Table Header Toolbar */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Agent Telecalling Performance Matrix</h3>
              <p className="text-xs text-slate-500">Individual agent telecalling volumes, reachability rates, conversion counts and realized revenues.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search telecaller name..." 
                className="w-56 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all" 
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <div className="relative">
              <select 
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white cursor-pointer appearance-none transition-all" 
              >
                <option value="ALL">All Processes</option>
                <option value="match-making">match-making</option>
                <option value="welcome-call">welcome-call</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Showing {filteredAgents.length} Telecallers
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Top Multi-Tier Column Headers */}
            <thead>
              <tr className="text-[11px] uppercase tracking-wider font-semibold">
                <th className="bg-slate-100 px-3.5 py-2.5 border-b border-slate-200 text-slate-700 text-left" colSpan={3}>Agent Details</th>
                <th className="bg-blue-50/80 px-3.5 py-2.5 border-b border-slate-200 text-blue-900 text-right" colSpan={2}>Registration</th>
                <th className="bg-sky-50/80 px-3.5 py-2.5 border-b border-slate-200 text-sky-950 text-right" colSpan={8}>Call Performance &amp; Revenue Metrics</th>
              </tr>
              <tr className="text-[11px] text-slate-600 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
                <th className="px-3 py-2 w-10 text-center font-medium border-r border-slate-200">#</th>
                <th className="px-3 py-2 font-medium border-r border-slate-200 min-w-[160px]">Telecaller</th>
                <th className="px-3 py-2 font-medium border-r border-slate-200">Process</th>
                <th className="px-3 py-2 text-right font-medium bg-blue-50/40 border-r border-slate-200">Registrations</th>
                <th className="px-3 py-2 text-right font-medium bg-blue-50/40 border-r border-slate-200">Callback Later</th>
                <th className="px-3 py-2 text-right font-medium border-r border-slate-200 text-emerald-700">Connected</th>
                <th className="px-3 py-2 text-right font-medium border-r border-slate-200 text-rose-600">Not Connected</th>
                <th className="px-3 py-2 text-right font-medium border-r border-slate-200">Null/Other</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-800 border-r border-slate-200">Total Calls</th>
                <th className="px-3 py-2 text-right font-medium text-blue-700 border-r border-slate-200">Connect %</th>
                <th className="px-3 py-2 text-right font-medium border-r border-slate-200">Unique Dialled</th>
                <th className="px-3 py-2 text-right font-semibold text-purple-700 border-r border-slate-200">Subs Count</th>
                <th className="px-3.5 py-2 text-right font-semibold text-emerald-700">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Computing live telecalling performance matrix from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    No telecallers match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className={`hover:bg-blue-50/40 transition-colors ${agent.isHighlight ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-3 py-2.5 text-center text-slate-400 border-r border-slate-100">{agent.id}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 border-r border-slate-100 flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full ${agent.avatarBg || 'bg-blue-100 text-blue-700'} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                        {agent.initial}
                      </span>
                      <span className="font-semibold text-slate-900">{agent.name}</span>
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        agent.process === 'match-making' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {agent.process}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium bg-blue-50/20 border-r border-slate-100 tabular-nums">
                      {agent.registrations > 0 ? Number(agent.registrations).toLocaleString('en-IN') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500 bg-blue-50/20 border-r border-slate-100 tabular-nums">
                      {agent.callbackLater > 0 ? Number(agent.callbackLater).toLocaleString('en-IN') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold border-r border-slate-100 tabular-nums">
                      {Number(agent.connected || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right text-rose-600 border-r border-slate-100 tabular-nums">
                      {Number(agent.notConnected || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-400 border-r border-slate-100 tabular-nums">
                      {agent.nullOther > 0 ? Number(agent.nullOther).toLocaleString('en-IN') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 border-r border-slate-100 tabular-nums">
                      {Number(agent.totalCalls || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-blue-700 border-r border-slate-100 tabular-nums">
                      {agent.connectRate}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-600 border-r border-slate-100 tabular-nums">
                      {Number(agent.uniqueDialled || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-purple-700 border-r border-slate-100 tabular-nums">
                      {agent.subsCount > 0 ? Number(agent.subsCount).toLocaleString('en-IN') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-emerald-700 tabular-nums">
                      {agent.revenue > 0 ? `₹${Number(agent.revenue).toLocaleString('en-IN')}` : <span className="text-slate-400 font-normal">₹0</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Totals Row */}
            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 text-xs">
              <tr>
                <td className="px-3.5 py-3 text-right uppercase tracking-wider font-bold text-slate-600 border-r border-slate-200" colSpan={3}>
                  Aggregate Totals
                </td>
                <td className="px-3 py-3 text-right font-bold text-blue-800 bg-blue-50/50 border-r border-slate-200 tabular-nums">
                  {totals.reg.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-600 bg-blue-50/50 border-r border-slate-200 tabular-nums">
                  {totals.cb.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-emerald-700 border-r border-slate-200 tabular-nums">
                  {totals.conn.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-rose-600 border-r border-slate-200 tabular-nums">
                  {totals.notConn.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-500 border-r border-slate-200 tabular-nums">
                  {totals.nullOth}
                </td>
                <td className="px-3 py-3 text-right font-extrabold text-slate-900 border-r border-slate-200 tabular-nums">
                  {totals.totalC.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-blue-800 border-r border-slate-200 tabular-nums">
                  {totals.connRate}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-800 border-r border-slate-200 tabular-nums">
                  {totals.uniqD.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3 text-right font-bold text-purple-700 border-r border-slate-200 tabular-nums">
                  {totals.subs}
                </td>
                <td className="px-3.5 py-3 text-right font-extrabold text-emerald-800 tabular-nums bg-emerald-50/30">
                  ₹{totals.rev.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">1 to {filteredAgents.length}</span> of <span className="font-semibold text-slate-800">{filteredAgents.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white font-bold shadow-xs">1</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
      {/* END: Core Operational Section - Agent Performance Table */}
    </div>
  );
}