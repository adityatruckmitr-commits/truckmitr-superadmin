import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Phone, Users, Clock, 
  Target, Filter, Calendar, Download, RefreshCw, PhoneCall,
  CheckCircle, XCircle, PhoneForwarded, AlertCircle
} from 'lucide-react-teleadmin';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics = () => {
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', period, dateFrom, dateTo, selectedTelecaller, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      });
      const response = await axios.get(`${API_BASE_URL}/admin_dashboard_stats.php?${params}`);
      return response.data.data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Transform data for analytics
  const analytics = rawData ? {
    key_metrics: {
      total_calls: rawData.period_stats?.total_calls || 0,
      connected_calls: rawData.period_stats?.connected_calls || 0,
      interested_calls: rawData.period_stats?.connected_calls || 0,
      not_interested_calls: 0,
      callbacks: rawData.period_stats?.callbacks || 0,
      not_answered: rawData.period_stats?.not_answered || 0,
      total_duration: rawData.period_stats?.total_duration || 0,
      avg_duration: rawData.period_stats?.avg_duration || 0,
      active_telecallers: rawData.period_stats?.active_telecallers || 0,
      unique_leads: rawData.period_stats?.unique_leads_contacted || 0,
      connection_rate: rawData.period_stats?.connection_rate || 0,
      conversion_rate: rawData.period_stats?.conversion_rate || 0,
      callback_rate: rawData.period_stats?.callbacks && rawData.period_stats?.total_calls 
        ? ((rawData.period_stats.callbacks / rawData.period_stats.total_calls) * 100).toFixed(1)
        : 0
    },
    daily_trends: rawData.call_trends || [],
    hourly_distribution: rawData.hourly_distribution || [],
    status_distribution: rawData.call_distribution || [],
    feedback_distribution: rawData.feedback_distribution || [],
    telecaller_performance: (rawData.telecallers_performance || []).map(tc => ({
      id: tc.id,
      name: tc.name,
      calls: tc.today?.calls || 0,
      connected: tc.today?.connected || 0,
      interested: tc.today?.interested || 0,
      callbacks: tc.today?.callbacks || 0,
      total_duration: tc.today?.duration || 0,
      avg_duration: tc.today?.calls > 0 ? (tc.today.duration / tc.today.calls) : 0,
      unique_leads: 0,
      connection_rate: tc.today?.calls > 0 ? ((tc.today.connected / tc.today.calls) * 100).toFixed(1) : 0,
      conversion_rate: tc.today?.conversion_rate || 0
    })),
    duration_analysis: {
      ranges: []
    },
    recent_calls: rawData.recent_activity?.map(activity => ({
      id: 0,
      driver_name: activity.action?.split('Called ')[1]?.split(' - ')[0] || 'Unknown',
      driver_phone: 'N/A',
      telecaller: activity.telecaller,
      status: activity.action?.split(' - ')[1] || 'unknown',
      feedback: '',
      duration: 0,
      time: activity.time
    })) || [],
    weekly_comparison: [
      { week: 'This Week', calls: rawData.this_week?.total_calls || 0, connected: rawData.this_week?.connected_calls || 0, interested: 0 },
      { week: 'Last Week', calls: 0, connected: 0, interested: 0 }
    ],
    monthly_comparison: [
      { month: 'This Month', calls: rawData.this_month?.total_calls || 0, connected: rawData.this_month?.connected_calls || 0, interested: 0 }
    ],
    top_days: [],
    telecaller_list: (rawData.telecallers_performance || []).map(tc => ({
      id: tc.id,
      name: tc.name
    }))
  } : null;

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  const metrics = analytics?.key_metrics || {};

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-10 h-10 text-indigo-600" />
            Analytics & Reports
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telecaller</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Telecallers</option>
              {analytics?.telecaller_list?.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="connected">Connected</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="callback">Callback</option>
              <option value="not_reachable">Not Reachable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Total Calls</h3>
            <Phone className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{metrics.total_calls || 0}</p>
          <p className="text-blue-100 mt-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {metrics.active_telecallers || 0} active telecallers
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Connected Calls</h3>
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{metrics.connected_calls || 0}</p>
          <p className="text-green-100 mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {metrics.connection_rate || 0}% connection rate
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Conversion Rate</h3>
            <Target className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{metrics.conversion_rate || 0}%</p>
          <p className="text-purple-100 mt-2">{metrics.interested_calls || 0} interested leads</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Avg Duration</h3>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold">{formatDuration(metrics.avg_duration || 0)}</p>
          <p className="text-orange-100 mt-2">Total: {formatDuration(metrics.total_duration || 0)}</p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-xs p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Callbacks</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.callbacks || 0}</p>
            </div>
            <PhoneForwarded className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xs p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Not Answered</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.not_answered || 0}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xs p-4 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Leads</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.unique_leads || 0}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xs p-4 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Callback Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.callback_rate || 0}%</p>
            </div>
            <AlertCircle className="w-8 h-8 text-pink-500" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Daily Trends (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.daily_trends || []}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorConnected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="calls" stroke="#6366f1" fillOpacity={1} fill="url(#colorCalls)" name="Total Calls" />
              <Area type="monotone" dataKey="connected" stroke="#10b981" fillOpacity={1} fill="url(#colorConnected)" name="Connected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Hourly Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.hourly_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="#6366f1" name="Total Calls" />
              <Bar dataKey="connected" fill="#10b981" name="Connected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Status Distribution */}
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.status_distribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {(analytics?.status_distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Call Duration Analysis */}
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Duration Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.duration_analysis?.ranges || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Telecaller Performance */}
      <div className="bg-white rounded-xl shadow-xs p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Telecaller Performance Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analytics?.telecaller_performance || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="calls" fill="#6366f1" name="Total Calls" />
            <Bar dataKey="connected" fill="#10b981" name="Connected" />
            <Bar dataKey="interested" fill="#f59e0b" name="Interested" />
            <Bar dataKey="callbacks" fill="#ec4899" name="Callbacks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feedback Distribution */}
      {analytics?.feedback_distribution?.length > 0 && (
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.feedback_distribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="feedback" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly & Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.weekly_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="connected" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="interested" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthly_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="connected" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="interested" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Call Logs */}
      <div className="bg-white rounded-xl shadow-xs p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-600" />
            Recent Call Logs
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telecaller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics?.recent_calls?.slice(0, 20).map((call, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{call.driver_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{call.driver_phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{call.telecaller || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      call.status === 'connected' ? 'bg-green-100 text-green-800' :
                      call.status === 'interested' ? 'bg-blue-100 text-blue-800' :
                      call.status === 'callback' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{call.feedback || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(call.duration)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatTime(call.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Days */}
      {analytics?.top_days?.length > 0 && (
        <div className="bg-white rounded-xl shadow-xs p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Days (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.top_days.slice(0, 5).map((day, index) => (
              <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-sm text-gray-600 mb-1">{day.date}</p>
                <p className="text-2xl font-bold text-indigo-600">{day.calls}</p>
                <p className="text-xs text-gray-500">{day.connected} connected</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
