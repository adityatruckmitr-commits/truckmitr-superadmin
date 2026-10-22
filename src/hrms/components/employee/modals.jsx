import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Paperclip, X } from 'lucide-react-teleadmin'
import { addDays, addMonths, format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '../payroll/Modal'
import { Button, cx } from '../ui'
import { inr2, monthLabel, num } from '../payroll/format'
import { useCreateSalaryAdvance } from '../../hooks/useSalaryAdvance'
import { useCreateResignation } from '../../hooks/useResignation'
import { useCreateExpense, useExpenseCategories, useExpenseSubCategories } from '../../hooks/useExpenses'
import { downloadMyPayslip, errorText, useCreateMyRequest } from '../../hooks/useSelfService'

const Field = ({ label, hint, required, children }) => (
  <div>
    <label className="field-label">{label}{required && <span className="text-red-500"> *</span>}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
)

const Money = ({ value, onChange, ...rest }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
    <input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
      className="field-input numeral !pl-7" {...rest} />
  </div>
)

const Note = ({ tone = 'gray', children }) => (
  <p className={cx('rounded-lg px-3.5 py-2.5 text-xs',
    tone === 'warn' ? 'bg-yellow-50 text-yellow-800' : tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600')}>
    {children}
  </p>
)

const asList = (r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [])

/* ------------------------------------------------------------------ *
 * Salary advance
 * ------------------------------------------------------------------ */
export const AdvanceModal = ({ open, onClose, empId }) => {
  const create = useCreateSalaryAdvance()
  const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('emi')
  const [months, setMonths] = useState('3')
  const [dedMonth, setDedMonth] = useState(nextMonth)
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) { setAmount(''); setType('emi'); setMonths('3'); setDedMonth(nextMonth); setReason('') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const a = num(amount)
  const m = parseInt(months, 10) || 0
  const valid = a >= 1 && !!empId && (type === 'emi' ? m >= 1 && m <= 12 : dedMonth >= nextMonth)

  const submit = async () => {
    try {
      await create.mutateAsync({
        employee_id: empId, amount: a, reason: reason.trim() || null, repayment_type: type,
        ...(type === 'emi' ? { repayment_months: m } : { deduction_month: dedMonth }),
      })
      toast.success('Advance request submitted — HR will review it')
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not submit the advance request'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Request a salary advance" subtitle="Recovered from your upcoming salaries"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={create.isPending} disabled={!valid}>Submit request</Button></>}>
      <div className="space-y-5">
        <Field label="Amount needed" required><Money value={amount} onChange={setAmount} placeholder="e.g. 10000" /></Field>
        <div>
          <p className="field-label">How should it be recovered?</p>
          <div className="grid grid-cols-2 gap-2">
            {[['emi', 'In monthly instalments'], ['lump_sum', 'One deduction in a month']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setType(v)} aria-pressed={type === v}
                className={cx('rounded-lg border px-3 py-2.5 text-sm transition-colors', type === v ? 'border-primary-300 bg-primary-50 font-medium text-primary-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {type === 'emi' ? (
          <Field label="Number of instalments" required hint={a > 0 && m > 0 ? `About ${inr2(a / m)} a month, starting the month after it is paid.` : 'Between 1 and 12.'}>
            <input type="number" min="1" max="12" value={months} onChange={(e) => setMonths(e.target.value)} className="field-input numeral" />
          </Field>
        ) : (
          <Field label="Deduct in" required hint="Must be a future month.">
            <input type="month" min={nextMonth} value={dedMonth} onChange={(e) => setDedMonth(e.target.value)} className="field-input" />
          </Field>
        )}
        <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="field-input" /></Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Expense
 * ------------------------------------------------------------------ */
const MAX_FILE = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf']
const METHODS = [['upi', 'UPI'], ['cash', 'Cash'], ['card', 'Card'], ['bank_transfer', 'Bank transfer'], ['cheque', 'Cheque']]
const todayStr = () => format(new Date(), 'yyyy-MM-dd')

export const ExpenseModal = ({ open, onClose }) => {
  const create = useCreateExpense()
  const { data: catRes } = useExpenseCategories()
  const [f, setF] = useState({ category_id: '', sub_category_id: '', amount: '', expense_date: todayStr(), description: '', vendor_name: '', payment_method: 'upi' })
  const [file, setFile] = useState(null)
  const { data: subRes } = useExpenseSubCategories(f.category_id ? Number(f.category_id) : null)
  const categories = useMemo(() => asList(catRes).filter((c) => c.is_active !== 0), [catRes])
  const subs = asList(subRes)
  useEffect(() => { if (open) { setF({ category_id: '', sub_category_id: '', amount: '', expense_date: todayStr(), description: '', vendor_name: '', payment_method: 'upi' }); setFile(null) } }, [open])

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value, ...(k === 'category_id' ? { sub_category_id: '' } : {}) }))
  const pickFile = (e) => {
    const chosen = e.target.files?.[0]
    if (!chosen) return
    if (!ALLOWED.includes(chosen.type)) { toast.error('Attach a JPG, PNG or PDF'); e.target.value = ''; return }
    if (chosen.size > MAX_FILE) { toast.error('The file must be under 10 MB'); e.target.value = ''; return }
    setFile(chosen)
  }
  const valid = f.category_id && num(f.amount) > 0 && f.description.trim().length >= 3 && f.expense_date && f.expense_date <= todayStr()

  const submit = async () => {
    const fd = new FormData()
    fd.append('category_id', f.category_id)
    if (f.sub_category_id) fd.append('sub_category_id', f.sub_category_id)
    fd.append('amount', num(f.amount))
    fd.append('expense_date', f.expense_date)
    fd.append('description', f.description.trim())
    if (f.vendor_name.trim()) fd.append('vendor_name', f.vendor_name.trim())
    fd.append('payment_method', f.payment_method)
    fd.append('expense_type', 'reimbursement')
    if (file) fd.append('attachments', file)
    try {
      await create.mutateAsync(fd)
      toast.success('Expense submitted for approval')
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not submit the expense'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Add an expense" subtitle="Goes to your manager and HR for approval"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={create.isPending} disabled={!valid}>Submit expense</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <select value={f.category_id} onChange={set('category_id')} className="field-input">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sub-category">
            <select value={f.sub_category_id} onChange={set('sub_category_id')} className="field-input" disabled={!f.category_id || subs.length === 0}>
              <option value="">{subs.length ? 'Select…' : 'None'}</option>
              {subs.map((s) => <option key={s.sub_category_id} value={s.sub_category_id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Amount" required><Money value={f.amount} onChange={(v) => setF((p) => ({ ...p, amount: v }))} /></Field>
          <Field label="Date of expense" required>
            <input type="date" max={todayStr()} value={f.expense_date} onChange={set('expense_date')} className="field-input" />
          </Field>
          <Field label="Paid by"><select value={f.payment_method} onChange={set('payment_method')} className="field-input">{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Vendor / shop"><input value={f.vendor_name} onChange={set('vendor_name')} className="field-input" maxLength={120} /></Field>
        </div>
        <Field label="What was it for?" required><textarea value={f.description} onChange={set('description')} rows={2} className="field-input" placeholder="e.g. Cab to client office, 12 Sep" /></Field>
        <Field label="Bill / receipt" hint="JPG, PNG or PDF, up to 10 MB. Optional.">
          {file ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-gray-400" /><span className="truncate">{file.name}</span></span>
              <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-600" aria-label="Remove file"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={pickFile}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200" />
          )}
        </Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Payslip / offer-letter request
 * ------------------------------------------------------------------ */
export const DocumentRequestModal = ({ open, onClose, initialType = 'payslip', payslips = [] }) => {
  const create = useCreateMyRequest()
  const lastMonth = format(addMonths(new Date(), -1), 'yyyy-MM')
  const [type, setType] = useState(initialType)
  const [month, setMonth] = useState(lastMonth)
  const [note, setNote] = useState('')
  const [downloading, setDownloading] = useState(false)
  useEffect(() => { if (open) { setType(initialType); setMonth(lastMonth); setNote('') } }, [open, initialType]) // eslint-disable-line react-hooks/exhaustive-deps

  const available = type === 'payslip' && payslips.some((p) => p.month === month)
  const valid = type === 'offer_letter' || (!!month && month <= format(new Date(), 'yyyy-MM') && !available)

  const submit = async () => {
    try {
      const res = await create.mutateAsync({ type, ...(type === 'payslip' && { period: month }), note: note.trim() || null })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not send the request'))
    }
  }
  const download = async () => {
    setDownloading(true)
    try { await downloadMyPayslip(month); toast.success('Payslip downloaded') } catch (e) { toast.error(errorText(e, 'Could not download the payslip')) } finally { setDownloading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" title={type === 'payslip' ? 'Request a payslip' : 'Request your offer letter'}
      subtitle="HR will get back to you here on your dashboard"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={create.isPending} disabled={!valid}>Send to HR</Button></>}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          {[['payslip', 'Payslip'], ['offer_letter', 'Offer letter']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setType(v)} aria-pressed={type === v}
              className={cx('rounded-lg border px-3 py-2 text-sm', type === v ? 'border-primary-300 bg-primary-50 font-medium text-primary-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>{l}</button>
          ))}
        </div>

        {type === 'payslip' && (
          <Field label="Which month?" required>
            <input type="month" value={month} max={format(new Date(), 'yyyy-MM')} onChange={(e) => setMonth(e.target.value)} className="field-input" />
          </Field>
        )}
        {available && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3.5 py-3 text-sm text-green-800">
            <span>Your {monthLabel(month)} payslip is already available — no request needed.</span>
            <Button size="sm" variant="secondary" icon={Download} onClick={download} loading={downloading}>Download</Button>
          </div>
        )}
        <Field label="Note for HR" hint={type === 'payslip' ? 'e.g. needed for a bank loan' : 'Optional'}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className="field-input" />
        </Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Resignation
 * ------------------------------------------------------------------ */
export const ResignModal = ({ open, onClose, empId }) => {
  const create = useCreateResignation()
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('30')
  const [sure, setSure] = useState(false)
  useEffect(() => { if (open) { setReason(''); setNotice('30'); setSure(false) } }, [open])

  const days = Math.min(180, Math.max(0, parseInt(notice, 10) || 0))
  const lastDay = addDays(new Date(), days)
  const valid = reason.trim().length >= 10 && sure && !!empId

  const submit = async () => {
    try {
      await create.mutateAsync({ employee_id: empId, reason: reason.trim(), notice_period_days: days })
      toast.success('Your resignation has been submitted to HR')
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not submit your resignation'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title="Submit resignation" subtitle="This is sent to HR for review — you can withdraw it while it is pending"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={submit} loading={create.isPending} disabled={!valid}>Submit resignation</Button></>}>
      <div className="space-y-5">
        <Field label="Reason for leaving" required hint="At least 10 characters.">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="field-input" />
        </Field>
        <Field label="Notice period (days)" hint={`Your last working day would be ${format(lastDay, 'EEEE, d MMM yyyy')}.`}>
          <input type="number" min="0" max="180" value={notice} onChange={(e) => setNotice(e.target.value)} className="field-input numeral !w-28" />
        </Field>
        <Note tone="warn"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />Once HR approves, your last working day is fixed and final settlement follows the company policy.</Note>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
          <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-0.5 h-4 w-4 rounded-sm border-gray-300" />
          I understand and want to submit my resignation.
        </label>
      </div>
    </Modal>
  )
}

