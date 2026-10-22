import jsPDF from 'jspdf'
import { format } from 'date-fns'
import {
  ACCENTS, COMPANY, INK, MUTED, PAGE, RULE, TINT,
  drawContinuationHeader, drawFooter, drawLetterhead, drawWatermark, fitText, loadLogo, numberToWordsRupees,
} from '../letterhead/letterhead'

// jsPDF's built-in fonts have no rupee glyph, so amounts print as "Rs."
const money = (n) =>
  'Rs. ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)

const STATUS_TAG = {
  paid: { text: 'SALARY CREDITED', color: [22, 128, 61], fill: [236, 253, 243] },
  initiated: { text: 'PAYMENT INITIATED', color: [27, 107, 181], fill: [239, 246, 255] },
  on_hold: { text: 'SALARY ON HOLD', color: [180, 83, 9], fill: [255, 247, 237] },
}

// "Rupees One Thousand Eight Hundred and Six and Forty Five Paise Only"
const amountInWords = (n) => {
  const value = Math.max(0, Number(n) || 0)
  const rupees = Math.floor(value)
  const paise = Math.round((value - rupees) * 100)
  const words = (x) => numberToWordsRupees(x).replace(/ Only$/, '')
  return `Rupees ${rupees ? words(rupees) : 'Zero'}${paise ? ` and ${words(paise)} Paise` : ''} Only`
}

const mask = (v) => {
  const t = String(v ?? '').trim()
  return t.length > 4 ? `${'X'.repeat(Math.max(0, t.length - 4))}${t.slice(-4)}` : t
}

/**
 * The earnings lines to print. They must add up to the "Gross earnings" shown under them: Loss of Pay is its
 * own deduction line, so listing components that are already reduced for absences would take the absence off
 * twice. So use the full component amounts when those add up to the gross, the stored amounts when THEY do
 * (HR-edited payslips), and only for a part-month range scale the monthly components down to the period.
 */
const earningsRows = (payslip) => {
  const rows = payslip.lines.earnings
  const total = (key) => rows.reduce((t, e) => t + Number(e[key] ?? e.amount ?? 0), 0)
  const gross = Number(payslip.gross || 0)
  if (Math.abs(total('full') - gross) < 0.02) return rows.map((e) => ({ label: e.label, amount: e.full ?? e.amount }))
  if (Math.abs(total('amount') - gross) < 0.02) return rows.map((e) => ({ label: e.label, amount: e.amount }))
  const factor = total('full') > 0 ? gross / total('full') : 1
  return rows.map((e) => ({ label: e.label, amount: Math.round(Number(e.full ?? e.amount) * factor * 100) / 100 }))
}

/**
 * Builds a salary slip from the payslip object the API returns and resolves to the jsPDF document.
 * Every figure and label comes from `payslip.lines`, so the PDF can never disagree with the screen.
 */
export const buildPayslipPdf = async (payslip, { startDate, endDate }) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setLineHeightFactor(1.3)
  const lh = (size) => size * 0.3528 * 1.3
  const logo = await loadLogo()
  const accent = ACCENTS.corporate
  const { left, right } = PAGE
  const width = right - left
  const LIMIT = 268
  const a = payslip.attendance || {}
  const period = `${format(new Date(startDate), 'dd MMM yyyy')} – ${format(new Date(endDate), 'dd MMM yyyy')}`
  const monthLabel = format(new Date(startDate), 'MMMM yyyy')

  drawWatermark(doc, logo)
  let y = drawLetterhead(doc, { logo, accent })
  const ensure = (space) => {
    if (y + space <= LIMIT) return
    doc.addPage()
    drawWatermark(doc, logo)
    y = drawContinuationHeader(doc, { logo, accent, right: `Salary slip · ${payslip.full_name} · ${monthLabel}` })
  }
  const label = (text, x, yy) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.setTextColor(...MUTED)
    doc.text(String(text).toUpperCase(), x, yy)
  }

  // ---- title + payment status
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...accent)
  doc.text('SALARY SLIP', left, y + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(`${monthLabel}   ·   ${period}`, left, y + 10)
  const tag = STATUS_TAG[payslip.pay_status]
  if (tag) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    const w = doc.getTextWidth(tag.text) + 8
    doc.setFillColor(...tag.fill)
    doc.setDrawColor(...tag.color)
    doc.setLineWidth(0.3)
    doc.roundedRect(right - w, y, w, 7, 3.5, 3.5, 'FD')
    doc.setTextColor(...tag.color)
    doc.text(tag.text, right - w / 2, y + 4.6, { align: 'center' })
    const when = payslip.pay_status === 'paid' ? payslip.paid_at : payslip.pay_status === 'initiated' ? payslip.initiated_at : null
    if (when) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(format(new Date(String(when).replace(' ', 'T')), 'dd MMM yyyy'), right, y + 11, { align: 'right' })
    }
  }
  y += 16

  // ---- employee details card
  const info = [
    ['Employee name', payslip.full_name],
    ['Employee ID', payslip.employee_id],
    ['Designation', payslip.designation],
    ['Department', payslip.department_name || payslip.department],
    ['Date of joining', payslip.doj ? format(new Date(payslip.doj), 'dd MMM yyyy') : '—'],
    ['Email', payslip.email],
  ]
  const cardH = 25
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.3)
  doc.roundedRect(left, y, width, cardH, 1.5, 1.5, 'S')
  const cw = width / 3
  info.forEach(([l, v], i) => {
    const cx = left + (i % 3) * cw + 5
    const cy = y + (i < 3 ? 0 : 12.5)
    label(l, cx, cy + 5.2)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK)
    doc.text(fitText(doc, v || '—', cw - 8), cx, cy + 10)
  })
  doc.line(left + 4, y + 12.5, right - 4, y + 12.5)
  y += cardH + 7

  // ---- attendance summary strip
  label('Attendance summary', left, y)
  y += 2.6
  const tiles = [
    ['Days in period', a.period_days],
    ['Present', a.present_days],
    ['WFH', a.wfh_days],
    ['Paid leave', a.leave_days],
    ['Holiday / Week-off', (a.holiday_days || 0) + (a.week_off_days || 0)],
    ['Absent', a.absent_days],
    ['Unpaid days (LOP)', a.unpaid_days],
  ]
  const gap = 2
  const tw = (width - gap * (tiles.length - 1)) / tiles.length
  tiles.forEach(([l, v], i) => {
    const x = left + i * (tw + gap)
    const bad = i >= 5 && Number(v) > 0
    doc.setDrawColor(...(bad ? [252, 165, 165] : RULE))
    doc.setFillColor(...(bad ? [254, 242, 242] : [255, 255, 255]))
    doc.roundedRect(x, y, tw, 13, 1.2, 1.2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...(bad ? [185, 28, 28] : INK))
    doc.text(String(v ?? 0), x + tw / 2, y + 6.2, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.9)
    doc.setTextColor(...MUTED)
    doc.text(l, x + tw / 2, y + 10.6, { align: 'center' })
  })
  y += 13 + 3
  if (payslip.per_day_salary) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`Per-day salary ${money(payslip.per_day_salary)}. Loss of Pay = per-day salary × unpaid days.`, left, y)
  }
  y += 6

  // ---- earnings | deductions: two aligned tables
  const earn = [...earningsRows(payslip).map((e) => ({ label: e.label, amount: e.amount })), ...(payslip.lines.additions || []).map((e) => ({ label: e.label, amount: e.amount }))]
  const ded = (payslip.lines.deductions || []).map((d) => ({ label: d.label, amount: d.amount }))
  if (!ded.length) ded.push({ label: 'No deductions', amount: null })
  const colW = (width - 6) / 2
  const HEAD = 7
  const measure = (rows) => rows.map((r) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.8)
    const lines = doc.splitTextToSize(r.label, colW - 40)
    return { ...r, lines, h: Math.max(7, lines.length * lh(8.8) + 3) }
  })
  const E = measure(earn)
  const D = measure(ded)
  const sum = (rows) => rows.reduce((t, r) => t + r.h, 0)
  const bodyH = Math.max(sum(E), sum(D))
  const TOTAL = 9
  ensure(HEAD + bodyH + TOTAL + 34)

  const table = (x, title, rows, totalLabel, totalValue) => {
    doc.setFillColor(...accent)
    doc.rect(x, y, colW, HEAD, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.3)
    doc.setTextColor(255, 255, 255)
    doc.text(title, x + 4, y + 4.8)
    doc.text('AMOUNT (Rs.)', x + colW - 4, y + 4.8, { align: 'right' })
    let ry = y + HEAD
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.25)
    rows.forEach((r) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.8)
      doc.setTextColor(...(r.amount === null ? MUTED : INK))
      doc.text(r.lines, x + 4, ry + 4.8)
      if (r.amount !== null) {
        doc.text(new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.amount || 0), x + colW - 4, ry + 4.8, { align: 'right' })
      }
      ry += r.h
      doc.line(x, ry, x + colW, ry)
    })
    const totalY = y + HEAD + bodyH
    doc.setFillColor(...TINT)
    doc.rect(x, totalY, colW, TOTAL, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(totalLabel, x + 4, totalY + 5.9)
    doc.text(new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalValue || 0), x + colW - 4, totalY + 5.9, { align: 'right' })
    doc.setDrawColor(...RULE)
    doc.rect(x, y, colW, HEAD + bodyH + TOTAL)
  }
  table(left, 'EARNINGS', E, 'Gross earnings', payslip.gross + payslip.total_additions)
  table(left + colW + 6, 'DEDUCTIONS', D, 'Total deductions', payslip.total_deductions)
  y += HEAD + bodyH + TOTAL + 7

  // ---- net pay
  ensure(30)
  doc.setFillColor(...accent)
  doc.roundedRect(left, y, width, 17, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(219, 234, 254)
  doc.text('NET PAY  (TAKE-HOME)', left + 6, y + 6.2)
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(`${monthLabel}`, left + 6, y + 12)
  doc.setFontSize(19)
  doc.text(money(payslip.net_payable), right - 6, y + 11.6, { align: 'right' })
  y += 17 + 5
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(...INK)
  doc.text(doc.splitTextToSize(`Amount in words: ${amountInWords(payslip.net_payable)}`, width), left, y)
  y += 8

  if (payslip.bank_name || payslip.bank_account_number) {
    ensure(20)
    label('Payment details', left, y)
    y += 2.6
    doc.setDrawColor(...RULE)
    doc.roundedRect(left, y, width, 12, 1.5, 1.5, 'S')
    ;[['Bank', payslip.bank_name], ['Account no.', mask(payslip.bank_account_number)], ['IFSC', payslip.ifsc], ['UPI', payslip.upi_id]].forEach(([l, v], i) => {
      const cx = left + i * (width / 4) + 5
      label(l, cx, y + 4.6)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...INK)
      doc.text(fitText(doc, v || '—', width / 4 - 7), cx, y + 9)
    })
    y += 16
  }

  // ---- footer on every page (no approval strip on a payslip)
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    drawFooter(doc, {
      company: COMPANY, accent, page: p, pages,
      note: `Computer-generated payslip — no signature required.   Generated ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`,
    })
  }
  return doc
}

export const downloadPayslipPdf = async (payslip, { startDate, endDate }) => {
  const doc = await buildPayslipPdf(payslip, { startDate, endDate })
  doc.save(`salary_slip_${payslip.employee_id}_${startDate}_to_${endDate}.pdf`)
}
