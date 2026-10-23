import React, { useState } from 'react';

// "Go to page" box for list pagers: type a page number and jump straight to it
export default function PageJump({ page, totalPages, onGo }) {
  const [value, setValue] = useState('');
  const target = Math.trunc(Number(value));
  const valid = value !== '' && target >= 1 && target <= totalPages && target !== page;

  if (!totalPages || totalPages <= 1) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onGo(target);
        setValue('');
      }}
      className="inline-flex items-center gap-1 text-xs text-slate-500 ml-3"
    >
      <span className="whitespace-nowrap">Go to page</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`1–${totalPages}`}
        aria-label="Page number"
        className="w-20 px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button type="submit" disabled={!valid} className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold disabled:opacity-40 cursor-pointer">
        Go
      </button>
    </form>
  );
}
