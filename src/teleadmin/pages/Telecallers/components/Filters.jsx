const Filters = ({ 
  timeFilter, 
  setTimeFilter, 
  statusFilter, 
  setStatusFilter, 
  typeFilter, 
  setTypeFilter 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
      <select
        value={timeFilter}
        onChange={(e) => setTimeFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="all">All Types</option>
        <option value="welcome-call">Welcome Call</option>
        <option value="match-making">Match Making</option>
      </select>
    </div>
  </div>
);

export default Filters;
