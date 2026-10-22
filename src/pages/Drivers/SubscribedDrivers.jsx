import React from 'react';
import { Gem } from 'lucide-react';

export default function SubscribedDrivers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Subscribed Premium Drivers</h1>
        <p className="text-xs text-slate-500">Active membership holders with high priority matchmaking access</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 text-emerald-600 mb-4">
          <Gem className="w-6 h-6" />
          <h3 className="font-bold text-slate-900">Premium Driver Roster</h3>
        </div>
        <p className="text-xs text-slate-500">Live subscription plans and payment statuses connected with Razorpay & Cashfree gateways.</p>
      </div>
    </div>
  );
}