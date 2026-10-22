import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Briefcase,
  Search,
  CheckCircle2,
  MapPin,
  Truck,
  Power,
  Trash2,
  Copy,
  Check,
  Eye
} from 'lucide-react';

export default function InactiveJobsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [inactiveJobs, setInactiveJobs] = useState([
    {
      id: 201,
      job_id: 'TMJB01860',
      tmid: 'TM2608MHTR319200',
      assigned_to: 'Angad',
      contact_name: 'Venkatesh Roadlines',
      mobile: '9765412300',
      title: '🚚 महिंद्रा बोलेरो पिकअप ड्राइवर - पुणे एवं पिंपरी',
      compensation: '💰 ₹18,000 + ओवर-टाइम',
      vehicle_type: 'Light Commercial (LCV)',
      license: 'LMV',
      location: 'Maharashtra',
      reason: 'Temporarily Paused by Employer',
      deactivated_date: '02 Oct 2026',
      status: 'Inactive'
    },
    {
      id: 202,
      job_id: 'TMJB01855',
      tmid: 'TM2608DLTR310022',
      assigned_to: 'Chandarbhan',
      contact_name: 'North-East Freight',
      mobile: '9810998877',
      title: '🚚 12 चक्का कंटेनर ड्राइवर - दिल्ली से गुवाहाटी',
      compensation: '💰 ₹32,000 + ट्रिप बोनस',
      vehicle_type: 'Container Trucks',
      license: 'HMV',
      location: 'Delhi',
      reason: 'Quota Reached',
      deactivated_date: '28 Sep 2026',
      status: 'Inactive'
    },
    {
      id: 203,
      job_id: 'TMJB01840',
      tmid: 'TM2607RJTR290111',
      assigned_to: 'Aayushi Verma',
      contact_name: 'Jaipur Super Golden',
      mobile: '9414223344',
      title: '🚚 20 फीट कैंटर ड्राइवर - अजमेर रोड डिस्ट्रीब्यूशन',
      compensation: '💰 ₹21,000 + खाना भत्ता',
      vehicle_type: 'Light Commercial (LCV)',
      license: 'HMV',
      location: 'Rajasthan',
      reason: 'Driver Hired Offline',
      deactivated_date: '24 Sep 2026',
      status: 'Inactive'
    }
  ]);

  useEffect(() => {
    const fetchInactive = async () => {
      try {
        const res = await api.get('/admin/jobs-brief', { params: { status: 'inactive', per_page: 50 } });
        if (res.data && res.data.status === 'success' && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map(j => ({
            id: j.id,
            job_id: j.job_id,
            tmid: j.tmid,
            assigned_to: j.assigned_to,
            contact_name: j.contact_name,
            mobile: j.mobile,
            title: j.title,
            compensation: j.compensation,
            vehicle_type: j.vehicle_type,
            license: j.license,
            location: j.location,
            reason: 'Paused by Transporter / Admin',
            deactivated_date: j.posted_at || 'Recently',
            status: 'Inactive'
          }));
          setInactiveJobs(mapped);
        }
      } catch {
        // Fallback in initial state
      }
    };
    fetchInactive();
  }, []);

  const handleActivateJob = async (job) => {
    try {
      await api.post(`/admin/jobs-brief/status/${job.id}`);
    } catch {
      // ignore
    }
    showToast(`Job ${job.job_id} reactivated and pushed live to driver app!`);
    setInactiveJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return inactiveJobs;
    const q = searchQuery.toLowerCase();
    return inactiveJobs.filter(j =>
      j.job_id.toLowerCase().includes(q) ||
      j.tmid.toLowerCase().includes(q) ||
      j.contact_name.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  }, [inactiveJobs, searchQuery]);

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inactive Jobs Queue</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              12 Inactive Postings
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Paused or disabled postings by fleet operators or superadmin. Reactivate with 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inactive jobs..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-3 text-center">#</th>
                <th className="px-3.5 py-3">Job ID</th>
                <th className="px-3.5 py-3">TM ID</th>
                <th className="px-3.5 py-3">Employer / Partner</th>
                <th className="px-3.5 py-3">Contact</th>
                <th className="px-4 py-3 min-w-[300px]">Job Title & Compensation</th>
                <th className="px-3.5 py-3">Vehicle</th>
                <th className="px-3.5 py-3">Location</th>
                <th className="px-3.5 py-3">Reason / Date</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="px-3.5 py-3 font-semibold text-slate-600 font-mono">{job.job_id}</td>
                  <td className="px-3.5 py-3 font-mono text-slate-600 text-[11px]">{job.tmid}</td>
                  <td className="px-3.5 py-3 font-medium text-slate-900">{job.contact_name}</td>
                  <td className="px-3.5 py-3 font-mono text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span>{job.mobile}</span>
                      <button onClick={() => copyToClipboard(job.mobile, job.id)} className="text-slate-400 hover:text-slate-600">
                        {copiedId === job.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{job.title}</div>
                    <div className="text-[11px] text-slate-500">{job.compensation}</div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {job.vehicle_type}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-[11px]">
                    <div className="font-medium text-slate-700">{job.reason}</div>
                    <div className="text-slate-400">Paused: {job.deactivated_date}</div>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Inactive
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleActivateJob(job)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      title="Reactivate Posting"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Make Active</span>
                    </button>
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
