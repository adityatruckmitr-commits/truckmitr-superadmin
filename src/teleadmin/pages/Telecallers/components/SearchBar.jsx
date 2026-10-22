import { Search } from 'lucide-react-teleadmin';

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="relative mb-4">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search telecallers by name, email, or mobile..."
      className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

export default SearchBar;
