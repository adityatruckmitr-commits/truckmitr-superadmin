import React, { useState } from 'react';
import { Utensils } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmView, tmError } from '../api';
import { TmBadge, TmModal, TmTable, fmtDate, fmtMoney, notify } from '../ui';

// truckmitr.com: Admin › Add Dhaba (referral codes for dhabas, AdminController@create / store / showReferrals)
export default function Dhabas() {
  const [referrals, setReferrals] = useState(null); // { dhaba, users, loading }

  const openReferrals = async (dhaba) => {
    setReferrals({ dhaba, users: [], loading: true });
    try {
      const data = await tmView(`/dhabas/${dhaba.id}/referrals`);
      setReferrals({ dhaba, users: data.users || [], loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setReferrals(null);
    }
  };

  const config = {
    title: 'Generate Referral Code for Dhaba',
    singular: 'Dhaba',
    listTitle: 'Dhaba List',
    icon: Utensils,
    crumbs: [{ label: 'Add Dhaba' }],
    list: {
      path: '/admin/add-dhaba',
      key: 'dhabas',
      minWidth: 1100,
      search: (row, q) => `${row.TMID} ${row.name} ${row.phone} ${row.email} ${row.referral_code}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'id', label: 'ID' },
        { key: 'TMID', label: 'TMID', render: (row) => <span className="font-mono text-[11px]">{row.TMID}</span> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'state', label: 'State', render: (row) => row.state?.name || '—' },
        { key: 'referral_code', label: 'Referral Code', render: (row) => <TmBadge tone="purple">{row.referral_code}</TmBadge> },
        {
          key: 'referral_count',
          label: 'Referral Count',
          align: 'center',
          render: (row) => (
            <button type="button" onClick={() => openReferrals(row)} className="text-blue-600 hover:underline font-bold cursor-pointer">{row.referral_count ?? 0}</button>
          ),
        },
        { key: 'amount', label: 'Amount', align: 'right', render: (row) => fmtMoney(row.amount) },
        { key: 'total', label: 'Total Amount', align: 'right', render: (row) => <span className="font-semibold">{fmtMoney((row.referral_count || 0) * Number(row.amount || 0))}</span> },
      ],
    },
    form: {
      createLabel: 'Add Dhaba Info',
      fields: (row, data) => [
        { name: 'name', label: 'Name', required: true },
        { name: 'phone', label: 'Phone', type: 'number', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'amount', label: 'Amount (per referral)', type: 'number', required: true },
        { name: 'state_id', label: 'State', type: 'select', required: true, placeholder: '-- Select State --', options: (data?.states || []).map((s) => ({ value: s.id, label: s.name })) },
      ],
      prepare: ({ name, phone, email, amount, state_id }) => ({ name, phone, email, amount, state_id }),
      create: { path: '/admin/add-dhaba' },
    },
  };

  return (
    <>
      <TmCrudPage config={config} />
      <TmModal open={Boolean(referrals)} title={`Users Referred by: ${referrals?.dhaba?.name || ''}`} subtitle={referrals ? `Registered Users (${referrals.users.length})` : ''} onClose={() => setReferrals(null)} size="xl">
        {referrals && (
          <TmTable
            loading={referrals.loading}
            rows={referrals.users}
            minWidth={760}
            columns={[
              { key: 'unique_id', label: 'TMID', render: (u) => <span className="font-mono text-[11px]">{u.unique_id}</span> },
              { key: 'name', label: 'Name', render: (u) => <span className="font-semibold text-slate-900">{u.name}</span> },
              { key: 'email', label: 'Email' },
              { key: 'mobile', label: 'Phone' },
              { key: 'Referral_Code', label: 'Referral Code' },
              { key: 'Created_at', label: 'Registered At', render: (u) => fmtDate(u.Created_at, true) },
            ]}
          />
        )}
      </TmModal>
    </>
  );
}
