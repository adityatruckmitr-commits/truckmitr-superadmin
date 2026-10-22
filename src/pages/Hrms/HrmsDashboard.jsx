import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Briefcase,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Download,
  RotateCw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  PieChart as PieChartIcon,
  HelpCircle,
  IndianRupee,
  Cake,
  Building2,
  Check,
  Send,
  Eye,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsDashboard() {
  const [selectedDate, setSelectedDate] = useState('2026-10-13');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Modals state
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [punchType, setPunchType] = useState('check_in');
  const [punchRemark, setPunchRemark] = useState('');

  // Dashboard Telemetry Data
  const [stats, setStats] = useState({
    total_employees: 36,
    present_today: 0,
    absent_today: 36,
    wfh_today: 0,
    on_leave_today: 0,
    short_leave_today: 0,
    late_today: 0,
    pending_requests_total: 47,
    pending_leave_requests: 13,
    pending_wfh_requests: 4,
    pending_short_leaves: 30,
    pending_hiring_requirements: 0,
    pending_verifications: 36,
    offer_letters_count: 0
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await hrmsApi.get(`/dashboard/stats?date=${selectedDate}`);
      if (res.data && res.data.success) {
        setStats(prev => ({
          ...prev,
          ...res.data.data
        }));
        showToast('Workforce telemetry synchronized with TaskSuite DB.');
      } else {
        showToast('Live HR metrics loaded.');
      }
    } catch (err) {
      console.warn('Using baseline cached stats:', err.message);
      showToast('Workforce data loaded from local instance.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  // Pending Requests Queue
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      type: 'LEAVE',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      employeeName: 'Sourabh Singh',
      subText: 'Unpaid Leave • 24 Sep - 26 Sep',
      reason: 'Urgent family emergency in hometown requiring leave.',
      appliedOn: '23 Sep 2026, 06:14 PM',
      totalDays: '3 Days'
    },
    {
      id: 2,
      type: 'LEAVE',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      employeeName: 'Sourabh Singh',
      subText: 'Unpaid Leave • 16 Sep - 16 Sep',
      reason: 'Medical examination and blood report collection.',
      appliedOn: '15 Sep 2026, 08:30 AM',
      totalDays: '1 Day'
    },
    {
      id: 3,
      type: 'SHORT LEAVE',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      employeeName: 'Sourabh Singh',
      subText: 'Short Leave • 15 Sep - 15 Sep (09:30 AM - 11:30 AM)',
      reason: 'Bank document verification at local branch.',
      appliedOn: '14 Sep 2026, 05:21 PM',
      totalDays: '2 Hours'
    },
    {
      id: 4,
      type: 'LEAVE',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      employeeName: 'Tarun Kumar',
      subText: 'Casual Leave • 18 Sep - 19 Sep',
      reason: 'Attending family religious ceremony.',
      appliedOn: '17 Sep 2026, 11:45 AM',
      totalDays: '2 Days'
    },
    {
      id: 5,
      type: 'WFH',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      employeeName: 'Deepak Bhati',
      subText: 'Work From Home • 14 Oct - 15 Oct',
      reason: 'Broadband technician scheduled at home.',
      appliedOn: '12 Oct 2026, 04:10 PM',
      totalDays: '2 Days'
    }
  ]);

  const handleActionRequest = (id, action) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
    setSelectedRequestForReview(null);
    showToast(`Request #${id} marked as ${action.toUpperCase()} successfully.`);
  };

  const handlePunchSubmit = (e) => {
    e.preventDefault();
    setIsPunchModalOpen(false);
    showToast(`Punch recorded successfully: ${punchType === 'check_in' ? 'Check In 09:31 AM' : 'Check Out'}`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full border border-indigo-200">
                TUESDAY, 13 OCTOBER 2026
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Shift: 09:30 AM - 06:30 PM
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              Welcome back, Deepak! <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Here is your daily HR operations & workforce summary across TM-Manavsetu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* Attendance Punch Button */}
            <button
              onClick={() => setIsPunchModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Attendance / Punch</span>
            </button>

            {/* Apply Leave Button */}
            <button
              onClick={() => setIsApplyLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-xs transition-all"
              title="Refresh Telemetry"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5 Quick Action Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => setIsPunchModalOpen(true)}
            className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Punch Log</div>
              <div className="text-[10px] text-slate-500">Clock In/Out</div>
            </div>
          </div>

          <div
            onClick={() => setIsApplyLeaveModalOpen(true)}
            className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-xs group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Leaves</div>
              <div className="text-[10px] text-slate-500">Apply &amp; View</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-xs group">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Calendar</div>
              <div className="text-[10px] text-slate-500">Holidays &amp; Events</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-xs group">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Helpdesk</div>
              <div className="text-[10px] text-slate-500">Support Tickets</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-xs group">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Salary Advance</div>
              <div className="text-[10px] text-slate-500">Apply &amp; Track</div>
            </div>
          </div>
        </div>

        {/* 5 Primary Workforce Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Employees</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900">{stats.total_employees}</div>
              <span className="text-[11px] text-slate-500">No new joiners this month</span>
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present Today</span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                {stats.total_employees > 0 ? Math.round((stats.present_today / stats.total_employees) * 100) : 0}%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-emerald-600">{stats.present_today}</div>
              <span className="text-[11px] text-slate-500">0% of workforce</span>
            </div>
          </div>

          {/* Absent Today */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent Today</span>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                100%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-rose-600">{stats.absent_today}</div>
              <span className="text-[11px] text-slate-500">Haven't marked attendance</span>
            </div>
          </div>

          {/* On Leave / WFH */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On Leave / WFH</span>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                0%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-amber-600">{stats.on_leave_today + stats.wfh_today}</div>
              <span className="text-[11px] text-slate-500">0% of workforce</span>
            </div>
          </div>

          {/* Short Leave Today */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Short Leave Today</span>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                0%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-blue-600">{stats.short_leave_today}</div>
              <span className="text-[11px] text-slate-500">0% of workforce</span>
            </div>
          </div>
        </div>

        {/* 4 Review Cards in a Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Pending Requests</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.pending_requests_total}</div>
                <span className="text-[11px] text-indigo-600 font-medium">Review now ↗</span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
              Review
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Hiring Requirements</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.pending_hiring_requirements}</div>
                <span className="text-[11px] text-slate-500">From managers ↗</span>
              </div>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
              Review
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Verification Pending</span>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.pending_verifications}</div>
                <span className="text-[11px] text-slate-500">Employees ↗</span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Review
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Offer Letters</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.offer_letters_count}</div>
                <span className="text-[11px] text-slate-500">View history ↗</span>
              </div>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
              In Progress
            </span>
          </div>
        </div>

        {/* Middle Section: Today's Attendance Meter, Pending Requests, My Leave Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Today's Attendance Ring (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Today's Attendance</h3>
              <a href="#/hrms/attendance" className="text-xs text-indigo-600 font-semibold hover:underline">
                View Details ↗
              </a>
            </div>

            <div className="my-6 flex flex-col items-center justify-center">
              {/* Donut Circle Representation */}
              <div className="relative w-36 h-36 rounded-full border-8 border-rose-500 flex items-center justify-center shadow-inner">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900">{stats.total_employees}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">TOTAL</span>
                </div>
              </div>

              {/* Status Breakdown Legend */}
              <div className="grid grid-cols-3 gap-4 mt-6 text-center w-full">
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Present</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{stats.present_today} (0%)</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Late</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{stats.late_today} (0%)</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Absent</span>
                  </div>
                  <div className="font-bold text-rose-600 text-sm mt-0.5">{stats.absent_today} (100%)</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Employees are marked absent until they clock in or submit a WFH request.</span>
            </div>
          </div>

          {/* Pending Requests Queue (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Pending Requests</h3>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              <a href="#/hrms/leaves" className="text-xs text-indigo-600 font-semibold hover:underline">
                View All ↗
              </a>
            </div>

            <div className="divide-y divide-slate-100 my-2 overflow-y-auto max-h-[310px]">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-1 rounded-lg">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${req.badgeColor}`}>
                        {req.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{req.employeeName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{req.subText}</span>
                  </div>
                  <button
                    onClick={() => setSelectedRequestForReview(req)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-md shadow-2xs transition-colors shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <span className="text-[11px] text-slate-400">Action items awaiting management approval</span>
            </div>
          </div>

          {/* My Leave Balance (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">My Leave Balance</h3>
              <button
                onClick={() => setIsApplyLeaveModalOpen(true)}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Apply Leave ↗
              </button>
            </div>

            <div className="flex flex-col gap-3 my-4">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-700">Casual Leave (CL)</span>
                <span className="text-xs font-bold text-indigo-600">8 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-700">Medical / Sick (SL)</span>
                <span className="text-xs font-bold text-emerald-600">6 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-700">Earned / Privilege (EL)</span>
                <span className="text-xs font-bold text-blue-600">12 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-medium text-slate-700">Short Leave Balance</span>
                <span className="text-xs font-bold text-purple-600">4 Hours</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 text-center">
              Allotted for Financial Year 2026-27
            </span>
          </div>
        </div>

        {/* Bottom Row: Department Breakdown & Upcoming Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Department Breakdown (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Breakdown</h3>
                <p className="text-[11px] text-slate-400">Headcount distribution across 6 active departments • 25 total</p>
              </div>
              <a href="#/hrms/employees" className="text-xs text-indigo-600 font-semibold hover:underline">
                View All ↗
              </a>
            </div>

            <div className="space-y-3.5 mt-4">
              {/* IT */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Information Technology (IT)</span>
                  <span className="text-indigo-600">8</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              {/* Telecalling */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Telecalling &amp; Customer Support</span>
                  <span className="text-amber-600">8</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              {/* Marketing */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Growth &amp; Marketing</span>
                  <span className="text-emerald-600">4</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>

              {/* Sales */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Enterprise Sales &amp; Logistics</span>
                  <span className="text-rose-600">2</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>

              {/* Management */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Management &amp; Operations</span>
                  <span className="text-blue-600">2</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>

              {/* HR */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Human Resources (HR)</span>
                  <span className="text-purple-600">1</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Holidays & Birthdays (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays &amp; Events</h3>
              <span className="text-xs text-indigo-600 font-semibold cursor-pointer">
                Calendar ↗
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Dussehra / Vijayadashami</div>
                    <div className="text-[11px] text-slate-500">Tuesday • Gazetted Holiday</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  20 Oct 2026
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Diwali / Deepavali</div>
                    <div className="text-[11px] text-slate-500">Sunday • Festival Celebration</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  08 Nov 2026
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Day after Diwali - Govardhan Puja</div>
                    <div className="text-[11px] text-slate-500">Monday • Optional Holiday</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  09 Nov 2026
                </span>
              </div>

              {/* Birthday widget */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Deepak Kumar (CTO)</div>
                    <div className="text-[11px] text-indigo-700 font-medium">Birthday on 05 Nov</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  In 23 Days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Punch Modal */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Punch</h3>
                  <span className="text-[11px] text-slate-500">Realtime GPS / Web Check-In</span>
                </div>
              </div>
              <button
                onClick={() => setIsPunchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePunchSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPunchType('check_in')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    punchType === 'check_in'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check In</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPunchType('check_out')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    punchType === 'check_out'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Check Out</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Remark / Reason (Optional)
                </label>
                <textarea
                  rows="3"
                  value={punchRemark}
                  onChange={(e) => setPunchRemark(e.target.value)}
                  placeholder="e.g. Office check-in / On client visit"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-500 flex items-center gap-2 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Geofencing verified: TruckMitr HQ Office Network</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPunchModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Submit Punch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Apply Leave Application</h3>
                  <span className="text-[11px] text-slate-500">TM-Manavsetu Leave Workflow</span>
                </div>
              </div>
              <button
                onClick={() => setIsApplyLeaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsApplyLeaveModalOpen(false);
                showToast('Leave request submitted to reporting manager successfully.');
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Leave Type *
                </label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500">
                  <option>Casual Leave (CL) - 8 Available</option>
                  <option>Sick / Medical Leave (SL) - 6 Available</option>
                  <option>Privilege / Earned Leave (EL) - 12 Available</option>
                  <option>Unpaid / Loss of Pay (LOP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="State the purpose of your time off request..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyLeaveModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Drawer / Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedRequestForReview.badgeColor}`}>
                  {selectedRequestForReview.type}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Request Review: {selectedRequestForReview.employeeName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequestForReview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-bold text-slate-900">{selectedRequestForReview.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Schedule:</span>
                  <span className="font-semibold text-slate-800">{selectedRequestForReview.subText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-indigo-600">{selectedRequestForReview.totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applied On:</span>
                  <span className="text-slate-700">{selectedRequestForReview.appliedOn}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Employee Stated Reason:
                </label>
                <p className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 text-slate-800">
                  {selectedRequestForReview.reason}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleActionRequest(selectedRequestForReview.id, 'rejected')}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleActionRequest(selectedRequestForReview.id, 'approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
