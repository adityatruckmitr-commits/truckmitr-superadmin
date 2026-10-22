import React from 'react';
import { Truck, Gem } from 'lucide-react';

export default function SubscribedTransporters() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Subscribed Transporters</h1>
        <p className="text-xs text-slate-500">Active corporate subscription plans</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Corporate subscriber telemetry and billing summaries.</p>
      </div>
    </div>
  );
}