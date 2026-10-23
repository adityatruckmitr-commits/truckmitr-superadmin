import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, Eye, IdCard } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmError, tmView } from '../api';
import { TmBadge, TmDetails, TmExport, TmIconButton, TmModal, TmSection, TmShell, TmTable, fmtDate, notify, useTmView } from '../ui';

const words = (s) => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A');
const SUB_TONE = { trusted: 'blue', verified: 'green', job_ready: 'amber', legacy: 'red' };
const sub = (type) => <TmBadge tone={SUB_TONE[type] || 'slate'}>{type ? String(type).replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'N/A'}</TmBadge>;
// Same states and marks as the truckmitr.com report's $statusMap
const STATUS = { verified: ['green', '✔'], rejected: ['red', '✖'], initiated: ['amber', '⏳'] };
const POPUP_TITLE = { dl: 'Driving License', pan: 'PAN', face: 'Face Match', court: 'Court Check', dav: 'Digital Address' };

// truckmitr.com: Admin › ID Check (AdminController@userVerificationReport, verificationPopup)
export function IdCheck() {
  const [popup, setPopup] = useState(null); // { type, user, data, loading }

  const open = async (type, user) => {
    setPopup({ type, user, data: null, loading: true });
    try {
      const d = await tmView(`/admin/verification/${type}/${user.id}`);
      setPopup({ type, user, data: d?.data || null, loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setPopup(null);
    }
  };

  const check = (type, statusKey, dateKey) => ({
    key: statusKey,
    label: POPUP_TITLE[type] === 'Driving License' ? 'License' : POPUP_TITLE[type],
    render: (row) => {
      const [tone, icon] = STATUS[row[statusKey]] || ['slate', '—'];
      return (
        <div>
          <button type="button" onClick={() => open(type, row)} className="cursor-pointer" title="View verification details">
            <TmBadge tone={tone}>{icon} {words(row[statusKey])}</TmBadge>
          </button>
          {row[dateKey] && <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(row[dateKey])}</p>}
        </div>
      );
    },
  });

  const config = {
    title: 'User Verification Report',
    listTitle: 'Verification Report',
    icon: IdCard,
    crumbs: [{ label: 'Verification Hub', to: '/verifications' }, { label: 'ID Check' }],
    headerActions: () => <TmExport path="/export-user-verification" filename="user-verification.csv" label="Export CSV" />,
    list: {
      path: '/admin/id-check',
      key: 'users',
      minWidth: 1500,
      search: (row, q) => `${row.unique_id} ${row.name} ${row.mobile} ${row.email}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search this page...',
      columns: () => [
        { key: 'unique_id', label: 'TMID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id}</span> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name || '—'}</span> },
        { key: 'mobile', label: 'Mobile No.', render: (row) => row.mobile || '—' },
        { key: 'email', label: 'Email', render: (row) => row.email || '—' },
        { key: 'role', label: 'Role', render: (row) => words(row.role) },
        { key: 'subscription_type', label: 'Subscription', render: (row) => sub(row.subscription_type) },
        { key: 'subscribed_at', label: 'Subscribed', render: (row) => (row.subscribed_at ? fmtDate(row.subscribed_at) : '—') },
        check('dl', 'license_check', 'license_date'),
        check('pan', 'pan', 'pan_date'),
        check('face', 'face_match', 'face_match_date'),
        check('court', 'cc', 'cc_date'),
        check('dav', 'da', 'da_date'),
      ],
    },
  };

  return (
    <>
      <TmCrudPage config={config} />
      <TmModal open={Boolean(popup)} title={`Verification Details – ${POPUP_TITLE[popup?.type] || ''}`} subtitle={popup?.user ? `${popup.user.name || ''} · ${popup.user.unique_id}` : ''} onClose={() => setPopup(null)} size="lg">
        {popup?.loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : popup?.data ? (
          <TmDetails
            items={Object.entries(popup.data)
              .filter(([k, v]) => !['id', 'user_id'].includes(k) && (v === null || typeof v !== 'object'))
              .map(([k, v]) => [words(k), /^https?:/.test(String(v)) ? <a key={k} href={v} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open</a> : v])}
          />
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No data found</p>
        )}
      </TmModal>
    </>
  );
}

// truckmitr.com: Admin › RC Check (AdminController@rcVerificationList)
function RcList() {
  const navigate = useNavigate();
  const config = {
    title: 'RC Verification Report',
    listTitle: 'RC Verifications',
    icon: Car,
    crumbs: [{ label: 'Verification Hub', to: '/verifications' }, { label: 'RC Check' }],
    list: {
      path: '/admin/rc-verifications',
      key: 'records',
      rowKey: 'user_id',
      minWidth: 1000,
      search: (row, q) => `${row.unique_id} ${row.name} ${row.mobile}`.toLowerCase().includes(q),
      columns: () => [
        { key: 'unique_id', label: 'TMID', render: (row) => <span className="font-mono text-[11px]">{row.unique_id || '—'}</span> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name || '—'}</span> },
        { key: 'mobile', label: 'Mobile', render: (row) => row.mobile || '—' },
        { key: 'payment_type', label: 'Subscription Type', render: (row) => sub(row.payment_type) },
        { key: 'payment_date', label: 'Subscription Date & Time', render: (row) => (row.payment_date ? fmtDate(row.payment_date, true) : '—') },
        { key: 'total_rc', label: 'Total RC', align: 'center', render: (row) => <TmBadge tone="blue">{row.total_rc}</TmBadge> },
        { key: 'last_verified_at', label: 'Last RC Date', render: (row) => (row.last_verified_at ? fmtDate(row.last_verified_at, true) : '—') },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Eye} title="RC details" tone="blue" onClick={() => navigate(`/rc-verifications/${row.user_id}`)} />,
  };
  return <TmCrudPage config={config} />;
}

// truckmitr.com: RC Verification Details (AdminController@rcVerificationDetails)
function RcDetails({ userId }) {
  const { data, loading, error } = useTmView(`/admin/rc-verification/${userId}`);
  const [rc, setRc] = useState(null);
  const user = data?.user;
  return (
    <TmShell title="RC Verification Details" crumbs={[{ label: 'RC Check', to: '/rc-verifications' }, { label: user?.name || 'Details' }]}>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {user && (
        <TmSection title="User Information" icon={IdCard}>
          <TmDetails items={[['Name', user.name], ['TMID', user.unique_id], ['Mobile', user.mobile], ['Email', user.email]]} />
        </TmSection>
      )}
      <TmSection title="RC Records" icon={Car} flush>
        <TmTable
          loading={loading}
          rows={data?.rcList || []}
          minWidth={1000}
          columns={[
            { key: 'vehicle_number', label: 'Vehicle No.', render: (r) => <span className="font-mono text-[11px] font-semibold">{r.vehicle_number || '—'}</span> },
            { key: 'owner', label: 'Owner', render: (r) => r.owner || '—' },
            { key: 'owner_fathers_name', label: 'Owner Father Name', render: (r) => r.owner_fathers_name || '—' },
            { key: 'blacklist_status', label: 'Blacklist Status', render: (r) => r.blacklist_status || '—' },
            { key: 'rc_status', label: 'RC Status', render: (r) => <TmBadge tone={r.blacklist_status === 'Yes' ? 'red' : 'green'}>{r.rc_status || '—'}</TmBadge> },
            { key: 'registration_date', label: 'Reg. Date', render: (r) => fmtDate(r.registration_date) },
            { key: 'expiry_date', label: 'Expiry Date', render: (r) => fmtDate(r.expiry_date) },
            { key: 'action', label: 'Action', align: 'right', render: (r) => <TmIconButton icon={Eye} title="View" tone="blue" onClick={() => setRc(r)} /> },
          ]}
        />
      </TmSection>
      <TmModal open={Boolean(rc)} title={`RC Details – ${rc?.vehicle_number || 'N/A'}`} onClose={() => setRc(null)} size="lg">
        {rc && (
          <TmDetails
            items={[
              ['Vehicle Number', rc.vehicle_number], ['Owner', rc.owner], ['Owner Father Name', rc.owner_fathers_name],
              ['Model', rc.model_name], ['Company', rc.company_name], ['Color', rc.color], ['Fuel Type', rc.fuel_type],
              ['Chassis', rc.chassis], ['Engine', rc.engine], ['Manufacturing Date', rc.manufacturing_date],
              ['Registration Date', fmtDate(rc.registration_date)], ['Expiry Date', fmtDate(rc.expiry_date)],
              ['RC Status', rc.rc_status], ['Blacklist Status', rc.blacklist_status],
              ['Financed', rc.is_financed ? 'Yes' : 'No'], ['Financier', rc.financier],
              ['Insurance Company', rc.insurance_company], ['Insurance Valid Till', fmtDate(rc.insurance_valid_till)], ['Policy Number', rc.policy_number],
              ['Present Address', rc.present_address], ['Permanent Address', rc.permanent_address],
            ]}
          />
        )}
      </TmModal>
    </TmShell>
  );
}

export function RcCheck() {
  const { userId } = useParams();
  return userId ? <RcDetails userId={userId} /> : <RcList />;
}
