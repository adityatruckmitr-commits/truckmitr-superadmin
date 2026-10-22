import React from 'react';
import { IndianRupee } from 'lucide-react';

export default function RevenueReport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Revenue Analytics & Invoices</h1>
        <p className="text-xs text-slate-500">Collections, GST invoices, and financial reports</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Automated ledger reconciliation with banking gateways.</p>
      </div>
    </div>
  );
}