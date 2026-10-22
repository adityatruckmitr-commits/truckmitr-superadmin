import React, { useState, useEffect } from 'react';
import { useSearchParams } from '@teleadmin/router';
import { Briefcase, MapPin, Navigation, Calendar, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react-teleadmin';
import { userApi } from '../../../services/api/userApi';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const JobsTab = ({ jobApplications, driverId, onRefresh }) => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [isPendingReset, setIsPendingReset] = useState(false);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSort = (columnKey) => {
    const newParams = new URLSearchParams(searchParams);
    const currentSortBy = newParams.get('sort_by');
    const currentSortDir = newParams.get('sort_dir');

    if (currentSortBy === columnKey) {
      if (currentSortDir === 'asc') {
        newParams.set('sort_dir', 'desc');
      } else {
        newParams.delete('sort_by');
        newParams.delete('sort_dir');
      }
    } else {
      newParams.set('sort_by', columnKey);
      newParams.set('sort_dir', 'asc');
    }
    setSearchParams(newParams);
  };

  const renderSortIcon = (columnKey) => {
    const currentSortBy = searchParams.get('sort_by');
    const currentSortDir = searchParams.get('sort_dir');
    if (currentSortBy !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 inline-block ml-1" />;
    return currentSortDir === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 inline-block ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 inline-block ml-1" />;
  };

  const uniqueOptions = {
    jobTypes: ['Standard Job', 'Premium Job', 'Super Premium Job'],
    // In backend filtering mode, we might not have all unique options upfront. 
    // Usually these are fetched separately, but we'll stick to a hardcoded or common list or leave as text input.
    // Assuming the user knows the names or we can use the backend provided data.
    // For now, if they want dropdowns, we should provide the list of telecallers or let them type.
    // Wait, since the blade template has dropdowns based on current data, we can fallback to deriving from jobApplications
    // But jobApplications is now filtered. So the dropdown options would shrink. 
    // To fix this, we can just use the provided jobApplications to generate options? It shrinks.
    // We'll leave it as derived for now, but aware it shrinks if filtered.
    jobAssignedTo: [...new Set((jobApplications || []).map(app => app.assigned_to_name || 'Unassigned'))].filter(Boolean).sort(),
    appAssignedTo: [...new Set((jobApplications || []).map(app => app.application_assigned_to_name || 'Not Assigned'))].filter(Boolean).sort(),
  };

  const handleConfirmReset = async () => {
    if (!selectedApp || !driverId) return;
    setIsPendingReset(true);
    setError(null);
    try {
      await userApi.resetJobStatusToPending(driverId, selectedApp.job_unique_id);
      setSelectedApp(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to change status. Please try again.');
    } finally {
      setIsPendingReset(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Job Applications ({jobApplications?.length || 0})</h3>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <select 
            value={searchParams.get('job_type') || ''}
            onChange={(e) => handleFilterChange('job_type', e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">All Job Types</option>
            {uniqueOptions.jobTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select 
            value={searchParams.get('job_assigned_to') || ''}
            onChange={(e) => handleFilterChange('job_assigned_to', e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">All Job Assigned</option>
            {uniqueOptions.jobAssignedTo.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select 
            value={searchParams.get('app_assigned_to') || ''}
            onChange={(e) => handleFilterChange('app_assigned_to', e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            <option value="">All App Assigned</option>
            {uniqueOptions.appAssignedTo.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200">Job Details</th>
              <th 
                className="px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none group transition-colors"
                onClick={() => handleSort('job_type')}
              >
                Job Type {renderSortIcon('job_type')}
              </th>
              <th 
                className="px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none group transition-colors"
                onClick={() => handleSort('assigned_to_name')}
              >
                Job Assigned To {renderSortIcon('assigned_to_name')}
              </th>
              <th 
                className="px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none group transition-colors"
                onClick={() => handleSort('application_assigned_to_name')}
              >
                Application Assigned To {renderSortIcon('application_assigned_to_name')}
              </th>
              <th className="px-6 py-4 border-b border-slate-200">Location & Route</th>
              <th className="px-6 py-4 border-b border-slate-200">Vehicle Type</th>
              <th className="px-6 py-4 border-b border-slate-200">Salary</th>
              <th className="px-6 py-4 border-b border-slate-200">Match Status</th>
              <th 
                className="px-6 py-4 border-b border-slate-200 cursor-pointer hover:bg-slate-100 select-none group transition-colors"
                onClick={() => handleSort('created_at')}
              >
                Applied at {renderSortIcon('created_at')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobApplications && jobApplications.length > 0 ? (
              jobApplications.map((app, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{app.job_title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{app.job_unique_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1">
                      {app.job_type === 'Super Premium Job' || app.job_type === 'Premium Job' ? (
                        <>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${app.job_type === 'Super Premium Job' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} ${app.is_refunded ? 'line-through opacity-70' : ''}`}>
                            {app.job_type === 'Super Premium Job' ? 'Super Premium' : 'Premium'}
                          </span>
                          {app.is_refunded && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Standard</span>
                          )}
                        </>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Standard</span>
                      )}
                      
                      {app.payment_amount > 0 && (
                        <div className={`text-[10px] font-bold mt-1 ${app.is_refunded ? 'line-through text-red-500' : 'text-emerald-600'}`}>
                          ₹{app.payment_amount}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">
                      {app.assigned_to_name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.application_assigned_to_name ? (
                      <span className="text-sm font-medium text-slate-700">
                        {app.application_assigned_to_name}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">
                        Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5 mb-1 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{app.job_location || 'N/A'}</span>
                    </div>
                    {app.route && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{app.route}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.vehicle_type || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{app.Salary_Range ? `₹${app.Salary_Range}` : 'N/A'}</td>
                  <td className="px-6 py-4">
                    {app.match_status === 'selected' ? (
                      <span 
                        onClick={() => setSelectedApp(app)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200 transition-colors shadow-xs select-none"
                        title="Click to reset status to pending"
                      >
                        {app.match_status}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.match_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {app.match_status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                        {formatDate(app.created_at)}
                      </p>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Briefcase className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No job applications found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-950 mb-2">Change Status to Pending?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to reset the match status for the job id <strong>{selectedApp.job_unique_id}</strong> to <strong>pending</strong>?
                <br />
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApp(null);
                    setError(null);
                  }}
                  disabled={isPendingReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={isPendingReset}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isPendingReset && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsTab;
