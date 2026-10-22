import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, Leaf, Send } from 'lucide-react';
import TmCrudPage from '../CrudPage';
import { tmSend, tmError, tmView } from '../api';
import { TmBadge, TmButton, TmDetails, TmForm, TmIconButton, TmModal, fmtDate, notify } from '../ui';

// Option lists of the truckmitr.com GreenLine job form (greenline_job_details.blade.php)
const LOCATIONS = ['Maharashtra', 'Rajasthan', 'Tamil Nadu'];
const LICENSES = [
  { value: 'hmv', label: 'HMV (Heavy Motor Vehicle)' },
  { value: 'hgmv', label: 'HGMV (Heavy Goods Motor Vehicle)' },
  { value: 'hgmv/htv', label: 'HGMV (Heavy Goods Motor Vehicle) / HTV (Heavy Transport Vehicle)' },
];
const SKILLS = ['E-commerce', 'Hazardous', 'Chemicals', 'Gas Tankers', 'White Goods', 'Livestock', 'Perishable', 'Oversized', 'Fuel Tanker', 'Automobile Carrier', 'Construction Industry', 'Refrigerated Vehicle', 'Others'];

const skillsOf = (job) => {
  if (Array.isArray(job?.Preferred_Skills)) return job.Preferred_Skills;
  try { return JSON.parse(job?.Preferred_Skills || '[]') || []; } catch { return job?.Preferred_Skills ? [job.Preferred_Skills] : []; }
};
const isActive = (row) => Number(row.active_inactive) === 1 && Number(row.status) === 1;

// truckmitr.com: Admin › Job › GreenLine Pending / Submitted Jobs (AdminController)
export default function GreenlineJobs() {
  const submitted = useLocation().pathname.includes('submitted');
  const [listKey, setListKey] = useState(0);
  const [job, setJob] = useState(null); // { id, data, loading }
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const open = async (row) => {
    setJob({ id: row.job_id, loading: true });
    setErrors({});
    try {
      const data = await tmView(submitted ? `/admin/greenline-jobs-details-preview/${row.job_id}` : `/admin/greenline-jobs-details/${row.job_id}`);
      const j = data.Jobs || {};
      setJob({ id: row.job_id, data: j, loading: false });
      setValues({ ...j, Preferred_Skills: skillsOf(j), Application_Deadline: j.Application_Deadline ? String(j.Application_Deadline).slice(0, 10) : '' });
    } catch (err) {
      notify.error(tmError(err).message);
      setJob(null);
    }
  };

  const publish = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { job_title, job_location, vehicle_type, Required_Experience, Salary_Range, Type_of_License, Preferred_Skills, Application_Deadline, number_of_drivers_required, Job_Description } = values;
      const result = await tmSend(`/admin/greenline-jobs/publish/${job.id}`, {
        job_title, job_location, vehicle_type, Required_Experience, Salary_Range, Type_of_License, Preferred_Skills, Application_Deadline, number_of_drivers_required, Job_Description,
      });
      notify.success(result?.message || 'Job published');
      setJob(null);
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
    title: submitted ? 'GreenLine Submitted Jobs' : 'GreenLine Pending Jobs',
    listTitle: submitted ? 'Submitted Jobs' : 'Pending Jobs',
    icon: Leaf,
    crumbs: [{ label: 'Job', to: '/jobs' }, { label: submitted ? 'GreenLine Submitted Jobs' : 'GreenLine Pending Jobs' }],
    list: {
      path: submitted ? '/admin/greenline-submitted-jobs' : '/admin/greenline-pending-jobs',
      key: 'Jobs',
      rowKey: 'job_id',
      minWidth: 1500,
      search: (row, q) => `${row.job_id} ${row.job_title} ${row.job_location} ${row.vehicle_type}`.toLowerCase().includes(q),
      columns: () => [
        {
          key: 'job_id',
          label: 'Temp Job Id',
          render: (row) => (
            <button type="button" onClick={() => open(row)} className="font-mono text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer">{row.job_id}</button>
          ),
        },
        { key: 'job_title', label: 'Job Title', render: (row) => <span className="font-semibold text-slate-900">{row.job_title}</span> },
        { key: 'vehicle_type', label: 'Vehicle Type' },
        { key: 'Type_of_License', label: 'License Type' },
        { key: 'job_location', label: 'Job Location' },
        { key: 'Job_Description', label: 'Job Description', render: (row) => <span className="line-clamp-2 max-w-xs">{row.Job_Description}</span> },
        { key: 'Required_Experience', label: 'Required Experience' },
        { key: 'Preferred_Skills', label: 'Preferred Skills', render: (row) => <span className="line-clamp-2 max-w-xs">{skillsOf(row).join(', ')}</span> },
        { key: 'number_of_drivers_required', label: 'No. of Drivers Required', align: 'center' },
        { key: 'Created_at', label: 'Job Creation Date', render: (row) => fmtDate(row.Created_at || row.created_at) },
        { key: 'Application_Deadline', label: 'Application Deadline', render: (row) => fmtDate(row.Application_Deadline) },
        { key: 'active', label: 'Active/Inactive', render: (row) => <TmBadge tone={Number(row.active_inactive) === 1 ? 'green' : 'amber'}>{isActive(row) ? 'Active' : 'Inactive'}</TmBadge> },
      ],
    },
    rowActions: (row) => <TmIconButton icon={Eye} title={submitted ? 'Preview' : 'View / Edit'} tone="blue" onClick={() => open(row)} />,
  };

  return (
    <>
      <TmCrudPage key={`${submitted}-${listKey}`} config={config} />
      <TmModal
        open={Boolean(job)}
        title={submitted ? 'View GreenLine Job (Preview)' : 'View GreenLine Job'}
        subtitle={job ? `Temp Job Id ${job.id}` : ''}
        onClose={() => setJob(null)}
        size="xl"
        footer={
          submitted ? (
            <TmButton onClick={() => setJob(null)}>Close</TmButton>
          ) : (
            <>
              <TmButton onClick={() => setJob(null)}>Cancel</TmButton>
              <TmButton tone="primary" icon={Send} busy={saving} onClick={publish} disabled={job?.loading}>Publish Job</TmButton>
            </>
          )
        }
      >
        {job?.loading ? (
          <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
        ) : submitted && job ? (
          <TmDetails
            items={[
              ['Job Title', job.data.job_title], ['Job Location', job.data.job_location], ['Vehicle Type', job.data.vehicle_type],
              ['Required Experience', job.data.Required_Experience], ['Salary Range', job.data.Salary_Range], ['License Type', job.data.Type_of_License],
              ['Preferred Skills', skillsOf(job.data).join(', ')], ['Application Deadline', fmtDate(job.data.Application_Deadline)],
              ['No. of Drivers Required', job.data.number_of_drivers_required], ['Job Description', job.data.Job_Description],
            ]}
          />
        ) : job ? (
          <div className="space-y-5">
            <TmForm
              values={values}
              onChange={setValues}
              errors={errors}
              fields={[
                { name: 'job_title', label: 'Job Title', required: true },
                { name: 'job_location', label: 'Job Location', type: 'select', placeholder: 'Select Job Location', options: LOCATIONS },
                { name: 'vehicle_type', label: 'Vehicle Type', required: true },
                { name: 'Required_Experience', label: 'Required Experience', type: 'select', required: true, placeholder: 'Select experience range', options: [{ value: '3-5', label: '3+ years' }] },
                { name: 'Salary_Range', label: 'Salary Range', required: true },
                { name: 'Type_of_License', label: 'Type of License', type: 'select', required: true, placeholder: 'Select license type', options: LICENSES },
                { name: 'Application_Deadline', label: 'Application Deadline', type: 'date', required: true },
                { name: 'number_of_drivers_required', label: 'No. of Drivers Required', type: 'number', required: true, min: 1 },
                { name: 'Job_Description', label: 'Job Description', type: 'textarea', required: true },
              ]}
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Preferred Skills <span className="text-rose-600">*</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SKILLS.map((skill) => {
                  const on = (values.Preferred_Skills || []).includes(skill);
                  return (
                    <label key={skill} className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setValues((v) => ({ ...v, Preferred_Skills: on ? v.Preferred_Skills.filter((s) => s !== skill) : [...(v.Preferred_Skills || []), skill] }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      {skill}
                    </label>
                  );
                })}
              </div>
              {errors.Preferred_Skills && <p className="text-[11px] text-rose-600 mt-1">{errors.Preferred_Skills[0] || errors.Preferred_Skills}</p>}
            </div>
          </div>
        ) : null}
      </TmModal>
    </>
  );
}
