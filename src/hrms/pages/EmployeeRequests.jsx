import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileBadge, FileText, Inbox, Paperclip, X, XCircle } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '../components/payroll/Modal'
import InstantPayslipModal from '../components/payroll/InstantPayslipModal'
import InstantOfferLetterModal from '../components/offerLetter/InstantOfferLetterModal'
import { inr2 } from '../components/payroll/format'
import { StatusBadge } from '../components/employee/cards'
import { Avatar, Badge, Button, Card, Empty, Segmented, SkeletonRows } from '../components/ui'
import {
  blobErrorMessage, downloadRequestDocument, errorText, useEmployeeRequests, useFulfilRequest, useRejectRequest,
} from '../hooks/useSelfService'

const MAX_FILE = 10 * 1024 * 1024
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
const fmtDate = (d) => (d ? format(new Date(d), 'd MMM yyyy, h:mm a') : '—')

/* ------------------------------------------------------------------ *
 * Fulfil
 * ------------------------------------------------------------------ */
const FulfilModal = ({ row, onClose, onGenerate }) => {
  const fulfil = useFulfilRequest()
  const [file, setFile] = useState(null)
  const [remarks, setRemarks] = useState('')
  if (!row) return null

  // A payslip already finalized in payroll needs no file - the employee downloads it themself.
  const fileOptional = row.type === 'payslip' && row.payslip_available
  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) { toast.error('Attach a PDF, image or Word file'); e.target.value = ''; return }
    if (f.size > MAX_FILE) { toast.error('The file must be under 10 MB'); e.target.value = ''; return }
    setFile(f)
  }
  const submit = async () => {
    try {
      const res = await fulfil.mutateAsync({ id: row.id, remarks: remarks.trim(), file })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not complete the request'))
    }
  }

  return (
    <Modal open onClose={onClose} size="sm" title="Complete request"
      subtitle={`${row.full_name} · ${row.type_label}${row.period_label ? ` · ${row.period_label}` : ''}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={fulfil.isPending} disabled={!file && !fileOptional}>Mark as completed</Button></>}>
      <div className="space-y-4">
        {row.note && <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600"><b className="text-gray-800">Employee’s note:</b> {row.note}</p>}
        {row.type === 'offer_letter' && onGenerate && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-50 px-3.5 py-3 text-sm text-primary-900">
            <span>No file ready? Generate the letter from {row.full_name.split(' ')[0]}’s details instead.</span>
            <Button size="sm" icon={FileBadge} onClick={() => onGenerate(row)}>Generate</Button>
          </div>
        )}
        {fileOptional && <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-800">This month’s payslip is already in payroll, so the employee can download it themself. You can complete this without a file.</p>}
        <div>
          <label className="field-label">{row.type === 'offer_letter' ? 'Offer letter' : 'Document'} {!fileOptional && <span className="text-red-500">*</span>}</label>
          {file ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-gray-400" /><span className="truncate">{file.name}</span></span>
              <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-600" aria-label="Remove file"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={pick}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200" />
          )}
          <p className="mt-1 text-xs text-gray-500">PDF, image or Word, up to 10 MB.</p>
        </div>
        <div>
          <label className="field-label">Message to the employee <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={500} className="field-input" />
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Reject
 * ------------------------------------------------------------------ */
const RejectModal = ({ row, onClose }) => {
  const reject = useRejectRequest()
  const [remarks, setRemarks] = useState('')
  if (!row) return null
  const ok = remarks.trim().length >= 3
  const submit = async () => {
    try {
      const res = await reject.mutateAsync({ id: row.id, remarks: remarks.trim() })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e, 'Could not reject the request'))
    }
  }
  return (
    <Modal open onClose={onClose} size="sm" title="Reject request" subtitle={`${row.full_name} · ${row.type_label}${row.period_label ? ` · ${row.period_label}` : ''}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={submit} loading={reject.isPending} disabled={!ok}>Reject</Button></>}>
      <label className="field-label">Reason <span className="text-red-500">*</span></label>
      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} maxLength={500} className="field-input"
        placeholder="The employee will see this. e.g. Payroll for that month isn’t closed yet." />
      <p className="mt-1 text-xs text-gray-500">The employee sees this reason on their dashboard.</p>
    </Modal>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
const EmployeeRequests = () => {
  const [status, setStatus] = useState('pending')
  const [type, setType] = useState('')
  const [fulfilRow, setFulfilRow] = useState(null)
  const [rejectRow, setRejectRow] = useState(null)
  const [genRow, setGenRow] = useState(null) // payslip request being generated instantly
  const [letterRow, setLetterRow] = useState(null) // offer-letter request being generated
  const [busy, setBusy] = useState(null)

  const { data, isLoading, isError, error } = useEmployeeRequests({ status: status === 'all' ? '' : status, type })
  const rows = data?.rows || []
  const counts = data?.counts || {}
  const denied = isError && error?.response?.status === 403

  const download = async (r) => {
    setBusy(r.id)
    try { await downloadRequestDocument(r.id, r.document_name, { hr: true }) } catch (e) { toast.error((await blobErrorMessage(e)) || 'Could not download the document') } finally { setBusy(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl leading-tight md:text-[28px]">Employee Requests</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-gray-500">Payslip and offer-letter requests employees send from their dashboard. Generate a payslip from attendance and deductions, or an offer letter from the employee’s record (you can adjust anything before sending), attach your own file, or reject with a reason.</p>
      </div>

      <Card className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <Segmented value={status} onChange={setStatus} options={[
          { value: 'pending', label: `Pending${counts.pending ? ` (${counts.pending})` : ''}` },
          { value: 'fulfilled', label: 'Completed' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'all', label: 'All' },
        ]} />
        <select value={type} onChange={(e) => setType(e.target.value)} className="field-input !w-auto !py-1.5 text-sm" aria-label="Request type">
          <option value="">All types</option>
          <option value="payslip">Payslip</option>
          <option value="offer_letter">Offer letter</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-5"><SkeletonRows rows={5} /></div>
          : denied ? <Empty icon={AlertTriangle} title="You don’t have access to this page" description="Requests are handled by HR and admins." />
          : isError ? <Empty icon={AlertTriangle} title="Could not load requests" description="Please try again in a moment." />
          : rows.length === 0 ? <Empty icon={Inbox} title={status === 'pending' ? 'Nothing waiting for you' : 'No requests here'} description={status === 'pending' ? 'New requests from employees will show up here.' : 'Try another filter.'} />
          : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">Sent</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} data-hl={r.id} className="align-top hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.full_name} size="xs" />
                          <span><span className="block font-semibold text-gray-900">{r.full_name}</span><span className="font-mono text-[11px] text-gray-500">{r.employee_id}{r.department_name ? ` · ${r.department_name}` : ''}</span></span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{r.type_label}</span>{r.period_label && <span className="text-gray-500"> · {r.period_label}</span>}
                        {r.status === 'pending' && r.payslip_available && <span className="mt-1 block"><Badge tone="success">Already in payroll</Badge></span>}
                      </td>
                      <td className="max-w-[240px] px-4 py-3 text-xs text-gray-600">{r.note || '—'}{r.hr_remarks && <span className="mt-1 block text-gray-400">HR: {r.hr_remarks}</span>}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} />{r.handled_by && <span className="mt-1 block text-[11px] text-gray-400">by {r.handled_by}</span>}</td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' ? (
                          <span className="inline-flex flex-wrap justify-end gap-1.5">
                            {r.type === 'offer_letter' ? (
                              <>
                                <Button size="sm" icon={FileBadge} onClick={() => setLetterRow(r)}>Generate offer letter</Button>
                                <Button size="sm" variant="secondary" icon={Paperclip} onClick={() => setFulfilRow(r)}>Attach file</Button>
                              </>
                            ) : r.type === 'payslip' && !r.payslip_available
                              ? <Button size="sm" icon={FileText} onClick={() => setGenRow(r)}>Generate payslip</Button>
                              : <Button size="sm" icon={CheckCircle2} onClick={() => setFulfilRow(r)}>Complete</Button>}
                            <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setRejectRow(r)} className="!text-red-700">Reject</Button>
                          </span>
                        ) : r.has_document ? (
                          <Button size="sm" variant="secondary" icon={Download} loading={busy === r.id} onClick={() => download(r)}>Document</Button>
                        ) : r.generated_net != null ? (
                          <span className="text-xs text-gray-500">Payslip sent · <span className="numeral font-medium text-gray-700">{inr2(r.generated_net)}</span></span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <InstantPayslipModal key={`g${genRow?.id}`} row={genRow} onClose={() => setGenRow(null)} onAttachFile={(row) => { setGenRow(null); setFulfilRow(row) }} />
      <InstantOfferLetterModal key={`o${letterRow?.id}`} row={letterRow} onClose={() => setLetterRow(null)} onAttachFile={(row) => { setLetterRow(null); setFulfilRow(row) }} />
      <FulfilModal key={fulfilRow?.id} row={fulfilRow} onClose={() => setFulfilRow(null)} onGenerate={(row) => { setFulfilRow(null); setLetterRow(row) }} />
      <RejectModal key={`r${rejectRow?.id}`} row={rejectRow} onClose={() => setRejectRow(null)} />
    </div>
  )
}

export default EmployeeRequests
