import React from 'react';
import { Users, Briefcase, MapPin, Phone } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const TotalHiredTab = ({ hiredDrivers }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Total Hired Drivers</h3>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Total Count</span>
          <span className="text-lg font-black text-slate-800">{hiredDrivers?.length || 0}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <th className="px-6 py-4 border-b border-slate-200">#</th>
              <th className="px-6 py-4 border-b border-slate-200">Driver Details</th>
              <th className="px-6 py-4 border-b border-slate-200">Job Match</th>
              <th className="px-6 py-4 border-b border-slate-200">Location</th>
              <th className="px-6 py-4 border-b border-slate-200">Salary</th>
              <th className="px-6 py-4 border-b border-slate-200">Hired On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hiredDrivers && hiredDrivers.length > 0 ? (
              hiredDrivers.map((driver, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{driver.driver_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{driver.driver_unique_id}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{driver.driver_mobile}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{driver.job_title}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">{driver.vehicle_type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{driver.job_location || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">
                    {driver.Salary_Range ? `₹${driver.Salary_Range}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(driver.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No hired drivers found.</p>
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

export default TotalHiredTab;
