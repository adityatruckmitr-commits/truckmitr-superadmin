import React from 'react';
import { CheckCircle2, MapPin, Navigation, Calendar } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const PlacementTab = ({ placementDetails }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Placement Details</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200">#</th>
              <th className="px-6 py-4 border-b border-slate-200">Job Title</th>
              <th className="px-6 py-4 border-b border-slate-200">Job ID</th>
              <th className="px-6 py-4 border-b border-slate-200">Location</th>
              <th className="px-6 py-4 border-b border-slate-200">Salary</th>
              <th className="px-6 py-4 border-b border-slate-200">Placement Status</th>
              <th className="px-6 py-4 border-b border-slate-200">Date Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {placementDetails && placementDetails.length > 0 ? (
              placementDetails.map((placement, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{placement.job_title}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">{placement.vehicle_type}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{placement.job_unique_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{placement.job_location || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">
                    {placement.Salary_Range ? `₹${placement.Salary_Range}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      placement.match_status === 'placed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-400' :
                      placement.match_status === 'selected' ? 'bg-emerald-100 text-emerald-700' :
                      placement.match_status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {placement.match_status}
                    </span>
                    {placement.match_status === 'placed' && placement.placed_date && (
                      <span className="text-[10px] text-slate-500 font-bold block mt-1">
                        Placed: {new Date(placement.placed_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(placement.updated_at || placement.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No placement records found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlacementTab;
