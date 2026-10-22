import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { EmployeeCell } from './OverviewTab'
import { Button } from '../ui'
import { apiError, useDisburseSalary } from '../../hooks/usePayroll'
import { monthLabel } from './format'

/**
 * "Salary initiated" / "Salary credited": HR ticks the employees the payment applies to (everyone by default),
 * submits, and is asked WHY for anyone left unticked - those salaries go on hold with that reason, which the
 * employee then sees on their dashboard.
 */
export const DISBURSE = {
  initiated: { button: 'Salary initiated', title: 'Mark salary as initiated', done: 'initiated', blurb: 'The payment has been sent to the bank.' },
  credited: { button: 'Salary credited', title: 'Mark salary as credited', done: 'credited', blurb: 'The money has reached their accounts.' },
}

// Who the action can still apply to: nobody already credited, and for "initiated" nobody already initiated.
export const canDisburse = (row, mode) => row.pay_status !== 'paid' && !(mode === 'initiated' && row.pay_status === 'initiated')

export const useDisburseSelection = (rows, mode) => {
  const eligible = useMemo(() => (mode ? rows.filter((r) => canDisburse(r, mode)) : []), [rows, mode])
  const [selected, setSelected] = useState(() => new Set())

  // Starting the action ticks everyone - except salaries already on hold, which stay held until HR ticks them to release.
  useEffect(() => {
    setSelected(new Set(eligible.filter((r) => r.pay_status !== 'on_hold').map((r) => r.employee_id)))
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const eligibleIds = useMemo(() => new Set(eligible.map((r) => r.employee_id)), [eligible])

  return {
    eligible,
    isEligible: (id) => eligibleIds.has(id),
    isSelected: (id) => selected.has(id),
    chosen: eligible.filter((r) => selected.has(r.employee_id)),
    unselected: eligible.filter((r) => !selected.has(r.employee_id)),
    toggle: (id) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }),
    selectAll: () => setSelected(new Set(eligible.map((r) => r.employee_id))),
    clearAll: () => setSelected(new Set()),
  }
}

export const DisburseBar = ({ mode, sel, onCancel, onSubmit }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 bg-primary-50/70 px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-primary-900">{DISBURSE[mode].title}</p>
      <p className="text-xs text-primary-800/80">
        <b>{sel.chosen.length}</b> of {sel.eligible.length} selected. Untick anyone whose salary should be held back — you’ll be asked why.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={sel.selectAll}>Select all</Button>
      <Button variant="ghost" size="sm" onClick={sel.clearAll}>Clear</Button>
      <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
      <Button size="sm" onClick={onSubmit} disabled={sel.eligible.length === 0}>Submit</Button>
    </div>
  </div>
)

export const DisburseConfirmModal = ({ open, mode, sel, month, onClose, onDone }) => {
  const disburse = useDisburseSalary()
  const [reasons, setReasons] = useState({})

  // Open with any reason already given (a salary that was on hold keeps its old reason to edit).
  useEffect(() => {
    if (open) setReasons(Object.fromEntries(sel.unselected.map((r) => [r.employee_id, r.hold_reason || ''])))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !mode) return null
  const cfg = DISBURSE[mode]
  const holding = sel.unselected
  const ready = holding.every((r) => (reasons[r.employee_id] || '').trim().length >= 3)

  const submit = async () => {
    try {
      const res = await disburse.mutateAsync({
        month, action: mode,
        selected: sel.chosen.map((r) => r.employee_id),
        hold: holding.map((r) => ({ employee_id: r.employee_id, reason: reasons[r.employee_id].trim() })),
      })
      toast.success(res.message)
      onDone()
    } catch (e) {
      toast.error(apiError(e, 'Could not update salary status'))
    }
  }

  return (
    <Modal
      open onClose={onClose} size="md"
      title={holding.length ? 'Why are these salaries on hold?' : `Mark all ${sel.chosen.length} salaries as ${cfg.done}?`}
      subtitle={monthLabel(month)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button onClick={submit} loading={disburse.isPending} disabled={!ready}>
            Confirm{sel.chosen.length ? ` · ${sel.chosen.length} ${cfg.done}` : ''}{holding.length ? ` · ${holding.length} on hold` : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700">
          <b>{sel.chosen.length}</b> salar{sel.chosen.length === 1 ? 'y' : 'ies'} will be marked <b>{cfg.done}</b> — {cfg.blurb}
          {holding.length > 0 && <> <b>{holding.length}</b> will be put <b>on hold</b>.</>} Employees are notified.
        </p>

        {holding.length > 0 && (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-xs text-gray-500">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-600" />
              Each employee sees their reason on their dashboard, so keep it clear and professional.
            </p>
            {holding.map((r) => (
              <div key={r.employee_id} className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 text-xs"><EmployeeCell row={r} /></div>
                <textarea
                  value={reasons[r.employee_id] || ''} rows={2} maxLength={500}
                  onChange={(e) => setReasons((p) => ({ ...p, [r.employee_id]: e.target.value }))}
                  placeholder="Why is this salary on hold? e.g. Bank details are missing"
                  className="field-input" aria-label={`Reason for ${r.full_name}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
