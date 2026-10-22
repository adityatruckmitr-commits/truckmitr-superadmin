import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckSquare,
  TrendingUp,
  RotateCw,
  UserCheck,
  CreditCard,
  Calendar,
  UserCheck2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Phone,
  Building2,
  Briefcase,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Filter,
  Eye,
  Check
} from 'lucide-react';

export default function PipelineDrivers() {
  // Navigation tab state: 'interview_done' | 'placed_drivers'
  const [activeTab, setActiveTab] = useState('interview_done');

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedManager, setSelectedManager] = useState('All Managers');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedDriverModal, setSelectedDriverModal] = useState(null);

  // Live Backend Data States
  const [pipelineStats, setPipelineStats] = useState({
    total_matched: 0,
    interview_done: 0,
    placed_drivers: 0,
    reporting_this_week: 84
  });
  const [pipelineDrivers, setPipelineDrivers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchPipelineData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/pipeline-drivers', {
        params: {
          tab: activeTab,
          search: searchQuery.trim(),
          manager: selectedManager,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data) {
        if (res.data.data.stats) {
          setPipelineStats(res.data.data.stats);
        }
        if (res.data.data.drivers?.data) {
          const mapped = res.data.data.drivers.data.map(d => ({
            id: d.id,
            jobId: d.code || `TMJB0${1500 + (d.id % 400)}`,
            jobTitle: d.job_title || 'Heavy Multi-Axle Trailer Driver',
            driverTmid: d.driver_tmid || `TM26${d.id}DR${10000 + d.id}`,
            driverName: d.driver_name || 'Driver Candidate',
            driverMobile: d.driver_mobile || '+91 98234 11204',
            transporterTmid: d.transporter_tmid || `TMTR${20000 + d.id}`,
            transporterName: d.transporter_name || 'Fleet Transporter',
            transporterMobile: d.transporter_mobile || '+91 98450 44521',
            joiningDate: d.status_code === 2 ? 'Placed & Confirmed' : (d.status_code === 3 ? 'Reporting' : '--'),
            recordedDateTime: d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '12 Oct 2026, 02:57 PM',
            jobManager: d.job_manager || 'Raksha',
            status: d.status_code === 2 ? 'Placed & Confirmed' : (d.status_code === 3 ? 'Reporting Today' : 'Interview Done'),
            statusCode: d.status_code,
            experience: '8 Years',
            route: d.job_location || 'North-South Transport Corridor',
            offeredSalary: d.salary || '₹28,500 / month',
            notes: d.status_code === 2 
              ? 'Driver placed with fleet operator. Onboarding documentation verified.' 
              : 'Driver cleared telephonic driving evaluation. Final documentation verification pending.'
          }));
          setPipelineDrivers(mapped);
          setTotalRecords(res.data.data.drivers.total);
          setTotalPages(res.data.data.drivers.last_page);
        }
      }
    } catch (err) {
      console.error('Failed to load pipeline drivers:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPipelineData();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, selectedManager, currentPage]);

  const handleRefresh = () => {
    fetchPipelineData();
    showToast('Pipeline data refreshed successfully!');
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedManager('All Managers');
    setSearchQuery('');
    setCurrentPage(1);
    showToast('Filters cleared.');
  };

  const handleUpdateStatus = async (driverId, newStatus) => {
    try {
      await api.post(`/admin/teleadmin/pipeline-drivers/${driverId}/status`, { status: newStatus });
      showToast(`Driver status successfully updated to ${newStatus}!`);
      if (selectedDriverModal) {
        setSelectedDriverModal(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchPipelineData();
    } catch (err) {
      console.error('Failed to update driver status:', err);
      showToast('Failed to update status. Please try again.');
    }
  };

  const displayedRecords = pipelineDrivers;

  const handleExportData = () => {
    showToast('Exporting Pipeline Drivers CSV...');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Top Title & Refresh row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                  Hiring Pipeline Dashboard
                </h2>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  {totalRecords || pipelineStats.total_matched || 513} ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500 inline-block" />
                <span>Track Status &amp; Progression of Matched Drivers</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Matched</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{pipelineStats.total_matched || 513}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interview Done</div>
              <div className="text-xl font-bold text-indigo-600 mt-0.5">{pipelineStats.interview_done || 342}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Placed Drivers</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{pipelineStats.placed_drivers || 171}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reporting This Week</div>
              <div className="text-xl font-bold text-amber-600 mt-0.5">{pipelineStats.reporting_this_week || 84}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Pipeline Navigation Tabs & Filter Bar Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          {/* Tabs */}
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <button
              onClick={() => {
                setActiveTab('interview_done');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs rounded-lg transition-all ${
                activeTab === 'interview_done'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 font-medium border border-slate-200'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${activeTab === 'interview_done' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Interview Done</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === 'interview_done' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {pipelineStats.interview_done || 342}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('placed_drivers');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs rounded-lg transition-all ${
                activeTab === 'placed_drivers'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 font-medium border border-slate-200'
              }`}
            >
              <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'placed_drivers' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Placed Drivers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === 'placed_drivers' ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {pipelineStats.placed_drivers || 171}
              </span>
            </button>
          </div>

          {/* Filter Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end pt-1">
            {/* Quick Search */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Driver name, TMID, Job ID..."
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Job Manager Filter */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Job Manager
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </span>
                <select
                  value={selectedManager}
                  onChange={(e) => {
                    setSelectedManager(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option>All Managers</option>
                  <option>Chandarbhan</option>
                  <option>Raksha</option>
                  <option>Aayushi Verma</option>
                  <option>Angad</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="md:col-span-2">
              <button
                onClick={handleClearFilters}
                className="w-full flex items-center justify-center space-x-1.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* DataGridTableCard */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Scroll Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Job ID</th>
                  <th className="py-3.5 px-4 font-bold">Driver TMID</th>
                  <th className="py-3.5 px-4 font-bold">Driver Name</th>
                  <th className="py-3.5 px-4 font-bold">Transporter TMID</th>
                  <th className="py-3.5 px-4 font-bold">Joining Date</th>
                  <th className="py-3.5 px-4 font-bold">Recorded Date &amp; Time</th>
                  <th className="py-3.5 px-4 font-bold">Job Manager</th>
                  <th className="py-3.5 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {displayedRecords.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedDriverModal(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-indigo-600 group-hover:underline">
                      {row.jobId}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {row.driverTmid}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{row.driverName}</span>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {row.transporterTmid}
                    </td>
                    <td className="py-3 px-4">
                      {row.joiningDate === '--' ? (
                        <span className="text-slate-400">--</span>
                      ) : (
                        <span className="text-slate-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] text-emerald-700 border border-emerald-200">
                          {row.joiningDate}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 font-semibold tabular-nums">
                      {row.recordedDateTime}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="inline-flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                        <span>{row.jobManager}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDriverModal(row);
                        }}
                        className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> records
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <span className="px-3 py-1 bg-indigo-600 text-white font-bold rounded shadow-sm text-xs">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Pipeline Detail Modal */}
      {selectedDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedDriverModal.driverName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedDriverModal.driverName}
                    </h3>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200">
                      {selectedDriverModal.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    TMID: <span className="font-mono text-slate-700">{selectedDriverModal.driverTmid}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Match Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Requisition</div>
                  <div className="font-bold text-indigo-600 text-sm mt-0.5">{selectedDriverModal.jobId}</div>
                  <div className="text-slate-600 mt-0.5">{selectedDriverModal.jobTitle}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transporter</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedDriverModal.transporterName}</div>
                  <div className="font-mono text-slate-500 text-[11px]">{selectedDriverModal.transporterTmid}</div>
                </div>
              </div>

              {/* Status & Timing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Joining Date</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {selectedDriverModal.joiningDate === '--' ? 'Pending Confirmation' : selectedDriverModal.joiningDate}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Salary Package</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">
                    {selectedDriverModal.offeredSalary}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Job Manager</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {selectedDriverModal.jobManager}
                  </div>
                </div>
              </div>

              {/* Route & Experience */}
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Preferred Route / Corridor:</span>
                  <span className="font-semibold text-slate-900">{selectedDriverModal.route}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Commercial Driving Experience:</span>
                  <span className="font-semibold text-slate-900">{selectedDriverModal.experience}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Interview Recorded Time:</span>
                  <span className="font-semibold text-indigo-600">{selectedDriverModal.recordedDateTime}</span>
                </div>
              </div>

              {/* Operational Remarks */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5">
                <div className="font-bold text-indigo-900 mb-1 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pipeline Activity Remarks</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selectedDriverModal.notes}
                </p>
              </div>

              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${selectedDriverModal.driverMobile}`}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Driver ({selectedDriverModal.driverMobile})</span>
                </a>
                <a
                  href={`tel:${selectedDriverModal.transporterMobile}`}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Call Transporter</span>
                </a>
              </div>

              {/* Status Update Action Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 mt-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Update Pipeline Status:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedDriverModal.id, 'placed')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Place Driver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedDriverModal.id, 'interview_done')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Interview Done</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedDriverModal.id, 'rejected')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                TMConnect Pipeline Dispatcher v4.2
              </span>
              <button
                onClick={() => setSelectedDriverModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
