import React, { useState, useEffect, useCallback } from 'react';
import { 
  IndianRupee, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Calendar, 
  Upload, 
  FileText, 
  HelpCircle, 
  UserPlus, 
  Users,
  Eye, 
  Save, 
  Filter, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  X,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import PageJump from '../../components/PageJump';

export default function UpdateRevenue() {
  // Helper to format date YYYY-MM-DD
  const formatDateISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  // Helper to format date DD-MM-YYYY
  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoStr;
  };

  const todayISO = formatDateISO(new Date());
  const yesterdayISO = formatDateISO(new Date(Date.now() - 86400000));

  // Date filter state
  const [selectedDay, setSelectedDay] = useState('Today');
  const [dateRange, setDateRange] = useState({ from: todayISO, to: todayISO });

  // Filter & Search states for Records Table
  const [activeFilterTab, setActiveFilterTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRows, setSelectedRows] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Overview Data from API
  const [kpiData, setKpiData] = useState({
    today_amount: 0,
    today_subscriptions: 0,
    today_subscriptions_count: 0,
    today_matchmaking_fees: 0,
    today_matchmaking_count: 0,
    today_verification_fees: 0,
    today_verification_count: 0,
  });

  const [refundStats, setRefundStats] = useState({
    total_refunded: 0,
    total_refund_count: 0,
    today_refunded: 0,
    active_revenue: 0,
    refund_rate: 0
  });

  const [matrixRows, setMatrixRows] = useState([]);
  const [matrixTotals, setMatrixTotals] = useState({
    driver: 0,
    transporter: 0,
    others: 0,
    premium: 0,
    super_premium: 0,
    verification: 0,
    refunds: 0,
    net: 0
  });

  // TeleChamps Dropdown List
  const [telechampDropdown, setTelechampDropdown] = useState([]);

  // Records Table Data & Pagination
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: 0,
    to: 0
  });

  // Inline edit & row action state
  const [editingRowId, setEditingRowId] = useState(null);
  const [editForm, setEditForm] = useState({
    payment_id: '',
    amount: '',
    telechamp: 'Self',
    job_id: '',
    payment_type: 'Standard',
    payment_source: 'Razorpay',
    remarks: '',
    tmid: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // File upload state
  const [excelFile, setExcelFile] = useState(null);
  const [telechampFile, setTelechampFile] = useState(null);

  // Manual record form state
  const [manualForm, setManualForm] = useState({
    payment_datetime: `${formatDateDisplay(todayISO)} 11:41`,
    tmid: '',
    payment_id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
    telechamp: 'Select TeleChamp',
    type: 'Select Type',
    amount: '0.00',
    source: 'Razorpay',
    job_id: '',
    remarks: ''
  });

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // 1. Fetch Revenue Overview (KPIs, Refund Stats & TeleChamp Matrix)
  const fetchOverview = useCallback(async (from, to) => {
    try {
      setLoadingOverview(true);
      const res = await api.get('/admin/revenue/overview', {
        params: { from_date: from, to_date: to }
      });
      if (res.data?.status === 'success') {
        setKpiData(res.data.kpi || {});
        setRefundStats(res.data.refund_stats || {});
        setMatrixRows(res.data.matrix?.rows || []);
        setMatrixTotals(res.data.matrix?.totals || {});
        if (res.data.date_range?.from && res.data.date_range.from !== from) {
          setDateRange({ from: res.data.date_range.from, to: res.data.date_range.to });
        }
      }
    } catch (err) {
      console.error('Error fetching revenue overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // 2. Fetch Operational Payment Records
  const fetchRecords = useCallback(async (page = 1, limit = entriesPerPage, search = searchTerm, tab = activeFilterTab, sort = sortBy, order = sortOrder) => {
    try {
      setLoadingRecords(true);
      const res = await api.get('/admin/revenue/records', {
        params: {
          page,
          per_page: limit,
          search: search || undefined,
          filter_tab: tab,
          sort_by: sort,
          sort_order: order,
        }
      });
      if (res.data?.status === 'success') {
        setRecords(res.data.data || []);
        setPagination(res.data.pagination || {
          current_page: 1,
          last_page: 1,
          per_page: limit,
          total: 0,
          from: 0,
          to: 0
        });
      }
    } catch (err) {
      console.error('Error fetching revenue records:', err);
    } finally {
      setLoadingRecords(false);
    }
  }, [entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder]);

  // 3. Fetch Telecallers for Dropdown
  const fetchTelechamps = async () => {
    try {
      const res = await api.get('/admin/revenue/telechamps');
      if (res.data?.status === 'success') {
        setTelechampDropdown(res.data.telechamps || []);
      }
    } catch (err) {
      console.error('Error fetching telechamps list:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchOverview(dateRange.from, dateRange.to);
    fetchTelechamps();
  }, [fetchOverview, dateRange.from, dateRange.to]);

  // Fetch records when page, entries, tab, sort or search changes
  useEffect(() => {
    fetchRecords(currentPage, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
  }, [currentPage, entriesPerPage, activeFilterTab, sortBy, sortOrder, fetchRecords]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchRecords(1, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
  };

  // Handle Today / Yesterday Segmented Toggle
  const handleDayToggle = (day) => {
    setSelectedDay(day);
    if (day === 'Today') {
      setDateRange({ from: todayISO, to: todayISO });
    } else if (day === 'Yesterday') {
      setDateRange({ from: yesterdayISO, to: yesterdayISO });
    }
  };

  // Stepper day increment / decrement
  const handleStepDay = (direction) => {
    const current = new Date(dateRange.from);
    current.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const newISO = formatDateISO(current);
    setDateRange({ from: newISO, to: newISO });
    setSelectedDay(newISO === todayISO ? 'Today' : (newISO === yesterdayISO ? 'Yesterday' : 'Custom'));
  };

  // Handle Manual Record Form Submission
  const handleSaveManualRecord = async (e) => {
    e.preventDefault();
    if (!manualForm.tmid.trim()) {
      showToast('Please enter a valid TMID (e.g. TR-1234 or TM2610PBDR409135)', 'error');
      return;
    }
    if (manualForm.telechamp === 'Select TeleChamp') {
      showToast('Please select a valid TeleChamp', 'error');
      return;
    }
    if (manualForm.type === 'Select Type') {
      showToast('Please select a Payment Type', 'error');
      return;
    }
    if (!manualForm.amount || parseFloat(manualForm.amount) <= 0) {
      showToast('Please enter a valid transaction amount', 'error');
      return;
    }

    try {
      setIsSubmittingManual(true);
      const res = await api.post('/admin/revenue/manual-record', manualForm);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Manual transaction record added successfully!');
        // Reset form
        setManualForm({
          payment_datetime: `${formatDateDisplay(todayISO)} 11:41`,
          tmid: '',
          payment_id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
          telechamp: 'Select TeleChamp',
          type: 'Select Type',
          amount: '0.00',
          source: 'Razorpay',
          job_id: '',
          remarks: ''
        });
        // Refresh overview and records list
        fetchOverview(dateRange.from, dateRange.to);
        fetchRecords(1, entriesPerPage, '', activeFilterTab, sortBy, sortOrder);
      } else {
        showToast(res.data?.message || 'Failed to add manual record', 'error');
      }
    } catch (err) {
      console.error('Error saving manual record:', err);
      showToast(err.response?.data?.message || 'Server error adding record', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Handle Excel Upload
  const handleImportData = () => {
    if (!excelFile) {
      showToast('Please select an Excel / CSV file first.', 'error');
      return;
    }
    showToast(`File "${excelFile.name}" selected. Starting background import processing...`);
    setExcelFile(null);
  };

  // Handle TeleChamp Excel Assignment
  const handleAssignTelechamps = () => {
    if (!telechampFile) {
      showToast('Please choose a file with payment IDs and TeleChamp IDs first.', 'error');
      return;
    }
    showToast(`TeleChamp assignments from "${telechampFile.name}" submitted!`);
    setTelechampFile(null);
  };

  // Inline Row Editing Handlers
  const handleStartEdit = (rec) => {
    setEditingRowId(rec.id);
    let initialType = rec.payment_type || 'Standard';
    if (initialType === 'Subscription') initialType = 'Standard';
    let initialSource = 'Razorpay';
    if (rec.payment_source) {
      initialSource = rec.payment_source.charAt(0).toUpperCase() + rec.payment_source.slice(1).toLowerCase();
    }
    setEditForm({
      payment_id: rec.payment_id || '',
      amount: rec.amount || '',
      telechamp: rec.telechamp || 'Self',
      job_id: (rec.job_id && rec.job_id !== '—' && rec.job_id !== '-') ? rec.job_id : '',
      payment_type: initialType,
      payment_source: initialSource,
      remarks: rec.remarks || '',
      tmid: rec.tmid && rec.tmid !== 'N/A' ? rec.tmid : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.payment_id.trim()) {
      showToast('Payment ID cannot be empty', 'error');
      return;
    }
    if (!editForm.amount || parseFloat(editForm.amount) < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    try {
      setIsSavingEdit(true);
      const res = await api.put(`/admin/revenue/records/${id}`, editForm);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Payment record updated successfully!');
        setEditingRowId(null);
        fetchRecords(currentPage, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
        fetchOverview(dateRange.from, dateRange.to);
      } else {
        showToast(res.data?.message || 'Failed to update record', 'error');
      }
    } catch (err) {
      console.error('Error updating record:', err);
      showToast(err.response?.data?.message || 'Server error updating record', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Refund Button: Directly update captured in payment as refunded
  const handleRefund = async (rec) => {
    if (rec.is_refunded) {
      showToast('This payment is already marked as refunded.', 'error');
      return;
    }
    const confirmed = window.confirm(`Update captured payment ${rec.payment_id} (₹${rec.amount}) to refunded?`);
    if (!confirmed) return;

    try {
      setActionLoadingId(rec.id);
      const res = await api.post(`/admin/revenue/records/${rec.id}/refund`);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Payment marked as refunded successfully!');
        fetchRecords(currentPage, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
        fetchOverview(dateRange.from, dateRange.to);
      } else {
        showToast(res.data?.message || 'Failed to refund payment', 'error');
      }
    } catch (err) {
      console.error('Error refunding payment:', err);
      showToast(err.response?.data?.message || 'Server error processing refund', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Record
  const handleDelete = async (rec) => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete payment record #${rec.id} (${rec.payment_id})?`);
    if (!confirmed) return;

    try {
      setActionLoadingId(rec.id);
      const res = await api.delete(`/admin/revenue/records/${rec.id}`);
      if (res.data?.status === 'success') {
        showToast(res.data.message || 'Payment record deleted successfully!');
        if (editingRowId === rec.id) setEditingRowId(null);
        fetchRecords(currentPage, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
        fetchOverview(dateRange.from, dateRange.to);
      } else {
        showToast(res.data?.message || 'Failed to delete record', 'error');
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      showToast(err.response?.data?.message || 'Server error deleting record', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    const headers = ['#', 'Payment Date', 'Payment Time', 'TMID', 'Registration Date', 'Registration Time', 'Payment ID', 'Amount (INR)', 'TeleChamps', 'Job ID', 'Payment Type', 'Payment Source', 'Remarks'];
    const rows = records.map(r => [
      r.id,
      r.payment_date,
      r.payment_time,
      r.tmid,
      r.registration_date,
      r.registration_time,
      r.payment_id,
      r.amount,
      r.telechamp,
      r.job_id,
      r.payment_type,
      r.payment_source || '—',
      r.remarks || '—'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TruckMitr_Operational_Payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Operational Payments CSV exported successfully!');
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(records.map(r => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rId => rId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Format currency
  const formatINR = (num) => {
    return '₹' + Number(num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <main className="p-6 space-y-6 flex-1 bg-[#f8fafc] text-slate-800 font-sans antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold animate-fade-in ${
          toastType === 'error' ? 'bg-rose-600' : 'bg-emerald-700'
        }`}>
          {toastType === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEGIN: PageTitleBreadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Update Revenue</h1>
          <button 
            onClick={() => {
              fetchOverview(dateRange.from, dateRange.to);
              fetchRecords(currentPage, entriesPerPage, searchTerm, activeFilterTab, sortBy, sortOrder);
            }} 
            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingOverview || loadingRecords) ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
        <nav className="flex items-center text-xs font-medium text-slate-500 space-x-1.5">
          <a className="hover:text-blue-600 transition-colors" href="/">Dashboard</a>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Update Revenue</span>
        </nav>
      </div>
      {/* END: PageTitleBreadcrumb */}

      {/* BEGIN: TopMetricsKPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-metrics-grid">
        {/* Card 1: Today's Amount */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Amount</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {loadingOverview ? '...' : formatINR(kpiData.today_amount)}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live
            </span>
          </div>
        </div>

        {/* Card 2: Today's Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Subscriptions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {loadingOverview ? '...' : formatINR(kpiData.today_subscriptions)}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {loadingOverview ? '...' : `${kpiData.today_subscriptions_count || 0} sub`}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Matchmaking Fees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Matchmaking Fees</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {loadingOverview ? '...' : formatINR(kpiData.today_matchmaking_fees)}
            </h3>
            <span className="text-[11px] font-normal text-slate-400">
              {loadingOverview ? '...' : `${kpiData.today_matchmaking_count || 0} closed`}
            </span>
          </div>
        </div>

        {/* Card 4: Today's Verification Fee */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Verification Fee</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {loadingOverview ? '...' : formatINR(kpiData.today_verification_fees)}
            </h3>
            <span className="text-[11px] font-normal text-slate-400">
              {loadingOverview ? '...' : `${kpiData.today_verification_count || 0} verified`}
            </span>
          </div>
        </div>
      </section>
      {/* END: TopMetricsKPI */}

      {/* BEGIN: RefundStatsBar */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4" data-purpose="refund-stats">
        {/* Overview Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Refund Stats</p>
            <p className="text-sm font-bold text-slate-800">Overview</p>
          </div>
        </div>
        {/* Total Refunded */}
        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-500">Total Refunded</p>
          <p className="text-base font-bold text-rose-600">{loadingOverview ? '...' : formatINR(refundStats.total_refunded)}</p>
          <p className="text-[10px] text-slate-400">{refundStats.total_refund_count || 0} payments</p>
        </div>
        {/* Today's Refunded */}
        <div className="text-center sm:text-left">
          <p className="text-xs text-slate-500">Today's Refunded</p>
          <p className="text-base font-bold text-slate-800">{loadingOverview ? '...' : formatINR(refundStats.today_refunded)}</p>
        </div>
        {/* Active Revenue */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-center">
          <p className="text-xs font-semibold text-emerald-700">Active</p>
          <p className="text-base font-bold text-emerald-800">{loadingOverview ? '...' : formatINR(refundStats.active_revenue)}</p>
        </div>
        {/* Refund Rate */}
        <div className="bg-rose-50 border border-rose-100 rounded-lg px-4 py-2 text-center">
          <p className="text-xs font-semibold text-rose-700">Refund Rate</p>
          <p className="text-base font-bold text-rose-800">{loadingOverview ? '...' : `${refundStats.refund_rate}%`}</p>
        </div>
      </section>
      {/* END: RefundStatsBar */}

      {/* BEGIN: TeleChampPerformanceMatrix */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs" data-purpose="telechamp-performance-table">
        {/* Modern Enterprise Header Card Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">TeleChamp Subscription Performance</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live Metric
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">Daily breakdown across subscriptions, matchmaking &amp; verification channels</p>
            </div>
          </div>

          {/* Filter & Date Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Today / Yesterday Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              <button 
                onClick={() => handleDayToggle('Today')} 
                className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${selectedDay === 'Today' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'}`}
              >
                Today
              </button>
              <button 
                onClick={() => handleDayToggle('Yesterday')} 
                className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${selectedDay === 'Yesterday' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'}`}
              >
                Yesterday
              </button>
            </div>

            {/* Stepper Controls */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-xs">
              <button 
                onClick={() => handleStepDay('prev')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-lg border-r border-slate-200 transition-colors cursor-pointer" 
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleStepDay('next')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer" 
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Date Range Controls */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input 
                type="date"
                value={dateRange.from}
                onChange={(e) => {
                  setDateRange({ ...dateRange, from: e.target.value });
                  setSelectedDay('Custom');
                }}
                className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-xs">
              <span className="text-slate-400 font-medium">To:</span>
              <input 
                type="date"
                value={dateRange.to}
                onChange={(e) => {
                  setDateRange({ ...dateRange, to: e.target.value });
                  setSelectedDay('Custom');
                }}
                className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Multi-Tier Grouped Data Grid */}
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              {/* Tier 1 Grouped Headers */}
              <tr className="border-b border-slate-200 text-xs font-semibold">
                <th className="w-10 px-3 py-3 bg-slate-50 text-slate-500 text-center border-r border-slate-200" rowSpan={2}>#</th>
                <th className="px-4 py-3 bg-slate-50 text-slate-700 border-r border-slate-200 min-w-[180px] font-bold tracking-tight" rowSpan={2}>
                  TeleChamp Agent
                </th>
                <th className="px-3 py-2 bg-emerald-50 text-emerald-800 text-center border-r border-slate-200 font-bold tracking-tight" colSpan={3}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Subscription ({formatDateDisplay(dateRange.from)})</span>
                  </div>
                </th>
                <th className="px-3 py-2 bg-purple-50 text-purple-800 text-center border-r border-slate-200 font-bold tracking-tight" colSpan={2}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-purple-200 text-purple-800 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>Matchmaking ({formatDateDisplay(dateRange.from)})</span>
                  </div>
                </th>
                <th className="px-3 py-2 bg-sky-50 text-sky-800 text-center border-r border-slate-200 font-bold tracking-tight" rowSpan={2}>
                  <div className="flex flex-col items-center">
                    <span>Verification</span>
                    <span className="text-[10px] font-medium text-sky-700/80">({formatDateDisplay(dateRange.from)})</span>
                  </div>
                </th>
                <th className="px-3 py-2 bg-rose-50 text-rose-800 text-center border-r border-slate-200 font-bold tracking-tight" rowSpan={2}>
                  <div className="flex flex-col items-center">
                    <span>Refunds</span>
                    <span className="text-[10px] font-medium text-rose-700/80">({formatDateDisplay(dateRange.from)})</span>
                  </div>
                </th>
                <th className="px-3 py-2 bg-slate-100 text-slate-800 text-center font-bold tracking-tight" rowSpan={2}>
                  <div className="flex flex-col items-center">
                    <span>Net Total</span>
                    <span className="text-[10px] font-medium text-slate-500">({formatDateDisplay(dateRange.from)})</span>
                  </div>
                </th>
              </tr>
              {/* Tier 2 Sub-Headers */}
              <tr className="text-[11px] font-semibold border-b border-slate-200 text-slate-600 uppercase tracking-wider">
                <th className="px-3 py-2 bg-emerald-50/60 text-emerald-800 text-center border-r border-slate-200 font-semibold">DRIVER</th>
                <th className="px-3 py-2 bg-emerald-50/60 text-emerald-800 text-center border-r border-slate-200 font-semibold">TRANSPORTER</th>
                <th className="px-3 py-2 bg-emerald-50/60 text-emerald-800 text-center border-r border-slate-200 font-semibold">OTHERS</th>
                <th className="px-3 py-2 bg-purple-50/60 text-purple-800 text-center border-r border-slate-200 font-semibold">PREMIUM</th>
                <th className="px-3 py-2 bg-purple-50/60 text-purple-800 text-center border-r border-slate-200 font-semibold">SUPER PREMIUM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {loadingOverview ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading TeleChamp Performance Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No TeleChamp transaction metrics found for this date.
                  </td>
                </tr>
              ) : (
                matrixRows.map((tc) => (
                  <tr key={tc.id} className={`hover:bg-blue-50/40 transition-colors ${tc.isHighlight ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-400 border-r border-slate-200">{tc.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        {tc.isSelf ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                            🌐
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full ${tc.color || 'bg-blue-100 text-blue-700'} font-bold text-[10px] flex items-center justify-center shrink-0`}>
                            {tc.initials || tc.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className={tc.isSelf ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}>{tc.name}</span>
                        {tc.isSelf && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-1">
                            Online
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.driver > 0 ? 'font-bold text-emerald-700' : 'text-slate-300'}`}>
                      {tc.driver > 0 ? formatINR(tc.driver) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.transporter > 0 ? 'font-bold text-emerald-700' : 'text-slate-300'}`}>
                      {tc.transporter > 0 ? formatINR(tc.transporter) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.others > 0 ? 'font-bold text-emerald-700' : 'text-slate-300'}`}>
                      {tc.others > 0 ? formatINR(tc.others) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.premium > 0 ? 'font-bold text-purple-700' : 'text-slate-300'}`}>
                      {tc.premium > 0 ? formatINR(tc.premium) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.super_premium > 0 ? 'font-bold text-purple-700' : 'text-slate-300'}`}>
                      {tc.super_premium > 0 ? formatINR(tc.super_premium) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.verification > 0 ? 'font-bold text-sky-700' : 'text-slate-300'}`}>
                      {tc.verification > 0 ? formatINR(tc.verification) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center border-r border-slate-200 ${tc.refunds > 0 ? 'font-bold text-rose-700' : 'text-slate-300'}`}>
                      {tc.refunds > 0 ? formatINR(tc.refunds) : '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-center font-extrabold ${tc.net > 0 ? 'text-emerald-700 bg-emerald-50/40' : 'text-slate-700'}`}>
                      {formatINR(tc.net)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Totals Footer */}
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-800 text-xs">
              <tr>
                <td className="px-4 py-3 text-right font-extrabold tracking-wide uppercase text-slate-600 border-r border-slate-200" colSpan={2}>
                  TOTALS
                </td>
                <td className="px-3 py-3 text-center text-emerald-700 font-extrabold border-r border-slate-200 bg-emerald-50/50">
                  {formatINR(matrixTotals.driver)}
                </td>
                <td className="px-3 py-3 text-center text-emerald-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.transporter)}
                </td>
                <td className="px-3 py-3 text-center text-emerald-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.others)}
                </td>
                <td className="px-3 py-3 text-center text-purple-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.premium)}
                </td>
                <td className="px-3 py-3 text-center text-purple-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.super_premium)}
                </td>
                <td className="px-3 py-3 text-center text-sky-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.verification)}
                </td>
                <td className="px-3 py-3 text-center text-rose-700 font-bold border-r border-slate-200">
                  {formatINR(matrixTotals.refunds)}
                </td>
                <td className="px-3 py-3 text-center text-slate-900 bg-slate-200/80 font-black text-sm">
                  {formatINR(matrixTotals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      {/* END: TeleChampPerformanceMatrix */}

      {/* BEGIN: DualUploadPanels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-purpose="excel-upload-actions">
        {/* Panel 1: Upload Excel / CSV */}
        <div className="bg-white rounded-xl border-2 border-dashed border-blue-200 p-5 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Upload Excel / CSV</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Import new collections or update existing ones with standard fields.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select File <span className="text-rose-500">*</span> <span className="text-[11px] font-normal text-slate-400">(xlsx, xls, csv — max 10 MB)</span>
              </label>
              <div className="flex rounded-md border border-slate-300 overflow-hidden bg-slate-50 text-xs">
                <label className="bg-slate-200/80 hover:bg-slate-300/80 px-3 py-2 font-medium text-slate-700 border-r border-slate-300 cursor-pointer transition-colors">
                  Choose file
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={(e) => setExcelFile(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
                <span className="px-3 py-2 text-slate-500 flex-1 truncate">
                  {excelFile ? excelFile.name : 'No file chosen'}
                </span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                onClick={handleImportData}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Data</span>
              </button>
              <button 
                onClick={() => showToast('Downloading standard collection template...')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Template</span>
                <Download className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button 
                onClick={() => alert("Standard Excel Template Format:\n- payment_id (String)\n- tmid (e.g. TM2610PBDR409135)\n- amount (Number)\n- payment_type (verified, standard, etc)\n- transaction_date (YYYY-MM-DD)\n- subscription_by (TeleChamp Name or 'Self')")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Assign TeleChamps via Excel */}
        <div className="bg-white rounded-xl border-2 border-dashed border-purple-200 p-5 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800">Assign TeleChamps via Excel</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Update TeleChamp assignment (<span className="text-purple-600 font-mono text-[11px]">subscription_by</span>) by uploading payment IDs with corresponding telechamp IDs.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select File <span className="text-rose-500">*</span> <span className="text-[11px] font-normal text-slate-400">(xlsx, xls, csv — contains payment_id &amp; telechamp_id)</span>
              </label>
              <div className="flex rounded-md border border-slate-300 overflow-hidden bg-slate-50 text-xs">
                <label className="bg-slate-200/80 hover:bg-slate-300/80 px-3 py-2 font-medium text-slate-700 border-r border-slate-300 cursor-pointer transition-colors">
                  Choose file
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={(e) => setTelechampFile(e.target.files[0])} 
                    className="hidden" 
                  />
                </label>
                <span className="px-3 py-2 text-slate-500 flex-1 truncate">
                  {telechampFile ? telechampFile.name : 'No file chosen'}
                </span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button 
                onClick={handleAssignTelechamps}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Assign TeleChamps</span>
              </button>
              <button 
                onClick={() => showToast('Downloading TeleChamp Assignment template...')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Template</span>
                <Download className="w-3.5 h-3.5 text-purple-600" />
              </button>
              <button 
                onClick={() => alert("TeleChamp Assignment Format:\nColumns: payment_id, telechamp_id\nExample: pay_Tk7vLkEGR7q9nf, 8")}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                <span>View Format</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* END: DualUploadPanels */}

      {/* BEGIN: AddManualRecord */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6 transition-all hover:border-slate-300" data-purpose="manual-record-form">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Add Manual Record</h3>
                <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                  Direct Database Integration
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Enter validated transaction details for subscription, matchmaking, or verification records. Fields marked with <span className="text-rose-500 font-semibold">*</span> are required.
              </p>
            </div>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium self-start md:self-center">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Fast Record Creation</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveManualRecord} className="space-y-4">
          {/* Row 1: 5 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Field 1: Payment Date Time */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Payment Date Time <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={manualForm.payment_datetime}
                  onChange={(e) => setManualForm({ ...manualForm, payment_datetime: e.target.value })}
                  placeholder="05-10-2026 11:41"
                  className="w-full h-10 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 pr-9 bg-slate-50/50 focus:bg-white text-slate-800 transition-colors" 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Field 2: TMID */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>TMID <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={manualForm.tmid}
                  onChange={(e) => setManualForm({ ...manualForm, tmid: e.target.value.toUpperCase() })}
                  placeholder="e.g. TR-1234 or TM2610PBDR409135" 
                  className="w-full h-10 text-xs uppercase font-mono border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400 transition-colors" 
                />
              </div>
            </div>

            {/* Field 3: Payment ID */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Payment ID <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={manualForm.payment_id}
                  onChange={(e) => setManualForm({ ...manualForm, payment_id: e.target.value })}
                  placeholder="PAY-1234" 
                  className="w-full h-10 text-xs font-mono font-medium border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 transition-colors" 
                />
              </div>
            </div>

            {/* Field 4: TeleChamp */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>TeleChamp <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <select 
                value={manualForm.telechamp}
                onChange={(e) => setManualForm({ ...manualForm, telechamp: e.target.value })}
                className="w-full h-10 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 transition-colors cursor-pointer"
              >
                <option value="Select TeleChamp">Select TeleChamp</option>
                <option value="Self">Self (Online)</option>
                {telechampDropdown.map(tc => (
                  <option key={tc.id} value={tc.name}>{tc.name}</option>
                ))}
              </select>
            </div>

            {/* Field 5: Type */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Type <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <select 
                value={manualForm.type}
                onChange={(e) => setManualForm({ ...manualForm, type: e.target.value })}
                className="w-full h-10 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 transition-colors cursor-pointer"
              >
                <option value="Select Type">Select Type</option>
                <option value="Subscription">Subscription</option>
                <option value="Matchmaking">Matchmaking</option>
                <option value="Verification">Verification</option>
                <option value="Refund">Refund</option>
              </select>
            </div>
          </div>

          {/* Row 2: Amount, Source, Job ID, Remarks, and Save Button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end pt-1">
            {/* Field 6: Amount */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Amount (INR) <span className="text-rose-500 font-bold ml-0.5">*</span></span>
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-slate-50/50 focus-within:bg-white transition-colors overflow-hidden h-10">
                <span className="pl-3 pr-2 text-xs font-bold text-slate-500 select-none">₹</span>
                <input 
                  type="text" 
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  placeholder="0.00" 
                  className="w-full h-full text-xs font-semibold border-0 bg-transparent py-2 pr-3 pl-0 focus:ring-0 text-slate-800 placeholder-slate-400" 
                />
              </div>
            </div>

            {/* Field 7: Source (Optional) */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Source</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <select 
                value={manualForm.source}
                onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                className="w-full h-10 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 transition-colors cursor-pointer"
              >
                <option value="Razorpay">Razorpay</option>
                <option value="Manual Bank Transfer">Manual Bank Transfer</option>
                <option value="Cash / Direct">Cash / Direct</option>
                <option value="UPI QR">UPI QR</option>
              </select>
            </div>

            {/* Field 8: Job ID (Optional) */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Job ID</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <input 
                type="text" 
                value={manualForm.job_id}
                onChange={(e) => setManualForm({ ...manualForm, job_id: e.target.value })}
                placeholder="e.g. TMJB01447" 
                className="w-full h-10 text-xs font-mono border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400 transition-colors" 
              />
            </div>

            {/* Field 9: Remarks */}
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Remarks</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <input 
                type="text" 
                value={manualForm.remarks}
                onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                placeholder="Internal notes..." 
                className="w-full h-10 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white text-slate-800 placeholder-slate-400 transition-colors" 
              />
            </div>

            {/* Field 10: Save Button */}
            <div>
              <button 
                type="submit"
                disabled={isSubmittingManual}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
              >
                {isSubmittingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>
      {/* END: AddManualRecord */}

      {/* BEGIN: RecordsSection */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs" data-purpose="records-table-container">
        {/* Premium Card Header & Controls Toolbar */}
        <div className="p-5 border-b border-slate-200 space-y-4 bg-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Stats Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Operational Payment Records</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                    {loadingRecords ? '...' : `${Number(pagination.total || 0).toLocaleString()} Total Transactions`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">Comprehensive synchronized log of online payments, subscriptions, and job matchmaking receipts</p>
              </div>
            </div>

            {/* Quick Filter Action Badges & Export */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => {
                  setActiveFilterTab('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border ${
                  activeFilterTab === 'all' 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>All Records</span>
              </button>
              <button 
                onClick={() => {
                  setActiveFilterTab('missing');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border ${
                  activeFilterTab === 'missing' 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Highlight Missing</span>
              </button>
              <button 
                onClick={() => {
                  setActiveFilterTab('unsynced');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border ${
                  activeFilterTab === 'unsynced' 
                    ? 'border-amber-600 bg-amber-600 text-white' 
                    : 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Unsynced Refunds</span>
              </button>
              <button 
                onClick={handleExportCSV}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Bottom Controls: Per-page, Sorting & Search Input */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              {/* Entries Selector */}
              <div className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <span className="font-medium">Show</span>
                <select 
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold border-0 bg-transparent py-0 pl-1 pr-6 text-slate-700 focus:ring-0 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="font-medium">entries</span>
              </div>

              {/* Sort Controls */}
              <div className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <span className="font-medium">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-semibold border-0 bg-transparent py-0 pl-1 pr-6 text-slate-700 focus:ring-0 cursor-pointer"
                >
                  <option value="payment_date">Payment Date</option>
                  <option value="amount">Amount</option>
                  <option value="registration_date">Registration Date</option>
                  <option value="id">ID</option>
                </select>
                <div className="h-3.5 w-px bg-slate-300"></div>
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="text-xs font-semibold border-0 bg-transparent py-0 pl-1 pr-6 text-blue-600 focus:ring-0 cursor-pointer"
                >
                  <option value="desc">Desc (↓)</option>
                  <option value="asc">Asc (↑)</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative flex items-center w-64 sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search payment ID, TMID..." 
                  className="w-full text-xs pl-9 pr-20 py-1.5 border border-slate-200 rounded-l-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 transition-colors" 
                />
                <button 
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-r-lg border border-blue-600 whitespace-nowrap transition-colors shadow-xs cursor-pointer"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detailed High-Precision Operational Table */}
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                <th className="w-10 px-3 py-3 text-center border-r border-slate-100">
                  <input 
                    type="checkbox" 
                    onChange={toggleSelectAll} 
                    checked={selectedRows.length === records.length && records.length > 0} 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    title="Select All" 
                  />
                </th>
                <th className="w-12 px-3 py-3 text-center text-slate-400 font-bold border-r border-slate-100">#</th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">
                  <div 
                    onClick={() => {
                      setSortBy('payment_date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    <span>Payment Date</span>
                    <ChevronRight className={`w-3 h-3 text-blue-600 transform ${sortOrder === 'desc' ? 'rotate-90' : '-rotate-90'}`} />
                  </div>
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">TMID</th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">Registration Date</th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">Payment ID</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right border-r border-slate-100">
                  <div 
                    onClick={() => {
                      setSortBy('amount');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="inline-flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600 transition-colors w-full"
                  >
                    <span>Amount (₹)</span>
                    <IndianRupee className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">TeleChamps</th>
                <th className="px-3 py-3 font-bold text-slate-700 text-center border-r border-slate-100">Job ID</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center border-r border-slate-100">Payment Type</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center border-r border-slate-100">Payment Source</th>
                <th className="px-4 py-3 font-bold text-slate-700 border-r border-slate-100">Remarks</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {loadingRecords ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Fetching operational payment records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No payment records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try modifying your search term or active filters</p>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isEditing = editingRowId === rec.id;

                  if (isEditing) {
                    return (
                      <tr key={rec.id} className="bg-blue-50/20 border-b border-blue-200">
                        <td className="px-3 py-2 text-center border-r border-slate-100">
                          <input 
                            type="checkbox" 
                            disabled 
                            checked={selectedRows.includes(rec.id)} 
                            className="rounded border-slate-300 text-blue-600 opacity-50 cursor-not-allowed" 
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] font-bold text-slate-400 border-r border-slate-100">
                          {rec.id}
                        </td>
                        <td className="px-4 py-2 border-r border-slate-100">
                          <div className="font-medium text-slate-800">{rec.payment_date}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{rec.payment_time}</div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <input 
                            type="text" 
                            value={editForm.tmid} 
                            onChange={(e) => setEditForm({ ...editForm, tmid: e.target.value.toUpperCase() })} 
                            className="h-8 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-semibold bg-white text-slate-800 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-4 py-2 border-r border-slate-100">
                          <div className="text-slate-700 font-medium">{rec.registration_date}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{rec.registration_time}</div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <input 
                            type="text" 
                            value={editForm.payment_id} 
                            onChange={(e) => setEditForm({ ...editForm, payment_id: e.target.value })} 
                            className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded font-mono bg-white text-slate-800 min-w-[150px] w-full focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right">
                          <input 
                            type="number" 
                            step="0.01" 
                            value={editForm.amount} 
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} 
                            className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded font-bold bg-white text-slate-800 w-24 text-right focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <select 
                            value={editForm.telechamp} 
                            onChange={(e) => setEditForm({ ...editForm, telechamp: e.target.value })} 
                            className="h-8 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 min-w-[130px] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="Self">Self</option>
                            {telechampDropdown.map(tc => (
                              <option key={tc.id} value={tc.name}>{tc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <input 
                            type="text" 
                            placeholder="Job ID" 
                            value={editForm.job_id} 
                            onChange={(e) => setEditForm({ ...editForm, job_id: e.target.value })} 
                            className="h-8 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 w-24 text-center focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <select 
                            value={editForm.payment_type} 
                            onChange={(e) => setEditForm({ ...editForm, payment_type: e.target.value })} 
                            className="h-8 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 min-w-[110px] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Trusted">Trusted</option>
                            <option value="Job Ready">Job Ready</option>
                            <option value="Verified">Verified</option>
                            <option value="Subscription">Subscription</option>
                            <option value="Matchmaking">Matchmaking</option>
                            <option value="Verification">Verification</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <select 
                            value={editForm.payment_source} 
                            onChange={(e) => setEditForm({ ...editForm, payment_source: e.target.value })} 
                            className="h-8 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 min-w-[110px] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="Razorpay">Razorpay</option>
                            <option value="Hdfc">Hdfc</option>
                            <option value="Online">Online</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100">
                          <input 
                            type="text" 
                            placeholder="Remarks" 
                            value={editForm.remarks} 
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} 
                            className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              type="button"
                              onClick={() => handleSaveEdit(rec.id)} 
                              disabled={isSavingEdit} 
                              className="w-7 h-7 rounded bg-[#65a30d] hover:bg-green-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer" 
                              title="Save Changes"
                            >
                              {isSavingEdit ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button 
                              type="button"
                              onClick={handleCancelEdit} 
                              disabled={isSavingEdit} 
                              className="w-7 h-7 rounded bg-[#4b5563] hover:bg-slate-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer" 
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={rec.id} className={`hover:bg-slate-50/80 transition-colors ${rec.is_job ? 'bg-purple-50/15' : ''}`}>
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(rec.id)} 
                          onChange={() => toggleSelectRow(rec.id)} 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] font-medium text-slate-400 border-r border-slate-100">{rec.id}</td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <div className="font-medium text-slate-800">{rec.payment_date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.payment_time}</div>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <span className="font-mono text-slate-800 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                          {rec.tmid}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <div className="text-slate-700 font-medium">{rec.registration_date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.registration_time}</div>
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        {rec.is_job ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-bold text-rose-600 text-[11px]">{rec.payment_id}</span>
                            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[10px] font-bold tracking-tight shadow-xs">JOB</span>
                          </div>
                        ) : (
                          <div className="font-mono font-semibold text-pink-600 bg-pink-50/60 border border-pink-100/60 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1.5">
                            <span>{rec.payment_id}</span>
                          </div>
                        )}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-extrabold border-r border-slate-100 ${rec.is_job ? 'text-purple-700' : 'text-slate-900'}`}>
                        ₹{rec.amount}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {rec.isSelf ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span className="font-medium text-slate-800">{rec.telechamp}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                {rec.initials || rec.telechamp.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-blue-700">{rec.telechamp}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-slate-100">
                        {rec.job_id && rec.job_id !== '—' && rec.job_id !== '-' ? (
                          <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{rec.job_id}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center border-r border-slate-100">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          rec.payment_type === 'Matchmaking' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : rec.payment_type === 'Verification'
                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {rec.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center border-r border-slate-100">
                        {rec.payment_source ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4b5563] text-white shadow-xs capitalize">
                            {rec.payment_source}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 border-r border-slate-100">
                        {rec.remarks ? (
                          <span className="text-slate-600 text-xs font-normal max-w-[150px] truncate block" title={rec.remarks}>
                            {rec.remarks}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(rec)} 
                            className="w-7 h-7 rounded bg-[#2563eb] hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer" 
                            title="Edit Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRefund(rec)} 
                            disabled={actionLoadingId === rec.id || rec.is_refunded}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-colors shadow-xs ${
                              rec.is_refunded 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-[#eab308] hover:bg-amber-600 text-white cursor-pointer'
                            }`}
                            title={rec.is_refunded ? "Already Refunded" : "Refund Payment (Mark captured as refunded)"}
                          >
                            {actionLoadingId === rec.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(rec)} 
                            disabled={actionLoadingId === rec.id}
                            className="w-7 h-7 rounded bg-[#ef4444] hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer" 
                            title="Delete Record"
                          >
                            {actionLoadingId === rec.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Dynamic Pagination Bar */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-slate-800 font-mono">{pagination.from || 0}</span>
            <span>to</span>
            <span className="font-bold text-slate-800 font-mono">{pagination.to || 0}</span>
            <span>of</span>
            <span className="font-bold text-slate-800 font-mono">{Number(pagination.total || 0).toLocaleString()}</span>
            <span>entries</span>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button 
              disabled={pagination.current_page <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer" 
              title="Previous Page"
            >
              ‹
            </button>

            {/* Page 1 */}
            <button 
              onClick={() => setCurrentPage(1)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                pagination.current_page === 1 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
              }`}
            >
              1
            </button>

            {/* Nearby Pages */}
            {pagination.current_page > 3 && <span className="px-1 text-slate-400">...</span>}

            {[pagination.current_page - 1, pagination.current_page, pagination.current_page + 1]
              .filter(p => p > 1 && p < pagination.last_page)
              .map(p => (
                <button 
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    pagination.current_page === p 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {p}
                </button>
              ))
            }

            {pagination.current_page < pagination.last_page - 2 && <span className="px-1 text-slate-400">...</span>}

            {/* Last Page */}
            {pagination.last_page > 1 && (
              <button 
                onClick={() => setCurrentPage(pagination.last_page)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  pagination.current_page === pagination.last_page 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                {pagination.last_page}
              </button>
            )}

            <button 
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))}
              className="px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer" 
              title="Next Page"
            >
              ›
            </button>
            <PageJump page={currentPage} totalPages={pagination.last_page} onGo={setCurrentPage} />
          </div>
        </div>
      </section>
      {/* END: RecordsSection */}
    </main>
  );
}