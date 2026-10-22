import { X, Briefcase, MapPin, Calendar, DollarSign, FileText } from 'lucide-react-teleadmin';

const AppliedJobsModal = ({ jobs, userName, onClose }) => {
  const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 0 || value === '0';
  };

  const renderValue = (value) => {
    if (isEmpty(value)) {
      return <span className="text-red-500 font-medium">-</span>;
    }
    return <span className="text-gray-900">{value}</span>;
  };

  const formatDate = (dateTime) => {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Applied Jobs</h2>
            <p className="text-blue-100 text-sm">
              {userName} - Total Applications: {jobs.length}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No jobs applied</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((application) => {
                const job = application.job_details;
                if (!job) {
                  return (
                    <div key={application.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <p className="text-gray-500">Job details not available (Job ID: {application.job_id})</p>
                      <p className="text-sm text-gray-400 mt-1">Applied on: {formatDate(application.created_at)}</p>
                    </div>
                  );
                }

                return (
                  <div key={application.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{job.job_title}</h3>
                            <p className="text-sm text-gray-500">Job ID: {job.job_id}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          job.status === '1' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status === '1' ? 'Active' : 'Inactive'}
                        </span>
                        {job.closed_job && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Location</div>
                          <div className="text-sm font-medium text-gray-900">{renderValue(job.job_location)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Salary Range</div>
                          <div className="text-sm font-medium text-gray-900">₹{renderValue(job.Salary_Range)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">License Type</div>
                          <div className="text-sm font-medium text-gray-900">{renderValue(job.Type_of_License)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-500">Experience</div>
                          <div className="text-sm font-medium text-gray-900">{renderValue(job.Required_Experience)} years</div>
                        </div>
                      </div>
                    </div>

                    {/* Job Description */}
                    {!isEmpty(job.Job_Description) && (
                      <div className="mb-4 bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Job Description</div>
                        <div className="text-sm text-gray-700 line-clamp-3">{job.Job_Description}</div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500">Vehicle Type</div>
                        <div className="text-sm font-medium text-gray-900">{renderValue(job.vehicle_type)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Drivers Required</div>
                        <div className="text-sm font-medium text-gray-900">{renderValue(job.number_of_drivers_required)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Application Deadline</div>
                        <div className="text-sm font-medium text-gray-900">
                          {job.Application_Deadline ? new Date(job.Application_Deadline).toLocaleDateString('en-IN') : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Applied On</div>
                        <div className="text-sm font-medium text-blue-600">{formatDate(application.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppliedJobsModal;
