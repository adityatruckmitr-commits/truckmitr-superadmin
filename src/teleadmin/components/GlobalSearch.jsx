import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, ChevronRight } from 'lucide-react-teleadmin';
import { useNavigate } from '@teleadmin/router';
import { userApi } from '../services/api/userApi';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3) {
        performSearch(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const response = await userApi.searchUsers(searchQuery);
      if (response && response.users) {
        const usersList = Array.isArray(response.users) 
          ? response.users 
          : Object.values(response.users);
        setResults(usersList);
      }
    } catch (error) {
      console.error('Failed to search users', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (userId, searchedJobId) => {
    setIsOpen(false);
    setQuery('');
    if (searchedJobId) {
      navigate(`/user-detail/${userId}?tab=transporter_jobs&highlightJobId=${searchedJobId}`);
    } else {
      navigate(`/user-detail/${userId}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Search by TMID, name, mobile, email..."
          className="w-full !pl-9 pr-4 py-1.5 text-xs bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-hidden"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-slate-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No users found matching "{query}"
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {results.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id, user.searched_job_id)}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{user.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {user.searched_job_id ? `Job Matched: ${user.searched_job_id}` : user.unique_id}
                      </span>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-indigo-50 text-indigo-600 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
