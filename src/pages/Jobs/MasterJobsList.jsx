import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Download,
  Filter,
  Layers,
  CheckCircle2,
  Database,
  Building2,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function MasterJobsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const masterCategories = [
    {
      id: 1,
      category: 'Container Trucks',
      sub_types: '22ft Single Axle, 32ft Multi-Axle, 40ft High Cube',
      license_required: 'HMV',
      avg_salary_range: '₹22,000 – ₹32,000',
      active_openings: 28,
      total_drivers_placed: 412,
      demand_index: 'High (8.9/10)'
    },
    {
      id: 2,
      category: 'Cargo Trucks (Open Body)',
      sub_types: '6-Tyre Open, 10-Tyre Open, 12-Tyre Heavy Open',
      license_required: 'HMV',
      avg_salary_range: '₹24,000 – ₹35,000',
      active_openings: 19,
      total_drivers_placed: 580,
      demand_index: 'Very High (9.4/10)'
    },
    {
      id: 3,
      category: 'Trailer / Semi-Trailer / Bulker',
      sub_types: '14-Tyre Trailer, 18-Tyre Semi-Trailer, Cement Bulker',
      license_required: 'HGMV / HMV',
      avg_salary_range: '₹35,000 – ₹50,000',
      active_openings: 12,
      total_drivers_placed: 290,
      demand_index: 'Critical (9.8/10)'
    },
    {
      id: 4,
      category: 'Tipper & Dump Trucks',
      sub_types: '10-Tyre Mining Tipper, 12-Tyre Heavy Tipper',
      license_required: 'HMV',
      avg_salary_range: '₹28,000 – ₹38,000',
      active_openings: 8,
      total_drivers_placed: 184,
      demand_index: 'High (8.6/10)'
    },
    {
      id: 5,
      category: 'Light Commercial Vehicles (LCV)',
      sub_types: 'Tata Ace (Chhota Hathi), Mahindra Bolero Maxi Truck, Ashok Leyland Dost',
      license_required: 'LMV / LMV-TR',
      avg_salary_range: '₹18,000 – ₹25,000',
      active_openings: 15,
      total_drivers_placed: 640,
      demand_index: 'High (8.7/10)'
    }
  ];

  const handleExportMaster = () => {
    showToast('Exporting Master Job Taxonomy & Demand Indices...');
    const headers = ['Category', 'Sub Types', 'License Required', 'Avg Salary Range', 'Active Openings', 'Total Placed', 'Demand Index'];
    const rows = masterCategories.map(c => [
      `"${c.category}"`,
      `"${c.sub_types}"`,
      c.license_required,
      `"${c.avg_salary_range}"`,
      c.active_openings,
      c.total_drivers_placed,
      `"${c.demand_index}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `TruckMitr_Master_Job_Taxonomy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 w-full min-w-0 font-sans text-slate-800">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Master Job Catalogue & Demand Taxonomy</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Database className="w-3.5 h-3.5" />
              Central Standard Registry
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Standard job roles, vehicle categories, benchmark compensations, and placement analytics across Pan-India freight routes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportMaster}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Master Taxonomy</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Standard Vehicle Roles</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">5 Core Classes</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">18 Sub-category variants</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Active Pipeline Openings</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">82 Openings</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Across 14 State Hubs</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Drivers Placed MTD</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">2,106 Drivers</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">↑ 14.8% vs last month</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Benchmark Avg Salary</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">₹27,800/mo</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">+ Trip allowances</div>
        </div>
      </div>

      {/* Master Catalogue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Standard Commercial Vehicle Taxonomy & Parameters
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Vehicle Category</th>
                <th className="px-4 py-3 min-w-[280px]">Standard Sub-types & Body Builds</th>
                <th className="px-4 py-3 text-center">Required DL</th>
                <th className="px-4 py-3">Benchmark Monthly Salary</th>
                <th className="px-4 py-3 text-center">Active Openings</th>
                <th className="px-4 py-3 text-center">Placed Drivers</th>
                <th className="px-4 py-3">Demand Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {masterCategories.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3.5 text-slate-500 font-medium">{item.id}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{item.category}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{item.sub_types}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-300 text-[11px]">
                      {item.license_required}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-700">{item.avg_salary_range}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                      {item.active_openings} Live
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-800">{item.total_drivers_placed}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {item.demand_index}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
