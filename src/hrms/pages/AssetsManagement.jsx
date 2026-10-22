import { useState, useMemo } from 'react'
import { Link } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Plus, Search, Filter, ChevronRight, Edit, X,
  UserPlus, Eye, Tag, Download,
  AlertTriangle, Laptop, Smartphone, Monitor, HardDrive,
  ShoppingBag, Box, QrCode, Printer,
  RotateCcw, CheckCircle2, Calendar, Wrench, Layers, ExternalLink, PackageCheck
} from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import {
  useAssets,
  useAssetCategories,
  useAssetSubCategories,
  useCreateAsset,
  useUpdateAsset,
  useAssignAsset,
  useReturnAsset,
  useAssetHistory,
  useAssetLoans,
  useCreateAssetCategory,
  useAssetRequests,
  useCreateAssetRequest,
  useUpdateAssetRequestStatus,
  useAssetTickets,
  useCreateAssetTicket,
  useUpdateAssetTicketStatus,
  downloadAssetReport,
} from '../hooks/useAssets'

const getStatusBadgeStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "ASSIGNED": return "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
    case "RETIRED": return "bg-rose-50 text-rose-700 border border-rose-200"
    default: return "bg-slate-100 text-slate-700 border border-slate-200"
  }
}

const getConditionBadgeStyle = (condition) => {
  switch (condition?.toUpperCase()) {
    case "GOOD": return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "DAMAGED": return "bg-amber-50 text-amber-700 border border-amber-200"
    case "LOST": return "bg-rose-50 text-rose-700 border border-rose-200"
    default: return "bg-slate-50 text-slate-700 border border-slate-200"
  }
}

const CATEGORY_ICON = { 'IT Assets': Laptop, 'Mobile Devices': Smartphone, 'Office Equipment': HardDrive, 'Furniture & Fixtures': Box, 'ID & Security': Tag, Vehicles: Box, 'Other Assets': Layers }
const DONUT_COLORS = [
  { stroke: 'stroke-blue-700', bg: 'bg-blue-600', iconBg: 'bg-blue-50 text-blue-600 border-blue-100', text: 'text-blue-700' },
  { stroke: 'stroke-emerald-600', bg: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-600' },
  { stroke: 'stroke-amber-600', bg: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-600 border-amber-100', text: 'text-amber-600' },
  { stroke: 'stroke-cyan-500', bg: 'bg-cyan-500', iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100', text: 'text-cyan-600' },
  { stroke: 'stroke-pink-500', bg: 'bg-pink-500', iconBg: 'bg-pink-50 text-pink-600 border-pink-100', text: 'text-pink-600' },
  { stroke: 'stroke-purple-500', bg: 'bg-purple-500', iconBg: 'bg-purple-50 text-purple-600 border-purple-100', text: 'text-purple-600' },
  { stroke: 'stroke-orange-500', bg: 'bg-orange-500', iconBg: 'bg-orange-50 text-orange-600 border-orange-100', text: 'text-orange-600' },
]

// The QR label on an asset opens its page in the HRMS (any phone camera can follow a URL; a bare tag is
// just text). Built from the running app's own address so dev and live labels point at their own server.
const assetScanUrl = (tag) => `${window.location.origin}${import.meta.env.BASE_URL}hrms/asset/${encodeURIComponent(tag)}`

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtInr = (n) => (n != null && n !== '' ? `₹${Number(n).toLocaleString('en-IN')}` : '—')

const TABS = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'All Assets', label: 'All Assets' },
  { id: 'Assigned Assets', label: 'Assigned Assets' },
  { id: 'Loans', label: 'Loans' },
  { id: 'New Asset Request', label: 'New Asset Request' },
  { id: 'Due for Return', label: 'Due for Return' },
  { id: 'Reported Issues', label: 'Reported Issues' },
  { id: 'Asset History', label: 'Asset History' },
  { id: 'Asset Categories', label: 'Asset Categories' },
  { id: 'Vendors', label: 'Vendors' },
]

export default function AssetsManagement() {
  const { user } = useAuth()
  const isAdminOrHR = ['super_admin', 'hr', 'admin', 'ceo', 'manager'].includes(user?.role)

  const [activeTab, setActiveTab] = useState('Dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredOverviewCategory, setHoveredOverviewCategory] = useState(null)
  const [filters, setFilters] = useState({ status: '', category_id: '', condition: '' })

  const { data: rawAssets, isLoading: assetsLoading } = useAssets()
  const { data: rawCategories } = useAssetCategories()
  const { data: rawRequests, isLoading: requestsLoading } = useAssetRequests()
  const { data: rawTickets, isLoading: ticketsLoading } = useAssetTickets()
  const { data: rawHistory, isLoading: historyLoading } = useAssetHistory()
  const { data: rawLoans, isLoading: loansLoading } = useAssetLoans()
  const { data: rawEmployees } = useEmployees({ status: 'active' })

  const assets = Array.isArray(rawAssets?.data) ? rawAssets.data : []
  const categories = Array.isArray(rawCategories) ? rawCategories : []
  const requests = Array.isArray(rawRequests) ? rawRequests : []
  const tickets = Array.isArray(rawTickets) ? rawTickets : []
  const history = Array.isArray(rawHistory) ? rawHistory : []
  const loans = Array.isArray(rawLoans) ? rawLoans : []
  const employees = Array.isArray(rawEmployees) ? rawEmployees : []

  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const assignAsset = useAssignAsset()
  const returnAsset = useReturnAsset()
  const createCategory = useCreateAssetCategory()
  const updateRequestStatus = useUpdateAssetRequestStatus()
  const createAssetRequest = useCreateAssetRequest()
  const updateTicketStatus = useUpdateAssetTicketStatus()
  const createAssetTicket = useCreateAssetTicket()

  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showReportIssueModal, setShowReportIssueModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  const emptyAssetForm = { asset_tag: '', asset_name: '', category_id: '', sub_category_id: '', brand: '', model: '', serial_number: '', purchase_date: '', purchase_cost: '', vendor_name: '', location: '' }
  const [assetFormData, setAssetFormData] = useState(emptyAssetForm)
  const [assignFormData, setAssignFormData] = useState({ employee_id: '', assignment_type: 'permanent', assigned_date: new Date().toISOString().split('T')[0], expected_return: '' })
  const [qrAsset, setQrAsset] = useState(null)
  // An approved request is closed by handing over an actual asset: pick one, assign it, mark the request fulfilled.
  const [allocatingRequest, setAllocatingRequest] = useState(null)
  const [allocateForm, setAllocateForm] = useState({ asset_id: '', assignment_type: 'permanent', assigned_date: new Date().toISOString().split('T')[0], expected_return: '' })
  const [returnFormData, setReturnFormData] = useState({ condition_out: 'GOOD', remarks: '' })
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' })
  const [requestFormData, setRequestFormData] = useState({ employee_id: '', asset_type: '', priority: 'Medium', reason: '' })
  const [ticketFormData, setTicketFormData] = useState({ employee_id: '', asset_id: '', issue_type: 'Hardware Malfunction', description: '' })

  const { data: rawSubCategories } = useAssetSubCategories(assetFormData.category_id || null)
  const subCategories = Array.isArray(rawSubCategories) ? rawSubCategories : []

  const handleExportReport = async () => {
    try {
      await downloadAssetReport()
    } catch {
      toast.error('Could not download the asset report')
    }
  }

  const handleAddAssetSubmit = (e) => {
    e.preventDefault()
    if (!assetFormData.asset_tag || !assetFormData.asset_name || !assetFormData.category_id || !assetFormData.sub_category_id) {
      toast.error('Please fill in all required fields')
      return
    }
    if (selectedAsset) {
      updateAsset.mutate({ assetId: selectedAsset.asset_id, data: assetFormData }, {
        onSuccess: () => { toast.success(`Asset ${assetFormData.asset_tag} updated successfully! ✅`); setShowAddEditModal(false); setSelectedAsset(null) },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update asset'),
      })
    } else {
      createAsset.mutate(assetFormData, {
        onSuccess: () => { toast.success(`New Asset ${assetFormData.asset_tag} created successfully! 🎉`); setShowAddEditModal(false); setAssetFormData(emptyAssetForm) },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create asset'),
      })
    }
  }

  const handleAssignSubmit = (e) => {
    e.preventDefault()
    if (!selectedAsset || !assignFormData.employee_id) { toast.error('Please select an employee'); return }
    if (assignFormData.assignment_type === 'loan' && !assignFormData.expected_return) { toast.error('A loan needs an expected return date'); return }
    assignAsset.mutate({ asset_id: selectedAsset.asset_id, ...assignFormData }, {
      onSuccess: () => { toast.success(`Asset ${selectedAsset.asset_tag} assigned successfully! 🚀`); setShowAssignModal(false); setSelectedAsset(null) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to assign asset'),
    })
  }

  const handleReturnSubmit = (e) => {
    e.preventDefault()
    if (!selectedAsset?.assigned_to) return
    returnAsset.mutate({ assignment_id: selectedAsset.assigned_to.assignment_id, returned_date: new Date().toISOString().split('T')[0], ...returnFormData }, {
      onSuccess: () => { toast.success(`Asset ${selectedAsset.asset_tag} returned to available inventory! 📦`); setShowReturnModal(false); setSelectedAsset(null); setReturnFormData({ condition_out: 'GOOD', remarks: '' }) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to return asset'),
    })
  }

  const handleApproveRequest = (req) => {
    updateRequestStatus.mutate({ id: req.id, status: 'approved', reviewed_by: user?.emp_id }, {
      onSuccess: () => toast.success(`Request approved! IT team queued for allocation. ✅`),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
    })
  }

  const handleRejectRequest = (req) => {
    updateRequestStatus.mutate({ id: req.id, status: 'rejected', reviewed_by: user?.emp_id }, {
      onSuccess: () => toast.error(`Request rejected. Employee notified.`),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
    })
  }

  const requestEmployee = (req) => employees.find((emp) => emp.emp_id === req?.employee_id)
  const openAllocate = (req) => {
    setAllocatingRequest(req)
    setAllocateForm({ asset_id: '', assignment_type: 'permanent', assigned_date: new Date().toISOString().split('T')[0], expected_return: '' })
  }
  const handleAllocateSubmit = (e) => {
    e.preventDefault()
    const emp = requestEmployee(allocatingRequest)
    if (!emp) { toast.error('This employee is not in the active employee list'); return }
    if (!allocateForm.asset_id) { toast.error('Pick the asset to hand over'); return }
    if (allocateForm.assignment_type === 'loan' && !allocateForm.expected_return) { toast.error('A loan needs an expected return date'); return }
    const asset = assets.find((a) => String(a.asset_id) === String(allocateForm.asset_id))
    assignAsset.mutate({ ...allocateForm, employee_id: emp.id, remarks: `Against request REQ-${allocatingRequest.id}` }, {
      onSuccess: () => {
        updateRequestStatus.mutate({ id: allocatingRequest.id, status: 'fulfilled', reviewed_by: user?.emp_id, review_remarks: `Allocated ${asset?.asset_tag || ''}`.trim() }, {
          onSettled: () => { toast.success(`${asset?.asset_tag} handed over to ${emp.full_name} - request fulfilled`); setAllocatingRequest(null) },
        })
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Could not assign the asset'),
    })
  }

  const handleAddCategorySubmit = (e) => {
    e.preventDefault()
    if (!categoryFormData.name) return
    createCategory.mutate(categoryFormData, {
      onSuccess: () => { toast.success(`Category "${categoryFormData.name}" created!`); setShowAddCategoryModal(false); setCategoryFormData({ name: '', description: '' }) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category'),
    })
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!requestFormData.employee_id || !requestFormData.asset_type || !requestFormData.reason) { toast.error('Please fill in all required fields'); return }
    createAssetRequest.mutate(requestFormData, {
      onSuccess: () => { toast.success('Asset request logged! 🎉'); setShowNewRequestModal(false); setRequestFormData({ employee_id: '', asset_type: '', priority: 'Medium', reason: '' }) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit request'),
    })
  }

  const handleTicketSubmit = (e) => {
    e.preventDefault()
    if (!ticketFormData.employee_id || !ticketFormData.asset_id || !ticketFormData.description) { toast.error('Please fill in all required fields'); return }
    const asset = assets.find(a => String(a.asset_id) === String(ticketFormData.asset_id))
    createAssetTicket.mutate({ ...ticketFormData, asset_name_snapshot: asset?.asset_name }, {
      onSuccess: () => { toast.success('IT Repair Ticket created! 🛠️'); setShowReportIssueModal(false); setTicketFormData({ employee_id: '', asset_id: '', issue_type: 'Hardware Malfunction', description: '' }) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
    })
  }

  const handleTicketStatusChange = (ticket, status) => {
    updateTicketStatus.mutate({ id: ticket.id, status }, {
      onSuccess: () => toast.success(`Ticket updated to "${status.replace('_', ' ')}"`),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update ticket'),
    })
  }

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch =
        (asset.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.brand?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assigned_to?.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = !filters.status || asset.asset_status === filters.status
      const matchesCategory = !filters.category_id || String(asset.category_id) === String(filters.category_id)
      const matchesCondition = !filters.condition || asset.condition_status === filters.condition
      return matchesSearch && matchesStatus && matchesCategory && matchesCondition
    })
  }, [assets, searchTerm, filters])

  const handleResetFilters = () => { setFilters({ status: '', category_id: '', condition: '' }); setSearchTerm('') }

  // Real stat calculations
  const totalAssetsCount = assets.length
  const assignedCount = assets.filter(a => a.asset_status === 'ASSIGNED').length
  const availableCount = assets.filter(a => a.asset_status === 'AVAILABLE').length
  const damagedCount = assets.filter(a => a.condition_status === 'DAMAGED').length
  const dueForReturn = assets.filter(a => a.assigned_to?.expected_return)
  const overdueCount = dueForReturn.filter(a => new Date(a.assigned_to.expected_return) < new Date()).length
  const pct = (n) => (totalAssetsCount > 0 ? `${((n / totalAssetsCount) * 100).toFixed(2)}%` : '0%')

  const categoryOverview = useMemo(() => {
    const byCat = {}
    assets.forEach(a => {
      const key = a.category?.name || 'Uncategorized'
      byCat[key] = (byCat[key] || 0) + 1
    })
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    let cumulative = 0
    return entries.map(([name, count], idx) => {
      const percent = totalAssetsCount > 0 ? (count / totalAssetsCount) * 100 : 0
      const dashoffset = -cumulative
      cumulative += percent
      const color = DONUT_COLORS[idx % DONUT_COLORS.length]
      return { id: name, name, count, percent: `${percent.toFixed(2)}%`, dasharray: `${percent} 100`, dashoffset: `${dashoffset}`, icon: CATEGORY_ICON[name] || Box, ...color }
    })
  }, [assets, totalAssetsCount])

  const categoryBreakdown = useMemo(() => {
    return categories.map(cat => {
      const catAssets = assets.filter(a => a.category_id === cat.category_id)
      const assigned = catAssets.filter(a => a.asset_status === 'ASSIGNED').length
      const available = catAssets.filter(a => a.asset_status === 'AVAILABLE').length
      const damaged = catAssets.filter(a => a.condition_status === 'DAMAGED').length
      const total = catAssets.length
      const p = (n) => (total > 0 ? `${n} (${((n / total) * 100).toFixed(2)}%)` : `${n} (0.00%)`)
      return { ...cat, total, assigned: p(assigned), available: p(available), damaged: p(damaged), icon: CATEGORY_ICON[cat.name] || Box }
    })
  }, [categories, assets])

  const vendors = useMemo(() => {
    const byVendor = {}
    assets.forEach(a => {
      if (!a.vendor_name) return
      if (!byVendor[a.vendor_name]) byVendor[a.vendor_name] = { name: a.vendor_name, totalAssets: 0, totalValue: 0, lastPurchase: null }
      byVendor[a.vendor_name].totalAssets += 1
      byVendor[a.vendor_name].totalValue += Number(a.purchase_cost) || 0
      if (a.purchase_date && (!byVendor[a.vendor_name].lastPurchase || a.purchase_date > byVendor[a.vendor_name].lastPurchase)) {
        byVendor[a.vendor_name].lastPurchase = a.purchase_date
      }
    })
    return Object.values(byVendor).sort((a, b) => b.totalValue - a.totalValue)
  }, [assets])

  const openAssignModal = (asset) => { setSelectedAsset(asset); setAssignFormData({ employee_id: '', assignment_type: 'permanent', assigned_date: new Date().toISOString().split('T')[0], expected_return: '' }); setShowAssignModal(true) }
  const openReturnModal = (asset) => { setSelectedAsset(asset); setReturnFormData({ condition_out: 'GOOD', remarks: '' }); setShowReturnModal(true) }
  const openEditModal = (asset) => {
    setSelectedAsset(asset)
    setAssetFormData({ asset_tag: asset.asset_tag, asset_name: asset.asset_name, category_id: asset.category_id || '', sub_category_id: asset.sub_category_id || '', brand: asset.brand || '', model: asset.model || '', serial_number: asset.serial_number || '', purchase_date: asset.purchase_date || '', purchase_cost: asset.purchase_cost || '', vendor_name: asset.vendor_name || '', location: asset.location || '' })
    setShowAddEditModal(true)
  }

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Asset Management</h1>
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <span className="hover:text-slate-800 cursor-pointer">Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-slate-800 cursor-pointer">Asset Management</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-600 font-semibold">{activeTab}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportReport} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-xs active:scale-95">
            <Download className="w-4 h-4 text-slate-500" />Export Report
          </button>
          {isAdminOrHR && (
            <button onClick={() => { setSelectedAsset(null); setAssetFormData(emptyAssetForm); setShowAddEditModal(true) }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-xs shadow-blue-500/20 active:scale-95">
              <Plus className="w-4 h-4" />Add New Asset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 scrollbar-none pb-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 font-bold border-b-2 border-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0"><Box className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</p><h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalAssetsCount}</h3><p className="text-xs text-slate-500 mt-0.5">All Company Assets</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Assets</p><h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{assignedCount}</h3><p className="text-xs text-emerald-600 font-semibold mt-0.5">{pct(assignedCount)} of Total</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0"><RotateCcw className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Assets</p><h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{availableCount}</h3><p className="text-xs text-cyan-600 font-semibold mt-0.5">{pct(availableCount)} of Total</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0"><Wrench className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Damaged Assets</p><h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{damagedCount}</h3><p className="text-xs text-orange-600 font-semibold mt-0.5">{pct(damagedCount)} of Total</p></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0"><Calendar className="w-6 h-6" /></div>
              <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Returns</p><h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">{overdueCount}</h3><button onClick={() => setActiveTab('Due for Return')} className="text-xs text-blue-600 hover:text-blue-700 font-bold mt-0.5 hover:underline block">View Details</button></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-900">Asset Overview</h3></div>
                {categoryOverview.length === 0 ? <p className="text-xs text-slate-400 text-center py-10">No assets yet.</p> : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 pt-1">
                    <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-xs overflow-visible" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-slate-100" strokeWidth="3.8" />
                        {categoryOverview.map((item) => {
                          const isHovered = hoveredOverviewCategory?.id === item.id
                          const isAnyHovered = Boolean(hoveredOverviewCategory)
                          return <circle key={item.id} cx="18" cy="18" r="15.9155" fill="none" className={`${item.stroke} transition-all duration-300 cursor-pointer`} strokeWidth={isHovered ? "5.4" : "4.2"} strokeDasharray={item.dasharray} strokeDashoffset={item.dashoffset} style={{ opacity: isAnyHovered ? (isHovered ? 1 : 0.3) : 1 }} onMouseEnter={() => setHoveredOverviewCategory(item)} onMouseLeave={() => setHoveredOverviewCategory(null)} />
                        })}
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-300">
                        {hoveredOverviewCategory ? (<><span className={`text-2xl font-black ${hoveredOverviewCategory.text} tracking-tight`}>{hoveredOverviewCategory.count}</span><span className={`text-[10px] font-extrabold ${hoveredOverviewCategory.text} uppercase tracking-wider`}>{hoveredOverviewCategory.name} ({hoveredOverviewCategory.percent})</span></>) : (<><span className="text-2xl font-black text-slate-900 tracking-tight">{totalAssetsCount}</span><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Assets</span></>)}
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs font-semibold text-slate-700 flex-1 pl-4 sm:pl-6">
                      {categoryOverview.map((item) => {
                        const isHovered = hoveredOverviewCategory?.id === item.id
                        const IconComp = item.icon
                        return (
                          <div key={item.id} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-2.5"><div className={`w-6 h-6 rounded-lg ${item.iconBg} border flex items-center justify-center shrink-0 transition-transform ${isHovered ? 'scale-110 shadow-xs' : ''}`}>{IconComp && <IconComp className="w-3.5 h-3.5" />}</div><span className={isHovered ? item.text + ' font-bold' : 'text-slate-700'}>{item.name}</span></div>
                            <span className={`font-bold ${isHovered ? item.text : 'text-slate-900'}`}>{item.count} ({item.percent})</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-900">Recent Assigned Assets</h3><button onClick={() => setActiveTab('Assigned Assets')} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View All</button></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <tr><th className="px-3 py-2.5">Asset Name</th><th className="px-3 py-2.5">Asset Tag</th><th className="px-3 py-2.5">Assigned To</th><th className="px-3 py-2.5">Assigned On</th><th className="px-3 py-2.5">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {assetsLoading && <tr><td colSpan="5" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                    {!assetsLoading && assets.filter(a => a.assigned_to).slice(0, 5).map((item) => {
                      const IconComp = CATEGORY_ICON[item.category?.name] || Box
                      return (
                        <tr key={item.asset_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-3 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600"><IconComp className="w-3.5 h-3.5" /></div>
                            <div><span className="block text-xs font-bold text-slate-900">{item.asset_name}</span><span className="text-[10px] text-slate-400 font-normal">{item.category?.name}</span></div>
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-600 font-semibold">{item.asset_tag}</td>
                          <td className="px-3 py-3 font-bold text-slate-900">{item.assigned_to.employee_name || '—'}</td>
                          <td className="px-3 py-3 text-slate-500 font-medium">{fmtDate(item.assigned_to.assigned_date)}</td>
                          <td className="px-3 py-3"><span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadgeStyle(item.asset_status)}`}>{item.asset_status}</span></td>
                        </tr>
                      )
                    })}
                    {!assetsLoading && assets.filter(a => a.assigned_to).length === 0 && <tr><td colSpan="5" className="py-8 text-center text-gray-400">No assets assigned yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-900">Asset Categories</h3><button onClick={() => setActiveTab('Asset Categories')} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View All</button></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-3 py-2.5">Category</th><th className="px-3 py-2.5 text-center">Total</th><th className="px-3 py-2.5">Assigned</th><th className="px-3 py-2.5">Available</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {categoryBreakdown.map((cat) => {
                      const IconComp = cat.icon
                      return (
                        <tr key={cat.category_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-3 font-bold text-slate-900 flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><IconComp className="w-3.5 h-3.5" /></div><span>{cat.name}</span></td>
                          <td className="px-3 py-3 text-center font-black text-slate-900">{cat.total}</td>
                          <td className="px-3 py-3 font-semibold text-slate-700">{cat.assigned}</td>
                          <td className="px-3 py-3 text-emerald-600 font-semibold">{cat.available}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-900">Top Asset Vendors</h3><button onClick={() => setActiveTab('Vendors')} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View All</button></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-3 py-2.5">Vendor Name</th><th className="px-3 py-2.5 text-center">Assets</th><th className="px-3 py-2.5">Total Value</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {vendors.slice(0, 5).map((v) => (
                      <tr key={v.name} className="hover:bg-slate-50/80 transition-colors"><td className="px-3 py-3 font-bold text-slate-900 truncate">{v.name}</td><td className="px-3 py-3 text-center font-black text-slate-900">{v.totalAssets}</td><td className="px-3 py-3 font-black text-blue-600">{fmtInr(v.totalValue)}</td></tr>
                    ))}
                    {vendors.length === 0 && <tr><td colSpan="3" className="py-8 text-center text-gray-400">No vendor data recorded on assets yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><Box className="w-5 h-5" /></div><div><h4 className="text-xs font-bold text-slate-900">New Asset Request</h4><p className="text-[11px] text-slate-500">Log a request on behalf of an employee</p></div></div>
              <button onClick={() => setShowNewRequestModal(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-lg transition-all shrink-0 ml-2 shadow-2xs active:scale-95">Request Now</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><RotateCcw className="w-5 h-5" /></div><div><h4 className="text-xs font-bold text-slate-900">Due for Return</h4><p className="text-[11px] text-slate-500">Review assets past their return date</p></div></div>
              <button onClick={() => setActiveTab('Due for Return')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-all shrink-0 ml-2 shadow-2xs active:scale-95">View</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100"><AlertTriangle className="w-5 h-5" /></div><div><h4 className="text-xs font-bold text-slate-900">Reported Issues</h4><p className="text-[11px] text-slate-500">{tickets.filter(t => t.status === 'open').length} open ticket(s)</p></div></div>
              <button onClick={() => setActiveTab('Reported Issues')} className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold rounded-lg transition-all shrink-0 ml-2 shadow-2xs active:scale-95">View</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100"><Calendar className="w-5 h-5" /></div><div><h4 className="text-xs font-bold text-slate-900">Pending Requests</h4><p className="text-[11px] text-slate-500">{requests.filter(r => r.status === 'pending').length} awaiting review</p></div></div>
              <button onClick={() => setActiveTab('New Asset Request')} className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 text-xs font-bold rounded-lg transition-all shrink-0 ml-2 shadow-2xs active:scale-95">View Details</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'All Assets' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by asset tag, name, brand, serial number or assignee..." className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-3 py-2 text-xs border rounded-lg font-bold transition-all ${showFilters || Object.values(filters).some(v => v) ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}><Filter className="w-3.5 h-3.5" />Filters</button>
              {(searchTerm || Object.values(filters).some(v => v)) && <button onClick={handleResetFilters} className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700">Reset</button>}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div><label className="block font-bold text-slate-700 mb-1">Status</label><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white"><option value="">All Statuses</option><option value="AVAILABLE">AVAILABLE</option><option value="ASSIGNED">ASSIGNED</option><option value="RETIRED">RETIRED</option></select></div>
                <div><label className="block font-bold text-slate-700 mb-1">Category</label><select value={filters.category_id} onChange={e => setFilters({ ...filters, category_id: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white"><option value="">All Categories</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select></div>
                <div><label className="block font-bold text-slate-700 mb-1">Condition</label><select value={filters.condition} onChange={e => setFilters({ ...filters, condition: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white"><option value="">All Conditions</option><option value="GOOD">GOOD</option><option value="DAMAGED">DAMAGED</option><option value="LOST">LOST</option></select></div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Tag #</th><th className="px-4 py-3">Asset Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Brand & Model</th><th className="px-4 py-3">Serial Number</th><th className="px-4 py-3">Assigned To</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Condition</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assetsLoading && <tr><td colSpan="9" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                {!assetsLoading && filteredAssets.length === 0 && <tr><td colSpan="9" className="py-10 text-center text-gray-400">No assets found.</td></tr>}
                {filteredAssets.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{asset.asset_tag}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{asset.asset_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{asset.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{asset.brand || '—'} {asset.model || ''}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{asset.serial_number || '—'}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      {asset.assigned_to ? (
                        <>
                          <span className="block font-bold text-slate-900">{asset.assigned_to.employee_name || '—'}</span>
                          <span className="block text-[10px] text-slate-400">
                            {[asset.assigned_to.employee_code, asset.assigned_to.department].filter(Boolean).join(' · ')}
                            {asset.assigned_to.assignment_type === 'loan' && <span className="ml-1 rounded-sm bg-amber-50 px-1 font-semibold text-amber-700">loan</span>}
                          </span>
                        </>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadgeStyle(asset.asset_status)}`}>{asset.asset_status}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getConditionBadgeStyle(asset.condition_status)}`}>{asset.condition_status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setSelectedAsset(asset); setShowAssetDetailModal(true) }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setQrAsset(asset)} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-sm" title="QR Code"><QrCode className="w-3.5 h-3.5" /></button>
                        {isAdminOrHR && <button onClick={() => openEditModal(asset)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-sm" title="Edit"><Edit className="w-3.5 h-3.5" /></button>}
                        {isAdminOrHR && asset.asset_status === 'AVAILABLE' && <button onClick={() => openAssignModal(asset)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-sm" title="Assign"><UserPlus className="w-3.5 h-3.5" /></button>}
                        {isAdminOrHR && asset.asset_status === 'ASSIGNED' && <button onClick={() => openReturnModal(asset)} className="p-1 text-amber-600 hover:bg-amber-50 rounded-sm" title="Return"><RotateCcw className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Assigned Assets' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Currently Assigned Hardware Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Asset Tag</th><th className="px-4 py-3">Asset Name</th><th className="px-4 py-3">Assigned Employee</th><th className="px-4 py-3">Assigned On</th><th className="px-4 py-3">Expected Return</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {assets.filter(a => a.asset_status === 'ASSIGNED').map((item) => (
                  <tr key={item.asset_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.asset_tag}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.asset_name} ({item.category?.name})</td>
                    <td className="px-4 py-3"><span className="block font-bold text-slate-900">{item.assigned_to?.employee_name || '—'}</span><span className="block text-[10px] text-slate-400">{[item.assigned_to?.employee_code, item.assigned_to?.department].filter(Boolean).join(' · ')}</span></td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{fmtDate(item.assigned_to?.assigned_date)}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{fmtDate(item.assigned_to?.expected_return)}</td>
                    <td className="px-4 py-3 text-right">{isAdminOrHR && <button onClick={() => openReturnModal(item)} className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-sm text-xs font-bold transition-all">Initiate Return</button>}</td>
                  </tr>
                ))}
                {assets.filter(a => a.asset_status === 'ASSIGNED').length === 0 && <tr><td colSpan="6" className="py-10 text-center text-gray-400">No assets currently assigned.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Loans' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Assets Currently On Loan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Asset Tag</th><th className="px-4 py-3">Asset Name</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Loaned On</th><th className="px-4 py-3">Due Back</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loansLoading && <tr><td colSpan="6" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                {!loansLoading && loans.map((loan) => (
                  <tr key={loan.assignment_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{loan.asset_tag}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{loan.asset_name}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{loan.employee_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{fmtDate(loan.assigned_date)}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{fmtDate(loan.expected_return)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full ${loan.is_overdue ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {loan.is_overdue ? 'Overdue' : 'On Track'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loansLoading && loans.length === 0 && <tr><td colSpan="6" className="py-10 text-center text-gray-400">No assets currently on loan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'New Asset Request' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Employee Hardware Requests</h3><button onClick={() => setShowNewRequestModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-2xs">+ New Request</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Req ID</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Requested Hardware</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requestsLoading && <tr><td colSpan="8" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!requestsLoading && requests.length === 0 && <tr><td colSpan="8" className="py-8 text-center text-gray-400">No asset requests submitted yet.</td></tr>}
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">REQ-{req.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{req.employee_name} ({req.employee_role})</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{req.asset_type}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{fmtDate(req.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">{req.priority}</td>
                    <td className="px-4 py-3 text-slate-600">{req.reason}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${req.status === 'approved' || req.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' : req.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{req.status}</span></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {req.status === 'pending' && isAdminOrHR ? (
                        <>
                          <button onClick={() => handleApproveRequest(req)} className="px-2.5 py-1 bg-emerald-600 text-white rounded-sm text-[11px] font-bold hover:bg-emerald-700">Approve</button>
                          <button onClick={() => handleRejectRequest(req)} className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-sm text-[11px] font-bold hover:bg-rose-100">Reject</button>
                        </>
                      ) : req.status === 'approved' && isAdminOrHR ? (
                        <button onClick={() => openAllocate(req)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-sm text-[11px] font-bold hover:bg-blue-700"><PackageCheck className="w-3.5 h-3.5" />Allocate Asset</button>
                      ) : <span className="text-slate-400 italic capitalize">{req.status !== 'pending' ? req.status : ''}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Due for Return' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Assets With an Expected Return Date</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Asset Tag</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Assigned Employee</th><th className="px-4 py-3">Expected Return</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dueForReturn.map((item) => {
                  const isOverdue = new Date(item.assigned_to.expected_return) < new Date()
                  return (
                    <tr key={item.asset_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.asset_tag}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{item.asset_name}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.assigned_to.employee_name}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{fmtDate(item.assigned_to.expected_return)}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-cyan-100 text-cyan-800'}`}>{isOverdue ? 'Overdue' : 'Upcoming'}</span></td>
                      <td className="px-4 py-3 text-right">{isAdminOrHR && <button onClick={() => openReturnModal(item)} className="px-3 py-1 bg-blue-600 text-white rounded-sm text-xs font-bold hover:bg-blue-700">Return Now</button>}</td>
                    </tr>
                  )
                })}
                {dueForReturn.length === 0 && <tr><td colSpan="6" className="py-10 text-center text-gray-400">No assets have an expected return date set.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Reported Issues' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Hardware Malfunctions & Repair Tickets</h3><button onClick={() => setShowReportIssueModal(true)} className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-all shadow-2xs">+ Log Ticket</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold"><tr><th className="px-4 py-3">Ticket ID</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Update Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ticketsLoading && <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading…</td></tr>}
                {!ticketsLoading && tickets.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-gray-400">No issues reported yet.</td></tr>}
                {tickets.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">TKT-{tkt.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{tkt.employee_name}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{tkt.asset_name}</td>
                    <td className="px-4 py-3 text-amber-700 font-bold">{tkt.issue_type}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{fmtDate(tkt.created_at)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-sm text-[10px] font-bold capitalize">{tkt.status.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-right">
                      {isAdminOrHR && tkt.status !== 'closed' && (
                        <select value={tkt.status} onChange={e => handleTicketStatusChange(tkt, e.target.value)} className="text-[11px] font-bold border border-slate-300 rounded-lg px-2 py-1 bg-white">
                          <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Asset History' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Asset Audit & History Logs</h3>
          <div className="space-y-3">
            {historyLoading && <p className="text-xs text-gray-400 text-center py-8">Loading…</p>}
            {!historyLoading && history.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No assignment activity recorded yet.</p>}
            {history.map((log) => (
              <div key={log.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">{log.action.charAt(0)}</div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between"><span className="font-bold text-slate-900">{log.asset_name} ({log.asset_tag})</span><span className="text-[11px] text-slate-400 font-mono font-medium">{fmtDate(log.date)}</span></div>
                  <p className="text-slate-600 mt-0.5"><span className="font-bold text-blue-700">{log.action}</span> by {log.performer} to {log.recipient}</p>
                  <p className="text-slate-500 text-[11px] mt-1 italic">"{log.notes}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Asset Categories' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Asset Categories Directory</h3>{isAdminOrHR && <button onClick={() => setShowAddCategoryModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-2xs">+ Add Category</button>}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryBreakdown.map((cat) => {
              const IconComp = cat.icon
              return (
                <div key={cat.category_id} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><IconComp className="w-4 h-4 text-slate-500" />{cat.name}</h4><span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-xs">{cat.total} items</span></div>
                  <div className="text-xs text-slate-600 space-y-1.5 mt-3">
                    <p className="flex justify-between"><span>Assigned:</span> <span className="font-bold text-slate-800">{cat.assigned}</span></p>
                    <p className="flex justify-between"><span>Available:</span> <span className="font-bold text-emerald-600">{cat.available}</span></p>
                    <p className="flex justify-between"><span>Damaged:</span> <span className="font-bold text-amber-600">{cat.damaged}</span></p>
                  </div>
                </div>
              )
            })}
            {categoryBreakdown.length === 0 && <p className="text-xs text-gray-400 text-center py-8 col-span-3">No categories yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'Vendors' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Vendors Derived From Asset Purchase Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <div key={v.name} className="p-4 border border-slate-200/80 rounded-xl bg-white shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0"><ShoppingBag className="w-5 h-5" /></span>
                  <div><h4 className="font-bold text-slate-900 text-sm">{v.name}</h4><p className="text-[11px] text-slate-400">Last Purchase: {fmtDate(v.lastPurchase)}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-black text-blue-600">{fmtInr(v.totalValue)}</p><p className="text-xs text-slate-500 font-semibold">{v.totalAssets} Assets Supplied</p></div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-xs text-gray-400 text-center py-8 col-span-2">No vendor names have been recorded on any asset purchase yet.</p>}
          </div>
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowAddEditModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50"><h2 className="text-base font-bold text-slate-900">{selectedAsset ? "Edit Asset" : "Add New Company Asset"}</h2><button onClick={() => setShowAddEditModal(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleAddAssetSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block font-bold text-slate-700 mb-1">Asset Tag *</label><input type="text" value={assetFormData.asset_tag} onChange={e => setAssetFormData({ ...assetFormData, asset_tag: e.target.value })} placeholder="AST-LAP-1023" className="w-full p-2.5 border border-slate-300 rounded-lg font-mono" required /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Asset Name *</label><input type="text" value={assetFormData.asset_name} onChange={e => setAssetFormData({ ...assetFormData, asset_name: e.target.value })} placeholder="MacBook Pro 16" className="w-full p-2.5 border border-slate-300 rounded-lg font-bold" required /></div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category *</label>
                    <select value={assetFormData.category_id} onChange={e => setAssetFormData({ ...assetFormData, category_id: e.target.value, sub_category_id: '' })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required>
                      <option value="">Select category</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sub-Category *</label>
                    <select value={assetFormData.sub_category_id} onChange={e => setAssetFormData({ ...assetFormData, sub_category_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required disabled={!assetFormData.category_id}>
                      <option value="">Select sub-category</option>{subCategories.map(s => <option key={s.sub_category_id} value={s.sub_category_id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block font-bold text-slate-700 mb-1">Brand</label><input type="text" value={assetFormData.brand} onChange={e => setAssetFormData({ ...assetFormData, brand: e.target.value })} placeholder="Apple / Dell" className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Model</label><input type="text" value={assetFormData.model} onChange={e => setAssetFormData({ ...assetFormData, model: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Serial Number</label><input type="text" value={assetFormData.serial_number} onChange={e => setAssetFormData({ ...assetFormData, serial_number: e.target.value })} placeholder="SN-992019" className="w-full p-2.5 border border-slate-300 rounded-lg font-mono" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Purchase Cost (₹)</label><input type="number" value={assetFormData.purchase_cost} onChange={e => setAssetFormData({ ...assetFormData, purchase_cost: e.target.value })} placeholder="125000" className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Purchase Date</label><input type="date" value={assetFormData.purchase_date} onChange={e => setAssetFormData({ ...assetFormData, purchase_date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Vendor Name</label><input type="text" value={assetFormData.vendor_name} onChange={e => setAssetFormData({ ...assetFormData, vendor_name: e.target.value })} placeholder="e.g. Amazon India Pvt. Ltd." className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                  <div className="md:col-span-2"><label className="block font-bold text-slate-700 mb-1">Location</label><input type="text" value={assetFormData.location} onChange={e => setAssetFormData({ ...assetFormData, location: e.target.value })} placeholder="Head Office - Bangalore" className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddEditModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={createAsset.isPending || updateAsset.isPending} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-xs disabled:opacity-60">{createAsset.isPending || updateAsset.isPending ? 'Saving…' : 'Save Asset'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Asset Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowAssignModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Assign Asset to Employee</h2><button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block font-bold text-slate-700 mb-1">Asset Tag & Name</label><input type="text" disabled value={`${selectedAsset?.asset_name} (${selectedAsset?.asset_tag})`} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-900" /></div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                  <select value={assignFormData.employee_id} onChange={e => setAssignFormData({ ...assignFormData, employee_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold" required>
                    <option value="">Select employee</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.designation || emp.emp_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignment Type</label>
                  <select value={assignFormData.assignment_type} onChange={e => setAssignFormData({ ...assignFormData, assignment_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold">
                    <option value="permanent">Permanent</option>
                    <option value="loan">Loan (temporary)</option>
                  </select>
                </div>
                <div><label className="block font-bold text-slate-700 mb-1">Assigned Date *</label><input type="date" value={assignFormData.assigned_date} onChange={e => setAssignFormData({ ...assignFormData, assigned_date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required /></div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Return {assignFormData.assignment_type === 'loan' ? '*' : '(optional)'}</label>
                  <input type="date" value={assignFormData.expected_return} onChange={e => setAssignFormData({ ...assignFormData, expected_return: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required={assignFormData.assignment_type === 'loan'} />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={assignAsset.isPending} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60">{assignAsset.isPending ? 'Assigning…' : 'Assign Asset'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Asset Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowReturnModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Return Asset to Storage</h2><button onClick={() => setShowReturnModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleReturnSubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block font-bold text-slate-700 mb-1">Selected Asset</label><input type="text" disabled value={`${selectedAsset?.asset_name} (${selectedAsset?.asset_tag})`} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold" /></div>
                <div><label className="block font-bold text-slate-700 mb-1">Returned By</label><input type="text" disabled value={selectedAsset?.assigned_to?.employee_name || ''} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-bold" /></div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Return Condition</label>
                  <select value={returnFormData.condition_out} onChange={e => setReturnFormData({ ...returnFormData, condition_out: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold">
                    <option value="GOOD">GOOD (Working Fine)</option><option value="DAMAGED">DAMAGED (Needs Repair)</option><option value="LOST">LOST</option>
                  </select>
                </div>
                <div><label className="block font-bold text-slate-700 mb-1">Remarks</label><textarea rows={2} value={returnFormData.remarks} onChange={e => setReturnFormData({ ...returnFormData, remarks: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="Optional notes..." /></div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={returnAsset.isPending} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-60">{returnAsset.isPending ? 'Processing…' : 'Confirm Return'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {showAssetDetailModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowAssetDetailModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Asset Full Specification</h2><button onClick={() => setShowAssetDetailModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4 text-xs">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div><h3 className="text-base font-black text-slate-900">{selectedAsset?.asset_name}</h3><p className="text-xs font-mono font-bold text-blue-600 mt-0.5">{selectedAsset?.asset_tag}</p></div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusBadgeStyle(selectedAsset?.asset_status)}`}>{selectedAsset?.asset_status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div><span className="text-slate-400 block">Category:</span><span className="font-bold">{selectedAsset?.category?.name || '—'}</span></div>
                  <div><span className="text-slate-400 block">Brand / Model:</span><span className="font-bold">{selectedAsset?.brand || '—'} {selectedAsset?.model || ''}</span></div>
                  <div><span className="text-slate-400 block">Serial Number:</span><span className="font-mono font-bold text-slate-900">{selectedAsset?.serial_number || '—'}</span></div>
                  <div><span className="text-slate-400 block">Purchase Value:</span><span className="font-bold text-blue-600">{fmtInr(selectedAsset?.purchase_cost)}</span></div>
                  <div><span className="text-slate-400 block">Vendor:</span><span className="font-bold">{selectedAsset?.vendor_name || '—'}</span></div>
                  <div><span className="text-slate-400 block">Purchase Date:</span><span className="font-bold">{fmtDate(selectedAsset?.purchase_date)}</span></div>
                  {selectedAsset?.assigned_to && <><div><span className="text-slate-400 block">Assigned To:</span><span className="font-bold">{selectedAsset.assigned_to.employee_name}</span></div><div><span className="text-slate-400 block">Assigned On:</span><span className="font-bold">{fmtDate(selectedAsset.assigned_to.assigned_date)}</span></div></>}
                </div>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <Link to={`/asset/${encodeURIComponent(selectedAsset?.asset_tag || '')}`} className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100"><ExternalLink className="w-3.5 h-3.5" />Full page & history</Link>
                  <button onClick={() => { setShowAssetDetailModal(false); setQrAsset(selectedAsset) }} className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"><QrCode className="w-3.5 h-3.5" />QR Label</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowAddCategoryModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Add New Category</h2><button onClick={() => setShowAddCategoryModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleAddCategorySubmit} className="p-6 space-y-4 text-xs">
                <div><label className="block font-bold text-slate-700 mb-1">Category Name *</label><input type="text" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} placeholder="e.g. Network Equipment" className="w-full p-2.5 border border-slate-300 rounded-lg" required /></div>
                <div><label className="block font-bold text-slate-700 mb-1">Description</label><textarea rows={2} value={categoryFormData.description} onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button><button type="submit" disabled={createCategory.isPending} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-60">{createCategory.isPending ? 'Saving…' : 'Save'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Request Modal */}
      <AnimatePresence>
        {showNewRequestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowNewRequestModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Log Asset Request</h2><button onClick={() => setShowNewRequestModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                  <select value={requestFormData.employee_id} onChange={e => setRequestFormData({ ...requestFormData, employee_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold" required>
                    <option value="">Select employee</option>{employees.map(emp => <option key={emp.emp_id} value={emp.emp_id}>{emp.full_name} ({emp.designation || emp.emp_id})</option>)}
                  </select>
                </div>
                <div><label className="block font-bold text-slate-700 mb-1">Asset Name / Model *</label><input type="text" value={requestFormData.asset_type} onChange={e => setRequestFormData({ ...requestFormData, asset_type: e.target.value })} placeholder="e.g. Dell 27 inch 4K USB-C Monitor" className="w-full p-2.5 border border-slate-300 rounded-lg" required /></div>
                <div><label className="block font-bold text-slate-700 mb-1">Priority</label><select value={requestFormData.priority} onChange={e => setRequestFormData({ ...requestFormData, priority: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"><option value="Medium">Medium</option><option value="High">High (Urgent project deliverable)</option><option value="Low">Low</option></select></div>
                <div><label className="block font-bold text-slate-700 mb-1">Business Reason *</label><textarea rows={3} value={requestFormData.reason} onChange={e => setRequestFormData({ ...requestFormData, reason: e.target.value })} placeholder="Provide justification for equipment request..." className="w-full p-2.5 border border-slate-300 rounded-lg" required></textarea></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowNewRequestModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button><button type="submit" disabled={createAssetRequest.isPending} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-60">{createAssetRequest.isPending ? 'Submitting…' : 'Submit Request'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Issue Modal */}
      <AnimatePresence>
        {showReportIssueModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowReportIssueModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Report Asset Malfunction / Issue</h2><button onClick={() => setShowReportIssueModal(false)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleTicketSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                  <select value={ticketFormData.employee_id} onChange={e => setTicketFormData({ ...ticketFormData, employee_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold" required>
                    <option value="">Select employee</option>{employees.map(emp => <option key={emp.emp_id} value={emp.emp_id}>{emp.full_name} ({emp.designation || emp.emp_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Asset *</label>
                  <select value={ticketFormData.asset_id} onChange={e => setTicketFormData({ ...ticketFormData, asset_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold" required>
                    <option value="">Select asset</option>{assets.map(a => (<option key={a.asset_id} value={a.asset_id}>{a.asset_name} ({a.asset_tag})</option>))}
                  </select>
                </div>
                <div><label className="block font-bold text-slate-700 mb-1">Issue Category</label><select value={ticketFormData.issue_type} onChange={e => setTicketFormData({ ...ticketFormData, issue_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold"><option value="Hardware Malfunction">Hardware Malfunction</option><option value="Battery / Power Issue">Battery / Power Issue</option><option value="Screen / Display Defect">Screen / Display Defect</option></select></div>
                <div><label className="block font-bold text-slate-700 mb-1">Description *</label><textarea rows={3} value={ticketFormData.description} onChange={e => setTicketFormData({ ...ticketFormData, description: e.target.value })} placeholder="Describe the malfunction..." className="w-full p-2.5 border border-slate-300 rounded-lg" required></textarea></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowReportIssueModal(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button><button type="submit" disabled={createAssetTicket.isPending} className="flex-1 py-2.5 bg-orange-600 text-white font-bold rounded-lg disabled:opacity-60">{createAssetTicket.isPending ? 'Logging…' : 'Log Ticket'}</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Allocate an asset against an approved request */}
      <AnimatePresence>
        {allocatingRequest && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setAllocatingRequest(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50"><h2 className="text-base font-bold text-slate-900">Allocate Asset - REQ-{allocatingRequest.id}</h2><button onClick={() => setAllocatingRequest(null)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleAllocateSubmit} className="p-6 space-y-4 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="font-bold text-slate-900">{allocatingRequest.employee_name}</p>
                  <p className="text-slate-500">Asked for: <span className="font-semibold text-slate-700">{allocatingRequest.asset_type}</span></p>
                  {!requestEmployee(allocatingRequest) && <p className="mt-1 text-rose-600">This employee isn't in the active employee list, so nothing can be assigned to them.</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asset to hand over *</label>
                  <select value={allocateForm.asset_id} onChange={e => setAllocateForm({ ...allocateForm, asset_id: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold" required>
                    <option value="">Select an available asset</option>
                    {assets.filter(a => a.asset_status === 'AVAILABLE').map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_tag} - {a.asset_name}{a.brand ? ` (${a.brand})` : ''}</option>)}
                  </select>
                  {assets.filter(a => a.asset_status === 'AVAILABLE').length === 0 && <p className="mt-1 text-amber-600">No assets are available - add or return one first.</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assignment Type</label>
                  <select value={allocateForm.assignment_type} onChange={e => setAllocateForm({ ...allocateForm, assignment_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-semibold">
                    <option value="permanent">Permanent</option>
                    <option value="loan">Loan (temporary)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block font-bold text-slate-700 mb-1">Assigned Date *</label><input type="date" value={allocateForm.assigned_date} onChange={e => setAllocateForm({ ...allocateForm, assigned_date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required /></div>
                  <div><label className="block font-bold text-slate-700 mb-1">Expected Return {allocateForm.assignment_type === 'loan' ? '*' : ''}</label><input type="date" value={allocateForm.expected_return} onChange={e => setAllocateForm({ ...allocateForm, expected_return: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg bg-white" required={allocateForm.assignment_type === 'loan'} /></div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setAllocatingRequest(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-lg">Cancel</button>
                  <button type="submit" disabled={assignAsset.isPending || !requestEmployee(allocatingRequest)} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60">{assignAsset.isPending ? 'Allocating…' : 'Allocate & Fulfil'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal - print and paste on the physical asset */}
      <AnimatePresence>
        {qrAsset && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setQrAsset(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between bg-slate-50">
                <h2 className="text-sm font-bold text-slate-900">Asset QR Code</h2>
                <button onClick={() => setQrAsset(null)} className="p-1 hover:bg-slate-200 rounded-sm text-slate-500"><X className="w-4 h-4" /></button>
              </div>
              <div id="asset-qr-print-area" className="p-6 flex flex-col items-center gap-3 text-center">
                <QRCodeCanvas id="asset-qr-canvas" value={assetScanUrl(qrAsset.asset_tag)} size={200} level="M" marginSize={2} />
                <p className="font-mono font-bold text-slate-900">{qrAsset.asset_tag}</p>
                <p className="text-xs text-slate-500">{qrAsset.asset_name}</p>
                <p className="text-[10px] text-slate-400 break-all">Scan with any phone camera to open this asset in the HRMS.</p>
                <a href={assetScanUrl(qrAsset.asset_tag)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-blue-600 hover:underline">Test the link</a>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => {
                    const canvas = document.getElementById('asset-qr-canvas')
                    const url = canvas.toDataURL('image/png')
                    const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
                    const w = window.open('')
                    if (!w) { toast.error('Allow pop-ups to print the label'); return }
                    w.document.write(`<html><head><title>${esc(qrAsset.asset_tag)}</title></head><body style="margin:0;display:flex;justify-content:center;font-family:Arial,sans-serif">
                      <div style="border:1px solid #ccc;border-radius:8px;padding:10px 14px;text-align:center;width:200px">
                        <div style="font-weight:700;font-size:13px;color:#1B6AB4">TruckMitr Asset</div>
                        <img src="${url}" style="width:170px;height:170px" />
                        <div style="font-family:monospace;font-weight:700;font-size:14px">${esc(qrAsset.asset_tag)}</div>
                        <div style="font-size:11px;color:#555">${esc(qrAsset.asset_name)}</div>
                      </div>
                      <script>window.onload=function(){window.print();window.close()}<\/script></body></html>`)
                    w.document.close()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
