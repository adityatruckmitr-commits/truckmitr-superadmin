import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import AssignLeadsModal from '../components/AssignLeadsModal';
import {
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  Phone,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  PhoneCall,
  Database,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-teleadmin';

// Memoized stat card component
const StatCard = memo(({ title, value, icon: Icon, gradient }) => (
  <div className={`${gradient} rounded-xl p-6 text-white shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <Icon className="w-12 h-12 opacity-80" />
    </div>
  </div>
));

// Memoized lead row component
const LeadRow = memo(({ lead, isSelected, onSelect, onView, onCallClick, onJobsClick, onTrainingClick, getStatusColor, getStatusIcon, roleFilter }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    {/* Checkbox */}
    <td className="px-6 py-4">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(lead.id)}
        className="rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
      />
    </td>
    {/* Name */}
    <td className="px-6 py-4">
      <button
        onClick={() => onView(lead)}
        className="flex items-center hover:bg-gray-50 px-2 py-1 rounded-sm transition-colors w-full text-left"
      >
        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
          {lead.images ? (
            <img
              src={`https://truckmitr.com/public/${lead.images}`}
              alt={lead.name || 'User'}
              className="h-full w-full object-cover"
              onError={(e) => {
                console.log('Image failed to load:', `https://truckmitr.com/public/${lead.images}`);
                console.log('Original path:', lead.images);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', `https://truckmitr.com/public/${lead.images}`);
              }}
            />
          ) : null}
          <span
            className="text-indigo-600 font-semibold text-sm"
            style={{ display: lead.images ? 'none' : 'flex' }}
          >
            {lead.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="ml-4">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900">{lead.name}</div>
            {lead.role && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${lead.role === 'driver'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : lead.role === 'transporter'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                {lead.role === 'driver' ? 'Driver' : lead.role === 'transporter' ? 'Transporter' : lead.role}
              </span>
            )}
          </div>
          <div className="text-sm text-indigo-600 font-medium">{lead.tmid || 'N/A'}</div>
        </div>
      </button>
    </td>
    {/* Created At */}
    <td className="px-6 py-4">
      <div className="flex items-center text-sm text-gray-600">
        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
        <div>
          <div className="font-medium text-gray-900">
            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            {lead.created_at ? new Date(lead.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
          </div>
        </div>
      </div>
    </td>
    {/* Subscription */}
    <td className="px-6 py-4">
      <div className="text-xs">
        {lead.subscription_start || lead.subscription_end ? (
          <div>
            {lead.subscription_start && (
              <div className="text-gray-700 mb-1">
                <span className={lead.subscription_status === 'active' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>Start:</span> {new Date(lead.subscription_start).toLocaleDateString('en-IN')}
                <div className="text-gray-500 text-[10px]">
                  {new Date(lead.subscription_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            )}
            {/* {lead.subscription_end && (
              <div className={lead.subscription_status === 'active' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                <span className="font-semibold">End:</span> {new Date(lead.subscription_end).toLocaleDateString('en-IN')}
                <div className="text-[10px]">
                  {new Date(lead.subscription_end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            )} */}
            <div className="mt-1">
              {lead.subscription_status === 'active' ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm text-xs font-medium">Active</span>
              ) : lead.subscription_status === 'expired' ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-sm text-xs font-medium">Expired</span>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">No subscription</span>
        )}
      </div>
    </td>
    {/* State */}
    <td className="px-6 py-4">
      <div className="text-xs">
        {lead.states}
      </div>
    </td>
    {roleFilter === 'driver' && (
      <>
        <td className="px-6 py-4">
          <div className="text-center">
            <button
              onClick={() => onJobsClick({ leadId: lead.id, leadName: lead.name, type: 'applied' })}
              className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors cursor-pointer"
            >
              {lead.applied_jobs_count || 0}
            </button>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-xs">
            {lead.Type_of_License || '-'}
          </div>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => onTrainingClick(lead.id)}
            className="text-xs hover:bg-gray-50 px-2 py-1 rounded-sm transition-colors"
          >
            {lead.training_tier && lead.training_tier !== 'N/A' ? (
              <div className="flex flex-col items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${lead.training_tier === 'Diamond' ? 'bg-cyan-100 text-cyan-700' :
                  lead.training_tier === 'Platinum' ? 'bg-slate-100 text-slate-700' :
                    lead.training_tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                      lead.training_tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                        lead.training_tier === 'Bronze' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                  }`}>
                  {lead.training_tier}
                </span>
                {/* <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = Math.round((lead.training_percentage / 100) * 5);
                    return (
                      <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
                        ★
                      </span>
                    );
                  })}
                </div> */}
                <span className="text-gray-500 text-[10px]">{lead.training_percentage}%</span>
              </div>
            ) : (
              <span className="text-gray-400">Not Started</span>
            )}
          </button>
        </td>
      </>
    )}
    {roleFilter === 'transporter' && (
      <>
        <td className="px-6 py-4">
          <div className="text-center">
            <button
              onClick={() => onJobsClick({ leadId: lead.id, leadName: lead.name, type: 'posted' })}
              className="inline-flex items-center justify-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold hover:bg-purple-200 transition-colors cursor-pointer"
            >
              {lead.posted_jobs_count || 0}
            </button>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-xs">
            {lead.Fleet_Size || '-'}
          </div>
        </td>
      </>
    )}
    {/* <td className="px-6 py-4">
      <div className="flex items-center text-gray-900">
        <Phone className="w-4 h-4 mr-2 text-gray-400" />
        {lead.mobile}
      </div>
    </td> */}
    {/* <td className="px-6 py-4">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(lead.last_call_status || 'pending')}`}>
        {getStatusIcon(lead.last_call_status || 'pending')}
        {(lead.last_call_status || 'pending')?.replace('_', ' ').toUpperCase()}
      </span>
    </td> */}
    {/* Assigned To */}
    <td className="px-6 py-4">
      {!lead.assigned_telecaller ? (
        <span className="text-gray-400 italic">Unassigned</span>
      ) : (
        <div className="flex items-center">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
            <span className="text-green-600 font-semibold text-xs">
              {lead.assigned_telecaller?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-gray-900 font-medium">{lead.assigned_telecaller}</span>
        </div>
      )}
    </td>
    {/* Call Stats */}
    <td className="px-6 py-4">
      <button
        onClick={() => onCallClick(lead.id)}
        className="space-y-1 hover:bg-indigo-50 px-2 py-1 rounded-sm transition-colors"
      >
        <div className="flex items-center text-sm text-indigo-600 font-semibold">
          <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
          <span>{lead.total_calls || 0}</span>
          <span className="ml-1">total</span>
        </div>
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          <span className="font-medium">{lead.connected_calls || 0}</span>
          <span className="ml-1">connected</span>
        </div>
      </button>
    </td>

    {/* Last Contact */}
    {/* <td className="px-6 py-4">
      <div className="flex items-center text-sm text-gray-600">
        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
        {lead.last_call_time ? new Date(lead.last_call_time).toLocaleDateString() : 'Never'}
      </div>
    </td> */}
    {/* View */}
    {/* <td className="px-6 py-4">
      <button
        onClick={() => onView(lead)}
        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
      >
        <Eye className="w-4 h-4 mr-1.5" />
        View
      </button>
    </td> */}
  </tr>
));

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [jobsFilter, setJobsFilter] = useState('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [callDetailsModal, setCallDetailsModal] = useState(null);
  const [jobsModal, setJobsModal] = useState(null);
  const [trainingModal, setTrainingModal] = useState(null);
  const ITEMS_PER_PAGE = 100;

  // Fetch telecallers list
  const { data: telecallersResponse } = useQuery({
    queryKey: ['telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_leads_detailed_api.php?action=get_telecallers`);
      return response.data;
    },
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  const telecallers = telecallersResponse?.data || [];

  // Fetch leads data - using the detailed API
  const { data: leadsResponse, isLoading, error } = useQuery({
    queryKey: ['leads', assignedToFilter],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_leads_detailed_api.php?action=list&assigned_to=${assignedToFilter}&limit=999999`);
      return response.data;
    },
    staleTime: 10000, // Consider data fresh for 10 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });

  const leads = leadsResponse?.data || [];

  // Fetch call details when modal is opened
  const { data: callDetailsData } = useQuery({
    queryKey: ['call-details-leads', callDetailsModal],
    queryFn: async () => {
      if (!callDetailsModal) return null;
      const response = await axios.get(
        `${API_BASE_URL}/admin_leads_detailed_api.php?action=details&lead_id=${callDetailsModal}`
      );
      return response.data;
    },
    enabled: !!callDetailsModal,
  });

  // Fetch job details when jobs modal is opened
  const { data: jobsData } = useQuery({
    queryKey: ['jobs-details', jobsModal?.leadId],
    queryFn: async () => {
      if (!jobsModal?.leadId) return null;
      const response = await axios.get(
        `${API_BASE_URL}/admin_leads_detailed_api.php?action=jobs&lead_id=${jobsModal.leadId}`
      );
      return response.data;
    },
    enabled: !!jobsModal?.leadId,
  });

  // Fetch training details when training modal is opened
  const { data: trainingData } = useQuery({
    queryKey: ['training-details', trainingModal],
    queryFn: async () => {
      if (!trainingModal) return null;
      const response = await axios.get(
        `${API_BASE_URL}/admin_leads_detailed_api.php?action=details&lead_id=${trainingModal}`
      );
      return response.data;
    },
    enabled: !!trainingModal,
  });

  // Reassign mutation
  const reassignMutation = useMutation({
    mutationFn: async ({ leadIds, telecallerId }) => {
      await axios.post(`${API_BASE_URL}/admin_assign_leads_api.php`, {
        lead_ids: leadIds,
        telecaller_id: telecallerId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setSelectedLeads([]);
      setAssignModalOpen(false);
    },
  });

  // Memoized filtered leads
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Global search across multiple fields
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(search) ||
        lead.driver_name?.toLowerCase().includes(search) ||
        lead.phone?.includes(search) ||
        lead.mobile?.includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.tmid?.toLowerCase().includes(search) ||
        lead.city?.toLowerCase().includes(search) ||
        lead.vehicle_number?.toLowerCase().includes(search) ||
        lead.id?.toString().includes(search)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(lead => lead.role === roleFilter);
    }

    // Filter by jobs
    if (jobsFilter === 'with_jobs') {
      filtered = filtered.filter(lead => {
        if (lead.role === 'driver') {
          return (lead.applied_jobs_count || 0) > 0;
        } else if (lead.role === 'transporter') {
          return (lead.posted_jobs_count || 0) > 0;
        }
        return false;
      });
    } else if (jobsFilter === 'without_jobs') {
      filtered = filtered.filter(lead => {
        if (lead.role === 'driver') {
          return (lead.applied_jobs_count || 0) === 0;
        } else if (lead.role === 'transporter') {
          return (lead.posted_jobs_count || 0) === 0;
        }
        return true;
      });
    }

    return filtered;
  }, [leads, searchTerm, roleFilter, jobsFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, ITEMS_PER_PAGE]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, assignedToFilter, roleFilter, jobsFilter]);

  // Memoized statistics
  const stats = useMemo(() => ({
    total: leads.length,
    fresh: leads.filter(l => l.status === 'fresh').length,
    interested: leads.filter(l => l.status === 'interested').length,
    callback: leads.filter(l => l.status === 'callback').length,
    assigned: leads.filter(l => l.assigned_to !== 'Unassigned').length,
  }), [leads]);

  // Memoized callbacks
  const handleSelectLead = useCallback((leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedLeads(prev =>
      prev.length === paginatedLeads.length && paginatedLeads.length > 0
        ? []
        : paginatedLeads.map(lead => lead.id)
    );
  }, [paginatedLeads]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(['leads']);
  }, [queryClient]);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['ID', 'Driver Name', 'Phone', 'Status', 'Assigned To', 'Total Calls', 'Connected Calls', 'Last Contact'],
      ...filteredLeads.map(lead => [
        lead.id,
        lead.driver_name,
        lead.phone,
        lead.status,
        lead.assigned_to,
        lead.total_calls,
        lead.connected_calls,
        lead.last_contact
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredLeads]);

  // Memoized helper functions
  const getStatusColor = useCallback((status) => {
    const colors = {
      'fresh': 'bg-blue-100 text-blue-700 border-blue-200',
      'interested': 'bg-green-100 text-green-700 border-green-200',
      'not_interested': 'bg-red-100 text-red-700 border-red-200',
      'callback': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'no_response': 'bg-gray-100 text-gray-700 border-gray-200',
      'pending': 'bg-purple-100 text-purple-700 border-purple-200',
      'connected': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      'fresh': <AlertCircle className="w-4 h-4" />,
      'interested': <CheckCircle className="w-4 h-4" />,
      'not_interested': <XCircle className="w-4 h-4" />,
      'callback': <Clock className="w-4 h-4" />,
      'no_response': <Phone className="w-4 h-4" />,
      'connected': <PhoneCall className="w-4 h-4" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 text-center mb-2">Error Loading Leads</h3>
          <p className="text-red-700 text-center">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Leads Management
          </h1>
          <p className="text-gray-600 mt-1">Manage, track, and assign leads to telecallers</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            disabled={selectedLeads.length === 0}
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Assign ({selectedLeads.length})
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.total}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Interested"
          value={stats.interested}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Callbacks"
          value={stats.callback}
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <StatCard
          title="Fresh Leads"
          value={stats.fresh}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative flex">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, email, TMID, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full !pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="all">All Telecallers</option>
              {telecallers.map((telecaller) => (
                <option key={telecaller.id} value={telecaller.id}>
                  {telecaller.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="all">All User Types</option>
              <option value="driver">Drivers Only</option>
              <option value="transporter">Transporters Only</option>
            </select>
          </div>

          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={jobsFilter}
              onChange={(e) => setJobsFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
            >
              <option value="all">All Jobs Status</option>
              <option value="with_jobs">With Jobs (Applied/Posted &gt; 0)</option>
              <option value="without_jobs">Without Jobs (Applied/Posted = 0)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <span className="font-semibold text-gray-900">{filteredLeads.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{leads.length}</span> leads
          </span>
          {selectedLeads.length > 0 && (
            <span className="text-indigo-600 font-medium">
              {selectedLeads.length} lead(s) selected
            </span>
          )}
        </div>
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-xs p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria' : 'No leads available at the moment'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Users Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    State
                  </th>
                  {roleFilter === 'driver' && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Applied Jobs
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        License Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Training
                      </th>
                    </>
                  )}
                  {roleFilter === 'transporter' && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Posted Jobs
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fleet Size
                      </th>
                    </>
                  )}

                  {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th> */}
                  {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th> */}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Call History
                  </th>

                  {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Contact
                  </th> */}
                  {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLeads.includes(lead.id)}
                    onSelect={handleSelectLead}
                    onView={setSelectedLead}
                    onCallClick={setCallDetailsModal}
                    onJobsClick={setJobsModal}
                    onTrainingClick={setTrainingModal}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    roleFilter={roleFilter}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredLeads.length > 0 && (
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{filteredLeads.length}</span> leads
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      Page <span className="font-bold text-indigo-600">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Leads Modal */}
      {assignModalOpen && (
        <AssignLeadsModal
          leadIds={selectedLeads}
          onClose={() => setAssignModalOpen(false)}
          onAssign={(telecallerId) => {
            reassignMutation.mutate({ leadIds: selectedLeads, telecallerId });
          }}
        />
      )}

      {/* Lead Detail Modal - User Profile Only */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedLead.images ? (
                    <img
                      src={`https://truckmitr.com/public/${selectedLead.images}`}
                      alt={selectedLead.name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-indigo-600 font-bold text-3xl">
                      {selectedLead.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h3>
                    {selectedLead.role && (
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${selectedLead.role === 'driver'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                        {selectedLead.role === 'driver' ? 'Driver' : 'Transporter'}
                      </span>
                    )}
                  </div>
                  <p className="text-indigo-600 font-medium">{selectedLead.tmid}</p>
                  <p className="text-gray-500 text-sm">ID: {selectedLead.id}</p>
                </div>
              </div>

              {/* Complete User Details from users table */}
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Name:</span><span className="ml-2 font-semibold">{selectedLead.name || '-'}</span></div>
                    <div><span className="text-gray-600">Mobile:</span><span className="ml-2 font-semibold">{selectedLead.mobile || '-'}</span></div>
                    <div><span className="text-gray-600">Email:</span><span className="ml-2 font-semibold">{selectedLead.email || '-'}</span></div>
                    <div><span className="text-gray-600">TMID:</span><span className="ml-2 font-semibold text-indigo-600">{selectedLead.tmid || '-'}</span></div>
                    <div><span className="text-gray-600">Role:</span><span className="ml-2 font-semibold">{selectedLead.role || '-'}</span></div>
                    <div><span className="text-gray-600">Gender:</span><span className="ml-2 font-semibold">{selectedLead.gender || '-'}</span></div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Location Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">City:</span><span className="ml-2 font-semibold">{selectedLead.city || '-'}</span></div>
                    <div><span className="text-gray-600">State:</span><span className="ml-2 font-semibold">{selectedLead.states || '-'}</span></div>
                    <div className="col-span-2"><span className="text-gray-600">Address:</span><span className="ml-2 font-semibold">{selectedLead.address || '-'}</span></div>
                    <div><span className="text-gray-600">Pincode:</span><span className="ml-2 font-semibold">{selectedLead.pincode || '-'}</span></div>
                    {/* <div><span className="text-gray-600">Preferred Location:</span><span className="ml-2 font-semibold">{selectedLead.Preferred_Location || '-'}</span></div> */}
                  </div>
                </div>

                {/* Driver Specific Information */}
                {selectedLead.role === 'driver' && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Driver Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Father Name:</span><span className="ml-2 font-semibold">{selectedLead.Father_Name || '-'}</span></div>
                      <div><span className="text-gray-600">DOB:</span><span className="ml-2 font-semibold">{selectedLead.DOB || '-'}</span></div>
                      <div><span className="text-gray-600">Marital Status:</span><span className="ml-2 font-semibold">{selectedLead.Marital_Status || '-'}</span></div>
                      <div><span className="text-gray-600">Education:</span><span className="ml-2 font-semibold">{selectedLead.Highest_Education || '-'}</span></div>
                      <div><span className="text-gray-600">License Type:</span><span className="ml-2 font-semibold">{selectedLead.Type_of_License || '-'}</span></div>
                      <div><span className="text-gray-600">License Number:</span><span className="ml-2 font-semibold">{selectedLead.License_Number || '-'}</span></div>
                      <div><span className="text-gray-600">Driving Experience:</span><span className="ml-2 font-semibold">{selectedLead.Driving_Experience || '-'} years</span></div>
                      {/* <div><span className="text-gray-600">Vehicle Type:</span><span className="ml-2 font-semibold">{selectedLead.vehicle_type || '-'}</span></div> */}
                      <div><span className="text-gray-600">Aadhar Number:</span><span className="ml-2 font-semibold">{selectedLead.Aadhar_Number || '-'}</span></div>
                      <div><span className="text-gray-600">PAN Number:</span><span className="ml-2 font-semibold">{selectedLead.PAN_Number || '-'}</span></div>
                      <div><span className="text-gray-600">Current Income:</span><span className="ml-2 font-semibold">{selectedLead.Current_Monthly_Income || '-'}</span></div>
                      <div><span className="text-gray-600">Expected Income:</span><span className="ml-2 font-semibold">{selectedLead.Expected_Monthly_Income || '-'}</span></div>
                    </div>
                  </div>
                )}

                {/* Transporter Specific Information */}
                {selectedLead.role === 'transporter' && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Transporter Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-600">Transport Name:</span><span className="ml-2 font-semibold">{selectedLead.Transport_Name || '-'}</span></div>
                      <div><span className="text-gray-600">Fleet Size:</span><span className="ml-2 font-semibold">{selectedLead.Fleet_Size || '-'}</span></div>
                      <div><span className="text-gray-600">Year of Establishment:</span><span className="ml-2 font-semibold">{selectedLead.Year_of_Establishment || '-'}</span></div>
                      <div><span className="text-gray-600">Registered ID:</span><span className="ml-2 font-semibold">{selectedLead.Registered_ID || '-'}</span></div>
                      <div><span className="text-gray-600">GST Number:</span><span className="ml-2 font-semibold">{selectedLead.GST_Number || '-'}</span></div>
                      <div><span className="text-gray-600">PAN Number:</span><span className="ml-2 font-semibold">{selectedLead.PAN_Number || '-'}</span></div>
                      <div><span className="text-gray-600">Operational Segment:</span><span className="ml-2 font-semibold">{selectedLead.Operational_Segment || '-'}</span></div>
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">System Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Assigned To:</span><span className="ml-2 font-semibold">{selectedLead.assigned_telecaller || 'Unassigned'}</span></div>
                    <div><span className="text-gray-600">Status:</span><span className="ml-2 font-semibold">{selectedLead.status == 1 ? 'Active' : '-'}</span></div>
                    <div><span className="text-gray-600">Registered:</span><span className="ml-2 font-semibold">{selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString('en-IN') : '-'}</span></div>
                    <div><span className="text-gray-600">Last Updated:</span><span className="ml-2 font-semibold">{selectedLead.Updated_at ? new Date(selectedLead.Updated_at).toLocaleString('en-IN') : '-'}</span></div>
                    {/* <div><span className="text-gray-600">Profile Completion:</span><span className="ml-2 font-semibold">{selectedLead.profile_completion || '0'}%</span></div> */}
                    <div><span className="text-gray-600">Verified:</span><span className="ml-2 font-semibold">{selectedLead.is_verified ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>

                {/* Subscription Information */}
                {selectedLead.subscription_status && selectedLead.subscription_status !== 'inactive' && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Subscription Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-sm text-xs font-semibold ${selectedLead.subscription_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {selectedLead.subscription_status}
                        </span>
                      </div>
                      {selectedLead.subscription_start && (
                        <div><span className="text-gray-600">Start Date:</span><span className="ml-2 font-semibold">{new Date(selectedLead.subscription_start).toLocaleDateString('en-IN')}</span></div>
                      )}
                      {selectedLead.subscription_end && (
                        <div><span className="text-gray-600">End Date:</span><span className="ml-2 font-semibold">{new Date(selectedLead.subscription_end).toLocaleDateString('en-IN')}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedLeads([selectedLead.id]);
                    setAssignModalOpen(true);
                    setSelectedLead(null);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Assign Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      {callDetailsModal && callDetailsData?.success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Call History Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {callDetailsData.lead?.name} ({callDetailsData.lead?.tmid}) - {callDetailsData.lead?.mobile}
                </p>
              </div>
              <button
                onClick={() => setCallDetailsModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                  <PhoneCall className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{callDetailsData.statistics.total_calls}</p>
                  <p className="text-xs text-gray-600">Total Calls</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600">{callDetailsData.statistics.connected}</p>
                  <p className="text-xs text-gray-600">Connected</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                  <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{callDetailsData.statistics.interested}</p>
                  <p className="text-xs text-gray-600">Interested</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{callDetailsData.statistics.not_interested}</p>
                  <p className="text-xs text-gray-600">Not Interested</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                  <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{callDetailsData.statistics.callbacks}</p>
                  <p className="text-xs text-gray-600">Callbacks</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-200">
                  <Play className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-indigo-600">{callDetailsData.statistics.recordings_count}</p>
                  <p className="text-xs text-gray-600">Recordings</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600">Call Logs</p>
                  <p className="text-lg font-bold text-gray-900">{callDetailsData.statistics.call_logs_count}</p>
                </div>
                {callDetailsData.statistics.transporter_calls_count > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600">Transporter Calls</p>
                    <p className="text-lg font-bold text-gray-900">{callDetailsData.statistics.transporter_calls_count}</p>
                  </div>
                )}
              </div>

              {/* Call History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call History ({callDetailsData.call_history.length})
                </h3>

                {callDetailsData.call_history.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No call history found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callDetailsData.call_history.map((call, index) => (
                      <div key={`${call.source}-${call.id}-${index}`} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Header Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(call.call_status)}`}>
                                {call.call_status?.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(call.call_time).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              {/* <span className={`px-2 py-1 text-xs rounded-sm flex items-center gap-1 font-medium ${
                                call.source === 'call_logs' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : call.source === 'call_logs_match_making'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                <Database className="w-3 h-3" />
                                {call.source === 'call_logs' ? 'Welcome Call' : call.source === 'call_logs_match_making' ? 'Match Making' : 'Job Brief'}
                              </span> */}
                            </div>

                            {/* Caller Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Caller:</span>
                                <span className="font-semibold text-gray-900">{call.caller_name || 'Unknown'}</span>
                                {call.caller_mobile && (
                                  <span className="text-gray-500">({call.caller_mobile})</span>
                                )}
                                {call.caller_specialization && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    {call.caller_specialization.replace(/-/g, ' ').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </span>
                                )}
                              </div>

                              {call.call_duration > 0 && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Duration:</span>
                                  <span className="font-semibold text-gray-900">
                                    {Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Driver/Transporter Info (for match making and transporter calls) */}
                            {(call.source === 'call_logs_match_making' || call.source === 'call_logs_transporter') && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm bg-purple-50 p-2 rounded-lg">
                                {call.driver_name && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Driver:</span>
                                    <span className="font-semibold text-gray-900">{call.driver_name}</span>
                                    {call.driver_mobile && (
                                      <span className="text-gray-500 text-xs">({call.driver_mobile})</span>
                                    )}
                                  </div>
                                )}
                                {call.transporter_name && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Transporter:</span>
                                    <span className="font-semibold text-gray-900">{call.transporter_name}</span>
                                    {call.transporter_mobile && (
                                      <span className="text-gray-500 text-xs">({call.transporter_mobile})</span>
                                    )}
                                  </div>
                                )}
                                {call.job_id && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Job ID:</span>
                                    <span className="font-semibold text-gray-900">{call.job_id}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Feedback */}
                            {call.feedback && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-semibold mb-1">Feedback:</p>
                                <p className="text-sm text-gray-800">{call.feedback}</p>
                              </div>
                            )}

                            {/* Notes/Remarks */}
                            {call.notes && (
                              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-600 font-semibold mb-1">Notes:</p>
                                <p className="text-sm text-gray-800">{call.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Recording Button */}
                          {call.recording_url && (
                            <a
                              href={call.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              <Play className="w-4 h-4" />
                              Play Recording
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Modal */}
      {jobsModal && jobsData?.success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {jobsModal.type === 'applied' ? 'Applied Jobs' : 'Posted Jobs'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {jobsModal.leadName} - {jobsData.jobs?.length || 0} {jobsModal.type === 'applied' ? 'applications' : 'jobs'}
                </p>
              </div>
              <button
                onClick={() => setJobsModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {jobsData.jobs?.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No {jobsModal.type === 'applied' ? 'Applications' : 'Jobs'} Found
                  </h3>
                  <p className="text-gray-600">
                    {jobsModal.type === 'applied'
                      ? 'This driver has not applied to any jobs yet.'
                      : 'This transporter has not posted any jobs yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobsData.jobs?.map((job, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Job Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{job.job_title || 'Untitled Job'}</h3>
                              <p className="text-sm text-gray-600 mt-1">Job ID: {job.job_code || job.job_id || 'N/A'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.job_status === 'active' || job.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : job.job_status === 'closed' || job.status === 'closed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}>
                              {(job.job_status || job.status || 'unknown').toUpperCase()}
                            </span>
                          </div>

                          {/* Job Description */}
                          {job.job_description && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-600 font-semibold mb-1">Job Description:</p>
                              <p className="text-sm text-gray-800">{job.job_description}</p>
                            </div>
                          )}

                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {jobsModal.type === 'applied' && job.transporter_name && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Transporter:</span>
                                <span className="font-semibold text-gray-900">{job.transporter_name}</span>
                              </div>
                            )}

                            {jobsModal.type === 'posted' && job.applications_count !== undefined && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Applications:</span>
                                <span className="font-semibold text-gray-900">{job.applications_count}</span>
                              </div>
                            )}

                            {job.vehicle_type && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Vehicle Type:</span>
                                <span className="font-semibold text-gray-900">{job.vehicle_type}</span>
                              </div>
                            )}

                            {job.required_experience && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Experience:</span>
                                <span className="font-semibold text-gray-900">{job.required_experience}</span>
                              </div>
                            )}

                            {job.active_inactive !== undefined && job.active_inactive !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${job.active_inactive === 1 || job.active_inactive === '1' || job.active_inactive === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                                  }`}>
                                  {job.active_inactive === 1 || job.active_inactive === '1' || job.active_inactive === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            )}

                            {job.applied_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Applied:</span>
                                <span className="font-semibold text-gray-900">
                                  {new Date(job.applied_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            )}

                            {job.created_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{job.applied_at ? 'Posted:' : 'Created:'}</span>
                                <span className="font-semibold text-gray-900">
                                  {new Date(job.created_at).toLocaleDateString('en-GB')}
                                </span>
                              </div>
                            )}

                            {job.transporter_tmid && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">TMID:</span>
                                <span className="font-semibold text-indigo-600">{job.transporter_tmid}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Info */}
                          {(job.salary_range || job.job_type) && (
                            <div className="flex items-center gap-4 text-sm pt-2 border-t border-gray-100">
                              {job.salary_range && (
                                <span className="text-gray-700">
                                  <span className="font-semibold">Salary:</span> {job.salary_range}
                                </span>
                              )}
                              {job.job_type && (
                                <span className="text-gray-700">
                                  <span className="font-semibold">Type:</span> {job.job_type}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {/* {trainingModal && trainingData?.success && trainingData.lead?.training_completion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Training Completion Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {trainingData.lead?.name} ({trainingData.lead?.tmid})
                </p>
              </div>
              <button
                onClick={() => setTrainingModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
          
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Training Status</h3>
                  <span className={`px-4 py-2 rounded-full font-bold text-sm ${trainingData.lead.training_completion.tier === 'Diamond' ? 'bg-cyan-100 text-cyan-700' :
                      trainingData.lead.training_completion.tier === 'Platinum' ? 'bg-slate-100 text-slate-700' :
                        trainingData.lead.training_completion.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          trainingData.lead.training_completion.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                            trainingData.lead.training_completion.tier === 'Bronze' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-500'
                    }`}>
                    {trainingData.lead.training_completion.tier} Tier
                  </span>
                </div>

        
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-4xl ${star <= trainingData.lead.training_completion.rating ? 'text-yellow-500' : 'text-gray-300'
                      }`}>
                      ★
                    </span>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600 mb-1">
                    {trainingData.lead.training_completion.ranking_percentage}%
                  </p>
                  <p className="text-sm text-gray-600">Training Completion Score</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">
                    {trainingData.lead.training_completion.total_questions}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total Questions</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {trainingData.lead.training_completion.correct_answers}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Correct Answers</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">
                    {trainingData.lead.training_completion.percentage}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Accuracy</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                  <p className="text-2xl font-bold text-amber-600">
                    {trainingData.lead.training_completion.rating}/5
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Rating</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Tier Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                      <span>Diamond</span>
                    </span>
                    <span className="text-gray-600">95% - 100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                      <span>Platinum</span>
                    </span>
                    <span className="text-gray-600">81% - 94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span>Gold</span>
                    </span>
                    <span className="text-gray-600">61% - 80%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                      <span>Silver</span>
                    </span>
                    <span className="text-gray-600">41% - 60%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      <span>Bronze</span>
                    </span>
                    <span className="text-gray-600">1% - 40%</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setTrainingModal(null)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
};

export default Leads;