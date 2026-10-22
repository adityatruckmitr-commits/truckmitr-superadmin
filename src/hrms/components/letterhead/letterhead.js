/**
 * The TruckMitr letterhead, shared by every PDF the HRMS produces (offer letters, salary slips): logo and
 * company details at the top, a faint logo watermark behind the text, and a footer with the company line,
 * page numbers and - where a document needs it - an editable approval strip ("Approved by", "Prepared by").
 * Everything is drawn with jsPDF's built-in fonts (no rupee glyph, so amounts print as "Rs.").
 */

// Real company details (from the TruckMitr website). Change them here and every document follows.
export const COMPANY = {
  name: 'TruckMitr Corporate Services Pvt. Ltd.',
  legalName: 'TruckMitr Corporate Services Private Limited',
  tagline: 'Aapke Saath....',
  address: 'Suite No-G05, Plot No-C-104, Block-C, Sector-65, Noida – 201301',
  phone: '1800 102 4558',
  email: 'contact@truckmitr.com',
  website: 'www.truckmitr.com',
  cin: '', // registration numbers are printed only when filled in
  gstin: '',
}

// Accent colours per letter style (the logo's own blue is the default).
export const ACCENTS = { corporate: [27, 107, 181], modern: [15, 118, 110], startup: [79, 70, 229] }
export const INK = [30, 41, 59]
export const MUTED = [100, 116, 139]
export const RULE = [226, 232, 240]
export const TINT = [246, 249, 253]

export const PAGE = { w: 210, h: 297, left: 15, right: 195 }
export const BODY_TOP = 42 // first line under the letterhead
export const CONT_TOP = 28 // first line on a continuation page

const cache = new Map()
const MAX_LOGO_PX = 700

/** Loads an image from /public as a data URL with its size, once. Resolves null if it cannot be loaded. */
export const loadImage = (url) => {
  if (!cache.has(url)) {
    cache.set(url, (async () => {
      try {
        const blob = await (await fetch(url)).blob()
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader()
          r.onloadend = () => resolve(r.result)
          r.onerror = reject
          r.readAsDataURL(blob)
        })
        const img = await new Promise((resolve, reject) => {
          const el = new Image()
          el.onload = () => resolve(el)
          el.onerror = reject
          el.src = dataUrl
        })
        // A 1000px logo is far more than a PDF needs; keep it to 700px so documents stay small (about 60 KB).
        const scale = Math.min(1, MAX_LOGO_PX / img.naturalWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height }
      } catch {
        return null // a document is still valid without its logo
      }
    })())
  }
  return cache.get(url)
}

export const loadLogo = () => loadImage(`${import.meta.env.BASE_URL}hrms-assets/logo1.png`)

const fit = (doc, text, maxWidth) => {
  const t = String(text ?? '')
  if (doc.getTextWidth(t) <= maxWidth) return t
  let out = t
  while (out.length > 1 && doc.getTextWidth(out + '…') > maxWidth) out = out.slice(0, -1)
  return out + '…'
}

/** Faint centred logo behind the page's content. */
export const drawWatermark = (doc, logo) => {
  if (!logo) return
  const w = 125
  const h = (w * logo.height) / logo.width
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.055 }))
  doc.addImage(logo.dataUrl, 'PNG', (PAGE.w - w) / 2, (PAGE.h - h) / 2 - 8, w, h, 'tm-logo', 'FAST')
  doc.restoreGraphicsState()
}

/** Full letterhead: logo left, company details right, accent rule. Returns the y where content may start. */
export const drawLetterhead = (doc, { company = COMPANY, logo, accent = ACCENTS.corporate }) => {
  const { left, right } = PAGE
  if (logo) {
    const h = 17
    doc.addImage(logo.dataUrl, 'PNG', left, 9, (h * logo.width) / logo.height, h, 'tm-logo', 'FAST')
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...accent)
    doc.text(company.name, left, 20)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(company.name, right, 13.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  let y = 18.3
  doc.splitTextToSize(company.address, 84).forEach((line) => { doc.text(line, right, y, { align: 'right' }); y += 3.7 })
  doc.text(`Toll free ${company.phone}   |   ${company.email}`, right, y, { align: 'right' })
  y += 3.7
  doc.text(company.website, right, y, { align: 'right' })

  doc.setFillColor(...accent)
  doc.rect(left, 33, right - left, 1.1, 'F')
  doc.setDrawColor(...RULE)
  doc.setLineWidth(0.25)
  doc.line(left, 35.3, right, 35.3)

  return BODY_TOP
}

/** Slim header for the second page onwards. */
export const drawContinuationHeader = (doc, { logo, accent = ACCENTS.corporate, right: rightText = '' }) => {
  const { left, right } = PAGE
  if (logo) {
    const h = 9
    doc.addImage(logo.dataUrl, 'PNG', left, 8, (h * logo.width) / logo.height, h, 'tm-logo', 'FAST')
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  if (rightText) doc.text(rightText, right, 14, { align: 'right' })
  doc.setFillColor(...accent)
  doc.rect(left, 20, right - left, 0.8, 'F')

  return CONT_TOP
}

/**
 * Footer for the page that is currently active: an optional strip of labelled cells (the approval block),
 * the company line, an optional note, and "Page x of y".
 * @param cells [{ label, value, sub }]  e.g. Approved by / Prepared by / Reference
 */
export const drawFooter = (doc, { company = COMPANY, accent = ACCENTS.corporate, cells = [], note = '', page, pages }) => {
  const { left, right } = PAGE
  const width = right - left

  if (cells.length) {
    const top = 255
    const h = 17
    doc.setFillColor(...TINT)
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.25)
    doc.roundedRect(left, top, width, h, 1.5, 1.5, 'FD')
    const colW = width / cells.length
    cells.forEach((c, i) => {
      const x = left + i * colW + 4
      if (i > 0) doc.line(left + i * colW, top + 2.5, left + i * colW, top + h - 2.5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...accent)
      doc.text(String(c.label).toUpperCase(), x, top + 4.6)
      doc.setFontSize(9)
      doc.setTextColor(...INK)
      doc.text(fit(doc, c.value || '—', colW - 8), x, top + 9.4)
      if (c.sub) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...MUTED)
        doc.text(fit(doc, c.sub, colW - 8), x, top + 13.6)
      }
    })
  }

  doc.setFillColor(...accent)
  doc.rect(left, 275, width, 0.5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.text(fit(doc, `${company.legalName}  ·  ${company.address}`, width), PAGE.w / 2, 279.6, { align: 'center' })
  const reg = [company.cin && `CIN: ${company.cin}`, company.gstin && `GSTIN: ${company.gstin}`].filter(Boolean)
  doc.text(fit(doc, [`Toll free ${company.phone}`, company.email, company.website, ...reg].join('  ·  '), width), PAGE.w / 2, 283.6, { align: 'center' })
  if (note) {
    doc.setFont('helvetica', 'italic')
    doc.text(fit(doc, note, width - 32), left, 289)
  }
  doc.setFont('helvetica', 'normal')
  doc.text(`Page ${page} of ${pages}`, right, 289, { align: 'right' })
}

/** Text that fits one line: a value too long for its column is cut with an ellipsis. */
export const fitText = fit

// Number to Words Converter for Indian Rupee CTC
export const numberToWordsRupees = (amount) => {
  if (!amount) return 'Zero Only'
  const num = parseInt(String(amount).replace(/[^0-9]/g, ''), 10)
  if (isNaN(num) || num === 0) return 'Zero Only'

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow'
    let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
    if (!n_array) return ''
    let str = ''
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : ''
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : ''
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : ''
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : ''
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : ''
    return str
  }

  const words = inWords(num)
  return (words ? words.trim() : '') + ' Only'
}

