import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import telecallersApi from '../../services/api/telecallersApi';
import { ArrowRightLeft, Calendar, User, Users, UserCheck, Truck, Search, X, History } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';
import MoveLeadsHistoryModal from '../../components/MoveLeadsHistoryModal';

const MoveLeads = () => {
    const todayDate = new Date().toISOString().split('T')[0];

    // State Management
    const [roleFilter, setRoleFilter] = useState('');
    const [useDateRange, setUseDateRange] = useState(false);
    const [dateType, setDateType] = useState('date'); // 'date' or 'range'
    const [selectedDate, setSelectedDate] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [subscriptionFilter, setSubscriptionFilter] = useState('');
    const [moveLimit, setMoveLimit] = useState('');
    const [fromAssignee, setFromAssignee] = useState('');
    const [callStatusFilter, setCallStatusFilter] = useState('');
    const [callPeriodStart, setCallPeriodStart] = useState('');
    const [callPeriodEnd, setCallPeriodEnd] = useState('');
    const [toAssignee, setToAssignee] = useState('');
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(50);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Fetch employees list
    const { data: employeesResponse = [], isLoading: isLoadingEmployees } = useQuery({
        queryKey: ['telecallers-list'],
        queryFn: () => telecallersApi.getAgentRevenue(todayDate),
    });

    const employees = Array.isArray(employeesResponse) 
        ? employeesResponse 
        : (employeesResponse?.data?.telecaller_summary || []);

    // Build query params for API
    const buildQueryParams = () => {
        const params = {
            per_page: perPage,
            page: currentPage,
        };
        
        if (roleFilter) params.role = roleFilter;
        if (subscriptionFilter) params.subscription = subscriptionFilter;
        if (fromAssignee) params.assigned_to = fromAssignee;
        if (callStatusFilter) params.call_status = callStatusFilter;
        if (searchQuery) params.search = searchQuery;
        
        if (useDateRange && dateType === 'date' && selectedDate) {
            params.date = selectedDate;
        } else if (useDateRange && dateType === 'range' && fromDate && toDate) {
            params.from_date = fromDate;
            params.to_date = toDate;
        }
        
        if (callPeriodStart && callPeriodEnd) {
            params.call_start = callPeriodStart;
            params.call_end = callPeriodEnd;
        }
        
        return params;
    };

    // Fetch leads with filters
    const { data: leadsResponse, isLoading: isLoadingLeads, refetch } = useQuery({
        queryKey: ['leads-list', buildQueryParams()],
        queryFn: () => telecallersApi.getLeadsCountSummary(buildQueryParams()),
        keepPreviousData: true,
    });

    const counts = leadsResponse?.counts || {
        total_leads: 0,
        assigned_leads: 0,
        assigned_to_counts: {},
        role_counts: { driver: 0, transporter: 0 },
        subscription_counts: { subscribed: 0, not_subscribed: 0 },
        call_status_counts: {},
    };

    const leads = leadsResponse?.leads || [];
    const pagination = leadsResponse?.pagination || { current_page: 1, last_page: 1, total: 0 };

    // Handle lead selection (also used for row click)
    const toggleLeadSelection = (leadId) => {
        if (moveLimit && parseInt(moveLimit) > 0) return; // Disable if limit is set
        
        const newSelection = new Set(selectedLeads);
        if (newSelection.has(leadId)) {
            newSelection.delete(leadId);
        } else {
            newSelection.add(leadId);
        }
        setSelectedLeads(newSelection);
    };

    const toggleSelectAll = () => {
        if (moveLimit && parseInt(moveLimit) > 0) return; // Disable if limit is set
        
        if (selectedLeads.size === leads.length && leads.length > 0) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(leads.map(lead => lead.id)));
        }
    };

    // Move leads mutation
    const moveLeadsMutation = useMutation({
        mutationFn: (payload) => telecallersApi.moveLeads(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Leads moved successfully');
            setSelectedLeads(new Set());
            setMoveLimit('');
            refetch();
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || 'Failed to move leads';
            toast.error(msg);
        }
    });

    const handleMoveLeads = () => {
        if (!fromAssignee || !toAssignee) {
            toast.error('Please select both source and target assignees');
            return;
        }

        if (fromAssignee === toAssignee) {
            toast.error('Source and target assignees cannot be the same');
            return;
        }

        const limit = parseInt(moveLimit) || 0;
        
        if (limit > 0) {
            // Use limit-based move with all filters
            const payload = {
                from: fromAssignee,
                to: toAssignee,
                limit: limit,
            };
            
            // Add filters to payload
            if (roleFilter) payload.role = roleFilter;
            if (subscriptionFilter) payload.subscription = subscriptionFilter;
            if (callStatusFilter) payload.call_status = callStatusFilter;
            
            if (useDateRange && dateType === 'date' && selectedDate) {
                payload.date = selectedDate;
            } else if (useDateRange && dateType === 'range' && fromDate && toDate) {
                payload.from_date = fromDate;
                payload.to_date = toDate;
            }
            
            if (callPeriodStart && callPeriodEnd) {
                payload.call_start = callPeriodStart;
                payload.call_end = callPeriodEnd;
            }
            
            moveLeadsMutation.mutate(payload);
        } else {
            // Use selected leads (user_ids)
            if (selectedLeads.size === 0) {
                toast.error('Please select at least one lead to move');
                return;
            }
            
            const payload = {
                from: fromAssignee,
                to: toAssignee,
                user_ids: Array.from(selectedLeads),
            };
            moveLeadsMutation.mutate(payload);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-12">
            {/* Header */}
            <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <ArrowRightLeft className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Move Leads</h1>
                            <p className="text-indigo-100">Transfer leads between telecallers with advanced filters</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-medium"
                    >
                        <History className="w-5 h-5" />
                        View History
                    </button>
                </div>
            </div>

            {/* Top Stats Cards - Sticky */}
            <div className="sticky top-24 z-10 bg-gray-100 py-4 -mx-4 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Leads"
                        value={counts.total_leads}
                        icon={<Users className="w-6 h-6" />}
                        gradient="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        title="Assigned Leads"
                        value={counts.assigned_leads}
                        icon={<UserCheck className="w-6 h-6" />}
                        gradient="from-green-500 to-emerald-500"
                    />
                    <StatCard
                        title="Drivers"
                        value={counts.role_counts.driver}
                        icon={<User className="w-6 h-6" />}
                        gradient="from-orange-500 to-amber-500"
                    />
                    <StatCard
                        title="Transporters"
                        value={counts.role_counts.transporter}
                        icon={<Truck className="w-6 h-6" />}
                        gradient="from-purple-500 to-fuchsia-500"
                    />
                </div>
            </div>

            {/* Filters Form */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 mb-6 mt-6">
                <div className="space-y-6">
                    {/* Lead Type Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Lead Type</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setRoleFilter(roleFilter === 'driver' ? '' : 'driver')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    roleFilter === 'driver'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Driver
                            </button>
                            <button
                                onClick={() => setRoleFilter(roleFilter === 'transporter' ? '' : 'transporter')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    roleFilter === 'transporter'
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Transporter
                            </button>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-700">Date Filter</label>
                            <button
                                onClick={() => setUseDateRange(!useDateRange)}
                                className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                    useDateRange
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {useDateRange ? 'Date Filter Enabled' : 'Use Date Range'}
                            </button>
                        </div>
                        
                        {!useDateRange ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                                All registration dates are selected. Date filters are disabled.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDateType('date')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            dateType === 'date'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Single Date
                                    </button>
                                    <button
                                        onClick={() => setDateType('range')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            dateType === 'range'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Date Range
                                    </button>
                                </div>
                                
                                {dateType === 'date' ? (
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">From Date</label>
                                            <input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => setFromDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">To Date</label>
                                            <input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subscription Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Subscription Status</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSubscriptionFilter(subscriptionFilter === 'subscribed' ? '' : 'subscribed')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    subscriptionFilter === 'subscribed'
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Subscribed <span className="ml-1 opacity-75">({counts.subscription_counts.subscribed})</span>
                            </button>
                            <button
                                onClick={() => setSubscriptionFilter(subscriptionFilter === 'not_subscribed' ? '' : 'not_subscribed')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    subscriptionFilter === 'not_subscribed'
                                        ? 'bg-red-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Not Subscribed <span className="ml-1 opacity-75">({counts.subscription_counts.not_subscribed})</span>
                            </button>
                        </div>
                    </div>

                    {/* Move Limit */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Move Limit</label>
                        <input
                            type="number"
                            value={moveLimit}
                            onChange={(e) => {
                                setMoveLimit(e.target.value);
                                if (e.target.value && parseInt(e.target.value) > 0) {
                                    setSelectedLeads(new Set());
                                }
                            }}
                            placeholder="Enter number of leads (0 for manual selection)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {moveLimit && parseInt(moveLimit) > 0 
                                ? 'Checkbox selection is disabled when limit is set' 
                                : 'Leave empty or 0 to manually select leads'}
                        </p>
                    </div>

                    {/* From Assignee */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            From Assignee (Source)
                        </label>
                        <select
                            value={fromAssignee}
                            onChange={(e) => setFromAssignee(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select source assignee...</option>
                            {employees.map(emp => {
                                const leadCount = counts.assigned_to_counts?.[emp.id] || 0;
                                return (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} - {emp.process} ({leadCount} leads)
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Call Status Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Call Status</label>
                        <div className="flex flex-wrap gap-2">
                            {['fresh', 'connected', 'not_connected', 'callback_later', 'pending'].map(status => {
                                const count = counts.call_status_counts[status] || 0;
                                const isActive = callStatusFilter === status;
                                
                                let colorClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                                if (isActive) {
                                    if (status === 'fresh') colorClass = 'bg-blue-600 text-white shadow-md';
                                    if (status === 'connected') colorClass = 'bg-green-600 text-white shadow-md';
                                    if (status === 'not_connected') colorClass = 'bg-red-600 text-white shadow-md';
                                    if (status === 'callback_later') colorClass = 'bg-orange-600 text-white shadow-md';
                                    if (status === 'pending') colorClass = 'bg-yellow-600 text-white shadow-md';
                                }
                                
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setCallStatusFilter(callStatusFilter === status ? '' : status)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${colorClass}`}
                                    >
                                        {status.replace('_', ' ')} <span className="ml-1 opacity-75">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Call Period */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Call Period (Date & Time)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Start</label>
                                <input
                                    type="datetime-local"
                                    value={callPeriodStart}
                                    onChange={(e) => setCallPeriodStart(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">End</label>
                                <input
                                    type="datetime-local"
                                    value={callPeriodEnd}
                                    onChange={(e) => setCallPeriodEnd(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* To Assignee */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            To Assignee (Target)
                        </label>
                        <select
                            value={toAssignee}
                            onChange={(e) => setToAssignee(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select target assignee...</option>
                            {employees.filter(e => e.id.toString() !== fromAssignee).map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name} - {emp.process}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Move Button */}
                    <button
                        onClick={handleMoveLeads}
                        disabled={
                            moveLeadsMutation.isPending || 
                            !fromAssignee || 
                            !toAssignee || 
                            ((!moveLimit || parseInt(moveLimit) === 0) && selectedLeads.size === 0)
                        }
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                        {moveLeadsMutation.isPending 
                            ? 'Moving Leads...' 
                            : `Move ${moveLimit && parseInt(moveLimit) > 0 ? moveLimit : selectedLeads.size} Leads`}
                    </button>
                </div>
            </div>

            {/* Leads List */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
                {/* Search Bar */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">Leads List</h3>
                            <p className="text-sm text-gray-500">
                                {pagination.total} leads found • {selectedLeads.size} selected
                            </p>
                        </div>
                        
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by ID, name, mobile, email..."
                                className="w-full !pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[600px]">
                    {isLoadingLeads ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading leads...</p>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No leads found</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Try adjusting your filters to find what you're looking for.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-5">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={leads.length > 0 && selectedLeads.size === leads.length}
                                            onChange={toggleSelectAll}
                                            disabled={moveLimit && parseInt(moveLimit) > 0}
                                            className="w-4 h-4 text-indigo-600 rounded-sm border-gray-300 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left">Details</th>
                                    <th className="px-6 py-4 text-left">Role</th>
                                    <th className="px-6 py-4 text-left">Contact</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {leads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => toggleLeadSelection(lead.id)}
                                        className={`transition-colors cursor-pointer ${
                                            selectedLeads.has(lead.id) ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'
                                        } ${moveLimit && parseInt(moveLimit) > 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.has(lead.id)}
                                                onChange={() => toggleLeadSelection(lead.id)}
                                                disabled={moveLimit && parseInt(moveLimit) > 0}
                                                className="w-4 h-4 text-indigo-600 rounded-sm border-gray-300 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                                                    {lead.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{lead.name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{lead.unique_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                {lead.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">{lead.mobile}</div>
                                            {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize inline-flex items-center gap-2
                                                ${lead.call_status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                  lead.call_status === 'not_connected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                  lead.call_status === 'callback_later' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                  lead.call_status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                  'bg-blue-50 text-blue-700 border border-blue-200'}`}
                                            >
                                                {lead.call_status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Page {pagination.current_page} of {pagination.last_page}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* History Modal */}
            <MoveLeadsHistoryModal 
                isOpen={showHistoryModal} 
                onClose={() => setShowHistoryModal(false)} 
            />
        </div>
    );
};

// StatCard Component
const StatCard = ({ title, value, icon, gradient }) => (
    <div className={`rounded-xl p-5 text-white shadow-lg bg-gradient-to-r ${gradient}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm opacity-90">{title}</p>
                <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
                {icon}
            </div>
        </div>
    </div>
);

export default MoveLeads;
