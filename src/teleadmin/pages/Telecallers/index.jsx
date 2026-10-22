import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { Plus, RefreshCw } from 'lucide-react-teleadmin';
import {
  AddTelecallerModal,
  EditTelecallerModal,
  ViewLeadsModal,
  // AssignLeadsModal,
  // TransferLeadsModal,
  // BulkAssignModal,
  // RevokeLeadsModal
} from '../../components/TelecallerModals';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import TelecallersTab from './components/TelecallersTab';
// import OverviewTab from './components/OverviewTab';
// import LeadsTab from './components/LeadsTab';
// import OperationsTab from './components/OperationsTab';
// import TabNavigation from './components/TabNavigation';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';

const Telecallers = () => {
  // const [activeTab, setActiveTab] = useState('telecallers'); // Only telecallers tab active
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  // const [selectedLeads, setSelectedLeads] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  // const [showAssignModal, setShowAssignModal] = useState(false);
  // const [showTransferModal, setShowTransferModal] = useState(false);
  // const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  // const [showRevokeModal, setShowRevokeModal] = useState(false);
  
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch telecallers
  const { data: telecallersData, isLoading, refetch } = useQuery({
    queryKey: ['telecallers'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/admin_telecallers_management.php?action=list`);
      return response.data.data;
    },
  });

  const telecallers = Array.isArray(telecallersData) ? telecallersData : [];

  // Helper function to check if date matches filter
  const matchesTimeFilter = (createdAt) => {
    if (!createdAt) return true;
    
    const date = new Date(createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch(timeFilter) {
      case 'today':
        return date >= today;
      case 'yesterday':
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        return date >= yesterday && date < yesterdayEnd;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return date >= monthAgo;
      case 'all':
      default:
        return true;
    }
  };

  const filteredTelecallers = telecallers.filter(tc => {
    const matchesSearch = tc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tc.mobile?.includes(searchQuery);
    const matchesTime = matchesTimeFilter(tc.created_at);
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
    const matchesType = typeFilter === 'all' || tc.tc_for === typeFilter;
    
    return matchesSearch && matchesTime && matchesStatus && matchesType;
  });

  const refreshAll = () => {
    refetch();
    queryClient.invalidateQueries(['dashboard-stats']);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin_telecallers_management.php?action=delete`, { id: deleteId });
      toast.success('Telecaller deleted successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete telecaller');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Telecallers Management</h1>
            <p className="text-indigo-100 text-lg">Manage telecallers and their performance</p>
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
              onClick={refreshAll}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Commented out other tabs */}
      {/* <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} /> */}

      {/* Content - Only Telecallers Tab Active */}
      <TelecallersTab
        telecallers={filteredTelecallers}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onViewLeads={(tc) => {
          setSelectedTelecaller(tc);
          setShowLeadsModal(true);
        }}
        onEdit={(tc) => {
          setSelectedTelecaller(tc);
          setShowEditModal(true);
        }}
        onDelete={handleDeleteClick}
      />

      {/* Other Tabs - Commented Out */}
      {/* {activeTab === 'overview' && <OverviewTab stats={stats} telecallers={telecallers} />} */}
      {/* {activeTab === 'leads' && (
        <LeadsTab
          telecallers={telecallers}
          unassignedLeads={unassignedLeads}
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
          onAssign={() => setShowAssignModal(true)}
          onBulkAssign={() => setShowBulkAssignModal(true)}
        />
      )} */}
      {/* {activeTab === 'operations' && (
        <OperationsTab
          telecallers={telecallers}
          onTransfer={() => setShowTransferModal(true)}
          onRevoke={() => setShowRevokeModal(true)}
        />
      )} */}

      {/* Modals */}
      {showAddModal && <AddTelecallerModal onClose={() => setShowAddModal(false)} onSuccess={refreshAll} toast={toast} />}
      {showEditModal && selectedTelecaller && (
        <EditTelecallerModal telecaller={selectedTelecaller} onClose={() => setShowEditModal(false)} onSuccess={refreshAll} toast={toast} />
      )}
      {showLeadsModal && selectedTelecaller && (
        <ViewLeadsModal telecaller={selectedTelecaller} onClose={() => setShowLeadsModal(false)} />
      )}
      
      {/* Other Modals - Commented Out */}
      {/* {showAssignModal && (
        <AssignLeadsModal
          telecallers={telecallers}
          selectedLeads={selectedLeads}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedLeads([]);
            refreshAll();
          }}
          toast={toast}
        />
      )} */}
      {/* {showTransferModal && (
        <TransferLeadsModal
          telecallers={telecallers}
          onClose={() => setShowTransferModal(false)}
          onSuccess={refreshAll}
          toast={toast}
        />
      )} */}
      {/* {showBulkAssignModal && (
        <BulkAssignModal
          telecallers={telecallers}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={refreshAll}
          toast={toast}
        />
      )} */}
      {/* {showRevokeModal && (
        <RevokeLeadsModal
          telecallers={telecallers}
          onClose={() => setShowRevokeModal(false)}
          onSuccess={refreshAll}
          toast={toast}
        />
      )} */}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default Telecallers;
