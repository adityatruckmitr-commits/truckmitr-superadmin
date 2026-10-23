import PageJump from '../../../components/PageJump';
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Eye, Search } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { Avatar, Badge, Card, Empty, SkeletonRows, cx } from '../ui'
import { inr } from './format'
import { PayStatusBadge } from './PayStatus'

const PAGE_SIZE = 10

// Wraps a value for CSV: quotes and commas inside a name must not break the row.
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const useEmployeeFilter = (rows) => {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [page, setPage] = useState(1)

  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.department_name).filter(Boolean))].sort(),
    [rows]
  )
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (dept === 'All' || r.department_name === dept) &&
        (!q || (r.full_name || '').toLowerCase().includes(q) || (r.employee_id || '').toLowerCase().includes(q))
    )
  }, [rows, search, dept])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)

  return {
    search, dept, departments, filtered, pages, page: safePage,
    visible: filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    setSearch: (v) => { setSearch(v); setPage(1) },
    setDept: (v) => { setDept(v); setPage(1) },
    setPage,
  }
}

export const FilterBar = ({ f, children }) => (
  <div className="flex flex-wrap items-center gap-2.5">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      <input
        value={f.search}
        onChange={(e) => f.setSearch(e.target.value)}
        placeholder="Search employee or ID…"
        className="field-input !w-56 !py-1.5 !pl-8 text-xs"
      />
    </div>
    <select value={f.dept} onChange={(e) => f.setDept(e.target.value)} className="field-input !w-auto !py-1.5 text-xs">
      <option value="All">All Departments</option>
      {f.departments.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
    {children}
  </div>
)

export const Pagination = ({ f }) => (
  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
    <span>
      Showing <b className="text-gray-800">{f.filtered.length ? (f.page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(f.page * PAGE_SIZE, f.filtered.length)}</b> of {f.filtered.length} employees
    </span>
    <div className="flex items-center gap-1">
      <button onClick={() => f.setPage(Math.max(1, f.page - 1))} disabled={f.page === 1}
        className="h-7 w-7 rounded-sm border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">‹</button>
      <span className="px-2 font-medium text-gray-700">{f.page} / {f.pages}</span>
      <button onClick={() => f.setPage(Math.min(f.pages, f.page + 1))} disabled={f.page === f.pages}
        className="h-7 w-7 rounded-sm border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">›</button>
        <PageJump page={f.page} totalPages={f.pages} onGo={f.setPage} />
    </div>
  </div>
)

export const EmployeeCell = ({ row }) => (
  <div className="flex items-center gap-2.5">
    <Avatar name={row.full_name} src={row.photo_path} size="xs" />
    <div className="min-w-0">
      <p className="truncate font-semibold text-gray-900">{row.full_name}</p>
      <p className="font-mono text-[11px] text-gray-500">{row.employee_id}</p>
    </div>
  </div>
)

export const th = 'px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap'

// `bar` + `sel` are the "salary initiated / credited" selection flow: a submit bar above the table and a
// checkbox in front of every employee. Both are null when HR isn't in that flow.
const OverviewTab = ({ rows, loading, frozen, startDate, endDate, onOpenSlip, onSetPay, paying, bar, sel }) => {
  const f = useEmployeeFilter(rows)

  const exportCsv = () => {
    if (!rows.length) return toast.error('No payroll data to export')
    const head = ['Employee ID', 'Name', 'Department', 'Designation', 'Gross', 'Loss of Pay', 'PF', 'ESI', 'Professional Tax',
      'TDS', 'Medical', 'Manual Deductions', 'Advances', 'Total Deductions', 'Bonus + Reimbursements', 'Net Pay',
      'Present', 'WFH', 'Absent', 'Unpaid Days', 'Pay Status']
    const body = f.filtered.map((r) => [
      r.employee_id, r.full_name, r.department_name, r.designation, r.gross, r.deductions.lop, r.deductions.pf, r.deductions.esi,
      r.deductions.professional_tax, r.deductions.tds, r.deductions.medical, r.deductions.manual, r.deductions.loans,
      r.total_deductions, r.total_additions, r.net_payable, r.attendance.present_days, r.attendance.wfh_days,
      r.attendance.absent_days, r.attendance.unpaid_days, frozen ? r.pay_status : 'draft',
    ])
    const csv = [head, ...body].map((row) => row.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll_${startDate}_to_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Payroll exported')
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-900">Payroll Summary</h2>
        <FilterBar f={f}>
          <button onClick={exportCsv} className="btn-secondary btn-sm"><Download className="h-3.5 w-3.5" /> Export</button>
        </FilterBar>
      </div>

      {bar}

      {loading ? (
        <div className="p-5"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-medium text-gray-700">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {sel && (
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox" aria-label="Select all employees" className="h-4 w-4 rounded-sm border-gray-300 text-primary-700"
                      checked={sel.eligible.length > 0 && sel.chosen.length === sel.eligible.length}
                      onChange={() => (sel.chosen.length === sel.eligible.length ? sel.clearAll() : sel.selectAll())}
                    />
                  </th>
                )}
                <th className={th}>Employee</th>
                <th className={th}>Department</th>
                <th className={cx(th, 'text-right')}>Gross Pay</th>
                <th className={cx(th, 'text-right')}>PF</th>
                <th className={cx(th, 'text-right')}>Deductions</th>
                <th className={cx(th, 'text-right')}>Net Pay</th>
                <th className={cx(th, 'text-center')}>Status</th>
                <th className={cx(th, 'text-center')}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {f.visible.map((r) => (
                <tr key={r.employee_id} className="whitespace-nowrap transition-colors hover:bg-gray-50/80">
                  {sel && (
                    <td className="px-3.5 py-3">
                      {sel.isEligible(r.employee_id) ? (
                        <input
                          type="checkbox" className="h-4 w-4 rounded-sm border-gray-300 text-primary-700"
                          checked={sel.isSelected(r.employee_id)} onChange={() => sel.toggle(r.employee_id)}
                          aria-label={`Select ${r.full_name}`}
                        />
                      ) : (
                        <input
                          type="checkbox" disabled checked className="h-4 w-4 rounded-sm border-gray-300 text-gray-400 opacity-50"
                          title={r.pay_status === 'paid' ? 'Already credited' : 'Already initiated'} aria-label={`${r.full_name} is already done`}
                        />
                      )}
                    </td>
                  )}
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <EmployeeCell row={r} />
                      {r.is_active === false && <Badge tone="neutral">Inactive</Badge>}
                      {r.warnings?.length > 0 && (
                        <span title={r.warnings.join('\n')} className="text-yellow-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-gray-600">{r.department_name || '—'}</td>
                  <td className="numeral px-3.5 py-3 text-right text-gray-900">{inr(r.gross)}</td>
                  <td className="numeral px-3.5 py-3 text-right text-gray-700">{r.deductions.pf > 0 ? inr(r.deductions.pf) : <span className="text-gray-300">—</span>}</td>
                  <td className="numeral px-3.5 py-3 text-right">
                    <span className="text-gray-700">{inr(r.total_deductions)}</span>
                    {r.deductions.lop > 0 && (
                      <span className="block text-[10px] text-red-600">LOP {inr(r.deductions.lop)} · {r.attendance.unpaid_days}d</span>
                    )}
                  </td>
                  <td className="numeral px-3.5 py-3 text-right font-bold text-gray-900">{inr(r.net_payable)}</td>
                  <td className="px-3.5 py-3 text-center">
                    {frozen ? <PayStatusBadge status={r.pay_status} /> : <Badge tone="neutral">Draft</Badge>}
                    {frozen && r.pay_status === 'on_hold' && r.hold_reason && (
                      <span className="mx-auto mt-1 block max-w-[9rem] truncate text-[10px] font-normal text-yellow-700" title={r.hold_reason}>{r.hold_reason}</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onOpenSlip(r)} title="View payslip"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-primary-50 hover:text-primary-700">
                        <Eye className="h-4 w-4" />
                      </button>
                      {frozen && r.pay_status !== 'paid' && (
                        <button onClick={() => onSetPay(r.employee_id, 'paid')} disabled={paying} title="Mark as paid"
                          className="rounded-md p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-50">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {f.filtered.length === 0 && (
            <Empty title="No employees found" description="Nothing matches these filters for the selected month." />
          )}
        </div>
      )}
      <Pagination f={f} />
    </Card>
  )
}

export default OverviewTab
