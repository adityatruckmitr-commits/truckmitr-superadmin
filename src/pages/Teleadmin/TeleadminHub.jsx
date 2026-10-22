import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  UserPlus,
  Users,
  Share2,
  Send,
  Truck,
  PhoneCall,
  Briefcase,
  Layers,
  Building2,
  Megaphone,
  Headphones,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Phone,
  Clock,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  Ticket
} from 'lucide-react';

// Import all Teleadmin Sub-Dashboards
import TeleadminDashboard from './TeleadminDashboard';
import LeadsAssignment from './LeadsAssignment';
import RegistrationLeads from './RegistrationLeads';
import AssignLeads from './AssignLeads';
import OutboundLeads from './OutboundLeads';
import DriverHireFormLeads from './DriverHireFormLeads';
import AllCalls from './AllCalls';
import JobWiseCallAnalytics from './JobWiseCallAnalytics';
import PipelineDrivers from './PipelineDrivers';
import DriverBank from './DriverBank';
import DriverKiAwaz from './DriverKiAwaz';

export default function TeleadminHub({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Tab definitions with paths, labels, icons, badges
  const tabs = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Live Overview',
      shortLabel: 'Overview',
      path: '/teleadmin/dashboard',
      icon: TrendingUp,
      badge: 'Live',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'leads-assignment',
      label: 'Leads Assignment',
      shortLabel: 'Assignment',
      path: '/teleadmin/leads-assignment',
      icon: UserPlus,
      badge: '34.9k',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200 font-bold'
    },
    {
      id: 'registration-leads',
      label: 'Registration Leads',
      shortLabel: 'Registrations',
      path: '/teleadmin/registration-leads',
      icon: Users,
      badge: '277',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'assign-leads',
      label: 'Social & Manual Leads',
      shortLabel: 'Add Leads',
      path: '/teleadmin/assign-leads',
      icon: Share2,
      badge: 'Intake',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: 'outbound-leads',
      label: 'Outbound Leads',
      shortLabel: 'Outbound',
      path: '/teleadmin/outbound-leads',
      icon: Send,
      badge: 'Campaign',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    {
      id: 'driver-hire-leads',
      label: 'Driver Hire Leads',
      shortLabel: 'Driver Hire',
      path: '/teleadmin/driver-hire-form-leads',
      icon: Truck,
      badge: '373',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'all-calls',
      label: 'All Calls Telemetry',
      shortLabel: 'Calls',
      path: '/teleadmin/all-calls',
      icon: PhoneCall,
      badge: '507',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200'
    },
    {
      id: 'job-calls',
      label: 'Job Calls Analytics',
      shortLabel: 'Job Calls',
      path: '/teleadmin/job-calls',
      icon: Briefcase,
      badge: '114',
      badgeColor: 'bg-sky-100 text-sky-700 border-sky-200'
    },
    {
      id: 'pipeline-drivers',
      label: 'Hiring Pipeline',
      shortLabel: 'Pipeline',
      path: '/teleadmin/pipeline-drivers',
      icon: Layers,
      badge: '513',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      id: 'driver-bank',
      label: 'Driver Talent Bank',
      shortLabel: 'Driver Bank',
      path: '/teleadmin/driver-bank',
      icon: Building2,
      badge: '216',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'driver-ki-awaz',
      label: 'Driver Ki Awaz',
      shortLabel: 'Community',
      path: '/teleadmin/driver-ki-awaz',
      icon: Megaphone,
      badge: 'NEW',
      badgeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold shadow-2xs'
    }
  ], []);

  // Determine active tab from URL path or query params or defaultTab
  const getTabFromLocation = () => {
    const path = location.pathname.toLowerCase();
    const queryTab = searchParams.get('tab');

    if (queryTab) {
      const match = tabs.find(t => t.id === queryTab.toLowerCase());
      if (match) return match.id;
    }

    if (path.includes('leads-assignment')) return 'leads-assignment';
    if (path.includes('registration-leads')) return 'registration-leads';
    if (path.includes('assign-leads') || path.includes('add-new-lead') || path.includes('social-leads')) return 'assign-leads';
    if (path.includes('outbound-leads')) return 'outbound-leads';
    if (path.includes('driver-hire')) return 'driver-hire-leads';
    if (path.includes('all-calls') || path.includes('/calls')) return 'all-calls';
    if (path.includes('job-calls') || path.includes('job-wise-calls')) return 'job-calls';
    if (path.includes('pipeline-drivers') || path.includes('hiring-pipeline')) return 'pipeline-drivers';
    if (path.includes('driver-bank')) return 'driver-bank';
    if (path.includes('driver-ki-awaz')) return 'driver-ki-awaz';
    if (path.includes('dashboard') || path === '/teleadmin' || path === '/teleadmin/') return 'dashboard';

    return defaultTab || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromLocation);
  const [tabBadges, setTabBadges] = useState({
    'dashboard': 'Live',
    'leads-assignment': '34.9k',
    'registration-leads': '277',
    'assign-leads': 'Intake',
    'outbound-leads': 'New',
    'driver-hire-leads': '373',
    'all-calls': '507',
    'job-calls': '114',
    'pipeline-drivers': '513',
    'driver-bank': '216',
    'driver-ki-awaz': 'NEW'
  });

  // Sync active tab whenever location changes
  useEffect(() => {
    const current = getTabFromLocation();
    if (current && current !== activeTab) {
      setActiveTab(current);
    }
  }, [location.pathname, searchParams]);

  // Fetch real summary counts on mount to update tab badge counters dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchCounters = async () => {
      try {
        const [dashRes, leadsRes] = await Promise.allSettled([
          api.get('/admin/teleadmin/dashboard'),
          api.get('/admin/teleadmin/leads-assignment', { params: { per_page: 1 } })
        ]);

        if (isMounted) {
          const updates = {};
          if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) {
            const k = dashRes.value.data.data.kpis;
            if (k?.driver_bank?.total) updates['driver-bank'] = k.driver_bank.total.toLocaleString();
            if (k?.pipeline?.total) updates['pipeline-drivers'] = k.pipeline.total > 1000 ? `${(k.pipeline.total / 1000).toFixed(1)}k` : k.pipeline.total;
            if (k?.calls?.total_historical) updates['all-calls'] = k.calls.total_historical > 1000 ? `${(k.calls.total_historical / 1000).toFixed(1)}k` : k.calls.total_historical;
          }
          if (leadsRes.status === 'fulfilled' && leadsRes.value.data?.data) {
            const total = leadsRes.value.data.data.total_uncalled || leadsRes.value.data.data.unassigned_count;
            if (total) {
              updates['leads-assignment'] = total > 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString();
            }
          }
          if (Object.keys(updates).length > 0) {
            setTabBadges(prev => ({ ...prev, ...updates }));
          }
        }
      } catch (err) {
        // Fallback to initial badges
      }
    };
    fetchCounters();
    return () => { isMounted = false; };
  }, []);

  // Handle switching tabs
  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    const targetTab = tabs.find(t => t.id === tabId);
    if (targetTab && targetTab.path) {
      navigate(targetTab.path, { replace: false });
    }
  };

  // Callback to allow sub-dashboards to switch tabs directly
  const handleNavigateTab = (tabId) => {
    handleTabSelect(tabId);
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 w-full min-w-0 font-sans antialiased text-slate-800 bg-[#F8F9FA]">
      {/* ======================================================== */}
      {/* MASTER HUB TOP HEADER                                    */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="font-medium text-slate-500">Teleadmin Command Center</span>
            <span>/</span>
            <span className="font-semibold text-blue-600 uppercase tracking-wider text-[11px]">
              {tabs.find(t => t.id === activeTab)?.label || 'Unified Dashboard'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Headphones className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Teleadmin Master Dashboard
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Unified OS
              </span>
            </h1>
          </div>
        </div>

        {/* Global Quick Info Pill */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 font-medium">Real-time Telemetry:</span>
            <span className="font-bold text-slate-800 font-mono">11 Sub-Dashboards Integrated</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MASTER UNIFIED NAVIGATION TAB BAR                         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs mb-6 overflow-x-auto select-none scrollbar-thin">
        <nav aria-label="Teleadmin Modules" className="flex items-center gap-1 min-w-max text-xs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeValue = tabBadges[tab.id] || tab.badge;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={tab.label}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {badgeValue && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : tab.badgeColor
                    }`}
                  >
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ======================================================== */}
      {/* ACTIVE DASHBOARD MODULE VIEW CONTAINER                   */}
      {/* ======================================================== */}
      <div className="w-full min-w-0 transition-opacity duration-200">
        {activeTab === 'dashboard' && (
          <TeleadminDashboard onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'leads-assignment' && (
          <LeadsAssignment onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'registration-leads' && (
          <RegistrationLeads onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'assign-leads' && (
          <AssignLeads onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'outbound-leads' && (
          <OutboundLeads onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'driver-hire-leads' && (
          <DriverHireFormLeads onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'all-calls' && (
          <AllCalls onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'job-calls' && (
          <JobWiseCallAnalytics onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'pipeline-drivers' && (
          <PipelineDrivers onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'driver-bank' && (
          <DriverBank onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'driver-ki-awaz' && (
          <DriverKiAwaz onNavigateTab={handleNavigateTab} />
        )}
      </div>
    </div>
  );
}
