import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  Users, Activity, Settings, UserPlus, Search,
  Eye, CheckCircle, XCircle, Clock, TrendingUp,
  BarChart3, Target, Award, Zap, RefreshCw, Download,
  PhoneCall, UserCheck, Shield, Crown, Briefcase,
  PhoneMissed, PhoneIncoming, Calendar, Star, Medal,
  Trophy, ArrowUpRight, ArrowDownRight
} from 'lucide-react-teleadmin';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

const AdvancedManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [period, setPeriod] = useState('today');
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch dashboard stats
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ['advanced-dashboard', period],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/admin_dashboard_stats.php?period=${period}`);
      return res.data;
    },
    refetchInterval: 10000,
  });

  const stats = dashboardData?.data || {};
  const periodStats = stats.period_stats || {};
  const telecallers = stats.telecallers_performance || [];

  const filteredTelecallers = telecallers.filter(tc => {
    const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.mobile?.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || tc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  // Get period data for telecallers
  const getTelecallerPeriodData = (tc) => {
    if (period === 'week') return tc.this_week;
    if (period === 'month') return tc.this_month;
    if (period === 'all') return tc.all_time;
    return tc.today;
  };

  // Call distribution data
  const callDistribution = [
    { name: 'Connected', value: periodStats.connected_calls || 0, color: '#10b981' },
    { name: 'Callbacks', value: periodStats.callbacks || 0, color: '#f59e0b' },
    { name: 'Not Connected', value: periodStats.not_connected || 0, color: '#ef4444' }
  ];

  const handleViewDetails = (tc) => {
    setSelectedTelecaller(tc);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto">
        {/* Premium Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-[2rem] p-8 mb-8 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[1.25rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-[1.25rem] shadow-2xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                  Advanced Management Center
                </h1>
                <p className="text-gray-600 text-base font-semibold mt-1">Complete control over telecallers, leads & operations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="backdrop-blur-xl bg-white/70 rounded-[2rem] p-6 mb-8 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Time Period
            </h3>
            <div className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-xs rounded-2xl border border-gray-200/50">
              {['today', 'week', 'month', 'all'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${period === p
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  {p === 'today' && <Zap className="w-3.5 h-3.5 inline mr-1" />}
                  {p === 'week' && <Calendar className="w-3.5 h-3.5 inline mr-1" />}
                  {p === 'month' && <BarChart3 className="w-3.5 h-3.5 inline mr-1" />}
                  {p === 'all' && <Star className="w-3.5 h-3.5 inline mr-1" />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Premium KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {[
            { title: 'Total Telecallers', value: stats.total_telecallers || 0, icon: Users, color: 'from-indigo-500 to-purple-600', change: '+0%', trend: 'neutral' },
            { title: 'Active Now', value: periodStats.active_telecallers || 0, icon: UserCheck, color: 'from-emerald-500 to-teal-600', change: '+5%', trend: 'up' },
            { title: 'Total Calls', value: periodStats.total_calls || 0, icon: PhoneCall, color: 'from-blue-500 to-cyan-600', change: '+12%', trend: 'up' },
            { title: 'Connected', value: periodStats.connected_calls || 0, icon: CheckCircle, color: 'from-green-500 to-emerald-600', change: '+8%', trend: 'up' },
            { title: 'Callbacks', value: periodStats.callbacks || 0, icon: PhoneIncoming, color: 'from-amber-500 to-orange-600', change: '+3%', trend: 'up' },
            { title: 'Not Connected', value: periodStats.not_connected || 0, icon: PhoneMissed, color: 'from-red-500 to-rose-600', change: '-5%', trend: 'down' }
          ].map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${kpi.color} rounded-[1.5rem] opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                <div className="relative backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] group-hover:scale-[1.02] transition-all duration-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${kpi.color} p-3.5 rounded-2xl shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${kpi.trend === 'up' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                        kpi.trend === 'down' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {kpi.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {kpi.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-3">{kpi.title}</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-xl bg-white/70 rounded-[2rem] p-2 mb-8 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'telecallers', label: 'Telecallers', icon: Users },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
              { id: 'leaderboard', label: 'Leaderboard', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:bg-white/50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Distribution */}
            <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-600" />
                Call Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={callDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {callDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Stats */}
            <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <span className="text-green-900 font-bold">Connected</span>
                  </div>
                  <span className="text-3xl font-black text-green-900">{periodStats.connected_calls || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <PhoneIncoming className="w-8 h-8 text-amber-600" />
                    <span className="text-amber-900 font-bold">Callbacks</span>
                  </div>
                  <span className="text-3xl font-black text-amber-900">{periodStats.callbacks || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <PhoneMissed className="w-8 h-8 text-red-600" />
                    <span className="text-red-900 font-bold">Not Connected</span>
                  </div>
                  <span className="text-3xl font-black text-red-900">{periodStats.not_connected || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8 text-indigo-600" />
                    <span className="text-indigo-900 font-bold">Connection Rate</span>
                  </div>
                  <span className="text-3xl font-black text-indigo-900">{periodStats.connection_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Telecallers Tab */}
        {activeTab === 'telecallers' && (
          <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="flex-1 relative min-w-[300px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search telecallers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-semibold"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
              </select>
            </div>

            {/* Telecallers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTelecallers.map((tc) => {
                const periodData = getTelecallerPeriodData(tc);
                const connectionRate = periodData.calls > 0 ? ((periodData.connected / periodData.calls) * 100).toFixed(1) : 0;
                const avgDuration = periodData.calls > 0 ? Math.floor(periodData.duration / periodData.calls / 60) : 0;

                return (
                  <div key={tc.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 rounded-2xl opacity-0 group-hover:opacity-100 blur-xs transition-all duration-500"></div>
                    <div className="relative bg-white rounded-2xl p-6 border border-slate-200 group-hover:border-slate-300 group-hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Subtle Background Pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>

                      {/* Header */}
                      <div className="relative flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 flex items-center justify-center text-white font-black text-xl shadow-lg">
                              {tc.name.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(tc.status)} border-2 border-white shadow-xs`}></div>
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">{tc.name}</p>
                            <p className="text-sm text-slate-500 font-semibold flex items-center gap-1">
                              <PhoneCall className="w-3 h-3" />
                              {tc.mobile}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${tc.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {tc.status === 'active' ? 'Active' : 'Idle'}
                          </span>
                          {tc.last_call_time && (
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(tc.last_call_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <PhoneCall className="w-4 h-4 text-slate-600" />
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Total</p>
                          </div>
                          <p className="text-2xl font-black text-slate-900">{periodData.calls}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Connected</p>
                          </div>
                          <p className="text-2xl font-black text-emerald-900">{periodData.connected}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <PhoneIncoming className="w-4 h-4 text-amber-600" />
                            <p className="text-xs text-amber-700 font-bold uppercase tracking-wide">Callbacks</p>
                          </div>
                          <p className="text-2xl font-black text-amber-900">{periodData.callbacks || 0}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-slate-600" />
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Rate</p>
                          </div>
                          <p className="text-2xl font-black text-slate-900">{connectionRate}%</p>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 font-semibold">Avg Duration</p>
                            <p className="text-sm font-black text-slate-700">{avgDuration}m {Math.floor((periodData.duration / periodData.calls) % 60)}s</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 font-semibold">Total Time</p>
                            <p className="text-sm font-black text-slate-700">{Math.floor(periodData.duration / 3600)}h {Math.floor((periodData.duration % 3600) / 60)}m</p>
                          </div>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Performance</span>
                          <span className="text-xs font-black text-slate-900">{periodData.conversion_rate}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-slate-600 to-slate-700 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(periodData.conversion_rate, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(tc)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 gap-6">
            {/* Telecaller Performance Chart */}
            <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Telecaller Performance Comparison
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredTelecallers.slice(0, 10).map(tc => ({
                  name: tc.name,
                  calls: getTelecallerPeriodData(tc).calls,
                  connected: getTelecallerPeriodData(tc).connected,
                  callbacks: getTelecallerPeriodData(tc).callbacks || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px', fontWeight: 600 }} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontWeight: 600 }} />
                  <Bar dataKey="calls" fill="#6366f1" radius={[8, 8, 0, 0]} name="Total Calls" />
                  <Bar dataKey="connected" fill="#10b981" radius={[8, 8, 0, 0]} name="Connected" />
                  <Bar dataKey="callbacks" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Callbacks" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Call Trends */}
            <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Call Trends (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.call_trends || []}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConnected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" name="Total Calls" />
                  <Area type="monotone" dataKey="connected" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorConnected)" name="Connected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="backdrop-blur-xl bg-white/80 rounded-[1.5rem] p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-600" />
              Top Performers Leaderboard
            </h3>
            <div className="space-y-4">
              {filteredTelecallers
                .sort((a, b) => getTelecallerPeriodData(b).calls - getTelecallerPeriodData(a).calls)
                .slice(0, 10)
                .map((tc, index) => {
                  const periodData = getTelecallerPeriodData(tc);
                  return (
                    <div key={tc.id} className="relative group">
                      <div className={`absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-to-r from-indigo-400 to-indigo-600'
                        }`}></div>
                      <div className="relative flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 group-hover:shadow-2xl transition-all">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-500 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700' :
                                'bg-gradient-to-br from-indigo-500 to-purple-600'
                          }`}>
                          {index === 0 && <Crown className="w-8 h-8" />}
                          {index === 1 && <Medal className="w-8 h-8" />}
                          {index === 2 && <Award className="w-8 h-8" />}
                          {index > 2 && `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-black text-gray-900">{tc.name}</p>
                          <p className="text-sm text-gray-500 font-semibold">{tc.mobile}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-6 text-center">
                          <div>
                            <p className="text-3xl font-black text-indigo-600">{periodData.calls}</p>
                            <p className="text-xs text-gray-500 font-bold">Calls</p>
                          </div>
                          <div>
                            <p className="text-3xl font-black text-green-600">{periodData.connected}</p>
                            <p className="text-xs text-gray-500 font-bold">Connected</p>
                          </div>
                          <div>
                            <p className="text-3xl font-black text-amber-600">{periodData.callbacks || 0}</p>
                            <p className="text-xs text-gray-500 font-bold">Callbacks</p>
                          </div>
                          <div>
                            <p className="text-3xl font-black text-purple-600">{periodData.conversion_rate}%</p>
                            <p className="text-xs text-gray-500 font-bold">Rate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Telecaller Details Modal */}
      {showDetailsModal && selectedTelecaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => setShowDetailsModal(false)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-2xl border-2 border-white/30">
                    {selectedTelecaller.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedTelecaller.name}</h2>
                    <p className="text-white/80 font-semibold flex items-center gap-2 mt-1">
                      <PhoneCall className="w-4 h-4" />
                      {selectedTelecaller.mobile}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs flex items-center justify-center text-white transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Period Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                {['today', 'week', 'month', 'all'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-white'
                      }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Calls', value: getTelecallerPeriodData(selectedTelecaller).calls, icon: PhoneCall, color: 'from-blue-500 to-cyan-600' },
                  { label: 'Connected', value: getTelecallerPeriodData(selectedTelecaller).connected, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
                  { label: 'Callbacks', value: getTelecallerPeriodData(selectedTelecaller).callbacks || 0, icon: PhoneIncoming, color: 'from-amber-500 to-orange-600' },
                  { label: 'Conversion Rate', value: `${getTelecallerPeriodData(selectedTelecaller).conversion_rate}%`, icon: Target, color: 'from-purple-500 to-pink-600' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="relative group">
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.color} rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-all`}></div>
                      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 group-hover:shadow-lg transition-all">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Email</span>
                      <span className="text-sm font-bold text-gray-900">{selectedTelecaller.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Status</span>
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${selectedTelecaller.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {selectedTelecaller.status === 'active' ? 'Active' : 'Idle'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Joined Date</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedTelecaller.created_at ? new Date(selectedTelecaller.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 font-semibold">Last Activity</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedTelecaller.last_call_time ? new Date(selectedTelecaller.last_call_time).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Total Duration</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.floor(getTelecallerPeriodData(selectedTelecaller).duration / 3600)}h {Math.floor((getTelecallerPeriodData(selectedTelecaller).duration % 3600) / 60)}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Avg Call Duration</span>
                      <span className="text-sm font-bold text-gray-900">
                        {getTelecallerPeriodData(selectedTelecaller).calls > 0
                          ? `${Math.floor(getTelecallerPeriodData(selectedTelecaller).duration / getTelecallerPeriodData(selectedTelecaller).calls / 60)}m ${Math.floor((getTelecallerPeriodData(selectedTelecaller).duration / getTelecallerPeriodData(selectedTelecaller).calls) % 60)}s`
                          : '0m 0s'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 font-semibold">Connection Rate</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {getTelecallerPeriodData(selectedTelecaller).calls > 0
                          ? ((getTelecallerPeriodData(selectedTelecaller).connected / getTelecallerPeriodData(selectedTelecaller).calls) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 font-semibold">Not Connected</span>
                      <span className="text-sm font-bold text-gray-900">
                        {getTelecallerPeriodData(selectedTelecaller).calls - getTelecallerPeriodData(selectedTelecaller).connected - (getTelecallerPeriodData(selectedTelecaller).callbacks || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Time Performance */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-200">
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  All Time Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-indigo-600">{selectedTelecaller.all_time.calls}</p>
                    <p className="text-xs text-gray-600 font-bold uppercase mt-1">Total Calls</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-600">{selectedTelecaller.all_time.connected}</p>
                    <p className="text-xs text-gray-600 font-bold uppercase mt-1">Connected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-amber-600">{selectedTelecaller.all_time.callbacks || 0}</p>
                    <p className="text-xs text-gray-600 font-bold uppercase mt-1">Callbacks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-600">{selectedTelecaller.all_time.conversion_rate}%</p>
                    <p className="text-xs text-gray-600 font-bold uppercase mt-1">Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedManagement;
