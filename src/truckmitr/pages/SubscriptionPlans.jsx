import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { tmSend, tmError, tmView } from '../api';
import {
  TmBadge, TmButton, TmForm, TmIconButton, TmModal, TmRefresh, TmSection, TmShell, TmTable, useTmView, fmtDate, notify,
} from '../ui';

const cap = (s) => (s ? String(s).replace(/^./, (c) => c.toUpperCase()) : '—');
const checksOf = (plan) => {
  let checks = plan.checks;
  if (typeof checks === 'string') {
    try { checks = JSON.parse(checks); } catch { checks = []; }
  }
  return Array.isArray(checks) ? checks.filter(Boolean) : [];
};
const nameOf = (plan) => String(plan?.name || '').toLowerCase();
const isJobPlan = (plan) => nameOf(plan).includes('_job');
const isVerificationPlan = (plan) => ['identity_verification', 'digital_verification', 'complete_verification'].includes(nameOf(plan));
const EMPTY_BENEFIT = { hindi: '', english: '', hinglish: '' };

// truckmitr.com: Admin › Subscription Plans (API\SubscriptionPlanController@index / create / edit / store)
export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const creating = useLocation().pathname.endsWith('/create');
  const { data, loading, error, reload } = useTmView('/admin/subscriptionplans');
  const [plan, setPlan] = useState(creating ? {} : null); // {} = new plan
  const [values, setValues] = useState({ is_recurring: '1', is_active: '1', checks: [] });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [checkOptions, setCheckOptions] = useState({});

  const open = async (row) => {
    setErrors({});
    setPlan(row || {});
    try {
      const d = await tmView(row ? `/admin/subscriptionplans/edit/${row.id}` : '/admin/subscriptionplans/create');
      setCheckOptions(d.checkOptions || {});
      const p = d.plan || {};
      setValues(
        row
          ? {
              ...p,
              is_recurring: String(Number(p.is_recurring)),
              is_active: String(Number(p.is_active ?? 1)),
              checks: checksOf(p),
              benefits: Array.isArray(p.benefits) && p.benefits.length ? p.benefits : [{ ...EMPTY_BENEFIT }],
            }
          : { is_recurring: '1', is_active: '1', checks: [] }
      );
    } catch (err) {
      notify.error(tmError(err).message);
      setPlan(null);
    }
  };

  // Opening /subscriptionplans/create shows the create form straight away
  React.useEffect(() => {
    if (creating) open(null);
  }, [creating]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setPlan(null);
    if (creating) navigate('/subscriptionplans');
  };

  const editing = Boolean(plan?.id);
  const recurring = values.is_recurring === '1';
  const showDuration = !(editing && (isJobPlan(plan) || isVerificationPlan(plan)));
  const showChecks = !isJobPlan(editing ? plan : values);
  const showBenefits = editing && recurring && plan.role === 'driver' && !isJobPlan(plan) && !isVerificationPlan(plan);
  const showJobLimit = (editing ? plan.role : values.role) === 'driver' && recurring;

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...(editing ? { id: plan.id, name: plan.name, role: plan.role, is_recurring: String(Number(plan.is_recurring)) } : { name: values.name, role: values.role, is_recurring: values.is_recurring }),
        amount: values.amount,
        duration_months: recurring && showDuration ? values.duration_months : undefined,
        is_active: values.is_active,
        job_limit: showJobLimit ? values.job_limit : undefined,
        checks: showChecks ? values.checks : undefined,
        benefits: showBenefits ? values.benefits : undefined,
      };
      const result = await tmSend('/admin/subscriptionplans/store', payload);
      notify.success(result?.message || (editing ? 'Plan updated' : 'Plan created'));
      close();
      reload();
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const setBenefit = (index, key, value) =>
    setValues((v) => ({ ...v, benefits: v.benefits.map((b, i) => (i === index ? { ...b, [key]: value } : b)) }));

  const groups = Object.entries(data?.planGroups || {});
  const labels = data?.checkOptions || {};

  return (
    <TmShell
      title="Subscription Plans"
      crumbs={[{ label: 'Subscription Plans' }]}
      actions={
        <>
          <TmRefresh onClick={reload} loading={loading} />
          <TmButton tone="primary" icon={Plus} onClick={() => open(null)}>Create Subscription Plan</TmButton>
        </>
      }
    >
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {groups.map(([title, plans]) => {
        const withDuration = title === 'Subscription Plans';
        const withChecks = title !== 'Job Plans';
        return (
          <TmSection key={title} title={title} subtitle={`${plans.length} plans`} icon={CreditCard} flush>
            <TmTable
              loading={loading}
              rows={plans}
              minWidth={1000}
              columns={[
                { key: 'name', label: 'Plan Name', render: (p) => <span className="font-semibold text-slate-900">{p.name}</span> },
                { key: 'role', label: 'Role', render: (p) => <TmBadge tone="blue">{cap(p.role)}</TmBadge> },
                { key: 'amount', label: 'Amount (INR)', align: 'right', render: (p) => Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
                { key: 'is_recurring', label: 'Recurring', render: (p) => (p.is_recurring ? <TmBadge tone="green">Yes</TmBadge> : <TmBadge>No</TmBadge>) },
                withDuration && { key: 'duration_months', label: 'Duration', render: (p) => (p.duration_months == null ? '—' : `${p.duration_months} Months`) },
                withDuration && { key: 'job_limit', label: 'Job Limit', render: (p) => (p.job_limit === -1 ? 'Unlimited' : p.job_limit ?? '—') },
                withChecks && {
                  key: 'checks',
                  label: 'Checks',
                  render: (p) => {
                    const checks = checksOf(p);
                    return checks.length ? (
                      <ul className="list-disc pl-4 space-y-0.5">{checks.map((c) => <li key={c}>{labels[c] || cap(c.replace(/_/g, ' '))}</li>)}</ul>
                    ) : '—';
                  },
                },
                { key: 'is_active', label: 'Status', render: (p) => (p.is_active ? <TmBadge tone="green">Active</TmBadge> : <TmBadge tone="red">Inactive</TmBadge>) },
                { key: 'created_at', label: 'Created At', render: (p) => fmtDate(p.created_at) },
                { key: 'action', label: 'Action', align: 'right', render: (p) => <TmIconButton icon={Pencil} title="Edit" tone="blue" onClick={() => open(p)} /> },
              ].filter(Boolean)}
            />
          </TmSection>
        );
      })}

      <TmModal
        open={plan !== null}
        title={editing ? 'Update Subscription Plan' : 'Create Subscription Plan'}
        subtitle={editing ? `${plan.name} · ${cap(plan.role)}` : ''}
        onClose={close}
        size="xl"
        footer={
          <>
            <TmButton onClick={close}>Cancel</TmButton>
            <TmButton tone="primary" busy={saving} onClick={save}>{editing ? 'Update Plan' : 'Create Plan'}</TmButton>
          </>
        }
      >
        <div className="space-y-5">
          <TmForm
            values={values}
            onChange={setValues}
            errors={errors}
            fields={[
              !editing && { name: 'name', label: 'Plan Name', required: true },
              !editing && {
                name: 'role', label: 'Role', type: 'select', required: true, placeholder: '-- Select Role --',
                options: ['driver', 'transporter', 'foreman', 'association'].map((r) => ({ value: r, label: cap(r) })),
              },
              !editing && { name: 'is_recurring', label: 'Recurring', type: 'select', required: true, options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
              { name: 'amount', label: 'Amount (INR)', type: 'number', required: true, min: 1 },
              showDuration && recurring && { name: 'duration_months', label: 'Duration (Months)', type: 'number', required: true },
              { name: 'is_active', label: 'Status', type: 'select', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] },
              showJobLimit && { name: 'job_limit', label: 'Job Limit', type: 'number', help: '-1 for unlimited' },
              showChecks && {
                name: 'checks', label: 'Checks', type: 'checkboxes', span: 2,
                options: Object.entries(checkOptions).map(([value, label]) => ({ value, label })),
              },
            ]}
          />
          {showBenefits && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Benefits (Hindi / English / Hinglish)</p>
                <TmButton
                  icon={Plus}
                  disabled={(values.benefits || []).length >= 10}
                  onClick={() => setValues((v) => ({ ...v, benefits: [...(v.benefits || []), { ...EMPTY_BENEFIT }] }))}
                >
                  Add Benefit
                </TmButton>
              </div>
              <div className="space-y-2">
                {(values.benefits || []).map((benefit, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                    {['hindi', 'english', 'hinglish'].map((lang) => (
                      <textarea
                        key={lang}
                        rows={2}
                        placeholder={cap(lang)}
                        value={benefit[lang] || ''}
                        onChange={(e) => setBenefit(i, lang, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ))}
                    <TmIconButton
                      icon={Trash2}
                      title="Remove"
                      tone="red"
                      onClick={() => setValues((v) => ({ ...v, benefits: v.benefits.length > 1 ? v.benefits.filter((_, j) => j !== i) : v.benefits }))}
                    />
                  </div>
                ))}
              </div>
              {errors.benefits && <p className="text-[11px] text-rose-600 mt-1">{errors.benefits[0] || errors.benefits}</p>}
            </div>
          )}
        </div>
      </TmModal>
    </TmShell>
  );
}
