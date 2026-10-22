import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Trophy,
  Gift,
  Award,
  Users,
  Plus,
  Search,
  Eye,
  MoreVertical,
  ThumbsUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
  Star,
  Filter,
  ShieldCheck,
  Trash2,
  Copy,
  ChevronDown,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { useEmployees } from '../hooks/useEmployees'
import { Avatar, cx } from '../components/ui'
import {
  useRecognitions,
  useCreateRecognition,
  useDeleteRecognition,
  useToggleRecognitionLike,
  useRewardsTopPerformers,
  useRewardsStats,
  useNominations,
  useCreateNomination,
  useDeleteNomination,
} from '../hooks/useRewards'

const CATEGORIES = ['Performance', 'Innovation', 'Teamwork', 'Customer Focus', 'Milestone', 'Other']
const REWARD_TYPES = ['Amazon Voucher', 'Cash Award', 'Gadget / Electronic', 'Flipkart Voucher', 'Extra Leave Day']
const CATEGORY_COLORS = { Performance: 'bg-blue-500', Innovation: 'bg-emerald-500', Teamwork: 'bg-amber-500', 'Customer Focus': 'bg-purple-500', Milestone: 'bg-rose-500', Other: 'bg-gray-400' }

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtMoney = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`
const nominationStatusLabel = { under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }

export default function HRRewards() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: rawRecognitions, isLoading: recLoading } = useRecognitions({ viewer_id: user?.emp_id })
  const { data: rawEmployees } = useEmployees()
  const { data: topPerformers } = useRewardsTopPerformers()
  const { data: rewardStats } = useRewardsStats()
  const { data: rawNominations } = useNominations()

  const createRecognition = useCreateRecognition()
  const deleteRecognition = useDeleteRecognition()
  const toggleLike = useToggleRecognitionLike()
  const createNomination = useCreateNomination()
  const deleteNomination = useDeleteNomination()

  const employees = useMemo(
    () => (Array.isArray(rawEmployees) ? rawEmployees : []).filter(e => (e.status === 'Verified' || !e.status) && (e.is_active === true || e.is_active === 1)),
    [rawEmployees]
  )
  const recognitions = Array.isArray(rawRecognitions) ? rawRecognitions : []
  const nominations = Array.isArray(rawNominations) ? rawNominations : []

  const [activeTab, setActiveTab] = useState('Recent Recognitions')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRec, setSelectedRec] = useState(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false)

  const [showFullWall, setShowFullWall] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)

  useEffect(() => {
    if (!openMenuId) return undefined
    const onPointerDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null) }
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpenMenuId(null) }
    const onReflow = () => setOpenMenuId(null)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [openMenuId])

  const toggleRowMenu = (e, id) => {
    if (openMenuId === id) { setOpenMenuId(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const MENU_W = 176
    setMenuPos({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.right - MENU_W, window.innerWidth - MENU_W - 8)) })
    setOpenMenuId(id)
  }

  const handleLike = (rec) => {
    toggleLike.mutate({ id: rec.id, employee_id: user?.emp_id }, {
      onSuccess: (res) => toast.success(res.data.liked ? 'Applauded recognition!' : 'Applause removed'),
      onError: () => toast.error('Failed to update applause'),
    })
  }

  const handleIssueReward = (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const employeeId = data.get('employee')
    if (!employeeId) { toast.error('Please select an employee'); return }
    createRecognition.mutate({
      employee_id: employeeId,
      achievement: (data.get('achievement') || '').trim() || `${data.get('category')} Award`,
      achievement_desc: (data.get('message') || '').trim(),
      category: data.get('category'),
      reward_type: data.get('reward'),
      reward_value: Number(data.get('value')) || 0,
      comment: (data.get('message') || '').trim() || 'Thank you for your outstanding contribution!',
      recognized_by: user?.emp_id,
    }, {
      onSuccess: () => {
        setActiveTab('Recent Recognitions')
        setCurrentPage(1)
        setIsCreateModalOpen(false)
        toast.success('Reward issued successfully!')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to issue reward'),
    })
  }

  const handleNominate = (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const employeeId = data.get('employee')
    if (!employeeId) { toast.error('Please select an employee'); return }
    createNomination.mutate({
      employee_id: employeeId,
      award: data.get('award'),
      reason: (data.get('reason') || '').trim(),
      nominated_by: user?.emp_id,
    }, {
      onSuccess: () => {
        setActiveTab('My Nominations')
        setIsNominateModalOpen(false)
        toast.success('Nomination submitted!')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit nomination'),
    })
  }

  const handleWithdrawNomination = (id) => {
    deleteNomination.mutate(id, {
      onSuccess: () => toast.success('Nomination withdrawn'),
      onError: () => toast.error('Failed to withdraw nomination'),
    })
  }

  const handleDeleteRecognition = (id) => {
    deleteRecognition.mutate(id, {
      onSuccess: () => toast.success('Recognition deleted'),
      onError: () => toast.error('Failed to delete recognition'),
    })
    setOpenMenuId(null)
  }

  const handleDuplicateRecognition = (rec) => {
    createRecognition.mutate({
      employee_id: rec.employee_id,
      achievement: rec.achievement,
      achievement_desc: rec.achievement_desc,
      category: rec.category,
      reward_type: rec.reward_type,
      reward_value: rec.reward_value,
      comment: rec.comment,
      recognized_by: user?.emp_id,
    }, {
      onSuccess: () => toast.success('Recognition duplicated'),
      onError: () => toast.error('Failed to duplicate'),
    })
    setOpenMenuId(null)
  }

  const handleCopyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id))
      toast.success(`Copied ID ${id}`)
    } catch {
      toast.error('Clipboard is unavailable in this browser')
    }
    setOpenMenuId(null)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('All')
    setCurrentPage(1)
    setActiveTab('Recent Recognitions')
  }

  const filteredRecognitions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return recognitions.filter((r) => {
      const matchesQuery = !q ||
        r.employee_name.toLowerCase().includes(q) ||
        r.achievement.toLowerCase().includes(q) ||
        (r.reward_type || '').toLowerCase().includes(q) ||
        (r.recognized_by || '').toLowerCase().includes(q)
      const matchesCat = categoryFilter === 'All' || r.category === categoryFilter
      return matchesQuery && matchesCat
    })
  }, [recognitions, searchQuery, categoryFilter])

  const ITEMS_PER_PAGE = 5
  const totalPages = Math.max(1, Math.ceil(filteredRecognitions.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const firstIndex = (safePage - 1) * ITEMS_PER_PAGE
  const paginatedRecs = filteredRecognitions.slice(firstIndex, firstIndex + ITEMS_PER_PAGE)
  const wallItems = showFullWall ? filteredRecognitions : filteredRecognitions.slice(0, 4)
  const isFiltered = searchQuery.trim() !== '' || categoryFilter !== 'All'

  const byCategory = rewardStats?.by_category || []
  const categoryTotal = byCategory.reduce((s, c) => s + c.count, 0) || 1
  const topPerformer = topPerformers?.[0]
  const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5">
            <button type="button" onClick={() => navigate('/dashboard')} className="hover:text-gray-800 hover:underline">Home</button>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <button type="button" onClick={clearFilters} className="hover:text-gray-800 hover:underline">Rewards &amp; Recognition</button>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold">Overview</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Rewards & Recognition</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"><ShieldCheck className="h-3.5 w-3.5" /> HR Portal</span>
          </div>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all">
          <Plus className="h-4.5 w-4.5" /> Create New Reward
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Rewards Given', value: `${rewardStats?.total_rewards_this_year ?? 0}`, sub: 'This Year', icon: <Trophy className="h-4.5 w-4.5 text-blue-600" />, iconBg: 'bg-blue-50 border-blue-100' },
          { label: 'Total Gifts Given', value: fmtMoney(rewardStats?.total_gift_value_this_year ?? 0), sub: 'This Year', icon: <Gift className="h-4.5 w-4.5 text-emerald-600" />, iconBg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Employees Recognized', value: `${rewardStats?.employees_recognized ?? 0}`, sub: 'This Year', icon: <Star className="h-4.5 w-4.5 text-amber-600" />, iconBg: 'bg-amber-50 border-amber-100' },
          { label: 'Pending Approvals', value: `${rewardStats?.pending_approvals ?? 0}`, sub: 'Requires Approval', icon: <Award className="h-4.5 w-4.5 text-purple-600" />, iconBg: 'bg-purple-50 border-purple-100' },
          { label: 'Active Nominations', value: String(nominations.length), sub: 'Open for review', icon: <Users className="h-4.5 w-4.5 text-indigo-600" />, iconBg: 'bg-indigo-50 border-indigo-100' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-2xs hover:border-gray-300 transition-all group">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{card.label}</p>
              <h2 className="text-xl font-extrabold text-gray-950 mt-1 tracking-tight">{card.value}</h2>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{card.sub}</p>
            </div>
            <span className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105', card.iconBg)}>{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-2 overflow-x-auto">
              {['Recent Recognitions', 'Top Performers', 'My Nominations'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cx('whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors', activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300')}>{tab}</button>
              ))}
            </nav>
          </div>

          {activeTab === 'Recent Recognitions' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gray-50/60">
                  <h2 className="text-base font-bold text-gray-900">Recent Recognitions</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search recognition..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="w-56 rounded-lg border border-gray-300 bg-white pl-8 pr-8 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-hidden" />
                      {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setCurrentPage(1) }} title="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                    <div className="relative">
                      <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} aria-label="Filter by category" className="appearance-none rounded-lg border border-gray-300 bg-white pl-8 pr-7 py-1.5 text-xs font-semibold text-gray-800 focus:border-blue-500 focus:outline-hidden cursor-pointer">
                        <option value="All">All Categories</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={clearFilters} disabled={!isFiltered} title={isFiltered ? 'Clear filters' : 'No filters applied'} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed">View All Recognitions</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-600">
                      <tr>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Employee</th>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Achievement</th>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Reward / Gift</th>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Recognized By</th>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                        <th className="py-3 px-5 font-semibold uppercase tracking-wider text-[11px] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recLoading && <tr><td colSpan="6" className="py-10 text-center text-gray-400">Loading…</td></tr>}
                      {!recLoading && paginatedRecs.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={rec.employee_name} src={rec.employee_photo} size="xs" />
                              <div><p className="text-xs font-bold text-gray-900 leading-tight">{rec.employee_name}</p><p className="text-[11px] text-gray-500 mt-0.5">{rec.employee_role}</p></div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <p className="text-xs font-bold text-gray-900">{rec.achievement}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[180px]">{rec.achievement_desc}</p>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0"><Gift className="h-3.5 w-3.5" /></span>
                              <div><p className="text-xs font-bold text-gray-950">{rec.reward_type || '—'}</p><p className="text-[11px] font-semibold text-emerald-600">{fmtMoney(rec.reward_value)}</p></div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap"><p className="text-xs font-semibold text-gray-900">{rec.recognized_by}</p></td>
                          <td className="py-3.5 px-5 text-xs text-gray-600 whitespace-nowrap">{fmtDate(rec.created_at)}</td>
                          <td className="py-3.5 px-5 whitespace-nowrap text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button onClick={() => setSelectedRec(rec)} title="View Details" className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs"><Eye className="h-3.5 w-3.5" /></button>
                              <div ref={openMenuId === rec.id ? menuRef : null}>
                                <button onClick={(e) => toggleRowMenu(e, rec.id)} title="More Actions" aria-haspopup="menu" aria-expanded={openMenuId === rec.id} className={cx('inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs', openMenuId === rec.id ? 'border-blue-400 text-blue-600' : 'border-gray-200')}>
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                {openMenuId === rec.id && (
                                  <div role="menu" style={{ top: menuPos.top, left: menuPos.left }} className="fixed z-40 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
                                    <button role="menuitem" onClick={() => { setSelectedRec(rec); setOpenMenuId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Eye className="h-3.5 w-3.5 text-gray-400" /> View details</button>
                                    <button role="menuitem" onClick={() => handleCopyId(rec.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Copy className="h-3.5 w-3.5 text-gray-400" /> Copy award ID</button>
                                    <button role="menuitem" onClick={() => handleDuplicateRecognition(rec)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Sparkles className="h-3.5 w-3.5 text-gray-400" /> Duplicate award</button>
                                    <div className="my-1 border-t border-gray-100" />
                                    <button role="menuitem" onClick={() => handleDeleteRecognition(rec.id)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Delete recognition</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!recLoading && filteredRecognitions.length === 0 && (
                        <tr><td colSpan="6" className="py-12 text-center text-gray-400">
                          <Trophy className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                          <p className="text-xs font-semibold">No recognitions match your filters</p>
                          {isFiltered && <button onClick={clearFilters} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">Clear filters</button>}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 text-xs">
                  <span className="text-gray-500">
                    {filteredRecognitions.length === 0 ? 'No recognitions to show' : <>Showing <strong className="font-semibold text-gray-800">{firstIndex + 1}</strong> to <strong className="font-semibold text-gray-800">{firstIndex + paginatedRecs.length}</strong> of <strong className="font-semibold text-gray-800">{filteredRecognitions.length}</strong> recognitions</>}
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button key={page} onClick={() => setCurrentPage(page)} aria-current={page === safePage ? 'page' : undefined} className={cx('h-7 w-7 rounded-sm text-xs font-semibold transition-colors', page === safePage ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100')}>{page}</button>
                      ))}
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2"><Sparkles className="h-4.5 w-4.5 text-amber-500" /><h2 className="text-base font-bold text-gray-900">Recognition Wall</h2></div>
                  <button onClick={() => setShowFullWall((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    {showFullWall ? 'Show Less' : `View Full Wall (${filteredRecognitions.length})`}
                    <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', showFullWall && 'rotate-180')} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wallItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3 hover:border-gray-300 hover:bg-white transition-all shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={item.recognized_by} size="xs" />
                        <div className="min-w-0"><p className="text-xs font-bold text-gray-900 truncate">{item.recognized_by} <span className="font-normal text-gray-500">recognized</span> {item.employee_name}</p><p className="text-[10px] text-gray-400">{fmtDate(item.created_at)}</p></div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium bg-white/80 p-2.5 rounded-lg border border-gray-100">"{item.comment}"</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"><Gift className="h-3.5 w-3.5" />{item.reward_type || 'Recognition'}</span>
                        <button onClick={() => handleLike(item)} title={item.i_liked ? 'Remove your applause' : 'Applaud this recognition'} aria-pressed={item.i_liked} className={cx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border shadow-2xs active:scale-95 transition-colors', item.i_liked ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:text-blue-600')}>
                          <ThumbsUp className={cx('h-3.5 w-3.5', item.i_liked ? 'fill-blue-600 text-blue-600' : 'text-blue-600')} />
                          <span>{item.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {wallItems.length === 0 && <p className="col-span-full py-8 text-center text-xs font-semibold text-gray-400">No recognitions match your filters yet.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Top Performers' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">Leaderboard · Top Recognized Performers</h2>
              <div className="space-y-3">
                {(topPerformers || []).length === 0 && <p className="text-xs text-gray-400 text-center py-8">No recognitions yet — issue a reward to start the leaderboard.</p>}
                {(topPerformers || []).map((tp, i) => (
                  <div key={tp.employee_id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={cx('flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-2xs', i === 0 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200' : i === 1 ? 'bg-slate-300 text-slate-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600')}>#{i + 1}</span>
                      <Avatar name={tp.name} src={tp.photo} size="sm" />
                      <div><p className="text-sm font-bold text-gray-900">{tp.name}</p><p className="text-xs text-gray-500">{tp.department}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-xs font-bold text-gray-950">{tp.awards_count} Rewards Won</p><p className="text-[11px] font-semibold text-emerald-600">{fmtMoney(tp.total_value)}</p></div>
                      <button onClick={() => { setSearchQuery(tp.name); setCategoryFilter('All'); setCurrentPage(1); setActiveTab('Recent Recognitions') }} title={`See every recognition for ${tp.name}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all">View Awards<ChevronRight className="h-3.5 w-3.5 text-gray-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'My Nominations' && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/60 px-6 py-4">
                <div className="flex items-center gap-2"><h2 className="text-base font-bold text-gray-900">Nominations</h2><span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">{nominations.length}</span></div>
                <button onClick={() => setIsNominateModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"><Plus className="h-3.5 w-3.5" /> New Nomination</button>
              </div>
              <div className="divide-y divide-gray-100">
                {nominations.map((nom) => (
                  <div key={nom.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 hover:bg-gray-50/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{nom.employee_name}</p>
                        <span className="font-mono text-[10px] text-gray-400">NOM-{nom.id}</span>
                        <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold', nom.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : nom.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>{nominationStatusLabel[nom.status]}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold text-blue-600">{nom.award}</p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">{nom.reason}</p>
                      <p className="mt-1 text-[10px] text-gray-400">{nom.department} · Raised by {nom.nominated_by} on {fmtDate(nom.created_at)}</p>
                    </div>
                    {nom.status === 'under_review' && (
                      <button onClick={() => handleWithdrawNomination(nom.id)} title="Withdraw this nomination" className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 shadow-2xs hover:bg-rose-50 active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5" /> Withdraw</button>
                    )}
                  </div>
                ))}
                {nominations.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-xs font-semibold text-gray-400">No nominations raised yet</p>
                    <button onClick={() => setIsNominateModalOpen(true)} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">Nominate an employee</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Top Recognized · {currentMonthLabel}</h3>
            {topPerformer ? (
              <div className="flex items-center gap-3">
                <Avatar name={topPerformer.name} src={topPerformer.photo} size="lg" />
                <div>
                  <p className="text-base font-bold text-gray-950">{topPerformer.name}</p>
                  <p className="text-xs text-gray-500">{topPerformer.department}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">{topPerformer.awards_count} rewards · {fmtMoney(topPerformer.total_value)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No recognitions given yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Recognition by Category</h3>
            {byCategory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No recognitions yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {byCategory.map((item) => {
                  const pct = Math.round((item.count / categoryTotal) * 100)
                  return (
                    <button key={item.category} onClick={() => { setCategoryFilter(categoryFilter === item.category ? 'All' : item.category); setCurrentPage(1); setActiveTab('Recent Recognitions') }} title={`Filter recognitions by ${item.category}`} className={cx('flex w-full items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-gray-700 transition-colors hover:bg-gray-50', categoryFilter === item.category && 'bg-blue-50 text-blue-800')}>
                      <div className="flex items-center gap-2"><span className={cx('h-2.5 w-2.5 rounded-full', CATEGORY_COLORS[item.category] || 'bg-gray-400')} /><span className="font-semibold">{item.category}</span></div>
                      <span className="font-bold text-gray-900">{item.count} ({pct}%)</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-gray-900 mb-2">Quick Actions</h3>
            {[
              { label: 'Nominate Employee', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200', action: () => setIsNominateModalOpen(true) },
              { label: 'Give Spot Reward', icon: Gift, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', action: () => setIsCreateModalOpen(true) },
            ].map((qa) => {
              const Icon = qa.icon
              return (
                <button key={qa.label} onClick={qa.action} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50/80 hover:border-gray-300 transition-all text-xs font-semibold text-gray-800 shadow-2xs group">
                  <div className="flex items-center gap-2.5"><span className={cx('flex h-7 w-7 items-center justify-center rounded-md border', qa.color)}><Icon className="h-3.5 w-3.5" /></span><span>{qa.label}</span></div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setIsCreateModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs"><Trophy className="h-4 w-4" /></span><h2 className="text-base font-bold text-gray-950">Issue New Reward / Spot Award</h2></div>
                <button onClick={() => setIsCreateModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleIssueReward} className="space-y-4 p-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee <span className="text-rose-500">*</span></label>
                  <select name="employee" required defaultValue="" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">
                    <option value="" disabled>Select Employee</option>
                    {employees.map((emp) => <option key={emp.emp_id} value={emp.emp_id}>{emp.full_name} ({emp.designation})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Achievement Title</label>
                  <input name="achievement" type="text" placeholder="e.g. Innovation Award" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Achievement Category</label>
                    <select name="category" defaultValue="Performance" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Gift / Reward Type</label>
                    <select name="reward" defaultValue={REWARD_TYPES[0]} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">{REWARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monetary Value (₹)</label>
                  <input name="value" type="number" min="0" placeholder="e.g. 10000" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Appreciation Message / Note</label>
                  <textarea name="message" rows={3} placeholder="Write a note of appreciation..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={createRecognition.isPending} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs active:scale-95 transition-all disabled:opacity-60"><Send className="h-3.5 w-3.5" /> {createRecognition.isPending ? 'Issuing…' : 'Issue Reward'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRec && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelectedRec(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <h2 className="text-base font-bold text-gray-950">Recognition Details</h2>
                <button onClick={() => setSelectedRec(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4 p-6 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <Avatar name={selectedRec.employee_name} src={selectedRec.employee_photo} size="md" />
                  <div><h3 className="text-sm font-bold text-gray-950">{selectedRec.employee_name}</h3><p className="text-xs text-gray-500">{selectedRec.employee_role}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="font-semibold text-gray-500 uppercase tracking-wider">Achievement</p><p className="font-bold text-gray-900 mt-0.5">{selectedRec.achievement}</p></div>
                  <div><p className="font-semibold text-gray-500 uppercase tracking-wider">Category</p><p className="font-bold text-blue-600 mt-0.5">{selectedRec.category}</p></div>
                  <div><p className="font-semibold text-gray-500 uppercase tracking-wider">Reward</p><p className="font-bold text-emerald-600 mt-0.5">{selectedRec.reward_type} ({fmtMoney(selectedRec.reward_value)})</p></div>
                  <div><p className="font-semibold text-gray-500 uppercase tracking-wider">Date</p><p className="font-bold text-gray-900 mt-0.5">{fmtDate(selectedRec.created_at)}</p></div>
                </div>
                <div><p className="font-semibold text-gray-500 uppercase tracking-wider">Recognition Note</p><p className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-700 leading-relaxed font-medium">"{selectedRec.comment}"</p></div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-500">
                  <span>Recognized by: <strong>{selectedRec.recognized_by}</strong></span>
                  <span className="flex items-center gap-1 font-semibold text-blue-600"><ThumbsUp className="h-3.5 w-3.5" /> {selectedRec.likes} Applauds</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNominateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setIsNominateModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/70">
                <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs"><Users className="h-4 w-4" /></span><h2 className="text-base font-bold text-gray-950">Nominate an Employee</h2></div>
                <button onClick={() => setIsNominateModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleNominate} className="space-y-4 p-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Employee <span className="text-rose-500">*</span></label>
                  <select name="employee" required defaultValue="" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden">
                    <option value="" disabled>Select Employee</option>
                    {employees.map((emp) => <option key={emp.emp_id} value={emp.emp_id}>{emp.full_name} — {emp.designation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Award <span className="text-rose-500">*</span></label>
                  <input name="award" required type="text" placeholder="e.g. Employee of the Month" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Justification <span className="text-rose-500">*</span></label>
                  <textarea name="reason" required rows={4} placeholder="Why does this person deserve the award?" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setIsNominateModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">Cancel</button>
                  <button type="submit" disabled={createNomination.isPending} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs active:scale-95 transition-all disabled:opacity-60"><Send className="h-3.5 w-3.5" /> {createNomination.isPending ? 'Submitting…' : 'Submit Nomination'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
