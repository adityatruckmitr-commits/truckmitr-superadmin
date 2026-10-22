import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@teleadmin/router';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Phone, Clock, User, Calendar, Search, Filter, Download, RefreshCw } from 'lucide-react-teleadmin';
import { format } from 'date-fns';

const CallMonitoring = () => {
  const [searchParams] = useSearchParams();
  const [dateFilter, setDateFilter] = useState('today');
  const [telecallerId, setTelecallerId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [audioModal, setAudioModal] = useState(null);

  // Read status and date from URL parameters on mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    const dateFromUrl = searchParams.get('date');
    
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
    
    if (dateFromUrl) {
      setDateFilter(dateFromUrl);
    }
  }, [searchParams]);

  // Get list of telecallers
  const { data: telecallers } = useQuery({
    queryKey: ['telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/manager_dashboard_api.php?action=telecallers`);
      return response.data.telecallers || [];
    },
  });

  const { data: callLogs, isLoading, refetch } = useQuery({
    queryKey: ['call-logs', dateFilter, telecallerId, statusFilter],
    queryFn: async () => {
      let url = `${API_BASE_URL}/call_monitoring_api.php?filter=${dateFilter}`;
      if (telecallerId) url += `&telecaller_id=${telecallerId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const response = await axios.get(url);
      return response.data;
    },
    refetchInterval: 10000,
  });

  // Filter calls based on search query
  const filteredCalls = useMemo(() => {
    if (!callLogs?.data) return [];
    if (!searchQuery) return callLogs.data;

    const query = searchQuery.toLowerCase();
    return callLogs.data.filter(call => 
      call.telecaller_name?.toLowerCase().includes(query) ||
      call.driver_name?.toLowerCase().includes(query) ||
      call.driver_mobile?.toLowerCase().includes(query) ||
      call.feedback?.toLowerCase().includes(query) ||
      call.call_status?.toLowerCase().includes(query)
    );
  }, [callLogs?.data, searchQuery]);

  const getStatusColor = (status) => {
    const colors = {
      'connected': 'bg-green-100 text-green-700 border-green-200',
      'callback': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'callback_later': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'pending': 'bg-red-100 text-red-700 border-red-200',
      'not_connected': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getDisplayStatus = (call) => {
    // Use display_status from API if available
    if (call.display_status) {
      return call.display_status.replace('_', ' ');
    }
    // Fallback logic
    if (call.call_status === 'pending') return 'not connected';
    return call.call_status?.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time call tracking and monitoring</p>
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
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Telecaller Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telecaller</label>
            <select
              value={telecallerId}
              onChange={(e) => setTelecallerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Telecallers</option>
              {telecallers?.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="connected">Connected</option>
              <option value="callback">Callback</option>
              <option value="pending">Not Connected</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search calls..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(telecallerId || statusFilter || searchQuery) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {telecallerId && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                Telecaller: {telecallers?.find(tc => tc.id === telecallerId)?.name}
                <button onClick={() => setTelecallerId('')} className="ml-1 hover:text-indigo-900">×</button>
              </span>
            )}
            {statusFilter && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                Status: {statusFilter.replace('_', ' ')}
                <button onClick={() => setStatusFilter('')} className="ml-1 hover:text-indigo-900">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-indigo-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setTelecallerId('');
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-xs p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{callLogs?.stats?.total_calls || 0}</p>
            </div>
            <Phone className="w-10 h-10 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-xs p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Connected</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{callLogs?.stats?.connected || 0}</p>
            </div>
            <Phone className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-xs p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Callbacks</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{callLogs?.stats?.callbacks || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-xs p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Not Connected</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{callLogs?.stats?.not_connected || 0}</p>
            </div>
            <Phone className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Call Logs</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredCalls.length} of {callLogs?.pagination?.total || 0} calls
            </p>
          </div>
          <button
            onClick={() => {
              // Export functionality can be added here
              alert('Export functionality coming soon!');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Phone className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No calls found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telecaller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">#{call.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {call.call_time ? format(new Date(call.call_time), 'HH:mm:ss') : 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {call.call_time ? format(new Date(call.call_time), 'dd MMM yyyy') : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{call.telecaller_name || 'N/A'}</span>
                          <span className="text-xs text-gray-500">{call.telecaller_mobile || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{call.driver_name || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{call.driver_role || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{call.driver_mobile || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{call.call_duration ? `${call.call_duration}s` : '0s'}</span>
                        </div>
                        {call.durn && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <span>Bill: {call.billsec || call.durn}s</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(call.display_status || call.call_status)}`}>
                        {getDisplayStatus(call)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {call.action ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-sm">
                          {call.action}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">{call.feedback || '-'}</p>
                        {call.remarks && (
                          <p className="text-xs text-gray-500 truncate mt-1">{call.remarks}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {/* Recording from call_logs table */}
                        {(call.recording_url || call.manual_call_recording_url) && (
                          <button
                            onClick={() => setAudioModal({
                              url: call.recording_url || call.manual_call_recording_url,
                              title: `Call Recording - ${call.telecaller_name} → ${call.driver_name}`,
                              type: 'call_logs'
                            })}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                            Play Call
                          </button>
                        )}
                        {/* Recording from web_hook table */}
                        {call.recfile && (
                          <button
                            onClick={() => setAudioModal({
                              url: `https://client.easygoivr.com/monitor/${call.recfile}`,
                              title: `WebHook Recording - ${call.telecaller_name} → ${call.driver_name}`,
                              type: 'webhook'
                            })}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium transition-colors"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                            Play WebHook
                          </button>
                        )}
                        {!call.recording_url && !call.manual_call_recording_url && !call.recfile && (
                          <span className="text-gray-400 text-sm">No recording</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audio Player Modal */}
      {audioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Play Recording</h3>
              <button
                onClick={() => setAudioModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{audioModal.title}</p>
              <audio
                controls
                autoPlay
                className="w-full"
                src={audioModal.url}
              >
                Your browser does not support the audio element.
              </audio>
              <div className="mt-4 flex gap-2">
                <a
                  href={audioModal.url}
                  download
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium"
                >
                  Download
                </a>
                <button
                  onClick={() => setAudioModal(null)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallMonitoring;
