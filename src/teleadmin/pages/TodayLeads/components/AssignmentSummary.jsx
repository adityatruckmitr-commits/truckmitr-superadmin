import { TrendingUp } from 'lucide-react-teleadmin';

const AssignmentSummary = ({ assignedCount, title, selectedState }) => {
  if (!assignedCount || assignedCount.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          {title || "Assignment Summary"}
        </h3>
        <p className="text-gray-500 text-center py-4">No assignment data available</p>
      </div>
    );
  }

  // Sort: welcome-call first, then match-making
  const sortedAssignedCount = [...assignedCount].sort((a, b) => {
    if (a.assigned_role === 'welcome-call' && b.assigned_role !== 'welcome-call') return -1;
    if (a.assigned_role !== 'welcome-call' && b.assigned_role === 'welcome-call') return 1;
    if (a.assigned_role === 'match-making' && b.assigned_role !== 'match-making') return -1;
    if (a.assigned_role !== 'match-making' && b.assigned_role === 'match-making') return 1;
    return 0;
  });

  // Get color based on selected state
  const getColorClass = () => {
    switch (selectedState) {
      case 'today_total':
      case 'total_leads':
        return {
          icon: 'text-blue-600',
          count: 'text-blue-600',
          border: 'border-blue-200',
          bg: 'from-blue-50 to-blue-100'
        };
      case 'connected':
        return {
          icon: 'text-green-600',
          count: 'text-green-600',
          border: 'border-green-200',
          bg: 'from-green-50 to-green-100'
        };
      case 'not_connected':
        return {
          icon: 'text-red-600',
          count: 'text-red-600',
          border: 'border-red-200',
          bg: 'from-red-50 to-red-100'
        };
      case 'callback':
        return {
          icon: 'text-orange-600',
          count: 'text-orange-600',
          border: 'border-orange-200',
          bg: 'from-orange-50 to-orange-100'
        };
      case 'backlog':
        return {
          icon: 'text-amber-600',
          count: 'text-amber-600',
          border: 'border-amber-200',
          bg: 'from-amber-50 to-amber-100'
        };
        case 'pending':   // ✅ ADD THIS
          return {
            icon: 'text-yellow-600',
            count: 'text-yellow-600',
            border: 'border-yellow-200',
            bg: 'from-yellow-50 to-yellow-100'
          };
      default:
        return {
          icon: 'text-indigo-600',
          count: 'text-indigo-600',
          border: 'border-gray-200',
          bg: 'from-gray-50 to-gray-100'
        };
    }
  };

  const colorClass = getColorClass();

  return (
    <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
      <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2`}>
        <TrendingUp className={`w-5 h-5 ${colorClass.icon}`} />
        {title || "Assignment Summary"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sortedAssignedCount.map((item) => {
          // Determine what to show as the highlighted value based on selected state
          // If custom_count is present (passed from parent), use it
          let highlightedValue = item.custom_count !== undefined ? item.custom_count : (item.total_assigned || item.total || 0);
          let highlightedLabel = 'assigned';

          if (selectedState === 'connected') {
            highlightedLabel = 'connected';
            if (item.custom_count === undefined) highlightedValue = item.total_assigned || item.total || 0;
          } else if (selectedState === 'not_connected') {
            highlightedLabel = 'not connected';
            if (item.custom_count === undefined) highlightedValue = item.total_assigned || item.total || 0;
          } 
          else if (selectedState === 'callback') {
            highlightedLabel = 'callback';
            if (item.custom_count === undefined) highlightedValue = item.total_assigned || item.total || 0;
          }

          return (
            <div key={item.assigned_to} className={`bg-gradient-to-br ${colorClass.bg} rounded-lg p-4 border ${colorClass.border} hover:shadow-md transition-shadow`}>
              <p className="text-sm font-medium text-gray-700 mb-2">{item.assigned_name}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-2xl font-bold ${colorClass.count}`}>{highlightedValue}</p>
                <span className="text-xs text-gray-500">{highlightedLabel}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
  {(selectedState === 'today_total' || selectedState === 'total_leads' || !selectedState) ? (
    <div className="flex flex-col gap-1">
      
      <div className="flex items-center gap-1">
        <span className="text-green-600 font-semibold">{item.total_connected || 0}</span>
        <span className="text-gray-500">connected</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-red-600 font-semibold">{item.total_not_connected || 0}</span>
        <span className="text-gray-500">not connected</span>
      </div>

    </div>
  ) : (
    <div className="flex items-center gap-1">
      <span className="text-blue-600 font-semibold">{item.total_assigned || item.total || 0}</span>
      <span className="text-gray-500">assigned</span>
    </div>
  )}

  <div className="flex items-center gap-1">
    <span className="text-amber-600 font-semibold">{item.remaining_fresh || 0}</span>
    <span className="text-gray-500">left</span>
  </div>
</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentSummary;
