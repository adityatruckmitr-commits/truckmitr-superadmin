import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

const MAX_HIGHLIGHTS = 2000;
const supportsHighlight = typeof CSS !== 'undefined' && 'highlights' in CSS;

// A page "has its own search" when its content contains a visible search-style input
const OWN_SEARCH_SELECTOR = 'input[type="search"], input[placeholder*="search" i], input[placeholder*="खोज"]';
const pageHasOwnSearch = (root) =>
  Array.from(root.querySelectorAll(OWN_SEARCH_SELECTOR)).some((el) => el.offsetParent !== null || el.getClientRects().length > 0);

// Generic "find on this page" bar: hides non-matching table rows and
// highlights every text match inside the page content container.
export default function PageSearch({ containerRef }) {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const rangesRef = useRef([]);

  const clearHighlights = () => {
    if (supportsHighlight) {
      CSS.highlights.delete('page-search');
      CSS.highlights.delete('page-search-current');
    }
  };

  const apply = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const q = query.trim().toLowerCase();

    // 1. Filter table rows
    root.querySelectorAll('tbody tr').forEach((row) => {
      const hide = q && !row.textContent.toLowerCase().includes(q);
      if (hide) {
        if (row.style.display !== 'none') {
          row.dataset.pageSearchHidden = '1';
          row.style.display = 'none';
        }
      } else if (row.dataset.pageSearchHidden) {
        delete row.dataset.pageSearchHidden;
        row.style.display = '';
      }
    });

    // 2. Highlight text matches
    clearHighlights();
    if (!q) {
      rangesRef.current = [];
      setMatchCount(0);
      return;
    }
    const ranges = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const el = node.parentElement;
        if (!el || el.closest('script,style,[data-page-search-ignore]')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.toLowerCase().includes(q)) return NodeFilter.FILTER_SKIP;
        return el.offsetParent !== null || el.getClientRects().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    while (walker.nextNode() && ranges.length < MAX_HIGHLIGHTS) {
      const node = walker.currentNode;
      const text = node.nodeValue.toLowerCase();
      let idx = text.indexOf(q);
      while (idx !== -1 && ranges.length < MAX_HIGHLIGHTS) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + q.length);
        ranges.push(range);
        idx = text.indexOf(q, idx + q.length);
      }
    }
    rangesRef.current = ranges;
    setMatchCount(ranges.length);
    if (supportsHighlight && ranges.length) {
      CSS.highlights.set('page-search', new Highlight(...ranges));
    }
  }, [containerRef, query]);

  const focusMatch = useCallback((idx) => {
    const ranges = rangesRef.current;
    if (!ranges.length) return;
    const safeIdx = ((idx % ranges.length) + ranges.length) % ranges.length;
    setCurrent(safeIdx);
    const range = ranges[safeIdx];
    if (supportsHighlight) CSS.highlights.set('page-search-current', new Highlight(range));
    range.startContainer.parentElement?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  // Re-run when the query changes, and whenever the page content re-renders (data loads, pagination)
  useEffect(() => {
    apply();
    setCurrent(0);
    if (query.trim()) focusMatch(0);
    const root = containerRef.current;
    if (!root || !query.trim()) return;
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(apply, 200);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [apply, focusMatch, containerRef, query]);

  // Reset when the user moves to another page
  useEffect(() => { setQuery(''); }, [location.pathname]);

  // Hide this bar on pages that already provide their own search box (content may render late)
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let timer;
    const check = () => setHidden(pageHasOwnSearch(root));
    check();
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(check, 150);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [containerRef, location.pathname]);

  useEffect(() => { if (hidden) setQuery(''); }, [hidden]);

  useEffect(() => () => clearHighlights(), []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusMatch(e.shiftKey ? current - 1 : current + 1);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const hasQuery = query.trim().length > 0;

  if (hidden) return null;

  return (
    <div className="px-4 sm:px-6 pt-4" data-page-search-ignore>
      <div className="flex items-center gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search on this page..."
            className="w-full pl-9 pr-24 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
          />
          {hasQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className={`text-[11px] font-semibold tabular-nums ${matchCount ? 'text-slate-500' : 'text-rose-500'}`}>
                {matchCount ? `${current + 1}/${matchCount}${matchCount >= MAX_HIGHLIGHTS ? '+' : ''}` : '0 found'}
              </span>
              <button type="button" onClick={() => setQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer" title="Clear">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {hasQuery && matchCount > 1 && (
          <div className="flex items-center">
            <button type="button" onClick={() => focusMatch(current - 1)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer" title="Previous (Shift+Enter)">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => focusMatch(current + 1)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer" title="Next (Enter)">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
