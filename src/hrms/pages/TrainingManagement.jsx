import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Users,
  Clock,
  Award,
  TrendingUp,
  Plus,
  MoreVertical,
  X,
  Eye,
  Copy,
  Trash2,
  CheckCircle2,
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  useTrainingPrograms,
  useCreateTrainingProgram,
  useCompleteTrainingProgram,
  useDeleteTrainingProgram,
  useTrainingStats,
  useTopLearners,
} from '../hooks/useTraining'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const CATEGORY_DOT = { 'Technical Skills': 'bg-blue-600', 'Soft Skills': 'bg-emerald-500', Compliance: 'bg-purple-500', Leadership: 'bg-amber-500', General: 'bg-slate-500' }
const statusBadge = { completed: 'bg-emerald-50 text-emerald-700 border-emerald-100', in_progress: 'bg-amber-50 text-amber-700 border-amber-100', upcoming: 'bg-blue-50 text-blue-700 border-blue-100' }
const statusLabel = { completed: 'Completed', in_progress: 'In Progress', upcoming: 'Upcoming' }

export default function TrainingManagement() {
  const { user } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeActionMenuId, setActiveActionMenuId] = useState(null)
  const [newProgram, setNewProgram] = useState({ name: '', category: 'Technical Skills', trainer: '', durationHours: '', mode: 'Online', startDate: '' })

  const { data: rawPrograms, isLoading: programsLoading } = useTrainingPrograms()
  const { data: stats } = useTrainingStats()
  const { data: topLearners } = useTopLearners()

  const createProgram = useCreateTrainingProgram()
  const completeProgram = useCompleteTrainingProgram()
  const deleteProgram = useDeleteTrainingProgram()

  const programs = Array.isArray(rawPrograms) ? rawPrograms : []
  const upcomingPrograms = programs.filter(p => p.status === 'upcoming')
  const byCategory = stats?.by_category || []
  const categoryTotal = byCategory.reduce((s, c) => s + c.count, 0) || 1
  const statusCounts = { upcoming: programs.filter(p => p.status === 'upcoming').length, in_progress: programs.filter(p => p.status === 'in_progress').length, completed: programs.filter(p => p.status === 'completed').length }

  const handleAddProgram = (e) => {
    e.preventDefault()
    if (!newProgram.name || !newProgram.trainer) { toast.error('Please enter program name and trainer'); return }
    createProgram.mutate({
      name: newProgram.name,
      category: newProgram.category,
      trainer: newProgram.trainer,
      mode: newProgram.mode,
      start_date: newProgram.startDate || null,
      duration_hours: newProgram.durationHours || null,
      created_by: user?.emp_id,
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false)
        setNewProgram({ name: '', category: 'Technical Skills', trainer: '', durationHours: '', mode: 'Online', startDate: '' })
        toast.success('Training Program added successfully!')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to add program'),
    })
  }

  const handleComplete = (prog) => {
    completeProgram.mutate(prog.id, { onSuccess: () => toast.success(`"${prog.name}" marked as completed!`), onError: () => toast.error('Failed to complete program') })
    setActiveActionMenuId(null)
  }

  const handleDuplicate = (prog) => {
    createProgram.mutate({ name: `${prog.name} (Copy)`, category: prog.category, trainer: prog.trainer, mode: prog.mode, start_date: prog.start_date, duration_hours: prog.duration_hours, created_by: user?.emp_id }, {
      onSuccess: () => toast.success(`Duplicated "${prog.name}"`),
      onError: () => toast.error('Failed to duplicate'),
    })
    setActiveActionMenuId(null)
  }

  const handleDelete = (prog) => {
    deleteProgram.mutate(prog.id, { onSuccess: () => toast.success(`Deleted "${prog.name}"`), onError: () => toast.error('Failed to delete') })
    setActiveActionMenuId(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Training Management</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-medium"><span>Home</span><span>&gt;</span><span className="text-gray-700 font-semibold">Training</span></div>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs hover:shadow-md transition-all active:scale-[0.98] w-full sm:w-auto">
          <Plus className="w-4 h-4" /><span>Add Training Program</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Programs', value: stats?.total_programs ?? 0, sub: `${statusCounts.in_progress} In Progress`, icon: GraduationCap, iconBg: 'bg-blue-50 border-blue-100 text-blue-600' },
          { label: 'Enrolled Employees', value: stats?.enrolled_employees ?? 0, sub: 'Distinct Learners', icon: Users, iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
          { label: 'Training Hours', value: stats?.training_hours ?? 0, sub: 'Completed Hours', icon: Clock, iconBg: 'bg-purple-50 border-purple-100 text-purple-600' },
          { label: 'Completed Trainings', value: stats?.completed_trainings ?? 0, sub: 'Enrollments Finished', icon: Award, iconBg: 'bg-amber-50 border-amber-100 text-amber-600' },
          { label: 'Completion Rate', value: `${stats?.completion_rate ?? 0}%`, sub: 'Of All Enrollments', icon: TrendingUp, iconBg: 'bg-cyan-50 border-cyan-100 text-cyan-600' },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.iconBg}`}><Icon className="w-5 h-5" /></div>
              <div className="min-w-0"><p className="text-[11px] font-semibold text-gray-500 truncate">{m.label}</p><p className="text-xl font-extrabold text-gray-900 leading-tight mt-0.5">{m.value}</p><p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">{m.sub}</p></div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-3 h-full">
          <div className="border-b border-gray-100 pb-3"><h3 className="text-sm font-bold text-gray-900">Programs by Status</h3></div>
          <div className="space-y-4 pt-1">
            {[
              { label: 'Upcoming', count: statusCounts.upcoming, color: 'bg-blue-500' },
              { label: 'In Progress', count: statusCounts.in_progress, color: 'bg-amber-500' },
              { label: 'Completed', count: statusCounts.completed, color: 'bg-emerald-500' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-gray-700">{row.label}</span><span className="font-bold text-gray-900">{row.count}</span></div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${programs.length > 0 ? Math.round((row.count / programs.length) * 100) : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-3 h-full">
          <div className="border-b border-gray-100 pb-3"><h3 className="text-sm font-bold text-gray-900">Training Categories</h3></div>
          {byCategory.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No programs yet.</p>
          ) : (
            <div className="space-y-1.5 text-xs flex-1 pt-1">
              {byCategory.map((c) => {
                const pct = Math.round((c.count / categoryTotal) * 100)
                return (
                  <div key={c.category} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0"><span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[c.category] || 'bg-gray-400'}`} /><span className="text-gray-700 font-semibold truncate">{c.category}</span></div>
                    <span className="font-bold text-gray-900 shrink-0 ml-1 font-mono">{c.count} <span className="text-[9px] text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between space-y-3 h-full">
          <div className="border-b border-gray-100 pb-3"><h3 className="text-sm font-bold text-gray-900">Upcoming Trainings</h3></div>
          <div className="space-y-2 pt-1 flex-1">
            {upcomingPrograms.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No upcoming trainings.</p>}
            {upcomingPrograms.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-10 rounded-lg bg-slate-100 text-gray-800 flex flex-col items-center justify-center shrink-0 border border-slate-200/80">
                    <span className="text-xs font-black leading-none">{item.start_date ? new Date(item.start_date).getDate() : '—'}</span>
                    <span className="text-[8px] font-bold text-gray-500 uppercase mt-0.5">{item.start_date ? new Date(item.start_date).toLocaleDateString('en-IN', { month: 'short' }) : ''}</span>
                  </div>
                  <div className="min-w-0"><p className="font-bold text-xs text-gray-900 truncate">{item.name}</p><p className="text-[10px] text-gray-400 truncate">By: {item.trainer || '—'}</p></div>
                </div>
                <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold shrink-0 border ${item.mode === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>{item.mode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-bold text-gray-900">Training Programs</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-4">PROGRAM NAME</th><th className="py-3 px-4">CATEGORY</th><th className="py-3 px-4">TRAINER</th><th className="py-3 px-4 text-center">ENROLLED</th><th className="py-3 px-4 text-center">COMPLETED</th><th className="py-3 px-4 text-center">STATUS</th><th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {programsLoading && <tr><td colSpan="7" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                {!programsLoading && programs.map((prog) => (
                  <tr key={prog.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{prog.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{prog.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{prog.trainer || '—'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">{prog.enrolled}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{prog.completed} <span className="text-[10px] text-gray-400">({prog.pct}%)</span></td>
                    <td className="py-3.5 px-4 text-center"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge[prog.status]}`}>{statusLabel[prog.status]}</span></td>
                    <td className="py-3.5 px-4 text-center relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === prog.id ? null : prog.id) }} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      {activeActionMenuId === prog.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenuId(null)} />
                          <div className="absolute right-4 top-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 text-left text-xs space-y-0.5">
                            {prog.status !== 'completed' && <button onClick={() => handleComplete(prog)} className="w-full px-3 py-1.5 flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Mark Completed</span></button>}
                            <button onClick={() => handleDuplicate(prog)} className="w-full px-3 py-1.5 flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"><Copy className="w-3.5 h-3.5" /><span>Duplicate</span></button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => handleDelete(prog)} className="w-full px-3 py-1.5 flex items-center gap-2 text-red-600 hover:bg-red-50 font-medium"><Trash2 className="w-3.5 h-3.5" /><span>Delete</span></button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!programsLoading && programs.length === 0 && <tr><td colSpan="7" className="py-10 text-center text-gray-400">No training programs yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white"><span>Showing {programs.length} of {programs.length} programs</span></div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col space-y-4">
          <div className="border-b border-gray-100 pb-3"><h3 className="text-sm font-bold text-gray-900">Top Learners</h3></div>
          <div className="space-y-3">
            {(topLearners || []).length === 0 && <p className="text-xs text-gray-400 text-center py-6">No completed trainings yet.</p>}
            {(topLearners || []).map((learner, i) => (
              <div key={learner.employee_id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-white shadow-2xs' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                  {learner.photo ? <img src={learner.photo} alt={learner.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{learner.name.charAt(0)}</div>}
                  <div><p className="font-bold text-xs text-gray-900">{learner.name}</p><p className="text-[10px] font-medium text-gray-400">Completed {learner.completed_count} Trainings</p></div>
                </div>
                {learner.score != null && <span className="text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{learner.score}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4" onClick={() => setIsAddModalOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-base font-bold text-gray-900">Add Training Program</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddProgram} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Program Name *</label>
                  <input type="text" required placeholder="e.g. Advanced React & TypeScript Mastery" value={newProgram.name} onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-gray-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <select value={newProgram.category} onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                      <option value="Technical Skills">Technical Skills</option><option value="Soft Skills">Soft Skills</option><option value="Compliance">Compliance</option><option value="Leadership">Leadership</option><option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Training Mode</label>
                    <select value={newProgram.mode} onChange={(e) => setNewProgram({ ...newProgram, mode: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                      <option value="Online">Online</option><option value="Classroom">Classroom</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Trainer Name *</label>
                    <input type="text" required placeholder="e.g. Rohit Gupta" value={newProgram.trainer} onChange={(e) => setNewProgram({ ...newProgram, trainer: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Duration (Hours)</label>
                    <input type="number" min="0" step="0.5" placeholder="e.g. 8" value={newProgram.durationHours} onChange={(e) => setNewProgram({ ...newProgram, durationHours: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={newProgram.startDate} onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })} className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                </div>
                <p className="text-[10px] text-gray-400">Enrollment starts at 0 — enroll employees separately once the program is created.</p>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={createProgram.isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-2xs transition-all disabled:opacity-60">{createProgram.isPending ? 'Saving…' : 'Save & Add Program'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
