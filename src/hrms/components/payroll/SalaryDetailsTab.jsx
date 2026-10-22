import { useEffect, useState } from 'react'
import { AlertTriangle, Pencil, Wand2 } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { EmployeeCell, FilterBar, Pagination, th, useEmployeeFilter } from './OverviewTab'
import { Badge, Button, Card, Empty, SkeletonRows, cx } from '../ui'
import { apiError, useUpdateSalaryStructure } from '../../hooks/usePayroll'
import { describePf, inr, inr2, num, previewPf } from './format'
import { PfFields, PfSourceBadge, pfDraft, pfErrors, pfFallback, pfPayload } from './PfFields'

const r2 = (n) => Math.round(n * 100) / 100
const toInput = (n) => (n ? String(n) : '')

const FIELDS = [
  { key: 'basic_salary', label: 'Basic salary' },
  { key: 'hra', label: 'HRA (house rent allowance)' },
  { key: 'conveyance_allowance', label: 'Conveyance allowance' },
  { key: 'special_allowance', label: 'Special allowance' },
]

const MoneyInput = ({ label, value, onChange, hint, invalid }) => (
  <div>
    <label className="field-label">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
      <input
        type="number" min="0" step="0.01" inputMode="decimal" value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx('field-input numeral !pl-7', invalid && '!border-red-400')}
      />
    </div>
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
)

const SalaryEditModal = ({ row, settings, onClose }) => {
  const update = useUpdateSalaryStructure()
  const [f, setF] = useState({ ctc: '', basic_salary: '', hra: '', conveyance_allowance: '', special_allowance: '' })
  const [pf, setPf] = useState(pfDraft(null))

  useEffect(() => {
    if (!row) return
    const s = row.structure
    setF({
      ctc: toInput(s.ctc || s.gross),
      basic_salary: toInput(s.basic),
      hra: toInput(s.hra),
      conveyance_allowance: toInput(s.conveyance),
      // A lump-sum-only employee starts with the whole amount as special allowance to be split.
      special_allowance: toInput(s.complete ? s.special : s.unallocated),
    })
    setPf(pfDraft(row.rule))
  }, [row])

  const set = (key) => (value) => setF((p) => ({ ...p, [key]: value }))
  const gross = r2(FIELDS.reduce((t, x) => t + num(f[x.key]), 0))
  const ctc = num(f.ctc)

  const errors = []
  if (gross <= 0) errors.push('Enter at least one salary component.')
  if (ctc > 0 && gross > ctc) errors.push(`Gross (${inr2(gross)}) cannot be higher than CTC (${inr2(ctc)}).`)
  if (FIELDS.some((x) => num(f[x.key]) < 0) || ctc < 0) errors.push('Amounts cannot be negative.')
  errors.push(...pfErrors(pf))
  const heavy = gross > 500000

  // 40% basic, HRA 40% of basic, 10% conveyance, the rest special allowance.
  const standardSplit = () => {
    const base = ctc || gross
    if (!base) return toast.error('Enter the monthly CTC first')
    const basic = r2(base * 0.4)
    const hra = r2(basic * 0.4)
    const conv = r2(base * 0.1)
    setF((p) => ({
      ...p, ctc: p.ctc || String(base),
      basic_salary: String(basic), hra: String(hra), conveyance_allowance: String(conv),
      special_allowance: String(r2(base - basic - hra - conv)),
    }))
  }
  const balanceSpecial = () => {
    const rest = r2(ctc - num(f.basic_salary) - num(f.hra) - num(f.conveyance_allowance))
    if (!ctc) return toast.error('Enter the monthly CTC first')
    if (rest < 0) return toast.error('Basic + HRA + conveyance already exceed the CTC')
    set('special_allowance')(String(rest))
  }

  const save = async () => {
    try {
      const res = await update.mutateAsync({
        employeeId: row.employee_id,
        ctc: ctc || gross,
        basic_salary: num(f.basic_salary),
        hra: num(f.hra),
        conveyance_allowance: num(f.conveyance_allowance),
        special_allowance: num(f.special_allowance),
        ...pfPayload(pf),
      })
      toast.success(res.message || 'Salary structure saved')
      res.warnings?.forEach((w) => toast(w, { icon: '⚠️' }))
      onClose()
    } catch (e) {
      toast.error(apiError(e, 'Could not save salary structure'))
    }
  }

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title="Edit salary structure"
      subtitle={row ? `${row.full_name} · ${row.employee_id}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={update.isPending} disabled={errors.length > 0}>Save salary</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Wand2} onClick={standardSplit}>Apply standard split</Button>
          <Button variant="secondary" size="sm" onClick={balanceSpecial}>Balance special allowance to CTC</Button>
        </div>

        <MoneyInput
          label="Monthly CTC (cost to company)"
          value={f.ctc}
          onChange={set('ctc')}
          hint={ctc > 0 ? `Annual equivalent ${inr(ctc * 12)}` : 'Enter the per-month amount, not the yearly package.'}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((x) => (
            <MoneyInput
              key={x.key}
              label={x.label}
              value={f[x.key]}
              onChange={set(x.key)}
              hint={gross > 0 && num(f[x.key]) > 0 ? `${((num(f[x.key]) / gross) * 100).toFixed(1)}% of gross` : undefined}
            />
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-700">Gross salary (total per month)</span>
            <span className="numeral text-2xl font-semibold text-gray-900">{inr2(gross)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Calculated as the sum of the four components above — it can't be typed separately, so it never disagrees with them.
            {ctc > gross && gross > 0 && ` CTC exceeds gross by ${inr2(ctc - gross)} (employer contributions / other benefits).`}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900">Provident Fund (PF) deduction</h4>
            <span className="text-xs text-gray-500">Decided by HR for {row?.full_name?.split(' ')[0] || 'this employee'}</span>
          </div>
          <PfFields
            value={pf}
            onChange={(patch) => setPf((p) => ({ ...p, ...patch }))}
            basic={num(f.basic_salary)}
            settings={settings}
            fallback={pfFallback(row, settings)}
          />
          <p className="mt-2 text-xs text-gray-500">
            Shown on payroll and the payslip. Changes apply to months you haven’t run yet — payrolls already run stay as they were.
          </p>
        </div>

        {heavy && !errors.length && (
          <p className="flex items-start gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {inr(gross)} per month is unusually high. Check this is a monthly figure and not the annual package.
          </p>
        )}
        {errors.map((e) => (
          <p key={e} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
          </p>
        ))}
      </div>
    </Modal>
  )
}

// The employee's PF at a glance: the full-month amount, and the rule behind it.
const PfCell = ({ row, pfEnabled }) => {
  const pf = row.effective_rules?.pf_configured || row.effective_rules?.pf
  if (!pfEnabled) return <span className="text-yellow-700">PF off</span>
  if (!pf || pf.mode === 'none') return <span className="text-gray-400">Not deducted</span>
  const amount = previewPf(pf.mode, pf.value, pf.ceiling, row.structure.basic)
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="numeral inline-flex items-center gap-1.5 font-semibold text-gray-900">
        {amount > 0 ? inr(amount) : '—'}
        <PfSourceBadge source={pf.source} />
      </span>
      <span className="max-w-[9rem] whitespace-normal text-right text-[10px] font-normal leading-tight text-gray-500">{describePf(pf)}</span>
    </div>
  )
}

const SalaryDetailsTab = ({ employees, settings, loading, activeOnly = false }) => {
  const scoped = (employees || []).filter((e) => !activeOnly || e.is_active)
  const f = useEmployeeFilter(scoped)
  const [editing, setEditing] = useState(null)
  const incomplete = scoped.filter((e) => !e.structure.complete).length

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Salary Details</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Monthly amounts set by HR, including each employee’s PF deduction. Payroll uses these every month until you change them.
              {incomplete > 0 && <span className="ml-1 font-medium text-yellow-700">{incomplete} employee(s) still need a component split.</span>}
            </p>
          </div>
          <FilterBar f={f} />
        </div>

        {loading ? (
          <div className="p-5"><SkeletonRows rows={6} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-medium text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className={th}>Employee</th>
                  <th className={cx(th, 'text-right')}>CTC</th>
                  <th className={cx(th, 'text-right')}>Basic</th>
                  <th className={cx(th, 'text-right')}>HRA (Rent)</th>
                  <th className={cx(th, 'text-right')}>Conveyance</th>
                  <th className={cx(th, 'text-right')}>Special</th>
                  <th className={cx(th, 'text-right')}>Gross (Total)</th>
                  <th className={cx(th, 'text-right')}>PF (Monthly)</th>
                  <th className={th}>Check</th>
                  <th className={cx(th, 'text-center')}>Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {f.visible.map((e) => {
                  const s = e.structure
                  return (
                    <tr key={e.employee_id} className="whitespace-nowrap transition-colors hover:bg-gray-50/80">
                      <td className="px-3.5 py-3"><EmployeeCell row={e} /></td>
                      <td className="numeral px-3.5 py-3 text-right text-gray-600">{inr(s.ctc)}</td>
                      <td className="numeral px-3.5 py-3 text-right">{s.complete ? inr(s.basic) : '—'}</td>
                      <td className="numeral px-3.5 py-3 text-right">{s.complete ? inr(s.hra) : '—'}</td>
                      <td className="numeral px-3.5 py-3 text-right">{s.complete ? inr(s.conveyance) : '—'}</td>
                      <td className="numeral px-3.5 py-3 text-right">{s.complete ? inr(s.special) : '—'}</td>
                      <td className="numeral px-3.5 py-3 text-right font-bold text-gray-900">{inr(s.gross)}</td>
                      <td className="px-3.5 py-3 text-right"><PfCell row={e} pfEnabled={settings?.pf_enabled !== false} /></td>
                      <td className="px-3.5 py-3">
                        {e.warnings.length === 0 ? (
                          <Badge tone="success">OK</Badge>
                        ) : (
                          <span title={e.warnings.join('\n')}><Badge tone="warning" icon={AlertTriangle}>{e.warnings[0]}</Badge></span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <button onClick={() => setEditing(e)} title="Edit salary"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {f.filtered.length === 0 && <Empty title="No employees found" />}
          </div>
        )}
        <Pagination f={f} />
      </Card>

      <SalaryEditModal row={editing} settings={settings} onClose={() => setEditing(null)} />
    </>
  )
}

export default SalaryDetailsTab
