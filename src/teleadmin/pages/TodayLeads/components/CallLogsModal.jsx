import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import leadsApi from '../../../services/api/leadsApi';
import { X, Phone, Clock, MessageSquare, FileText, Calendar, Filter } from 'lucide-react-teleadmin';

const CallLogsModal = ({ lead, onClose }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const callLogs = lead?.full_details?.call_logs || lead?.call_logs || [];
  console.log('CallLogsModal lead:', lead, 'logs:', callLogs);


  // Fetch connected call history for recordings specific to this lead
  const { data: recordingsResponse } = useQuery({
    queryKey: ['connected-call-history', lead?.mobile],
    queryFn: () => leadsApi.getConnectedCallHistory({ search: lead?.mobile }),
    enabled: !!lead?.mobile,
    staleTime: 300000,
  });

  const recordings = recordingsResponse?.data || [];

  // Helper to find matching recording
  const findRecording = (log, lead) => {
    // Only attempt to find/show recording for connected calls
    if ((log.call_status || '').toLowerCase() !== 'connected') return null;
    if (!recordings.length) return null;

    const leadMobile = String(lead.mobile || '').replace(/^0+/, '');
    const logAssignedTo = String(log.assigned_to || lead.assigned_to || ''); // Try log assigned_to first
    const logTime = new Date(log.created_at || log.call_time).getTime(); // Prefer created_at

    if (isNaN(logTime)) return null;

    // Find the closest matching recording within a reasonable time window (e.g., 5 minutes)
    let bestMatch = null;
    let minDiff = 5 * 60 * 1000; // 5 minutes threshold

    recordings.forEach(rec => {
      // 1. Agent Check: Linkedid must match assigned_to
      const recLinkedId = String(rec.Linkedid || rec.linkedid || '');
      if (recLinkedId !== logAssignedTo) return;

      // 2. Mobile Check: Caller ID must match lead mobile
      const recCallerId = String(rec.caller_id || '').replace(/^0+/, '');
      if (recCallerId !== leadMobile) return;

      // 3. Time Check: recording ans_time approx equal to log created_at
      const recTime = new Date(rec.exten_ans_time).getTime();
      if (isNaN(recTime)) return;

      const diff = Math.abs(logTime - recTime);

      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = rec;
      }
    });

    return bestMatch;
  };

  // Get unique call statuses
  const uniqueStatuses = [...new Set(callLogs.map(log => log.call_status).filter(Boolean))];

  // Filter call logs based on selected status
  const filteredCallLogs = statusFilter === 'all'
    ? callLogs
    : callLogs.filter(log => log.call_status === statusFilter);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 0 || value === '0';
  };

  const renderValue = (value) => {
    if (isEmpty(value)) {
      return <span className="text-red-500 font-medium">-</span>;
    }
    return <span className="text-gray-900">{value}</span>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      connected: { bg: 'bg-green-100', text: 'text-green-700', label: 'Connected' },
      not_connected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Not Connected' },
      callback_later: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Callback Later' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      busy: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Busy' },
      no_answer: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'No Answer' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'Unknown' };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Call Logs</h2>
            <p className="text-indigo-100 text-sm">
              {lead?.name} ({lead?.unique_id}) - Total Calls: {callLogs.length}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Filter Section */}
          {callLogs.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                  >
                    All ({callLogs.length})
                  </button>
                  {uniqueStatuses.map(status => {
                    const count = callLogs.filter(log => log.call_status === status).length;
                    const statusConfig = {
                      connected: { label: 'Connected', color: 'green' },
                      not_connected: { label: 'Not Connected', color: 'red' },
                      callback_later: { label: 'Callback Later', color: 'orange' },
                      pending: { label: 'Pending', color: 'yellow' },
                      busy: { label: 'Busy', color: 'purple' },
                      no_answer: { label: 'No Answer', color: 'gray' }
                    };
                    const config = statusConfig[status] || { label: status, color: 'gray' };

                    return (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                          ? `bg-${config.color}-600 text-white shadow-md`
                          : `bg-white text-gray-700 border border-gray-300 hover:bg-${config.color}-50`
                          }`}
                      >
                        {config.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {filteredCallLogs.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {callLogs.length === 0 ? 'No call logs found' : 'No call logs match the selected filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCallLogs.map((log, index) => (
                <div key={log.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Call Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Call #{filteredCallLogs.length - index}</div>
                        <div className="text-sm text-gray-500">Reference: {log.reference_id || '-'}</div>
                      </div>
                    </div>
                    {getStatusBadge(log.call_status)}
                  </div>

                  {/* Call Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* <div>
                      <div className="text-xs text-gray-500 mb-1">Active Time</div>
                      <div className="font-medium text-gray-900">{renderValue(log.active_time)} seconds</div>
                    </div> */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Call Feedback</div>
                      <div className="font-medium text-gray-900">{renderValue(log.call_feedback)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Call Remarks</div>
                      <div className="font-medium text-gray-900">{renderValue(log.call_remarks)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Process</div>
                      <div className="font-medium text-gray-900 capitalize">{renderValue(log.process)}</div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-white rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Call Time</div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(log.call_time)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Initiated At</div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(log.call_initiated_at)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Completed At</div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(log.call_completed_at)}</div>
                      </div>
                    </div>
                  </div> */}

                  {/* Feedback & Remarks */}
                  {/* {(!isEmpty(log.feedback) || !isEmpty(log.remarks) || !isEmpty(log.notes)) && (
                    <div className="space-y-2 bg-white rounded-lg p-3">
                      {!isEmpty(log.feedback) && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Feedback</div>
                            <div className="text-sm text-gray-900">{log.feedback}</div>
                          </div>
                        </div>
                      )}
                      {!isEmpty(log.remarks) && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Remarks</div>
                            <div className="text-sm text-gray-900">{log.remarks}</div>
                          </div>
                        </div>
                      )}
                      {!isEmpty(log.notes) && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">Notes</div>
                            <div className="text-sm text-gray-900">{log.notes}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )} */}

                  {(() => {
                    const matchedRecording = findRecording(log, lead);
                    const finalRecordingUrl = log.recording_url || log.manual_call_recording_url || (matchedRecording?.recfile ? `https://client.easygoivr.com/monitor/${matchedRecording.recfile}` : null);

                    if (!finalRecordingUrl) return null;
                    if ((log.call_status || '').toLowerCase() !== 'connected') return null;

                    return (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">Recording</div>
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-700">
                              {log.recording_url ? 'Auto Recording' : log.manual_call_recording_url ? 'Manual Recording' : 'Matched Recording'}
                            </span>
                          </div>
                          <audio
                            controls
                            className="w-full h-10"
                            preload="metadata"
                          >
                            <source src={finalRecordingUrl} type="audio/mpeg" />
                            <source src={finalRecordingUrl} type="audio/wav" />
                            <source src={finalRecordingUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogsModal;
