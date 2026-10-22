import { useEffect, useMemo, useRef, useState } from 'react'
import { useHighlightId } from '../hooks/useHighlightId'
import { AlertTriangle, Clock, Download, FileBadge, FileText, Inbox, ShieldCheck } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { StatusBadge } from '../components/employee/cards'
import { DocumentRequestModal } from '../components/employee/modals'
import { Button, Card, Empty, PageHeader, Segmented, SkeletonRows, cx } from '../components/ui'
import {
  blobErrorMessage, downloadMyPayslip, downloadRequestDocument, errorText, useMyPayout, useMyRequests,
} from '../hooks/useSelfService'
import { useMyOfferLetter, downloadMySignedOfferLetter } from '../hooks/useOfferLetters'

const fmt = (d) => (d ? format(new Date(d), 'd MMM yyyy, h:mm a') : '—')

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'fulfilled', label: 'Ready' },
  { value: 'pending', label: 'Waiting on HR' },
  { value: 'rejected', label: 'Rejected' },
]

/**
 * Every document the employee has asked HR for, in one place: what is still waiting, what is ready to
 * download (an attached file, or a payslip HR generated in payroll) and what was turned down and why.
 */
const MyDocuments = () => {
  const highlightId = useHighlightId()
  // Poll gently so a request HR just completed turns into a Download button without a reload.
  const requests = useMyRequests({ refetchInterval: 30000 })
  const payout = useMyPayout()
  const myOfferLetter = useMyOfferLetter()

  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // 'payslip' | 'offer_letter'
  const [busy, setBusy] = useState(null)
  const [signedLetterBusy, setSignedLetterBusy] = useState(false)
  const rowRefs = useRef({})

  const downloadSignedOfferLetter = async () => {
    setSignedLetterBusy(true)
    try {
      await downloadMySignedOfferLetter(`Signed_Offer_Letter_${myOfferLetter.data?.candidate_name?.replace(/\s+/g, '_') || 'Offer_Letter'}.pdf`)
      toast.success('Downloaded')
    } catch (e) {
      toast.error((await blobErrorMessage(e)) || errorText(e, 'Could not download the document'))
    } finally {
      setSignedLetterBusy(false)
    }
  }

  const rows = useMemo(() => (Array.isArray(requests.data) ? requests.data : []), [requests.data])
  const counts = useMemo(() => rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {}), [rows])
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
  const denied = requests.isError && requests.error?.response?.status === 404

  // Arriving from a notification: bring the request it is about into view.
  useEffect(() => {
    const el = highlightId && rowRefs.current[highlightId]
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250)
  }, [highlightId, rows.length])

  const download = async (r) => {
    setBusy(r.id)
    try {
      if (r.has_document) await downloadRequestDocument(r.id, r.document_name)
      else await downloadMyPayslip(r.period)
      toast.success('Downloaded')
    } catch (e) {
      toast.error((await blobErrorMessage(e)) || errorText(e, 'Could not download the document'))
    } finally {
      setBusy(null)
    }
  }

  const options = FILTERS.map((f) => ({
    ...f,
    label: f.value === 'all' ? `All (${rows.length})` : `${f.label}${counts[f.value] ? ` (${counts[f.value]})` : ''}`,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Payslips and letters you have asked HR for. Completed ones can be downloaded here — you also get a notification the moment HR handles a request."
        actions={<>
          <Button variant="secondary" icon={FileBadge} onClick={() => setModal('offer_letter')}>Request offer letter</Button>
          <Button icon={FileText} onClick={() => setModal('payslip')}>Request payslip</Button>
        </>}
      />

      {myOfferLetter.data?.has_hr_signed && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Your signed offer letter is ready</p>
              <p className="text-xs text-gray-500">Countersigned by the Director and HR.</p>
            </div>
          </div>
          <Button icon={Download} loading={signedLetterBusy} onClick={downloadSignedOfferLetter}>Download Signed PDF</Button>
        </Card>
      )}

      <Card className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <Segmented value={filter} onChange={setFilter} options={options} />
        {counts.pending > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><Clock className="h-3.5 w-3.5" />{counts.pending} waiting for HR</span>
        )}
      </Card>

      <Card className="overflow-hidden">
        {requests.isLoading ? <div className="p-5"><SkeletonRows rows={4} /></div>
          : denied ? <Empty icon={AlertTriangle} title="No employee profile is linked to this login" description="Ask HR to link your profile so you can request documents." />
          : requests.isError ? <Empty icon={AlertTriangle} title="Could not load your documents" description="Please try again in a moment." action={<Button variant="secondary" onClick={() => requests.refetch()}>Retry</Button>} />
          : rows.length === 0 ? (
            <Empty icon={Inbox} title="No document requests yet" description="Ask HR for an older payslip or your offer letter. It will show up here with its status."
              action={<div className="flex gap-2"><Button variant="secondary" onClick={() => setModal('offer_letter')}>Offer letter</Button><Button onClick={() => setModal('payslip')}>Payslip</Button></div>} />
          ) : shown.length === 0 ? (
            <Empty icon={Inbox} title="Nothing here" description="No requests match this filter." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show all</Button>} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {shown.map((r) => {
                const canDownload = r.status === 'fulfilled' && (r.has_document || r.payslip_ready)
                const Icon = r.type === 'offer_letter' ? FileBadge : FileText
                return (
                  <li key={r.id} ref={(el) => { rowRefs.current[r.id] = el }}
                    className={cx('flex flex-wrap items-center gap-4 px-5 py-4 transition-colors', highlightId === r.id && 'bg-primary-50/60')}>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100"><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                        {r.type_label}{r.period_label ? ` · ${r.period_label}` : ''}
                        <StatusBadge status={r.status} />
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">Requested {fmt(r.created_at)}{r.note ? ` · “${r.note}”` : ''}</p>
                      {r.status === 'pending' && <p className="mt-1 text-xs text-gray-500">Waiting for HR — this page updates when it is handled.</p>}
                      {r.status === 'fulfilled' && (
                        <p className="mt-1 text-xs text-gray-500">
                          Completed {fmt(r.handled_at)}{r.handled_by ? ` by ${r.handled_by}` : ''}
                          {r.hr_remarks ? <> · HR: “{r.hr_remarks}”</> : null}
                          {!canDownload && ' · nothing to download for this one'}
                        </p>
                      )}
                      {r.status === 'rejected' && <p className="mt-1 text-xs text-red-700">Rejected {fmt(r.handled_at)}{r.hr_remarks ? <> — “{r.hr_remarks}”</> : null}</p>}
                    </div>
                    {canDownload && (
                      <Button size="sm" variant="secondary" icon={Download} loading={busy === r.id} onClick={() => download(r)}>
                        {r.has_document ? 'Download' : 'Download payslip'}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
      </Card>

      <DocumentRequestModal open={!!modal} onClose={() => setModal(null)} initialType={modal || 'payslip'} payslips={payout.data?.payslips || []} />
    </div>
  )
}

export default MyDocuments
