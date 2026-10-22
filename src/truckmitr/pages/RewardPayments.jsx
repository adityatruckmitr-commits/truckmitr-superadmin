import React, { useState } from 'react';
import { Clock, IndianRupee, Receipt, Wallet, CheckCircle2 } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmSend, tmError } from '../api';
import { TmBadge, TmButton, TmDetails, TmForm, TmImage, TmModal, fmtDate, fmtNum, notify } from '../ui';

const isPaid = (row) => row.status === 'debit';
const amountOf = (row) => Math.abs(Number(row.amount ?? 100));
const screenshotOf = (row) => (row.image ? String(row.image).replace('public/', '').replace(/^\/+/, '') : '');

// truckmitr.com: Admin › Payment (wallet withdrawal requests, Admin\RewardPaymentController)
export default function RewardPayments() {
  const [listKey, setListKey] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [paying, setPaying] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const pay = async () => {
    setSaving(true);
    setErrors({});
    try {
      const result = await tmSend('/admin/payments-reward/pay', form);
      notify.success(result?.message || 'Payment processed and reward coupon marked as paid successfully!');
      setPaying(null);
      setListKey((k) => k + 1);
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const config = {
    title: 'Wallet Withdrawal Request Management',
    listTitle: 'Withdrawal Requests',
    icon: Wallet,
    crumbs: [{ label: 'Payment' }],
    stats: (d) => [
      { label: 'Total Requests', value: fmtNum(d.summary?.total_requests), icon: Receipt },
      { label: 'Paid Amount', value: `₹${fmtNum(d.summary?.paid_amount)}`, icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Pending Amount', value: `₹${fmtNum(d.summary?.pending_amount)}`, icon: IndianRupee, iconClass: 'text-rose-600' },
      { label: 'Pending Requests', value: fmtNum(d.summary?.pending_requests), icon: Clock, iconClass: 'text-amber-600' },
    ],
    list: {
      path: '/admin/payments-reward',
      key: 'rewards',
      minWidth: 960,
      filters: [
        { name: 'search', type: 'text', placeholder: 'Name, mobile or TMID...' },
        { name: 'status_filter', placeholder: 'Status: All', options: [{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }] },
      ],
      columns: () => [
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'tmid', label: 'TMID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id || row.user_unique_id}</span> },
        { key: 'mobile', label: 'Mobile' },
        { key: 'created_at', label: 'Request Date', render: (row) => fmtDate(row.created_at) },
        { key: 'amount', label: 'Amount', align: 'right', render: (row) => <span className="font-semibold">₹{fmtNum(amountOf(row))}</span> },
        { key: 'status', label: 'Coupon Status', render: (row) => (isPaid(row) ? <TmBadge tone="green">Paid</TmBadge> : <TmBadge tone="red">Unpaid</TmBadge>) },
      ],
    },
    rowActions: (row) =>
      isPaid(row) ? (
        <TmButton icon={Receipt} className="!px-2.5 !py-1" onClick={() => setReceipt(row)}>Receipt</TmButton>
      ) : (
        <TmButton
          tone="success"
          icon={Wallet}
          className="!px-2.5 !py-1"
          onClick={() => {
            setErrors({});
            setForm({ reward_id: row.id, amount: amountOf(row), note: '' });
            setPaying(row);
          }}
        >
          Pay Now
        </TmButton>
      ),
  };

  return (
    <>
      <TmCrudPage key={listKey} config={config} />

      <TmModal open={Boolean(receipt)} title="Payment Receipt" onClose={() => setReceipt(null)} size="md">
        {receipt && (
          <div className="space-y-4">
            <TmDetails
              items={[
                ['Name', receipt.name],
                ['Mobile', receipt.mobile],
                ['Amount', `₹${fmtNum(amountOf(receipt))}`],
                ['Transaction ID / Note', receipt.remark],
                ['Paid At', fmtDate(receipt.used_at || receipt.updated_at, true)],
              ]}
            />
            {screenshotOf(receipt) && <TmImage src={screenshotOf(receipt)} className="w-full h-auto max-h-96 object-contain" />}
          </div>
        )}
      </TmModal>

      <TmModal
        open={Boolean(paying)}
        title="Mark Payment as Paid"
        subtitle={paying ? `${paying.name} · ${paying.mobile}` : ''}
        onClose={() => setPaying(null)}
        size="md"
        footer={
          <>
            <TmButton onClick={() => setPaying(null)}>Cancel</TmButton>
            <TmButton tone="success" busy={saving} onClick={pay}>Confirm Payment</TmButton>
          </>
        }
      >
        <TmForm
          values={form}
          onChange={setForm}
          errors={errors}
          fields={[
            { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
            { name: 'payment_screenshot', label: 'Payment Screenshot', type: 'file', accept: 'image/*', required: true },
            { name: 'note', label: 'Transaction ID / Note', type: 'textarea', rows: 3 },
          ]}
        />
      </TmModal>
    </>
  );
}
