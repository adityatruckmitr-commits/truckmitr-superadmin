import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FileText,
  ShieldCheck,
  Clock,
  Plane,
  Home,
  Shield,
  Lock,
  Briefcase,
  UserCheck,
  Search,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react-teleadmin'
import { useNavigate } from '@hrms/router'
import { useAuth } from '../context/AuthContext'
import { cx } from '../components/ui'
import { usePolicies, useAcknowledgePolicy } from '../hooks/usePolicies'

const CATEGORY_ICONS = {
  Attendance: { icon: Clock, iconBg: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  Leave: { icon: Plane, iconBg: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Work Arrangement': { icon: Home, iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Code of Conduct': { icon: Shield, iconBg: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Information Security': { icon: Lock, iconBg: 'bg-rose-100 text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  Travel: { icon: Briefcase, iconBg: 'bg-orange-100 text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Employee Policy': { icon: UserCheck, iconBg: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
}
const DEFAULT_STYLE = { icon: Layers, iconBg: 'bg-slate-100 text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
const categoryStyle = (cat) => CATEGORY_ICONS[cat] || DEFAULT_STYLE

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtSize = (bytes) => {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export default function EmployeePolicies() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: rawPolicies, isLoading } = usePolicies()
  const acknowledgeMutation = useAcknowledgePolicy()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [readingPolicy, setReadingPolicy] = useState(null)

  const policies = (Array.isArray(rawPolicies) ? rawPolicies : []).filter(p => p.status !== 'archived')
  const categories = useMemo(() => ['All', ...new Set(policies.map(p => p.category))], [policies])

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    const matchesCat = activeCategory === 'All' || p.category === activeCategory
    return matchesQuery && matchesCat
  })

  const handleAcknowledge = (policyId) => {
    acknowledgeMutation.mutate({ id: policyId, employee_id: user?.emp_id }, {
      onSuccess: () => { toast.success('Policy acknowledged successfully!'); setReadingPolicy(null) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to acknowledge'),
    })
  }

  const acknowledgedCount = policies.filter(p => p.my_acknowledged).length
  const pendingCount = policies.length - acknowledgedCount
  const compliancePct = policies.length > 0 ? Math.round((acknowledgedCount / policies.length) * 100) : 0
  const lastRevised = [...policies].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
            <span>Home</span><ChevronRight className="h-3.5 w-3.5 text-gray-400" /><span className="text-gray-800 font-semibold">My Policies</span>
          </nav>
          <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Company Policies & Guidelines</h1>
          <p className="mt-1 text-sm text-gray-500">Read and acknowledge official company policies, codes of conduct, and guidelines.</p>
        </div>
        {pendingCount > 0 && (
          <button onClick={() => setReadingPolicy(policies.find(p => !p.my_acknowledged))} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition-all">
            <AlertCircle className="h-4.5 w-4.5" /> {pendingCount} Policy Acknowledgement Pending
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Policies', value: `${policies.length}`, sub: 'Published Guidelines', icon: <FileText className="h-4.5 w-4.5 text-blue-600" />, iconBg: 'bg-blue-50 border-blue-100' },
          { label: 'My Acknowledged', value: `${acknowledgedCount} / ${policies.length}`, sub: `${compliancePct}% Compliance Rate`, icon: <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />, iconBg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Pending Review', value: `${pendingCount} Required`, sub: pendingCount > 0 ? 'Requires Action' : 'All Up to Date', icon: <AlertCircle className="h-4.5 w-4.5 text-amber-600" />, iconBg: 'bg-amber-50 border-amber-100' },
          { label: 'Last Revised Policy', value: lastRevised ? lastRevised.title : '—', sub: lastRevised ? `Effective ${fmtDate(lastRevised.effective_date)}` : 'No policies yet', icon: <Clock className="h-4.5 w-4.5 text-purple-600" />, iconBg: 'bg-purple-50 border-purple-100' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
              <h2 className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight truncate max-w-[180px]">{card.value}</h2>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search policy name or keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden shadow-2xs" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={cx('px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all', activeCategory === cat ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading && <p className="text-sm text-gray-400 text-center py-10">Loading…</p>}
            {!isLoading && filteredPolicies.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No policies found.</p>}
            {filteredPolicies.map((pol) => {
              const style = categoryStyle(pol.category)
              const IconComp = style.icon
              const isAck = pol.my_acknowledged
              return (
                <div key={pol.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4 hover:border-gray-300 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 mt-0.5', style.iconBg)}><IconComp className="h-5 w-5" /></span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-950">{pol.title}</h3>
                          <span className={cx('px-2 py-0.5 rounded-sm text-[11px] font-semibold border', style.badge)}>{pol.category}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pol.description}</p>
                      </div>
                    </div>
                    <span className={cx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0', isAck ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                      {isAck ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {isAck ? 'Acknowledged' : 'Action Required'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                    <div className="text-gray-500 flex items-center gap-3">
                      <span>Effective: <strong>{fmtDate(pol.effective_date)}</strong></span>
                      {pol.file_size && <><span>•</span><span>PDF Size: <strong>{fmtSize(pol.file_size)}</strong></span></>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setReadingPolicy(pol)} className={cx('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all', isAck ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                        <Eye className="h-3.5 w-3.5" /> {isAck ? 'Read Policy' : 'Read & Acknowledge'}
                      </button>
                      {pol.file_url ? (
                        <a href={pol.file_url} target="_blank" rel="noreferrer" title="Download PDF" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs"><Download className="h-3.5 w-3.5" /></a>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-300"><Download className="h-3.5 w-3.5" /></span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Acknowledgement Compliance</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold"><span className="text-gray-600">Completion Score</span><span className="text-blue-600 font-bold">{compliancePct}%</span></div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${compliancePct}%` }} /></div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">You have completed <strong>{acknowledgedCount}</strong> out of <strong>{policies.length}</strong> required policy acknowledgements.</p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5"><HelpCircle className="h-5 w-5 text-blue-600" /><h3 className="text-base font-bold text-gray-950">Questions about Policies?</h3></div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">If you have questions regarding remote work rules, leave entitlement, or expenses, reach out to the HR team via the Helpdesk.</p>
            <button onClick={() => navigate('/helpdesk')} className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-all text-center">Contact HR Helpdesk</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {readingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setReadingPolicy(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg border', categoryStyle(readingPolicy.category).iconBg)}><FileText className="h-4.5 w-4.5" /></span>
                  <div><h2 className="text-base font-bold text-gray-950">{readingPolicy.title}</h2><p className="text-xs text-gray-500">{readingPolicy.category} · Effective {fmtDate(readingPolicy.effective_date)}</p></div>
                </div>
                <button onClick={() => setReadingPolicy(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs leading-relaxed text-gray-700">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 font-medium">
                  <strong>Policy Summary:</strong> {readingPolicy.description || 'No description provided.'}
                </div>
                {!readingPolicy.file_url && (
                  <p className="text-amber-600">No document has been uploaded for this policy yet — contact HR if you need the full text.</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50 gap-3">
                {readingPolicy.my_acknowledged ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />You have acknowledged this policy</span>
                ) : (
                  <button onClick={() => handleAcknowledge(readingPolicy.id)} disabled={acknowledgeMutation.isPending} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-60">
                    <CheckCircle2 className="h-4 w-4" /> {acknowledgeMutation.isPending ? 'Submitting…' : 'I Have Read & Acknowledge This Policy'}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={() => setReadingPolicy(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100">Close</button>
                  {readingPolicy.file_url && (
                    <a href={readingPolicy.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-800 hover:bg-gray-50 shadow-2xs flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> PDF ({fmtSize(readingPolicy.file_size)})
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
