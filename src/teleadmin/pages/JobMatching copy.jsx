import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import CallRecordingPlayer from '../components/CallRecordingPlayer';
import {
  Briefcase, Users, TrendingUp, CheckCircle, Clock, XCircle,
  Phone, MapPin, Calendar, Filter, Search, Download, RefreshCw,
  Eye, Edit, Trash2, UserCheck, FileText, BarChart3, Activity,
  Target, Award, Zap, Star, TrendingDown, AlertCircle, ChevronDown,
  ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Mail, Building, Truck, DollarSign,
  Percent, ArrowUpRight, ArrowDownRight, Layers, Grid, List,
  PieChart, LineChart, BarChart2, Globe, Shield, Clock3, Volume2, User, X, ArrowRightLeft
} from 'lucide-react-teleadmin';

const JobMatching = () => {

  const API_BASE_URL = "https://truckmitr.com/truckmitr-app/api";

  const [activeTab, setActiveTab] = useState('overview');
  const [jobFilter, setJobFilter] = useState('all');
  const [telecallerFilter, setTelecallerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // grid or list
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedJobForReassign, setSelectedJobForReassign] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState(null);
  const [sortBy, setSortBy] = useState('created_desc');
  const [expandedCards, setExpandedCards] = useState({});

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all match making stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['matchmaking-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_stats.php`);
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  // Fetch today stats for job cards
  const { data: todayStatsResponse } = useQuery({
    queryKey: ['today-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/telehead/today-stats`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const todayStats = todayStatsResponse || {};

  // Fetch match-making telecallers list with job counts
  const { data: telecallers } = useQuery({
    queryKey: ['matchmaking-telecallers-list'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_telecallers.php`);
      return response.data.data || [];
    },
  });

  // Fetch all jobs with pagination and search
  const { data: jobsResponse, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['matchmaking-jobs', jobFilter, telecallerFilter, debouncedSearch, currentPage],
    queryFn: async () => {
      let url = `${API_BASE_URL}/admin_matchmaking_jobs.php?filter=${jobFilter}&page=${currentPage}&limit=15&_t=${Date.now()}`;
      if (telecallerFilter !== 'all') {
        url += `&telecaller_id=${telecallerFilter}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      const response = await axios.get(url);
      console.log('Jobs API Response Sample:', response.data.data?.[0]);
      return response.data;
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  const jobs = jobsResponse?.data || [];
  const totalJobs = jobsResponse?.total || 0;
  const totalPages = jobsResponse?.totalPages || 1;

  // Fetch all applicants (always fetch for modal to work)
  const { data: applicants, isLoading: applicantsLoading } = useQuery({
    queryKey: ['matchmaking-applicants'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_applicants.php`);
      return response.data.data;
    },
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['matchmaking-analytics'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_analytics.php`);
      return response.data.data;
    },
    enabled: activeTab === 'analytics',
  });

  // Advanced filtering and sorting (now done on backend, but keep for client-side sort)
  const processedJobs = useMemo(() => {
    if (!jobs) return [];

    let filtered = [...jobs];

    // Sort jobs (client-side sorting)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'created_asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'applicants_desc': return b.applicantsCount - a.applicantsCount;
        case 'applicants_asc': return a.applicantsCount - b.applicantsCount;
        case 'title_asc': return (a.jobTitle || '').localeCompare(b.jobTitle || '');
        case 'title_desc': return (b.jobTitle || '').localeCompare(a.jobTitle || '');
        default: return 0;
      }
    });

    return filtered;
  }, [jobs, searchQuery, sortBy]);

  // CRUD Handlers
  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to delete "${job.jobTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_jobs.php?action=delete`, {
        jobId: job.id
      });
      alert('Job deleted successfully!');
      refetchJobs();
      refetchStats();
    } catch (error) {
      alert('Failed to delete job: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveJob = async (job) => {
    if (!window.confirm(`Approve job "${job.jobTitle}"?`)) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_jobs.php?action=approve`, {
        jobId: job.id,
        status: 'approve'
      });
      alert('Job approved successfully!');
      refetchJobs();
      refetchStats();
    } catch (error) {
      alert('Failed to approve job: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectJob = async (job) => {
    if (!window.confirm(`Reject job "${job.jobTitle}"?`)) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_jobs.php?action=approve`, {
        jobId: job.id,
        status: 'reject'
      });
      alert('Job rejected successfully!');
      refetchJobs();
      refetchStats();
    } catch (error) {
      alert('Failed to reject job: ' + (error.response?.data?.message || error.message));
    }
  };

  // Quick Action Handlers
  const handleExportData = () => {
    try {
      // Create CSV content for Excel
      let csvContent = '';

      // Add Statistics Section
      csvContent += 'MATCH MAKING STATISTICS\n';
      csvContent += `Export Date,${new Date().toLocaleString()}\n`;
      csvContent += '\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Jobs,${stats?.totalJobs || 0}\n`;
      csvContent += `Active Jobs,${stats?.activeJobs || 0}\n`;
      csvContent += `Approved Jobs,${stats?.approvedJobs || 0}\n`;
      csvContent += `Pending Jobs,${stats?.pendingJobs || 0}\n`;
      csvContent += `Total Applicants,${stats?.totalApplicants || 0}\n`;
      csvContent += `Interested Applicants,${stats?.interestedApplicants || 0}\n`;
      csvContent += `Total Matches,${stats?.totalMatches || 0}\n`;
      csvContent += `Match Rate,${stats?.matchRate || 0}%\n`;
      csvContent += `Total Calls,${stats?.totalCalls || 0}\n`;
      csvContent += `Transporter Calls,${stats?.transporterCalls || 0}\n`;
      csvContent += `Driver Feedback Calls,${stats?.driverFeedbackCalls || 0}\n`;
      csvContent += `Total Briefs,${stats?.totalBriefs || 0}\n`;
      csvContent += '\n\n';

      // Add Jobs Section
      csvContent += 'ALL JOBS\n';
      csvContent += 'Job ID,Job Title,Transporter Name,Transporter TM ID,Location,Vehicle Type,Salary Range,Experience,Applicants,Status,Created Date\n';

      jobs?.forEach(job => {
        const row = [
          job.jobId || '',
          `"${(job.jobTitle || '').replace(/"/g, '""')}"`,
          `"${(job.transporterName || '').replace(/"/g, '""')}"`,
          job.transporterTmid || '',
          `"${(job.jobLocation || '').replace(/"/g, '""')}"`,
          `"${(job.vehicleTypeDetail || '').replace(/"/g, '""')}"`,
          `"${(job.salaryRange || '').replace(/"/g, '""')}"`,
          `"${(job.requiredExperience || '').replace(/"/g, '""')}"`,
          job.applicantsCount || 0,
          job.isApproved && job.isActive ? 'Active' : job.isApproved ? 'Approved' : 'Pending',
          new Date(job.createdAt).toLocaleDateString()
        ];
        csvContent += row.join(',') + '\n';
      });

      // Create Blob with UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matchmaking-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleGenerateReport = () => {
    try {
      // Generate HTML report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Job Matching Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #4F46E5; }
            .stat { margin: 20px 0; padding: 15px; background: #F3F4F6; border-radius: 8px; }
            .stat-label { font-weight: bold; color: #374151; }
            .stat-value { font-size: 24px; color: #4F46E5; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { background: #4F46E5; color: white; }
          </style>
        </head>
        <body>
          <h1>Job Matching Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Statistics</h2>
          <div class="stat">
            <div class="stat-label">Total Jobs</div>
            <div class="stat-value">${stats?.totalJobs || 0}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total Applicants</div>
            <div class="stat-value">${stats?.totalApplicants || 0}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total Calls</div>
            <div class="stat-value">${stats?.totalCalls || 0}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Match Rate</div>
            <div class="stat-value">${stats?.matchRate || 0}%</div>
          </div>
          
          <h2>Recent Jobs</h2>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Location</th>
                <th>Applicants</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${jobs?.slice(0, 10).map(job => `
                <tr>
                  <td>${job.jobTitle}</td>
                  <td>${job.jobLocation}</td>
                  <td>${job.applicantsCount}</td>
                  <td>${job.isApproved ? 'Approved' : 'Pending'}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No jobs available</td></tr>'}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create and download report
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matchmaking-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleBulkEmail = () => {
    const confirmed = window.confirm(
      'This will open your email client to send bulk emails to transporters. Continue?'
    );

    if (confirmed) {
      // Collect transporter emails from jobs
      const emails = jobs
        ?.filter(job => job.transporterEmail)
        .map(job => job.transporterEmail)
        .filter((email, index, self) => self.indexOf(email) === index) // Remove duplicates
        .slice(0, 50); // Limit to 50 emails

      if (emails && emails.length > 0) {
        const subject = encodeURIComponent('Job Matching Update from TruckMitr');
        const body = encodeURIComponent('Dear Transporter,\n\nWe have new opportunities available for you.\n\nBest regards,\nTruckMitr Team');
        window.location.href = `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
      } else {
        alert('No transporter emails found in the current jobs.');
      }
    }
  };

  // Calculate advanced metrics
  const advancedMetrics = useMemo(() => {
    if (!stats || !jobs) return null;

    const totalSalaryBudget = jobs.reduce((sum, job) => {
      const salary = job.salaryRange?.match(/\d+/g);
      return sum + (salary ? parseInt(salary[0]) : 0);
    }, 0);

    const avgApplicantsPerJob = jobs.length > 0
      ? (jobs.reduce((sum, job) => sum + job.applicantsCount, 0) / jobs.length).toFixed(1)
      : 0;

    const topPerformingJobs = [...jobs]
      .sort((a, b) => b.applicantsCount - a.applicantsCount)
      .slice(0, 5);

    const recentJobs = [...jobs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      totalSalaryBudget,
      avgApplicantsPerJob,
      topPerformingJobs,
      recentJobs,
      conversionRate: stats.totalApplicants > 0
        ? ((stats.interestedApplicants / stats.totalApplicants) * 100).toFixed(1)
        : 0,
      activeJobsPercent: stats.totalJobs > 0
        ? ((stats.activeJobs / stats.totalJobs) * 100).toFixed(1)
        : 0,
    };
  }, [stats, jobs]);

  if (statsLoading) {
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
    <div className="space-y-6 pb-8">
      {/* Futuristic Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }}></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  Job Matching Command Center
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-sm font-medium">
                    v2.0
                  </span>
                </h1>
                <p className="text-indigo-100 mt-1 text-lg">
                  Advanced job posting & driver matching intelligence system
                </p>
              </div>
            </div>

            {/* Real-time Stats Bar */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs rounded-lg px-4 py-2">
                <Activity className="w-5 h-5 text-green-300" />
                <span className="text-white font-medium">Live</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Clock3 className="w-4 h-4" />
                <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Secure Connection</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              refetchStats();
              refetchJobs();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-xs text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Advanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Jobs Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs rounded-full px-3 py-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-90">Active Jobs</h3>
            <p className="text-5xl font-bold mb-2">{todayStats.active_jobs || 0}</p>
            <div className="flex flex-col gap-1 text-blue-100 text-sm">
              <div className="flex items-center justify-between">
                <span>{todayStats.drivers_required || 0} drivers required</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{todayStats.active_jobs_applicants || 0} applicants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Jobs Card */}
        <div className="group relative bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <Clock className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs rounded-full px-3 py-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Pending</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-90">Pending Jobs</h3>
            <p className="text-5xl font-bold mb-2">{todayStats.pending_jobs || 0}</p>
            <div className="flex items-center justify-between text-yellow-100">
              <span className="text-sm">Awaiting approval</span>
            </div>
          </div>
        </div>

        {/* Closed Jobs Card */}
        <div className="group relative bg-gradient-to-br from-red-500 to-red-700 rounded-2xl shadow-xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs rounded-full px-3 py-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Closed</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-90">Closed Jobs</h3>
            <p className="text-5xl font-bold mb-2">{todayStats.closedJobs || 0}</p>
            <div className="flex items-center justify-between text-red-100">
              <span className="text-sm">Completed/Expired</span>
            </div>
          </div>
        </div>

        {/* Match Making Done Card */}
        <div className="group relative bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl shadow-xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs rounded-full px-3 py-1">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">Success</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 opacity-90">Match Making Done</h3>
            <p className="text-5xl font-bold mb-2">{todayStats.matchMakingDone || 0}</p>
            <div className="flex items-center justify-between text-green-100">
              <span className="text-sm">Successful matches</span>
            </div>
          </div>
        </div>
      </div>

      <JobsTab
        jobs={processedJobs}
        isLoading={jobsLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        debouncedSearch={debouncedSearch}
        jobFilter={jobFilter}
        setJobFilter={setJobFilter}
        telecallerFilter={telecallerFilter}
        setTelecallerFilter={setTelecallerFilter}
        telecallers={telecallers}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedJob={selectedJob}
        setSelectedJob={setSelectedJob}
        showJobDetails={showJobDetails}
        setShowJobDetails={setShowJobDetails}
        setShowApplicantsModal={setShowApplicantsModal}
        setSelectedJobForApplicants={setSelectedJobForApplicants}
        setShowReassignModal={setShowReassignModal}
        setSelectedJobForReassign={setSelectedJobForReassign}
        setShowEditModal={setShowEditModal}
        setSelectedJobForEdit={setSelectedJobForEdit}
        handleDeleteJob={handleDeleteJob}
        handleApproveJob={handleApproveJob}
        handleRejectJob={handleRejectJob}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalJobs={totalJobs}
        setActiveTab={setActiveTab}
      />

      {/* Job Applicants Modal */}
      {showApplicantsModal && selectedJobForApplicants && (
        <JobApplicantsModal
          job={selectedJobForApplicants}
          applicants={applicants}
          onClose={() => {
            setShowApplicantsModal(false);
            setSelectedJobForApplicants(null);
          }}
        />
      )}

      {/* Job Reassign Modal */}
      {showReassignModal && selectedJobForReassign && (
        <JobReassignModal
          job={selectedJobForReassign}
          onClose={() => {
            setShowReassignModal(false);
            setSelectedJobForReassign(null);
          }}
          onSuccess={() => {
            setShowReassignModal(false);
            setSelectedJobForReassign(null);
            refetchJobs();
          }}
        />
      )}

      {/* Job Edit Modal */}
      {showEditModal && selectedJobForEdit && (
        <JobEditModal
          job={selectedJobForEdit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedJobForEdit(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedJobForEdit(null);
            refetchJobs();
            refetchStats();
          }}
        />
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, color, trend }) => {
  const colorClasses = {
    green: 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50',
    yellow: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50',
    red: 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50',
    indigo: 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
  };

  const trendColorClasses = trend.startsWith('+')
    ? 'text-green-600 bg-green-100'
    : 'text-red-600 bg-red-100';

  return (
    <div className={`${colorClasses[color]} rounded-xl shadow-xs p-5 border-l-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-8 h-8 ${iconColorClasses[color]}`} />
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${trendColorClasses}`}>
          {trend}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

// Health Metric Component
const HealthMetric = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, label, color, onClick }) => {
  const colorClasses = {
    indigo: 'hover:bg-indigo-50 text-indigo-600 border-indigo-200',
    green: 'hover:bg-green-50 text-green-600 border-green-200',
    blue: 'hover:bg-blue-50 text-blue-600 border-blue-200',
    purple: 'hover:bg-purple-50 text-purple-600 border-purple-200',
    orange: 'hover:bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all duration-300 ${colorClasses[color]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      <ExternalLink className="w-4 h-4 ml-auto" />
    </button>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, advancedMetrics, jobs }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="w-7 h-7 text-indigo-600" />
          System Overview Dashboard
        </h3>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">All Systems Operational</span>
        </div>
      </div>

      {/* Comprehensive Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Job Status Distribution
          </h4>
          <div className="space-y-3">
            <StatusRow label="Active Jobs" value={stats?.activeJobs || 0} color="green" icon={CheckCircle} />
            <StatusRow label="Pending Approval" value={stats?.pendingJobs || 0} color="yellow" icon={Clock} />
            <StatusRow label="Expired Jobs" value={stats?.expiredJobs || 0} color="red" icon={XCircle} />
            <StatusRow label="Total Posted" value={stats?.totalJobs || 0} color="indigo" icon={Layers} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Application Analytics
          </h4>
          <div className="space-y-3">
            <StatusRow label="Total Applications" value={stats?.totalApplicants || 0} color="indigo" icon={FileText} />
            <StatusRow label="Interested Drivers" value={stats?.interestedApplicants || 0} color="green" icon={UserCheck} />
            <StatusRow label="Avg per Job" value={advancedMetrics?.avgApplicantsPerJob || 0} color="blue" icon={Target} />
            <StatusRow label="Conversion Rate" value={`${advancedMetrics?.conversionRate || 0}%`} color="purple" icon={Percent} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Job Brief Insights
          </h4>
          <div className="space-y-3">
            <StatusRow label="Total Briefs" value={stats?.totalBriefs || 0} color="indigo" icon={FileText} />
            <StatusRow label="Approved Briefs" value={stats?.approvedBriefs || 0} color="green" icon={CheckCircle} />
            <StatusRow label="Pending Briefs" value={stats?.pendingBriefs || 0} color="yellow" icon={Clock} />
            <StatusRow label="Match Success" value={`${stats?.matchRate || 0}%`} color="purple" icon={Award} />
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          Recent Activity Timeline
        </h4>
        <div className="space-y-4">
          {advancedMetrics?.recentJobs?.slice(0, 8).map((job, idx) => (
            <div key={job.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{job.jobTitle}</p>
                <p className="text-xs text-gray-500">{job.transporterName} • {job.jobLocation}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-indigo-100 rounded-lg px-3 py-1">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-indigo-600">{job.applicantsCount}</span>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.isApproved && job.isActive ? 'bg-green-100 text-green-700' :
                  job.isApproved ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                  {job.isApproved && job.isActive ? 'Active' :
                    job.isApproved ? 'Approved' : 'Pending'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )) || (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Status Row Component
const StatusRow = ({ label, value, color, icon: Icon }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-xs">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${colorClasses[color]}`}>
        {value}
      </span>
    </div>
  );
};

// Jobs Tab Component - Ultra Advanced
const JobsTab = ({
  jobs, isLoading, searchQuery, setSearchQuery, debouncedSearch, jobFilter, setJobFilter,
  telecallerFilter, setTelecallerFilter, telecallers,
  sortBy, setSortBy, viewMode, setViewMode, selectedJob, setSelectedJob,
  showJobDetails, setShowJobDetails, setShowApplicantsModal, setSelectedJobForApplicants,
  setShowReassignModal, setSelectedJobForReassign, setShowEditModal, setSelectedJobForEdit,
  handleDeleteJob, handleApproveJob, handleRejectJob,
  currentPage, setCurrentPage, totalPages, totalJobs, setActiveTab
}) => {
  return (
    <div className="space-y-4">
      {/* Compact Control Panel */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, transporter name, TM ID, location, mobile..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              {searchQuery && searchQuery !== debouncedSearch && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Jobs</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>

          {/* Telecaller Filter */}
          <select
            value={telecallerFilter}
            onChange={(e) => setTelecallerFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Telecallers</option>
            {telecallers?.map(tc => (
              <option key={tc.id} value={tc.id}>
                {tc.name} ({tc.assignedJobs?.total || 0})
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created_desc">Newest</option>
            <option value="created_asc">Oldest</option>
            <option value="applicants_desc">Most Apps</option>
            <option value="applicants_asc">Least Apps</option>
            <option value="title_asc">A-Z</option>
            <option value="title_desc">Z-A</option>
          </select>

          {/* View Mode */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-white'
                }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm transition-all ${viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-white'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Export</span>
          </button>

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-600">
            <span className="font-bold text-indigo-600">{totalJobs || 0}</span> total
          </div>
        </div>
      </div>

      {/* Jobs Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            <Briefcase className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Briefcase className="w-20 h-20 mb-4 text-gray-300" />
          <p className="text-xl font-bold text-gray-400 mb-2">No jobs found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(job) => {
                setSelectedJob(job);
                setShowJobDetails(true);
              }}
              onViewApplicants={(job) => {
                setSelectedJobForApplicants(job);
                setShowApplicantsModal(true);
              }}
              onReassignJob={(job) => {
                setSelectedJobForReassign(job);
                setShowReassignModal(true);
              }}
              onEditJob={(job) => {
                setSelectedJobForEdit(job);
                setShowEditModal(true);
              }}
              onDeleteJob={handleDeleteJob}
              onApproveJob={handleApproveJob}
              onRejectJob={handleRejectJob}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobListItem key={job.id} job={job} onViewDetails={(job) => {
              setSelectedJob(job);
              setShowJobDetails(true);
            }} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-bold text-indigo-600">{((currentPage - 1) * 15) + 1}</span> to{' '}
              <span className="font-bold text-indigo-600">{Math.min(currentPage * 15, totalJobs)}</span> of{' '}
              <span className="font-bold text-indigo-600">{totalJobs}</span> jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === pageNum
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setShowJobDetails(false)}
          onEdit={(job) => {
            setSelectedJobForEdit(job);
            setShowEditModal(true);
          }}
          onDelete={handleDeleteJob}
        />
      )}
    </div>
  );
};

// Job Card Component - Professional & Relaxed Design
const JobCard = ({ job, onViewDetails, onViewApplicants, onReassignJob, onEditJob, onDeleteJob, onApproveJob, onRejectJob, setActiveTab }) => {
  return (
    <div className="group bg-white rounded-xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 hover:border-indigo-200">
      {/* Header with softer gradient */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4 border-b border-gray-100">
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-xs ${job.isApproved && job.isActive ? 'bg-emerald-500 text-white' :
            job.isApproved ? 'bg-blue-500 text-white' :
              job.isClosed ? 'bg-red-600 text-white' :
                job.isExpired ? 'bg-rose-500 text-white' :
                  'bg-amber-500 text-white'
            }`}>
            {job.isClosed ? 'CLOSED' :
              job.isApproved && job.isActive ? 'ACTIVE' :
                job.isApproved ? 'APPROVED' :
                  job.isExpired ? 'EXPIRED' : 'PENDING'}
          </span>
        </div>
        <div className="pr-20">
          <p className="text-xs text-indigo-600 font-medium mb-1">{job.jobId}</p>
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-2" title={job.jobTitle}>
            {job.jobTitle}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span className="truncate">{job.jobLocation}</span>
          </div>
        </div>
      </div>

      {/* Content with better spacing */}
      <div className="p-4 space-y-3">
        {/* Transporter Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="bg-indigo-100 rounded-lg p-2">
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate" title={job.transporterName}>
              {job.transporterName}
            </p>
            <p className="text-xs text-gray-500 truncate">{job.transporterTmid}</p>
          </div>
          {job.transporterProfileCompletion > 0 && (
            <div className="text-right">
              <p className="text-xs font-bold text-indigo-600">{job.transporterProfileCompletion}%</p>
              <p className="text-xs text-gray-400">Profile</p>
            </div>
          )}
        </div>

        {/* Job Details Grid with better spacing */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate text-xs">{job.vehicleTypeDetail || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 font-semibold flex-shrink-0">₹</span>
            <span className="text-gray-700 truncate text-xs">{job.salaryRange || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 text-xs">{job.numberOfDriverRequired} Driver Required</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 text-xs">{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Applicants - More prominent */}
        <button
          onClick={() => onViewApplicants && onViewApplicants(job)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition-all border border-indigo-100"
        >
          <span className="text-sm font-medium text-gray-700">View Applicants</span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xl font-bold text-indigo-600">{job.applicantsCount}</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
        </button>

        {/* Assigned Telecaller */}
        {job.assignedToName && (
          <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100">
            <UserCheck className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-700">
              Assigned: <span className="font-semibold">{job.assignedToName}</span>
            </span>
          </div>
        )}

        {/* Action Buttons with better spacing */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onViewDetails(job)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-xs"
          >
            <Eye className="w-4 h-4" />
            Details
          </button>
          {job.hasBrief && (
            <button
              onClick={() => {
                // Navigate to job briefs tab and filter by this job
                setActiveTab('job_briefs');
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
              title={`View Brief (${job.briefCount})`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
            </button>
          )}
          <button
            onClick={() => onReassignJob && onReassignJob(job)}
            className="p-2 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all"
            title="Reassign Job"
          >
            <ArrowRightLeft className="w-4 h-4 text-orange-600" />
          </button>
          <button
            onClick={() => onEditJob && onEditJob(job)}
            className="p-2 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
            title="Edit Job"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        {/* Approve/Reject - Always visible for pending jobs */}
        {!job.isApproved && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onApproveJob && onApproveJob(job)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onRejectJob && onRejectJob(job)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium shadow-xs"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Job List Item Component
const JobListItem = ({ job, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border-2 border-gray-100 hover:border-indigo-300">
      <div className="flex items-center gap-4">
        {/* Job Icon */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <Briefcase className="w-8 h-8" />
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{job.jobTitle}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {job.transporterName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.jobLocation}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <span className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${job.isClosed ? 'bg-red-100 text-red-700' :
              job.isApproved && job.isActive ? 'bg-green-100 text-green-700' :
                job.isApproved ? 'bg-blue-100 text-blue-700' :
                  job.isExpired ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
              }`}>
              {job.isClosed ? 'CLOSED' :
                job.isApproved && job.isActive ? 'ACTIVE' :
                  job.isApproved ? 'APPROVED' :
                    job.isExpired ? 'EXPIRED' : 'PENDING'}
            </span>
          </div>

          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-600">{job.applicantsCount} Applicants</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="w-4 h-4" />
              <span>{job.vehicleTypeDetail || 'Not Specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-4 h-4 font-bold flex items-center justify-center">₹</span>
              <span>{job.salaryRange || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4" />
              <span>{job.numberOfDriverRequired} positions</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onViewDetails(job)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
            <Edit className="w-4 h-4 text-gray-600" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// Job Details Modal Component - Ultra Detailed
const JobDetailsModal = ({ job, onClose, onEdit, onContact, onExport, onDelete }) => {

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(job);
    }
    onClose();
  };

  const handleContact = () => {
    // Open phone dialer or WhatsApp
    if (job.transporterPhone) {
      window.location.href = `tel:${job.transporterPhone}`;
    } else {
      alert('No contact number available');
    }
  };

  const handleExport = () => {
    // Export job details as JSON
    const jobData = JSON.stringify(job, null, 2);
    const blob = new Blob([jobData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-${job.jobId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${job.jobTitle}"?\n\nThis action cannot be undone.`)) {
      if (onDelete) {
        onDelete(job);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={onClose}></div>
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col relative z-10">
          {/* Professional Header - Fixed */}
          <div className="relative bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer z-10"
              type="button"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-start gap-4 pr-12">
              <div className="bg-indigo-100 rounded-lg p-3">
                <Briefcase className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-indigo-600">{job.jobId}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${job.isClosed ? 'bg-red-100 text-red-700' :
                    job.isApproved && job.isActive ? 'bg-emerald-100 text-emerald-700' :
                      job.isApproved ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                    {job.isClosed ? 'CLOSED' :
                      job.isApproved && job.isActive ? 'ACTIVE' :
                        job.isApproved ? 'APPROVED' : 'PENDING'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.jobTitle}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.jobLocation}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Posted: {new Date(job.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {job.applicantsCount} Applicants
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Transporter Details */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <Building className="w-5 h-5 text-indigo-600" />
                    Transporter Information
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Company Name" value={job.transporterName || 'Unknown'} />
                    <DetailRow label="TM ID" value={job.transporterTmid || 'Not Available'} />
                    <DetailRow label="Phone" value={job.transporterPhone || 'Not Available'} />
                    <DetailRow label="Location" value={job.transporterCity && job.transporterState ? `${job.transporterCity}, ${job.transporterState}` : 'Not Available'} />
                    {job.transporterProfileCompletion > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                          <span className="text-sm font-bold text-indigo-600">{job.transporterProfileCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${job.transporterProfileCompletion}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Requirements */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    Job Requirements
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Vehicle Type" value={job.vehicleTypeDetail || 'Not Specified'} />
                    <DetailRow label="License Required" value={job.typeOfLicense || 'N/A'} />
                    <DetailRow label="Experience" value={job.requiredExperience || 'N/A'} />
                    <DetailRow label="Driver Required" value={`${job.numberOfDriverRequired} positions`} />
                  </div>
                </div>

                {/* Compensation */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <span className="text-amber-600 font-bold text-lg">₹</span>
                    Compensation
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Salary Range" value={job.salaryRange || 'Not specified'} />
                    <DetailRow label="Application Deadline" value={job.applicationDeadline || 'Open'} />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Application Stats */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Application Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 text-center border border-indigo-200">
                      <Users className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">{job.applicantsCount}</p>
                      <p className="text-xs text-gray-600 mt-1">Total Applicants</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 text-center border border-emerald-200">
                      <Target className="w-7 h-7 text-emerald-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">{job.numberOfDriverRequired}</p>
                      <p className="text-xs text-gray-600 mt-1">Positions</p>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Job Description
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {job.jobDescription || 'No description provided'}
                  </p>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-xs">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Created" value={new Date(job.createdAt).toLocaleString('en-IN')} />
                    <DetailRow label="Last Updated" value={new Date(job.updatedAt).toLocaleString('en-IN')} />
                    {job.assignedToName && (
                      <DetailRow label="Assigned To" value={job.assignedToName} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Footer - Fixed */}
          <div className="px-6 py-4 bg-white border-t border-gray-200 rounded-b-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleContact}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Contact
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

// Call Logs Tab Component - Complete Call History
const CallLogsTab = () => {
  const [callType, setCallType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallDetails, setShowCallDetails] = useState(false);

  const { data: callHistoryData, isLoading, refetch } = useQuery({
    queryKey: ['complete-call-history', callType, dateFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'all',
        call_type: callType,
        date_filter: dateFilter,
        ...(searchQuery && { search: searchQuery })
      });
      const response = await axios.get(`${API_BASE_URL}/admin_call_history_complete.php?${params}`);
      return response.data;
    },
  });

  const callLogs = callHistoryData?.data || [];
  const callStats = callHistoryData?.stats || {};

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Phone className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Calls</p>
          <p className="text-4xl font-bold">{callStats?.totalCalls || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-8 h-8 opacity-80" />
            <Briefcase className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Job Brief Calls</p>
          <p className="text-4xl font-bold">{callStats?.jobBriefCalls || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 opacity-80" />
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Driver Feedback</p>
          <p className="text-4xl font-bold">{callStats?.driverFeedbackCalls || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-8 h-8 opacity-80" />
            <Clock3 className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Today's Calls</p>
          <p className="text-4xl font-bold">{callStats?.todayCalls || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Search Calls</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, job ID, transporter..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Calls</option>
              <option value="job_brief">Job Brief Calls</option>
              <option value="driver_feedback">Driver Feedback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date Filter</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complete Call History */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-6 h-6 text-indigo-600" />
            Complete Call History ({callLogs.length})
          </h4>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          </div>
        ) : callLogs.length > 0 ? (
          <div className="space-y-4">
            {callLogs.map(call => (
              <div key={`${call.callType}-${call.id}`} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${call.callType === 'job_brief' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {call.callTypeLabel}
                      </span>
                      {call.isApproved !== undefined && (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${call.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {call.isApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {new Date(call.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Call Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Transporter/Driver Info */}
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-indigo-600 mb-2">
                          {call.callType === 'job_brief' ? 'Transporter' : 'Driver'}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {call.transporterName || call.driverName}
                        </p>
                        {call.companyName && (
                          <p className="text-xs text-gray-600">{call.companyName}</p>
                        )}
                        {(call.transporterPhone || call.driverPhone) && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {call.transporterPhone || call.driverPhone}
                          </p>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-600 mb-2">Job Details</p>
                        <p className="text-sm font-bold text-gray-900">{call.jobTitle || 'N/A'}</p>
                        <p className="text-xs text-gray-600">Job ID: {call.jobId}</p>
                        {call.jobLocation && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {call.jobLocation}
                          </p>
                        )}
                      </div>

                      {/* Caller Info */}
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-orange-600 mb-2">Telecaller</p>
                        <p className="text-sm font-bold text-gray-900">{call.callerName || 'N/A'}</p>
                        {call.callStatusFeedback && (
                          <p className="text-xs text-gray-600 mt-1">{call.callStatusFeedback}</p>
                        )}
                        {call.feedback && (
                          <p className="text-xs text-gray-600 mt-1">{call.feedback}</p>
                        )}
                      </div>
                    </div>

                    {/* Job Brief Specific Details */}
                    {call.callType === 'job_brief' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
                        {call.vehicleType && (
                          <div>
                            <p className="text-xs text-gray-500">Vehicle Type</p>
                            <p className="text-sm font-semibold text-gray-900">{call.vehicleType}</p>
                          </div>
                        )}
                        {call.licenseType && (
                          <div>
                            <p className="text-xs text-gray-500">License</p>
                            <p className="text-sm font-semibold text-gray-900">{call.licenseType}</p>
                          </div>
                        )}
                        {call.experience && (
                          <div>
                            <p className="text-xs text-gray-500">Experience</p>
                            <p className="text-sm font-semibold text-gray-900">{call.experience}</p>
                          </div>
                        )}
                        {call.salaryFixed && (
                          <div>
                            <p className="text-xs text-gray-500">Salary</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{call.salaryFixed}
                              {call.salaryVariable && ` + ₹${call.salaryVariable}`}
                            </p>
                          </div>
                        )}
                        {call.route && (
                          <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="text-sm font-semibold text-gray-900">{call.route}</p>
                          </div>
                        )}
                        {call.esiPf && (
                          <div>
                            <p className="text-xs text-gray-500">ESI/PF</p>
                            <p className="text-sm font-semibold text-gray-900">{call.esiPf}</p>
                          </div>
                        )}
                        {call.foodAllowance && (
                          <div>
                            <p className="text-xs text-gray-500">Food Allowance</p>
                            <p className="text-sm font-semibold text-gray-900">₹{call.foodAllowance}</p>
                          </div>
                        )}
                        {call.tripIncentive && (
                          <div>
                            <p className="text-xs text-gray-500">Trip Incentive</p>
                            <p className="text-sm font-semibold text-gray-900">₹{call.tripIncentive}</p>
                          </div>
                        )}
                        {call.rehneKiSuvidha && (
                          <div>
                            <p className="text-xs text-gray-500">Accommodation</p>
                            <p className="text-sm font-semibold text-gray-900">{call.rehneKiSuvidha}</p>
                          </div>
                        )}
                        {call.mileage && (
                          <div>
                            <p className="text-xs text-gray-500">Mileage</p>
                            <p className="text-sm font-semibold text-gray-900">{call.mileage}</p>
                          </div>
                        )}
                        {call.fastTagRoadKharcha && (
                          <div>
                            <p className="text-xs text-gray-500">FASTag/Road</p>
                            <p className="text-sm font-semibold text-gray-900">{call.fastTagRoadKharcha}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Driver Feedback Specific Details */}
                    {call.callType === 'driver_feedback' && call.matchStatus && (
                      <div className="pt-4 border-t border-gray-200">
                        <span className={`px-4 py-2 text-sm font-bold rounded-lg ${call.matchStatus === 'Interested' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          Match Status: {call.matchStatus}
                        </span>
                        {call.remark && (
                          <p className="text-sm text-gray-600 mt-2">Remark: {call.remark}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCall(call);
                      setShowCallDetails(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all ml-4"
                  >
                    <Eye className="w-4 h-4" />
                    View Full
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Telecaller</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Transporter</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Feedback</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {callLogs.map(log => (
                  <tr key={`${log.logType}-${log.id}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${log.logType === 'feedback' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                        {log.logType === 'feedback' ? 'Feedback' : 'Job Brief'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.telecallerName || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{log.transporterName || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{log.transporterTmid}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{log.driverName || '-'}</span>
                        <span className="text-xs text-gray-500">{log.driverTmid || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">{log.feedback || log.callStatusFeedback || '-'}</p>
                        {log.remark && <p className="text-xs text-gray-500 truncate">{log.remark}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.matchStatus && (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${log.matchStatus === 'Interested' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {log.matchStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )(
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Phone className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No call history found</p>
          </div>
        )}
      </div>

      {/* Call Details Modal */}
      {showCallDetails && selectedCall && (
        <CallDetailsModal call={selectedCall} onClose={() => setShowCallDetails(false)} />
      )}
    </div>
  );
};

// Call Details Modal Component
const CallDetailsModal = ({ call, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-xs rounded-xl hover:bg-white/30 transition-all"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4">
              <Phone className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80 mb-2">{call.callTypeLabel}</p>
              <h2 className="text-3xl font-bold mb-3">{call.jobTitle || 'Call Details'}</h2>
              <p className="text-sm">Call ID: {call.id} | {new Date(call.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Complete Call Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(call).map(([key, value]) => {
                  if (value && key !== 'callType' && key !== 'callTypeLabel' && typeof value !== 'object') {
                    return (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm font-semibold text-gray-900">{String(value)}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// Telecallers Tab Component - Job Matching Team with CRUD
const TelecallersTab = () => {

  const API_BASE_URL = "https://truckmitr.com/truckmitr-app/api";

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    tc_for: 'match-making'
  });

  const { data: telecallersData, isLoading, refetch } = useQuery({
    queryKey: ['matchmaking-telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_telecallers.php?action=list`);
      return response.data;
    },
  });

  const telecallers = telecallersData?.data || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_telecallers.php?action=create`, formData);
      alert('Telecaller added successfully!');
      setShowAddModal(false);
      setFormData({ name: '', email: '', mobile: '', password: '', tc_for: 'match-making' });
      refetch();
    } catch (error) {
      alert('Failed to add telecaller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_telecallers.php?action=update`, {
        id: selectedTelecaller.id,
        ...formData
      });
      alert('Telecaller updated successfully!');
      setShowEditModal(false);
      setSelectedTelecaller(null);
      setFormData({ name: '', email: '', mobile: '', password: '', tc_for: 'match-making' });
      refetch();
    } catch (error) {
      alert('Failed to update telecaller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (telecaller) => {
    if (!window.confirm(`Are you sure you want to delete ${telecaller.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_telecallers.php?action=delete`, {
        id: telecaller.id
      });
      alert('Telecaller deleted successfully!');
      refetch();
    } catch (error) {
      alert('Failed to delete telecaller: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (telecaller) => {
    setSelectedTelecaller(telecaller);
    setFormData({
      name: telecaller.name,
      email: telecaller.email,
      mobile: telecaller.mobile,
      password: '',
      tc_for: telecaller.tcFor
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            Job Matching Telecallers
          </h3>
          <p className="text-gray-600 mt-1">Team members assigned to match-making operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
          >
            <Users className="w-4 h-4" />
            Add Telecaller
          </button>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      ) : telecallers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {telecallers.map(tc => (
            <div key={tc.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center">
                    {tc.profileImage ? (
                      <img src={tc.profileImage} alt={tc.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold">{tc.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold">{tc.name}</h4>
                    <p className="text-sm opacity-90">ID: {tc.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${tc.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-gray-400 text-gray-900'
                    }`}>
                    {tc.status}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{tc.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{tc.mobile || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 capitalize">{tc.tcFor}</span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Performance</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Calls</p>
                      <p className="text-2xl font-bold text-indigo-600">{tc.totalCalls}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Match Rate</p>
                      <p className="text-2xl font-bold text-green-600">{tc.matchRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Job Briefs</p>
                      <p className="text-lg font-bold text-gray-900">{tc.jobBriefCalls}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Feedback</p>
                      <p className="text-lg font-bold text-gray-900">{tc.feedbackCalls}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-gray-500">Interested Matches</p>
                    <p className="text-xl font-bold text-purple-600">{tc.interestedMatches}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Jobs Stats */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-600" />
                      Assigned Jobs
                    </h5>
                    <button
                      onClick={() => {
                        setSelectedTelecaller(tc);
                        setShowJobsModal(true);
                      }}
                      className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      View All
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">{tc.assignedJobs?.total || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Active</p>
                      <p className="text-xl font-bold text-green-600">{tc.assignedJobs?.active || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Approved</p>
                      <p className="text-lg font-bold text-blue-600">{tc.assignedJobs?.approved || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs text-gray-500">Pending</p>
                      <p className="text-lg font-bold text-yellow-600">{tc.assignedJobs?.pending || 0}</p>
                    </div>
                  </div>
                  {tc.assignedJobs?.expired > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {tc.assignedJobs.expired} Expired Jobs
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Activity */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Call:
                  </span>
                  <span className="font-medium">
                    {tc.lastCallTime ? new Date(tc.lastCallTime).toLocaleDateString() : 'No calls yet'}
                  </span>
                </div>
                {tc.lastLogin && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Last Login:
                    </span>
                    <span className="font-medium">
                      {new Date(tc.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 flex gap-2">
                <button
                  onClick={() => openEditModal(tc)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tc)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <UserCheck className="w-20 h-20 mb-4 text-gray-300" />
          <p className="text-xl font-bold text-gray-400 mb-2">No Job Matching Telecallers</p>
          <p className="text-sm text-gray-500">No telecallers assigned to match-making yet</p>
        </div>
      )}

      {/* Add Telecaller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">Add New Telecaller</h3>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role (tc_for) *</label>
                <select
                  value={formData.tc_for}
                  onChange={(e) => setFormData({ ...formData, tc_for: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="match-making">Job Matching</option>
                  <option value="welcome-call">Welcome Call</option>
                  <option value="follow-up">Follow Up</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                >
                  Add Telecaller
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', email: '', mobile: '', password: '', tc_for: 'match-making' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Telecaller Modal */}
      {showEditModal && selectedTelecaller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-2xl font-bold">Edit Telecaller</h3>
              <p className="text-sm opacity-90 mt-1">Editing: {selectedTelecaller.name}</p>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mobile *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role (tc_for) *</label>
                <select
                  value={formData.tc_for}
                  onChange={(e) => setFormData({ ...formData, tc_for: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="match-making">Job Matching</option>
                  <option value="welcome-call">Welcome Call</option>
                  <option value="follow-up">Follow Up</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium"
                >
                  Update Telecaller
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTelecaller(null);
                    setFormData({ name: '', email: '', mobile: '', password: '', tc_for: 'match-making' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assigned Jobs Details Modal */}
      {showJobsModal && selectedTelecaller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
              <button
                onClick={() => {
                  setShowJobsModal(false);
                  setSelectedTelecaller(null);
                }}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-xs rounded-xl hover:bg-white/30 transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="flex items-start gap-4">
                <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4">
                  <UserCheck className="w-12 h-12" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{selectedTelecaller.name}'s Assigned Jobs</h2>
                  <p className="text-sm opacity-90 mb-3">Complete overview of all job assignments and performance</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                      <Mail className="w-4 h-4" />
                      {selectedTelecaller.email}
                    </span>
                    <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                      <Phone className="w-4 h-4" />
                      {selectedTelecaller.mobile}
                    </span>
                    <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                      <Briefcase className="w-4 h-4" />
                      ID: {selectedTelecaller.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-gray-600" />
                    <p className="text-xs font-medium text-gray-600">Total Jobs</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{selectedTelecaller.assignedJobs?.total || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-xs font-medium text-green-700">Active</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{selectedTelecaller.assignedJobs?.active || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-medium text-blue-700">Approved</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{selectedTelecaller.assignedJobs?.approved || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-xs font-medium text-yellow-700">Pending</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{selectedTelecaller.assignedJobs?.pending || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-xs font-medium text-red-700">Expired</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{selectedTelecaller.assignedJobs?.expired || 0}</p>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-350px)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                  All Assigned Jobs ({selectedTelecaller.assignedJobs?.jobs?.length || 0})
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Showing all time</span>
                </div>
              </div>

              {selectedTelecaller.assignedJobs?.jobs?.length > 0 ? (
                <div className="space-y-3">
                  {selectedTelecaller.assignedJobs.jobs.map((job, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${job.isActive && job.isApproved
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                        : job.isApproved
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
                          : job.isExpired
                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 hover:border-red-300'
                            : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 hover:border-yellow-300'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Job Number Badge */}
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-white ${job.isActive && job.isApproved ? 'bg-green-600' :
                          job.isApproved ? 'bg-blue-600' :
                            job.isExpired ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                          {idx + 1}
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900 mb-1">{job.jobTitle}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.jobLocation}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Posted: {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                                {job.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${job.isActive && job.isApproved ? 'bg-green-600 text-white' :
                                job.isApproved ? 'bg-blue-600 text-white' :
                                  job.isExpired ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                                }`}>
                                {job.isActive && job.isApproved ? 'ACTIVE' :
                                  job.isApproved ? 'APPROVED' :
                                    job.isExpired ? 'EXPIRED' : 'PENDING'}
                              </span>
                              <span className="text-xs font-medium text-gray-500">
                                Job ID: {job.jobId}
                              </span>
                            </div>
                          </div>

                          {/* Job Stats */}
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                              <Users className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm font-bold text-gray-900">{job.applicantsCount || 0}</span>
                              <span className="text-xs text-gray-500">Applicants</span>
                            </div>
                            {job.isExpired && (
                              <div className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                                <AlertCircle className="w-4 h-4" />
                                Job Expired
                              </div>
                            )}
                            {!job.isActive && job.isApproved && (
                              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                <AlertCircle className="w-4 h-4" />
                                Inactive
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Briefcase className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-bold text-gray-400 mb-2">No Jobs Assigned</p>
                  <p className="text-sm text-gray-500">This telecaller has no job assignments yet</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Last Updated:</span> {new Date().toLocaleString()}
              </div>
              <button
                onClick={() => {
                  setShowJobsModal(false);
                  setSelectedTelecaller(null);
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
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

// Job Briefs Tab Component
const JobBriefsTab = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [dateFilter, setDateFilter] = useState('all');
  const [telecallerId, setTelecallerId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [showBriefDetails, setShowBriefDetails] = useState(false);
  const [showRecordingPlayer, setShowRecordingPlayer] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);

  const API_BASE_URL = "https://truckmitr.com/truckmitr-app/api";

  const { data: briefsData, isLoading, refetch, error } = useQuery({
    queryKey: ['job-briefs', filter, searchQuery, sortBy, dateFilter, telecallerId, vehicleType],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          action: 'list',
          filter,
          sort_by: sortBy,
          date_filter: dateFilter
        });

        // Add optional parameters only if they have values
        if (searchQuery && searchQuery.trim() !== '') {
          params.append('search', searchQuery.trim());
        }
        if (telecallerId && telecallerId !== '') {
          params.append('telecaller_id', telecallerId);
        }
        if (vehicleType && vehicleType !== '') {
          params.append('vehicle_type', vehicleType);
        }

        const url = `${API_BASE_URL}/admin_job_briefs.php?${params}`;
        console.log('Fetching job briefs with URL:', url);
        const response = await axios.get(url);
        console.log('Job briefs response:', response.data);
        return response.data.data;
      } catch (err) {
        console.error('Job Briefs API Error:', err);
        throw err;
      }
    },
  });

  const briefs = briefsData || [];

  // Get filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['job-brief-filters'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_job_briefs.php?action=filters`);
      return response.data.data;
    },
  });

  const { data: briefStats } = useQuery({
    queryKey: ['job-brief-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_job_briefs.php?action=stats`);
      return response.data.data;
    },
  });

  const handleApprove = async (jobId, approve) => {
    try {
      await axios.post(`${API_BASE_URL}/admin_job_briefs.php?action=approve`, {
        jobId,
        approve
      });
      refetch();
    } catch (error) {
      console.error('Failed to approve job:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-8 h-8 opacity-80" />
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Briefs</p>
          <p className="text-4xl font-bold">{briefStats?.totalBriefs || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 opacity-80" />
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Pending Approval</p>
          <p className="text-4xl font-bold">{briefStats?.pendingBriefs || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <Award className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Approved</p>
          <p className="text-4xl font-bold">{briefStats?.approvedBriefs || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Briefcase className="w-8 h-8 opacity-80" />
            <Star className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Unique Jobs</p>
          <p className="text-4xl font-bold">{briefStats?.totalJobs || 0}</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Advanced Filters
        </h4>

        {/* Row 1: Search and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Search Briefs</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by transporter, job ID, company, location..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Approval Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Briefs</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sort, Date, Telecaller, Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="transporter">By Transporter</option>
              <option value="job_title">By Job Title</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Telecaller</label>
            <select
              value={telecallerId}
              onChange={(e) => setTelecallerId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Telecallers</option>
              {filterOptions?.telecallers?.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Vehicles</option>
              {filterOptions?.vehicleTypes?.map(vt => (
                <option key={vt} value={vt}>{vt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filter !== 'all' || sortBy !== 'latest' || dateFilter !== 'all' || telecallerId || vehicleType) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">Active Filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:bg-indigo-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter !== 'all' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Status: {filter}
                  <button onClick={() => setFilter('all')} className="hover:bg-green-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {sortBy !== 'latest' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Sort: {sortBy}
                  <button onClick={() => setSortBy('latest')} className="hover:bg-purple-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {telecallerId && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Telecaller: {filterOptions?.telecallers?.find(t => t.id === parseInt(telecallerId))?.name}
                  <button onClick={() => setTelecallerId('')} className="hover:bg-orange-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {vehicleType && (
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium flex items-center gap-1">
                  Vehicle: {vehicleType}
                  <button onClick={() => setVehicleType('')} className="hover:bg-pink-200 rounded-full p-0.5">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                  setSortBy('latest');
                  setDateFilter('all');
                  setTelecallerId('');
                  setVehicleType('');
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Briefs List */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Job Briefs ({briefs?.length || 0})
          </h4>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading job briefs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Error loading job briefs</p>
            <p className="text-sm text-gray-600 mt-2">{error.message}</p>
          </div>
        ) : briefs.length > 0 ? (
          <div className="space-y-4">
            {briefs.map(brief => (
              <div key={brief.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="text-lg font-bold text-gray-900">{brief.jobTitle || 'Job Brief'}</h5>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${brief.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {brief.isApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {brief.transporterName}
                      </span>
                      {brief.companyName && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {brief.companyName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {brief.jobLocation || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(brief.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {brief.callRecording && (
                      <button
                        onClick={() => {
                          setCurrentRecording({
                            url: brief.callRecording,
                            callerName: brief.callerName || 'Unknown',
                            callDate: brief.createdAt,
                            callType: 'Job Brief Call'
                          });
                          setShowRecordingPlayer(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                        title="Play Call Recording"
                      >
                        <Volume2 className="w-4 h-4" />
                        Recording
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBrief(brief);
                        setShowBriefDetails(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View/Edit
                    </button>
                    {!brief.isApproved ? (
                      <>
                        <button
                          onClick={() => handleApprove(brief.jobId, true)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprove(brief.jobId, false)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleApprove(brief.jobId, false)}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>

                {/* Brief Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                    <p className="text-sm font-semibold text-gray-900">{brief.vehicleType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">License</p>
                    <p className="text-sm font-semibold text-gray-900">{brief.licenseType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Experience</p>
                    <p className="text-sm font-semibold text-gray-900">{brief.experience || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Salary</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {brief.salaryFixed ? `₹${brief.salaryFixed}` : 'N/A'}
                      {brief.salaryVariable && ` + ₹${brief.salaryVariable}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No job briefs found</p>
          </div>
        )}
      </div>

      {/* Brief Details Modal */}
      {showBriefDetails && selectedBrief && (
        <JobBriefDetailsModal brief={selectedBrief} onClose={() => setShowBriefDetails(false)} onApprove={handleApprove} />
      )}

      {/* Call Recording Player */}
      {showRecordingPlayer && currentRecording && (
        <CallRecordingPlayer
          recordingUrl={currentRecording.url}
          callerName={currentRecording.callerName}
          callDate={currentRecording.callDate}
          callType={currentRecording.callType}
          onClose={() => {
            setShowRecordingPlayer(false);
            setCurrentRecording(null);
          }}
        />
      )}
    </div>
  );
};

// Editable Field Component
const EditableField = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
    />
  </div>
);

// 🚀 PRODUCTION-READY AI Description Modal - Designed to Attract Drivers Instantly!
const AIDescriptionModal = ({ description, onClose, onApply, onRegenerateWithLanguage }) => {
  const [editedDescription, setEditedDescription] = useState(description.description);
  const [selectedLanguage, setSelectedLanguage] = useState(description.language || 'english');
  const fontFamily = description.fontFamily || 'Arial';

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (onRegenerateWithLanguage) {
      onRegenerateWithLanguage(newLanguage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform transition-all animate-slideUp">

        {/* Simple Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">✨ AI Job Description</h2>
              <p className="text-sm text-purple-100">🎨 {fontFamily} Font</p>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-purple-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">🌍 Change Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white font-medium"
          >
            <option value="english">🇬🇧 English</option>
            <option value="hindi">🇮🇳 हिंदी (Hindi)</option>
            <option value="hinglish">🇮🇳 Hinglish ⭐</option>
            <option value="gujarati">🇮🇳 ગુજરાતી</option>
            <option value="haryanvi">🇮🇳 Haryanvi</option>
            <option value="punjabi">🇮🇳 ਪੰਜਾਬੀ</option>
            <option value="marathi">🇮🇳 मराठी</option>
            <option value="bengali">🇮🇳 বাংলা</option>
            <option value="tamil">🇮🇳 தமிழ்</option>
            <option value="telugu">🇮🇳 తెలుగు</option>
          </select>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-250px)] space-y-4">

          {/* Job Title */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <Star className="w-4 h-4 text-orange-600" />
              🌟 Job Title
            </label>
            <p className="text-lg font-bold text-orange-900" style={{ fontFamily }}>
              {description.enhancedTitle}
            </p>
          </div>

          {/* Description Editor */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4 text-indigo-600" />
              📝 Description (Editable)
            </label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows="12"
              style={{ fontFamily }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm leading-relaxed"
              placeholder="✨ Your AI description..."
            />
            <p className="text-xs text-gray-500 mt-1">{editedDescription.length} characters</p>
          </div>

          {/* Highlights */}
          {description.highlights && description.highlights.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-1 text-sm">
                <Star className="w-4 h-4" />
                ⭐ Key Highlights
              </h4>
              <div className="space-y-2">
                {description.highlights.slice(0, 5).map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-green-800">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {description.requirements && description.requirements.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-1 text-sm">
                <FileText className="w-4 h-4" />
                📋 Requirements
              </h4>
              <div className="space-y-2">
                {description.requirements.slice(0, 5).map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-blue-800">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
          >
            ❌ Cancel
          </button>
          <button
            onClick={() => onApply({ ...description, description: editedDescription })}
            className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-bold shadow-lg"
          >
            <CheckCircle className="w-5 h-5" />
            ✅ Apply Description
          </button>
        </div>
      </div>
    </div>
  );
};

// Job Brief Details Modal
const JobBriefDetailsModal = ({ brief, onClose, onApprove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: brief.jobTitle || '',
    vehicleType: brief.vehicleType || '',
    licenseType: brief.licenseType || '',
    experience: brief.experience || '',
    route: brief.route || '',
    jobLocation: brief.jobLocation || '',
    salaryFixed: brief.salaryFixed || '',
    salaryVariable: brief.salaryVariable || '',
    esiPf: brief.esiPf || '',
    foodAllowance: brief.foodAllowance || '',
    tripIncentive: brief.tripIncentive || '',
    rehneKiSuvidha: brief.rehneKiSuvidha || '',
    mileage: brief.mileage || '',
    fastTagRoadKharcha: brief.fastTagRoadKharcha || ''
  });
  const [saving, setSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedFont, setSelectedFont] = useState('Arial');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_job_briefs.php?action=update`, {
        id: brief.id,
        ...formData
      });
      alert('Job brief updated successfully!');
      setIsEditing(false);
      onClose();
    } catch (error) {
      alert('Failed to update: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    console.log('🤖 Generating AI description in', selectedLanguage);
    console.log('API URL:', `${API_BASE_URL}/ai_description_generator.php`);
    console.log('Form Data:', formData);
    console.log('Font:', selectedFont);

    setAiGenerating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai_description_generator.php`, {
        ...formData,
        companyName: brief.companyName,
        language: selectedLanguage,
        fontFamily: selectedFont
      });

      console.log('✅ AI Response:', response.data);

      if (response.data.success) {
        setAiDescription(response.data.data);
        setShowAIModal(true);
      } else {
        alert('AI generation failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ AI Generation Error:', error);
      console.error('Error Response:', error.response);
      alert('Failed to generate AI description: ' + (error.response?.data?.message || error.message));
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-xs rounded-xl hover:bg-white/30 transition-all"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4">
              <FileText className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <p className="text-sm opacity-80 mb-2">Job Brief ID: {brief.id}</p>
              <h2 className="text-3xl font-bold mb-3">{brief.jobTitle || 'Job Brief Details'}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                  <Building className="w-4 h-4" />
                  {brief.transporterName}
                </span>
                <span className={`px-3 py-1 rounded-lg font-bold ${brief.isApproved ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'
                  }`}>
                  {brief.isApproved ? 'APPROVED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Transporter Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  Transporter Information
                </h3>
                <div className="space-y-3">
                  <DetailRow label="Name" value={brief.transporterName} />
                  <DetailRow label="Company" value={brief.companyName || 'N/A'} />
                  <DetailRow label="TM ID" value={brief.uniqueId} />
                  <DetailRow label="Phone" value={brief.transporterPhone || 'N/A'} />
                  <DetailRow label="City" value={brief.transporterCity || 'N/A'} />
                </div>
              </div>

              {/* Job Requirements */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-600" />
                  Job Requirements
                </h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <EditableField label="Job Title" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                      <EditableField label="Vehicle Type" name="vehicleType" value={formData.vehicleType} onChange={handleChange} />
                      <EditableField label="License Type" name="licenseType" value={formData.licenseType} onChange={handleChange} />
                      <EditableField label="Experience" name="experience" value={formData.experience} onChange={handleChange} />
                      <EditableField label="Route" name="route" value={formData.route} onChange={handleChange} />
                      <EditableField label="Location" name="jobLocation" value={formData.jobLocation} onChange={handleChange} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Job Title" value={brief.jobTitle || 'N/A'} />
                      <DetailRow label="Vehicle Type" value={brief.vehicleType || 'N/A'} />
                      <DetailRow label="License Type" value={brief.licenseType || 'N/A'} />
                      <DetailRow label="Experience" value={brief.experience || 'N/A'} />
                      <DetailRow label="Route" value={brief.route || 'N/A'} />
                      <DetailRow label="Location" value={brief.jobLocation || 'N/A'} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Compensation */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 text-orange-600 font-bold flex items-center justify-center text-xl">₹</span>
                  Compensation & Benefits
                </h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <EditableField label="Fixed Salary (₹)" name="salaryFixed" value={formData.salaryFixed} onChange={handleChange} type="number" />
                      <EditableField label="Variable Salary (₹)" name="salaryVariable" value={formData.salaryVariable} onChange={handleChange} type="number" />
                      <EditableField label="ESI/PF" name="esiPf" value={formData.esiPf} onChange={handleChange} />
                      <EditableField label="Food Allowance (₹)" name="foodAllowance" value={formData.foodAllowance} onChange={handleChange} type="number" />
                      <EditableField label="Trip Incentive (₹)" name="tripIncentive" value={formData.tripIncentive} onChange={handleChange} type="number" />
                      <EditableField label="Accommodation" name="rehneKiSuvidha" value={formData.rehneKiSuvidha} onChange={handleChange} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Fixed Salary" value={brief.salaryFixed ? `₹${brief.salaryFixed}` : 'N/A'} />
                      <DetailRow label="Variable Salary" value={brief.salaryVariable ? `₹${brief.salaryVariable}` : 'N/A'} />
                      <DetailRow label="ESI/PF" value={brief.esiPf || 'No'} />
                      <DetailRow label="Food Allowance" value={brief.foodAllowance ? `₹${brief.foodAllowance}` : 'N/A'} />
                      <DetailRow label="Trip Incentive" value={brief.tripIncentive ? `₹${brief.tripIncentive}` : 'N/A'} />
                      <DetailRow label="Accommodation" value={brief.rehneKiSuvidha || 'No'} />
                    </>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Additional Details
                </h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <EditableField label="Mileage" name="mileage" value={formData.mileage} onChange={handleChange} />
                      <EditableField label="FASTag/Road Charges" name="fastTagRoadKharcha" value={formData.fastTagRoadKharcha} onChange={handleChange} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Mileage" value={brief.mileage || 'N/A'} />
                      <DetailRow label="FASTag/Road Charges" value={brief.fastTagRoadKharcha || 'Company'} />
                    </>
                  )}
                  <DetailRow label="Caller" value={brief.callerName || 'N/A'} />
                  <DetailRow label="Created" value={new Date(brief.createdAt).toLocaleString()} />
                  {brief.callStatusFeedback && (
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Call Feedback:</p>
                      <p className="text-sm text-gray-600 bg-white rounded-lg p-3">{brief.callStatusFeedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6 pt-6 border-t border-gray-200">
            {/* AI Description Generator with Dropdown */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
              <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                ✨ AI Job Description Generator
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Language Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    🌍 Select Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-all"
                  >
                    <option value="english">🇬🇧 English (Professional)</option>
                    <option value="hindi">🇮🇳 हिंदी (Hindi)</option>
                    <option value="hinglish">🇮🇳 Hinglish (Most Popular!)</option>
                    <option value="gujarati">🇮🇳 ગુજરાતી (Gujarati)</option>
                    <option value="haryanvi">🇮🇳 Haryanvi (Regional)</option>
                    <option value="punjabi">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="marathi">🇮🇳 मराठी (Marathi)</option>
                    <option value="bengali">🇮🇳 বাংলা (Bengali)</option>
                    <option value="tamil">🇮🇳 தமிழ் (Tamil)</option>
                    <option value="telugu">🇮🇳 తెలుగు (Telugu)</option>
                  </select>
                </div>

                {/* Font Style Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    🎨 Select Font Style
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium transition-all"
                    style={{ fontFamily: selectedFont }}
                  >
                    <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial (Clean & Modern)</option>
                    <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman (Classic)</option>
                    <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana (Easy to Read)</option>
                    <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia (Elegant)</option>
                    <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New (Typewriter)</option>
                    <option value="Comic Sans MS" style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans (Friendly)</option>
                    <option value="Impact" style={{ fontFamily: 'Impact' }}>Impact (Bold & Strong)</option>
                    <option value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS (Professional)</option>
                    <option value="Palatino" style={{ fontFamily: 'Palatino' }}>Palatino (Sophisticated)</option>
                    <option value="Garamond" style={{ fontFamily: 'Garamond' }}>Garamond (Traditional)</option>
                    <option value="Bookman" style={{ fontFamily: 'Bookman' }}>Bookman (Readable)</option>
                    <option value="Tahoma" style={{ fontFamily: 'Tahoma' }}>Tahoma (Clear)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAI}
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
              >
                {aiGenerating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="animate-pulse">✨ Generating AI Description...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    <span>🚀 Generate AI Job Description</span>
                    <Star className="w-6 h-6" />
                  </>
                )}
              </button>

              {/* Info Text */}
              <div className="mt-3 text-center">
                <p className="text-xs text-purple-700 font-medium">
                  💡 AI will create a professional job description with emojis in your selected language & font
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Details
                  </button>
                  {!brief.isApproved ? (
                    <>
                      <button
                        onClick={() => {
                          onApprove(brief.jobId, true);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          onApprove(brief.jobId, false);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onApprove(brief.jobId, false);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Revoke Approval
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Description Modal */}
      {showAIModal && aiDescription && (
        <AIDescriptionModal
          description={aiDescription}
          onClose={() => setShowAIModal(false)}
          onApply={(desc) => {
            setFormData(prev => ({ ...prev, jobTitle: desc.enhancedTitle }));
            setShowAIModal(false);
            alert('✅ AI description applied successfully! You can now edit and save.');
          }}
          onRegenerateWithLanguage={(newLanguage) => {
            setSelectedLanguage(newLanguage);
            setAiGenerating(true);
            axios.post(`${API_BASE_URL}/ai_description_generator.php`, {
              ...formData,
              companyName: brief.companyName,
              language: newLanguage,
              fontFamily: selectedFont
            })
              .then(response => {
                if (response.data.success) {
                  setAiDescription(response.data.data);
                }
              })
              .catch(error => {
                console.error('Language change error:', error);
              })
              .finally(() => {
                setAiGenerating(false);
              });
          }}
        />
      )}
    </div>
  );
};

// Driver Feedback Tab Component
const DriverFeedbackTab = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [dateFilter, setDateFilter] = useState('all');
  const [telecallerId, setTelecallerId] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);
  const [showRecordingPlayer, setShowRecordingPlayer] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);

  const { data: feedbackData, isLoading, refetch } = useQuery({
    queryKey: ['driver-feedback', filter, searchQuery, sortBy, dateFilter, telecallerId],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'list',
        filter,
        sort_by: sortBy,
        date_filter: dateFilter,
        ...(searchQuery && { search: searchQuery }),
        ...(telecallerId && { telecaller_id: telecallerId })
      });
      const response = await axios.get(`${API_BASE_URL}/admin_driver_feedback.php?${params}`);
      return response.data.data;
    },
  });

  const feedbacks = feedbackData || [];

  const { data: feedbackStats } = useQuery({
    queryKey: ['driver-feedback-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_driver_feedback.php?action=stats`);
      return response.data.data;
    },
  });

  // Get telecallers for filter
  const { data: telecallersResponse } = useQuery({
    queryKey: ['matchmaking-telecallers-feedback'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_telecallers.php?action=list`);
      return response.data;
    },
  });

  const telecallers = Array.isArray(telecallersResponse?.data) ? telecallersResponse.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600" />
            Driver Feedback & Applicants
          </h3>
          <p className="text-gray-600 mt-1">All driver feedback calls and match status</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Phone className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Feedback</p>
          <p className="text-4xl font-bold">{feedbackStats?.totalFeedback || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <Award className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Selected</p>
          <p className="text-4xl font-bold">{feedbackStats?.selectedCount || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-8 h-8 opacity-80" />
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Not Selected</p>
          <p className="text-4xl font-bold">{feedbackStats?.notSelectedCount || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 opacity-80" />
            <Percent className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Selection Rate</p>
          <p className="text-4xl font-bold">{feedbackStats?.selectionRate || 0}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md p-6 border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          Filters
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by driver, transporter, job..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Match Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="selected">Selected</option>
              <option value="not_selected">Not Selected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Telecaller</label>
            <select
              value={telecallerId}
              onChange={(e) => setTelecallerId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Telecallers</option>
              {telecallers?.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Driver Feedback ({feedbacks.length})
        </h4>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          </div>
        ) : feedbacks.length > 0 ? (
          <div className="space-y-4">
            {feedbacks.map(feedback => (
              <div key={feedback.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${feedback.matchStatus === 'Selected' ? 'bg-green-100 text-green-700' :
                        feedback.matchStatus === 'Not Selected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {feedback.matchStatus || 'Pending'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Driver Info */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-2">Driver</p>
                        <p className="text-sm font-bold text-gray-900">{feedback.driverName || 'N/A'}</p>
                        <p className="text-xs text-gray-600">{feedback.driverTmid}</p>
                        {feedback.driverPhone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {feedback.driverPhone}
                          </p>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-600 mb-2">Job</p>
                        <p className="text-sm font-bold text-gray-900">{feedback.jobTitle || 'N/A'}</p>
                        <p className="text-xs text-gray-600">ID: {feedback.jobId}</p>
                        {feedback.jobLocation && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {feedback.jobLocation}
                          </p>
                        )}
                      </div>

                      {/* Transporter Info */}
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-orange-600 mb-2">Transporter</p>
                        <p className="text-sm font-bold text-gray-900">{feedback.transporterName || 'N/A'}</p>
                        {feedback.companyName && (
                          <p className="text-xs text-gray-600">{feedback.companyName}</p>
                        )}
                        <p className="text-xs text-gray-600">{feedback.transporterTmid}</p>
                      </div>
                    </div>

                    {/* Feedback Details */}
                    {feedback.feedback && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-900">{feedback.feedback}</p>
                      </div>
                    )}

                    {feedback.remark && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Remark:</p>
                        <p className="text-sm text-gray-900">{feedback.remark}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Caller: {feedback.callerName || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {feedback.callRecording && (
                      <button
                        onClick={() => {
                          setCurrentRecording({
                            url: feedback.callRecording,
                            callerName: feedback.callerName || 'Unknown',
                            callDate: feedback.createdAt,
                            callType: 'Driver Feedback Call'
                          });
                          setShowRecordingPlayer(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                        title="Play Call Recording"
                      >
                        <Volume2 className="w-4 h-4" />
                        Recording
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowFeedbackDetails(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No driver feedback found</p>
          </div>
        )}
      </div>

      {/* Call Recording Player */}
      {showRecordingPlayer && currentRecording && (
        <CallRecordingPlayer
          recordingUrl={currentRecording.url}
          callerName={currentRecording.callerName}
          callDate={currentRecording.callDate}
          callType={currentRecording.callType}
          onClose={() => {
            setShowRecordingPlayer(false);
            setCurrentRecording(null);
          }}
        />
      )}
    </div>
  );
};

// Applicants Tab Component
const ApplicantsTab = ({ applicants, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600" />
          All Applicants
        </h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <p className="text-gray-600 text-center">Applicants list will be displayed here</p>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ analytics, isLoading, stats, jobs }) => {
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetrics, setSelectedMetrics] = useState({
    activeJobs: true,
    driversRequired: true,
    applicationsReceived: true,
    applicationsAccepted: true,
    jobsPending: true,
    jobsExpiring: true,
    matchmakingDone: true,
    driverJoined: true,
    jobBriefsCreated: true,
    jobBriefsApproved: true,
    transporterCalls: true,
    driverFeedbackCalls: true
  });

  const { data: analyticsData, isLoading: analyticsLoading, refetch } = useQuery({
    queryKey: ['matchmaking-analytics-flexible', timeRange],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_analytics_flexible.php?range=${timeRange}`);
      return response.data.data;
    },
  });

  const periods = analyticsData?.periods || [];
  const viewType = analyticsData?.viewType || 'monthly';
  const currentPeriodIndex = analyticsData?.currentPeriodIndex || 0;
  const lastPeriodIndex = analyticsData?.lastPeriodIndex || 0;

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const handleExport = () => {
    // Create CSV content
    let csv = 'Metric,' + periods.map(p => p.period).join(',') + '\n';

    if (selectedMetrics.activeJobs) {
      csv += 'Count of Active Jobs,' + periods.map(p => p.activeJobs).join(',') + '\n';
    }
    if (selectedMetrics.driversRequired) {
      csv += 'Drivers Required,' + periods.map(p => p.driversRequired).join(',') + '\n';
    }
    if (selectedMetrics.applicationsReceived) {
      csv += 'Applications Received,' + periods.map(p => p.applicationsReceived).join(',') + '\n';
    }
    if (selectedMetrics.applicationsAccepted) {
      csv += 'Applications Accepted,' + periods.map(p => p.applicationsAccepted).join(',') + '\n';
    }
    if (selectedMetrics.jobsPending) {
      csv += 'Jobs Pending,' + periods.map(p => p.jobsPending).join(',') + '\n';
    }
    if (selectedMetrics.jobsExpiring) {
      csv += 'Jobs Expiring,' + periods.map(p => p.jobsExpiring).join(',') + '\n';
    }
    if (selectedMetrics.matchmakingDone) {
      csv += 'Matchmaking Done,' + periods.map(p => p.matchmakingDone).join(',') + '\n';
    }
    if (selectedMetrics.driverJoined) {
      csv += 'Driver Joined,' + periods.map(p => p.driverJoined).join(',') + '\n';
    }
    if (selectedMetrics.jobBriefsCreated) {
      csv += 'Job Briefs Created,' + periods.map(p => p.jobBriefsCreated).join(',') + '\n';
    }
    if (selectedMetrics.jobBriefsApproved) {
      csv += 'Job Briefs Approved,' + periods.map(p => p.jobBriefsApproved).join(',') + '\n';
    }
    if (selectedMetrics.transporterCalls) {
      csv += 'Transporter Calls,' + periods.map(p => p.transporterCalls).join(',') + '\n';
    }
    if (selectedMetrics.driverFeedbackCalls) {
      csv += 'Driver Feedback Calls,' + periods.map(p => p.driverFeedbackCalls).join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matchmaking-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Job Matching Monthly Analytics
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Time Range & View
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <optgroup label="Daily View">
                <option value="today">Today Only</option>
                <option value="7days">Last 7 Days</option>
                <option value="14days">Last 14 Days</option>
                <option value="30days">Last 30 Days</option>
              </optgroup>
              <optgroup label="Weekly View">
                <option value="4weeks">Last 4 Weeks</option>
                <option value="8weeks">Last 8 Weeks</option>
                <option value="12weeks">Last 12 Weeks</option>
              </optgroup>
              <optgroup label="Monthly View">
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="24months">Last 24 Months</option>
              </optgroup>
            </select>
          </div>

          {/* Metrics Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Show/Hide Metrics
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(selectedMetrics).map((metric) => (
                <label key={metric} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-sm">
                  <input
                    type="checkbox"
                    checked={selectedMetrics[metric]}
                    onChange={() => toggleMetric(metric)}
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">
                    {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <th className="text-left p-4 font-bold text-sm border-r border-white/20">Metrics</th>
                  {periods.map((period, idx) => (
                    <th key={idx} className={`text-center p-4 font-bold text-xs border-r border-white/20 ${idx === currentPeriodIndex ? 'bg-green-600' :
                      idx === lastPeriodIndex ? 'bg-blue-600' : ''
                      }`}>
                      {period.period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Count of active jobs */}
                {selectedMetrics.activeJobs && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      1) Count of Active Jobs
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-gray-900 border-r border-gray-200">
                        {period.activeJobs}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 2: Drivers required through active jobs */}
                {selectedMetrics.driversRequired && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-blue-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      2) Drivers Required Through Active Jobs
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-blue-700 border-r border-gray-200">
                        {period.driversRequired}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 3: Applications received (count) */}
                {selectedMetrics.applicationsReceived && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      3) Applications Received (Count)
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-green-700 border-r border-gray-200">
                        {period.applicationsReceived}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 4: Applications accepted (count) */}
                {selectedMetrics.applicationsAccepted && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-green-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      4) Applications Accepted (Count)
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-green-700 border-r border-gray-200">
                        {period.applicationsAccepted}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 5: Jobs pending for approval */}
                {selectedMetrics.jobsPending && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      5) Jobs Pending for Approval
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-yellow-700 border-r border-gray-200">
                        {period.jobsPending}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 6: Jobs expiring in next 5 days */}
                {selectedMetrics.jobsExpiring && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-yellow-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      6) Jobs Expiring in Next 5 Days
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-orange-700 border-r border-gray-200">
                        {period.jobsExpiring}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 7: Matchmaking done */}
                {selectedMetrics.matchmakingDone && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      7) Matchmaking Done
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-purple-700 border-r border-gray-200">
                        {period.matchmakingDone}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 8: Driver joined from portal */}
                {selectedMetrics.driverJoined && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-purple-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      8) Driver Joined from Portal
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-indigo-700 border-r border-gray-200">
                        {period.driverJoined}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 9: Job Briefs Created */}
                {selectedMetrics.jobBriefsCreated && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      9) Job Briefs Created
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-cyan-700 border-r border-gray-200">
                        {period.jobBriefsCreated}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 10: Job Briefs Approved */}
                {selectedMetrics.jobBriefsApproved && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-cyan-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      10) Job Briefs Approved
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-teal-700 border-r border-gray-200">
                        {period.jobBriefsApproved}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 11: Transporter Calls Made */}
                {selectedMetrics.transporterCalls && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      11) Transporter Calls Made
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-pink-700 border-r border-gray-200">
                        {period.transporterCalls}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Row 12: Driver Feedback Calls */}
                {selectedMetrics.driverFeedbackCalls && (
                  <tr className="border-b border-gray-200 hover:bg-gray-50 bg-pink-50">
                    <td className="p-4 font-semibold text-gray-900 border-r border-gray-200">
                      12) Driver Feedback Calls
                    </td>
                    {periods.map((period, idx) => (
                      <td key={idx} className="p-4 text-center font-bold text-rose-700 border-r border-gray-200">
                        {period.driverFeedbackCalls}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                <span className="text-gray-700 font-medium">This Month (Current)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
                <span className="text-gray-700 font-medium">Last Month</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-600 rounded-sm"></div>
                <span className="text-gray-700 font-medium">Previous Months</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Job Applicants Modal Component - Professional Design
const JobApplicantsModal = ({ job, applicants, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Debug logging - Check transporter data
  console.log('=== TRANSPORTER DATA DEBUG ===');
  console.log('Transporter ID:', job?.transporterId);
  console.log('Transporter Name:', job?.transporterName);
  console.log('Transporter TMID:', job?.transporterTmid, '(empty?', !job?.transporterTmid, ')');
  console.log('Transporter Phone:', job?.transporterPhone, '(empty?', !job?.transporterPhone, ')');
  console.log('Full Job Object:', job);
  console.log('==============================');

  // Filter applicants for this specific job
  // The applicants API returns job_id as the database ID (integer)
  // We need to match it with job.id (database ID), not job.jobId (string like "TMJB00418")
  const jobApplicants = applicants?.filter(app => {
    console.log('Comparing app.jobId:', app.jobId, 'with job.id:', job.id);
    // Match by database ID (this is the correct way)
    return Number(app.jobId) === Number(job.id);
  }) || [];

  console.log('Modal - Filtered Job Applicants:', jobApplicants);

  // Apply search and status filters
  const filteredApplicants = jobApplicants.filter(app => {
    const matchesSearch = !searchQuery ||
      app.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.driverMobile?.includes(searchQuery) ||
      app.driverTmid?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={onClose}></div>
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col relative z-10">
          {/* Compact Header */}
          <div className="px-5 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Applicants</h3>
                  <p className="text-xs text-gray-600">{job.jobId} • {jobApplicants.length} total</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Compact Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Compact Applicants List */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {filteredApplicants.length > 0 ? (
              <div className="space-y-2">
                {filteredApplicants.map((applicant, index) => (
                  <div
                    key={applicant.id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Driver Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-indigo-100 rounded-lg px-2.5 py-1 flex-shrink-0">
                          <span className="text-indigo-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{applicant.driverName || 'N/A'}</h4>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-sm flex-shrink-0 ${applicant.status === 'interested' ? 'bg-emerald-100 text-emerald-700' :
                              applicant.status === 'not_interested' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                              {applicant.status === 'interested' ? 'Interested' :
                                applicant.status === 'not_interested' ? 'Not Int.' :
                                  'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{applicant.driverPhone || applicant.driverMobile || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{applicant.driverTmid || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{new Date(applicant.appliedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-medium">
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </button>
                        <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  {jobApplicants.length === 0 ? 'No Applicants Yet' : 'No Results Found'}
                </h4>
                <p className="text-gray-600">
                  {jobApplicants.length === 0
                    ? 'This job hasn\'t received any applications yet.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            )}
          </div>

          {/* Compact Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-indigo-600">{filteredApplicants.length}</span> of <span className="font-semibold">{jobApplicants.length}</span>
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Job Edit Modal Component
const JobEditModal = ({ job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    jobTitle: job.jobTitle || '',
    jobDescription: job.jobDescription || '',
    jobLocation: job.jobLocation || '',
    salaryRange: job.salaryRange || '',
    requiredExperience: job.requiredExperience || '',
    numberOfDriverRequired: job.numberOfDriverRequired || 1,
    applicationDeadline: job.applicationDeadline || '',
    activeInactive: job.activePosition || 1
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_jobs.php?action=update`, {
        jobId: job.id,
        ...formData
      });
      alert('Job updated successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to update job: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Edit className="w-6 h-6 text-blue-600" />
            Edit Job
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Job Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Location *
            </label>
            <input
              type="text"
              name="jobLocation"
              value={formData.jobLocation}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
                placeholder="e.g., 25000-30000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Required Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Experience
              </label>
              <input
                type="text"
                name="requiredExperience"
                value={formData.requiredExperience}
                onChange={handleChange}
                placeholder="e.g., 2-5 years"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Number of Drivers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Drivers Required
              </label>
              <input
                type="number"
                name="numberOfDriverRequired"
                value={formData.numberOfDriverRequired}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Active/Inactive Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Status
            </label>
            <select
              name="activeInactive"
              value={formData.activeInactive}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Update Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Job Reassign Modal Component
const JobReassignModal = ({ job, onClose, onSuccess }) => {
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [loading, setLoading] = useState(false);
  const [telecallers, setTelecallers] = useState([]);

  // Fetch telecallers
  useEffect(() => {
    const fetchTelecallers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/admin_matchmaking_telecallers.php`);
        setTelecallers(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch telecallers:', error);
      }
    };
    fetchTelecallers();
  }, []);

  const handleReassign = async () => {
    if (!selectedTelecaller) {
      alert('Please select a telecaller');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_matchmaking_jobs.php?action=reassign`, {
        jobId: job.id,
        telecallerId: selectedTelecaller
      });
      alert('Job reassigned successfully!');
      onSuccess();
    } catch (error) {
      alert('Failed to reassign job: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-600" />
            Reassign Job
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Job Info */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 rounded-lg p-2">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-900">{job.jobTitle}</h4>
                <p className="text-sm text-indigo-700 mt-1">{job.jobLocation}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-indigo-600">
                  <span>Job ID: {job.jobId}</span>
                  <span>•</span>
                  <span>{job.applicantsCount} applicants</span>
                </div>
                {job.assignedToName && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">Current: <span className="font-semibold">{job.assignedToName}</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telecaller Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Telecaller *
            </label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Select telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.assignedJobs?.total || 0} jobs assigned)
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Choose a telecaller to assign this job to
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={loading || !selectedTelecaller}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reassigning...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  Reassign Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Closed Jobs Tab Component - Shows all closed jobs
const ClosedJobsTab = ({ telecallers, setShowApplicantsModal, setSelectedJobForApplicants }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [telecallerFilter, setTelecallerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: jobsResponse, isLoading, refetch } = useQuery({
    queryKey: ['closed-jobs', searchQuery, telecallerFilter, currentPage],
    queryFn: async () => {
      let url = `${API_BASE_URL}/admin_matchmaking_jobs.php?filter=closed&page=${currentPage}&limit=15`;
      if (telecallerFilter !== 'all') {
        url += `&telecaller_id=${telecallerFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await axios.get(url);
      return response.data;
    },
  });

  const jobs = jobsResponse?.data || [];
  const totalJobs = jobsResponse?.total || 0;
  const totalPages = jobsResponse?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-8 h-8 opacity-80" />
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Closed Jobs</p>
          <p className="text-4xl font-bold">{totalJobs}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 opacity-80" />
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Closed This Month</p>
          <p className="text-4xl font-bold">{jobs.filter(j => {
            const date = new Date(j.updatedAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Briefcase className="w-8 h-8 opacity-80" />
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Inactive Status</p>
          <p className="text-4xl font-bold">{jobs.filter(j => !j.isActive).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search closed jobs..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <select
            value={telecallerFilter}
            onChange={(e) => {
              setTelecallerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Telecallers</option>
            {telecallers?.map(tc => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-bold text-red-600">{totalJobs}</span> closed jobs
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading closed jobs...</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <XCircle className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-xl font-bold text-gray-400 mb-2">No closed jobs found</p>
          <p className="text-sm text-gray-500">All jobs are currently active</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl shadow-lg border-2 border-red-200 overflow-hidden hover:shadow-xl transition-all">
              {/* Closed Badge */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold text-sm">CLOSED JOB</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Inactive</span>
              </div>

              <div className="p-4">
                {/* Job ID */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500">{job.jobId}</span>
                  {job.isClosed && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      Closed
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
                  {job.jobTitle}
                </h3>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="truncate">{job.jobLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-red-500" />
                    <span className="truncate">{job.transporterName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    <span className="truncate">{job.salaryRange || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-red-500" />
                    <span>{job.applicantsCount} applicants</span>
                  </div>
                </div>

                {/* Telecaller */}
                {job.assignedToName && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">{job.assignedToName}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedJobForApplicants(job);
                      setShowApplicantsModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                  >
                    <Users className="w-4 h-4" />
                    View Applicants
                  </button>
                </div>

                {/* Closed Date */}
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Closed: {new Date(job.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{((currentPage - 1) * 15) + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(currentPage * 15, totalJobs)}</span> of{' '}
            <span className="font-semibold">{totalJobs}</span> closed jobs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Matchmaking Success Tab Component - Shows successful matchmaking records
const MatchmakingSuccessTab = ({ telecallers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [telecallerFilter, setTelecallerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: successData, isLoading, refetch } = useQuery({
    queryKey: ['matchmaking-success', searchQuery, telecallerFilter, currentPage],
    queryFn: async () => {
      let url = `${API_BASE_URL}/admin_matchmaking_success.php?page=${currentPage}&limit=15`;
      if (telecallerFilter !== 'all') {
        url += `&telecaller_id=${telecallerFilter}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await axios.get(url);
      return response.data;
    },
  });

  const records = successData?.data || [];
  const totalRecords = successData?.total || 0;
  const totalPages = successData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <Award className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Total Success</p>
          <p className="text-4xl font-bold">{totalRecords}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">This Month</p>
          <p className="text-4xl font-bold">{records.filter(r => {
            const date = new Date(r.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Phone className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Today</p>
          <p className="text-4xl font-bold">{records.filter(r => {
            const date = new Date(r.createdAt);
            const now = new Date();
            return date.toDateString() === now.toDateString();
          }).length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-8 h-8 opacity-80" />
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Success Rate</p>
          <p className="text-4xl font-bold">
            {totalRecords > 0 ? Math.round((totalRecords / (totalRecords + 100)) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by job, driver, telecaller..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <select
            value={telecallerFilter}
            onChange={(e) => {
              setTelecallerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Telecallers</option>
            {telecallers?.map(tc => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-bold text-green-600">{totalRecords}</span> successful matches
          </div>
        </div>
      </div>

      {/* Records Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading success records...</p>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-xl font-bold text-gray-400 mb-2">No successful matches found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Job Details</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Driver Details</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Transporter</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Telecaller</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 rounded-lg p-2">
                          <Briefcase className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{record.jobId}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{record.jobTitle}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {record.jobLocation}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-100 rounded-lg p-2">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{record.driverName}</p>
                          <p className="text-xs text-gray-600">{record.driverTmid || 'No TM ID'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {record.driverMobile || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{record.transporterName}</p>
                        <p className="text-xs text-gray-600">{record.transporterTmid || 'No TM ID'}</p>
                        <p className="text-xs text-gray-500">{record.transporterPhone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 rounded-full p-1">
                          <UserCheck className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{record.telecallerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(record.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {record.recordingUrl && (
                          <button
                            onClick={() => window.open(record.recordingUrl, '_blank')}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                            title="Play Recording"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{((currentPage - 1) * 15) + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * 15, totalRecords)}</span> of{' '}
                <span className="font-semibold">{totalRecords}</span> records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-xs rounded-xl p-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Matchmaking Success Details</h3>
                    <p className="text-green-100 text-sm mt-1">Complete matchmaking information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Job Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Job ID</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.jobId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Job Title</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.jobTitle}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.jobLocation}</p>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Driver Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.driverName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">TM ID</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.driverTmid || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mobile</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.driverMobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">City</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.driverCity || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Transporter Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Transporter Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.transporterName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">TM ID</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.transporterTmid || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.transporterPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Call Info */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-600" />
                  Call Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Telecaller</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.telecallerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Call Type</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.callType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{selectedRecord.callDuration || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRecord.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedRecord.notes && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Notes</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recording */}
              {selectedRecord.recordingUrl && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                    Call Recording
                  </h4>
                  <CallRecordingPlayer url={selectedRecord.recordingUrl} />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
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

export default JobMatching;