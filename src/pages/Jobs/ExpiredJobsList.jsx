import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ListPager from '../../components/ListPager';
import {
  Briefcase,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Truck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Users,
  Copy,
  Check
} from 'lucide-react';

export default function ExpiredJobsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
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

  const [expiredJobs, setExpiredJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpired = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/jobs-brief', { params: { status: 'expired', per_page: pageSize, page: currentPage } });
        if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
          setMeta({ total: res.data.total || 0, last_page: res.data.last_page || 1 });
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
            experience: j.experience,
            openings: j.drivers_req || 1,
            posted_date: j.posted_at,
            expired_date: `Expired: ${j.deadline || 'Past'}`,
            apps_received: j.apps_count || 0,
            status: 'Expired'
          }));
          setExpiredJobs(mapped);
        }
      } catch {
        setExpiredJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExpired();
  }, [currentPage, pageSize]);

  const handleRenewJob = async (job) => {
    try {
      await api.post(`/admin/jobs-brief/status/${job.id}`);
    } catch {
      // ignore
    }
    showToast(`Job ${job.job_id} renewed and extended for 30 days!`);
    setExpiredJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return expiredJobs;
    const q = searchQuery.toLowerCase();
    return expiredJobs.filter(j =>
      j.job_id.toLowerCase().includes(q) ||
      j.tmid.toLowerCase().includes(q) ||
      j.contact_name.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  }, [expiredJobs, searchQuery]);

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expired Jobs Roster</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {meta.total.toLocaleString('en-IN')} Expired Postings
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Archived postings that passed their application deadline. Renew or repost with 1-click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expired jobs..."
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
                <th className="px-3.5 py-3 text-center">Applications</th>
                <th className="px-3.5 py-3">Expiry Timeline</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 text-center text-slate-500 font-medium">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-3.5 py-3 font-semibold text-rose-600 font-mono">{job.job_id}</td>
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
                  <td className="px-3.5 py-3 text-center font-bold text-slate-800">{job.apps_received}</td>
                  <td className="px-3.5 py-3 text-[11px]">
                    <div className="text-slate-500">Posted: {job.posted_date}</div>
                    <div className="text-rose-600 font-semibold">{job.expired_date}</div>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Expired
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRenewJob(job)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                      title="Renew Posting"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Renew</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">{loading ? 'Loading…' : 'No expired jobs found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ListPager
          page={currentPage}
          lastPage={meta.last_page}
          total={meta.total}
          pageSize={pageSize}
          onPage={setCurrentPage}
          onPageSize={(n) => { setPageSize(n); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
}
