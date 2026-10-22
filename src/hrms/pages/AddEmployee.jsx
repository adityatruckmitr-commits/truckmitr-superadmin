import { useState, useRef } from 'react'
import { useNavigate, Link } from '@hrms/router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Upload,
  Trash2,
  Check,
  User,
  Briefcase,
  FileText,
  X,
  Plus
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useCreateEmployee, useDepartments, useEmployees } from '../hooks/useEmployees'

const AddEmployee = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const createEmployee = useCreateEmployee()

  const { data: departments = [] } = useDepartments()
  const { data: employeesData = [] } = useEmployees({ status: 'active' })
  const employees = employeesData?.data || employeesData || []

  // Form State initialized with realistic placeholder defaults
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@techcorp.com',
    mobile: '+91 98765 43210',
    dob: '1995-06-15',
    gender: 'Male',
    maritalStatus: 'Single',
    bloodGroup: 'O+',
    nationality: 'Indian',
    languages: ['English', 'Hindi'],
    newLanguage: '',
    address: 'B-12, Sector 62, Noida, Uttar Pradesh, India',
    password: 'Password@123',

    // Photo
    photoPreview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    photoFile: null,

    // Job Info
    employeeId: 'EMP0121',
    department: 'IT',
    designation: 'Software Developer',
    doj: '2024-05-20',
    employmentType: 'Full Time',
    reportingManager: 'Amit Kumar (DevOps Engineer)',

    // Additional Info
    pfNumber: 'PF7845125896',
    esiNumber: 'ESI45879632',
    uanNumber: '100001234567',
    panNumber: 'ABCDE1234F',
  })

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Language Tags handling
  const handleAddLanguage = () => {
    if (formData.newLanguage.trim() && !formData.languages.includes(formData.newLanguage.trim())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, prev.newLanguage.trim()],
        newLanguage: '',
      }))
    }
  }

  const handleRemoveLanguage = (langToRemove) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== langToRemove),
    }))
  }

  // Profile Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photoPreview: reader.result,
          photoFile: file,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoPreview: null,
      photoFile: null,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const full_name = `${formData.firstName} ${formData.lastName}`.trim()
    if (!full_name || !formData.email || !formData.mobile) {
      toast.error('Please fill in all required fields (Name, Email, Mobile).')
      return
    }

    const toastId = toast.loading('Creating new employee...')
    try {
      const payload = {
        full_name: full_name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password || 'Password@123',
        department: formData.department,
        designation: formData.designation,
        doj: formData.doj,
        employment_type: formData.employmentType,
        gender: formData.gender,
        dob: formData.dob,
        current_address: formData.address,
        pan: formData.panNumber,
        employee_id: formData.employeeId,
      }

      await createEmployee.mutateAsync(payload)
      toast.success('Employee created successfully! 🎉', { id: toastId })
      navigate('/employees')
    } catch (err) {
      console.error('Failed to create employee:', err)
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to create employee'
      toast.error(errorMsg, { id: toastId })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span>&gt;</span>
            <Link to="/employees" className="hover:text-blue-600 transition-colors">
              Employee
            </Link>
            <span>&gt;</span>
            <span className="font-semibold text-blue-600">Add New Employee</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
        </div>

        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
      </div>

      {/* Form Content Area: 2 Columns (Left forms, Right upload card) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Left Content (3 Columns wide) */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul.sharma@techcorp.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="e.g. Indian"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password@123"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Languages Spoken */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Languages Spoken</label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {formData.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="text-blue-500 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="newLanguage"
                  value={formData.newLanguage}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                  placeholder="Type a language & press Add"
                  className="flex-1 px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-3.5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Address</label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full postal address..."
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </motion.div>

          {/* SECTION 2: Job Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Job Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP0121"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g. Software Developer"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date of Joining */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date of Joining</label>
                <div className="relative">
                  <input
                    type="date"
                    name="doj"
                    value={formData.doj}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reporting Manager</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleChange}
                  placeholder="e.g. Amit Kumar"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* SECTION 3: Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-6"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Additional Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PF Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">PF Number</label>
                <input
                  type="text"
                  name="pfNumber"
                  value={formData.pfNumber}
                  onChange={handleChange}
                  placeholder="PF7845125896"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* ESI Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">ESI Number</label>
                <input
                  type="text"
                  name="esiNumber"
                  value={formData.esiNumber}
                  onChange={handleChange}
                  placeholder="ESI45879632"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* UAN Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">UAN Number</label>
                <input
                  type="text"
                  name="uanNumber"
                  value={formData.uanNumber}
                  onChange={handleChange}
                  placeholder="100001234567"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Profile Photo Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 sticky top-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              Profile Photo
            </h2>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Drop Zone Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-blue-500 bg-gray-50/50 rounded-xl p-6 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Upload Photo</p>
                <p className="text-xs text-gray-400">JPG, PNG or JPEG</p>
                <p className="text-xs text-gray-400">Max size 2MB</p>
              </div>
            </div>

            {/* Avatar Preview */}
            {formData.photoPreview && (
              <div className="flex flex-col items-center pt-2 space-y-2">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-xs border border-gray-200">
                  <img
                    src={formData.photoPreview}
                    alt="Employee Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Bar (Spans full width) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" /> Save Employee
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddEmployee
