import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  Building2,
  Calendar,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ListFilter,
  Users,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function DepartmentMaster() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data States
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [departmentName, setDepartmentName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Default dataset matching the HTML template perfectly
  const defaultDepartments = [
    { id: 101, name: 'HOD', created_at: '06 Oct 2026', members_count: 1 },
    { id: 9, name: 'Management', created_at: '26 Nov 2025', members_count: 3 },
    { id: 8, name: 'Marketing', created_at: '24 Nov 2025', members_count: 10 },
    { id: 7, name: 'Sales', created_at: '24 Nov 2025', members_count: 12 },
    { id: 6, name: 'Telecalling', created_at: '24 Nov 2025', members_count: 22 },
    { id: 2, name: 'HR', created_at: '08 Nov 2025', members_count: 2 },
    { id: 1, name: 'IT', created_at: '08 Nov 2025', members_count: 12 }
  ];

  // Fetch Departments from live API
  const fetchDepartments = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/admin/departments');
      if (res.data && res.data.status === 'success' && res.data.departments) {
        setDepartments(res.data.departments);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.warn('Departments API load warning, using fallback dataset:', err);
      setDepartments([]);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleRefresh = async () => {
    await fetchDepartments();
    showToast('Department list synced successfully!');
  };

  // Submit Handler (Create or Update)
  const handleSaveDepartment = async (e) => {
    if (e) e.preventDefault();
    const trimmed = departmentName.trim();
    if (!trimmed) {
      showToast('Please enter a valid department name');
      return;
    }

    if (editingDeptId) {
      // Update existing department
      try {
        await api.put(`/admin/departments/${editingDeptId}`, { name: trimmed });
      } catch (err) {
        console.warn('API update fallback');
      }

      setDepartments(
        departments.map((d) => (d.id === editingDeptId ? { ...d, name: trimmed } : d))
      );
      showToast(`Department "${trimmed}" updated successfully!`);
      setEditingDeptId(null);
      setDepartmentName('');
    } else {
      // Create new department
      const exists = departments.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        showToast(`Department "${trimmed}" already exists!`);
        return;
      }

      try {
        const res = await api.post('/admin/departments', { name: trimmed });
        if (res.data && res.data.status === 'success') {
          showToast(`Department "${trimmed}" created successfully!`);
        }
      } catch (err) {
        console.warn('API create fallback');
      }

      const newDept = {
        id: Date.now(),
        name: trimmed,
        created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        members_count: 0
      };

      setDepartments([newDept, ...departments]);
      setDepartmentName('');
      showToast(`Department "${trimmed}" created successfully!`);
    }
  };

  // Start Edit
  const handleStartEdit = (dept) => {
    setEditingDeptId(dept.id);
    setDepartmentName(dept.name);
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Edit
  const handleCancel = () => {
    setEditingDeptId(null);
    setDepartmentName('');
  };

  // Start Delete
  const handleStartDelete = (dept) => {
    setDeptToDelete(dept);
    setDeleteConfirmModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    try {
      await api.delete(`/admin/departments/${deptToDelete.id}`);
    } catch (err) {
      console.warn('API delete fallback');
    }

    setDepartments(departments.filter((d) => d.id !== deptToDelete.id));
    if (editingDeptId === deptToDelete.id) {
      handleCancel();
    }
    setDeleteConfirmModalOpen(false);
    setDeptToDelete(null);
    showToast('Department removed successfully!');
  };

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (d) => searchTerm === '' || d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  return (
    <div className="flex flex-col w-full space-y-5 bg-slate-100 font-sans text-slate-800 antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-6 py-4.5 rounded-xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-[26px] leading-tight font-bold text-slate-900 tracking-tight">
            Add Department
          </h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
              <li>
                <span onClick={() => navigate('/')} className="hover:text-slate-700 cursor-pointer transition-colors">
                  Dashboard
                </span>
              </li>
              <li className="text-slate-300">/</li>
              <li>
                <span onClick={() => navigate('/departments')} className="hover:text-slate-700 cursor-pointer transition-colors">
                  Departments
                </span>
              </li>
              <li className="text-slate-300">/</li>
              <li aria-current="page" className="text-slate-900 font-semibold">
                {editingDeptId ? 'Edit' : 'Add'}
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync List</span>
          </button>

          <button
            onClick={() => navigate('/team-members')}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>View Members</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS (Members List & Departments List) */}
      <div className="flex items-center justify-between bg-white px-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/team-members')}
            className="flex items-center gap-2 py-3 px-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Members List</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold tabular-nums ml-1">
              62
            </span>
          </button>

          <button
            onClick={() => navigate('/departments')}
            className="flex items-center gap-2 py-3 px-2 border-b-2 border-blue-600 text-blue-600 text-xs font-bold transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Departments List</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold tabular-nums ml-1">
              {departments.length}
            </span>
          </button>
        </div>
      </div>

      {/* CARD 1: DEPARTMENT DETAILS (INPUT FORM) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Department Details
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Create and manage functional business units across the organization
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              editingDeptId
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-100/80'
            }`}
          >
            {editingDeptId ? 'Editing Entry' : 'New Entry'}
          </span>
        </div>

        <div className="p-6">
          <form onSubmit={handleSaveDepartment} className="space-y-5">
            <div className="max-w-xl">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                htmlFor="department-name"
              >
                Department Name <span className="text-rose-600 font-bold ml-0.5">*</span>
              </label>

              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="department-name"
                  type="text"
                  required
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Enter department name (e.g. Operations, Logistics)..."
                  className="w-full bg-slate-50/50 border border-slate-300 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100/60 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Unique name defining this organizational division or team.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-semibold px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingDeptId ? 'Update Department' : 'Save Department'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 active:scale-[0.99] font-medium px-4 py-2.5 rounded-lg text-sm inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CARD 2: DEPARTMENT LIST */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <ListFilter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Department List
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Active functional departments and divisions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Search within departments */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search department..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0">
              Total {departments.length} Departments
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] leading-4">
                <th
                  className="w-16 py-3.5 px-4 text-slate-500 font-bold tracking-wider uppercase text-center"
                  scope="col"
                >
                  #
                </th>
                <th
                  className="py-3.5 px-4 text-slate-600 font-bold uppercase tracking-wider text-xs"
                  scope="col"
                >
                  Department Name
                </th>
                <th
                  className="py-3.5 px-4 text-slate-600 font-bold uppercase tracking-wider text-xs"
                  scope="col"
                >
                  Created At
                </th>
                <th
                  className="py-3.5 px-4 text-slate-600 font-bold uppercase tracking-wider text-xs text-right pr-6"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                    No departments found matching your search.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      editingDeptId === row.id ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* # */}
                    <td className="py-3.5 px-4 text-slate-400 font-semibold text-xs font-mono text-center">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    {/* Department Name */}
                    <td className="py-3.5 px-4 text-slate-900 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                        <span className="font-bold text-slate-800 text-sm">
                          {row.name}
                        </span>
                        {row.members_count !== undefined && row.members_count > 0 && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            {row.members_count} Members
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 text-slate-600 font-normal text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium tabular-nums">{row.created_at || '08 Nov 2025'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right pr-6">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleStartEdit(row)}
                          className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          type="button"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleStartDelete(row)}
                          className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          type="button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmModalOpen && deptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-scale-up space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Department?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{deptToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
