import React, { useState } from 'react';

export default function Matchmaking() {
  const [filterType, setFilterType] = useState('driver');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Driver & Transporter Matchmaking</h2>
          <p className="text-xs text-slate-500">Live AI matching engine connecting driver routes with open load orders</p>
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-slate-300 rounded-lg px-3 py-1.5">
            <option value="driver">Match By Driver</option>
            <option value="transporter">Match By Transporter Job</option>
          </select>
          <button className="bg-blue-600 text-white font-semibold text-xs px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Auto Match Engine
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">Job ID</th>
              <th className="p-3">Transporter</th>
              <th className="p-3">Origin - Destination</th>
              <th className="p-3">Vehicle Requirement</th>
              <th className="p-3">Matched Drivers</th>
              <th className="p-3">Salary / Pay</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="p-3 font-bold text-blue-600">#JOB-1082</td>
              <td className="p-3 font-bold text-slate-900">VRL Logistics Ltd</td>
              <td className="p-3">Mumbai ➔ Ahmedabad</td>
              <td className="p-3">14-Wheeler Trailer</td>
              <td className="p-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">6 Drivers Available</span></td>
              <td className="p-3 font-semibold">₹35,000 / mo</td>
              <td className="p-3 text-right">
                <button className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">Assign Driver</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}