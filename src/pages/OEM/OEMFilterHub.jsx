import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Filter,
  Plus,
  Trash2,
  Search,
  Download,
  DollarSign,
  Fuel,
  Truck,
  Weight,
  Layers,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const TAB_CONFIGS = {
  budget: {
    key: 'budget',
    title: 'Budget',
    badgeText: 'Brackets',
    formTitle: 'Add Budget',
    inputLabel: 'Budget Name',
    placeholder: 'Enter budget range (e.g. Below 10 lakh, 10 lakh - 15 lakh)',
    colIdName: 'S No',
    colName: 'Budget Name',
    fieldName: 'budget_name',
    apiGet: '/admin/budget',
    apiAdd: '/admin/add-budget',
    apiDelete: '/admin/budget/delete',
    icon: DollarSign,
    color: 'blue',
  },
  'fuel-type': {
    key: 'fuel-type',
    title: 'Fuel Type',
    badgeText: 'Configured',
    formTitle: 'Add Fuel Type',
    inputLabel: 'Fuel Type Name',
    placeholder: 'Enter fuel category (e.g. Diesel, EV, CNG, LNG)',
    colIdName: 'S No',
    colName: 'Fuel Type Name',
    fieldName: 'fuel_type_name',
    apiGet: '/admin/fuel-type',
    apiAdd: '/admin/add_fuel_type',
    apiDelete: '/admin/fuel-type/delete',
    icon: Fuel,
    color: 'amber',
  },
  'vehicle-app': {
    key: 'vehicle-app',
    title: 'Vehicle Application',
    badgeText: 'Categories',
    formTitle: 'Add Vehicle Application',
    inputLabel: 'Vehicle Application Name',
    placeholder: 'Enter vehicle application name (e.g. Perishable, E-commerce, White Goods)',
    colIdName: 'S No',
    colName: 'Vehicle Application Name',
    fieldName: 'vehicle_application_name',
    apiGet: '/admin/vehicle-application',
    apiAdd: '/admin/add-vehicle_application',
    apiDelete: '/admin/vehicle-application/delete',
    hasExtraBtn: true,
    extraBtnLabel: '+ Add Vehicle Brand',
    icon: Truck,
    color: 'indigo',
  },
  gvw: {
    key: 'gvw',
    title: 'GVW (Tons)',
    badgeText: 'Ranges',
    formTitle: 'Add GVW',
    inputLabel: 'GVW Name',
    placeholder: 'Enter gross vehicle weight range (e.g. 11 - 19, 20 - 28)',
    colIdName: 'S No',
    colName: 'GVW Name',
    fieldName: 'gvm_name',
    apiGet: '/admin/gvm',
    apiAdd: '/admin/add-gvm',
    apiDelete: '/admin/gvm/delete',
    icon: Weight,
    color: 'emerald',
  },
  'vehicle-type': {
    key: 'vehicle-type',
    title: 'Vehicle Type',
    badgeText: 'Defined',
    formTitle: 'Add Vehicle Type',
    inputLabel: 'Vehicle Type Name',
    placeholder: 'Enter vehicle type name (e.g. Container Trucks, Tippers, Flatbeds)',
    colIdName: 'Id',
    colName: 'Vehicle Type Name',
    fieldName: 'vehicle_name',
    apiGet: '/admin/vehicletype',
    apiAdd: '/admin/create_Vehicletype',
    apiDelete: '/admin/Vehicletype/delete',
    icon: Layers,
    color: 'rose',
  },
  'tyres-count': {
    key: 'tyres-count',
    title: 'Tyres Count',
    badgeText: 'Variants',
    formTitle: 'Add Tyres',
    inputLabel: 'Tyres Name',
    placeholder: 'Enter tyres variant (e.g. 6 wheelers, 10 wheelers, 14 wheelers)',
    colIdName: 'S No',
    colName: 'Tyres Name',
    fieldName: 'tyres_type',
    apiGet: '/admin/tyres-count',
    apiAdd: '/admin/add-tyres-count',
    apiDelete: '/admin/tyres-count/delete',
    icon: CircleDot,
    color: 'purple',
  },
};

export default function OEMFilterHub() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL query param or route pathname
  const initialTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && TAB_CONFIGS[tabParam]) return tabParam;

    const path = location.pathname.toLowerCase();
    if (path.includes('fuel-type')) return 'fuel-type';
    if (path.includes('vehicle-application')) return 'vehicle-app';
    if (path.includes('gvm') || path.includes('gvw')) return 'gvw';
    if (path.includes('vehicletype') || path.includes('vehicle-type')) return 'vehicle-type';
    if (path.includes('tyres-count')) return 'tyres-count';
    if (path.includes('budget')) return 'budget';

    return 'budget';
  }, [location.search, location.pathname]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [summaryCounts, setSummaryCounts] = useState({
    budget: 7,
    fuel_type: 5,
    vehicle_application: 10,
    gvw: 4,
    vehicle_type: 26,
    tyres_count: 6,
    brands: 9,
  });

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const currentConfig = TAB_CONFIGS[activeTab] || TAB_CONFIGS.budget;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Sync state if URL tab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Fetch summary counts
  const fetchSummary = async () => {
    try {
      const res = await api.get('/admin/oem/summary');
      if (res.data?.status === 'success' && res.data.data) {
        setSummaryCounts(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch OEM summary:', err);
    }
  };

  // Fetch active tab items
  const fetchTabData = async (tabKey = activeTab) => {
    const cfg = TAB_CONFIGS[tabKey];
    if (!cfg) return;

    setLoading(true);
    try {
      const res = await api.get(cfg.apiGet);
      if (res.data && res.data.data) {
        setTableData(res.data.data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error(`Error loading ${cfg.title}:`, err);
      showToast(`Failed to load ${cfg.title} list`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTabData(activeTab);
    setInputValue('');
    setSearchQuery('');
    setCurrentPage(1);
  }, [activeTab]);

  const handleTabSwitch = (key) => {
    setActiveTab(key);
    navigate(`/oem/filters?tab=${key}`, { replace: true });
  };

  // Form Submit (Add New Filter Item)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const payload = { [currentConfig.fieldName]: trimmed };
      const res = await api.post(currentConfig.apiAdd, payload);

      if (res.data?.status === 'success') {
        showToast(res.data.message || `Successfully added "${trimmed}" to ${currentConfig.title}!`);
        setInputValue('');
        fetchTabData(activeTab);
        fetchSummary();
      } else {
        showToast(res.data?.message || 'Failed to add item', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to add ${currentConfig.title}`;
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || '#' + id}"?`)) return;

    try {
      const res = await api.get(`${currentConfig.apiDelete}/${id}`);
      if (res.data?.status === 'success') {
        showToast(`Record #${id} deleted successfully!`);
        fetchTabData(activeTab);
        fetchSummary();
      } else {
        showToast(res.data?.message || 'Delete failed', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete record';
      showToast(msg, 'error');
    }
  };

  // Filter & Search table rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tableData;

    return tableData.filter((item) => {
      const val = item[currentConfig.fieldName] || item.name || '';
      return String(val).toLowerCase().includes(q) || String(item.id).includes(q);
    });
  }, [tableData, searchQuery, currentConfig.fieldName]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  // Export All to CSV
  const handleExportCSV = () => {
    if (!tableData.length) {
      showToast('No data to export', 'error');
      return;
    }
    const header = `Id,${currentConfig.colName}\n`;
    const rows = tableData
      .map((it) => `"${it.id}","${(it[currentConfig.fieldName] || '').replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OEM_${currentConfig.title.replace(/\s+/g, '_')}_List.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${tableData.length} records to CSV!`);
  };

  return (
    <div className="space-y-6 antialiased text-slate-800">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumbs & Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-1 gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span className="hover:text-slate-700 cursor-pointer" onClick={() => navigate('/')}>
              Dashboard
            </span>
            <span>/</span>
            <span className="text-slate-600 font-medium">OEM Masters</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">OEM Filter</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">{currentConfig.title}</span>
          </nav>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentConfig.title} Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              {tableData.length} {currentConfig.badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage and organize OEM truck marketplace classification attributes and filter rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => {
              fetchTabData(activeTab);
              fetchSummary();
            }}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 border border-slate-200 shadow-2xs text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Export All
          </button>

          <button
            onClick={() => {
              const inputEl = document.getElementById('filter-add-input');
              if (inputEl) {
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                inputEl.focus();
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 shadow-sm text-xs font-bold rounded-lg text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Filter
          </button>
        </div>
      </div>

      {/* Top 6 Metric Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Budget */}
        <div
          onClick={() => handleTabSwitch('budget')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'budget'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'border-slate-200/90 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-blue-600">Budget</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.budget}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Price slabs</p>
        </div>

        {/* Metric 2: Fuel Type */}
        <div
          onClick={() => handleTabSwitch('fuel-type')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'fuel-type'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
              : 'border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-600">Fuel Types</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Fuel className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.fuel_type}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Diesel, EV, etc.</p>
        </div>

        {/* Metric 3: Vehicle Application */}
        <div
          onClick={() => handleTabSwitch('vehicle-app')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'vehicle-app'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
              : 'border-slate-200/90 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-indigo-600">Applications</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.vehicle_application}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Use cases defined</p>
        </div>

        {/* Metric 4: GVW (Tons) */}
        <div
          onClick={() => handleTabSwitch('gvw')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'gvw'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-600">GVW Range</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Weight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.gvw}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Tonnage brackets</p>
        </div>

        {/* Metric 5: Vehicle Type */}
        <div
          onClick={() => handleTabSwitch('vehicle-type')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'vehicle-type'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
              : 'border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-rose-600">Vehicle Types</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.vehicle_type}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Body form factors</p>
        </div>

        {/* Metric 6: Tyres Count */}
        <div
          onClick={() => handleTabSwitch('tyres-count')}
          className={`cursor-pointer bg-white rounded-xl p-3.5 border transition-all shadow-2xs group ${
            activeTab === 'tyres-count'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20'
              : 'border-slate-200/90 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-600">Tyres Count</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <CircleDot className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">{summaryCounts.tyres_count}</div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Axle variants</p>
        </div>
      </section>

      {/* Sub Tabs Navigation */}
      <div className="bg-white rounded-t-xl border border-b-0 border-slate-200 p-1.5 flex items-center overflow-x-auto space-x-1.5">
        {Object.values(TAB_CONFIGS).map((cfg, idx) => {
          const isActive = activeTab === cfg.key;
          const count =
            cfg.key === 'budget'
              ? summaryCounts.budget
              : cfg.key === 'fuel-type'
              ? summaryCounts.fuel_type
              : cfg.key === 'vehicle-app'
              ? summaryCounts.vehicle_application
              : cfg.key === 'gvw'
              ? summaryCounts.gvw
              : cfg.key === 'vehicle-type'
              ? summaryCounts.vehicle_type
              : summaryCounts.tyres_count;

          return (
            <button
              key={cfg.key}
              onClick={() => handleTabSwitch(cfg.key)}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>
                {idx + 1}. {cfg.title}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Card */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
        {/* Dynamic Creation Form */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{currentConfig.formTitle}</h2>
            </div>

            {/* Contextual Action Button (e.g., + Add Vehicle Brand) */}
            {currentConfig.hasExtraBtn && (
              <button
                type="button"
                onClick={() => navigate('/oem/brands')}
                className="text-xs text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentConfig.extraBtnLabel}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
            <div>
              <label htmlFor="filter-add-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                {currentConfig.inputLabel} <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <currentConfig.icon className="w-4 h-4" />
                </div>
                <input
                  id="filter-add-input"
                  type="text"
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentConfig.placeholder}
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Specify the bracket label which will be visible to users filtering trucks in the marketplace.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {submitting ? 'Saving...' : 'Submit'}
              </button>

              <button
                type="button"
                onClick={() => setInputValue('')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Data List Section Card */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          {/* Table Header Controls */}
          <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <h3 className="font-bold text-slate-900 text-sm">{currentConfig.title} List</h3>
              {/* Entries Selector */}
              <div className="flex items-center text-xs text-slate-500 space-x-1.5">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs py-1 px-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white font-semibold text-slate-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter results..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-20 text-center" scope="col">
                    {currentConfig.colIdName}
                  </th>
                  <th className="py-3 px-4" scope="col">
                    {currentConfig.colName}
                  </th>
                  <th className="py-3 px-4 w-32 text-center" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-400">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading {currentConfig.title} data...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-400 font-medium">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item, idx) => {
                    const rowName = item[currentConfig.fieldName] || item.name || '-';
                    const serialNo = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-600">
                          {currentConfig.colIdName === 'Id' ? item.id : serialNo}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          <span>{rowName}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, rowName)}
                            className="inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="font-medium">
              Showing {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
            </div>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), currentPage + 2)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
