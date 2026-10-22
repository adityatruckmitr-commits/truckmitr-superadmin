import { useState, useRef, useMemo } from 'react'
import { useNavigate } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, CheckCircle, Clock, XCircle, Umbrella, Search, Filter,
  Upload, Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  MapPin, Pencil, X, Download, FileText
} from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar,
  PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useTodayAttendance } from '../hooks/useAttendance'
import { useAttendanceGraph } from '../hooks/useDashboard'
import { useDepartments } from '../hooks/useEmployees'
import { formatWorkHours } from '../utils/timeFormat'
import api from '../services/api'
import EditAttendanceModal from '../components/attendance/EditAttendanceModal'

const parseDateSafe = (dateStr) => {
  if (!dateStr) return null;
  const formattedStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(formattedStr);
  return isNaN(d.getTime()) ? null : d;
};

const getWorkingDaysThisMonth = () => {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d).getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

const TodayAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const isHRorAdmin = ['hr', 'super_admin', 'admin', 'manager'].includes(user?.role);

  // Edit dialog target (shared with the All Attendance register)
  const [editTarget, setEditTarget] = useState(null);

  // Export & Upload states/modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [exportMonth, setExportMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [exportDept, setExportDept] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const filterParam = {
    "": "",
    present: "todayPresent",
    absent: "todayAbsent",
    wfh: "todayWFH",
    on_leave: "todayOnLeave"
  }[filterStatus] || "";

  // Queries
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useTodayAttendance(filterParam);
  const { data: departmentsResponse } = useDepartments();
  const currentMonthStr = format(new Date(), 'yyyy-MM')
  const { data: rawGraphData } = useAttendanceGraph(currentMonthStr);

  const summary = attendanceResponse?.summary || {};
  const rawRecords = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
  const departments = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.departments || [];

  const graphMeta = rawGraphData?.meta || rawGraphData?.data?.meta || null
  const graphData = Array.isArray(rawGraphData) ? rawGraphData : Array.isArray(rawGraphData?.data) ? rawGraphData.data : []
  const monthlyChartData = graphData.map(item => ({
    day: item.day ? `Day ${item.day}` : (item.date ? format(new Date(item.date), 'MMM d') : ''),
    Present: item.on_time_count ?? item.present_count ?? 0,
    Late: item.late_count ?? 0,
    Absent: item.absent_count ?? 0,
  }))

  // Real summary metrics - honest zeros, never fabricated fallback numbers
  const totalEmployees = summary.total_records ?? 0;
  const presentCount = summary.total_present ?? 0;
  const lateCount = summary.total_late ?? 0;
  const absentCount = summary.total_absent ?? 0;
  const leaveCount = summary.total_on_leave ?? 0;
  const wfhCount = summary.total_wfh ?? 0;

  const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)
  const presentPct = pct(presentCount, totalEmployees);
  const latePct = pct(lateCount, totalEmployees);
  const absentPct = pct(absentCount, totalEmployees);
  const leavePct = pct(leaveCount, totalEmployees);

  const donutData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'On Leave', value: leaveCount, color: '#a855f7' },
    { name: 'WFH', value: wfhCount, color: '#3b82f6' },
  ].filter(d => d.value > 0)

  // Real department attendance rates for today, derived from the full unfiltered
  // record set already returned by the backend (not a separate fabricated stat).
  const deptInsights = useMemo(() => {
    const byDept = {}
    rawRecords.forEach(rec => {
      const dept = rec.employee?.department_name
      if (!dept) return
      if (!byDept[dept]) byDept[dept] = { total: 0, present: 0 }
      byDept[dept].total += 1
      if (rec.attendance_status === 'present') byDept[dept].present += 1
    })
    const rates = Object.entries(byDept)
      .filter(([, v]) => v.total > 0)
      .map(([name, v]) => ({ name, rate: Math.round((v.present / v.total) * 100) }))
    if (rates.length === 0) return { best: null, worst: null }
    const sorted = [...rates].sort((a, b) => b.rate - a.rate)
    return { best: sorted[0], worst: sorted[sorted.length - 1] }
  }, [rawRecords])

  const workingDaysThisMonth = getWorkingDaysThisMonth()

  // Filter records by search term & selected department
  const filteredRecords = rawRecords.filter(rec => {
    const dept = rec.employee?.department_name || '';
    if (selectedDeptFilter && dept.toLowerCase() !== selectedDeptFilter.toLowerCase()) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const empName = rec.employee?.full_name?.toLowerCase() || '';
    const empId = String(rec.employee_id || '').toLowerCase();
    return empName.includes(term) || empId.includes(term) || dept.toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'present') return "bg-green-100 text-green-700 border border-green-200";
    if (s === 'late') return "bg-amber-100 text-amber-700 border border-amber-200";
    if (s === 'absent') return "bg-red-100 text-red-700 border border-red-200";
    if (s === 'wfh') return "bg-blue-100 text-blue-700 border border-blue-200";
    if (s === 'on_leave' || s === 'leave') return "bg-purple-100 text-purple-700 border border-purple-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const handleExport = async () => {
    if (!exportMonth) {
      toast.error("Please select a month to export");
      return;
    }
    setIsExporting(true);
    try {
      const monthStart = format(new Date(exportMonth + "-01"), "yyyy-MM-dd");
      const monthEnd = format(new Date(new Date(exportMonth + "-01").getFullYear(), new Date(exportMonth + "-01").getMonth() + 1, 0), "yyyy-MM-dd");

      const params = new URLSearchParams({
        start_date: monthStart,
        end_date: monthEnd,
        ...(exportDept && { department_id: exportDept })
      });

      const response = await api.get(`/attendance/detailed-export?${params.toString()}`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `detailed_attendance_${exportMonth}_dept_${exportDept || "all"}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Detailed attendance report exported successfully!");
      setShowExportModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to export detailed report");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a CSV or Excel file");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("uploaded_by", user?.full_name || "HR");
      formData.append("approved_by", user?.full_name || "HR");

      const response = await api.post("/approved-attendance/upload-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        const stats = response.data.data;
        toast.success(`Upload successful! Created: ${stats.created}, Updated: ${stats.updated}, Errors: ${stats.errors}`, { duration: 5000 });
        setUploadFile(null);
        setShowUploadModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  if (isAttendanceLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 md:p-6 bg-slate-50 min-h-screen">
      {/* Header section with title and action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Attendance</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-gray-700">Attendance</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-sm px-3 py-1.5 text-xs text-gray-700 font-medium">
            <span className="text-gray-400">📅</span>
            <span>{format(new Date(), "dd MMM yyyy")}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterModal(prev => !prev)}
              className={`flex items-center gap-1.5 border rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus || selectedDeptFilter
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span>Filter</span>
              {(filterStatus || selectedDeptFilter) && (
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />
              )}
            </button>

            <AnimatePresence>
              {showFilterModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xl z-30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-gray-900">Filter Attendance</h4>
                    <button
                      onClick={() => {
                        setFilterStatus('')
                        setSelectedDeptFilter('')
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                      >
                        <option value="">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="wfh">WFH</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">Department</label>
                      <select
                        value={selectedDeptFilter}
                        onChange={(e) => { setSelectedDeptFilter(e.target.value); setCurrentPage(1) }}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                      >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => setShowFilterModal(false)}
                      className="w-full py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isHRorAdmin && (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-sm px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Import Attendance</span>
              </button>

              <button
                onClick={() => navigate('/attendance')}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mark Attendance</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top 5 Stat Cards - real counts, honest zeros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between min-h-[96px]">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{totalEmployees}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between min-h-[96px]">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Present</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-gray-900">{presentCount}</span>
              <span className="text-xs font-bold text-emerald-600">({presentPct}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between min-h-[96px]">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Late</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-gray-900">{lateCount}</span>
              <span className="text-xs font-bold text-amber-600">({latePct}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between min-h-[96px]">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Absent</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-gray-900">{absentCount}</span>
              <span className="text-xs font-bold text-rose-600">({absentPct}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-gray-200 flex items-center justify-between min-h-[96px]">
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">On Leave</p>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-bold text-gray-900">{leaveCount}</span>
              <span className="text-xs font-bold text-purple-600">({leavePct}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Umbrella className="w-5 h-5" />
          </div>
        </div>
      </div>

      {presentCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs font-medium text-blue-900">
          No one has punched in yet today — every active employee is currently counted absent until they check in.
        </div>
      )}

      {/* Middle Row: Real charts & insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Attendance Overview (real month-to-date bar chart) */}
        <div className="lg:col-span-5 bg-white rounded-lg p-5 border border-gray-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Attendance Overview</h3>
            {graphMeta?.month && (
              <span className="text-[11px] font-semibold text-gray-400">
                {graphMeta.used_fallback_month ? 'Most recent recorded month' : format(new Date(`${graphMeta.month}-01`), 'MMMM yyyy')}
              </span>
            )}
          </div>

          <div className="h-52 w-full">
            {monthlyChartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 font-medium">
                No attendance records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontWeight: 600 }} />
                  <Bar dataKey="Present" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={10} />
                  <Bar dataKey="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={10} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Today's Attendance (real donut chart) */}
        <div className="lg:col-span-4 bg-white rounded-lg p-5 border border-gray-200 flex flex-col items-center">
          <h3 className="text-sm font-bold text-gray-900 mb-4 w-full text-left">Today's Attendance</h3>

          <div className="relative w-44 h-44 flex items-center justify-center shrink-0 mb-5">
            {donutData.length === 0 ? (
              <div className="w-full h-full rounded-full border-[14px] border-gray-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-300">{totalEmployees}</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={54} outerRadius={75} paddingAngle={4} dataKey="value">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-900 leading-none">{totalEmployees}</span>
                  <span className="text-[11px] font-semibold text-gray-400 mt-1">Total</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full space-y-2.5 text-xs pt-4 border-t border-gray-100">
            {[
              { label: 'Present', value: presentCount, pct: presentPct, color: 'bg-emerald-500' },
              { label: 'Late', value: lateCount, pct: latePct, color: 'bg-amber-500' },
              { label: 'Absent', value: absentCount, pct: absentPct, color: 'bg-rose-500' },
              { label: 'On Leave', value: leaveCount, pct: leavePct, color: 'bg-purple-500' },
              { label: 'WFH', value: wfhCount, pct: pct(wfhCount, totalEmployees), color: 'bg-blue-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.color}`}></span>
                  <span className="text-gray-600 font-medium">{row.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 mr-1.5">{row.value}</span>
                  <span className="text-gray-400 text-[11px]">({row.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Insights Panel - real, derived from today's data */}
        <div className="lg:col-span-3 bg-white rounded-lg p-4 border border-gray-200 flex flex-col h-full">
          <h3 className="text-sm font-bold text-gray-900 mb-3 shrink-0">Attendance Insights</h3>

          <div className="flex-1 flex flex-col gap-3 justify-between">
            <div className="flex-1 flex items-center justify-between px-3 py-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight">Best Attendance</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">{deptInsights.best?.name || 'No data yet'}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 ml-1.5 whitespace-nowrap">{deptInsights.best ? `${deptInsights.best.rate}%` : '—'}</span>
            </div>

            <div className="flex-1 flex items-center justify-between px-3 py-3.5 rounded-xl bg-amber-50/50 border border-amber-100/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight">Lowest Attendance</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">{deptInsights.worst?.name || 'No data yet'}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 ml-1.5 whitespace-nowrap">{deptInsights.worst ? `${deptInsights.worst.rate}%` : '—'}</span>
            </div>

            <div className="flex-1 flex items-center justify-between px-3 py-3.5 rounded-xl bg-blue-50/50 border border-blue-100/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight">Avg Working Hours</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">Present employees today</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 ml-1.5 whitespace-nowrap">
                {summary.avg_work_hours ? formatWorkHours(summary.avg_work_hours) : '—'}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-between px-3 py-3.5 rounded-xl bg-purple-50/50 border border-purple-100/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-tight">Working Days</p>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Current Month (Mon-Fri)</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 ml-1.5 whitespace-nowrap">{workingDaysThisMonth} Days</span>
            </div>
          </div>
        </div>

      </div>

      {/* Attendance Records Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Attendance Records</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-gray-400 focus:bg-white"
              />
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-sm hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">EMPLOYEE ID</th>
                <th className="py-3.5 px-4">NAME</th>
                <th className="py-3.5 px-4">DEPARTMENT</th>
                <th className="py-3.5 px-4">CHECK IN</th>
                <th className="py-3.5 px-4">PUNCH-IN LOCATION</th>
                <th className="py-3.5 px-4">CHECK OUT</th>
                <th className="py-3.5 px-4">WORK HOURS</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs md:text-sm font-medium text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No attendance records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => {
                  const checkinDate = parseDateSafe(rec.checkin_time);
                  const checkoutDate = parseDateSafe(rec.checkout_time);
                  const checkInStr = checkinDate ? format(checkinDate, "hh:mm a") : "—";
                  const checkOutStr = checkoutDate ? format(checkoutDate, "hh:mm a") : "—";
                  const empId = rec.employee_id || "—";
                  const empName = rec.employee?.full_name || "Unknown";
                  const dept = rec.employee?.department_name || "—";
                  const workHours = Number(rec.work_hours) > 0 ? formatWorkHours(rec.work_hours) : "—";  // a manual edit without times has 0 hours - show a dash, not "0 hours"
                  const status = rec.is_late ? 'late' : (rec.attendance_status || "present");

                  return (
                    <tr key={rec.id || empId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-900">{empId}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={rec.employee?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empName}`}
                            alt={empName}
                            className="w-8 h-8 rounded-full object-cover bg-slate-100"
                          />
                          <span className="font-semibold text-slate-900">{empName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{dept}</td>
                      <td className="py-4 px-4 text-slate-600">{checkInStr}</td>
                      <td className="py-4 px-4 text-slate-600 max-w-[260px]">
                        {(() => {
                          const lat = rec.checkin_latitude, lng = rec.checkin_longitude
                          const hasCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined
                          const text = rec.checkin_address || (hasCoords ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : null)
                          if (!text) return "—"
                          const body = (
                            <>
                              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                              <span className="line-clamp-2 text-xs leading-snug">{text}</span>
                            </>
                          )
                          return hasCoords ? (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank" rel="noopener noreferrer"
                              title={`${text} — open in Google Maps`}
                              className="flex items-start gap-1.5 hover:text-indigo-600"
                            >
                              {body}
                            </a>
                          ) : (
                            <span title={text} className="flex items-start gap-1.5">{body}</span>
                          )
                        })()}
                      </td>
                      <td className="py-4 px-4 text-slate-600">{checkOutStr}</td>
                      <td className="py-4 px-4 text-slate-600">{workHours}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full capitalize ${getStatusStyle(status)}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isHRorAdmin ? (
                          <button
                            onClick={() => setEditTarget({
                              employeeId: rec.employee_id,
                              name: empName,
                              date: String(rec.date || format(new Date(), 'yyyy-MM-dd')).slice(0, 10),
                              source: 'live',
                            })}
                            title="Edit attendance"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Showing {filteredRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditAttendanceModal target={editTarget} onClose={() => setEditTarget(null)} />

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Export Detailed Attendance</h3>
                <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Month</label>
                <input
                  type="month"
                  value={exportMonth}
                  onChange={e => setExportMonth(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={exportDept}
                  onChange={e => setExportDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowExportModal(false)} className="flex-1 py-2 text-sm font-semibold border border-slate-300 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleExport} disabled={isExporting} className="flex-1 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg">
                  {isExporting ? "Exporting..." : "Download CSV"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Import Attendance File</h3>
                <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Select Excel / CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  onChange={e => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-600 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowUploadModal(false)} className="flex-1 py-2 text-sm font-semibold border border-slate-300 rounded-lg">
                  Cancel
                </button>
                <button onClick={handleUpload} disabled={isUploading || !uploadFile} className="flex-1 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TodayAttendance;
