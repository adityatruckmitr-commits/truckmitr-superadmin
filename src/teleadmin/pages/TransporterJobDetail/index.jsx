import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from '@teleadmin/router';
import { ArrowLeft, Briefcase, MapPin, Building2, User, Phone, CheckCircle, Clock, AlertCircle, FileText, ChevronRight, XCircle, Users, Search, Filter, Eye, X } from 'lucide-react-teleadmin';
import { userApi } from '../../services/api/userApi';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/am|pm/i, m => m.toUpperCase());
};

const isDateExpired = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const TransporterJobDetail = () => {
  const { id, job_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    user: null,
    job: null,
    applicants: [],
    counts: null,
    ivrCallHistory: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [ivrModalData, setIvrModalData] = useState(null);
  const [placeModalData, setPlaceModalData] = useState(null);
  const [placedDate, setPlacedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        if (!data.job) setLoading(true);
        else setIsFiltering(true);
        
        const response = await userApi.getTransporterJobDetail(id, job_id, {
          search: searchQuery,
          status: statusFilter
        });
        if (response?.data) {
          setData(response.data);
        } else {
          toast.error(response.message || 'Failed to load job details');
          if (!data.job) navigate(-1);
        }
      } catch (error) {
        toast.error('Error fetching job details');
        console.error(error);
      } finally {
        setLoading(false);
        setIsFiltering(false);
      }
    };
    fetchDetail();
  }, [id, job_id, navigate, searchQuery, statusFilter, refreshTrigger]);

  const handleMarkPlaced = async () => {
    if (!placeModalData || !placedDate) return;
    
    try {
      setIsPlacing(true);
      await userApi.markApplicantPlaced(id, job_id, placeModalData.driver_id, placedDate);
      toast.success('Driver marked as placed successfully!');
      
      setPlaceModalData(null);
      // Trigger a refetch to update applicants list and the status counts at the top
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to mark driver as placed');
      console.error(error);
    } finally {
      setIsPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  const { user, job, applicants, counts } = data;

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">Job not found.</div>
    );
  }

  let statusBadge = 'bg-slate-100 text-slate-600';
  let statusText = 'Unknown';
  if (job.status == 1) {
    statusBadge = 'bg-emerald-100 text-emerald-700';
    statusText = 'Verified';
  } else if (job.status == 0) {
    statusBadge = 'bg-amber-100 text-amber-700';
    statusText = 'Pending';
  } else if (job.status == 2) {
    statusBadge = 'bg-red-100 text-red-700';
    statusText = 'Rejected';
  }

  let activeBadge = 'bg-slate-100 text-slate-600';
  let activeText = job.computed_status || 'Unknown';

  if (job.computed_status === 'Closed') {
    activeBadge = 'bg-slate-200 text-slate-700';
  } else if (job.computed_status === 'Expired') {
    activeBadge = 'bg-red-100 text-red-700';
  } else if (job.computed_status === 'Inactive') {
    activeBadge = 'bg-amber-100 text-amber-700';
  } else if (job.computed_status === 'Active') {
    activeBadge = 'bg-emerald-100 text-emerald-700';
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all shadow-xs"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              Job Overview
              <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-mono">
                {job.job_id}
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {user?.name || 'Unknown Transporter'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:self-start">
            
            {/* Transporter Details */}
            {user && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-slate-400" />
                  Transporter Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Name</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Unique ID</span>
                    <p className="font-mono text-sm font-semibold text-slate-600 mt-0.5">{user.unique_id}</p>
                  </div>
                  {/* <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Contact</span>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.mobile}
                    </p>
                  </div> */}
                </div>
              </div>
            )}

            {/* Job Details Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Briefcase className="w-24 h-24" />
              </div>
              <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4 text-slate-400" />
                Job Requirements
              </h3>
              
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Title & Vehicle</span>
                    <p className="font-black text-slate-800 mt-1">{job.job_title}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{job.vehicle_type}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
                      {statusText}
                    </span>
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${activeBadge}`}>
                      {activeText}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Drivers Required</span>
                    <p className="font-bold text-slate-800 mt-0.5">{job.number_of_drivers_required || 0}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Salary Range</span>
                    <p className="font-bold text-emerald-600 mt-0.5">{job.Salary_Range ? `₹${job.Salary_Range}` : 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Assigned To</span>
                    <p className="text-sm font-semibold text-indigo-600 mt-0.5">{job.assigned_to_name || 'Unassigned'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</span>
                    <p className="flex items-start gap-1.5 text-sm font-semibold text-slate-600 mt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {job.job_location || 'Not specified'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Posted On</span>
                    <p className="text-sm font-semibold text-slate-600 mt-0.5">{formatDate(job.Created_at || job.created_at)}</p>
                  </div>
                  {(job.Application_Deadline || job.application_deadline || job.expiry_date) && (
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Application Deadline</span>
                      <p className={`text-sm font-semibold mt-0.5 ${job.computed_status === 'Expired' ? 'text-red-600' : 'text-amber-600'}`}>
                        {formatDate(job.Application_Deadline || job.application_deadline || job.expiry_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            {(job.Job_Description || job.job_description) && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Job Description
                </h3>
                <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {job.Job_Description || job.job_description}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Applicants */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Total Apps</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{counts?.total || 0}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600">Pending</span>
                <p className="text-2xl font-black text-amber-700 mt-1">{counts?.pending || 0}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Selected</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{counts?.selected || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-red-600">Rejected</span>
                <p className="text-2xl font-black text-red-700 mt-1">{counts?.rejected || 0}</p>
              </div>
            </div>

            {/* Applicants Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Applicants List
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-sm border border-slate-200">
                    {applicants.length} Drivers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search name, id..." 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="!pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full md:w-48"
                    />
                    {isFiltering && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="interview_done">Interview Done</option>
                    <option value="matchmaking_done">Matchmaking Done</option>
                    <option value="selected">Selected</option>
                    <option value="placed">Placed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-xs z-10">
                    <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      <th className="px-5 py-3 border-b border-slate-100">#</th>
                      <th className="px-5 py-3 border-b border-slate-100">Driver Details</th>
                      <th className="px-5 py-3 border-b border-slate-100">Applied On</th>
                      <th className="px-5 py-3 border-b border-slate-100">Status</th>
                      <th className="px-5 py-3 border-b border-slate-100 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants && applicants.length > 0 ? (
                      applicants.map((app, idx) => {
                        let matchBadge = 'bg-slate-100 text-slate-600';
                        if (app.current_status === 'pending') matchBadge = 'bg-amber-100 text-amber-700';
                        else if (app.current_status === 'selected') matchBadge = 'bg-emerald-100 text-emerald-700';
                        else if (app.current_status === 'placed') matchBadge = 'bg-emerald-50 text-emerald-600 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
                        else if (app.current_status === 'rejected' || app.current_status === 'not_selected') matchBadge = 'bg-red-100 text-red-700';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold text-slate-800">{app.driver_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                  {app.driver_unique_id}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-xs text-slate-600 font-medium">
                                {formatDate(app.applied_at)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {app.interview_done == 1 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 mb-1.5 block w-max">
                                  Interview Done
                                </span>
                              )}
                              {app.matchmaking_done == 1 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mb-1.5 block w-max">
                                  Matchmaking Done
                                </span>
                              )}
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${matchBadge} block w-max`}>
                                {app.current_status.replace('_', ' ')}
                              </span>
                              {app.current_status === 'placed' && app.placed_date && (
                                <span className="text-[10px] text-slate-500 font-bold block mt-1">
                                  Placed: {new Date(app.placed_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => data.ivrCallHistory?.[app.driver_unique_id] ? setIvrModalData({ name: app.driver_name, calls: data.ivrCallHistory[app.driver_unique_id] }) : alert('No call history found for this applicant.')}
                                  className={`p-1.5 border rounded-md transition-all shadow-xs ${data.ivrCallHistory?.[app.driver_unique_id] ? 'bg-white border-sky-200 text-sky-500 hover:bg-sky-50 hover:text-sky-600' : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'}`}
                                  title={data.ivrCallHistory?.[app.driver_unique_id] ? "View IVR Calls" : "No call history found"}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/user-detail/${app.driver_id}`)}
                                  className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-xs"
                                  title="View Driver Profile"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                                {app.current_status !== 'selected' && app.current_status !== 'placed' && (
                                  <button 
                                    onClick={() => setPlaceModalData(app)}
                                    className="p-1.5 bg-white border border-emerald-200 text-emerald-500 rounded-md hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-xs"
                                    title="Mark as Placed"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">No drivers have applied to this job yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* IVR Modal */}
        {ivrModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-sky-500" />
                  IVR Call History - {ivrModalData.name}
                </h3>
                <button 
                  onClick={() => setIvrModalData(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-auto flex-1 p-5 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Type</th>
                      <th className="px-4 py-3">Telechamp</th>
                      <th className="px-4 py-3">Recording</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Match Status</th>
                      <th className="px-4 py-3">Feedback & Remarks</th>
                      <th className="px-4 py-3 rounded-tr-lg">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ivrModalData.calls.map((call, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 text-sm font-semibold capitalize text-slate-700">
                          {call.call_type}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-slate-600">
                          {call.assigned_name || 'System'}
                        </td>
                        <td className="px-4 py-4">
                          {call.call_recording ? (
                            <audio controls className="h-8 max-w-[200px]">
                              <source src={call.call_recording} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No Recording</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                            call.call_status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 
                            call.call_status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {call.call_status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                          {call.match_status ? (
                            <span className="px-2 py-1 rounded-sm bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
                              {call.match_status.replace('_', ' ')}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <div>
                              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">FB: </span>
                              <span className="text-slate-700">{call.call_feedback || '-'}</span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">RM: </span>
                              <span className="text-slate-700">{call.call_remarks || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 font-medium">
                          {formatDate(call.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Place Confirmation Modal */}
        {placeModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Mark as Placed
                </h3>
                <button 
                  onClick={() => setPlaceModalData(null)}
                  disabled={isPlacing}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-6">
                  Are you sure you want to mark <span className="font-bold text-slate-800">{placeModalData.driver_name}</span> as placed for this job?
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Placed Date</label>
                  <input 
                    type="date" 
                    value={placedDate}
                    onChange={(e) => setPlacedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    disabled={isPlacing}
                  />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setPlaceModalData(null)}
                  disabled={isPlacing}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPlaced}
                  disabled={isPlacing}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  {isPlacing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Placement
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default TransporterJobDetail;
