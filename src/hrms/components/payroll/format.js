import { format, endOfMonth, parse, addMonths } from 'date-fns'

// Indian digit grouping: 1,23,456.50
export const inr = (value, { decimals = 0 } = {}) => {
  const n = Number(value || 0)
  // Whole rupees stay tidy (₹28,000); anything with paise always shows both digits (₹4,009.60).
  const digits = decimals || (Number.isInteger(n) ? 0 : 2)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export const inr2 = (value) => inr(value, { decimals: 2 })

export const monthKeyOf = (date = new Date()) => format(date, 'yyyy-MM')

export const monthRange = (key) => {
  const start = parse(`${key}-01`, 'yyyy-MM-dd', new Date())
  return { start_date: format(start, 'yyyy-MM-dd'), end_date: format(endOfMonth(start), 'yyyy-MM-dd') }
}

export const monthLabel = (key) => format(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), 'MMMM yyyy')

export const shiftMonth = (key, delta) =>
  monthKeyOf(addMonths(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), delta))

export const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// "12% of basic (wage cap ₹15,000)" - the same wording HR sees everywhere a rule is shown.
export const describePf = (pf) => {
  if (!pf || pf.mode === 'none') return 'Not deducted'
  if (pf.mode === 'fixed') return `${inr(pf.value)} fixed`
  return `${pf.value}% of basic${pf.ceiling > 0 ? ` · cap ${inr(pf.ceiling)}` : ''}`
}

// What a PF rule takes for a full month with no absence: lets HR sanity-check a rule before saving.
export const previewPf = (mode, value, ceiling, basic) => {
  if (mode === 'fixed') return num(value)
  if (mode !== 'percent_basic') return 0
  return (ceiling > 0 ? Math.min(basic, ceiling) : basic) * (num(value) / 100)
}

export const describeEsi = (esi) => {
  if (!esi || esi.mode === 'none') return 'Not deducted'
  if (esi.mode === 'fixed') return `${inr(esi.value)} fixed`
  return `${esi.value}% of gross${esi.ceiling > 0 ? ` · if gross ≤ ${inr(esi.ceiling)}` : ''}`
}

export const attendanceLabels = {
  present: 'Present',
  wfh: 'Work From Home',
  leave: 'Paid Leave',
  unpaid_leave: 'Unpaid Leave',
  holiday: 'Holiday',
  week_off: 'Week Off',
  week_off_unpaid: 'Week Off (unpaid)',
  holiday_unpaid: 'Holiday (unpaid)',
  absent: 'Absent',
  pending: 'Pending approval',
  not_joined: 'Not joined',
  upcoming: 'Upcoming',
}

// Tone for a day's status pill (paid = green, unpaid = red, neutral otherwise).
export const attendanceTone = (code) =>
  ({
    present: 'success', wfh: 'info', leave: 'info', holiday: 'brass', week_off: 'neutral', upcoming: 'neutral',
    unpaid_leave: 'danger', week_off_unpaid: 'danger', holiday_unpaid: 'danger', absent: 'danger', pending: 'warning', not_joined: 'neutral',
  }[code] || 'neutral')
