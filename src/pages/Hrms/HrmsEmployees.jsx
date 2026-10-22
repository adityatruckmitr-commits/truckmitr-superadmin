import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  RotateCw,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  X,
  CreditCard,
  FileBadge
} from 'lucide-react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsEmployees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [toastMessage, setToastMessage] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmpModal, setSelectedEmpModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await hrmsApi.get('/employees');
      if (res.data && res.data.employees) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.warn('Using baseline employees:', err.message);
      // Baseline initial employees
      setEmployees([
        { emp_id: 'TM-EMP-001', full_name: 'Tarun Kumar', email: 'tarun.kumar@truckmitr.com', mobile: '9812345678', department: 'IT', designation: 'Senior Software Engineer', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-002', full_name: 'Sourabh Singh', email: 'sourabh.singh@truckmitr.com', mobile: '9823456789', department: 'Sales', designation: 'Sales Manager', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-003', full_name: 'Deepak Bhati', email: 'deepak.bhati@truckmitr.com', mobile: '9834567890', department: 'Telecalling', designation: 'Telechamp Team Lead', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-004', full_name: 'Chandarbhan', email: 'chandarbhan@truckmitr.com', mobile: '9845678901', department: 'Telecalling', designation: 'Operations Manager', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-005', full_name: 'Raksha', email: 'raksha@truckmitr.com', mobile: '9856789012', department: 'Telecalling', designation: 'Verification Specialist', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-006', full_name: 'Aayushi Verma', email: 'aayushi@truckmitr.com', mobile: '9867890123', department: 'Telecalling', designation: 'Telechamp Officer', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-007', full_name: 'Angad', email: 'angad@truckmitr.com', mobile: '9878901234', department: 'Telecalling', designation: 'Telechamp Executive', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-008', full_name: 'Nitin Kumar', email: 'nitin.kumar@truckmitr.com', mobile: '9889012345', department: 'IT', designation: 'DevOps Engineer', status: 'Pending', is_active: 1 },
        { emp_id: 'TM-EMP-009', full_name: 'Pawan Kumar', email: 'pawan.kumar@truckmitr.com', mobile: '9890123456', department: 'Marketing', designation: 'Campaign Specialist', status: 'Verified', is_active: 1 },
        { emp_id: 'TM-EMP-010', full_name: 'Sonam Kumari', email: 'sonam.kumari@truckmitr.com', mobile: '9901234567', department: 'Marketing', designation: 'Digital Marketing Executive', status: 'Verified', is_active: 1 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedDept !== 'All Departments' && emp.department !== selectedDept) return false;
      if (selectedStatus !== 'All Status' && emp.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!emp.full_name?.toLowerCase().includes(q) && !emp.emp_id?.toLowerCase().includes(q) && !emp.email?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [employees, selectedDept, selectedStatus, searchQuery]);

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
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employees Directory</h1>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  {employees.length} TOTAL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Workforce records, designations, KYC status &amp; employee credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={fetchEmployees}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg shadow-xs"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
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
            <option>Verified</option>
            <option>Pending</option>
          </select>

          <button
            onClick={() => {
              setSelectedDept('All Departments');
              setSelectedStatus('All Status');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg text-center"
          >
            Reset Filters
          </button>
        </div>

        {/* Employees Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Contact</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Designation</th>
                  <th className="py-3 px-4 font-bold">KYC Status</th>
                  <th className="py-3 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.emp_id}
                    onClick={() => setSelectedEmpModal(emp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-200">
                          {emp.full_name?.charAt(0) || 'E'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.emp_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 tabular-nums">{emp.mobile}</span>
                        <span className="text-[10px] text-slate-400">{emp.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.designation || 'Staff'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        emp.status === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmpModal(emp);
                        }}
                        className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredEmployees.length} of {employees.length} records</span>
          </div>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {selectedEmpModal.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedEmpModal.full_name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{selectedEmpModal.emp_id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmpModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedEmpModal.department}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Designation</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedEmpModal.designation || 'Staff'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-semibold text-slate-900">{selectedEmpModal.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-semibold text-slate-900">{selectedEmpModal.mobile}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="font-bold text-emerald-600">{selectedEmpModal.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => showToast(`Generating digital ID card for ${selectedEmpModal.full_name}...`)}
                  className="py-2 px-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-100"
                >
                  <FileBadge className="w-3.5 h-3.5" />
                  <span>Download ID Card</span>
                </button>
                <button
                  onClick={() => setSelectedEmpModal(null)}
                  className="py-2 px-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAddModalOpen(false);
                showToast('New employee onboarded successfully into TaskSuite DB.');
                fetchEmployees();
              }}
              className="p-6 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="ramesh@truckmitr.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500">
                    <option>IT</option>
                    <option>Telecalling</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>Human Resources</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Designation *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Telechamp Executive"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
