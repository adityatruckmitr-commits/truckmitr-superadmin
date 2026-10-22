import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, CheckCircle, XCircle, Home, Calendar, Clock, 
  User, Briefcase, Edit, X, Info 
} from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useEmployeeMonthlyAttendance } from '../hooks/useAttendance'
import api from '../services/api'

const parseDateSafe = (dateStr) => {
  if (!dateStr) return null;
  const formattedStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(formattedStr);
  return isNaN(d.getTime()) ? null : d;
};

const EmployeeMonthlyAttendance = () => {
  const navigate = useNavigate();
  const { employeeId, month } = useParams();
  const [selectedMonth, setSelectedMonth] = useState(month || format(new Date(), 'yyyy-MM'));
  
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    date: "",
    attendance_status: "present",
    checkin_time: "",
    checkout_time: "",
    shift_id: 1,
    remark: "",
    checkin_latitude: "",
    checkin_longitude: "",
    checkin_address: "",
    location_accuracy: "",
    checkout_latitude: "",
    checkout_longitude: "",
    checkout_address: ""
  });

  const activeMonth = month || selectedMonth;
  const { data: responseData, isLoading, refetch } = useEmployeeMonthlyAttendance(employeeId, activeMonth);

  useEffect(() => {
    if (month) {
      setSelectedMonth(month);
    }
  }, [month]);

  const employee = responseData?.employee || {};
  const period = responseData?.period || {};
  const summary = responseData?.summary || {};
  const records = responseData?.data || [];

  const getStatusColor = (status) => {
    return {
      present: "bg-green-100 text-green-700",
      absent: "bg-red-100 text-red-700",
      wfh: "bg-purple-100 text-purple-700",
      on_leave: "bg-blue-100 text-blue-700",
      week_off: "bg-yellow-100 text-yellow-800"
    }[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    return {
      present: <CheckCircle className="w-5 h-5 text-green-600" />,
      absent: <XCircle className="w-5 h-5 text-red-600" />,
      wfh: <Home className="w-5 h-5 text-purple-600" />
    }[status] || null;
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    
    // Set checkin/checkout inputs in 'yyyy-MM-dd HH:mm:ss' or similar datetime-local format 'yyyy-MM-ddTHH:mm'
    const formatForDatetimeLocal = (dtStr) => {
      const parsed = parseDateSafe(dtStr);
      return parsed ? format(parsed, "yyyy-MM-dd'T'HH:mm") : "";
    };

    setFormData({
      date: record.date || "",
      attendance_status: record.attendance_status || "present",
      checkin_time: formatForDatetimeLocal(record.checkin_time),
      checkout_time: formatForDatetimeLocal(record.checkout_time),
      shift_id: record.shift_id || 1,
      remark: record.remark || "",
      checkin_latitude: record.checkin_latitude || "",
      checkin_longitude: record.checkin_longitude || "",
      checkin_address: record.checkin_address || "",
      location_accuracy: record.location_accuracy || "",
      checkout_latitude: record.checkout_latitude || "",
      checkout_longitude: record.checkout_longitude || "",
      checkout_address: record.checkout_address || ""
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!formData.checkin_time) {
      toast.error("Check-in time is required");
      return;
    }
    setIsUpdating(true);
    try {
      // Helper to format local datetime inputs ('yyyy-MM-ddTHH:mm') back to API expected format ('yyyy-MM-dd HH:mm:ss')
      const formatToApiDateTime = (val) => {
        if (!val) return null;
        return val.replace("T", " ") + ":00";
      };

      const payload = {
        ...formData,
        checkin_time: formatToApiDateTime(formData.checkin_time),
        checkout_time: formatToApiDateTime(formData.checkout_time),
        checkin_latitude: formData.checkin_latitude || null,
        checkin_longitude: formData.checkin_longitude || null,
        checkout_latitude: formData.checkout_latitude || null,
        checkout_longitude: formData.checkout_longitude || null,
        location_accuracy: formData.location_accuracy || null
      };

      const response = await api.put(`/attendance/employee/${employeeId}/update-by-date`, payload);

      if (response.status === 200 || response.data?.success) {
        toast.success("Attendance updated successfully!");
        setShowModal(false);
        setEditingRecord(null);
        refetch();
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGetLocation = (type) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    const toastId = toast.loading("Getting your location...");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      try {
        const response = await api.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const address = response.data?.address?.road || response.data?.address?.city || "Location obtained";
        
        setFormData(prev => type === "punch-in" ? {
          ...prev,
          checkin_latitude: latitude.toString(),
          checkin_longitude: longitude.toString(),
          checkin_address: address,
          location_accuracy: accuracy.toString()
        } : {
          ...prev,
          checkout_latitude: latitude.toString(),
          checkout_longitude: longitude.toString(),
          checkout_address: address
        });
        toast.dismiss(toastId);
        toast.success("Location obtained successfully!");
      } catch (err) {
        console.error("Geocoding error:", err);
        setFormData(prev => type === "punch-in" ? {
          ...prev,
          checkin_latitude: latitude.toString(),
          checkin_longitude: longitude.toString(),
          location_accuracy: accuracy.toString()
        } : {
          ...prev,
          checkout_latitude: latitude.toString(),
          checkout_longitude: longitude.toString()
        });
        toast.dismiss(toastId);
        toast.success("Location obtained (coordinates only)");
      }
    }, (err) => {
      toast.dismiss(toastId);
      console.error("Geolocation error:", err);
      toast.error("Unable to get your location. Please check permissions.");
    });
  };

  const StatBox = ({ icon: Icon, label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-xs border p-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-20">
          <Icon className="w-10 h-10" />
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Monthly Attendance Details</h1>
          <p className="text-gray-600 mt-1">
            {period.start_date ? format(parseDateSafe(period.start_date) || new Date(), "MMMM yyyy") : ""}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white backdrop-blur-md shadow-lg border border-gray-100 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-purple-400/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-blue-50/60 rounded-xl p-4 transition-all hover:bg-blue-100/70 hover:scale-105 border border-blue-100">
              <div className="p-3 bg-blue-500 rounded-lg shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Employee ID</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{employee.emp_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-purple-50/60 rounded-xl p-4 transition-all hover:bg-purple-100/70 hover:scale-105 border border-purple-100">
              <div className="p-3 bg-purple-500 rounded-lg shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Full Name</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{employee.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-indigo-50/60 rounded-xl p-4 transition-all hover:bg-indigo-100/70 hover:scale-105 border border-indigo-100">
              <div className="p-3 bg-indigo-500 rounded-lg shadow-md">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Designation</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{employee.designation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatBox
          icon={Calendar}
          label="Total Days"
          value={summary.total_days || 0}
          color="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-blue-200"
        />
        <StatBox
          icon={CheckCircle}
          label="Present"
          value={summary.present_days || 0}
          color="bg-gradient-to-br from-green-50 to-green-100 text-green-900 border-green-200"
        />
        <StatBox
          icon={XCircle}
          label="Absent"
          value={summary.absent_days || 0}
          color="bg-gradient-to-br from-red-50 to-red-100 text-red-900 border-red-200"
        />
        <StatBox
          icon={Home}
          label="WFH"
          value={summary.wfh_days || 0}
          color="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-900 border-purple-200"
        />
        <StatBox
          icon={Calendar}
          label="On Leave"
          value={summary.on_leave_days || 0}
          color="bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-900 border-yellow-200"
        />
        <StatBox
          icon={Clock}
          label="Total Hours"
          value={`${summary.total_work_hours || 0}h`}
          color="bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-900 border-indigo-200"
        />
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => {
            setSelectedMonth(e.target.value);
            navigate(`/employee-monthly-attendance/${employeeId}/${e.target.value}`);
          }}
          className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daily Attendance Records</h2>
            <p className="text-sm text-gray-600 mt-1">{records.length} records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch In</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch In Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch Out</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Punch Out Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => {
                  const checkinDate = parseDateSafe(rec.checkin_time);
                  const checkoutDate = parseDateSafe(rec.checkout_time);
                  const displayDate = parseDateSafe(rec.date);
                  const isWeekOff = rec.attendance_status === "week_off";

                  return (
                    <motion.tr
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {displayDate ? format(displayDate, "MMM dd, yyyy") : rec.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {checkinDate ? format(checkinDate, "hh:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={rec.checkin_address}>
                        {rec.checkin_address || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {checkoutDate ? format(checkoutDate, "hh:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={rec.checkout_address}>
                        {rec.checkout_address || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {rec.work_hours ? `${parseFloat(rec.work_hours).toFixed(2)}h` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg w-fit ${
                          isWeekOff ? "bg-yellow-50 border border-yellow-100" : ""
                        }`}>
                          {isWeekOff && <Info className="w-4 h-4 text-yellow-700" />}
                          {getStatusIcon(rec.attendance_status)}
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusColor(rec.attendance_status)}`}>
                            {rec.attendance_status ? rec.attendance_status.replace("_", " ") : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEditClick(rec)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-sm transition-colors border border-transparent hover:border-blue-100"
                          title="Edit Attendance"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Override Modal */}
      <AnimatePresence>
        {showModal && editingRecord && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Override Attendance Record</h3>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isUpdating}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.attendance_status}
                      onChange={e => setFormData({ ...formData, attendance_status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="wfh">Work From Home</option>
                      <option value="on_leave">On Leave</option>
                      <option value="week_off">Week Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch In Datetime</label>
                    <input
                      type="datetime-local"
                      value={formData.checkin_time}
                      onChange={e => setFormData({ ...formData, checkin_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch Out Datetime</label>
                    <input
                      type="datetime-local"
                      value={formData.checkout_time}
                      onChange={e => setFormData({ ...formData, checkout_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Remark</label>
                    <textarea
                      value={formData.remark}
                      onChange={e => setFormData({ ...formData, remark: e.target.value })}
                      placeholder="Add any override remarks (e.g. approved by manager)..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch In Latitude</label>
                    <input
                      type="text"
                      value={formData.checkin_latitude}
                      onChange={e => setFormData({ ...formData, checkin_latitude: e.target.value })}
                      placeholder="e.g. 28.6097"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch In Longitude</label>
                    <input
                      type="text"
                      value={formData.checkin_longitude}
                      onChange={e => setFormData({ ...formData, checkin_longitude: e.target.value })}
                      placeholder="e.g. 77.3875"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-semibold text-gray-700">Punch In Address</label>
                      <button
                        type="button"
                        onClick={() => handleGetLocation("punch-in")}
                        className="text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors border border-blue-100 font-medium"
                      >
                        Grab Current Position
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.checkin_address}
                      onChange={e => setFormData({ ...formData, checkin_address: e.target.value })}
                      placeholder="Punch in address string"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location Accuracy (m)</label>
                    <input
                      type="text"
                      value={formData.location_accuracy}
                      onChange={e => setFormData({ ...formData, location_accuracy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div />

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch Out Latitude</label>
                    <input
                      type="text"
                      value={formData.checkout_latitude}
                      onChange={e => setFormData({ ...formData, checkout_latitude: e.target.value })}
                      placeholder="e.g. 28.6097"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Punch Out Longitude</label>
                    <input
                      type="text"
                      value={formData.checkout_longitude}
                      onChange={e => setFormData({ ...formData, checkout_longitude: e.target.value })}
                      placeholder="e.g. 77.3875"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-semibold text-gray-700">Punch Out Address</label>
                      <button
                        type="button"
                        onClick={() => handleGetLocation("punch-out")}
                        className="text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors border border-blue-100 font-medium"
                      >
                        Grab Current Position
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.checkout_address}
                      onChange={e => setFormData({ ...formData, checkout_address: e.target.value })}
                      placeholder="Punch out address string"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Saving Override..." : "Save Override"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeMonthlyAttendance;
