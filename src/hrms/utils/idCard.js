import { jsPDF } from 'jspdf'

/**
 * TruckMitr employee ID card: standard CR80 card (54 x 85.6 mm, portrait), drawn on a canvas at
 * 300 dpi. The same canvas is the on-screen preview, the PNG and the PDF page, so what HR sees is
 * exactly what prints.
 */
export const CARD_MM = { w: 54, h: 85.6 }
const DPI = 300
const PX = DPI / 25.4 // px per mm
const W = Math.round(CARD_MM.w * PX)
const H = Math.round(CARD_MM.h * PX)
const m = (mm) => mm * PX

// Taken from the TruckMitr logo so the card matches the brand, not the HRMS theme.
const BRAND = '#1B6AB4'
const BRAND_DARK = '#0E3F73'
const BRAND_SOFT = '#E8F1FB'
const BLOOD = '#C62828'
const INK = '#0F172A'
const MUTED = '#64748B'
const FONT = 'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif'

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load image ${String(src).slice(0, 60)}`))
    img.src = src
  })

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Largest font size (<= max) at which `text` fits in `maxWidth`. */
const fitFont = (ctx, text, weight, maxPx, minPx, maxWidth) => {
  let size = maxPx
  for (; size > minPx; size -= 1) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
  }
  ctx.font = `${weight} ${size}px ${FONT}`
  return size
}

/** Wrap to at most `lines` lines inside maxWidth; the last line is ellipsised if needed. */
const wrap = (ctx, text, maxWidth, lines) => {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const out = []
  let cur = ''
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth || !cur) cur = next
    else { out.push(cur); cur = w }
  })
  if (cur) out.push(cur)
  if (out.length > lines) {
    const kept = out.slice(0, lines)
    let last = kept[lines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1)
    kept[lines - 1] = `${last}…`
    return kept
  }
  return out
}

/** Draw `img` into the box like CSS object-fit: cover (centred horizontally, biased to the top for faces). */
const drawCover = (ctx, img, x, y, w, h) => {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s
  const sh = h / s
  const sx = (img.width - sw) / 2
  const sy = Math.max(0, (img.height - sh) * 0.2)
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const initials = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

const newCanvas = () => {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.textBaseline = 'alphabetic'
  return [c, ctx]
}

// ------------------------------------------------------------------ front

export const drawFront = async (card, { logo, photo }) => {
  const [c, ctx] = newCanvas()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Logo on white, as the brand is meant to be seen.
  const logoW = m(40)
  const logoH = (logo.height / logo.width) * logoW
  ctx.drawImage(logo, (W - logoW) / 2, m(3.2), logoW, logoH)

  // Brand panel with a soft curve the photo sits over.
  const top = m(25)
  const grad = ctx.createLinearGradient(0, top, 0, H)
  grad.addColorStop(0, BRAND)
  grad.addColorStop(1, BRAND_DARK)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(0, top + m(5))
  ctx.quadraticCurveTo(W / 2, top - m(4), W, top + m(5))
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fill()

  // "EMPLOYEE ID CARD" ribbon label
  ctx.font = `700 ${m(1.9)}px ${FONT}`
  ctx.fillStyle = BRAND
  ctx.textAlign = 'center'
  ctx.letterSpacing = `${m(0.35)}px`
  ctx.fillText('EMPLOYEE ID CARD', W / 2, m(23.2))
  ctx.letterSpacing = '0px'

  // Photo with a white frame
  const pw = m(27)
  const ph = m(33)
  const px = (W - pw) / 2
  const py = m(27.5)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = m(1.5)
  ctx.shadowOffsetY = m(0.4)
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, px - m(1), py - m(1), pw + m(2), ph + m(2), m(3))
  ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, px, py, pw, ph, m(2.4))
  ctx.clip()
  if (photo) {
    drawCover(ctx, photo, px, py, pw, ph)
  } else {
    ctx.fillStyle = BRAND_SOFT
    ctx.fillRect(px, py, pw, ph)
    ctx.fillStyle = BRAND
    ctx.font = `700 ${m(10)}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(initials(card.full_name), W / 2, py + ph / 2 + m(3.5))
  }
  ctx.restore()

  // Name + designation
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  const nameSize = fitFont(ctx, card.full_name || '', 800, m(4.4), m(2.8), m(48))
  ctx.fillText(card.full_name || '', W / 2, m(66.2))
  ctx.font = `500 ${m(2.5)}px ${FONT}`
  ctx.fillStyle = '#CFE2F6'
  const role = [card.designation, card.department_name].filter(Boolean).join(' · ')
  if (role) ctx.fillText(wrap(ctx, role, m(48), 1)[0], W / 2, m(66.2) + nameSize * 0.2 + m(3.4))

  // Details panel: Employee ID + Blood Group
  const bx = m(4)
  const by = m(72.2)
  const bw = W - m(8)
  const bh = m(9.4)
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, bx, by, bw, bh, m(2))
  ctx.fill()
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = m(0.15)
  ctx.beginPath()
  ctx.moveTo(bx + bw * 0.62, by + m(1.8))
  ctx.lineTo(bx + bw * 0.62, by + bh - m(1.8))
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.font = `700 ${m(1.7)}px ${FONT}`
  ctx.fillStyle = MUTED
  ctx.fillText('EMPLOYEE ID', bx + m(2.4), by + m(3.6))
  ctx.fillStyle = INK
  fitFont(ctx, card.emp_id || '—', 800, m(2.9), m(2), bw * 0.62 - m(3.5))
  ctx.fillText(card.emp_id || '—', bx + m(2.4), by + m(7.4))

  const cx = bx + bw * 0.62 + m(2.4)
  ctx.font = `700 ${m(1.7)}px ${FONT}`
  ctx.fillStyle = MUTED
  ctx.fillText('BLOOD GROUP', cx, by + m(3.6))
  // blood drop
  const dx = cx + m(0.9)
  const dy = by + m(6.6)
  ctx.fillStyle = BLOOD
  ctx.beginPath()
  ctx.moveTo(dx, dy - m(1.7))
  ctx.bezierCurveTo(dx + m(1.3), dy - m(0.2), dx + m(1.1), dy + m(1), dx, dy + m(1))
  ctx.bezierCurveTo(dx - m(1.1), dy + m(1), dx - m(1.3), dy - m(0.2), dx, dy - m(1.7))
  ctx.fill()
  ctx.font = `800 ${m(3.1)}px ${FONT}`
  ctx.fillStyle = card.blood_group ? BLOOD : MUTED
  ctx.fillText(card.blood_group || '—', cx + m(2.6), by + m(7.5))

  // Footer
  ctx.textAlign = 'center'
  ctx.font = `600 ${m(1.9)}px ${FONT}`
  ctx.fillStyle = '#CFE2F6'
  ctx.fillText('www.truckmitr.com', W / 2, H - m(1.6))

  return c
}

// ------------------------------------------------------------------- back

export const drawBack = async (card, { qr }) => {
  const [c, ctx] = newCanvas()
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Header band
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, BRAND_DARK)
  grad.addColorStop(1, BRAND)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, m(12))
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `800 ${m(3.4)}px ${FONT}`
  ctx.fillText('TruckMitr', W / 2, m(6.4))
  ctx.font = `500 ${m(1.8)}px ${FONT}`
  ctx.fillStyle = '#CFE2F6'
  ctx.fillText('Aapke Saath....', W / 2, m(9.6))

  // QR (employee id + name) for a quick scan at the gate / reception
  const q = m(25)
  if (qr) {
    ctx.fillStyle = BRAND_SOFT
    roundRect(ctx, (W - q) / 2 - m(1.6), m(15.4), q + m(3.2), q + m(3.2), m(2))
    ctx.fill()
    ctx.drawImage(qr, (W - q) / 2, m(17), q, q)
  }

  // Details
  const rows = [
    ['Employee ID', card.emp_id],
    ['Department', card.department_name],
    ['Date of Joining', card.doj ? new Date(card.doj).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null],
  ].filter(([, v]) => v)
  let y = m(48)
  rows.forEach(([label, value]) => {
    ctx.textAlign = 'left'
    ctx.font = `600 ${m(1.9)}px ${FONT}`
    ctx.fillStyle = MUTED
    ctx.fillText(label, m(5), y)
    ctx.textAlign = 'right'
    ctx.font = `700 ${m(2.2)}px ${FONT}`
    ctx.fillStyle = INK
    ctx.fillText(String(value), W - m(5), y)
    y += m(4.4)
  })

  // Terms
  ctx.textAlign = 'center'
  ctx.font = `400 ${m(1.75)}px ${FONT}`
  ctx.fillStyle = MUTED
  const terms = 'This card is the property of TruckMitr and must be carried while on duty. If found, please return it to the TruckMitr HR department.'
  wrap(ctx, terms, m(44), 4).forEach((line, i) => ctx.fillText(line, W / 2, m(63) + i * m(2.6)))

  // Signature line
  ctx.strokeStyle = '#94A3B8'
  ctx.lineWidth = m(0.2)
  ctx.beginPath()
  ctx.moveTo(W - m(24), m(78))
  ctx.lineTo(W - m(5), m(78))
  ctx.stroke()
  ctx.font = `600 ${m(1.6)}px ${FONT}`
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.fillText('Authorised Signatory', W - m(14.5), m(80.4))

  // Footer strip
  ctx.fillStyle = BRAND
  ctx.fillRect(0, H - m(2.2), W, m(2.2))

  return c
}

// ------------------------------------------------------------------ output

/** Both sides as canvases. `qrCanvas` is a rendered QR (qrcode.react) or null. */
export const renderCard = async (card, qrCanvas) => {
  if (document.fonts?.ready) await document.fonts.ready
  const [logo, photo] = await Promise.all([
    loadImage(`${import.meta.env.BASE_URL}hrms-assets/logo1.png`),
    card.photo ? loadImage(card.photo).catch(() => null) : Promise.resolve(null),
  ])
  const front = await drawFront(card, { logo, photo })
  const back = await drawBack(card, { qr: qrCanvas })
  return { front, back }
}

const fileBase = (card) => `ID-Card-${card.emp_id}-${String(card.full_name || '').replace(/[^\w]+/g, '-')}`

export const cardPdf = ({ front, back }) => {
  const pdf = new jsPDF({ unit: 'mm', format: [CARD_MM.w, CARD_MM.h], orientation: 'portrait' })
  pdf.addImage(front.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, CARD_MM.w, CARD_MM.h)
  pdf.addPage([CARD_MM.w, CARD_MM.h], 'portrait')
  pdf.addImage(back.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, CARD_MM.w, CARD_MM.h)
  return pdf
}

export const downloadCardPdf = (card, sides) => cardPdf(sides).save(`${fileBase(card)}.pdf`)

export const downloadCardPng = (card, { front }) => {
  const a = document.createElement('a')
  a.href = front.toDataURL('image/png')
  a.download = `${fileBase(card)}-front.png`
  a.click()
}

export const printCard = (sides) => {
  const pdf = cardPdf(sides)
  pdf.autoPrint()
  window.open(pdf.output('bloburl'), '_blank')
}
