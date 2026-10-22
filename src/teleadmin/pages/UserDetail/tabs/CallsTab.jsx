import React, { useState } from 'react';
import { PhoneCall, Eye, X, Loader2, Volume2 } from 'lucide-react-teleadmin';
import baseApi from '../../../services/api/baseApi';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const CallsTab = ({ callLogs, user }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAttempts = async (log) => {
    setSelectedLog(log);
    setModalOpen(true);
    setLoading(true);
    setAttempts([]);
    try {
      // Use the newly created API route under /telehead
      const response = await baseApi.get(`/telehead/call-logs/${log.id}/attempts`);
      if (Array.isArray(response)) {
        setAttempts(response);
      } else if (response && Array.isArray(response.data)) {
        setAttempts(response.data);
      } else {
        setAttempts([]);
      }
    } catch (error) {
      console.error('Failed to fetch call attempts:', error);
      alert('Failed to fetch call attempts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedLog(null);
    setAttempts([]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <PhoneCall className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Call History</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200">#</th>
              <th className="px-6 py-4 border-b border-slate-200">Job ID</th>
              <th className="px-6 py-4 border-b border-slate-200">Transporter</th>
              <th className="px-6 py-4 border-b border-slate-200">Driver</th>
              <th className="px-6 py-4 border-b border-slate-200">Call Initiated By</th>
              <th className="px-6 py-4 border-b border-slate-200">Date</th>
              <th className="px-6 py-4 border-b border-slate-200">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {callLogs && callLogs.length > 0 ? (
              callLogs.map((log, index) => {
                // Determine row background color matching blade logic
                let rowClass = 'hover:bg-slate-50/50';
                if (user.role === 'driver' && log.call_initiated_by === 'driver') {
                  rowClass = 'bg-blue-50/50 hover:bg-blue-50';
                } else if (user.role === 'transporter' && log.call_initiated_by === 'transporter') {
                  rowClass = 'bg-blue-50/50 hover:bg-blue-50';
                } else if (user.role === 'driver' && log.call_initiated_by === 'transporter') {
                  rowClass = 'bg-emerald-50/50 hover:bg-emerald-50';
                } else if (user.role === 'transporter' && log.call_initiated_by === 'driver') {
                  rowClass = 'bg-emerald-50/50 hover:bg-emerald-50';
                }

                return (
                  <tr key={index} className={rowClass}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 font-mono">{log.job_id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{log.transporter_name}</p>
                      {log.transporter_tm_id && <p className="text-[10px] text-slate-500 font-mono">({log.transporter_tm_id})</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{log.driver_name}</p>
                      {log.driver_tm_id && <p className="text-[10px] text-slate-500 font-mono">({log.driver_tm_id})</p>}
                    </td>
                    <td className="px-6 py-4">
                      {log.call_initiated_by === 'driver' ? (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">Driver</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">Transporter</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <button
                        onClick={() => fetchAttempts(log)}
                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center"
                        title="View Call Attempts"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <PhoneCall className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No call history found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Attempts Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Call Attempts & Recordings</h3>
                  {selectedLog && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Transporter: <span className="font-semibold">{selectedLog.transporter_name}</span> | Driver: <span className="font-semibold">{selectedLog.driver_name}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">Loading actual call attempts...</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                        <th className="px-4 py-3 border-b border-slate-100">Attempt</th>
                        <th className="px-4 py-3 border-b border-slate-100">Start Time</th>
                        <th className="px-4 py-3 border-b border-slate-100 font-bold">Call Initiated By</th>
                        <th className="px-4 py-3 border-b border-slate-100">Duration</th>
                        <th className="px-4 py-3 border-b border-slate-100">Disposition</th>
                        <th className="px-4 py-3 border-b border-slate-100">Action</th>
                        <th className="px-4 py-3 border-b border-slate-100">Call Player</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attempts.length > 0 ? (
                        attempts.map((attempt, index) => {
                          let dispClass = 'bg-slate-100 text-slate-700';
                          if (attempt.disposition === 'ANSWERED') {
                            dispClass = 'bg-emerald-100 text-emerald-700';
                          } else if (attempt.disposition === 'NO ANSWER') {
                            dispClass = 'bg-amber-100 text-amber-700';
                          } else if (attempt.disposition === 'BUSY' || attempt.disposition === 'FAILED') {
                            dispClass = 'bg-rose-100 text-rose-700';
                          }

                          return (
                            <tr key={attempt.id || index} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3.5 text-sm font-medium text-slate-500">{index + 1}</td>
                              <td className="px-4 py-3.5 text-sm font-medium text-slate-800 whitespace-nowrap">{attempt.start_time}</td>
                              <td className="px-4 py-3.5 text-sm">
                                {attempt.initiated_by === 'Transporter' ? (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm">Transporter</span>
                                ) : attempt.initiated_by === 'Driver' ? (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-sm">Driver</span>
                                ) : (
                                  <span className="text-slate-500 font-mono text-xs">{attempt.initiated_by}</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-medium text-slate-600">{attempt.duration}</td>
                              <td className="px-4 py-3.5 text-sm">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${dispClass}`}>
                                  {attempt.disposition}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-slate-500 font-medium">{attempt.action}</td>
                              <td className="px-4 py-3.5">
                                {attempt.recording_url ? (
                                  <audio
                                    src={attempt.recording_url}
                                    controls
                                    className="h-8 max-w-[200px]"
                                  />
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">No Recording</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-sm text-slate-400 font-medium">
                            No telephony attempts found for this transaction time frame.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallsTab;
