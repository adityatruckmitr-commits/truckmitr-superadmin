import { useMemo, useState } from 'react'
import { CalendarPlus, Download, Pencil, Plus, Search, Trash2, UserPlus, BadgeCheck } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useDeleteCandidate, useUpdateCandidateStage } from '../../hooks/useRecruitment'
import { exportCsv, exportExcel } from '../../utils/exportTable'
import { STAGES, stageLabel, stageBadge, fmtDate } from './shared'

const COLUMNS = [
  { header: 'Name', value: (c) => c.name },
  { header: 'Mobile', value: (c) => c.phone },
  { header: 'Email', value: (c) => c.email },
  { header: 'Job Opening', value: (c) => c.role },
  { header: 'Department', value: (c) => c.department },
  { header: 'Stage', value: (c) => stageLabel[c.stage] },
  { header: 'Applied On', value: (c) => fmtDate(c.applied_at) },
  { header: 'Hired On', value: (c) => (c.hired_at ? fmtDate(c.hired_at) : '') },
  { header: 'Employee ID', value: (c) => c.emp_id },
  { header: 'Notes', value: (c) => c.notes },
]

/** Every candidate by name: filter, move through stages, schedule interviews, onboard hires, export. */
const CandidatesPanel = ({ candidates, jobs, jobFilter, setJobFilter, onAdd, onEdit, onSchedule, onHired, onCreateEmployee }) => {
  const [stageFilter, setStageFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const setStage = useUpdateCandidateStage()
  const remove = useDeleteCandidate()

  const counts = useMemo(() => {
    const c = { all: 0 }
    candidates.forEach((x) => {
      if (jobFilter && String(x.job_opening_id) !== String(jobFilter)) return
      c.all++
      c[x.stage] = (c[x.stage] || 0) + 1
    })
    return c
  }, [candidates, jobFilter])

  const rows = candidates.filter((c) => {
    if (jobFilter && String(c.job_opening_id) !== String(jobFilter)) return false
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false
    const q = search.trim().toLowerCase()
    return !q || [c.name, c.phone, c.email, c.role].some((v) => String(v || '').toLowerCase().includes(q))
  })

  const changeStage = (c, stage) => {
    setStage.mutate({ id: c.id, stage }, {
      onSuccess: (res) => {
        toast.success(`${c.name} → ${stageLabel[stage]}`, { id: `stage-${c.id}` })
        if (stage === 'hired' && !c.emp_id) onHired(res.data || { ...c, stage })
      },
      onError: () => toast.error('Could not update the stage', { id: `stage-${c.id}` }),
    })
  }

  const handleDelete = (c) => {
    if (!window.confirm(`Remove ${c.name}? Their interviews are removed too.`)) return
    remove.mutate(c.id, {
      onSuccess: () => toast.success(`${c.name} removed`),
      onError: (err) => toast.error(err.response?.data?.message || 'Could not remove the candidate'),
    })
  }

  const jobName = jobs.find((j) => String(j.id) === String(jobFilter))?.title
  const doExport = (kind) => {
    setExportOpen(false)
    if (rows.length === 0) return toast.error('Nothing to export')
    const name = `candidates${jobName ? '-' + jobName.replace(/[^\w]+/g, '-') : ''}-${new Date().toISOString().slice(0, 10)}`
    if (kind === 'csv') exportCsv(rows, COLUMNS, name)
    else exportExcel(rows, COLUMNS, name, `Candidates${jobName ? ' - ' + jobName : ''}`)
  }

  return (
    <div id="candidates" className="bg-white rounded-xl border border-gray-200 shadow-2xs">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Candidates</h2>
          <p className="text-[11px] text-gray-400">Everyone who applied, was interviewed or was hired - by name.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white text-xs shadow-lg">
                  <button onClick={() => doExport('xlsx')} className="block w-full px-3 py-2 text-left hover:bg-gray-50">Excel (.xls)</button>
                  <button onClick={() => doExport('csv')} className="block w-full px-3 py-2 text-left hover:bg-gray-50">CSV</button>
                </div>
              </>
            )}
          </div>
          <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Candidate
          </button>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-50/60 border-b border-gray-100 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between text-xs">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {['all', ...STAGES].map((s) => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`shrink-0 px-2.5 py-1 rounded-md font-semibold transition-colors ${stageFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All' : stageLabel[s]} <span className="opacity-70">{counts[s] || 0}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="min-w-0 flex-1 lg:w-48 rounded-md border border-gray-200 bg-white px-2 py-1 focus:outline-hidden focus:border-blue-500">
            <option value="">All job openings</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <div className="relative flex-1 lg:w-44">
            <input type="text" placeholder="Name, mobile, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-7 pr-2 py-1 border border-gray-200 rounded-md focus:outline-hidden focus:border-blue-500 bg-white" />
            <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <th className="py-2.5 px-3">Candidate</th><th className="py-2.5 px-3">Job Opening</th><th className="py-2.5 px-3">Stage</th><th className="py-2.5 px-3">Applied</th><th className="py-2.5 px-3">Employee</th><th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {rows.length === 0 && (
              <tr><td colSpan="6" className="py-8 text-center text-gray-400">{candidates.length === 0 ? 'No candidates yet - add the people applying for your openings.' : 'No candidates match these filters.'}</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} data-hl={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 min-w-[180px]">
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-[11px] text-slate-500">{[c.phone, c.email].filter(Boolean).join(' · ') || '—'}</p>
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">{c.role}</td>
                <td className="py-2.5 px-3">
                  <select
                    value={c.stage}
                    onChange={(e) => changeStage(c, e.target.value)}
                    disabled={!!c.emp_id || (setStage.isPending && setStage.variables?.id === c.id)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold focus:outline-hidden disabled:opacity-80 ${stageBadge[c.stage]}`}
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{stageLabel[s]}</option>)}
                  </select>
                  {c.upcoming_interviews > 0 && <p className="mt-0.5 text-[10px] text-blue-600">{c.upcoming_interviews} interview scheduled</p>}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{fmtDate(c.applied_at)}</td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  {c.emp_id ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700"><BadgeCheck className="h-3.5 w-3.5" />{c.emp_id}</span>
                  ) : c.stage === 'hired' ? (
                    <button onClick={() => onCreateEmployee(c)} className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100">
                      <UserPlus className="h-3.5 w-3.5" /> Create employee
                    </button>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-end gap-1">
                    {!['hired', 'rejected'].includes(c.stage) && (
                      <button onClick={() => onSchedule(c)} title="Schedule interview" className="rounded-sm p-1.5 text-blue-600 hover:bg-blue-50"><CalendarPlus className="h-3.5 w-3.5" /></button>
                    )}
                    <button onClick={() => onEdit(c)} title="Edit" className="rounded-sm p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                    {!c.emp_id && (
                      <button onClick={() => handleDelete(c)} title="Remove" className="rounded-sm p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CandidatesPanel
