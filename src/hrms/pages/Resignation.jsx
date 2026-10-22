import { useState, useMemo } from 'react'
import { useNavigate } from '@hrms/router'
import {
  FileText,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  DollarSign,
  HelpCircle,
  Plus,
  X,
  AlertCircle,
  History,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  XCircle,
  Check,
  User,
  Users,
  BadgeCheck,
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui'
import {
  useResignationRequests,
  useCreateResignation,
  useApproveResignation,
  useRejectResignation,
  useWithdrawResignation,
} from '../hooks/useResignation'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const statusLabel = (s) => ({ pending: 'Pending HR Review', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' }[s] || s)

export default function Resignation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userRole = user?.role || 'employee'
  const isHRorAdmin = ['hr', 'super_admin', 'admin'].includes(userRole)

  const [activeTab, setActiveTab] = useState(isHRorAdmin ? 'approvals' : 'my-resignation')

  const { data: myRaw } = useResignationRequests({ employee_id: user?.emp_id })
  const { data: allRaw, isLoading: allLoading } = useResignationRequests(isHRorAdmin ? {} : { employee_id: user?.emp_id })
  const createResignation = useCreateResignation()
  const approveMutation = useApproveResignation()
  const rejectMutation = useRejectResignation()
  const withdrawMutation = useWithdrawResignation()

  const myRequests = Array.isArray(myRaw) ? myRaw : []
  const currentResignation = myRequests.find(r => r.status === 'pending' || r.status === 'approved') || null
  const hasResignation = !!currentResignation

  const allRequests = useMemo(() => (Array.isArray(allRaw) ? allRaw : []).map(r => ({
    id: r.id,
    displayId: `RES-${r.id}`,
    empId: r.employee_id,
    name: r.employee?.full_name || 'Employee',
    role: r.employee?.designation || '—',
    photo: r.employee?.photo_url,
    submittedDate: r.created_at,
    noticePeriodDays: r.notice_period_days,
    lastWorkingDay: r.last_working_day,
    reason: r.reason || '—',
    status: r.status,
    hrRemarks: r.hr_remarks,
    approvedBy: r.approver?.full_name,
    approvedAt: r.approved_at,
  })), [allRaw])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const [selectedReq, setSelectedReq] = useState(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [hrRemarks, setHrRemarks] = useState('')

  const [formData, setFormData] = useState({
    reason: 'Better career opportunity',
    customReason: '',
    noticePeriod: 30,
  })

  const handleSubmitResignation = (e) => {
    e.preventDefault()
    const finalReason = formData.reason === 'Other' ? formData.customReason : formData.reason
    if (formData.reason === 'Other' && !formData.customReason.trim()) {
      toast.error('Please specify your reason.')
      return
    }
    createResignation.mutate(
      { employee_id: user?.emp_id, reason: finalReason, notice_period_days: Number(formData.noticePeriod) || 30 },
      {
        onSuccess: () => { toast.success('Resignation request submitted successfully!'); setShowSubmitModal(false) },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit resignation'),
      }
    )
  }

  const handleWithdrawResignation = () => {
    if (!currentResignation) return
    withdrawMutation.mutate(currentResignation.id, {
      onSuccess: () => { toast.success('Resignation request withdrawn successfully.'); setShowWithdrawModal(false) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to withdraw'),
    })
  }

  const handleOpenApproveModal = (req) => { setSelectedReq(req); setHrRemarks(''); setShowApproveModal(true) }
  const handleConfirmApprove = () => {
    if (!selectedReq) return
    approveMutation.mutate({ id: selectedReq.id, approved_by: user?.emp_id, hr_remarks: hrRemarks }, {
      onSuccess: () => { toast.success(`Resignation for ${selectedReq.name} approved successfully!`); setShowApproveModal(false); setShowDetailModal(false) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
    })
  }

  const handleOpenRejectModal = (req) => { setSelectedReq(req); setHrRemarks(''); setShowRejectModal(true) }
  const handleConfirmReject = () => {
    if (!selectedReq) return
    if (!hrRemarks.trim()) { toast.error('Please provide a reason for rejecting the resignation.'); return }
    rejectMutation.mutate({ id: selectedReq.id, approved_by: user?.emp_id, hr_remarks: hrRemarks }, {
      onSuccess: () => { toast.error(`Resignation for ${selectedReq.name} rejected.`); setShowRejectModal(false); setShowDetailModal(false) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
    })
  }

  const filteredHRRequests = allRequests.filter((req) => {
    const matchesSearch =
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.empId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'All Status' ||
      (statusFilter === 'Pending Review' && req.status === 'pending') ||
      req.status === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const pendingCount = allRequests.filter((r) => r.status === 'pending').length
  const approvedCount = allRequests.filter((r) => r.status === 'approved').length
  const rejectedCount = allRequests.filter((r) => r.status === 'rejected' || r.status === 'withdrawn').length

  // Real history derived from the resignation's own timestamps - no fabricated audit log
  const history = useMemo(() => {
    if (!currentResignation) return []
    const rows = [{ id: 1, date: currentResignation.created_at, action: 'Resignation Submitted', by: user?.full_name || 'You', remarks: `Reason: ${currentResignation.reason}` }]
    if (currentResignation.approved_at) {
      rows.push({
        id: 2,
        date: currentResignation.approved_at,
        action: currentResignation.status === 'approved' ? 'Approved by HR' : 'Rejected by HR',
        by: currentResignation.approver?.full_name || 'HR',
        remarks: currentResignation.hr_remarks || '—',
      })
    }
    return rows
  }, [currentResignation, user])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Resignation</h1>
          <nav className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>Home</span><span>&gt;</span><span>Resignation</span><span>&gt;</span>
            <span className="text-gray-700 font-semibold">{activeTab === 'approvals' ? 'Resignation Approvals' : 'My Resignation'}</span>
          </nav>
        </div>
        {!hasResignation && (
          <button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98]">
            <Plus className="h-4 w-4" /><span>Submit Resignation</span>
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 bg-white px-3 pt-2 rounded-xl shadow-2xs">
        <button onClick={() => setActiveTab('my-resignation')} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${activeTab === 'my-resignation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
          <User className="h-4 w-4" /><span>My Resignation</span>
        </button>
        {isHRorAdmin && (
          <button onClick={() => setActiveTab('approvals')} className={`flex items-center gap-2.5 border-b-2 px-4 py-3 text-xs font-bold transition-all ${activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            <BadgeCheck className="h-4 w-4" /><span>Resignation Approvals</span>
            {pendingCount > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 border border-amber-200">{pendingCount} Pending</span>}
          </button>
        )}
      </div>

      {activeTab === 'approvals' && isHRorAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-500">Total Requests</span><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-4 w-4" /></div></div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{allRequests.length}</p>
              <p className="mt-1 text-[11px] text-gray-500">All submitted exit requests</p>
            </div>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-2xs">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-amber-800">Pending Review</span><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Clock className="h-4 w-4" /></div></div>
              <p className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</p>
              <p className="mt-1 text-[11px] text-amber-700">Awaiting HR decision</p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-2xs">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-emerald-800">Approved Exits</span><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div></div>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{approvedCount}</p>
              <p className="mt-1 text-[11px] text-emerald-700">Exit clearance active</p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/30 p-5 shadow-2xs">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-rose-800">Rejected / Withdrawn</span><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700"><XCircle className="h-4 w-4" /></div></div>
              <p className="mt-2 text-2xl font-bold text-rose-900">{rejectedCount}</p>
              <p className="mt-1 text-[11px] text-rose-700">Cancelled exit processes</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search employee, ID, reason..." className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-800 focus:border-blue-500 focus:outline-hidden">
                <option value="All Status">All Status</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5"><Users className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-900">Employee Resignation Requests</h2></div>
              <span className="text-xs text-gray-500">Showing {filteredHRRequests.length} requests</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Req ID &amp; Date</th>
                    <th className="px-4 py-3">Notice &amp; LWD</th>
                    <th className="px-4 py-3">Reason for Leaving</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allLoading && <tr><td colSpan="6" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                  {!allLoading && filteredHRRequests.map((req) => {
                    const isPending = req.status === 'pending'
                    const isApproved = req.status === 'approved'
                    const isRejected = req.status === 'rejected'
                    return (
                      <tr key={req.id} data-hl={req.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={req.name} src={req.photo} size="sm" />
                            <div><p className="font-bold text-gray-900">{req.name}</p><p className="text-[11px] text-gray-500">{req.empId} • {req.role}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><p className="font-bold text-gray-900">{req.displayId}</p><p className="text-[11px] text-gray-500">{fmtDate(req.submittedDate)}</p></td>
                        <td className="px-4 py-3.5"><p className="font-semibold text-gray-900">{fmtDate(req.lastWorkingDay)}</p><p className="text-[11px] text-gray-500">{req.noticePeriodDays} Days Notice</p></td>
                        <td className="px-4 py-3.5 max-w-xs"><p className="font-medium text-gray-900 truncate" title={req.reason}>{req.reason}</p></td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isPending && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" />{statusLabel(req.status)}</span>}
                          {isApproved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" />Approved</span>}
                          {isRejected && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200"><XCircle className="h-3 w-3" />Rejected</span>}
                          {req.status === 'withdrawn' && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 border border-gray-200">Withdrawn</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setSelectedReq(req); setShowDetailModal(true) }} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors" title="View Details"><Eye className="h-4 w-4" /></button>
                            {isPending && (
                              <>
                                <button onClick={() => handleOpenApproveModal(req)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-[0.98] transition-all" title="Approve"><Check className="h-3.5 w-3.5" /><span>Approve</span></button>
                                <button onClick={() => handleOpenRejectModal(req)} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 active:scale-[0.98] transition-all" title="Reject"><X className="h-3.5 w-3.5" /><span>Reject</span></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!allLoading && filteredHRRequests.length === 0 && (
                    <tr><td colSpan="6" className="py-10 text-center text-gray-400">No resignation requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'my-resignation' && (
        <div className="space-y-6">
          {hasResignation ? (
            <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs"><FileText className="h-6 w-6" /></div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Resignation Progress</span>
                    <div className="mt-0.5 flex items-center gap-3">
                      <span className="text-base font-bold text-gray-900 tracking-tight">RES-{currentResignation.id}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${currentResignation.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-amber-50 text-amber-700 border-amber-200/70'}`}>
                        {statusLabel(currentResignation.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Submitted on <span className="font-semibold text-gray-700">{fmtDate(currentResignation.created_at)}</span></p>
                  </div>
                </div>

                <div className="flex-1 lg:max-w-xl">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-6 right-6 top-4 -z-0 h-0.5 bg-gray-200" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs ring-4 ring-white"><Send className="h-4 w-4" /></div>
                      <span className="mt-2 text-xs font-bold text-gray-900">1. Submitted</span>
                      <span className="text-[11px] text-gray-500">{fmtDate(currentResignation.created_at)}</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-xs ring-4 ring-white ${currentResignation.status === 'pending' ? 'border-amber-500 bg-white text-amber-500' : 'bg-emerald-500 text-white border-emerald-500'}`}>
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-gray-900">2. HR Review</span>
                      <span className="text-[11px] font-medium text-gray-500">{currentResignation.status === 'pending' ? 'Pending' : 'Reviewed'}</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-xs ring-4 ring-white ${currentResignation.status === 'approved' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-300 bg-white text-gray-400'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-gray-900">3. Approved</span>
                      <span className="text-[11px] font-medium text-gray-400">{currentResignation.status === 'approved' ? fmtDate(currentResignation.approved_at) : 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><FileText className="h-6 w-6" /></div>
              <h3 className="mt-3 text-base font-bold text-gray-900">No Active Resignation Request</h3>
              <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">You currently have no active resignation request in the system. If you wish to initiate an exit process, click the button below.</p>
              <button onClick={() => setShowSubmitModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700"><Plus className="h-4 w-4" />Submit Resignation Request</button>
            </div>
          )}

          {hasResignation && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs lg:col-span-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4"><FileText className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-900">Resignation Details</h2></div>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between border-b border-gray-100/80 pb-2.5"><span className="text-xs font-semibold text-gray-500">Notice Period</span><span className="font-bold text-gray-900">{currentResignation.notice_period_days} Days</span></div>
                    <div className="flex items-center justify-between border-b border-gray-100/80 pb-2.5"><span className="text-xs font-semibold text-gray-500">Last Working Day</span><span className="font-bold text-gray-900">{fmtDate(currentResignation.last_working_day)}</span></div>
                    <div className="flex items-center justify-between border-b border-gray-100/80 pb-2.5"><span className="text-xs font-semibold text-gray-500">Reason for Leaving</span><span className="font-semibold text-gray-800 text-right">{currentResignation.reason}</span></div>
                    {currentResignation.hr_remarks && (
                      <div className="space-y-1.5 border-b border-gray-100/80 pb-3">
                        <span className="text-xs font-semibold text-gray-500">HR Remarks</span>
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-lg border border-gray-100">{currentResignation.hr_remarks}</p>
                      </div>
                    )}
                  </div>
                </div>
                {currentResignation.status === 'pending' && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowWithdrawModal(true)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600 shadow-2xs transition-all hover:bg-red-100 hover:border-red-300 active:scale-[0.99]">
                      <Trash2 className="h-4 w-4" /><span>Withdraw Resignation</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6 lg:col-span-6">
                <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4"><AlertCircle className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-900">Important Information</h2></div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" /><div><h4 className="text-xs font-bold text-gray-900">Notice Period</h4><p className="text-[11px] text-gray-500 mt-0.5">{fmtDate(currentResignation.resignation_date)} – {fmtDate(currentResignation.last_working_day)}</p></div></div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">{currentResignation.notice_period_days} Days</span>
                    </div>
                    <div className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <div className="flex items-start gap-3"><DollarSign className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" /><div><h4 className="text-xs font-bold text-gray-900">Full &amp; Final Settlement</h4><p className="text-[11px] text-gray-500 mt-0.5">Processed by HR after your last working day</p></div></div>
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">Upcoming</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2.5"><HelpCircle className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-900">Need Help?</h2></div>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">If you have any questions regarding your resignation process, raise a helpdesk ticket to HR.</p>
                  <button onClick={() => setShowContactModal(true)} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-xs font-bold text-blue-600 shadow-2xs transition-all hover:bg-blue-50 focus:outline-hidden">
                    <HelpCircle className="h-4 w-4" /><span>Contact HR Department</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasResignation && (
            <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4"><History className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-900">Resignation History</h2></div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">By</th><th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((row) => (
                      <tr key={row.id} data-hl={row.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{fmtDateTime(row.date)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{row.action}</td>
                        <td className="px-4 py-3 text-gray-700">{row.by}</td>
                        <td className="px-4 py-3 text-gray-600">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showApproveModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowApproveModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                <div><h3 className="text-base font-bold text-gray-900">Approve Resignation</h3><p className="text-[11px] text-gray-500">{selectedReq.displayId} • {selectedReq.name}</p></div>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                <span className="font-bold text-gray-700">Requested Last Working Day</span>
                <span className="font-bold text-gray-900">{fmtDate(selectedReq.lastWorkingDay)}</span>
              </div>
              <div>
                <label className="block font-bold text-gray-700">HR Remarks / Exit Instructions (Optional)</label>
                <textarea rows={3} value={hrRemarks} onChange={(e) => setHrRemarks(e.target.value)} placeholder="Enter HR approval remarks, handover instructions..." className="mt-1.5 w-full rounded-lg border border-gray-300 p-3 font-medium text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowApproveModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmApprove} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowRejectModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><XCircle className="h-5 w-5" /></div>
                <div><h3 className="text-base font-bold text-gray-900">Reject Resignation</h3><p className="text-[11px] text-gray-500">{selectedReq.displayId} • {selectedReq.name}</p></div>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700">Reason for Rejection *</label>
                <textarea rows={3} required value={hrRemarks} onChange={(e) => setHrRemarks(e.target.value)} placeholder="Provide reason for rejecting this resignation request..." className="mt-1.5 w-full rounded-lg border border-gray-300 p-3 font-medium text-gray-900 focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowRejectModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmReject} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700">Reject Request</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedReq.name} src={selectedReq.photo} size="md" />
                <div><h3 className="text-base font-bold text-gray-900">{selectedReq.name}</h3><p className="text-xs text-gray-500">{selectedReq.empId} • {selectedReq.role}</p></div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                <div><span className="text-gray-500 font-semibold">Resignation ID:</span><p className="font-bold text-gray-900 text-sm mt-0.5">{selectedReq.displayId}</p></div>
                <div><span className="text-gray-500 font-semibold">Submission Date:</span><p className="font-bold text-gray-900 mt-0.5">{fmtDate(selectedReq.submittedDate)}</p></div>
                <div><span className="text-gray-500 font-semibold">Notice Period:</span><p className="font-bold text-gray-900 mt-0.5">{selectedReq.noticePeriodDays} Days</p></div>
                <div><span className="text-gray-500 font-semibold">Requested Last Working Day:</span><p className="font-bold text-gray-900 mt-0.5">{fmtDate(selectedReq.lastWorkingDay)}</p></div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-bold">Reason for Leaving:</span>
                <p className="font-semibold text-gray-900 bg-white p-3 rounded-lg border border-gray-200">{selectedReq.reason}</p>
              </div>
              {selectedReq.hrRemarks && (
                <div className="space-y-1">
                  <span className="text-gray-500 font-bold">HR Remarks:</span>
                  <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed">{selectedReq.hrRemarks}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-xs font-semibold text-gray-500">Status: <span className="font-bold text-gray-900">{statusLabel(selectedReq.status)}</span></span>
              <div className="flex items-center gap-3">
                {selectedReq.status === 'pending' && (
                  <>
                    <button onClick={() => { setShowDetailModal(false); handleOpenRejectModal(selectedReq) }} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700">Reject</button>
                    <button onClick={() => { setShowDetailModal(false); handleOpenApproveModal(selectedReq) }} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700">Approve</button>
                  </>
                )}
                <button onClick={() => setShowDetailModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowSubmitModal(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></div><h3 className="text-lg font-bold text-gray-900">Submit Resignation</h3></div>
              <button onClick={() => setShowSubmitModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmitResignation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">Reason for Leaving *</label>
                <select value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20">
                  <option value="Better career opportunity">Better career opportunity</option>
                  <option value="Personal / Family reasons">Personal / Family reasons</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Higher studies">Higher studies</option>
                  <option value="Health concerns">Health concerns</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.reason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700">Specify Reason *</label>
                  <input type="text" required value={formData.customReason} onChange={(e) => setFormData({ ...formData, customReason: e.target.value })} placeholder="Enter custom reason..." className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700">Notice Period (Days)</label>
                <input type="number" value={formData.noticePeriod} onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20" />
                <p className="mt-1 text-[11px] text-gray-400">Your last working day will be calculated automatically from today.</p>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createResignation.isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60">
                  {createResignation.isPending ? 'Submitting…' : 'Submit Resignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && currentResignation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100"><ShieldAlert className="h-6 w-6" /></div>
              <h3 className="text-base font-bold text-gray-900">Withdraw Resignation?</h3>
            </div>
            <p className="mt-3 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to withdraw your active resignation request (<span className="font-bold text-gray-900">RES-{currentResignation.id}</span>)? This will cancel the exit process and notify HR.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowWithdrawModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">No, Keep Request</button>
              <button onClick={handleWithdrawResignation} disabled={withdrawMutation.isPending} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-60">
                {withdrawMutation.isPending ? 'Withdrawing…' : 'Yes, Withdraw Resignation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4" onClick={() => setShowContactModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><HelpCircle className="h-5 w-5" /></div><h3 className="text-base font-bold text-gray-900">Contact HR Department</h3></div>
              <button onClick={() => setShowContactModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-gray-600">For questions about your resignation or exit formalities, raise a ticket through the Helpdesk — HR will respond there directly.</p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowContactModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              <button onClick={() => { setShowContactModal(false); navigate('/helpdesk') }} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700">Open Helpdesk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
