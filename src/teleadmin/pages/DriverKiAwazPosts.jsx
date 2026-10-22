import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from '@teleadmin/router';
import driverKiAwazApi from '../services/api/driverKiAwazApi';
import {
  TrendingUp, Users, RefreshCw, Calendar, Target,
  Search, User, ChevronLeft, ChevronRight, Hash, Database,
  Eye, UserCircle, Briefcase, XCircle, FilterX, Copy, Check,
  ShieldCheck, Play, Download, Trash2, ExternalLink, Plus, AlertTriangle,
  Heart, MessageSquare, Share2, Film, FileImage, FileText, CheckCircle2,
  Clock
} from 'lucide-react-teleadmin';


// Simple Alert Toast component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';

  return (
    <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-2 px-3 py-2 text-white rounded-lg shadow-lg transition-all duration-300 transform translate-y-0 ${bgClass}`}>
      <span className="text-[11px] font-bold uppercase tracking-wide">{message}</span>
      <button onClick={onClose} className="hover:opacity-80 focus:outline-hidden ml-2">
        <XCircle className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);

  const day = date.getDate();
  const year = date.getFullYear();

  const month = date
    .toLocaleString('en-GB', { month: 'long' })
    .toUpperCase();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // convert 0 → 12

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export default function DriverKiAwazPosts() {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status') ?? '';
  const mediaTypeFromUrl = searchParams.get('media_type') ?? '';
  const blueTickFromUrl = searchParams.get('blue_tick') ?? '';

  // State variables
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  // Filters state
  const [filters, setFilters] = useState({
    status: statusFromUrl,
    media_type: mediaTypeFromUrl,
    role: '',
    blue_tick: blueTickFromUrl,
  });

  // Applied filters state (to trigger request)
  const [appliedFilters, setAppliedFilters] = useState({
    status: statusFromUrl,
    media_type: mediaTypeFromUrl,
    role: '',
    blue_tick: blueTickFromUrl,
    page: 1,
  });

  // Modal and creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isBlueTickMode, setIsBlueTickMode] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    media_type: 'text',
    media_url: '',
    caption: '',
    category: 'driver_life',
  });

  // Delete & status toggle confirmation modals
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null); // { id, name, currentStatus }

  // Toast Notification state
  const [toast, setToast] = useState(null); // { message, type }

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.status !== '') params.status = appliedFilters.status;
      if (appliedFilters.media_type !== '') params.media_type = appliedFilters.media_type;
      if (appliedFilters.role !== '') params.role = appliedFilters.role;
      if (appliedFilters.blue_tick !== '') params.blue_tick = appliedFilters.blue_tick;
      params.page = appliedFilters.page;

      const response = await driverKiAwazApi.getPosts(params);
      if (response.success) {
        setPosts(response.posts?.data || []);
        setStats(response.stats || { active: 0, inactive: 0 });
        setPagination({
          current_page: response.posts?.current_page || 1,
          last_page: response.posts?.last_page || 1,
          total: response.posts?.total || 0,
          per_page: response.posts?.per_page || 15,
        });
      } else {
        showToast(response.message || 'Failed to fetch posts', 'error');
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
      showToast('Error loading posts data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  // Load posts on filters/pagination change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: statusFromUrl, media_type: mediaTypeFromUrl, blue_tick: blueTickFromUrl }));
    setAppliedFilters(prev => ({ ...prev, status: statusFromUrl, media_type: mediaTypeFromUrl, blue_tick: blueTickFromUrl, page: 1 }));
  }, [statusFromUrl, mediaTypeFromUrl, blueTickFromUrl]);

  const handleOpenNormalModal = () => {
    setIsBlueTickMode(false);
    setSelectedDriver(null);
    setDriverSearch('');
    setMediaFile(null);
    setFormData({
      media_type: 'text',
      media_url: '',
      caption: '',
      category: 'driver_life',
    });
    setShowCreateModal(true);
  };

  const handleOpenBlueTickModal = () => {
    setIsBlueTickMode(true);
    setSelectedDriver(null);
    setDriverSearch('');
    setMediaFile(null);
    setFormData({
      media_type: 'video',
      media_url: '',
      caption: '',
      category: 'driver_life',
    });
    setShowCreateModal(true);
  };

  // Fetch blue tick driver automatically when in blue tick mode
  useEffect(() => {
    if (showCreateModal && isBlueTickMode) {
      const fetchBlueTickDriver = async () => {
        setDriverLoading(true);
        try {
          const response = await driverKiAwazApi.getDrivers({ search: 'TM2605PYTR59346' });
          if (response.success && response.drivers && response.drivers.length > 0) {
            const driver = response.drivers.find(d => d.unique_id === 'TM2605PYTR59346') || response.drivers[0];
            setSelectedDriver(driver);
            setDriverSearch(`${driver.name} (${driver.unique_id})`);
          } else {
            showToast('Blue tick account TM2605PYTR59346 not found. Please select driver manually.', 'error');
          }
        } catch (error) {
          console.error('Error fetching blue tick driver:', error);
          showToast('Failed to fetch blue tick driver details.', 'error');
        } finally {
          setDriverLoading(false);
        }
      };
      fetchBlueTickDriver();
    }
  }, [showCreateModal, isBlueTickMode]);

  // Fetch drivers list on search
  useEffect(() => {
    if (!showCreateModal) return;

    if (selectedDriver && driverSearch === `${selectedDriver.name} (${selectedDriver.unique_id})`) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setDriverLoading(true);
      try {
        const response = await driverKiAwazApi.getDrivers({ search: driverSearch });
        if (response.success) {
          setDrivers(response.drivers || []);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setDriverLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [driverSearch, showCreateModal, selectedDriver]);

  // Apply filters handler
  const handleApplyFilters = () => {
    setAppliedFilters({
      ...filters,
      page: 1,
    });
  };

  // Reset filters handler
  const handleResetFilters = () => {
    const defaultFilters = { status: '', media_type: '', role: '', blue_tick: '' };
    setFilters(defaultFilters);
    setAppliedFilters({
      ...defaultFilters,
      page: 1,
    });
  };

  // Change page handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setAppliedFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  // Toggle status operation
  const handleToggleStatus = async (id) => {
    try {
      const response = await driverKiAwazApi.togglePostStatus(id);
      if (response.success) {
        showToast(response.message);
        fetchPosts();
      } else {
        showToast(response.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showToast('Error updating post status', 'error');
    } finally {
      setStatusConfirm(null);
    }
  };

  // Delete post operation
  const handleDeletePost = async (id) => {
    try {
      const response = await driverKiAwazApi.deletePost(id);
      if (response.success) {
        showToast(response.message);
        if (posts.length === 1 && appliedFilters.page > 1) {
          setAppliedFilters(prev => ({ ...prev, page: prev.page - 1 }));
        } else {
          fetchPosts();
        }
      } else {
        showToast(response.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      showToast('Error deleting post', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Create new post form submission
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver) {
      showToast('Please select a driver', 'error');
      return;
    }
    if (!formData.caption.trim()) {
      showToast('Please enter a caption', 'error');
      return;
    }
    if (formData.media_type !== 'text' && !mediaFile) {
      showToast(`Please select a ${formData.media_type} to upload`, 'error');
      return;
    }
    if (formData.media_type !== 'text' && mediaFile) {
      const maxSizeBytes = 40 * 1024 * 1024; // 40MB
      if (mediaFile.size > maxSizeBytes) {
        showToast(`Selected file is too large (${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 40 MB.`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('user_id', selectedDriver.id);
      payload.append('media_type', formData.media_type);
      payload.append('caption', formData.caption);
      payload.append('category', formData.category);
      
      if (formData.media_type !== 'text' && mediaFile) {
        payload.append('media_file', mediaFile);
      }

      const response = await driverKiAwazApi.createPost(payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.success) {
        showToast('Post created successfully!');
        setShowCreateModal(false);
        // Reset form
        setSelectedDriver(null);
        setDriverSearch('');
        setMediaFile(null);
        setFormData({ media_type: 'text', media_url: '', caption: '', category: 'driver_life' });
        fetchPosts();
      } else {
        showToast(response.message || 'Failed to create post', 'error');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error creating post';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="text-2xl">🚚</span> Driver Ki Awaz - Posts Management
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            Dashboard / <span className="text-indigo-600 font-bold">Driver Ki Awaz</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenBlueTickModal}
            className="h-8 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            Blue Tick Post
          </button>
          <button
            onClick={handleOpenNormalModal}
            className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            New Post
          </button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-none mb-1">Active Posts</p>
            <p className="text-lg font-black text-slate-900 leading-none">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-4 h-4 text-rose-600" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-none mb-1">Inactive Posts</p>
            <p className="text-lg font-black text-slate-900 leading-none">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Main Database Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
        {/* Card Header */}
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Driver Posts Database</span>
            {pagination.total > 0 && (
              <span className="bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-sm text-[9px] font-bold ml-1 uppercase">
                {pagination.total} total
              </span>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <FilterSelect
              icon={ShieldCheck}
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="h-8 text-[11px]"
            >
              <option value="">Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </FilterSelect>

            <FilterSelect
              icon={Database}
              value={filters.media_type}
              onChange={(e) => setFilters(prev => ({ ...prev, media_type: e.target.value }))}
              className="h-8 text-[11px]"
            >
              <option value="">Media Type</option>
              <option value="text">Text Only</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </FilterSelect>

            <FilterSelect
              icon={Briefcase}
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="h-8 text-[11px]"
            >
              <option value="">Role</option>
              <option value="driver">Driver</option>
              <option value="foreman">Foreman</option>
              <option value="transporter">Transporter</option>
            </FilterSelect>

            <FilterSelect
              icon={CheckCircle2}
              value={filters.blue_tick}
              onChange={(e) => setFilters(prev => ({ ...prev, blue_tick: e.target.value }))}
              className="h-8 text-[11px]"
            >
              <option value="">Account Type</option>
              <option value="1">Blue Tick Only</option>
            </FilterSelect>

            <button
              onClick={handleResetFilters}
              className="h-8 px-3 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 text-[10px] font-bold uppercase transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="h-8 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[10px] font-bold uppercase transition-all shadow-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto min-h-[400px] w-full bg-white">
          {loading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="animate-spin h-8 w-8 text-indigo-600 mb-3" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fetching latest posts data...</span>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4">
              <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto mb-3">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mb-2">No matching posts found</p>
              <button
                onClick={handleResetFilters}
                className="text-indigo-600 font-bold text-[9px] uppercase hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            /* Table */
            <table className="w-full text-left border-collapse border border-slate-200/60">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="pl-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60 w-12">#</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">User Info</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Role</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60 w-72">Caption</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Category</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Media</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60 text-center">Status</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Engagement</th>
                  <th className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Posted Date</th>
                  <th className="pr-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post, index) => {
                  const rowNumber = (pagination.current_page - 1) * pagination.per_page + index + 1;
                  return (
                    <tr key={post.id} className="odd:bg-white even:bg-slate-200/50 hover:bg-indigo-50/50 transition-colors group">
                      <td className="pl-4 py-1.5 border-r border-slate-200/60 text-[11px] font-bold text-slate-400">{rowNumber}</td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        <div className="font-bold text-slate-800 text-[12px] truncate max-w-[120px]">{post.user_name || 'N/A'}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase truncate">{post.unique_id || ''}</div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        {post.role ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500">
                            {post.role}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        <div className="text-[11px] text-slate-600 font-bold leading-tight max-w-[280px] line-clamp-2" title={post.caption}>
                          {post.caption}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        <span className="inline-block px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-bold uppercase tracking-wider">
                          {post.category || 'Driver Life'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider border ${
                          post.media_type === 'video' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          post.media_type === 'image' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {post.media_type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60 text-center">
                        <button
                          onClick={() => setStatusConfirm({ id: post.id, name: post.user_name || 'N/A', currentStatus: post.status })}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            post.status == 1 ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              post.status == 1 ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center px-1 py-0.5 rounded-sm bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-100">
                            ❤️ {post.likes_count || 0}
                          </span>
                          <span className="inline-flex items-center px-1 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-100">
                            💬 {post.comments_count || 0}
                          </span>
                          <span className="inline-flex items-center px-1 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">
                            🔗 {post.shares_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-200/60 text-[10px] text-slate-500 font-bold">
                        {post.created_at ? formatDate(post.created_at) : 'N/A'}
                      </td>
                      <td className="pr-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {post.media_url && (
                            <a
                              href={post.media_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded-sm transition-colors"
                              title="View Media File"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {/* <button
                            onClick={() => setDeleteConfirmId(post.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-sm transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Compact Pagination */}
        {!loading && pagination.last_page > 1 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Total: {pagination.total} Records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-black text-slate-700 px-2">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Compact Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {isBlueTickMode ? 'Create Blue Tick Post' : 'Create New Driver Post'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Select Driver Autocomplete */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assign to Driver (Search)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by Driver Name or TMID..."
                      value={driverSearch}
                      onChange={(e) => {
                        setDriverSearch(e.target.value);
                        if (selectedDriver) setSelectedDriver(null);
                      }}
                      className={`w-full py-1.5 px-3 bg-white border rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        selectedDriver ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'
                      }`}
                    />
                    {driverLoading && (
                      <div className="absolute right-3 top-2">
                        <RefreshCw className="animate-spin h-4 w-4 text-indigo-500" />
                      </div>
                    )}
                  </div>

                  {/* Driver Suggestions List */}
                  {driverSearch && !selectedDriver && (
                    <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg divide-y divide-slate-100 max-w-[464px]">
                      {driverLoading ? (
                        <div className="px-3 py-2 text-[10px] text-slate-400 font-bold">Searching drivers...</div>
                      ) : drivers.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-rose-500 font-bold">No drivers found matching search.</div>
                      ) : (
                        drivers.map(driver => (
                          <button
                            key={driver.id}
                            type="button"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setDriverSearch(`${driver.name} (${driver.unique_id})`);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between font-medium"
                          >
                            <span className="font-bold text-slate-700">{driver.name}</span>
                            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">{driver.unique_id}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedDriver && (
                    <p className="mt-1 text-[10px] text-emerald-600 font-bold">
                      ✓ Selected: {selectedDriver.name} ({selectedDriver.unique_id})
                    </p>
                  )}
                </div>

                {/* Media Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Media Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['text', 'image', 'video'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, media_type: type }))}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border capitalize transition-all ${
                          formData.media_type === type
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'driver_life', label: 'Driver Life', icon: '🚛' },
                      { id: 'govt_demand', label: 'Govt Demand', icon: '🏛️' },
                      { id: 'road_issues', label: 'Road Issues', icon: '🛣️' },
                      { id: 'rto_issues', label: 'RTO Issues', icon: '📋' },
                      { id: 'welfare_rights', label: 'Welfare Rights', icon: '⚖️' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 ${
                          formData.category === cat.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-600'
                        }`}
                      >
                        <span className="text-xs">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media File Upload */}
                {formData.media_type !== 'text' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Upload {formData.media_type}
                    </label>
                    <div className="relative border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-4 bg-slate-55/50 hover:bg-slate-50 text-center cursor-pointer transition-all">
                      <input
                        type="file"
                        accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                        onChange={(e) => setMediaFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <Plus className="mx-auto h-6 w-6 text-slate-400" />
                        <div className="text-xs text-slate-600 font-bold">
                          {mediaFile ? 'Change file' : 'Upload a file'}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">
                          {mediaFile ? `${mediaFile.name} (${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)` : `Select ${formData.media_type}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caption Textarea */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Caption</label>
                  <textarea
                    placeholder="Write driver story/post caption..."
                    rows="3"
                    value={formData.caption}
                    onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 resize-none font-medium"
                    maxLength="1000"
                    required
                  ></textarea>
                  <div className="flex justify-end text-[9px] text-slate-400 font-bold mt-0.5">
                    {formData.caption.length}/1000 chars
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  {submitting && <RefreshCw className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" />}
                  Submit Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE MODAL */}
      {statusConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-4 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                statusConfirm.currentStatus == 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Confirm Status {statusConfirm.currentStatus == 1 ? 'Deactivation' : 'Activation'}
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to change the status of <strong>{statusConfirm.name}</strong>'s post?
                  {statusConfirm.currentStatus == 0 && (
                    <span className="block mt-1 font-bold text-indigo-600 bg-indigo-50 p-2 rounded-sm border border-indigo-100 text-[10px] uppercase">
                      📢 Activating will trigger push notifications to all users' devices.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(statusConfirm.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-all ${
                  statusConfirm.currentStatus == 1 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm Toggle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase">Delete Post Confirmation</h3>
                <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">
                  Are you sure you want to permanently delete this post? This will delete all likes, comments, and shares associated with it. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small filter select component
const FilterSelect = ({ icon: Icon, children, className, ...props }) => (
  <div className={`relative group flex-1 ${className}`}>
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
    <select
      className="w-full !pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-hidden transition-all appearance-none cursor-pointer"
      {...props}
    >
      {children}
    </select>
    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-slate-400" />
  </div>
);
