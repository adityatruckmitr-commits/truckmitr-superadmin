import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, Wallet } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, TmDetails, TmIconButton, TmModal, fmtDate, fmtMoney } from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
const details = (payment) => {
  try {
    return typeof payment.payment_details === 'string' ? JSON.parse(payment.payment_details) : payment.payment_details || {};
  } catch {
    return {};
  }
};
const statusBadge = (status) => <TmBadge tone={status === 'captured' ? 'green' : 'red'}>{cap(status)}</TmBadge>;

// truckmitr.com: Admin › Payments › View Payments / View Failed Payments (PaymentController)
export default function Payments() {
  const failed = useLocation().pathname.endsWith('/failed');
  const [viewing, setViewing] = useState(null);

  const config = {
    title: failed ? 'Failed Payments' : 'Payments List',
    listTitle: failed ? 'Failed Payments' : 'Payments',
    icon: Wallet,
    crumbs: [{ label: 'Payments', to: '/payments' }, { label: failed ? 'Failed' : 'View Payments' }],
    list: {
      path: failed ? '/admin/payments/failed' : '/admin/payments',
      key: failed ? 'failedPayments' : 'payments',
      search: (row, q) => `${row.id} ${row.user?.name} ${row.payment_id} ${row.unique_id}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search payment, user...',
      columns: () => [
        { key: 'id', label: 'Payment ID' },
        { key: 'user', label: 'User', render: (row) => <span className="font-semibold text-slate-900">{row.user?.name || 'No User'}</span> },
        { key: 'amount', label: 'Amount (INR)', align: 'right', render: (row) => fmtMoney(row.amount) },
        { key: 'payment_status', label: 'Status', render: (row) => statusBadge(row.payment_status) },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Eye} title="View" tone="blue" onClick={() => setViewing(row)} />,
    ...(failed
      ? {}
      : {
          remove: {
            path: (row) => `/admin/payment/${row.id}`,
            label: (row) => `Delete payment #${row.id} (${fmtMoney(row.amount)})?`,
          },
        }),
  };

  const info = viewing ? details(viewing) : {};
  return (
    <>
      <TmCrudPage key={failed ? 'failed' : 'all'} config={config} />
      <TmModal open={Boolean(viewing)} title="Payment Details" onClose={() => setViewing(null)} size="md">
        {viewing && (
          <TmDetails
            items={[
              ['Payment ID', viewing.id],
              ['Amount', fmtMoney(viewing.amount)],
              ['Status', statusBadge(viewing.payment_status)],
              ['Payment Method', info.method || 'N/A'],
              ['User Name', viewing.user?.name || 'No User'],
              ['User Role', viewing.user?.role || 'No Role'],
              ['Transaction Date', fmtDate(viewing.created_at, true)],
              ['Transaction ID', viewing.payment_id],
              ['Email', info.email || 'N/A'],
              ['TM ID', viewing.unique_id],
              ['Payment Type', viewing.payment_type],
            ]}
          />
        )}
      </TmModal>
    </>
  );
}
