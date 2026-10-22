import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';

// Flattens the sidebar sections (dropdowns of any depth) into one searchable list of links
const flattenNav = (navSections) => {
  const links = [];
  const walk = (items, parent) => {
    items.forEach((item) => {
      if (item.subItems) {
        walk(item.subItems, parent ? `${parent} › ${item.label}` : item.label);
        return;
      }
      links.push({ label: item.label, path: item.path, parent });
      (item.children || []).forEach((child) => {
        links.push({ label: child.label, path: child.path, parent: `${parent} › ${item.label}` });
      });
    });
  };
  navSections.forEach((section) => walk(section.items, ''));
  return links;
};

export default function SidebarSearch({ navSections, onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const links = useMemo(() => flattenNav(navSections), [navSections]);
  const q = query.trim().toLowerCase();
  const results = q
    ? links.filter((l) => l.label.toLowerCase().includes(q) || l.parent.toLowerCase().includes(q))
    : [];

  const open = (link) => {
    navigate(link.path);
    setQuery('');
    setActiveIdx(0);
    onNavigate?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      open(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  return (
    <div className="px-3 pt-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search menu..."
          className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {q && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-400 text-center">No menu option matches “{query}”</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((link, idx) => (
                <li key={`${link.path}-${link.label}`}>
                  <button
                    type="button"
                    onClick={() => open(link)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 cursor-pointer ${
                      idx === activeIdx ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold truncate">{link.label}</span>
                      <span className="block text-[10px] text-slate-400 truncate">{link.parent}</span>
                    </span>
                    {idx === activeIdx && <CornerDownLeft className="w-3 h-3 shrink-0 text-blue-500" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
