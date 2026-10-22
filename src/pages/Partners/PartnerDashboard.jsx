import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PartnerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Partner & Channel Network</h1>
        <p className="text-xs text-slate-500">Affiliates, referral agents, and partner institutes</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Partner referral metrics, commissions, and registration credits.</p>
      </div>
    </div>
  );
}