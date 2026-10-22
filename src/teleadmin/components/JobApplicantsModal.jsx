import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X, Search, Users, Calendar, User, Phone, MapPin,
    CheckCircle, XCircle, Clock, Star, Download, Filter,
    FileText, Shield, Award, Activity, UserCheck, Inbox,
    Briefcase, Eye, ChevronRight, PhoneIncoming, History
} from 'lucide-react-teleadmin';
import jobMatchingApi from '../services/api/jobMatchingApi';
import ApplicantDetailsModal from './ApplicantDetailsModal';
import CallHistoryModal from './CallHistoryModal';

const IMAGE_BASE_URL = 'https://truckmitr.com/public/';

const JobApplicantsModal = ({ isOpen, onClose, jobId, jobTitle, type = null }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // State for Details Modal
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // State for Call History Modal
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyApplicant, setHistoryApplicant] = useState(null);

    // Fetch applicants
    const { data: applicantsResponse, isLoading } = useQuery({
        queryKey: ['job-applicants', jobId, currentPage, searchQuery, statusFilter, type],
        queryFn: () => jobMatchingApi.getApplicants(jobId, {
            page: currentPage,
            search: searchQuery,
            status: statusFilter,
            type: type
        }),
        enabled: isOpen && !!jobId,
        keepPreviousData: true,
    });

    const applicants = Array.isArray(applicantsResponse?.data) ? applicantsResponse.data : [];
    const pagination = applicantsResponse?.pagination || {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20
    };

    if (!isOpen) return null;

    const handleViewDetails = (app) => {
        setSelectedApplicant(app);
        setIsDetailsOpen(true);
    };

    const handleViewHistory = (app) => {
        setHistoryApplicant(app);
        setIsHistoryOpen(true);
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'shortlisted':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pending':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getTelecallerStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'shortlisted': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'accepted': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                        {/* Header */}
                        <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <Users className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{jobTitle || 'Job Applicants'}</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{pagination.total} Total {type === 'screening' ? 'Screening Done' : 'Submissions'}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, ID or mobile..."
                                    className="w-full !pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-hidden transition-all font-medium text-slate-600 shadow-xs"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-hidden appearance-none cursor-pointer font-bold text-slate-600 shadow-xs min-w-[150px]"
                            >
                                <option value="">All Status</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* Simplified List */}
                        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching Applicants...</p>
                                </div>
                            ) : applicants.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400">
                                    <Inbox className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-lg font-black uppercase tracking-tight">No applicants found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">

                                    {/* Table Headings */}
                                    <div className="px-8 py-4 bg-slate-100/80 border-b border-slate-200 sticky top-0 z-10">
                                        <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                            {/* Left Section */}
                                            <div className="flex items-center gap-6 w-[40%]">
                                                <span>Driver Profile</span>
                                            </div>

                                            {/* Right Section */}
                                            <div className="flex items-center gap-8 w-[60%] justify-end">
                                                <div className="hidden md:flex flex-col items-end text-right min-w-[140px]">
                                                    <span>License Details</span>
                                                    <span className="text-[10px] font-bold text-slate-400 normal-case tracking-normal">
                                                        Identity / Court Check
                                                    </span>
                                                </div>
                                                <div className="min-w-[120px] text-center">
                                                    Screening Status
                                                </div>
                                                <div className="min-w-[100px] text-center">
                                                    Action
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {applicants.map((app) => (
                                        <div
                                            key={app.application_id}
                                            className="px-8 py-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-6">
                                                {/* Driver Avatar */}
                                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 shadow-xs bg-slate-50 shrink-0">
                                                    <img
                                                        src={app.driver?.image ? `${IMAGE_BASE_URL}${app.driver.image}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                                                    />
                                                </div>

                                                {/* Driver Identity */}
                                                <div className="flex flex-col">
                                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{app.driver?.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-[12px] font-black text-indigo-500 uppercase tracking-widest">{app.driver?.unique_id}</span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(app.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, {new Date(app.applied_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                        {app.screening_questions?.telecaller_status && (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase shadow-xs ${getTelecallerStatusStyle(app.screening_questions.telecaller_status)}`}>
                                                                    TC: {app.screening_questions.telecaller_status}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                {/* License & Checks */}
                                                <div className="flex flex-col items-end gap-1.5 text-right hidden md:flex">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{app.driver?.license_type || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border uppercase transition-all shadow-xs ${app.id_check === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>ID: {app.id_check}</span>
                                                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border uppercase transition-all shadow-xs ${app.court_check === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>CRT: {app.court_check}</span>
                                                    </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className={`px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest shadow-xs transition-all min-w-[120px] text-center ${getStatusStyle(app.current_status)}`}>
                                                    {app.current_status}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewHistory(app)}
                                                        title="Call History"
                                                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-600 hover:border-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all active:scale-90"
                                                    >
                                                        <History className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewDetails(app)}
                                                        title="View Details"
                                                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-90"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 shrink-0">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing {applicants.length} of {pagination.total} Applicants</p>

                                {pagination.last_page > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
                                        </button>
                                        <div className="flex items-center gap-2 px-4 font-black text-[10px] text-slate-500 uppercase tracking-widest">
                                            <span>Page</span>
                                            <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200 tracking-normal">{currentPage}</span>
                                            <span>of</span>
                                            <span>{pagination.last_page}</span>
                                        </div>
                                        <button
                                            disabled={currentPage === pagination.last_page}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                                        >
                                            <ChevronRight className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Applicant Details Modal */}
            <ApplicantDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                jobId={jobId}
                userId={selectedApplicant?.driver?.id}
                driverName={selectedApplicant?.driver?.name}
            />

            {/* Call History Modal */}
            <CallHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                userId={historyApplicant?.driver?.id}
                jobId={jobId}
                leadName={historyApplicant?.driver?.name}
            />
        </>
    );
};

export default JobApplicantsModal;
