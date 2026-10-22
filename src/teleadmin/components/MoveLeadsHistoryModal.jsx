import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, History, ArrowRight, Calendar, User } from 'lucide-react-teleadmin';
import axiosInstance from '../services/api/axiosInstance';

const MoveLeadsHistoryModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        from_admin_id: '',
        to_admin_id: '',
        role: '',
        from_date: '',
        to_date: '',
        sort_by: 'moved_at',
        sort_order: 'desc',
    });

    // Fetch move leads logs
    const { data: logsResponse, isLoading } = useQuery({
        queryKey: ['move-leads-logs', currentPage, searchQuery, filters],
        queryFn: async () => {
            const params = {
                page: currentPage,
                ...filters,
            };
            
            if (searchQuery) {
                params.search = searchQuery;
            }
            
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            
            const response = await axiosInstance.get('/telehead/move-leads-logs', { params });
            return response.data;
        },
        enabled: isOpen,
        keepPreviousData: true,
    });

    const logs = logsResponse?.data?.data || [];
    const agents = logsResponse?.agents || [];
    const pagination = {
        current_page: logsResponse?.data?.current_page || 1,
        last_page: logsResponse?.data?.last_page || 1,
        total: logsResponse?.data?.total || 0,
        per_page: logsResponse?.data?.per_page || 20,
    };

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sort_by: field,
            sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc',
        }));
    };

    const clearFilters = () => {
        setFilters({
            from_admin_id: '',
            to_admin_id: '',
            role: '',
            from_date: '',
            to_date: '',
            sort_by: 'moved_at',
            sort_order: 'desc',
        });
        setSearchQuery('');
        setCurrentPage(1);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
                        <div className="flex items-center gap-3 text-white">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Move Leads History</h2>
                                <p className="text-sm text-indigo-100">View all lead transfer logs</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* From Assignee Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">From Assignee</label>
                                <select
                                    value={filters.from_admin_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, from_admin_id: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Assignees</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} - {agent.tc_for}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* To Assignee Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">To Assignee</label>
                                <select
                                    value={filters.to_admin_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, to_admin_id: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Assignees</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>
                                            {agent.name} - {agent.tc_for}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                                <select
                                    value={filters.role}
                                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Roles</option>
                                    <option value="driver">Driver</option>
                                    <option value="transporter">Transporter</option>
                                </select>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={filters.from_date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, from_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={filters.to_date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, to_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by mobile, email, or unique ID..."
                                className="w-full !pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No history found</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    No lead transfer logs match your criteria.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th 
                                                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSort('moved_at')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    Moved At
                                                    {filters.sort_by === 'moved_at' && (
                                                        <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    Lead Details
                                                    {filters.sort_by === 'name' && (
                                                        <span>{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left">Contact</th>
                                            <th 
                                                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSort('role')}
                                            >
                                                Role
                                                {filters.sort_by === 'role' && (
                                                    <span className="ml-1">{filters.sort_order === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </th>
                                            <th className="px-4 py-3 text-left">Transfer</th>
                                            <th className="px-4 py-3 text-left">Moved By</th>
                                            <th className="px-4 py-3 text-left">Registered</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(log.moved_at).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.moved_at).toLocaleTimeString('en-IN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                                            {log.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{log.name || 'Unknown'}</div>
                                                            <div className="text-xs text-gray-500 font-mono">{log.unique_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">{log.mobile}</div>
                                                    {log.email && <div className="text-xs text-gray-500">{log.email}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                        {log.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <div className="text-right">
                                                            <div className="font-medium text-gray-700">{log.from_assignee || 'N/A'}</div>
                                                            {log.from_admin_id && agents.find(a => a.id === log.from_admin_id) && (
                                                                <span className="text-xs text-gray-500">
                                                                    {agents.find(a => a.id === log.from_admin_id)?.tc_for}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <div className="text-left">
                                                            <div className="font-medium text-indigo-600">{log.to_assignee || 'N/A'}</div>
                                                            {log.to_admin_id && agents.find(a => a.id === log.to_admin_id) && (
                                                                <span className="text-xs text-indigo-500">
                                                                    {agents.find(a => a.id === log.to_admin_id)?.tc_for}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-700">{log.moved_by || 'System'}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.registered_at).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer with Pagination */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {logs.length > 0 ? ((pagination.current_page - 1) * pagination.per_page) + 1 : 0} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                                {pagination.total} entries
                            </div>
                            
                            {pagination.last_page > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={pagination.current_page === 1}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        First
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={pagination.current_page === 1}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-sm text-gray-700">
                                        Page {pagination.current_page} of {pagination.last_page}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(pagination.last_page)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Last
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveLeadsHistoryModal;
