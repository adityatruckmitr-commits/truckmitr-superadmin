import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  Building2,
  Plus,
  Trash2,
  Search,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Truck,
  ShieldCheck,
  Check
} from 'lucide-react';
import PageJump from '../../components/PageJump';

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [filePreview, setFilePreview] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Fetch Brands List
  // models in trucklist (sent with the brands list)
  const [truckModels, setTruckModels] = useState(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/brand');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setBrands(res.data.data);
        setTruckModels(res.data.truck_models ?? null);
      } else {
        setBrands([]);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      showToast('Failed to load brands list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setSelectedFile(null);
      setFileName('No file chosen');
      setFilePreview(null);
    }
  };

  const handleResetForm = () => {
    setBrandName('');
    setSelectedFile(null);
    setFileName('No file chosen');
    setFilePreview(null);
    const fileInput = document.getElementById('brand-image-file');
    if (fileInput) fileInput.value = '';
  };

  // Submit Add Brand
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast('Please enter brand name', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', brandName.trim());
      if (selectedFile) {
        formData.append('images', selectedFile);
      }

      const res = await api.post('/admin/create_brand', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        showToast(res.data.message || `Brand "${brandName}" added successfully!`);
        handleResetForm();
        fetchBrands();
      } else {
        showToast(res.data?.message || 'Failed to add brand', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add brand';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Brand
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete brand "${name}"?`)) return;

    try {
      const res = await api.get(`/admin/brand/delete/${id}`);
      if (res.data?.status === 'success') {
        showToast(`Brand #${id} deleted successfully!`);
        fetchBrands();
      } else {
        showToast(res.data?.message || 'Failed to delete brand', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete brand';
      showToast(msg, 'error');
    }
  };

  // Filtered rows
  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return brands;

    return brands.filter(
      (b) =>
        (b.name && b.name.toLowerCase().includes(q)) ||
        String(b.id).includes(q) ||
        String(b.brand_id).includes(q)
    );
  }, [brands, searchQuery]);

  // Paginated rows
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBrands.slice(start, start + pageSize);
  }, [filteredBrands, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBrands.length / pageSize) || 1;

  // Export to CSV
  const handleExportCSV = () => {
    if (!brands.length) {
      showToast('No brands to export', 'error');
      return;
    }
    const header = 'Id,Brand Id,Name,Image Path\n';
    const rows = brands
      .map((b) => `"${b.id}","${b.brand_id || b.id}","${(b.name || '').replace(/"/g, '""')}","${b.brand_images || ''}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OEM_Brands_List.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${brands.length} brands to CSV!`);
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

      {/* Page Header and Breadcrumbs */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="hover:text-blue-600 cursor-pointer">OEM Masters</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold">Brand List</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Brand Configuration</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {brands.length} Brands
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage truck manufacturers, OEM logos, and brand marketplace credentials.
          </p>
        </div>

        {/* Header Right Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchBrands}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export All
          </button>

          <a
            href="#add-brand-card"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Brand
          </a>
        </div>
      </section>

      {/* Quick Stats Overview */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Brands */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Brands</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{brands.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-bold text-emerald-600">
            <Check className="w-3.5 h-3.5" />
            Active OEM Partners
          </p>
        </div>

        {/* Card 2: Verified Logos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verified Logos</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ImageIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {brands.filter((b) => Boolean(b.brand_images)).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">150 x 94px Dimensions</p>
        </div>

        {/* Card 3: Truck Models */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Truck Models</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{truckModels ?? '—'}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Active in Marketplace</p>
        </div>

        {/* Card 4: Connected Dealers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Connected Dealers</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">—</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">No dealer data recorded yet</p>
        </div>
      </section>

      {/* Add Brand Section */}
      <section
        id="add-brand-card"
        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              +
            </span>
            <h3 className="text-sm font-bold text-slate-900">Add Brand</h3>
          </div>
          <span className="text-xs text-slate-400 font-normal">* Indicates mandatory fields</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field 1: Brand Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="brand-name">
                Brand Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="brand-name"
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter OEM brand name (e.g. Tata Motors, Ashok Leyland)"
                className="w-full text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Enter the official manufacturer company title as registered.
              </p>
            </div>

            {/* Field 2: Brand Image File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Brand Image <span className="text-rose-500 font-bold">*</span>{' '}
                <span className="font-normal text-slate-400">(Size: 150 x 94px)</span>
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <label
                  htmlFor="brand-image-file"
                  className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 border-r border-slate-200 transition-colors shrink-0"
                >
                  Choose File
                </label>
                <input
                  id="brand-image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <span className="text-xs text-slate-500 px-3.5 select-none truncate font-medium">
                  {fileName}
                </span>
                {filePreview && (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="h-7 w-12 object-contain ml-auto mr-2 rounded border border-slate-200 bg-white"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Supported formats: SVG, PNG, WebP or JPEG. Max file size: 2MB.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Brand List Table Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Brand List</h3>
            <p className="text-xs text-slate-500">
              Currently active original equipment truck brands in marketplace
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Show Entries */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Live Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter brands by name or id..."
                className="w-full text-xs h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center" scope="col">
                  Id
                </th>
                <th className="py-3 px-4 w-28 text-center" scope="col">
                  Brand Id
                </th>
                <th className="py-3 px-6" scope="col">
                  Name
                </th>
                <th className="py-3 px-6 text-center" scope="col">
                  Image
                </th>
                <th className="py-3 px-6 w-28 text-center" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading brands...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBrands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    No matching brands found.
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((b, idx) => {
                  const sNo = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-center font-medium text-slate-500">{sNo}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 text-xs">
                          {b.brand_id || b.id}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">{b.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <div className="w-36 h-12 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shadow-2xs hover:shadow-sm transition-shadow">
                            {b.brand_images ? (
                              <img
                                src={b.image_url || `/${b.brand_images}`}
                                alt={b.name}
                                className="max-h-9 max-w-full object-contain"
                                onError={(e) => {
                                  // Fallback text logo badge if image file not on disk
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className={`text-xs font-black tracking-tight text-blue-900 uppercase ${
                                b.brand_images ? 'hidden' : 'flex items-center gap-1.5'
                              }`}
                            >
                              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="truncate">{b.name}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.name)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
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

        {/* Table Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Showing{' '}
            <span className="font-bold text-slate-700">
              {filteredBrands.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * pageSize, filteredBrands.length)}
            </span>{' '}
            of <span className="font-bold text-slate-700">{filteredBrands.length}</span> entries
          </p>

          <div className="inline-flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg shadow-2xs">
              {currentPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
            <PageJump page={currentPage} totalPages={totalPages} onGo={setCurrentPage} />
          </div>
        </div>
      </section>
    </div>
  );
}
