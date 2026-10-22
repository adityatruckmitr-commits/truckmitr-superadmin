import { useState } from 'react';
import { X, User, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL } from '../../../config/api.config';
import { useQuery } from '@tanstack/react-query';
import leadsApi from '../../../services/api/leadsApi';

const BacklogModal = ({ data, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch backlog data for current page
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['backlog-leads', currentPage],
    queryFn: () => leadsApi.getBacklogLeads(currentPage),
    keepPreviousData: true,
  });

  const rawLeads = pageData?.data || data?.data || [];

  // Sort leads by registration date (oldest first)
  const leads = [...rawLeads].sort((a, b) => {
    const dateA = new Date(a.Created_at).getTime();
    const dateB = new Date(b.Created_at).getTime();
    return dateA - dateB; // Ascending order (oldest first)
  });

  const totalBacklog = pageData?.total_backlog || data?.total_backlog || 0;
  const currentPageNum = pageData?.current_page || data?.current_page || 1;
  const lastPage = pageData?.last_page || data?.last_page || 1;
  const mode = pageData?.mode || data?.mode || '';
  const startRange = pageData?.start_range || data?.start_range || '';
  const endRange = pageData?.end_range || data?.end_range || '';

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Back Log Leads</h2>
            <p className="text-amber-100 text-sm">
              Total: {totalBacklog} | Mode: {mode}
            </p>
            {startRange && endRange && (
              <p className="text-amber-100 text-xs mt-1">
                {formatDateTime(startRange)} - {formatDateTime(endRange)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading backlog leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No backlog leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User Info</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">State</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr key={lead.id} className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {/* User Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 relative pr-8">
                          <div
                            className="relative h-12 w-12 flex-shrink-0 cursor-pointer group"
                            onClick={() => setSelectedLead(lead)}
                          >

                            {/* Percentage badge */}
                            <span
                              className={`
          absolute -right-5 top-2/2 -translate-y-1/2
          text-[10px] font-bold px-1.5 py-0.5 rounded-full
          ${(lead.profileCompletion || 0) >= 75
                                  ? 'bg-green-100 text-green-700'
                                  : (lead.profileCompletion || 0) >= 50
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'}
        `}
                            >
                              {lead.profileCompletion || 0}%
                            </span>

                            {/* Ring */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-md">
                              <circle cx="24" cy="24" r="22" stroke="#f3f4f6" strokeWidth="3" fill="none" />
                              <defs>
                                <linearGradient id={`gradient-${lead.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={(lead.profileCompletion || 0) >= 75 ? '#10b981' : (lead.profileCompletion || 0) >= 50 ? '#f59e0b' : '#ef4444'} />
                                  <stop offset="100%" stopColor={(lead.profileCompletion || 0) >= 75 ? '#34d399' : (lead.profileCompletion || 0) >= 50 ? '#fbbf24' : '#f87171'} />
                                </linearGradient>
                              </defs>

                              <circle
                                cx="24"
                                cy="24"
                                r="22"
                                stroke={`url(#gradient-${lead.id})`}
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${((lead.profileCompletion || 0) / 100) * 138.23} 138.23`}
                                strokeLinecap="round"
                                className="transition-all duration-500 group-hover:stroke-[4]"
                              />
                            </svg>

                            {/* Inner avatar */}
                            <div className="absolute inset-[3px] bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-95 transition-transform duration-200">
                              {lead.images ? (
                                <img
                                  src={`${IMAGE_BASE_URL}${lead.images}`}
                                  alt={lead.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}

                              <span
                                className="text-indigo-600 font-bold text-base"
                                style={{ display: lead.images ? 'none' : 'flex' }}
                              >
                                {lead.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>

                          {/* Text info */}
                          <div>
                            <div className="font-medium text-gray-900">{lead.name || '-'}</div>
                            <div className="text-sm text-indigo-600">{lead.unique_id}</div>
                          </div>

                        </div>
                      </td>


                      {/* Mobile */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {lead.mobile || '-'}
                        </div>
                      </td>

                      {/* State */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {lead.states || '-'}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${lead.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {lead.role === 'driver' ? 'Driver' : 'Transporter'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${lead.status === '1' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {lead.status === '1' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Registered */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(lead.Created_at)}
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-4">
                        {lead.assigned_to ? (
                          <div className="text-sm font-medium text-gray-900">
                            {lead.admins}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-900">{currentPageNum}</span> of{' '}
                  <span className="font-semibold text-gray-900">{lastPage}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPageNum === 1 || isLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {[...Array(lastPage)].map((_, index) => {
                      const page = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === lastPage ||
                        (page >= currentPageNum - 1 && page <= currentPageNum + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPageNum === page
                              ? 'bg-amber-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPageNum - 2 || page === currentPageNum + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                    disabled={currentPageNum === lastPage || isLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacklogModal;
