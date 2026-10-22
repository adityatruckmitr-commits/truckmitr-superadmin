import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileSpreadsheet, ImagePlus, Pencil, Plus, Save, Truck } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmSend, tmError, tmView } from '../api';
import { TmButton, TmForm, TmIconButton, TmImage, TmSection, TmShell, notify } from '../ui';

// Spec fields of the truckmitr.com Add Truck / Edit Truck form, in its order and with its labels
const SPEC_FIELDS = [
  ['Product_specification', 'Product Specification'], ['Vehicle_model', 'Vehicle Model'], ['Engine_make', 'Engine Make'],
  ['Engine_model', 'Engine Model'], ['Engine_HP', 'Engine HP'], ['Engine_capacity', 'Engine Capacity (cc)'],
  ['No_of_cylinders', 'No of Cylinders'], ['MAX_Engine_output', 'MAX Engine Output'], ['MAX_Torque', 'MAX. Torque'],
  ['OD_of_clutch_lining', 'O.D of Clutch Lining (mm)'], ['Clutch_type', 'Clutch Type'], ['Type_of_actuation', 'Type of Actuation'],
  ['Gear_Box_Model', 'Gear Box Model'], ['No_of_gears', 'No. of Gears'], ['Min_Turning_circle_dia', 'Min. Turning Circle Dia (mm)'],
  ['Wheel_base', 'Wheel Base (mm)'], ['Overall_Length', 'Overall Length (mm)'], ['Overall_Height', 'Overall Height (mm)'],
  ['Overall_Width', 'Overall Width (mm)'], ['Ground_clearance', 'Ground Clearance (mm)'], ['Max_Permissible_GVW', 'Max. Permissible GVW'],
  ['Fuel_tank_Capacity', 'Fuel Tank Capacity'], ['Steering_type', 'Steering Type'], ['Suspension_Type_Front', 'Suspension Type Front'],
  ['Suspension_Type_Rear', 'Suspension Type Rear'], ['Wheels', 'Wheels'],
];
const SPEC_FIELDS_2 = [
  ['Battery', 'Battery'], ['Brakes_type', 'Brakes Type'], ['Parking_brake', 'Parking Brake'],
  ['Auxiliary_Braking_System', 'Auxiliary Braking System'], ['Frame_type', 'Frame Type'], ['Diesel_Exhaust_Fluid', 'Diesel Exhaust Fluid (DEF)'],
  ['Front_axle_Type', 'Front Axle Type'], ['Rear_axle_Model', 'Rear Axle Model'], ['Rear_axle_Ratio', 'Rear Axle Ratio'],
  ['Cabin_type', 'Cabin Type'], ['Standard_features', 'Standard Features'], ['Maximum_gradebility', 'Maximum Gradebility'],
  ['Price_Range', 'Price Range'], ['max_price', 'Max Price'],
];

const options = (list, value, label = value) => (list || []).map((item) => ({ value: item[value], label: item[label] }));

function truckFields(d, editing, current) {
  const text = ([name, label]) => ({ name, label, required: true });
  return [
    { name: 'brand_id', label: 'Select Brand', type: 'select', required: true, options: options(d?.brand, 'id', 'name') },
    { name: 'oem_name', label: 'OEM Name', required: true },
    { name: 'slug', label: 'OEM Name Slug', required: true },
    { name: 'Vehicle_type', label: 'Vehicle Type', type: 'select', required: true, options: options(d?.Vehicletype, 'vehicle_name') },
    ...SPEC_FIELDS.map(text),
    { name: 'No_of_tyres', label: 'No. of Tyres', type: 'select', required: true, options: options(d?.TyresCount, 'tyres_type') },
    ...SPEC_FIELDS_2.map(text),
    { name: 'fule_type', label: 'Fuel Type', type: 'select', required: true, options: options(d?.Fueltype, 'fuel_type_name') },
    { name: 'Gvm', label: 'Select GVW', type: 'select', required: true, options: options(d?.Gvm, 'gvm_name') },
    { name: 'add_application', label: 'Vehicle Application', type: 'multiselect', required: !editing, options: options(d?.VehicleApplication, 'vehicle_application_name') },
    { name: 'images', label: 'Featured Image (650 x 373 px)', type: 'file', accept: 'image/*', required: !editing, current: current?.images },
    { name: 'multi_image', label: 'Product Gallery (650 x 373 px)', type: 'file', accept: 'image/*', multiple: true },
    { name: 'brochure_pdf', label: 'Truck Brochure (only PDF)', type: 'file', accept: 'application/pdf', required: !editing },
    { name: 'Description', label: 'Description', type: 'textarea', required: true, rows: 5 },
  ];
}

// truckmitr.com: Admin › Truck Listings › Add Truck / Edit Truck (AdminController@add_truck, truck_update)
function TruckForm({ id }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [bulk, setBulk] = useState({});

  useEffect(() => {
    tmView(id ? `/admin/truck_update/${id}` : '/admin/add-truck')
      .then((d) => {
        setData(d);
        const truck = id ? (Array.isArray(d.truck) ? d.truck[0] : d.truck) : null;
        if (truck) {
          let apps = [];
          try { apps = JSON.parse(truck.add_application || '[]') || []; } catch { apps = []; }
          setValues({ ...truck, add_application: apps, images: undefined, brochure_pdf: undefined, multi_image: undefined });
        }
      })
      .catch((err) => notify.error(tmError(err).message));
  }, [id]);

  const truck = id && data ? (Array.isArray(data.truck) ? data.truck[0] : data.truck) : null;

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { id: _id, created_at, updated_at, compare_id, ...payload } = values;
      Object.keys(payload).forEach((key) => (payload[key] === null || payload[key] === undefined) && delete payload[key]);
      const result = await tmSend(id ? `/admin/truck_update/${id}` : '/admin/create_truck', payload);
      notify.success(result?.message || (id ? 'Truck updated' : 'Truck added'));
      navigate('/truck-list');
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const upload = async (path, field) => {
    try {
      const result = await tmSend(path, { [field]: bulk[field] });
      notify.success(result?.message || 'Uploaded');
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  return (
    <TmShell
      title={id ? 'Edit Truck' : 'Add Truck'}
      crumbs={[{ label: 'Truck Listings', to: '/truck-list' }, { label: id ? 'Edit Truck' : 'Add Truck' }]}
      actions={<TmButton tone="primary" icon={Save} busy={saving} onClick={save} disabled={!data}>{id ? 'Update Truck' : 'Save Truck'}</TmButton>}
    >
      <TmSection title={id ? `Edit ${truck?.oem_name || 'Truck'}` : 'Truck Details'} icon={Truck}>
        {!data ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : (
          <MultiSelectForm fields={truckFields(data, Boolean(id), truck)} values={values} onChange={setValues} errors={errors} />
        )}
        <div className="flex justify-end pt-5 mt-5 border-t border-slate-100">
          <TmButton tone="primary" icon={Save} busy={saving} onClick={save} disabled={!data}>{id ? 'Update Truck' : 'Save Truck'}</TmButton>
        </div>
      </TmSection>

      {!id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TmSection title="Upload Excel Sheet" subtitle="Bulk add trucks (.xlsx, .xls, .csv)" icon={FileSpreadsheet}>
            <TmForm fields={[{ name: 'file', label: 'Excel', type: 'file', accept: '.xlsx,.xls,.csv', required: true, span: 2 }]} values={bulk} onChange={setBulk} />
            <div className="mt-4"><TmButton tone="primary" onClick={() => upload('/admin/import', 'file')}>Upload</TmButton></div>
          </TmSection>
          <TmSection title="Upload Bulk Image" subtitle="Truck images as a .zip file" icon={ImagePlus}>
            <TmForm fields={[{ name: 'zip_file', label: 'Image (.zip file)', type: 'file', accept: '.zip', required: true, span: 2 }]} values={bulk} onChange={setBulk} />
            <div className="mt-4"><TmButton tone="primary" onClick={() => upload('/admin/importimage', 'zip_file')}>Upload</TmButton></div>
          </TmSection>
        </div>
      )}
    </TmShell>
  );
}

// TmForm plus a checkbox list for multi-select fields (Vehicle Application)
function MultiSelectForm({ fields, values, onChange, errors }) {
  const multi = fields.filter((f) => f.type === 'multiselect');
  return (
    <div className="space-y-5">
      <TmForm fields={fields.filter((f) => f.type !== 'multiselect')} values={values} onChange={onChange} errors={errors} />
      {multi.map((field) => {
        const selected = values[field.name] || [];
        const toggle = (value) =>
          onChange({ ...values, [field.name]: selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value] });
        return (
          <div key={field.name}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              {field.label} {field.required && <span className="text-rose-600">*</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {field.options.map((o) => (
                <label key={o.value} className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${selected.includes(o.value) ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" className="hidden" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
            {errors?.[field.name] && <p className="text-[11px] text-rose-600 mt-1">{errors[field.name][0] || errors[field.name]}</p>}
          </div>
        );
      })}
    </div>
  );
}

// Compare Id is edited in place, like the truckmitr.com list (POST /update-trucklist)
function CompareId({ row }) {
  const [value, setValue] = useState(row.compare_id ?? '');
  const save = async () => {
    if (value === '' || String(value) === String(row.compare_id ?? '')) return;
    try {
      const result = await tmSend('/update-trucklist', { id: row.id, compare_id: value });
      if (result?.success === false) throw new Error(result.message || 'Failed to update record.');
      notify.success(result?.message || 'Record updated successfully!');
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-20 px-2 py-1 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

// truckmitr.com: Admin › Truck Listings › Truck List (AdminController@truck_list)
function TruckList() {
  const navigate = useNavigate();
  const config = {
    title: 'Truck List',
    listTitle: 'Trucks',
    icon: Truck,
    crumbs: [{ label: 'Truck Listings' }, { label: 'Truck List' }],
    headerActions: () => <TmButton tone="primary" icon={Plus} onClick={() => navigate('/add-truck')}>Add Truck</TmButton>,
    list: {
      path: '/admin/truck-list',
      key: 'Trucklist',
      search: (row, q) => `${row.oem_name} ${row.Vehicle_type} ${row.Vehicle_model}`.toLowerCase().includes(q),
      searchPlaceholder: 'Search OEM, type, model...',
      columns: () => [
        { key: 'oem_name', label: 'OEM Name', render: (row) => <span className="font-semibold text-slate-900">{row.oem_name}</span> },
        { key: 'Vehicle_type', label: 'Vehicle Type' },
        { key: 'Vehicle_model', label: 'Vehicle Model' },
        { key: 'compare_id', label: 'Compare Id', render: (row) => <CompareId row={row} /> },
        { key: 'images', label: 'Images', render: (row) => <TmImage src={row.images} /> },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Pencil} title="Edit" tone="blue" onClick={() => navigate(`/truck-list/edit/${row.id}`)} />,
    remove: {
      path: (row) => `/admin/truck_delete/${row.id}`,
      method: 'get',
      label: (row) => `Delete ${row.oem_name} ${row.Vehicle_model || ''}?`,
    },
  };
  return <TmCrudPage config={config} />;
}

export function TruckEditor() {
  const { id } = useParams();
  return <TruckForm key={id || 'new'} id={id} />;
}

export default TruckList;
