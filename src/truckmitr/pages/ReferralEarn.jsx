import React, { useState } from 'react';
import { CheckCircle2, Eye, Gift, History, Users, Wallet, Clock } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmSend, tmError } from '../api';
import { TmBadge, TmButton, TmExport, TmForm, TmIconButton, TmImage, TmModal, TmTable, fmtDate, fmtMoney, fmtNum, notify } from '../ui';

// Rewards are paid per block of 5 referrals, ₹100 a block (truckmitr.com referral-earn/index.blade.php)
const blocks = (row) => {
  const eligible = Math.floor((row.total_referrals || 0) / 5);
  const paid = Math.floor((row.paid_referral_count || 0) / 5);
  return { eligible, paid, pending: eligible - paid };
};

// truckmitr.com: Admin › Referral & Earn (Admin\ReferralEarnController)
export default function ReferralEarn() {
  const [listKey, setListKey] = useState(0);
  const [dialog, setDialog] = useState(null); // { type: details|history|pay, row, rows?, loading? }
  const [payForm, setPayForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const openList = async (type, row) => {
    setDialog({ type, row, rows: [], loading: true });
    try {
      const path = type === 'details' ? `/admin/referral-earn/details/${row.mobile}` : `/admin/referral-earn/payments/${row.id}`;
      const { data } = await tm.get(path);
      setDialog({ type, row, rows: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setDialog(null);
    }
  };

  const openPay = (row) => {
    const { pending } = blocks(row);
    setErrors({});
    setPayForm({ referrer_id: row.id, referral_count: pending * 5, amount: pending * 100, note: '' });
    setDialog({ type: 'pay', row });
  };

  const pay = async () => {
    setSaving(true);
    setErrors({});
    try {
      const result = await tmSend('/admin/referral-earn/pay', payForm);
      notify.success(result?.message || 'Payment marked as paid successfully!');
      setDialog(null);
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
    title: 'Refer & Earn Management',
    listTitle: 'Referrers',
    icon: Gift,
    crumbs: [{ label: 'Referral & Earn' }],
    stats: (d) => [
      { label: 'Total Referrers', value: fmtNum(d.summary?.total_referrers), icon: Users },
      { label: 'Total Referred', value: fmtNum(d.summary?.total_referred), icon: Gift },
      { label: 'Eligible (5+)', value: fmtNum(d.summary?.eligible_referrers), icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Pending Payments', value: fmtNum(d.summary?.pending_payments), icon: Clock, iconClass: 'text-amber-600' },
    ],
    headerActions: (ctx) => <TmExport path="/admin/referral-earn/export" params={ctx.filters} filename="referral-earn.csv" />,
    list: {
      path: '/admin/referral-earn',
      key: 'referrers',
      minWidth: 1100,
      filters: [
        { name: 'search', type: 'text', placeholder: 'Name, mobile or TMID...' },
        { name: 'eligibility', placeholder: 'Eligibility: All', options: [{ value: 'eligible', label: 'Eligible (5+)' }, { value: 'not_eligible', label: 'Not Eligible' }] },
        { name: 'payment_status', placeholder: 'Payment: All', options: [{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }] },
      ],
      columns: () => [
        { key: 'name', label: 'Referrer Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'unique_id', label: 'TMID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id}</span> },
        { key: 'mobile', label: 'Mobile' },
        { key: 'total_referrals', label: 'Total Referrals', align: 'center', render: (row) => <TmBadge tone="blue">{row.total_referrals}</TmBadge> },
        { key: 'eligible', label: 'Eligible Blocks (5x)', align: 'center', render: (row) => <TmBadge tone="green">{blocks(row).eligible}</TmBadge> },
        { key: 'paid', label: 'Paid Blocks', align: 'center', render: (row) => <TmBadge>{blocks(row).paid}</TmBadge> },
        {
          key: 'reward',
          label: 'Reward Status',
          align: 'center',
          render: (row) => {
            const b = blocks(row);
            if (b.pending > 0) return <span className="text-rose-600 font-bold">Pending ₹{b.pending * 100}</span>;
            if (b.eligible > 0) return <span className="text-emerald-600 font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid</span>;
            return <span className="text-slate-400">Not Eligible</span>;
          },
        },
      ],
    },
    rowActions: (row) => (
      <>
        <TmIconButton icon={Eye} title="Referred drivers" tone="blue" onClick={() => openList('details', row)} />
        {row.paid_referral_count > 0 && <TmIconButton icon={History} title="Payment history" tone="green" onClick={() => openList('history', row)} />}
        {blocks(row).pending > 0 && (
          <TmButton tone="success" icon={Wallet} className="ml-1 !px-2.5 !py-1" onClick={() => openPay(row)}>Pay Now</TmButton>
        )}
      </>
    ),
  };

  return (
    <>
      <TmCrudPage key={listKey} config={config} />

      <TmModal
        open={dialog?.type === 'details' || dialog?.type === 'history'}
        title={dialog?.type === 'details' ? `Referred Drivers - ${dialog?.row?.name}` : `Payment History - ${dialog?.row?.name}`}
        onClose={() => setDialog(null)}
        size="lg"
      >
        {dialog?.type === 'details' && (
          <TmTable
            loading={dialog.loading}
            rows={dialog.rows}
            rowKey="mobile"
            minWidth={560}
            columns={[
              { key: 'name', label: 'Driver Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              { key: 'unique_id', label: 'TMID' },
              { key: 'mobile', label: 'Mobile' },
              { key: 'status', label: 'Status', render: (r) => <TmBadge tone={Number(r.status) === 1 ? 'green' : 'slate'}>{Number(r.status) === 1 ? 'Active' : 'Inactive'}</TmBadge> },
              { key: 'Created_at', label: 'Joined Date', render: (r) => fmtDate(r.Created_at || r.created_at) },
            ]}
          />
        )}
        {dialog?.type === 'history' && (
          <TmTable
            loading={dialog.loading}
            rows={dialog.rows}
            minWidth={560}
            columns={[
              { key: 'payment_date', label: 'Date', render: (r) => fmtDate(r.payment_date, true) },
              { key: 'amount', label: 'Amount', render: (r) => fmtMoney(r.amount) },
              { key: 'referral_count_paid', label: 'Blocks', render: (r) => `${r.referral_count_paid / 5} Blocks` },
              { key: 'payment_screenshot', label: 'Screenshot', render: (r) => <TmImage src={r.payment_screenshot} /> },
              { key: 'payment_note', label: 'Note', render: (r) => r.payment_note || '—' },
            ]}
          />
        )}
      </TmModal>

      <TmModal
        open={dialog?.type === 'pay'}
        title="Mark Payment as Paid"
        subtitle={dialog?.row ? `${dialog.row.name} · ${dialog.row.mobile}` : ''}
        onClose={() => setDialog(null)}
        size="md"
        footer={
          <>
            <TmButton onClick={() => setDialog(null)}>Cancel</TmButton>
            <TmButton tone="success" busy={saving} onClick={pay}>Confirm Payment</TmButton>
          </>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Blocks</p>
            <p className="text-lg font-bold text-slate-900">{(payForm.referral_count || 0) / 5}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Amount</p>
            <p className="text-lg font-bold text-emerald-700">{fmtMoney(payForm.amount)}</p>
          </div>
        </div>
        <TmForm
          values={payForm}
          onChange={setPayForm}
          errors={errors}
          fields={[
            { name: 'payment_screenshot', label: 'Payment Screenshot', type: 'file', accept: 'image/*', required: true, span: 2 },
            { name: 'note', label: 'Note', type: 'textarea', rows: 3 },
          ]}
        />
      </TmModal>
    </>
  );
}
