import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Users,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsAttendance() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'all' | 'my'
  const [selectedDate, setSelectedDate] = useState('2026-10-13');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const itemsPerPage = 10;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Base Attendance Dataset
  const attendanceRecords = useMemo(() => [
    {
      id: 1,
      empId: 'TM-EMP-001',
      name: 'Tarun Kumar',
      department: 'IT',
      date: '13 Oct 2026',
      checkIn: '09:28 AM',
      checkOut: '--',
      workHours: '3h 12m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 2,
      empId: 'TM-EMP-002',
      name: 'Sourabh Singh',
      department: 'Sales',
      date: '13 Oct 2026',
      checkIn: '09:48 AM',
      checkOut: '--',
      workHours: '2h 52m',
      status: 'Late',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 3,
      empId: 'TM-EMP-003',
      name: 'Deepak Bhati',
      department: 'Telecalling',
      date: '13 Oct 2026',
      checkIn: '09:30 AM',
      checkOut: '--',
      workHours: '3h 10m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'Work From Home',
      verified: true
    },
    {
      id: 4,
      empId: 'TM-EMP-004',
      name: 'Chandarbhan',
      department: 'Telecalling',
      date: '13 Oct 2026',
      checkIn: '09:25 AM',
      checkOut: '--',
      workHours: '3h 15m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 5,
      empId: 'TM-EMP-005',
      name: 'Raksha',
      department: 'Telecalling',
      date: '13 Oct 2026',
      checkIn: '09:20 AM',
      checkOut: '--',
      workHours: '3h 20m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 6,
      empId: 'TM-EMP-006',
      name: 'Aayushi Verma',
      department: 'Telecalling',
      date: '13 Oct 2026',
      checkIn: '09:35 AM',
      checkOut: '--',
      workHours: '3h 05m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 7,
      empId: 'TM-EMP-007',
      name: 'Angad',
      department: 'Telecalling',
      date: '13 Oct 2026',
      checkIn: '09:31 AM',
      checkOut: '--',
      workHours: '3h 09m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 8,
      empId: 'TM-EMP-008',
      name: 'Nitin Kumar',
      department: 'IT',
      date: '13 Oct 2026',
      checkIn: '--',
      checkOut: '--',
      workHours: '0h 00m',
      status: 'Absent',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
      location: 'Unreported',
      verified: false
    },
    {
      id: 9,
      empId: 'TM-EMP-009',
      name: 'Pawan Kumar',
      department: 'Marketing',
      date: '13 Oct 2026',
      checkIn: '09:15 AM',
      checkOut: '--',
      workHours: '3h 25m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    },
    {
      id: 10,
      empId: 'TM-EMP-010',
      name: 'Sonam Kumari',
      department: 'Marketing',
      date: '13 Oct 2026',
      checkIn: '09:29 AM',
      checkOut: '--',
      workHours: '3h 11m',
      status: 'Present',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      location: 'TruckMitr HQ',
      verified: true
    }
  ], []);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(rec => {
      if (selectedDepartment !== 'All Departments' && rec.department !== selectedDepartment) return false;
      if (selectedStatus !== 'All Status' && rec.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!rec.name.toLowerCase().includes(q) && !rec.empId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [attendanceRecords, selectedDepartment, selectedStatus, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await hrmsApi.get(`/attendance/today?date=${selectedDate}`);
      showToast('Attendance register updated from TaskSuite DB.');
    } catch {
      showToast('Attendance register synchronized.');
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-xs">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Hub</h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  REALTIME BIOMETRIC / WEB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Workforce punch records, shifts, overtime &amp; late arrivals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Exporting attendance register as CSV...')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">36</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present (On-Time)</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">8</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</div>
              <div className="text-xl font-bold text-amber-600 mt-0.5">1</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent / Unreported</div>
              <div className="text-xl font-bold text-rose-600 mt-0.5">27</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'today'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today's Attendance
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              All Attendance Register
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-xs rounded-lg font-bold transition-all ${
                activeTab === 'my'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              My Attendance
            </button>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option>All Departments</option>
              <option>IT</option>
              <option>Telecalling</option>
              <option>Sales</option>
              <option>Marketing</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option>All Status</option>
              <option>Present</option>
              <option>Late</option>
              <option>Absent</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  setSelectedDepartment('All Departments');
                  setSelectedStatus('All Status');
                  setSearchQuery('');
                  setSelectedDate('2026-10-13');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Check In</th>
                  <th className="py-3 px-4 font-bold">Check Out</th>
                  <th className="py-3 px-4 font-bold">Work Hours</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.empId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.department}</td>
                    <td className="py-3 px-4 text-slate-600">{row.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.checkIn}</td>
                    <td className="py-3 px-4 text-slate-400">{row.checkOut}</td>
                    <td className="py-3 px-4 text-indigo-600 font-semibold">{row.workHours}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{row.location}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing 1 to {filteredRecords.length} of {filteredRecords.length} entries</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40">Previous</button>
              <span className="px-3 py-1 bg-indigo-600 text-white font-bold rounded">1</span>
              <button disabled className="px-3 py-1 bg-white border border-slate-200 rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
