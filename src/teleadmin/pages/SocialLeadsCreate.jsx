import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@teleadmin/router';
import { toast } from 'react-hot-toast';
import {
  UserPlus, FileSpreadsheet, ArrowLeft, Download, Upload,
  User, Phone, Share2, Users, ClipboardList, Calendar, AlignLeft
} from 'lucide-react-teleadmin';
import leadsApi from '../services/api/leadsApi';

const SocialLeadsCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Single Lead Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    source: '',
    assigned_id: '',
    role: '',
    chat_date_time: new Date().toISOString().slice(0, 16),
    remarks: '',
  });

  // Bulk Import File State
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Telechamps (telecallers) for dropdown list
  const { data: telechampsResponse, isLoading: isTelechampsLoading } = useQuery({
    queryKey: ['all-telechamps'],
    queryFn: () => leadsApi.getTelechamps(),
    staleTime: Infinity,
  });

  const telecallers = telechampsResponse?.data?.filter(tc => tc.role === 'telecaller') || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  // Submit Single Lead Form
  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.mobile || !formData.source || !formData.assigned_id || !formData.role || !formData.chat_date_time) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Adding lead...');
    try {
      // Format chat_date_time to YYYY-MM-DD HH:mm for Laravel backend
      const formattedDateTime = formData.chat_date_time.replace('T', ' ');
      const payload = {
        ...formData,
        chat_date_time: formattedDateTime,
      };

      await leadsApi.createSocialLead(payload);
      toast.success('Social lead added and assigned successfully!', { id: toastId });
      queryClient.invalidateQueries(['social-leads-list']);
      queryClient.invalidateQueries(['social-leads-stats']);
      navigate('/social-media-leads');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to add lead.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Bulk Import
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      toast.error('Please select an Excel file to import.');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Importing bulk leads...');
    try {
      const data = new FormData();
      data.append('excel_file', excelFile);

      await leadsApi.importSocialLeads(data);
      toast.success('Bulk leads imported successfully!', { id: toastId });
      setExcelFile(null);
      // Reset input element
      document.getElementById('excel_file_input').value = '';
      queryClient.invalidateQueries(['social-leads-list']);
      queryClient.invalidateQueries(['social-leads-stats']);
      navigate('/social-media-leads');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to import excel file.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-3 md:px-4 md:py-3 space-y-4 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/social-media-leads"
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Add New Lead
            </h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 ml-9">
            Dashboard / Outbound Leads / Add New
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Bulk Import (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-sky-50/50 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bulk Import Leads
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <a
                  href="https://truckmitr.com/public/sample/social_media_leads_bulk_sample.xlsx"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-sky-200 hover:border-sky-300 bg-sky-50/20 hover:bg-sky-50 text-sky-700 rounded-lg text-xs font-bold transition-all"
                  download
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample Excel
                </a>
              </div>

              <form onSubmit={handleImportExcel} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Choose Excel File
                  </label>
                  <input
                    type="file"
                    id="excel_file_input"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-lg p-1"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isImporting || !excelFile}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all ${
                    (isImporting || !excelFile) ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isImporting ? 'Importing...' : 'Import Excel'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Lead Details Form (2 Columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-indigo-50/30 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lead Details
              </h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter Lead Name"
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter Mobile Number"
                      required
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all"
                    />
                  </div>

                  {/* Source */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-slate-400" />
                      Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      required
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all bg-white"
                    >
                      <option value="">Select Source</option>
                      {['Facebook', 'Instagram', 'WhatsApp', 'Google Ads', 'YouTube', 'LinkedIn', 'TollFree', 'Other'].map((src) => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assign Lead */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Assign Lead (Tele Champs) <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="assigned_id"
                      value={formData.assigned_id}
                      onChange={handleInputChange}
                      required
                      disabled={isTelechampsLoading}
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{isTelechampsLoading ? 'Loading Tele Champs...' : 'Select Tele Champ'}</option>
                      {telecallers.map((tc) => (
                        <option key={tc.caller_id} value={tc.caller_id}>{tc.caller_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <ClipboardList className="w-3 h-3 text-slate-400" />
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all bg-white"
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

                  {/* Chat Date & Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Chat Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="chat_date_time"
                      value={formData.chat_date_time}
                      onChange={handleInputChange}
                      required
                      className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <AlignLeft className="w-3 h-3 text-slate-400" />
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter lead remarks or description..."
                    className="w-full text-xs font-medium border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 outline-hidden transition-all"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate('/social-media-leads')}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex items-center justify-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all ${
                      isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLeadsCreate;
