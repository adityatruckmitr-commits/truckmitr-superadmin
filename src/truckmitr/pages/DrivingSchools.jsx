import React, { useState } from 'react';
import { GraduationCap, Users } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmView, tmError } from '../api';
import { TmBadge, TmIconButton, TmImage, TmModal, TmTable, fmtDate, notify } from '../ui';

const photo = (image) => (image ? `driver_images/${image}` : 'noimg.png');

// truckmitr.com: Admin › DTS (Driver Training School, TruckInstituteForAdminController)
export default function DrivingSchools() {
  const [drivers, setDrivers] = useState(null); // { school, rows, loading }

  const openDrivers = async (school) => {
    setDrivers({ school, rows: [], loading: true });
    try {
      const data = await tmView(`/admin/view-institute-driver/${school.id}`);
      setDrivers({ school, rows: data.driver || [], loading: false });
    } catch (err) {
      notify.error(tmError(err).message);
      setDrivers(null);
    }
  };

  const config = {
    title: 'Driver Training School',
    singular: 'Profile',
    listTitle: 'DTS List',
    icon: GraduationCap,
    crumbs: [{ label: 'DTS' }],
    list: {
      path: '/admin/view-truck-institute',
      key: 'institutes',
      search: (row, q) => `${row.unique_id} ${row.name} ${row.mobile} ${row.email}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search TM ID, name, mobile...',
      columns: () => [
        {
          key: 'unique_id',
          label: 'TM ID',
          render: (row) => (
            <button type="button" onClick={() => openDrivers(row)} className="font-mono text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer" title="View drivers">
              {row.unique_id}
            </button>
          ),
        },
        { key: 'image', label: 'Image', render: (row) => <TmImage src={photo(row.image)} className="w-9 h-9 rounded-full" /> },
        { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-slate-900">{row.name}</span> },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'Created_at', label: 'Date', render: (row) => fmtDate(row.Created_at || row.created_at) },
      ],
    },
    // Same toggle as the list's Active/Inactive badge (GET /institute/update-status/{id}/{status})
    toggle: {
      path: (row) => `/institute/update-status/${row.id}/${Number(row.status) === 0 ? 1 : 0}`,
      method: 'get',
      isOn: (row) => Number(row.status) !== 0,
    },
    rowActions: (row) => <TmIconButton icon={Users} title="Drivers" tone="green" onClick={() => openDrivers(row)} />,
    form: {
      editTitle: 'View / Edit Profile',
      size: 'xl',
      load: (row) => `/admin/edit-truck-institute/${row.id}`,
      fields: (row, data, formData) => [
        { name: 'images', label: 'Profile Image', type: 'file', accept: 'image/*', required: true, current: photo(row?.image), help: 'truckmitr.com requires the image on every update.' },
        { name: 'name', label: 'Name', required: true },
        { name: 'mobile', label: 'Mobile', required: true },
        { name: 'email', label: 'Email', required: true },
        { name: 'address', label: 'Address', required: true },
        { name: 'city', label: 'City', required: true },
        { name: 'states', label: 'State', type: 'select', required: true, options: (formData?.states || []).map((s) => ({ value: s.id, label: s.name })) },
        { name: 'Training_Institute_Name', label: 'Training Institute Name', required: true },
        { name: 'Number_of_Seats_Available', label: 'Number of Seats Available', required: true },
        { name: 'Monthly_Turnout', label: 'Monthly Turnout', required: true },
        { name: 'Language_of_Training', label: 'Language of Training', required: true },
        { name: 'Placement_Candidates', label: 'Placement Candidates', required: true },
        { name: 'Pay_Scale', label: 'Pay Scale', required: true },
      ],
      toValues: (row) => ({ ...row, images: undefined }),
      prepare: (v) => ({
        id: v.id, images: v.images, name: v.name, mobile: v.mobile, email: v.email, address: v.address, city: v.city, states: v.states,
        Training_Institute_Name: v.Training_Institute_Name, Number_of_Seats_Available: v.Number_of_Seats_Available,
        Monthly_Turnout: v.Monthly_Turnout, Language_of_Training: v.Language_of_Training,
        Placement_Candidates: v.Placement_Candidates, Pay_Scale: v.Pay_Scale,
      }),
      update: { path: () => '/admin/update-truck-institute' },
    },
  };

  return (
    <>
      <TmCrudPage config={config} />
      <TmModal open={Boolean(drivers)} title="Driver List" subtitle={drivers?.school?.name} onClose={() => setDrivers(null)} size="xl">
        {drivers && (
          <TmTable
            loading={drivers.loading}
            rows={drivers.rows}
            minWidth={720}
            columns={[
              { key: 'unique_id', label: 'TM ID', render: (r) => <span className="font-mono text-[11px]">{r.unique_id}</span> },
              { key: 'image', label: 'Image', render: (r) => <TmImage src={photo(r.image)} className="w-9 h-9 rounded-full" /> },
              { key: 'name', label: 'Name', render: (r) => <span className="font-semibold text-slate-900">{r.name}</span> },
              { key: 'mobile', label: 'Mobile' },
              { key: 'email', label: 'Email' },
              { key: 'status', label: 'Status', render: (r) => (String(r.status) === '0' ? <TmBadge tone="amber">Inactive</TmBadge> : <TmBadge tone="green">Active</TmBadge>) },
            ]}
          />
        )}
      </TmModal>
    </>
  );
}
