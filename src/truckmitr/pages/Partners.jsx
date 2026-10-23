import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Handshake, Users, Store, Wrench, UserCog } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { TmBadge, fmtDate, fmtNum, cx } from '../ui';

const TABS = [
  { key: 'foreman', label: 'Driver Foreman', icon: UserCog },
  { key: 'association', label: 'Driver Association', icon: Users },
  { key: 'dhaba', label: 'Dhaba Sathi', icon: Store },
  { key: 'puncture', label: 'Puncture Point', icon: Wrench },
];
const SORTS = [
  ['created_at|desc', 'Newest First'], ['created_at|asc', 'Oldest First'], ['name|asc', 'Name (A-Z)'], ['name|desc', 'Name (Z-A)'],
  ['driver_count|desc', 'Most Referrals'], ['driver_count|asc', 'Least Referrals'],
].map(([value, label]) => ({ value, label }));
const subscribedTab = (tab) => tab === 'foreman' || tab === 'association';

// truckmitr.com: Admin › Partner Dashboard (AdminController@partnerDashboard)
function PartnerDashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'foreman';

  const config = {
    title: 'Partner Dashboard',
    listTitle: TABS.find((t) => t.key === tab)?.label,
    icon: Handshake,
    crumbs: [{ label: 'Partner Dashboard' }],
    stats: (d) => TABS.map((t) => ({ label: t.label, value: fmtNum(d.counts?.[t.key]?.total), icon: t.icon, hint: `${fmtNum(d.counts?.[t.key]?.today ?? 0)} today` })),
    above: () => (
      <div className="flex flex-wrap gap-1 bg-white px-2 rounded-xl shadow-xs border border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setParams({ tab: t.key })}
            className={cx('flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-bold cursor-pointer', tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>
    ),
    list: {
      path: '/admin/partner-dashboard',
      key: 'users',
      params: { tab },
      minWidth: 1100,
      filters: [
        { name: 'search', type: 'text', placeholder: 'Search name, mobile, ID...' },
        { name: 'state_id', placeholder: 'All States', options: (d) => (d?.states || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'sort_string', placeholder: 'Newest First', options: SORTS },
        { name: 'from_date', type: 'date', placeholder: 'From' },
        { name: 'to_date', type: 'date', placeholder: 'To' },
      ],
      columns: () => [
        { key: 'unique_id', label: 'Unique ID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id}</span> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'mobile', label: 'Mobile No.' },
        { key: 'email', label: 'Email', render: (row) => row.email || '—' },
        { key: 'state_name', label: 'State', render: (row) => row.state_name || 'N/A' },
        {
          key: 'driver_count',
          label: 'Referred Drivers',
          align: 'center',
          render: (row) => (
            <button type="button" onClick={() => navigate(`/partners/${row.id}/referrals`)} className="cursor-pointer">
              <TmBadge tone="blue">{row.driver_count}</TmBadge>
            </button>
          ),
        },
        subscribedTab(tab) && {
          key: 'subscription',
          label: 'Subscription Status',
          render: (row) => (row.subscription_end && row.subscription_end * 1000 > Date.now() ? <TmBadge tone="green">Subscribed</TmBadge> : <TmBadge>Not Subscribed</TmBadge>),
        },
        subscribedTab(tab) && {
          key: 'subscription_start',
          label: 'Subscription Date',
          render: (row) => (row.subscription_end && row.subscription_end * 1000 > Date.now() && row.subscription_start ? fmtDate(Number(row.subscription_start), true) : '—'),
        },
        { key: 'created_at', label: 'Date', render: (row) => fmtDate(row.created_at, true) },
      ].filter(Boolean),
    },
  };
  return <TmCrudPage key={tab} config={config} />;
}

// truckmitr.com: Referred Drivers of a partner (AdminController@partner_referrals)
function PartnerReferrals({ id }) {
  const config = {
    title: 'Referred Drivers',
    listTitle: 'Referred Drivers',
    icon: Users,
    crumbs: [{ label: 'Partner Dashboard', to: '/partners' }, { label: 'Referred Drivers' }],
    stats: (d) => (d.partner ? [{ label: 'Partner', value: d.partner.name, hint: `${d.partner.unique_id || ''} · ${d.partner.mobile || ''}` }] : []),
    list: {
      path: `/admin/partner-referrals/${id}`,
      key: 'referrals',
      minWidth: 1300,
      filters: [
        { name: 'search', type: 'text', placeholder: 'Search driver...' },
        { name: 'state_id', placeholder: 'All States', options: (d) => (d?.states || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'subscription_status', placeholder: 'All', options: [{ value: 'subscribed', label: 'Subscribed' }, { value: 'not_subscribed', label: 'Not Subscribed' }] },
        { name: 'from_date', type: 'date', placeholder: 'From' },
        { name: 'to_date', type: 'date', placeholder: 'To' },
      ],
      columns: () => [
        { key: 'unique_id', label: 'Unique ID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id}</span> },
        { key: 'name', label: 'Driver Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'mobile', label: 'Mobile No.' },
        { key: 'email', label: 'Email', render: (row) => row.email || '—' },
        { key: 'state_name', label: 'State', render: (row) => row.state_name || 'N/A' },
        { key: 'created_at', label: 'Registered Date', render: (row) => fmtDate(row.created_at, true) },
        { key: 'payment_status', label: 'Subscription Status', render: (row) => (row.payment_status === 'captured' ? <TmBadge tone="green">Subscribed</TmBadge> : <TmBadge>Not Subscribed</TmBadge>) },
        { key: 'payment_date', label: 'Subscription Date', render: (row) => (row.payment_date ? fmtDate(row.payment_date, true) : '—') },
        { key: 'payment_type', label: 'Payment Type', render: (row) => (row.payment_type ? String(row.payment_type).replace(/_/g, ' ') : '—') },
        { key: 'amount', label: 'Amount', render: (row) => (row.amount ? `₹${row.amount}` : '—') },
      ],
    },
  };
  return <TmCrudPage key={id} config={config} />;
}

export default function Partners() {
  const { id } = useParams();
  return id ? <PartnerReferrals id={id} /> : <PartnerDashboard />;
}
