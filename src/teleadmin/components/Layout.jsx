import { Outlet, NavLink, useNavigate } from '@teleadmin/router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCog, UserPlus, Phone, BarChart3, LogOut, Menu, X, Bell, Shield, Briefcase, Network, CreditCard, ArrowRightLeft, PhoneCall, Megaphone, Video, Clock, BadgeCheck, LineChart, ChevronDown, TrendingUp
} from 'lucide-react-teleadmin';
import { useState, useEffect } from 'react';
import UserProfileDropdown from './UserProfileDropdown';
import GlobalSearch from './GlobalSearch';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [driverVoiceOpen, setDriverVoiceOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking a nav link on mobile
  const handleNavClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/daily-analytics', icon: TrendingUp, label: 'Daily Analytics', highlight: true },
    // { path: '/telecaller-employees', icon: UserCog, label: 'Telecallers' },
    { path: '/revenue', icon: LineChart, label: 'Revenue', hideForRoles: ['manager'] },
    // { path: '/subscription-report', icon: CreditCard, label: 'Subscriptions' },
    { path: '/leads-management-new', icon: Phone, label: 'Registration Leads' },
    { path: '/leads-assignment', icon: UserPlus, label: 'Leads Assignment' },
    { path: '/social-media-leads', icon: Network, label: 'Outbound Leads' },
    { path: '/driver-hire-form-leads', icon: Users, label: 'Driver Hire Leads' },
    { path: '/matchmaking-new', icon: PhoneCall, label: 'All Calls' },
    // { path: '/move-leads', icon: ArrowRightLeft, label: 'Move Leads' },
    { path: '/job-matching', icon: Briefcase, label: 'Job Matching' },
    { path: '/job-wise-calls', icon: BarChart3, label: 'Job Calls' },
    { path: '/pipeline-drivers', icon: BadgeCheck, label: 'Pipeline Drivers' },
    { path: '/driver-bank', icon: Users, label: 'Driver Bank' },
  ].filter(item => !(item.hideForRoles && item.hideForRoles.includes(user?.role)));

  const driverVoiceItems = [
    { path: '/driver-ki-awaz', icon: Video, label: 'Posts' },
    { path: '/driver-ki-awaz?status=0', icon: Clock, label: 'Pending Approval' },
    { path: '/driver-ki-awaz?status=1', icon: BadgeCheck, label: 'Published Posts' },
    { path: '/driver-ki-awaz', icon: BadgeCheck, label: 'Blue Tick Accounts' },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Morning', emoji: '🌤️' };
    if (hour < 17) return { text: 'Afternoon', emoji: '☀️' };
    return { text: 'Evening', emoji: '🌙' };
  };

  const { text: greetingText, emoji: greetingEmoji } = greeting();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Compact & Premium */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } flex flex-col`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <img src="https://truckmitr.com/teleadmin/logo.png" alt="logo" className="w-40 h-24" />
          </div>
          {isMobile && (
            <button onClick={closeSidebar} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <p className="px-4 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center group relative px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${item.highlight ? 'animate-pulse-slow shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-200/50 bg-indigo-50/30 text-indigo-700 font-bold z-10 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-indigo-500/10 before:to-purple-500/10 before:-z-10' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-[11px] tracking-wide">{item.label}</span>
                  {/* Active Indicator Pin */}
                  <div className={`absolute right-2 w-1 h-1 rounded-full bg-indigo-600 transition-transform ${isActive ? 'scale-100' : 'scale-0'}`} />
                </>
              )}
            </NavLink>
          ))}

          {/* Driver Ki Awaz Section */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setDriverVoiceOpen((open) => !open)}
              className="w-full flex items-center group relative px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
            >
              <Megaphone className="w-4 h-4 mr-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
              <span className="text-[11px] font-bold tracking-wide flex-1 text-left">Driver Ki Awaz</span>
              <span className="mr-1.5 rounded-sm bg-purple-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white scale-90">New</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${driverVoiceOpen ? 'rotate-180' : ''}`} />
            </button>
            {driverVoiceOpen && (
              <div className="mt-1 ml-5 space-y-0.5 border-l border-slate-100 pl-2">
                {driverVoiceItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center group relative px-4 py-1.5 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-purple-50 text-purple-700 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-3.5 h-3.5 mr-2.5 transition-colors ${isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className="text-[10px] tracking-wide">{item.label}</span>
                        <div className={`absolute right-2 w-1 h-1 rounded-full bg-purple-600 transition-transform ${isActive ? 'scale-100' : 'scale-0'}`} />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Add New Lead Link */}
          <div className="pt-2">
            <NavLink
              to="/social-leads/create"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center group relative px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <UserPlus className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="text-[11px] tracking-wide">Add New Lead</span>
                  <div className={`absolute right-2 w-1 h-1 rounded-full bg-indigo-600 transition-transform ${isActive ? 'scale-100' : 'scale-0'}`} />
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* User Profile Section - Very Compact */}
        <div className="p-3 bg-slate-50/50 border-t border-slate-100">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-800 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{user?.role || 'Root'}</p>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:ml-56 min-h-screen overflow-hidden">
        {/* Header - Modern & Compact */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{greetingText}</span>
                <span className="text-[10px]">{greetingEmoji}</span>
              </div>
              <h1 className="text-xs font-black text-slate-800 uppercase tracking-tight -mt-0.5">
                Welcome back, <span className="text-indigo-600">{user?.name?.split(' ')[0] || 'User'}</span>
              </h1>
            </div>
          </div>

          <div className="flex-1 max-w-xl px-6 hidden md:flex justify-center">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <UserProfileDropdown />
          </div>
        </header>

        {/* Page Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-6 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
