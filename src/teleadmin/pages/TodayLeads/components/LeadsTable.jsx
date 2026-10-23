import PageJump from '../../../../components/PageJump';
import { useState, useMemo, useEffect } from 'react';
import { MapPin, Users, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL } from '../../../config/api.config';
import LeadDetailsModal from './LeadDetailsModal';
import TelecallerTooltip from './TelecallerTooltip';
import CallLogsModal from './CallLogsModal';
import AppliedJobsModal from './AppliedJobsModal';

const LeadsTable = ({ leads, isLoading, roleFilter, currentPage, totalCount, perPage, onPageChange, onModalStateChange }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [callLogsLead, setCallLogsLead] = useState(null);
  const [appliedJobsData, setAppliedJobsData] = useState(null);
  // const [currentPage, setCurrentPage] = useState(1); // Managed by parent
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc', or null

  // Notify parent about modal state to pause auto-refresh
  useEffect(() => {
    const isModalOpen = !!selectedLead || !!callLogsLead || !!appliedJobsData;
    if (onModalStateChange) {
      onModalStateChange(isModalOpen);
    }
  }, [selectedLead, callLogsLead, appliedJobsData, onModalStateChange]);

  console.log(leads)
  // Sort leads by registration date (Client - side sorting for current page)
  const sortedLeads = useMemo(() => {
    if (!sortOrder) return leads;

    return [...leads].sort((a, b) => {
      const dateA = new Date(a.Created_at).getTime();
      const dateB = new Date(b.Created_at).getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [leads, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalCount); // Display purpose only
  // const currentLeads = sortedLeads.slice(startIndex, endIndex); // No slicing needed, leads are already one page
  const currentLeads = sortedLeads;

  // Toggle sort order
  const toggleSort = () => {
    if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder('desc');
    }
  };

  // Reset to page 1 when leads change
  const handlePageChange = (page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-xs p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading today's leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leads Found</h3>
        <p className="text-gray-600">No leads available for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* User Info */}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User Info
                </th>

                {/* Registration Date */}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-2 hover:text-indigo-600 transition-colors group"
                  >
                    Registration Date
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-4 h-4 text-indigo-600" />
                    ) : sortOrder === 'desc' ? (
                      <ArrowDown className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                    )}
                  </button>
                </th>

                {/* Subscription Date */}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subscription
                </th>

                {/* State */}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  State
                </th>

                {/* Driver-specific columns */}
                {roleFilter === 'driver' && (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      License Type
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Applied Jobs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Training
                    </th>
                  </>
                )}

                {/* Transporter-specific columns */}
                {roleFilter === 'transporter' && (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fleet Size
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Posted Jobs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Match Making
                    </th>
                  </>
                )}

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Call Status
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Call Logs
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Call Ended
                </th>

              </tr>
            </thead>
            <tbody>
              {[...currentLeads]
                .sort((a, b) => new Date(b.Created_at) - new Date(a.Created_at))
                .map((lead, index) => (
                  <tr key={lead.id} className={index < currentLeads.length - 1 ? 'border-b border-gray-200' : ''}>
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 flex-shrink-0 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                          {/* Profile completion ring */}
                          <svg className="absolute  inset-0 w-full h-full -rotate-90">
                            <circle
                              cx="20"
                              cy="20"
                              r="18"
                              stroke="#e5e7eb"
                              strokeWidth="2"
                              fill="none"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="18"
                              stroke={(lead.full_details?.profile_completion || lead.profile_completion || 0) >= 75 ? '#10b981' : (lead.full_details?.profile_completion || lead.profile_completion || 0) >= 50 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={`${((lead.full_details?.profile_completion || lead.profile_completion || 0) / 100) * 113.1} 113.1`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-[2px] bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
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
                              className="text-indigo-600 font-semibold text-sm"
                              style={{ display: lead.images ? 'none' : 'flex' }}
                            >
                              {lead.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                          <button className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left">
                            {lead.name_eng}
                          </button>
                          <div className="text-sm text-indigo-600 font-medium">{lead.unique_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Registration At */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">
                          {new Date(lead.Created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Subscription */}
                    <td className="px-6 py-4">
                      {lead.full_details?.payments && lead.full_details.payments.length > 0 ? (
                        <span className="text-xs font-semibold bg-green-100 text-green-700">
                          {new Date(lead.full_details.payments[0].start_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          -
                        </span>
                      )}
                    </td>

                    {/* State */}
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {lead.states || 'N/A'}
                      </div>
                    </td>

                    {/* Driver-specific columns */}
                    {roleFilter === 'driver' && (
                      <>
                        {/* License Type */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {lead.Type_of_License || '-'}
                          </div>
                        </td>

                        {/* Applied Jobs */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {lead.full_details?.appliedJobsCount > 0 ? (
                              <button
                                onClick={() => setAppliedJobsData({
                                  jobs: lead.full_details.appliedJobs,
                                  userName: lead.name
                                })}
                                className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer transition-colors"
                              >
                                {lead.full_details.appliedJobsCount}
                              </button>
                            ) : (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
                                {lead.appliedJobsCount || 0}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Training */}
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            {lead.full_details?.training_info ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${lead.full_details.training_info.tier === 'Diamond' ? 'bg-cyan-100 text-cyan-700' :
                                  lead.full_details.training_info.tier === 'Platinum' ? 'bg-slate-100 text-slate-700' :
                                    lead.full_details.training_info.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                                      lead.full_details.training_info.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                                        lead.full_details.training_info.tier === 'Bronze' ? 'bg-orange-100 text-orange-700' :
                                          'bg-gray-100 text-gray-500'
                                  }`}>
                                  {lead.full_details.training_info.tier}
                                </span>
                                {/* <span className="text-gray-500 text-[10px]">{lead.full_details.training_info.percentage}%</span> */}
                              </div>
                            ) : (
                              <span className="text-gray-400">Not Started</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* Transporter-specific columns */}
                    {roleFilter === 'transporter' && (
                      <>
                        {/* Fleet Size */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {lead.Fleet_Size || '-'}
                          </div>
                        </td>

                        {/* Posted Jobs */}
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                              {lead.posted_jobs_count || 0}
                            </span>
                          </div>
                        </td>

                        {/* Match Making */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {lead.match_making_status || '-'}
                          </div>
                        </td>
                      </>
                    )}

                    {/* Role (always visible) */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${lead.role === 'driver'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                        }`}>
                        {lead.role === 'driver' ? 'Driver' : 'Transporter'}
                      </span>
                    </td>

                    {/* Call Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${(lead.call_status || '').toLowerCase() === 'connected' ? 'bg-green-100 text-green-800' :
                        (lead.call_status || '').toLowerCase() === 'not_connected' ? 'bg-red-100 text-red-800' :
                          (lead.call_status || '').toLowerCase() === 'fresh' ? 'bg-blue-100 text-blue-800' :
                            (lead.call_status || '').toLowerCase() === 'callback_later' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {((lead.call_status === 'fresh' ? 'TBC' : lead.call_status) || 'N/A').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Call Logs */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setCallLogsLead(lead)}
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold transition-all ${lead.full_details.call_logs && lead.full_details.call_logs.length > 0
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-500 cursor-default'
                            }`}
                          disabled={!lead.full_details.call_logs || lead.full_details.call_logs.length === 0}
                        >
                          {lead.full_details.call_logs?.length || 0}
                        </button>
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-4">
                      {lead.assigned_admin ? (
                        <div className="relative group">
                          <div className="cursor-pointer">
                            <div className="font-medium text-gray-900">{lead.assigned_admin.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{lead.assigned_admin.tc_for}</div>
                          </div>
                          <TelecallerTooltip assignedAdmin={lead.assigned_admin} />
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {lead?.full_details?.call_logs && lead?.full_details?.call_logs.length > 0 ? (
                        <div className="font-medium text-gray-900">
                          {new Date(lead?.full_details?.call_logs[0].updated_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      ) : null}
                    </td>

                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <LeadDetailsModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        )}

        {/* Call Logs Modal */}
        {callLogsLead && (
          <CallLogsModal
            lead={callLogsLead}
            onClose={() => setCallLogsLead(null)}
          />
        )}

        {/* Applied Jobs Modal */}
        {appliedJobsData && (
          <AppliedJobsModal
            jobs={appliedJobsData.jobs}
            userName={appliedJobsData.userName}
            onClose={() => setAppliedJobsData(null)}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalCount}</span> leads
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
              <PageJump page={currentPage} totalPages={totalPages} onGo={handlePageChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
