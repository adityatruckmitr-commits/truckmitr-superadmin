import { useState } from 'react'
import { AlertTriangle, ChevronDown, Download, Lock } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { Badge, Button, Skeleton, StatusPill, cx } from '../ui'
import { useEmployeePayroll } from '../../hooks/usePayroll'
import { attendanceLabels, attendanceTone, inr2 } from './format'
import { downloadPayslipPdf } from './payslipPdf'

const Stat = ({ label, value, tone = 'text-gray-900' }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
    <p className={cx('numeral mt-1 text-xl font-semibold', tone)}>{value}</p>
  </div>
)

const Chip = ({ label, value, bad }) => (
  <div className={cx('rounded-lg border px-3 py-2 text-center', bad && value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white')}>
    <p className={cx('numeral text-lg font-semibold', bad && value > 0 ? 'text-red-700' : 'text-gray-900')}>{value}</p>
    <p className="text-[11px] text-gray-500">{label}</p>
  </div>
)

const PayslipModal = ({ open, onClose, employee, startDate, endDate }) => {
  const [showDays, setShowDays] = useState(false)
  const { data, isLoading, isError } = useEmployeePayroll(open ? employee?.employee_id : null, startDate, endDate, {
    withDays: true,
  })
  const slip = data?.payslip
  const a = slip?.attendance

  const handleDownload = async () => {
    try {
      await downloadPayslipPdf(slip, { startDate, endDate })
      toast.success(`Salary slip downloaded for ${slip.full_name}`)
    } catch (e) {
      console.error(e)
      toast.error('Could not generate the salary slip')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={employee?.full_name || 'Payslip'}
      subtitle={
        employee
          ? [employee.employee_id, employee.designation, employee.department_name].filter(Boolean).join(' • ')
          : ''
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button icon={Download} onClick={handleDownload} disabled={!slip}>Download salary slip</Button>
        </>
      }
    >
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {isError && <p className="py-8 text-center text-sm text-red-600">Could not load this payslip.</p>}

      {slip && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {slip.frozen ? (
              <>
                <Badge tone="info" icon={Lock}>Finalized</Badge>
                <StatusPill status={slip.pay_status} />
              </>
            ) : !slip.issued && (
              <Badge tone="warning">Draft — figures are live until the month is finalized</Badge>
            )}
            {slip.issued && (
              <>
                <Badge tone="success">Sent to employee{slip.issued.edited ? ' · edited by HR' : ''}</Badge>
                {!slip.frozen && <StatusPill status={slip.pay_status} />}
                {slip.issued.edited && <span className="text-xs text-gray-500">Calculated net was {inr2(slip.issued.computed_net)}</span>}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Gross pay" value={inr2(slip.gross)} />
            <Stat label="Deductions" value={`−${inr2(slip.total_deductions)}`} tone="text-red-700" />
            <Stat label="Net pay" value={inr2(slip.net_payable)} tone="text-green-700" />
          </div>

          {slip.warnings?.length > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-yellow-800">
                <AlertTriangle className="h-4 w-4" /> Needs attention
              </p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-yellow-800">
                {slip.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}

          <section>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">Attendance this period</h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              <Chip label="Present" value={a.present_days} />
              <Chip label="WFH" value={a.wfh_days} />
              <Chip label="Paid leave" value={a.leave_days} />
              <Chip label="Holidays" value={a.holiday_days} />
              <Chip label="Week-offs" value={a.week_off_days} />
              <Chip label="Absent" value={a.absent_days} bad />
              <Chip label="Unpaid days" value={a.unpaid_days} bad />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Per-day salary {inr2(slip.per_day_salary)}. Unpaid days = absent
              {a.unpaid_leave_days ? ' + unpaid leave' : ''}
              {a.week_off_unpaid_days ? ' + sandwiched week-offs' : ''}
              {a.holiday_unpaid_days ? ' + sandwiched holidays' : ''}
              {a.upcoming_unpaid_days ? ' + upcoming days' : ''}
              {a.not_joined_days ? ' + days before joining' : ''}.
              {a.projected_days > 0 && ` ${a.projected_days} upcoming day(s) haven't happened yet and are not paid for in this estimate.`}
              {a.upcoming_unpaid_days > 0 && ` ${a.upcoming_unpaid_days} upcoming day(s) are not credited: no attendance so far this period.`}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Earnings</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="pb-1.5 text-left font-semibold">Component</th>
                    <th className="pb-1.5 text-right font-semibold">Monthly</th>
                    <th className="pb-1.5 text-right font-semibold">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slip.lines.earnings.map((e) => (
                    <tr key={e.key}>
                      <td className="py-1.5 text-gray-700">{e.label}</td>
                      <td className="numeral py-1.5 text-right text-gray-500">{inr2(e.full)}</td>
                      <td className="numeral py-1.5 text-right font-medium text-gray-900">{inr2(e.amount)}</td>
                    </tr>
                  ))}
                  {slip.lines.additions.map((e, i) => (
                    <tr key={`${e.key}-${i}`}>
                      <td className="py-1.5 text-gray-700">{e.label} <Badge tone="success" className="ml-1 capitalize">{e.key}</Badge></td>
                      <td />
                      <td className="numeral whitespace-nowrap py-1.5 text-right font-medium text-green-700">+{inr2(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200">
                    <td className="pt-2 font-semibold text-gray-900">Gross pay</td>
                    <td className="numeral pt-2 text-right text-gray-500">{inr2(slip.structure.gross)}</td>
                    <td className="numeral pt-2 text-right font-semibold text-gray-900">{inr2(slip.earned_gross)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Deductions</h4>
              {slip.lines.deductions.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">No deductions this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {slip.lines.deductions.map((d, i) => (
                      <tr key={`${d.key}-${i}`}>
                        <td className="py-1.5 pr-3 text-gray-700">{d.label}</td>
                        <td className="numeral whitespace-nowrap py-1.5 text-right font-medium text-red-700">−{inr2(d.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200">
                      <td className="pt-2 font-semibold text-gray-900">Total deductions</td>
                      <td className="numeral whitespace-nowrap pt-2 text-right font-semibold text-red-700">−{inr2(slip.total_deductions)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary-800 px-4 py-3 text-white">
                <span className="text-sm font-medium">Net pay</span>
                <span className="numeral text-xl font-semibold">{inr2(slip.net_payable)}</span>
              </div>
            </section>
          </div>

          {data.attendance_records?.length > 0 && (
            <section>
              <button
                onClick={() => setShowDays((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900"
              >
                <ChevronDown className={cx('h-4 w-4 transition-transform', showDays && 'rotate-180')} />
                Day-by-day attendance ({data.attendance_records.length} days)
              </button>
              {showDays && (
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Day</th>
                        <th className="px-3 py-2 text-left font-semibold">In</th>
                        <th className="px-3 py-2 text-left font-semibold">Out</th>
                        <th className="px-3 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.attendance_records.map((r) => (
                        <tr key={r.date}>
                          <td className="px-3 py-1.5 text-gray-900">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                          <td className="px-3 py-1.5 text-gray-500">{r.day}</td>
                          <td className="px-3 py-1.5 text-gray-500">{r.checkin_time || '—'}</td>
                          <td className="px-3 py-1.5 text-gray-500">{r.checkout_time || '—'}</td>
                          <td className="px-3 py-1.5">
                            <Badge tone={attendanceTone(r.attendance_status)}>
                              {attendanceLabels[r.attendance_status] || r.attendance_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </Modal>
  )
}

export default PayslipModal
