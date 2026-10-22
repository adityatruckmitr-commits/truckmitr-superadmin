import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sliders,
  Building2,
  LayoutGrid,
  ShieldCheck,
  Bell,
  Link,
  Lock,
  Save,
  Upload,
  Calendar,
  Clock,
  Check,
  CheckCircle2,
  Sparkles,
  Monitor,
  UserCheck,
  Mail,
  Smartphone,
  Globe,
  DollarSign
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useAppSettings, useUpdateAppSettings } from '../hooks/useAppSettings'

export default function Settings() {
  const { user } = useAuth()
  const { data: savedSettings } = useAppSettings()
  const updateSettings = useUpdateAppSettings()

  const [activeTab, setActiveTab] = useState('General')

  // Form State - all seeded blank/neutral; populated from the real saved
  // settings once loaded (see useEffect below), never from fake sample data.
  const [companyDetails, setCompanyDetails] = useState({ name: '', email: '', phone: '', website: '', logo: null })
  const [preferences, setPreferences] = useState({
    dateFormat: 'DD MMM YYYY (31 May 2024)',
    timeFormat: '12 Hour (hh:mm AM/PM)',
    currency: 'INR (₹) - Indian Rupee',
    language: 'English',
    empPrefix: 'EMP',
    fiscalYear: 'April'
  })
  const [systemPrefs, setSystemPrefs] = useState({
    selfService: true,
    geolocation: true,
    autoLogout: '30 Minutes',
    emailNotifs: true,
    docDownload: true,
    auditLogs: true
  })
  const [leaveSettings, setLeaveSettings] = useState({
    maxBalance: 30,
    approvalLevel: '2 Levels',
    encashmentAllowed: true,
    encashmentPct: 50
  })
  const [workingSettings, setWorkingSettings] = useState({
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    breakStart: '01:00 PM',
    breakEnd: '02:00 PM',
    weeklyOff: 'Saturday, Sunday'
  })
  const [defaultSettings, setDefaultSettings] = useState({
    leaveType: 'Casual Leave',
    attendancePolicy: 'Standard Policy',
    payrollTemplate: 'Monthly Payroll',
    performanceCycle: 'Annual Review',
    trainingCategory: 'General'
  })

  // Populate the form once the real, persisted settings arrive from the API
  useEffect(() => {
    if (!savedSettings) return
    if (savedSettings.company_details) setCompanyDetails((prev) => ({ ...prev, ...savedSettings.company_details }))
    if (savedSettings.preferences) setPreferences(savedSettings.preferences)
    if (savedSettings.system_prefs) setSystemPrefs(savedSettings.system_prefs)
    if (savedSettings.leave_settings) setLeaveSettings(savedSettings.leave_settings)
    if (savedSettings.working_settings) setWorkingSettings(savedSettings.working_settings)
    if (savedSettings.default_settings) setDefaultSettings(savedSettings.default_settings)
  }, [savedSettings])

  const toggleDay = (day) => {
    if (workingSettings.days.includes(day)) {
      setWorkingSettings({
        ...workingSettings,
        days: workingSettings.days.filter((d) => d !== day)
      })
    } else {
      setWorkingSettings({
        ...workingSettings,
        days: [...workingSettings.days, day]
      })
    }
  }

  const handleSave = () => {
    updateSettings.mutate(
      {
        company_details: companyDetails,
        preferences,
        system_prefs: systemPrefs,
        leave_settings: leaveSettings,
        working_settings: workingSettings,
        default_settings: defaultSettings,
        updated_by: user?.emp_id,
      },
      {
        onSuccess: () => toast.success('Settings updated successfully!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update settings'),
      }
    )
  }

  const tabs = [
    { id: 'General', label: 'General', icon: Sliders },
    { id: 'Company', label: 'Company', icon: Building2 },
    { id: 'Modules', label: 'Modules', icon: LayoutGrid },
    { id: 'Roles & Permissions', label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Integrations', label: 'Integrations', icon: Link },
    { id: 'Security', label: 'Security', icon: Lock }
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Top Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-semibold">Settings</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-2xs hover:shadow-md transition-all active:scale-[0.98] w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs Navigation Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 overflow-x-auto shadow-2xs">
        <div className="flex items-center gap-1 min-w-max text-xs font-semibold">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'General' && (
        <div className="space-y-6">
          {/* Row 1: Company Details + General Preferences + System Preferences */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Card 1: Company Details (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Company Details</h3>
              </div>

              <div className="space-y-3.5 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyDetails.name}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={companyDetails.email}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={companyDetails.phone}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={companyDetails.website}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Company Logo</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <p className="text-[11px] font-semibold text-gray-700">Click to upload logo</p>
                    <p className="text-[9px] text-gray-400 font-medium">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: General Preferences (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-900">General Preferences</h3>
              </div>

              <div className="space-y-3.5 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="DD MMM YYYY (31 May 2024)">DD MMM YYYY (31 May 2024)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Time Format</label>
                  <select
                    value={preferences.timeFormat}
                    onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="12 Hour (hh:mm AM/PM)">12 Hour (hh:mm AM/PM)</option>
                    <option value="24 Hour (hh:mm)">24 Hour (hh:mm)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                    <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                    <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Employee ID Prefix</label>
                  <input
                    type="text"
                    value={preferences.empPrefix}
                    onChange={(e) => setPreferences({ ...preferences, empPrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Fiscal Year Start</label>
                  <select
                    value={preferences.fiscalYear}
                    onChange={(e) => setPreferences({ ...preferences, fiscalYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="April">April</option>
                    <option value="January">January</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 3: System Preferences (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Monitor className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">System Preferences</h3>
              </div>

              <div className="space-y-4 text-xs flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Enable Employee Self Service</p>
                    <p className="text-[10px] text-gray-400">Allow employees to access their information</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemPrefs({ ...systemPrefs, selfService: !systemPrefs.selfService })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      systemPrefs.selfService ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Enable Geolocation for Attendance</p>
                    <p className="text-[10px] text-gray-400">Track attendance with location</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemPrefs({ ...systemPrefs, geolocation: !systemPrefs.geolocation })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      systemPrefs.geolocation ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Auto Logout</p>
                    <p className="text-[10px] text-gray-400">Automatically logout after inactivity</p>
                  </div>
                  <select
                    value={systemPrefs.autoLogout}
                    onChange={(e) => setSystemPrefs({ ...systemPrefs, autoLogout: e.target.value })}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold bg-gray-50 focus:outline-hidden"
                  >
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="Never">Never</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Enable Email Notifications</p>
                    <p className="text-[10px] text-gray-400">Send email notifications to users</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemPrefs({ ...systemPrefs, emailNotifs: !systemPrefs.emailNotifs })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      systemPrefs.emailNotifs ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Allow Document Download</p>
                    <p className="text-[10px] text-gray-400">Allow users to download documents</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemPrefs({ ...systemPrefs, docDownload: !systemPrefs.docDownload })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      systemPrefs.docDownload ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">Maintain Audit Logs</p>
                    <p className="text-[10px] text-gray-400">Track all system activities</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemPrefs({ ...systemPrefs, auditLogs: !systemPrefs.auditLogs })}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      systemPrefs.auditLogs ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Leave Settings + Working Days & Hours + Default Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Card 4: Leave Settings (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Leave Settings</h3>
              </div>

              <div className="space-y-3.5 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Maximum Leave Balance</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leaveSettings.maxBalance}
                      onChange={(e) => setLeaveSettings({ ...leaveSettings, maxBalance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                    />
                    <span className="text-xs font-medium text-gray-500 shrink-0">days</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Maximum leave days an employee can accumulate</p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Leave Approval Level</label>
                  <select
                    value={leaveSettings.approvalLevel}
                    onChange={(e) => setLeaveSettings({ ...leaveSettings, approvalLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="2 Levels">2 Levels</option>
                    <option value="1 Level">1 Level</option>
                    <option value="3 Levels">3 Levels</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Number of levels required for leave approval</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-800">Encashment Allowed</p>
                      <p className="text-[10px] text-gray-400">Allow leave encashment</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLeaveSettings({ ...leaveSettings, encashmentAllowed: !leaveSettings.encashmentAllowed })}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        leaveSettings.encashmentAllowed ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Encashment Percentage</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={leaveSettings.encashmentPct}
                      onChange={(e) => setLeaveSettings({ ...leaveSettings, encashmentPct: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                    />
                    <span className="text-xs font-medium text-gray-500 shrink-0">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Percentage of leave encashment</p>
                </div>
              </div>
            </div>

            {/* Card 5: Working Days & Hours (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Working Days & Hours</h3>
              </div>

              <div className="space-y-3.5 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">Working Days</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isSelected = workingSettings.days.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Working Hours</label>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input
                      type="text"
                      value={workingSettings.startTime}
                      onChange={(e) => setWorkingSettings({ ...workingSettings, startTime: e.target.value })}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-center bg-gray-50/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="text"
                        value={workingSettings.endTime}
                        onChange={(e) => setWorkingSettings({ ...workingSettings, endTime: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-center bg-gray-50/50 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Break Duration</label>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input
                      type="text"
                      value={workingSettings.breakStart}
                      onChange={(e) => setWorkingSettings({ ...workingSettings, breakStart: e.target.value })}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-center bg-gray-50/50"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="text"
                        value={workingSettings.breakEnd}
                        onChange={(e) => setWorkingSettings({ ...workingSettings, breakEnd: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-center bg-gray-50/50 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Weekly Off</label>
                  <select
                    value={workingSettings.weeklyOff}
                    onChange={(e) => setWorkingSettings({ ...workingSettings, weeklyOff: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Saturday, Sunday">Saturday, Sunday</option>
                    <option value="Sunday Only">Sunday Only</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 6: Default Settings (Span 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Sliders className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-gray-900">Default Settings</h3>
              </div>

              <div className="space-y-3.5 text-xs flex-1">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Leave Type</label>
                  <select
                    value={defaultSettings.leaveType}
                    onChange={(e) => setDefaultSettings({ ...defaultSettings, leaveType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Attendance Policy</label>
                  <select
                    value={defaultSettings.attendancePolicy}
                    onChange={(e) => setDefaultSettings({ ...defaultSettings, attendancePolicy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Standard Policy">Standard Policy</option>
                    <option value="Flexible Hours">Flexible Hours</option>
                    <option value="Shift Based">Shift Based</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Payroll Template</label>
                  <select
                    value={defaultSettings.payrollTemplate}
                    onChange={(e) => setDefaultSettings({ ...defaultSettings, payrollTemplate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Monthly Payroll">Monthly Payroll</option>
                    <option value="Bi-Weekly Payroll">Bi-Weekly Payroll</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Performance Cycle</label>
                  <select
                    value={defaultSettings.performanceCycle}
                    onChange={(e) => setDefaultSettings({ ...defaultSettings, performanceCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="Annual Review">Annual Review</option>
                    <option value="Quarterly Review">Quarterly Review</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Default Training Category</label>
                  <select
                    value={defaultSettings.trainingCategory}
                    onChange={(e) => setDefaultSettings({ ...defaultSettings, trainingCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-blue-500 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Technical Skills">Technical Skills</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder content for other active tabs */}
      {activeTab !== 'General' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <Sparkles className="w-10 h-10 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">{activeTab} Settings</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Manage {activeTab.toLowerCase()} rules, policies, and configuration options.
          </p>
          <button
            onClick={() => setActiveTab('General')}
            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            Back to General Settings
          </button>
        </div>
      )}
    </div>
  )
}
