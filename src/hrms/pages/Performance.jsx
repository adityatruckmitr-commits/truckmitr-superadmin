import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  CheckCircle2,
  Star,
  Award,
  Plus,
  MoreVertical,
  BarChart2,
  X,
  Sparkles,
  Eye,
  Copy,
  Trash2,
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useDepartments } from '../hooks/useEmployees'
import {
  useReviewCycles,
  useCreateReviewCycle,
  useCompleteReviewCycle,
  useDeleteReviewCycle,
  usePerformanceStats,
  usePerformanceTopPerformers,
} from '../hooks/usePerformance'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

const RATING_LABELS = { 5: '5 - Outstanding', 4: '4 - Exceeds Exp.', 3: '3 - Meets Exp.', 2: '2 - Needs Imp.', 1: '1 - Unsatisfactory' }
const RATING_COLORS = { 5: 'bg-emerald-500', 4: 'bg-blue-500', 3: 'bg-amber-500', 2: 'bg-purple-500', 1: 'bg-rose-500' }

export default function Performance() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Overview')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeActionMenuId, setActiveActionMenuId] = useState(null)
  const [newCycle, setNewCycle] = useState({ cycleName: '', type: 'annual', startDate: '', endDate: '', department: '', description: '' })

  const { data: rawCycles, isLoading: cyclesLoading } = useReviewCycles()
  const { data: stats } = usePerformanceStats()
  const { data: topPerformers } = usePerformanceTopPerformers()
  const { data: departments } = useDepartments()

  const createCycle = useCreateReviewCycle()
  const completeCycle = useCompleteReviewCycle()
  const deleteCycle = useDeleteReviewCycle()

  const cycles = Array.isArray(rawCycles) ? rawCycles : []

  const handleCreateCycle = (e) => {
    e.preventDefault()
    if (!newCycle.cycleName) { toast.error('Please enter a cycle name'); return }

    createCycle.mutate({
      name: newCycle.cycleName,
      type: newCycle.type,
      start_date: newCycle.startDate || null,
      end_date: newCycle.endDate || null,
      department: newCycle.department || null,
      description: newCycle.description,
      created_by: user?.emp_id,
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false)
        setNewCycle({ cycleName: '', type: 'annual', startDate: '', endDate: '', department: '', description: '' })
        toast.success('Performance Review Cycle created successfully!')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create cycle'),
    })
  }

  const handleComplete = (cycle) => {
    completeCycle.mutate(cycle.id, {
      onSuccess: () => toast.success(`"${cycle.name}" marked as completed`),
      onError: () => toast.error('Failed to complete cycle'),
    })
    setActiveActionMenuId(null)
  }

  const handleDuplicate = (cycle) => {
    createCycle.mutate({
      name: `${cycle.name} (Copy)`,
      type: cycle.type,
      start_date: cycle.start_date,
      end_date: cycle.end_date,
      department: cycle.department,
      description: cycle.description,
      created_by: user?.emp_id,
    }, {
      onSuccess: () => toast.success(`Duplicated "${cycle.name}"`),
      onError: () => toast.error('Failed to duplicate cycle'),
    })
    setActiveActionMenuId(null)
  }

  const handleDelete = (cycle) => {
    deleteCycle.mutate(cycle.id, {
      onSuccess: () => toast.success(`Deleted "${cycle.name}"`),
      onError: () => toast.error('Failed to delete cycle'),
    })
    setActiveActionMenuId(null)
  }

  const ratingDist = stats?.rating_distribution || []
  const ratingTotal = ratingDist.reduce((s, r) => s + r.count, 0)
  const employeesUnderReview = stats?.employees_under_review ?? 0
  const completedReviews = stats?.completed_reviews ?? 0
  const reviewTotal = employeesUnderReview + completedReviews || 1

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Management</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium"><span>Home</span><span>&gt;</span><span className="text-gray-700">Performance Management</span></div>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs hover:shadow-md transition-all active:scale-[0.98] w-full sm:w-auto">
          <Plus className="w-4 h-4" /><span>Create Review Cycle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: 'Active Cycles', value: stats?.active_cycles ?? 0, icon: BarChart2, iconBg: 'bg-blue-50 border-blue-100 text-blue-600' },
          { label: 'Employees Under Review', value: employeesUnderReview, icon: Users, iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
          { label: 'Completed Reviews', value: completedReviews, icon: CheckCircle2, iconBg: 'bg-purple-50 border-purple-100 text-purple-600' },
          { label: 'Average Rating', value: stats?.average_rating ? `${stats.average_rating} / 5` : '— / 5', icon: Star, iconBg: 'bg-amber-50 border-amber-100 text-amber-600' },
          { label: 'High Performers', value: stats?.high_performers ?? 0, icon: Award, iconBg: 'bg-teal-50 border-teal-100 text-teal-600' },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.iconBg}`}><Icon className="w-5 h-5" /></div>
              <div className="min-w-0"><p className="text-[11px] font-semibold text-gray-500 truncate">{m.label}</p><p className="text-xl font-extrabold text-gray-900 leading-tight mt-0.5">{m.value}</p></div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {['Overview', 'My Reviews', 'Team Reviews', 'Goals', 'Feedback', 'Calibration'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 text-blue-600 border border-blue-100 font-bold shadow-2xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Rating Distribution</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">{ratingTotal} Rated</span>
              </div>
              {ratingTotal === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No submitted ratings yet.</p>
              ) : (
                <div className="space-y-1.5 text-xs pt-1">
                  {[5, 4, 3, 2, 1].map((r) => {
                    const row = ratingDist.find(d => Number(d.bucket) === r)
                    const count = row?.count || 0
                    const pct = ratingTotal > 0 ? Math.round((count / ratingTotal) * 100) : 0
                    return (
                      <div key={r} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0"><span className={`w-2 h-2 rounded-full shrink-0 ${RATING_COLORS[r]}`} /><span className="text-gray-700 font-semibold truncate text-[10px]">{RATING_LABELS[r]}</span></div>
                        <span className="font-bold text-gray-900 text-[10px] shrink-0 ml-1 font-mono">{count} <span className="text-[9px] text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Review Progress</h3>
                <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-200">Current Cycles</span>
              </div>
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-gray-700">Under Review</span><span className="font-bold text-gray-900">{employeesUnderReview}</span></div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((employeesUnderReview / reviewTotal) * 100)}%` }} /></div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-gray-700">Completed</span><span className="font-bold text-gray-900">{completedReviews}</span></div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((completedReviews / reviewTotal) * 100)}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Goal Achievement</h3>
              </div>
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="relative flex items-center justify-center w-44 h-24">
                  <svg className="w-44 h-32" viewBox="0 0 160 90">
                    <path d="M 20 75 A 60 60 0 0 1 140 75" fill="none" stroke="#f1f5f9" strokeWidth="15" strokeLinecap="round" />
                    <path d="M 20 75 A 60 60 0 0 1 140 75" fill="none" stroke="#10b981" strokeWidth="15" strokeDasharray="188.49" strokeDashoffset={188.49 * (1 - (stats?.goal_pct ?? 0) / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-10 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-gray-900 leading-none">{stats?.goal_pct ?? 0}%</span>
                    <span className="text-[10px] font-semibold text-gray-400 mt-0.5">Goals Achieved</span>
                  </div>
                </div>
                <div className="mt-1 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700">
                    <span className="text-emerald-600 font-extrabold">{stats?.goal_completed ?? 0}</span> of {stats?.goal_total ?? 0} Goals Done
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-bold text-gray-900">Active Review Cycles</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      <th className="py-3 px-4">CYCLE NAME</th>
                      <th className="py-3 px-4">TYPE</th>
                      <th className="py-3 px-4 text-center">EMPLOYEES</th>
                      <th className="py-3 px-4 text-center">COMPLETED</th>
                      <th className="py-3 px-4">PROGRESS</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                      <th className="py-3 px-4 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {cyclesLoading && <tr><td colSpan="7" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                    {!cyclesLoading && cycles.map((cycle) => (
                      <tr key={cycle.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cycle.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 capitalize">{cycle.type.replace('_', ' ')}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">{cycle.employees}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{cycle.completed} <span className="text-[10px] text-gray-400">({cycle.pct}%)</span></td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2"><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${cycle.pct}%` }} /></div><span className="text-[10px] font-bold text-gray-500">{cycle.pct}%</span></div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cycle.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{cycle.status === 'completed' ? 'Completed' : 'In Progress'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center relative">
                          <button onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === cycle.id ? null : cycle.id) }} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                          {activeActionMenuId === cycle.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenuId(null)} />
                              <div className="absolute right-4 top-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 text-left text-xs space-y-0.5">
                                {cycle.status !== 'completed' && (
                                  <button onClick={() => handleComplete(cycle)} className="w-full px-3 py-1.5 flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Mark Completed</span></button>
                                )}
                                <button onClick={() => handleDuplicate(cycle)} className="w-full px-3 py-1.5 flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"><Copy className="w-3.5 h-3.5" /><span>Duplicate Cycle</span></button>
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => handleDelete(cycle)} className="w-full px-3 py-1.5 flex items-center gap-2 text-red-600 hover:bg-red-50 font-medium"><Trash2 className="w-3.5 h-3.5" /><span>Delete Cycle</span></button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!cyclesLoading && cycles.length === 0 && <tr><td colSpan="7" className="py-10 text-center text-gray-400">No review cycles created yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white"><span>Showing {cycles.length} of {cycles.length} cycles</span></div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col">
              <div className="pb-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Top Performers</h3></div>
              <div className="space-y-2.5 pt-3">
                {(topPerformers || []).length === 0 && <p className="text-xs text-gray-400 text-center py-6">No submitted ratings yet.</p>}
                {(topPerformers || []).map((emp) => (
                  <div key={emp.employee_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {emp.photo ? <img src={emp.photo} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{emp.name.charAt(0)}</div>}
                      <div><p className="font-bold text-xs text-gray-900">{emp.name}</p><p className="text-[10px] font-medium text-gray-400">{emp.role}</p></div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-xs"><span>{emp.score}</span><Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'Overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">{activeTab} Section</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">This section isn't built out yet.</p>
          <button onClick={() => setActiveTab('Overview')} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">Back to Overview</button>
        </div>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" onClick={() => setIsCreateModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-base font-bold text-gray-900">Create Review Cycle</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateCycle} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cycle Name *</label>
                  <input type="text" required placeholder="e.g. Q3 Review 2026" value={newCycle.cycleName} onChange={(e) => setNewCycle({ ...newCycle, cycleName: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-gray-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Review Type</label>
                    <select value={newCycle.type} onChange={(e) => setNewCycle({ ...newCycle, type: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                      <option value="annual">Annual</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="probation">Probation</option>
                      <option value="half_yearly">Half-Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Department</label>
                    <select value={newCycle.department} onChange={(e) => setNewCycle({ ...newCycle, department: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                      <option value="">All Departments</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block font-bold text-gray-700 mb-1">Start Date</label><input type="date" value={newCycle.startDate} onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" /></div>
                  <div><label className="block font-bold text-gray-700 mb-1">End Date</label><input type="date" value={newCycle.endDate} onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" /></div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Instructions / Description</label>
                  <textarea rows="3" placeholder="Enter instructions for employees and reviewers..." value={newCycle.description} onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white resize-none" />
                </div>
                <p className="text-[10px] text-gray-400">A pending review will be auto-created for every active employee {newCycle.department ? 'in this department' : 'company-wide'}.</p>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={createCycle.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs transition-all disabled:opacity-60">{createCycle.isPending ? 'Creating…' : 'Save & Launch Cycle'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
