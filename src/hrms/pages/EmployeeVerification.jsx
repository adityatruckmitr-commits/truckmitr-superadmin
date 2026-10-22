import { useState } from 'react'
import { Search, ShieldCheck, ShieldAlert, ShieldQuestion, X, FileText, Send } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { PageHeader, Card, CardBody, StatTile, Empty, SkeletonRows, cx } from '../components/ui'
import { useVerificationQueue, useVerificationSummary, useVerificationDossier, useSaveVerificationCheck, useTriggerPennyCheck, useVerifyPan, useVerifyAadhaar, useVerifyFaceMatch, useVerifyCourtCheck, useCourtCheckStatus } from '../hooks/useEmployeeVerification'
import { HRMS_FILE_ORIGIN } from '../env'

const CHECK_TYPES = ['aadhaar', 'pan', 'face_match', 'court_check', 'address', 'bank_account', 'upi', 'penny_check', 'credit_score']
// These four run for real against BEFISC using documents already on the employee's profile - no
// manual HR entry, so they get a document preview + read-only result instead of the editable grid.
const AUTO_CHECK_TYPES = ['aadhaar', 'pan', 'face_match', 'court_check']
const CHECK_LABELS = {
  aadhaar: 'Aadhaar', pan: 'PAN', face_match: 'Face Match', court_check: 'Court Check', address: 'Address (DAV)',
  bank_account: 'Account', upi: 'UPI', penny_check: 'Penny Check', credit_score: 'Credit Score',
}

const FIELD_LABELS = {
  card_number: 'Aadhaar Number', name_on_card: 'Name on Card', dob: 'Date of Birth', gender: 'Gender',
  address: 'Address', city: 'City', state: 'State', pin: 'PIN Code',
  pan: 'PAN Number', full_name: 'Full Name', pin_code: 'PIN Code',
  similarity: 'Similarity %', threshold: 'Threshold %', notes: 'Notes',
  case_status: 'Case Status', report: 'Report',
  visit_status: 'Visit Status', verified_address: 'Verified Address', agent_name: 'Field Agent',
  account_holder_name: 'Account Holder Name', account_number: 'Account Number', ifsc: 'IFSC', bank_name: 'Bank Name', branch: 'Branch',
  upi_id: 'UPI ID', transfer_amount: 'Amount Transferred (₹)', transaction_id: 'Transaction ID', gateway_status: 'Gateway Status', name_match: 'Name Match',
  score: 'Credit Score', bureau: 'Bureau', report_date: 'Report Date',
}
const TEXTAREA_FIELDS = ['address', 'notes', 'report', 'verified_address']
const NUMBER_FIELDS = ['similarity', 'threshold', 'transfer_amount', 'score']

const statusStyle = {
  verified: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  not_submitted: 'bg-gray-100 text-gray-500 border border-gray-200',
}
const statusLabel = { verified: 'Verified', failed: 'Failed', pending: 'Pending', not_submitted: 'Not Submitted' }

const StatusBadge = ({ status }) => (
  <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', statusStyle[status] || statusStyle.not_submitted)}>
    {statusLabel[status] || status}
  </span>
)

// The employee's file-url accessors (aadhaar_file_url etc.) come back as a relative "/storage/..."
// path - fine for an <a href> hitting the API's own origin via a redirect, but a browser resolves a
// relative <img src> against the SPA's own dev-server origin instead, so it 404s silently as a
// broken image. Prefix with the API's origin (same technique already used in Employees.jsx).
const FILE_ORIGIN = HRMS_FILE_ORIGIN
const absFileUrl = (path) => (path ? `${FILE_ORIGIN}${path}` : null)

/** Thumbnail of a document already on the employee's profile - what BEFISC actually reads, so HR can see it without typing anything. */
const DocThumb = ({ label, url: rawUrl }) => {
  const url = absFileUrl(rawUrl)
  return (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold text-gray-500">{label}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="block w-28 h-20 rounded-lg border border-gray-200 overflow-hidden bg-white">
        <img src={url} alt={label} className="w-full h-full object-cover" />
      </a>
    ) : (
      <div className="w-28 h-20 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
        Not uploaded
      </div>
    )}
  </div>
  )
}

/** Read-only result of a real BEFISC check - populated only after Verify runs, nothing editable. */
const AutoCheckResult = ({ details, remarks }) => {
  const entries = Object.entries(details || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) {
    return <p className="text-xs text-gray-400 italic">No result yet - run the check above.</p>
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([f, v]) => (
          <div key={f} className={TEXTAREA_FIELDS.includes(f) ? 'sm:col-span-2' : ''}>
            <p className="text-[11px] font-semibold text-gray-500 mb-0.5">{FIELD_LABELS[f] || f}</p>
            <p className="text-xs text-gray-900 break-words">{String(v)}</p>
          </div>
        ))}
      </div>
      {remarks && <p className="text-[11px] text-gray-400 italic">{remarks}</p>}
    </div>
  )
}

/** One check's edit form inside the dossier modal. */
const CheckPanel = ({ empId, checkType, check, employee, onSaved }) => {
  const [status, setStatus] = useState(check.status)
  const [details, setDetails] = useState(check.details || {})
  const [remarks, setRemarks] = useState(check.remarks || '')
  const [aadhaarConsent, setAadhaarConsent] = useState(false)
  const save = useSaveVerificationCheck()
  const triggerPenny = useTriggerPennyCheck()
  const verifyPan = useVerifyPan()
  const verifyAadhaar = useVerifyAadhaar()
  const verifyFaceMatch = useVerifyFaceMatch()
  const verifyCourtCheck = useVerifyCourtCheck()
  const courtCheckStatus = useCourtCheckStatus()

  const handleSave = () => {
    save.mutate({ empId, checkType, status, details, remarks }, {
      onSuccess: () => { toast.success(`${CHECK_LABELS[checkType]} updated`); onSaved?.() },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
    })
  }

  const handleSendPenny = () => {
    if (!details.account_number || !details.ifsc || !details.account_holder_name) {
      toast.error('Fill in account holder name, account number and IFSC first')
      return
    }
    const toastId = toast.loading('Sending ₹1...')
    triggerPenny.mutate({ empId, ...details }, {
      onSuccess: (res) => { toast.success(res.message || '₹1 transfer initiated', { id: toastId }); setDetails(res.data.details); onSaved?.() },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to send transfer', { id: toastId }),
    })
  }

  const handleVerifyPan = () => {
    const toastId = toast.loading('Verifying PAN...')
    verifyPan.mutate({ empId }, {
      onSuccess: (res) => {
        toast.success(res.message || 'PAN verified', { id: toastId })
        setStatus(res.data.status)
        setDetails(res.data.details)
        onSaved?.()
      },
      onError: (err) => toast.error(err.response?.data?.message || 'PAN verification failed', { id: toastId }),
    })
  }

  const handleVerifyAadhaar = () => {
    if (!aadhaarConsent) {
      toast.error('Confirm the consent checkbox first')
      return
    }
    const toastId = toast.loading('Verifying Aadhaar...')
    verifyAadhaar.mutate({ empId, consent: true }, {
      onSuccess: (res) => {
        toast.success(res.message || 'Aadhaar verified', { id: toastId })
        setStatus(res.data.status)
        setDetails(res.data.details)
        onSaved?.()
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Aadhaar verification failed', { id: toastId }),
    })
  }

  const handleVerifyFaceMatch = () => {
    const toastId = toast.loading('Comparing faces...')
    verifyFaceMatch.mutate({ empId }, {
      onSuccess: (res) => {
        toast.success(res.message || 'Face match complete', { id: toastId })
        setStatus(res.data.status)
        setDetails(res.data.details)
        onSaved?.()
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Face match failed', { id: toastId }),
    })
  }

  const handleFileCourtCheck = () => {
    const toastId = toast.loading('Filing court check...')
    verifyCourtCheck.mutate({ empId }, {
      onSuccess: (res) => {
        toast.success(res.message || 'Court check filed', { id: toastId })
        setStatus(res.data.status)
        setDetails(res.data.details)
        onSaved?.()
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Court check filing failed', { id: toastId }),
    })
  }

  const handleCheckCourtStatus = () => {
    const toastId = toast.loading('Checking for the report...')
    courtCheckStatus.mutate({ empId }, {
      onSuccess: (res) => {
        toast.success(res.message || 'Checked', { id: toastId })
        setStatus(res.data.status)
        setDetails(res.data.details)
        onSaved?.()
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Status check failed', { id: toastId }),
    })
  }

  return (
    <div className="space-y-3 p-4 border border-gray-100 rounded-xl bg-gray-50/40">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">{CHECK_LABELS[checkType]}</h4>
        <StatusBadge status={check.status} />
      </div>
      {check.verified_by && (
        <p className="text-[11px] text-gray-400">By {check.verified_by}{check.verified_at ? ` on ${new Date(check.verified_at).toLocaleString('en-IN')}` : ''}</p>
      )}
      {checkType === 'penny_check' && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <p className="text-[11px] text-blue-700">Sends a real ₹1 bank transfer via the configured payout gateway.</p>
          <button onClick={handleSendPenny} disabled={triggerPenny.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 shrink-0">
            <Send className="w-3.5 h-3.5" /> {triggerPenny.isPending ? 'Sending…' : 'Send ₹1'}
          </button>
        </div>
      )}
      {checkType === 'pan' && (
        <div className="space-y-2">
          <div className="flex gap-3"><DocThumb label="PAN Card" url={employee?.pan_file_url} /></div>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <p className="text-[11px] text-blue-700">Automatically verifies the PAN card details - no manual entry needed.</p>
            <button onClick={handleVerifyPan} disabled={verifyPan.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 shrink-0">
              <Send className="w-3.5 h-3.5" /> {verifyPan.isPending ? 'Verifying…' : 'Verify Now'}
            </button>
          </div>
        </div>
      )}
      {checkType === 'aadhaar' && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <DocThumb label="Aadhaar Card (Front)" url={employee?.aadhaar_file_url} />
            <DocThumb label="Aadhaar Card (Back)" url={employee?.aadhaar_back_file_url} />
          </div>
          <label className="flex items-start gap-2 text-[11px] text-gray-600 cursor-pointer">
            <input type="checkbox" checked={aadhaarConsent} onChange={(e) => setAadhaarConsent(e.target.checked)} className="mt-0.5" />
            <span>We confirm obtaining valid, informed consent from the employee to access/process their Aadhaar data for this verification. Consent remains valid and unwithdrawn.</span>
          </label>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <p className="text-[11px] text-blue-700">Automatically reads the Aadhaar document already on file - no manual entry needed.</p>
            <button onClick={handleVerifyAadhaar} disabled={verifyAadhaar.isPending || !aadhaarConsent} title={!aadhaarConsent ? 'Confirm the consent checkbox first' : undefined} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 shrink-0">
              <Send className="w-3.5 h-3.5" /> {verifyAadhaar.isPending ? 'Verifying…' : 'Verify Now'}
            </button>
          </div>
        </div>
      )}
      {checkType === 'face_match' && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <DocThumb label="ID Document" url={employee?.aadhaar_file_url || employee?.pan_file_url} />
            <DocThumb label="Profile Photo" url={employee?.photo_url} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <p className="text-[11px] text-blue-700">Automatically compares the ID photo against the profile photo - both already on file.</p>
            <button onClick={handleVerifyFaceMatch} disabled={verifyFaceMatch.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60 shrink-0">
              <Send className="w-3.5 h-3.5" /> {verifyFaceMatch.isPending ? 'Comparing…' : 'Verify Now'}
            </button>
          </div>
        </div>
      )}
      {checkType === 'court_check' && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <p className="text-[11px] text-blue-700">Automatically files a court-record check from the employee's profile - no manual entry needed. The report isn't instant; check status once it's filed.</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleFileCourtCheck} disabled={verifyCourtCheck.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              <Send className="w-3.5 h-3.5" /> {verifyCourtCheck.isPending ? 'Filing…' : 'File Check'}
            </button>
            {details.verify_id && (
              <button onClick={handleCheckCourtStatus} disabled={courtCheckStatus.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg disabled:opacity-60">
                {courtCheckStatus.isPending ? 'Checking…' : 'Check Status'}
              </button>
            )}
          </div>
        </div>
      )}

      {AUTO_CHECK_TYPES.includes(checkType) ? (
        <AutoCheckResult details={details} remarks={check.remarks} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {check.fields.map((f) => (
              <div key={f} className={TEXTAREA_FIELDS.includes(f) ? 'sm:col-span-2' : ''}>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">{FIELD_LABELS[f] || f}</label>
                {TEXTAREA_FIELDS.includes(f) ? (
                  <textarea
                    value={details[f] || ''} rows={2}
                    onChange={(e) => setDetails((d) => ({ ...d, [f]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-primary-500 bg-white"
                  />
                ) : (
                  <input
                    type={NUMBER_FIELDS.includes(f) ? 'number' : 'text'}
                    value={details[f] || ''}
                    onChange={(e) => setDetails((d) => ({ ...d, [f]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-primary-500 bg-white"
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Remarks</label>
            <textarea value={remarks} rows={2} onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-primary-500 bg-white" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:border-primary-500">
              <option value="not_submitted">Not Submitted</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={handleSave} disabled={save.isPending} className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-60">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const DossierModal = ({ empId, onClose }) => {
  const { data, isLoading } = useVerificationDossier(empId)

  return (
    <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">{data?.employee?.full_name || 'Employee Verification'}</h3>
            <p className="text-xs text-gray-400">{data?.employee?.employee_id} · {data?.employee?.designation}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {isLoading && <SkeletonRows rows={5} />}
          {!isLoading && data && CHECK_TYPES.map((type) => (
            <CheckPanel key={type} empId={empId} checkType={type} check={data.checks[type]} employee={data.employee} />
          ))}
        </div>
      </div>
    </div>
  )
}

const EmployeeVerification = () => {
  const [search, setSearch] = useState('')
  const [selectedEmp, setSelectedEmp] = useState(null)
  const { data: queueRes, isLoading } = useVerificationQueue(search ? { search } : {})
  const { data: summary } = useVerificationSummary()
  const rows = Array.isArray(queueRes?.data) ? queueRes.data : []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Employee Verification"
        description="Aadhaar, PAN, face match, court check and address verification for every active employee."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={ShieldQuestion} label="Total Employees" value={summary?.total_employees ?? '—'} accent="ink" index={0} />
        <StatTile icon={ShieldCheck} label="Fully Verified" value={summary?.fully_verified ?? '—'} accent="green" index={1} />
        <StatTile icon={ShieldQuestion} label="Pending / Incomplete" value={summary?.pending_or_incomplete ?? '—'} accent="orange" index={2} />
        <StatTile icon={ShieldAlert} label="Failed" value={summary?.failed ?? '—'} accent="red" index={3} />
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-primary-500"
            />
          </div>
        </div>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-5"><SkeletonRows rows={6} /></div>
          ) : rows.length === 0 ? (
            <Empty icon={FileText} title="No employees found" description="Try a different search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 text-gray-500 font-semibold uppercase text-[10px] tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5">Employee</th>
                    {CHECK_TYPES.map((t) => <th key={t} className="px-3 py-2.5">{CHECK_LABELS[t]}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.employee_id} className="hover:bg-gray-50/70 cursor-pointer transition-colors" onClick={() => setSelectedEmp(r.employee_id)}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{r.full_name}</p>
                        <p className="text-[11px] text-gray-400">{r.employee_id} · {r.designation || '—'}</p>
                      </td>
                      {CHECK_TYPES.map((t) => (
                        <td key={t} className="px-3 py-3"><StatusBadge status={r.checks[t]} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {selectedEmp && <DossierModal empId={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  )
}

export default EmployeeVerification
