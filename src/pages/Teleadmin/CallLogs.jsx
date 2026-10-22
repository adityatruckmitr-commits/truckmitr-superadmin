import React from 'react';
import { PhoneCall } from 'lucide-react';

export default function CallLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Telecaller Call Logs</h1>
        <p className="text-xs text-slate-500">Agent calls, recording dispositions, and callback scheduling</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Live IVR integration with Sarv / TeleCMI / Exotel telemetry.</p>
      </div>
    </div>
  );
}