import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ListTodo, Clock, CheckCircle, AlertCircle, Slash, 
  Search, Filter, Timer as TimerIcon, ChevronLeft, ChevronRight, User, Briefcase
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Sub-component for Live Count Stopwatch
const Timer = ({ startTime }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTime(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono tabular-nums">{time}</span>;
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    dateRange: ""
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/tasks");
      setTasks(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async (taskId) => {
    try {
      setIsActivitiesLoading(true);
      const response = await api.get(`/activities?task_id=${taskId}`);
      setActivities(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Search and filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      (task.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.assigned_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesCreator = !filters.assignedTo || task.creator?.name === filters.assignedTo;

    let matchesDate = true;
    if (filters.dateRange) {
      const createdAt = new Date(task.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateToCheck = new Date(createdAt);
      dateToCheck.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case "today":
          matchesDate = dateToCheck.getTime() === today.getTime();
          break;
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = dateToCheck.getTime() === yesterday.getTime();
          break;
        case "week":
          const startOfWeek = new Date(today);
          const day = startOfWeek.getDay() || 7;
          startOfWeek.setDate(today.getDate() - (day - 1));
          matchesDate = createdAt >= startOfWeek;
          break;
        case "month":
          matchesDate = createdAt.getMonth() === today.getMonth() && createdAt.getFullYear() === today.getFullYear();
          break;
      }
    }
    return matchesSearch && matchesStatus && matchesPriority && matchesCreator && matchesDate;
  }).sort((a, b) => {
    // Keep active timers at the top of the list
    if (a.has_active_timer && !b.has_active_timer) return -1;
    if (!a.has_active_timer && b.has_active_timer) return 1;
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Pagination bounds
  const endIndex = currentPage * itemsPerPage;
  const startIndex = endIndex - itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      assignedTo: "",
      dateRange: ""
    });
  };

  const isFilterApplied = Object.values(filters).some(x => x !== "");

  // Unique lists from data for filter select values
  const uniqueStatuses = [...new Set(tasks.map(t => t.status))].filter(Boolean);
  const uniquePriorities = [...new Set(tasks.map(t => t.priority))].filter(Boolean);
  const uniqueCreators = [...new Set(tasks.map(t => t.creator?.name))].filter(Boolean);

  const getStatusColor = (status) => {
    return {
      todo: "bg-gray-100 text-gray-800 border-gray-200",
      doing: "bg-blue-100 text-blue-800 border-blue-200",
      done: "bg-green-100 text-green-800 border-green-200",
      blocked: "bg-red-100 text-red-800 border-red-200"
    }[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    return {
      todo: <ListTodo className="w-4 h-4" />,
      doing: <Clock className="w-4 h-4" />,
      done: <CheckCircle className="w-4 h-4" />,
      blocked: <AlertCircle className="w-4 h-4" />
    }[status] || <ListTodo className="w-4 h-4" />;
  };

  const getStatusLabel = (status) => {
    return {
      todo: "To Do",
      doing: "In Progress",
      done: "Done",
      blocked: "Blocked"
    }[status] || (status?.charAt(0).toUpperCase() + status?.slice(1) || "");
  };

  const getPriorityColor = (priority) => {
    return {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200",
      urgent: "bg-red-100 text-red-800 border-red-200"
    }[priority] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityLabel = (priority) => {
    return priority?.charAt(0).toUpperCase() + priority?.slice(1) || "";
  };

  const formatSpentTime = (task) => {
    if (!task.created_at || !task.updated_at) return "N/A";
    const start = new Date(task.created_at);
    const end = new Date(task.updated_at);
    const diff = Math.max(0, end.getTime() - start.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ") || "Less than 1m";
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTimeLabel = (timeStr) => {
    if (!timeStr) return "N/A";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });
  };

  // Metrics summary
  const metrics = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === "todo").length,
    doing: filteredTasks.filter(t => t.status === "doing").length,
    done: filteredTasks.filter(t => t.status === "done").length,
    active: filteredTasks.filter(t => t.has_active_timer).length
  };

  const activeTimerTask = tasks.find(t => t.has_active_timer);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    fetchActivities(task.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-1">Manage and track all employee tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">To Do</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.todo}</p>
        </div>
        <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{metrics.doing}</p>
        </div>
        <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Done</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{metrics.done}</p>
        </div>
        <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase">Active Tasks</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">{metrics.active}</p>
        </div>
      </div>

      {activeTimerTask && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-white border border-orange-100 rounded-xl p-4 shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 ring-4 ring-orange-50">
              <TimerIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Currently Active</p>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">{activeTimerTask.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Started at {activeTimerTask.active_timer?.start_time ? new Date(activeTimerTask.active_timer.start_time).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit"
                }) : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTaskClick(activeTimerTask)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-700 text-sm font-semibold border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors shadow-xs"
          >
            <TimerIcon className="w-4 h-4 text-orange-600" />
            <span>View Task</span>
          </button>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by task name, description, or user..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-800"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || isFilterApplied 
                  ? "bg-primary-50 border-primary-300 text-primary-700" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {isFilterApplied && (
                <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Status</option>
                    {uniqueStatuses.map(s => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={e => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Priorities</option>
                    {uniquePriorities.map(p => (
                      <option key={p} value={p}>{getPriorityLabel(p)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Created By</label>
                  <select
                    value={filters.assignedTo}
                    onChange={e => setFilters({ ...filters, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Creators</option>
                    {uniqueCreators.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Created Date</label>
                  <select
                    value={filters.dateRange}
                    onChange={e => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {isFilterApplied && (
                  <div className="flex items-end md:col-span-4">
                    <button
                      onClick={resetFilters}
                      className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4">Task Name</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Project</th>
                <th className="px-6 py-4 text-center">Priority</th>
                <th className="px-6 py-4">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">No tasks found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleTaskClick(task)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${isEven ? "bg-white" : "bg-[#fffdfb]"}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <div className={`w-3 h-3 rounded-full mx-auto border-2 ${
                          task.status === "done" 
                            ? "border-green-500 bg-green-500" 
                            : task.status === "doing" 
                              ? "border-blue-500 bg-blue-500 animate-pulse" 
                              : "border-gray-300"
                        }`} />
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors">
                              {task.title}
                            </h3>
                            {task.has_active_timer && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold border border-orange-200 whitespace-nowrap">
                                <TimerIcon className="w-3 h-3 fill-orange-500 animate-spin" />
                                <span>Active</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {task.description ? task.description.replace(/<[^>]*>/g, "") : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600 italic">
                          {task.project?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                            {task.assigned_user?.name 
                              ? task.assigned_user.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() 
                              : "?"
                            }
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {task.assigned_user?.name || "Unassigned"}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTasks.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(endIndex, filteredTasks.length)}</span> of{" "}
                  <span className="font-semibold">{filteredTasks.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs bg-white" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold border ${
                          currentPage === pageNum
                            ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showDetailModal && selectedTask && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-sm transition-colors text-gray-500 font-semibold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedTask.status)}`}>
                      {getStatusIcon(selectedTask.status)}
                      {getStatusLabel(selectedTask.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Priority</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(selectedTask.priority)}`}>
                      {getPriorityLabel(selectedTask.priority)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700">
                    {selectedTask.description ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedTask.description }} />
                    ) : (
                      <p className="text-gray-400 italic">No description provided</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Assigned To</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedTask.assigned_user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Due Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDateLabel(selectedTask.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Due Time</p>
                    <p className="text-sm font-semibold text-gray-900">{formatTimeLabel(selectedTask.due_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Time Spent</p>
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      {selectedTask.has_active_timer ? (
                        <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-sm border border-orange-100 text-xs font-semibold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                          </span>
                          <Timer startTime={selectedTask.active_timer?.start_time} />
                        </div>
                      ) : selectedTask.status === "done" ? (
                        <span className="text-gray-900 font-bold">{formatSpentTime(selectedTask)}</span>
                      ) : (
                        <span className="text-gray-600 font-semibold">{selectedTask.actual_hours || "0"}h</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTask.has_active_timer && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <TimerIcon className="w-5 h-5 text-orange-600 animate-spin" />
                      <span className="font-semibold">Timer is currently active on this task</span>
                    </div>
                    <p className="text-xs text-orange-700 mt-2">
                      Started: {selectedTask.active_timer?.start_time ? new Date(selectedTask.active_timer.start_time).toLocaleString("en-IN") : ""}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4 tracking-wider">Activity Log</h3>
                  {isActivitiesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-semibold text-xs border border-primary-100">
                              {act.user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-normal">
                              <span className="font-bold">{act.user?.name}</span>{" "}
                              <span className="text-gray-600 font-medium">{act.description}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">
                              {new Date(act.created_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-400 font-medium flex justify-between">
                  <p>Created: {new Date(selectedTask.created_at).toLocaleString("en-IN")}</p>
                  <p>Updated: {new Date(selectedTask.updated_at).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;
