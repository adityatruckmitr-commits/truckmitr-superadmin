import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import {
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react-teleadmin';

const Subscriptions = () => {
  const [filters, setFilters] = useState({
    telecaller_id: '',
    start_date: '',
    end_date: '',
    payment_status: 'captured'
  });

  const [telecallers, setTelecallers] = useState([]);

  // Fetch telecallers for filter dropdown
  useEffect(() => {
    fetch(`${API_BASE_URL}/admin_telecallers_management.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTelecallers(data.data.telecallers || []);
        }
      })
      .catch(err => console.error('Error fetching telecallers:', err));
  }, []);

  // Fetch subscriptions data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.telecaller_id) params.append('telecaller_id', filters.telecaller_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);

      const response = await fetch(`${API_BASE_URL}/admin_subscriptions.php?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    if (!data?.data?.subscriptions) return;
    
    const csv = [
      ['Call ID', 'Telecaller', 'Driver Name', 'Driver Phone', 'Call Time', 'Payment Time', 'Minutes After Call', 'Amount', 'Payment ID', 'Status', 'Subscription Days'].join(','),
      ...data.data.subscriptions.map(sub => [
        sub.call_id,
        sub.telecaller_name || `ID: ${sub.telecaller_id}`,
        sub.driver_name || 'N/A',
        sub.driver_phone || 'N/A',
        sub.call_time,
        sub.payment_start_time,
        sub.minutes_after_call || 'N/A',
        sub.amount,
        sub.payment_id,
        sub.payment_status,
        sub.subscription_days || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'captured':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading subscriptions: {error.message}</p>
        </div>
      </div>
    );
  }

  const summary = data?.data?.summary || {};
  const subscriptions = data?.data?.subscriptions || [];
  const performance = data?.data?.telecaller_performance || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">Track subscriptions made by telecallers</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!subscriptions.length}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.total_subscriptions || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.total_revenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Subscription</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.avg_subscription_value)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Telecallers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.total_telecallers || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telecaller
            </label>
            <select
              value={filters.telecaller_id}
              onChange={(e) => handleFilterChange('telecaller_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Telecallers</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={filters.payment_status}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="captured">Captured</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Telecaller Performance */}
      {performance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Telecaller Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Telecaller</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Subscriptions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Value</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((perf, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{perf.telecaller_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{perf.subscriptions_count}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(perf.total_revenue)}</td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900">{formatCurrency(perf.avg_subscription_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All Subscriptions ({subscriptions.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No subscriptions found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Telecaller</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Driver</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Call Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Payment Time</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Time Gap</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.call_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{sub.telecaller_name || `ID: ${sub.telecaller_id}`}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{sub.driver_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{sub.driver_phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sub.call_time).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sub.payment_start_time).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-sm">
                        {sub.minutes_after_call} min
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(sub.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(sub.payment_status)}
                        <span className="text-xs capitalize">{sub.payment_status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">{sub.payment_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;