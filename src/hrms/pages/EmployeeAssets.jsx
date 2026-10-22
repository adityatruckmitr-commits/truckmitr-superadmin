import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Laptop, Smartphone, Monitor, Box, Wrench, RotateCcw,
  Plus, Search, ChevronRight, Clock,
  AlertTriangle, ShieldCheck, X,
  Cpu, Eye
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  useMyAssets,
  useAssetRequests,
  useCreateAssetRequest,
  useAssetTickets,
  useCreateAssetTicket,
} from '../hooks/useAssets'

const CATEGORY_ICON = { Laptops: Laptop, Mobiles: Smartphone, Monitors: Monitor }
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtInr = (n) => (n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—')

export default function EmployeeAssets() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('My Assets')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: rawAssets, isLoading: assetsLoading } = useMyAssets()
  const { data: rawRequests, isLoading: requestsLoading } = useAssetRequests({ employee_id: user?.emp_id })
  const { data: rawTickets, isLoading: ticketsLoading } = useAssetTickets({ employee_id: user?.emp_id })

  const createRequest = useCreateAssetRequest()
  const createTicket = useCreateAssetTicket()

  const assignedAssets = Array.isArray(rawAssets) ? rawAssets : []
  const myRequests = Array.isArray(rawRequests) ? rawRequests : []
  const reportedIssues = Array.isArray(rawTickets) ? rawTickets : []

  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showReportIssueModal, setShowReportIssueModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  const [requestFormData, setRequestFormData] = useState({ asset_type: '', priority: 'Medium', reason: '' })
  const [issueFormData, setIssueFormData] = useState({ asset_id: '', issue_type: 'Hardware Malfunction', description: '' })

  const filteredAssets = useMemo(() => {
    return assignedAssets.filter(item =>
      (item.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.asset_tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assignedAssets, searchTerm])

  const goodCount = assignedAssets.filter(a => a.condition === 'GOOD').length
  const conditionPct = assignedAssets.length > 0 ? Math.round((goodCount / assignedAssets.length) * 100) : 100
  const overdueCount = assignedAssets.filter(a => a.expected_return && new Date(a.expected_return) < new Date()).length
  const totalValue = assignedAssets.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0)

  const handleOpenReportIssueModal = (asset) => {
    setSelectedAsset(asset || assignedAssets[0] || null)
    setIssueFormData(prev => ({ ...prev, asset_id: asset ? asset.asset_id : assignedAssets[0]?.asset_id || '' }))
    setShowReportIssueModal(true)
  }

  const handleOpenDetailModal = (asset) => {
    setSelectedAsset(asset)
    setShowDetailModal(true)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!requestFormData.asset_type || !requestFormData.reason) {
      toast.error('Please fill in required fields')
      return
    }
    createRequest.mutate({ employee_id: user?.emp_id, ...requestFormData }, {
      onSuccess: () => {
        toast.success('Asset request submitted to HR & IT team! 🚀')
        setShowNewRequestModal(false)
        setRequestFormData({ asset_type: '', priority: 'Medium', reason: '' })
        setActiveTab('My Requests')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
    })
  }

  const handleIssueSubmit = (e) => {
    e.preventDefault()
    if (!issueFormData.description) {
      toast.error('Please describe the problem')
      return
    }
    const targetAsset = assignedAssets.find(a => a.asset_id === issueFormData.asset_id) || selectedAsset
    createTicket.mutate({
      employee_id: user?.emp_id,
      asset_id: issueFormData.asset_id || null,
      asset_name_snapshot: targetAsset?.asset_name || null,
      issue_type: issueFormData.issue_type,
      description: issueFormData.description,
    }, {
      onSuccess: () => {
        toast.success('Issue ticket created! IT Support notified. 🛠️')
        setShowReportIssueModal(false)
        setSelectedAsset(null)
        setIssueFormData({ asset_id: '', issue_type: 'Hardware Malfunction', description: '' })
        setActiveTab('Reported Issues')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
    })
  }

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Company Assets</h1>
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <span className="hover:text-slate-800 cursor-pointer">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-slate-800 cursor-pointer">Workplace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 font-bold">My Assets</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => handleOpenReportIssueModal(null)} disabled={assignedAssets.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-50 transition-all shadow-2xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Report Issue
          </button>
          <button onClick={() => setShowNewRequestModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-xs shadow-blue-500/20 active:scale-95">
            <Plus className="w-4 h-4" />
            Request New Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><Box className="w-6 h-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Assets</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{assignedAssets.length} Items</h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">Active Hardware & Gear</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Asset Condition</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{assignedAssets.length > 0 ? `${conditionPct}% Good` : '—'}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">{goodCount} of {assignedAssets.length} in Good Condition</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Return Due Status</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{overdueCount > 0 ? `${overdueCount} Overdue` : 'Up to Date'}</h3>
            <p className="text-xs text-cyan-600 font-semibold mt-0.5">{overdueCount > 0 ? 'Action needed' : 'No overdue returns'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100"><Cpu className="w-6 h-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{fmtInr(totalValue)}</h3>
            <p className="text-xs text-purple-600 font-semibold mt-0.5">Company Owned Assets</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {['My Assets', 'My Requests', 'Reported Issues'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}`}>
            {tab === 'My Assets' && `My Assigned Assets (${assignedAssets.length})`}
            {tab === 'My Requests' && `My Requests (${myRequests.length})`}
            {tab === 'Reported Issues' && `Reported Issues (${reportedIssues.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'My Assets' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search your assets by tag, name or brand..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-2xs" />
          </div>

          {assetsLoading && <p className="text-xs text-gray-400 text-center py-10">Loading your assets…</p>}
          {!assetsLoading && assignedAssets.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-sm text-slate-400">No assets are currently assigned to you.</div>
          )}

          {!assetsLoading && filteredAssets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssets.map((asset) => {
                const IconComp = CATEGORY_ICON[asset.category] || Box
                return (
                  <div key={asset.assignment_id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><IconComp className="w-5 h-5" /></div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1 border border-blue-100">{asset.category || 'Asset'}</span>
                          <h3 className="text-base font-extrabold text-slate-900">{asset.asset_name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{asset.brand}{asset.model ? ` · ${asset.model}` : ''}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{asset.asset_tag}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-100">
                      <div className="flex justify-between"><span className="text-slate-400">Serial Number:</span><span className="font-mono font-bold text-slate-900">{asset.serial_number || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Assigned Date:</span><span className="font-bold text-slate-900">{fmtDate(asset.assigned_date)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Location:</span><span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{asset.location || '—'}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${asset.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>Condition: {asset.condition || '—'}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenDetailModal(asset)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Full Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenReportIssueModal(asset)} className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-lg transition-all flex items-center gap-1 border border-amber-200 active:scale-95"><Wrench className="w-3.5 h-3.5" />Report Issue</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'My Requests' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Submitted Asset Requests</h3>
            <button onClick={() => setShowNewRequestModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-2xs transition-all">+ New Request</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <tr><th className="px-4 py-3">Req ID</th><th className="px-4 py-3">Requested Hardware</th><th className="px-4 py-3">Date Submitted</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Justification</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requestsLoading && <tr><td colSpan="6" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!requestsLoading && myRequests.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-400">No asset requests submitted yet.</td></tr>}
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">REQ-{req.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{req.asset_type}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{fmtDate(req.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">{req.priority}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{req.reason}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ${req.status === 'approved' || req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' : req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Reported Issues' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Reported Hardware Malfunctions & Repair Tickets</h3>
            <button onClick={() => handleOpenReportIssueModal(null)} disabled={assignedAssets.length === 0} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 shadow-2xs transition-all disabled:opacity-40">Report New Issue</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                <tr><th className="px-4 py-3">Ticket ID</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Issue Category</th><th className="px-4 py-3">Date Reported</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">IT Support Remarks</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ticketsLoading && <tr><td colSpan="6" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!ticketsLoading && reportedIssues.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-400">No issues reported yet.</td></tr>}
                {reportedIssues.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">TKT-{tkt.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{tkt.asset_name}</td>
                    <td className="px-4 py-3 text-amber-700 font-bold">{tkt.issue_type}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{fmtDate(tkt.created_at)}</td>
                    <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full capitalize">{tkt.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-slate-600 italic">{tkt.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showNewRequestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowNewRequestModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
                <h2 className="text-base font-bold text-slate-900">Request New Asset / Equipment</h2>
                <button onClick={() => setShowNewRequestModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset Required / Model *</label>
                  <input type="text" value={requestFormData.asset_type} onChange={e => setRequestFormData({ ...requestFormData, asset_type: e.target.value })} placeholder="e.g. Dell 27 inch 4K USB-C Monitor" className="w-full p-2.5 border border-slate-300 rounded-lg font-bold" required />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select value={requestFormData.priority} onChange={e => setRequestFormData({ ...requestFormData, priority: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold">
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High (Urgent Work Requirement)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Business Reason *</label>
                  <textarea rows={3} value={requestFormData.reason} onChange={e => setRequestFormData({ ...requestFormData, reason: e.target.value })} placeholder="State why this equipment is needed..." className="w-full p-2.5 border border-slate-300 rounded-lg" required></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewRequestModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={createRequest.isPending} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60">{createRequest.isPending ? 'Submitting…' : 'Submit Request'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReportIssueModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowReportIssueModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
                <h2 className="text-base font-bold text-slate-900">Report Asset Issue / Damage</h2>
                <button onClick={() => setShowReportIssueModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleIssueSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Asset *</label>
                  <select value={issueFormData.asset_id} onChange={e => setIssueFormData({ ...issueFormData, asset_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold" required>
                    {assignedAssets.map(a => (<option key={a.asset_id} value={a.asset_id}>{a.asset_name} ({a.asset_tag})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                  <select value={issueFormData.issue_type} onChange={e => setIssueFormData({ ...issueFormData, issue_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold">
                    <option value="Hardware Malfunction">Hardware Malfunction</option>
                    <option value="Physical Damage / Crack">Physical Damage / Crack</option>
                    <option value="Battery / Charging Problem">Battery / Charging Problem</option>
                    <option value="Display / Screen Defect">Display / Screen Defect</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Problem Description *</label>
                  <textarea rows={3} value={issueFormData.description} onChange={e => setIssueFormData({ ...issueFormData, description: e.target.value })} placeholder="Describe the error or damage..." className="w-full p-2.5 border border-slate-300 rounded-lg" required></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReportIssueModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={createTicket.isPending} className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-60">{createTicket.isPending ? 'Submitting…' : 'Submit IT Ticket'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowDetailModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
                <h2 className="text-base font-bold text-slate-900">Asset Specifications</h2>
                <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 text-xs">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-base font-black text-slate-900">{selectedAsset?.asset_name}</h3>
                  <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">{selectedAsset?.asset_tag}</p>
                </div>
                <div className="space-y-2 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div><span className="text-slate-400 block">Brand & Model:</span><span className="font-bold">{selectedAsset?.brand}{selectedAsset?.model ? ` - ${selectedAsset.model}` : ''}</span></div>
                  <div><span className="text-slate-400 block">Serial Number:</span><span className="font-mono font-bold">{selectedAsset?.serial_number || '—'}</span></div>
                  <div><span className="text-slate-400 block">Assigned Date:</span><span className="font-bold">{fmtDate(selectedAsset?.assigned_date)}</span></div>
                  <div><span className="text-slate-400 block">Work Location:</span><span className="font-bold">{selectedAsset?.location || '—'}</span></div>
                  <div><span className="text-slate-400 block">Condition:</span><span className="font-bold">{selectedAsset?.condition || '—'}</span></div>
                </div>
                <div className="pt-2">
                  <button onClick={() => setShowDetailModal(false)} className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Close Specs</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
