// Building blocks for the truckmitr.com admin screens, in the console's design (white cards, slate borders,
// blue-700 actions, 11px uppercase table headers) - see pages/Departments/DepartmentMaster.jsx.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, Search, X, Inbox,
} from 'lucide-react';
import { tmView, tmError, tmDownload, tmFile } from './api';

export const cx = (...classes) => classes.filter(Boolean).join(' ');

// ---- data -----------------------------------------------------------------------------------

/** Loads a truckmitr.com admin page's data; reloads when path or params change. */
export function useTmView(path, params = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = JSON.stringify(params);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const id = ++seq.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await tmView(path, JSON.parse(key));
      if (id === seq.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === seq.current) setState((prev) => ({ ...prev, loading: false, error: tmError(error).message }));
    }
  }, [path, key]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}

/** Filters kept in state, with page reset to 1 whenever another filter changes. */
export function useFilters(initial) {
  const [filters, setFilters] = useState(initial);
  const set = useCallback((patch) => setFilters((prev) => ({ ...prev, page: 1, ...patch })), []);
  return [filters, set, setFilters];
}

/** Debounced copy of a value (search boxes). */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Runs an action (save/delete/toggle) with a toast for the outcome; returns true on success. */
export async function runAction(action, successMessage) {
  try {
    const result = await action();
    toast.success(result?.message || successMessage || 'Done');
    return true;
  } catch (error) {
    toast.error(tmError(error).message);
    return false;
  }
}

export const notify = toast;

// ---- formatting -----------------------------------------------------------------------------

export const fmtDate = (value, withTime = false) => {
  if (!value) return '—';
  const d = value instanceof Date
    ? value
    : typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export const fmtMoney = (value) =>
  value === null || value === undefined || value === '' ? '—' : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const fmtNum = (value) => (value === null || value === undefined ? '—' : Number(value).toLocaleString('en-IN'));

/** Rows of a Laravel paginator, a plain array or a keyed object. */
export const rowsOf = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  return Object.values(value);
};

// ---- layout ---------------------------------------------------------------------------------

export function TmShell({ title, subtitle, crumbs = [], actions, children }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full space-y-5 font-sans text-slate-800 antialiased">
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-6 py-4 rounded-xl shadow-xs border border-slate-200">
        <div className="min-w-0">
          <h1 className="text-[24px] leading-tight font-bold text-slate-900 tracking-tight">{title}</h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <li>
                <span onClick={() => navigate('/')} className="hover:text-slate-700 cursor-pointer">Dashboard</span>
              </li>
              {crumbs.map((crumb) => (
                <React.Fragment key={crumb.label}>
                  <li className="text-slate-300">/</li>
                  <li>
                    {crumb.to ? (
                      <span onClick={() => navigate(crumb.to)} className="hover:text-slate-700 cursor-pointer">{crumb.label}</span>
                    ) : (
                      <span className="text-slate-900 font-semibold">{crumb.label}</span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function TmSection({ title, subtitle, icon: Icon, right, children, flush = false, className }) {
  return (
    <section className={cx('bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden', className)}>
      {(title || right) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end">{right}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

const TONES = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function TmBadge({ tone = 'slate', children, className }) {
  return (
    <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap', TONES[tone] || TONES.slate, className)}>
      {children}
    </span>
  );
}

export function TmStats({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.filter(Boolean).map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">{item.label}</p>
              {Icon && <Icon className={cx('w-4 h-4 shrink-0', item.iconClass || 'text-blue-600')} />}
            </div>
            <p className="mt-1.5 text-xl font-bold text-slate-900 tabular-nums">{item.value ?? '—'}</p>
            {item.hint && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ---- controls -------------------------------------------------------------------------------

const BUTTON_TONES = {
  primary: 'bg-blue-700 hover:bg-blue-800 text-white border-blue-700',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  soft: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
};

export function TmButton({ tone = 'secondary', icon: Icon, busy, children, className, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        BUTTON_TONES[tone], className
      )}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

const ICON_TONES = {
  blue: 'text-blue-600 hover:bg-blue-50',
  red: 'text-rose-600 hover:bg-rose-50',
  green: 'text-emerald-600 hover:bg-emerald-50',
  slate: 'text-slate-500 hover:bg-slate-100',
  amber: 'text-amber-600 hover:bg-amber-50',
};

export function TmIconButton({ icon: Icon, title, tone = 'slate', onClick, busy }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={busy}
      className={cx('p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50', ICON_TONES[tone])}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    </button>
  );
}

const inputClass = 'w-full bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

export function TmSearch({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={cx('relative w-full sm:w-60', className)}>
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputClass, 'pl-8 pr-7 py-2')}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function TmSelect({ value, onChange, options, placeholder, className }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, 'px-2.5 py-2 w-full sm:w-auto', className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((opt) => {
        const o = typeof opt === 'object' ? opt : { value: opt, label: opt };
        return <option key={o.value} value={o.value}>{o.label}</option>;
      })}
    </select>
  );
}

export function TmDate({ value, onChange, title }) {
  return (
    <input type="date" title={title} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={cx(inputClass, 'px-2.5 py-1.5 w-full sm:w-auto')} />
  );
}

export function TmRefresh({ onClick, loading }) {
  return (
    <TmButton icon={RefreshCw} onClick={onClick} className={loading ? '[&_svg]:animate-spin' : ''}>
      Refresh
    </TmButton>
  );
}

export function TmExport({ path, params, filename, label = 'Export', method = 'get', tone }) {
  const [busy, setBusy] = useState(false);
  return (
    <TmButton
      icon={Download}
      busy={busy}
      tone={tone}
      onClick={async () => {
        setBusy(true);
        try {
          await tmDownload(path, params, filename, method);
        } catch (error) {
          toast.error(tmError(error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {label}
    </TmButton>
  );
}

// ---- table ----------------------------------------------------------------------------------

/**
 * columns: [{ key, label, render?(row, index), className?, align? }]
 * startIndex numbers the rows (paginated lists continue from the page's first row).
 */
export function TmTable({ columns, rows, loading, error, empty = 'No records found', rowKey = 'id', startIndex = 1, minWidth = 720, onRowClick }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80">
            <th className="w-12 py-3 px-3 text-[11px] text-slate-500 font-bold tracking-wider uppercase text-center">#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cx('py-3 px-3 text-[11px] text-slate-600 font-bold uppercase tracking-wider whitespace-nowrap', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && !rows?.length ? (
            <tr>
              <td colSpan={columns.length + 1} className="py-14 text-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length + 1} className="py-12 text-center text-sm text-rose-600">
                <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                {error}
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr>
              <td colSpan={columns.length + 1} className="py-14 text-center text-sm text-slate-400">
                <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row?.[rowKey] ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx('hover:bg-slate-50/70 transition-colors', loading && 'opacity-60', onRowClick && 'cursor-pointer')}
              >
                <td className="py-2.5 px-3 text-xs text-slate-400 text-center tabular-nums">{startIndex + i}</td>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx('py-2.5 px-3 text-xs text-slate-700 align-middle', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
                  >
                    {col.render ? col.render(row, i) : (row?.[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const PER_PAGE_OPTIONS = [20, 50, 100];

/**
 * Pager for a Laravel paginator ({current_page, last_page, total, from, to}), with a "go to page" box
 * and, when onPerPage is given, a rows-per-page selector.
 */
export function TmPager({ pager, onPage, perPage, onPerPage }) {
  const [jump, setJump] = useState('');
  if (!pager || !pager.last_page) return null;
  const { current_page: page, last_page: last, total, from, to } = pager;
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(last, page + 2); p++) pages.push(p);
  const target = Math.trunc(Number(jump));
  const valid = jump !== '' && target >= 1 && target <= last && target !== page;
  const go = (e) => {
    e.preventDefault();
    if (!valid) return;
    onPage(target);
    setJump('');
  };
  const navBtn = 'p-1.5 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer';
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <b className="text-slate-700">{from ?? 0}</b>–<b className="text-slate-700">{to ?? 0}</b> of{' '}
          <b className="text-slate-700">{fmtNum(total)}</b> · Page <b className="text-slate-700">{fmtNum(page)}</b> of{' '}
          <b className="text-slate-700">{fmtNum(last)}</b>
        </span>
        {onPerPage && (
          <label className="inline-flex items-center gap-1.5">
            Rows per page
            <select
              value={perPage || pager.per_page || 20}
              onChange={(e) => onPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[...new Set([...PER_PAGE_OPTIONS, Number(perPage || pager.per_page || 20)])].sort((a, b) => a - b).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {last > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => onPage(1)} className={cx(navBtn, 'px-2 font-semibold')} title="First page">
            First
          </button>
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={navBtn} title="Previous page">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {pages[0] > 1 && <span className="px-1">…</span>}
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={cx('min-w-7 px-2 py-1 rounded-md border text-xs font-semibold cursor-pointer', p === page ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:bg-slate-50')}
            >
              {p}
            </button>
          ))}
          {pages[pages.length - 1] < last && <span className="px-1">…</span>}
          <button type="button" disabled={page >= last} onClick={() => onPage(page + 1)} className={navBtn} title="Next page">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={page >= last} onClick={() => onPage(last)} className={cx(navBtn, 'px-2 font-semibold')} title="Last page">
            Last
          </button>
          <form onSubmit={go} className="inline-flex items-center gap-1 ml-2">
            <span>Go to page</span>
            <input
              type="number"
              min={1}
              max={last}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              placeholder={`1–${last}`}
              aria-label="Page number"
              className="w-20 px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button type="submit" disabled={!valid} className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold disabled:opacity-40 cursor-pointer">
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ---- overlays -------------------------------------------------------------------------------

export function TmModal({ open, title, subtitle, onClose, children, footer, size = 'lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-7xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className={cx('relative w-full bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[92vh]', width)}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function TmConfirm({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <TmModal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <TmButton onClick={onClose}>Cancel</TmButton>
          <TmButton tone="danger" busy={busy} onClick={onConfirm}>{confirmLabel}</TmButton>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </TmModal>
  );
}

/** Label / value grid for detail views. */
export function TmDetails({ items }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
          <dd className="text-sm text-slate-800 mt-0.5 break-words">{value === null || value === undefined || value === '' ? '—' : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TmImage({ src, alt = '', className = 'w-14 h-10' }) {
  const url = tmFile(src);
  if (!url) return <span className="text-slate-300">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt={alt} className={cx('object-cover rounded-md border border-slate-200 bg-slate-50', className)} />
    </a>
  );
}

// ---- forms ----------------------------------------------------------------------------------

/**
 * fields: [{ name, label, type: text|number|email|date|datetime-local|time|textarea|select|file|checkbox|color,
 *            options?, required?, placeholder?, accept?, multiple?, help?, span? (2 = full width) }]
 */
export function TmForm({ fields, values, onChange, errors = {} }) {
  const set = (name, value) => onChange({ ...values, [name]: value });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.filter(Boolean).map((field) => {
        const error = errors[field.name]?.[0] || errors[field.name];
        const base = cx(inputClass, 'px-3 py-2 text-sm', error && 'border-rose-400');
        let control;
        if (field.type === 'textarea') {
          control = <textarea rows={field.rows || 4} value={values[field.name] ?? ''} placeholder={field.placeholder} onChange={(e) => set(field.name, e.target.value)} className={base} />;
        } else if (field.type === 'select') {
          control = (
            <select value={values[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} className={base}>
              <option value="">{field.placeholder || 'Select'}</option>
              {(field.options || []).map((opt) => {
                const o = typeof opt === 'object' ? opt : { value: opt, label: opt };
                return <option key={o.value} value={o.value}>{o.label}</option>;
              })}
            </select>
          );
        } else if (field.type === 'file') {
          control = (
            <div>
              <input
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => set(field.name, field.multiple ? Array.from(e.target.files) : e.target.files[0])}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {field.current && <div className="mt-2"><TmImage src={field.current} className="h-16 w-auto max-w-full" /></div>}
            </div>
          );
        } else if (field.type === 'checkboxes') {
          const selected = (values[field.name] || []).map(String);
          control = (
            <div className="flex flex-wrap gap-2">
              {(field.options || []).map((opt) => {
                const o = typeof opt === 'object' ? opt : { value: opt, label: opt };
                const on = selected.includes(String(o.value));
                return (
                  <label key={o.value} className={cx('px-3 py-1.5 rounded-lg border text-xs cursor-pointer', on ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-slate-200 text-slate-600')}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={on}
                      onChange={() => set(field.name, on ? selected.filter((v) => v !== String(o.value)) : [...selected, String(o.value)])}
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          );
        } else if (field.type === 'checkbox') {
          control = (
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={Boolean(Number(values[field.name]) || values[field.name] === true)} onChange={(e) => set(field.name, e.target.checked)} className="w-4 h-4 accent-blue-600" />
              {field.checkLabel || field.label}
            </label>
          );
        } else {
          control = (
            <input
              type={field.type || 'text'}
              value={values[field.name] ?? ''}
              placeholder={field.placeholder}
              step={field.step}
              min={field.min}
              max={field.max}
              onChange={(e) => set(field.name, e.target.value)}
              className={base}
            />
          );
        }
        return (
          <div key={field.name} className={field.span === 2 || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
            {field.type !== 'checkbox' && (
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                {field.label} {field.required && <span className="text-rose-600">*</span>}
              </label>
            )}
            {control}
            {field.help && <p className="text-[11px] text-slate-400 mt-1">{field.help}</p>}
            {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
