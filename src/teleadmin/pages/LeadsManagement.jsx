import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  Search, Phone, Mail, Calendar, Filter, Eye, PhoneCall, Clock,
  User, Target, TrendingUp, CheckCircle2, XCircle, AlertCircle,
  Volume2, Download, Play, Pause, Briefcase, Database
} from 'lucide-react-teleadmin';

const LeadsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [period, setPeriod] = useState('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);

  const [callDetailsModal, setCallDetailsModal] = useState(null);

  // Fetch details when call details modal is opened
  const { data: callDetailsData } = useQuery({
    queryKey: ['call-details', callDetailsModal],
    queryFn: async () => {
      if (!callDetailsModal) return null;
      const response = await axios.get(
        `${API_BASE_URL}/admin_leads_detailed_api.php?action=details&lead_id=${callDetailsModal}`
      );
      return response.data;
    },
    enabled: !!callDetailsModal,
  });

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', searchTerm, period, dateFrom, dateTo, statusFilter],
    queryFn: async () => {
      let url = `${API_BASE_URL}/admin_leads_detailed_api.php?action=list&search=${searchTerm}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const response = await axios.get(url);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const { data: leadDetails } = useQuery({
    queryKey: ['lead-details', selectedLead],
    queryFn: async () => {
      if (!selectedLead) return null;
      const response = await axios.get(
        `${API_BASE_URL}/admin_leads_detailed_api.php?action=details&lead_id=${selectedLead}`
      );
      return response.data;
    },
    enabled: !!selectedLead,
  });

  const leads = leadsData?.data || [];
  
  // Debug: Log the first lead to see what data we have
  if (leads.length > 0) {
    console.log('First lead data:', leads[0]);
  }

  const getStatusColor = (status) => {
    const colors = {
      interested: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      not_interested: 'bg-red-100 text-red-700 border-red-200',
      callback: 'bg-amber-100 text-amber-700 border-amber-200',
      connected: 'bg-blue-100 text-blue-700 border-blue-200',
      pending: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl shadow-lg">
                <Target className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Leads Management</h1>
                <p className="text-gray-500 text-base">Complete lead tracking with call recordings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <div className="space-y-4">
            {/* Period Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Period:</span>
              <div className="flex gap-2">
                {['today', 'week', 'month', 'all'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      period === p
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Status:</span>
              <div className="flex gap-2">
                {['all', 'interested', 'not_interested', 'callback', 'pending'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s === 'all' ? '' : s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      (s === 'all' && !statusFilter) || statusFilter === s
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search leads by name, mobile, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Leads List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {lead.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                        <p className="text-sm text-blue-600 font-medium">ID: {lead.tmid || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(lead.last_call_status)}`}>
                            {lead.last_call_status || 'No calls'}
                          </span>
                          <span className="text-sm text-gray-500">{lead.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{lead.mobile}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{lead.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{lead.assigned_telecaller || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{lead.last_call_time ? new Date(lead.last_call_time).toLocaleDateString() : 'Never'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        {lead.subscription_status === 'active' ? (
                          <span className="text-emerald-600 font-semibold">
                            Active ({lead.subscription_end ? new Date(lead.subscription_end).toLocaleDateString() : ''})
                          </span>
                        ) : lead.subscription_status === 'expired' ? (
                          <span className="text-amber-600">Expired</span>
                        ) : (
                          <span className="text-gray-500">No subscription</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => setCallDetailsModal(lead.id)}
                        className="flex items-center gap-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <PhoneCall className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-600">{lead.total_calls} calls</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold">{lead.connected_calls} connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold">{lead.interested_calls} interested</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLead(lead.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lead Details Modal */}
        {selectedLead && leadDetails?.success && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
                    <p className="text-sm text-gray-500 mt-1">TMID: {leadDetails.lead.tmid || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Lead Info */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{leadDetails.lead.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-semibold text-gray-900">{leadDetails.lead.mobile}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{leadDetails.lead.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-semibold text-gray-900">{leadDetails.lead.role}</p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Overview Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <PhoneCall className="w-6 h-6 text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{leadDetails.statistics.total_calls}</p>
                      <p className="text-sm text-gray-600">Total Calls</p>
                      <p className="text-xs text-gray-500 mt-1">{leadDetails.statistics.recordings_count} recordings</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{leadDetails.statistics.connected}</p>
                      <p className="text-sm text-gray-600">Connected</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{leadDetails.statistics.interested}</p>
                      <p className="text-sm text-gray-600">Interested</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <Briefcase className="w-6 h-6 text-cyan-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{leadDetails.statistics.applied_jobs_count}</p>
                      <p className="text-sm text-gray-600">Jobs Applied</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <Target className="w-6 h-6 text-amber-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{leadDetails.statistics.subscriptions_count}</p>
                      <p className="text-sm text-gray-600">Subscriptions</p>
                      {leadDetails.statistics.active_subscription && (
                        <p className="text-xs text-emerald-600 mt-1">● Active</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applied Jobs */}
                {leadDetails.applied_jobs && leadDetails.applied_jobs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Applied Jobs ({leadDetails.applied_jobs.length})
                    </h3>
                    <div className="space-y-3">
                      {leadDetails.applied_jobs.map((job) => (
                        <div key={job.applicationId} className="bg-white rounded-xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{job.jobTitle}</h4>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                                  {job.jobCode}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <p>Company: {job.companyName || 'N/A'}</p>
                                <p>Location: {job.location}</p>
                                <p>Salary: {job.salaryRange}</p>
                                <p>Applied: {new Date(job.appliedAt).toLocaleDateString()}</p>
                                {job.transporterName && (
                                  <p className="col-span-2">Transporter: {job.transporterName} ({job.transporterTmid})</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscriptions */}
                {leadDetails.subscriptions && leadDetails.subscriptions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Subscription History ({leadDetails.subscriptions.length})
                    </h3>
                    <div className="space-y-3">
                      {leadDetails.subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-white rounded-xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold text-gray-900">₹{sub.amount}</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                                  sub.paymentStatus === 'captured' 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                  {sub.paymentStatus}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <p>Start: {new Date(sub.startDate).toLocaleDateString()}</p>
                                <p>End: {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A'}</p>
                                {sub.orderId && <p className="col-span-2 text-xs">Order: {sub.orderId}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call History with Recordings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5" />
                    Complete Call History ({leadDetails.call_history.length})
                  </h3>
                  <div className="space-y-3">
                    {leadDetails.call_history.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No call history yet</p>
                    ) : (
                      leadDetails.call_history.map((call, index) => (
                        <div key={`${call.source}-${call.id}-${index}`} className="bg-white rounded-xl p-4 border border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(call.call_status)}`}>
                                  {call.call_status}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {new Date(call.call_time).toLocaleString()}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-sm flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  {call.source === 'call_logs' ? 'Regular' : 'Match Making'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                Called by: <span className="font-semibold">{call.caller_name || 'Unknown'}</span>
                              </p>
                              {call.call_duration > 0 && (
                                <p className="text-sm text-gray-600 mb-1">
                                  Duration: <span className="font-semibold">{Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s</span>
                                </p>
                              )}
                              {call.feedback && (
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm font-semibold text-blue-700 mb-1">Feedback:</p>
                                  <p className="text-sm text-gray-600">{call.feedback}</p>
                                </div>
                              )}
                              {call.notes && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                                  <p className="text-sm text-gray-600">{call.notes}</p>
                                </div>
                              )}
                              {call.transporter_name && (
                                <p className="text-sm text-gray-600 mt-2">
                                  Transporter: <span className="font-semibold">{call.transporter_name}</span>
                                </p>
                              )}
                              {call.job_id && (
                                <p className="text-sm text-gray-600">
                                  Job ID: <span className="font-semibold">{call.job_id}</span>
                                </p>
                              )}
                            </div>
                            {call.recording_url && (
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => setPlayingAudio(playingAudio === `${call.source}-${call.id}` ? null : `${call.source}-${call.id}`)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  {playingAudio === `${call.source}-${call.id}` ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                                <a
                                  href={call.recording_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                          {call.recording_url && playingAudio === `${call.source}-${call.id}` && (
                            <audio
                              src={call.recording_url}
                              controls
                              autoPlay
                              className="w-full mt-3"
                              onEnded={() => setPlayingAudio(null)}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call Details Quick Modal */}
        {callDetailsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Call Details</h2>
                  <button
                    onClick={() => setCallDetailsModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {callDetailsData?.success ? (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{callDetailsData.statistics.total_calls}</p>
                        <p className="text-sm text-gray-600">Total Calls</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{callDetailsData.statistics.connected}</p>
                        <p className="text-sm text-gray-600">Connected</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">{callDetailsData.statistics.interested}</p>
                        <p className="text-sm text-gray-600">Interested</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-amber-600">{callDetailsData.statistics.recordings_count}</p>
                        <p className="text-sm text-gray-600">Recordings</p>
                      </div>
                    </div>

                    {/* Call History */}
                    <div className="space-y-3">
                      {callDetailsData.call_history.map((call, index) => (
                        <div key={`${call.source}-${call.id}-${index}`} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(call.call_status)}`}>
                                  {call.call_status}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {new Date(call.call_time).toLocaleString()}
                                </span>
                                <span className="px-2 py-1 bg-white text-gray-600 text-xs rounded-sm flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  {call.source === 'call_logs' ? 'Regular' : 'Match Making'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Caller: <span className="font-semibold">{call.caller_name || 'Unknown'}</span>
                              </p>
                              {call.call_duration > 0 && (
                                <p className="text-sm text-gray-600">
                                  Duration: {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                                </p>
                              )}
                              {call.feedback && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-semibold">Feedback:</span> {call.feedback}
                                </p>
                              )}
                            </div>
                            {call.recording_url && (
                              <a
                                href={call.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                Play
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setCallDetailsModal(null);
                        setSelectedLead(callDetailsModal);
                      }}
                      className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                      View Full Details
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsManagement;
