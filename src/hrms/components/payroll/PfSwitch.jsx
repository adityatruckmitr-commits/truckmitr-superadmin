import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { Button, cx } from '../ui'
import { apiError, useUpdatePayrollSettings } from '../../hooks/usePayroll'
import { describePf } from './format'

/**
 * The company-wide "PF deduction" switch. On: PF follows the rules HR set (the default rule plus each
 * employee's own). Off: no PF is deducted from anyone - the rules are kept, so turning it back on restores them.
 * Either way it applies to months not finalized yet; a finalized month keeps the figures it was frozen with.
 */
const PfSwitch = ({ settings }) => {
  const save = useUpdatePayrollSettings()
  const [confirm, setConfirm] = useState(null) // 'on' | 'off'
  if (!settings) return null

  const on = settings.pf_enabled !== false
  const noDefaultRule = settings.pf_mode === 'none'
  const rule = describePf({ mode: 'percent_basic', value: settings.pf_value, ceiling: settings.pf_wage_ceiling })

  const apply = async () => {
    try {
      // Turning PF on with no default rule would change nothing, so use the settings' own standard rule
      // (12% of basic, wage cap ₹15,000 unless HR changed them). Anyone with their own PF rule keeps it.
      const body = confirm === 'on'
        ? { pf_enabled: true, ...(noDefaultRule && { pf_mode: 'percent_basic' }) }
        : { pf_enabled: false }
      await save.mutateAsync(body)
      toast.success(confirm === 'on' ? 'PF deduction is on' : 'PF deduction is off')
      setConfirm(null)
    } catch (e) {
      toast.error(apiError(e, 'Could not change the PF setting'))
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-700">PF deduction</span>
        <button
          type="button" role="switch" aria-checked={on} aria-label="PF deduction"
          onClick={() => setConfirm(on ? 'off' : 'on')}
          className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', on ? 'bg-primary-700' : 'bg-gray-300')}
        >
          <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
        <span className={cx('text-xs', on ? 'text-gray-600' : 'font-medium text-yellow-700')}>
          {on ? 'On — deducted as per each employee’s rule' : 'Off — no PF is deducted from anyone'}
        </span>
      </div>

      <Modal
        open={!!confirm} onClose={() => setConfirm(null)} size="sm"
        title={confirm === 'on' ? 'Turn PF deduction on?' : 'Turn PF deduction off?'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button onClick={apply} loading={save.isPending}>{confirm === 'on' ? 'Turn on' : 'Turn off'}</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-gray-700">
          {confirm === 'on' ? (
            <>
              <p>PF will be deducted again from every employee who has a PF rule.</p>
              {noDefaultRule ? (
                <p className="rounded-lg bg-yellow-50 px-3.5 py-2.5 text-yellow-800">
                  No default PF rule is set yet, so <b>{rule}</b> will be used for everyone who isn’t set individually.
                  You can change this under Deductions.
                </p>
              ) : (
                <p className="rounded-lg bg-gray-50 px-3.5 py-2.5">
                  Default: <b>{describePf({ mode: settings.pf_mode, value: settings.pf_value, ceiling: settings.pf_wage_ceiling })}</b>.
                  Employees whose PF HR set individually keep their own rule.
                </p>
              )}
            </>
          ) : (
            <p>No PF will be deducted from anyone — including employees whose PF HR set individually. Their rules are kept, so turning PF back on restores them.</p>
          )}
          <p className="text-xs text-gray-500">This applies to months you haven’t finalized yet. Finalized months keep the figures they were frozen with.</p>
        </div>
      </Modal>
    </>
  )
}

export default PfSwitch
