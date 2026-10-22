/**
 * Monthly in-hand (take-home) salary for an offer letter.
 *
 * The estimate follows the company's own payroll settings: monthly gross = annual CTC / 12, split with the
 * standard structure (basic = 40% of gross), then the PF / ESI / professional-tax rules HR has set are taken
 * off, exactly as payroll would. HR can overwrite the figure; nothing here is stored except what they keep.
 */
export const parseAmount = (value) => {
  const n = parseFloat(String(value ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const r2 = (n) => Math.round(n * 100) / 100

/** @returns {{gross,basic,pf,esi,pt,inhand,pfRule}|null} null until the CTC is a usable number */
export const estimateInhand = (annualCtc, settings) => {
  const annual = parseAmount(annualCtc)
  if (annual <= 0) return null
  const s = settings || {}
  const gross = r2(annual / 12)
  const basic = r2(gross * 0.4)

  let pf = 0
  let pfRule = 'no PF'
  if (s.pf_enabled !== false && s.pf_mode === 'percent_basic') {
    const wage = s.pf_wage_ceiling > 0 ? Math.min(basic, s.pf_wage_ceiling) : basic
    pf = (wage * s.pf_value) / 100
    pfRule = `PF ${s.pf_value}% of basic${s.pf_wage_ceiling > 0 ? `, wage cap ₹${Number(s.pf_wage_ceiling).toLocaleString('en-IN')}` : ''}`
  } else if (s.pf_enabled !== false && s.pf_mode === 'fixed') {
    pf = Number(s.pf_value) || 0
    pfRule = `PF fixed ₹${pf.toLocaleString('en-IN')}`
  }

  let esi = 0
  if (s.esi_mode === 'percent_gross') {
    esi = !(s.esi_gross_ceiling > 0) || gross <= s.esi_gross_ceiling ? (gross * s.esi_value) / 100 : 0
  } else if (s.esi_mode === 'fixed') {
    esi = Number(s.esi_value) || 0
  }
  const pt = Number(s.pt_amount) || 0

  pf = r2(pf)
  esi = r2(esi)
  return { gross, basic, pf, esi, pt, inhand: Math.max(0, r2(gross - pf - esi - pt)), pfRule }
}
