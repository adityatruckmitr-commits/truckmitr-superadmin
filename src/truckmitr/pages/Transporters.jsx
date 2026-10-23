import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Building2, ChevronDown, ChevronRight, Eye, Gem, IndianRupee, Pencil, Save, ShieldCheck, Users, CheckCircle2, Clock } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmSend, tmError, tmView } from '../api';
import {
  TmBadge, TmButton, TmDetails, TmExport, TmForm, TmIconButton, TmImage, TmModal, TmSection, TmShell, TmStats, TmTable, fmtDate, fmtMoney, fmtNum, notify, useTmView,
} from '../ui';

const PLAN = { standard: ['Standard', 'green'], legacy: ['Legacy', 'red'] };
const plan = (type) => {
  const [text, tone] = PLAN[type] || ['No Subscription', 'slate'];
  return <TmBadge tone={tone}>{text}</TmBadge>;
};
const when = (value) => (value ? fmtDate(/^\d+$/.test(String(value)) ? Number(value) : value, true) : 'N/A');
const asArray = (value) => {
  if (Array.isArray(value)) return value.map(String);
  try { const v = JSON.parse(value || '[]'); return Array.isArray(v) ? v.map(String) : String(value || '').split(',').map((s) => s.trim()).filter(Boolean); } catch { return String(value || '').split(',').map((s) => s.trim()).filter(Boolean); }
};

// Assigned TeleChamp is changed in place (POST /admin/update-transporter-admin)
function AdminSelect({ row, admins }) {
  const current = admins.find((a) => a.name === row.telechamp_name)?.id ?? row.assigned_to ?? '';
  const [value, setValue] = useState(current);
  const change = async (adminId) => {
    setValue(adminId);
    try {
      const fd = new FormData();
      fd.append('admin_id', adminId);
      fd.append('user_id', row.id);
      await tm.post('/admin/update-transporter-admin', fd);
      notify.success('TeleChamp updated');
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };
  return (
    <select value={value} onChange={(e) => change(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
      <option value="">Select TeleChamp</option>
      {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );
}

// truckmitr.com: Admin › Transporter › View List / Subscribed Transporters (TruckInstituteForAdminController)
export function TransporterList() {
  const navigate = useNavigate();
  const subscribed = useLocation().pathname.startsWith('/subscribed-transporters');
  const [admins, setAdmins] = useState([]);
  const config = {
    title: subscribed ? 'Subscribed Transporter List' : 'Transporter List',
    listTitle: subscribed ? 'Subscribed Transporters' : 'Transporters',
    icon: subscribed ? Gem : Building2,
    crumbs: [{ label: 'Transporter' }, { label: subscribed ? 'Subscribed Transporters' : 'View List' }],
    onData: (d) => setAdmins(d.admins || []),
    headerActions: (ctx) => (
      <TmExport
        path={subscribed ? '/admin/subscribed-transporters/export' : '/admin/transporter/export'}
        params={ctx.filters}
        filename={subscribed ? 'subscribed-transporters-list.xlsx' : 'transporter-list.xlsx'}
      />
    ),
    list: {
      path: subscribed ? '/admin/subscribed-transporters' : '/admin/transporter',
      key: 'transporter',
      minWidth: subscribed ? 1700 : 1400,
      filters: [
        { name: 'global_search', type: 'text', placeholder: 'Search name, mobile, TM ID...' },
        { name: 'state', placeholder: 'State', options: (d) => (d?.states || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'status', placeholder: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        !subscribed && { name: 'payment_status', placeholder: 'Subscription', options: [{ value: 'captured', label: 'Yes' }, { value: 'not_received', label: 'No' }] },
        { name: 'from_date', type: 'date', placeholder: 'Registered from' },
        { name: 'to_date', type: 'date', placeholder: 'Registered to' },
        { name: 'payment_from_date', type: 'date', placeholder: 'Payment from' },
        { name: 'payment_to_date', type: 'date', placeholder: 'Payment to' },
      ].filter(Boolean),
      columns: () => [
        {
          key: 'name',
          label: 'Transporter',
          render: (row) => (
            <div className="flex items-center gap-2">
              <TmImage src={row.images || 'noimg.png'} className="w-9 h-9 rounded-full" />
              <div>
                <p className="font-semibold text-slate-900">{row.name}</p>
                <button type="button" onClick={() => navigate(`/transporter/${row.id}/jobs`)} className="font-mono text-[11px] text-blue-600 hover:underline cursor-pointer">{row.unique_id}</button>
              </div>
            </div>
          ),
        },
        {
          key: 'contact',
          label: subscribed ? 'Mobile / Email' : 'Contact',
          render: (row) => (
            <div>
              <p>{row.mobile}</p>
              <p className="text-[11px] text-slate-500">{row.email || '—'}</p>
            </div>
          ),
        },
        { key: 'telechamp', label: 'Assigned TeleChamp', render: (row) => (subscribed ? row.telechamp_name || 'N/A' : <AdminSelect key={row.id} row={row} admins={admins} />) },
        { key: 'state_name', label: 'State', render: (row) => row.state_name || 'N/A' },
        { key: 'payment_type', label: 'Subscription', render: (row) => plan(row.payment_type) },
        { key: 'payment_date', label: 'Sub. Date', render: (row) => when(row.payment_date) },
        subscribed && {
          key: 'payment_end_date',
          label: 'Sub. Expire At',
          render: (row) => (row.payment_end_date ? <span className={row.payment_end_date * 1000 < Date.now() ? 'text-rose-600 font-semibold' : ''}>{when(row.payment_end_date)}</span> : 'N/A'),
        },
        { key: 'Created_at', label: 'Reg. Date', render: (row) => fmtDate(row.Created_at, true) },
      ].filter(Boolean),
    },
    toggle: { path: (row) => `/admin/status_transporter/${row.id}`, method: 'get', isOn: (row) => String(row.status) === '1' },
    rowActions: (row) => (
      <>
        <TmIconButton icon={Eye} title="Profile" tone="blue" onClick={() => navigate(`/transporter/${row.id}/profile`)} />
        <TmIconButton icon={Briefcase} title="Jobs" tone="green" onClick={() => navigate(`/transporter/${row.id}/jobs`)} />
        <TmIconButton icon={Pencil} title="Edit" tone="blue" onClick={() => navigate(`/transporter/${row.id}/edit`)} />
      </>
    ),
    remove: { path: (row) => `/admin/delete_transporter/${row.id}`, method: 'get', label: (row) => `Delete the transporter ${row.name} (${row.unique_id})?` },
  };
  return <TmCrudPage key={subscribed ? 'subscribed' : 'all'} config={config} />;
}

const LABELS = {
  Year_of_Establishment: { '0_1': '0-1 Yrs', '1_2': '1-2 Yrs', '3_5': '3-5 Yrs', '6_10': '6-10 Yrs', '10+': '10+ Yrs' },
  company_registration_type: {
    1: 'Sole Proprietorship', 2: 'One Person Company', 3: 'Partnership Firm', 4: 'Limited Liability Partnership (LLP)',
    5: 'Section 8 Company', 6: 'Public Company', 7: 'Private Company',
  },
  Fleet_Size: { '0_9': '0-9', '10_50': '10-50', '51_100': '51-100', '100+': '100+' },
  Average_KM: { less_1000: 'Less than 1000', '1000_3000': '1000 - 3000', '3000_5000': '3000 - 5000', '5000_10000': '5000 - 10000', '10000_plus': '10000+' },
};
const SEGMENTS = ['White Goods', 'E-commerce', 'Livestock', 'Perishable', 'Oversized', 'Fuel Tanker', 'Automobile Carrier', 'Construction Industry', 'Refrigerator Vehicle', 'Others'];
const VEHICLES = { 3: 'Heavy Open Body Trucks', 1: 'Container Trucks', 11: 'Tipper Trucks', 22: 'Trailer / Semi-Trailer Trucks', 10: 'Tankers', 26: 'Car Carriers', 4: 'Light Commercial Vehicles', 8: 'Refrigerator (Reefer) Trucks' };
const ROUTES = ['Local Delivery', 'Intercity', 'Intracity', 'Interstate', 'All India'];
const opts = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

// truckmitr.com: Transporter profile (TruckInstituteForAdminController@transporter_profile)
function TransporterProfile({ id }) {
  const navigate = useNavigate();
  const { data, loading, error } = useTmView(`/admin/transporter-profile/${id}`);
  const t = data?.transporter;
  return (
    <TmShell
      title="Transporter Profile"
      crumbs={[{ label: 'Transporter', to: '/transporter' }, { label: t?.name || 'Profile' }]}
      actions={
        <>
          <TmButton icon={Briefcase} onClick={() => navigate(`/transporter/${id}/jobs`)}>Jobs</TmButton>
          <TmButton tone="primary" icon={Pencil} onClick={() => navigate(`/transporter/${id}/edit`)}>Edit</TmButton>
        </>
      }
    >
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {loading && !t && <p className="text-sm text-slate-400">Loading…</p>}
      {t && (
        <>
          <TmStats
            items={[
              { label: 'Jobs Posted', value: fmtNum(data.jobCount), icon: Briefcase },
              { label: 'Active Jobs', value: fmtNum(data.activeJobCount), icon: CheckCircle2, iconClass: 'text-emerald-600' },
              { label: 'Subscription', value: PLAN[t.payment_type]?.[0] || 'None', icon: Gem },
              { label: 'Status', value: String(t.status) === '1' ? 'Active' : 'Inactive' },
            ]}
          />
          <TmSection title={t.name} subtitle={`${t.unique_id} · ${t.mobile}`} icon={Building2}>
            <div className="flex flex-col md:flex-row gap-6">
              <TmImage src={t.images || 'noimg.png'} className="w-28 h-28 rounded-xl" />
              <div className="flex-1">
                <TmDetails
                  items={[
                    ['Email', t.email], ['State', t.state_name], ['City', t.city], ['Address', t.address],
                    ['Transport Name', t.Transport_Name], ['Year of Establishment', LABELS.Year_of_Establishment[t.Year_of_Establishment] || t.Year_of_Establishment],
                    ['Company Registration Type', LABELS.company_registration_type[t.company_registration_type] || t.company_registration_type],
                    ['PAN Number', t.PAN_Number], ['GST Number', t.GST_Number],
                    ['Fleet Size', LABELS.Fleet_Size[t.Fleet_Size] || t.Fleet_Size], ['Average KM', LABELS.Average_KM[t.Average_KM] || t.Average_KM],
                    ['Operational Segment', asArray(t.Operational_Segment).join(', ')],
                    ['Vehicle Type', asArray(t.vehicle_type).map((v) => VEHICLES[v] || v).join(', ')],
                    ['Routes', asArray(t.routes).join(', ')],
                    ['Assigned TeleChamp', t.telechamp_name], ['Registered', fmtDate(t.Created_at || t.created_at, true)],
                    ['PAN Image', t.PAN_Image ? <TmImage key="p" src={t.PAN_Image} /> : null],
                    ['GST Certificate', t.GST_Certificate ? <TmImage key="g" src={t.GST_Certificate} /> : null],
                  ]}
                />
              </div>
            </div>
          </TmSection>
          <TmSection title="Payment History" icon={IndianRupee} flush>
            <TmTable
              rows={data.paymentHistory || []}
              minWidth={640}
              columns={[
                { key: 'payment_type', label: 'Plan', render: (p) => plan(p.payment_type) },
                { key: 'amount', label: 'Amount', render: (p) => fmtMoney(p.amount ?? p.payment_amount) },
                { key: 'payment_start_at', label: 'Start', render: (p) => when(p.payment_start_at || p.payment_date) },
                { key: 'payment_end_at', label: 'End', render: (p) => when(p.payment_end_at) },
                { key: 'created_at', label: 'Paid On', render: (p) => when(p.created_at) },
              ]}
            />
          </TmSection>
        </>
      )}
    </TmShell>
  );
}

// truckmitr.com: Transporter jobs + applied drivers (TruckInstituteForAdminController@transporter_job, view_apply_job_driver)
function TransporterJobs({ id }) {
  const [applied, setApplied] = useState(null);
  const openApplied = async (job) => {
    setApplied({ job, rows: [], loading: true });
    try {
      const d = await tmView(`/admin/apply-driver-job/${job.transporter_id}/${job.job_id}`);
      setApplied({ job, rows: d.job || [], loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setApplied(null);
    }
  };
  const config = {
    title: 'Jobs',
    listTitle: 'Jobs List',
    icon: Briefcase,
    crumbs: [{ label: 'Transporter', to: '/transporter' }, { label: 'Jobs' }],
    list: {
      path: `/admin/transporter-job/${id}`,
      key: 'transporter_job',
      minWidth: 1200,
      columns: () => [
        { key: 'job_id', label: 'Job Id', render: (row) => <span className="font-mono text-[11px] font-semibold text-blue-700">{row.job_id}</span> },
        { key: 'job_title', label: 'Job Title', render: (row) => <span className="font-semibold text-slate-900">{row.job_title}</span> },
        { key: 'job_location', label: 'Job Location' },
        { key: 'Required_Experience', label: 'Required Experience' },
        { key: 'Created_at', label: 'Job Post Date', render: (row) => fmtDate(row.Created_at || row.created_at) },
        { key: 'Application_Deadline', label: 'Application Deadline', render: (row) => fmtDate(row.Application_Deadline) },
        { key: 'applied', label: 'Applied Driver', render: (row) => <TmButton tone="soft" icon={Users} className="!px-2.5 !py-1" onClick={() => openApplied(row)}>View</TmButton> },
        { key: 'status', label: 'Job Approval Status', render: (row) => (String(row.status) === '1' ? <TmBadge tone="green">Approved</TmBadge> : <TmBadge tone="amber">Pending</TmBadge>) },
        { key: 'active_inactive', label: 'Active/Inactive', render: (row) => (Number(row.active_inactive) === 1 ? <TmBadge tone="green">Active</TmBadge> : <TmBadge>Inactive</TmBadge>) },
      ],
    },
    toggle: { path: (row) => `/admin/status_job/${row.id}`, method: 'get', isOn: (row) => String(row.status) === '1' },
    remove: { path: (row) => `/admin/delete_job/${row.id}`, method: 'get', label: (row) => `Delete the job ${row.job_id}?` },
  };
  return (
    <>
      <TmCrudPage key={id} config={config} />
      <TmModal open={Boolean(applied)} title="Applied Job List" subtitle={applied?.job?.job_title} onClose={() => setApplied(null)} size="lg">
        {applied && (
          <TmTable
            loading={applied.loading}
            rows={applied.rows}
            minWidth={560}
            columns={[
              { key: 'unique_id', label: 'TM Id', render: (r) => <span className="font-mono text-[11px]">{r.unique_id}</span> },
              { key: 'job_title', label: 'Job Title' },
              { key: 'name', label: 'Driver Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              { key: 'created_at', label: 'Applied Date', render: (r) => fmtDate(r.created_at, true) },
            ]}
          />
        )}
      </TmModal>
    </>
  );
}

// truckmitr.com: Edit transporter (TruckInstituteForAdminController@edit_transporter, update_transporter)
function TransporterEdit({ id }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tmView(`/admin/edit-transporter/${id}`)
      .then((d) => {
        setData(d);
        const u = d.user || {};
        setValues({
          ...u,
          Operational_Segment: asArray(u.Operational_Segment),
          vehicle_type: asArray(u.vehicle_type),
          routes: asArray(u.routes),
          images: undefined, PAN_Image: undefined, GST_Certificate: undefined,
        });
      })
      .catch((err) => notify.error(tmError(err).message));
  }, [id]);

  const user = data?.user;
  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const keys = ['images', 'name', 'mobile', 'email', 'address', 'city', 'states', 'Transport_Name', 'Year_of_Establishment', 'company_registration_type',
        'PAN_Number', 'GST_Number', 'Operational_Segment', 'vehicle_type', 'routes', 'Fleet_Size', 'Average_KM', 'Referral_Code', 'PAN_Image', 'GST_Certificate'];
      const result = await tmSend(`/admin/update-transporter/${id}`, Object.fromEntries(keys.map((k) => [k, values[k]])));
      notify.success(result?.message || 'Transporter updated');
      navigate(-1);
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TmShell
      title="Edit Transporter"
      crumbs={[{ label: 'Transporter', to: '/transporter' }, { label: user?.name || 'Edit' }]}
      actions={<TmButton tone="primary" icon={Save} busy={saving} onClick={save} disabled={!user}>Save Changes</TmButton>}
    >
      <TmSection title={user ? `${user.name} · ${user.unique_id}` : 'Profile Details'} icon={Building2}>
        {!user ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : (
          <TmForm
            values={values}
            onChange={setValues}
            errors={errors}
            fields={[
              { name: 'images', label: 'Profile Image', type: 'file', accept: 'image/*', current: user.images },
              { name: 'name', label: 'Name' },
              { name: 'mobile', label: 'Mobile' },
              { name: 'email', label: 'Email' },
              { name: 'address', label: 'Address' },
              { name: 'city', label: 'City' },
              { name: 'states', label: 'State', type: 'select', options: (data.states || []).map((s) => ({ value: s.id, label: s.name })) },
              { name: 'Transport_Name', label: 'Transport Name' },
              { name: 'Year_of_Establishment', label: 'Year of Establishment', type: 'select', options: opts(LABELS.Year_of_Establishment) },
              { name: 'company_registration_type', label: 'Company Registration Type', type: 'select', options: opts(LABELS.company_registration_type) },
              { name: 'PAN_Number', label: 'PAN Number' },
              { name: 'GST_Number', label: 'GST Number' },
              { name: 'Fleet_Size', label: 'Fleet Size', type: 'select', options: opts(LABELS.Fleet_Size) },
              { name: 'Average_KM', label: 'Average KM Run of Fleet', type: 'select', options: opts(LABELS.Average_KM) },
              { name: 'Referral_Code', label: 'Referral Code' },
              { name: 'Operational_Segment', label: 'Operational Segment', type: 'checkboxes', span: 2, options: SEGMENTS },
              { name: 'vehicle_type', label: 'Vehicle Type', type: 'checkboxes', span: 2, options: opts(VEHICLES) },
              { name: 'routes', label: 'Routes', type: 'checkboxes', span: 2, options: ROUTES },
              { name: 'PAN_Image', label: 'PAN Image', type: 'file', accept: 'image/*', current: user.PAN_Image },
              { name: 'GST_Certificate', label: 'GST Certificate', type: 'file', accept: 'image/*', current: user.GST_Certificate },
            ]}
          />
        )}
      </TmSection>
    </TmShell>
  );
}

export function TransporterDetail() {
  const { id, view } = useParams();
  if (view === 'jobs') return <TransporterJobs id={id} />;
  if (view === 'edit') return <TransporterEdit key={id} id={id} />;
  return <TransporterProfile id={id} />;
}

const CHECK = (on) => (Number(on) ? <TmBadge tone="green">Verified</TmBadge> : <TmBadge tone="red">Pending</TmBadge>);

// truckmitr.com: Admin › Transporter › Driver Verification (TransporterDriverVerificationController)
export function TransporterDriverVerification() {
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const [grouped, setGrouped] = useState({});
  const driversOf = (row) => grouped[row.transporter_id] || [];
  const config = {
    title: 'Transporter Driver Verification Management',
    listTitle: 'Driver Fleet Verifications',
    icon: ShieldCheck,
    crumbs: [{ label: 'Transporter' }, { label: 'Driver Verification' }],
    onData: (d) => setGrouped(d.driversGrouped || {}),
    stats: (d) => [
      { label: 'Total Payments', value: fmtNum(d.stats?.total_payments), icon: IndianRupee },
      { label: 'Completed Drivers', value: fmtNum(d.stats?.completed_drivers), icon: CheckCircle2, iconClass: 'text-emerald-600' },
      { label: 'Pending Drivers', value: fmtNum(d.stats?.pending_drivers), icon: Clock, iconClass: 'text-amber-600' },
      { label: 'Total Revenue', value: `₹${fmtNum(d.stats?.total_revenue)}`, icon: IndianRupee },
    ],
    headerActions: (ctx) => <TmExport path="/admin/transporter-driver-verification/export" params={ctx.filters} filename="transporter-driver-verification.xlsx" />,
    list: {
      path: '/admin/transporter-driver-verification',
      key: 'payments',
      rowKey: 'payment_id',
      minWidth: 1300,
      filters: [
        { name: 'transporter_id', type: 'text', placeholder: 'Transporter ID...' },
        { name: 'driver_name', type: 'text', placeholder: 'Driver name...' },
        { name: 'driver_mobile', type: 'text', placeholder: 'Driver mobile...' },
        { name: 'verification_status', placeholder: 'All Statuses', options: [{ value: 'completed', label: 'Completed' }, { value: 'partial', label: 'Partial' }, { value: 'pending', label: 'Pending' }] },
        { name: 'payment_type', placeholder: 'All Verification Types', options: [{ value: 'identity_verification', label: 'Identity Verification' }, { value: 'digital_verification', label: 'Digital Verification' }, { value: 'complete_verification', label: 'Complete Verification' }] },
        { name: 'amount', placeholder: 'All Amounts', options: [{ value: '199', label: '₹199' }, { value: '499', label: '₹499' }, { value: '1180', label: '₹1,180' }] },
        { name: 'date_from', type: 'date', placeholder: 'From' },
        { name: 'date_to', type: 'date', placeholder: 'To' },
      ],
      columns: () => [
        {
          key: 'toggle',
          label: '',
          render: (row) => (
            <button type="button" onClick={() => setOpen((o) => ({ ...o, [row.payment_id]: !o[row.payment_id] }))} className="p-1 rounded hover:bg-slate-100 cursor-pointer" title="Drivers">
              {open[row.payment_id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ),
        },
        { key: 'transporter_unique_id', label: 'Transporter ID', render: (row) => <span className="font-mono text-[11px]">{row.transporter_unique_id || `TR-${row.transporter_id}`}</span> },
        {
          key: 'transporter_name',
          label: 'Transporter Name',
          render: (row) => (
            <div>
              <p className="font-semibold text-slate-900">{row.transporter_name}</p>
              {open[row.payment_id] && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 min-w-[640px]">
                  {driversOf(row).length ? (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-slate-500 uppercase tracking-wider">
                          {['Driver ID', 'Driver Name', 'Driver Mobile', 'DL', 'PAN', 'Court', 'DAV', 'Overall'].map((h) => <th key={h} className="text-left py-1 pr-2">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {driversOf(row).map((d) => {
                          const score = Number(d.dl_verified) + Number(d.pan_verified) + Number(d.court_verified) + Number(d.dav_verified);
                          return (
                            <tr key={d.id} className="border-t border-slate-200">
                              <td className="py-1 pr-2 font-bold">DR-{d.id}</td>
                              <td className="py-1 pr-2">{d.name}</td>
                              <td className="py-1 pr-2">{d.mobile}</td>
                              <td className="py-1 pr-2">{CHECK(d.dl_verified)}</td>
                              <td className="py-1 pr-2">{CHECK(d.pan_verified)}</td>
                              <td className="py-1 pr-2">{CHECK(d.court_verified)}</td>
                              <td className="py-1 pr-2">{CHECK(d.dav_verified)}</td>
                              <td className="py-1 pr-2">{score === 4 ? <TmBadge tone="green">Completed</TmBadge> : score > 0 ? <TmBadge tone="amber">Partial</TmBadge> : <TmBadge tone="red">Pending</TmBadge>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p className="text-slate-400 py-2 text-center">No drivers added yet</p>}
                </div>
              )}
            </div>
          ),
        },
        { key: 'transporter_mobile', label: 'Mobile' },
        { key: 'payment_type', label: 'Payment Type', render: (row) => String(row.payment_type || '').replace(/_/g, ' ') },
        { key: 'amount', label: 'Amount', align: 'right', render: (row) => `₹${fmtNum(row.amount)}` },
        { key: 'payment_status', label: 'Payment Status', render: (row) => <TmBadge tone={row.payment_status === 'captured' ? 'green' : 'amber'}>{row.payment_status}</TmBadge> },
        { key: 'drivers', label: 'Total Drivers', align: 'center', render: (row) => driversOf(row).length },
        {
          key: 'progress',
          label: 'Verification Progress',
          render: (row) => {
            const drivers = driversOf(row);
            const total = drivers.length * 4;
            const done = drivers.reduce((s, d) => s + Number(d.dl_verified) + Number(d.pan_verified) + Number(d.court_verified) + Number(d.dav_verified), 0);
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div className="w-32">
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} /></div>
                <p className="text-[11px] text-slate-500 mt-1">{pct}% · {done}/{total} checks</p>
              </div>
            );
          },
        },
        { key: 'payment_date', label: 'Created Date', render: (row) => fmtDate(row.payment_date, true) },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Pencil} title="Edit transporter" tone="blue" onClick={() => navigate(`/transporter/${row.transporter_id}/edit`)} />,
  };
  return <TmCrudPage config={config} />;
}

export default TransporterList;
