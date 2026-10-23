import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search } from 'lucide-react';

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/admin/executive-dashboard/recent-drivers')
      .then(res => setDrivers(res.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = drivers.filter(d => 
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.mobile || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Drivers Directory</h1>
          <p className="text-xs text-slate-500">Pan-India verified driver partner database</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-64 outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="p-3">TMID / ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">State / City</th>
              <th className="p-3">Status</th>
              <th className="p-3">Registered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-400">No driver records found</td></tr>
            ) : (
              filtered.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-indigo-600">TM-{d.id || i+100}</td>
                  <td className="p-3 font-bold text-slate-900">{d.name || 'Verified Driver'}</td>
                  <td className="p-3 text-slate-600">{d.mobile || '—'}</td>
                  <td className="p-3 text-slate-600">{d.state || 'Maharashtra'}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Active</span></td>
                  <td className="p-3 text-slate-500">{d.created_at || 'Today'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}