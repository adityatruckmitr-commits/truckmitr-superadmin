import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  TrendingUp,
  CreditCard,
  BarChart3,
  Check,
  UserCheck,
  Users,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { Avatar, cx } from '../components/ui'
import {
  useSalaryAdvanceRequests,
  useApproveSalaryAdvance,
  useRejectSalaryAdvance,
} from '../hooks/useSalaryAdvance'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtMoney = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`

const statusConfig = {
  approved: { bg: 'bg-emerald-50/90', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500', label: 'Approved' },
  pending: { bg: 'bg-amber-50/90', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500', label: 'Pending' },
  rejected: { bg: 'bg-rose-50/90', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500', label: 'Rejected' },
}

function LocalStatusPill({ status }) {
  const cfg = statusConfig[status?.toLowerCase()] || statusConfig.pending
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border', cfg.bg, cfg.text, cfg.border)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

function InteractiveAdvanceSummaryCard({ requests = [] }) {
  const [activeHover, setActiveHover] = useState(null)
  const [viewFormat, setViewFormat] = useState('donut')

  const approvedReqs = requests.filter(r => r.status === 'approved')
  const pendingReqs = requests.filter(r => r.status === 'pending')
  const rejectedReqs = requests.filter(r => r.status === 'rejected')

  const approvedSum = approvedReqs.reduce((acc, r) => acc + r.amount, 0)
  const pendingSum = pendingReqs.reduce((acc, r) => acc + r.amount, 0)
  const rejectedSum = rejectedReqs.reduce((acc, r) => acc + r.amount, 0)
  const totalSum = approvedSum + pendingSum + rejectedSum
  const divisor = totalSum || 1 // avoid /0 in the percentage math only - never shown

  const approvedPct = Math.round((approvedSum / divisor) * 100) || 0
  const pendingPct = Math.round((pendingSum / divisor) * 100) || 0
  const rejectedPct = totalSum === 0 ? 0 : Math.max(0, 100 - approvedPct - pendingPct)

  const items = [
    { label: 'Approved', value: approvedSum, formatted: fmtMoney(approvedSum), pct: approvedPct, count: `${approvedReqs.length} ${approvedReqs.length === 1 ? 'Request' : 'Requests'}`, bgCls: 'bg-emerald-500', textCls: 'text-emerald-700' },
    { label: 'Pending', value: pendingSum, formatted: fmtMoney(pendingSum), pct: pendingPct, count: `${pendingReqs.length} ${pendingReqs.length === 1 ? 'Request' : 'Requests'}`, bgCls: 'bg-amber-400', textCls: 'text-amber-700' },
    { label: 'Rejected', value: rejectedSum, formatted: fmtMoney(rejectedSum), pct: rejectedPct, count: `${rejectedReqs.length} ${rejectedReqs.length === 1 ? 'Request' : 'Requests'}`, bgCls: 'bg-rose-500', textCls: 'text-rose-600' },
  ]

  const activeItem = items.find((i) => i.label === activeHover)
  const C = 289.02
  const approvedDash = (approvedPct / 100) * C
  const pendingDash = (pendingPct / 100) * C
  const rejectedDash = (rejectedPct / 100) * C

  return (
    <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-sm bg-slate-900 text-white"><BarChart3 className="h-4 w-4" /></span>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Advance Summary</h3>
        </div>
        <div className="inline-flex rounded-sm border border-gray-200 p-0.5 bg-gray-50">
          <button onClick={() => setViewFormat('donut')} className={cx('px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all', viewFormat === 'donut' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-400 hover:text-gray-700')}>Donut</button>
          <button onClick={() => setViewFormat('bar')} className={cx('px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all', viewFormat === 'bar' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-400 hover:text-gray-700')}>Bars</button>
        </div>
      </div>

      {viewFormat === 'donut' ? (
        <div className="flex items-center justify-center my-3">
          <div className="relative flex items-center justify-center cursor-pointer">
            <svg className="w-40 h-40 -rotate-90 transition-transform duration-200" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="46" stroke="#f3f4f6" strokeWidth="13" fill="none" />
              {approvedPct > 0 && <circle cx="60" cy="60" r="46" stroke="#10b981" strokeWidth={activeHover === 'Approved' ? '16' : '13'} fill="none" strokeDasharray={`${approvedDash} ${C}`} strokeLinecap="butt" className={cx('transition-all duration-150 cursor-pointer', activeHover && activeHover !== 'Approved' ? 'opacity-40' : 'opacity-100')} onMouseEnter={() => setActiveHover('Approved')} onMouseLeave={() => setActiveHover(null)} />}
              {pendingPct > 0 && <circle cx="60" cy="60" r="46" stroke="#f59e0b" strokeWidth={activeHover === 'Pending' ? '16' : '13'} fill="none" strokeDasharray={`${pendingDash} ${C}`} strokeDashoffset={`-${approvedDash}`} strokeLinecap="butt" className={cx('transition-all duration-150 cursor-pointer', activeHover && activeHover !== 'Pending' ? 'opacity-40' : 'opacity-100')} onMouseEnter={() => setActiveHover('Pending')} onMouseLeave={() => setActiveHover(null)} />}
              {rejectedPct > 0 && <circle cx="60" cy="60" r="46" stroke="#ef4444" strokeWidth={activeHover === 'Rejected' ? '16' : '13'} fill="none" strokeDasharray={`${rejectedDash} ${C}`} strokeDashoffset={`-${approvedDash + pendingDash}`} strokeLinecap="butt" className={cx('transition-all duration-150 cursor-pointer', activeHover && activeHover !== 'Rejected' ? 'opacity-40' : 'opacity-100')} onMouseEnter={() => setActiveHover('Rejected')} onMouseLeave={() => setActiveHover(null)} />}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
              <AnimatePresence mode="wait">
                {activeItem ? (
                  <motion.div key={activeItem.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}>
                    <p className={cx('text-base font-extrabold leading-none', activeItem.textCls)}>{activeItem.formatted}</p>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mt-1.5">{activeItem.label}</p>
                    <p className="text-xs text-gray-500 font-medium">{activeItem.pct}% ({activeItem.count})</p>
                  </motion.div>
                ) : (
                  <motion.div key="total" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}>
                    <p className="text-lg font-extrabold text-gray-950 leading-none">{fmtMoney(totalSum)}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1.5">Total Advance</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-4 space-y-3.5">
          {items.map((item) => (
            <div key={item.label} onMouseEnter={() => setActiveHover(item.label)} onMouseLeave={() => setActiveHover(null)} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-800">{item.label}</span>
                <span className="font-bold text-gray-950">{item.formatted} ({item.pct}%)</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={cx('h-full transition-all duration-200 rounded-full', item.bgCls)} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-3 border-t border-gray-100">
        {items.map((item) => {
          const isHovered = activeHover === item.label
          return (
            <div key={item.label} onMouseEnter={() => setActiveHover(item.label)} onMouseLeave={() => setActiveHover(null)} className={cx('flex items-center justify-between px-3.5 py-2.5 rounded-sm border transition-colors duration-150 bg-white', isHovered ? 'border-gray-400 bg-gray-50/80' : 'border-gray-200 hover:border-gray-300')}>
              <div className="flex items-center gap-2.5">
                <span className={cx('h-2.5 w-2.5 rounded-xs shrink-0', item.bgCls)} />
                <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                <span className="text-xs text-gray-400">({item.count})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-950">{item.formatted}</span>
                <span className={cx('text-xs font-semibold', item.textCls)}>({item.pct}%)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SalaryAdvance() {
  const { user } = useAuth()
  const { data: rawRequests, isLoading } = useSalaryAdvanceRequests()
  const approveMutation = useApproveSalaryAdvance()
  const rejectMutation = useRejectSalaryAdvance()

  const [activeTab, setActiveTab] = useState('All Employee Requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const requests = useMemo(() => (Array.isArray(rawRequests) ? rawRequests : []).map(r => ({
    id: r.id,
    displayId: `ADV-${r.id}`,
    date: r.created_at,
    amount: Number(r.amount) || 0,
    reason: r.reason || '—',
    status: r.status?.toLowerCase() || 'pending',
    employee: {
      name: r.employee?.full_name || 'Employee',
      designation: r.employee?.designation || '—',
      empId: r.employee_id,
      photo: r.employee?.photo_url,
    },
    approvedBy: r.approver ? { name: r.approver.full_name, role: 'HR' } : null,
    repaymentType: r.repayment_type || 'emi',
    tenure: r.repayment_months,
    deductionMonth: r.deduction_month,
    emi: r.repayment_type === 'lump_sum'
      ? Number(r.amount) || 0
      : (r.repayment_months ? Math.round((Number(r.amount) || 0) / r.repayment_months) : Number(r.amount) || 0),
    disbursedDate: r.disbursed_at,
  })), [rawRequests])

  const approvedRequests = requests.filter(r => r.status === 'approved')
  const pendingRequestsList = requests.filter(r => r.status === 'pending')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const approvedSum = approvedRequests.reduce((acc, r) => acc + r.amount, 0)
  const pendingSum = pendingRequestsList.reduce((acc, r) => acc + r.amount, 0)

  const approvedCount = approvedRequests.length
  const pendingCount = pendingRequestsList.length
  const rejectedCount = rejectedRequests.length

  // Real amount actually coming out of payroll this specific month - EMI plans
  // recover every month, a lump-sum plan only counts the month it's due in.
  const currentMonthStr = new Date().toISOString().slice(0, 7)
  const activeRecoverySum = approvedRequests.reduce((acc, r) => {
    if (r.repaymentType === 'lump_sum') {
      return acc + (r.deductionMonth === currentMonthStr ? r.emi : 0)
    }
    return acc + (r.emi || 0)
  }, 0)

  // Real, company-wide recovery ledger derived from actual approved advances
  const recoveryLedger = useMemo(() => {
    const today = new Date()
    const rows = []
    approvedRequests.forEach(r => {
      if (!r.disbursedDate) return
      rows.push({ key: `${r.id}-disb`, date: r.disbursedDate, description: `Advance Disbursed (${r.employee.name})`, amount: r.amount, type: 'Credit' })

      if (r.repaymentType === 'lump_sum') {
        if (!r.deductionMonth) return
        const [y, m] = r.deductionMonth.split('-').map(Number)
        const monthDate = new Date(y, m - 1, 5)
        if (monthDate <= today) {
          rows.push({ key: `${r.id}-lump`, date: monthDate.toISOString(), description: `Full Deduction Recovery (${r.employee.name})`, amount: r.emi, type: 'Debit' })
        }
        return
      }

      if (!r.tenure) return
      const start = new Date(r.disbursedDate)
      for (let i = 0; i < r.tenure; i++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + i + 1, 5)
        if (monthDate <= today) {
          rows.push({ key: `${r.id}-emi-${i}`, date: monthDate.toISOString(), description: `EMI Recovery (${r.employee.name})`, amount: r.emi, type: 'Debit' })
        }
      }
    })
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [approvedRequests])

  const totalRecoveredYtd = recoveryLedger.filter(t => t.type === 'Debit').reduce((s, t) => s + t.amount, 0)

  const filteredRequests = requests.filter((req) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      req.displayId.toLowerCase().includes(query) ||
      req.reason.toLowerCase().includes(query) ||
      req.employee.name.toLowerCase().includes(query) ||
      req.employee.empId?.toLowerCase().includes(query)

    if (activeTab === 'Pending Approvals') return matchesSearch && req.status === 'pending'
    if (activeTab === 'Approved Advances') return matchesSearch && req.status === 'approved'
    if (activeTab === 'Rejected Requests') return matchesSearch && req.status === 'rejected'

    const matchesStatus = statusFilter === 'All' || req.status === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedRequests = filteredRequests.slice((safeCurrentPage - 1) * ITEMS_PER_PAGE, safeCurrentPage * ITEMS_PER_PAGE)

  const handleApproveRequest = (reqId) => {
    approveMutation.mutate(
      { id: reqId, approved_by: user?.emp_id },
      {
        onSuccess: () => {
          toast.success(`Advance request approved successfully by HR!`)
          setSelectedRequest(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve request'),
      }
    )
  }

  const handleRejectRequest = (reqId) => {
    const reason = window.prompt('Reason for rejection:')
    if (!reason) return
    rejectMutation.mutate(
      { id: reqId, approved_by: user?.emp_id, rejection_reason: reason },
      {
        onSuccess: () => {
          toast.error(`Advance request rejected.`)
          setSelectedRequest(null)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject request'),
      }
    )
  }

  const handleExportReport = () => toast.success('Exporting Company Advance Report (Excel/CSV)...')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
            <span>Home</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">Salary Advance Management</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Salary Advance Management</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> HR Portal
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">Manage employee advance applications and process HR decisions.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setIsPolicyModalOpen(true)} className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors">
            <ShieldCheck className="h-4 w-4 text-gray-600" /> Advance Policy
          </button>
          <button onClick={handleExportReport} className="inline-flex items-center gap-2 rounded-sm bg-gray-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-2xs hover:bg-gray-800 active:scale-[0.98] transition-all">
            <Download className="h-4 w-4" /> Export Advance Sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Advance Disbursed', value: fmtMoney(approvedSum), sub: `${approvedCount} Approved Requests`, icon: <Wallet className="h-4 w-4" />, iconBg: 'bg-slate-900 text-white', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200', tab: 'Approved Advances' },
          { label: 'Pending HR Review', value: fmtMoney(pendingSum), sub: `${pendingCount} Awaiting Decision`, icon: <Clock className="h-4 w-4" />, iconBg: 'bg-amber-500 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 font-bold', tab: 'Pending Approvals' },
          { label: 'Total Requests Processed', value: `${requests.length} Requests`, sub: `${approvedCount} Done · ${rejectedCount} Rejected`, icon: <Users className="h-4 w-4" />, iconBg: 'bg-emerald-600 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200', tab: 'All Employee Requests' },
          { label: 'Active Monthly Recovery', value: fmtMoney(activeRecoverySum), sub: `Across ${approvedCount} Active Plans`, icon: <CreditCard className="h-4 w-4" />, iconBg: 'bg-blue-600 text-white', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200', tab: 'Disbursal & Repayment Ledger' },
        ].map((card) => (
          <div key={card.label} onClick={() => { if (card.tab) { setActiveTab(card.tab); setCurrentPage(1) } }} className={cx('flex flex-col justify-between rounded-lg border p-3.5 min-h-[110px] shadow-2xs hover:shadow-2xs hover:-translate-y-0.5 cursor-pointer transition-all duration-150 group bg-white', activeTab === card.tab ? 'border-gray-950 ring-1 ring-gray-950/15' : 'border-gray-200 hover:border-gray-300')}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{card.label}</span>
              <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
            </div>
            <div className="my-1"><h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-tight">{card.value}</h2></div>
            <div className="flex items-center">
              <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium border leading-normal', card.badgeBg)}>
                <span className="h-1 w-1 rounded-full bg-current opacity-70" />{card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4 overflow-x-auto">
          {['All Employee Requests', 'Pending Approvals', 'Approved Advances', 'Rejected Requests', 'Disbursal & Repayment Ledger', 'Policy Guidelines'].map((tab) => {
            let badge = null
            if (tab === 'Pending Approvals' && pendingCount > 0) badge = <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">{pendingCount}</span>
            else if (tab === 'All Employee Requests') badge = <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">{requests.length}</span>
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1) }} className={cx('whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors duration-150 flex items-center gap-2', activeTab === tab ? 'border-gray-950 text-gray-950' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300')}>
                {tab}{badge}
              </button>
            )
          })}
        </nav>
      </div>

      {(activeTab === 'All Employee Requests' || activeTab === 'Pending Approvals' || activeTab === 'Approved Advances' || activeTab === 'Rejected Requests') && (
        <>
          {activeTab === 'Pending Approvals' && pendingCount > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white font-bold shadow-2xs"><UserCheck className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Pending Advance Applications Awaiting HR Action</h3>
                  <p className="text-xs text-amber-800">Review and click Approve or Reject to process the request directly.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-sm border border-amber-200 shadow-2xs">{pendingCount} Pending Decisions Required</span>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  {activeTab === 'Pending Approvals' ? 'Pending Requests Awaiting Decision' :
                   activeTab === 'Approved Advances' ? 'Approved Advance Disbursals' :
                   activeTab === 'Rejected Requests' ? 'Rejected Applications' : 'All Employee Advance Requests'}
                </h2>
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-700">{filteredRequests.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search employee, ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="w-64 rounded-md border border-gray-300 bg-white pl-9 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-gray-600 focus:outline-hidden shadow-2xs" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>}
                </div>
                {activeTab === 'All Employee Requests' && (
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-gray-600 focus:outline-hidden shadow-2xs">
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-gray-500">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Request ID</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Employee</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Reason</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Repayment Plan</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Approved By</th>
                    <th className="py-3.5 px-6 font-semibold uppercase tracking-wider text-xs text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && <tr><td colSpan="9" className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>}
                  {!isLoading && paginatedRequests.map((req) => (
                    <tr key={req.id} data-hl={req.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap"><span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-sm border border-gray-200">{req.displayId}</span></td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar name={req.employee.name} src={req.employee.photo} size="xs" />
                          <div>
                            <p className="text-xs font-bold text-gray-900 leading-none">{req.employee.name}</p>
                            <p className="text-[11px] text-gray-500 mt-1">{req.employee.designation} · {req.employee.empId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap text-xs">{fmtDate(req.date)}</td>
                      <td className="py-4 px-6 whitespace-nowrap"><span className="font-extrabold text-gray-950 text-sm">{fmtMoney(req.amount)}</span></td>
                      <td className="py-4 px-6 text-gray-700 text-xs whitespace-nowrap">{req.reason}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-xs">
                        {req.repaymentType === 'lump_sum' ? (
                          <span className="font-semibold text-gray-800">Full deduction · {req.deductionMonth ? new Date(req.deductionMonth + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span>
                        ) : (
                          <span className="font-semibold text-gray-800">EMI · {req.tenure} mo · {fmtMoney(req.emi)}/mo</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap"><LocalStatusPill status={req.status} /></td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {req.approvedBy ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={req.approvedBy.name} size="xs" />
                            <div>
                              <p className="text-xs font-semibold text-gray-900 leading-none">{req.approvedBy.name}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{req.approvedBy.role}</p>
                            </div>
                          </div>
                        ) : <span className="text-gray-300 text-xs pl-2">—</span>}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {req.status === 'pending' ? (
                            <>
                              <button onClick={() => handleApproveRequest(req.id)} title="HR Action: Approve" className="inline-flex h-8 px-3.5 items-center justify-center gap-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs active:scale-95 transition-all">
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button onClick={() => handleRejectRequest(req.id)} title="HR Action: Reject" className="inline-flex h-8 px-3.5 items-center justify-center gap-1.5 rounded-sm bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold shadow-2xs active:scale-95 transition-all">
                                <X className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setSelectedRequest(req)} title="View Details" className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 transition-all shadow-2xs">
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          {activeTab === 'Pending Approvals' ? (
                            <>
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
                              <p className="text-sm font-bold text-gray-800">All Caught Up!</p>
                              <p className="text-xs text-gray-400 max-w-sm">There are no pending salary advance requests requiring HR decision.</p>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-9 w-9 text-gray-300" />
                              <p className="text-xs font-medium">No advance requests found</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredRequests.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 border-t border-gray-100 bg-gray-50/60">
                <span className="text-xs text-gray-500">
                  Showing <strong className="text-gray-700 font-semibold">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-700 font-semibold">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredRequests.length)}</strong> of <strong className="text-gray-700 font-semibold">{filteredRequests.length}</strong> requests
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"><ChevronLeft className="h-4 w-4" /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={cx('h-8 min-w-[32px] px-2 rounded-sm text-xs font-bold transition-all shadow-2xs', safeCurrentPage === pageNum ? 'bg-gray-950 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100')}>{pageNum}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <InteractiveAdvanceSummaryCard requests={requests} />

            <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-sm bg-slate-900 text-white"><TrendingUp className="h-4 w-4" /></span>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payroll Recovery Health</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Monthly EMI Inflow', value: fmtMoney(activeRecoverySum), sub: 'Automated salary payroll debit', icon: <Wallet className="h-4 w-4" />, accent: 'bg-gray-950 text-white', bg: 'bg-gray-50/80 border-gray-200' },
                    { label: 'Total Recovered', value: fmtMoney(totalRecoveredYtd), sub: 'From past payroll cycles', icon: <CheckCircle2 className="h-4 w-4" />, accent: 'bg-emerald-600 text-white', bg: 'bg-emerald-50/70 border-emerald-200' },
                    { label: 'Active Open Advances', value: `${approvedCount} Employees`, sub: 'Active recovery plans', icon: <Users className="h-4 w-4" />, accent: 'bg-amber-500 text-white', bg: 'bg-amber-50/70 border-amber-200' },
                  ].map((item) => (
                    <div key={item.label} className={cx('group flex items-center gap-3.5 rounded-sm border p-3 transition-all duration-150', item.bg)}>
                      <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-transform group-hover:scale-105', item.accent)}>{item.icon}</span>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider leading-none">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate">{item.sub}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-950">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-sm bg-slate-900 text-white"><CreditCard className="h-4 w-4" /></span>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recent Disbursals</h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {recoveryLedger.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">No disbursal activity yet.</p>}
                  {recoveryLedger.slice(0, 6).map((tx) => (
                    <div key={tx.key} className="flex items-center justify-between py-3 px-1 rounded-sm hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-transform group-hover:scale-110', tx.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}>
                          <ArrowUpRight className={cx('h-4 w-4', tx.type === 'Debit' ? 'rotate-180' : '')} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-none">{tx.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{fmtDate(tx.date)}</p>
                        </div>
                      </div>
                      <p className={cx('text-xs sm:text-sm font-bold', tx.type === 'Credit' ? 'text-emerald-700' : 'text-blue-700')}>
                        {tx.type === 'Credit' ? '+' : '-'}{fmtMoney(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Disbursal & Repayment Ledger' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Company Disbursals</p>
              <h3 className="text-2xl font-bold text-gray-950">{fmtMoney(approvedSum)}</h3>
              <p className="text-xs text-gray-400 mt-1.5">Cumulative Across All Approved Advances</p>
            </div>
            <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Recovered via Payroll</p>
              <h3 className="text-2xl font-bold text-emerald-700">{fmtMoney(totalRecoveredYtd)}</h3>
              <p className="text-xs text-gray-400 mt-1.5">Computed from EMI schedule</p>
            </div>
            <div className="rounded-sm border border-gray-200 bg-white p-5 shadow-2xs">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Active Monthly Recovery</p>
              <h3 className="text-2xl font-bold text-blue-700">{fmtMoney(activeRecoverySum)}</h3>
              <p className="text-xs text-gray-400 mt-1.5">Expected in upcoming payroll cycle</p>
            </div>
          </div>

          <div className="rounded-sm border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Company-Wide Advance Ledger</h3>
              <button onClick={handleExportReport} className="inline-flex items-center gap-1.5 rounded-sm border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100">
                <Download className="h-3.5 w-3.5" /> Export Ledger CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Request ID</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Tenure</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((item) => (
                    <tr key={item.id} data-hl={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-xs">{item.displayId}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900">{item.employee.name}</span>
                        <span className="text-gray-400 text-[11px] block">{item.employee.designation}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs">{fmtDate(item.date)}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-950 text-sm">{fmtMoney(item.amount)}</td>
                      <td className="py-3.5 px-4 text-gray-600 text-xs">{item.reason}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">{item.tenure} Month(s)</td>
                      <td className="py-3.5 px-4"><LocalStatusPill status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Policy Guidelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 rounded-lg border border-gray-200 bg-white p-6 shadow-2xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-950">Organizational Salary Advance Policy</h3>
              <p className="text-xs text-gray-500 mt-1">HR Compliance Manual & Advance Disbursal Framework</p>
            </div>
            <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
              {[
                ['1. Advance Limits', "The maximum advance allowed is 80% of the employee's monthly basic salary."],
                ['2. Repayment & Tenure', 'Deductions are scheduled automatically via salary payroll EMI across 1 to 6 monthly installments.'],
                ['3. HR Approval Authority', 'HR administrators review the request and approve or reject it directly.'],
                ['4. Interest', 'Zero interest is charged on salary advances.'],
              ].map(([title, body]) => (
                <div key={title} className="p-4 rounded-md border border-gray-100 bg-gray-50/70">
                  <h4 className="font-bold text-gray-900 text-xs mb-1">{title}</h4>
                  <p className="text-gray-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">Approval Workflow</h3>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Employee Application', desc: 'Employee submits advance request with reason and tenure.' },
                  { step: 2, title: 'HR Review', desc: 'HR/Admin reviews and approves or rejects the request.' },
                  { step: 3, title: 'Payroll EMI Deduction', desc: 'On approval, monthly payroll recovery begins automatically.' },
                ].map((step, idx, arr) => (
                  <div key={step.step} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 bg-gray-950 text-white border-gray-950">{step.step}</span>
                      {idx < arr.length - 1 && <span className="w-px my-1 bg-gray-800" style={{ minHeight: '20px' }} />}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-xs font-bold leading-tight text-gray-900">{step.title}</p>
                      <p className="text-xs text-gray-500 leading-snug mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2.5">Key Parameters</h3>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-100"><span>Interest Rate</span><span className="font-bold text-emerald-600">0% (Zero Interest)</span></div>
                <div className="flex justify-between py-1 border-b border-gray-100"><span>Max Basic Salary Cap</span><span className="font-bold text-gray-900">80%</span></div>
                <div className="flex justify-between py-1"><span>Repayment Tenure</span><span className="font-bold text-gray-900">1–6 Months</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isPolicyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs" onClick={() => setIsPolicyModalOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }} className="w-full max-w-md rounded-sm border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gray-700" /><h3 className="text-base font-bold text-gray-950">Salary Advance Policy</h3></div>
                <button onClick={() => setIsPolicyModalOpen(false)} className="rounded-sm p-1 text-gray-400 hover:bg-gray-200 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-3.5 text-xs text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                {[
                  ['1. Maximum Limit', "The maximum advance amount is capped at 80% of the employee's monthly basic salary."],
                  ['2. Repayment Tenure', 'Repayments are automatically deducted via salary EMI over 1 to 6 months.'],
                  ['3. Approval', 'Requests are reviewed and approved directly by HR/Admin.'],
                  ['4. Disbursal', 'Once approved, the advance is marked disbursed and EMI deductions begin the following month.'],
                ].map(([title, body]) => (
                  <p key={title}><strong className="font-bold text-gray-900">{title}</strong> — {body}</p>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 text-right">
                <button onClick={() => setIsPolicyModalOpen(false)} className="rounded-sm bg-gray-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors">Got It</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs" onClick={() => setSelectedRequest(null)}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }} className="w-full max-w-md rounded-sm border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div><h3 className="text-base font-bold text-gray-950">Employee Advance Details</h3><p className="text-xs font-mono text-gray-500 mt-0.5">{selectedRequest.displayId}</p></div>
                <button onClick={() => setSelectedRequest(null)} className="rounded-sm p-1 text-gray-400 hover:bg-gray-200 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 divide-y divide-gray-100 text-xs">
                {[
                  ['Employee', `${selectedRequest.employee.name} (${selectedRequest.employee.designation})`],
                  ['Employee ID', selectedRequest.employee.empId || '—'],
                  ['Request Date', fmtDate(selectedRequest.date)],
                  ['Advance Amount', fmtMoney(selectedRequest.amount)],
                  ['Reason', selectedRequest.reason],
                  ...(selectedRequest.repaymentType === 'lump_sum'
                    ? [
                        ['Repayment Plan', 'Full Deduction'],
                        ['Deduction Month', selectedRequest.deductionMonth ? new Date(selectedRequest.deductionMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'],
                      ]
                    : [
                        ['Repayment Plan', 'EMI'],
                        ['Tenure', `${selectedRequest.tenure} Month(s)`],
                        ['Monthly EMI', `${fmtMoney(selectedRequest.emi)} / month`],
                      ]),
                  ...(selectedRequest.approvedBy ? [['Approver', `${selectedRequest.approvedBy.name} · ${selectedRequest.approvedBy.role}`]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="font-semibold text-gray-900 text-right">{val}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3"><span className="text-gray-500 font-medium">Status</span><LocalStatusPill status={selectedRequest.status} /></div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => setSelectedRequest(null)} className="ml-auto rounded-sm border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
