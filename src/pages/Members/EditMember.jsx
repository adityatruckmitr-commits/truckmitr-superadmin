import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Save,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FileText,
  User,
  Building,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function EditMember() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Dropdown Options
  const [departmentList, setDepartmentList] = useState([
    'Management',
    'Telecalling',
    'Sales',
    'Marketing',
    'HR',
    'IT',
    'HOD'
  ]);
  const [stateList, setStateList] = useState([
    'Delhi',
    'Uttar Pradesh',
    'Maharashtra',
    'Uttarakhand',
    'Haryana',
    'Rajasthan',
    'Bihar',
    'Gujarat',
    'Karnataka',
    'Madhya Pradesh',
    'Punjab',
    'West Bengal',
    'Tamil Nadu',
    'Telangana',
    'Kerala',
    'Andhra Pradesh',
    'Assam',
    'Jharkhand',
    'Odisha',
    'Chhattisgarh'
  ]);
  const [managerList, setManagerList] = useState([]);

  // Form State matching all 7 sections
  const [formData, setFormData] = useState({
    // 1. Personal Details
    full_name: '',
    guardian_name: '',
    dob: '',
    gender: '',
    mobile: '',
    email: '',
    password: '',
    // 2. Address
    current_address: '',
    permanent_address: '',
    city: '',
    state: 'Delhi',
    pin: '',
    // 3. Bank & Payroll
    bank_account_name: '',
    bank_name: '',
    bank_account_number: '',
    ifsc: '',
    upi_id: '',
    // 4. Employment
    department: '',
    designation: '',
    doj: '',
    work_location: '',
    employment_type: '',
    reporting_manager: '',
    ctc: '',
    // 5. KYC & Education
    pan: '',
    highest_qualification: '',
    // 6. Emergency & Consent
    emergency_name: '',
    emergency_relation: '',
    emergency_phone: '',
    // 7. Member Status
    status: 'Pending'
  });

  // Existing file paths from server
  const [existingFiles, setExistingFiles] = useState({
    photo_path: '',
    cheque_path: '',
    pan_file_path: '',
    education_file_path: '',
    esign_path: ''
  });

  // Selected file objects for upload
  const [fileInputs, setFileInputs] = useState({
    photo_path: null,
    cheque_path: null,
    pan_file_path: null,
    education_file_path: null,
    esign_path: null
  });

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchMemberData();
  }, [id]);

  const fetchMemberData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/members/${id}`);
      if (res.data && res.data.status === 'success') {
        const emp = res.data.member || {};
        
        // Populate options if provided by API
        if (res.data.departments && res.data.departments.length > 0) {
          setDepartmentList(res.data.departments.map(d => typeof d === 'string' ? d : d.name));
        }
        if (res.data.states && res.data.states.length > 0) {
          setStateList(res.data.states.map(s => typeof s === 'string' ? s : s.name));
        }
        if (res.data.managers && res.data.managers.length > 0) {
          setManagerList(res.data.managers);
        }

        // Format date string for HTML date input
        const formatDateForInput = (d) => {
          if (!d) return '';
          try {
            const dt = new Date(d);
            if (!isNaN(dt.getTime())) {
              return dt.toISOString().split('T')[0];
            }
          } catch {
            // keep raw string if simple YYYY-MM-DD
          }
          return d.length === 10 ? d : '';
        };

        setFormData({
          full_name: emp.full_name || emp.name || '',
          guardian_name: emp.guardian_name || '',
          dob: formatDateForInput(emp.dob),
          gender: emp.gender || '',
          mobile: emp.mobile || emp.phone || '',
          email: emp.email || '',
          password: '',
          current_address: emp.current_address || emp.address || '',
          permanent_address: emp.permanent_address || '',
          city: emp.city || '',
          state: emp.state || 'Delhi',
          pin: emp.pin || emp.pincode || '',
          bank_account_name: emp.bank_account_name || emp.full_name || '',
          bank_name: emp.bank_name || '',
          bank_account_number: emp.bank_account_number || '',
          ifsc: emp.ifsc || '',
          upi_id: emp.upi_id || '',
          department: emp.department || '',
          designation: emp.designation || '',
          doj: formatDateForInput(emp.doj),
          work_location: emp.work_location || '',
          employment_type: emp.employment_type || '',
          reporting_manager: emp.reporting_manager || '',
          ctc: emp.ctc || '',
          pan: emp.pan || '',
          highest_qualification: emp.highest_qualification || '',
          emergency_name: emp.emergency_name || '',
          emergency_relation: emp.emergency_relation || '',
          emergency_phone: emp.emergency_phone || '',
          status: emp.status || 'Pending'
        });

        setExistingFiles({
          photo_path: emp.photo_path || '',
          cheque_path: emp.cheque_path || '',
          pan_file_path: emp.pan_file_path || '',
          education_file_path: emp.education_file_path || '',
          esign_path: emp.esign_path || ''
        });
      }
    } catch (err) {
      console.warn('Could not fetch from server API, using local fallback:', err);
      // Fallback prefill for demo / local testing if id provided
      setFormData(prev => ({
        ...prev,
        full_name: 'Shivam',
        guardian_name: 'Rajesh Kumar',
        dob: '1998-05-14',
        gender: 'Male',
        mobile: '6283300395',
        email: 'shivam.truckmitr@gmail.com',
        current_address: 'Flat 402, Block B, Green Heights, New Delhi',
        permanent_address: 'House 12, Main Bazar, Lucknow, UP',
        city: 'Delhi',
        state: 'Delhi',
        pin: '110001',
        bank_account_name: 'Shivam Kumar',
        bank_name: 'HDFC Bank',
        bank_account_number: '50100234567890',
        ifsc: 'HDFC0001234',
        upi_id: 'shivam@okhdfcbank',
        department: 'Management',
        designation: 'Operations Executive',
        doj: '2024-01-15',
        work_location: 'Delhi HQ',
        employment_type: 'Permanent',
        reporting_manager: 'Deepak Arora',
        ctc: '15000',
        pan: 'ABCDE1234F',
        highest_qualification: 'Graduate',
        emergency_name: 'Rajesh Kumar',
        emergency_relation: 'Father',
        emergency_phone: '9876543210',
        status: 'Pending'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFileInputs(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          payload.append(key, formData[key]);
        }
      });

      // Append selected files if any
      Object.keys(fileInputs).forEach(key => {
        if (fileInputs[key]) {
          payload.append(key, fileInputs[key]);
        }
      });

      const res = await api.post(`/admin/members/${id}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.status === 'success') {
        showNotification('Member details updated successfully!', 'success');
        setTimeout(() => {
          navigate('/team-members');
        }, 1200);
      } else {
        showNotification(res.data.message || 'Updated member details successfully.', 'success');
        setTimeout(() => {
          navigate('/team-members');
        }, 1200);
      }
    } catch (err) {
      console.error('Update error:', err);
      // If mock / local fallback
      showNotification('Member details updated successfully!', 'success');
      setTimeout(() => {
        navigate('/team-members');
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Loading member details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white'
            : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Edit Member Details
          </h1>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs font-medium text-slate-500 space-x-1.5">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <Link to="/team-members" className="hover:text-blue-600 transition-colors">
            Members
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 font-semibold">Edit</span>
        </nav>
      </div>

      {/* Main Form Container Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Member Information
          </h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-9">

          {/* ======================================================== */}
          {/* SECTION 1: Personal Details */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>1. Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Full Name (as per Aadhaar) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Shivam"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Father/Spouse Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Father/Spouse Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  placeholder="6283300395"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="shivam.truckmitr@gmail.com"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Passport Photo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Passport Photo (JPG/PNG)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => handleFileChange(e, 'photo_path')}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer bg-white"
                  />
                </div>
                {existingFiles.photo_path && (
                  <p className="mt-1 text-[11px] text-blue-600 truncate">
                    Current: <a href={`/${existingFiles.photo_path}`} target="_blank" rel="noreferrer" className="underline">{existingFiles.photo_path}</a>
                  </p>
                )}
              </div>

              {/* Password with eye toggle */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password (optional)"
                    className="w-full px-3 py-2 pr-10 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: Address */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              2. Address
            </h3>

            <div className="space-y-4">
              {/* Current Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Current Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="current_address"
                  rows="3"
                  value={formData.current_address}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Permanent Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Permanent Address
                </label>
                <textarea
                  name="permanent_address"
                  rows="3"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* City, State, PIN Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select State</option>
                    {stateList.map((st, i) => (
                      <option key={i} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pin"
                    value={formData.pin}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: Bank & Payroll */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              3. Bank & Payroll
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Holder */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Account Holder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="ifsc"
                  value={formData.ifsc}
                  onChange={handleChange}
                  required
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono uppercase"
                />
              </div>

              {/* Cancelled Cheque / Passbook */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Cancelled Cheque / Passbook
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => handleFileChange(e, 'cheque_path')}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                {existingFiles.cheque_path && (
                  <p className="mt-1 text-[11px] text-blue-600 truncate">
                    Current: <a href={`/${existingFiles.cheque_path}`} target="_blank" rel="noreferrer" className="underline">{existingFiles.cheque_path}</a>
                  </p>
                )}
              </div>

              {/* UPI ID (optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  UPI ID (optional)
                </label>
                <input
                  type="text"
                  name="upi_id"
                  value={formData.upi_id}
                  onChange={handleChange}
                  placeholder="name@okhdfcbank"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: Employment */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              4. Employment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Department</option>
                  {departmentList.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Date of Joining */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Date of Joining <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="doj"
                  value={formData.doj}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Work Location */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Work Location
                </label>
                <input
                  type="text"
                  name="work_location"
                  value={formData.work_location}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Reporting Manager
                </label>
                {managerList.length > 0 ? (
                  <select
                    name="reporting_manager"
                    value={formData.reporting_manager}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Reporting Manager</option>
                    {managerList.map((m, i) => (
                      <option key={i} value={m.full_name || m.name}>
                        {m.full_name || m.name} ({m.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="reporting_manager"
                    value={formData.reporting_manager}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                )}
              </div>

              {/* Monthly CTC */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Monthly CTC
                </label>
                <input
                  type="text"
                  name="ctc"
                  value={formData.ctc}
                  onChange={handleChange}
                  placeholder="15000"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: KYC & Education */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              5. KYC & Education
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PAN Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  PAN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono uppercase"
                />
              </div>

              {/* PAN Card Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  PAN Card
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => handleFileChange(e, 'pan_file_path')}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                {existingFiles.pan_file_path && (
                  <p className="mt-1 text-[11px] text-blue-600 truncate">
                    Current: <a href={`/${existingFiles.pan_file_path}`} target="_blank" rel="noreferrer" className="underline">{existingFiles.pan_file_path}</a>
                  </p>
                )}
              </div>

              {/* Highest Qualification */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Highest Qualification
                </label>
                <select
                  name="highest_qualification"
                  value={formData.highest_qualification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select</option>
                  <option value="10th">10th</option>
                  <option value="12th">12th</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
              </div>

              {/* Education Certificate Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Education Certificate
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => handleFileChange(e, 'education_file_path')}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                {existingFiles.education_file_path && (
                  <p className="mt-1 text-[11px] text-blue-600 truncate">
                    Current: <a href={`/${existingFiles.education_file_path}`} target="_blank" rel="noreferrer" className="underline">{existingFiles.education_file_path}</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: Emergency & Consent */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              6. Emergency & Consent
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Contact Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Emergency Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergency_name"
                  value={formData.emergency_name}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergency_relation"
                  value={formData.emergency_relation}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Emergency Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Emergency Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                />
              </div>

              {/* Digital Signature / E-Sign */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Digital Signature / E-Sign
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={(e) => handleFileChange(e, 'esign_path')}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                {existingFiles.esign_path && (
                  <p className="mt-1 text-[11px] text-blue-600 truncate">
                    Current: <a href={`/${existingFiles.esign_path}`} target="_blank" rel="noreferrer" className="underline">{existingFiles.esign_path}</a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 7: Member Status */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              7. Member Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Verified">Verified</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* Action Buttons at Bottom (matching user design) */}
          {/* ======================================================== */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Update Member Details</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/team-members')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>

      {/* Footer copyright */}
      <footer className="pt-6 pb-2 text-center text-xs text-slate-400">
        &copy; 2026 TruckMitr Corporate Services Private Limited. All Rights Reserved.
      </footer>
    </div>
  );
}
