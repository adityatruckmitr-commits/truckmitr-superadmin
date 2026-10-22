import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { 
  Users, Plus, Edit, Trash2, Eye, RefreshCw, UserPlus, 
  ArrowRightLeft, Package, Phone, CheckCircle, XCircle,
  Clock, TrendingUp, Search, Filter, Download, AlertCircle
} from 'lucide-react-teleadmin';

const TelecallersManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch telecallers
  const { data: telecallersData, isLoading, refetch } = useQuery({
    queryKey: ['telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=list`);
      return response.data;
    },
  });

  const telecallers = telecallersData?.data || [];

  // Filter telecallers
  const filteredTelecallers = telecallers.filter(tc =>
    tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Telecallers Management</h1>
            <p className="text-indigo-100 text-lg">Manage telecallers, view leads, and assign work</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Telecaller
            </button>
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Telecallers"
          value={telecallers.length}
          color="blue"
        />
        <StatCard
          icon={Phone}
          label="Total Calls"
          value={telecallers.reduce((sum, tc) => sum + tc.total_calls, 0)}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Total Leads"
          value={telecallers.reduce((sum, tc) => sum + tc.total_leads, 0)}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="Connected Calls"
          value={telecallers.reduce((sum, tc) => sum + tc.connected_calls, 0)}
          color="indigo"
        />
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search telecallers..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              <Package className="w-4 h-4" />
              Bulk Assign
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Leads
            </button>
          </div>
        </div>

        {/* Telecallers List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          </div>
        ) : filteredTelecallers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTelecallers.map(telecaller => (
              <TelecallerCard
                key={telecaller.id}
                telecaller={telecaller}
                onViewLeads={() => {
                  setSelectedTelecaller(telecaller);
                  setShowLeadsModal(true);
                }}
                onEdit={() => {
                  setSelectedTelecaller(telecaller);
                  setShowEditModal(true);
                }}
                onDelete={() => handleDelete(telecaller.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No telecallers found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddTelecallerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}

      {showEditModal && selectedTelecaller && (
        <EditTelecallerModal
          telecaller={selectedTelecaller}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTelecaller(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTelecaller(null);
            refetch();
          }}
        />
      )}

      {showLeadsModal && selectedTelecaller && (
        <ViewLeadsModal
          telecaller={selectedTelecaller}
          onClose={() => {
            setShowLeadsModal(false);
            setSelectedTelecaller(null);
          }}
        />
      )}

      {showTransferModal && (
        <TransferLeadsModal
          telecallers={telecallers}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            refetch();
          }}
        />
      )}

      {showBulkAssignModal && (
        <BulkAssignModal
          telecallers={telecallers}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={() => {
            setShowBulkAssignModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    indigo: 'from-indigo-500 to-indigo-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
};
