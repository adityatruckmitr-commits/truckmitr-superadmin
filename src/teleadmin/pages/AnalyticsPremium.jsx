import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { 
  TrendingUp, Activity, Phone, Users, Clock, Target, Filter, 
  Download, RefreshCw, PhoneCall, CheckCircle, XCircle, 
  PhoneForwarded, AlertCircle, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Zap, Award, TrendingDown
} from 'lucide-react-teleadmin';

const AnalyticsPremium = () => {
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: ['analytics-premium', period, dateFrom, dateTo, selectedTelecaller, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      });
      const response = await axios.get(`${API_BASE_URL}/admin_dashboard_stats.php?${params}`);
      return response.data.data;
    },
    refetchInterval: 15000,
  });

  // Transform data with extreme accuracy
  const analytics = useMemo(() => {
    if (!rawData) return null;
    
    const periodStats = rawData.period_stats || {};
    const totalCalls = periodStats.total_calls || 0;
    const connectedCalls = periodStats.connected_calls || 0;
    const callbacks = periodStats.callbacks || 0;
    
    return {
      key_metrics: {
        total_calls: totalCalls,
        connected_calls: connectedCalls,
        interested_calls: connectedCalls,
        not_interested_calls: periodStats.not_connected || 0,
        callbacks: callbacks,
        not_answered: periodStats.not_answered || 0,
        total_duration: periodStats.total_duration || 0,
        avg_duration: periodStats.avg_duration || 0,
        active_telecallers: periodStats.active_telecallers || 0,
        unique_leads: periodStats.unique_leads_contacted || 0,
        connection_rate: totalCalls > 0 ? ((connectedCalls / totalCalls) * 100).toFixed(2) : 0,
        conversion_rate: periodStats.conversion_rate || 0,
        callback_rate: totalCalls > 0 ? ((callbacks / totalCalls) * 100).toFixed(2) : 0,
        pending: periodStats.pending || 0
      },
      daily_trends: (rawData.call_trends || []).map(trend => ({
        date: trend.date,
        'Total Calls': trend.calls || 0,
        'Connected': trend.connected || 0,
        'Callbacks': trend.callbacks || 0
      })),
      hourly_data: (rawData.hourly_distribution || []).map(hour => ({
        hour: hour.hour,
        calls: hour.calls || 0,
        connected: hour.connected || 0
      })),
      status_pie: (rawData.call_distribution || []).map(status => ({
        id: status.name,
        label: status.name,
        value: status.value || 0
      })),
      feedback_data: (rawData.feedback_distribution || []).map(fb => ({
        feedback: fb.feedback,
        count: fb.count || 0
      })),
      telecaller_performance: (rawData.telecallers_performance || []).map(tc => ({
        name: tc.name,
        'Total Calls': tc.today?.calls || 0,
        'Connected': tc.today?.connected || 0,
        'Interested': tc.today?.interested || 0,
        'Callbacks': tc.today?.callbacks || 0,
        conversion_rate: tc.today?.conversion_rate || 0
      })),
      telecaller_list: (rawData.telecallers_performance || []).map(tc => ({
        id: tc.id,
        name: tc.name
      })),
      performance_comparison: rawData.performance_comparison || [],
      recent_activity: rawData.recent_activity || []
    };
  }, [rawData]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-indigo-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Activity className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading Premium Analytics...</p>
      </div>
    );
  }

  const metrics = analytics?.key_metrics || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <BarChart3 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold">Premium Analytics</h1>
                <p className="text-indigo-100 mt-1 text-lg">Advanced 3D Visualizations & Real-time Insights</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-xs hover:bg-white/30 rounded-xl transition-all transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-semibold">Refresh</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all transform hover:scale-105 font-semibold">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-xl p-6 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Advanced Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Telecaller</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500"
            >
              <option value="">All Telecallers</option>
              {analytics?.telecaller_list?.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500"
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

      {/* Premium KPI Cards with 3D Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Total Calls</h3>
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Phone className="w-8 h-8" />
              </div>
            </div>
            <p className="text-5xl font-black mb-2">{formatNumber(metrics.total_calls || 0)}</p>
            <div className="flex items-center gap-2 text-blue-100">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{metrics.active_telecallers || 0} Active Telecallers</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Pending: {metrics.pending || 0}</span>
                <span className="font-bold">100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Connected</h3>
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <p className="text-5xl font-black mb-2">{formatNumber(metrics.connected_calls || 0)}</p>
            <div className="flex items-center gap-2 text-green-100">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">{metrics.connection_rate}% Connection Rate</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${metrics.connection_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Conversion</h3>
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Target className="w-8 h-8" />
              </div>
            </div>
            <p className="text-5xl font-black mb-2">{metrics.conversion_rate}%</p>
            <div className="flex items-center gap-2 text-purple-100">
              <Award className="w-5 h-5" />
              <span className="font-semibold">{formatNumber(metrics.interested_calls || 0)} Interested</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${metrics.conversion_rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Avg Duration</h3>
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Clock className="w-8 h-8" />
              </div>
            </div>
            <p className="text-5xl font-black mb-2">{formatDuration(metrics.avg_duration || 0)}</p>
            <div className="flex items-center gap-2 text-orange-100">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Total: {formatDuration(metrics.total_duration || 0)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-sm">
                <span>Efficiency Score: </span>
                <span className="font-bold">
                  {metrics.avg_duration > 0 ? Math.min(100, Math.round((metrics.avg_duration / 300) * 100)) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Callbacks', value: metrics.callbacks, icon: PhoneForwarded, color: 'from-yellow-400 to-orange-500', rate: metrics.callback_rate },
          { label: 'Not Answered', value: metrics.not_answered, icon: XCircle, color: 'from-red-400 to-pink-500', rate: null },
          { label: 'Unique Leads', value: metrics.unique_leads, icon: Users, color: 'from-indigo-400 to-blue-500', rate: null },
          { label: 'Not Interested', value: metrics.not_interested_calls, icon: TrendingDown, color: 'from-gray-400 to-slate-500', rate: null }
        ].map((metric, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${metric.color} rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <metric.icon className="w-8 h-8 opacity-80" />
              <span className="text-sm font-semibold opacity-90">{metric.label}</span>
            </div>
            <p className="text-3xl font-black">{formatNumber(metric.value || 0)}</p>
            {metric.rate && <p className="text-sm mt-1 opacity-90">{metric.rate}% rate</p>}
          </div>
        ))}
      </div>

      {/* 3D-Style Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends - 3D Line Chart */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2">
              <LineChartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Daily Performance Trends</h3>
              <p className="text-sm text-gray-600">Last 7 days analysis</p>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveLine
              data={[
                {
                  id: 'Total Calls',
                  data: (analytics?.daily_trends || []).slice(-7).map(d => ({ x: d.date, y: d['Total Calls'] }))
                },
                {
                  id: 'Connected',
                  data: (analytics?.daily_trends || []).slice(-7).map(d => ({ x: d.date, y: d['Connected'] }))
                },
                {
                  id: 'Callbacks',
                  data: (analytics?.daily_trends || []).slice(-7).map(d => ({ x: d.date, y: d['Callbacks'] }))
                }
              ]}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              curve="catmullRom"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Date',
                legendOffset: 45,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Count',
                legendOffset: -50,
                legendPosition: 'middle'
              }}
              enableGridX={false}
              colors={['#6366f1', '#10b981', '#f59e0b']}
              lineWidth={4}
              pointSize={12}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={3}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={{
                fontSize: 12,
                textColor: '#374151',
                tooltip: {
                  container: {
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: 14,
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Hourly Distribution - 3D Bar Chart */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-2">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Hourly Call Distribution</h3>
              <p className="text-sm text-gray-600">Peak hours analysis</p>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveBar
              data={analytics?.hourly_data?.filter(h => h.calls > 0) || []}
              keys={['calls', 'connected']}
              indexBy="hour"
              margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
              padding={0.3}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={['#6366f1', '#10b981']}
              borderRadius={8}
              borderWidth={2}
              borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Hour',
                legendPosition: 'middle',
                legendOffset: 45
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Calls',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              enableLabel={true}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor="#ffffff"
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={{
                fontSize: 12,
                textColor: '#374151',
                tooltip: {
                  container: {
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: 14,
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Distribution - 3D Pie Chart */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg p-2">
            <PieChartIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Call Status Distribution</h3>
            <p className="text-sm text-gray-600">Comprehensive breakdown</p>
          </div>
        </div>
        <div style={{ height: '500px' }}>
          <ResponsivePie
            data={analytics?.status_pie || []}
            margin={{ top: 40, right: 200, bottom: 80, left: 80 }}
            innerRadius={0.6}
            padAngle={2}
            cornerRadius={8}
            activeOuterRadiusOffset={12}
            colors={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']}
            borderWidth={3}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#374151"
            arcLinkLabelsThickness={3}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#ffffff"
            arcLabel={d => `${d.value}`}
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 140,
                translateY: 0,
                itemsSpacing: 8,
                itemWidth: 120,
                itemHeight: 24,
                itemTextColor: '#374151',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 20,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000',
                      itemBackground: '#f3f4f6'
                    }
                  }
                ]
              }
            ]}
            theme={{
              fontSize: 13,
              textColor: '#374151',
              tooltip: {
                container: {
                  background: '#ffffff',
                  color: '#374151',
                  fontSize: 14,
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Telecaller Performance - 3D Bar Chart */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Telecaller Performance Matrix</h3>
            <p className="text-sm text-gray-600">Multi-dimensional comparison</p>
          </div>
        </div>
        <div style={{ height: '500px' }}>
          <ResponsiveBar
            data={analytics?.telecaller_performance || []}
            keys={['Total Calls', 'Connected', 'Interested', 'Callbacks']}
            indexBy="name"
            margin={{ top: 50, right: 180, bottom: 80, left: 80 }}
            padding={0.25}
            groupMode="grouped"
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['#6366f1', '#10b981', '#f59e0b', '#ec4899']}
            borderRadius={6}
            borderWidth={2}
            borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Telecaller',
              legendPosition: 'middle',
              legendOffset: 65
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Count',
              legendPosition: 'middle',
              legendOffset: -60
            }}
            enableLabel={true}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 150,
                translateY: 0,
                itemsSpacing: 4,
                itemWidth: 140,
                itemHeight: 24,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              fontSize: 12,
              textColor: '#374151',
              tooltip: {
                container: {
                  background: '#ffffff',
                  color: '#374151',
                  fontSize: 14,
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2">
              <PhoneCall className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Live Activity Feed</h3>
              <p className="text-sm text-gray-600">Real-time call updates</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {analytics?.recent_activity?.slice(0, 15).map((activity, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl hover:shadow-md transition-all">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full p-3">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{activity.telecaller}</p>
                <p className="text-sm text-gray-600">{activity.action}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-indigo-600">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison Table */}
      {analytics?.performance_comparison?.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-2">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Performance Comparison</h3>
              <p className="text-sm text-gray-600">Today vs Week vs Month</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Metric</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Today</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">This Week (Avg)</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">This Month (Avg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.performance_comparison.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{row.metric}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {formatNumber(row.today)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {formatNumber(row.week)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                        {formatNumber(row.month)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPremium;
