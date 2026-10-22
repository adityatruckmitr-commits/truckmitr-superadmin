import React, { useState, useMemo, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  UserPlus,
  Clock,
  RotateCw,
  Filter,
  Search,
  RotateCcw,
  MapPin,
  UserCheck,
  IdCard,
  Ticket,
  Calendar,
  ChevronDown,
  Eye,
  Check,
  X,
  User,
  Phone,
  Mail,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Volume2,
  Download,
  XCircle,
  Hash,
  Activity
} from 'lucide-react';

export default function LeadsAssignment() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedAssignee, setSelectedAssignee] = useState('All Assignees');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedSubscription, setSelectedSubscription] = useState('All Subscriptions');
  // Date Helper for HTML5 datetime-local (YYYY-MM-DDTHH:mm)
  const getPresetDates = (preset) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toLocalISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (preset === 'Today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      return { start: toLocalISO(start), end: toLocalISO(end) };
    }
    if (preset === 'Yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0);
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59);
      return { start: toLocalISO(start), end: toLocalISO(end) };
    }
    if (preset === 'Last 7 Days') {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      const start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      return { start: toLocalISO(start), end: toLocalISO(end) };
    }
    if (preset === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
      return { start: toLocalISO(start), end: toLocalISO(end) };
    }
    return { start: '', end: '' };
  };

  const initialDates = getPresetDates('This Month');
  const [dateRangePreset, setDateRangePreset] = useState('This Month');
  const [startDateTime, setStartDateTime] = useState(initialDates.start || '2026-10-01T00:00');
  const [endDateTime, setEndDateTime] = useState(initialDates.end || '2026-10-31T23:59');

  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);

  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    setCurrentPage(1);
    if (preset !== 'Custom Range' && preset !== 'All Time') {
      const { start, end } = getPresetDates(preset);
      setStartDateTime(start);
      setEndDateTime(end);
    }
  };

  // Selection & Bulk Assignment State
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [autoSelectCount, setAutoSelectCount] = useState('');
  const [targetBulkAssignee, setTargetBulkAssignee] = useState('Kamini');

  // UI Interactive State
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [modalNewAssignee, setModalNewAssignee] = useState('');
  const [modalCallHistory, setModalCallHistory] = useState([]);
  const [isModalHistoryLoading, setIsModalHistoryLoading] = useState(false);

  const fetchCallHistory = async (lead) => {
    if (!lead) return;
    setIsModalHistoryLoading(true);
    setModalCallHistory([]);
    try {
      const res = await api.get('/admin/teleadmin/call-history', {
        params: {
          user_id: lead.id,
          mobile: lead.phone && lead.phone !== '--' ? lead.phone : undefined,
          user_tm_id: lead.tmid || undefined
        }
      });
      if (res.data?.status && Array.isArray(res.data?.data)) {
        setModalCallHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch call history:', err);
    } finally {
      setIsModalHistoryLoading(false);
    }
  };

  const handleOpenLeadDetails = (lead) => {
    setSelectedLeadModal(lead);
    setModalNewAssignee(lead.assignee);
    fetchCallHistory(lead);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Available Telechamps from database
  const [liveTelechamps, setLiveTelechamps] = useState([
    { id: 49, name: 'Aayushi Verma', leads_count: 1370, display_label: 'Aayushi Verma (1,370 leads)' },
    { id: 47, name: 'Aditya kumar', leads_count: 4738, display_label: 'Aditya kumar (4,738 leads)' },
    { id: 39, name: 'Angad', leads_count: 1751, display_label: 'Angad (1,751 leads)' },
    { id: 10, name: 'Ankit Singh', leads_count: 9358, display_label: 'Ankit Singh (9,358 leads)' },
    { id: 38, name: 'Chandarbhan', leads_count: 2220, display_label: 'Chandarbhan (2,220 leads)' },
    { id: 50, name: 'Kamini', leads_count: 4796, display_label: 'Kamini (4,796 leads)' },
    { id: 35, name: 'Pratima', leads_count: 9060, display_label: 'Pratima (9,060 leads)' },
    { id: 9, name: 'Raksha', leads_count: 1204, display_label: 'Raksha (1,204 leads)' },
    { id: 8, name: 'Sonam', leads_count: 22386, display_label: 'Sonam (22,386 leads)' }
  ]);
  const telechamps = useMemo(() => {
    const uniqueMap = new Map();
    liveTelechamps.forEach(t => {
      const name = (t.name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!uniqueMap.has(key)) {
        const total = Number(t.total_assigned ?? t.leads_count ?? 0);
        const uncalled = Number(t.uncalled_leads ?? t.uncalled_leads_count ?? 0);
        uniqueMap.set(key, {
          id: t.id,
          name: name,
          leads_count: total,
          uncalled_leads: uncalled,
          label: t.display_label || `${name} (${total.toLocaleString()} leads)`
        });
      }
    });
    return Array.from(uniqueMap.values());
  }, [liveTelechamps]);

  // Leads Dataset (Loaded dynamically from API)
  const [leads, setLeads] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchLeadsAssignmentData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/leads-assignment', {
        params: {
          search: searchQuery.trim() || undefined,
          state: selectedState !== 'All States' ? selectedState : undefined,
          role: selectedRole !== 'All Roles' ? selectedRole : undefined,
          assignee: selectedAssignee !== 'All Assignees' ? selectedAssignee : undefined,
          date_preset: (dateRangePreset !== 'All Time' && dateRangePreset !== 'Custom Range') ? dateRangePreset : undefined,
          start_date: (dateRangePreset === 'Custom Range' && startDateTime) ? startDateTime : undefined,
          end_date: (dateRangePreset === 'Custom Range' && endDateTime) ? endDateTime : undefined,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data) {
        if (res.data.data.telechamps && res.data.data.telechamps.length > 0) {
          const uniqueMap = new Map();
          res.data.data.telechamps.forEach(tc => {
            const key = (tc.name || '').trim().toLowerCase();
            if (key && !uniqueMap.has(key)) {
              uniqueMap.set(key, { ...tc, name: tc.name.trim() });
            }
          });
          const cleanTcs = Array.from(uniqueMap.values());
          setLiveTelechamps(cleanTcs);
          if (!targetBulkAssignee && cleanTcs[0]) {
            setTargetBulkAssignee(cleanTcs[0].name);
          }
        }
        if (res.data.data.leads?.data) {
          const mapped = res.data.data.leads.data.map(u => ({
            id: u.id,
            name: u.name || 'Unnamed User',
            role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Driver',
            roleInitial: u.role ? u.role.charAt(0).toUpperCase() : 'D',
            tmid: u.unique_id || `TM26${u.id}`,
            regDate: u.created_at ? `REG: ${new Date(u.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'REG: Recent',
            assignee: u.telechamp_name || (u.assigned_to ? `Agent #${u.assigned_to}` : 'Unassigned'),
            location: u.state_name || 'All States',
            city: u.city || '--',
            phone: u.mobile || '--',
            email: u.email || `${(u.name || 'lead').toLowerCase().replace(/[^a-z0-9]/g, '')}@truckmitr.com`,
            subscription: u.subscription || 'Non-Subscribed',
            vehicleType: 'Commercial Fleet'
          }));
          setLeads(mapped);
          setTotalLeadsCount(res.data.data.leads.total ?? res.data.data.total_uncalled ?? 0);
          setApiTotalPages(res.data.data.leads.last_page ?? Math.max(1, Math.ceil((res.data.data.leads.total || 1) / itemsPerPage)));
        }
      }
    } catch (err) {
      console.error('Failed to load leads assignment data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeadsAssignmentData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedState, selectedRole, selectedAssignee, selectedSubscription, dateRangePreset, startDateTime, endDateTime, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    fetchLeadsAssignmentData();
    showToast('Uncalled leads base refreshed successfully!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('All States');
    setSelectedAssignee('All Assignees');
    setSelectedRole('All Roles');
    setSelectedSubscription('All Subscriptions');
    setDateRangePreset('This Month');
    const { start, end } = getPresetDates('This Month');
    setStartDateTime(start);
    setEndDateTime(end);
    setSelectedLeadIds([]);
    setAutoSelectCount('');
    setCurrentPage(1);
    showToast('Filters and selections have been reset.');
  };

  // Server-side filtered Leads
  const filteredLeads = leads;
  const totalPages = Math.max(apiTotalPages, 1);
  const paginatedLeads = leads;

  // Checkbox Selection
  const allCurrentSelected = paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id));

  const toggleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !paginatedLeads.some(l => l.id === id)));
    } else {
      const pageIds = paginatedLeads.map(l => l.id);
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Auto-Select by Number
  const handleAutoSelect = () => {
    const count = parseInt(autoSelectCount, 10);
    if (!count || count <= 0) {
      showToast('Please enter a valid positive number of leads to auto-select.');
      return;
    }
    const toSelect = filteredLeads.slice(0, count).map(l => l.id);
    setSelectedLeadIds(toSelect);
    showToast(`Auto-selected ${toSelect.length} uncalled lead(s).`);
  };

  // Bulk Assign Action via Real API
  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0) {
      showToast('No leads selected for assignment.');
      return;
    }

    const chosenTc = liveTelechamps.find(t => t.name === targetBulkAssignee) || liveTelechamps[0];
    const tcId = chosenTc ? chosenTc.id : 1;

    try {
      const res = await api.post('/admin/teleadmin/assign-lead', {
        lead_ids: selectedLeadIds,
        telechamp_id: tcId
      });

      const count = selectedLeadIds.length;
      setSelectedLeadIds([]);
      showToast(res.data?.message || `Successfully assigned ${count} lead(s) to ${targetBulkAssignee}!`);
      fetchLeadsAssignmentData();
    } catch (err) {
      showToast('Failed to assign leads on the server.');
    }
  };

  // Modal Reassign Action via Real API
  const handleSaveModalAssignee = async () => {
    if (!selectedLeadModal || !modalNewAssignee) return;
    const chosenTc = liveTelechamps.find(t => t.name === modalNewAssignee) || liveTelechamps[0];
    const tcId = chosenTc ? chosenTc.id : 1;

    try {
      await api.post('/admin/teleadmin/assign-lead', {
        lead_ids: [selectedLeadModal.id],
        telechamp_id: tcId
      });

      showToast(`Lead ${selectedLeadModal.name} reassigned to ${modalNewAssignee}.`);
      setSelectedLeadModal(null);
      fetchLeadsAssignmentData();
    } catch (err) {
      showToast('Failed to reassign lead on server.');
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEGIN: PageTitleBar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-indigo-950">Leads Assignment</h1>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>UNCALLED LEADS BASE</span>
            </div>
          </div>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={handleRefresh}
          title="Refresh Uncalled Leads"
          className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs hover:bg-indigo-700 transition-colors active:scale-95 cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {/* END: PageTitleBar */}

      {/* BEGIN: FilterCardContainer */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
        {/* Filter Header Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              FILTER
            </span>
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md">
              UNCALLED LEADS
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-md">
              {totalLeadsCount > 0 ? `${totalLeadsCount.toLocaleString()} LEADS` : '0 LEADS'}
            </span>
          </div>
        </div>

        {/* Filter Row 1: Search and Reset */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-11 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="Search by ID, Name or Mobile..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="lg:col-span-1">
            <button
              onClick={handleResetFilters}
              className="w-full h-full min-h-[42px] px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* Filter Row 2: Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* All States */}
          <div className="relative">
            <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-slate-300">
              <div className="flex items-center space-x-2 truncate w-full">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-4"
                >
                  <option>All States</option>
                  <option>West Bengal</option>
                  <option>Telangana</option>
                  <option>Maharashtra</option>
                  <option>Delhi</option>
                  <option>Uttar Pradesh</option>
                  <option>Rajasthan</option>
                  <option>Punjab</option>
                  <option>Gujarat</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* All Assignees */}
          <div className="relative">
            <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-slate-300">
              <div className="flex items-center space-x-2 truncate w-full">
                <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedAssignee}
                  onChange={(e) => { setSelectedAssignee(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-4"
                >
                  <option>All Assignees</option>
                  {telechamps.map((t, idx) => (
                    <option key={t.id || idx} value={t.name}>{t.label}</option>
                  ))}
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* All Roles */}
          <div className="relative">
            <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-slate-300">
              <div className="flex items-center space-x-2 truncate w-full">
                <IdCard className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-4"
                >
                  <option>All Roles</option>
                  <option>Driver</option>
                  <option>Transporter</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* All Subscriptions */}
          <div className="relative">
            <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-slate-300">
              <div className="flex items-center space-x-2 truncate w-full">
                <Ticket className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedSubscription}
                  onChange={(e) => { setSelectedSubscription(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-4"
                >
                  <option>All Subscriptions</option>
                  <option>Subscribed</option>
                  <option>Non-Subscribed</option>
                  <option>Trial</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
            </div>
          </div>
        </div>

        {/* Filter Row 3: Date Selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Preset Selector */}
          <div className="relative">
            <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-slate-300">
              <div className="flex items-center space-x-2 truncate w-full">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={dateRangePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-slate-700 font-medium focus:ring-0 focus:outline-none cursor-pointer pr-4"
                >
                  <option value="This Month">This Month</option>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Custom Range">Custom Range</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none shrink-0" />
            </div>
          </div>

          {/* Start Date Time Picker with Pop-up Calendar */}
          <div
            onClick={() => {
              try { startDateInputRef.current?.showPicker?.(); } catch (err) {}
            }}
            className="relative cursor-pointer group"
            title="Click to open calendar"
          >
            <div className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all cursor-pointer">
              <div className="flex items-center space-x-2 w-full">
                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                <input
                  ref={startDateInputRef}
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => {
                    setStartDateTime(e.target.value);
                    setDateRangePreset('Custom Range');
                    setCurrentPage(1);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    try { e.target.showPicker?.(); } catch (err) {}
                  }}
                  className="font-medium text-slate-700 text-xs bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-full cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try { startDateInputRef.current?.showPicker?.(); } catch (err) {}
                }}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 ml-1 p-0.5 hover:bg-slate-100 rounded cursor-pointer"
                title="Open Calendar"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* End Date Time Picker with Pop-up Calendar */}
          <div
            onClick={() => {
              try { endDateInputRef.current?.showPicker?.(); } catch (err) {}
            }}
            className="relative cursor-pointer group"
            title="Click to open calendar"
          >
            <div className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all cursor-pointer">
              <div className="flex items-center space-x-2 w-full">
                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                <input
                  ref={endDateInputRef}
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => {
                    setEndDateTime(e.target.value);
                    setDateRangePreset('Custom Range');
                    setCurrentPage(1);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    try { e.target.showPicker?.(); } catch (err) {}
                  }}
                  className="font-medium text-slate-700 text-xs bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-full cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try { endDateInputRef.current?.showPicker?.(); } catch (err) {}
                }}
                className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 ml-1 p-0.5 hover:bg-slate-100 rounded cursor-pointer"
                title="Open Calendar"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Select Control Bar & Bulk Assign Panel */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-600 tracking-wider">AUTO-SELECT:</span>
            <div className="flex items-center">
              <input
                value={autoSelectCount}
                onChange={(e) => setAutoSelectCount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAutoSelect()}
                className="w-48 px-3.5 py-1.5 bg-white border border-slate-200 rounded-l-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                placeholder="No. of leads (e.g. 5)"
                type="number"
                min="1"
              />
              <button
                onClick={handleAutoSelect}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-r-lg transition-colors cursor-pointer"
              >
                CHECK
              </button>
            </div>
          </div>

          {/* Bulk Assign Controls when leads are selected */}
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              <span className="text-xs font-bold text-indigo-900">
                {selectedLeadIds.length} Selected
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span>Assign to:</span>
                <select
                  value={targetBulkAssignee}
                  onChange={(e) => setTargetBulkAssignee(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {telechamps.map((champ, idx) => (
                    <option key={champ.id || idx} value={champ.name}>{champ.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleBulkAssign}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Assign
              </button>
              <button
                onClick={() => setSelectedLeadIds([])}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* END: FilterCardContainer */}

      {/* BEGIN: LeadsDataTableContainer */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={toggleSelectAllCurrent}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 font-bold">Lead Info</th>
              <th className="py-3.5 px-4 font-bold">Current Assignee</th>
              <th className="py-3.5 px-4 font-bold">Location</th>
              <th className="py-3.5 px-4 font-bold text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isRefreshing && paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <span className="font-semibold text-slate-700 text-sm">Loading uncalled leads...</span>
                    <span className="text-[11px] text-slate-400 font-medium">Fetching 20 entries per page from server</span>
                  </div>
                </td>
              </tr>
            ) : paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-7 h-7 text-slate-300" />
                    <span className="font-semibold text-slate-600">No leads found matching current filter criteria.</span>
                    <button
                      onClick={handleResetFilters}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/80'}`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Lead Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-start space-x-2">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-indigo-950 text-sm">{lead.name}</span>
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded text-white text-[10px] font-bold ${
                                lead.roleInitial === 'T' ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                              title={lead.role}
                            >
                              {lead.roleInitial}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-600 font-mono font-medium mt-0.5">{lead.tmid}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{lead.regDate}</div>
                        </div>
                      </div>
                    </td>

                    {/* Current Assignee */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                        {lead.assignee}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-medium text-xs">{lead.location}</div>
                      <div className="text-[10px] text-slate-400">{lead.city}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right pr-6">
                      <button
                        onClick={() => handleOpenLeadDetails(lead)}
                        title="View Lead Details & Call Logs"
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {filteredLeads.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                Showing <span className="font-semibold text-slate-800">{totalLeadsCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, totalLeadsCount)}
                </span> of <span className="font-semibold text-slate-800">{totalLeadsCount.toLocaleString()}</span> leads
              </div>
              <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                <span className="text-[11px] text-slate-400 font-medium">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const maxButtons = 5;
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }
                return pages.map((pageNo) => (
                  <button
                    key={pageNo}
                    onClick={() => setCurrentPage(pageNo)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                      currentPage === pageNo
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {pageNo}
                  </button>
                ));
              })()}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* END: LeadsDataTableContainer */}

      {/* BEGIN: LeadDetailsModal */}
      {selectedLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl tracking-tight shadow-xs">
                  {(selectedLeadModal.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-800 tracking-tight uppercase">
                      {selectedLeadModal.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black tracking-wider uppercase rounded">
                      {selectedLeadModal.role}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider font-mono mt-0.5 uppercase">
                    REGISTRATION • {selectedLeadModal.tmid}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <XCircle className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column (col-span-5) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Card 1: Primary Details */}
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono">
                        Primary Details
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-400" /> User ID
                        </span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {selectedLeadModal.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" /> Mobile
                        </span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {selectedLeadModal.phone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <Mail className="w-3 h-3 text-slate-400" /> Email
                        </span>
                        <span className="font-extrabold text-slate-800 uppercase truncate text-right text-[11px]">
                          {selectedLeadModal.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> State
                        </span>
                        <span className="font-extrabold text-slate-800 uppercase">
                          {selectedLeadModal.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" /> Reg. Date
                        </span>
                        <span className="font-extrabold text-slate-800 uppercase text-[11px]">
                          {selectedLeadModal.regDate?.replace(/^REG:\s*/i, '')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Engagement */}
                  <div className="bg-white rounded-xl border border-indigo-100 shadow-2xs overflow-hidden">
                    <div className="px-4 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest font-mono">
                        Engagement
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Calls
                        </span>
                        <span className="font-black text-indigo-700 bg-indigo-50/60 border border-indigo-100 px-2.5 py-0.5 rounded text-xs">
                          {modalCallHistory.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Status
                        </span>
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider border ${
                          modalCallHistory.length === 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {modalCallHistory.length === 0 ? 'Fresh' : (modalCallHistory[0]?.call_status?.replace(/_/g, ' ') || 'Called')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Current Assignee
                        </span>
                        <span className="font-bold text-slate-700 text-xs">
                          {selectedLeadModal.assignee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reassignment Dropdown Option */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 font-mono">
                      Quick Reassign Telecaller
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={modalNewAssignee}
                        onChange={(e) => setModalNewAssignee(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {telechamps.map((champ, idx) => (
                          <option key={champ.id || idx} value={champ.name}>{champ.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveModalAssignee}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer shrink-0"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (col-span-7) */}
                <div className="lg:col-span-7">
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden h-full flex flex-col">
                    <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono">
                          Call Activity Log
                        </span>
                      </div>
                      {modalCallHistory.length > 0 && (
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                          {modalCallHistory.length} Recorded
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto max-h-[55vh]">
                      {isModalHistoryLoading ? (
                        <div className="h-44 flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fetching call activity...</span>
                        </div>
                      ) : modalCallHistory.length === 0 ? (
                        <div className="h-44 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50/40">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            NO DETAILED CALL LOGS FOUND
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {modalCallHistory.map((call, idx) => (
                            <div
                              key={call.id || idx}
                              className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col gap-2.5 shadow-2xs"
                            >
                              {/* Call Header */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg shrink-0 ${
                                    call.call_status === 'connected' || call.call_status === 'ANSWER'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    <Phone className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-extrabold text-slate-900 uppercase block leading-none">
                                      {call.call_status?.replace(/_/g, ' ') || 'CALL LOG'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 tracking-wider font-mono mt-0.5 block">
                                      {call.call_start_time || call.created_at} • {call.call_type || 'IVR'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-0.5">
                                    Duration
                                  </span>
                                  <span className="text-[11px] font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                                    {call.call_duration || '--'}
                                  </span>
                                </div>
                              </div>

                              {/* Telecaller & Details Bar */}
                              <div className="flex items-center justify-between text-[11px] bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-500 font-bold text-[10px] uppercase">
                                  Assigned Telecaller:
                                </span>
                                <span className="font-extrabold text-indigo-700">
                                  {call.assigned_name || 'Telecaller'}
                                </span>
                              </div>

                              {/* Feedback & Remarks */}
                              {(call.call_feedback || call.call_remarks) && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                                  {call.call_feedback && (
                                    <div>
                                      <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider block">Feedback:</span>
                                      <p className="text-slate-700 font-semibold">{call.call_feedback}</p>
                                    </div>
                                  )}
                                  {call.call_remarks && (
                                    <div>
                                      <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider block">Remarks:</span>
                                      <p className="text-slate-700 font-medium">{call.call_remarks}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Call Recording Audio Player */}
                              {(call.call_recording || call.recording_url) ? (
                                <div className="mt-1 pt-2 border-t border-slate-200/80 bg-white p-2.5 rounded-lg border border-slate-200">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                                      <Volume2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                      {call.call_type === 'manual' ? 'Manual Call Recording' : 'Call Recording'}
                                    </span>
                                    <a
                                      href={call.call_recording || call.recording_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline"
                                      title="Open Audio File"
                                    >
                                      <Download className="w-3 h-3" />
                                      Listen / Download
                                    </a>
                                  </div>
                                  <audio
                                    controls
                                    preload="metadata"
                                    className="w-full h-8 rounded cursor-pointer"
                                    src={call.call_recording || call.recording_url}
                                  >
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic bg-white px-2.5 py-1 rounded border border-slate-100">
                                  No audio recording available for this call attempt
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex justify-end items-center">
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="px-6 py-2.5 bg-[#4338ca] hover:bg-[#3730a3] active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: LeadDetailsModal */}
    </div>
  );
}
