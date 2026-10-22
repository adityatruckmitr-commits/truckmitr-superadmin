import { Users, Search } from 'lucide-react-teleadmin';
import TelecallerCard from './TelecallerCard';
import SearchBar from './SearchBar';
import Filters from './Filters';

const TelecallersTab = ({ 
  telecallers, 
  isLoading, 
  searchQuery, 
  setSearchQuery, 
  timeFilter, 
  setTimeFilter, 
  statusFilter, 
  setStatusFilter, 
  typeFilter, 
  setTypeFilter, 
  onViewLeads, 
  onEdit, 
  onDelete 
}) => {
  const clearFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = timeFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' || searchQuery;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Search Bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Filters */}
        <Filters
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
        />

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <strong>{telecallers.length}</strong> telecaller{telecallers.length !== 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          </div>
        ) : telecallers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {telecallers.map(tc => (
              <TelecallerCard
                key={tc.id}
                telecaller={tc}
                onViewLeads={onViewLeads}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No telecallers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelecallersTab;
