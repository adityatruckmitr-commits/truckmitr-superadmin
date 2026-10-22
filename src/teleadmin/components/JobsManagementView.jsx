import { Search, Filter, Shuffle, Eye, MapPin, Users, Calendar, Briefcase, Building } from 'lucide-react-teleadmin';

const JobsManagementView = ({ jobs, filters, setFilters, telecallers, onReassign, onViewDetails }) => {
  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Filter className="w-7 h-7 text-indigo-400" />
          Advanced Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-white font-bold mb-2 text-sm">Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Job title, ID, transporter..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-white font-bold mb-2 text-sm">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Telecaller Filter */}
          <div>
            <label className="block text-white font-bold mb-2 text-sm">Telecaller</label>
            <select
              value={filters.telecaller}
              onChange={(e) => setFilters({...filters, telecaller: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="all">All Telecallers</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-white font-bold mb-2 text-sm">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              placeholder="Any location"
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Vehicle Type Filter */}
          <div>
            <label className="block text-white font-bold mb-2 text-sm">Vehicle Type</label>
            <input
              type="text"
              value={filters.vehicleType}
              onChange={(e) => setFilters({...filters, vehicleType: e.target.value})}
              placeholder="Any vehicle"
              className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-white/80">
            Showing <span className="font-bold text-white">{jobs.length}</span> jobs
          </p>
          <button
            onClick={() => setFilters({
              status: 'all',
              telecaller: 'all',
              dateRange: 'all',
              location: 'all',
              vehicleType: 'all',
              search: ''
            })}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <JobCard3D
            key={job.id}
            job={job}
            onReassign={onReassign}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center">
          <Briefcase className="w-20 h-20 text-white/30 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white mb-2">No Jobs Found</p>
          <p className="text-white/60">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

const JobCard3D = ({ job, onReassign, onViewDetails }) => {
  return (
    <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 overflow-hidden transform hover:scale-105">
      {/* Header */}
      <div className={`relative p-6 ${
        job.isActive && job.isApproved && !job.isExpired
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : job.isApproved
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
          : job.isExpired
          ? 'bg-gradient-to-r from-red-500 to-rose-600'
          : 'bg-gradient-to-r from-yellow-500 to-orange-600'
      }`}>
        <div className="absolute top-2 right-2">
          <span className="px-3 py-1 bg-white/30 backdrop-blur-xs rounded-full text-xs font-bold text-white">
            {job.isActive && job.isApproved && !job.isExpired ? 'ACTIVE' :
             job.isApproved ? 'APPROVED' :
             job.isExpired ? 'EXPIRED' : 'PENDING'}
          </span>
        </div>
        <p className="text-white/80 text-xs mb-1">{job.jobId}</p>
        <h3 className="text-xl font-bold text-white mb-2 pr-20">{job.jobTitle}</h3>
        <div className="flex items-center gap-2 text-white/90 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{job.jobLocation}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Transporter */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <Building className="w-5 h-5 text-indigo-400" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{job.transporterName}</p>
            <p className="text-white/60 text-xs">{job.transporterTmid}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-indigo-400" />
              <p className="text-white/60 text-xs">Applications</p>
            </div>
            <p className="text-2xl font-bold text-white">{job.applicantsCount}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <p className="text-white/60 text-xs">Required</p>
            </div>
            <p className="text-2xl font-bold text-white">{job.numberOfDriverRequired}</p>
          </div>
        </div>

        {/* Assigned To */}
        {job.assignedToName && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-white/60 text-sm">Assigned to:</span>
            <span className="text-white font-bold text-sm">{job.assignedToName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(job)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-bold"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => onReassign(job)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all font-bold"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export { JobsManagementView, JobCard3D };
