import React from 'react';

export default function SubscriptionPlans() {
  const plans = [
    { title: 'Driver Basic 1-Month', target: 'Driver', price: '₹299', duration: '30 Days', features: 'Access to 10 Jobs, Direct Transporter Calling' },
    { title: 'Driver Pro 3-Month', target: 'Driver', price: '₹699', duration: '90 Days', features: 'Unlimited Job Applications, Priority Matchmaking, Verified Badge' },
    { title: 'Transporter Starter', target: 'Transporter', price: '₹1,999', duration: '30 Days', features: 'Post 5 Jobs, View 50 Verified Driver Profiles' },
    { title: 'Transporter Enterprise', target: 'Transporter', price: '₹4,999', duration: '90 Days', features: 'Unlimited Jobs, Dedicated Telecaller Relationship Manager' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Subscription Plans Catalog</h2>
          <p className="text-xs text-slate-500">Manage membership pricing, gateway plan IDs, and features</p>
        </div>
        <button className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Plan</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-blue-600 uppercase">{p.target}</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{p.duration}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <div className="text-2xl font-black text-slate-900 my-2">{p.price}</div>
              <p className="text-xs text-slate-500">{p.features}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200">Edit Plan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}