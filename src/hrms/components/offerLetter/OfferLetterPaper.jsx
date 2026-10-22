import { useEffect, useRef, useState } from 'react'
import { ACCENTS, COMPANY } from '../letterhead/letterhead'
import { OFFER_WIDE_ROWS, offerFooterCells, offerSignatory, offerTerms, offerText } from './offerLetterPdf'

const PAGE_W = 794 // A4 at 96 dpi; the sheet is laid out at this size and scaled to fit its column
const PAGE_H = 1123
const rgb = (c) => `rgb(${c.join(',')})`

/**
 * On-screen twin of the PDF: same letterhead (logo + company details), watermark, wording, terms grid,
 * signature / acceptance blocks and approval footer, all taken from the same helpers the PDF uses.
 */
const OfferLetterPaper = ({ form, templateId = 'corporate', company = COMPANY }) => {
  const box = useRef(null)
  const sheet = useRef(null)
  const [scale, setScale] = useState(0.5)
  const [height, setHeight] = useState(PAGE_H)

  useEffect(() => {
    const fit = () => {
      if (box.current) setScale(box.current.clientWidth / PAGE_W)
      if (sheet.current) setHeight(sheet.current.offsetHeight)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box.current)
    ro.observe(sheet.current)
    return () => ro.disconnect()
  }, [])

  const accent = rgb(ACCENTS[templateId] || ACCENTS.corporate)
  const t = offerText({ ...form, candidateName: form.candidateName || '[Candidate name]' }, company)
  const terms = offerTerms(form)
  const grid = terms.filter(([l]) => !OFFER_WIDE_ROWS.includes(l))
  const wide = terms.filter(([l]) => OFFER_WIDE_ROWS.includes(l))
  const sign = offerSignatory(form)
  const cells = offerFooterCells(form)
  const name = form.candidateName || '[Candidate name]'
  const muted = '#64748b'
  const rule = '#e2e8f0'

  return (
    <div ref={box} className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md" style={{ height: height * scale }}>
      <div
        ref={sheet}
        className="relative flex flex-col bg-white"
        style={{ width: PAGE_W, minHeight: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left', color: '#1e293b', fontSize: 12.67, lineHeight: 1.35 }}
      >
        {/* watermark */}
        <img src={`${import.meta.env.BASE_URL}hrms-assets/logo1.png`} alt="" aria-hidden="true" className="pointer-events-none absolute select-none"
          style={{ width: 472, left: '50%', top: '48%', opacity: 0.055, transform: 'translate(-50%, -50%)' }} />

        {/* letterhead */}
        <div style={{ padding: '34px 57px 0' }} className="relative flex items-start justify-between">
          <img src={`${import.meta.env.BASE_URL}hrms-assets/logo1.png`} alt="TruckMitr" style={{ height: 64 }} />
          <div className="text-right" style={{ fontSize: 10.7, color: muted, lineHeight: 1.4 }}>
            <p style={{ fontSize: 14.7, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{company.name}</p>
            <p style={{ maxWidth: 320, marginLeft: 'auto' }}>{company.address}</p>
            <p>Toll free {company.phone} &nbsp;|&nbsp; {company.email}</p>
            <p>{company.website}</p>
          </div>
        </div>
        <div style={{ margin: '17px 57px 0', height: 4, background: accent }} />
        <div style={{ margin: '3px 57px 0', height: 1, background: rule }} />

        {/* body */}
        <div className="relative" style={{ padding: '22px 57px 0' }}>
          <div className="flex items-baseline justify-between" style={{ fontSize: 12 }}>
            <p><span style={{ color: muted }}>Ref. No.</span> &nbsp;<b>{form.refNo}</b></p>
            <p><span style={{ color: muted }}>Date</span> &nbsp;<b>{form.letterDate ? new Date(form.letterDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</b></p>
          </div>

          <p style={{ marginTop: 22, color: muted, fontSize: 12 }}>To,</p>
          <p style={{ fontSize: 14.7, fontWeight: 700 }}>{name}</p>
          {(form.email || form.phone) && <p style={{ fontSize: 11.3, color: muted }}>{[form.email, form.phone].filter(Boolean).join('   ·   ')}</p>}

          <p style={{ marginTop: 14, paddingBottom: 6, borderBottom: `1px solid ${rule}`, fontSize: 14, fontWeight: 700, color: accent }}>Subject: {t.subject}</p>

          <p style={{ marginTop: 14, fontWeight: 700 }}>Dear {name},</p>
          <p style={{ marginTop: 9 }}>{t.intro}</p>
          <p style={{ marginTop: 9 }}>{t.ctc}</p>
          {t.probation && <p style={{ marginTop: 9 }}>{t.probation}</p>}

          {terms.length > 0 && (
            <div style={{ marginTop: 16, border: `1px solid ${rule}` }}>
              <p style={{ background: accent, color: '#fff', fontSize: 11.3, fontWeight: 700, letterSpacing: 0.4, padding: '6px 15px' }}>TERMS OF EMPLOYMENT</p>
              <div className="grid grid-cols-3">
                {grid.map(([label, value], i) => (
                  <div key={label} style={{ padding: '6px 15px 7px', borderTop: i >= 3 ? `1px solid ${rule}` : 'none', borderLeft: i % 3 ? `1px solid ${rule}` : 'none' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 0.4 }}>{label.toUpperCase()}</p>
                    <p className="truncate" style={{ fontSize: 12.67 }}>{value}</p>
                  </div>
                ))}
              </div>
              {wide.map(([label, value]) => (
                <div key={label} className="flex" style={{ padding: '7px 15px', borderTop: `1px solid ${rule}` }}>
                  <p style={{ width: 160, fontSize: 9, fontWeight: 700, color: muted, letterSpacing: 0.4, paddingTop: 3 }}>{label.toUpperCase()}</p>
                  <p style={{ flex: 1, fontSize: 12.67 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <p style={{ marginTop: 14 }}>{t.closing}</p>
          <p style={{ marginTop: 9 }}>{t.welcome}</p>

          {/* signature + acceptance */}
          <div className="grid grid-cols-2" style={{ gap: 38, marginTop: 22 }}>
            <div>
              <p style={{ fontWeight: 700 }}>For {company.name.replace(/\.$/, '')}</p>
              <div style={{ marginTop: 56, borderTop: '1px solid #1e293b', width: '82%' }} />
              <p style={{ marginTop: 6, fontSize: 13.3, fontWeight: 700 }}>{sign.name || ' '}</p>
              <p style={{ fontSize: 11.3, color: muted }}>{sign.designation}</p>
            </div>
            <div style={{ border: `1px solid ${rule}`, borderRadius: 6, padding: '10px 15px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 0.4 }}>ACCEPTANCE BY THE CANDIDATE</p>
              <p style={{ marginTop: 5, fontSize: 11.3 }}>I have read and accept this offer of employment and its terms.</p>
              <div className="flex" style={{ gap: 14, marginTop: 34 }}>
                <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 3, fontSize: 10, color: muted }}>Signature</div>
                <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 3, fontSize: 10, color: muted }}>Date</div>
              </div>
              <p style={{ marginTop: 8, fontSize: 11.3 }}>Name: {name}</p>
            </div>
          </div>
        </div>

        {/* footer: approval strip + company line */}
        <div className="relative mt-auto" style={{ padding: '30px 57px 0' }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)`, background: '#f6f9fd', border: `1px solid ${rule}`, borderRadius: 6, padding: '9px 0' }}>
            {cells.map((c, i) => (
              <div key={c.label} style={{ padding: '0 15px', borderLeft: i ? `1px solid ${rule}` : 'none' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 0.4 }}>{c.label.toUpperCase()}</p>
                <p className="truncate" style={{ fontSize: 13.3, fontWeight: 700 }}>{c.value || '—'}</p>
                <p className="truncate" style={{ fontSize: 10.7, color: muted }}>{c.sub || ' '}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, height: 2, background: accent }} />
          <p className="text-center" style={{ marginTop: 6, fontSize: 9.3, color: muted }}>{company.legalName} · {company.address}</p>
          <p className="text-center" style={{ fontSize: 9.3, color: muted }}>Toll free {company.phone} · {company.email} · {company.website}</p>
          <div className="flex justify-between" style={{ marginTop: 5, paddingBottom: 26, fontSize: 9.3, color: muted }}>
            <span style={{ fontStyle: 'italic' }}>{form.footerNote}</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfferLetterPaper
