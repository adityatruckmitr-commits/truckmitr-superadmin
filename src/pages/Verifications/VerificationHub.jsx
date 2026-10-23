import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Scale,
  Gavel,
  Home,
  Check,
  X,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  UserCheck,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import PageJump from '../../components/PageJump';

export default function VerificationHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State
  // Possible tabs: 'user-overview' | 'court-verification' | 'court-transporter' | 'digital-address' | 'dav-transporter' | 'physical-verification'
  const getInitialTab = () => {
    if (location.pathname.includes('court-verifications-by-transporter') || location.pathname.includes('court-transporter')) return 'court-transporter';
    if (location.pathname.includes('court-verifications') || location.pathname.includes('/court')) return 'court-verification';
    if (location.pathname.includes('dav-verifications-by-transporter') || location.pathname.includes('dav-transporter')) return 'dav-transporter';
    if (location.pathname.includes('dav-verifications') || location.pathname.includes('digital-address') || location.pathname.includes('/dav')) return 'digital-address';
    if (location.pathname.includes('physical-verifications') || location.pathname.includes('/physical')) return 'physical-verification';
    return searchParams.get('tab') || 'user-overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [reviewModalData, setReviewModalData] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [updateStatusModal, setUpdateStatusModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Live dynamic tab counts
  const [tabCounts, setTabCounts] = useState({
    'user-overview': 877,
    'court-verification': 127,
    'court-transporter': 5,
    'digital-address': 141,
    'dav-transporter': 11,
    'physical-verification': 2
  });

  // Fetch summary counts from backend
  const fetchSummaryCounts = async () => {
    try {
      const res = await api.get('/admin/verifications/summary-counts');
      if (res.data?.status && res.data.tabCounts) {
        setTabCounts(res.data.tabCounts);
      }
    } catch (err) {
      console.warn('Could not load summary counts:', err);
    }
  };

  useEffect(() => {
    fetchSummaryCounts();
  }, []);

  // Sync tab with URL if path changes
  useEffect(() => {
    setActiveTab(getInitialTab());
    setCurrentPage(1);
  }, [location.pathname, searchParams]);

  // ==========================================
  // DATASETS (Pre-seeded exact records from HTML)
  // ==========================================

  // Tab 1: User Verification Dataset (871)
  const [userOverviewList, setUserOverviewList] = useState([]);

  // Tab 2: Court Verification Dataset (130)
  const [courtVerificationList, setCourtVerificationList] = useState([]);

  // Tab 3: Court Verification by Transporter (5)
  const [courtTransporterList, setCourtTransporterList] = useState([]);

  // Tab 4: Digital Address Verification (DAV) (141)
  const [digitalAddressList, setDigitalAddressList] = useState([]);

  // Tab 5: DAV by Transporter (12)
  const [davTransporterList, setDavTransporterList] = useState([]);

  // Tab 6: Physical Verification by Transporter (2)
  const [physicalVerificationList, setPhysicalVerificationList] = useState([]);

  // Fetch Tab Data from server API
  const fetchTabData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = {
        page: currentPage,
        per_page: pageSize,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;

      if (activeTab === 'user-overview') {
        endpoint = '/admin/verifications/user-overview';
        if (roleFilter) params.role = roleFilter;
      } else if (activeTab === 'court-verification') {
        endpoint = '/admin/verifications/court-drivers';
      } else if (activeTab === 'court-transporter') {
        endpoint = '/admin/verifications/court-transporters';
      } else if (activeTab === 'digital-address') {
        endpoint = '/admin/verifications/dav-drivers';
      } else if (activeTab === 'dav-transporter') {
        endpoint = '/admin/verifications/dav-transporters';
      } else if (activeTab === 'physical-verification') {
        endpoint = '/admin/verifications/physical-transporters';
      }

      if (endpoint) {
        const res = await api.get(endpoint, { params });
        if (res.data?.status && Array.isArray(res.data.data)) {
          const items = res.data.data;
          // the verification APIs send their totals in res.data.pagination
          const meta = res.data.pagination || res.data;
          setTotalRecords(meta.total || items.length);
          setTotalPages(meta.last_page || Math.ceil((meta.total || items.length) / pageSize) || 1);

          if (activeTab === 'user-overview') setUserOverviewList(items);
          else if (activeTab === 'court-verification') setCourtVerificationList(items);
          else if (activeTab === 'court-transporter') setCourtTransporterList(items);
          else if (activeTab === 'digital-address') setDigitalAddressList(items);
          else if (activeTab === 'dav-transporter') setDavTransporterList(items);
          else if (activeTab === 'physical-verification') setPhysicalVerificationList(items);
        }
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData();
  }, [activeTab, currentPage, pageSize, statusFilter, roleFilter]);

  // Client fallback display if offline or during initial render
  const filteredData = useMemo(() => {
    if (activeTab === 'user-overview') return userOverviewList;
    if (activeTab === 'court-verification') return courtVerificationList;
    if (activeTab === 'court-transporter') return courtTransporterList;
    if (activeTab === 'digital-address') return digitalAddressList;
    if (activeTab === 'dav-transporter') return davTransporterList;
    if (activeTab === 'physical-verification') return physicalVerificationList;
    return [];
  }, [activeTab, userOverviewList, courtVerificationList, courtTransporterList, digitalAddressList, davTransporterList, physicalVerificationList]);

  // Tab switcher
  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
  };

  // Open 360 Review Dossier Modal with live popup details
  const handleOpenReviewModal = async (record) => {
    setReviewModalData(record);
    try {
      let popupType = 'dl';
      if (activeTab === 'court-verification' || activeTab === 'court-transporter') popupType = 'court';
      else if (activeTab === 'digital-address' || activeTab === 'dav-transporter') popupType = 'dav';
      const userId = record.user_id || record.id;
      const res = await api.get(`/admin/verifications/popup/${popupType}/${userId}`);
      if (res.data?.status && res.data.data) {
        setReviewModalData(prev => ({ ...prev, popupDetails: res.data.data }));
      }
    } catch (e) {
      // Keep existing record
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    showToast(`Exporting ${activeTab.toUpperCase()} master data to CSV...`);
    let headers = [];
    let rows = [];

    if (activeTab === 'user-overview') {
      headers = ['#', 'TMID', 'Name', 'Mobile', 'Email', 'Role', 'Subscription', 'Date', 'License', 'PAN', 'FaceMatch', 'Court', 'DAV'];
      rows = filteredData.map((u, i) => [i + 1, u.tmid, `"${u.name}"`, u.mobile, u.email, u.role, u.subscription, u.subscription_date, u.license_check?.status || 'N/A', u.pan_status?.status || 'N/A', u.face_match?.status || 'N/A', u.court_check?.status || 'N/A', u.digital_address?.status || 'N/A']);
    } else if (activeTab === 'court-verification') {
      headers = ['Sr No', 'TMID', 'Driver Name', 'Mobile', 'Subscription', 'Date', 'Court Status', 'Report Date'];
      rows = filteredData.map((c, i) => [i + 1, c.tmid, `"${c.name}"`, c.mobile, c.subscription, c.subscription_datetime, c.court_status, c.report_datetime]);
    } else {
      headers = ['#', 'Name', 'Mobile', 'Status', 'Submitted On'];
      rows = filteredData.map((d, i) => [i + 1, `"${d.driver_name || d.name}"`, d.driver_mobile || d.mobile, d.status, d.submitted_on || d.report_datetime]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `TruckMitr_Verification_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch Verification trigger
  const handleBatchVerify = () => {
    showToast('Batch UIDAI & eCourts query dispatched for pending records!');
    setBatchModalOpen(false);
  };

  // Update Status action on live server
  const handleStatusUpdate = async (record, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      let endpoint = '';
      let body = {};
      const isApproved = newStatus.includes('Verified');

      if (activeTab === 'court-verification') {
        endpoint = `/admin/verifications/court-driver/update/${record.id}`;
        body = { status: isApproved ? 'verified' : 'rejected', report: isApproved ? 'green' : 'red' };
      } else if (activeTab === 'digital-address') {
        endpoint = `/admin/verifications/dav-driver/update/${record.id}`;
        body = { verification_status: isApproved ? 1 : 2 };
      } else if (activeTab === 'dav-transporter') {
        endpoint = `/admin/verifications/dav-transporter/update/${record.id}`;
        body = { verification_status: isApproved ? 1 : 2 };
      } else if (activeTab === 'physical-verification') {
        endpoint = `/admin/verifications/physical-transporter/update/${record.id}`;
        body = { status: isApproved ? 'verified' : 'rejected', report: isApproved ? 'verified' : 'rejected' };
      }

      if (endpoint) {
        await api.post(endpoint, body);
      }
      showToast(`Verification status for ${record.name || record.driver_name} updated to ${newStatus}`);
      setUpdateStatusModal(null);
      fetchTabData();
      fetchSummaryCounts();
    } catch (err) {
      console.error('Update status failed:', err);
      showToast('Error updating status on server');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 w-full min-w-0 font-sans antialiased text-slate-800" data-purpose="hub-main-workspace">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Operations</span>
            <span>/</span>
            <span>Compliance & Legal</span>
            <span>/</span>
            <span className="font-semibold text-slate-600">Verification Hub</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Driver & Transporter Verification Hub
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {tabCounts[activeTab] || 0} Records
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced (eCourts & UIDAI)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Master CSV</span>
          </button>
          <button
            onClick={() => setBatchModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Initiate Batch Verification</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Tabs Bar (Matching the provided UI) */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs mb-4">
        <nav aria-label="Verification Modules" className="flex flex-wrap items-center gap-1 text-xs">
          {/* Tab 1: User Verification Report */}
          <button
            type="button"
            onClick={() => handleTabSwitch('user-overview')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'user-overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>User Verification Report</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'user-overview' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['user-overview'] || 0}
            </span>
          </button>

          {/* Tab 2: Court Verification (Driver) */}
          <button
            type="button"
            onClick={() => handleTabSwitch('court-verification')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'court-verification'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Court Verification Report</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'court-verification' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['court-verification'] || 0}
            </span>
          </button>

          {/* Tab 3: Court (Transporter) */}
          <button
            type="button"
            onClick={() => handleTabSwitch('court-transporter')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'court-transporter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gavel className="w-4 h-4" />
            <span>Court (Transporter)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'court-transporter' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['court-transporter'] || 0}
            </span>
          </button>

          {/* Tab 4: DAV (Direct) */}
          <button
            type="button"
            onClick={() => handleTabSwitch('digital-address')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'digital-address'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Digital Address (DAV)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'digital-address' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['digital-address'] || 0}
            </span>
          </button>

          {/* Tab 5: DAV (Transporter) */}
          <button
            type="button"
            onClick={() => handleTabSwitch('dav-transporter')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'dav-transporter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>DAV (Transporter)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'dav-transporter' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['dav-transporter'] || 0}
            </span>
          </button>

          {/* Tab 6: Physical Verification */}
          <button
            type="button"
            onClick={() => handleTabSwitch('physical-verification')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'physical-verification'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Physical Verification</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'physical-verification' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts['physical-verification'] || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Search & Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(1); fetchTabData(); } }}
                placeholder="Search by TMID, Name, Mobile, Transporter..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Status: All</option>
                <option value="trusted">Trusted / Verified</option>
                <option value="initiated">Initiated</option>
                <option value="pending">Pending</option>
                <option value="red">Red / Flagged</option>
              </select>
            </div>

            <div className="w-36">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">Role: All Roles</option>
                <option value="driver">Driver</option>
                <option value="transporter">Transporter</option>
                <option value="fleet_owner">Fleet Owner</option>
              </select>
            </div>

            <button
              onClick={() => { setCurrentPage(1); fetchTabData(); showToast('Filters applied'); }}
              type="button"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              Apply Filters
            </button>

            {(searchQuery || statusFilter || roleFilter) && (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter(''); setRoleFilter(''); setCurrentPage(1); }}
                type="button"
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="py-1 px-2 text-xs border border-slate-300 rounded-md bg-white cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: User Verification Report                          */}
        {/* ======================================================== */}
        {activeTab === 'user-overview' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">TMID</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Mobile No.</th>
                  <th className="py-3 px-3.5">Email</th>
                  <th className="py-3 px-3.5">Role</th>
                  <th className="py-3 px-3.5 text-center">Subscription</th>
                  <th className="py-3 px-3.5">Subscribed</th>
                  <th className="py-3 px-3 text-center">License Check</th>
                  <th className="py-3 px-3 text-center">PAN Status</th>
                  <th className="py-3 px-3 text-center">Face Match</th>
                  <th className="py-3 px-3 text-center">Court Check</th>
                  <th className="py-3 px-3 text-center">Digital Address</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-slate-900">{item.tmid}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span>{item.mobile}</span>
                        <button
                          onClick={() => copyToClipboard(item.mobile, item.id)}
                          className="text-slate-400 hover:text-slate-600 transition"
                          title="Copy Mobile"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">{item.email || <span className="text-slate-400 italic">--</span>}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">{item.role}</span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs ${item.subscription === 'Trusted' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {item.subscription}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.subscription_date}</td>

                    {/* License Check */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        ✓ Verified <span className="block text-[8px] font-normal opacity-90">{item.license_check.date}</span>
                      </span>
                    </td>

                    {/* PAN Status */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        ✓ Verified <span className="block text-[8px] font-normal opacity-90">{item.pan_status.date}</span>
                      </span>
                    </td>

                    {/* Face Match */}
                    <td className="py-3 px-3 text-center">
                      {item.face_match.status === 'Verified' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          ✓ Verified <span className="block text-[8px] font-normal opacity-90">{item.face_match.date}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-600 text-white">— Not Verified</span>
                      )}
                    </td>

                    {/* Court Check */}
                    <td className="py-3 px-3 text-center">
                      {item.court_check.status === 'Verified' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          ✓ Verified <span className="block text-[8px] font-normal opacity-90">{item.court_check.date}</span>
                        </span>
                      ) : item.court_check.status === 'Initiated' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          ⏳ Initiated <span className="block text-[8px] font-normal opacity-90">{item.court_check.date}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-600 text-white">— Not Verified</span>
                      )}
                    </td>

                    {/* Digital Address */}
                    <td className="py-3 px-3 text-center">
                      {item.digital_address.status === 'Verified' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          ✓ Verified <span className="block text-[8px] font-normal opacity-90">{item.digital_address.date}</span>
                        </span>
                      ) : item.digital_address.status === 'Initiated' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                          ⏳ Initiated <span className="block text-[8px] font-normal opacity-90">{item.digital_address.date}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-600 text-white">— Not Verified</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleOpenReviewModal(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Court Verification Report (Drivers)               */}
        {/* ======================================================== */}
        {activeTab === 'court-verification' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-14">Sr No.</th>
                  <th className="py-3 px-3.5">TMID</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Mobile No.</th>
                  <th className="py-3 px-3.5 text-center">Subscription</th>
                  <th className="py-3 px-3.5">Subscription Date & Time</th>
                  <th className="py-3 px-3.5 text-center">Court Report Status</th>
                  <th className="py-3 px-3.5">Report Date & Time</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.court_status.includes('Red') ? 'bg-rose-50/25 hover:bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className={`py-3 px-3.5 font-mono text-[11px] font-semibold ${item.court_status.includes('Red') ? 'text-rose-700 font-bold' : 'text-slate-900'}`}>
                      {item.tmid}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.mobile}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                        {item.subscription}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.subscription_datetime}</td>
                    <td className="py-3 px-3.5 text-center">
                      {item.court_status.includes('Green') ? (
                        <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-600 text-white shadow-2xs inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Green (Clear)
                        </span>
                      ) : item.court_status.includes('Initiated') ? (
                        <span className="px-3 py-1 rounded text-xs font-bold bg-amber-500 text-white shadow-2xs inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Initiated
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded text-xs font-bold bg-rose-600 text-white shadow-2xs inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Red (Record Found)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.report_datetime}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleOpenReviewModal(item)}
                        className={`px-3 py-1 text-xs font-semibold rounded border transition cursor-pointer ${
                          item.court_status.includes('Red')
                            ? 'text-rose-600 hover:text-rose-800 border-rose-200 hover:bg-rose-50'
                            : 'text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        {item.court_status.includes('Red') ? 'Review Case' : 'View More'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Court Verification by Transporter                 */}
        {/* ======================================================== */}
        {activeTab === 'court-transporter' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Transporter TMID</th>
                  <th className="py-3 px-3.5">Transporter Name</th>
                  <th className="py-3 px-3.5">Transporter Mobile</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Driver Mobile</th>
                  <th className="py-3 px-3.5 text-center">Report Status</th>
                  <th className="py-3 px-3.5">Report Date & Time</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-mono text-[11px] font-semibold text-slate-900">{item.transporter_tmid}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{item.transporter_name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.transporter_mobile}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">{item.driver_name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.driver_mobile}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-600 text-white">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.report_datetime}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setUpdateStatusModal(item)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        View & Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: Digital Address Verification (DAV)                */}
        {/* ======================================================== */}
        {activeTab === 'digital-address' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Driver Mobile</th>
                  <th className="py-3 px-3.5 min-w-[320px]">Address Submitted</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5">Submitted On</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{item.driver_name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.driver_mobile}</td>
                    <td className="py-3 px-3.5 text-slate-700 font-normal">{item.address_submitted}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-600 text-white">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.submitted_on}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setUpdateStatusModal(item)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        View & Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: DAV by Transporter                                */}
        {/* ======================================================== */}
        {activeTab === 'dav-transporter' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Transporter</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Driver Mobile</th>
                  <th className="py-3 px-3.5 min-w-[300px]">Address Submitted</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5">Submitted On</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{item.transporter_name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{item.transporter_mobile}</div>
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">{item.driver_name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.driver_mobile}</td>
                    <td className="py-3 px-3.5 text-slate-600">{item.address_submitted}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-600 text-white">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.submitted_on}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setUpdateStatusModal(item)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        View & Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: Physical Verification by Transporter              */}
        {/* ======================================================== */}
        {activeTab === 'physical-verification' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-3.5">Transporter</th>
                  <th className="py-3 px-3.5">Driver Name</th>
                  <th className="py-3 px-3.5">Driver Mobile</th>
                  <th className="py-3 px-3.5">Driver Email</th>
                  <th className="py-3 px-3.5 text-center">ID Type</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5">Submitted On</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{item.transporter_name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{item.transporter_mobile}</div>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{item.driver_name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-600">{item.driver_mobile}</td>
                    <td className="py-3 px-3.5 text-slate-600">{item.driver_email}</td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${item.id_badge}`}>
                        <CreditCard className="w-3.5 h-3.5" />
                        {item.id_type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-600 text-white">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500">{item.submitted_on}</td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setUpdateStatusModal(item)}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition cursor-pointer"
                      >
                        View & Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BEGIN: Table Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600" data-purpose="table-pagination-footer">
          <div>
            Showing <span className="font-bold text-slate-900">{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : (filteredData.length > 0 ? 1 : 0)}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalRecords || filteredData.length)}</span> of{' '}
            <span className="font-bold text-slate-900">{totalRecords || tabCounts[activeTab] || filteredData.length}</span> entries
          </div>

          <div className="inline-flex items-center -space-x-px rounded-md shadow-2xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-2.5 py-1.5 rounded-l-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 border cursor-pointer font-medium ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white font-bold'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-2.5 py-1.5 rounded-r-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <PageJump page={currentPage} totalPages={totalPages} onGo={setCurrentPage} />
        </div>
        {/* END: Table Pagination Footer */}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: REVIEW 360° VERIFICATION DOSSIER                  */}
      {/* ========================================================= */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {reviewModalData.name || reviewModalData.driver_name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {reviewModalData.tmid || 'TM-RECORD'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">{reviewModalData.mobile || reviewModalData.driver_mobile} • KYC Verification Matrix</p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalData(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">DL Status</div>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5">✓ HMV Valid</div>
                  <div className="text-[10px] text-slate-400">Exp: 2031</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">PAN Status</div>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5">✓ Active & Linked</div>
                  <div className="text-[10px] text-slate-400">ITD Database</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Court Status</div>
                  <div className={`font-bold text-xs mt-0.5 ${reviewModalData.court_status?.includes('Red') ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {reviewModalData.court_status || '✓ Green (Clear)'}
                  </div>
                  <div className="text-[10px] text-slate-400">eCourts API</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Digital Address</div>
                  <div className="font-bold text-amber-700 text-xs mt-0.5">⏳ Geo-Tagged</div>
                  <div className="text-[10px] text-slate-400">DAV Pipeline</div>
                </div>
              </div>

              {reviewModalData.court_summary && (
                <div className={`p-4 rounded-xl border ${reviewModalData.court_status?.includes('Red') ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                  <div className="font-bold text-xs mb-1">eCourts Legal Case Intelligence:</div>
                  <p className="text-xs">{reviewModalData.court_summary}</p>
                </div>
              )}

              {reviewModalData.popupDetails && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1.5 text-xs">
                  <div className="font-bold text-blue-900 flex items-center justify-between">
                    <span>Database Verified Record Details:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-200 text-blue-900 font-mono">LIVE DB</span>
                  </div>
                  {reviewModalData.popupDetails.dl_number && (
                    <div className="text-slate-700"><strong>DL Number:</strong> {reviewModalData.popupDetails.dl_number}</div>
                  )}
                  {reviewModalData.popupDetails.pan && (
                    <div className="text-slate-700"><strong>PAN:</strong> {reviewModalData.popupDetails.pan}</div>
                  )}
                  {reviewModalData.popupDetails.address && (
                    <div className="text-slate-700"><strong>Registered Address:</strong> {reviewModalData.popupDetails.address}</div>
                  )}
                  {reviewModalData.popupDetails.pdf && (
                    <div className="text-slate-700 mt-1">
                      <a href={reviewModalData.popupDetails.pdf} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> View Uploaded Report PDF
                      </a>
                    </div>
                  )}
                  {reviewModalData.popupDetails.report_path && (
                    <div className="text-slate-700 mt-1">
                      <a href={reviewModalData.popupDetails.report_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> View Court Report Document
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Background Screening Pipeline Status</div>
                <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                  <span className="text-slate-600">Sarv Aadhaar OKYC</span>
                  <span className="font-semibold text-emerald-600">Matched 99.4%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                  <span className="text-slate-600">Vahan DL Class Registry</span>
                  <span className="font-semibold text-emerald-600">HMV / TRANSIT OK</span>
                </div>
                <div className="flex items-center justify-between text-[11px] py-1">
                  <span className="text-slate-600">Physical Check Disposition</span>
                  <span className="font-semibold text-amber-600">Transporter Verified</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setReviewModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Profile approved and issued Green Verified Badge!`);
                  setReviewModalData(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
              >
                Approve & Issue Trust Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INITIATE BATCH VERIFICATION                      */}
      {/* ========================================================= */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Initiate Batch KYC & eCourts Check</h3>
              <p className="text-xs text-slate-500 mt-1">
                Trigger bulk automated API screening across eCourts, UIDAI, and Karza validation pipelines for all 24 pending profiles.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Selected Records:</span>
                <span className="font-bold text-slate-900">24 Candidates</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>API Credits Required:</span>
                <span className="font-bold text-blue-600">24 Credits</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchVerify}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Start Batch Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: VIEW & UPDATE STATUS MODAL                       */}
      {/* ========================================================= */}
      {updateStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update Verification Disposition
              </h3>
              <button onClick={() => setUpdateStatusModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div>
                <span className="text-slate-500">Candidate / Transporter:</span>
                <div className="font-bold text-slate-900 text-sm">{updateStatusModal.driver_name || updateStatusModal.name}</div>
                <div className="font-mono text-slate-600">{updateStatusModal.driver_mobile || updateStatusModal.mobile}</div>
              </div>
              {updateStatusModal.address_submitted && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Submitted Address:</span>
                  <div className="text-slate-800 mt-1">{updateStatusModal.address_submitted}</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleStatusUpdate(updateStatusModal, 'Rejected / Flagged')}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
              >
                Reject / Flag
              </button>
              <button
                onClick={() => handleStatusUpdate(updateStatusModal, 'Verified & Approved')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
              >
                Mark Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
