import { Outlet, NavLink, useNavigate } from '@teleadmin/router';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, UserCog, Phone, 
  BarChart3, LogOut, Menu, X, Bell, Shield, Briefcase
} from 'lucide-react-teleadmin';
import { useState, useEffect } from 'react';
import logoImage from '/truckmitr_logo.png';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { path: '/advanced-management', icon: Shield, label: 'Advanced Control' },
    { path: '/telecallers', icon: Users, label: 'Telecallers' },
    { path: '/managers', icon: UserCog, label: 'Managers' },
    { path: '/leads', icon: Phone, label: 'Leads Management' },
    { path: '/call-monitoring', icon: Phone, label: 'Call Monitoring' },
    { path: '/match-making', icon: Briefcase, label: 'Match Making' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay - Click to close */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-xs"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-out bg-gradient-to-b from-indigo-900 to-indigo-800 w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            <img 
              src={logoImage} 
              alt="TruckMitr Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={closeSidebar}
                className="md:hidden p-2 rounded-lg hover:bg-indigo-800 text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-indigo-900 shadow-lg'
                      : 'text-indigo-100 hover:bg-indigo-800 active:bg-indigo-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="mt-auto pt-4 border-t border-indigo-700">
            <div className="bg-indigo-800 rounded-lg p-4 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user?.name || 'Admin'}</p>
                  <p className="text-indigo-300 text-sm">Administrator</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 transition-all">
        {/* Top Bar */}
        <header className="bg-white shadow-xs sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors md:hidden"
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              {/* Mobile Logo */}
              <img 
                src={logoImage} 
                alt="TruckMitr" 
                className="h-8 w-auto md:hidden"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              {/* Mobile User Avatar */}
              <div className="md:hidden w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 md:p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
