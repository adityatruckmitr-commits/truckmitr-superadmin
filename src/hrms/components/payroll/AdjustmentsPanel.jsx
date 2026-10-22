import { useState } from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { Badge, Button, Card, Empty, SkeletonRows } from '../ui'
import {
  apiError, useAddAdjustment, useDeleteAdjustment, usePayrollAdjustments, usePayrollStructures,
} from '../../hooks/usePayroll'
import { inr2, monthLabel, num } from './format'

const COPY = {
  bonus: {
    title: 'Performance Bonus',
    blurb: 'Bonuses added here are paid on top of gross in the selected month.',
    placeholder: 'e.g. Diwali bonus',
    empty: 'No bonus entries for this month.',
    tone: 'success',
    sign: '+',
  },
  reimbursement: {
    title: 'Reimbursement Claims',
    blurb: 'Approved expense claims to pay back with this month’s salary. They do not affect tax or PF.',
    placeholder: 'e.g. Travel — client visit',
    empty: 'No reimbursements for this month.',
    tone: 'success',
    sign: '+',
  },
  incentive: {
    title: 'Incentive',
    blurb: 'Incentive amounts added here are paid on top of gross in the selected month and appear as their own line on the payslip.',
    placeholder: 'e.g. Sales target incentive',
    empty: 'No incentive entries for this month.',
    tone: 'success',
    sign: '+',
  },
  deduction: {
    title: 'One-off deductions',
    blurb: 'A single-month deduction — a penalty, damage recovery or excess payment. Recurring deductions belong in the rules above.',
    placeholder: 'e.g. Asset damage recovery',
    empty: 'No one-off deductions for this month.',
    tone: 'danger',
    sign: '−',
  },
}

const AdjustmentsPanel = ({ month, type }) => {
  const copy = COPY[type]
  const { data, isLoading } = usePayrollAdjustments(month, type)
  const { data: structures } = usePayrollStructures()
  const add = useAddAdjustment()
  const remove = useDeleteAdjustment()
  const [form, setForm] = useState({ employee_id: '', title: '', amount: '', note: '' })

  const locked = data?.locked
  const items = data?.items || []
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const canAdd = form.employee_id && form.title.trim() && num(form.amount) > 0 && !locked

  const submit = async (e) => {
    e.preventDefault()
    if (!canAdd) return
    try {
      await add.mutateAsync({ ...form, title: form.title.trim(), amount: num(form.amount), month, type })
      toast.success(`${copy.title.replace(/s$/, '')} added`)
      setForm({ employee_id: form.employee_id, title: '', amount: '', note: '' })
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  const onRemove = async (item) => {
    if (!window.confirm(`Remove "${item.title}" (${inr2(item.amount)}) for ${item.full_name}?`)) return
    try {
      await remove.mutateAsync(item.id)
      toast.success('Entry removed')
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{copy.title} · {monthLabel(month)}</h2>
          <p className="mt-0.5 max-w-2xl text-xs text-gray-500">{copy.blurb}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Month total</p>
          <p className="numeral text-lg font-semibold text-gray-900">{inr2(data?.total || 0)}</p>
        </div>
      </div>

      {locked ? (
        <div className="flex items-center gap-2 border-b border-gray-100 bg-primary-50/60 px-4 py-3 text-sm text-primary-800">
          <Lock className="h-4 w-4" /> {monthLabel(month)} is finalized. Reopen the month to add or remove entries.
        </div>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-gray-50/50 p-4 md:grid-cols-12">
          <select value={form.employee_id} onChange={set('employee_id')} className="field-input md:col-span-3" aria-label="Employee">
            <option value="">Select employee…</option>
            {(structures?.employees || []).map((e) => (
              <option key={e.employee_id} value={e.employee_id}>{e.full_name} ({e.employee_id})</option>
            ))}
          </select>
          <input value={form.title} onChange={set('title')} placeholder={copy.placeholder} maxLength={150}
            className="field-input md:col-span-4" aria-label="Title" />
          <div className="relative md:col-span-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
            <input value={form.amount} onChange={set('amount')} type="number" min="0.01" step="0.01" placeholder="Amount"
              className="field-input numeral !pl-7" aria-label="Amount" />
          </div>
          <input value={form.note} onChange={set('note')} placeholder="Note (optional)" maxLength={1000}
            className="field-input md:col-span-2" aria-label="Note" />
          <Button type="submit" icon={Plus} loading={add.isPending} disabled={!canAdd} className="md:col-span-1">Add</Button>
        </form>
      )}

      {isLoading ? (
        <div className="p-5"><SkeletonRows rows={3} /></div>
      ) : items.length === 0 ? (
        <Empty title={copy.empty} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {item.title} <Badge tone={copy.tone} className="ml-1">{item.full_name}</Badge>
                </p>
                {item.note && <p className="mt-0.5 truncate text-xs text-gray-500">{item.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`numeral text-sm font-semibold ${type === 'deduction' ? 'text-red-700' : 'text-green-700'}`}>
                  {copy.sign}{inr2(item.amount)}
                </span>
                {!locked && (
                  <button onClick={() => onRemove(item)} title="Remove entry"
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export default AdjustmentsPanel
