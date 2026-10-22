import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@teleadmin/router';
import { format } from 'date-fns';
import { 
  Briefcase, User, Calendar, Filter, Users, BadgeCheck, CheckCircle2, 
  ChevronLeft, ChevronRight, RefreshCw, FilterX, Clock, PhoneCall
} from 'lucide-react-teleadmin';
import leadsApi from '../services/api/leadsApi';
import { toast } from 'react-hot-toast';

const formatDateOnly = (dateString) => {
  if (!dateString) return '--';
  if (typeof dateString === 'string') {
    const match = dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).replace(/am|pm/i, m => m.toUpperCase());
};

const PipelineDrivers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'interview_done');
  
  // Date Range state
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');
  
  // Manager/Assignee filter
  const [assignedTo, setAssignedTo] = useState(searchParams.get('assigned_to') || '');
  
  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Update URL search parameters when state changes
  useEffect(() => {
    const params = {
      tab: activeTab,
      page: page.toString()
    };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (assignedTo) params.assigned_to = assignedTo;
    
    setSearchParams(params);
  }, [activeTab, startDate, endDate, assignedTo, page]);

  // Reset page to 1 when changing tabs or filters
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Fetch Telechamps (Managers)
  const { data: telechampsResponse } = useQuery({
    queryKey: ['all-telechamps'],
    queryFn: () => leadsApi.getTelechamps(),
    staleTime: Infinity
  });

  const telechamps = (telechampsResponse?.data || []).filter(tc => tc.role === 'telecaller');

  // Fetch Pipeline Drivers Data
  const { data: pipelineResponse, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['pipeline-drivers', activeTab, startDate, endDate, assignedTo, page],
    queryFn: () => leadsApi.getPipelineDrivers({
      tab: activeTab,
      start_date: startDate,
      end_date: endDate,
      assigned_to: assignedTo,
      page: page,
      per_page: 50
    })
  });

  const listData = pipelineResponse?.data?.data || [];
  const pagination = pipelineResponse?.data || {};

  useEffect(() => {
    console.log('Pipeline Drivers Response:', pipelineResponse);
    if (error) {
      console.error('Pipeline Drivers Query Error:', error);
    }
    if (listData.length > 0) {
      console.log('Pipeline Drivers sample row:', listData[0]);
    }
  }, [pipelineResponse, error, listData]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setAssignedTo('');
    setPage(1);
    toast.success('Filters cleared');
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-4 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <BadgeCheck className="w-5.5 h-5.5 text-indigo-600 animate-pulse" />
            Hiring Pipeline Dashboard
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Track status & progression of matched drivers
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-semibold text-xs shadow-xs self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs max-w-md">
        <button
          onClick={() => handleTabChange('interview_done')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'interview_done'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Interview Done
        </button>
        <button
          onClick={() => handleTabChange('placed')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'placed'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Placed Drivers
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-end gap-3.5">
        <div className="w-full md:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="!pl-9 pr-3 py-1.5 w-full text-xs font-medium border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="!pl-9 pr-3 py-1.5 w-full text-xs font-medium border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Assignee / Manager */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Manager</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                className="!pl-9 pr-3 py-1.5 w-full text-xs font-medium border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white appearance-none"
              >
                <option value="">All Managers</option>
                {telechamps.map((tc) => (
                  <option key={tc.caller_id || tc.id} value={tc.caller_id || tc.id}>
                    {tc.name || tc.caller_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="w-full md:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <FilterX className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col min-h-[450px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-semibold mt-3">Loading pipeline drivers...</p>
          </div>
        ) : listData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-5 py-3">Job ID</th>
                  <th className="px-5 py-3">Driver TMID</th>
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Transporter TMID</th>
                  {activeTab === 'interview_done' && (
                    <>
                      <th className="px-5 py-3">Joining Date</th>
                      <th className="px-5 py-3">Recorded Date & Time</th>
                    </>
                  )}
                  {activeTab === 'placed' && <th className="px-5 py-3">Placed Date & Time</th>}
                  <th className="px-5 py-3">Job Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listData.map((row, idx) => (
                  <tr key={`${row.job_id}-${row.driver_tmid}-${idx}`} className="hover:bg-slate-50/30 transition-colors">
                    {/* Job ID */}
                    <td className="px-5 py-3">
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-sm font-mono font-bold">
                        {row.job_id}
                      </span>
                    </td>
                    {/* Driver TMID */}
                    <td className="px-5 py-3 text-xs font-mono text-slate-600 font-bold">
                      {row.driver_tmid || '--'}
                    </td>
                    {/* Driver Name */}
                    <td className="px-5 py-3 text-xs font-bold text-slate-800">
                      {row.driver_name || 'Unknown'}
                    </td>
                    {/* Transporter TMID */}
                    <td className="px-5 py-3 text-xs font-mono text-slate-600 font-bold">
                      {row.transporter_tmid || '--'}
                    </td>
                    {/* Joining Date & Recorded Date & Time (Interview Done) */}
                    {activeTab === 'interview_done' && (
                      <>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                          {formatDateOnly(row.joining_date)}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-indigo-600">
                          {formatDate(row.updated_at || row.recorded_date_time || row.recorded_at || row.ivr_updated_at || row.created_at)}
                        </td>
                      </>
                    )}
                    {/* Placed Date & Time */}
                    {activeTab === 'placed' && (
                      <td className="px-5 py-3 text-xs font-semibold text-emerald-600">
                        {formatDate(row.placed_date_time)}
                      </td>
                    )}
                    {/* Job Manager */}
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {row.job_manager_name || 'Unassigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm font-bold">No drivers found matching these filters.</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your date range or selecting a different manager.</p>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination?.total > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between mt-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, pagination.total)} of {pagination.total} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                Page {page} of {pagination.last_page || 1}
              </span>
              <button
                disabled={page >= (pagination.last_page || 1)}
                onClick={() => setPage(prev => prev + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineDrivers;
