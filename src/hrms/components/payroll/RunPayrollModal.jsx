import { AlertTriangle, Lock } from 'lucide-react-teleadmin'
import Modal from './Modal'
import { Button } from '../ui'
import { inr, monthLabel } from './format'

// Confirmation for "Run Payroll": shows exactly what gets locked, and refuses the risky cases.
const RunPayrollModal = ({ open, onClose, month, summary, monthEnded, onConfirm, loading }) => {
  const noAttendance = summary && summary.employees > 0 && summary.no_attendance_count === summary.employees
  const someMissing = summary && !noAttendance && summary.no_attendance_count > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Run payroll for ${monthLabel(month)}`}
      subtitle="This locks the month’s figures into payslips."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button icon={Lock} onClick={onConfirm} loading={loading} disabled={!monthEnded || noAttendance}>
            Finalize payroll
          </Button>
        </>
      }
    >
      {summary && (
        <div className="space-y-4">
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
            {[
              ['Employees', summary.employees],
              ['Gross pay', inr(summary.total_gross)],
              ['Additions (bonus, reimbursements)', `+${inr(summary.total_additions)}`],
              ['Deductions', `−${inr(summary.total_deductions)}`],
              ['Net payable', inr(summary.total_net)],
            ].map(([k, v], i, all) => (
              <div key={k} className={`flex justify-between px-4 py-2.5 ${i === all.length - 1 ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-600'}`}>
                <dt>{k}</dt>
                <dd className="numeral">{v}</dd>
              </div>
            ))}
          </dl>

          {!monthEnded && (
            <p className="flex items-start gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              This month hasn’t finished yet. Payroll can be finalized once the last day has been reached.
            </p>
          )}
          {noAttendance && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              No approved attendance exists for this month, so everyone would be marked absent. Upload and approve attendance first.
            </p>
          )}
          {someMissing && (
            <p className="flex items-start gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {summary.no_attendance_count} employee(s) have no attendance records and will be charged Loss of Pay for the whole month.
            </p>
          )}
          {summary.with_warnings > 0 && (
            <p className="text-xs text-gray-500">{summary.with_warnings} payslip(s) carry warnings — review them in the table before finalizing.</p>
          )}
          <p className="text-xs text-gray-500">
            After this, changes to salary or rules won’t alter {monthLabel(month)}. You can reopen the month if something needs fixing.
          </p>
        </div>
      )}
    </Modal>
  )
}

export default RunPayrollModal
