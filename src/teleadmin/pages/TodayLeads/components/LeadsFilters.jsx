import { Search, User, Users } from 'lucide-react-teleadmin';

const LeadsFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  assignedFilter, 
  setAssignedFilter,
  roleFilter,
  setRoleFilter,
  assignedCount,
  filteredCount,
  totalCount 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, TMID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Telecallers</option>
            {assignedCount.map((item) => (
              <option key={item.assigned_to} value={item.assigned_to}>
                {item.assigned_name} ({item.total})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="driver">Drivers Only</option>
            <option value="transporter">Transporters Only</option>
          </select>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredCount}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalCount}</span> leads
      </div>
    </div>
  );
};

export default LeadsFilters;
