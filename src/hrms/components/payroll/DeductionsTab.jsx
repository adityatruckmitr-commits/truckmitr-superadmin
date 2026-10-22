import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Pencil, RotateCcw, SlidersHorizontal } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import Modal from './Modal'
import AdjustmentsPanel from './AdjustmentsPanel'
import { EmployeeCell, FilterBar, Pagination, th, useEmployeeFilter } from './OverviewTab'
import { Badge, Button, Card, Empty, SkeletonRows, cx } from '../ui'
import { apiError, useUpdateDeductionRules, useUpdatePayrollSettings } from '../../hooks/usePayroll'
import { describeEsi, describePf, inr, inr2, num } from './format'
import { PfFields, pfFallback } from './PfFields'

const MODE_LABEL = {
  none: 'Not deducted',
  percent_basic: '% of basic salary',
  percent_gross: '% of gross salary',
  fixed: 'Fixed amount (₹)',
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
)

const Money = ({ value, onChange, placeholder, prefix = '₹', invalid, ...rest }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>
    <input
      type="number" min="0" step="0.01" inputMode="decimal" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx('field-input numeral !pl-7', invalid && '!border-red-400')} {...rest}
    />
  </div>
)

const Toggle = ({ checked, onChange, title, description }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3.5 py-3 hover:border-gray-300">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-primary-700" />
    <span>
      <span className="block text-sm font-medium text-gray-900">{title}</span>
      <span className="block text-xs text-gray-500">{description}</span>
    </span>
  </label>
)

/* ------------------------------------------------------------------ *
 * Organisation defaults + attendance rules
 * ------------------------------------------------------------------ */
const toForm = (s) => ({
  per_day_basis: s.per_day_basis,
  unpaid_leave_is_lop: s.unpaid_leave_is_lop,
  sandwich_policy: s.sandwich_policy,
  prorate_fixed_deductions: s.prorate_fixed_deductions,
  auto_deduct_loans: s.auto_deduct_loans,
  pf_mode: s.pf_mode, pf_value: String(s.pf_value), pf_wage_ceiling: String(s.pf_wage_ceiling),
  esi_mode: s.esi_mode, esi_value: String(s.esi_value), esi_gross_ceiling: String(s.esi_gross_ceiling),
  pt_amount: String(s.pt_amount),
})

const SettingsPanel = ({ settings }) => {
  const save = useUpdatePayrollSettings()
  const [f, setF] = useState(null)
  const [open, setOpen] = useState(true)

  useEffect(() => { if (settings) setF(toForm(settings)) }, [settings])
  if (!f) return <Card className="p-5"><SkeletonRows rows={2} /></Card>

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  const dirty = JSON.stringify(f) !== JSON.stringify(toForm(settings))
  const tooBig = (mode, val, pctMode) => mode === pctMode && num(val) > 100
  const invalid = tooBig(f.pf_mode, f.pf_value, 'percent_basic') || tooBig(f.esi_mode, f.esi_value, 'percent_gross')

  const onSave = async () => {
    try {
      await save.mutateAsync({
        ...f,
        pf_value: num(f.pf_value), pf_wage_ceiling: num(f.pf_wage_ceiling),
        esi_value: num(f.esi_value), esi_gross_ceiling: num(f.esi_gross_ceiling), pt_amount: num(f.pt_amount),
      })
      toast.success('Payroll rules saved — every month not yet finalized now uses them')
    } catch (e) {
      toast.error(apiError(e, 'Could not save payroll rules'))
    }
  }

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 border-b border-gray-100 p-4 text-left">
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal className="h-4 w-4 text-primary-700" />
          <span>
            <span className="block text-sm font-bold text-gray-900">Deduction rules — organisation defaults</span>
            <span className="block text-xs text-gray-500">Applied to every employee unless you set a custom rule for them below.</span>
          </span>
        </span>
        <span className="text-xs font-medium text-primary-700">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
          <div className="space-y-5">
            <h3 className="eyebrow">Recurring deductions</h3>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <Field label="Provident Fund (PF)">
                <select value={f.pf_mode} onChange={(e) => set('pf_mode')(e.target.value)} className="field-input">
                  {['none', 'percent_basic', 'fixed'].map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                </select>
              </Field>
              {f.pf_mode !== 'none' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={f.pf_mode === 'fixed' ? 'Amount per month' : 'Percentage'}>
                    <Money value={f.pf_value} onChange={set('pf_value')} prefix={f.pf_mode === 'fixed' ? '₹' : '%'}
                      invalid={tooBig(f.pf_mode, f.pf_value, 'percent_basic')} />
                  </Field>
                  {f.pf_mode === 'percent_basic' && (
                    <Field label="Wage cap" hint="Basic above this isn't charged PF. 0 = no cap.">
                      <Money value={f.pf_wage_ceiling} onChange={set('pf_wage_ceiling')} />
                    </Field>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <Field label="Employee State Insurance (ESI)">
                <select value={f.esi_mode} onChange={(e) => set('esi_mode')(e.target.value)} className="field-input">
                  {['none', 'percent_gross', 'fixed'].map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                </select>
              </Field>
              {f.esi_mode !== 'none' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={f.esi_mode === 'fixed' ? 'Amount per month' : 'Percentage'}>
                    <Money value={f.esi_value} onChange={set('esi_value')} prefix={f.esi_mode === 'fixed' ? '₹' : '%'}
                      invalid={tooBig(f.esi_mode, f.esi_value, 'percent_gross')} />
                  </Field>
                  {f.esi_mode === 'percent_gross' && (
                    <Field label="Gross limit" hint="Only employees earning up to this. 0 = everyone.">
                      <Money value={f.esi_gross_ceiling} onChange={set('esi_gross_ceiling')} />
                    </Field>
                  )}
                </div>
              )}
            </div>

            <Field label="Professional tax (flat, per month)">
              <Money value={f.pt_amount} onChange={set('pt_amount')} />
            </Field>
          </div>

          <div className="space-y-5">
            <h3 className="eyebrow">Attendance-based rules</h3>

            <Field label="Per-day salary is calculated on"
              hint="Loss of Pay for an unpaid day = monthly gross ÷ this number of days.">
              <select value={f.per_day_basis} onChange={(e) => set('per_day_basis')(e.target.value)} className="field-input">
                <option value="calendar_days">Calendar days in the month (28–31)</option>
                <option value="fixed_30">Fixed 30 days</option>
                <option value="working_days">Working days (calendar days minus week-offs)</option>
              </select>
            </Field>

            <div className="space-y-2.5">
              <Toggle checked={f.unpaid_leave_is_lop} onChange={set('unpaid_leave_is_lop')}
                title="Unpaid leave is Loss of Pay"
                description="Approved leave of type “unpaid” is deducted like an absence." />
              <Toggle checked={f.sandwich_policy} onChange={set('sandwich_policy')}
                title="Sandwich policy"
                description="A week-off or holiday between two unpaid working days is also unpaid. (An employee who worked no day at all in the month gets nothing for holidays or week-offs, whatever this says.)" />
              <Toggle checked={f.prorate_fixed_deductions} onChange={set('prorate_fixed_deductions')}
                title="Pro-rate fixed deductions by attendance"
                description="Fixed PF / ESI / medical amounts shrink in line with days worked. Percentage rules always follow attendance." />
              <Toggle checked={f.auto_deduct_loans} onChange={set('auto_deduct_loans')}
                title="Deduct salary-advance recoveries automatically"
                description="Installments falling due this month are taken from salary automatically." />
            </div>

            <div className="rounded-lg bg-gray-50 px-3.5 py-3 text-xs text-gray-600">
              <b className="text-gray-800">How attendance affects pay:</b> absent days, unpaid leave, sandwiched week-offs and holidays, and days
              before joining are charged as Loss of Pay. PF and ESI percentages are then worked out on the salary actually earned.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 lg:col-span-2">
            {dirty && <span className="text-xs text-yellow-700">Unsaved changes</span>}
            <Button variant="secondary" disabled={!dirty} onClick={() => setF(toForm(settings))}>Discard</Button>
            <Button onClick={onSave} loading={save.isPending} disabled={!dirty || invalid}>Save rules</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Per-employee override
 * ------------------------------------------------------------------ */
const blank = { pf_mode: '', pf_value: '', pf_wage_ceiling: '', esi_mode: '', esi_value: '', esi_gross_ceiling: '', pt_amount: '', tds_amount: '', medical_amount: '' }

const fromRule = (rule) => {
  if (!rule) return blank
  const s = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    pf_mode: rule.pf_mode || '', pf_value: s(rule.pf_value), pf_wage_ceiling: s(rule.pf_wage_ceiling),
    esi_mode: rule.esi_mode || '', esi_value: s(rule.esi_value), esi_gross_ceiling: s(rule.esi_gross_ceiling),
    pt_amount: s(rule.pt_amount), tds_amount: s(rule.tds_amount), medical_amount: s(rule.medical_amount),
  }
}

// What an ESI rule would take for a full month: lets HR sanity-check before saving.
const previewEsi = (mode, value, ceiling, gross) => {
  if (mode === 'fixed') return num(value)
  if (mode !== 'percent_gross') return 0
  return ceiling > 0 && gross > ceiling ? 0 : gross * (num(value) / 100)
}

const RulesModal = ({ row, settings, onClose }) => {
  const save = useUpdateDeductionRules()
  const [f, setF] = useState(blank)
  useEffect(() => { if (row) setF(fromRule(row.rule)) }, [row])
  if (!row || !settings) return null

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  const st = row.structure

  // The ESI rule that will actually apply after saving: custom mode if picked, otherwise the org default.
  const esiMode = f.esi_mode || settings.esi_mode
  const esiValue = f.esi_mode ? f.esi_value : settings.esi_value
  const esiCeil = f.esi_gross_ceiling !== '' ? num(f.esi_gross_ceiling) : settings.esi_gross_ceiling

  const needsValue = (mode, val) => (mode === 'percent_basic' || mode === 'percent_gross' || mode === 'fixed') && val === ''
  const errors = []
  if (needsValue(f.pf_mode, f.pf_value)) errors.push('Enter the PF value, or choose “Use default”.')
  if (needsValue(f.esi_mode, f.esi_value)) errors.push('Enter the ESI value, or choose “Use default”.')
  if (f.pf_mode === 'percent_basic' && num(f.pf_value) > 100) errors.push('PF percentage cannot exceed 100.')
  if (f.esi_mode === 'percent_gross' && num(f.esi_value) > 100) errors.push('ESI percentage cannot exceed 100.')

  const payload = (all) => {
    const nz = (v) => (v === '' || all ? null : num(v))
    const custom = (mode) => !all && mode !== ''
    return {
      pf_mode: custom(f.pf_mode) ? f.pf_mode : null,
      pf_value: custom(f.pf_mode) && f.pf_mode !== 'none' ? num(f.pf_value) : null,
      pf_wage_ceiling: custom(f.pf_mode) && f.pf_mode === 'percent_basic' ? nz(f.pf_wage_ceiling) : null,
      esi_mode: custom(f.esi_mode) ? f.esi_mode : null,
      esi_value: custom(f.esi_mode) && f.esi_mode !== 'none' ? num(f.esi_value) : null,
      esi_gross_ceiling: custom(f.esi_mode) && f.esi_mode === 'percent_gross' ? nz(f.esi_gross_ceiling) : null,
      pt_amount: nz(f.pt_amount), tds_amount: nz(f.tds_amount), medical_amount: nz(f.medical_amount),
    }
  }

  const submit = async (reset = false) => {
    try {
      const res = await save.mutateAsync({ employeeId: row.employee_id, ...payload(reset) })
      toast.success(res.message || 'Deduction rules saved')
      onClose()
    } catch (e) {
      toast.error(apiError(e, 'Could not save deduction rules'))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Deduction rules"
      subtitle={`${row.full_name} · ${row.employee_id} · gross ${inr(st.gross)} · basic ${inr(st.basic)}`}
      footer={
        <>
          <Button variant="ghost" icon={RotateCcw} onClick={() => submit(true)} loading={save.isPending} className="mr-auto">
            Reset all to defaults
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submit(false)} loading={save.isPending} disabled={errors.length > 0}>Save rules</Button>
        </>
      }
    >
      <div className="space-y-6">
        {!st.complete && (
          <p className="flex items-start gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Basic salary isn’t set for this employee, so a “% of basic” PF can’t be calculated. Set it in Salary Details first.
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <PfFields
              value={f}
              onChange={(patch) => setF((p) => ({ ...p, ...patch }))}
              basic={st.basic}
              settings={settings}
              fallback={pfFallback(row, settings)}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 p-4">
            <Field label="Employee State Insurance (ESI)">
              <select value={f.esi_mode} onChange={(e) => set('esi_mode')(e.target.value)} className="field-input">
                <option value="">Use default — {describeEsi(settings.esi_mode === 'none' ? null : { mode: settings.esi_mode, value: settings.esi_value, ceiling: settings.esi_gross_ceiling })}</option>
                {['none', 'percent_gross', 'fixed'].map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
              </select>
            </Field>
            {(f.esi_mode === 'percent_gross' || f.esi_mode === 'fixed') && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={f.esi_mode === 'fixed' ? 'Amount' : 'Percentage'}>
                  <Money value={f.esi_value} onChange={set('esi_value')} prefix={f.esi_mode === 'fixed' ? '₹' : '%'} />
                </Field>
                {f.esi_mode === 'percent_gross' && (
                  <Field label="Gross limit" hint={`Blank = default (${settings.esi_gross_ceiling ? inr(settings.esi_gross_ceiling) : 'everyone'}).`}>
                    <Money value={f.esi_gross_ceiling} onChange={set('esi_gross_ceiling')} />
                  </Field>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Full-month ESI: <b className="numeral text-gray-800">{inr2(previewEsi(esiMode, esiValue, esiCeil, st.gross))}</b>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Professional tax" hint={`Blank = default (${inr(settings.pt_amount)})`}>
            <Money value={f.pt_amount} onChange={set('pt_amount')} placeholder={String(settings.pt_amount)} />
          </Field>
          <Field label="TDS (per month)" hint="Blank = none">
            <Money value={f.tds_amount} onChange={set('tds_amount')} placeholder="0" />
          </Field>
          <Field label="Medical / insurance" hint="Blank = none">
            <Money value={f.medical_amount} onChange={set('medical_amount')} placeholder="0" />
          </Field>
        </div>

        {errors.map((e) => (
          <p key={e} className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
          </p>
        ))}
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Tab
 * ------------------------------------------------------------------ */
const Source = ({ source }) =>
  source === 'employee' ? <Badge tone="brass">Custom</Badge>
  : source === 'profile' ? <Badge tone="info">Profile</Badge>
  : null

const DeductionsTab = ({ month, structures, loading, activeOnly = false }) => {
  const employees = useMemo(
    () => (structures?.employees || []).filter((e) => !activeOnly || e.is_active),
    [structures, activeOnly]
  )
  const settings = structures?.settings
  const f = useEmployeeFilter(employees)
  const [editing, setEditing] = useState(null)
  const custom = employees.filter((e) => e.rule).length

  return (
    <div className="space-y-5">
      <SettingsPanel settings={settings} />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Employee deduction rules</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              What each person is actually charged. {custom} custom · {employees.length - custom} following defaults.
            </p>
          </div>
          <FilterBar f={f} />
        </div>

        {loading ? (
          <div className="p-5"><SkeletonRows rows={5} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-medium text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className={th}>Employee</th>
                  <th className={th}>PF</th>
                  <th className={th}>ESI</th>
                  <th className={cx(th, 'text-right')}>Prof. tax</th>
                  <th className={cx(th, 'text-right')}>TDS</th>
                  <th className={cx(th, 'text-right')}>Medical</th>
                  <th className={cx(th, 'text-center')}>Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {f.visible.map((e) => {
                  const r = e.effective_rules
                  return (
                    <tr key={e.employee_id} className="whitespace-nowrap transition-colors hover:bg-gray-50/80">
                      <td className="px-3.5 py-3"><EmployeeCell row={e} /></td>
                      <td className="px-3.5 py-3">
                        {describePf(r.pf_configured || r.pf)} <Source source={(r.pf_configured || r.pf).source} />
                        {settings?.pf_enabled === false && <span className="ml-1 text-[10px] font-semibold text-yellow-700">(PF off)</span>}
                      </td>
                      <td className="px-3.5 py-3">{describeEsi(r.esi)} <Source source={r.esi.source} /></td>
                      <td className="numeral px-3.5 py-3 text-right">{r.pt.amount ? inr(r.pt.amount) : '—'} <Source source={r.pt.source} /></td>
                      <td className="numeral px-3.5 py-3 text-right">{r.tds.amount ? inr(r.tds.amount) : '—'}</td>
                      <td className="numeral px-3.5 py-3 text-right">{r.medical.amount ? inr(r.medical.amount) : '—'} <Source source={r.medical.source} /></td>
                      <td className="px-3.5 py-3 text-center">
                        <button onClick={() => setEditing(e)} title="Edit deduction rules"
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

      <AdjustmentsPanel month={month} type="deduction" />

      <RulesModal row={editing} settings={settings} onClose={() => setEditing(null)} />
    </div>
  )
}

export default DeductionsTab
