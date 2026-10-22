import { useQuery } from '@tanstack/react-query';
import { 
  X, Phone, Calendar, Clock, User, Play, Download,
  History, Activity, Headphones, FileText, AlertCircle,
  Video, PhoneIncoming, MessageSquare
} from 'lucide-react-teleadmin';
import jobMatchingApi from '../services/api/jobMatchingApi';

const CallHistoryModal = ({ isOpen, onClose, userId, jobId, leadName }) => {
    const { data: historyResponse, isLoading } = useQuery({
        queryKey: ['call-history', userId, jobId],
        queryFn: () => jobMatchingApi.getCallHistory(userId, jobId),
        enabled: isOpen && !!userId && !!jobId,
    });

    const historyData = historyResponse?.data || {};
    const history = Array.isArray(historyData.history) ? historyData.history : [];

    if (!isOpen) return null;

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'connected':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'no answer':
            case 'not connected':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'callback':
            case 'busy':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="fixed inset-0 z-[130] overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                    
                    {/* Header */}
                    <div className="p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <History className="w-8 h-8 text-indigo-300" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-1">{leadName || 'Applicant'} Call History</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                                            <Activity className="w-3 h-3" />
                                            Total Calls: {historyData.count || history.length}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                                            <PhoneIncoming className="w-3 h-3" />
                                            {historyData.mobile}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto bg-slate-50/30 p-8 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading History...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400">
                                <AlertCircle className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-lg font-black uppercase tracking-tight italic">No call history available</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {history.map((log, idx) => (
                                    <div 
                                        key={log.id || idx}
                                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <Headphones className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-0.5">{log.telecaller || 'System'}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.source || 'Standard Call'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-700">{log.date}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</p>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest text-center min-w-[100px] ${getStatusStyle(log.status)}`}>
                                                    {log.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                                    <MessageSquare className="w-3 h-3" /> Feedback
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                                    {log.feedback || 'No feedback provided'}
                                                </p>
                                            </div>
                                            <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/30">
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3" /> Remarks
                                                </p>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                                    {log.remarks || 'No remarks recorded'}
                                                </p>
                                            </div>
                                        </div>

                                        {log.recording_url && (
                                            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                                        <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Call Recording</p>
                                                        <p className="text-[8px] font-bold text-slate-400">Available for review</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <audio 
                                                        src={log.recording_url} 
                                                        className="h-8 w-48 opacity-80" 
                                                        controls
                                                    />
                                                    <a 
                                                        href={log.recording_url} 
                                                        download 
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-slate-100 shrink-0 text-center">
                        <button onClick={onClose} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95">
                            Close History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallHistoryModal;
