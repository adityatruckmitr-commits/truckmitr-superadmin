import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '../payroll/Modal'
import { Button, cx } from '../ui'
import { downloadAttendanceUploadSample, readBlobError, useBulkAttendanceUpload } from '../../hooks/useAttendance'

const STATUS_TEXT = { present: 'Present', absent: 'Absent', wfh: 'Work from home', on_leave: 'Paid leave' }
const fmtDate = (d) => format(new Date(`${d}T00:00:00`), 'd MMM yyyy')
const monthName = (m) => format(new Date(`${m}-01T00:00:00`), 'MMMM yyyy')

const Step = ({ n, title, children }) => (
  <section className="rounded-xl border border-gray-200 p-4">
    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white">{n}</span>
      {title}
    </h4>
    {children}
  </section>
)

const Tile = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-center">
    <p className={cx('numeral text-xl font-semibold', tone || 'text-gray-900')}>{value}</p>
    <p className="text-[11px] text-gray-500">{label}</p>
  </div>
)

/**
 * Bulk attendance: 1) download a sample sheet for any month, 2) fill it in, 3) upload it. The upload is
 * checked first and only saved when HR confirms, so nothing changes until they have seen exactly what will.
 */
const BulkUploadModal = ({ open, onClose, initialMonth, onDone }) => {
  const upload = useBulkAttendanceUpload()
  const fileInput = useRef(null)
  const [month, setMonth] = useState(initialMonth)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null) // the "check" report
  const [problem, setProblem] = useState(null) // a whole-file failure message
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (open) { setMonth(initialMonth); setIncludeInactive(false); setFile(null); setResult(null); setProblem(null) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setResult(null); setProblem(null) }
  const message = async (e, fallback) => (await readBlobError(e)) || e?.response?.data?.message || fallback

  const sample = async () => {
    setDownloading(true)
    try {
      const name = await downloadAttendanceUploadSample({ month, includeInactive })
      toast.success(`Downloaded ${name}`)
    } catch (e) {
      toast.error(await message(e, 'Could not download the sample'))
    } finally {
      setDownloading(false)
    }
  }

  const check = async () => {
    reset()
    try {
      const res = await upload.mutateAsync({ month, file, dryRun: true })
      setResult(res.data)
    } catch (e) {
      setProblem(await message(e, 'Could not read that file'))
    }
  }

  const save = async () => {
    try {
      const res = await upload.mutateAsync({ month, file, dryRun: false })
      toast.success(res.message)
      onDone?.(month)
      onClose()
    } catch (e) {
      setProblem(await message(e, 'Could not save the attendance'))
      setResult(null)
    }
  }

  const s = result?.summary
  const changes = s ? s.create + s.update : 0

  return (
    <Modal
      open={open} onClose={onClose} size="lg" title="Bulk attendance upload" subtitle="Fill a whole month for many employees at once"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {result?.can_apply
            ? <Button icon={CheckCircle2} onClick={save} loading={upload.isPending}>Save {changes} change{changes === 1 ? '' : 's'}</Button>
            : <Button icon={Upload} onClick={check} loading={upload.isPending} disabled={!file}>Check file</Button>}
        </>
      }
    >
      <div className="space-y-4">
        <Step n={1} title="Download the sample sheet">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="field-label">Month</label>
              <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); reset() }} className="field-input !w-auto" />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-gray-700">
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="h-4 w-4 rounded-sm border-gray-300 text-primary-700" />
              Include inactive employees
            </label>
            <Button variant="secondary" icon={Download} onClick={sample} loading={downloading} disabled={!month}>Download sample (.xlsx)</Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Any month works. One row per employee, one column per day; week-offs and holidays are pre-marked, and the day cells have a dropdown.
          </p>
        </Step>

        <Step n={2} title="Fill it in">
          <div className="flex flex-wrap gap-2 text-xs">
            {[['P', 'Present'], ['A', 'Absent'], ['WFH', 'Work from home'], ['L', 'Paid leave']].map(([c, t]) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1"><b className="font-mono text-gray-900">{c}</b><span className="text-gray-500">{t}</span></span>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1"><b className="font-mono text-gray-900">blank</b><span className="text-gray-500">keep what is already recorded</span></span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Only past days can be filled. It saves to <b>Approved (payroll)</b> attendance — the one payroll uses — so look for it under the “Approved (payroll)” view on this page (Punch records are what employees marked in the app). A month with finalized payroll can’t be changed.</p>
        </Step>

        <Step n={3} title="Upload the filled sheet">
          <input
            ref={fileInput} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); reset() }}
          />
          <button
            type="button" onClick={() => fileInput.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-left text-sm hover:border-primary-300 hover:bg-primary-50/40"
          >
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-700" />
            <span className="min-w-0">
              <b className="block truncate font-medium text-gray-900">{file ? file.name : 'Choose the filled Excel file'}</b>
              <span className="text-xs text-gray-500">{file ? 'Choose another to replace it' : '.xlsx, .xls or .csv — you will see exactly what changes before anything is saved'}</span>
            </span>
          </button>

          {problem && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{problem}</p>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-900">{monthName(result.month)} · {result.file}</p>
              <div className={cx('grid grid-cols-2 gap-2 sm:grid-cols-4', result.error_count > 0 && 'opacity-50')}>
                <Tile label="Employees matched" value={s.employees_matched} />
                <Tile label="New entries" value={s.create} tone="text-green-700" />
                <Tile label="Entries changed" value={s.update} tone="text-yellow-700" />
                <Tile label="Already match" value={s.unchanged} />
              </div>
              {(s.off_day_cells_ignored > 0 || s.before_joining_ignored > 0) && (
                <p className="text-xs text-gray-500">
                  {s.off_day_cells_ignored > 0 && `${s.off_day_cells_ignored} week-off / holiday cell(s) ignored. `}
                  {s.before_joining_ignored > 0 && `${s.before_joining_ignored} cell(s) before joining date skipped.`}
                </p>
              )}

              {result.error_count > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                  <p className="mb-1.5 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{result.error_count} problem{result.error_count === 1 ? '' : 's'} — nothing is saved until the sheet is fixed and checked again</p>
                  <ul className="max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs">
                    {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                  </ul>
                  {result.error_count > result.errors.length && <p className="mt-1 text-xs">…and {result.error_count - result.errors.length} more.</p>}
                </div>
              )}
              {result.warnings.length > 0 && (
                <ul className="list-disc space-y-0.5 rounded-lg bg-yellow-50 px-3.5 py-2.5 pl-8 text-xs text-yellow-800">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}

              {changes > 0 && result.error_count === 0 && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <p className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                    What will change{changes > result.changes.length ? ` (first ${result.changes.length} of ${changes})` : ''}
                  </p>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-100">
                      {result.changes.map((c, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-medium text-gray-900">{c.name}</td>
                          <td className="px-3 py-1.5 text-gray-500">{fmtDate(c.date)}</td>
                          <td className="px-3 py-1.5 text-right text-gray-600">
                            {c.from_status ? <>{STATUS_TEXT[c.from_status]} → </> : <span className="text-green-700">new · </span>}<b className="text-gray-900">{STATUS_TEXT[c.to_status]}</b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.error_count === 0 && changes === 0 && (
                <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600">Nothing to save — every filled cell already matches what is recorded.</p>
              )}
            </div>
          )}
        </Step>
      </div>
    </Modal>
  )
}

export default BulkUploadModal
