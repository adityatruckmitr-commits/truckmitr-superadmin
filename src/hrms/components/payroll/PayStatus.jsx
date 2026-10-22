import { Badge } from '../ui'

/**
 * Where an employee's salary stands for a finalized month. One place decides the words and colours so the
 * HR table, the summary and the employee's dashboard can never disagree.
 *   pending   payroll is done, no payment sent yet
 *   initiated payment has been sent to the bank
 *   paid      credited to the employee's account   (stored as 'paid')
 *   on_hold   HR held this salary back, with a reason
 */
export const PAY_STATUS = {
  pending: { label: 'Pending', tone: 'neutral' },
  initiated: { label: 'Initiated', tone: 'info' },
  paid: { label: 'Credited', tone: 'success' },
  on_hold: { label: 'On hold', tone: 'warning' },
}

export const payStatusMeta = (status) => PAY_STATUS[status] || PAY_STATUS.pending

export const PayStatusBadge = ({ status, className }) => {
  const meta = payStatusMeta(status)
  return <Badge tone={meta.tone} className={className}>{meta.label}</Badge>
}
