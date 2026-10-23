import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Gem, Pencil, Save, Star, Truck } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tm, tmSend, tmError, tmView } from '../api';
import { TmBadge, TmButton, TmExport, TmForm, TmIconButton, TmImage, TmSection, TmShell, fmtDate, notify } from '../ui';

const PLAN = {
  trusted: ['Trusted', 'blue'], verified: ['Verified', 'green'], job_ready: ['Job Ready', 'amber'], legacy: ['Legacy', 'red'],
};
const plan = (type) => {
  const [text, tone] = PLAN[type] || ['No Subscription', 'slate'];
  return <TmBadge tone={tone}>{text}</TmBadge>;
};
const stars = (n) => (
  <span className="inline-flex">
    {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />)}
  </span>
);
// payment_date is a timestamp on the subscribed list, a date string on the driver list
const when = (value) => (value ? fmtDate(/^\d+$/.test(String(value)) ? Number(value) : value, true) : 'N/A');

// Assigned TeleChamp is changed in place (POST /admin/update-driver-telechamp)
function TelechampSelect({ row, telechamps }) {
  const [value, setValue] = useState(row.assigned_to ?? '');
  const change = async (telechampId) => {
    setValue(telechampId);
    try {
      const fd = new FormData();
      fd.append('driver_id', row.id);
      fd.append('telechamp_id', telechampId);
      await tm.post('/admin/update-driver-telechamp', fd);
      notify.success('TeleChamp updated');
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };
  return (
    <select value={value} onChange={(e) => change(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
      <option value="">Select Telechamp</option>
      {telechamps.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}

// truckmitr.com: Admin › Driver Management › Driver List / Subscribed Drivers (AdminController@driver_list, subscribed_driver_list)
export function DriverList() {
  const navigate = useNavigate();
  const subscribed = useLocation().pathname.startsWith('/subscribed-drivers');
  const [telechamps, setTelechamps] = useState([]);

  const config = {
    title: subscribed ? 'Subscribed Driver List' : 'Driver List',
    listTitle: subscribed ? 'Subscribed Drivers' : 'Drivers',
    icon: subscribed ? Gem : Truck,
    crumbs: [{ label: 'Driver Management' }, { label: subscribed ? 'Subscribed Drivers' : 'Driver List' }],
    onData: (d) => setTelechamps(d.telechamps || []),
    headerActions: (ctx) => (
      <TmExport
        path={subscribed ? '/admin/subscribed-drivers/export' : '/admin/driver/export'}
        params={ctx.filters}
        filename={subscribed ? 'subscribed-drivers-list.xlsx' : 'driver-list.xlsx'}
      />
    ),
    list: {
      path: subscribed ? '/admin/subscribed-drivers' : '/admin/driver-list',
      key: 'driver',
      minWidth: 1900,
      filters: [
        { name: 'global_search', type: 'text', placeholder: 'Search name, mobile, TM ID, state...' },
        { name: 'added_by', placeholder: 'Added by', options: [{ value: 'transporter', label: 'Transporter' }, { value: 'self', label: 'Self' }] },
        { name: 'state_name', placeholder: 'State', options: (d) => (d?.states || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'status', placeholder: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
        { name: 'rating', placeholder: 'Rating', options: [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} Star` })) },
        { name: 'tier', placeholder: 'Ranking', options: ['Bronze', 'Silver', 'Gold', 'Diamond'] },
        !subscribed && { name: 'payment_status', placeholder: 'Payment status', options: [{ value: 'captured', label: 'Received' }, { value: 'not_received', label: 'Not Received' }] },
        { name: 'from_date', type: 'date', placeholder: 'Registered from' },
        { name: 'to_date', type: 'date', placeholder: 'Registered to' },
        { name: 'payment_from_date', type: 'date', placeholder: 'Payment from' },
        { name: 'payment_to_date', type: 'date', placeholder: 'Payment to' },
      ].filter(Boolean),
      columns: () => [
        { key: 'unique_id', label: 'TM ID', render: (row) => <span className="font-mono text-[11px] font-semibold text-blue-700">{row.unique_id}</span> },
        { key: 'sub_id', label: 'Driver Added By', render: (row) => (row.sub_id ? 'Added By Transporter' : 'Self') },
        { key: 'images', label: 'Image', render: (row) => <TmImage src={row.images || 'noimg.png'} className="w-9 h-9 rounded-full" /> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        {
          key: 'assigned_to',
          label: 'Assigned TeleChamp',
          render: (row) => (subscribed ? row.telechamp_name || 'N/A' : <TelechampSelect key={row.id} row={row} telechamps={telechamps} />),
        },
        { key: 'state_name', label: 'State', render: (row) => row.state_name || 'N/A' },
        { key: 'tm_rating', label: 'Rating', render: (row) => stars(row.tm_rating || 0) },
        { key: 'tm_tier', label: 'Ranking', render: (row) => row.tm_tier || 'N/A' },
        { key: 'tm_job_status', label: 'Job Status', render: (row) => row.tm_job_status ?? '—' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email', render: (row) => row.email || '—' },
        { key: 'payment_type', label: 'Subscription Type', render: (row) => plan(row.payment_type) },
        { key: 'payment_date', label: 'Subscription Date', render: (row) => when(row.payment_date) },
        subscribed && { key: 'payment_end_date', label: 'Subscription Expire At', render: (row) => when(row.payment_end_date) },
        { key: 'Created_at', label: 'Registration Date', render: (row) => fmtDate(row.Created_at, true) },
      ].filter(Boolean),
    },
    toggle: { path: (row) => `/admin/status_driver/${row.id}`, method: 'get', isOn: (row) => String(row.status) === '1' },
    rowActions: (row) => <TmIconButton icon={Pencil} title="Edit" tone="blue" onClick={() => navigate(`/driver-list/edit/${row.id}`)} />,
    remove: { path: (row) => `/admin/delete-truck-driver/${row.id}`, method: 'get', label: (row) => `Delete the driver ${row.name} (${row.unique_id})?` },
  };
  return <TmCrudPage key={subscribed ? 'subscribed' : 'all'} config={config} />;
}

const asArray = (value) => {
  if (Array.isArray(value)) return value.map(String);
  try { const v = JSON.parse(value || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
};
const ROUTES = [['local', 'Local Delivery'], ['intracity', 'Intracity'], ['intercity', 'Intercity'], ['interstate', 'Interstate'], ['all_india', 'All India']];
const ENDORSEMENTS = ['Tractor-Trailer (Commercial)', 'roller', 'tractor', 'hazardous', 'hill', 'forklift', 'others'];

// truckmitr.com: Update Driver (AdminController@update_driver)
export function DriverEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tmView(`/admin/update-truck-driver/${id}`)
      .then((d) => {
        setData(d);
        const driver = Array.isArray(d.result) ? d.result[0] : d.result;
        if (driver) {
          setValues({
            ...driver,
            DOB: driver.DOB ? String(driver.DOB).slice(0, 10) : '',
            Expiry_date_of_License: driver.Expiry_date_of_License ? String(driver.Expiry_date_of_License).slice(0, 10) : '',
            vehicle_type: asArray(driver.vehicle_type),
            routes: asArray(driver.routes),
            licence_endorsement: asArray(driver.licence_endorsement),
            images: undefined,
            Driving_License: undefined,
          });
        }
      })
      .catch((err) => notify.error(tmError(err).message));
  }, [id]);

  const driver = data ? (Array.isArray(data.result) ? data.result[0] : data.result) : null;
  const states = (data?.states || []).map((s) => ({ value: s.id, label: s.name }));

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const keys = ['name', 'email', 'mobile', 'Father_Name', 'DOB', 'vehicle_type', 'Sex', 'Marital_Status', 'Highest_Education', 'Driving_Experience',
        'Type_of_License', 'License_Number', 'Expiry_date_of_License', 'address', 'city', 'states', 'Preferred_Location', 'Current_Monthly_Income',
        'routes', 'licence_endorsement', 'voter_id', 'Expected_Monthly_Income', 'job_placement', 'previous_employer', 'images', 'Driving_License'];
      const payload = Object.fromEntries(keys.map((k) => [k, values[k]]));
      const result = await tmSend(`/admin/update-truck-driver/${id}`, payload);
      notify.success(result?.message || 'Driver updated');
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
      title="Update Driver"
      crumbs={[{ label: 'Driver Management', to: '/driver-list' }, { label: driver?.name || 'Update Driver' }]}
      actions={<TmButton tone="primary" icon={Save} busy={saving} onClick={save} disabled={!driver}>Update Driver</TmButton>}
    >
      <TmSection title={driver ? `${driver.name} · ${driver.unique_id}` : 'Driver'} icon={Truck}>
        {!driver ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : (
          <TmForm
            values={values}
            onChange={setValues}
            errors={errors}
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'email', label: 'Email', required: true },
              { name: 'mobile', label: 'Mobile', required: true },
              { name: 'Father_Name', label: "Father's Name", required: true },
              { name: 'DOB', label: 'Date of Birth', type: 'date', required: true },
              { name: 'Sex', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
              { name: 'Marital_Status', label: 'Marital Status', type: 'select', required: true, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
              { name: 'Highest_Education', label: 'Highest Education', required: true },
              { name: 'Driving_Experience', label: 'Driving Experience (years)', type: 'number', required: true },
              { name: 'Type_of_License', label: 'Type of License', required: true },
              { name: 'License_Number', label: 'License Number', required: true },
              { name: 'Expiry_date_of_License', label: 'Expiry Date of License', type: 'date', required: true },
              { name: 'address', label: 'Address', required: true },
              { name: 'city', label: 'City', required: true },
              { name: 'states', label: 'State', type: 'select', required: true, placeholder: 'Select State', options: states },
              { name: 'Preferred_Location', label: 'Preferred Location', type: 'select', required: true, placeholder: 'Select Desired State', options: states },
              { name: 'Current_Monthly_Income', label: 'Current Monthly Income', required: true },
              { name: 'Expected_Monthly_Income', label: 'Expected Monthly Income', required: true },
              { name: 'job_placement', label: 'Job Placement', type: 'select', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
              { name: 'previous_employer', label: 'Previous Employer', type: 'select', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
              { name: 'voter_id', label: 'Voter ID' },
              { name: 'vehicle_type', label: 'Vehicle Type', type: 'checkboxes', span: 2, options: (data?.vehicle_type || []).map((v) => ({ value: v.id, label: v.vehicle_name })) },
              { name: 'routes', label: 'Routes', type: 'checkboxes', span: 2, options: ROUTES.map(([value, label]) => ({ value, label })) },
              { name: 'licence_endorsement', label: 'Licence Endorsement', type: 'checkboxes', span: 2, options: ENDORSEMENTS.map((e) => ({ value: e, label: e.replace(/^./, (c) => c.toUpperCase()) })) },
              { name: 'images', label: 'Profile Image', type: 'file', accept: 'image/*', current: driver.images },
              { name: 'Driving_License', label: 'Driving License', type: 'file', accept: 'image/*', current: driver.Driving_License },
            ]}
          />
        )}
      </TmSection>
    </TmShell>
  );
}

export default DriverList;
