import PageJump from '../../components/PageJump';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import jobMatchingApi from '../services/api/jobMatchingApi';
import telecallersApi from '../services/api/telecallersApi';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import JobStatusHistoryModal from '../components/JobStatusHistoryModal';
import { useNavigate, useSearchParams } from '@teleadmin/router';
import axiosInstance from '../services/api/axiosInstance';
import {
  Briefcase, Clock, XCircle, CheckCircle, TrendingUp, AlertCircle,
  TrendingDown, Star, Search, Filter, ChevronLeft, ChevronRight,
  MapPin, Calendar, User, Phone, Mail, RefreshCw, Activity, Shield, Clock3, Copy, Check, Eye, X, Edit, ToggleLeft, ToggleRight, History,
  Users, CheckSquare, Globe, UserCheck, Hash, PhoneCall, FileText, FileEdit
} from 'lucide-react-teleadmin';

// Premium Stat Card - Consistent with Executive Screens
const StatCard = ({ title, value, icon: Icon, colorClass, subtitle, onClick, isActive }) => {
  const themes = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', active: 'ring-4 ring-indigo-100 border-indigo-200 bg-indigo-50/30' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', active: 'ring-4 ring-emerald-100 border-emerald-200 bg-emerald-50/30' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', active: 'ring-4 ring-amber-100 border-amber-200 bg-amber-50/30' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', active: 'ring-4 ring-blue-100 border-blue-200 bg-blue-50/30' },
    red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', active: 'ring-4 ring-red-100 border-red-200 bg-red-50/30' },
  };
  const theme = themes[colorClass] || themes.indigo;

  return (
    <button
      onClick={onClick}
      className={`relative group bg-white border text-left w-full rounded-[16px] p-4 transition-all duration-300 ${isActive
        ? `${theme.active}`
        : 'border-gray-200'
        }`}
    >
      <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className={`w-4 h-4 ${theme.text}`} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-start w-full mt-3">
        <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-widest leading-none">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none tabular-nums">
            {value?.toLocaleString() || 0}
          </p>
        </div>
        {subtitle && <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">{subtitle}</p>}
      </div>
    </button>
  );
};

const JobMatching = () => {
  const navigate = useNavigate();
  const [urlSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const todayDate = new Date().toISOString().split('T')[0];
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState(urlSearchParams.get('job_status') || '');
  const [jobTypeFilter, setJobTypeFilter] = useState(urlSearchParams.get('job_type') || '');
  const [pendingTypeFilter, setPendingTypeFilter] = useState(urlSearchParams.get('pending_type') || '');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [viewFormat, setViewFormat] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [jobToToggle, setJobToToggle] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    setJobStatusFilter(urlSearchParams.get('job_status') || '');
    setJobTypeFilter(urlSearchParams.get('job_type') || '');
    setPendingTypeFilter(urlSearchParams.get('pending_type') || '');
    setCurrentPage(1);
  }, [urlSearchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch telecallers list
  const { data: telecallersResponse } = useQuery({
    queryKey: ['telecallers-list'],
    queryFn: () => telecallersApi.getAgentRevenue(todayDate),
  });

  const { data: mmTelecallersResponse } = useQuery({
    queryKey: ['mm-telecallers-list'],
    queryFn: () => telecallersApi.getMatchmakingTelecallers(),
  });
  const mmTelecallers = mmTelecallersResponse?.data || [];

  const allTelecallers = Array.isArray(telecallersResponse)
    ? telecallersResponse
    : (telecallersResponse?.data?.telecaller_summary || []);

  // Filter telecallers to show only match-making or job-matching roles
  const telecallers = allTelecallers.filter(tc => {
    const process = tc.process?.toLowerCase() || '';
    return process.includes('match-making') || process.includes('job-matching') || process.includes('matchmaking') || process.includes('jobmatching');
  });

  // Fetch today stats
  const { data: todayStatsResponse, refetch: refetchStats } = useQuery({
    queryKey: ['today-stats'],
    queryFn: () => jobMatchingApi.getTodayStats(),
    refetchInterval: 30000,
  });

  const todayStats = todayStatsResponse?.data || {};

  // Fetch paid jobs stats
  const { data: paidJobsStatsResponse } = useQuery({
    queryKey: ['paid-jobs-stats', startDate, endDate],
    queryFn: () => jobMatchingApi.getPaidJobsStats({ start_date: startDate, end_date: endDate }),
    refetchInterval: 30000,
  });

  const paidJobsStats = paidJobsStatsResponse?.data || {};

  // Build query params
  const buildQueryParams = () => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (jobStatusFilter) params.job_status = jobStatusFilter;
    if (jobTypeFilter) params.job_type = jobTypeFilter;
    if (jobStatusFilter === 'pending_jobs' && pendingTypeFilter) params.pending_type = pendingTypeFilter;
    if (assignedToFilter) params.assigned_to = assignedToFilter;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    params.sort = sortBy;
    params.page = currentPage;
    return params;
  };

  // Fetch jobs
  const { data: jobsResponse, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs-list', debouncedSearch, jobStatusFilter, jobTypeFilter, pendingTypeFilter, assignedToFilter, sortBy, currentPage, startDate, endDate],
    queryFn: () => jobMatchingApi.getJobs(buildQueryParams()),
    placeholderData: keepPreviousData,
  });

  const jobs = jobsResponse?.data?.jobs || [];
  const totalJobs = jobsResponse?.data?.total_jobs || 0;
  const currentPageNum = jobsResponse?.data?.current_page || 1;
  const lastPage = jobsResponse?.data?.last_page || 1;

  // Fetch job details when modal is opened
  const { data: jobDetailsResponse, isLoading: isLoadingJobDetails } = useQuery({
    queryKey: ['job-details', selectedJobId],
    queryFn: () => jobMatchingApi.getJobDetails(selectedJobId),
    enabled: !!selectedJobId && isModalOpen,
  });

  const jobDetails = jobDetailsResponse?.data?.job || null;

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    job_title: '',
    job_location: '',
    vehicle_type: '',
    Required_Experience: '',
    Salary_Range: '',
    Type_of_License: '',
    Preferred_Skills: '',
    Application_Deadline: '',
    number_of_drivers_required: '',
    Job_Description: '',
    assigned_to: '',
  });

  // Update form data when job details are loaded in edit mode
  useEffect(() => {
    if (isEditMode && jobDetails?.job_details) {
      const job = jobDetails.job_details;
      setEditFormData({
        job_title: job.job_title || '',
        job_location: job.job_location || '',
        vehicle_type: job.vehicle_type || '',
        Required_Experience: job.Required_Experience || '',
        Salary_Range: job.Salary_Range || '',
        Type_of_License: job.Type_of_License || '',
        Preferred_Skills: Array.isArray(job.Preferred_Skills)
          ? job.Preferred_Skills.join(', ')
          : (typeof job.Preferred_Skills === 'string' ? job.Preferred_Skills.replace(/[\[\]"]/g, '') : ''),
        Application_Deadline: job.Application_Deadline
          ? job.Application_Deadline.split(' ')[0] // ✅ FIX HERE
          : '',
        number_of_drivers_required: job.number_of_drivers_required || '',
        Job_Description: job.Job_Description || '',
        assigned_to: job.assigned_to || '',
      });
    }
  }, [isEditMode, jobDetails]);

  // Mutation for updating job
  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }) => jobMatchingApi.updateJob(jobId, data),
    onSuccess: () => {
      toast.success('Job updated successfully');
      queryClient.invalidateQueries(['jobs-list']);
      queryClient.invalidateQueries(['job-details']);
      queryClient.invalidateQueries(['today-stats']);
      closeJobDetailsModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update job');
    }
  });

  // Mutation for updating job status
  const updateStatusMutation = useMutation({
    mutationFn: ({ jobId, statusData }) => jobMatchingApi.updateJobStatus(jobId, statusData),
    onSuccess: () => {
      toast.success('Job status updated successfully');
      queryClient.invalidateQueries(['jobs-list']);
      queryClient.invalidateQueries(['today-stats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });


  const handleRefresh = () => {
    refetchStats();
    refetchJobs();
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    // Create an abort controller to allow cancelling the export
    const controller = new AbortController();
    const { signal } = controller;

    try {
      setIsExporting(true);
      const params = buildQueryParams();
      
      let allData = [];
      let headings = [];
      let currentPage = 1;
      let lastPage = 1;

      // Custom toast with a cancel button
      const renderToast = (progress) => (
        <div className="flex flex-col w-full min-w-[250px]">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-sm">Downloading Job Export...</div>
            <button 
              onClick={() => {
                controller.abort();
                toast.dismiss('export-jobs');
                toast.error('Download cancelled');
              }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Cancel Download"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-xs text-slate-500 text-right">{progress}%</div>
        </div>
      );

      toast.loading(renderToast(0), { id: `export-jobs`, duration: Infinity });

      while (currentPage <= lastPage) {
        const response = await axiosInstance.get('/telehead/jobs/export', {
          params: { ...params, paginate: 'true', page: currentPage },
          signal
        });

        const resData = response.data;
        if (!resData.status) {
          throw new Error('Export failed from server');
        }

        if (currentPage === 1) {
          headings = resData.headings;
          lastPage = resData.last_page || 1;
        }

        allData = [...allData, ...resData.data];
        
        let progress = Math.round((currentPage / lastPage) * 100);
        
        toast.loading(renderToast(progress), { id: `export-jobs`, duration: Infinity });

        currentPage++;
      }

      toast.loading(
        <div className="flex flex-col w-full min-w-[250px]">
          <div className="font-semibold text-sm mb-1">Assembling CSV...</div>
          <div className="text-xs text-slate-500 text-left">Almost done!</div>
        </div>,
        { id: `export-jobs`, duration: Infinity }
      );

      // Build CSV
      const csvRows = [
        headings.join(','),
        ...allData.map(row => 
          row.map(value => {
            if (value === null || value === undefined) return '""';
            const strValue = String(value).replace(/"/g, '""');
            return `"${strValue}"`;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `job_matching_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export downloaded!`, { id: `export-jobs`, duration: 4000 });
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('Export cancelled by user');
      } else {
        console.error('Export error:', error);
        toast.error(`Failed to export data`, { id: `export-jobs`, duration: 4000 });
      }
    } finally {
      setIsExporting(false);
    }
  };
  const [isExportingSummary, setIsExportingSummary] = useState(false);

  const handleExportSummary = async () => {
    // Create an abort controller to allow cancelling the export
    const controller = new AbortController();
    const { signal } = controller;

    try {
      setIsExportingSummary(true);
      const params = buildQueryParams();
      
      let allData = [];
      let headings = [];
      let currentPage = 1;
      let lastPage = 1;

      // Custom toast with a cancel button
      const renderToast = (progress) => (
        <div className="flex flex-col w-full min-w-[250px]">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-sm">Downloading Job Summary...</div>
            <button 
              onClick={() => {
                controller.abort();
                toast.dismiss('export-jobs-summary');
                toast.error('Download cancelled');
              }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Cancel Download"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1 overflow-hidden">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-xs text-slate-500 text-right">{progress}%</div>
        </div>
      );

      toast.loading(renderToast(0), { id: `export-jobs-summary`, duration: Infinity });

      while (currentPage <= lastPage) {
        const response = await axiosInstance.get('/telehead/jobs/export-summary', {
          params: { ...params, paginate: 'true', page: currentPage },
          signal
        });

        const resData = response.data;
        if (!resData.status) {
          throw new Error('Export failed from server');
        }

        if (currentPage === 1) {
          headings = resData.headings;
          lastPage = resData.last_page || 1;
        }

        allData = [...allData, ...resData.data];
        
        let progress = Math.round((currentPage / lastPage) * 100);
        
        toast.loading(renderToast(progress), { id: `export-jobs-summary`, duration: Infinity });

        currentPage++;
      }

      toast.loading(
        <div className="flex flex-col w-full min-w-[250px]">
          <div className="font-semibold text-sm mb-1">Assembling CSV...</div>
          <div className="text-xs text-slate-500 text-left">Almost done!</div>
        </div>,
        { id: `export-jobs-summary`, duration: Infinity }
      );

      // Build CSV
      const csvRows = [
        headings.join(','),
        ...allData.map(row => 
          row.map(value => {
            if (value === null || value === undefined) return '""';
            const strValue = String(value).replace(/"/g, '""');
            return `"${strValue}"`;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `job_matching_summary_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Export summary downloaded!`, { id: `export-jobs-summary`, duration: 4000 });
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('Export cancelled by user');
      } else {
        console.error('Export error:', error);
        toast.error(`Failed to export summary`, { id: `export-jobs-summary`, duration: 4000 });
      }
    } finally {
      setIsExportingSummary(false);
    }
  };
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const openJobDetailsModal = (jobId, editMode = false) => {
    setSelectedJobId(jobId);
    setIsEditMode(editMode);
    setIsModalOpen(true);
  };

  const closeJobDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedJobId(null);
    setIsEditMode(false);
  };

  const handleStatusToggle = (job) => {
    setJobToToggle(job);
    setShowConfirmModal(true);
  };

  const confirmStatusToggle = () => {
    if (!jobToToggle) return;

    const newStatus = jobToToggle.status === '1' ? '0' : '1';
    updateStatusMutation.mutate({
      jobId: jobToToggle.id,
      statusData: { status: newStatus }
    });

    setJobToToggle(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedJobId) return;

    updateJobMutation.mutate({
      jobId: selectedJobId,
      data: editFormData
    });
  };

  if (jobsLoading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Briefcase className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading Job Matching Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Job Matching Command Center
              {/* <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-indigo-200">
                v2.0
              </span> */}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            {/* <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100">
              <Activity className="w-3.5 h-3.5" />
              LIVE SYSTEM
            </div> */}
            {/* <div className="flex items-center gap-1.5 text-[12px] font-medium">
              <Clock3 className="w-4 h-4 text-slate-400" />
              Last updated: {new Date().toLocaleTimeString()}
            </div> */}
            {/* <div className="flex items-center gap-1.5 text-[12px] font-medium border-l border-slate-200 pl-4">
              <Shield className="w-4 h-4 text-slate-400" />
              Secure Connection
            </div> */}
          </div>
        </div>

        {/* <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all duration-300 shadow-xs font-bold text-sm"
          >
            <History className="w-4 h-4 text-indigo-600" strokeWidth={2.5} />
            Status History
          </button>
        </div> */}
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={todayStats.active_jobs}
          icon={Briefcase}
          colorClass="blue"
          subtitle={`${todayStats.drivers_required || 0} drivers required • ${todayStats.active_jobs_applicants || 0} applicants`}
          onClick={() => setJobStatusFilter(jobStatusFilter === 'active_jobs' ? '' : 'active_jobs')}
          isActive={jobStatusFilter === 'active_jobs'}
        />

        <StatCard
          title="Pending Jobs"
          value={todayStats.pending_jobs}
          icon={Clock}
          colorClass="amber"
          subtitle="Awaiting Verification"
          onClick={() => setJobStatusFilter(jobStatusFilter === 'pending_jobs' ? '' : 'pending_jobs')}
          isActive={jobStatusFilter === 'pending_jobs'}
        />

        <StatCard
          title="Closed Jobs"
          value={todayStats.closedJobs}
          icon={XCircle}
          colorClass="red"
          subtitle="Completed/Expired"
          onClick={() => setJobStatusFilter(jobStatusFilter === 'closedJobs' ? '' : 'closedJobs')}
          isActive={jobStatusFilter === 'closedJobs'}
        />

        <StatCard
          title="Successful Matches"
          value={todayStats.matchMakingDone}
          icon={CheckCircle}
          colorClass="emerald"
          subtitle="Match Making Complete"
          onClick={() => setJobStatusFilter(jobStatusFilter === 'matchMakingDone' ? '' : 'matchMakingDone')}
          isActive={jobStatusFilter === 'matchMakingDone'}
        />
      </div>


      {/* New Stats Cards (Paid Jobs Performance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Paid Jobs"
          value={paidJobsStats.paid_jobs_count || 0}
          icon={Star}
          colorClass="indigo"
          subtitle="Premium & Super Premium"
          onClick={() => setJobTypeFilter(jobTypeFilter === 'paid_jobs' ? '' : 'paid_jobs')}
          isActive={jobTypeFilter === 'paid_jobs'}
        />
        <StatCard
          title="Applications"
          value={paidJobsStats.paid_jobs_applications || 0}
          icon={Users}
          colorClass="blue"
          subtitle="On Paid Jobs"
        />
        <StatCard
          title="Calls Made"
          value={paidJobsStats.paid_jobs_calls || 0}
          icon={PhoneCall}
          colorClass="emerald"
          subtitle="Regarding Paid Jobs"
        />
        <StatCard
          title="Uncalled Applicants"
          value={paidJobsStats.uncalled_jobs || 0}
          icon={AlertCircle}
          colorClass="red"
          subtitle="Needs Attention"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Filters & Search
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, location, transporter name, mobile, email..."
                className="w-full !pl-12 h-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          {/* Date Range Filters */}
          <div className="md:col-span-1 lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="w-full h-12 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="md:col-span-1 lg:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="w-full h-12 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="md:col-span-1 lg:col-span-1 flex items-end">
            <button
              onClick={() => {
                setStartDate(tempStartDate);
                setEndDate(tempEndDate);
                setCurrentPage(1);
              }}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Apply
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Job Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Status</label>
            <select
              value={jobStatusFilter}
              onChange={(e) => setJobStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Jobs</option>
              <option value="active_jobs">Active Jobs</option>
              <option value="pending_jobs">Pending Jobs</option>
              <option value="inactive_jobs">Inactive Jobs</option>
              <option value="expired_jobs">Expired Jobs</option>
              <option value="closedJobs">Closed Jobs</option>
              <option value="matchMakingDone">Match Making Done</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Tiers</option>
              <option value="paid_jobs">Paid Jobs (Premium & Super Premium)</option>
              <option value="premium_job">Premium Job</option>
              <option value="super_premium_job">Super Premium Job</option>
              <option value="standard">Standard Job</option>
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Telecallers</option>
              {mmTelecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Pending Type Badges - Only show when Pending Jobs is selected */}
        {jobStatusFilter === 'pending_jobs' && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pending Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPendingTypeFilter(pendingTypeFilter === 'with_tc' ? '' : 'with_tc')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${pendingTypeFilter === 'with_tc'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pending with TC
              </button>
              <button
                onClick={() => setPendingTypeFilter(pendingTypeFilter === 'with_admin' ? '' : 'with_admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${pendingTypeFilter === 'with_admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pending with Admin
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(jobStatusFilter || jobTypeFilter || assignedToFilter || searchQuery || pendingTypeFilter) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-600">Active Filters:</span>
            {jobStatusFilter && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2">
                {jobStatusFilter === 'active_jobs' ? 'Active Jobs' :
                  jobStatusFilter === 'pending_jobs' ? 'Pending Jobs' :
                    jobStatusFilter === 'inactive_jobs' ? 'Inactive Jobs' :
                      jobStatusFilter === 'expired_jobs' ? 'Expired Jobs' :
                        jobStatusFilter === 'closedJobs' ? 'Closed Jobs' :
                          jobStatusFilter === 'matchMakingDone' ? 'Match Making Done' :
                            jobStatusFilter}
                <button onClick={() => {
                  setJobStatusFilter('');
                  setPendingTypeFilter('');
                }} className="hover:text-indigo-900">×</button>
              </span>
            )}
            {jobTypeFilter && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2">
                {jobTypeFilter === 'premium_job' ? 'Premium Job' :
                  jobTypeFilter === 'super_premium_job' ? 'Super Premium Job' :
                    jobTypeFilter === 'standard' ? 'Standard Job' :
                      jobTypeFilter === 'paid_jobs' ? 'Paid Jobs' :
                        jobTypeFilter}
                <button onClick={() => setJobTypeFilter('')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {pendingTypeFilter && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-2">
                {pendingTypeFilter === 'with_tc' ? 'Pending with TC' : 'Pending with Admin'}
                <button onClick={() => setPendingTypeFilter('')} className="hover:text-orange-900">×</button>
              </span>
            )}
            {assignedToFilter && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2">
                Assigned: {mmTelecallers.find(tc => tc.id.toString() === assignedToFilter)?.name || assignedToFilter}
                <button onClick={() => setAssignedToFilter('')} className="hover:text-indigo-900">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-2">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>


      {/* Jobs List */}
      <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden">
        <div className="bg-slate-50/50 px-5 py-4 border-b-2 border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Jobs List</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Showing {jobs.length} of {totalJobs} jobs
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-xs ${isExporting ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isExporting ? 'Exporting...' : 'Export Applicants'}
              </button>
              <button
                onClick={handleExportSummary}
                disabled={isExportingSummary}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-xs ${isExportingSummary ? 'bg-blue-100 text-blue-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}
              >
                {isExportingSummary ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isExportingSummary ? 'Exporting...' : 'Export Jobs Summary'}
              </button>
              
              {/* View Toggle */}
            <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewFormat('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewFormat === 'list'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                List
              </button>
              <button
                onClick={() => setViewFormat('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${viewFormat === 'grid'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
            </div>
            </div>
          </div>
        </div>

        {jobsLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className={`p-4 ${viewFormat === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-4'}`}>
            {jobs.map((job) => (
              <div key={job.id} className="group bg-white rounded-xl border border-gray-200 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Header Container */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-3 bg-slate-50/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="text-[14px] font-black text-slate-800 tracking-tight">{job.job_title}</h4>
                      <div className="flex items-center gap-2">
                        {/* Job Type Badge */}
                        {job.job_payment_status === 'refunded' ? (
                          <>
                            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-700 border-slate-200 line-through opacity-60">
                              {job.job_tier_type === 'premium_job' ? 'Premium' : job.job_tier_type === 'super_premium_job' ? 'Super Premium' : 'Standard'}
                            </span>
                            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-700 border-slate-200">
                              Standard
                            </span>
                            <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border bg-red-50 text-red-700 border-red-200">
                              Refunded
                            </span>
                          </>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${
                            job.job_tier_type === 'premium_job' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            job.job_tier_type === 'super_premium_job' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {job.job_tier_type === 'premium_job' ? 'Premium' : job.job_tier_type === 'super_premium_job' ? 'Super Premium' : 'Standard'}
                          </span>
                        )}
                        
                        <button
                          onClick={() => copyToClipboard(job.job_id, 'Job ID')}
                          className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-sm transition-all text-indigo-600"
                        >
                          <Hash className="w-2.5 h-2.5" strokeWidth={3} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{job.job_id}</span>
                          {copiedId === job.job_id ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{job.job_location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Right */}
                  <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                    {job.assigned_to_name && (
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-indigo-100">
                        {job.assigned_to_name}
                      </span>
                    )}
                    {(() => {
                      if (job.closed_job === '1' || job.closed_job === 1 || job.closed_job === 'yes') {
                        return <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">Closed</span>;
                      }

                      let isExpired = false;
                      if (job.Application_Deadline) {
                        const deadline = new Date(job.Application_Deadline);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        isExpired = deadline < today;
                      }

                      if (isExpired) {
                        return <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-orange-50 text-orange-700 border border-orange-200">Expired</span>;
                      }

                      return (
                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${job.status === '1' && job.active_inactive === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : job.status === '0'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {job.status === '1' && job.active_inactive === 1 ? 'Active' :
                            job.status === '0' ? 'Pending' : 'Inactive'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Job Info Grid */}
                <div className="p-4 flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 rounded-lg p-3 border border-slate-100 mb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">License</span>
                      <span className="text-[12px] font-black text-slate-800">{job.Type_of_License}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Drivers</span>
                      <span className="text-[12px] font-black text-slate-800">{job.number_of_drivers_required}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salary</span>
                      <span className="text-[12px] font-black text-slate-800">₹{job.Salary_Range}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Deadline</span>
                      <span className="text-[12px] font-black text-slate-800">
                        {new Date(job.Application_Deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  {/* Pipeline Stats */}
                  <div className={`flex items-center flex-wrap gap-3 ${viewFormat === 'grid' ? 'grid grid-cols-2 gap-3' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Applications</span>
                        <span className="text-xs font-black text-slate-800 leading-tight">{job.total_applications || 0}</span>
                      </div>
                    </div>
                    {viewFormat === 'list' && <div className="hidden md:block w-px h-6 bg-slate-200"></div>}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Screening</span>
                        <span className="text-xs font-black text-slate-800 leading-tight">{job.screening_done || 0}</span>
                      </div>
                    </div>
                    {/* {viewFormat === 'list' && <div className="hidden md:block w-px h-6 bg-slate-200"></div>}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Online Interview</span>
                        <span className="text-xs font-black text-slate-800 leading-tight">{job.online_interview_done || 0}</span>
                      </div>
                    </div> */}
                    {/* {viewFormat === 'list' && <div className="hidden md:block w-px h-6 bg-slate-200"></div>} */}
                    {/* <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center border border-purple-100">
                        <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Physical Interview</span>
                        <span className="text-xs font-black text-slate-800 leading-tight">{job.physical_interview_done || 0}</span>
                      </div>
                    </div> */}
                    {viewFormat === 'list' && <div className="hidden md:block w-px h-6 bg-slate-200"></div>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (job.transporter_id && job.job_id) {
                          navigate(`/user-detail/${job.transporter_id}/job/${job.job_id}?status=interview_done`);
                        }
                      }}
                      className="flex items-center gap-2 hover:bg-slate-100/50 p-1 rounded-lg transition-all text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Interview Done</span>
                        <span className="text-xs font-black text-slate-800 leading-tight group-hover:underline">{job.total_interview_done || 0}</span>
                      </div>
                    </button>
                    {viewFormat === 'list' && <div className="hidden md:block w-px h-6 bg-slate-200"></div>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (job.transporter_id && job.job_id) {
                          navigate(`/user-detail/${job.transporter_id}/job/${job.job_id}?status=placed`);
                        }
                      }}
                      className="flex items-center gap-2 hover:bg-slate-100/50 p-1 rounded-lg transition-all text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Placed</span>
                        <span className="text-xs font-black text-slate-800 leading-tight group-hover:underline">{job.total_placed || 0}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Footer */}
                <div className={`px-4 py-3 border-t border-slate-100 bg-slate-50 flex ${viewFormat === 'grid' ? 'flex-col gap-3' : 'flex-col md:flex-row items-center justify-between gap-3'} mt-auto`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-sm border border-blue-200">
                      <User className="w-3 h-3 text-indigo-600" />
                      <span className="text-[11px] font-bold text-slate-800">{job.transporter_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-sm border border-slate-200 shadow-xs">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600">{job.transporter_mobile}</span>
                    </div>
                    {/* Only show TMID in List View to save space in Grid, or show it wrapped */}
                    <button
                      onClick={() => copyToClipboard(job.transporter_tmid, 'TMID')}
                      className="group flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-sm transition-all"
                    >
                      <Mail className="w-3 h-3 text-indigo-600" />
                      <span className="text-[11px] font-bold text-indigo-700">{job.transporter_tmid}</span>
                      {copiedId === job.transporter_tmid ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-indigo-500 group-hover:text-indigo-700" />
                      )}
                    </button>
                  </div>

                  {/* Action Icons */}
                  <div className={`flex items-center gap-2 ${viewFormat === 'grid' ? 'w-full pt-2 mt-1 border-t border-slate-200/50' : ''}`}>
                    <button
                      onClick={() => openJobDetailsModal(job.job_id, false)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">View</span>
                    </button>
                    <button
                      onClick={() => navigate(`/job-wise-calls?jobId=${job.job_id}&all_time=1`)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                      title="View Call Dashboard"
                    >
                      <PhoneCall className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Calls</span>
                    </button>
                    {(() => {
                      // Check if job is closed
                      const isClosed = job.closed_job === '1' || job.closed_job === 1 || job.closed_job === 'yes';

                      // Check if job is expired
                      let isExpired = false;
                      if (job.Application_Deadline) {
                        const deadline = new Date(job.Application_Deadline);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        isExpired = deadline < today;
                      }

                      // If closed, hide both edit and status toggle
                      if (isClosed) {
                        return null;
                      }

                      // If expired, show edit but hide status toggle
                      if (isExpired) {
                        return (
                          <>
                            <button
                              onClick={() => openJobDetailsModal(job.job_id, true)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                              title="Edit Job"
                            >
                              <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Edit Job</span>
                            </button>
                            <button
                              onClick={() => navigate(`/job-matching/edit-full/${job.job_id}`)}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                              title="Edit Full Job"
                            >
                              <FileEdit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Full Edit</span>
                            </button>
                          </>
                        );
                      }

                      // If not closed and not expired, show both buttons
                      return (
                        <>
                          <button
                            onClick={() => openJobDetailsModal(job.job_id, true)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                            title="Edit Job"
                          >
                            <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Edit Job</span>
                          </button>
                          <button
                            onClick={() => navigate(`/job-matching/edit-full/${job.job_id}`)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''}`}
                            title="Edit Full Job"
                          >
                            <FileEdit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Full Edit</span>
                          </button>
                          <button
                            onClick={() => handleStatusToggle(job)}
                            disabled={updateStatusMutation.isPending}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shadow-md group ${viewFormat === 'grid' ? 'flex-1' : ''} ${job.status === '1'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-800 text-white'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={job.status === '1' ? 'Active - Click to Deactivate' : 'Inactive - Click to Activate'}
                          >
                            {job.status === '1' ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Activate</span>
                              </>
                            )}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPageNum} of {lastPage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPageNum === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                disabled={currentPageNum === lastPage}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
              <PageJump page={currentPage} totalPages={lastPage} onGo={setCurrentPage} />
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {isEditMode ? <Edit className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                {isEditMode ? 'Edit Job Details' : 'Job Details'}
              </h2>
              <button
                onClick={closeJobDetailsModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {isLoadingJobDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Loading job details...</p>
                </div>
              ) : jobDetails ? (
                <>
                  {/* Closed Job Warning */}
                  {isEditMode && (jobDetails.job_details?.closed_job === '1' || jobDetails.job_details?.closed_job === 1) && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-900">Cannot Edit Closed Job</h4>
                          <p className="text-sm text-red-700 mt-1">This job is closed and cannot be edited. You can only view the details.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expired Job Info */}
                  {isEditMode && (() => {
                    const isClosed = jobDetails.job_details?.closed_job === '1' || jobDetails.job_details?.closed_job === 1;
                    if (!isClosed && jobDetails.job_details?.Application_Deadline) {
                      const deadline = new Date(jobDetails.job_details.Application_Deadline);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return deadline < today;
                    }
                    return false;
                  })() && (
                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-orange-900">Expired Job</h4>
                            <p className="text-sm text-orange-700 mt-1">This job has expired. You can edit the details but cannot change the status.</p>
                          </div>
                        </div>
                      </div>
                    )}

                  {isEditMode && (jobDetails.job_details?.closed_job !== '1' && jobDetails.job_details?.closed_job !== 1) ? (
                    /* Edit Form */
                    <form onSubmit={handleEditFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                          <input
                            type="text"
                            name="job_title"
                            value={editFormData.job_title}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Job Location</label>
                          <input
                            type="text"
                            name="job_location"
                            value={editFormData.job_location}
                            onChange={handleEditFormChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type *</label>
                          <input
                            type="text"
                            name="vehicle_type"
                            value={editFormData.vehicle_type}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Required Experience *</label>
                          <input
                            type="text"
                            name="Required_Experience"
                            value={editFormData.Required_Experience}
                            onChange={handleEditFormChange}
                            required
                            placeholder="e.g., 1-5"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range *</label>
                          <input
                            type="text"
                            name="Salary_Range"
                            value={editFormData.Salary_Range}
                            onChange={handleEditFormChange}
                            required
                            placeholder="e.g., 25000-30000"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Type of License *</label>
                          <input
                            type="text"
                            name="Type_of_License"
                            value={editFormData.Type_of_License}
                            onChange={handleEditFormChange}
                            required
                            placeholder="e.g., HMV"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Skills *</label>
                          <input
                            type="text"
                            name="Preferred_Skills"
                            value={editFormData.Preferred_Skills}
                            onChange={handleEditFormChange}
                            required
                            placeholder="e.g., Others"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Application Deadline *</label>
                          <input
                            type="date"
                            name="Application_Deadline"
                            value={editFormData.Application_Deadline}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Drivers Required *</label>
                          <input
                            type="number"
                            name="number_of_drivers_required"
                            value={editFormData.number_of_drivers_required}
                            onChange={handleEditFormChange}
                            required
                            min="1"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To *</label>
                          <select
                            name="assigned_to"
                            value={editFormData.assigned_to}
                            onChange={handleEditFormChange}
                            required
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select Telecaller</option>
                            {mmTelecallers.map(tc => (
                              <option key={tc.id} value={tc.id}>
                                {tc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description *</label>
                        <textarea
                          name="Job_Description"
                          value={editFormData.Job_Description}
                          onChange={handleEditFormChange}
                          required
                          rows="6"
                          maxLength="2000"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{editFormData.Job_Description.length}/2000 characters</p>
                      </div>
                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                          type="button"
                          onClick={closeJobDetailsModal}
                          className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateJobMutation.isPending}
                          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {updateJobMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Update Job
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">
                      {/* Job Information */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-indigo-600" />
                          Job Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Job ID</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.job_id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Job Title</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.job_title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Location</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.job_location}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">License Type</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.Type_of_License}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Experience Required</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.Required_Experience} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Salary Range</p>
                            <p className="font-bold text-gray-900">₹{jobDetails.job_details?.Salary_Range}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Drivers Required</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.number_of_drivers_required}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Application Deadline</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.Application_Deadline}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                            <p className="font-bold text-gray-900">{jobDetails.job_details?.vehicle_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Status</p>
                            {(() => {
                              // Priority: Closed > Expired > Active/Pending/Inactive
                              if (jobDetails.job_details?.closed_job === '1' || jobDetails.job_details?.closed_job === 1) {
                                return (
                                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                                    Closed
                                  </span>
                                );
                              }

                              // Check if deadline is expired
                              if (jobDetails.job_details?.Application_Deadline) {
                                const deadline = new Date(jobDetails.job_details.Application_Deadline);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                deadline.setHours(0, 0, 0, 0);

                                if (deadline < today) {
                                  return (
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
                                      Expired
                                    </span>
                                  );
                                }
                              }

                              // Show normal status
                              return (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${jobDetails.job_details?.status === '1' && jobDetails.job_details?.active_inactive === 1
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : jobDetails.job_details?.status === '0'
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                  }`}>
                                  {jobDetails.job_details?.status === '1' && jobDetails.job_details?.active_inactive === 1 ? 'Active' :
                                    jobDetails.job_details?.status === '0' ? 'Pending' : 'Inactive'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                                        {/* Hiring Pipeline Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Applications</p>
                          </div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{jobDetails.job_details?.total_applications || 0}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Screening</p>
                          </div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{jobDetails.job_details?.screening_done || 0}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Online Interview</p>
                          </div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{jobDetails.job_details?.online_interview_done || 0}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-xs transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="w-4 h-4 text-purple-500" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Physical Interview</p>
                          </div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{jobDetails.job_details?.physical_interview_done || 0}</p>
                        </div>

                        <button
                          onClick={() => {
                            if (jobDetails.job_details?.transporter_id && jobDetails.job_details?.job_id) {
                              navigate(`/user-detail/${jobDetails.job_details.transporter_id}/job/${jobDetails.job_details.job_id}?status=interview_done`);
                            }
                          }}
                          className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs transition-all hover:shadow-md text-left group cursor-pointer hover:border-emerald-300"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <PhoneCall className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Interview Done</p>
                          </div>
                          <p className="text-2xl font-black text-slate-800 group-hover:underline leading-none">{jobDetails.job_details?.total_interview_done || 0}</p>
                        </button>

                        <button
                          onClick={() => {
                            if (jobDetails.job_details?.transporter_id && jobDetails.job_details?.job_id) {
                              navigate(`/user-detail/${jobDetails.job_details.transporter_id}/job/${jobDetails.job_details.job_id}?status=placed`);
                            }
                          }}
                          className="bg-white p-4 rounded-xl border border-teal-100 shadow-xs transition-all hover:shadow-md text-left group cursor-pointer hover:border-teal-300"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Placed</p>
                          </div>
                          <p className="text-2xl font-black text-slate-800 group-hover:underline leading-none">{jobDetails.job_details?.total_placed || 0}</p>
                        </button>
                      </div>

                      {/* Job Description */}
                      {jobDetails.job_details?.Job_Description && (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Job Description</h3>
                          <p className="text-gray-700 whitespace-pre-wrap">{jobDetails.job_details?.Job_Description}</p>
                        </div>
                      )}

                      {/* Transporter Information */}
                      {jobDetails.transporter && (
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Transporter Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Name</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Mobile</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.mobile}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Email</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Unique ID</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.unique_id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">State</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.states}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Posted Jobs</p>
                              <p className="font-bold text-gray-900">{jobDetails.transporter?.postedJobsCount}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assigned Admin */}
                      {jobDetails.assigned_admin && (
                        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Assigned Admin</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Name</p>
                              <p className="font-bold text-gray-900">{jobDetails.assigned_admin?.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Email</p>
                              <p className="font-bold text-gray-900">{jobDetails.assigned_admin?.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preferred Skills */}
                      {jobDetails.job_details?.Preferred_Skills && (
                        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-3">Preferred Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              try {
                                const parsed = JSON.parse(jobDetails.job_details?.Preferred_Skills);
                                if (Array.isArray(parsed)) return parsed;
                                if (typeof parsed === 'string') return parsed.split(',').map(s => s.trim()).filter(Boolean);
                                return [String(parsed)];
                              } catch (e) {
                                return jobDetails.job_details?.Preferred_Skills.split(',').map(s => s.trim()).filter(Boolean);
                              }
                            })().map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-300">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No job details available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Toggle */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setJobToToggle(null);
        }}
        onConfirm={confirmStatusToggle}
        title="Confirm Status Change"
        message={
          jobToToggle
            ? `Are you sure you want to change this job status from "${jobToToggle.status === '1' ? 'Live' : 'Draft'}" to "${jobToToggle.status === '1' ? 'Draft' : 'Live'}"?\n\nJob: ${jobToToggle.job_title || 'Untitled Job'}\nLocation: ${jobToToggle.job_location || 'N/A'}`
            : ''
        }
        confirmText={jobToToggle?.status === '1' ? 'Make Draft' : 'Make Live'}
        cancelText="Cancel"
        type={jobToToggle?.status === '1' ? 'warning' : 'success'}
      />

      {/* Job Status History Modal */}
      <JobStatusHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
};

export default JobMatching;
