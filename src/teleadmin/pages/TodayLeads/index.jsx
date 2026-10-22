import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import leadsApi from '../../services/api/leadsApi';
import {
  Users,
  RefreshCw,
  Calendar,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  ListTodo
} from 'lucide-react-teleadmin';
import StatCard from './components/StatCard';
import AssignmentSummary from './components/AssignmentSummary';
import LeadsFilters from './components/LeadsFilters';
import LeadsTable from './components/LeadsTable';
import CallStatusModal from './components/CallStatusModal';
import BacklogModal from './components/BacklogModal';

const TodayLeads = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // For API calls
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLeadState, setSelectedLeadState] = useState(''); // '', connected, not_connected, callback, backlog
  const [callStatusModal, setCallStatusModal] = useState(null);
  const [showBacklogModal, setShowBacklogModal] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false); // Track if any modal in table is open

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setPage(1); // Reset to page 1 on search change
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);


  // Quick date filter functions
  const setToday = () => {
    setSelectedDate('');
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
  };

  const setThisWeek = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    setSelectedDate(firstDayOfWeek.toISOString().split('T')[0]);
  };

  const isActiveFilter = (filter) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    if (filter === 'today') return selectedDate === '' || selectedDate === today;
    if (filter === 'yesterday') return selectedDate === yesterdayStr;
    if (filter === 'week') return selectedDate === weekStartStr;
    return false;
  };

  // Construct API params
  // Construct API params for the table (filtered)
  const apiParams = {
    page,
    per_page: perPage,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    telecaller_id: assignedFilter !== 'all' ? assignedFilter : undefined,
    call_status: selectedLeadState === 'today_total' ? undefined :
      selectedLeadState === 'callback' ? 'callback_later' :
        selectedLeadState === 'backlog' ? 'fresh,pending' :
          selectedLeadState || undefined, // connected, not_connected passes through
    date: selectedDate || undefined,
    search: debouncedSearchTerm || undefined
  };

  // Construct API params for the stats (unfiltered by call_status, but respected other filters if desirable, or just purely global)
  // User said "no matter i filter connected... key counts remain same". implying selectedLeadState shouldn't affect stats.
  const statsParams = {
    // We don't need pagination for stats, but API might require it or defaults.
    // We just want the assigned_count summary.
    role: roleFilter !== 'all' ? roleFilter : undefined,
    telecaller_id: assignedFilter !== 'all' ? assignedFilter : undefined,
    date: selectedDate || undefined,
    search: debouncedSearchTerm || undefined
  };

  // Fetch today's leads with filters (Table Data)
  const { data: response, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['today-leads', apiParams],
    queryFn: () => leadsApi.getTodayLeads(apiParams),
    refetchInterval: (isTableModalOpen || !!callStatusModal || showBacklogModal) ? false : 30000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  // Fetch stats separately (to keep cards static)
  const { data: statsResponse } = useQuery({
    queryKey: ['today-leads-stats', statsParams],
    queryFn: () => leadsApi.getTodayLeads(statsParams),
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  // Fetch backlog leads
  const { data: backlogResponse } = useQuery({
    queryKey: ['backlog-leads'],
    queryFn: () => leadsApi.getBacklogLeads(),
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: false,
  });

  // Extract data from API response
  // Extract data from API response
  const rawLeadsData = response?.data || [];
  const leads = rawLeadsData;
  const pagination = response?.pagination || {};
  const assignedCountData = response?.assigned_count || [];
  const startRange = response?.start_range || '';
  const endRange = response?.end_range || '';

  // Calculate totals for cards from statsResponse (static counts)
  const statsAssignedCountData = statsResponse?.assigned_count || [];
  const stats = statsAssignedCountData.reduce((acc, curr) => ({
    total: acc.total + (curr.total_assigned || 0),
    connected: acc.connected + (curr.total_connected || 0),
    not_connected: acc.not_connected + (curr.total_not_connected || 0),
    callback: acc.callback + (curr.total_callback_later || 0),
    fresh: acc.fresh + (curr.remaining_fresh || 0),
    pending: acc.pending + (curr.total_pending || 0),
  }), { total: 0, connected: 0, not_connected: 0, callback: 0, fresh: 0, pending: 0 });
  console.log(stats)
  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler helper (reset page on filter change)
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 text-center mb-2">Error Loading Leads</h3>
          <p className="text-red-700 text-center">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {selectedDate ? `Leads for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : "Today's Leads"}
            </h1>
            <p className="text-blue-100 text-lg">
              {startRange && endRange && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(startRange).toLocaleString('en-IN')} - {new Date(endRange).toLocaleString('en-IN')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={setToday}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${isActiveFilter('today')
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                Today
              </button>
              {/* <button
                onClick={setYesterday}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActiveFilter('yesterday')
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Yesterday
              </button> */}
            </div>

            {/* Custom Date Picker */}
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Calendar className="w-5 h-5 text-white" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleFilterChange(setSelectedDate, e.target.value)}
                className="bg-transparent text-white border-none outline-hidden cursor-pointer placeholder-white/70"
                style={{ colorScheme: 'dark' }}
              />
              {selectedDate && (
                <button
                  onClick={() => handleFilterChange(setSelectedDate, '')}
                  className="ml-1 text-white/70 hover:text-white transition-colors"
                  title="Clear date"
                >
                  ×
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                console.log('Refresh button clicked');
                refetch();
              }}
              disabled={isFetching}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Leads (Today)"
          value={stats.total}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          isSelected={selectedLeadState === ''}
          onClick={() => handleFilterChange(setSelectedLeadState, '')}
        />
        <StatCard
          title="Connected"
          value={stats.connected}
          icon={PhoneCall}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
          isSelected={selectedLeadState === 'connected'}
          onClick={() => handleFilterChange(setSelectedLeadState, 'connected')}
        />
        <StatCard
          title="Not Connected"
          value={stats.not_connected}
          icon={PhoneMissed}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
          isSelected={selectedLeadState === 'not_connected'}
          onClick={() => handleFilterChange(setSelectedLeadState, 'not_connected')}
        />
        <StatCard
          title="Callback"
          value={stats.callback}
          icon={PhoneOff}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          isSelected={selectedLeadState === 'callback'}
          onClick={() => handleFilterChange(setSelectedLeadState, 'callback')}
        />
        <StatCard
          title="Pending"
          value={stats.pending + stats.fresh || 0}
          icon={ListTodo}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          isSelected={selectedLeadState === 'backlog'}
        onClick={() => handleFilterChange(setSelectedLeadState, 'backlog')}
        />
      </div>

      {/* Assignment Summary */}
      <AssignmentSummary
        assignedCount={assignedCountData}
        title={selectedLeadState ? `${selectedLeadState.replace('_', ' ')} Leads Distribution` : "Today's Total Leads Distribution"}
        selectedState={selectedLeadState}
      />

      {/* Filters */}
      <LeadsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        assignedFilter={assignedFilter}
        setAssignedFilter={(val) => handleFilterChange(setAssignedFilter, val)}
        roleFilter={roleFilter}
        setRoleFilter={(val) => handleFilterChange(setRoleFilter, val)}
        assignedCount={assignedCountData}
        filteredCount={pagination.total || 0}
        totalCount={pagination.total || 0} // Total server count
      />

      {/* Leads Table */}
      <LeadsTable
        leads={leads}
        isLoading={isLoading || isFetching}
        roleFilter={roleFilter}
        currentPage={page}
        totalCount={pagination.total || 0}
        perPage={perPage}
        onPageChange={handlePageChange}
        onModalStateChange={setIsTableModalOpen}
      />

      {/* Call Status Modal */}
      {callStatusModal && (
        <CallStatusModal
          title={callStatusModal.title}
          data={callStatusModal.data}
          gradient={callStatusModal.gradient}
          onClose={() => setCallStatusModal(null)}
        />
      )}

      {/* Backlog Modal */}
      {showBacklogModal && backlogResponse && (
        <BacklogModal
          data={backlogResponse}
          onClose={() => setShowBacklogModal(false)}
        />
      )}
    </div>
  );
};

export default TodayLeads;
