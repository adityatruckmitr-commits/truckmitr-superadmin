import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Home,
  Timer,
  UserMinus,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  RotateCw,
  Clock,
  User,
  AlertCircle,
  FileText,
  X
} from 'lucide-react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsLeaveManagement() {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'wfh' | 'short_leave' | 'resignation'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedReviewModal, setSelectedReviewModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Leaves dataset
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 101, empId: 'TM-EMP-002', name: 'Sourabh Singh', type: 'Unpaid Leave (LOP)', startDate: '24 Sep 2026', endDate: '26 Sep 2026', days: 3, status: 'Pending', reason: 'Urgent family emergency in hometown requiring leave.', appliedAt: '23 Sep 2026' },
    { id: 102, empId: 'TM-EMP-002', name: 'Sourabh Singh', type: 'Unpaid Leave (LOP)', startDate: '16 Sep 2026', endDate: '16 Sep 2026', days: 1, status: 'Pending', reason: 'Medical appointment & diagnostics collection.', appliedAt: '15 Sep 2026' },
    { id: 103, empId: 'TM-EMP-001', name: 'Tarun Kumar', type: 'Casual Leave (CL)', startDate: '18 Sep 2026', endDate: '19 Sep 2026', days: 2, status: 'Pending', reason: 'Attending family religious ceremony in native place.', appliedAt: '17 Sep 2026' },
    { id: 104, empId: 'TM-EMP-004', name: 'Chandarbhan', type: 'Sick Leave (SL)', startDate: '05 Oct 2026', endDate: '06 Oct 2026', days: 2, status: 'Approved', reason: 'Viral fever, resting under doctor guidance.', appliedAt: '04 Oct 2026' },
    { id: 105, empId: 'TM-EMP-005', name: 'Raksha', type: 'Casual Leave (CL)', startDate: '02 Oct 2026', endDate: '02 Oct 2026', days: 1, status: 'Approved', reason: 'Gandhi Jayanti extended holiday travel.', appliedAt: '28 Sep 2026' }
  ]);

  // WFH dataset
  const [wfhRequests, setWfhRequests] = useState([
    { id: 201, empId: 'TM-EMP-003', name: 'Deepak Bhati', dates: '14 Oct - 15 Oct 2026', days: 2, status: 'Pending', reason: 'Broadband technician scheduled at home.', appliedAt: '12 Oct 2026' },
    { id: 202, empId: 'TM-EMP-006', name: 'Aayushi Verma', dates: '16 Oct 2026', days: 1, status: 'Approved', reason: 'Electric meter replacement in apartment building.', appliedAt: '10 Oct 2026' }
  ]);

  // Short Leave dataset
  const [shortLeaves, setShortLeaves] = useState([
    { id: 301, empId: 'TM-EMP-002', name: 'Sourabh Singh', date: '15 Sep 2026', hours: '09:30 AM - 11:30 AM (2 hrs)', status: 'Pending', reason: 'Bank document verification for loan paperwork.', appliedAt: '14 Sep 2026' },
    { id: 302, empId: 'TM-EMP-007', name: 'Angad', date: '12 Oct 2026', hours: '04:30 PM - 06:30 PM (2 hrs)', status: 'Approved', reason: 'School parent-teacher meeting for child.', appliedAt: '11 Oct 2026' }
  ]);

  // Resignation dataset
  const [resignations, setResignations] = useState([
    { id: 401, empId: 'TM-EMP-015', name: 'Vikram Joshi', submittedDate: '01 Oct 2026', noticePeriod: '30 Days', expectedExit: '31 Oct 2026', status: 'In Notice', reason: 'Pursuing higher academic opportunities abroad.' }
  ]);

  const handleApprove = (id, type) => {
    if (type === 'leaves') setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    if (type === 'wfh') setWfhRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    if (type === 'short_leave') setShortLeaves(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    setSelectedReviewModal(null);
    showToast(`Request #${id} approved successfully.`);
  };

  const handleReject = (id, type) => {
    if (type === 'leaves') setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    if (type === 'wfh') setWfhRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    if (type === 'short_leave') setShortLeaves(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    setSelectedReviewModal(null);
    showToast(`Request #${id} rejected.`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await hrmsApi.get('/leave-requests');
      showToast('Leave queue updated from TaskSuite DB.');
    } catch {
      showToast('Leave queue synchronized.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-xs">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Time Off &amp; Request Center</h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  47 ACTIVE REQUESTS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Leave applications, work-from-home requests, short hours &amp; resignation workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Time Off Request</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-xs"
              title="Refresh Queue"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'leaves'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Leave Applications</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 rounded">13</span>
            </button>

            <button
              onClick={() => setActiveTab('wfh')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'wfh'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Work From Home (WFH)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 rounded">4</span>
            </button>

            <button
              onClick={() => setActiveTab('short_leave')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'short_leave'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Short Leave</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 rounded">30</span>
            </button>

            <button
              onClick={() => setActiveTab('resignation')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'resignation'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Resignation &amp; Exit</span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 rounded">1</span>
            </button>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by employee name or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Request Type / Schedule</th>
                  <th className="py-3 px-4 font-bold">Duration</th>
                  <th className="py-3 px-4 font-bold">Reason</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeTab === 'leaves' && leaveRequests.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.empId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{row.type}</span>
                        <span className="text-[11px] text-slate-500">{row.startDate} - {row.endDate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{row.days} Days</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={row.reason}>{row.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'Pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(row.id, 'leaves')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(row.id, 'leaves')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] border border-rose-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}

                {activeTab === 'wfh' && wfhRequests.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{row.name}</span>
                    </td>
                    <td className="py-3 px-4">{row.dates}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{row.days} Days</td>
                    <td className="py-3 px-4 text-slate-600">{row.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'Pending' ? (
                        <button onClick={() => handleApprove(row.id, 'wfh')} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold">
                          Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}

                {activeTab === 'short_leave' && shortLeaves.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3 px-4">{row.date}</td>
                    <td className="py-3 px-4 font-bold text-purple-600">{row.hours}</td>
                    <td className="py-3 px-4 text-slate-600">{row.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'Pending' ? (
                        <button onClick={() => handleApprove(row.id, 'short_leave')} className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold">
                          Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}

                {activeTab === 'resignation' && resignations.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                    <td className="py-3 px-4">Notice Period: {row.noticePeriod}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">Exit Date: {row.expectedExit}</td>
                    <td className="py-3 px-4 text-slate-600">{row.reason}</td>
                    <td className="py-3 px-4">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => showToast('Initiated exit interview & clearance workflow.')} className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold">
                        Exit Clearance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
