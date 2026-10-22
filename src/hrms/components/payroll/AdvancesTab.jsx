import { Info } from 'lucide-react-teleadmin'
import { Badge, Card, Empty, SkeletonRows, cx } from '../ui'
import { useLoanDeductions } from '../../hooks/usePayroll'
import { inr2, monthLabel } from './format'
import { th } from './OverviewTab'

// Read-only: advances are approved elsewhere; this shows what payroll will take this month.
const AdvancesTab = ({ month }) => {
  const { data, isLoading } = useLoanDeductions(month)
  const items = data?.items || []

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Salary advance installments · {monthLabel(month)}</h2>
          <p className="mt-0.5 max-w-2xl text-xs text-gray-500">
            Approved and disbursed salary advances whose installment falls due this month.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Deducted this month</p>
          <p className="numeral text-lg font-semibold text-gray-900">{inr2(data?.total || 0)}</p>
        </div>
      </div>

      {data && !data.auto_deduct && (
        <div className="flex items-center gap-2 border-b border-gray-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <Info className="h-4 w-4 shrink-0" />
          Automatic deduction is switched off in Deductions → organisation defaults, so these are listed but not taken from salary.
        </div>
      )}

      {isLoading ? (
        <div className="p-5"><SkeletonRows rows={3} /></div>
      ) : items.length === 0 ? (
        <Empty title="Nothing falls due this month" description="No approved salary-advance recovery is scheduled for this month." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium text-gray-700">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className={th}>Employee</th>
                <th className={th}>Department</th>
                <th className={th}>Installment</th>
                <th className={cx(th, 'text-right')}>Amount</th>
                <th className={cx(th, 'text-center')}>Deducted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => (
                <tr key={`${i.reference}-${i.employee_id}`} className="whitespace-nowrap hover:bg-gray-50/80">
                  <td className="px-3.5 py-3">
                    <p className="font-semibold text-gray-900">{i.full_name}</p>
                    <p className="font-mono text-[11px] text-gray-500">{i.employee_id}</p>
                  </td>
                  <td className="px-3.5 py-3 text-gray-600">{i.department_name || '—'}</td>
                  <td className="px-3.5 py-3 text-gray-600">{i.label} <span className="font-mono text-[11px] text-gray-400">{i.reference}</span></td>
                  <td className="numeral px-3.5 py-3 text-right font-semibold text-red-700">−{inr2(i.amount)}</td>
                  <td className="px-3.5 py-3 text-center"><Badge tone={i.deducted ? 'success' : 'neutral'}>{i.deducted ? 'Yes' : 'No'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default AdvancesTab
