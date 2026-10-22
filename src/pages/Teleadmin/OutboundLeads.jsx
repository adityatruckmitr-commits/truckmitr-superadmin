import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  TrendingUp,
  RotateCw,
  Calendar,
  Plus,
  UserPlus,
  Users,
  PhoneCall,
  CheckCircle2,
  Clock,
  UserCheck,
  BarChart3,
  Search,
  Filter,
  UserGroup,
  Globe,
  Phone,
  ShieldCheck,
  ChevronDown,
  X,
  Eye,
  Check,
  Mail,
  MapPin,
  FileText,
  User,
  Sparkles,
  PhoneOutgoing,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function OutboundLeads() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedCallStatus, setSelectedCallStatus] = useState('');
  const [selectedRegStatus, setSelectedRegStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // UI Interactive State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const itemsPerPage = 8;

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'WhatsApp',
    team: 'Sonam',
    city: '',
    state: 'Madhya Pradesh',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchOutboundLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/outbound-leads', {
        params: {
          search: searchQuery.trim(),
          team: selectedTeam,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data?.leads?.data) {
        const mapped = res.data.data.leads.data.map(u => ({
          id: u.id,
          name: u.name || 'Unnamed',
          leadId: u.unique_id || `OB${u.id}`,
          date: u.created_at ? new Date(u.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '12 Oct 2026',
          phone: u.mobile || '--',
          email: u.email || `${(u.name || 'lead').toLowerCase().replace(/[^a-z0-9]/g, '')}@truckmitr.com`,
          team: u.telechamp_name || 'Sonam',
          source: 'WhatsApp',
          callStatus: 'Connected',
          regStatus: 'Registered',
          calls: 1,
          location: u.city ? `${u.city}, ${u.state_name || ''}` : (u.state_name || 'India'),
          notes: `${u.role ? u.role.toUpperCase() : 'LEAD'} verification inquiry`
        }));
        setLeads(mapped);
        setTotalLeadsCount(res.data.data.leads.total);
        setApiTotalPages(res.data.data.leads.last_page);
      }
    } catch (err) {
      console.error('Failed to load outbound leads:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOutboundLeads();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTeam, currentPage]);

  const handleRefresh = () => {
    fetchOutboundLeads();
    showToast('Outbound leads and live telemetry data refreshed!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTeam('');
    setSelectedSource('');
    setSelectedCallStatus('');
    setSelectedRegStatus('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    showToast('All filters have been reset.');
  };

  // Telechamps List
  const telechamps = ['Kamini', 'Sonam', 'Pratima', 'Aditya Kumar', 'Chandarbhan'];
  const sources = ['WhatsApp', 'Facebook', 'Toll Free', 'OBD', 'Direct Campaign', 'Web Registration'];

  // Performance Telechamp Breakdown Data
  const [telechampPerformance, setTelechampPerformance] = useState([
    {
      id: 1,
      name: 'Kamini',
      assigned: 15,
      attempted: 12,
      connected: 8,
      callback: 2,
      notConnected: 2,
      registered: 3,
      remaining: 3
    },
    {
      id: 2,
      name: 'Sonam',
      assigned: 20,
      attempted: 18,
      connected: 11,
      callback: 3,
      notConnected: 4,
      registered: 5,
      remaining: 2
    },
    {
      id: 3,
      name: 'Pratima',
      assigned: 14,
      attempted: 10,
      connected: 6,
      callback: 1,
      notConnected: 3,
      registered: 2,
      remaining: 4
    },
    {
      id: 4,
      name: 'Aditya Kumar',
      assigned: 12,
      attempted: 11,
      connected: 7,
      callback: 2,
      notConnected: 2,
      registered: 4,
      remaining: 1
    }
  ]);

  // Outbound Leads Dataset
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: 'Vikramaditya Rao',
      leadId: 'OB2610MP001',
      date: '12-10-2026, 12:45 PM',
      phone: '9826012345',
      email: 'vikram.rao@gmail.com',
      team: 'Sonam',
      source: 'WhatsApp',
      callStatus: 'Connected',
      regStatus: 'Registered',
      calls: 2,
      location: 'Indore, Madhya Pradesh',
      notes: 'Interested in Transporter monthly fleet subscription'
    },
    {
      id: 2,
      name: 'Sunil Gurjar',
      leadId: 'OB2610RJ002',
      date: '12-10-2026, 11:30 AM',
      phone: '9414088921',
      email: 'sunil.gurjar.rj@gmail.com',
      team: 'Kamini',
      source: 'Facebook',
      callStatus: 'Connected',
      regStatus: 'In Progress',
      calls: 1,
      location: 'Jaipur, Rajasthan',
      notes: 'Driver job seeker for long haul routes'
    },
    {
      id: 3,
      name: 'Balaji Freight Movers',
      leadId: 'OB2610MH003',
      date: '12-10-2026, 10:15 AM',
      phone: '9822019944',
      email: 'contact@balajifreight.in',
      team: 'Aditya Kumar',
      source: 'Toll Free',
      callStatus: 'Callback',
      regStatus: 'Unregistered',
      calls: 2,
      location: 'Nagpur, Maharashtra',
      notes: 'Inquired about driver hiring requirements'
    },
    {
      id: 4,
      name: 'Devendra Pandey',
      leadId: 'OB2610UP004',
      date: '12-10-2026, 09:50 AM',
      phone: '9450012233',
      email: 'devendra.pandey@gmail.com',
      team: 'Pratima',
      source: 'OBD',
      callStatus: 'Not Connected',
      regStatus: 'Unregistered',
      calls: 1,
      location: 'Varanasi, Uttar Pradesh',
      notes: 'IVR response key pressed 1 for driver inquiry'
    },
    {
      id: 5,
      name: 'Hardeep Logistics',
      leadId: 'OB2610PB005',
      date: '12-10-2026, 09:20 AM',
      phone: '9876019922',
      email: 'hardeep.logistics@rediffmail.com',
      team: 'Sonam',
      source: 'WhatsApp',
      callStatus: 'Connected',
      regStatus: 'Registered',
      calls: 3,
      location: 'Ludhiana, Punjab',
      notes: 'Registered via direct WhatsApp link'
    },
    {
      id: 6,
      name: 'Nilesh Choksi',
      leadId: 'OB2610GJ006',
      date: '12-10-2026, 08:45 AM',
      phone: '9898011245',
      email: 'nilesh.choksi.gj@gmail.com',
      team: 'Kamini',
      source: 'Facebook',
      callStatus: 'Pending',
      regStatus: 'Unregistered',
      calls: 0,
      location: 'Ahmedabad, Gujarat',
      notes: 'Lead captured from Facebook Lead Gen ad'
    }
  ]);

  // Dynamic Metric Calculations
  const metrics = useMemo(() => {
    const totalAssigned = leads.length;
    const totalAttempted = leads.filter(l => l.calls > 0).length;
    const totalConnected = leads.filter(l => l.callStatus === 'Connected').length;
    const pending = leads.filter(l => l.callStatus === 'Pending' || l.calls === 0).length;
    const totalRegistered = leads.filter(l => l.regStatus === 'Registered').length;
    return {
      totalAssigned,
      totalAttempted,
      totalConnected,
      pending,
      totalRegistered
    };
  }, [leads]);

  // Filtering Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesPhone = lead.phone.includes(q);
        const matchesLeadId = lead.leadId.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesLeadId) {
          return false;
        }
      }

      if (selectedTeam && lead.team !== selectedTeam) {
        return false;
      }

      if (selectedSource && lead.source !== selectedSource) {
        return false;
      }

      if (selectedCallStatus && lead.callStatus !== selectedCallStatus) {
        return false;
      }

      if (selectedRegStatus && lead.regStatus !== selectedRegStatus) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedTeam, selectedSource, selectedCallStatus, selectedRegStatus]);

  // Pagination
  const totalPages = apiTotalPages > 1 ? apiTotalPages : (Math.ceil(filteredLeads.length / itemsPerPage) || 1);
  const paginatedLeads = filteredLeads;

  // Source Badge Color Helper
  const getSourceBadge = (source) => {
    switch (source) {
      case 'WhatsApp':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Facebook':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Toll Free':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OBD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Badge Helper
  const getCallStatusBadge = (status) => {
    switch (status) {
      case 'Connected':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected</span>;
      case 'Not Connected':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Not Connected</span>;
      case 'Callback':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Callback</span>;
      case 'Pending':
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Pending</span>;
    }
  };

  // Handle Add Lead
  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!newLeadForm.name.trim() || !newLeadForm.phone.trim()) {
      showToast('Please provide both Lead Name and Mobile Number.');
      return;
    }

    const newLead = {
      id: Date.now(),
      name: newLeadForm.name.trim(),
      leadId: `OB2610${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      phone: newLeadForm.phone.trim(),
      email: newLeadForm.email.trim() || `${newLeadForm.name.toLowerCase().replace(/\s+/g, '')}@lead.com`,
      team: newLeadForm.team,
      source: newLeadForm.source,
      callStatus: 'Pending',
      regStatus: 'Unregistered',
      calls: 0,
      location: `${newLeadForm.city || 'HQ'}, ${newLeadForm.state}`,
      notes: newLeadForm.notes || 'Added manually via Command Center'
    };

    setLeads([newLead, ...leads]);
    setIsAddLeadModalOpen(false);
    setNewLeadForm({
      name: '',
      phone: '',
      email: '',
      source: 'WhatsApp',
      team: 'Sonam',
      city: '',
      state: 'Madhya Pradesh',
      notes: ''
    });
    showToast(`Lead ${newLead.name} created and assigned to ${newLead.team}!`);
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

      {/* Page Title & Primary Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            Outbound Leads
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE PERFORMANCE TRACKING • 2026-10-12</span>
          </p>
        </div>

        {/* Date Picker & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Date Display Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <span>12-10-2026</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh Outbound Leads"
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-xs transition-colors flex items-center justify-center w-8 h-8 cursor-pointer active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Lead Quick Modal Button */}
          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Quick Lead Entry"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Lead</span>
          </button>

          {/* Full Add Lead & Import Page Button */}
          <Link
            to="/teleadmin/assign-leads"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
            title="Assign Leads & Bulk Import Page"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add New Lead</span>
          </Link>
        </div>
      </div>

      {/* BEGIN: MetricCardsGrid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric Card 1: Total Assigned */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-600"></div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Assigned</div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{metrics.totalAssigned}</div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric Card 2: Total Attempted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Attempted</div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{metrics.totalAttempted}</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric Card 3: Total Connected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Connected</div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{metrics.totalConnected}</div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric Card 4: Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pending</div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{metrics.pending}</div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric Card 5: Total Registered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Registered</div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800">{metrics.totalRegistered}</div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
      {/* END: MetricCardsGrid */}

      {/* BEGIN: PerformanceBreakdownSection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" data-purpose="performance-breakdown">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Performance Breakdown
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {telechampPerformance.length} TELECHAMPS
          </span>
        </div>

        {/* Table view for performance breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50/80">
                <th className="py-3 px-4 font-semibold">Telecaller</th>
                <th className="py-3 px-4 font-semibold text-center">Assigned</th>
                <th className="py-3 px-4 font-semibold text-center">Attempted</th>
                <th className="py-3 px-4 font-semibold text-center text-emerald-600">Connected</th>
                <th className="py-3 px-4 font-semibold text-center text-amber-600">Callback</th>
                <th className="py-3 px-4 font-semibold text-center text-rose-600">Not Connected</th>
                <th className="py-3 px-4 font-semibold text-center text-indigo-600">Registered</th>
                <th className="py-3 px-4 font-semibold text-center">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {telechampPerformance.map((champ) => (
                <tr key={champ.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{champ.name}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600">{champ.assigned}</td>
                  <td className="py-3 px-4 text-center">{champ.attempted}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{champ.connected}</td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-600">{champ.callback}</td>
                  <td className="py-3 px-4 text-center font-semibold text-rose-600">{champ.notConnected}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600">{champ.registered}</td>
                  <td className="py-3 px-4 text-center text-slate-500">{champ.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* END: PerformanceBreakdownSection */}

      {/* BEGIN: DetailedLeadsSection */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" data-purpose="detailed-leads-list">
        {/* Section Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            Detailed Leads List
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {filteredLeads.length} TOTAL
            </span>
          </h3>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Name or Mobile..."
                type="text"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action buttons: Reset & Refresh */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                RESET
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {/* Dropdowns Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Select Team Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Users className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedTeam}
                onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Select Team</option>
                {telechamps.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Select Source Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Globe className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedSource}
                onChange={(e) => { setSelectedSource(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Select Source</option>
                {sources.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Call Status Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedCallStatus}
                onChange={(e) => { setSelectedCallStatus(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Call Status</option>
                <option value="Pending">Pending</option>
                <option value="Connected">Connected</option>
                <option value="Not Connected">Not Connected</option>
                <option value="Callback">Callback</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reg Status Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedRegStatus}
                onChange={(e) => { setSelectedRegStatus(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">Reg Status</option>
                <option value="Registered">Registered</option>
                <option value="In Progress">In Progress</option>
                <option value="Unregistered">Unregistered</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date From Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              <input
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                placeholder="dd-mm-yyyy"
                type="text"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date To Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              <input
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                placeholder="dd-mm-yyyy"
                type="text"
              />
              <Calendar className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Leads Data Table */}
        <div className="overflow-x-auto min-h-[320px] flex flex-col justify-between">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4 font-semibold">Lead Info</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">Team / Source</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Calls</th>
                <th className="py-3 px-4 font-semibold text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td className="py-16 text-center" colSpan={6}>
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-xs font-bold text-slate-600 tracking-wide uppercase">
                        No Matching Leads Found
                      </div>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline mt-1 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Lead Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600 mt-0.5">{lead.leadId}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{lead.date}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{lead.phone}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{lead.email}</div>
                    </td>

                    {/* Team & Source */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {lead.team}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSourceBadge(lead.source)}`}>
                          {lead.source}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getCallStatusBadge(lead.callStatus)}</div>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          lead.regStatus === 'Registered'
                            ? 'bg-purple-100 text-purple-700'
                            : lead.regStatus === 'In Progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {lead.regStatus}
                        </span>
                      </div>
                    </td>

                    {/* Calls */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {lead.calls}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <button
                        onClick={() => setSelectedLeadModal(lead)}
                        title="View Lead Details"
                        className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {filteredLeads.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
              <div>
                Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
                </span> of <span className="font-semibold text-slate-800">{filteredLeads.length}</span> leads
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                      currentPage === idx + 1
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
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
      </div>
      {/* END: DetailedLeadsSection */}

      {/* BEGIN: AddLeadModal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add New Outbound Lead</h3>
                  <span className="text-[10px] text-slate-400">Create and assign lead to telecaller</span>
                </div>
              </div>
              <button
                onClick={() => setIsAddLeadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="e.g. Anand Transport"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="e.g. 9826011223"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {sources.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign to Telecaller</label>
                  <select
                    value={newLeadForm.team}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, team: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {telechamps.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    placeholder="e.g. Indore"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newLeadForm.state}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, state: e.target.value })}
                    placeholder="e.g. Madhya Pradesh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Campaign Info</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  placeholder="Additional context about lead..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* END: AddLeadModal */}

      {/* BEGIN: LeadDetailsModal */}
      {selectedLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedLeadModal.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedLeadModal.leadId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Header */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CALL STATUS</span>
                  <div className="mt-0.5">{getCallStatusBadge(selectedLeadModal.callStatus)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REGISTRATION</span>
                  <span className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded mt-0.5 ${
                    selectedLeadModal.regStatus === 'Registered'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedLeadModal.regStatus}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Mobile
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.phone}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Email
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{selectedLeadModal.email}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Location
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedLeadModal.location}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400" /> Source
                  </div>
                  <div className="font-bold text-indigo-700 mt-0.5">{selectedLeadModal.source}</div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 col-span-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" /> Notes
                  </div>
                  <div className="text-slate-800 mt-0.5">{selectedLeadModal.notes}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    showToast(`Calling ${selectedLeadModal.name} (${selectedLeadModal.phone}) via Cloud IVR...`);
                    setSelectedLeadModal(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Now via Cloud Telephony</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: LeadDetailsModal */}
    </div>
  );
}
