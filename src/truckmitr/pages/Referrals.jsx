import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Eye, Share2, Users } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, TmExport, TmIconButton, fmtDate, fmtNum } from '../ui';

const rate = (row) => (row.total_referrals > 0 ? Math.round((row.accepted_referrals / row.total_referrals) * 1000) / 10 : 0);
const rateTone = (r) => (r >= 70 ? 'green' : r >= 40 ? 'amber' : 'red');

// truckmitr.com: Admin › Referral Management (ReferralController@index)
function ReferralList() {
  const navigate = useNavigate();
  const config = {
    title: 'Referral Management',
    listTitle: 'Referral Users',
    icon: Share2,
    crumbs: [{ label: 'Referral Management' }],
    stats: (d) => [
      { label: 'Total Users', value: fmtNum(d.totalUsers), icon: Users },
      { label: 'Total Referrals', value: fmtNum(d.totalReferrals), icon: Share2 },
      { label: 'Accepted', value: fmtNum(d.acceptedReferrals), icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Pending', value: fmtNum(d.pendingReferrals), icon: Clock, iconClass: 'text-amber-600' },
    ],
    headerActions: (ctx) => <TmExport path="/admin/referrals/export" params={ctx.filters} filename="referrals.xlsx" />,
    list: {
      path: '/admin/referrals',
      key: 'referralUsers',
      rowKey: 'user_id',
      minWidth: 1000,
      filters: [
        { name: 'user_search', type: 'text', placeholder: 'Name, mobile or TM ID...' },
        { name: 'status_filter', placeholder: 'All Users', options: [{ value: 'has_accepted', label: 'Has Accepted Referrals' }, { value: 'pending_only', label: 'Pending Only' }] },
        { name: 'date_from', type: 'date', placeholder: 'From date' },
        { name: 'date_to', type: 'date', placeholder: 'To date' },
      ],
      columns: () => [
        {
          key: 'user',
          label: 'User Details',
          render: (row) => (
            <div>
              <p className="font-semibold text-slate-900">{row.driver?.name || 'N/A'}</p>
              <p className="text-[11px] text-slate-500">{row.driver?.unique_id || row.unique_id} · {row.driver?.mobile || 'N/A'}</p>
            </div>
          ),
        },
        { key: 'total_referrals', label: 'Total Referrals', align: 'center', render: (row) => <TmBadge tone="blue">{row.total_referrals}</TmBadge> },
        { key: 'accepted_referrals', label: 'Accepted', align: 'center', render: (row) => <TmBadge tone="green">{row.accepted_referrals}</TmBadge> },
        { key: 'pending_referrals', label: 'Pending', align: 'center', render: (row) => <TmBadge tone="amber">{row.pending_referrals}</TmBadge> },
        { key: 'rate', label: 'Success Rate', align: 'center', render: (row) => <TmBadge tone={rateTone(rate(row))}>{rate(row)}%</TmBadge> },
        { key: 'latest_referral', label: 'Latest Referral', render: (row) => fmtDate(row.latest_referral) },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Eye} title="View referrals" tone="blue" onClick={() => navigate(`/referrals/${row.user_id}`)} />,
    remove: {
      path: (row) => `/admin/referrals/user/${row.user_id}`,
      label: (row) => `Delete all ${row.total_referrals} referrals of ${row.driver?.name || row.unique_id}?`,
    },
  };
  return <TmCrudPage config={config} />;
}

// truckmitr.com: Referrals by a user (ReferralController@show)
function ReferralDetails({ userId }) {
  const config = {
    title: 'Referrals by User',
    listTitle: 'All Referrals',
    icon: Share2,
    crumbs: [{ label: 'Referral Management', to: '/referrals' }, { label: 'Referrals' }],
    stats: (d) => [
      { label: 'User', value: d.user?.name || '—', hint: `${d.user?.unique_id || ''} · ${d.user?.mobile || ''}` },
      { label: 'Total Referrals', value: fmtNum(d.userStats?.total_referrals), icon: Share2 },
      { label: 'Accepted', value: fmtNum(d.userStats?.accepted_referrals), icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Pending', value: fmtNum(d.userStats?.pending_referrals), icon: Clock, iconClass: 'text-amber-600' },
      {
        label: 'Success Rate',
        value: d.userStats?.total_referrals ? `${Math.round((d.userStats.accepted_referrals / d.userStats.total_referrals) * 1000) / 10}%` : '0%',
      },
    ],
    list: {
      path: `/admin/referrals/${userId}`,
      key: 'referrals',
      filters: [
        { name: 'status', placeholder: 'All Referrals', options: [{ value: 'accepted', label: 'Accepted Only' }, { value: 'pending', label: 'Pending Only' }] },
        { name: 'contact_type', placeholder: 'All Types', options: [{ value: 'phone', label: 'Phone' }, { value: 'link', label: 'Link' }] },
      ],
      columns: () => [
        { key: 'contact', label: 'Contact', render: (row) => <span className="font-semibold text-slate-900">{row.contact}</span> },
        { key: 'contact_type', label: 'Type', render: (row) => <TmBadge tone={row.contact_type === 'phone' ? 'blue' : 'purple'}>{row.contact_type?.replace(/^./, (c) => c.toUpperCase())}</TmBadge> },
        { key: 'status', label: 'Status', render: (row) => (row.accepted_at ? <TmBadge tone="green">Accepted</TmBadge> : <TmBadge tone="amber">Pending</TmBadge>) },
        {
          key: 'referred_user',
          label: 'Referred User',
          render: (row) =>
            row.referred_user ? (
              <div>
                <p className="font-semibold text-slate-900">{row.referred_user.name}</p>
                <p className="text-[11px] text-slate-500">{row.referred_user.unique_id} · {row.referred_user.mobile}</p>
              </div>
            ) : <span className="text-slate-400">Not registered yet</span>,
        },
        { key: 'sent_at', label: 'Sent At', render: (row) => fmtDate(row.sent_at) },
        { key: 'accepted_at', label: 'Accepted At', render: (row) => fmtDate(row.accepted_at) },
      ],
    },
    remove: {
      path: (row) => `/admin/referrals/record/${row.id}`,
      label: (row) => `Delete the referral sent to ${row.contact}?`,
    },
  };
  return <TmCrudPage key={userId} config={config} />;
}

export default function Referrals() {
  const { userId } = useParams();
  return userId ? <ReferralDetails userId={userId} /> : <ReferralList />;
}

