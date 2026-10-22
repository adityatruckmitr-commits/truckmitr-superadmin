import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FileText,
  ShieldCheck,
  Hourglass,
  Archive,
  Users,
  Plus,
  Search,
  Download,
  Eye,
  ChevronRight,
  Clock,
  Plane,
  Home,
  Shield,
  Lock,
  Briefcase,
  UserCheck,
  X,
  Upload,
  CheckCircle2,
  Layers,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { Avatar, cx } from '../components/ui'
import { usePolicies, usePolicyDetail, useCreatePolicy } from '../hooks/usePolicies'
import FileUpload from '../components/FileUpload'

const CATEGORY_ICONS = {
  Attendance: { icon: Clock, iconBg: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200', pill: 'text-purple-600 bg-purple-50' },
  Leave: { icon: Plane, iconBg: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', pill: 'text-emerald-600 bg-emerald-50' },
  'Work Arrangement': { icon: Home, iconBg: 'bg-amber-100 text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200', pill: 'text-amber-600 bg-amber-50' },
  'Code of Conduct': { icon: Shield, iconBg: 'bg-blue-100 text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200', pill: 'text-blue-600 bg-blue-50' },
  'Information Security': { icon: Lock, iconBg: 'bg-rose-100 text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200', pill: 'text-rose-600 bg-rose-50' },
  Travel: { icon: Briefcase, iconBg: 'bg-orange-100 text-orange-600', badge: 'bg-orange-50 text-orange-700 border-orange-200', pill: 'text-orange-600 bg-orange-50' },
  'Employee Policy': { icon: UserCheck, iconBg: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', pill: 'text-cyan-600 bg-cyan-50' },
}
const DEFAULT_CATEGORY_STYLE = { icon: Layers, iconBg: 'bg-slate-100 text-slate-600', badge: 'bg-slate-100 text-slate-700 border-slate-200', pill: 'text-slate-600 bg-slate-50' }
const categoryStyle = (cat) => CATEGORY_ICONS[cat] || DEFAULT_CATEGORY_STYLE

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtSize = (bytes) => {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}
const statusLabel = { active: 'Active', under_review: 'Under Review', archived: 'Archived' }

function AddPolicyModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ title: '', category: 'Attendance', effectiveDate: new Date().toISOString().split('T')[0], description: '' })
  const [file, setFile] = useState(null)
  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a policy title')
      return
    }
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('category', form.category)
    fd.append('effective_date', form.effectiveDate)
    fd.append('description', form.description)
    if (file) fd.append('document', file)
    onSubmit(fd)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
          <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h2 className="text-base font-bold text-gray-950">Publish New Company Policy</h2></div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Policy Title <span className="text-rose-500">*</span></label>
            <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Remote Work & Security Policy" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">
                {Object.keys(CATEGORY_ICONS).map((c) => <option key={c}>{c}</option>)}
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Effective Date</label>
              <input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Policy Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief summary of policy expectations..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Policy Document (PDF)</label>
            <FileUpload file={file} onFileChange={setFile} onFileRemove={() => setFile(null)} accept=".pdf,.doc,.docx" maxSize={10} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs disabled:opacity-60">
              {isSubmitting ? 'Publishing…' : 'Publish Policy'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function HRPolicies() {
  const { user } = useAuth()
  const { data: rawPolicies, isLoading } = usePolicies()
  const createPolicy = useCreatePolicy()

  const [activeTab, setActiveTab] = useState('All Policies')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [previewPolicy, setPreviewPolicy] = useState(null)
  const [ackStatusPolicyId, setAckStatusPolicyId] = useState(null)

  const { data: ackDetail } = usePolicyDetail(ackStatusPolicyId)

  const policies = Array.isArray(rawPolicies) ? rawPolicies : []

  const policyCategories = useMemo(() => {
    const map = {}
    policies.forEach(p => { map[p.category] = (map[p.category] || 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count, ...categoryStyle(name) }))
  }, [policies])

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    let matchesTab = true
    if (activeTab === 'Active') matchesTab = p.status === 'active'
    if (activeTab === 'Under Review') matchesTab = p.status === 'under_review'
    if (activeTab === 'Archived') matchesTab = p.status === 'archived'
    const matchesCategory = categoryFilter === 'All Categories' || p.category === categoryFilter
    const matchesStatus = statusFilter === 'All Status' || statusLabel[p.status] === statusFilter
    return matchesSearch && matchesTab && matchesCategory && matchesStatus
  })

  const ITEMS_PER_PAGE = 8
  const paginatedPolicies = filteredPolicies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalPolicies = policies.length
  const activeCount = policies.filter(p => p.status === 'active').length
  const underReviewCount = policies.filter(p => p.status === 'under_review').length
  const archivedCount = policies.filter(p => p.status === 'archived').length
  const overallAckPct = totalPolicies > 0 ? Math.round(policies.reduce((s, p) => s + p.acknowledged_pct, 0) / totalPolicies) : 0

  const recentUpdates = [...policies].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4)

  const handleCreatePolicy = (formData) => {
    formData.append('created_by', user?.emp_id || '')
    createPolicy.mutate(formData, {
      onSuccess: () => { toast.success('Policy published successfully!'); setIsAddModalOpen(false) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to publish policy'),
    })
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
            <span>Home</span><ChevronRight className="h-3.5 w-3.5 text-gray-400" /><span className="text-gray-800 font-semibold">All Policies</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Policies</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"><ShieldCheck className="h-3.5 w-3.5" /> HR Management</span>
          </div>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all">
          <Plus className="h-4.5 w-4.5" /> Add New Policy
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Policies', value: `${totalPolicies}`, sub: 'Published Policies', icon: <FileText className="h-4.5 w-4.5 text-blue-600" />, iconBg: 'bg-blue-50 border-blue-100' },
          { label: 'Active Policies', value: `${activeCount}`, sub: 'Currently Active', icon: <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />, iconBg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Under Review', value: `${underReviewCount}`, sub: 'Awaiting Review', icon: <Hourglass className="h-4.5 w-4.5 text-amber-600" />, iconBg: 'bg-amber-50 border-amber-100' },
          { label: 'Archived Policies', value: `${archivedCount}`, sub: 'No Longer Active', icon: <Archive className="h-4.5 w-4.5 text-purple-600" />, iconBg: 'bg-purple-50 border-purple-100' },
          { label: 'Acknowledged', value: `${overallAckPct}%`, sub: 'By Employees', icon: <Users className="h-4.5 w-4.5 text-cyan-600" />, iconBg: 'bg-cyan-50 border-cyan-100' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
              <h2 className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight">{card.value}</h2>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-2 overflow-x-auto">
              {['All Policies', 'Active', 'Under Review', 'Archived'].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1) }} className={cx('whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors', activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300')}>{tab}</button>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50/60">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search policies by name or keyword..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden" />
                </div>
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:outline-hidden cursor-pointer">
                  <option value="All Categories">All Categories</option>
                  {policyCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:border-blue-500 focus:outline-hidden cursor-pointer">
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-600">
                  <tr>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Policy Name</th>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Effective Date</th>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Last Updated</th>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                    <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && <tr><td colSpan="6" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                  {!isLoading && paginatedPolicies.map((pol) => {
                    const style = categoryStyle(pol.category)
                    const IconComp = style.icon
                    return (
                      <tr key={pol.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg border shrink-0', style.iconBg)}><IconComp className="h-4 w-4" /></span>
                            <div><p className="text-xs font-bold text-gray-900 leading-tight">{pol.title}</p><p className="text-[11px] text-gray-500 mt-0.5 max-w-[220px] truncate">{pol.description}</p></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap"><span className={cx('inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border', style.badge)}>{pol.category}</span></td>
                        <td className="py-3.5 px-5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(pol.effective_date)}</td>
                        <td className="py-3.5 px-5 whitespace-nowrap"><p className="text-xs font-semibold text-gray-900">{fmtDate(pol.updated_at)}</p><p className="text-[10px] text-gray-400">{pol.updated_by || '—'}</p></td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className={cx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                            pol.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            pol.status === 'under_review' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200')}>
                            <span className={cx('h-1.5 w-1.5 rounded-full', pol.status === 'active' ? 'bg-emerald-500' : pol.status === 'under_review' ? 'bg-amber-500' : 'bg-gray-400')} />
                            {statusLabel[pol.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button onClick={() => setPreviewPolicy(pol)} title="View" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs"><Eye className="h-3.5 w-3.5" /></button>
                            {pol.file_url ? (
                              <a href={pol.file_url} target="_blank" rel="noreferrer" title="Download PDF" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs"><Download className="h-3.5 w-3.5" /></a>
                            ) : (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-100 bg-gray-50 text-gray-300"><Download className="h-3.5 w-3.5" /></span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!isLoading && filteredPolicies.length === 0 && (
                    <tr><td colSpan="6" className="py-14 text-center text-gray-400">No policies found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredPolicies.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 text-xs">
                <span className="text-gray-500">Showing {paginatedPolicies.length} of {filteredPolicies.length} policies</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Policy Categories</h3>
            <div className="space-y-2 text-xs">
              {policyCategories.length === 0 && <p className="text-gray-400">No categories yet.</p>}
              {policyCategories.map((cat) => {
                const IconComp = cat.icon
                return (
                  <div key={cat.name} onClick={() => { setCategoryFilter(categoryFilter === cat.name ? 'All Categories' : cat.name); setCurrentPage(1) }} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-300 transition-all cursor-pointer">
                    <div className="flex items-center gap-2.5"><span className={cx('flex h-7 w-7 items-center justify-center rounded-md border', cat.pill)}><IconComp className="h-3.5 w-3.5" /></span><span className="font-semibold text-gray-800">{cat.name}</span></div>
                    <span className="font-bold text-gray-900 px-2 py-0.5 rounded-sm bg-gray-200/60 text-xs">{cat.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Recent Updates</h3>
            <div className="space-y-3 text-xs">
              {recentUpdates.length === 0 && <p className="text-gray-400">No policies published yet.</p>}
              {recentUpdates.map((p) => (
                <div key={p.id} className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0 last:pb-0">
                  <Avatar name={p.updated_by || 'HR'} size="xs" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 leading-tight">{p.updated_by || 'HR'} <span className="font-normal text-gray-500">updated {p.title}</span></p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(p.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs"><ShieldCheck className="h-4.5 w-4.5" /></span><h3 className="text-base font-bold text-gray-950">Policy Acknowledgement</h3></div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">Employees must acknowledge policies to confirm they have read and understood them.</p>
            <button onClick={() => setAckStatusPolicyId(policies[0]?.id)} disabled={policies.length === 0} className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-700 font-bold text-xs border border-blue-200 shadow-2xs hover:bg-blue-100/80 transition-all text-center disabled:opacity-50">
              View Acknowledgement Status
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && <AddPolicyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleCreatePolicy} isSubmitting={createPolicy.isPending} />}
      </AnimatePresence>

      <AnimatePresence>
        {previewPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setPreviewPolicy(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={cx('flex h-9 w-9 items-center justify-center rounded-lg border', categoryStyle(previewPolicy.category).iconBg)}><FileText className="h-4.5 w-4.5" /></span>
                  <div><h2 className="text-base font-bold text-gray-950">{previewPolicy.title}</h2><p className="text-xs text-gray-500">{previewPolicy.category} · Effective {fmtDate(previewPolicy.effective_date)}</p></div>
                </div>
                <button onClick={() => setPreviewPolicy(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs leading-relaxed text-gray-700">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 font-medium">
                  <strong>Policy Overview:</strong> {previewPolicy.description || 'No description provided.'}
                </div>
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <p>Published by: <strong>{previewPolicy.created_by || '—'}</strong></p>
                  <p>Last revised by: <strong>{previewPolicy.updated_by || '—'}</strong> on {fmtDate(previewPolicy.updated_at)}</p>
                  {!previewPolicy.file_url && <p className="text-amber-600">No document has been uploaded for this policy yet.</p>}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50">
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Employee Acknowledgement: {previewPolicy.acknowledged_pct}% ({previewPolicy.acknowledged_count})</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPreviewPolicy(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100">Close</button>
                  {previewPolicy.file_url && (
                    <a href={previewPolicy.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Download ({fmtSize(previewPolicy.file_size)})
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ackStatusPolicyId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setAckStatusPolicyId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-base font-bold text-gray-950">Acknowledgement Compliance</h2></div>
                <button onClick={() => setAckStatusPolicyId(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <select value={ackStatusPolicyId} onChange={(e) => setAckStatusPolicyId(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 focus:border-blue-500 focus:outline-hidden">
                    {policies.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                {ackDetail && (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between">
                      <span>Acknowledgements Received</span>
                      <span className="text-base font-extrabold">{ackDetail.acknowledgements?.length || 0}</span>
                    </div>
                    <div className="space-y-2 pt-2 max-h-64 overflow-y-auto">
                      <p className="font-bold text-gray-900">Employee Sign-offs:</p>
                      {(ackDetail.acknowledgements || []).length === 0 && <p className="text-gray-400">No one has acknowledged this policy yet.</p>}
                      {(ackDetail.acknowledgements || []).map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                          <div><p className="font-bold text-gray-900">{a.employee?.full_name || a.employee_id}</p></div>
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-100 text-emerald-800">Acknowledged ({fmtDate(a.acknowledged_at)})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
