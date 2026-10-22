import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  TrendingUp,
  Phone,
  PhoneOutgoing,
  Clock,
  Target,
  Zap,
  Activity,
  RefreshCw,
  Search,
  User,
  CheckCircle2,
  Users,
  ArrowRight,
  Megaphone,
  ShieldCheck,
  Send,
  Building2,
  Utensils,
  Wrench,
  Briefcase,
  Layers,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Ticket,
  Check,
  X,
  PhoneCall,
  UserCheck,
  SlidersHorizontal,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function TeleadminDashboard({ onNavigateTab }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'IDLE'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [toastMessage, setToastMessage] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/dashboard');
      if (res.data?.data) {
        setDashboardData(res.data.data);
        if (res.data.data.agents_live_list && res.data.data.agents_live_list.length > 0) {
          setAgentsList(res.data.data.agents_live_list);
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load live dashboard stats:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Live Teleadmin Global Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setGlobalSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const res = await api.get('/admin/teleadmin/global-search', { params: { search: searchQuery.trim() } });
        if (res.data?.users) {
          setGlobalSearchResults(res.data.users);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenUserDetail = async (userId) => {
    setIsLoadingUserDetail(true);
    try {
      const res = await api.get(`/admin/teleadmin/user-detail/${userId}`);
      if (res.data?.user) {
        setSelectedUserDetail(res.data);
      }
    } catch (err) {
      showToast('Could not load user details');
    } finally {
      setIsLoadingUserDetail(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Determine Greeting Time of Day
  const greetingPeriod = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'MORNING';
    if (hour < 17) return 'AFTERNOON';
    if (hour < 21) return 'EVENING';
    return 'NIGHT';
  }, []);

  // Agent Live View Dataset (Matching the HTML exactly)
  const [agentsList, setAgentsList] = useState([
    {
      id: 1,
      name: 'Aayushi Verma',
      status: 'IDLE NOW',
      lastCallEndTime: '12:49:15',
      lastCallResult: 'SUCCESS',
      idleTime: '2m 41s',
      overallIdleTime: '1h 24m 39s',
      overallActiveTime: '1h 57m 17s'
    },
    {
      id: 2,
      name: 'Aditya kumar',
      status: 'ACTIVE',
      lastCallEndTime: '12:50:27',
      lastCallResult: 'NO CONN',
      idleTime: '1m 29s',
      overallIdleTime: '2h 7m 2s',
      overallActiveTime: '1h 14m 54s'
    },
    {
      id: 3,
      name: 'Angad',
      status: 'IDLE NOW',
      lastCallEndTime: '12:41:16',
      lastCallResult: 'SUCCESS',
      idleTime: '10m 40s',
      overallIdleTime: '1h 55m 13s',
      overallActiveTime: '1h 26m 43s'
    },
    {
      id: 4,
      name: 'Ankit Singh',
      status: 'ACTIVE',
      lastCallEndTime: '12:51:49',
      lastCallResult: 'NO CONN',
      idleTime: '7s',
      overallIdleTime: '1h 22m 5s',
      overallActiveTime: '1h 59m 51s'
    },
    {
      id: 5,
      name: 'Chandarbhan',
      status: 'IDLE NOW',
      lastCallEndTime: '12:40:34',
      lastCallResult: 'SUCCESS',
      idleTime: '11m 22s',
      overallIdleTime: '1h 24m 38s',
      overallActiveTime: '1h 57m 18s'
    },
    {
      id: 6,
      name: 'Kamini',
      status: 'IDLE NOW',
      lastCallEndTime: '12:37:44',
      lastCallResult: 'SUCCESS',
      idleTime: '14m 12s',
      overallIdleTime: '1h 17m 46s',
      overallActiveTime: '2h 4m 10s'
    },
    {
      id: 7,
      name: 'Pratima',
      status: 'IDLE NOW',
      lastCallEndTime: '12:48:59',
      lastCallResult: 'NO CONN',
      idleTime: '2m 57s',
      overallIdleTime: '2h 22m 58s',
      overallActiveTime: '58m 58s'
    },
    {
      id: 8,
      name: 'Raksha',
      status: 'ACTIVE',
      lastCallEndTime: '12:51:13',
      lastCallResult: 'NO CONN',
      idleTime: '43s',
      overallIdleTime: '2h 44m 58s',
      overallActiveTime: '36m 58s'
    },
    {
      id: 9,
      name: 'Sonam',
      status: 'IDLE NOW',
      lastCallEndTime: '12:48:28',
      lastCallResult: 'NO CONN',
      idleTime: '3m 28s',
      overallIdleTime: '2h 12m 18s',
      overallActiveTime: '1h 9m 38s'
    }
  ]);

  // Team Performance Bar Chart Dataset
  const teamPerformance = [
    { name: 'Sonam', attempt: 90, connected: 30, attemptCount: 45, connectedCount: 15 },
    { name: 'Raksha', attempt: 40, connected: 15, attemptCount: 20, connectedCount: 8 },
    { name: 'Ankit', attempt: 80, connected: 25, attemptCount: 40, connectedCount: 13 },
    { name: 'Pratima', attempt: 60, connected: 20, attemptCount: 30, connectedCount: 10 },
    { name: 'Chandarbhan', attempt: 35, connected: 18, attemptCount: 18, connectedCount: 9 },
    { name: 'Angad', attempt: 50, connected: 30, attemptCount: 25, connectedCount: 15 },
    { name: 'Aditya', attempt: 45, connected: 15, attemptCount: 23, connectedCount: 8 },
    { name: 'Aayushi', attempt: 25, connected: 10, attemptCount: 13, connectedCount: 5 },
    { name: 'Kamini', attempt: 65, connected: 25, attemptCount: 33, connectedCount: 13 }
  ];

  // Manual / Auto Refresh Action
  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Agent live monitoring feed synchronized!');
    }, 700);
  };

  // Filtered Agent List
  const filteredAgents = useMemo(() => {
    return agentsList.filter(agent => {
      const matchSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.lastCallResult.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = agentFilter === 'ALL' ||
        (agentFilter === 'ACTIVE' && agent.status === 'ACTIVE') ||
        (agentFilter === 'IDLE' && agent.status === 'IDLE NOW');

      return matchSearch && matchStatus;
    });
  }, [agentsList, searchQuery, agentFilter]);

  return (
    <div className="flex-1 w-full min-w-0 space-y-6 text-slate-800 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP HEADER / COMMAND CENTER GREETING                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-amber-500 tracking-wider uppercase">
              {greetingPeriod}
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-400 font-medium">
              • Synced at {lastRefreshed}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            WELCOME BACK, <span className="text-blue-600 font-extrabold">{user?.name?.toUpperCase() || 'CHANDARBHAN'}</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
              MANAGER
            </span>
          </h1>
        </div>

        {/* Global Search inside Dashboard */}
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          <div className="relative flex-1 md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Live Global Search: TMID, name, mobile, role..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {/* Live Search Results Dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 max-h-80 overflow-y-auto">
                {isSearchingGlobal ? (
                  <div className="flex items-center justify-center p-4 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Searching database...
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">No matching records found</div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 flex items-center justify-between">
                      <span>Matches ({globalSearchResults.length})</span>
                      <span className="text-[9px] text-blue-600 font-normal">Click to view details</span>
                    </div>
                    {globalSearchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleOpenUserDetail(u.id)}
                        className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{u.name || 'Unnamed'}</span>
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {u.unique_id} {u.mobile ? `• ${u.mobile}` : ''} {u.city ? `• ${u.city}` : ''}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 cursor-pointer shrink-0"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION TITLE: LIVE PERFORMANCE OVERVIEW                */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Live Performance Overview</h2>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Real-time operations matrix & telecaller pipelines
        </span>
      </div>

      {/* ======================================================== */}
      {/* METRIC CARDS: ROW 1 (4 CARDS)                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Drivers */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Drivers</span>
            </div>
            <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.5 rounded">FLEET</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3 h-3 text-slate-400" /> Today Drivers
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.drivers?.today?.toLocaleString() || '125'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Drivers
                </span>
                <span className="font-bold text-orange-600 font-mono">
                  {dashboardData?.kpis?.drivers?.called_today?.toLocaleString() || '65'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.drivers?.subscribed_today?.toLocaleString() || '3'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Users className="w-3 h-3 text-blue-500" /> Total Drivers
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {dashboardData?.kpis?.drivers?.total?.toLocaleString() || '81,370'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('leads-assignment') : window.location.href = '/teleadmin/leads-assignment'}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Driver Leads</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Transporters */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Transporters</span>
            </div>
            <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.5 rounded">LOGISTICS</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3 h-3 text-slate-400" /> Today Transporters
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.transporters?.today?.toLocaleString() || '8'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Transporters
                </span>
                <span className="font-bold text-orange-600 font-mono">
                  {dashboardData?.kpis?.transporters?.called_today?.toLocaleString() || '8'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.transporters?.subscribed_today?.toLocaleString() || '3'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="w-3 h-3 text-amber-500" /> Total Transporters
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {dashboardData?.kpis?.transporters?.total?.toLocaleString() || '23,693'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('registration-leads') : window.location.href = '/teleadmin/registration-leads'}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Transporters</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Driver Foremen */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Driver Foremen</span>
            </div>
            <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.5 rounded">OPS</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3 h-3 text-slate-400" /> Today Foremen
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.foremen?.today?.toLocaleString() || '5'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Foremen
                </span>
                <span className="font-bold text-orange-600 font-mono">
                  {dashboardData?.kpis?.foremen?.called_today?.toLocaleString() || '2'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {dashboardData?.kpis?.foremen?.subscribed_today?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <ShieldCheck className="w-3 h-3 text-purple-500" /> Total Foremen
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  {dashboardData?.kpis?.foremen?.total?.toLocaleString() || '2,321'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Navigating to Foremen Management...'); }} className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
                <span>View Foremen</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Card 4: Active Jobs */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Active Jobs</span>
            </div>
            <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.5 rounded">HIRING</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Layers className="w-3 h-3 text-slate-400" /> Total Jobs Posted
                </span>
                <span className="font-bold text-slate-800 font-mono">1,511</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Zap className="w-3 h-3 text-blue-500" /> Total Active Jobs
                </span>
                <span className="font-bold text-blue-600 font-mono">88</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3 h-3 text-slate-400" /> Drivers Required
                </span>
                <span className="font-bold text-slate-800 font-mono">470</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <UserCheck className="w-3 h-3 text-indigo-500" /> Applicants / Apps
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-xs">968 / 2,391</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="/active-jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                <span>View Active Jobs</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* METRIC CARDS: ROW 2 (4 CARDS)                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 5: Pending & Closed Jobs */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Pending &amp; Closed Jobs</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" /> Total Pending Jobs
                </span>
                <span className="font-bold text-slate-800 font-mono">17</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <AlertTriangle className="w-3 h-3 text-slate-400" /> Total Inactive Jobs
                </span>
                <span className="font-bold text-slate-800 font-mono">7</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3 h-3 text-rose-400" /> Total Expired Jobs
                </span>
                <span className="font-bold text-rose-600 font-mono">1,217</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Total Closed Jobs
                </span>
                <span className="font-bold text-emerald-600 font-mono">182</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                <span className="truncate">Closed Breakdown</span>
                <span className="font-semibold text-slate-700">Exp: 151 | Pend: 17 | Inact: 0</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="/pending-jobs" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors">
                <span>View Pending Jobs</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Card 6: Driver Associations */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Driver Associations</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3 h-3 text-slate-400" /> Today Associations
                </span>
                <span className="font-bold text-slate-800 font-mono">2</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Assoc.
                </span>
                <span className="font-bold text-orange-600 font-mono">2</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Users className="w-3 h-3 text-blue-500" /> Total Associations
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">1,311</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Opening Association Directory...'); }} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                <span>View Associations</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Card 7: Dhaba Sathi */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Utensils className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Dhaba Sathi</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Utensils className="w-3 h-3 text-slate-400" /> Today's Dhabas
                </span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Dhabas
                </span>
                <span className="font-bold text-orange-600 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Utensils className="w-3 h-3 text-emerald-500" /> Total Dhabas
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">260</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Loading Dhaba Sathi Hub...'); }} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                <span>View Dhabas</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Card 8: Puncture Point */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Puncture Point</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Wrench className="w-3 h-3 text-slate-400" /> Today Puncture Points
                </span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3 h-3 text-orange-400" /> Today Called Points
                </span>
                <span className="font-bold text-orange-600 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3 h-3 text-slate-400" /> Today Subscribed
                </span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Wrench className="w-3 h-3 text-rose-500" /> Total Puncture Points
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">304</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <a href="#" onClick={(e) => { e.preventDefault(); showToast('Loading Puncture Points...'); }} className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors">
                <span>View Puncture Points</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* METRIC CARDS: ROW 3 (3 CARDS)                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 9: Driver Ki Awaz */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Driver Ki Awaz</span>
            </div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Uploaded Posts</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Pending Posts</span>
                <span className="font-bold text-orange-600 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Approved Posts</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-700">Today's Uploads</span>
                <span className="font-bold text-slate-900 font-mono">0</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('driver-ki-awaz') : showToast('Viewing Driver Ki Awaz Posts')}
                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
              >
                View Posts
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('driver-ki-awaz') : showToast('Viewing Pending Approval Posts')}
                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Pending Approval
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('driver-ki-awaz') : showToast('Opening Analytics')}
                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Card 10: Outbound Leads */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Outbound Leads</span>
            </div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">WhatsApp Leads</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Facebook Leads</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Toll Free Leads</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">OBD Leads</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Other Leads</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('outbound-leads') : showToast('Opening Outbound Leads...')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All Leads</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Card 11: Blue Tick Media Accounts */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-bold tracking-wider uppercase">Blue Tick Media Accounts</span>
            </div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Uploaded Posts</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Pending Posts</span>
                <span className="font-bold text-orange-600 font-mono">0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Approved Posts</span>
                <span className="font-bold text-slate-800 font-mono">0</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-700">Accounts Active</span>
                <span className="font-bold text-slate-900 font-mono">0</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button onClick={() => showToast('Opening Blue Tick Accounts')} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                View Accounts
              </button>
              <button onClick={() => showToast('Viewing Posts')} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                View Posts
              </button>
              <button onClick={() => showToast('Viewing Pending Posts')} className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                Pending Posts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ANALYTICS CHARTS ROW (3 DONUTS / VISUALS)                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Lead Source Analytics */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Lead Source Analytics</span>
              <span className="text-[10px] text-slate-400 font-normal">All Channels</span>
            </h3>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-28 h-28 rounded-full border-8 border-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent -rotate-45"></div>
                <div className="text-center">
                  <span className="text-xs font-extrabold text-slate-700">100%</span>
                  <span className="block text-[8px] text-slate-400 uppercase">Coverage</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> WhatsApp</span>
              <span className="font-semibold text-slate-800">0% (0)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Facebook</span>
              <span className="font-semibold text-slate-800">0% (0)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> OBD</span>
              <span className="font-semibold text-slate-800">0% (0)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Toll Free</span>
              <span className="font-semibold text-slate-800">0% (0)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Others</span>
              <span className="font-semibold text-slate-800">0% (0)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Driver Ki Awaz Posts Analytics */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Driver Ki Awaz Posts Analytics</span>
              <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">NEW</span>
            </h3>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-28 h-28 rounded-full border-8 border-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent rotate-12"></div>
                <div className="text-center">
                  <span className="text-xs font-extrabold text-slate-700">100%</span>
                  <span className="block text-[8px] text-slate-400 uppercase">Review</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Media Type / Count</div>
              <div className="flex justify-between text-slate-600 text-xs"><span>Videos</span><span className="font-semibold text-slate-800">0% (0)</span></div>
              <div className="flex justify-between text-slate-600 text-xs"><span>Images</span><span className="font-semibold text-slate-800">0% (0)</span></div>
              <div className="flex justify-between text-slate-600 text-xs"><span>Text</span><span className="font-semibold text-slate-800">0% (0)</span></div>
            </div>
            <div className="pt-1.5 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published</span>
                <span className="font-bold text-slate-800">0</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending Approval</span>
                <span className="font-bold text-slate-800">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Job Status Analytics */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Job Status Analytics</span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">88 Active</span>
            </h3>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-28 h-28 rounded-full border-8 border-orange-400 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-r-transparent -rotate-90"></div>
                <div className="text-center">
                  <span className="text-xs font-extrabold text-blue-600">84%</span>
                  <span className="block text-[8px] text-slate-400 uppercase">Live Ratio</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Active Jobs</span>
              <span className="font-bold text-blue-700 font-mono text-xs">84% (88)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Pending Jobs</span>
              <span className="font-bold text-orange-600 font-mono text-xs">16% (17)</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
              <span>Total Pipeline Postings</span>
              <span className="font-bold text-slate-800">105 Jobs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXECUTIVE DASHBOARD SECTION (TARGET & SUBSCRIPTIONS)     */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-xs text-slate-500">Performance, revenue targets, and tele-conversion milestones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Target Box (Hero Card) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-2xs">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider text-blue-300 uppercase block">Monthly Target</span>
                  <span className="text-[10px] text-slate-400 font-medium">Fiscal Month October 2026</span>
                </div>
              </div>
              <div className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>15.12%</span>
                <span className="text-[10px] text-slate-300 font-normal">COMPLETED</span>
              </div>
            </div>

            <div className="my-5">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
                ₹ 5,00,000.00
              </div>
              <div className="text-xs text-slate-300">
                Currently Achieved: <span className="font-bold text-emerald-400">₹ 75,581.00</span>
              </div>

              {/* Target Progress Bar */}
              <div className="w-full bg-slate-800/90 h-3 rounded-full mt-3.5 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: '15.12%' }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Remaining to Target</span>
                <span className="text-lg font-bold text-white font-mono">₹ 4,24,419.00</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Required Per Day (20 Days Left)</span>
                <span className="text-lg font-bold text-amber-400 flex items-center gap-1 font-mono">
                  ₹ 21,220.95
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </div>
            </div>
          </div>

          {/* Total Subscriptions Box */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-3 translate-y-3 pointer-events-none">
              <Ticket className="w-36 h-36" />
            </div>

            <div>
              <span className="text-xs font-bold tracking-wider text-blue-200 uppercase block">Total Subscriptions</span>
              <span className="text-[10px] text-blue-100 font-medium">Paid Driver & Transporter Memberships</span>
              <div className="text-4xl sm:text-5xl font-black mt-4 tracking-tight font-mono">
                102
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
              <span className="inline-block bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                This Month (MTD)
              </span>
              <span className="text-xs text-blue-100 font-medium">98.4% Retention</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CALL METRICS & TEAM PERFORMANCE SECTION                  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Call Metrics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-800">Today's Call Metrics</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Calls Card */}
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Calls</span>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">221 / 340</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Unique / Attempted</div>
              </div>
            </div>

            {/* Connected Calls Card */}
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                <PhoneOutgoing className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected</span>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">111 / 144</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Unique / Connected</div>
              </div>
            </div>
          </div>

          {/* Avg Duration Card */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Duration</span>
              <div className="text-lg font-extrabold text-slate-900 font-mono">2m 22s</div>
              <div className="text-[10px] text-slate-500">Overall Avg Handling Time (AHT)</div>
            </div>
          </div>
        </div>

        {/* Right: Team Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Team Performance</h3>
                <span className="text-[10px] text-slate-400 font-medium">Daily call volumes vs connected conversions</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> ATTEMPT</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> CONNECTED</span>
            </div>
          </div>

          {/* Bar Chart Grid */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {teamPerformance.map((agent, aIdx) => (
              <div key={aIdx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap font-medium">
                  Attempt: {agent.attemptCount} ({agent.attempt}%) | Conn: {agent.connectedCount} ({agent.connected}%)
                </div>

                <div className="w-full flex justify-center items-end gap-1 h-32">
                  <div
                    className="w-3 bg-blue-600 rounded-t group-hover:bg-blue-700 transition-all"
                    style={{ height: `${agent.attempt}%` }}
                    title={`Attempt: ${agent.attempt}%`}
                  ></div>
                  <div
                    className="w-3 bg-emerald-500 rounded-t group-hover:bg-emerald-600 transition-all"
                    style={{ height: `${agent.connected}%` }}
                    title={`Connected: ${agent.connected}%`}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 truncate w-full text-center">
                  {agent.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* AGENT LIVE VIEW TABLE SECTION                            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Header Control */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agent Live View</h3>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                REAL-TIME TELECALLER STATUS MONITORING ({filteredAgents.length} Agents)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
              <button
                onClick={() => setAgentFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  agentFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({agentsList.length})
              </button>
              <button
                onClick={() => setAgentFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  agentFilter === 'ACTIVE' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({agentsList.filter(a => a.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setAgentFilter('IDLE')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  agentFilter === 'IDLE' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Idle ({agentsList.filter(a => a.status === 'IDLE NOW').length})
              </button>
            </div>

            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5 font-bold">Name</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold">Last Call End Time</th>
                <th className="py-3 px-5 font-bold">Last Call Result</th>
                <th className="py-3 px-5 font-bold">Idle Time (Since Last Call)</th>
                <th className="py-3 px-5 font-bold">Overall Idle Time</th>
                <th className="py-3 px-5 font-bold">Overall Active Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No agents matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] border border-slate-200">
                        {agent.name.charAt(0)}
                      </div>
                      <span>{agent.name}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide border ${
                        agent.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                      {agent.lastCallEndTime}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        agent.lastCallResult === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {agent.lastCallResult}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-mono text-[11px]">
                      {agent.idleTime}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                      {agent.overallIdleTime}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px]">
                      {agent.overallActiveTime}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LIVE USER DETAIL MODAL (GLOBAL SEARCH)                   */}
      {/* ======================================================== */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
                  {selectedUserDetail.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    {selectedUserDetail.user?.name || 'Unnamed User'}
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20">
                      {selectedUserDetail.user?.role}
                    </span>
                  </h3>
                  <div className="text-xs text-blue-100 font-mono">
                    TMID: {selectedUserDetail.user?.unique_id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedUserDetail.user?.mobile || '--'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{selectedUserDetail.user?.email || '--'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Telechamp</span>
                  <span className="font-bold text-blue-600">{selectedUserDetail.telechamp_name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">State / City</span>
                  <span className="font-medium text-slate-800">
                    {selectedUserDetail.user?.city ? `${selectedUserDetail.user.city}, ` : ''}
                    {selectedUserDetail.user?.state_name || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Revenue</span>
                  <span className="font-extrabold text-emerald-600 font-mono">
                    ₹ {Number(selectedUserDetail.total_payment || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Member Since</span>
                  <span className="font-medium text-slate-800">
                    {selectedUserDetail.user?.created_at ? new Date(selectedUserDetail.user.created_at).toLocaleDateString() : '--'}
                  </span>
                </div>
              </div>

              {/* Call History */}
              {selectedUserDetail.call_history && selectedUserDetail.call_history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    Recent Call History ({selectedUserDetail.call_history.length} Calls)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedUserDetail.call_history.map((call) => (
                      <div key={call.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>Agent: {call.agent_name?.replace('@TruckMitr', '') || 'Telechamp'}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              call.call_missed_flag === 'C' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {call.call_missed_flag === 'C' ? 'Connected' : 'Missed'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {call.start_time || call.created_at} • Duration: {call.agent_durn || call.durn_formatted || '00:00:10'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {selectedUserDetail.payments && selectedUserDetail.payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                    Transaction / Subscription History
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedUserDetail.payments.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-semibold text-slate-800 uppercase">{p.payment_type || 'Membership'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {p.id} • {p.created_at}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600 font-mono">₹ {Number(p.amount).toLocaleString()}</div>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {p.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
