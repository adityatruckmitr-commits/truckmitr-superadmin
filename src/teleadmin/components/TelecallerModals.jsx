import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { X, AlertCircle, CheckCircle, Loader, Search } from 'lucide-react-teleadmin';

// Add Telecaller Modal
export const AddTelecallerModal = ({ onClose, onSuccess, toast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    tc_for: 'welcome-call'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=create`, formData);
      toast?.success('Telecaller added successfully! They will automatically receive leads.');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add telecaller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Add Telecaller</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
            <input
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={formData.tc_for}
              onChange={(e) => setFormData({...formData, tc_for: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="welcome-call">Welcome Call</option>
              <option value="match-making">Match Making</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Adding...' : 'Add Telecaller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Telecaller Modal
export const EditTelecallerModal = ({ telecaller, onClose, onSuccess, toast }) => {
  const [formData, setFormData] = useState({
    id: telecaller.id,
    name: telecaller.name,
    email: telecaller.email,
    mobile: telecaller.mobile,
    tc_for: telecaller.tc_for || 'welcome-call',
    status: telecaller.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=update`, formData);
      toast?.success('Telecaller updated successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update telecaller');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Edit Telecaller</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
            <input
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={formData.tc_for}
              onChange={(e) => setFormData({...formData, tc_for: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="welcome-call">Welcome Call</option>
              <option value="match-making">Match Making</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Leads Modal (Enhanced with Filters)
export const ViewLeadsModal = ({ telecaller, onClose }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['telecaller-leads', telecaller.id],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=view_leads&telecaller_id=${telecaller.id}&limit=500`);
      return response.data;
    },
  });

  const allLeads = leadsData?.data || [];

  // Filter leads based on time filter
  const filteredLeads = allLeads.filter(lead => {
    // Search filter
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobile?.includes(searchQuery) ||
      lead.unique_id?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Time filter
    if (!lead.Created_at) return true;
    
    const leadDate = new Date(lead.Created_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(timeFilter) {
      case 'today':
        return leadDate >= today;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        return leadDate >= yesterday && leadDate < yesterdayEnd;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return leadDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return leadDate >= monthAgo;
      case 'custom':
        if (!dateFrom || !dateTo) return true;
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return leadDate >= fromDate && leadDate <= toDate;
      case 'all':
      default:
        return true;
    }
  });

  const leads = filteredLeads;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{telecaller.name}'s Leads</h3>
              <p className="text-gray-600">Showing {leads.length} of {allLeads.length} leads</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, mobile, or TMID..."
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Time Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    if (e.target.value !== 'custom') {
                      setDateFrom('');
                      setDateTo('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {timeFilter === 'custom' && (
                <>
                  <div>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="From Date"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="To Date"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {(timeFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setTimeFilter('all');
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : leads.length > 0 ? (
            <div className="space-y-2">
              {leads.map(lead => (
                <div key={lead.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mobile</p>
                      <p className="font-medium text-gray-900">{lead.mobile}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">TMID</p>
                      <p className="font-medium text-gray-900">{lead.unique_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded-sm ${
                        lead.is_called ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {lead.is_called ? 'Called' : 'Uncalled'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Calls</p>
                      <p className="font-medium text-gray-900">{lead.call_count || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No leads assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Assign Leads Modal (Enhanced with Advanced Filters)
export const AssignLeadsModal = ({ telecallers, selectedLeads, onClose, onSuccess, toast }) => {
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedTelecaller) {
      toast?.error('Please select a telecaller');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=assign_multiple`, {
        lead_ids: selectedLeads,
        telecaller_id: parseInt(selectedTelecaller)
      });
      toast?.success(`Successfully assigned ${selectedLeads.length} leads!`);
      onSuccess();
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Failed to assign leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Assign Leads</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">
              <strong>{selectedLeads.length}</strong> leads selected
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Telecaller *</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.total_leads} leads)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transfer Leads Modal
export const TransferLeadsModal = ({ telecallers, onClose, onSuccess, toast }) => {
  const [fromTelecaller, setFromTelecaller] = useState('');
  const [toTelecaller, setToTelecaller] = useState('');
  const [filter, setFilter] = useState('all');
  const [count, setCount] = useState(50);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTransfer = async () => {
    if (!fromTelecaller || !toTelecaller) {
      toast?.error('Please select both telecallers');
      return;
    }

    if (fromTelecaller === toTelecaller) {
      toast?.error('Cannot transfer to the same telecaller');
      return;
    }

    setShowConfirm(true);
  };

  const confirmTransfer = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=transfer_leads`, {
        from_telecaller_id: parseInt(fromTelecaller),
        to_telecaller_id: parseInt(toTelecaller),
        filter: filter,
        count: filter === 'count' ? parseInt(count) : 0,
        date_from: filter === 'custom' ? dateFrom : '',
        date_to: filter === 'custom' ? dateTo : '',
        lead_ids: []
      });
      toast?.success('Leads transferred successfully!');
      onSuccess();
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Failed to transfer leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Transfer Leads</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Telecaller *</label>
            <select
              value={fromTelecaller}
              onChange={(e) => setFromTelecaller(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.total_leads} leads)
                </option>
              ))}
            </select>
          </div>

          <div className="text-center py-2">
            <div className="inline-block p-2 bg-gray-100 rounded-full">
              ↓
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Telecaller *</label>
            <select
              value={toTelecaller}
              onChange={(e) => setToTelecaller(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.total_leads} leads)
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Leads</option>
              <option value="today">Today's Leads</option>
              <option value="yesterday">Yesterday's Leads</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="count">Specific Number</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {filter === 'count' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Leads</label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter number of leads"
              />
            </div>
          )}

          {filter === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-800">
              💡 {filter === 'all' ? 'All leads will be transferred' :
                  filter === 'count' ? `${count} oldest leads will be transferred` :
                  filter === 'custom' ? 'Leads in selected date range will be transferred' :
                  `${filter === 'today' ? "Today's" : filter === 'yesterday' ? "Yesterday's" : filter === 'week' ? "Last 7 days'" : "Last 30 days'"} leads will be transferred`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Transferring...' : 'Transfer All'}
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Confirm Transfer</h4>
              <p className="text-gray-600 mb-4">
                Are you sure you want to transfer {filter === 'all' ? 'ALL' : 
                filter === 'count' ? `${count}` :
                filter === 'custom' ? `leads from ${dateFrom} to ${dateTo}` :
                `${filter}'s`} leads?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransfer}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Bulk Assign Modal
export const BulkAssignModal = ({ telecallers, onClose, onSuccess, toast }) => {
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [filter, setFilter] = useState('count');
  const [count, setCount] = useState(50);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkAssign = async () => {
    if (!selectedTelecaller) {
      toast?.error('Please select a telecaller');
      return;
    }

    if (filter === 'count' && count <= 0) {
      toast?.error('Please enter a valid count');
      return;
    }

    if (filter === 'custom' && (!dateFrom || !dateTo)) {
      toast?.error('Please select both from and to dates');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=bulk_assign`, {
        telecaller_id: parseInt(selectedTelecaller),
        count: filter === 'count' ? parseInt(count) : 999999,
        time_filter: filter === 'count' ? 'all' : filter,
        date_from: filter === 'custom' ? dateFrom : '',
        date_to: filter === 'custom' ? dateTo : '',
        source: 'unassigned'
      });
      
      const message = filter === 'count' 
        ? `Successfully assigned ${count} leads!`
        : filter === 'custom'
        ? `Successfully assigned leads from ${dateFrom} to ${dateTo}!`
        : `Successfully assigned ${filter === 'today' ? "today's" : filter === 'yesterday' ? "yesterday's" : filter === 'week' ? "last 7 days'" : "last 30 days'"} leads!`;
      
      toast?.success(message);
      onSuccess();
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Failed to bulk assign leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Bulk Assign Leads</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Telecaller *</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.total_leads} leads)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="count">Specific Number</option>
              <option value="today">Today's Leads</option>
              <option value="yesterday">Yesterday's Leads</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {filter === 'count' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Leads *</label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter number of leads"
              />
            </div>
          )}

          {filter === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">
              💡 {filter === 'count' ? `This will assign ${count} oldest unassigned leads` :
                  filter === 'custom' ? `This will assign leads created from ${dateFrom || '...'} to ${dateTo || '...'}` :
                  `This will assign ${filter === 'today' ? "today's" : filter === 'yesterday' ? "yesterday's" : filter === 'week' ? "last 7 days'" : "last 30 days'"} unassigned leads`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkAssign}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Bulk Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revoke Leads Modal (Enhanced with Advanced Filters)
export const RevokeLeadsModal = ({ telecallers, onClose, onSuccess, toast }) => {
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Filter options
  const [filter, setFilter] = useState('manual');
  const [count, setCount] = useState(50);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['telecaller-leads-revoke', selectedTelecaller],
    queryFn: async () => {
      if (!selectedTelecaller) return { data: [] };
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=view_leads&telecaller_id=${selectedTelecaller}&limit=500`);
      return response.data;
    },
    enabled: !!selectedTelecaller
  });

  const handleRevoke = async () => {
    if (filter === 'manual' && selectedLeads.length === 0) {
      toast?.error('Please select leads to revoke');
      return;
    }

    if (filter === 'count' && count <= 0) {
      toast?.error('Please enter a valid count');
      return;
    }

    if (filter === 'custom' && (!dateFrom || !dateTo)) {
      toast?.error('Please select both from and to dates');
      return;
    }

    setShowConfirm(true);
  };

  const confirmRevoke = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=revoke_leads`, {
        lead_ids: filter === 'manual' ? selectedLeads : [],
        telecaller_id: parseInt(selectedTelecaller),
        filter: filter,
        count: filter === 'count' ? parseInt(count) : 0,
        date_from: filter === 'custom' ? dateFrom : '',
        date_to: filter === 'custom' ? dateTo : ''
      });
      
      const message = filter === 'manual' 
        ? `${selectedLeads.length} leads revoked successfully!`
        : filter === 'all'
        ? 'All leads revoked successfully!'
        : filter === 'count'
        ? `${count} leads revoked successfully!`
        : filter === 'custom'
        ? `Leads from ${dateFrom} to ${dateTo} revoked successfully!`
        : `${filter === 'today' ? "Today's" : filter === 'yesterday' ? "Yesterday's" : filter === 'week' ? "Last 7 days'" : "Last 30 days'"} leads revoked successfully!`;
      
      toast?.success(message);
      onSuccess();
    } catch (error) {
      toast?.error(error.response?.data?.message || 'Failed to revoke leads');
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleAll = () => {
    if (selectedLeads.length === leadsData?.data?.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leadsData?.data?.map(lead => lead.id) || []);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Revoke Leads</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Telecaller *</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => {
                setSelectedTelecaller(e.target.value);
                setSelectedLeads([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.total_leads} leads)
                </option>
              ))}
            </select>
          </div>

          {selectedTelecaller && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Revoke Filter</label>
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setSelectedLeads([]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="manual">Select Manually</option>
                  <option value="all">All Leads</option>
                  <option value="today">Today's Leads</option>
                  <option value="yesterday">Yesterday's Leads</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="count">Specific Number</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {filter === 'count' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Leads</label>
                  <input
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter number of leads to revoke"
                  />
                </div>
              )}

              {filter === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {filter === 'manual' && (
                <div className="border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                  {leadsLoading ? (
                    <div className="text-center py-8">
                      <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    </div>
                  ) : leadsData?.data?.length > 0 ? (
                    <>
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLeads.length === leadsData.data.length}
                            onChange={toggleAll}
                            className="w-4 h-4 text-indigo-600 rounded-sm"
                          />
                          <span className="font-medium text-gray-700">Select All ({leadsData.data.length})</span>
                        </label>
                      </div>
                      <div className="space-y-2">
                        {leadsData.data.map(lead => (
                          <label key={lead.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLead(lead.id)}
                              className="w-4 h-4 text-indigo-600 rounded-sm"
                            />
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{lead.name}</p>
                                <p className="text-xs text-gray-500">{lead.mobile}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">TMID</p>
                                <p className="text-sm text-gray-700">{lead.unique_id || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Created</p>
                                <p className="text-sm text-gray-700">{new Date(lead.Created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No leads found</p>
                  )}
                </div>
              )}

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ {filter === 'manual' ? `${selectedLeads.length} leads selected` :
                      filter === 'all' ? 'ALL leads will be revoked' :
                      filter === 'count' ? `${count} oldest leads will be revoked` :
                      filter === 'custom' ? `Leads from ${dateFrom || '...'} to ${dateTo || '...'} will be revoked` :
                      `${filter === 'today' ? "Today's" : filter === 'yesterday' ? "Yesterday's" : filter === 'week' ? "Last 7 days'" : "Last 30 days'"} leads will be revoked`}. They will become unassigned.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRevoke}
              disabled={loading || !selectedTelecaller || (filter === 'manual' && selectedLeads.length === 0)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Revoking...' : filter === 'manual' ? `Revoke ${selectedLeads.length} Leads` : 'Revoke Leads'}
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Confirm Revoke</h4>
              <p className="text-gray-600 mb-4">
                {filter === 'manual' ? `Revoke ${selectedLeads.length} selected leads?` :
                 filter === 'all' ? 'Revoke ALL leads?' :
                 filter === 'count' ? `Revoke ${count} oldest leads?` :
                 filter === 'custom' ? `Revoke leads from ${dateFrom} to ${dateTo}?` :
                 `Revoke ${filter === 'today' ? "today's" : filter === 'yesterday' ? "yesterday's" : filter === 'week' ? "last 7 days'" : "last 30 days'"} leads?`}
                <br /><br />
                They will become unassigned.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRevoke}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
