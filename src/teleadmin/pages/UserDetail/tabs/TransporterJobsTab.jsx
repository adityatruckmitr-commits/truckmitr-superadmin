import React from 'react';
import { useNavigate } from '@teleadmin/router';
import { Truck, MapPin, Users, Calendar, Eye } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const isDateExpired = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const TransporterJobsTab = ({ jobs, user, highlightJobId }) => {
  const navigate = useNavigate();

  // If a highlightJobId is provided, sort the jobs array so the matched job is at the top
  const sortedJobs = React.useMemo(() => {
    if (!jobs || !highlightJobId) return jobs;
    return [...jobs].sort((a, b) => {
      if (a.job_id === highlightJobId) return -1;
      if (b.job_id === highlightJobId) return 1;
      return 0;
    });
  }, [jobs, highlightJobId]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Truck className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Job Listings</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200">#</th>
              <th className="px-6 py-4 border-b border-slate-200">Job Details</th>
              <th className="px-6 py-4 border-b border-slate-200">Job Type</th>
              <th className="px-6 py-4 border-b border-slate-200">Assigned To</th>
              <th className="px-6 py-4 border-b border-slate-200">Location</th>
              <th className="px-6 py-4 border-b border-slate-200">Drivers Req.</th>
              <th className="px-6 py-4 border-b border-slate-200">Salary Range</th>
              <th className="px-6 py-4 border-b border-slate-200">Status</th>
              <th className="px-6 py-4 border-b border-slate-200">Active/Inactive</th>
              <th className="px-6 py-4 border-b border-slate-200">Created At</th>
              <th className="px-6 py-4 border-b border-slate-200 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedJobs && sortedJobs.length > 0 ? (
              sortedJobs.map((job, index) => {
                let statusBadge = 'bg-slate-100 text-slate-600';
                let statusText = 'Unknown';
                
                if (job.status == 1) {
                  statusBadge = 'bg-emerald-100 text-emerald-700';
                  statusText = 'Verified';
                } else if (job.status == 0) {
                  statusBadge = 'bg-amber-100 text-amber-700';
                  statusText = 'Pending';
                } else if (job.status == 2) {
                  statusBadge = 'bg-red-100 text-red-700';
                  statusText = 'Rejected';
                }

                let activeBadge = 'bg-slate-100 text-slate-600';
                let activeText = job.computed_status || 'Unknown';

                if (job.computed_status === 'Closed') {
                  activeBadge = 'bg-slate-200 text-slate-700';
                } else if (job.computed_status === 'Expired') {
                  activeBadge = 'bg-red-100 text-red-700';
                } else if (job.computed_status === 'Inactive') {
                  activeBadge = 'bg-amber-100 text-amber-700';
                } else if (job.computed_status === 'Active') {
                  activeBadge = 'bg-emerald-100 text-emerald-700';
                }

                const isHighlighted = job.job_id === highlightJobId;

                return (
                  <tr key={index} className={`${isHighlighted ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{job.job_title}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{job.job_id}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">{job.vehicle_type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        {job.job_type === 'Super Premium Job' || job.job_type === 'Premium Job' ? (
                          <>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.job_type === 'Super Premium Job' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} ${job.is_refunded ? 'line-through opacity-70' : ''}`}>
                              {job.job_type === 'Super Premium Job' ? 'Super Premium' : 'Premium'}
                            </span>
                            {job.is_refunded && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Standard</span>
                            )}
                          </>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Standard</span>
                        )}
                        
                        {job.payment_amount > 0 && (
                          <div className={`text-[10px] font-bold mt-1 ${job.is_refunded ? 'line-through text-red-500' : 'text-emerald-600'}`}>
                            ₹{job.payment_amount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {job.assigned_to_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-sm text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{job.job_location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{job.number_of_drivers_required || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {job.Salary_Range ? `₹${job.Salary_Range}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activeBadge}`}>
                        {activeText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(job.Created_at || job.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/user-detail/${user?.id}/job/${job.job_id}`)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-sm hover:bg-indigo-100 transition-colors inline-flex"
                        title="View Job Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Truck className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No posted jobs found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransporterJobsTab;
