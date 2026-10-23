import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Video,
  Film,
  Sparkles,
  Heart,
  Tv,
  FolderPlus,
  PlayCircle,
  Clock,
  ThumbsUp,
  MessageSquare,
  FileText,
  Tags,
  Image,
  HelpCircle,
  Search,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  ArrowLeft,
  X,
  Play,
  Pause,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Quote,
  Table,
  Upload,
  Check,
  ChevronRight
} from 'lucide-react';

export default function SocialCommunicationHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route path mappings for instantaneous single-click navigation
  const tabToPathMap = {
    'whatsapp': '/whatsapp-groups',
    'blogs-list': '/blogs',
    'add-blog': '/add-blog',
    'blog-categories': '/blog-categories',
    'banners-list': '/banners',
    'create-banner': '/create-banner',
    'quiz': '/quiz',
    'driver-videos': '/driver-videos'
  };

  // Resolve active tab from current location pathname or query
  const getTabFromLocation = (pathname, query) => {
    if (pathname.includes('/blog-categories')) return 'blog-categories';
    if (pathname.includes('/add-blog')) return 'add-blog';
    if (pathname.includes('/blogs')) return 'blogs-list';
    if (pathname.includes('/create-banner')) return 'create-banner';
    if (pathname.includes('/banners')) return 'banners-list';
    if (pathname.includes('/quiz')) return 'quiz';
    if (pathname.includes('/driver-video') || pathname.includes('/videos') || pathname.includes('/video')) return 'driver-videos';
    if (pathname.includes('/whatsapp')) return 'whatsapp';

    const paramTab = query?.get('tab');
    if (paramTab) {
      if (paramTab === 'blogs') return 'blogs-list';
      if (paramTab === 'banners') return 'banners-list';
      if (paramTab === 'video' || paramTab === 'videos' || paramTab === 'driver-videos') return 'driver-videos';
      return paramTab;
    }
    return 'whatsapp';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromLocation(location.pathname, searchParams));
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Synchronize when the location pathname changes (e.g. browser back/forward or sidebar click)
  useEffect(() => {
    const nextTab = getTabFromLocation(location.pathname, searchParams);
    setActiveTab(nextTab);
  }, [location.pathname, searchParams]);

  // Clean, instantaneous single-click tab switch
  const switchTab = (tabId) => {
    setActiveTab(tabId);
    const targetPath = tabToPathMap[tabId];
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // ==========================================
  // DATASETS (Pre-seeded strictly from HTML)
  // ==========================================

  // Tab 1: WhatsApp Groups (8 records)
  const [whatsappGroups, setWhatsappGroups] = useState([]);

  const [whatsappSearch, setWhatsappSearch] = useState('');
  const [whatsappPageSize, setWhatsappPageSize] = useState(10);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    type: 'Driver',
    max_count: 1024,
    link: ''
  });

  // Tab 2 & 3: Blogs (6 records)
  const [blogsList, setBlogsList] = useState([]);

  const [blogsSearch, setBlogsSearch] = useState('');
  const [blogForm, setBlogForm] = useState({
    category: 'Truck',
    name: '',
    slug: '',
    publish_option: 'Publish',
    description: ''
  });

  // Tab 4: Blog Categories (3 records)
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Tab 5 & 6: Banners (4 records)
  const [bannersList, setBannersList] = useState([]);
  const [bannersSearch, setBannersSearch] = useState('');
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    redirect_page: 'Job Listings',
    media_type: 'Image',
    user_type: 'Driver',
    status: 'Active'
  });

  // Tab 7: Quiz Form
  const [quizForm, setQuizForm] = useState({
    module: 'Driver Safety & Traffic Rules',
    topic: 'Highway Night Driving Protocols',
    question: '',
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
    answer: ''
  });

  // ==========================================
  // Tab 8: Driver Video States & Datasets
  // ==========================================
  const [videoSubTab, setVideoSubTab] = useState('video'); // 'video' | 'module' | 'moduletopic' | 'healthhygiene' | 'driverwelfare'

  const [driverVideos, setDriverVideos] = useState([]);

  const [videoModules, setVideoModules] = useState([]);

  const [videoTopics, setVideoTopics] = useState([]);

  const [healthHygieneVideos, setHealthHygieneVideos] = useState([]);
  const [welfareVideos, setWelfareVideos] = useState([]);

  // Video Search & Pagination
  const [videoSearch, setVideoSearch] = useState('');
  const [videoPageSize, setVideoPageSize] = useState(10);
  const [videoCurrentPage, setVideoCurrentPage] = useState(1);

  const [moduleSearch, setModuleSearch] = useState('');
  const [modulePageSize, setModulePageSize] = useState(10);

  const [topicSearch, setTopicSearch] = useState('');
  const [topicPageSize, setTopicPageSize] = useState(10);

  const [healthSearch, setHealthSearch] = useState('');
  const [healthPageSize, setHealthPageSize] = useState(10);

  // Forms
  const [videoForm, setVideoForm] = useState({
    module: '3',
    topic: '3',
    video_title_name: '',
    video_file: null,
    video_url: ''
  });

  const [moduleForm, setModuleForm] = useState({ name: '' });
  const [topicForm, setTopicForm] = useState({ mu_id: '1', topic_name: '' });
  const [healthForm, setHealthForm] = useState({
    module: 'Health & Hygiene Module 1',
    topic: '',
    video_title_name: '',
    video_file: null
  });
  const [welfareForm, setWelfareForm] = useState({
    topic: 'Financial Wellness',
    title: '',
    video_file: null,
    thumbnail_file: null
  });

  // Video Player Modal
  const [activeVideoPlayerModal, setActiveVideoPlayerModal] = useState(null);

  // Handlers connected to live backend APIs
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name || !groupForm.link) {
      showToast('Please enter Group Name and WhatsApp Link');
      return;
    }
    const newG = {
      id: Date.now(),
      name: groupForm.name,
      type: groupForm.type,
      link: groupForm.link,
      max_count: Number(groupForm.max_count) || 1024,
      status: 'Active'
    };
    setWhatsappGroups([newG, ...whatsappGroups]);
    setCreateGroupModalOpen(false);
    setGroupForm({ name: '', type: 'Driver', max_count: 1024, link: '' });
    showToast(`WhatsApp Group "${newG.name}" created successfully!`);

    try {
      const res = await api.post('/admin/whatsapp-groups', {
        name: newG.name,
        group_type: newG.type.toLowerCase(),
        whatsapp_group_link: newG.link,
        max_members: newG.max_count,
        status: 'active'
      });
      if (res.data && res.data.data && res.data.data.id) {
        setWhatsappGroups(prev => prev.map(g => g.id === newG.id ? { ...g, id: res.data.data.id } : g));
      }
    } catch (err) {
      console.warn('API error saving group:', err);
    }
  };

  const handleDeleteGroup = async (id) => {
    setWhatsappGroups(prev => prev.filter(g => g.id !== id));
    showToast('WhatsApp Group deleted');
    try {
      await api.delete(`/admin/whatsapp-groups/${id}`);
    } catch (err) {
      console.warn('API error deleting group:', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    const tempId = Date.now();
    const newCat = { id: tempId, name: catName, blogs_count: 0 };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    showToast(`Category "${newCat.name}" added successfully!`);

    try {
      const res = await api.post('/admin/blog-categories', { cat_name: catName });
      if (res.data && res.data.data && res.data.data.id) {
        setCategories(prev => prev.map(c => c.id === tempId ? { ...c, id: res.data.data.id } : c));
      }
    } catch (err) {
      console.warn('API error creating category:', err);
    }
  };

  const handleDeleteCategory = async (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category deleted');
    try {
      await api.delete(`/admin/blog-categories/${id}`);
    } catch (err) {
      console.warn('API error deleting category:', err);
    }
  };

  const handleCreateBlogSubmit = async (e) => {
    e.preventDefault();
    if (!blogForm.name) {
      showToast('Please enter Blog Name');
      return;
    }
    const tempId = Date.now();
    const newB = {
      id: tempId,
      title: blogForm.name,
      status: 'Live',
      publish_time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      category: blogForm.category
    };
    setBlogsList([newB, ...blogsList]);
    switchTab('blogs-list');
    showToast(`Blog "${newB.title}" published successfully!`);

    try {
      const res = await api.post('/admin/blogs', {
        title: blogForm.name,
        category: blogForm.category,
        description: blogForm.description,
        status: blogForm.publish_option === 'Publish' ? 'Live' : 'Draft'
      });
      if (res.data && res.data.data && res.data.data.id) {
        setBlogsList(prev => prev.map(b => b.id === tempId ? { ...b, id: res.data.data.id } : b));
      }
    } catch (err) {
      console.warn('API error publishing blog:', err);
    }
  };

  const handleDeleteBlog = async (id) => {
    setBlogsList(prev => prev.filter(b => b.id !== id));
    showToast('Blog article deleted');
    try {
      await api.delete(`/admin/blogs/${id}`);
    } catch (err) {
      console.warn('API error deleting blog:', err);
    }
  };

  const handleCreateBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title) {
      showToast('Please enter Banner Title');
      return;
    }
    const tempId = Date.now();
    const newBanner = {
      id: tempId,
      title: bannerForm.title,
      type: bannerForm.media_type,
      user_type: bannerForm.user_type,
      status: bannerForm.status,
      created_at: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      updated_at: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    };
    setBannersList([newBanner, ...bannersList]);
    switchTab('banners-list');
    showToast(`Banner "${newBanner.title}" created successfully!`);

    try {
      const res = await api.post('/admin/banners', {
        title: bannerForm.title,
        description: bannerForm.description,
        media_type: bannerForm.media_type.toLowerCase(),
        user_type: bannerForm.user_type.toLowerCase(),
        redirect_link: bannerForm.redirect_page,
        status: bannerForm.status
      });
      if (res.data && res.data.data && res.data.data.id) {
        setBannersList(prev => prev.map(b => b.id === tempId ? { ...b, id: res.data.data.id } : b));
      }
    } catch (err) {
      console.warn('API error creating banner:', err);
    }
  };

  const handleToggleBannerStatus = async (id) => {
    setBannersList(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b));
    showToast('Banner status updated');
    try {
      await api.post(`/admin/banners/${id}/toggle-status`);
    } catch (err) {
      console.warn('API error toggling banner:', err);
    }
  };

  const handleDeleteBanner = async (id) => {
    setBannersList(prev => prev.filter(b => b.id !== id));
    showToast('Banner deleted');
    try {
      await api.delete(`/admin/banners/${id}`);
    } catch (err) {
      console.warn('API error deleting banner:', err);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!quizForm.question || !quizForm.answer) {
      showToast('Please enter question and correct answer');
      return;
    }
    showToast('Quiz question submitted successfully!');
    const payload = {
      module: quizForm.module,
      topic: quizForm.topic,
      question_name: quizForm.question,
      option1: quizForm.opt1,
      option2: quizForm.opt2,
      option3: quizForm.opt3,
      option4: quizForm.opt4,
      Answer: quizForm.answer
    };

    setQuizForm({
      module: 'Driver Safety & Traffic Rules',
      topic: 'Highway Night Driving Protocols',
      question: '',
      opt1: '',
      opt2: '',
      opt3: '',
      opt4: '',
      answer: ''
    });

    try {
      await api.post('/admin/quiz', payload);
    } catch (err) {
      console.warn('API error submitting quiz:', err);
    }
  };

  // Live initial data fetcher across tabs
  useEffect(() => {
    const fetchLiveSocialData = async () => {
      try {
        const [wRes, bRes, cRes, bnRes] = await Promise.allSettled([
          api.get('/admin/whatsapp-groups'),
          api.get('/admin/blogs'),
          api.get('/admin/blog-categories'),
          api.get('/admin/banners'),
        ]);

        if (wRes.status === 'fulfilled' && wRes.value?.data?.status === 'success' && Array.isArray(wRes.value.data.data) && wRes.value.data.data.length > 0) {
          setWhatsappGroups(wRes.value.data.data);
        }
        if (bRes.status === 'fulfilled' && bRes.value?.data?.status === 'success' && Array.isArray(bRes.value.data.data) && bRes.value.data.data.length > 0) {
          setBlogsList(bRes.value.data.data);
        }
        if (cRes.status === 'fulfilled' && cRes.value?.data?.status === 'success' && Array.isArray(cRes.value.data.data) && cRes.value.data.data.length > 0) {
          setCategories(cRes.value.data.data);
        }
        if (bnRes.status === 'fulfilled' && bnRes.value?.data?.status === 'success' && Array.isArray(bnRes.value.data.data) && bnRes.value.data.data.length > 0) {
          setBannersList(bnRes.value.data.data);
        }
      } catch (err) {
        console.warn('Live social data fetch fallback:', err);
      }
    };

    fetchLiveSocialData();
  }, []);


  // Filtered views
  const filteredWhatsapp = useMemo(() => {
    if (!whatsappSearch) return whatsappGroups;
    const q = whatsappSearch.toLowerCase();
    return whatsappGroups.filter(g => g.name.toLowerCase().includes(q) || g.link.toLowerCase().includes(q) || g.type.toLowerCase().includes(q));
  }, [whatsappGroups, whatsappSearch]);

  const filteredBlogs = useMemo(() => {
    if (!blogsSearch) return blogsList;
    const q = blogsSearch.toLowerCase();
    return blogsList.filter(b => b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  }, [blogsList, blogsSearch]);

  const filteredBanners = useMemo(() => {
    if (!bannersSearch) return bannersList;
    const q = bannersSearch.toLowerCase();
    return bannersList.filter(b => b.title.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.user_type.toLowerCase().includes(q));
  }, [bannersList, bannersSearch]);

  // Fetch Driver Video data from API
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const [vRes, mRes, tRes, wRes] = await Promise.allSettled([
          api.get('/admin/social/driver-videos'),
          api.get('/admin/social/video-modules'),
          api.get('/admin/social/video-topics'),
          api.get('/admin/social/welfare-videos'),
        ]);

        if (vRes.status === 'fulfilled' && vRes.value?.data?.status === 'success' && Array.isArray(vRes.value.data.data) && vRes.value.data.data.length > 0) {
          const apiVideos = vRes.value.data.data.map((v, i) => ({
            id: v.id || i + 1,
            title: v.video_title_name,
            module_name: v.module_name,
            module_id: v.module,
            topic_name: v.topic_name,
            topic_id: v.topic,
            upload_date: v.upload_date,
            thumbnail: v.thumbnail_url || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=160&auto=format&fit=crop&q=60',
            video_url: v.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
          }));
          setDriverVideos(apiVideos);
        }

        if (mRes.status === 'fulfilled' && mRes.value?.data?.status === 'success' && Array.isArray(mRes.value.data.data) && mRes.value.data.data.length > 0) {
          setVideoModules(mRes.value.data.data);
        }

        if (tRes.status === 'fulfilled' && tRes.value?.data?.status === 'success' && Array.isArray(tRes.value.data.data) && tRes.value.data.data.length > 0) {
          setVideoTopics(tRes.value.data.data);
        }

        if (wRes.status === 'fulfilled' && wRes.value?.data?.status === 'success' && Array.isArray(wRes.value.data.data)) {
          setWelfareVideos(wRes.value.data.data);
        }
      } catch (err) {
        console.warn('API video fetch fallback to default:', err);
      }
    };

    fetchVideoData();
  }, []);

  // Handlers for Driver Video
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.video_title_name) {
      showToast('Please enter video title');
      return;
    }
    const selectedMod = videoModules.find(m => String(m.id) === String(videoForm.module));
    const selectedTop = videoTopics.find(t => String(t.id) === String(videoForm.topic));

    const newV = {
      id: Date.now(),
      title: videoForm.video_title_name,
      module_name: selectedMod?.name || `Module ${videoForm.module}`,
      module_id: Number(videoForm.module),
      topic_name: selectedTop?.topic_name || `Topic ${videoForm.topic}`,
      topic_id: Number(videoForm.topic),
      upload_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      thumbnail: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=160&auto=format&fit=crop&q=60',
      video_url: videoForm.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
    };

    setDriverVideos([newV, ...driverVideos]);
    try {
      await api.post('/admin/social/driver-videos', {
        module: videoForm.module,
        topic: videoForm.topic,
        video_title_name: videoForm.video_title_name,
        video_url: videoForm.video_url
      });
    } catch {
      // ignore
    }
    setVideoForm({ module: '3', topic: '3', video_title_name: '', video_file: null, video_url: '' });
    showToast(`Video "${newV.title}" added successfully!`);
  };

  const handleDeleteVideo = async (id) => {
    setDriverVideos(prev => prev.filter(v => v.id !== id));
    try {
      await api.delete(`/admin/social/driver-videos/${id}`);
    } catch {
      // ignore
    }
    showToast('Video deleted successfully');
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) return;
    const newM = { id: videoModules.length + 1, name: moduleForm.name.trim() };
    setVideoModules([...videoModules, newM]);
    try {
      await api.post('/admin/social/video-modules', { name: moduleForm.name });
    } catch {
      // ignore
    }
    setModuleForm({ name: '' });
    showToast(`Module "${newM.name}" created successfully!`);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.topic_name.trim()) return;
    const selMod = videoModules.find(m => String(m.id) === String(topicForm.mu_id));
    const newT = {
      id: videoTopics.length + 1,
      mu_id: Number(topicForm.mu_id),
      module_name: selMod?.name || `Module ${topicForm.mu_id}`,
      topic_name: topicForm.topic_name.trim()
    };
    setVideoTopics([...videoTopics, newT]);
    try {
      await api.post('/admin/social/video-topics', {
        mu_id: topicForm.mu_id,
        topic_name: topicForm.topic_name
      });
    } catch {
      // ignore
    }
    setTopicForm({ mu_id: '1', topic_name: '' });
    showToast(`Topic "${newT.topic_name}" created successfully!`);
  };

  const handleDeleteTopic = async (id) => {
    setVideoTopics(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/admin/social/video-topics/${id}`);
    } catch {
      // ignore
    }
    showToast('Topic deleted successfully');
  };

  const handleCreateHealthHygiene = (e) => {
    e.preventDefault();
    if (!healthForm.video_title_name) {
      showToast('Please enter title');
      return;
    }
    const newH = {
      id: healthHygieneVideos.length + 1,
      module_name: healthForm.module,
      topic_name: healthForm.topic || 'General Health',
      video_topic_name: healthForm.video_title_name,
      video: 'Video Link'
    };
    setHealthHygieneVideos([newH, ...healthHygieneVideos]);
    setHealthForm({ module: 'Health & Hygiene Module 1', topic: '', video_title_name: '', video_file: null });
    showToast('Health & Hygiene video submitted successfully!');
  };

  const handleCreateWelfareVideo = async (e) => {
    e.preventDefault();
    if (!welfareForm.title) {
      showToast('Please enter video title');
      return;
    }
    const newW = {
      id: welfareVideos.length + 1,
      title: welfareForm.title,
      topic: welfareForm.topic,
      likes: 0,
      views: 0,
      completed: 0,
      avg_watch: '0%',
      visible: 'Yes',
      uploaded: 'Just now'
    };
    setWelfareVideos([newW, ...welfareVideos]);
    try {
      await api.post('/admin/social/welfare-videos', {
        video_title_name: welfareForm.title,
        topic_id: 1
      });
    } catch {
      // ignore
    }
    setWelfareForm({ topic: 'Financial Wellness', title: '', video_file: null, thumbnail_file: null });
    showToast('Driver welfare video uploaded successfully!');
  };

  // Filtered views for Driver Videos
  const filteredDriverVideos = useMemo(() => {
    if (!videoSearch) return driverVideos;
    const q = videoSearch.toLowerCase();
    return driverVideos.filter(v => v.title.toLowerCase().includes(q) || v.module_name.toLowerCase().includes(q) || v.topic_name.toLowerCase().includes(q));
  }, [driverVideos, videoSearch]);

  const filteredModules = useMemo(() => {
    if (!moduleSearch) return videoModules;
    const q = moduleSearch.toLowerCase();
    return videoModules.filter(m => m.name.toLowerCase().includes(q));
  }, [videoModules, moduleSearch]);

  const filteredTopics = useMemo(() => {
    if (!topicSearch) return videoTopics;
    const q = topicSearch.toLowerCase();
    return videoTopics.filter(t => t.topic_name.toLowerCase().includes(q) || (t.module_name && t.module_name.toLowerCase().includes(q)));
  }, [videoTopics, topicSearch]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-5 font-sans antialiased text-slate-800 text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-600 font-medium">Social & Communication</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-semibold">
              {activeTab === 'whatsapp' && 'WhatsApp Groups Management'}
              {activeTab === 'blogs-list' && 'Blogs List'}
              {activeTab === 'add-blog' && 'Add Blog'}
              {activeTab === 'blog-categories' && 'Blog Categories'}
              {activeTab === 'banners-list' && 'Banner Management'}
              {activeTab === 'create-banner' && 'Create Banner'}
              {activeTab === 'quiz' && 'Quiz Management'}
              {activeTab === 'driver-videos' && 'Driver Video Management'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === 'whatsapp' && 'WhatsApp Groups Management'}
            {activeTab === 'blogs-list' && 'Blogs Management'}
            {activeTab === 'add-blog' && 'Create New Blog Post'}
            {activeTab === 'blog-categories' && 'Blog Categories'}
            {activeTab === 'banners-list' && 'Banner Management'}
            {activeTab === 'create-banner' && 'Create New Banner'}
            {activeTab === 'quiz' && 'Quiz Management'}
            {activeTab === 'driver-videos' && 'Driver Video Management Portal'}
          </h1>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center space-x-2.5">
          {activeTab === 'whatsapp' && (
            <button
              type="button"
              onClick={() => setCreateGroupModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </button>
          )}

          {activeTab === 'blogs-list' && (
            <button
              type="button"
              onClick={() => switchTab('add-blog')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blog</span>
            </button>
          )}

          {(activeTab === 'add-blog' || activeTab === 'blog-categories') && (
            <button
              type="button"
              onClick={() => switchTab('blogs-list')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blogs</span>
            </button>
          )}

          {activeTab === 'banners-list' && (
            <button
              type="button"
              onClick={() => switchTab('create-banner')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Banner</span>
            </button>
          )}

          {activeTab === 'create-banner' && (
            <button
              type="button"
              onClick={() => switchTab('banners-list')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer select-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Banners</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Segmented Sub-Nav Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs select-none">
        <nav className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => switchTab('whatsapp')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'whatsapp'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">WhatsApp Groups</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'whatsapp' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {whatsappGroups.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('blogs-list')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'blogs-list' || activeTab === 'add-blog'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">Blogs & Articles</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'blogs-list' || activeTab === 'add-blog' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {blogsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('blog-categories')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'blog-categories'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tags className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">Blog Categories</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'blog-categories' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('banners-list')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'banners-list' || activeTab === 'create-banner'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Image className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">Banner Management</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'banners-list' || activeTab === 'create-banner' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {bannersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('quiz')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'quiz'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">Quiz & Tests</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'quiz' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              New
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('driver-videos')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shrink-0 cursor-pointer select-none ${
              activeTab === 'driver-videos'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-3.5 h-3.5 pointer-events-none" />
            <span className="pointer-events-none">Driver Video</span>
            <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'driver-videos' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {driverVideos.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: WHATSAPP GROUPS MANAGEMENT                        */}
      {/* ======================================================== */}
      {activeTab === 'whatsapp' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Filter / Search Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Show</span>
                <select
                  value={whatsappPageSize}
                  onChange={(e) => setWhatsappPageSize(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs border border-slate-200 bg-white rounded-md text-slate-700 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-xs text-slate-500 font-medium">entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                  <input
                    value={whatsappSearch}
                    onChange={(e) => setWhatsappSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                    placeholder="Search groups, links..."
                    type="text"
                  />
                </div>
                <button
                  onClick={() => showToast('Search applied')}
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Group Link</th>
                    <th className="px-4 py-3 font-semibold text-center">Max Count</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {filteredWhatsapp.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{g.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            g.type === 'Driver'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {g.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                          href={g.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="truncate max-w-xs md:max-w-md lg:max-w-2xl">{g.link}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">{g.max_count}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            g.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setGroupForm({ name: g.name, type: g.type, max_count: g.max_count, link: g.link });
                              setCreateGroupModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(g.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>Showing 1 to {filteredWhatsapp.length} of {whatsappGroups.length} entries</div>
              <div className="flex items-center space-x-1">
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 cursor-not-allowed">Previous</button>
                <button className="px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white font-bold cursor-pointer">1</button>
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BLOGS LIST                                        */}
      {/* ======================================================== */}
      {activeTab === 'blogs-list' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-medium">Show</span>
                  <select className="px-2.5 py-1 text-xs border border-slate-200 bg-white rounded-md text-slate-700 font-medium">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                  <span className="text-xs text-slate-500 font-medium">entries</span>
                </div>
                <button
                  onClick={() => switchTab('blog-categories')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 cursor-pointer"
                >
                  <Tags className="w-3 h-3" />
                  <span>Manage Categories</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                  <input
                    value={blogsSearch}
                    onChange={(e) => setBlogsSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 w-64"
                    placeholder="Search blog titles..."
                    type="text"
                  />
                </div>
                <button
                  onClick={() => switchTab('add-blog')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Blog</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 font-semibold">Id</th>
                    <th className="px-4 py-3 font-semibold">Name / Article Title</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">Status</th>
                    <th className="px-4 py-3 font-semibold w-44">Publish Time</th>
                    <th className="px-4 py-3 font-semibold text-center w-28">Images</th>
                    <th className="px-4 py-3 font-semibold text-right w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {filteredBlogs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 font-semibold">{b.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{b.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{b.publish_time}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-14 h-9 mx-auto rounded overflow-hidden bg-slate-100 border border-slate-200 shadow-xs flex items-center justify-center text-slate-400">
                          <Image className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => showToast(`Previewing blog: ${b.title}`)}
                            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[11px] transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setBlogForm({ category: b.category, name: b.title, slug: b.title.toLowerCase().replace(/\s+/g, '-'), publish_option: 'Publish', description: '' });
                              switchTab('add-blog');
                            }}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(b.id)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>Showing 1 to {filteredBlogs.length} of 65 entries</div>
              <div className="flex items-center space-x-1">
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-400">Previous</button>
                <button className="px-3 py-1 rounded border border-blue-600 bg-blue-600 text-white font-bold cursor-pointer">1</button>
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">2</button>
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">3</button>
                <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Next</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ADD BLOG                                          */}
      {/* ======================================================== */}
      {activeTab === 'add-blog' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Add Blog</h2>
              <button
                onClick={() => switchTab('blogs-list')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Blog List</span>
              </button>
            </div>
            <form onSubmit={handleCreateBlogSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Brand <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Truck">Truck</option>
                    <option value="Taxi">Taxi</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Blog Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={blogForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlogForm({
                        ...blogForm,
                        name: val,
                        slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      });
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter blog title"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Blog Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. outsourced-driver-management"
                    type="text"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Publish Option</label>
                  <input
                    value={blogForm.publish_option}
                    onChange={(e) => setBlogForm({ ...blogForm, publish_option: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    type="text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Blog Image <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2 border border-slate-300 rounded-lg p-1 bg-white">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer border border-slate-300">
                      Choose File
                      <input className="hidden" type="file" />
                    </label>
                    <span className="text-xs text-slate-400">No file chosen</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <div className="p-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2 text-slate-600 text-xs">
                    <select className="px-2 py-1 bg-white border border-slate-200 rounded text-xs">
                      <option>Paragraph</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button className="p-1 hover:bg-slate-200 rounded font-bold cursor-pointer" type="button"><Bold className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded italic cursor-pointer" type="button"><Italic className="w-3.5 h-3.5" /></button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><List className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><ListOrdered className="w-3.5 h-3.5" /></button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><AlignCenter className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><Image className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><Quote className="w-3.5 h-3.5" /></button>
                    <button className="p-1 hover:bg-slate-200 rounded cursor-pointer" type="button"><Table className="w-3.5 h-3.5" /></button>
                  </div>
                  <textarea
                    value={blogForm.description}
                    onChange={(e) => setBlogForm({ ...blogForm, description: e.target.value })}
                    className="w-full p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-y"
                    placeholder="Write full article description here..."
                    rows={6}
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => switchTab('blogs-list')}
                  className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: BLOG CATEGORIES                                   */}
      {/* ======================================================== */}
      {activeTab === 'blog-categories' && (
        <section className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-900">
              Add Blog Category
            </div>
            <form onSubmit={handleAddCategory} className="p-6">
              <div className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="Enter category / brand name"
                    type="text"
                    required
                  />
                </div>
                <button
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-900">
              Blogs Category List
            </div>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <span>Show</span>
                <select className="px-2 py-1 border border-slate-200 bg-white rounded text-xs text-slate-700 font-medium">
                  <option>10</option>
                  <option>25</option>
                </select>
                <span>entries</span>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 w-24">Sr.No.</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3 text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {categories.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>Showing 1 to {categories.length} of {categories.length} entries</div>
              <div className="flex items-center space-x-1">
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-400">Previous</button>
                <button className="px-2.5 py-1 rounded border border-blue-600 bg-blue-600 text-white font-bold cursor-pointer">1</button>
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-400">Next</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 5: BANNER MANAGEMENT LIST                            */}
      {/* ======================================================== */}
      {activeTab === 'banners-list' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Show</span>
                <select className="px-2.5 py-1 text-xs border border-slate-200 bg-white rounded-md text-slate-700 font-medium">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <span className="text-xs text-slate-500 font-medium">entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                  <input
                    value={bannersSearch}
                    onChange={(e) => setBannersSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 w-64"
                    placeholder="Search banners..."
                    type="text"
                  />
                </div>
                <button
                  onClick={() => switchTab('create-banner')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Banner</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">#</th>
                    <th className="px-3 py-3 w-20 text-center">Thumbnail</th>
                    <th className="px-3 py-3 font-semibold">Title</th>
                    <th className="px-3 py-3 w-20 text-center">Type</th>
                    <th className="px-3 py-3 w-24">User Type</th>
                    <th className="px-3 py-3 w-20 text-center">Status</th>
                    <th className="px-3 py-3 w-36">Created At</th>
                    <th className="px-3 py-3 w-36">Updated At</th>
                    <th className="px-3 py-3 text-right w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {filteredBanners.map((banner, idx) => (
                    <tr key={banner.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3 text-center font-mono text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="w-12 h-7 mx-auto rounded overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          {banner.type === 'Video' ? <Play className="w-3 h-3 text-amber-500" /> : <Image className="w-3 h-3 text-teal-500" />}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">{banner.title}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            banner.type === 'Video' ? 'bg-amber-400 text-slate-900' : 'bg-teal-500 text-white'
                          }`}
                        >
                          {banner.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{banner.user_type}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            banner.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {banner.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">{banner.created_at}</td>
                      <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">{banner.updated_at}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setBannerForm({ title: banner.title, description: '', redirect_page: 'Job Listings', media_type: banner.type, user_type: banner.user_type, status: banner.status });
                              switchTab('create-banner');
                            }}
                            className="px-2 py-0.5 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded text-[10px] font-semibold flex items-center cursor-pointer"
                          >
                            <Edit className="w-3 h-3 mr-0.5" />Edit
                          </button>
                          <button
                            onClick={() => handleToggleBannerStatus(banner.id)}
                            className="px-2 py-0.5 border border-amber-500 text-amber-600 hover:bg-amber-50 rounded text-[10px] font-semibold flex items-center cursor-pointer"
                          >
                            <Pause className="w-3 h-3 mr-0.5" />
                            {banner.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="px-2 py-0.5 border border-rose-500 text-rose-600 hover:bg-rose-50 rounded text-[10px] font-semibold flex items-center cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 mr-0.5" />Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>Showing 1 to {filteredBanners.length} of 28 entries</div>
              <div className="flex items-center space-x-1">
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-400">Previous</button>
                <button className="px-2.5 py-1 rounded border border-blue-600 bg-blue-600 text-white font-bold cursor-pointer">1</button>
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">2</button>
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">3</button>
                <button className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">Next</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 6: CREATE BANNER                                     */}
      {/* ======================================================== */}
      {activeTab === 'create-banner' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Create New Banner</h2>
              <button
                onClick={() => switchTab('banners-list')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Banners</span>
              </button>
            </div>
            <form onSubmit={handleCreateBannerSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Banner Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter banner title"
                      type="text"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Description</label>
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Enter banner description (optional)"
                      rows={4}
                    ></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Redirect Page Name</label>
                    <select
                      value={bannerForm.redirect_page}
                      onChange={(e) => setBannerForm({ ...bannerForm, redirect_page: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option>-- Select Redirect Page --</option>
                      <option>Job Listings</option>
                      <option>Verification Portal</option>
                      <option>WhatsApp Community</option>
                      <option>Referral & Earn</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Media Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bannerForm.media_type}
                      onChange={(e) => setBannerForm({ ...bannerForm, media_type: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Image">Image</option>
                      <option value="Video">Video</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      User Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={bannerForm.user_type}
                      onChange={(e) => setBannerForm({ ...bannerForm, user_type: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Driver">Driver</option>
                      <option value="Transporter">Transporter</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Media File <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2 border border-slate-300 rounded-lg p-1 bg-white">
                      <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer border border-slate-300">
                        Choose File
                        <input className="hidden" type="file" />
                      </label>
                      <span className="text-xs text-slate-400">No file chosen</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Status</label>
                    <input
                      value={bannerForm.status}
                      onChange={(e) => setBannerForm({ ...bannerForm, status: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                <button
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                  type="submit"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create Banner</span>
                </button>
                <button
                  onClick={() => switchTab('banners-list')}
                  className="px-5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ADD QUIZ                                          */}
      {/* ======================================================== */}
      {activeTab === 'quiz' && (
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 font-bold text-xs text-slate-900">
              Add Quiz
            </div>
            <form onSubmit={handleQuizSubmit} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Modules <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={quizForm.module}
                    onChange={(e) => setQuizForm({ ...quizForm, module: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option>Driver Safety & Traffic Rules</option>
                    <option>Vehicle Maintenance & Inspection</option>
                    <option>Fuel Efficiency & Navigation</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Topic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={quizForm.topic}
                    onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option>Highway Night Driving Protocols</option>
                    <option>Emergency Braking & Cargo Securement</option>
                    <option>RTO Document Compliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Question <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Enter question here"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Question Image <span className="text-slate-400 font-normal">(Size: 400*200)</span>
                  </label>
                  <div className="flex items-center space-x-2 border border-slate-300 rounded-lg p-1 bg-white">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer border border-slate-300">
                      Choose File
                      <input className="hidden" type="file" />
                    </label>
                    <span className="text-xs text-slate-400">No file chosen</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Option 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={quizForm.opt1}
                    onChange={(e) => setQuizForm({ ...quizForm, opt1: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Option 1"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Option 2 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={quizForm.opt2}
                    onChange={(e) => setQuizForm({ ...quizForm, opt2: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Option 2"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Option 3 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={quizForm.opt3}
                    onChange={(e) => setQuizForm({ ...quizForm, opt3: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Option 3"
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Option 4 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={quizForm.opt4}
                    onChange={(e) => setQuizForm({ ...quizForm, opt4: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Option 4"
                    type="text"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Correct Answer <span className="text-rose-500">*</span>
                </label>
                <input
                  value={quizForm.answer}
                  onChange={(e) => setQuizForm({ ...quizForm, answer: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  placeholder="Enter or select correct option number or text"
                  type="text"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 8: DRIVER VIDEO MANAGEMENT PORTAL                    */}
      {/* ======================================================== */}
      {activeTab === 'driver-videos' && (
        <section className="space-y-5">
          {/* Submenu Pill Tabs (Module, Module Topic, Video, Health & Hygiene, Driver Welfare) */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs select-none">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVideoSubTab('module')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 select-none ${
                  videoSubTab === 'module'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">Module</span>
                <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${videoSubTab === 'module' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {videoModules.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSubTab('moduletopic')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 select-none ${
                  videoSubTab === 'moduletopic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Tags className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">Module Topic</span>
                <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${videoSubTab === 'moduletopic' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {videoTopics.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSubTab('video')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 select-none ${
                  videoSubTab === 'video'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Video className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">Video</span>
                <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${videoSubTab === 'video' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {driverVideos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSubTab('healthhygiene')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 select-none ${
                  videoSubTab === 'healthhygiene'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">Health &amp; Hygiene</span>
                <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${videoSubTab === 'healthhygiene' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {healthHygieneVideos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSubTab('driverwelfare')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 select-none ${
                  videoSubTab === 'driverwelfare'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Heart className="w-3.5 h-3.5 pointer-events-none" />
                <span className="pointer-events-none">Driver Welfare</span>
                <span className={`pointer-events-none px-1.5 py-0.2 rounded-full text-[10px] font-bold ${videoSubTab === 'driverwelfare' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {welfareVideos.length}
                </span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUB-TAB 1: VIDEO (DEFAULT VIEW) - MATCHING IMAGE 3       */}
          {/* ======================================================== */}
          {videoSubTab === 'video' && (
            <div className="space-y-5">
              {/* Add Video Card Form */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-800">
                  Add Video
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreateVideo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Module Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Module Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={videoForm.module}
                          onChange={(e) => setVideoForm({ ...videoForm, module: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Module</option>
                          {videoModules.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Topic Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Topic Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={videoForm.topic}
                          onChange={(e) => setVideoForm({ ...videoForm, topic: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Topic</option>
                          {videoTopics.map((t) => (
                            <option key={t.id} value={t.id}>{t.topic_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Video Title Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Video Title Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={videoForm.video_title_name}
                          onChange={(e) => setVideoForm({ ...videoForm, video_title_name: e.target.value })}
                          placeholder="Enter video title..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Upload Video File */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Upload Video <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setVideoForm({
                                  ...videoForm,
                                  video_file: file,
                                  video_url: URL.createObjectURL(file)
                                });
                              }
                            }}
                            className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Section */}
                    {videoForm.video_url && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="block text-xs font-semibold text-slate-700 mb-1.5">Video Preview</span>
                        <video src={videoForm.video_url} controls className="max-h-36 rounded-md shadow-xs" />
                      </div>
                    )}

                    <div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Video List Card Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                  <h2 className="text-sm font-bold text-slate-900">Video List</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Total: <b className="text-blue-600">{filteredDriverVideos.length}</b> videos
                  </span>
                </div>

                {/* Table Controls: entries & search */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Show</span>
                    <select
                      value={videoPageSize}
                      onChange={(e) => setVideoPageSize(Number(e.target.value))}
                      className="border border-slate-300 bg-white rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-slate-500">entries</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                      <input
                        value={videoSearch}
                        onChange={(e) => setVideoSearch(e.target.value)}
                        placeholder="Search video title, module, topic..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 w-64 focus:outline-none focus:border-blue-500"
                        type="search"
                      />
                    </div>
                  </div>
                </div>

                {/* Video List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3 font-semibold">Video Title</th>
                        <th className="px-4 py-3 font-semibold">Module Name</th>
                        <th className="px-4 py-3 font-semibold">Topic Name</th>
                        <th className="px-4 py-3 font-semibold w-40">Upload Date</th>
                        <th className="px-4 py-3 text-center w-28">Thumbnail</th>
                        <th className="px-4 py-3 text-center w-28">Video</th>
                        <th className="px-4 py-3 text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {filteredDriverVideos.slice(0, videoPageSize).map((v, idx) => (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 max-w-md">{v.title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {v.module_name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {v.topic_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{v.upload_date}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="w-16 h-10 mx-auto rounded border border-slate-200 overflow-hidden bg-slate-900 shadow-2xs">
                              <img alt="Video thumbnail" className="w-full h-full object-cover" src={v.thumbnail} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setActiveVideoPlayerModal({ title: v.title, url: v.video_url })}
                              className="w-20 h-9 mx-auto bg-slate-950 hover:bg-blue-600 rounded-md flex items-center justify-center space-x-1.5 text-white transition-all shadow-xs group cursor-pointer"
                              title="Play Video"
                            >
                              <Play className="w-3.5 h-3.5 text-white fill-white group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold">Play</span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex space-x-1.5">
                              <button
                                type="button"
                                onClick={() => showToast(`Editing video: ${v.title}`)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(v.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                <div className="p-4 flex flex-wrap items-center justify-between border-t border-slate-200 text-xs text-slate-600 bg-white">
                  <div>
                    Showing 1 to {Math.min(videoPageSize, filteredDriverVideos.length)} of {filteredDriverVideos.length} entries
                  </div>
                  <div className="inline-flex rounded-md shadow-2xs space-x-1">
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-500 hover:bg-slate-50 cursor-pointer">
                      Previous
                    </button>
                    <button type="button" className="px-3 py-1 bg-blue-600 border border-blue-600 text-white font-bold rounded cursor-pointer">
                      1
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                      2
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                      3
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-TAB 2: MODULE - MATCHING IMAGE 5                     */}
          {/* ======================================================== */}
          {videoSubTab === 'module' && (
            <div className="space-y-5">
              {/* Add Module Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-800">
                  Add Module
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreateModule} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Module Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm({ name: e.target.value })}
                        placeholder="e.g. Module 11"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Module List Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                  <h2 className="text-sm font-bold text-slate-900">Module List</h2>
                  <span className="text-xs text-slate-500 font-medium">Total: <b className="text-blue-600">{filteredModules.length}</b> modules</span>
                </div>
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Show</span>
                    <select
                      value={modulePageSize}
                      onChange={(e) => setModulePageSize(Number(e.target.value))}
                      className="border border-slate-300 bg-white rounded-md px-2 py-1 text-xs outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                    <span className="text-slate-500">entries</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                      <input
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Search module..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 w-64 focus:outline-none focus:border-blue-500"
                        type="search"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-20">Id</th>
                        <th className="px-4 py-3 font-semibold">Module Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {filteredModules.slice(0, modulePageSize).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 font-bold">{m.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{m.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex flex-wrap items-center justify-between border-t border-slate-200 text-xs text-slate-600 bg-white">
                  <div>Showing 1 to {Math.min(modulePageSize, filteredModules.length)} of {filteredModules.length} entries</div>
                  <div className="inline-flex rounded-md shadow-2xs space-x-1">
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-400 cursor-not-allowed">
                      Previous
                    </button>
                    <button type="button" className="px-3 py-1 bg-blue-600 border border-blue-600 text-white font-bold rounded">
                      1
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-400 cursor-not-allowed">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-TAB 3: MODULE TOPIC - MATCHING IMAGE 4                */}
          {/* ======================================================== */}
          {videoSubTab === 'moduletopic' && (
            <div className="space-y-5">
              {/* Add Topic Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-800">
                  Add Topic
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Module Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={topicForm.mu_id}
                          onChange={(e) => setTopicForm({ ...topicForm, mu_id: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Module</option>
                          {videoModules.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Topic Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={topicForm.topic_name}
                          onChange={(e) => setTopicForm({ ...topicForm, topic_name: e.target.value })}
                          placeholder="e.g. Safety, Vehicle Checkup"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Topic List Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                  <h2 className="text-sm font-bold text-slate-900">Topic List</h2>
                  <span className="text-xs text-slate-500 font-medium">Total: <b className="text-blue-600">{filteredTopics.length}</b> topics</span>
                </div>
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Show</span>
                    <select
                      value={topicPageSize}
                      onChange={(e) => setTopicPageSize(Number(e.target.value))}
                      className="border border-slate-300 bg-white rounded-md px-2 py-1 text-xs outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                    <span className="text-slate-500">entries</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
                      <input
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        placeholder="Search topic or module..."
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 w-64 focus:outline-none focus:border-blue-500"
                        type="search"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-16">Id</th>
                        <th className="px-4 py-3 font-semibold">Module Name</th>
                        <th className="px-4 py-3 font-semibold">Topic Name</th>
                        <th className="px-4 py-3 text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {filteredTopics.slice(0, topicPageSize).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 font-bold">{t.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{t.module_name || `Module ${t.mu_id}`}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{t.topic_name}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(t.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex flex-wrap items-center justify-between border-t border-slate-200 text-xs text-slate-600 bg-white">
                  <div>Showing 1 to {Math.min(topicPageSize, filteredTopics.length)} of {filteredTopics.length} entries</div>
                  <div className="inline-flex rounded-md shadow-2xs space-x-1">
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-500 hover:bg-slate-50 cursor-pointer">
                      Previous
                    </button>
                    <button type="button" className="px-3 py-1 bg-blue-600 border border-blue-600 text-white font-bold rounded cursor-pointer">
                      1
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                      2
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                      3
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-TAB 4: HEALTH & HYGIENE - MATCHING IMAGE 2            */}
          {/* ======================================================== */}
          {videoSubTab === 'healthhygiene' && (
            <div className="space-y-5">
              {/* Add Health & Hygiene Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-800">
                  Add Health &amp; Hygiene
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreateHealthHygiene} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Module Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={healthForm.module}
                          onChange={(e) => setHealthForm({ ...healthForm, module: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Health & Hygiene Module 1">Health &amp; Hygiene Module 1</option>
                          <option value="Health & Hygiene Module 2">Health &amp; Hygiene Module 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Topic Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={healthForm.topic}
                          onChange={(e) => setHealthForm({ ...healthForm, topic: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Topic</option>
                          <option value="Physical Ergonomics">Physical Ergonomics &amp; Posture</option>
                          <option value="Hydration & Diet">Hydration &amp; Highway Diet</option>
                          <option value="Eye Health">Driver Eye Health &amp; Night Vision</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Video Title Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={healthForm.video_title_name}
                          onChange={(e) => setHealthForm({ ...healthForm, video_title_name: e.target.value })}
                          placeholder="Enter title..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Upload Video <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Health & Hygiene Video List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                  <h2 className="text-sm font-bold text-slate-900">Health &amp; Hygiene Video List</h2>
                  <span className="text-xs text-slate-500 font-medium">Total: <b className="text-blue-600">{healthHygieneVideos.length}</b> records</span>
                </div>
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Show</span>
                    <select
                      value={healthPageSize}
                      onChange={(e) => setHealthPageSize(Number(e.target.value))}
                      className="border border-slate-300 bg-white rounded-md px-2 py-1 text-xs outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                    <span className="text-slate-500">entries</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-16">Id</th>
                        <th className="px-4 py-3 font-semibold">Module Name</th>
                        <th className="px-4 py-3 font-semibold">Topic Name</th>
                        <th className="px-4 py-3 font-semibold">Video Topic Name</th>
                        <th className="px-4 py-3 font-semibold">Video</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {healthHygieneVideos.length === 0 ? (
                        <tr>
                          <td className="text-center py-8 text-slate-400 font-medium" colSpan={6}>
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        healthHygieneVideos.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono">{h.id}</td>
                            <td className="px-4 py-3">{h.module_name}</td>
                            <td className="px-4 py-3">{h.topic_name}</td>
                            <td className="px-4 py-3 font-bold">{h.video_topic_name}</td>
                            <td className="px-4 py-3">{h.video}</td>
                            <td className="px-4 py-3 text-center">
                              <button type="button" className="px-2 py-1 bg-rose-600 text-white rounded text-[11px]">Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 flex flex-wrap items-center justify-between border-t border-slate-200 text-xs text-slate-600 bg-white">
                  <div>Showing 0 to {healthHygieneVideos.length} of {healthHygieneVideos.length} entries</div>
                  <div className="inline-flex rounded-md shadow-2xs space-x-1">
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-400 cursor-not-allowed">
                      Previous
                    </button>
                    <button type="button" className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-400 cursor-not-allowed">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-TAB 5: DRIVER WELFARE - MATCHING IMAGE 1              */}
          {/* ======================================================== */}
          {videoSubTab === 'driverwelfare' && (
            <div className="space-y-5">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Driver Welfare Videos</h2>
                  <p className="text-xs text-slate-500">Publish wellness, mental health, and financial advice videos for commercial truck drivers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoSubTab('moduletopic')}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Manage Topics</span>
                </button>
              </div>

              {/* Upload New Welfare Video Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 font-bold text-xs text-slate-800">
                  Upload New Welfare Video
                </div>
                <div className="p-5">
                  <form onSubmit={handleCreateWelfareVideo} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Topic <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={welfareForm.topic}
                          onChange={(e) => setWelfareForm({ ...welfareForm, topic: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option>-- Select Topic --</option>
                          <option value="Financial Wellness">Financial Wellness</option>
                          <option value="Physical Fitness">Physical Fitness</option>
                          <option value="Mental Wellbeing">Mental Wellbeing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Video Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={welfareForm.title}
                          onChange={(e) => setWelfareForm({ ...welfareForm, title: e.target.value })}
                          placeholder="e.g., Healthy Diet for Drivers"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Upload Video <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">Max 500MB</span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Thumbnail (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">Max 2MB</span>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Video</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* All Welfare Videos Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center space-x-2 bg-white">
                  <h2 className="text-sm font-bold text-slate-900">All Welfare Videos</h2>
                  <span className="px-2 py-0.5 bg-slate-500 text-white text-[11px] font-semibold rounded-full">
                    {welfareVideos.length} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-10">#</th>
                        <th className="px-4 py-3 font-semibold">Thumbnail</th>
                        <th className="px-4 py-3 font-semibold">Title</th>
                        <th className="px-4 py-3 font-semibold">Topic</th>
                        <th className="px-4 py-3 font-semibold">Likes</th>
                        <th className="px-4 py-3 font-semibold">Views</th>
                        <th className="px-4 py-3 font-semibold">Completed</th>
                        <th className="px-4 py-3 font-semibold">Avg Watch</th>
                        <th className="px-4 py-3 font-semibold">Visible</th>
                        <th className="px-4 py-3 font-semibold">Uploaded</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {welfareVideos.length === 0 ? (
                        <tr>
                          <td className="text-center py-8 text-slate-400 font-medium" colSpan={11}>
                            No welfare videos uploaded yet.
                          </td>
                        </tr>
                      ) : (
                        welfareVideos.map((w, idx) => (
                          <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="w-12 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
                                <Video className="w-3.5 h-3.5" />
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">{w.title}</td>
                            <td className="px-4 py-3">{w.topic}</td>
                            <td className="px-4 py-3">{w.likes}</td>
                            <td className="px-4 py-3">{w.views}</td>
                            <td className="px-4 py-3">{w.completed}</td>
                            <td className="px-4 py-3">{w.avg_watch}</td>
                            <td className="px-4 py-3">{w.visible}</td>
                            <td className="px-4 py-3 font-mono text-[11px]">{w.uploaded}</td>
                            <td className="px-4 py-3 text-center">
                              <button type="button" className="px-2 py-1 bg-rose-600 text-white rounded text-[11px]">Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT WHATSAPP GROUP                       */}
      {/* ========================================================= */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create WhatsApp Group</h3>
              <button
                onClick={() => setCreateGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGroup}>
              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Group Name</label>
                  <input
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g. TruckMitr Official Group-VII"
                    type="text"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Audience Type</label>
                    <select
                      value={groupForm.type}
                      onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="Driver">Driver</option>
                      <option value="Transporter">Transporter</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Max Capacity</label>
                    <input
                      value={groupForm.max_count}
                      onChange={(e) => setGroupForm({ ...groupForm, max_count: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">WhatsApp Invite Link</label>
                  <input
                    value={groupForm.link}
                    onChange={(e) => setGroupForm({ ...groupForm, link: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="https://chat.whatsapp.com/..."
                    type="url"
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateGroupModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIDEO PLAYER PREVIEW                               */}
      {/* ========================================================= */}
      {activeVideoPlayerModal && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setActiveVideoPlayerModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white">
                <Video className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold truncate max-w-lg">
                  {activeVideoPlayerModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoPlayerModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center min-h-[320px]">
              <video
                src={activeVideoPlayerModal.url}
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-lg shadow-lg object-contain bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">TruckMitr Driver Training &amp; Welfare Series</span>
              <button
                type="button"
                onClick={() => setActiveVideoPlayerModal(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
