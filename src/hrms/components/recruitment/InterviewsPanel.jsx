import { useState } from 'react'
import { CalendarPlus, CheckCircle2, Clock, Download, MapPin, Phone, RotateCcw, Video, XCircle, User } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useInterviews, useUpdateInterview } from '../../hooks/useRecruitment'
import { exportCsv, exportExcel } from '../../utils/exportTable'
import { fmtDateTime, modeLabel, stageLabel } from './shared'

const ModeIcon = ({ mode }) => (mode === 'video' ? <Video className="h-3 w-3" /> : mode === 'phone' ? <Phone className="h-3 w-3" /> : <MapPin className="h-3 w-3" />)

const COLUMNS = [
  { header: 'Candidate', value: (i) => i.candidate },
  { header: 'Mobile', value: (i) => i.candidate_phone },
  { header: 'Job Opening', value: (i) => i.role },
  { header: 'Date & Time', value: (i) => fmtDateTime(i.scheduled_at) },
  { header: 'Mode', value: (i) => modeLabel[i.mode] || '' },
  { header: 'Venue / Link', value: (i) => i.location },
  { header: 'Interviewer', value: (i) => i.interviewer },
  { header: 'Status', value: (i) => i.status },
  { header: 'Candidate Stage', value: (i) => stageLabel[i.candidate_stage] || '' },
  { header: 'Feedback', value: (i) => i.feedback },
  { header: 'Notes', value: (i) => i.notes },
]

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }

/** Upcoming interviews grouped Overdue / Today / Later, with outcome recording; past ones with their feedback. */
const InterviewsPanel = ({ onSchedule, onReschedule, onOutcome }) => {
  const [tab, setTab] = useState('upcoming')
  const { data: raw, isLoading } = useInterviews(tab === 'upcoming' ? 'upcoming' : 'past')
  const interviews = Array.isArray(raw) ? raw : []
  const update = useUpdateInterview()

  const today = startOfToday()
  const tomorrow = new Date(today.getTime() + 86400000)
  const groups = tab === 'upcoming'
    ? [
        ['Needs an outcome', interviews.filter((i) => new Date(i.scheduled_at) < today), 'text-amber-600'],
        ['Today', interviews.filter((i) => { const d = new Date(i.scheduled_at); return d >= today && d < tomorrow }), 'text-blue-600'],
        ['Coming up', interviews.filter((i) => new Date(i.scheduled_at) >= tomorrow), 'text-gray-500'],
      ].filter(([, list]) => list.length)
    : [['Completed & cancelled', interviews, 'text-gray-500']]

  const cancel = (i) => {
    if (!window.confirm(`Cancel the interview with ${i.candidate}?`)) return
    update.mutate({ id: i.id, status: 'cancelled' }, {
      onSuccess: () => toast.success('Interview cancelled'),
      onError: () => toast.error('Could not cancel'),
    })
  }

  const doExport = (kind) => {
    if (interviews.length === 0) return toast.error('Nothing to export')
    const name = `interviews-${tab}-${new Date().toISOString().slice(0, 10)}`
    if (kind === 'csv') exportCsv(interviews, COLUMNS, name)
    else exportExcel(interviews, COLUMNS, name, tab === 'upcoming' ? 'Upcoming Interviews' : 'Past Interviews')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5 text-xs">
          {[['upcoming', 'Upcoming Interviews'], ['past', 'Past']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`px-3 py-1 rounded-md font-semibold ${tab === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => doExport('xlsx')} title="Export to Excel" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5" /> Excel</button>
          <button onClick={() => doExport('csv')} title="Export to CSV" className="rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50">CSV</button>
          <button onClick={onSchedule} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700"><CalendarPlus className="h-3.5 w-3.5" /> Schedule</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && <p className="py-6 text-center text-xs text-gray-400">Loading…</p>}
        {!isLoading && interviews.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400">{tab === 'upcoming' ? 'No interviews scheduled.' : 'No past interviews yet.'}</p>
        )}
        {groups.map(([label, list, tone]) => (
          <div key={label} className="space-y-2">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${tone}`}>{label} · {list.length}</p>
            {list.map((i) => {
              const d = new Date(i.scheduled_at)
              return (
                <div key={i.id} data-hl={i.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 leading-tight">
                      <span className="text-sm font-black">{d.getDate()}</span>
                      <span className="text-[10px] font-semibold">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">{i.candidate} <span className="font-normal text-gray-500">· {i.role}</span></p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {i.mode && <span className="inline-flex items-center gap-1"><ModeIcon mode={i.mode} />{modeLabel[i.mode]}{i.location ? `: ${i.location}` : ''}</span>}
                        {i.interviewer && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{i.interviewer}</span>}
                        {i.candidate_phone && <a href={`tel:${i.candidate_phone}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><Phone className="h-3 w-3" />{i.candidate_phone}</a>}
                      </p>
                      {tab === 'past' && i.feedback && <p className="mt-1 text-[11px] text-gray-600">“{i.feedback}”</p>}
                    </div>
                  </div>
                  {tab === 'upcoming' ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      <button onClick={() => onOutcome(i)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Outcome</button>
                      <button onClick={() => onReschedule(i)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-gray-700 border border-gray-200 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> Reschedule</button>
                      <button onClick={() => cancel(i)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-rose-600 hover:bg-rose-50"><XCircle className="h-3.5 w-3.5" /> Cancel</button>
                    </div>
                  ) : (
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${i.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                      {i.status === 'completed' ? 'Completed' : 'Cancelled'}{i.candidate_stage ? ` · ${stageLabel[i.candidate_stage]}` : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default InterviewsPanel
