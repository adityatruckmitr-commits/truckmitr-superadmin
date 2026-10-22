import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  Users, Plus, Edit, Trash2, Eye, RefreshCw, UserPlus, 
  ArrowRightLeft, Package, Phone, CheckCircle, XCircle,
  Clock, TrendingUp, Search, Filter, Download, AlertCircle,
  ArrowRight, ArrowLeft, Repeat, Ban, UserMinus, UserCheck,
  BarChart3, Activity, Target, Award
} from 'lucide-react-teleadmin';

const TelecallersManagementComplete = () => {
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, telecallers, leads, operations
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=dashboard_stats`);
      return response.data.data;
    },
  });

  // Fetch telecallers
  const { data: telecallersData, isLoading: telecallersLoading, refetch: refetchTelecallers } = useQuery({
    queryKey: ['telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=list`);
      return response.data.data;
    },
  });

  // Fetch unassigned leads
  const { data: unassignedData, refetch: refetchUnassigned } = useQuery({
    queryKey: ['unassigned-leads'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=unassigned_leads&limit=1000`);
      return response.data;
    },
  });

  const telecallers = telecallersData || [];
  const unassignedLeads = unassignedData?.data || [];
  const stats = dashboardData || {};

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <Header 
        onAddTelecaller={() => setShowAddModal(true)}
        onRefresh={() => {
          refetchTelecallers();
          refetchUnassigned();
          queryClient.invalidateQueries(['dashboard-stats']);
        }}
      />

      {/* Navigation Tabs */}
      <NavigationTabs activeView={activeView} setActiveView={setActiveView} />

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <DashboardView stats={stats} telecallers={telecallers} />
      )}

      {/* Telecallers View */}
      {activeView === 'telecallers' && (
        <TelecallersView
          telecallers={telecallers}
          isLoading={telecallersLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onViewLeads={(tc) => {
            setSelectedTelecaller(tc);
            setShowLeadsModal(true);
          }}
          onEdit={(tc) => {
            setSelectedTelecaller(tc);
            setShowEditModal(true);
          }}
          onDelete={(id) => handleDeleteTelecaller(id)}
        />
      )}

      {/* Leads Management View */}
      {activeView === 'leads' && (
        <LeadsManagementView
          telecallers={telecallers}
          unassignedLeads={unassignedLeads}
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
          onAssign={() => setShowAssignModal(true)}
          onBulkAssign={() => setShowBulkAssignModal(true)}
        />
      )}

      {/* Operations View */}
      {activeView === 'operations' && (
        <OperationsView
          telecallers={telecallers}
          onTransfer={() => setShowTransferModal(true)}
          onExchange={() => setShowExchangeModal(true)}
          onRevoke={() => setShowRevokeModal(true)}
        />
      )}

      {/* Modals - Will be added in next part */}
    </div>
  );
};

export default TelecallersManagementComplete;


// Header Component
const Header = ({ onAddTelecaller, onRefresh }) => (
  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Telecallers Management System</h1>
        <p className="text-indigo-100 text-lg">Complete control over telecallers, leads, and assignments</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAddTelecaller}
          className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-medium shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Telecaller
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>
    </div>
  </div>
);

// Navigation Tabs
const NavigationTabs = ({ activeView, setActiveView }) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'telecallers', name: 'Telecallers', icon: Users },
    { id: 'leads', name: 'Leads Management', icon: Package },
    { id: 'operations', name: 'Operations', icon: Activity },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-2">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeView === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Dashboard View
const DashboardView = ({ stats, telecallers }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard icon={Users} label="Total Telecallers" value={stats.total_telecallers || 0} color="blue" trend="+5%" />
      <StatCard icon={Package} label="Total Leads" value={stats.total_leads || 0} color="green" trend="+12%" />
      <StatCard icon={UserCheck} label="Assigned Leads" value={stats.assigned_leads || 0} color="purple" />
      <StatCard icon={UserMinus} label="Unassigned Leads" value={stats.unassigned_leads || 0} color="orange" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard icon={Phone} label="Total Calls" value={stats.total_calls || 0} color="indigo" />
      <StatCard icon={CheckCircle} label="Connected Calls" value={stats.connected_calls || 0} color="green" />
      <StatCard icon={Activity} label="Calls Today" value={stats.calls_today || 0} color="blue" />
      <StatCard icon={TrendingUp} label="Leads Today" value={stats.leads_today || 0} color="purple" />
    </div>

    {/* Distribution Chart */}
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Lead Distribution by Telecaller</h3>
      <div className="space-y-4">
        {stats.distribution?.map((item) => (
          <div key={item.telecaller_id} className="flex items-center gap-4">
            <div className="w-48 font-medium text-gray-700">{item.telecaller_name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-3 text-white font-bold text-sm"
                style={{ width: `${(item.lead_count / stats.total_leads) * 100}%` }}
              >
                {item.lead_count}
              </div>
            </div>
            <div className="w-20 text-right text-gray-600 font-medium">
              {((item.lead_count / stats.total_leads) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Top Performers */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {telecallers.slice(0, 3).map((tc, idx) => (
        <div key={tc.id} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8" />
            <span className="text-3xl font-bold">#{idx + 1}</span>
          </div>
          <h4 className="text-xl font-bold mb-2">{tc.name}</h4>
          <div className="space-y-2 text-sm opacity-90">
            <div className="flex justify-between">
              <span>Leads:</span>
              <span className="font-bold">{tc.total_leads}</span>
            </div>
            <div className="flex justify-between">
              <span>Calls:</span>
              <span className="font-bold">{tc.total_calls}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversion:</span>
              <span className="font-bold">{tc.conversion_rate}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, trend }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    indigo: 'from-indigo-500 to-indigo-700',
    orange: 'from-orange-500 to-orange-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
        {trend && (
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-4xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
};
