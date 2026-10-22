import { useEffect, useState } from 'react'
import { AlertTriangle, Download, Paperclip, Send } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import Modal from '../payroll/Modal'
import { Button, Skeleton } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { errorText, useIssueOfferLetter, useOfferLetterDraft } from '../../hooks/useSelfService'
import { usePayrollSettings } from '../../hooks/usePayroll'
import { estimateInhand } from './inhand'
import { COMPANY, buildOfferLetterPdf, numberToWordsRupees } from './offerLetterPdf'

const TEMPLATES = [
  { id: 'corporate', name: 'TruckMitr Blue' },
  { id: 'modern', name: 'Emerald' },
  { id: 'startup', name: 'Indigo' },
]

const Field = ({ label, required, hint, className = '', children }) => (
  <div className={className}>
    <label className="field-label">{label}{required && <span className="text-red-500"> *</span>}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
)

const Section = ({ title, children }) => (
  <section>
    <h4 className="mb-3 text-sm font-semibold text-gray-900">{title}</h4>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const safeName = (name) => String(name || 'Employee').trim().replace(/[^\w-]+/g, '_')

/**
 * HR generates the offer letter an employee asked for: the form starts filled in from their record, HR
 * adjusts it, and one click builds the PDF, files it in Offer Letter history and completes the request.
 */
const InstantOfferLetterModal = ({ row, onClose, onAttachFile }) => {
  const { user } = useAuth()
  const { data: draft, isLoading, isError, error } = useOfferLetterDraft(row?.id)
  const issue = useIssueOfferLetter()
  const [form, setForm] = useState(null)
  const [templateId, setTemplateId] = useState('corporate')
  const [message, setMessage] = useState('')
  const { data: payrollSettings } = usePayrollSettings()

  useEffect(() => {
    if (!draft) return
    setForm({
      refNo: draft.ref_no,
      letterDate: draft.letter_date || '',
      candidateName: draft.candidate_name || '',
      email: draft.email || '',
      phone: draft.phone || '',
      designation: draft.designation || '',
      department: draft.department || '',
      reportingManager: draft.reporting_manager || '',
      location: draft.location || '',
      joiningDate: draft.joining_date || '',
      annualCtc: draft.annual_ctc || '',
      joiningBonus: '',
      otherBenefits: '',
      probationPeriod: '6 Months',
      noticePeriod: '30 Days',
      workingHours: draft.working_hours || '9:00 AM - 6:00 PM (Mon-Fri)',
      signatoryName: user?.full_name || user?.name || '',
      signatoryDesignation: 'HR Manager / Authorized Signatory',
      approverName: '',
      approverDesignation: '',
      preparedBy: user?.full_name || user?.name || '',
      footerNote: 'Confidential — for the addressee only.',
      specialNotes: '',
      // the employee's real take-home (their own structure and PF rule) - shown only if HR switches it on
      showInhand: false,
      monthlyInhand: draft.monthly_inhand ? String(Math.round(draft.monthly_inhand)) : '',
    })
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!row) return null
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const firstName = (row.full_name || 'employee').split(' ')[0]

  const emailOk = !form?.email || EMAIL.test(form.email)
  const canSend = !!form && form.candidateName.trim() && form.designation.trim() && /\d/.test(form.annualCtc) && form.letterDate && emailOk

  const build = () => buildOfferLetterPdf(form, { templateId, company: COMPANY }) // resolves to the jsPDF doc

  const preview = async () => {
    try {
      const url = URL.createObjectURL((await build()).output('blob'))
      // A pop-up blocker can refuse the tab; fall back to a download so the preview is never lost.
      if (!window.open(url, '_blank')) {
        const link = document.createElement('a')
        link.href = url
        link.download = `Preview_Offer_Letter_${safeName(form.candidateName)}.pdf`
        link.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) {
      console.error(e)
      toast.error('Could not build the PDF preview')
    }
  }

  const send = async () => {
    try {
      const file = new File([(await build()).output('blob')], `Offer_Letter_${safeName(form.candidateName)}.pdf`, { type: 'application/pdf' })
      const res = await issue.mutateAsync({
        id: row.id,
        file,
        remarks: message.trim(),
        fields: {
          ref_no: form.refNo, candidate_name: form.candidateName.trim(), email: form.email.trim(), phone: form.phone.trim(),
          designation: form.designation.trim(), department: form.department.trim(), reporting_manager: form.reportingManager.trim(),
          location: form.location.trim(), letter_date: form.letterDate, joining_date: form.joiningDate,
          ctc: form.annualCtc.trim(), probation_period: form.probationPeriod.trim(), notice_period: form.noticePeriod.trim(),
          working_hours: form.workingHours.trim(), joining_bonus: form.joiningBonus.trim(), other_benefits: form.otherBenefits.trim(),
          template_id: templateId,
          show_inhand: form.showInhand ? 1 : 0, monthly_inhand: form.showInhand ? form.monthlyInhand.trim() : '',
          signatory_name: form.signatoryName.trim(), signatory_designation: form.signatoryDesignation.trim(),
          approver_name: form.approverName.trim(), approver_designation: form.approverDesignation.trim(),
          prepared_by: form.preparedBy.trim(), footer_note: form.footerNote.trim(),
        },
      })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not send the offer letter'))
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="ghost" icon={Paperclip} onClick={() => onAttachFile?.(row)}>Attach a file instead</Button>
      {form && (
        <>
          <Button variant="secondary" icon={Download} onClick={preview} disabled={!canSend}>Preview PDF</Button>
          <Button icon={Send} onClick={send} loading={issue.isPending} disabled={!canSend}>Send to {firstName}</Button>
        </>
      )}
    </>
  )

  return (
    <Modal open onClose={onClose} size="lg" title="Generate offer letter" subtitle={`${row.full_name}${form ? ` · Ref ${form.refNo}` : ''}`} footer={footer}>
      {isLoading && <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-40 w-full" /></div>}

      {isError && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3.5 text-sm text-yellow-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not prepare the letter</p>
            <p className="mt-0.5">{errorText(error, 'Please try again in a moment.')} You can still attach a file instead.</p>
          </div>
        </div>
      )}

      {form && (
        <div className="space-y-6">
          {row.note && <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600"><b className="text-gray-800">Employee’s note:</b> {row.note}</p>}
          <p className="rounded-lg bg-primary-50 px-3.5 py-2.5 text-xs text-primary-800">
            Filled in from {firstName}’s employee record. Check every detail, adjust anything that is off, then preview the PDF before sending.
          </p>

          <Section title="Candidate">
            <Field label="Full name" required><input value={form.candidateName} onChange={set('candidateName')} maxLength={255} className="field-input" /></Field>
            <Field label="Email" hint={emailOk ? 'Kept with the letter in Offer Letter history.' : undefined}>
              <input type="email" value={form.email} onChange={set('email')} maxLength={255} className={`field-input ${emailOk ? '' : '!border-red-400'}`} />
              {!emailOk && <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>}
            </Field>
            <Field label="Phone"><input value={form.phone} onChange={set('phone')} maxLength={255} className="field-input" /></Field>
          </Section>

          <Section title="Role">
            <Field label="Designation" required><input value={form.designation} onChange={set('designation')} maxLength={255} className="field-input" /></Field>
            <Field label="Department"><input value={form.department} onChange={set('department')} maxLength={255} className="field-input" /></Field>
            <Field label="Reporting manager"><input value={form.reportingManager} onChange={set('reportingManager')} maxLength={255} className="field-input" /></Field>
            <Field label="Work location"><input value={form.location} onChange={set('location')} maxLength={255} className="field-input" /></Field>
            <Field label="Date of joining"><input type="date" value={form.joiningDate} onChange={set('joiningDate')} className="field-input" /></Field>
            <Field label="Letter date" required><input type="date" value={form.letterDate} onChange={set('letterDate')} className="field-input" /></Field>
          </Section>

          <Section title="Compensation & terms">
            <Field label="Annual CTC (₹)" required hint={/\d/.test(form.annualCtc) ? `In words: ${numberToWordsRupees(form.annualCtc)}` : 'Not set in payroll yet — enter it here.'}>
              <input inputMode="numeric" value={form.annualCtc} onChange={set('annualCtc')} maxLength={255} className="field-input numeral" />
            </Field>
            <Field label="Joining bonus" hint="Optional"><input value={form.joiningBonus} onChange={set('joiningBonus')} maxLength={255} className="field-input" /></Field>
            <Field label="Probation period"><input value={form.probationPeriod} onChange={set('probationPeriod')} maxLength={255} className="field-input" /></Field>
            <Field label="Notice period"><input value={form.noticePeriod} onChange={set('noticePeriod')} maxLength={255} className="field-input" /></Field>
            <Field label="Working hours" className="sm:col-span-2"><input value={form.workingHours} onChange={set('workingHours')} maxLength={255} className="field-input" /></Field>
            <Field label="Other benefits" hint="Optional — printed in the key-terms box" className="sm:col-span-2">
              <textarea value={form.otherBenefits} onChange={set('otherBenefits')} rows={2} maxLength={2000} className="field-input" />
            </Field>
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-800">
                <input type="checkbox" checked={form.showInhand} onChange={(e) => setForm((f) => ({ ...f, showInhand: e.target.checked }))} className="h-4 w-4 rounded-sm border-gray-300 text-primary-700" />
                Show monthly in-hand salary in the letter
              </label>
              {form.showInhand && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Monthly in-hand (₹)" hint={draft?.monthly_inhand ? 'Starts from their actual take-home under their current salary and PF rule.' : 'Their salary is not set in payroll — type it, or use the CTC estimate.'}>
                    <input inputMode="numeric" value={form.monthlyInhand} onChange={set('monthlyInhand')} maxLength={50} className="field-input numeric" />
                  </Field>
                  <div className="flex items-end pb-1 text-xs text-gray-600">
                    {estimateInhand(form.annualCtc, payrollSettings) ? (
                      <button type="button" className="font-semibold text-primary-700 hover:underline"
                        onClick={() => setForm((f) => ({ ...f, monthlyInhand: String(Math.round(estimateInhand(f.annualCtc, payrollSettings).inhand)) }))}>
                        Recalculate from the CTC (≈ ₹{Math.round(estimateInhand(form.annualCtc, payrollSettings).inhand).toLocaleString('en-IN')})
                      </button>
                    ) : <span>Enter an annual CTC to calculate from it.</span>}
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="Signature & approval">
            <Field label="Signatory name"><input value={form.signatoryName} onChange={set('signatoryName')} maxLength={150} className="field-input" /></Field>
            <Field label="Signatory designation"><input value={form.signatoryDesignation} onChange={set('signatoryDesignation')} maxLength={150} className="field-input" /></Field>
            <Field label="Approved by (name)" hint="Shown in the footer approval strip"><input value={form.approverName} onChange={set('approverName')} maxLength={150} className="field-input" placeholder="Who approves this offer" /></Field>
            <Field label="Approved by (designation)"><input value={form.approverDesignation} onChange={set('approverDesignation')} maxLength={150} className="field-input" placeholder="e.g. Chief Executive Officer" /></Field>
            <Field label="Prepared by"><input value={form.preparedBy} onChange={set('preparedBy')} maxLength={150} className="field-input" /></Field>
            <Field label="Footer note"><input value={form.footerNote} onChange={set('footerNote')} maxLength={150} className="field-input" /></Field>
          </Section>

          <Section title="Issue">
            <Field label="Letter style">
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="field-input">
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Message to the employee" hint="Optional — shown next to the letter" className="sm:col-span-2">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={500} className="field-input" />
            </Field>
          </Section>
        </div>
      )}
    </Modal>
  )
}

export default InstantOfferLetterModal
