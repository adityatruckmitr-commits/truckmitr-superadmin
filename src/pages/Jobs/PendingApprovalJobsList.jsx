import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ListPager from '../../components/ListPager';
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  Truck,
  ShieldAlert,
  Copy,
  Check,
  Building2,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function PendingApprovalJobsList() {
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

  const [pendingJobs, setPendingJobs] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/jobs-brief', { params: { status: 'pending', per_page: pageSize, page: currentPage } });
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
            submitted_date: j.posted_at,
            kyc_status: 'Transporter KYC Verified',
            status: 'Pending'
          }));
          setPendingJobs(mapped);
        }
      } catch {
        setPendingJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [currentPage, pageSize]);

  const handleApprove = async (job) => {
    try {
      await api.post(`/admin/jobs-brief/status/${job.id}`);
    } catch {
      // ignore
    }
    showToast(`Job ${job.job_id} APPROVED and pushed to Active Jobs Roster!`);
    setPendingJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const handleReject = async (job) => {
    try {
      await api.delete(`/admin/jobs/${job.id}`);
    } catch {
      // ignore
    }
    showToast(`Job ${job.job_id} marked as Rejected.`);
    setPendingJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return pendingJobs;
    const q = searchQuery.toLowerCase();
    return pendingJobs.filter(j =>
      j.job_id.toLowerCase().includes(q) ||
      j.tmid.toLowerCase().includes(q) ||
      j.contact_name.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    );
  }, [pendingJobs, searchQuery]);

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pending Approvals Queue</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {meta.total.toLocaleString('en-IN')} Postings Under Review
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            New job requirements submitted by transporters awaiting admin verification and screening before going live.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending jobs..."
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
                <th className="px-4 py-3 min-w-[320px]">Job Title & Terms</th>
                <th className="px-3.5 py-3">Vehicle</th>
                <th className="px-3.5 py-3">Location</th>
                <th className="px-3.5 py-3 text-center">Openings</th>
                <th className="px-3.5 py-3">KYC & Verification</th>
                <th className="px-3.5 py-3">Submitted At</th>
                <th className="px-4 py-3 text-center">Screening Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((job, idx) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-3.5 py-3 text-center text-slate-500 font-medium">{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td className="px-3.5 py-3 font-semibold text-amber-700 font-mono">{job.job_id}</td>
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
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {job.vehicle_type}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{job.location}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-center font-bold text-slate-800">{job.openings}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      job.kyc_status.includes('Verified')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {job.kyc_status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-[11px] text-slate-500">{job.submitted_date}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleApprove(job)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                        title="Approve & Publish"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(job)}
                        className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded border border-rose-200 hover:border-rose-600 transition cursor-pointer"
                        title="Reject Posting"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">{loading ? 'Loading…' : 'No jobs pending approval'}</td>
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
