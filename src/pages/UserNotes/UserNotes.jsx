import React, { useState } from 'react';

export default function UserNotes() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">User Notes & Internal Comments</h2>
          <p className="text-xs text-slate-500">CRM operator notes on drivers, transporters, and job leads</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 text-center text-slate-400 text-xs">
        Search for any TMID or mobile number in the header to view or add notes.
      </div>
    </div>
  );
}