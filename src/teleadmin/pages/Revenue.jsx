import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@teleadmin/router';
import { useAuth } from '../context/AuthContext';
import { revenueApi } from '../services/api/revenueApi';
import axiosInstance from '../services/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { FileSpreadsheet, Upload, Download, HelpCircle, UserCheck, PlusCircle, Filter, PenTool, AlertTriangle, Search } from 'lucide-react-teleadmin';

const Revenue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'manager') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    records: { data: [], current_page: 1, last_page: 1, total: 0 },
    totalAmount: 0,
    totalCount: 0,
    todayAmount: 0,
    todaySelfAmount: 0,
    todayCount: 0,
    totalRefundedAmount: 0,
    todayRefundedAmount: 0,
    refundedCount: 0,
    roles: [],
    paymentTypes: [],
    telecallers: [],
    all_plans: [],
    todaySubscriptionAmount: 0,
    todayJobAmount: 0,
    telechampStats: [],
    todayIdCheckFee: 0,
    globalSubDetailed: {},
    globalJobDetailed: {},
    globalVerDetailed: {},
    globalRefundDetailed: {}
  });

  const today = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local timezone
  
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 25,
    search: '',
    role: '',
    payment_type: '',
    from_date: '',
    to_date: '',
    telechamp: '',
    refund_status: '',
    sort_by: 'payment_date',
    order: 'desc',
    tc_from: today,
    tc_to: today,
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [manualAmount, setManualAmount] = useState("");
  const [highlightMissing, setHighlightMissing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTodayExportModal, setShowTodayExportModal] = useState(false);
  const [todayExportDate, setTodayExportDate] = useState(today);
  
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobModalData, setJobModalData] = useState({ id: null, amount: '', number_of_drivers: '1' });
  const [exportType, setExportType] = useState('daily'); // 'daily' or 'telechamp'
  const [exportStartDate, setExportStartDate] = useState(today);
  const [exportEndDate, setExportEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingToday, setIsExportingToday] = useState(false);
  const [isExportingAttempts, setIsExportingAttempts] = useState(false);

  const handleExportTodayReport = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsExportingToday(true);
    try {
      const blob = await revenueApi.exportTodayReport(todayExportDate);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Today_Revenue_Report_${todayExportDate}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Today report exported successfully!');
      setShowTodayExportModal(false);
    } catch (err) {
      toast.error('Failed to export today report');
      console.error(err);
    } finally {
      setIsExportingToday(false);
    }
  };

  const handleExportAttemptsReport = async () => {
    setIsExportingAttempts(true);
    try {
      const blob = await revenueApi.exportAttemptsReport();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Call_Attempts_Report_${new Date().toLocaleDateString('en-CA')}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Call attempts report exported successfully!');
    } catch (err) {
      toast.error('Failed to export attempts report');
      console.error(err);
    } finally {
      setIsExportingAttempts(false);
    }
  };

  const handleExportDailyReport = async (e) => {
    e.preventDefault();
    if (!exportStartDate || !exportEndDate) {
        toast.error("Start and end dates are required");
        return;
    }
    setIsExporting(true);
    try {
      const blob = exportType === 'telechamp' 
        ? await revenueApi.exportTelechampReport(exportStartDate, exportEndDate)
        : await revenueApi.exportDailyReport(exportStartDate, exportEndDate);
        
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = exportType === 'telechamp'
        ? `Telechamp_Revenue_Report_${exportStartDate}_to_${exportEndDate}.xlsx`
        : `Daily_Revenue_Report_${exportStartDate}_to_${exportEndDate}.xlsx`;
        
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully!');
      setShowExportModal(false);
    } catch (err) {
      toast.error('Failed to export report');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Sync local filters when filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters({ ...localFilters, page: 1 });
    setShowFilterModal(false);
  };
  
  const handleClearFilters = () => {
    const cleared = { ...filters, payment_type: '', from_date: '', to_date: '', telechamp: '', refund_status: '', page: 1 };
    setLocalFilters(cleared);
    setFilters(cleared);
    setShowFilterModal(false);
  };

  const handleEditClick = (record) => {
      setEditingId(record.id);
      setEditFormData({
          payment_datetime: record.actual_start_at ? new Date(record.actual_start_at * 1000).toISOString().slice(0, 16) : (record.start_at ? new Date(record.start_at * 1000).toISOString().slice(0, 16) : ''),
          tmid: record.tmid || '',
          payment_id: record.payment_id || '',
          amount: record.amount || '',
          subscription_by: record.subscription_by || '',
          subscription_by_id: record.subscription_by_id || '',
          job_id: record.job_id || '',
          payment_type: record.payment_type || '',
          payment_source: record.payment_source || '',
          remarks: record.remarks || ''
      });
  };

  const handleEditChange = (e) => {
      const { name, value } = e.target;
      let updates = { [name]: value };
      
      if (name === 'subscription_by') {
          if (value === 'Self' || !value) {
              updates.subscription_by_id = '';
          } else if (data.telecallers) {
              const tc = data.telecallers.find(t => t.name === value);
              if (tc) {
                  updates.subscription_by_id = String(tc.id);
              }
          }
      }
      
      setEditFormData(prev => ({ ...prev, ...updates }));
  };

  const handleEditSave = async (id) => {
      try {
          await axiosInstance.put(`/telehead/revenue/${id}`, editFormData);
          toast.success('Record updated successfully');
          setEditingId(null);
          fetchData();
      } catch (err) {
          toast.error('Failed to update: ' + (err.response?.data?.error || err.message));
      }
  };

  const handleRefundClick = async (id) => {
      if (window.confirm('Are you sure you want to mark this payment as refunded? This action cannot be undone.')) {
          let refundRemarks = window.prompt('Add refund remarks (mandatory):');
          while (refundRemarks !== null && refundRemarks.trim() === '') {
              refundRemarks = window.prompt('Refund remarks are mandatory. Please provide a reason:');
          }
          if (refundRemarks !== null) {
              try {
                  await axiosInstance.post(`/telehead/revenue/${id}/refund`, { refund_remarks: refundRemarks });
                  toast.success('Record refunded successfully');
                  fetchData();
              } catch (err) {
                  toast.error('Failed to refund: ' + (err.response?.data?.error || err.message));
              }
          }
      }
  };

  const handleDeleteClick = async (id) => {
      if (window.confirm('Delete this record?')) {
          try {
              await axiosInstance.delete(`/telehead/revenue/${id}`);
              toast.success('Record deleted successfully');
              fetchData();
          } catch (err) {
              toast.error('Failed to delete: ' + (err.response?.data?.error || err.message));
          }
      }
  };

  const handleSyncRefund = async (id) => {
      if (window.confirm('Sync this refund to the main payments table?')) {
          try {
              await axiosInstance.post(`/telehead/revenue/${id}/sync-refund`);
              toast.success('Refund synced successfully');
              fetchData();
          } catch (err) {
              toast.error('Failed to sync refund: ' + (err.response?.data?.error || err.message));
          }
      }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    
    // Pass the subscription_by_id if it's not "Self"
    const tcName = formData.get('subscription_by');
    if (tcName && tcName !== 'Self' && data.telecallers) {
        const tc = data.telecallers.find(t => t.name === tcName);
        if (tc) {
            formData.append('subscription_by_id', tc.id);
        }
    }

    try {
        await axiosInstance.post('/telehead/revenue', Object.fromEntries(formData));
        alert('Record added successfully');
        e.target.reset();
        setManualAmount("");
        fetchData();
    } catch (err) {
        alert('Failed to add record: ' + (err.response?.data?.error || err.message));
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddToPayments = async (record) => {
    if (record.payment_type === 'premium_job' || record.payment_type === 'super_premium_job' || record.job_id) {
        setJobModalData({ id: record.id, amount: record.amount, number_of_drivers: '1' });
        setJobModalOpen(true);
        return;
    }

    if (!window.confirm("Store this payment in the payments table?")) return;
    try {
        await axiosInstance.post(`/telehead/revenue/${record.id}/add-to-payments`);
        toast.success('Successfully added to payments');
        fetchData();
    } catch (err) {
        toast.error('Failed to add: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleJobModalSubmit = async (e) => {
    e.preventDefault();
    try {
        await axiosInstance.post(`/telehead/revenue/${jobModalData.id}/add-to-payments`, {
            amount: jobModalData.amount,
            number_of_drivers: jobModalData.number_of_drivers
        });
        toast.success('Successfully added to payments');
        setJobModalOpen(false);
        fetchData();
    } catch (err) {
        toast.error('Failed to add: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    if (data.all_plans) {
        const plan = data.all_plans.find(p => p.name === val);
        if (plan) {
            setManualAmount(plan.amount);
        }
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await revenueApi.getRevenueRecords(filters);
      setData(response);
    } catch (error) {
      console.error("Error fetching revenue data", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const shiftTcDate = (days) => {
    setFilters(prev => {
      const currentFrom = new Date(prev.tc_from);
      currentFrom.setDate(currentFrom.getDate() + days);
      const newDateStr = currentFrom.toLocaleDateString('en-CA');
      return { ...prev, tc_from: newDateStr, tc_to: newDateStr };
    });
  };

  const setTcDateRange = (type) => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const dateStr = d.toLocaleDateString('en-CA');
    setFilters(prev => ({ ...prev, tc_from: dateStr, tc_to: dateStr }));
  };

  // Implement Modals and Actions here

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Update Revenue</h1>
          <p className="text-slate-500 mt-1">Dashboard / Update Revenue</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <button
                disabled={isExportingToday}
                onClick={() => { setTodayExportDate(today); setShowTodayExportModal(true); }}
                className="bg-amber-600 text-white px-4 py-2 rounded-sm shadow-sm hover:bg-amber-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
                <Download className="w-4 h-4" /> {isExportingToday ? 'Exporting...' : 'Today Export'}
            </button>
            <button
                disabled={isExportingAttempts}
                onClick={handleExportAttemptsReport}
                className="bg-purple-600 text-white px-4 py-2 rounded-sm shadow-sm hover:bg-purple-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
                <Download className="w-4 h-4" /> {isExportingAttempts ? 'Exporting...' : 'Today Attempts'}
            </button>
            <button
                onClick={() => { setExportType('daily'); setShowExportModal(true); }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-sm shadow-sm hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium"
            >
                <Download className="w-4 h-4" /> Export Daily Report
            </button>
            <button
                onClick={() => { setExportType('telechamp'); setShowExportModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-sm shadow-sm hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
            >
                <Download className="w-4 h-4" /> Export Telechamp Report
            </button>
        </div>
      </div>

      {loading && !data.records ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-200 rounded-xl h-24 w-full"></div>
            ))}
          </div>
          <div className="bg-slate-200 rounded-xl h-32 w-full"></div>
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="bg-slate-200 rounded-xl h-64 w-full flex-1"></div>
            <div className="bg-slate-200 rounded-xl h-64 w-full flex-1"></div>
          </div>
          <div className="bg-slate-200 rounded-xl h-48 w-full mt-6"></div>
          <div className="bg-slate-200 rounded-xl h-96 w-full mt-6"></div>
        </div>
      ) : (
        <div className={`space-y-4 ${loading || isSubmitting ? 'pointer-events-none' : ''}`}>
          {/* Top Summary Cards */}
          <style>{`
            @keyframes shimmer-glow {
              0% { transform: translateX(-150%); }
              100% { transform: translateX(150%); }
            }
            .shimmer-glow {
              animation: shimmer-glow 1.5s infinite;
            }
          `}</style>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Amount */}
            <div className="bg-amber-400 rounded-xl shadow-sm p-5 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <div>
                  <p className="text-sm font-medium opacity-90 leading-tight">{data.isDateFiltered ? 'Total' : "Today's"} Amount</p>
                  {loading && data.records ? (
                    <div className="h-9 w-32 bg-white/20 rounded-sm relative overflow-hidden mt-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent shimmer-glow"></div>
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold">₹{data.todayAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Subscriptions */}
            <div className="bg-emerald-400 rounded-xl shadow-sm p-5 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                <div>
                  <p className="text-sm font-medium opacity-90 leading-tight">{data.isDateFiltered ? 'Total' : "Today's"} Subscriptions</p>
                  {loading && data.records ? (
                    <div className="h-9 w-32 bg-white/20 rounded-sm relative overflow-hidden mt-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent shimmer-glow"></div>
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold">₹{data.todaySubscriptionAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Matchmaking Fees */}
            <div className="bg-purple-500 rounded-xl shadow-sm p-5 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <div>
                  <p className="text-sm font-medium opacity-90 leading-tight">{data.isDateFiltered ? 'Total' : "Today's"} Matchmaking Fees</p>
                  {loading && data.records ? (
                    <div className="h-9 w-32 bg-white/20 rounded-sm relative overflow-hidden mt-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent shimmer-glow"></div>
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold">₹{data.todayJobAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Verification Fee */}
            <div className="bg-blue-500 rounded-xl shadow-sm p-5 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="text-sm font-medium opacity-90 leading-tight">{data.isDateFiltered ? 'Total' : "Today's"} Verification Fee</p>
                  {loading && data.records ? (
                    <div className="h-9 w-32 bg-white/20 rounded-sm relative overflow-hidden mt-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent shimmer-glow"></div>
                    </div>
                  ) : (
                    <h3 className="text-3xl font-bold">₹{data.todayIdCheckFee?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Refund Stats Section */}
          <div className="bg-slate-100/80 rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Refund Stats</p>
                <h3 className="text-base font-bold text-slate-800">Overview</h3>
              </div>
            </div>

            <div className="flex-1 flex justify-around items-center text-center">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Total Refunded</p>
                <h4 className="text-xl font-bold text-red-500">₹{data.totalRefundedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{data.refundedCount} payments</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Today's Refunded</p>
                <h4 className="text-xl font-bold text-slate-500">₹{data.todayRefundedAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
              </div>
            </div>

            <div className="flex gap-4">
              {/* <div className="bg-white px-6 py-3 rounded-lg shadow-xs border border-slate-200 text-center min-w-[140px]">
                <p className="text-xs font-medium text-slate-500 mb-1">Active</p>
                <h4 className="text-lg font-bold text-slate-800">₹{data.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
              </div> */}
              <div className="bg-white px-6 py-3 rounded-lg shadow-xs border border-slate-200 text-center min-w-[140px]">
                <p className="text-xs font-medium text-slate-500 mb-1">Refund Rate</p>
                <h4 className="text-lg font-bold text-slate-800">
                  {data.totalAmount > 0 
                    ? ((data.totalRefundedAmount / data.totalAmount) * 100).toFixed(1) 
                    : 0}%
                </h4>
              </div>
            </div>
          </div>

          {/* TeleChamp Subscription Performance Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 p-3 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                TeleChamp Subscription Performance
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button type="button" onClick={() => setTcDateRange('today')} className="bg-white text-blue-500 px-3 py-1 text-xs font-medium rounded-sm shadow-xs hover:bg-slate-50">Today</button>
                <button type="button" onClick={() => setTcDateRange('yesterday')} className="bg-white text-slate-600 px-3 py-1 text-xs font-medium rounded-sm shadow-xs hover:bg-slate-50">Yesterday</button>
                <div className="flex">
                  <button type="button" onClick={() => shiftTcDate(-1)} className="bg-white text-slate-600 px-2 py-1 text-xs font-medium rounded-l-sm border-r border-slate-200 shadow-xs hover:bg-slate-50">{'<'}</button>
                  <button type="button" onClick={() => shiftTcDate(1)} className="bg-white text-slate-600 px-2 py-1 text-xs font-medium rounded-r-sm shadow-xs hover:bg-slate-50">{'>'}</button>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span>From:</span>
                  <input type="date" className="text-black text-xs px-2 py-1 rounded-sm" value={filters.tc_from} onChange={(e) => setFilters({...filters, tc_from: e.target.value})} />
                  <span>To:</span>
                  <input type="date" className="text-black text-xs px-2 py-1 rounded-sm" value={filters.tc_to} onChange={(e) => setFilters({...filters, tc_to: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 border-b border-slate-200">
                <thead>
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 bg-white text-center text-xs font-bold text-blue-600 uppercase border-r border-slate-200 w-12">#</th>
                    <th rowSpan={2} className="px-4 py-3 bg-white text-left text-xs font-bold text-blue-600 uppercase border-r border-slate-200">TeleChamp</th>
                    <th colSpan={3} className="px-4 py-2 bg-emerald-500 text-center text-xs font-bold text-white uppercase border-r border-slate-200">Subscription <span className="opacity-80 font-normal ml-1">({filters.tc_from === filters.tc_to ? new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `${new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(filters.tc_to).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`})</span></th>
                    <th colSpan={2} className="px-4 py-2 bg-purple-500 text-center text-xs font-bold text-white uppercase border-r border-slate-200">Matchmaking <span className="opacity-80 font-normal ml-1">({filters.tc_from === filters.tc_to ? new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `${new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(filters.tc_to).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`})</span></th>
                    <th rowSpan={2} className="px-4 py-3 bg-cyan-500 text-center text-xs font-bold text-white uppercase border-r border-slate-200">Verification<br/><span className="opacity-80 font-normal text-[10px]">({filters.tc_from === filters.tc_to ? new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `${new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(filters.tc_to).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`})</span></th>
                    <th rowSpan={2} className="px-4 py-3 bg-red-500 text-center text-xs font-bold text-white uppercase border-r border-slate-200">Refunds<br/><span className="opacity-80 font-normal text-[10px]">({filters.tc_from === filters.tc_to ? new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `${new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(filters.tc_to).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`})</span></th>
                    <th rowSpan={2} className="px-4 py-3 bg-slate-800 text-center text-xs font-bold text-white uppercase">Net Total<br/><span className="opacity-80 font-normal text-[10px]">({filters.tc_from === filters.tc_to ? new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'}) : `${new Date(filters.tc_from).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(filters.tc_to).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`})</span></th>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 bg-white text-center text-[10px] font-bold text-emerald-600 uppercase border-r border-t border-slate-200 tracking-wider">Driver</th>
                    <th className="px-4 py-2 bg-white text-center text-[10px] font-bold text-emerald-600 uppercase border-r border-t border-slate-200 tracking-wider">Transporter</th>
                    <th className="px-4 py-2 bg-white text-center text-[10px] font-bold text-emerald-600 uppercase border-r border-t border-slate-200 tracking-wider">Others</th>
                    <th className="px-4 py-2 bg-white text-center text-[10px] font-bold text-purple-600 uppercase border-r border-t border-slate-200 tracking-wider">Premium</th>
                    <th className="px-4 py-2 bg-white text-center text-[10px] font-bold text-purple-600 uppercase border-r border-t border-slate-200 tracking-wider">Super Premium</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {data.telechampStats?.map((stat, idx) => {
                    // Calculate breakdown dynamically from API response
                    const driverSub = (stat.sub_detailed?.job_ready || 0) + (stat.sub_detailed?.verified || 0) + (stat.sub_detailed?.trusted || 0);
                    const transpSub = stat.sub_detailed?.standard || 0;
                    const othersSub = (stat.sub_detailed?.foreman_pro || 0) + (stat.sub_detailed?.association_pro || 0);
                    
                    const premJob = stat.job_detailed?.premium_job || 0;
                    const superPremJob = stat.job_detailed?.super_premium_job || 0;

                    const verif = stat.today_ver || 0;
                    const refunds = stat.today_refund || 0;
                    const netTotal = (stat.today_sub || 0) + (stat.today_job || 0) + verif - refunds;

                    return (
                      <tr key={stat.name} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center text-sm text-slate-500 border-r border-slate-100">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium border-r border-slate-100">
                          {stat.name === 'Self' ? (
                            <span className="inline-flex items-center gap-1 text-orange-500 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded-full text-xs">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                              Self (Online)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-blue-600">
                              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {stat.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 border-r border-slate-100">{driverSub > 0 ? `₹${driverSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600 border-r border-slate-100">{transpSub > 0 ? `₹${transpSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400 border-r border-slate-100">{othersSub > 0 ? `₹${othersSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400 border-r border-slate-100">{premJob > 0 ? `₹${premJob.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400 border-r border-slate-100">{superPremJob > 0 ? `₹${superPremJob.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400 border-r border-slate-100">{verif > 0 ? `₹${verif.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-400 border-r border-slate-100">{refunds > 0 ? `₹${refunds.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-emerald-600">{netTotal > 0 ? `₹${netTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '₹0.00'}</td>
                      </tr>
                    );
                  })}
                  {data.telechampStats && data.telechampStats.length > 0 && (() => {
                    const totalDriverSub = data.telechampStats.reduce((sum, stat) => sum + (stat.sub_detailed?.job_ready || 0) + (stat.sub_detailed?.verified || 0) + (stat.sub_detailed?.trusted || 0), 0);
                    const totalTranspSub = data.telechampStats.reduce((sum, stat) => sum + (stat.sub_detailed?.standard || 0), 0);
                    const totalOthersSub = data.telechampStats.reduce((sum, stat) => sum + (stat.sub_detailed?.foreman_pro || 0) + (stat.sub_detailed?.association_pro || 0), 0);
                    const totalPremJob = data.telechampStats.reduce((sum, stat) => sum + (stat.job_detailed?.premium_job || 0), 0);
                    const totalSuperPremJob = data.telechampStats.reduce((sum, stat) => sum + (stat.job_detailed?.super_premium_job || 0), 0);
                    const totalVerif = data.telechampStats.reduce((sum, stat) => sum + (stat.today_ver || 0), 0);
                    const totalRefunds = data.telechampStats.reduce((sum, stat) => sum + (stat.today_refund || 0), 0);
                    const totalNet = data.telechampStats.reduce((sum, stat) => sum + (stat.today_sub || 0) + (stat.today_job || 0) + (stat.today_ver || 0) - (stat.today_refund || 0), 0);
                    return (
                      <tr className="bg-slate-100 border-t-2 border-slate-200 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-right text-sm text-slate-800 border-r border-slate-200">Totals:</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalDriverSub > 0 ? `₹${totalDriverSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalTranspSub > 0 ? `₹${totalTranspSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalOthersSub > 0 ? `₹${totalOthersSub.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalPremJob > 0 ? `₹${totalPremJob.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalSuperPremJob > 0 ? `₹${totalSuperPremJob.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalVerif > 0 ? `₹${totalVerif.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-800 border-r border-slate-200">{totalRefunds > 0 ? `₹${totalRefunds.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-slate-900">{totalNet > 0 ? `₹${totalNet.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '₹0.00'}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Excel Upload & TeleChamp Assignment Row */}
          {false && (
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Upload Card 1: Import/Update Records */}
            <div className="flex-1 border-2 border-dashed border-blue-500 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="p-5 flex flex-col justify-between h-full">
                    <div>
                        <h5 className="text-lg font-bold mb-3 flex items-center"><FileSpreadsheet className="text-green-500 w-5 h-5 mr-2" />Upload Excel / CSV</h5>
                        <p className="text-slate-500 text-sm mb-4">Import new collections or update existing ones with standard fields.</p>
                    </div>
                    <form>
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 mb-2">
                                <label className="block text-sm font-semibold mb-1">
                                    Select File <span className="text-red-500">*</span>
                                    <span className="text-slate-500 font-normal ml-1">(xlsx, xls, csv — max 10 MB)</span>
                                </label>
                                <input type="file" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" accept=".xlsx,.xls,.csv" required />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <button type="submit" className="w-full bg-blue-600 text-white rounded-sm p-2 text-sm font-medium hover:bg-blue-700 flex items-center justify-center">
                                    <Upload className="w-4 h-4 mr-1" /> Import Data
                                </button>
                            </div>
                            <div className="col-span-12 sm:col-span-5">
                                <a href="https://truckmitr.com/storage/app/public/uploads/update_revenue_template.xlsx" className="w-full border border-blue-600 text-blue-600 rounded-sm p-2 text-sm font-medium hover:bg-blue-50 flex items-center justify-center">
                                    Template <Download className="w-4 h-4 ml-1" />
                                </a>
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <button type="button" className="w-full border border-slate-400 text-slate-600 rounded-sm p-2 text-sm font-medium hover:bg-slate-100 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 mr-1" /> Help
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Upload Card 2: Update TeleChamps */}
            <div className="flex-1 border-2 border-dashed border-purple-500 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="p-5 flex flex-col justify-between h-full">
                    <div>
                        <h5 className="text-lg font-bold mb-3 flex items-center text-purple-700"><UserCheck className="w-5 h-5 mr-2" />Assign TeleChamps via Excel</h5>
                        <p className="text-slate-500 text-sm mb-4">Update TeleChamp assignment (<code>subscription_by</code>) by uploading payment IDs with corresponding telechamp IDs.</p>
                    </div>
                    <form>
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 mb-2">
                                <label className="block text-sm font-semibold mb-1 text-purple-700">
                                    Select File <span className="text-red-500">*</span>
                                    <span className="text-slate-500 font-normal ml-1">(xlsx, xls, csv — contains payment_id & telechamp_id)</span>
                                </label>
                                <input type="file" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" accept=".xlsx,.xls,.csv" required />
                            </div>
                            <div className="col-span-12 sm:col-span-5">
                                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-sm p-2 text-sm font-medium hover:opacity-90 flex items-center justify-center">
                                    <UserCheck className="w-4 h-4 mr-1" /> Assign TeleChamps
                                </button>
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <a href="https://truckmitr.com/storage/app/public/uploads/update_telechamp_revenue_template.xlsx" className="w-full border border-purple-600 text-purple-600 rounded-sm p-2 text-sm font-medium hover:bg-purple-50 flex items-center justify-center">
                                    Template <Download className="w-4 h-4 ml-1" />
                                </a>
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <button type="button" className="w-full border border-purple-600 text-purple-600 rounded-sm p-2 text-sm font-medium hover:bg-purple-50 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 mr-1" /> View Format
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
          </div>
          )}

          {/* Add Manual Record */}
          <div className="bg-slate-50 rounded-xl shadow-xs border-l-4 border-blue-500 border-t border-b border-r border-slate-200 mt-6">
            <div className="p-5">
                <h5 className="text-lg font-bold text-blue-600 mb-4 flex items-center"><PlusCircle className="w-5 h-5 mr-2" />Add Manual Record</h5>
                <form onSubmit={handleManualSubmit}>
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Payment Date Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" name="payment_datetime" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" required defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">TMID <span className="text-red-500">*</span></label>
                            <input type="text" name="tmid" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" placeholder="e.g. TR-1234" required />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Payment ID <span className="text-red-500">*</span></label>
                            <input type="text" name="payment_id" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" placeholder="PAY-1234" required />
                        </div>
                        <div className="col-span-12 md:col-span-3">
                            <label className="block text-sm font-semibold mb-1">TeleChamp <span className="text-red-500">*</span></label>
                            <select name="subscription_by" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" required>
                                <option value="">Select TeleChamp</option>
                                <option value="Self">Self</option>
                                {data.telecallers?.map(tc => (
                                  <option key={tc.id} value={tc.name}>{tc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-3">
                            <label className="block text-sm font-semibold mb-1">Type <span className="text-red-500">*</span></label>
                            <select name="payment_type" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" required onChange={handleTypeChange}>
                                <option value="">Select Type</option>
                                {data.paymentTypes?.map(type => (
                                  <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Amount (INR) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" name="amount" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" placeholder="0.00" required value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Source <span className="text-slate-500 font-normal text-xs">(Optional)</span></label>
                            <select name="payment_source" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm">
                                <option value="">Select Source</option>
                                <option value="razorpay">Razorpay</option>
                                <option value="hdfc">HDFC</option>
                            </select>
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <label className="block text-sm font-semibold mb-1">Job ID <span className="text-slate-500 font-normal text-xs">(Optional)</span></label>
                            <input type="text" name="job_id" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" placeholder="e.g. 835" />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                            <label className="block text-sm font-semibold mb-1">Remarks</label>
                            <input type="text" name="remarks" className="w-full border border-slate-300 rounded-sm p-2 bg-white text-sm" placeholder="Internal notes…" />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white rounded-sm p-2 text-sm font-medium hover:bg-green-700 flex items-center justify-center disabled:opacity-75 transition-all">
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="w-4 h-4 mr-1" /> Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mt-6">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center bg-slate-50 gap-4">
              <h3 className="font-bold text-slate-800 text-lg">Records</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search records..." 
                    className="!pl-8 pr-3 py-1.5 border border-slate-300 rounded-sm text-sm w-48 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={filters.search}
                    name="search"
                    onChange={handleFilterChange}
                  />
                </div>
                <select 
                  className="py-1.5 px-3 border border-slate-300 rounded-sm text-sm focus:outline-hidden focus:border-blue-500"
                  value={filters.per_page}
                  name="per_page"
                  onChange={handleFilterChange}
                >
                  <option value="10">10 / page</option>
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
                <button type="button" onClick={() => setShowFilterModal(true)} className="px-3 py-1.5 border border-blue-500 text-blue-600 text-sm font-medium rounded-sm shadow-xs hover:bg-blue-50 flex items-center">
                    <Filter className="w-4 h-4 mr-1" /> Filter
                </button>
                <button 
                  type="button" 
                  onClick={() => setHighlightMissing(!highlightMissing)}
                  className={`px-3 py-1.5 border border-cyan-500 text-sm font-medium rounded-sm shadow-xs flex items-center ${highlightMissing ? 'bg-cyan-500 text-white' : 'text-cyan-600 hover:bg-cyan-50'}`}
                >
                    <PenTool className="w-4 h-4 mr-1" /> Highlight Missing
                </button>
                <button type="button" className="px-3 py-1.5 border border-amber-500 text-amber-600 text-sm font-medium rounded-sm shadow-xs hover:bg-amber-50 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Unsynced Refunds
                </button>
              </div>
            </div>
            
            <div className="relative overflow-x-auto min-h-[200px]">
              {(loading || isSubmitting) && (
                <div className="absolute inset-0 bg-white/60 z-10 flex flex-col items-center justify-center backdrop-blur-[1px]">
                  <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span className="text-sm font-medium text-slate-600">Loading records...</span>
                </div>
              )}
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      TMID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      TeleChamps
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {data.records?.data?.map((record) => {
                    const isMismatchedRefund = record.is_refunded && record.has_payment_record && record.payments_status !== 'refunded';
                    return (
                    <React.Fragment key={record.id}>
                    {editingId === record.id ? (
                      <tr className="bg-orange-50/50">
                        <td className="px-2 py-2">
                            <input type="datetime-local" name="payment_datetime" className="w-full border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.payment_datetime || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2">
                            <input type="text" name="tmid" className="w-20 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.tmid || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2">
                            <input type="text" name="payment_id" className="w-32 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.payment_id || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2">
                            <input type="number" step="0.01" name="amount" className="w-20 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.amount || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2">
                            <select name="subscription_by" className="w-32 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.subscription_by || ''} onChange={handleEditChange} disabled={record.is_refunded}>
                                <option value="">Select</option>
                                <option value="Self">Self</option>
                                {data.telecallers?.map(tc => (
                                    <option key={tc.id} value={tc.name}>{tc.name}</option>
                                ))}
                            </select>
                        </td>
                        <td className="px-2 py-2">
                            <input type="text" name="job_id" className="w-20 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.job_id || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2">
                            <select name="payment_type" className="w-32 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.payment_type || ''} onChange={handleEditChange} disabled={record.is_refunded}>
                                <option value="">Select</option>
                                {data.paymentTypes?.map(pt => (
                                    <option key={pt} value={pt}>{pt}</option>
                                ))}
                            </select>
                        </td>
                        <td className="px-2 py-2">
                            <select name="payment_source" className="w-24 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.payment_source || ''} onChange={handleEditChange} disabled={record.is_refunded}>
                                <option value="">Select</option>
                                <option value="razorpay">Razorpay</option>
                                <option value="hdfc">HDFC</option>
                            </select>
                        </td>
                        <td className="px-2 py-2">
                            <input type="text" name="remarks" className="w-32 border border-slate-300 rounded-sm p-1 text-sm" value={editFormData.remarks || ''} onChange={handleEditChange} disabled={record.is_refunded} />
                        </td>
                        <td className="px-2 py-2 text-right">
                            <div className="flex gap-1 justify-end">
                                {!record.is_refunded && (
                                    <button onClick={() => handleEditSave(record.id)} className="bg-green-600 text-white rounded-sm p-1 text-xs hover:bg-green-700">Save</button>
                                )}
                                <button onClick={() => setEditingId(null)} className="bg-slate-500 text-white rounded-sm p-1 text-xs hover:bg-slate-600">Cancel</button>
                            </div>
                        </td>
                      </tr>
                    ) : (
                      <tr className={`${record.is_refunded ? 'bg-red-50/30' : (highlightMissing && record.has_payment_record === null ? 'bg-red-50' : 'hover:bg-slate-50')}`}>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {record.actual_start_at 
                            ? new Date(record.actual_start_at * 1000).toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12: true})
                            : (record.transaction_date ? new Date(record.transaction_date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '—')}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {record.tmid || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className={`text-sm px-1 rounded-sm ${record.is_refunded ? 'bg-slate-50 text-slate-400 line-through' : 'bg-slate-100 text-pink-600'}`}>{record.payment_id}</code>
                            {record.job_id && <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-1 rounded-sm">JOB</span>}
                            {record.is_refunded && <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1 rounded-sm">REFUNDED</span>}
                          </div>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          ₹{record.amount ? parseFloat(record.amount).toFixed(2) : '0.00'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {record.subscription_by || '—'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {record.job_id || '—'}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${record.is_refunded ? 'opacity-60' : ''}`}>
                            {record.payment_type?.toLowerCase().includes('_job') ? (
                                <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-md bg-purple-100 text-purple-800">Matchmaking Fee</span>
                            ) : ['identity_verification', 'digital_verification', 'complete_verification'].includes(record.payment_type?.toLowerCase()) ? (
                                <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-md bg-blue-100 text-blue-800">Verification Fee</span>
                            ) : (
                                <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-md bg-teal-100 text-teal-800">Subscription</span>
                            )}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${record.is_refunded ? 'opacity-60' : ''}`}>
                            {record.payment_source ? (
                                <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-md bg-slate-600 text-white capitalize">{record.payment_source}</span>
                            ) : '—'}
                        </td>
                        <td className={`px-4 py-3 text-sm max-w-[150px] truncate ${record.is_refunded ? 'line-through text-slate-400' : 'text-slate-900'}`} title={record.remarks}>
                          {record.remarks || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-1 items-center">
                            {!record.is_refunded ? (
                                <>
                                  <button onClick={() => handleEditClick(record)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-sm p-1.5 mx-1"><PenTool className="w-3.5 h-3.5" /></button>
                                  {highlightMissing && record.has_payment_record === null && (
                                    <button onClick={() => handleAddToPayments(record)} title="Add to payments table" className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 rounded-sm p-1.5 mx-1">
                                        <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button onClick={() => handleRefundClick(record.id)} title="Mark as Refunded" className="bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-sm p-1.5 mx-1"><AlertTriangle className="w-3.5 h-3.5" /></button>
                                </>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-slate-500">Refunded on {record.refunded_at ? new Date(record.refunded_at).toLocaleDateString('en-GB') : 'N/A'}</span>
                                    {isMismatchedRefund && (
                                        <button onClick={() => handleSyncRefund(record.id)} className="bg-slate-800 text-white hover:bg-slate-900 rounded-sm p-1 mt-1 text-xs px-2 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Sync
                                        </button>
                                    )}
                                </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
               <div className="text-sm text-slate-700">
                 Showing page <span className="font-medium">{data.records?.current_page}</span> of <span className="font-medium">{data.records?.last_page}</span>
               </div>
               <div className="flex gap-2">
                  <button 
                    disabled={data.records?.current_page === 1}
                    onClick={() => handlePageChange(data.records?.current_page - 1)}
                    className="px-3 py-1 border border-slate-300 rounded-sm text-sm disabled:opacity-50 hover:bg-slate-100 bg-white"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={data.records?.current_page === data.records?.last_page}
                    onClick={() => handlePageChange(data.records?.current_page + 1)}
                    className="px-3 py-1 border border-slate-300 rounded-sm text-sm disabled:opacity-50 hover:bg-slate-100 bg-white"
                  >
                    Next
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h5 className="font-bold text-lg">Filter Records</h5>
              <button type="button" onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleApplyFilters}>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Payment Type</label>
                  <select className="w-full border rounded-sm p-2 text-sm" value={localFilters.payment_type} onChange={(e) => setLocalFilters({...localFilters, payment_type: e.target.value})}>
                    <option value="">All Types</option>
                    {data.paymentTypes?.map(pt => (
                      <option key={pt} value={pt}>{pt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">From Date</label>
                  <input type="date" className="w-full border rounded-sm p-2 text-sm" value={localFilters.from_date} onChange={(e) => setLocalFilters({...localFilters, from_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">To Date</label>
                  <input type="date" className="w-full border rounded-sm p-2 text-sm" value={localFilters.to_date} onChange={(e) => setLocalFilters({...localFilters, to_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">TeleChamp</label>
                  <select className="w-full border rounded-sm p-2 text-sm" value={localFilters.telechamp} onChange={(e) => setLocalFilters({...localFilters, telechamp: e.target.value})}>
                    <option value="">All TeleChamps</option>
                    <option value="Self">Self (Online)</option>
                    {data.telecallers?.map(tc => (
                      <option key={tc.id} value={tc.name}>{tc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Refund Status</label>
                  <select className="w-full border rounded-sm p-2 text-sm" value={localFilters.refund_status} onChange={(e) => setLocalFilters({...localFilters, refund_status: e.target.value})}>
                    <option value="">All Payments</option>
                    <option value="0">Not Refunded</option>
                    <option value="1">Refunded</option>
                  </select>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                <button type="button" onClick={handleClearFilters} className="px-4 py-2 border rounded-sm text-sm hover:bg-slate-100">Clear All</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-sm text-sm hover:bg-blue-700">Apply Filters</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" /> {exportType === 'telechamp' ? 'Export Telechamp Report' : 'Export Daily Report'}
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleExportDailyReport}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Start Date</label>
                  <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full border rounded-sm p-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">End Date</label>
                  <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full border rounded-sm p-2 text-sm" required />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                <button type="button" onClick={() => setShowExportModal(false)} className="px-4 py-2 border rounded-sm text-sm hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isExporting} className="px-4 py-2 bg-emerald-600 text-white rounded-sm text-sm hover:bg-emerald-700 disabled:opacity-70 flex items-center">
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today Export Modal (Date Filter Popup) */}
      {showTodayExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-600" /> Today Export
              </h3>
              <button onClick={() => setShowTodayExportModal(false)} className="text-slate-400 hover:text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleExportTodayReport}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Select Date</label>
                  <input type="date" value={todayExportDate} onChange={(e) => setTodayExportDate(e.target.value)} className="w-full border rounded-sm p-2 text-sm" required />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                <button type="button" onClick={() => setShowTodayExportModal(false)} className="px-4 py-2 border rounded-sm text-sm hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isExportingToday} className="px-4 py-2 bg-amber-600 text-white rounded-sm text-sm hover:bg-amber-700 disabled:opacity-70 flex items-center">
                  {isExportingToday ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add To Payments Job Modal */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-600" /> Add to Payments
              </h3>
              <button onClick={() => setJobModalOpen(false)} className="text-slate-400 hover:text-red-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleJobModalSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Number of Drivers Required</label>
                  <input type="number" min="1" value={jobModalData.number_of_drivers} onChange={(e) => setJobModalData({...jobModalData, number_of_drivers: e.target.value})} className="w-full border rounded-sm p-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Amount</label>
                  <input type="number" step="0.01" value={jobModalData.amount} onChange={(e) => setJobModalData({...jobModalData, amount: e.target.value})} className="w-full border rounded-sm p-2 text-sm" required />
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                <button type="button" onClick={() => setJobModalOpen(false)} className="px-4 py-2 border rounded-sm text-sm hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-sm text-sm hover:bg-cyan-700 flex items-center">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
