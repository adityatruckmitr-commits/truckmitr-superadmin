import React from 'react';
import { FileText } from 'lucide-react';

export default function JobApplications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Driver Job Applications</h1>
        <p className="text-xs text-slate-500">Applications submitted by drivers for open postings</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Telemetry feed of driver applications, interviews, and hire confirmations.</p>
      </div>
    </div>
  );
}