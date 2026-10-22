import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Search,
  Filter,
  RotateCw,
  Plus,
  BadgeCheck,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink,
  Check,
  X,
  Download,
  AlertCircle,
  Video,
  Image as ImageIcon,
  FileText,
  User,
  ShieldCheck,
  MapPin,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Radio
} from 'lucide-react';

export default function DriverKiAwaz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'posts';

  // Active Tab: 'posts' | 'pending' | 'published' | 'bluetick'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'pending', 'published', 'bluetick'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // State for posts, stats, loading
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    total: 358,
    active: 308,
    pending: 50,
    verified: 24,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [mediaFilter, setMediaFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);

  // Blue Tick Creators
  const [creators, setCreators] = useState([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);

  // Modals
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  const [newPostForm, setNewPostForm] = useState({
    user_id: '',
    media_type: 'video',
    media_url: '',
    category: 'driver_life',
    caption: '',
    active: true
  });
  const [verifyTmidInput, setVerifyTmidInput] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  // Show transient notice
  const notify = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch Posts from API
  const fetchPosts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const params = {
        page: currentPage,
        per_page: perPage,
      };

      if (statusFilter !== 'All') params.status = statusFilter;
      if (mediaFilter !== 'All') params.media_type = mediaFilter;
      if (roleFilter !== 'All') params.role = roleFilter;
      if (accountFilter !== 'All') params.account_type = accountFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/admin/teleadmin/driver-ki-awaz/posts', { params });

      if (res.data?.status === 'success') {
        setPosts(res.data.data || []);
        if (res.data.stats) {
          setStats(prev => ({
            ...prev,
            ...res.data.stats
          }));
        }
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.current_page || 1);
          setTotalPages(res.data.pagination.last_page || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      } else {
        setErrorMessage(res.data?.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching Driver Ki Awaz posts:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Error communicating with backend API');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, perPage, statusFilter, mediaFilter, roleFilter, accountFilter, searchQuery]);

  // Fetch Blue Tick Creators
  const fetchCreators = useCallback(async () => {
    setIsLoadingCreators(true);
    try {
      const res = await api.get('/admin/teleadmin/driver-ki-awaz/blue-tick-creators');
      if (res.data?.status === 'success') {
        setCreators(res.data.creators || []);
        if (res.data.total_verified) {
          setStats(prev => ({ ...prev, verified: res.data.total_verified }));
        }
      }
    } catch (err) {
      console.error('Error fetching blue tick creators:', err);
    } finally {
      setIsLoadingCreators(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (activeTab === 'bluetick') {
      fetchCreators();
    }
  }, [activeTab, fetchCreators]);

  // Toggle Post Status (Active/Inactive)
  const handleToggleStatus = async (post) => {
    const updatedStatus = !post.active;
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, active: updatedStatus, status_label: updatedStatus ? 'Active' : 'Inactive' } : p));
    setStats(prev => ({
      ...prev,
      active: updatedStatus ? prev.active + 1 : Math.max(0, prev.active - 1),
      pending: updatedStatus ? Math.max(0, prev.pending - 1) : prev.pending + 1
    }));

    try {
      const res = await api.post(`/admin/teleadmin/driver-ki-awaz/toggle-status/${post.id}`, {
        active: updatedStatus
      });
      if (res.data?.status === 'success') {
        notify(`Post #${post.id} ${updatedStatus ? 'approved and published live' : 'moved to pending queue'}`);
        if (res.data.stats) {
          setStats(prev => ({ ...prev, ...res.data.stats }));
        }
      } else {
        fetchPosts(true);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      notify('Failed to update post status on server', 'error');
      fetchPosts(true);
    }
  };

  // Single Approve
  const handleApproveSingle = async (postId) => {
    try {
      const res = await api.post(`/admin/teleadmin/driver-ki-awaz/toggle-status/${postId}`, {
        action: 'activate'
      });
      if (res.data?.status === 'success') {
        notify(`Post #${postId} approved and published live!`);
        fetchPosts(true);
      }
    } catch (err) {
      notify('Could not approve post', 'error');
    }
  };

  // Single Reject / Delete
  const handleRejectPost = async (postId) => {
    if (!window.confirm(`Are you sure you want to decline & remove submission #${postId}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/teleadmin/driver-ki-awaz/${postId}`);
      if (res.data?.status === 'success') {
        notify(`Post #${postId} declined and removed.`);
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (res.data.stats) setStats(prev => ({ ...prev, ...res.data.stats }));
      }
    } catch (err) {
      notify('Could not decline post', 'error');
    }
  };

  // Bulk Approve Pending
  const handleBulkApprove = async () => {
    const pendingCount = stats.pending;
    if (!window.confirm(`Are you sure you want to approve all ${pendingCount} pending posts and publish them live to mobile app?`)) {
      return;
    }
    try {
      const res = await api.post('/admin/teleadmin/driver-ki-awaz/bulk-approve');
      if (res.data?.status === 'success') {
        notify(res.data.message || 'All pending posts approved live!');
        fetchPosts(true);
      }
    } catch (err) {
      notify('Bulk approval failed', 'error');
    }
  };

  // Download Audit CSV
  const handleDownloadCSV = () => {
    const pendingList = posts.filter(p => !p.active);
    if (!pendingList.length) {
      notify('No pending posts in current view to export', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'TMID', 'Role', 'Category', 'Media', 'Caption', 'Date'];
    const rows = pendingList.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.tmid,
      p.role,
      p.category,
      p.media,
      `"${(p.caption || '').replace(/"/g, '""')}"`,
      p.date
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pending_posts_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Audit CSV downloaded successfully!');
  };

  // Toggle Blue Tick Creator
  const handleToggleBlueTick = async (creator) => {
    const newVerified = !creator.verified;
    setCreators(prev => prev.map(c => c.id === creator.id ? { ...c, verified: newVerified } : c));

    try {
      const res = await api.post(`/admin/teleadmin/driver-ki-awaz/toggle-blue-tick/${creator.user_id || creator.id}`);
      if (res.data?.status === 'success') {
        notify(`Blue Tick badge ${newVerified ? 'granted to' : 'revoked from'} ${creator.name}`);
      }
    } catch (err) {
      notify('Failed to update creator verification', 'error');
      fetchCreators();
    }
  };

  // Verify By TMID
  const handleVerifyByTmid = async (e) => {
    e.preventDefault();
    if (!verifyTmidInput.trim()) return;

    try {
      const res = await api.post('/admin/teleadmin/driver-ki-awaz/verify-by-tmid', {
        tmid: verifyTmidInput.trim()
      });
      if (res.data?.status === 'success') {
        notify(res.data.message || 'Account verified successfully!');
        setIsVerifyModalOpen(false);
        setVerifyTmidInput('');
        fetchCreators();
      } else {
        alert(res.data?.message || 'Could not verify TMID');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error granting verification badge');
    }
  };

  // Create New Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostForm.caption.trim()) {
      alert('Please enter a caption for the post');
      return;
    }
    try {
      const res = await api.post('/admin/teleadmin/driver-ki-awaz/store', newPostForm);
      if (res.data?.status === 'success') {
        notify('New Driver Ki Awaz post published successfully!');
        setIsNewPostModalOpen(false);
        setNewPostForm({
          user_id: '',
          media_type: 'video',
          media_url: '',
          category: 'driver_life',
          caption: '',
          active: true
        });
        fetchPosts(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish post');
    }
  };

  // Filtered views based on tab
  const displayedPosts = useMemo(() => {
    if (activeTab === 'pending') {
      return posts.filter(p => !p.active);
    }
    if (activeTab === 'published') {
      return posts.filter(p => p.active);
    }
    return posts;
  }, [posts, activeTab]);

  // Badges helper
  const renderMediaBadge = (media) => {
    const m = (media || '').toUpperCase();
    if (m === 'VIDEO') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded">
          <Video className="w-3 h-3 text-amber-600" /> VIDEO
        </span>
      );
    }
    if (m === 'IMAGE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">
          <ImageIcon className="w-3 h-3 text-indigo-600" /> IMAGE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded">
        <FileText className="w-3 h-3 text-slate-500" /> TEXT
      </span>
    );
  };

  const renderCategoryBadge = (category) => {
    const c = (category || '').toUpperCase();
    if (c.includes('ROAD')) {
      return <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded">{category}</span>;
    }
    if (c.includes('WELFARE') || c.includes('RIGHTS')) {
      return <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded">{category}</span>;
    }
    if (c.includes('GOVT') || c.includes('DEMAND')) {
      return <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded">{category}</span>;
    }
    return <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">{category}</span>;
  };

  // Subview dynamic breadcrumb
  const getSubviewTitle = () => {
    switch (activeTab) {
      case 'pending': return `PENDING APPROVAL (${stats.pending})`;
      case 'published': return `PUBLISHED POSTS (${stats.active})`;
      case 'bluetick': return `VERIFIED BLUE TICK CREATORS (${stats.verified})`;
      default: return `ALL POSTS DATABASE (${stats.total})`;
    }
  };

  const getMainHeading = () => {
    switch (activeTab) {
      case 'pending': return 'Driver Ki Awaz - Pending Approval Queue';
      case 'published': return 'Driver Ki Awaz - Published Live Posts';
      case 'bluetick': return 'Driver Ki Awaz - Blue Tick Accounts';
      default: return 'Driver Ki Awaz - Posts Management';
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Transient Action Notice */}
      {actionNotice && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold transition-all ${
          actionNotice.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {actionNotice.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* BEGIN: PageHeaderSection */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🚚</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {getMainHeading()}
            </h1>
          </div>
          {/* Breadcrumb navigation */}
          <div className="flex items-center space-x-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>DASHBOARD</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600 font-bold">DRIVER KI AWAZ</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-bold">{getSubviewTitle()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              switchTab('bluetick');
              setIsVerifyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
          >
            <BadgeCheck className="w-4 h-4" />
            <span>BLUE TICK POST</span>
          </button>
          <button
            onClick={() => setIsNewPostModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW POST</span>
          </button>
        </div>
      </section>

      {/* BEGIN: Primary View Switcher Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {/* Tab 1: Posts */}
          <button
            onClick={() => switchTab('posts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'font-bold bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200/60'
                : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>1. All Posts</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-600 text-white">
              {stats.total}
            </span>
          </button>

          {/* Tab 2: Pending Approval */}
          <button
            onClick={() => switchTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'font-bold bg-amber-50 text-amber-800 shadow-xs border border-amber-200/80'
                : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>2. Pending Approval</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
              {stats.pending}
            </span>
          </button>

          {/* Tab 3: Published Posts */}
          <button
            onClick={() => switchTab('published')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'published'
                ? 'font-bold bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>3. Published Posts</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              {stats.active}
            </span>
          </button>

          {/* Tab 4: Blue Tick Accounts */}
          <button
            onClick={() => switchTab('bluetick')}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === 'bluetick'
                ? 'font-bold bg-sky-50 text-sky-800 shadow-xs border border-sky-200'
                : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BadgeCheck className="w-4 h-4 text-sky-600" />
            <span>4. Blue Tick Accounts</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-sky-100 text-sky-700 border border-sky-200">
              {stats.verified}
            </span>
          </button>
        </div>

        {/* Quick status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Auto-Sync Live</span>
          <button
            onClick={() => fetchPosts(true)}
            title="Refresh database records"
            className="p-1 hover:text-indigo-600 transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* BEGIN: MetricCardsSection */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Database Posts */}
        <div
          onClick={() => switchTab('posts')}
          className={`bg-white border-2 rounded-xl p-4 flex items-center space-x-3.5 cursor-pointer hover:shadow-xs transition duration-150 ${
            activeTab === 'posts' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL POSTS</div>
            <div className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.total}</div>
          </div>
        </div>

        {/* Active / Published Posts Card */}
        <div
          onClick={() => switchTab('published')}
          className={`bg-white border-2 rounded-xl p-4 flex items-center space-x-3.5 cursor-pointer hover:shadow-xs transition duration-150 ${
            activeTab === 'published' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTIVE POSTS</div>
            <div className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.active}</div>
          </div>
        </div>

        {/* Inactive / Pending Posts Card */}
        <div
          onClick={() => switchTab('pending')}
          className={`bg-white border-2 rounded-xl p-4 flex items-center space-x-3.5 cursor-pointer hover:shadow-xs transition duration-150 ${
            activeTab === 'pending' ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PENDING REVIEW</div>
            <div className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.pending}</div>
          </div>
        </div>

        {/* Blue Tick Verified Accounts Card */}
        <div
          onClick={() => switchTab('bluetick')}
          className={`bg-white border-2 rounded-xl p-4 flex items-center space-x-3.5 cursor-pointer hover:shadow-xs transition duration-150 ${
            activeTab === 'bluetick' ? 'border-sky-500 bg-sky-50/20' : 'border-slate-200 hover:border-sky-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">VERIFIED CREATORS</div>
            <div className="text-2xl font-black text-slate-900 leading-none mt-1">{stats.verified}</div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* VIEW 1: ALL POSTS DATABASE VIEW */}
      {/* ======================================================== */}
      {activeTab === 'posts' && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Filter Toolbar Area */}
          <div className="p-4 border-b border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DRIVER POSTS DATABASE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  {totalRecords} TOTAL
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Showing active & inactive posts across all India logistics hubs
              </div>
            </div>

            {/* Dropdowns & Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-center">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search TMID, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Filter: Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="All">Status (All)</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Filter: Media Type */}
              <div className="relative">
                <select
                  value={mediaFilter}
                  onChange={(e) => setMediaFilter(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="All">Media Type</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="TEXT">Text</option>
                </select>
              </div>

              {/* Filter: Role */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="All">Role</option>
                  <option value="DRIVER">Driver</option>
                  <option value="TRANSPORTER">Transporter</option>
                  <option value="FOREMAN">Foreman</option>
                </select>
              </div>

              {/* Filter: Account Type */}
              <div className="relative">
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="All">Account Type</option>
                  <option value="Standard">Standard</option>
                  <option value="BlueTick">Blue Tick Verified</option>
                </select>
              </div>

              {/* Action Buttons: Reset & Apply */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setMediaFilter('All');
                    setRoleFilter('All');
                    setAccountFilter('All');
                  }}
                  className="w-1/2 py-2 px-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                >
                  RESET
                </button>
                <button
                  onClick={() => fetchPosts()}
                  className="w-1/2 py-2 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition active:scale-95 cursor-pointer"
                >
                  APPLY
                </button>
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[170px]">USER INFO</th>
                  <th className="py-3 px-3 text-center">ROLE</th>
                  <th className="py-3 px-4 min-w-[240px] max-w-sm">CAPTION</th>
                  <th className="py-3 px-3 text-center">CATEGORY</th>
                  <th className="py-3 px-3 text-center">MEDIA</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">ENGAGEMENT</th>
                  <th className="py-3 px-4 text-left">POSTED DATE</th>
                  <th className="py-3 px-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading Driver Ki Awaz posts from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedPosts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400 font-medium">
                      No posts found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  displayedPosts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-b-0">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {(currentPage - 1) * perPage + index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 leading-tight">{item.name}</span>
                          {item.accountType === 'BlueTick' && (
                            <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 fill-current" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">{item.tmid}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded">
                          {item.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        <div className="line-clamp-2 max-w-sm font-normal text-slate-600" title={item.caption || '-'}>
                          {item.caption || <span className="text-slate-300">—</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderCategoryBadge(item.category)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderMediaBadge(item.media)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={() => handleToggleStatus(item)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-medium border border-rose-100">
                            ❤️ <span>{item.likes}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">
                            💬 <span>{item.comments}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-100">
                            🔗 <span>{item.shares}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-left font-medium text-slate-500 text-[11px] whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPostDetail(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="View Post Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-500 tracking-wide">
              TOTAL: {totalRecords} RECORDS
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2 py-0.5 bg-white border border-slate-200 rounded">
                {currentPage} / {Math.max(1, totalPages)}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: PENDING APPROVAL VIEW */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Review Queue Header banner */}
          <div className="p-4 bg-amber-50/60 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold text-base">
                ⏳
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Posts Pending Moderation & Verification
                </h2>
                <p className="text-[11px] text-slate-600">
                  {stats.pending} submissions currently in inactive status awaiting compliance approval before going live to Driver Ki Awaz app feed.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
              >
                Approve All Visible
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Audit CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[170px]">USER INFO</th>
                  <th className="py-3 px-3 text-center">ROLE</th>
                  <th className="py-3 px-4 min-w-[240px] max-w-sm">CAPTION</th>
                  <th className="py-3 px-3 text-center">CATEGORY</th>
                  <th className="py-3 px-3 text-center">MEDIA</th>
                  <th className="py-3 px-3 text-center">CURRENT STATUS</th>
                  <th className="py-3 px-4 text-left">SUBMITTED DATE</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">MODERATION ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {displayedPosts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                      🎉 Queue is completely clear! No pending submissions awaiting moderation.
                    </td>
                  </tr>
                ) : (
                  displayedPosts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{index + 1}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">{item.tmid}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded">
                          {item.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        <div className="line-clamp-2 max-w-sm font-normal text-slate-600">
                          {item.caption ? item.caption : <span className="text-slate-300 italic">No text caption (Media submission)</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderCategoryBadge(item.category)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderMediaBadge(item.media)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> PENDING REVIEW
                        </span>
                      </td>

                      <td className="py-3 px-4 text-left font-medium text-slate-500 text-[11px] whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApproveSingle(item.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition cursor-pointer"
                            title="Approve Post"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectPost(item.id)}
                            className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition cursor-pointer"
                            title="Reject Submission"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-semibold text-amber-800 tracking-wide">
              QUEUE: {displayedPosts.length} PENDING REVIEW POSTS
            </div>
            <div className="text-xs text-slate-500">
              Average approval turnaround: <span className="font-bold text-slate-700">1.8 hrs</span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: PUBLISHED POSTS VIEW */}
      {/* ======================================================== */}
      {activeTab === 'published' && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Live Posts Banner */}
          <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                🟢
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live & Published Posts Feed
                </h2>
                <p className="text-[11px] text-slate-600">
                  {stats.active} verified posts currently active and receiving driver community engagement in the mobile application.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-white border border-emerald-200 text-emerald-700 rounded-lg shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 94.2% Driver Satisfaction Rate
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[170px]">USER INFO</th>
                  <th className="py-3 px-3 text-center">ROLE</th>
                  <th className="py-3 px-4 min-w-[240px] max-w-sm">CAPTION</th>
                  <th className="py-3 px-3 text-center">CATEGORY</th>
                  <th className="py-3 px-3 text-center">MEDIA</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">ENGAGEMENT STATS</th>
                  <th className="py-3 px-4 text-left">PUBLISHED DATE</th>
                  <th className="py-3 px-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {displayedPosts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400 font-medium">
                      No published posts currently available.
                    </td>
                  </tr>
                ) : (
                  displayedPosts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{index + 1}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800 leading-tight">{item.name}</span>
                          <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 fill-current" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">{item.tmid}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded">
                          {item.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        <div className="line-clamp-2 max-w-sm font-normal text-slate-600">
                          {item.caption || <span className="text-slate-300">—</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderCategoryBadge(item.category)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {renderMediaBadge(item.media)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={() => handleToggleStatus(item)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-semibold border border-rose-100">
                            ❤️ {item.likes}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-100">
                            💬 {item.comments}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-semibold border border-emerald-100">
                            🔗 {item.shares}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-left font-medium text-slate-500 text-[11px] whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedPostDetail(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="Open Post Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-semibold text-emerald-700 tracking-wide">
              ACTIVE FEED: {displayedPosts.length} PUBLISHED POSTS
            </div>
            <div className="text-xs text-slate-500">
              Community Engagement Pulse: <span className="font-bold text-emerald-600">Active High</span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: BLUE TICK ACCOUNTS VIEW */}
      {/* ======================================================== */}
      {activeTab === 'bluetick' && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Blue Tick Top Summary Banner */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <BadgeCheck className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                    Blue Tick Verified Creator & Driver Profiles
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                    {stats.verified} VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-influence fleet drivers, road safety advocates, and certified transporter community leads.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsVerifyModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Verify New Account</span>
              </button>
            </div>
          </div>

          {/* Blue Tick Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[200px]">CREATOR / DRIVER INFO</th>
                  <th className="py-3 px-3 text-center">ROLE</th>
                  <th className="py-3 px-4">LOCATION & ROUTE</th>
                  <th className="py-3 px-3 text-center">COMMUNITY FOLLOWERS</th>
                  <th className="py-3 px-3 text-center">TOTAL POSTS</th>
                  <th className="py-3 px-3 text-center">ENGAGEMENT RATE</th>
                  <th className="py-3 px-3 text-center">VERIFIED BADGE</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoadingCreators ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      Loading verified accounts...
                    </td>
                  </tr>
                ) : creators.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                      No blue tick verified creator profiles found.
                    </td>
                  </tr>
                ) : (
                  creators.map((creator, index) => (
                    <tr key={creator.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{index + 1}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-indigo-50">
                            {creator.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-900">{creator.name}</span>
                              <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 fill-current" />
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{creator.tmid}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded">
                          {creator.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{creator.location}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800 text-xs">{creator.followers}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {creator.totalPosts}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {creator.engagement}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={creator.verified}
                            onChange={() => handleToggleBlueTick(creator)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => notify(`Viewing community activity for ${creator.name}`)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition cursor-pointer"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-semibold text-sky-800 tracking-wide">
              TOTAL VERIFIED ACCOUNTS: {stats.verified} PROFILES
            </div>
            <div className="text-xs text-slate-500">
              Verified Creator Network: <span className="font-semibold text-slate-700">All India Coverage</span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: NEW POST COMPOSER */}
      {/* ======================================================== */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Publish New Driver Ki Awaz Post</h3>
              </div>
              <button
                onClick={() => setIsNewPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Post Category
                </label>
                <select
                  value={newPostForm.category}
                  onChange={(e) => setNewPostForm({ ...newPostForm, category: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="driver_life">Driver Life & Stories</option>
                  <option value="road_issues">Road Issues & Highway Traffic</option>
                  <option value="welfare_rights">Welfare, Insurance & Rights</option>
                  <option value="govt_demand">Government & Toll Demands</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Media Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['video', 'image', 'text'].map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setNewPostForm({ ...newPostForm, media_type: type })}
                      className={`py-2 text-xs font-bold uppercase rounded-lg border text-center transition cursor-pointer ${
                        newPostForm.media_type === type
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {newPostForm.media_type !== 'text' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Media URL / Storage Path
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or relative path"
                    value={newPostForm.media_url}
                    onChange={(e) => setNewPostForm({ ...newPostForm, media_url: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caption / Message Content *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter community update message..."
                  value={newPostForm.caption}
                  onChange={(e) => setNewPostForm({ ...newPostForm, caption: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newPostForm.active}
                    onChange={(e) => setNewPostForm({ ...newPostForm, active: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Publish directly (Status: Active)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewPostModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
                  >
                    Publish Post
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: VERIFY NEW ACCOUNT BY TMID */}
      {/* ======================================================== */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-sky-600 fill-current" />
                <h3 className="font-bold text-sm text-slate-900">Grant Blue Tick Verification</h3>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyByTmid} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Enter the Driver or Transporter's unique TMID (e.g., <span className="font-mono font-bold text-slate-800">TM2609MPDR400974</span>) to grant the official Blue Tick badge on their community profile.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User TMID / Member Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="TM26..."
                  value={verifyTmidInput}
                  onChange={(e) => setVerifyTmidInput(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-semibold rounded-lg border border-slate-200 py-2.5 px-3 uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
                >
                  Verify Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: POST DETAILS & MEDIA PREVIEW */}
      {/* ======================================================== */}
      {selectedPostDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Post #{selectedPostDetail.id} Details
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  selectedPostDetail.active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedPostDetail.active ? 'PUBLISHED' : 'PENDING'}
                </span>
              </div>
              <button
                onClick={() => setSelectedPostDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Creator details */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {selectedPostDetail.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-bold text-xs text-slate-900">
                      <span>{selectedPostDetail.name}</span>
                      {selectedPostDetail.accountType === 'BlueTick' && (
                        <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-current" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{selectedPostDetail.tmid}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                    {selectedPostDetail.role}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">{selectedPostDetail.date}</div>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Message / Caption
                </label>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {selectedPostDetail.caption || 'No caption provided.'}
                </p>
              </div>

              {/* Media URL if exists */}
              {selectedPostDetail.media_url && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Media Attachment ({selectedPostDetail.media})
                  </label>
                  <a
                    href={selectedPostDetail.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Media ({selectedPostDetail.media_url.substring(0, 45)}...)</span>
                  </a>
                </div>
              )}

              {/* Engagement metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-center">
                  <div className="text-lg font-bold text-rose-600">{selectedPostDetail.likes}</div>
                  <div className="text-[10px] font-bold text-rose-500 uppercase">Likes</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                  <div className="text-lg font-bold text-blue-600">{selectedPostDetail.comments}</div>
                  <div className="text-[10px] font-bold text-blue-500 uppercase">Comments</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-lg font-bold text-emerald-600">{selectedPostDetail.shares}</div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase">Shares</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(selectedPostDetail);
                    setSelectedPostDetail(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedPostDetail.active
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {selectedPostDetail.active ? 'Deactivate Post' : 'Approve & Publish'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPostDetail(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
