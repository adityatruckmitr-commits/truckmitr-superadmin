import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Banknote, CheckCircle2, IndianRupee, Lock, Send, Unlock, TrendingDown, Users, Wallet, XCircle, ShieldCheck } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Badge, Button, Card, Empty, Segmented, Skeleton, StatTile, cx } from '../components/ui'
import { usePayslipApprovals, usePayslipManagerDecision, usePayslipCeoDecision } from '../hooks/usePayroll'
import OverviewTab from '../components/payroll/OverviewTab'
import SalaryDetailsTab from '../components/payroll/SalaryDetailsTab'
import DeductionsTab from '../components/payroll/DeductionsTab'
import AdjustmentsPanel from '../components/payroll/AdjustmentsPanel'
import AdvancesTab from '../components/payroll/AdvancesTab'
import PayslipModal from '../components/payroll/PayslipModal'
import RunPayrollModal from '../components/payroll/RunPayrollModal'
import PfSwitch from '../components/payroll/PfSwitch'
import { DisburseBar, DisburseConfirmModal, DISBURSE, canDisburse, useDisburseSelection } from '../components/payroll/DisburseFlow'
import { inr, monthKeyOf, monthLabel, monthRange } from '../components/payroll/format'
import {
  apiError, usePayroll, usePayrollRuns, usePayrollStructures, usePayStatus, useReopenPayroll, useRunPayroll,
} from '../hooks/usePayroll'

const TABS = [
  { id: 'overview', label: 'Payroll Overview' },
  { id: 'salary', label: 'Salary Details' },
  { id: 'reimbursements', label: 'Reimbursements' },
  { id: 'bonus', label: 'Bonus' },
  { id: 'incentive', label: 'Incentive' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'loans', label: 'Advances' },
]

const DEDUCTION_LABELS = {
  lop: 'Loss of Pay (attendance)',
  pf: 'Provident Fund',
  esi: 'ESI',
  professional_tax: 'Professional tax',
  tds: 'TDS',
  medical: 'Medical / insurance',
  manual: 'One-off deductions',
  loans: 'Salary advances',
}

// This reviewer's (manager or CEO/Management) payslip approval queue - separate from the
// disbursement flow below, which is gated on approval_status being 'approved' server-side.
const PayslipApprovalsTab = ({ stage, month }) => {
  const { data, isLoading } = usePayslipApprovals(stage)
  const managerDecision = usePayslipManagerDecision()
  const ceoDecision = usePayslipCeoDecision()
  const decide = stage === 'manager' ? managerDecision : ceoDecision

  const act = async (id, decision) => {
    const toastId = toast.loading('Saving decision...')
    try {
      await decide.mutateAsync({ id, decision })
      toast.success(decision === 'approved' ? 'Approved' : 'Rejected', { id: toastId })
    } catch (e) {
      toast.error(apiError(e), { id: toastId })
    }
  }

  const rows = (data || []).filter((p) => !month || p.month === month)

  if (isLoading) return <Card className="p-5"><Skeleton className="h-32 w-full" /></Card>
  if (rows.length === 0) {
    return <Card><Empty icon={ShieldCheck} title="Nothing pending" description="Payslips awaiting your approval will show up here." /></Card>
  }

  return (
    <Card className="divide-y divide-gray-100">
      {rows.map((p) => (
        <div key={p.id} data-hl={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.employee_name}</p>
            <p className="text-xs text-gray-500">{monthLabel(p.month)} · Net {inr(p.net)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={XCircle} loading={decide.isPending} onClick={() => act(p.id, 'rejected')}>Reject</Button>
            <Button size="sm" icon={CheckCircle2} loading={decide.isPending} onClick={() => act(p.id, 'approved')}>Approve</Button>
          </div>
        </div>
      ))}
    </Card>
  )
}

const Banner = ({ tone, icon: Icon, children, action }) => (
  <div className={cx(
    'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm',
    tone === 'danger' && 'border-red-200 bg-red-50 text-red-800',
    tone === 'warning' && 'border-yellow-200 bg-yellow-50 text-yellow-800',
    tone === 'info' && 'border-primary-200 bg-primary-50 text-primary-800',
    tone === 'success' && 'border-green-200 bg-green-50 text-green-800'
  )}>
    <span className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0" />{children}</span>
    {action}
  </div>
)

const Payroll = () => {
  const { user } = useAuth()
  const approvalStage = user?.role === 'manager' ? 'manager' : ['ceo', 'super_admin'].includes(user?.role) ? 'ceo' : null
  const [month, setMonth] = useState(monthKeyOf())
  const monthTouched = useRef(false)
  // A manager can't see the full payroll run/disbursement data (HR/CEO only) - land them straight
  // on their own approval queue instead of a page full of empty, 403'd widgets.
  const [tab, setTab] = useState(approvalStage === 'manager' ? 'approvals' : 'overview')
  const [slipRow, setSlipRow] = useState(null)
  const [runOpen, setRunOpen] = useState(false)

  // "Active" keeps resigned / inactive employees out of the list, the totals and every salary action taken from it.
  const [activeOnly, setActiveOnly] = useState(true)

  const range = useMemo(() => monthRange(month), [month])
  const { data, isLoading } = usePayroll({ ...range, active: activeOnly })
  const { data: structures, isLoading: structuresLoading } = usePayrollStructures()
  const { data: runsData } = usePayrollRuns()
  const runPayroll = useRunPayroll()
  const reopen = useReopenPayroll()
  const payStatus = usePayStatus()

  // Open on the latest month that actually has attendance, unless the user has picked one.
  useEffect(() => {
    if (monthTouched.current || !runsData) return
    const current = monthKeyOf()
    const latest = runsData.attendanceMonths.find((m) => m <= current)
    if (latest) setMonth(latest)
  }, [runsData])

  // "Salary initiated / credited": which one HR is doing (null = neither), and the submit confirmation.
  const [payMode, setPayMode] = useState(null)
  const [payConfirm, setPayConfirm] = useState(false)

  const changeMonth = (value) => {
    if (!value) return
    monthTouched.current = true
    setMonth(value)
    setPayMode(null)
    setPayConfirm(false)
  }

  const summary = data?.summary
  const rows = data?.employees || []
  const frozen = !!data?.run
  const sel = useDisburseSelection(rows, frozen ? payMode : null)

  // Where this month's salary stands, for the employees in view (the Active / All filter decides who that is).
  const total = summary?.employees || 0
  const credited = summary?.paid_count || 0
  const initiated = summary?.initiated_count || 0
  const allCredited = frozen && total > 0 && credited === total
  const allInitiated = frozen && total > 0 && credited === 0 && initiated === total
  // Initiating is finished once everyone in view is initiated or credited: the button then sits there faded
  // (and is removed altogether once salary is credited).
  const initiateDone = frozen && rows.length > 0 && !rows.some((r) => canDisburse(r, 'initiated'))
  const creditedOn = allCredited
    ? rows.map((r) => r.paid_at).filter(Boolean).sort().pop()
    : null

  const startPay = (mode) => {
    if (!frozen) {
      toast(`Run payroll for ${monthLabel(month)} first — salary can be marked once the month is finalized.`, { icon: 'ℹ️', duration: 5000 })
      return
    }
    // Nothing left to mark: say so, rather than opening an empty "0 of 0 selected" list.
    if (rows.filter((r) => canDisburse(r, mode)).length === 0) {
      toast.success(mode === 'credited'
        ? `Salary for ${monthLabel(month)} is already credited to everyone in this list.`
        : `Everyone in this list already has ${monthLabel(month)} salary initiated or credited.`)
      return
    }
    setPayMode((cur) => (cur === mode ? null : mode))
    setTab('overview')
  }
  const monthEnded = range.end_date <= format(new Date(), 'yyyy-MM-dd')
  const pctOfGross = (v) => (summary?.total_gross > 0 ? `${((v / summary.total_gross) * 100).toFixed(2)}% of Gross Pay` : '—')

  const noAttendanceAll = summary && summary.employees > 0 && summary.no_attendance_count === summary.employees
  const noAttendanceSome = summary && !noAttendanceAll && summary.no_attendance_count > 0

  const onRun = async () => {
    try {
      const res = await runPayroll.mutateAsync({ month })
      toast.success(res.message)
      setRunOpen(false)
    } catch (e) {
      toast.error(apiError(e, 'Could not finalize payroll'))
    }
  }

  const onReopen = async () => {
    if (!window.confirm(`Reopen ${monthLabel(month)}? Figures will go back to live and the frozen payslips are discarded.`)) return
    try {
      await reopen.mutateAsync({ month })
      toast.success('Payroll reopened')
    } catch (e) {
      const body = e?.response?.data
      if (body?.code === 'has_paid' && window.confirm(`${body.message}\n\nReopen anyway?`)) {
        try {
          await reopen.mutateAsync({ month, force: true })
          toast.success('Payroll reopened')
        } catch (err) {
          toast.error(apiError(err))
        }
      } else if (body?.code !== 'has_paid') {
        toast.error(apiError(e))
      }
    }
  }

  const setPay = async (employeeIds, status) => {
    try {
      const res = await payStatus.mutateAsync({ month, status, employeeIds })
      toast.success(res.message)
    } catch (e) {
      toast.error(apiError(e))
    }
  }

  const bd = summary?.breakdown
  const pool = bd ? bd.basic + bd.allowances + bd.other_payments : 0
  const segments = bd && pool > 0 ? [
    { key: 'basic', label: 'Basic Pay', value: bd.basic, bar: 'bg-primary-700', dot: 'bg-primary-700' },
    { key: 'allow', label: 'Allowances', value: bd.allowances, bar: 'bg-green-500', dot: 'bg-green-500' },
    { key: 'other', label: 'Bonus & reimbursements', value: bd.other_payments, bar: 'bg-brass-400', dot: 'bg-brass-400' },
  ] : []
  const deductionRows = Object.entries(summary?.deductions_by_type || {}).filter(([, v]) => v > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-[28px]">Payroll</h1>
          <p className="mt-1 text-xs text-gray-500">Home &gt; Payroll</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="month" value={month} max={monthKeyOf()}
            onChange={(e) => changeMonth(e.target.value)}
            className="field-input !w-auto !py-2 text-sm" aria-label="Payroll month"
          />
          {frozen ? (
            <>
              <Badge tone="info" icon={Lock}>Finalized</Badge>
              {allCredited && <Badge tone="success" icon={CheckCircle2}>{monthLabel(month)} salary credited</Badge>}
              {allInitiated && <Badge tone="info" icon={Send}>{monthLabel(month)} salary initiated</Badge>}
              {!allCredited && !allInitiated && credited > 0 && <Badge tone="warning">{credited} of {total} credited</Badge>}
              {!allCredited && !allInitiated && credited === 0 && initiated > 0 && <Badge tone="warning">{initiated} of {total} initiated</Badge>}
              {/* Once salary is credited there is nothing to initiate: the button is removed altogether. */}
              {!allCredited && (
                <span title={initiateDone ? 'Nothing left to initiate — everyone in this list is already initiated or credited.' : undefined}>
                  <Button variant={payMode === 'initiated' ? 'primary' : 'secondary'} icon={Send} onClick={() => startPay('initiated')}
                    disabled={initiateDone} className="disabled:hover:border-gray-300 disabled:hover:bg-white">{DISBURSE.initiated.button}</Button>
                </span>
              )}
              <Button variant={payMode === 'credited' ? 'primary' : 'secondary'} icon={allCredited ? CheckCircle2 : Banknote} onClick={() => startPay('credited')}
                className={allCredited && payMode !== 'credited' ? '!border-green-200 !bg-green-50 !text-green-800' : undefined}>{DISBURSE.credited.button}</Button>
              <Button variant="secondary" icon={Unlock} onClick={onReopen} loading={reopen.isPending}>Reopen</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" icon={Send} onClick={() => startPay('initiated')} disabled={isLoading}>{DISBURSE.initiated.button}</Button>
              <Button variant="secondary" icon={Banknote} onClick={() => startPay('credited')} disabled={isLoading}>{DISBURSE.credited.button}</Button>
              <Button onClick={() => setRunOpen(true)} disabled={isLoading || rows.length === 0}>Run Payroll →</Button>
            </>
          )}
        </div>
      </div>

      {/* Banners */}
      {allCredited && (
        <Banner tone="success" icon={CheckCircle2}>
          Salary for {monthLabel(month)} has been credited to {total === 1 ? 'the employee' : `all ${total} employees`}
          {creditedOn ? ` (last credited ${format(new Date(creditedOn.replace(' ', 'T')), 'd MMM yyyy')})` : ''}. Figures are frozen.
        </Banner>
      )}
      {frozen && !allCredited && (
        <Banner tone="info" icon={Lock}>
          {monthLabel(month)} is finalized. Figures below are frozen — salary or rule changes won’t alter them.
          {' '}{summary.paid_count} credited · {summary.initiated_count} initiated · {summary.held_count} on hold · {summary.pending_count} pending (of {summary.employees}).
        </Banner>
      )}
      {!frozen && noAttendanceAll && (
        <Banner tone="danger" icon={AlertTriangle}>
          No approved attendance exists for {monthLabel(month)}. Every employee is shown as absent (full Loss of Pay).
          Upload and approve attendance, or pick another month.
        </Banner>
      )}
      {!frozen && noAttendanceSome && (
        <Banner tone="warning" icon={AlertTriangle}>
          {summary.no_attendance_count} employee(s) have no attendance for {monthLabel(month)} and are charged Loss of Pay for the whole month.
        </Banner>
      )}

      {/* Who and what this page covers */}
      <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-700">Employees</span>
          <Segmented
            value={activeOnly ? 'active' : 'all'}
            onChange={(v) => { setActiveOnly(v === 'active'); setPayMode(null); setPayConfirm(false) }}
            options={[
              { value: 'active', label: `Active${data?.counts ? ` (${data.counts.active})` : ''}`, hint: 'Only active employees are listed and receive salary actions' },
              { value: 'all', label: `All${data?.counts ? ` (${data.counts.all})` : ''}`, hint: 'Include inactive / resigned employees too' },
            ]}
          />
          {activeOnly && data?.counts && data.counts.all > data.counts.active && (
            <span className="text-xs text-gray-500">{data.counts.all - data.counts.active} inactive hidden — they get no salary actions.</span>
          )}
        </div>
        <PfSwitch settings={structures?.settings} />
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile index={0} icon={Users} label="Total Employees" value={summary ? summary.employees : '—'} caption={`On payroll · ${monthLabel(month)}`} accent="ink" />
        <StatTile index={1} icon={Wallet} label="Total Gross Pay" value={summary ? inr(summary.total_gross) : '—'}
          caption={summary?.total_additions > 0 ? `+ ${inr(summary.total_additions)} bonus & reimbursements` : monthLabel(month)} accent="green" />
        <StatTile index={2} icon={TrendingDown} label="Total Deductions" value={summary ? inr(summary.total_deductions) : '—'}
          caption={summary ? pctOfGross(summary.total_deductions) : ''} accent="purple" />
        <StatTile index={3} icon={IndianRupee} label="Net Payable" value={summary ? inr(summary.total_net) : '—'}
          caption={summary ? pctOfGross(summary.total_net) : ''} accent="brass" />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Card className="flex gap-1.5 overflow-x-auto px-2.5 py-2">
            {(approvalStage ? [...TABS, { id: 'approvals', label: 'My Approvals' }] : TABS).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors',
                  tab === t.id ? 'bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-100' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {t.label}
              </button>
            ))}
          </Card>

          {tab === 'overview' && (
            <OverviewTab
              rows={rows} loading={isLoading} frozen={frozen}
              startDate={range.start_date} endDate={range.end_date}
              onOpenSlip={setSlipRow} onSetPay={(id, status) => setPay([id], status)} paying={payStatus.isPending}
              sel={frozen && payMode ? sel : null}
              bar={frozen && payMode ? (
                <DisburseBar mode={payMode} sel={sel} onCancel={() => setPayMode(null)} onSubmit={() => setPayConfirm(true)} />
              ) : null}
            />
          )}
          {tab === 'salary' && <SalaryDetailsTab employees={structures?.employees} settings={structures?.settings} loading={structuresLoading} activeOnly={activeOnly} />}
          {tab === 'reimbursements' && <AdjustmentsPanel month={month} type="reimbursement" />}
          {tab === 'bonus' && <AdjustmentsPanel month={month} type="bonus" />}
          {tab === 'incentive' && <AdjustmentsPanel month={month} type="incentive" />}
          {tab === 'deductions' && <DeductionsTab month={month} structures={structures} loading={structuresLoading} activeOnly={activeOnly} />}
          {tab === 'loans' && <AdvancesTab month={month} />}
          {tab === 'approvals' && approvalStage && <PayslipApprovalsTab stage={approvalStage} month={month} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Payroll Breakdown</h3>
            {!summary ? <Skeleton className="h-24 w-full" /> : pool === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No salary data for this month.</p>
            ) : (
              <>
                <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
                  {segments.map((s) => <div key={s.key} className={s.bar} style={{ width: `${(s.value / pool) * 100}%` }} title={s.label} />)}
                </div>
                <ul className="space-y-2 text-xs">
                  {segments.map((s) => (
                    <li key={s.key} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold text-gray-700"><span className={cx('h-2.5 w-2.5 rounded-full', s.dot)} />{s.label}</span>
                      <span className="numeral text-gray-500">{inr(s.value)} ({((s.value / pool) * 100).toFixed(1)}%)</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-gray-900">Deductions by type</h3>
              {summary && <span className="numeral text-sm font-semibold text-red-700">−{inr(summary.total_deductions)}</span>}
            </div>
            {!summary ? <Skeleton className="h-16 w-full" /> : deductionRows.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No deductions this month.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {deductionRows.map(([k, v]) => (
                  <li key={k} className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-600">{DEDUCTION_LABELS[k] || k}</span>
                    <span className="numeral font-semibold text-gray-900">{inr(v)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 p-5 text-xs">
            <h3 className="mb-1 text-sm font-bold text-gray-900">Quick Summary</h3>
            {[
              ['Status', frozen ? (allCredited ? 'Finalized · Salary credited' : 'Finalized') : 'Draft (live)'],
              ['Employees', summary?.employees ?? '—'],
              ['Credited', frozen ? summary.paid_count : '—'],
              ['Initiated', frozen ? summary.initiated_count : '—'],
              ['On hold', frozen ? summary.held_count : '—'],
              ['Pending', frozen ? summary.pending_count : '—'],
              ['Need attention', summary ? summary.with_warnings : '—'],
              ['Pay period', `${format(new Date(range.start_date), 'dd MMM')} – ${format(new Date(range.end_date), 'dd MMM yyyy')}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-400">{k}</span>
                <span className="font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </Card>

          <Card className="space-y-3 p-5 text-xs">
            <h3 className="text-sm font-bold text-gray-900">Recently Run Payrolls</h3>
            {(runsData?.runs || []).length === 0 ? (
              <p className="py-3 text-center text-gray-500">No payroll has been finalized yet.</p>
            ) : (
              runsData.runs.slice(0, 6).map((r) => (
                <button key={r.id} onClick={() => changeMonth(r.month)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/40 p-2.5 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/50">
                  <span>
                    <span className="block font-bold text-gray-900">{monthLabel(r.month)}</span>
                    <span className="block text-[10px] text-gray-400">{r.employees_count} employees · {inr(r.total_net)} net</span>
                  </span>
                  <Badge tone={r.paid_count === r.employees_count ? 'success' : r.held_count > 0 ? 'warning' : 'neutral'}>
                    {r.paid_count === r.employees_count ? 'Credited'
                      : r.held_count > 0 ? `${r.held_count} on hold`
                      : `${r.employees_count - r.paid_count} to credit`}
                  </Badge>
                </button>
              ))
            )}
          </Card>
        </div>
      </div>

      <DisburseConfirmModal
        open={payConfirm} mode={payMode} sel={sel} month={month}
        onClose={() => setPayConfirm(false)} onDone={() => { setPayConfirm(false); setPayMode(null) }}
      />

      <PayslipModal open={!!slipRow} onClose={() => setSlipRow(null)} employee={slipRow}
        startDate={range.start_date} endDate={range.end_date} />
      <RunPayrollModal open={runOpen} onClose={() => setRunOpen(false)} month={month} summary={summary}
        monthEnded={monthEnded} onConfirm={onRun} loading={runPayroll.isPending} />
    </div>
  )
}

export default Payroll
