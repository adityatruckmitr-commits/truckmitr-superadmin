import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageJump from './PageJump';

// Pager for server-paginated lists: First / Prev / page numbers / Next / Last, rows per page and "go to page"
export default function ListPager({ page, lastPage, total, pageSize, onPage, onPageSize, sizes = [20, 50, 100] }) {
  const last = Math.max(1, lastPage || 1);
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total || 0);
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(last, page + 2); p++) pages.push(p);
  const btn = 'px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-500">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <b className="text-slate-700">{from}</b>–<b className="text-slate-700">{to}</b> of{' '}
          <b className="text-slate-700">{(total || 0).toLocaleString('en-IN')}</b> · Page <b className="text-slate-700">{page}</b> of{' '}
          <b className="text-slate-700">{last.toLocaleString('en-IN')}</b>
        </span>
        {onPageSize && (
          <label className="inline-flex items-center gap-1.5">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      {last > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(1)}>First</button>
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {pages[0] > 1 && <span className="px-1">…</span>}
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={p === page ? 'px-2.5 py-1.5 rounded-md border border-blue-600 bg-blue-600 text-white text-xs font-bold' : btn}
            >
              {p}
            </button>
          ))}
          {pages[pages.length - 1] < last && <span className="px-1">…</span>}
          <button type="button" className={btn} disabled={page >= last} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button type="button" className={btn} disabled={page >= last} onClick={() => onPage(last)}>Last</button>
          <PageJump page={page} totalPages={last} onGo={onPage} />
        </div>
      )}
    </div>
  );
}
