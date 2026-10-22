import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PartyPopper, UserPlus } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import {
  useCreateCandidate,
  useUpdateCandidate,
  useScheduleInterview,
  useUpdateInterview,
} from '../../hooks/useRecruitment'
import { STAGES, stageLabel, inputCls, labelCls, toLocalInput } from './shared'
import { hrmsPortalRoot } from '../../env'

const Shell = ({ title, subtitle, onClose, children, wide = false }) =>
  createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl border border-gray-200 shadow-xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-6 space-y-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>,
    hrmsPortalRoot()
  )

const Actions = ({ onClose, busy, label, busyLabel }) => (
  <div className="flex items-center justify-end gap-2 pt-2">
    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
    <button type="submit" disabled={busy} className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">
      {busy ? busyLabel : label}
    </button>
  </div>
)

const errorText = (err, fallback) =>
  err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || fallback

/**
 * Add or edit a candidate. `candidate` = edit; otherwise `defaults` can preset the job and stage
 * (e.g. "Add hired person" on a requirement presets stage=hired).
 */
export const CandidateFormModal = ({ candidate, defaults = {}, jobs, onClose, onSaved }) => {
  const create = useCreateCandidate()
  const update = useUpdateCandidate()
  const editing = !!candidate
  const [form, setForm] = useState({
    job_opening_id: candidate?.job_opening_id ?? defaults.job_opening_id ?? '',
    name: candidate?.name ?? '',
    phone: candidate?.phone ?? '',
    email: candidate?.email ?? '',
    stage: defaults.stage ?? 'applied',
    notes: candidate?.notes ?? '',
  })
  const lockedJob = !editing && defaults.job_opening_id
  const hiring = !editing && form.stage === 'hired'

  const submit = (e) => {
    e.preventDefault()
    if (!form.job_opening_id) return toast.error('Pick the job opening')
    if (!form.name.trim()) return toast.error('Enter the name')
    if (hiring && !form.phone.trim()) return toast.error('Enter the mobile number of the person hired')
    const body = { ...form, job_opening_id: Number(form.job_opening_id), email: form.email || null, phone: form.phone || null }
    const opts = {
      onSuccess: (res) => {
        toast.success(editing ? 'Candidate updated' : hiring ? `${form.name} recorded as hired` : 'Candidate added')
        onSaved?.(res.data)
        onClose()
      },
      onError: (err) => toast.error(errorText(err, 'Could not save the candidate')),
    }
    if (editing) {
      const { stage, ...rest } = body // stage has its own control on the table
      update.mutate({ id: candidate.id, ...rest }, opts)
    } else {
      create.mutate(body, opts)
    }
  }

  return (
    <Shell
      title={editing ? 'Edit Candidate' : hiring ? 'Add Hired Person' : 'Add Candidate'}
      subtitle={hiring ? 'Who was hired for this opening? You can create their employee record right after.' : undefined}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-3 text-xs">
        <div>
          <label className={labelCls}>Job opening</label>
          <select disabled={lockedJob} value={form.job_opening_id} onChange={(e) => setForm({ ...form, job_opening_id: e.target.value })} className={`${inputCls} disabled:bg-gray-50`}>
            <option value="">Select job opening</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.department ? ` · ${j.department}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Full name</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Rahul Verma" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Mobile{hiring && ' *'}</label>
            <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="10-digit mobile" />
          </div>
          <div>
            <label className={labelCls}>Personal email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="name@gmail.com" />
          </div>
        </div>
        {!editing && !defaults.stage && (
          <div>
            <label className={labelCls}>Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputCls}>
              {STAGES.map((s) => <option key={s} value={s}>{stageLabel[s]}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Source, expected CTC, notice period…" />
        </div>
        <Actions onClose={onClose} busy={create.isPending || update.isPending} label={editing ? 'Save Changes' : hiring ? 'Record Hire' : 'Add Candidate'} busyLabel="Saving…" />
      </form>
    </Shell>
  )
}

/** Schedule a new interview, or reschedule `interview`. */
export const ScheduleInterviewModal = ({ interview, candidateId, candidates, onClose }) => {
  const schedule = useScheduleInterview()
  const update = useUpdateInterview()
  const editing = !!interview
  const [form, setForm] = useState({
    candidate_id: interview?.candidate_id ?? candidateId ?? '',
    scheduled_at: toLocalInput(interview?.scheduled_at ?? new Date(Date.now() + 24 * 3600 * 1000)),
    interviewer: interview?.interviewer ?? '',
    mode: interview?.mode ?? 'in_person',
    location: interview?.location ?? '',
    notes: interview?.notes ?? '',
  })
  const open = candidates.filter((c) => !['hired', 'rejected'].includes(c.stage) || c.id === Number(form.candidate_id))

  const submit = (e) => {
    e.preventDefault()
    if (!form.candidate_id) return toast.error('Pick the candidate')
    const body = { ...form, candidate_id: Number(form.candidate_id), scheduled_at: form.scheduled_at.replace('T', ' ') + ':00' }
    const opts = {
      onSuccess: () => { toast.success(editing ? 'Interview rescheduled' : 'Interview scheduled'); onClose() },
      onError: (err) => toast.error(errorText(err, 'Could not save the interview')),
    }
    if (editing) update.mutate({ id: interview.id, ...body }, opts)
    else schedule.mutate(body, opts)
  }

  return (
    <Shell title={editing ? 'Reschedule Interview' : 'Schedule Interview'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-3 text-xs">
        <div>
          <label className={labelCls}>Candidate</label>
          <select disabled={editing || !!candidateId} value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} className={`${inputCls} disabled:bg-gray-50`}>
            <option value="">Select candidate</option>
            {open.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.role}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </select>
          {!editing && !candidateId && open.length === 0 && <p className="mt-1 text-[11px] text-amber-600">Add a candidate first - interviews are scheduled for a candidate.</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date &amp; time</label>
            <input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Mode</label>
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className={inputCls}>
              <option value="in_person">In person</option>
              <option value="phone">Phone</option>
              <option value="video">Video call</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Interviewer</label>
            <input type="text" value={form.interviewer} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} className={inputCls} placeholder="e.g. Deepak Kumar" />
          </div>
          <div>
            <label className={labelCls}>{form.mode === 'video' ? 'Meeting link' : form.mode === 'phone' ? 'Number to call' : 'Venue'}</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} placeholder={form.mode === 'video' ? 'https://meet.google.com/…' : form.mode === 'phone' ? 'Mobile number' : 'Office address / room'} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Round, topics to cover…" />
        </div>
        <Actions onClose={onClose} busy={schedule.isPending || update.isPending} label={editing ? 'Reschedule' : 'Schedule'} busyLabel="Saving…" />
      </form>
    </Shell>
  )
}

/** Record how an interview went; optionally move the candidate on (hired / shortlisted / rejected). */
export const InterviewOutcomeModal = ({ interview, onClose, onHired }) => {
  const update = useUpdateInterview()
  const [form, setForm] = useState({ status: 'completed', result: '', feedback: '' })

  const submit = (e) => {
    e.preventDefault()
    const body = { status: form.status, feedback: form.feedback || null, result: form.status === 'completed' ? form.result || null : null }
    update.mutate({ id: interview.id, ...body }, {
      onSuccess: () => {
        toast.success('Outcome saved')
        onClose()
        if (body.result === 'hired') onHired?.(interview.candidate_id)
      },
      onError: (err) => toast.error(errorText(err, 'Could not save the outcome')),
    })
  }

  return (
    <Shell title="Record Interview Outcome" subtitle={`${interview.candidate} · ${interview.role}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-xs">
        <div>
          <label className={labelCls}>What happened?</label>
          <div className="grid grid-cols-2 gap-2">
            {[['completed', 'Interview done'], ['cancelled', 'Cancelled / no-show']].map(([v, l]) => (
              <button type="button" key={v} onClick={() => setForm({ ...form, status: v })}
                className={`rounded-lg border px-3 py-2 font-semibold ${form.status === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
            ))}
          </div>
        </div>
        {form.status === 'completed' && (
          <div>
            <label className={labelCls}>Decision</label>
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className={inputCls}>
              <option value="">Not decided yet</option>
              <option value="shortlisted">Shortlist for next round</option>
              <option value="hired">Hire</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Feedback</label>
          <textarea rows={3} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} className={inputCls} placeholder="Strengths, concerns, salary discussed…" />
        </div>
        <Actions onClose={onClose} busy={update.isPending} label="Save Outcome" busyLabel="Saving…" />
      </form>
    </Shell>
  )
}

/** Shown right after someone is marked hired: go straight to their (prefilled) employee record. */
export const HiredPromptModal = ({ candidate, onClose, onCreate }) => (
  <Shell title={`${candidate.name} is hired 🎉`} subtitle="Create their employee record now? Name, mobile, personal email and department are filled in for you." onClose={onClose}>
    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs text-teal-800">
      <PartyPopper className="h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold truncate">{candidate.name}</p>
        <p className="truncate">{[candidate.phone, candidate.email, candidate.role].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Later</button>
      <button type="button" onClick={onCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
        <UserPlus className="h-3.5 w-3.5" /> Create Employee
      </button>
    </div>
  </Shell>
)
