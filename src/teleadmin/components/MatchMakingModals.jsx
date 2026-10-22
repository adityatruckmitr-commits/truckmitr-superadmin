import { XCircle, Shuffle, UserCheck, Briefcase, MapPin, Users, Calendar, Building, Phone, Mail, DollarSign, Truck } from 'lucide-react-teleadmin';
import { useState } from 'react';

// Reassign Modal
export const ReassignModal = ({ job, telecallers, onClose, onReassign }) => {
  const [selectedTelecaller, setSelectedTelecaller] = useState('');

  const handleReassign = () => {
    if (!selectedTelecaller) {
      alert('Please select a telecaller');
      return;
    }
    onReassign(parseInt(selectedTelecaller));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-white/20">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-600 p-8 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-xs rounded-xl hover:bg-white/30 transition-all"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4">
              <Shuffle className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Reassign Job</h2>
              <p className="text-white/90">Transfer job to another telecaller</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Job Info */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4">Job Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Job ID:</span>
                <span className="text-white font-bold">{job.jobId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Title:</span>
                <span className="text-white font-bold">{job.jobTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Current Assignee:</span>
                <span className="text-white font-bold">{job.assignedToName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Applications:</span>
                <span className="text-white font-bold">{job.applicantsCount}</span>
              </div>
            </div>
          </div>

          {/* Select Telecaller */}
          <div>
            <label className="block text-white font-bold mb-3 text-lg">
              Select New Telecaller
            </label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white text-lg focus:ring-2 focus:ring-orange-500 transition-all"
            >
              <option value="">Choose telecaller...</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id} disabled={tc.id === job.assignedTo}>
                  {tc.name} {tc.id === job.assignedTo ? '(Current)' : ''} - {tc.assignedJobs?.total || 0} jobs
                </option>
              ))}
            </select>
          </div>

          {/* Telecaller Stats Preview */}
          {selectedTelecaller && telecallers.find(tc => tc.id === parseInt(selectedTelecaller)) && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/10">
              <h4 className="text-white font-bold mb-4">Telecaller Workload</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs mb-1">Total Jobs</p>
                  <p className="text-white text-2xl font-bold">
                    {telecallers.find(tc => tc.id === parseInt(selectedTelecaller))?.assignedJobs?.total || 0}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs mb-1">Active</p>
                  <p className="text-white text-2xl font-bold">
                    {telecallers.find(tc => tc.id === parseInt(selectedTelecaller))?.assignedJobs?.active || 0}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/60 text-xs mb-1">Pending</p>
                  <p className="text-white text-2xl font-bold">
                    {telecallers.find(tc => tc.id === parseInt(selectedTelecaller))?.assignedJobs?.pending || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleReassign}
              disabled={!selectedTelecaller}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reassign Job
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Job Details Modal
export const JobDetailsModal = ({ job, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl shadow-2xl max-w-5xl w-full border-2 border-white/20 my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-xs rounded-xl hover:bg-white/30 transition-all"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-xs rounded-2xl p-4">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm mb-2">Job ID: {job.jobId}</p>
              <h2 className="text-4xl font-bold text-white mb-3">{job.jobTitle}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                  <MapPin className="w-4 h-4" />
                  {job.jobLocation}
                </span>
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur-xs rounded-lg px-3 py-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <span className={`px-3 py-1 rounded-lg font-bold ${
                  job.isActive && job.isApproved && !job.isExpired ? 'bg-green-400 text-green-900' :
                  job.isApproved ? 'bg-blue-400 text-blue-900' :
                  job.isExpired ? 'bg-red-400 text-red-900' :
                  'bg-yellow-400 text-yellow-900'
                }`}>
                  {job.isActive && job.isApproved && !job.isExpired ? 'ACTIVE' :
                   job.isApproved ? 'APPROVED' :
                   job.isExpired ? 'EXPIRED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Transporter Info */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Transporter Information
              </h3>
              <div className="space-y-3">
                <DetailRow label="Company" value={job.transporterName} />
                <DetailRow label="TM ID" value={job.transporterTmid} />
                <DetailRow label="Phone" value={job.transporterPhone || 'N/A'} />
                <DetailRow label="Location" value={`${job.transporterCity}, ${job.transporterState}`} />
                {job.transporterProfileCompletion > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Profile Completion</span>
                      <span className="text-white font-bold">{job.transporterProfileCompletion}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${job.transporterProfileCompletion}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Job Requirements */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-400" />
                Job Requirements
              </h3>
              <div className="space-y-3">
                <DetailRow label="Vehicle Type" value={job.vehicleTypeDetail || 'N/A'} />
                <DetailRow label="License" value={job.typeOfLicense || 'N/A'} />
                <DetailRow label="Experience" value={job.requiredExperience || 'N/A'} />
                <DetailRow label="Positions" value={`${job.numberOfDriverRequired} drivers`} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Application Stats */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Application Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-2">Total Applications</p>
                  <p className="text-4xl font-bold text-white">{job.applicantsCount}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/60 text-sm mb-2">Required</p>
                  <p className="text-4xl font-bold text-white">{job.numberOfDriverRequired}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Fill Rate</span>
                  <span className="text-white font-bold">
                    {job.numberOfDriverRequired > 0 
                      ? Math.min(Math.round((job.applicantsCount / job.numberOfDriverRequired) * 100), 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      (job.applicantsCount / job.numberOfDriverRequired) >= 1 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    }`}
                    style={{ 
                      width: `${Math.min((job.applicantsCount / job.numberOfDriverRequired) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Compensation
              </h3>
              <div className="space-y-3">
                <DetailRow label="Salary Range" value={job.salaryRange || 'Not specified'} />
                <DetailRow label="Deadline" value={job.applicationDeadline || 'Open'} />
              </div>
            </div>

            {/* Assignment Info */}
            {job.assignedToName && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  Assignment
                </h3>
                <div className="space-y-3">
                  <DetailRow label="Assigned To" value={job.assignedToName} />
                  <DetailRow label="Assigned ID" value={`TC-${job.assignedTo}`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/10 rounded-b-3xl flex items-center justify-between">
          <div className="text-white/60 text-sm">
            Last updated: {new Date().toLocaleString()}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white font-bold text-sm">{value}</span>
    </div>
  );
};
