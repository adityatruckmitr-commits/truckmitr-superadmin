import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import telecallersApi from '../../services/api/telecallersApi';
import PaymentSearchModal from './components/PaymentSearchModal';
import {
  IndianRupee,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Truck,
  BadgeIndianRupee,
  Calendar,
  Filter
} from 'lucide-react-teleadmin';

const PerformanceReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rangeFilter, setRangeFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Compute shouldFetch based on current state
  const shouldFetch = useMemo(() => {
    if (rangeFilter === 'custom') {
      // Only fetch if both dates are selected
      return fromDate !== '' && toDate !== '';
    }
    return true;
  }, [rangeFilter, fromDate, toDate]);

  // Fetch payment data
  const { data: response, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payments', rangeFilter, fromDate, toDate],
    queryFn: () => telecallersApi.getPayments(rangeFilter, fromDate, toDate),
    refetchInterval: 60000,
    enabled: shouldFetch, // Only fetch when conditions are met
  });

  // Process data
  const processedData = useMemo(() => {
    if (!response) return {
      totalAmount: 0,
      totalCount: 0,
      driversAmount: 0,
      driversCount: 0,
      transportersAmount: 0,
      transportersCount: 0,
      employeeList: [],
      range: 'today',
      fromDate: '',
      toDate: ''
    };

    // Calculate total amount from API response
    const totalAmount = parseFloat(response.total_amount || 0);

    // Deduplicate payments by payment_id and filter out null users
    const uniquePayments = [];
    const seenPaymentIds = new Set();

    (response.payments || []).forEach(payment => {
      // Skip if payment_id already seen (duplicate) or user is null
      if (!payment.payment_id || seenPaymentIds.has(payment.payment_id) || !payment.user) {
        return;
      }
      seenPaymentIds.add(payment.payment_id);
      uniquePayments.push(payment);
    });

    // Calculate drivers amount and count (filter by role "driver")
    let driversAmount = 0;
    let driversCount = 0;
    uniquePayments.forEach(payment => {
      if (payment.user?.role === 'driver') {
        driversAmount += parseFloat(payment.amount || 0);
        driversCount++;
      }
    });

    // Calculate transporters amount and count (filter by role "transporter")
    let transportersAmount = 0;
    let transportersCount = 0;
    uniquePayments.forEach(payment => {
      if (payment.user?.role === 'transporter') {
        transportersAmount += parseFloat(payment.amount || 0);
        transportersCount++;
      }
    });

    // Create employee map to merge data from three arrays
    const employeeMap = new Map();

    // Add today's data from by_assigned_to
    (response.by_assigned_to || []).forEach(emp => {
      employeeMap.set(emp.assigned_to, {
        assigned_to: emp.assigned_to,
        admin_id: emp.admin_id,
        name: emp.full_name || emp.admin_name || `Employee ${emp.assigned_to}`,
        emp_id: emp.emp_id,
        department: emp.department === 'welcome-call' ? 'Welcome' : emp.department === 'match-making' ? 'Match-making' : emp.department,
        email: emp.email,
        photo_path: emp.photo_path,
        todayAmount: parseFloat(emp.total_amount || 0),
        todayCount: emp.payment_count || 0,
        mtdAmount: 0,
        mtdCount: 0,
        overallAmount: 0,
        overallCount: 0
      });
    });

    // Add MTD data from mtd_by_assigned_to
    (response.mtd_by_assigned_to || []).forEach(emp => {
      if (employeeMap.has(emp.assigned_to)) {
        const existing = employeeMap.get(emp.assigned_to);
        existing.mtdAmount = parseFloat(emp.mtd_total_amount || 0);
        existing.mtdCount = emp.mtd_payment_count || 0;
      } else {
        // Employee has MTD data but no today data
        employeeMap.set(emp.assigned_to, {
          assigned_to: emp.assigned_to,
          admin_id: emp.admin_id,
          name: emp.full_name || emp.admin_name || `Employee ${emp.assigned_to}`,
          emp_id: emp.emp_id,
          department: emp.department === 'welcome-call' ? 'Welcome' : emp.department === 'match-making' ? 'Match-making' : emp.department,
          email: emp.email,
          photo_path: emp.photo_path,
          todayAmount: 0,
          todayCount: 0,
          mtdAmount: parseFloat(emp.mtd_total_amount || 0),
          mtdCount: emp.mtd_payment_count || 0,
          overallAmount: 0,
          overallCount: 0
        });
      }
    });

    // Add overall data from overall_by_assigned_to
    (response.overall_by_assigned_to || []).forEach(emp => {
      if (employeeMap.has(emp.assigned_to)) {
        const existing = employeeMap.get(emp.assigned_to);
        existing.overallAmount = parseFloat(emp.overall_total_amount || 0);
        existing.overallCount = emp.overall_payment_count || 0;
      } else {
        // Employee has overall data but no today/MTD data
        employeeMap.set(emp.assigned_to, {
          assigned_to: emp.assigned_to,
          admin_id: emp.admin_id,
          name: emp.full_name || emp.admin_name || `Employee ${emp.assigned_to}`,
          emp_id: emp.emp_id,
          department: emp.department === 'welcome-call' ? 'Welcome' : emp.department === 'match-making' ? 'Match-making' : emp.department,
          email: emp.email,
          photo_path: emp.photo_path,
          todayAmount: 0,
          todayCount: 0,
          mtdAmount: 0,
          mtdCount: 0,
          overallAmount: parseFloat(emp.overall_total_amount || 0),
          overallCount: emp.overall_payment_count || 0
        });
      }
    });

    // Convert map to array and sort by today amount first (desc), then overall amount (desc)
    const employeeList = Array.from(employeeMap.values())
      .sort((a, b) => {
        // First sort by today amount (descending)
        if (b.todayAmount !== a.todayAmount) {
          return b.todayAmount - a.todayAmount;
        }
        // If today amounts are equal (including both 0), sort by overall amount (descending)
        return b.overallAmount - a.overallAmount;
      });

    return {
      totalAmount,
      totalCount: uniquePayments.length,
      driversAmount,
      driversCount,
      transportersAmount,
      transportersCount,
      employeeList,
      range: response.range,
      fromDate: response.from,
      toDate: response.to
    };
  }, [response]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return processedData.employeeList.filter(emp => {
      const matchesSearch = searchTerm === '' ||
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [processedData.employeeList, searchTerm]);
  console.log(filteredEmployees)
  // Get range display text for header
  const getHeaderText = () => {
    switch (processedData.range) {
      case 'today':
        return "Today's Subscriptions";
      case 'yesterday':
        return "Yesterday's Subscriptions";
      case 'this_week':
        return "This Week's Subscriptions";
      case 'this_month':
        return "This Month's Subscriptions";
      case 'custom':
        return `Subscriptions (${processedData.fromDate} to ${processedData.toDate})`;
      default:
        return "Subscriptions";
    }
  };

  // Get range display text for filter info
  const getRangeDisplayText = () => {
    switch (processedData.range) {
      case 'today':
        return "Today's Data";
      case 'yesterday':
        return "Yesterday's Data";
      case 'this_week':
        return "This Week's Data";
      case 'this_month':
        return "This Month's Data";
      case 'custom':
        return `${processedData.fromDate} to ${processedData.toDate}`;
      default:
        return "Data";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 text-center mb-2">Error Loading Data</h3>
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
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{getHeaderText()}</h1>
            {/* <p className="text-purple-100 text-lg">
              Payment Performance Report
            </p> */}
          </div>
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium"
            >
              <Search className="w-5 h-5" />
              Search Payment
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Amount</p>
              <p className="text-3xl font-bold mt-1">₹{(processedData.driversAmount + processedData.transportersAmount).toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-1">{processedData.totalCount} subscription{processedData.totalCount !== 1 ? 's' : ''}</p>
            </div>
            <BadgeIndianRupee className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Drivers Amount</p>
              <p className="text-3xl font-bold mt-1">₹{processedData.driversAmount.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-1">{processedData.driversCount} subscription{processedData.driversCount !== 1 ? 's' : ''}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Transporters Amount</p>
              <p className="text-3xl font-bold mt-1">₹{processedData.transportersAmount.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-1">{processedData.transportersCount} subscription{processedData.transportersCount !== 1 ? 's' : ''}</p>
            </div>
            <Truck className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full !pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Range Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={rangeFilter}
              onChange={(e) => {
                setRangeFilter(e.target.value);
                // Reset dates when changing from custom
                if (e.target.value !== 'custom') {
                  setFromDate('');
                  setToDate('');
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Placeholder for alignment when not custom */}
          {rangeFilter !== 'custom' && <div></div>}
        </div>

        {/* Custom Date Range - Full row */}
        {rangeFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full !pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="From Date"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full !pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="To Date"
              />
            </div>
          </div>
        )}

        {rangeFilter === 'custom' && (!fromDate || !toDate) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please select both from and to dates to view data.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{processedData.employeeList.length}</span> telechamps
          </div>
          <div className="text-gray-600">
            <span className="font-semibold text-purple-600">{getRangeDisplayText()}</span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-xs p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payments data...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Telechamp Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria' : rangeFilter === 'custom' && (!fromDate || !toDate) ? 'Please select date range' : 'No employee data available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Telechamp Info
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Current Subscription
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    MTD Subscription
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Overall Subscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => (
                  <tr key={emp.assigned_to} className={index < filteredEmployees.length - 1 ? 'border-b border-gray-200' : ''}>
                    {/* Employee Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-semibold text-base">
                            {emp.name?.charAt(0).toUpperCase() || 'E'}
                          </span>
                        </div>

                        <div className="ml-4">
                          <div className="font-medium text-gray-900 text-base">
                            {emp.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {emp.emp_id}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${emp.department === 'Match-making'
                              ? 'bg-purple-100 text-purple-700'
                              : emp.department === 'Welcome'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {emp.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Current Subscription */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-blue-600 text-lg">
                          ₹{emp.todayAmount.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mt-1">
                          {emp.todayCount} subscription{emp.todayCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    {/* MTD Subscription */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-purple-600 text-lg">
                          ₹{emp.mtdAmount.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 mt-1">
                          {emp.mtdCount} subscription{emp.mtdCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    {/* Overall Subscription */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold text-green-600 text-lg">
                          ₹{emp.overallAmount.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 mt-1">
                          {emp.overallCount} subscription{emp.overallCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Search Modal */}
      {showSearchModal && (
        <PaymentSearchModal onClose={() => setShowSearchModal(false)} />
      )}
    </div>
  );
};

export default PerformanceReport;
