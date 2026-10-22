import React from 'react';
import { Truck } from 'lucide-react';

export default function TransporterList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Transporters Directory</h1>
        <p className="text-xs text-slate-500">Fleet owners and logistics enterprise directory</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Managing verified fleet owners, company profiles, and vehicle availability.</p>
      </div>
    </div>
  );
}