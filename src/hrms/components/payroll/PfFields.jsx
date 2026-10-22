import { Badge, cx } from '../ui'
import { describePf, inr, inr2, num, previewPf } from './format'

/**
 * One employee's Provident Fund choice, shared by the salary-structure dialog and the Deduction-rules dialog
 * so HR sees the same options wherever they set it. The draft is plain strings so half-typed numbers behave.
 */

export const PF_MODES = [
  ['none', 'Not deducted'],
  ['percent_basic', '% of basic salary'],
  ['fixed', 'Fixed amount (₹)'],
]

export const pfDraft = (rule) => {
  const s = (v) => (v === null || v === undefined ? '' : String(v))
  return { pf_mode: rule?.pf_mode || '', pf_value: s(rule?.pf_value), pf_wage_ceiling: s(rule?.pf_wage_ceiling) }
}

// What the API takes: null everywhere means "use the default".
export const pfPayload = (d) => {
  const custom = d.pf_mode !== ''
  return {
    pf_mode: custom ? d.pf_mode : null,
    pf_value: custom && d.pf_mode !== 'none' ? num(d.pf_value) : null,
    pf_wage_ceiling: custom && d.pf_mode === 'percent_basic' && d.pf_wage_ceiling !== '' ? num(d.pf_wage_ceiling) : null,
  }
}

export const pfErrors = (d) => {
  const errors = []
  if ((d.pf_mode === 'percent_basic' || d.pf_mode === 'fixed') && d.pf_value === '') errors.push('Enter the PF value, or choose “Use default”.')
  if (d.pf_mode === 'percent_basic' && num(d.pf_value) > 100) errors.push('PF percentage cannot exceed 100.')
  return errors
}

// The rule an employee follows when HR has NOT overridden it: their profile EPF if they have one, else the org default.
export const pfFallback = (row, settings) => {
  // pf_configured is the rule as HR set it (even while PF is switched off company-wide, when `pf` reads "none").
  const eff = row?.effective_rules?.pf_configured || row?.effective_rules?.pf
  if (eff && eff.source !== 'employee') return eff
  return { mode: settings?.pf_mode || 'none', value: settings?.pf_value || 0, ceiling: settings?.pf_wage_ceiling || 0 }
}

export const PfSourceBadge = ({ source }) =>
  source === 'employee' ? <Badge tone="brass">Set by HR</Badge>
  : source === 'profile' ? <Badge tone="info">Profile</Badge>
  : null

const Money = ({ value, onChange, prefix = '₹' }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>
    <input
      type="number" min="0" step="0.01" inputMode="decimal" value={value}
      onChange={(e) => onChange(e.target.value)} className={cx('field-input numeral !pl-7')}
    />
  </div>
)

/**
 * @param value    { pf_mode, pf_value, pf_wage_ceiling } draft strings ('' mode = use the default)
 * @param onChange receives a partial draft to merge
 * @param basic    monthly basic used for the live "full-month PF" line
 * @param fallback the rule that applies with no override (see pfFallback)
 */
export const PfFields = ({ value, onChange, basic, fallback, settings }) => {
  const set = (k) => (v) => onChange({ [k]: v })
  const custom = value.pf_mode !== ''
  const mode = custom ? value.pf_mode : fallback.mode
  const amount = custom ? value.pf_value : fallback.value
  const cap = custom && value.pf_wage_ceiling !== '' ? num(value.pf_wage_ceiling) : (custom ? settings?.pf_wage_ceiling || 0 : fallback.ceiling)

  return (
    <div className="space-y-3">
      {settings?.pf_enabled === false && (
        <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          PF deduction is switched off for the whole company, so nothing is deducted whatever you choose here. Your choice is saved for when it is switched on.
        </p>
      )}
      <div>
        <label className="field-label">Provident Fund (PF)</label>
        <select value={value.pf_mode} onChange={(e) => set('pf_mode')(e.target.value)} className="field-input">
          <option value="">Use default — {describePf(fallback)}</option>
          {PF_MODES.map(([m, label]) => <option key={m} value={m}>{label}</option>)}
        </select>
      </div>
      {(value.pf_mode === 'percent_basic' || value.pf_mode === 'fixed') && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{value.pf_mode === 'fixed' ? 'Amount' : 'Percentage'}</label>
            <Money value={value.pf_value} onChange={set('pf_value')} prefix={value.pf_mode === 'fixed' ? '₹' : '%'} />
          </div>
          {value.pf_mode === 'percent_basic' && (
            <div>
              <label className="field-label">Wage cap</label>
              <Money value={value.pf_wage_ceiling} onChange={set('pf_wage_ceiling')} />
              <p className="mt-1 text-xs text-gray-500">Blank = default ({settings?.pf_wage_ceiling ? inr(settings.pf_wage_ceiling) : 'no cap'}). 0 = no cap.</p>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500">
        Full-month PF: <b className="numeral text-gray-800">{inr2(previewPf(mode, amount, cap, basic))}</b>
      </p>
    </div>
  )
}
