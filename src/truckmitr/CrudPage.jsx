// A truckmitr.com admin list with its create / edit / delete / status actions, driven by a config:
//
// {
//   title, subtitle, crumbs, icon,
//   list: { path, key, columns, rowKey?, params?, search?: (row, q) => bool, filters?: [{ name, placeholder, options }] },
//   form?: { fields | (row, data, formData) => fields, toValues?(row), create?: { path, method }, update?: { path(row), method },
//            load?: path | (row) => path (the create/edit page's data, passed to fields as formData),
//            title?, size?, prepare?(values, row) },
//   remove?: { path(row), method, label?(row) },
//   toggle?: { path(row), method, isOn(row) },
//   rowActions?: (row, ctx) => node, headerActions?: (ctx) => node, below?: (ctx) => node, stats?: (data) => items
// }
import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { tmSend, tmError, tmView } from './api';
import {
  TmShell, TmSection, TmTable, TmPager, TmSearch, TmSelect, TmButton, TmIconButton, TmModal, TmForm, TmConfirm,
  TmRefresh, TmStats, TmDate, useTmView, useDebounced, rowsOf, notify,
} from './ui';

// Server-side search box: applied after typing stops
function FilterText({ value, placeholder, onApply }) {
  const [draft, setDraft] = useState(value || '');
  const debounced = useDebounced(draft, 450);
  useEffect(() => {
    if ((debounced || '') !== (value || '')) onApply(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  return <TmSearch value={draft} onChange={setDraft} placeholder={placeholder} />;
}

export default function TmCrudPage({ config }) {
  const { list, form, remove, toggle } = config;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const params = useMemo(() => ({ ...(list.params || {}), ...filterValues, ...(page > 1 ? { page } : {}) }), [list.params, filterValues, page]);
  const { data, loading, error, reload } = useTmView(list.path, params);

  const [editing, setEditing] = useState(null); // {row|null}
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { onData } = config;
  useEffect(() => {
    if (data) onData?.(data);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const source = data?.[list.key];
  const allRows = rowsOf(source);
  const rows = query && list.search ? allRows.filter((row) => list.search(row, query.toLowerCase())) : allRows;
  const pager = source && !Array.isArray(source) && source.last_page ? source : null;
  const ctx = { data, reload, setBusyId, busyId, filters: filterValues };

  const [formData, setFormData] = useState(null); // data of the create/edit page (form.load), e.g. select options

  const openForm = (row = null) => {
    setEditing({ row });
    setErrors({});
    setValues(row ? (form.toValues ? form.toValues(row, data) : { ...row }) : { ...(form.defaults || {}) });
    setFormData(null);
    if (form.load) {
      tmView(typeof form.load === 'function' ? form.load(row) : form.load)
        .then((loaded) => {
          setFormData(loaded);
          if (row && form.toValuesFromLoad) setValues(form.toValuesFromLoad(loaded, row));
        })
        .catch((err) => notify.error(tmError(err).message));
    }
  };

  const save = async () => {
    const row = editing?.row;
    const target = row ? form.update : form.create;
    setSaving(true);
    setErrors({});
    try {
      const payload = form.prepare ? form.prepare(values, row) : values;
      const result = await tmSend(typeof target.path === 'function' ? target.path(row) : target.path, payload, target.method || 'post');
      notify.success(result?.message || 'Saved successfully');
      setEditing(null);
      reload();
    } catch (err) {
      const { message, errors: fieldErrors } = tmError(err);
      setErrors(fieldErrors);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const result = await tmSend(remove.path(deleting), {}, remove.method || 'delete');
      notify.success(result?.message || 'Deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      notify.error(tmError(err).message);
    }
  };

  const flip = async (row) => {
    setBusyId(row[list.rowKey || 'id']);
    try {
      const result = await tmSend(toggle.path(row), {}, toggle.method || 'post');
      notify.success(result?.message || 'Status updated');
      reload();
    } catch (err) {
      notify.error(tmError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    ...list.columns(ctx),
    ...(toggle
      ? [{
          key: '__status',
          label: 'Status',
          render: (row) => {
            const on = toggle.isOn(row);
            return (
              <button
                type="button"
                disabled={busyId === row[list.rowKey || 'id']}
                onClick={() => flip(row)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer disabled:opacity-50 ${
                  on ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {on ? 'Active' : 'Inactive'}
              </button>
            );
          },
        }]
      : []),
    ...(form?.update || remove || config.rowActions
      ? [{
          key: '__actions',
          label: 'Actions',
          align: 'right',
          render: (row) => (
            <div className="flex items-center justify-end gap-0.5">
              {config.rowActions?.(row, ctx)}
              {form?.update && <TmIconButton icon={Pencil} title="Edit" tone="blue" onClick={() => openForm(row)} />}
              {remove && <TmIconButton icon={Trash2} title="Delete" tone="red" onClick={() => setDeleting(row)} />}
            </div>
          ),
        }]
      : []),
  ];

  const fields = editing ? (typeof form.fields === 'function' ? form.fields(editing.row, data, formData, values) : form.fields) : [];

  return (
    <TmShell
      title={config.title}
      subtitle={config.subtitle}
      crumbs={config.crumbs || [{ label: config.title }]}
      actions={
        <>
          {config.headerActions?.(ctx)}
          <TmRefresh onClick={reload} loading={loading} />
          {form?.create && (
            <TmButton tone="primary" icon={Plus} onClick={() => openForm(null)}>
              {form.createLabel || 'Add New'}
            </TmButton>
          )}
        </>
      }
    >
      {config.stats && data && <TmStats items={config.stats(data)} />}
      {config.above?.(ctx)}
      <TmSection
        title={config.listTitle || `${config.title} List`}
        subtitle={pager ? `${pager.total} records` : `${rows.length} records`}
        icon={config.icon}
        flush
        right={
          <>
            {(list.filters || []).map((f) => {
              const apply = (v) => { setFilterValues((prev) => ({ ...prev, [f.name]: v })); setPage(1); };
              if (f.type === 'text') return <FilterText key={f.name} value={filterValues[f.name]} placeholder={f.placeholder} onApply={apply} />;
              if (f.type === 'date') return <TmDate key={f.name} title={f.placeholder} value={filterValues[f.name]} onChange={apply} />;
              return (
                <TmSelect
                  key={f.name}
                  value={filterValues[f.name]}
                  placeholder={f.placeholder}
                  options={typeof f.options === 'function' ? f.options(data) : f.options}
                  onChange={apply}
                />
              );
            })}
            {list.search && <TmSearch value={query} onChange={setQuery} placeholder={list.searchPlaceholder || 'Search...'} />}
          </>
        }
      >
        <TmTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          rowKey={list.rowKey || 'id'}
          startIndex={pager ? pager.from || 1 : 1}
          minWidth={list.minWidth}
        />
        <TmPager pager={pager} onPage={setPage} />
      </TmSection>
      {config.below?.(ctx)}

      {form && (
        <TmModal
          open={Boolean(editing)}
          title={editing?.row ? (form.editTitle || `Edit ${config.singular || 'Record'}`) : (form.createTitle || `Add ${config.singular || 'Record'}`)}
          size={form.size || 'lg'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <TmButton onClick={() => setEditing(null)}>Cancel</TmButton>
              <TmButton tone="primary" busy={saving} onClick={save}>{editing?.row ? 'Update' : 'Save'}</TmButton>
            </>
          }
        >
          <TmForm fields={fields} values={values} onChange={setValues} errors={errors} />
        </TmModal>
      )}

      {remove && (
        <TmConfirm
          open={Boolean(deleting)}
          message={deleting ? (remove.label ? remove.label(deleting) : 'This record will be deleted permanently.') : ''}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </TmShell>
  );
}
