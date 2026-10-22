import { useState } from 'react'
import { Link, useParams } from '@hrms/router'
import { AlertTriangle, ArrowLeft, Box, Calendar, CheckCircle2, History, MapPin, Tag, User, Wrench } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useAssetScan, useCreateAssetTicket } from '../hooks/useAssets'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtInr = (n) => (n != null && n !== '' ? `₹${Number(n).toLocaleString('en-IN')}` : '—')

const STATUS_STYLE = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 ring-blue-200',
  RETIRED: 'bg-rose-50 text-rose-700 ring-rose-200',
}
const CONDITION_STYLE = {
  GOOD: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DAMAGED: 'bg-amber-50 text-amber-700 ring-amber-200',
  LOST: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-sm">
    <span className="shrink-0 text-gray-500">{label}</span>
    <span className="min-w-0 text-right font-medium text-gray-900 break-words">{children || '—'}</span>
  </div>
)

/** What a phone shows after scanning the QR label stuck on a company asset. */
export default function AssetScan() {
  const { tag } = useParams()
  const { user } = useAuth()
  const { data: asset, isLoading, isError, error } = useAssetScan(tag)
  const createTicket = useCreateAssetTicket()
  const [reporting, setReporting] = useState(false)
  const [issue, setIssue] = useState({ issue_type: 'Hardware Malfunction', description: '' })

  if (isLoading) {
    return <div className="mx-auto max-w-lg py-20 text-center text-sm text-gray-400">Looking up asset {tag}…</div>
  }
  if (isError || !asset) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="text-lg font-semibold text-gray-900">Asset not found</h1>
        <p className="text-sm text-gray-500">{error?.response?.data?.message || `No asset with tag "${tag}" exists in the register.`}</p>
        <Link to="/dashboard" className="inline-block text-sm font-semibold text-primary-700 hover:underline">Go to dashboard</Link>
      </div>
    )
  }

  const holder = asset.assigned_to
  const isHolder = holder && holder.employee_code && holder.employee_code === user?.emp_id
  const canReport = asset.is_staff || isHolder
  const overdue = holder?.expected_return && new Date(holder.expected_return) < new Date(new Date().toDateString())

  const submitIssue = (e) => {
    e.preventDefault()
    if (!issue.description.trim()) return toast.error('Describe the problem')
    createTicket.mutate({
      employee_id: isHolder ? user.emp_id : (holder?.employee_code || user?.emp_id),
      asset_id: asset.asset_id,
      asset_name_snapshot: asset.asset_name,
      issue_type: issue.issue_type,
      description: issue.description,
    }, {
      onSuccess: () => { toast.success('Issue reported - IT/HR will follow up'); setReporting(false); setIssue({ issue_type: 'Hardware Malfunction', description: '' }) },
      onError: (err) => toast.error(err.response?.data?.message || 'Could not report the issue'),
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {asset.is_staff && (
        <Link to="/assets-management" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Assets Management
        </Link>
      )}

      {/* What this is */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
            <Box className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-tight text-gray-900">{asset.asset_name}</h1>
            <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary-700"><Tag className="h-3 w-3" />{asset.asset_tag}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className={`rounded-full px-2.5 py-0.5 ring-1 ring-inset ${STATUS_STYLE[asset.asset_status] || 'bg-gray-100 text-gray-700 ring-gray-200'}`}>{asset.asset_status}</span>
          <span className={`rounded-full px-2.5 py-0.5 ring-1 ring-inset ${CONDITION_STYLE[asset.condition_status] || 'bg-gray-100 text-gray-700 ring-gray-200'}`}>{asset.condition_status}</span>
          {asset.open_tickets > 0 && <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-orange-700 ring-1 ring-inset ring-orange-200">{asset.open_tickets} open issue{asset.open_tickets > 1 ? 's' : ''}</span>}
        </div>
        <div className="mt-3 divide-y divide-gray-100">
          <Row label="Category">{[asset.category, asset.sub_category].filter(Boolean).join(' · ')}</Row>
          <Row label="Brand / Model">{[asset.brand, asset.model].filter(Boolean).join(' ')}</Row>
          <Row label="Serial number"><span className="font-mono">{asset.serial_number}</span></Row>
          {asset.location && <Row label="Location"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" />{asset.location}</span></Row>}
        </div>
      </div>

      {/* Who has it */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900"><User className="h-4 w-4 text-gray-400" />Assigned to</h2>
        {holder ? (
          <>
            <p className="text-base font-semibold text-gray-900">{holder.employee_name || 'Unknown employee'}{isHolder && <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">You</span>}</p>
            <p className="text-xs text-gray-500">{[holder.employee_code, holder.designation, holder.department].filter(Boolean).join(' · ')}</p>
            <div className="mt-2 divide-y divide-gray-100">
              <Row label="Type">{holder.assignment_type === 'loan' ? 'Loan (temporary)' : 'Permanent'}</Row>
              <Row label="Assigned on"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{fmtDate(holder.assigned_date)}</span></Row>
              {holder.expected_return && <Row label="Due back"><span className={overdue ? 'font-semibold text-rose-600' : ''}>{fmtDate(holder.expected_return)}{overdue ? ' · overdue' : ''}</span></Row>}
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{asset.asset_status === 'RETIRED' ? 'Retired - not in use' : 'Not assigned - available in store'}</p>
        )}
      </div>

      {/* Report a problem (holder or HR) */}
      {canReport && asset.asset_status !== 'RETIRED' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
          {!reporting ? (
            <button onClick={() => setReporting(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100">
              <Wrench className="h-4 w-4" /> Report a problem with this asset
            </button>
          ) : (
            <form onSubmit={submitIssue} className="space-y-3 text-sm">
              <h2 className="font-semibold text-gray-900">Report a problem</h2>
              <select value={issue.issue_type} onChange={(e) => setIssue({ ...issue, issue_type: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2">
                <option>Hardware Malfunction</option>
                <option>Battery / Power Issue</option>
                <option>Screen / Display Defect</option>
                <option>Software / Network Issue</option>
                <option>Physical Damage</option>
                <option>Other</option>
              </select>
              <textarea rows={3} value={issue.description} onChange={(e) => setIssue({ ...issue, description: e.target.value })} placeholder="What's wrong?" className="w-full rounded-lg border border-gray-200 px-3 py-2" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setReporting(false)} className="flex-1 rounded-lg bg-gray-100 py-2 font-semibold text-gray-700">Cancel</button>
                <button type="submit" disabled={createTicket.isPending} className="flex-1 rounded-lg bg-orange-600 py-2 font-semibold text-white disabled:opacity-60">{createTicket.isPending ? 'Sending…' : 'Report'}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* HR-only: purchase + history */}
      {asset.is_staff && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Purchase</h2>
            <div className="divide-y divide-gray-100">
              <Row label="Vendor">{asset.vendor_name}</Row>
              <Row label="Purchased">{fmtDate(asset.purchase_date)}</Row>
              <Row label="Cost">{fmtInr(asset.purchase_cost)}</Row>
              {asset.warranty_end_date && <Row label="Warranty until">{fmtDate(asset.warranty_end_date)}</Row>}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900"><History className="h-4 w-4 text-gray-400" />Assignment history</h2>
            {(asset.history || []).length === 0 ? <p className="text-sm text-gray-400">Never assigned.</p> : (
              <ol className="space-y-3">
                {asset.history.map((h) => (
                  <li key={h.assignment_id} className="border-l-2 border-gray-200 pl-3 text-sm">
                    <p className="font-medium text-gray-900">{h.employee_name}{h.employee_code ? <span className="text-gray-400"> · {h.employee_code}</span> : null}</p>
                    <p className="text-xs text-gray-500">
                      {fmtDate(h.assigned_date)} → {h.returned_date ? `${fmtDate(h.returned_date)} (returned ${h.condition_out || ''})` : 'present'}
                      {h.assignment_type === 'loan' ? ' · loan' : ''}{h.assigned_by ? ` · by ${h.assigned_by}` : ''}
                    </p>
                    {h.remarks && <p className="text-xs italic text-gray-500">"{h.remarks}"</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  )
}
