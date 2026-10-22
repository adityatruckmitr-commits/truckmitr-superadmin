import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const CallbackRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    app_type: '',
    assigned_to: ''
  });
  const [telecallers, setTelecallers] = useState([]);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchTelecallers();
    fetchStats();
    fetchRequests();
  }, [filters, pagination.offset]);

  const fetchTelecallers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin_callback_requests.php?action=stats`);
      if (response.data.success && response.data.stats.byTelecaller) {
        setTelecallers(response.data.stats.byTelecaller.filter(tc => tc.telecaller_name));
      }
    } catch (error) {
      console.error('Error fetching telecallers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin_callback_requests.php?action=stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'list',
        limit: pagination.limit,
        offset: pagination.offset,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await axios.get(`${API_BASE_URL}/admin_callback_requests.php?${params}`);
      if (response.data.success) {
        setRequests(response.data.data);
        setPagination(prev => ({ ...prev, total: response.data.total }));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (direction) => {
    setPagination(prev => ({
      ...prev,
      offset: direction === 'next' 
        ? prev.offset + prev.limit 
        : Math.max(0, prev.offset - prev.limit)
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Contacted': 'bg-blue-100 text-blue-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Callback': 'bg-purple-100 text-purple-800',
      'Interested': 'bg-emerald-100 text-emerald-800',
      'Not Interested': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Callback Requests</h1>
          <p className="text-gray-600 mt-1">Manage and track all callback requests from drivers and transporters</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Requests</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Today</div>
              <div className="text-3xl font-bold text-blue-600">{stats.today}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Last 7 Days</div>
              <div className="text-3xl font-bold text-green-600">{stats.last7Days}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Contacted">Contacted</option>
                <option value="Resolved">Resolved</option>
                <option value="Callback">Callback</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Type</label>
              <select
                value={filters.app_type}
                onChange={(e) => handleFilterChange('app_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="driver">Driver</option>
                <option value="transporter">Transporter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telecaller</label>
              <select
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Telecallers</option>
                {telecallers.map((tc) => (
                  <option key={tc.assigned_to} value={tc.assigned_to}>
                    {tc.telecaller_name} ({tc.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <button
                onClick={() => {
                  setFilters({ status: '', app_type: '', assigned_to: '' });
                  setPagination(prev => ({ ...prev, offset: 0 }));
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No callback requests found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {request.callback_user_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{request.callback_user_name}</div>
                              <div className="text-sm text-gray-500">{request.unique_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.mobile_number}</div>
                          {request.user_email && (
                            <div className="text-sm text-gray-500">{request.user_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.app_type === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {request.app_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{request.contact_reason}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.assigned_telecaller_name || 'Unassigned'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.request_date_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange('prev')}
                    disabled={pagination.offset === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange('next')}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pagination.offset + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px">
                      <button
                        onClick={() => handlePageChange('prev')}
                        disabled={pagination.offset === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange('next')}
                        disabled={pagination.offset + pagination.limit >= pagination.total}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Callback Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Callback Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{selectedRequest.callback_user_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Mobile:</span>
                    <p className="font-medium">{selectedRequest.mobile_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Unique ID:</span>
                    <p className="font-medium">{selectedRequest.unique_id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">App Type:</span>
                    <p className="font-medium capitalize">{selectedRequest.app_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className="font-medium">{selectedRequest.status}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Request Date:</span>
                    <p className="font-medium">{formatDate(selectedRequest.request_date_time)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">Contact Reason:</span>
                    <p className="font-medium">{selectedRequest.contact_reason}</p>
                  </div>
                  {selectedRequest.notes && (
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">Notes:</span>
                      <p className="font-medium">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Details */}
              {selectedRequest.user_db_id && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Profile</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Full Name:</span>
                      <p className="font-medium">{selectedRequest.user_full_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-medium">{selectedRequest.user_email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <p className="font-medium">{selectedRequest.user_mobile}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">City:</span>
                      <p className="font-medium">{selectedRequest.user_city || 'N/A'}</p>
                    </div>
                    {selectedRequest.app_type === 'driver' && (
                      <>
                        <div>
                          <span className="text-sm text-gray-600">License Number:</span>
                          <p className="font-medium">{selectedRequest.License_Number || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Experience:</span>
                          <p className="font-medium">{selectedRequest.Driving_Experience ? `${selectedRequest.Driving_Experience} years` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">License Type:</span>
                          <p className="font-medium">{selectedRequest.Type_of_License || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Current Income:</span>
                          <p className="font-medium">{selectedRequest.Current_Monthly_Income || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Expected Income:</span>
                          <p className="font-medium">{selectedRequest.Expected_Monthly_Income || 'N/A'}</p>
                        </div>
                      </>
                    )}
                    {selectedRequest.app_type === 'transporter' && (
                      <>
                        <div>
                          <span className="text-sm text-gray-600">Transport Name:</span>
                          <p className="font-medium">{selectedRequest.Transport_Name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Fleet Size:</span>
                          <p className="font-medium">{selectedRequest.Fleet_Size || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Operational Segment:</span>
                          <p className="font-medium">{selectedRequest.Operational_Segment || 'N/A'}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <span className="text-sm text-gray-600">Registered:</span>
                      <p className="font-medium">{formatDate(selectedRequest.user_registered_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Telecaller Info */}
              {selectedRequest.assigned_telecaller_name && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Telecaller</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{selectedRequest.assigned_telecaller_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <p className="font-medium">{selectedRequest.assigned_telecaller_mobile}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallbackRequests;
