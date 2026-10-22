import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SidebarSearch from '../components/SidebarSearch';
import SidebarNav from '../components/SidebarNav';
import PageSearch from '../components/PageSearch';

// Teleadmin user search (/telehead/user-search), shown in the header on teleadmin pages
const TeleadminGlobalSearch = React.lazy(() => import('../teleadmin/components/GlobalSearch'));
// HRMS menu (same groups as the HRMS sidebar)
import { navGroups as hrmsNavGroups } from '../hrms/config/navigation';
import { 
  Home, 
  BarChart3, 
  Users2, 
  Users,
  GitCompare, 
  IndianRupee, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Filter, 
  Image, 
  MessageSquare, 
  Sparkles,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  FileQuestion,
  Vote,
  Briefcase,
  Megaphone,
  Headphones,
  Receipt,
  Phone,
  Ticket,
  Loader2,
  LayoutDashboard,
  Calendar,
  UserPlus,
  Laptop,
  CreditCard,
  Truck
} from 'lucide-react';

const HRMS_GROUP_ICONS = {
  Overview: LayoutDashboard,
  People: Users,
  'Time & Leave': Calendar,
  Finance: IndianRupee,
  'Recruitment & Performance': UserPlus,
  Workplace: Laptop,
};

// Every HRMS screen, once each (a path can be listed for several roles)
const HRMS_MENU = hrmsNavGroups.map((group) => ({
  ...group,
  items: group.items.filter((item, i, all) => all.findIndex((other) => other.to === item.to) === i),
}));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPrimary, setSearchPrimary] = useState('');
  const [searchJob, setSearchJob] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);

  // All sidebar submenus start closed; users open them on demand
  const [expandedMenus, setExpandedMenus] = useState({});
  const contentRef = useRef(null);

  const [verificationCounts, setVerificationCounts] = useState({
    'user-overview': 877,
    'court-verification': 127,
    'court-transporter': 5,
    'digital-address': 141,
    'dav-transporter': 11,
    'physical-verification': 2
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get('/admin/verifications/summary-counts');
        if (res.data?.status && res.data.tabCounts) {
          setVerificationCounts(res.data.tabCounts);
        }
      } catch (err) {
        // graceful fallback to initial counts
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    const q = searchPrimary.trim() || searchJob.trim();
    if (!q || q.length < 2) {
      setGlobalSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      setShowDropdown(true);
      try {
        const res = await api.get('/admin/teleadmin/global-search', { params: { search: q } });
        if (res.data?.users) {
          setGlobalSearchResults(res.data.users);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchPrimary, searchJob]);

  const handleOpenUserDetail = async (userId) => {
    setShowDropdown(false);
    setIsLoadingUserDetail(true);
    try {
      const res = await api.get(`/admin/teleadmin/user-detail/${userId}`);
      if (res.data?.user) {
        setSelectedUserDetail(res.data);
      }
    } catch (err) {
      console.error('Could not load user details:', err);
    } finally {
      setIsLoadingUserDetail(false);
    }
  };

  const toggleAccordion = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teleadminRole = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null')?.role; } catch { return undefined; }
  })();

  // Every area is one dropdown (closed until clicked). Admin follows the truckmitr.com admin menu order.
  const navSections = [
    {
      title: 'Admin',
      items: [
        {
          label: 'Admin',
          icon: LayoutDashboard,
          subItems: [
            { label: 'Dashboard', path: '/', icon: Home, exact: true },
            { label: 'Performance Report', path: '/performance', icon: BarChart3, prefix: true },
            { label: 'Partner Dashboard', path: '/partners', icon: Users2, prefix: true },
            { label: 'Matchmaking', path: '/matchmaking', icon: GitCompare, prefix: true },
            { label: 'Update Revenue', path: '/revenue', icon: IndianRupee, prefix: true, badge: 'MTD', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
            { label: 'Expenses', path: '/expenses', icon: Receipt, prefix: true },
            { label: 'User Notes', path: '/user-notes', icon: FileText, prefix: true },
            { label: 'Driver Fulfillment', path: '/driver-fulfillment', icon: ShieldCheck, prefix: true },
            {
              label: 'OEM Brand',
              icon: Building2,
              subItems: [
                { label: 'Brand List', path: '/oem/brands' },
              ]
            },
            {
              label: 'OEM Filter',
              icon: Filter,
              subItems: [
                { label: 'Budget', path: '/oem/filters?tab=budget' },
                { label: 'Fuel Type', path: '/oem/filters?tab=fuel-type' },
                { label: 'Vehicle Application', path: '/oem/filters?tab=vehicle-app' },
                { label: 'GVW (Tons)', path: '/oem/filters?tab=gvw' },
                { label: 'Vehicle Type', path: '/oem/filters?tab=vehicle-type' },
                { label: 'Tyres Count', path: '/oem/filters?tab=tyres-count' },
              ]
            },
            {
              label: 'Banners',
              icon: Image,
              subItems: [
                { label: 'View Banners', path: '/banners' },
                { label: 'Mobile Banners', path: '/banners/mobile' },
              ]
            },
            { label: 'Mobile Popups', path: '/popups/mobile', icon: MessageSquare },
            { label: 'Popup Banners', path: '/banners/popups', icon: Sparkles },
            {
              label: 'Verification Hub',
              icon: ShieldCheck,
              subItems: [
                { label: 'User Overview', path: '/verifications', badge: String(verificationCounts['user-overview'] || 877), badgeClass: 'bg-white px-1.5 py-0.2 rounded-full border border-blue-200 text-blue-700 font-bold' },
                { label: 'ID Check', path: '/id-check' },
                { label: 'RC Check', path: '/rc-verifications' },
                { label: 'Court Verifications', path: '/court-verifications', badge: String(verificationCounts['court-verification'] || 127), badgeClass: 'text-slate-500 font-semibold' },
                { label: 'DAV', path: '/dav-verifications', badge: String(verificationCounts['digital-address'] || 141), badgeClass: 'text-slate-500 font-semibold' },
                { label: 'Court Verif. (Transporter)', path: '/court-verifications-by-transporter', badge: String(verificationCounts['court-transporter'] || 5), badgeClass: 'text-slate-500 font-semibold' },
                { label: 'DAV (Transporter)', path: '/dav-verifications-by-transporter', badge: String(verificationCounts['dav-transporter'] || 11), badgeClass: 'text-slate-500 font-semibold' },
                { label: 'Physical Verif. (Transporter)', path: '/physical-verifications-by-transporter', badge: String(verificationCounts['physical-verification'] || 2), badgeClass: 'text-slate-500 font-semibold' },
              ]
            },
            {
              label: 'Poll & Survey',
              icon: Vote,
              subItems: [
                { label: 'View Surveys', path: '/surveys' },
                { label: 'Create Survey', path: '/surveys/create' }
              ]
            },
            {
              label: 'Subscription Plans',
              icon: CreditCard,
              subItems: [
                { label: 'View Subscription Plans', path: '/subscriptionplans' },
                { label: 'Create Subscription Plan', path: '/subscriptionplans/create' },
              ]
            },
            {
              label: 'Notification Tracking',
              icon: Bell,
              subItems: [
                { label: 'Overview', path: '/notifications' },
                { label: 'Notification List', path: '/notifications/list' },
                { label: 'Analytics', path: '/notifications/analytics' },
                { label: 'Broadcast & Push', path: '/notifications/create' }
              ]
            },
            {
              label: 'Driver Management',
              icon: Truck,
              subItems: [
                { label: 'Driver List', path: '/driver-list' },
                { label: 'Subscribed Drivers', path: '/subscribed-drivers' },
                { label: 'Driver Verifications', path: '/driver-verifications' },
                { label: 'Driver Hiring', path: '/driver-hiring' },
              ]
            },
            {
              label: 'Transporter',
              icon: Building2,
              subItems: [
                { label: 'View List', path: '/transporter' },
                { label: 'Subscribed Transporters', path: '/subscribed-transporters' },
                { label: 'Driver Verification', path: '/transporter-driver-verification' },
              ]
            },
            {
              label: 'Jobs',
              icon: Briefcase,
              subItems: [
                { label: 'Job List', path: '/jobs' },
                { label: 'Active Jobs', path: '/active-jobs' },
                { label: 'Inactive Jobs', path: '/inactive-jobs' },
                { label: 'Expired Jobs', path: '/expired-jobs' },
                { label: 'Pending for Approval', path: '/pending-jobs' },
                { label: 'Master Job', path: '/master-jobs' },
                { label: 'Job Applications', path: '/job-applications' },
              ]
            },
            {
              label: 'Social & Communication',
              icon: Megaphone,
              subItems: [
                { label: 'Driver Video', path: '/driver-videos' },
                { label: 'Quiz & Tests', path: '/quiz' },
                { label: 'Blog Categories', path: '/blog-categories' },
                { label: 'Blogs & Articles', path: '/blogs' },
                { label: 'WhatsApp Groups', path: '/whatsapp-groups' },
              ]
            },
            {
              label: 'Team Members',
              icon: Users,
              subItems: [
                { label: 'Members List', path: '/team-members' },
                { label: 'Departments List', path: '/departments' }
              ]
            },
          ]
        }
      ]
    },
    {
      title: 'Teleadmin',
      items: [
        {
          label: 'Teleadmin',
          path: '/teleadmin/dashboard',
          icon: Headphones,
          // Same menu as the standalone teleadmin app (src/teleadmin)
          subItems: [
            { label: 'Dashboard', path: '/teleadmin/dashboard' },
            { label: 'Daily Analytics', path: '/teleadmin/daily-analytics', badge: 'Live', badgeClass: 'bg-indigo-100 text-indigo-700 font-bold' },
            ...(teleadminRole === 'manager' ? [] : [{ label: 'Revenue', path: '/teleadmin/revenue' }]),
            { label: 'Registration Leads', path: '/teleadmin/leads-management-new' },
            { label: 'Leads Assignment', path: '/teleadmin/leads-assignment' },
            { label: 'Outbound Leads', path: '/teleadmin/social-media-leads' },
            { label: 'Driver Hire Leads', path: '/teleadmin/driver-hire-form-leads' },
            { label: 'All Calls', path: '/teleadmin/matchmaking-new' },
            { label: 'Job Matching', path: '/teleadmin/job-matching' },
            { label: 'Job Calls', path: '/teleadmin/job-wise-calls' },
            { label: 'Pipeline Drivers', path: '/teleadmin/pipeline-drivers' },
            { label: 'Driver Bank', path: '/teleadmin/driver-bank' },
            {
              label: 'Driver Ki Awaz',
              path: '/teleadmin/driver-ki-awaz',
              badge: 'NEW',
              badgeClass: 'bg-purple-600 text-white font-bold',
              children: [
                { label: 'Posts', path: '/teleadmin/driver-ki-awaz' },
                { label: 'Pending Approval', path: '/teleadmin/driver-ki-awaz?status=0' },
                { label: 'Published Posts', path: '/teleadmin/driver-ki-awaz?status=1' },
                { label: 'Blue Tick Accounts', path: '/teleadmin/driver-ki-awaz' }
              ]
            },
            { label: 'Add New Lead', path: '/teleadmin/social-leads/create' },
          ]
        }
      ]
    },
    {
      title: 'TM-Manavsetu HRMS',
      items: [
        {
          label: 'Manavsetu HRMS',
          icon: Users,
          // The console login sees every HRMS screen
          subItems: HRMS_MENU.map((group) => ({
            label: group.label,
            icon: HRMS_GROUP_ICONS[group.label] || Users,
            subItems: group.items.map((navItem) => ({ label: navItem.label, path: `/hrms${navItem.to}` })),
          })),
        }
      ]
    },
  ];

  return (
    <div className="min-h-screen text-slate-800 antialiased flex flex-col bg-[#F8F9FA]">
      <div className="flex flex-1 w-full min-h-screen">
        {/* BEGIN: LeftSidebar (Desktop) */}
        <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col hidden lg:flex select-none" data-purpose="main-navigation">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-black text-xl">
                T
              </div>
              <div>
                <div className="font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                  TruckMitr
                  <span className="text-[9px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Pro</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Super Admin OS</p>
              </div>
            </div>
          </div>

          <SidebarSearch navSections={navSections} />

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 text-xs font-medium">
            {navSections.map((section, sIdx) => (
              <div key={section.title} className={sIdx > 0 ? 'pt-4' : ''}>
                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{section.title}</div>
                <div className="space-y-0.5">
                  <SidebarNav items={section.items} expanded={expandedMenus} onToggle={toggleAccordion} />
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer Status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Server: tm-cluster-in-1
              </span>
              <span className="font-mono text-slate-400">v4.18</span>
            </div>
          </div>
        </aside>
        {/* END: LeftSidebar */}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative w-72 bg-white flex flex-col shadow-xl z-10 overflow-y-auto">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">T</div>
                  <span className="font-bold text-slate-900">TruckMitr Pro</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarSearch navSections={navSections} onNavigate={() => setMobileMenuOpen(false)} />

                <nav className="flex-1 py-4 px-3 space-y-0.5 text-xs font-medium">
                  {navSections.map((section, sIdx) => (
                    <div key={section.title} className={sIdx > 0 ? 'pt-4' : ''}>
                      <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{section.title}</div>
                      <div className="space-y-0.5">
                        <SidebarNav items={section.items} expanded={expandedMenus} onToggle={toggleAccordion} onNavigate={() => setMobileMenuOpen(false)} />
                      </div>
                    </div>
                  ))}
                </nav>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BEGIN: ContentAreaWrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* BEGIN: StickyTopHeader */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6" data-purpose="top-header">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {location.pathname.startsWith('/teleadmin') ? (
              <div className="teleadmin-scope flex-1 max-w-3xl flex">
                <Suspense fallback={null}>
                  <TeleadminGlobalSearch />
                </Suspense>
              </div>
            ) : (
            /* Dual Search System */
            <div className="relative flex items-center gap-3 flex-1 max-w-3xl">
              {/* Primary Entity Lookup */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isSearchingGlobal ? (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchPrimary}
                  onFocus={() => { if (globalSearchResults.length > 0) setShowDropdown(true); }}
                  onChange={(e) => setSearchPrimary(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Search TMID, Name, Mobile, Email..."
                />
                {searchPrimary && (
                  <button
                    onClick={() => { setSearchPrimary(''); setShowDropdown(false); }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Job / Requisition Lookup */}
              <div className="relative w-64 hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchJob}
                  onFocus={() => { if (globalSearchResults.length > 0) setShowDropdown(true); }}
                  onChange={(e) => setSearchJob(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Search Job ID, Route..."
                />
                {searchJob && (
                  <button
                    onClick={() => { setSearchJob(''); setShowDropdown(false); }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Floating Global Search Results Dropdown */}
              {showDropdown && (searchPrimary.trim() || searchJob.trim()) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-96 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Search Results ({globalSearchResults.length})</span>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {isSearchingGlobal ? (
                      <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Searching across 109,000+ records...</span>
                      </div>
                    ) : globalSearchResults.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No matches found for "{searchPrimary || searchJob}"
                      </div>
                    ) : (
                      globalSearchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenUserDetail(item.id)}
                          className="p-3 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                              {item.role?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{item.name || 'Unnamed'}</span>
                                <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded ${
                                  item.role === 'driver' ? 'bg-blue-100 text-blue-800' :
                                  item.role === 'transporter' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {item.role}
                                </span>
                                {item.searched_job_id && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                    Job: {item.searched_job_id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                <span>{item.unique_id}</span>
                                <span>•</span>
                                <span>{item.mobile}</span>
                                {item.city && (
                                  <>
                                    <span>•</span>
                                    <span>{item.city}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            View Profile →
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Header Actions & Admin Profile */}
            <div className="flex items-center gap-3 ml-4">
              {/* HRMS screen search, notifications and HRMS account (rendered by src/hrms/components/HeaderWidgets) */}
              {location.pathname.startsWith('/hrms') && (
                <>
                  <div id="hrms-header-slot" className="flex items-center" />
                  <div className="h-6 w-px bg-slate-200"></div>
                </>
              )}
              {/* Notification Bell */}
              <button
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* Settings */}
              <button
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
                title="System Settings"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-slate-200"></div>

              {/* Admin Avatar & Menu */}
              <div className="flex items-center gap-2.5 pl-1 cursor-pointer" onClick={() => navigate('/settings')}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-100">
                  {(user?.name || 'Admin').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="text-left hidden lg:block leading-tight">
                  <div className="text-xs font-semibold text-slate-800">{user?.name || 'Admin'}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user?.role || user?.mobile || 'truckmitr_root'}</div>
                </div>
              </div>

              {/* Logout Icon */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors hidden sm:block"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
          {/* END: StickyTopHeader */}

          {/* BEGIN: ScrollablePageContent */}
          <PageSearch containerRef={contentRef} />
          <div ref={contentRef} className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
            <Outlet />
          </Suspense>
          </div>
          {/* END: ScrollablePageContent */}

          {/* BEGIN: CompactGlobalFooter */}
          <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400" data-purpose="dashboard-footer">
            © 2024-2026 TruckMitr Corporate Services Pvt. Ltd. All Rights Reserved. Enterprise Admin Console v4.18
          </footer>
          {/* END: CompactGlobalFooter */}

          {/* User Detail Console Modal */}
          {selectedUserDetail && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
                      {selectedUserDetail.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        {selectedUserDetail.user?.name || 'Unnamed User'}
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20">
                          {selectedUserDetail.user?.role}
                        </span>
                      </h3>
                      <div className="text-xs text-blue-100 font-mono">
                        TMID: {selectedUserDetail.user?.unique_id}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserDetail(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mobile</span>
                      <a href={`tel:${selectedUserDetail.user?.mobile}`} className="font-bold text-slate-800 font-mono hover:text-blue-600 block">
                        {selectedUserDetail.user?.mobile || '--'}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Email</span>
                      <span className="font-semibold text-slate-800 truncate block">{selectedUserDetail.user?.email || '--'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Telechamp</span>
                      <span className="font-bold text-blue-600">{selectedUserDetail.telechamp_name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">State / City</span>
                      <span className="font-medium text-slate-800">
                        {selectedUserDetail.user?.city ? `${selectedUserDetail.user.city}, ` : ''}
                        {selectedUserDetail.user?.state_name || '--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Revenue</span>
                      <span className="font-extrabold text-emerald-600 font-mono">
                        ₹ {Number(selectedUserDetail.total_payment || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Member Since</span>
                      <span className="font-medium text-slate-800">
                        {selectedUserDetail.user?.created_at ? new Date(selectedUserDetail.user.created_at).toLocaleDateString() : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Call History */}
                  {selectedUserDetail.call_history && selectedUserDetail.call_history.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        Recent Call History ({selectedUserDetail.call_history.length} Calls)
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {selectedUserDetail.call_history.map((call) => (
                          <div key={call.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-2">
                                <span>Agent: {call.agent_name?.replace('@TruckMitr', '') || 'Telechamp'}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  call.call_missed_flag === 'C' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {call.call_missed_flag === 'C' ? 'Connected' : 'Missed'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {call.start_time || call.created_at} • Duration: {call.agent_durn || call.durn_formatted || '00:00:10'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payments */}
                  {selectedUserDetail.payments && selectedUserDetail.payments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                        Transaction / Subscription History
                      </h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                        {selectedUserDetail.payments.map((p) => (
                          <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="font-semibold text-slate-800 uppercase">{p.payment_type || 'Membership'}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {p.id} • {p.created_at}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600 font-mono">₹ {Number(p.amount).toLocaleString()}</div>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {p.payment_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedUserDetail(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* END: ContentAreaWrapper */}
      </div>
    </div>
  );
}