import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  UserPlus,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Upload,
  User,
  Phone,
  Share2,
  Users,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

export default function AssignLeads() {
  const navigate = useNavigate();
  const location = useLocation();

  // Telecallers State
  const [telecallers, setTelecallers] = useState([]);
  const [isLoadingTelecallers, setIsLoadingTelecallers] = useState(true);

  // Form State for "LEAD DETAILS"
  const getCurrentDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [leadForm, setLeadForm] = useState({
    name: '',
    mobile: '',
    source: '',
    assigned_id: '',
    role: '',
    chat_date_time: getCurrentDateTimeString(),
    remarks: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import State
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Notification Toast State
  const [notice, setNotice] = useState(null);
  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4500);
  };

  // Recent Social Leads List
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [recentSearch, setRecentSearch] = useState('');

  // 1. Fetch Telecallers on Mount
  useEffect(() => {
    const fetchTelecallers = async () => {
      setIsLoadingTelecallers(true);
      try {
        // Try telecallers list from TeleHeadController
        let res = await api.get('/admin/teleadmin/telecallers-list').catch(() => null);
        if (!res || !res.data?.data) {
          res = await api.get('/telehead/match-making-telecallers').catch(() => null);
        }
        if (!res || !res.data?.data) {
          res = await api.get('/telehead/all_telecallers_list').catch(() => null);
        }

        if (res?.data?.data && Array.isArray(res.data.data)) {
          const uniqueMap = new Map();
          res.data.data.forEach(tc => {
            const rawName = (tc.name || tc.caller_name || `Agent ${tc.id || tc.caller_id}`).trim();
            const key = rawName.toLowerCase();
            if (key && !uniqueMap.has(key)) {
              const total = Number(tc.leads_count ?? tc.total_assigned ?? 0);
              const uncalled = Number(tc.uncalled_leads ?? tc.uncalled_leads_count ?? 0);
              uniqueMap.set(key, {
                id: tc.id || tc.caller_id,
                name: rawName,
                leads_count: total,
                uncalled_leads: uncalled,
                display_label: tc.display_label || `${rawName} (${total.toLocaleString()} leads)`
              });
            }
          });
          const list = Array.from(uniqueMap.values());
          setTelecallers(list);
          if (list.length > 0 && !leadForm.assigned_id) {
            // Default to Chandarbhan if exists, else first
            const defaultAgent = list.find(a => a.name.toLowerCase().includes('chandarbhan')) || list[0];
            setLeadForm(prev => ({ ...prev, assigned_id: defaultAgent.id }));
          }
        } else {
          // Fallback to active telechamp directory with current lead counts
          setTelecallers([
            { id: 38, name: 'Chandarbhan', leads_count: 2220, display_label: 'Chandarbhan (2,220 leads)' },
            { id: 8, name: 'Sonam', leads_count: 22386, display_label: 'Sonam (22,386 leads)' },
            { id: 9, name: 'Raksha', leads_count: 1204, display_label: 'Raksha (1,204 leads)' },
            { id: 10, name: 'Ankit Singh', leads_count: 9358, display_label: 'Ankit Singh (9,358 leads)' },
            { id: 39, name: 'Angad', leads_count: 1751, display_label: 'Angad (1,751 leads)' },
            { id: 49, name: 'Aayushi Verma', leads_count: 1370, display_label: 'Aayushi Verma (1,370 leads)' },
            { id: 47, name: 'Aditya kumar', leads_count: 4738, display_label: 'Aditya kumar (4,738 leads)' },
            { id: 50, name: 'Kamini', leads_count: 4796, display_label: 'Kamini (4,796 leads)' },
            { id: 53, name: 'Pragya Singh', leads_count: 1143, display_label: 'Pragya Singh (1,143 leads)' },
            { id: 35, name: 'Pratima', leads_count: 9060, display_label: 'Pratima (9,060 leads)' },
            { id: 36, name: 'Suraj Singh', leads_count: 4380, display_label: 'Suraj Singh (4,380 leads)' }
          ]);
          setLeadForm(prev => ({ ...prev, assigned_id: 38 }));
        }
      } catch (err) {
        console.error('Failed to load telecallers:', err);
      } finally {
        setIsLoadingTelecallers(false);
      }
    };

    fetchTelecallers();
  }, []);

  // 2. Fetch Recent Leads
  const fetchRecentLeads = async () => {
    setIsLoadingRecent(true);
    try {
      const res = await api.get('/admin/teleadmin/social-leads-list', {
        params: {
          search: recentSearch.trim() || undefined,
          per_page: 15
        }
      }).catch(() => api.get('/social-leads-list', {
        params: {
          search: recentSearch.trim() || undefined,
          per_page: 15
        }
      }));

      if (res?.data?.data?.data) {
        setRecentLeads(res.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching recent social leads:', err);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentLeads();
  }, [recentSearch]);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit Lead Details
  const handleSubmitLead = async (e) => {
    e.preventDefault();

    if (!leadForm.mobile.trim()) {
      showNotice('Mobile number is required', 'error');
      return;
    }

    if (!leadForm.source) {
      showNotice('Please select a Lead Source', 'error');
      return;
    }

    if (!leadForm.assigned_id) {
      showNotice('Please assign a Tele Champ agent', 'error');
      return;
    }

    if (!leadForm.role) {
      showNotice('Please select a user Role', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Format chat_date_time properly
      let formattedDateTime = leadForm.chat_date_time;
      if (formattedDateTime && formattedDateTime.includes('T')) {
        formattedDateTime = formattedDateTime.replace('T', ' ') + ':00';
      }

      const payload = {
        name: leadForm.name.trim() || null,
        mobile: leadForm.mobile.trim(),
        source: leadForm.source,
        assigned_id: parseInt(leadForm.assigned_id, 10),
        role: leadForm.role.toLowerCase(),
        chat_date_time: formattedDateTime,
        remarks: leadForm.remarks.trim() || null
      };

      // Call store route
      let res = await api.post('/admin/teleadmin/social-leads/store', payload).catch(() => null);
      if (!res || !res.data) {
        res = await api.post('/social-leads/store', payload);
      }

      if (res.data?.status) {
        showNotice(res.data.message || 'Lead added and assigned successfully!', 'success');
        // Reset form
        setLeadForm({
          name: '',
          mobile: '',
          source: '',
          assigned_id: telecallers[0]?.id || 38,
          role: '',
          chat_date_time: getCurrentDateTimeString(),
          remarks: ''
        });
        fetchRecentLeads();
      } else {
        showNotice(res.data?.message || 'Validation error while saving lead', 'error');
      }
    } catch (err) {
      console.error('Error storing lead:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to submit lead';
      showNotice(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Sample Excel
  const handleDownloadSampleExcel = () => {
    const csvContent =
      "name,mobile,source,assigned_id,role,chat_date_time,remarks\n" +
      "Ramesh Yadav,9876543210,WhatsApp,38,driver,2026-10-15 09:17:00,Interested in 18-wheeler trailer job\n" +
      "Vijay Transport,9123456780,Facebook,8,transporter,2026-10-15 10:30:00,Looking for container drivers\n" +
      "Manoj Meena,9898989898,TollFree,9,foreman,2026-10-15 11:45:00,Logistics hub dispatch enquiry";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_social_leads_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Sample Excel/CSV template downloaded successfully!');
  };

  // Handle Excel File Import
  const handleImportExcel = async (e) => {
    e.preventDefault();

    if (!excelFile) {
      showNotice('Please select an Excel or CSV file first', 'error');
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('excel_file', excelFile);

      let res = await api.post('/admin/teleadmin/social-leads/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).catch(() => null);

      if (!res || !res.data) {
        res = await api.post('/social-leads/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (res.data?.status) {
        showNotice(res.data.message || 'Bulk leads imported successfully!', 'success');
        setExcelFile(null);
        // Reset file input element
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) fileInput.value = '';
        fetchRecentLeads();
      } else {
        showNotice(res.data?.message || 'Failed to import Excel file', 'error');
      }
    } catch (err) {
      console.error('Import error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to import leads from Excel';
      showNotice(errMsg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {notice && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-4 transition-all ${
            notice.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {notice.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* BEGIN: Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/teleadmin/outbound-leads')}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Add New Lead
            </h1>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center space-x-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 pl-11">
            <span>DASHBOARD</span>
            <span className="text-slate-300">/</span>
            <span className="text-indigo-600 font-bold">OUTBOUND LEADS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-bold">ADD NEW</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/teleadmin/outbound-leads')}
            className="px-3.5 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
          >
            View Outbound Leads
          </button>
        </div>
      </section>

      {/* BEGIN: Two Columns Layout (Bulk Import Leads & Lead Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT CARD: BULK IMPORT LEADS (approx 4 cols / ~35%) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              BULK IMPORT LEADS
            </h2>
          </div>

          <div className="p-5 space-y-5">
            {/* Download Sample Excel */}
            <div>
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-sky-300 bg-sky-50/60 hover:bg-sky-100/70 text-sky-700 text-xs font-semibold transition active:scale-98 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Download Sample Excel</span>
              </button>
            </div>

            {/* Choose Excel File Form */}
            <form onSubmit={handleImportExcel} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  CHOOSE EXCEL FILE
                </label>
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50/60 focus-within:bg-white focus-within:border-indigo-500 transition">
                  <input
                    id="excelFileInput"
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setExcelFile(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  />
                </div>
                {excelFile && (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" /> Selected: {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Import Excel Button */}
              <button
                type="submit"
                disabled={isImporting || !excelFile}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Importing Leads...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Excel</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Supported formats: <strong className="text-slate-600">.xlsx, .xls, .csv</strong>. Columns must match sample layout: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">mobile, name, source, role, assigned_id</code>.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT CARD: LEAD DETAILS (approx 7 cols / ~65%) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              LEAD DETAILS
            </h2>
          </div>

          <form onSubmit={handleSubmitLead} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field: NAME */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>NAME</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Lead Name"
                  value={leadForm.name}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Field: MOBILE * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>MOBILE <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  name="mobile"
                  placeholder="Enter Mobile Number"
                  value={leadForm.mobile}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-mono"
                />
              </div>

              {/* Field: SOURCE * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>SOURCE <span className="text-rose-500">*</span></span>
                </label>
                <select
                  required
                  name="source"
                  value={leadForm.source}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                >
                  <option value="">Select Source</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TollFree">TollFree</option>
                  <option value="OBD">OBD</option>
                  <option value="Website">Website</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Field: ASSIGN LEAD (TELE CHAMPS) * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>ASSIGN LEAD (TELE CHAMPS) <span className="text-rose-500">*</span></span>
                </label>
                <select
                  required
                  name="assigned_id"
                  value={leadForm.assigned_id}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                >
                  <option value="">Select Tele Champ</option>
                  {telecallers.map(tc => (
                    <option key={tc.id} value={tc.id}>
                      {tc.display_label || `${tc.name} (${Number(tc.leads_count || 0).toLocaleString()} leads)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: ROLE * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>ROLE <span className="text-rose-500">*</span></span>
                </label>
                <select
                  required
                  name="role"
                  value={leadForm.role}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                >
                  <option value="">Select Role</option>
                  <option value="driver">Driver</option>
                  <option value="transporter">Transporter</option>
                  <option value="foreman">Foreman</option>
                  <option value="association">Association</option>
                  <option value="dhaba">Dhaba</option>
                  <option value="puncture">Puncture</option>
                </select>
              </div>

              {/* Field: CHAT DATE & TIME * */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>CHAT DATE & TIME <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  required
                  name="chat_date_time"
                  value={leadForm.chat_date_time}
                  onChange={handleChange}
                  className="w-full text-xs rounded-lg border border-slate-200 py-2.5 px-3.5 bg-slate-50/50 focus:bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Field: REMARKS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>REMARKS</span>
              </label>
              <textarea
                rows={3}
                name="remarks"
                placeholder="Enter lead remarks or description..."
                value={leadForm.remarks}
                onChange={handleChange}
                className="w-full text-xs rounded-lg border border-slate-200 p-3 bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              ></textarea>
            </div>

            {/* Actions: Cancel & Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setLeadForm({
                    name: '',
                    mobile: '',
                    source: '',
                    assigned_id: telecallers[0]?.id || 38,
                    role: '',
                    chat_date_time: getCurrentDateTimeString(),
                    remarks: ''
                  });
                }}
                className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: RECENTLY SUBMITTED & ASSIGNED LEADS */}
      {/* ======================================================== */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RECENTLY ASSIGNED SOCIAL LEADS
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              LIVE REGISTRY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads by name, mobile..."
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 w-64 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            <button
              onClick={fetchRecentLeads}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Refresh Registry"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecent ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">LEAD NAME & MOBILE</th>
                <th className="py-3 px-3 text-center">SOURCE</th>
                <th className="py-3 px-4">ASSIGNED TELE CHAMP</th>
                <th className="py-3 px-3 text-center">CALL STATUS</th>
                <th className="py-3 px-3 text-center">REGISTRATION</th>
                <th className="py-3 px-4 text-left">CHAT DATE & TIME</th>
                <th className="py-3 px-4">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoadingRecent ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading recent social leads...</span>
                    </div>
                  </td>
                </tr>
              ) : recentLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 font-medium">
                    No recently assigned leads found in current filter.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead, idx) => (
                  <tr key={lead.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{lead.name || 'Anonymous Lead'}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{lead.mobile}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {lead.source || 'Social Media'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{lead.telecaller_name || 'Assigned Agent'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        lead.final_status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : lead.final_status === 'callback_later'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {lead.final_status || 'not_called'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                        lead.registration_status === 'registered'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {lead.registration_status || 'unregistered'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate" title={lead.social_remarks || '-'}>
                      {lead.social_remarks || <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
