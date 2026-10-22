import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
  Plus,
  CalendarDays,
  Receipt,
  PiggyBank,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { Avatar, cx } from '../components/ui'
import {
  useSalaryAdvanceRequests,
  useCreateSalaryAdvance,
} from '../hooks/useSalaryAdvance'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtMoney = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

const statusConfig = {
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
}

function StatusPill({ status }) {
  const cfg = statusConfig[status?.toLowerCase()] || statusConfig.pending
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border', cfg.bg, cfg.text, cfg.border)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// Real, single-step workflow matching what the backend actually enforces
const approvalWorkflow = [
  { step: 1, title: 'Apply Advance', desc: 'Fill in advance request form with amount and reason.', icon: FileText, color: 'bg-blue-600' },
  { step: 2, title: 'HR Review', desc: 'HR/Admin reviews and approves or rejects the request.', icon: ShieldCheck, color: 'bg-purple-600' },
  { step: 3, title: 'Amount Disbursed', desc: 'On approval, the amount is marked disbursed and EMI deductions begin.', icon: CheckCircle2, color: 'bg-emerald-600' },
]

const getNextMonthStr = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

function ApplyAdvanceModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({ amount: '', reason: '', customReason: '', repaymentType: 'emi', tenure: '3', deductionMonth: getNextMonthStr(), remarks: '' })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalReason = formData.reason === 'Other' ? formData.customReason : formData.reason
    if (!formData.amount || !formData.reason || (formData.reason === 'Other' && !formData.customReason.trim())) {
      toast.error('Please fill in all required fields')
      return
    }
    if (formData.repaymentType === 'lump_sum' && !formData.deductionMonth) {
      toast.error('Please select the month the full amount should be deducted in')
      return
    }
    onSubmit({
      amount: Number(formData.amount),
      reason: formData.remarks ? `${finalReason} — ${formData.remarks}` : finalReason,
      repayment_type: formData.repaymentType,
      ...(formData.repaymentType === 'emi'
        ? { repayment_months: Number(formData.tenure) }
        : { deduction_month: formData.deductionMonth }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-950">Apply for Salary Advance</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (₹) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">How would you like to repay? <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, repaymentType: 'emi' }))}
                className={cx('rounded-lg border p-3 text-left transition-colors', formData.repaymentType === 'emi' ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400')}
              >
                <p className="text-xs font-bold text-gray-900">Pay via EMI</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Spread across upcoming months</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, repaymentType: 'lump_sum' }))}
                className={cx('rounded-lg border p-3 text-left transition-colors', formData.repaymentType === 'lump_sum' ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400')}
              >
                <p className="text-xs font-bold text-gray-900">Full Deduction</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Entire amount in one month</p>
              </button>
            </div>
          </div>

          {formData.repaymentType === 'emi' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Repayment Tenure <span className="text-rose-500">*</span></label>
              <select
                value={formData.tenure}
                onChange={(e) => setFormData(prev => ({ ...prev, tenure: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              >
                {[1, 2, 3, 4, 5, 6].map(m => <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Deduct Full Amount In <span className="text-rose-500">*</span></label>
              <input
                type="month"
                min={getNextMonthStr()}
                value={formData.deductionMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, deductionMonth: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-gray-400 mt-1">Must be a future month — the full amount will be deducted from that month's salary only.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason <span className="text-rose-500">*</span></label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value, customReason: '' }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Select Reason</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Home Renovation">Home Renovation</option>
              <option value="Education">Education</option>
              <option value="Vehicle Repair">Vehicle Repair</option>
              <option value="Travel">Travel</option>
              <option value="Personal Requirement">Personal Requirement</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Specify Reason <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="Enter your reason"
                value={formData.customReason}
                onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Additional Remarks</label>
            <textarea
              placeholder="Brief description (optional)"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {formData.amount && formData.repaymentType === 'emi' && formData.tenure && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3.5">
              <p className="text-xs font-semibold text-blue-800">EMI Calculation Preview</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {fmtMoney(Number(formData.amount) / Number(formData.tenure))} <span className="text-xs font-medium text-blue-600">/ month for {formData.tenure} months</span>
              </p>
            </div>
          )}

          {formData.amount && formData.repaymentType === 'lump_sum' && formData.deductionMonth && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3.5">
              <p className="text-xs font-semibold text-blue-800">Deduction Preview</p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {fmtMoney(formData.amount)} <span className="text-xs font-medium text-blue-600">deducted fully from {new Date(formData.deductionMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} salary</span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-xs active:scale-[0.98] transition-all disabled:opacity-60">
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function EmployeeSalaryAdvance() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('My Requests')
  const [currentPage, setCurrentPage] = useState(1)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const ITEMS_PER_PAGE = 5

  const { data: rawRequests, isLoading } = useSalaryAdvanceRequests({ employee_id: user?.emp_id })
  const createAdvance = useCreateSalaryAdvance()

  const requests = useMemo(() => (Array.isArray(rawRequests) ? rawRequests : []).map(r => ({
    id: r.id,
    displayId: `ADV-${r.id}`,
    date: r.created_at,
    amount: Number(r.amount) || 0,
    reason: r.reason || '—',
    status: r.status?.toLowerCase() || 'pending',
    approvedBy: r.approver ? { name: r.approver.full_name } : null,
    repaymentType: r.repayment_type || 'emi',
    tenure: r.repayment_months,
    deductionMonth: r.deduction_month,
    emi: r.repayment_type === 'lump_sum'
      ? Number(r.amount) || 0
      : (r.repayment_months ? Math.round((Number(r.amount) || 0) / r.repayment_months) : Number(r.amount) || 0),
    disbursedDate: r.disbursed_at,
    raw: r,
  })), [rawRequests])

  const approvedReqs = requests.filter(r => r.status === 'approved')
  const pendingReqs = requests.filter(r => r.status === 'pending')
  const rejectedReqs = requests.filter(r => r.status === 'rejected')

  const approvedSum = approvedReqs.reduce((acc, r) => acc + r.amount, 0)
  const pendingSum = pendingReqs.reduce((acc, r) => acc + r.amount, 0)
  const rejectedSum = rejectedReqs.reduce((acc, r) => acc + r.amount, 0)
  const totalAdvanceTaken = approvedSum + pendingSum
  const chartTotal = (approvedSum + pendingSum + rejectedSum) || 1
  const approvedPct = Math.round((approvedSum / chartTotal) * 100)
  const pendingPct = Math.round((pendingSum / chartTotal) * 100)
  const rejectedPct = Math.max(0, 100 - approvedPct - pendingPct)

  const basicSalary = Number(user?.basic_salary) || 0
  const availableLimit = Math.round(basicSalary * 0.8)

  // EMI / deduction schedule derived from real disbursed advances - no fabricated ledger
  const emiSchedule = useMemo(() => {
    const today = new Date()
    const rows = []
    approvedReqs.forEach(r => {
      if (r.repaymentType === 'lump_sum') {
        if (!r.deductionMonth) return
        const [y, m] = r.deductionMonth.split('-').map(Number)
        const monthDate = new Date(y, m - 1, 5)
        rows.push({
          key: `${r.id}-0`,
          month: monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          monthDate,
          amount: r.emi,
          status: monthDate <= today ? 'Paid' : 'Upcoming',
          paidDate: monthDate <= today ? monthDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          source: r.displayId,
          isLumpSum: true,
        })
        return
      }
      if (!r.disbursedDate || !r.tenure) return
      const start = new Date(r.disbursedDate)
      for (let i = 0; i < r.tenure; i++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + i + 1, 5)
        rows.push({
          key: `${r.id}-${i}`,
          month: monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          monthDate,
          amount: r.emi,
          status: monthDate <= today ? 'Paid' : 'Upcoming',
          paidDate: monthDate <= today ? monthDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          source: r.displayId,
        })
      }
    })
    return rows.sort((a, b) => a.monthDate - b.monthDate)
  }, [approvedReqs])

  const totalEmiAmount = emiSchedule.reduce((sum, e) => sum + e.amount, 0)
  const emiPaid = emiSchedule.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0)
  const emiRemaining = Math.max(0, totalEmiAmount - emiPaid)
  const nextEmi = emiSchedule.find(e => e.status === 'Upcoming')
  const daysToNextEmi = nextEmi ? Math.max(0, Math.ceil((nextEmi.monthDate - new Date()) / 86400000)) : null

  const totalPages = Math.max(1, Math.ceil(requests.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedRequests = requests.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE)

  const tabs = ['My Requests', 'Approval Process', 'Repayment Schedule', 'Advance History']

  const handleCreate = (payload) => {
    createAdvance.mutate(
      { employee_id: user?.emp_id, ...payload },
      {
        onSuccess: () => {
          toast.success('Advance request submitted successfully!')
          setIsApplyModalOpen(false)
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to submit request')
        },
      }
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <AnimatePresence>
        {isApplyModalOpen && (
          <ApplyAdvanceModal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            onSubmit={handleCreate}
            isSubmitting={createAdvance.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" onClick={() => setSelectedRequest(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-base font-bold text-gray-950">Request Details</h2>
                <button onClick={() => setSelectedRequest(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Request ID', selectedRequest.displayId],
                    ['Date', fmtDate(selectedRequest.date)],
                    ['Amount', fmtMoney(selectedRequest.amount)],
                    ['Reason', selectedRequest.reason],
                    ...(selectedRequest.repaymentType === 'lump_sum'
                      ? [
                          ['Repayment Plan', 'Full Deduction'],
                          ['Deduction Month', selectedRequest.deductionMonth ? new Date(selectedRequest.deductionMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'],
                        ]
                      : [
                          ['Repayment Plan', 'EMI'],
                          ['Tenure', `${selectedRequest.tenure} Month(s)`],
                          ['Monthly EMI', fmtMoney(selectedRequest.emi)],
                        ]),
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                    <StatusPill status={selectedRequest.status} />
                  </div>
                  {selectedRequest.approvedBy && (
                    <div className="flex items-center gap-2">
                      <Avatar name={selectedRequest.approvedBy.name} size="xs" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{selectedRequest.approvedBy.name}</p>
                        <p className="text-[11px] text-gray-500">HR</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">Salary Advance</span>
          </nav>
          <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Salary Advance</h1>
          <p className="mt-1 text-sm text-gray-500">Track your advance requests, repayments, and apply for new advances.</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Apply for Advance
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Advance Taken', value: fmtMoney(totalAdvanceTaken), sub: 'Approved + Pending', icon: <Wallet className="h-4 w-4" />, iconBg: 'bg-slate-900 text-white', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200' },
          { label: 'Pending Requests', value: fmtMoney(pendingSum), sub: `${pendingReqs.length} ${pendingReqs.length === 1 ? 'Request' : 'Requests'}`, icon: <Clock className="h-4 w-4" />, iconBg: 'bg-amber-500 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' },
          { label: 'Approved Amount', value: fmtMoney(approvedSum), sub: `${approvedReqs.length} Approved Requests`, icon: <CheckCircle2 className="h-4 w-4" />, iconBg: 'bg-emerald-600 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          { label: 'Available Limit', value: basicSalary > 0 ? fmtMoney(availableLimit) : '—', sub: basicSalary > 0 ? '80% of Basic Salary' : 'Basic salary not on file', icon: <PiggyBank className="h-4 w-4" />, iconBg: 'bg-indigo-600 text-white', badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
          { label: 'Next EMI Date', value: nextEmi ? nextEmi.month : '—', sub: nextEmi ? `${daysToNextEmi} Days Left` : 'No upcoming EMI', icon: <CalendarDays className="h-4 w-4" />, iconBg: 'bg-purple-600 text-white', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200' },
        ].map((card) => (
          <div key={card.label} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 min-h-[115px] shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{card.label}</span>
              <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
            </div>
            <div className="my-1">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight">{card.value}</h2>
            </div>
            <div className="flex items-center">
              <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium border leading-normal', card.badgeBg)}>
                <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
              className={cx(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'My Requests' && (
        <div className="w-full">
          <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/60">
              <h2 className="text-base font-bold text-gray-900">My Advance Requests</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                {requests.length} Total Requests
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-600">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Request ID</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Request Date</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Reason</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Repayment Plan</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Approved By</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && (
                    <tr><td colSpan="8" className="py-10 text-center text-sm text-gray-400">Loading…</td></tr>
                  )}
                  {!isLoading && paginatedRequests.map((req) => (
                    <tr key={req.id} data-hl={req.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100/80 px-2.5 py-1 rounded-sm border border-gray-200/80">{req.displayId}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{fmtDate(req.date)}</td>
                      <td className="py-4 px-6 whitespace-nowrap"><span className="font-bold text-gray-950 text-base">{fmtMoney(req.amount)}</span></td>
                      <td className="py-4 px-6 text-sm text-gray-700 whitespace-nowrap">{req.reason}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-xs">
                        {req.repaymentType === 'lump_sum' ? (
                          <span className="font-semibold text-gray-800">Full deduction · {req.deductionMonth ? new Date(req.deductionMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span>
                        ) : (
                          <span className="font-semibold text-gray-800">EMI · {req.tenure} mo · {fmtMoney(req.emi)}/mo</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap"><StatusPill status={req.status} /></td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {req.approvedBy ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar name={req.approvedBy.name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{req.approvedBy.name}</p>
                              <p className="text-xs text-gray-500 font-medium">HR</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm pl-2">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedRequest(req)} title="View Details" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-2xs">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && requests.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <AlertCircle className="h-9 w-9 text-gray-300" />
                          <p className="text-sm font-medium text-gray-500">No advance requests found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {requests.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
                <span className="text-sm text-gray-500">
                  Showing <strong className="text-gray-800 font-semibold">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-800 font-semibold">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, requests.length)}</strong> of <strong className="text-gray-800 font-semibold">{requests.length}</strong> requests
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={cx('inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors', page === safeCurrentPage ? 'bg-blue-600 text-white border border-blue-600' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100')}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Approval Process' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
          <h2 className="text-lg font-bold text-gray-950 mb-6">Salary Advance Approval Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {approvalWorkflow.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="flex flex-col items-center text-center relative">
                  <span className={cx('flex h-13 w-13 items-center justify-center rounded-full text-white text-xl font-bold shadow-xs mb-3.5', step.color)}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">{step.desc}</p>
                  {idx < approvalWorkflow.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+36px)] w-[calc(100%-72px)]">
                      <div className="border-t-2 border-dashed border-gray-200" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/60 p-6">
            <h3 className="text-base font-bold text-blue-950 mb-4">Key Policy Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['Maximum Limit', basicSalary > 0 ? `Up to ${fmtMoney(availableLimit)} (80% of your basic salary)` : 'Up to 80% of basic salary'],
                ['Repayment', 'EMI deducted from monthly salary, 1-6 months tenure'],
                ['Interest', 'Zero interest on salary advances'],
                ['Approval', 'Reviewed and approved directly by HR/Admin'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Repayment Schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total EMI Amount', value: fmtMoney(totalEmiAmount), sub: `${emiSchedule.length} Monthly Deductions`, icon: <IndianRupee className="h-4 w-4" />, iconBg: 'bg-slate-900 text-white', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200' },
              { label: 'EMI Paid', value: fmtMoney(emiPaid), sub: `${emiSchedule.filter(e => e.status === 'Paid').length} Installments Completed`, icon: <CheckCircle2 className="h-4 w-4" />, iconBg: 'bg-emerald-600 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
              { label: 'EMI Remaining', value: fmtMoney(emiRemaining), sub: `${emiSchedule.filter(e => e.status === 'Upcoming').length} Installments Pending`, icon: <Clock className="h-4 w-4" />, iconBg: 'bg-amber-500 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 font-bold' },
              { label: 'Next EMI Date', value: nextEmi ? nextEmi.month : '—', sub: nextEmi ? `${daysToNextEmi} Days Left` : 'No upcoming EMI', icon: <CalendarDays className="h-4 w-4" />, iconBg: 'bg-purple-600 text-white', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200' },
            ].map((card) => (
              <div key={card.label} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 min-h-[115px] shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-700 transition-colors">{card.label}</span>
                  <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
                </div>
                <div className="my-1"><h2 className="text-xl sm:text-[22px] font-extrabold text-gray-950 tracking-tight leading-tight">{card.value}</h2></div>
                <div className="flex items-center">
                  <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium border leading-normal', card.badgeBg)}>
                    <span className="h-1 w-1 rounded-full bg-current opacity-70" />
                    {card.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/60 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">EMI Schedule</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Monthly Payroll Deduction</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-600">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs">Month</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs">Type</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs">Amount</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs">Status</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emiSchedule.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-sm text-gray-400">No deductions scheduled yet — approved advances will appear here.</td></tr>
                  )}
                  {emiSchedule.map((emi) => (
                    <tr key={emi.key} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900">{emi.month}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-gray-600">{emi.isLumpSum ? 'Full Deduction' : 'EMI'}</td>
                      <td className="py-4 px-6 text-sm font-bold text-gray-950">{fmtMoney(emi.amount)}</td>
                      <td className="py-4 px-6">
                        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border', emi.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                          <span className={cx('h-1.5 w-1.5 rounded-full', emi.status === 'Paid' ? 'bg-emerald-500' : 'bg-gray-400')} />
                          {emi.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{emi.paidDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Advance History' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
              <h3 className="text-base font-bold text-gray-900 mb-4">Advance Summary</h3>
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="46" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                    {approvedPct > 0 && <circle cx="60" cy="60" r="46" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray={`${(approvedPct / 100) * 289.02} 289.02`} strokeLinecap="butt" />}
                    {pendingPct > 0 && <circle cx="60" cy="60" r="46" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray={`${(pendingPct / 100) * 289.02} 289.02`} strokeDashoffset={`-${(approvedPct / 100) * 289.02}`} strokeLinecap="butt" />}
                    {rejectedPct > 0 && <circle cx="60" cy="60" r="46" stroke="#ef4444" strokeWidth="12" fill="none" strokeDasharray={`${(rejectedPct / 100) * 289.02} 289.02`} strokeDashoffset={`-${((approvedPct + pendingPct) / 100) * 289.02}`} strokeLinecap="butt" />}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-xl font-bold text-gray-950">{fmtMoney(totalAdvanceTaken)}</p>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Taken</p>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {[
                    { label: 'Approved', amount: approvedSum, pct: `${approvedPct}%`, color: 'bg-emerald-500' },
                    { label: 'Pending', amount: pendingSum, pct: `${pendingPct}%`, color: 'bg-amber-500' },
                    { label: 'Rejected', amount: rejectedSum, pct: `${rejectedPct}%`, color: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className={cx('h-3 w-3 rounded-xs shrink-0', item.color)} />
                      <div>
                        <p className="text-sm text-gray-800 font-semibold">{item.label}</p>
                        <p className="text-xs text-gray-500">{fmtMoney(item.amount)} ({item.pct})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
              <h3 className="text-base font-bold text-gray-900 mb-4">Repayment Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'Total EMI Amount', value: fmtMoney(totalEmiAmount), icon: Receipt, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
                  { label: 'EMI Paid', value: fmtMoney(emiPaid), icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                  { label: 'EMI Remaining', value: fmtMoney(emiRemaining), icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
                  { label: 'Next EMI Date', value: nextEmi ? nextEmi.month : '—', icon: CalendarDays, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-3.5">
                      <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', item.iconBg, item.iconColor)}><Icon className="h-4 w-4" /></span>
                      <div className="flex-1 flex items-center justify-between">
                        <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                        <p className="text-base font-bold text-gray-950">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
              <h3 className="text-base font-bold text-gray-900 mb-4">Requests Timeline</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {requests.length === 0 && <p className="text-sm text-gray-400">No requests yet.</p>}
                {requests.slice(0, 8).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800">{fmtDate(r.date)}</p>
                      <p className="text-gray-500">{r.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-950">{fmtMoney(r.amount)}</p>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
