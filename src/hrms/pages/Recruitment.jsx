import { useState } from 'react'
import { useNavigate } from '@hrms/router'
import { createPortal } from 'react-dom'
import {
  Briefcase,
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Plus,
  MoreVertical,
  Search,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  UserPlus as UserPlusIcon,
  BadgeCheck,
  Download,
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useDepartments } from '../hooks/useEmployees'
import { useHighlightId } from '../hooks/useHighlightId'
import {
  useJobOpenings,
  useCreateJobOpening,
  useUpdateJobOpening,
  useDeleteJobOpening,
  useUpdateJobStatus,
  useCandidates,
  useRecruitmentFunnel,
  useHiringRequirements,
  useSubmitHiringRequirement,
  useDecideHiringRequirement,
  useUpdateRequirementStats,
  useUpdateHiringRequirement,
} from '../hooks/useRecruitment'
import CandidatesPanel from '../components/recruitment/CandidatesPanel'
import InterviewsPanel from '../components/recruitment/InterviewsPanel'
import { CandidateFormModal, ScheduleInterviewModal, InterviewOutcomeModal, HiredPromptModal } from '../components/recruitment/RecruitmentModals'
import { openCreateEmployee } from '../components/recruitment/shared'
import { exportCsv, exportExcel } from '../utils/exportTable'
import { hrmsPortalRoot } from '../env'

const reqStatusBadge = {
  pending_hr: 'bg-amber-100/70 text-amber-700 border border-amber-200/50',
  approved: 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/50',
  rejected: 'bg-rose-100/70 text-rose-700 border border-rose-200/50',
}
const reqStatusLabel = { pending_hr: 'Awaiting HR', approved: 'Approved', rejected: 'Rejected' }
const jobStatusBadge = { active: 'bg-emerald-100/70 text-emerald-700 border border-emerald-200/50', on_hold: 'bg-amber-100/70 text-amber-700 border border-amber-200/50', closed: 'bg-rose-100/70 text-rose-700 border border-rose-200/50' }
const jobStatusLabel = { active: 'Active', on_hold: 'On Hold', closed: 'Closed' }

/** Manager submits a hiring requirement; HR/CEO see it and track applicants/hired/rejected on it. */
const HiringRequirementsPanel = ({ user, highlightId, onAddHire, onCreateEmployee }) => {
  const { data: raw, isLoading } = useHiringRequirements()
  const requirements = Array.isArray(raw) ? raw : []
  const { data: departments } = useDepartments()
  const submit = useSubmitHiringRequirement()
  const decide = useDecideHiringRequirement()
  const updateStats = useUpdateRequirementStats()
  const updateRequirement = useUpdateHiringRequirement()
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ title: '', department: '', positions_needed: 1, priority: 'normal', reason: '' })
  const [statsDraft, setStatsDraft] = useState({}) // { [id]: { total_applicants, hired_count, rejected_count } }

  const isManager = user?.role === 'manager'
  const canReview = ['hr', 'admin', 'super_admin', 'ceo', 'manager'].includes(user?.role)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Enter a role/title'); return }
    submit.mutate(form, {
      onSuccess: () => {
        toast.success('Requirement sent to HR')
        setFormOpen(false)
        setForm({ title: '', department: '', positions_needed: 1, priority: 'normal', reason: '' })
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit requirement'),
    })
  }

  const handleDecide = (id, decision) => {
    decide.mutate({ id, decision }, {
      onSuccess: () => toast.success(decision === 'approved' ? 'Requirement approved' : 'Requirement rejected'),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save decision'),
    })
  }

  const draftFor = (r) => statsDraft[r.id] || { total_applicants: r.total_applicants ?? '', hired_count: r.hired_count ?? '', rejected_count: r.rejected_count ?? '' }
  const handleSaveStats = (r) => {
    const d = draftFor(r)
    updateStats.mutate({ id: r.id, total_applicants: d.total_applicants || 0, hired_count: d.hired_count || 0, rejected_count: d.rejected_count || 0 }, {
      onSuccess: () => toast.success('Progress updated'),
      onError: () => toast.error('Failed to update progress'),
    })
  }

  const startEdit = (r) => {
    setEditingId(r.id)
    setEditDraft({ title: r.title || '', department: r.department || '', positions_needed: r.positions_needed || 1, priority: r.priority || 'normal', reason: r.reason || '' })
  }
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editDraft.title.trim()) { toast.error('Enter a role/title'); return }
    updateRequirement.mutate({ id: editingId, ...editDraft, positions_needed: Number(editDraft.positions_needed) || 1 }, {
      onSuccess: () => { toast.success('Requirement updated'); setEditingId(null) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update requirement'),
    })
  }

  if (!isManager && !canReview) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">Hiring Requirements</h2>
        </div>
        {isManager && (
          <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Submit Requirement
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-gray-100 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-gray-600 font-semibold mb-1">Role / Title needed</label>
            <input type="text" required placeholder="e.g. 2 Backend Developers" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
              <option value="">Select Department</option>
              {(departments || []).map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Positions needed</label>
            <input type="number" min="1" max="100" value={form.positions_needed} onChange={(e) => setForm({ ...form, positions_needed: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-gray-600 font-semibold mb-1">Reason / justification</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" placeholder="Why is this hire needed?" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submit.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">{submit.isPending ? 'Sending…' : 'Send to HR'}</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100">
        {isLoading && <p className="p-6 text-center text-xs text-gray-400">Loading…</p>}
        {!isLoading && requirements.length === 0 && (
          <p className="p-6 text-center text-xs text-gray-400">
            {isManager ? 'No requirements submitted yet.' : 'No hiring requirements from managers yet.'}
          </p>
        )}
        {requirements.map((r) => (
          <div
            key={r.id}
            data-hl={r.id}
            className={`p-4 space-y-2.5 transition-colors ${highlightId === r.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-900">{r.title}</p>
                  {r.priority === 'urgent' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100"><AlertTriangle className="w-2.5 h-2.5" /> Urgent</span>}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{r.department || '—'} · {r.positions_needed} position(s) · requested by {r.requested_by}</p>
                {r.reason && <p className="text-[11px] text-gray-500 mt-1">{r.reason}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${reqStatusBadge[r.request_status]}`}>{reqStatusLabel[r.request_status]}</span>
                {/* The live job status - what the manager and the Director actually want to follow */}
                {r.request_status === 'approved' && jobStatusLabel[r.status] && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${jobStatusBadge[r.status]}`}>Job: {jobStatusLabel[r.status]}</span>
                )}
                {canReview && editingId !== r.id && (
                  <button onClick={() => startEdit(r)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
            </div>

            {r.request_status === 'approved' && (
              <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-teal-800">Hired for this requirement ({(r.hires || []).length})</p>
                  {canReview && (
                    <button onClick={() => onAddHire(r)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200 hover:bg-teal-50">
                      <Plus className="h-3 w-3" /> Add hired person
                    </button>
                  )}
                </div>
                {(r.hires || []).length === 0 ? (
                  <p className="mt-1 text-[11px] text-gray-500">No one recorded yet - add the name and mobile of whoever joins.</p>
                ) : (
                  <ul className="mt-1.5 divide-y divide-teal-100/70">
                    {r.hires.map((h) => (
                      <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-[11px]">
                        <span className="min-w-0">
                          <span className="font-semibold text-gray-900">{h.name}</span>
                          <span className="text-gray-500"> · {h.phone ? <a href={`tel:${h.phone}`} className="hover:underline">{h.phone}</a> : 'no mobile'}{h.email ? ` · ${h.email}` : ''}{h.hired_at ? ` · hired ${fmtDate(h.hired_at)}` : ''}</span>
                        </span>
                        {h.emp_id ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-teal-700"><BadgeCheck className="h-3.5 w-3.5" />{h.emp_id}</span>
                        ) : canReview && (
                          <button onClick={() => onCreateEmployee({ ...h, department: r.department, role: r.title })} className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2 py-0.5 font-semibold text-white hover:bg-teal-700">
                            <UserPlusIcon className="h-3 w-3" /> Create employee
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {r.request_status === 'approved' && (
              <p className="text-[11px] text-gray-500">
                Progress: <span className="font-semibold text-gray-800">{Math.max(r.hired_count ?? 0, (r.hires || []).length)}</span> of {r.positions_needed} hired
                {' · '}{r.total_applicants ?? 0} applicants · {r.rejected_count ?? 0} rejected
                {r.reviewed_by && <> · reviewed by {r.reviewed_by}</>}
              </p>
            )}

            {editingId === r.id && editDraft && (
              <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-slate-50/60 p-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Role / Title needed</label>
                  <input type="text" required value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Department</label>
                  <select value={editDraft.department} onChange={(e) => setEditDraft({ ...editDraft, department: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="">Select Department</option>
                    {/* keep a free-text department that isn't in the list selectable */}
                    {editDraft.department && !(departments || []).some((d) => d.name === editDraft.department) && <option value={editDraft.department}>{editDraft.department}</option>}
                    {(departments || []).map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Positions needed</label>
                  <input type="number" min="1" max="100" value={editDraft.positions_needed} onChange={(e) => setEditDraft({ ...editDraft, positions_needed: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Priority</label>
                  <select value={editDraft.priority} onChange={(e) => setEditDraft({ ...editDraft, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Reason / justification</label>
                  <textarea rows={2} value={editDraft.reason} onChange={(e) => setEditDraft({ ...editDraft, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={updateRequirement.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">{updateRequirement.isPending ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            )}

            {canReview && r.request_status === 'pending_hr' && (
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => handleDecide(r.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                <button onClick={() => handleDecide(r.id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100"><XCircle className="h-3.5 w-3.5" /> Reject</button>
              </div>
            )}

            {canReview && r.request_status === 'approved' && (
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-md">
                {[['total_applicants', 'Applicants'], ['hired_count', 'Hired'], ['rejected_count', 'Rejected']].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[10px] text-gray-400 font-semibold mb-0.5">{label}</label>
                    <input
                      type="number" min="0"
                      value={draftFor(r)[key]}
                      onChange={(e) => setStatsDraft((prev) => ({ ...prev, [r.id]: { ...draftFor(r), [key]: e.target.value } }))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                ))}
                <button onClick={() => handleSaveStats(r)} disabled={updateStats.isPending} className="col-span-3 mt-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 w-fit">
                  {updateStats.isPending ? 'Saving…' : 'Save Progress'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')


export default function Recruitment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const highlightId = useHighlightId()
  // One modal at a time: candidate add/edit, interview schedule/reschedule, outcome, or the "hired!" prompt.
  const [modal, setModal] = useState(null)
  const [candidateJobFilter, setCandidateJobFilter] = useState('')
  const [activeJobTab, setActiveJobTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState(null) // { top, left } in viewport coords, for the portaled dropdown
  const [editingJob, setEditingJob] = useState(null) // the job object being edited, or null

  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full Time' })
  const [editForm, setEditForm] = useState({ title: '', department: '', location: '', type: 'Full Time' })

  const { data: rawJobs, isLoading: jobsLoading } = useJobOpenings()
  const { data: rawCandidates } = useCandidates()
  const { data: funnel } = useRecruitmentFunnel()
  const { data: departments } = useDepartments()

  const createJob = useCreateJobOpening()
  const updateJob = useUpdateJobOpening()
  const deleteJob = useDeleteJobOpening()
  const updateJobStatus = useUpdateJobStatus()

  // Matches the server's own check: HR can only manage a job they posted themselves;
  // admin/super_admin/ceo can manage any of them.
  const canManageJob = (job) => ['admin', 'super_admin', 'ceo'].includes(user?.role) || (job.posted_by && job.posted_by === user?.emp_id)
  // A job that came from a manager's requirement has no HR poster - HR/manager may still edit it (not delete).
  const canEditJob = (job) => canManageJob(job) || (!!job.requested_by && ['hr', 'manager'].includes(user?.role))

  const jobs = Array.isArray(rawJobs) ? rawJobs : []
  const candidates = Array.isArray(rawCandidates) ? rawCandidates : []

  const closeModal = () => setModal(null)
  const createEmployeeFor = (candidate) => { setModal(null); openCreateEmployee(navigate, candidate) }
  // Someone just became "hired" - offer to create their employee record straight away.
  const promptHired = (candidateOrId) => {
    const c = typeof candidateOrId === 'object' ? candidateOrId : candidates.find((x) => x.id === candidateOrId)
    if (c && !c.emp_id) setModal({ type: 'hired', candidate: c })
  }
  const showCandidatesFor = (job) => {
    setOpenMenuId(null)
    setCandidateJobFilter(String(job.id))
    setTimeout(() => document.getElementById('candidates')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const exportJobs = (kind) => {
    const cols = [
      { header: 'Job Title', value: (j) => j.title },
      { header: 'Department', value: (j) => j.department },
      { header: 'Location', value: (j) => j.location },
      { header: 'Type', value: (j) => j.employment_type },
      { header: 'Status', value: (j) => jobStatusLabel[j.status] },
      { header: 'Positions', value: (j) => j.positions_needed },
      { header: 'Applicants', value: (j) => j.applicants },
      { header: 'Hired', value: (j) => j.hired_count ?? 0 },
      { header: 'Rejected', value: (j) => j.rejected_count ?? 0 },
      { header: 'Source', value: (j) => (j.requested_by ? 'Manager requirement' : 'HR posting') },
      { header: 'Posted On', value: (j) => fmtDate(j.posted_at) },
    ]
    if (filteredJobs.length === 0) return toast.error('Nothing to export')
    const name = `job-openings-${new Date().toISOString().slice(0, 10)}`
    if (kind === 'csv') exportCsv(filteredJobs, cols, name)
    else exportExcel(filteredJobs, cols, name, 'Job Openings')
  }

  const filteredJobs = jobs.filter(j => {
    const matchesTab = activeJobTab === 'all' || j.status === activeJobTab
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || (j.department || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleCreateJobSubmit = (e) => {
    e.preventDefault()
    if (!newJob.title) { toast.error('Please enter a job title'); return }
    createJob.mutate({
      title: newJob.title,
      department: newJob.department,
      location: newJob.location,
      employment_type: newJob.type,
      posted_by: user?.emp_id,
    }, {
      onSuccess: () => {
        setIsModalOpen(false)
        setNewJob({ title: '', department: '', location: '', type: 'Full Time' })
        toast.success('Job opening created!')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create job opening'),
    })
  }

  const handleStatusChange = (job, status) => {
    updateJobStatus.mutate({ id: job.id, status }, {
      onSuccess: () => toast.success(`"${job.title}" marked as ${jobStatusLabel[status]}`),
      onError: () => toast.error('Failed to update status'),
    })
    setOpenMenuId(null)
  }

  const openEdit = (job) => {
    setEditingJob(job)
    setEditForm({ title: job.title || '', department: job.department || '', location: job.location || '', type: job.employment_type || 'Full Time' })
    setOpenMenuId(null)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editForm.title) { toast.error('Please enter a job title'); return }
    updateJob.mutate({
      id: editingJob.id,
      title: editForm.title,
      department: editForm.department,
      location: editForm.location,
      employment_type: editForm.type,
    }, {
      onSuccess: () => {
        setEditingJob(null)
        toast.success('Job opening updated')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update job opening'),
    })
  }

  const handleDelete = (job) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${job.title}"? This can't be undone.`)) return
    deleteJob.mutate(job.id, {
      onSuccess: () => toast.success(`"${job.title}" deleted`),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete job opening'),
    })
  }

  const f = funnel?.funnel || []
  const maxCount = Math.max(...f.map(s => s.count), 1)

  return (
    <div className="space-y-6 p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Recruitment</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5"><span>Home</span><span>&gt;</span><span className="text-gray-700">Recruitment</span></div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs hover:shadow-md transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /><span>Create Job Opening</span>
        </button>
      </div>

      <HiringRequirementsPanel
        user={user}
        highlightId={highlightId}
        onAddHire={(r) => setModal({ type: 'candidate', defaults: { job_opening_id: r.id, stage: 'hired' } })}
        onCreateEmployee={createEmployeeFor}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Job Openings', value: funnel?.total_openings ?? 0, sub: 'Active Jobs', icon: Briefcase, iconBg: 'bg-blue-50 border-blue-100 text-blue-600' },
          { label: 'Total Candidates', value: funnel?.total_candidates ?? 0, sub: 'All Applicants', icon: Users, iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
          { label: 'Shortlisted', value: funnel?.shortlisted ?? 0, sub: 'In Pipeline', icon: UserCheck, iconBg: 'bg-purple-50 border-purple-100 text-purple-600' },
          { label: 'Hired (This Month)', value: funnel?.hired_this_month ?? 0, sub: 'New Joiners', icon: UserPlus, iconBg: 'bg-amber-50 border-amber-100 text-amber-600' },
          { label: 'Rejected', value: funnel?.rejected ?? 0, sub: 'Not Selected', icon: UserX, iconBg: 'bg-rose-50 border-rose-100 text-rose-500' },
        ].map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex items-center justify-between">
              <div className="space-y-1"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p><p className="text-2xl font-extrabold text-gray-900 tracking-tight">{m.value}</p><p className="text-[11px] font-medium text-gray-400">{m.sub}</p></div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${m.iconBg}`}><Icon className="w-5 h-5" /></div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">Job Openings</h2>
              <div className="flex items-center gap-1.5 text-xs">
                <button onClick={() => exportJobs('xlsx')} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5" /> Excel</button>
                <button onClick={() => exportJobs('csv')} className="rounded-lg border border-gray-200 px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-50">CSV</button>
              </div>
            </div>
            <div className="px-4 py-2 bg-slate-50/60 border-b border-gray-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="flex gap-1.5">
                {[{ id: 'all', label: 'All Jobs' }, { id: 'active', label: 'Active' }, { id: 'on_hold', label: 'On Hold' }, { id: 'closed', label: 'Closed' }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveJobTab(tab.id)} className={`px-3 py-1 rounded-md font-semibold transition-colors ${activeJobTab === tab.id ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{tab.label}</button>
                ))}
              </div>
              <div className="relative w-36">
                <input type="text" placeholder="Filter jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-hidden focus:border-blue-500 bg-white" />
                <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">JOB TITLE</th><th className="py-2.5 px-3">DEPARTMENT</th><th className="py-2.5 px-3">LOCATION</th><th className="py-2.5 px-3">APPLICANTS</th><th className="py-2.5 px-3">STATUS</th><th className="py-2.5 px-3">POSTED ON</th><th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {jobsLoading && <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                  {!jobsLoading && filteredJobs.map(job => (
                    <tr
                      key={job.id}
                      data-hl={job.id}
                      className={`transition-colors whitespace-nowrap ${highlightId === job.id ? 'bg-blue-50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Briefcase className="w-3.5 h-3.5" /></div>
                          <div><p className="font-bold text-slate-900">{job.title}</p><p className="text-[10px] text-slate-400 font-normal">{job.employment_type}{job.requested_by && ' · from manager requirement'}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{job.department || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">{job.location || '—'}</td>
                      <td className="py-3 px-3"><span className="font-bold text-slate-900">{job.applicants}</span></td>
                      <td className="py-3 px-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${jobStatusBadge[job.status]}`}>{jobStatusLabel[job.status]}</span></td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{fmtDate(job.posted_at)}</td>
                      <td className="py-3 px-3 text-center relative">
                        <button
                          onClick={(e) => {
                            if (openMenuId === job.id) { setOpenMenuId(null); return }
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 176) })
                            setOpenMenuId(job.id)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-sm"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === job.id && menuPos && createPortal(
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div
                              className="fixed w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 text-left text-[11px] space-y-0.5"
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button onClick={() => showCandidatesFor(job)} className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium text-left">View Candidates</button>
                              <button onClick={() => { setOpenMenuId(null); setModal({ type: 'candidate', defaults: { job_opening_id: job.id } }) }} className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium text-left">Add Candidate</button>
                              <div className="my-1 border-t border-gray-100" />
                              {job.status !== 'active' && <button onClick={() => handleStatusChange(job, 'active')} className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium text-left">Mark Active</button>}
                              {job.status !== 'on_hold' && <button onClick={() => handleStatusChange(job, 'on_hold')} className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium text-left">Put On Hold</button>}
                              {job.status !== 'closed' && <button onClick={() => handleStatusChange(job, 'closed')} className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium text-left">Close Job</button>}
                              {canEditJob(job) && (
                                <>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button onClick={() => openEdit(job)} className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 font-medium text-left">Edit Details</button>
                                  {canManageJob(job) && <button onClick={() => handleDelete(job)} className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium text-left">Delete</button>}
                                </>
                              )}
                            </div>
                          </>,
                          hrmsPortalRoot()
                        )}
                      </td>
                    </tr>
                  ))}
                  {!jobsLoading && filteredJobs.length === 0 && <tr><td colSpan="7" className="py-6 text-center text-xs text-gray-400">No jobs found matching criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Recruitment Funnel</h3>
            {f.length === 0 || funnel?.total_candidates === 0 ? (
              <p className="text-xs text-gray-400 text-center py-16">No candidates in the pipeline yet.</p>
            ) : (
              <div className="space-y-2.5">
                {f.map((s) => {
                  const pct = funnel.total_candidates > 0 ? Math.round((s.count / funnel.total_candidates) * 100) : 0
                  const width = Math.max(10, Math.round((s.count / maxCount) * 100))
                  return (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-gray-700">{s.stage}</span><span className="font-bold text-gray-900">{s.count} ({pct}%)</span></div>
                      <div className="h-6 w-full bg-gray-100 rounded-lg overflow-hidden"><div className="h-full bg-blue-600 rounded-lg transition-all duration-500" style={{ width: `${width}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <CandidatesPanel
        candidates={candidates}
        jobs={jobs}
        jobFilter={candidateJobFilter}
        setJobFilter={setCandidateJobFilter}
        onAdd={() => setModal({ type: 'candidate', defaults: candidateJobFilter ? { job_opening_id: Number(candidateJobFilter) } : {} })}
        onEdit={(c) => setModal({ type: 'candidate', candidate: c })}
        onSchedule={(c) => setModal({ type: 'schedule', candidateId: c.id })}
        onHired={promptHired}
        onCreateEmployee={createEmployeeFor}
      />

      <InterviewsPanel
        onSchedule={() => setModal({ type: 'schedule' })}
        onReschedule={(i) => setModal({ type: 'schedule', interview: i })}
        onOutcome={(i) => setModal({ type: 'outcome', interview: i })}
      />

      {modal?.type === 'candidate' && (
        <CandidateFormModal
          candidate={modal.candidate}
          defaults={modal.defaults}
          jobs={jobs}
          onClose={closeModal}
          onSaved={(saved) => { if (!modal.candidate && saved?.stage === 'hired') setTimeout(() => promptHired(saved), 0) }}
        />
      )}
      {modal?.type === 'schedule' && (
        <ScheduleInterviewModal interview={modal.interview} candidateId={modal.candidateId} candidates={candidates} onClose={closeModal} />
      )}
      {modal?.type === 'outcome' && (
        <InterviewOutcomeModal interview={modal.interview} onClose={closeModal} onHired={(id) => setTimeout(() => promptHired(id), 300)} />
      )}
      {modal?.type === 'hired' && (
        <HiredPromptModal candidate={modal.candidate} onClose={closeModal} onCreate={() => createEmployeeFor(modal.candidate)} />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-xs p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">Create Job Opening</h3>
            <form onSubmit={handleCreateJobSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Job Title</label>
                <input type="text" required placeholder="e.g. Senior Frontend Engineer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Department</label>
                  <select value={newJob.department} onChange={(e) => setNewJob({ ...newJob, department: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="">Select Department</option>
                    {(departments || []).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Job Type</label>
                  <select value={newJob.type} onChange={(e) => setNewJob({ ...newJob, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Location</label>
                <input type="text" placeholder="e.g. Noida, India" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={createJob.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs disabled:opacity-60">{createJob.isPending ? 'Posting…' : 'Post Opening'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-xs p-4" onClick={() => setEditingJob(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">Edit Job Opening</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Job Title</label>
                <input type="text" required placeholder="e.g. Senior Frontend Engineer" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Department</label>
                  <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="">Select Department</option>
                    {(departments || []).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Job Type</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white">
                    <option value="Full Time">Full Time</option><option value="Part Time">Part Time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Location</label>
                <input type="text" placeholder="e.g. Noida, India" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setEditingJob(null)} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={updateJob.isPending} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs disabled:opacity-60">{updateJob.isPending ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
