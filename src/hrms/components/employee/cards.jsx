import { useState } from 'react'
import { Link } from '@hrms/router'
import { ArrowRight, CheckCircle2, Download, FileText, Laptop, Package, PauseCircle, Receipt, Send, UserMinus, Wallet, IndianRupee, Inbox } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Badge, Button, Card, CardBody, CardHeader, Empty, Skeleton, cx } from '../ui'
import { inr, inr2 } from '../payroll/format'
import { PayStatusBadge, payStatusMeta } from '../payroll/PayStatus'
import { useWithdrawResignation } from '../../hooks/useResignation'
import { blobErrorMessage, downloadMyPayslip, downloadRequestDocument, errorText } from '../../hooks/useSelfService'

const fmt = (d) => (d ? format(new Date(d), 'd MMM yyyy') : '—')

// One place decides how a status word looks, so every card agrees.
export const StatusBadge = ({ status }) => {
  const s = String(status || '').toLowerCase()
  const tone = ['approved', 'fulfilled', 'paid', 'settled', 'active'].includes(s) ? 'success'
    : ['pending', 'submitted'].includes(s) ? 'warning'
    : ['rejected', 'declined'].includes(s) ? 'danger' : 'neutral'
  return <Badge tone={tone} className="capitalize">{s === 'fulfilled' ? 'Completed' : s || '—'}</Badge>
}

const MoreLink = ({ to, children }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-900">
    {children} <ArrowRight className="h-3.5 w-3.5" />
  </Link>
)

const Skel = () => <div className="space-y-3 p-5"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-16 w-full" /></div>

/* ------------------------------------------------------------------ *
 * Payout breakup ("what my salary is made of")
 * ------------------------------------------------------------------ */
const PARTS = [
  { key: 'basic', label: 'Basic salary', bar: 'bg-primary-700' },
  { key: 'hra', label: 'House rent allowance', bar: 'bg-brass-400' },
  { key: 'conveyance', label: 'Conveyance allowance', bar: 'bg-green-500' },
  { key: 'special', label: 'Special allowance', bar: 'bg-orange-400' },
  { key: 'unallocated', label: 'Salary (not yet split)', bar: 'bg-gray-400' },
]
const LOP_TEXT = {
  calendar_days: 'the number of days in that month',
  fixed_30: '30 days',
  working_days: 'the working days in that month',
}

export const PayoutCard = ({ payout, loading }) => {
  const st = payout?.structure
  const latest = payout?.payslips?.[0]
  return (
    <Card className="overflow-hidden">
      <CardHeader icon={IndianRupee} title="My payout" subtitle="How your monthly salary is made up" />
      {loading ? <Skel /> : !st || st.gross <= 0 ? (
        <Empty title="Your salary details aren’t set up yet" description="HR will add your salary structure. It will appear here as soon as they do." />
      ) : (
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Monthly gross</p>
              <p className="numeral text-3xl font-semibold text-gray-900">{inr(st.gross)}</p>
              <p className="text-xs text-gray-500">{inr(payout.annual.gross)} a year</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Expected take-home</p>
              <p className="numeral text-2xl font-semibold text-green-700">{inr(payout.estimated_take_home)}</p>
              <p className="text-xs text-gray-500">with full attendance</p>
            </div>
          </div>

          <div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              {PARTS.map((p) => st[p.key] > 0 && <div key={p.key} className={p.bar} style={{ width: `${(st[p.key] / st.gross) * 100}%` }} title={p.label} />)}
            </div>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {PARTS.filter((p) => st[p.key] > 0).map((p) => (
                  <tr key={p.key}>
                    <td className="py-1.5"><span className="flex items-center gap-2 text-gray-700"><span className={cx('h-2.5 w-2.5 rounded-full', p.bar)} />{p.label}</span></td>
                    <td className="numeral py-1.5 text-right font-medium text-gray-900">{inr(st[p.key])}</td>
                    <td className="numeral w-14 py-1.5 text-right text-xs text-gray-400">{((st[p.key] / st.gross) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Deductions that apply to you</p>
            {payout.deductions.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-500">No fixed deductions are set up for you right now.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
                {payout.deductions.map((d) => (
                  <li key={d.key} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span><span className="font-medium text-gray-800">{d.label}</span><span className="block text-xs text-gray-500">{d.detail}</span></span>
                    <span className="numeral font-medium text-red-700">−{inr(d.monthly)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Days you’re absent without approved leave are deducted too (Loss of Pay): one day costs your monthly gross ÷ {LOP_TEXT[payout.lop_basis] || 'the days in the month'}.
              Salary advance instalments are taken on top.
            </p>
          </div>

          {latest && (
            <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-sm">
              <span className="text-primary-800">Last payslip · <b>{latest.month_label}</b></span>
              <span className="flex items-center gap-2"><span className="numeral font-semibold text-primary-900">{inr2(latest.net)}</span><PayStatusBadge status={latest.pay_status} /></span>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Salary status banner: is my latest salary initiated, credited, or on hold (and why)?
 * ------------------------------------------------------------------ */
const SALARY_BANNER = {
  paid: { icon: CheckCircle2, tile: 'bg-green-100 text-green-700', card: 'border-green-200 bg-green-50/60' },
  initiated: { icon: Send, tile: 'bg-primary-100 text-primary-700', card: 'border-primary-200 bg-primary-50/60' },
  on_hold: { icon: PauseCircle, tile: 'bg-yellow-100 text-yellow-700', card: 'border-yellow-200 bg-yellow-50/70' },
}

const SalaryBanner = ({ slip }) => {
  const look = SALARY_BANNER[slip.pay_status]
  const Icon = look.icon
  const title = {
    paid: `Your ${slip.month_label} salary has been credited`,
    initiated: `Your ${slip.month_label} salary has been initiated`,
    on_hold: `Your ${slip.month_label} salary is on hold`,
  }[slip.pay_status]

  return (
    <Card className={cx('flex flex-wrap items-start gap-4 p-5', look.card)}>
      <span className={cx('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', look.tile)}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {slip.pay_status === 'paid' && <p className="mt-0.5 text-sm text-gray-600">{inr2(slip.net)} was credited{slip.paid_at ? ` on ${fmt(slip.paid_at)}` : ''}.</p>}
        {slip.pay_status === 'initiated' && <p className="mt-0.5 text-sm text-gray-600">Payment of {inr2(slip.net)} was initiated{slip.initiated_at ? ` on ${fmt(slip.initiated_at)}` : ''}. It should reach your account shortly.</p>}
        {slip.pay_status === 'on_hold' && (
          <>
            <p className="mt-0.5 text-sm text-gray-600">Your salary of {inr2(slip.net)} has been held back{slip.held_at ? ` since ${fmt(slip.held_at)}` : ''}. Please contact HR if you have questions.</p>
            {slip.hold_reason && (
              <p className="mt-2.5 rounded-lg border border-yellow-200 bg-white/80 px-3 py-2 text-sm text-gray-800"><b className="text-yellow-800">Reason from HR:</b> {slip.hold_reason}</p>
            )}
          </>
        )}
      </div>
      <span className="numeral text-xl font-semibold text-gray-900">{inr2(slip.net)}</span>
    </Card>
  )
}

// Every salary HR is holding stays visible until it is released, however many months later; beside that,
// the newest salary that has been initiated or credited. Nothing shows for a salary that is merely pending.
export const SalaryStatusBanner = ({ payout, loading }) => {
  const slips = payout?.payslips || []
  const held = slips.filter((s) => s.pay_status === 'on_hold')
  const latest = slips.find((s) => s.pay_status === 'initiated' || s.pay_status === 'paid')
  const shown = latest ? [...held, latest] : held
  if (loading || shown.length === 0) return null
  return <div className="space-y-3">{shown.map((s) => <SalaryBanner key={s.month} slip={s} />)}</div>
}

/* ------------------------------------------------------------------ *
 * Payslips
 * ------------------------------------------------------------------ */
export const PayslipsCard = ({ payout, loading, onRequest }) => {
  const [busy, setBusy] = useState(null)
  const slips = payout?.payslips || []
  const download = async (month) => {
    setBusy(month)
    try { await downloadMyPayslip(month); toast.success('Payslip downloaded') } catch (e) { toast.error(errorText(e, 'Could not download the payslip')) } finally { setBusy(null) }
  }
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader icon={FileText} title="Payslips" subtitle="Download any month as a PDF" />
      {loading ? <Skel /> : slips.length === 0 ? (
        <Empty title="No payslips yet" description="A payslip appears here once HR finalizes payroll for a month or sends you one." className="!py-8" />
      ) : (
        <ul className="divide-y divide-gray-100 px-5 pt-3">
          {slips.slice(0, 6).map((s) => (
            <li key={s.month} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-sm font-medium text-gray-900">{s.month_label}</span>
                <span className="numeral text-xs text-gray-500">Net {inr2(s.net)} · {s.pay_status === 'pending' ? 'Processing' : payStatusMeta(s.pay_status).label}</span>
                {s.pay_status === 'on_hold' && s.hold_reason && (
                  <span className="mt-0.5 block max-w-[15rem] text-xs text-yellow-800">On hold: {s.hold_reason}</span>
                )}
              </span>
              <Button size="sm" variant="secondary" icon={Download} loading={busy === s.month} onClick={() => download(s.month)}>PDF</Button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto px-5 pb-5 pt-3">
        <p className="mb-3 text-xs text-gray-500">Only months HR has finalized or sent you appear here. Need an older or missing one? Ask HR below.</p>
        <Button variant="secondary" className="w-full" onClick={onRequest}>Request a payslip</Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Salary advance
 * ------------------------------------------------------------------ */
export const AdvanceCard = ({ advances = [], loading, onRequest }) => (
  <Card className="flex flex-col overflow-hidden">
    <CardHeader icon={Wallet} title="Salary advance" action={<MoreLink to="/my-salary-advance">History</MoreLink>} />
    {loading ? <Skel /> : (
      <CardBody className="flex-1">
        {advances.length === 0 ? <p className="text-sm text-gray-500">You haven’t taken an advance.</p> : (
          <ul className="divide-y divide-gray-100">
            {advances.slice(0, 3).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  <span className="numeral block text-sm font-semibold text-gray-900">{inr(a.amount)}</span>
                  <span className="text-xs text-gray-500">
                    {a.repayment_type === 'lump_sum' ? `One deduction in ${a.deduction_month}` : `${a.repayment_months} instalment${a.repayment_months === 1 ? '' : 's'}`} · {fmt(a.created_at)}
                  </span>
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    )}
    <div className="px-5 pb-5"><Button className="w-full" variant="secondary" onClick={onRequest}>Request an advance</Button></div>
  </Card>
)

/* ------------------------------------------------------------------ *
 * Expenses
 * ------------------------------------------------------------------ */
export const ExpenseCard = ({ expensesRes, loading, onAdd }) => {
  const all = (expensesRes?.data || []).flatMap((g) => (g.expenses || []).map((e) => ({ ...e, category_name: g.category_name })))
    .sort((a, b) => String(b.expense_date || b.created_at).localeCompare(String(a.expense_date || a.created_at)))
  const monthKey = format(new Date(), 'yyyy-MM')
  const thisMonth = all.filter((e) => String(e.expense_date || e.created_at).startsWith(monthKey))
  const total = thisMonth.reduce((t, e) => t + Number(e.amount || 0), 0)
  const waiting = all.filter((e) => ['submitted', 'pending'].includes(String(e.status).toLowerCase())).length
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader icon={Receipt} title="Expenses" action={<MoreLink to="/expenses">All expenses</MoreLink>} />
      {loading ? <Skel /> : (
        <CardBody className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 py-2"><p className="numeral text-lg font-semibold text-gray-900">{inr(total)}</p><p className="text-[11px] text-gray-500">claimed this month</p></div>
            <div className="rounded-lg bg-gray-50 py-2"><p className="numeral text-lg font-semibold text-gray-900">{waiting}</p><p className="text-[11px] text-gray-500">awaiting approval</p></div>
          </div>
          {all.length === 0 ? <p className="text-sm text-gray-500">No expenses added yet.</p> : (
            <ul className="divide-y divide-gray-100">
              {all.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0"><span className="block truncate text-sm text-gray-900">{e.description}</span><span className="text-xs text-gray-500">{e.category_name} · {fmt(e.expense_date)}</span></span>
                  <span className="text-right"><span className="numeral block text-sm font-medium text-gray-900">{inr(e.amount)}</span><StatusBadge status={e.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      )}
      <div className="px-5 pb-5"><Button className="w-full" variant="secondary" onClick={onAdd}>Add an expense</Button></div>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Assets assigned
 * ------------------------------------------------------------------ */
export const AssetsCard = ({ assets = [], loading }) => (
  <Card className="overflow-hidden">
    <CardHeader icon={Laptop} title="Assets assigned to me" subtitle={loading ? '' : `${assets.length} item${assets.length === 1 ? '' : 's'} in your custody`} action={<MoreLink to="/my-assets">Manage</MoreLink>} />
    {loading ? <Skel /> : assets.length === 0 ? (
      <Empty icon={Package} title="Nothing assigned" description="Laptops, phones and other company items assigned to you will be listed here." className="!py-8" />
    ) : (
      <ul className="divide-y divide-gray-100 px-5 pb-3 pt-2">
        {assets.slice(0, 5).map((a) => (
          <li key={a.assignment_id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900">{a.asset_name}</span>
              <span className="text-xs text-gray-500">{[a.category, [a.brand, a.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}{a.serial_number ? ` · S/N ${String(a.serial_number).replace(/^\s*S\/?N[:\s.-]*/i, '')}` : ''}</span>
            </span>
            <span className="shrink-0 text-right text-xs text-gray-500">
              <span className="block font-mono">{a.asset_tag}</span>since {fmt(a.assigned_date)}
            </span>
          </li>
        ))}
        {assets.length > 5 && <li className="pt-2 text-center text-xs text-gray-500">+ {assets.length - 5} more</li>}
      </ul>
    )}
  </Card>
)

/* ------------------------------------------------------------------ *
 * My requests to HR (payslip / offer letter)
 * ------------------------------------------------------------------ */
export const RequestsCard = ({ requests = [], loading, onRequest }) => {
  const [busy, setBusy] = useState(null)
  const get = async (r) => {
    setBusy(r.id)
    try {
      if (r.has_document) await downloadRequestDocument(r.id, r.document_name)
      else await downloadMyPayslip(r.period)
    } catch (e) { toast.error((await blobErrorMessage(e)) || errorText(e, 'Could not download the document')) } finally { setBusy(null) }
  }
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader icon={Inbox} title="Requests to HR" subtitle="Payslips and letters" action={<MoreLink to="/my-documents">View all</MoreLink>} />
      {loading ? <Skel /> : requests.length === 0 ? (
        <Empty title="No requests yet" description="Ask HR for your offer letter or an older payslip." className="!py-8" />
      ) : (
        <ul className="divide-y divide-gray-100 px-5 pt-2">
          {requests.slice(0, 5).map((r) => (
            <li key={r.id} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-900">{r.type_label}{r.period_label ? ` · ${r.period_label}` : ''}</span>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-0.5 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>Sent {fmt(r.created_at)}{r.status === 'rejected' && r.hr_remarks ? ` · “${r.hr_remarks}”` : ''}</span>
                {r.status === 'fulfilled' && (r.has_document || r.payslip_ready) && (
                  <button onClick={() => get(r)} disabled={busy === r.id} className="inline-flex shrink-0 items-center gap-1 font-medium text-primary-700 hover:underline disabled:opacity-50"><Download className="h-3.5 w-3.5" />Download</button>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2 px-5 pb-5 pt-3">
        <Button variant="secondary" size="sm" onClick={() => onRequest('offer_letter')}>Offer letter</Button>
        <Button variant="secondary" size="sm" onClick={() => onRequest('payslip')}>Payslip</Button>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Resignation
 * ------------------------------------------------------------------ */
export const ResignationCard = ({ resignations = [], loading, onResign }) => {
  const withdraw = useWithdrawResignation()
  const current = resignations.find((r) => ['pending', 'approved'].includes(r.status))
  const lastRejected = !current && resignations.find((r) => r.status === 'rejected')
  const onWithdraw = async () => {
    if (!window.confirm('Withdraw your resignation?')) return
    try { await withdraw.mutateAsync(current.id); toast.success('Resignation withdrawn') } catch (e) { toast.error(errorText(e, 'Could not withdraw')) }
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader icon={UserMinus} title="Resignation" action={<MoreLink to="/resignation">Details</MoreLink>} />
      {loading ? <Skel /> : (
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          {current ? (
            <>
              <div className="text-sm">
                <p className="flex items-center gap-2 font-medium text-gray-900">
                  Your resignation is <StatusBadge status={current.status} />
                </p>
                <p className="mt-1 text-gray-500">Submitted {fmt(current.resignation_date)} · last working day <b className="text-gray-700">{fmt(current.last_working_day)}</b></p>
                {current.hr_remarks && <p className="mt-1 text-xs text-gray-500">HR: “{current.hr_remarks}”</p>}
              </div>
              {current.status === 'pending' && <Button variant="secondary" onClick={onWithdraw} loading={withdraw.isPending}>Withdraw</Button>}
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500">
                {lastRejected ? <>Your last request was rejected{lastRejected.hr_remarks ? <> — “{lastRejected.hr_remarks}”</> : null}.</> : 'Thinking of moving on? You can submit your resignation here and track it.'}
              </div>
              <Button variant="secondary" onClick={onResign} className="!border-red-200 !text-red-700 hover:!bg-red-50">Submit resignation</Button>
            </>
          )}
        </CardBody>
      )}
    </Card>
  )
}
