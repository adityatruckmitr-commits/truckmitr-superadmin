import React from 'react';
import { Bell } from 'lucide-react';

export default function BroadcastNotification() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Broadcast Notifications & WhatsApp</h1>
        <p className="text-xs text-slate-500">Send Firebase push notifications and WhatsApp updates to drivers & transporters</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <p className="text-xs text-slate-500">Template messages, FCM triggers, and campaign analytics.</p>
      </div>
    </div>
  );
}