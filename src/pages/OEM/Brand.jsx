import React from 'react';

export default function Brand() {
  const brands = [
    { name: 'Tata Motors', count: '1,420 Trucks', status: 'Active' },
    { name: 'Ashok Leyland', count: '980 Trucks', status: 'Active' },
    { name: 'Eicher Motors', count: '650 Trucks', status: 'Active' },
    { name: 'BharatBenz', count: '420 Trucks', status: 'Active' },
    { name: 'Mahindra Trucks', count: '310 Trucks', status: 'Active' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">OEM Commercial Brands</h2>
          <p className="text-xs text-slate-500">Commercial vehicle manufacturers and brand catalogs</p>
        </div>
        <button className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Brand</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-3">Brand Name</th>
              <th className="p-3">Listed Models</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((b, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-900">{b.name}</td>
                <td className="p-3 font-semibold text-slate-600">{b.count}</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">{b.status}</span></td>
                <td className="p-3 text-right">
                  <button className="text-blue-600 font-bold hover:underline me-2">Edit</button>
                  <button className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}