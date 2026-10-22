import jsPDF from 'jspdf'
import { format } from 'date-fns'
import {
  ACCENTS, COMPANY, INK, MUTED, PAGE, RULE, TINT,
  drawContinuationHeader, drawFooter, drawLetterhead, drawWatermark, fitText, loadLogo, numberToWordsRupees,
} from '../letterhead/letterhead'
import { parseAmount } from './inhand'

/**
 * The offer-letter PDF, shared by the Offer Letter generator and the "generate from an employee's request"
 * dialog so the two can never drift apart. Takes the generator's camelCase form and resolves to the jsPDF doc.
 * The words, the terms table and the footer cells come from the small helpers below, which the on-screen
 * preview uses too - so what HR sees is what is printed.
 */
export { COMPANY, numberToWordsRupees }

// "2026-09-21" -> "21 September 2026"; anything that is not a date is printed as typed.
export const prettyDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : format(d, 'd MMMM yyyy')
}

// "1200000" -> "12,00,000"; text like "12 LPA" is left alone.
export const prettyAmount = (value) => {
  const v = String(value ?? '').trim()
  return /^[\d,]+(\.\d+)?$/.test(v) ? new Intl.NumberFormat('en-IN').format(Number(v.replace(/,/g, ''))) : v
}

/** The wording of the letter. */
export const offerText = (form, company = COMPANY) => {
  const co = company.name.replace(/\.$/, '')
  return {
    subject: `Offer of Employment${form.designation ? ` — ${form.designation}` : ''}`,
    intro:
      `We are pleased to offer you the position of ${form.designation || '[Designation]'}`
      + (form.department ? ` in the ${form.department} department` : '')
      + ` at ${co}.`
      + (form.joiningDate ? ` Your date of joining will be ${prettyDate(form.joiningDate)}.` : '')
      + (form.reportingManager ? ` You will be reporting to ${form.reportingManager}${form.location ? ` at our ${form.location} office` : ''}.` : ''),
    ctc: `Your annual Cost to Company (CTC) will be Rs. ${prettyAmount(form.annualCtc) || '0'} (${numberToWordsRupees(form.annualCtc)}) as per the terms discussed and agreed.`,
    probation: form.probationPeriod
      ? `You will be on probation for a period of ${form.probationPeriod} from your date of joining. During this period, your performance will be evaluated periodically.`
      : '',
    closing:
      'Please find the detailed terms and conditions of your employment attached. '
      + ((form.specialNotes || '').trim() || 'Kindly sign and return a copy of this letter within 3 working days to accept this offer.'),
    welcome: 'We look forward to welcoming you to our team.',
  }
}

/** Terms shown as full-width rows (long values); the rest sit three to a row. */
export const OFFER_WIDE_ROWS = ['Annual CTC', 'Monthly in-hand salary', 'Benefits']

/** The optional monthly in-hand line, or '' when HR has not switched it on. */
export const inhandText = (form) => {
  const inhand = parseAmount(form.monthlyInhand)
  if (!form.showInhand || inhand <= 0) return ''
  const annual = parseAmount(form.annualCtc)
  return `Rs. ${prettyAmount(Math.round(inhand))} per month (approximate take-home`
    + (annual > 0 ? `; monthly gross Rs. ${prettyAmount(Math.round(annual / 12))}` : '')
    + ', after statutory deductions and before income tax, if any)'
}

/** Rows of the "terms of employment" table (empty ones are left out). */
export const offerTerms = (form) =>
  [
    ['Designation', form.designation],
    ['Department', form.department],
    ['Date of joining', prettyDate(form.joiningDate)],
    ['Reporting to', form.reportingManager],
    ['Work location', form.location],
    ['Annual CTC', form.annualCtc ? `Rs. ${prettyAmount(form.annualCtc)} (${numberToWordsRupees(form.annualCtc)})` : ''],
    ['Monthly in-hand salary', inhandText(form)],
    ['Joining bonus', form.joiningBonus],
    ['Probation period', form.probationPeriod],
    ['Notice period', form.noticePeriod],
    ['Working hours', form.workingHours],
    ['Benefits', form.otherBenefits],
  ].filter(([, v]) => v && String(v).trim())

/** The footer's editable approval strip. */
export const offerFooterCells = (form) => [
  { label: 'Approved by', value: form.approverName, sub: form.approverDesignation },
  { label: 'Prepared by', value: form.preparedBy, sub: 'Human Resources' },
  { label: 'Reference', value: form.refNo, sub: prettyDate(form.letterDate) },
]

export const offerSignatory = (form) => ({
  name: form.signatoryName || form.reportingManager || '',
  designation: form.signatoryDesignation || 'HR Manager / Authorized Signatory',
})

export const buildOfferLetterPdf = async (form, { templateId = 'corporate', company = COMPANY } = {}) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.setLineHeightFactor(1.35)
  // Height of one line of text at `size` pt - so the y position we track matches what jsPDF really draws.
  const lh = (size) => size * 0.3528 * 1.35
  const logo = await loadLogo()
  const accent = ACCENTS[templateId] || ACCENTS.corporate
  const { left, right } = PAGE
  const width = right - left
  const LIMIT = 250 // the body stops above the footer's approval strip
  const t = offerText(form, company)
  const sign = offerSignatory(form)

  const bodyFont = (size = 10) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...INK)
  }

  drawWatermark(doc, logo)
  let y = drawLetterhead(doc, { company, logo, accent })
  const ensure = (space) => {
    if (y + space <= LIMIT) return
    doc.addPage()
    drawWatermark(doc, logo)
    y = drawContinuationHeader(doc, { logo, accent, right: `Ref. ${form.refNo}` })
    bodyFont()
  }
  const paragraph = (text, gap = 3.2) => {
    if (!text) return
    bodyFont(9.5)
    const lines = doc.splitTextToSize(text, width)
    ensure(lines.length * lh(9.5))
    doc.text(lines, left, y)
    y += lines.length * lh(9.5) + gap
  }

  // ---- reference + date
  y += 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('Ref. No.', left, y)
  doc.text('Date', right - 38, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INK)
  doc.text(String(form.refNo || ''), left + 14, y)
  doc.text(prettyDate(form.letterDate), right, y, { align: 'right' })
  y += 8

  // ---- addressee
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('To,', left, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(form.candidateName || 'Candidate', left, y)
  y += 4.6
  const contact = [form.email, form.phone].filter(Boolean).join('   ·   ')
  if (contact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(contact, left, y)
    y += 4.6
  }
  y += 3

  // ---- subject
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...accent)
  doc.text(`Subject: ${t.subject}`, left, y)
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.3)
  doc.line(left, y + 2, right, y + 2)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text(`Dear ${form.candidateName || 'Candidate'},`, left, y)
  y += 5.5

  paragraph(t.intro)
  paragraph(t.ctc)
  paragraph(t.probation, 5)

  // ---- terms of employment: a compact grid (no striping, so the watermark reads evenly behind it)
  const WIDE = OFFER_WIDE_ROWS
  const rows = offerTerms(form)
  if (rows.length) {
    const grid = rows.filter(([l]) => !WIDE.includes(l))
    const wide = rows.filter(([l]) => WIDE.includes(l))
    const cols = 3
    const cellW = width / cols
    ensure(7 + 12)
    const top = y
    doc.setFillColor(...accent)
    doc.rect(left, y, width, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)
    doc.text('TERMS OF EMPLOYMENT', left + 4, y + 4.8)
    y += 7
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.25)
    for (let i = 0; i < grid.length; i += cols) {
      ensure(11.5)
      grid.slice(i, i + cols).forEach(([label, value], j) => {
        const x = left + j * cellW + 4
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.8)
        doc.setTextColor(...MUTED)
        doc.text(label.toUpperCase(), x, y + 4.2)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(...INK)
        doc.text(fitText(doc, String(value), cellW - 7), x, y + 8.8)
        if (j > 0) doc.line(left + j * cellW, y + 1.5, left + j * cellW, y + 10)
      })
      y += 11.5
      doc.line(left, y, right, y)
    }
    wide.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      const lines = doc.splitTextToSize(String(value), width - 54)
      const h = Math.max(8.5, lines.length * lh(9.5) + 3.6)
      ensure(h)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.8)
      doc.setTextColor(...MUTED)
      doc.text(label.toUpperCase(), left + 4, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...INK)
      doc.text(lines, left + 46, y + 5.2)
      y += h
      doc.line(left, y, right, y)
    })
    doc.rect(left, top, width, y - top)
    y += 5
  }

  // ---- closing words + signature block are kept together: they move to the next page as one piece
  bodyFont(9.5)
  const closing = doc.splitTextToSize(t.closing, width)
  ensure(closing.length * lh(9.5) + 3.2 + lh(9.5) + 7 + 40)
  paragraph(t.closing)
  paragraph(t.welcome, 6)

  const gap = 10
  const colW = (width - gap) / 2
  const top = y
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text(`For ${company.name.replace(/\.$/, '')}`, left, top + 3)
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.3)
  doc.line(left, top + 21, left + colW - 14, top + 21)
  doc.setFontSize(10)
  doc.text(sign.name || ' ', left, top + 26)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...MUTED)
  doc.text(doc.splitTextToSize(sign.designation, colW - 14), left, top + 30.5)

  const bx = left + colW + gap
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.3)
  doc.roundedRect(bx, top - 2, colW, 37, 1.5, 1.5, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...accent)
  doc.text('ACCEPTANCE BY THE CANDIDATE', bx + 4, top + 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...INK)
  doc.text(doc.splitTextToSize('I have read and accept this offer of employment and its terms.', colW - 8), bx + 4, top + 8.2)
  doc.setDrawColor(...MUTED)
  doc.setLineWidth(0.2)
  doc.line(bx + 4, top + 21, bx + colW / 2 - 3, top + 21)
  doc.line(bx + colW / 2 + 2, top + 21, bx + colW - 4, top + 21)
  doc.setTextColor(...MUTED)
  doc.setFontSize(7.5)
  doc.text('Signature', bx + 4, top + 25)
  doc.text('Date', bx + colW / 2 + 2, top + 25)
  doc.setFontSize(8.5)
  doc.setTextColor(...INK)
  doc.text(`Name: ${form.candidateName || ''}`, bx + 4, top + 31)

  // ---- footer (with the approval strip) on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    drawFooter(doc, { company, accent, cells: offerFooterCells(form), note: form.footerNote, page: p, pages })
  }
  return doc
}
