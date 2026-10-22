import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Paperclip, Pencil, Plus, RotateCcw, Send, X } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { Badge, Button, Skeleton, cx } from '../ui'
import { useInstantPreview, useIssuePayslip } from '../../hooks/useInstantPayslip'
import { errorText } from '../../hooks/useSelfService'
import { downloadPayslipPdf } from './payslipPdf'
import { inr2 } from './format'

const GROUPS = ['earnings', 'additions', 'deductions']
const MAX_AMOUNT = 100000000

let counter = 0
const nextId = () => `line-${++counter}`
const num = (v) => {
  const x = parseFloat(v)
  return Number.isFinite(x) ? x : 0
}
const sum = (rows) => rows.reduce((t, r) => t + num(r.amount), 0)
const round2 = (v) => Math.round(v * 100) / 100

// Amounts are kept as the text HR typed so "12." or an empty box behave; numbers only exist for maths.
const toState = (draft) => Object.fromEntries(GROUPS.map((g) => [g, draft[g].map((l) => ({ ...l, id: nextId(), amount: String(l.amount) }))]))

// What the server would store: zero-amount extra lines are dropped, so they do not count as an edit either.
const fingerprint = (lines) => JSON.stringify(GROUPS.map((g) => lines[g]
  .map((l) => [l.key, l.label, round2(num(l.amount))])
  .filter((r) => g === 'earnings' || r[2] !== 0)))

const Stat = ({ label, value, tone = 'text-gray-900', note }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
    <p className={cx('numeral mt-1 text-xl font-semibold', tone)}>{value}</p>
    {note && <p className="mt-0.5 text-[11px] text-gray-500">{note}</p>}
  </div>
)

const Chip = ({ label, value, bad }) => (
  <div className={cx('rounded-lg border px-3 py-2 text-center', bad && value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white')}>
    <p className={cx('numeral text-lg font-semibold', bad && value > 0 ? 'text-red-700' : 'text-gray-900')}>{value}</p>
    <p className="text-[11px] text-gray-500">{label}</p>
  </div>
)

const AmountInput = ({ value, onChange, label, invalid }) => (
  <input
    type="number" inputMode="decimal" min="0" step="0.01" value={value} aria-label={label}
    onChange={(e) => onChange(e.target.value)}
    className={cx('field-input numeral !w-32 !py-1.5 text-right', invalid && '!border-red-400')}
  />
)

/** One editable section (earnings / additions / deductions). Read-only until HR chooses to edit. */
const LineTable = ({ title, group, lines, editing, onAmount, onLabel, onRemove, onAdd, sign = '', tone = 'text-gray-900', addLabel, empty }) => (
  <section>
    <h4 className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-900">
      {title}
      {editing && addLabel && (
        <button type="button" onClick={() => onAdd(group)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900">
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </button>
      )}
    </h4>
    {lines.length === 0 ? (
      <p className="rounded-lg bg-gray-50 px-3 py-3 text-center text-sm text-gray-500">{empty}</p>
    ) : (
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {lines.map((l) => {
            const bad = l.amount !== '' && !(Number(l.amount) >= 0 && Number(l.amount) <= MAX_AMOUNT)
            return (
              <tr key={l.id}>
                <td className="py-1.5 pr-3 text-gray-700">
                  {editing && l.key === 'custom' ? (
                    <input
                      value={l.label} maxLength={80} placeholder="Name of this line" aria-label={`${title} line name`}
                      onChange={(e) => onLabel(group, l.id, e.target.value)} className="field-input !py-1.5"
                    />
                  ) : l.label}
                </td>
                <td className="whitespace-nowrap py-1.5 text-right">
                  {editing ? (
                    <span className="inline-flex items-center gap-1.5">
                      <AmountInput value={l.amount} onChange={(v) => onAmount(group, l.id, v)} label={l.label || `${title} amount`} invalid={bad} />
                      {group !== 'earnings' && (
                        <button type="button" onClick={() => onRemove(group, l.id)} className="rounded-sm p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${l.label || 'line'}`}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className={cx('numeral font-medium', tone)}>{sign}{inr2(num(l.amount))}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )}
  </section>
)

/**
 * "Generate payslip": the first thing HR sees is the accurate payslip computed from the employee's
 * attendance, leave and deductions. HR can then edit any amount (or add/remove an addition or deduction)
 * and send it straight to the employee's dashboard, where it can be downloaded as a PDF.
 */
const InstantPayslipModal = ({ row, onClose, onAttachFile }) => {
  const open = !!row
  const { data, isLoading, isError, error } = useInstantPreview(row?.employee_id, row?.period, open)
  const issue = useIssuePayslip()

  const [lines, setLines] = useState(null)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data) {
      setLines(toState(data.draft))
      setEditing(false)
      setMessage('')
    }
  }, [data])

  const view = useMemo(() => {
    if (!data || !lines) return null
    const gross = sum(lines.earnings)
    const additions = sum(lines.additions)
    const deductions = sum(lines.deductions)
    const net = round2(gross + additions - deductions)
    const changed = fingerprint(lines) !== fingerprint(toState(data.draft))

    const problems = []
    GROUPS.forEach((g) => lines[g].forEach((l) => {
      if (l.amount !== '' && !(Number(l.amount) >= 0 && Number(l.amount) <= MAX_AMOUNT)) problems.push(`Enter a valid amount for ${l.label || 'the new line'}.`)
      if (g !== 'earnings' && num(l.amount) > 0 && !l.label.trim()) problems.push('Give every line you add a name.')
    }))
    if (changed && net < 0) problems.push(`Deductions are ₹${round2(deductions - gross - additions).toLocaleString('en-IN')} more than earnings. Lower a deduction or raise an amount.`)

    return { gross, additions, deductions, net, changed, problems: [...new Set(problems)] }
  }, [data, lines])

  if (!row) return null

  const setField = (group, id, field, value) => setLines((L) => ({ ...L, [group]: L[group].map((l) => (l.id === id ? { ...l, [field]: value } : l)) }))
  const onAmount = (g, id, v) => setField(g, id, 'amount', v)
  const onLabel = (g, id, v) => setField(g, id, 'label', v)
  const onRemove = (g, id) => setLines((L) => ({ ...L, [g]: L[g].filter((l) => l.id !== id) }))
  const onAdd = (g) => setLines((L) => ({ ...L, [g]: [...L[g], { id: nextId(), key: 'custom', label: '', amount: '' }] }))
  const reset = () => { setLines(toState(data.draft)); setEditing(false) }

  const firstName = (row.full_name || 'the employee').split(' ')[0]
  const blocked = isError ? errorText(error, 'Could not calculate this payslip') : null
  const canSend = !!view && view.problems.length === 0 && !issue.isPending

  const payload = () => (view.changed ? {
    earnings: lines.earnings.map((l) => ({ key: l.key, amount: num(l.amount) })),
    additions: lines.additions.filter((l) => num(l.amount) > 0).map((l) => ({ key: l.key, label: l.label.trim(), amount: num(l.amount) })),
    deductions: lines.deductions.filter((l) => num(l.amount) > 0).map((l) => ({ key: l.key, label: l.label.trim(), amount: num(l.amount) })),
  } : undefined)

  const send = async () => {
    try {
      const res = await issue.mutateAsync({ employeeId: row.employee_id, month: row.period, lines: payload(), message: message.trim(), requestId: row.id })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not send the payslip'))
    }
  }

  // The same PDF the employee will get, built from what is on screen right now.
  const previewPdf = async () => {
    try {
      const shown = (rows, keep = false) => rows.filter((l) => keep || num(l.amount) > 0).map((l) => ({ key: l.key, label: l.label || 'Other', full: num(l.amount), amount: num(l.amount) }))
      await downloadPayslipPdf({
        ...data.slip,
        lines: { earnings: shown(lines.earnings, true), additions: shown(lines.additions), deductions: shown(lines.deductions) },
        gross: view.gross, total_additions: view.additions, total_deductions: view.deductions, net_payable: Math.max(0, view.net),
      }, { startDate: data.period.start_date, endDate: data.period.end_date })
    } catch (e) {
      console.error(e)
      toast.error('Could not build the PDF preview')
    }
  }

  const a = data?.slip?.attendance
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="ghost" icon={Paperclip} onClick={() => onAttachFile?.(row)}>Attach a file instead</Button>
      {view && (
        <>
          <Button variant="secondary" icon={Download} onClick={previewPdf}>Preview PDF</Button>
          <Button icon={Send} onClick={send} loading={issue.isPending} disabled={!canSend}>Send to {firstName}</Button>
        </>
      )}
    </>
  )

  return (
    <Modal open onClose={onClose} size="lg" title="Generate payslip"
      subtitle={`${row.full_name} · ${row.period_label || row.period}${data?.employee?.designation ? ` · ${data.employee.designation}` : ''}`}
      footer={footer}>
      {isLoading && (
        <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-40 w-full" /></div>
      )}

      {blocked && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3.5 text-sm text-yellow-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">A payslip can’t be generated for this request</p>
            <p className="mt-0.5">{blocked}</p>
          </div>
        </div>
      )}

      {view && (
        <div className="space-y-5">
          {view.changed ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              <span>
                <b>You changed this payslip.</b> Calculated net pay was {inr2(data.slip.net_payable)}; {firstName} will receive {inr2(Math.max(0, view.net))}.
              </span>
              <Button size="sm" variant="secondary" icon={RotateCcw} onClick={reset}>Reset to calculated</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
              <span>Calculated from {firstName}’s attendance, leave and deductions for {data.month_label}. This is exactly what will be sent unless you edit it.</span>
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing((v) => !v)}>{editing ? 'Stop editing' : 'Edit amounts'}</Button>
            </div>
          )}
          {view.changed && (
            <div className="-mt-2 flex justify-end">
              <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing((v) => !v)}>{editing ? 'Stop editing' : 'Edit amounts'}</Button>
            </div>
          )}

          {data.existing && (
            <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600">
              A payslip for this month was already sent{data.existing.issued_at ? ` on ${format(new Date(data.existing.issued_at), 'd MMM yyyy, h:mm a')}` : ''}
              {data.existing.edited ? ' (edited)' : ''}. Sending again replaces it.
            </p>
          )}

          {data.slip.warnings?.length > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-yellow-800"><AlertTriangle className="h-4 w-4" /> Check before sending</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-yellow-800">{data.slip.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              <p className="mt-1.5 text-xs text-yellow-700">If attendance is missing, correct it in All Attendance and reopen this dialog — or edit the amounts here.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Gross pay" value={inr2(view.gross + view.additions)} note={view.additions > 0 ? `incl. ${inr2(view.additions)} additions` : undefined} />
            <Stat label="Deductions" value={`−${inr2(view.deductions)}`} tone="text-red-700" />
            <Stat label="Net pay" value={inr2(Math.max(0, view.net))} tone="text-green-700" note={view.changed ? `Calculated: ${inr2(data.slip.net_payable)}` : undefined} />
          </div>

          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              Attendance in {data.month_label} <Badge tone="neutral">{a.period_days} days</Badge>
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <Chip label="Present" value={a.present_days} />
              <Chip label="WFH" value={a.wfh_days} />
              <Chip label="Paid leave" value={a.leave_days} />
              <Chip label="Holidays" value={a.holiday_days} />
              <Chip label="Week-offs" value={a.week_off_days} />
              <Chip label="Absent" value={a.absent_days} bad />
              <Chip label="Unpaid days" value={a.unpaid_days} bad />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Per-day salary {inr2(data.slip.per_day_salary)}. Unpaid days (absent{a.unpaid_leave_days ? ', unpaid leave' : ''}{a.week_off_unpaid_days ? ', sandwiched week-offs' : ''}) come off as Loss of Pay.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <LineTable title="Earnings" group="earnings" lines={lines.earnings} editing={editing} onAmount={onAmount} onLabel={onLabel} onRemove={onRemove} onAdd={onAdd} empty="No salary components are set for this employee." />
              <LineTable title="Additions" group="additions" lines={lines.additions} editing={editing} onAmount={onAmount} onLabel={onLabel} onRemove={onRemove} onAdd={onAdd}
                sign="+" tone="text-green-700" addLabel="Add addition" empty="No bonus or reimbursement this month." />
            </div>
            <div className="space-y-4">
              <LineTable title="Deductions" group="deductions" lines={lines.deductions} editing={editing} onAmount={onAmount} onLabel={onLabel} onRemove={onRemove} onAdd={onAdd}
                sign="−" tone="text-red-700" addLabel="Add deduction" empty="No deductions this month." />
              <div className="flex items-center justify-between rounded-xl bg-primary-800 px-4 py-3 text-white">
                <span className="text-sm font-medium">Net pay</span>
                <span className="numeral text-xl font-semibold">{inr2(Math.max(0, view.net))}</span>
              </div>
            </div>
          </div>

          {view.problems.length > 0 && (
            <ul className="list-disc space-y-0.5 rounded-lg bg-red-50 py-2.5 pl-8 pr-4 text-sm text-red-700">
              {view.problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}

          <div>
            <label className="field-label">Message to {firstName} <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={500} className="field-input" placeholder="Shown in their notification, e.g. Includes the festival bonus." />
            <p className="mt-1 text-xs text-gray-500">{firstName} gets a notification, and the payslip appears in Payslips on their dashboard, ready to download as a PDF.</p>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default InstantPayslipModal
