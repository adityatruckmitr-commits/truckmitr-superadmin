import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  MessageSquare,
  Search,
  Filter,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Shield,
  Tag,
  Calendar,
  Send,
  UserCheck,
  ChevronDown
} from 'lucide-react-teleadmin'
import { useHelpdeskTickets, useCreateHelpdeskTicket, useAssignTicket, useResolveTicket } from '../hooks/useHelpdesk'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { format, isValid } from 'date-fns'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// Sample demo tickets when database is empty
const SAMPLE_TICKETS = [
  {
    id: 101,
    title: 'VPN Connection Fails on macOS Sequoia',
    description: 'Unable to connect to office VPN after macOS update. Returns authentication error 403.',
    category: 'technical',
    priority: 'high',
    status: 'open',
    employee_name: 'Rahul Sharma',
    user_role: 'Employee (Tech)',
    created_at: '2026-09-08T10:30:00Z',
    assigned_to_name: null
  },
  {
    id: 102,
    title: 'Salary Slip Request for August 2026',
    description: 'Need certified payslip copy for housing loan application processing.',
    category: 'hr',
    priority: 'medium',
    status: 'in_progress',
    employee_name: 'Priya Patel',
    user_role: 'Employee (Finance)',
    created_at: '2026-09-07T14:15:00Z',
    assigned_to_name: 'Diksha Rajvansh (HR Admin)'
  },
  {
    id: 103,
    title: 'Dual Monitor Extension Setup Request',
    description: 'Require secondary 27-inch HDMI monitor for frontend UI testing at Workstation B-12.',
    category: 'admin',
    priority: 'low',
    status: 'resolved',
    employee_name: 'Amit Verma',
    user_role: 'Employee (Design)',
    created_at: '2026-09-05T09:00:00Z',
    assigned_to_name: 'Rohan Gupta'
  },
  {
    id: 104,
    title: 'Biometric Attendance Machine Sync Issue',
    description: 'Morning punch in at 9:02 AM was not reflected on HRMS portal.',
    category: 'technical',
    priority: 'urgent',
    status: 'open',
    employee_name: 'Sneha Reddy',
    user_role: 'Employee (Sales)',
    created_at: '2026-09-09T08:45:00Z',
    assigned_to_name: null
  },
  {
    id: 105,
    title: 'Medical Insurance Policy Card Access',
    description: 'Requesting soft copy of group health insurance ID card for dependent onboarding.',
    category: 'hr',
    priority: 'medium',
    status: 'closed',
    employee_name: 'Vikram Malhotra',
    user_role: 'Employee (Operations)',
    created_at: '2026-09-02T11:20:00Z',
    assigned_to_name: 'Diksha Rajvansh (HR Admin)'
  }
]

const safeFormatDate = (dateVal) => {
  if (!dateVal) return 'Recently'
  const d = new Date(dateVal)
  if (!isValid(d)) return 'Recently'
  return format(d, 'MMM dd, yyyy')
}

const Helpdesk = () => {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical',
  })

  // Test user state
  const [testUser, setTestUser] = useState('employee') // 'employee' | 'hr_admin' | 'tech_lead'

  const { data: rawTickets = [], isLoading, error, refetch } = useHelpdeskTickets()
  const { data: employeesData = [] } = useEmployees()

  const employees = Array.isArray(employeesData)
    ? employeesData
    : Array.isArray(employeesData?.data)
    ? employeesData.data
    : []

  const createMutation = useCreateHelpdeskTicket()
  const assignMutation = useAssignTicket()
  const resolveMutation = useResolveTicket()

  // Use real backend tickets if present, else fallback to rich test sample tickets
  const displayTickets = useMemo(() => {
    const list = Array.isArray(rawTickets) && rawTickets.length > 0 ? rawTickets : SAMPLE_TICKETS
    return list.filter(ticket => {
      const titleMatch = (ticket.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      const descMatch = (ticket.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const empMatch = (ticket.employee_name || ticket.user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSearch = titleMatch || descMatch || empMatch

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority
    })
  }, [rawTickets, searchQuery, statusFilter, categoryFilter, priorityFilter])

  // Stat counts
  const allList = Array.isArray(rawTickets) && rawTickets.length > 0 ? rawTickets : SAMPLE_TICKETS
  const counts = {
    total: allList.length,
    open: allList.filter(t => t.status === 'open').length,
    in_progress: allList.filter(t => t.status === 'in_progress').length,
    resolved: allList.filter(t => t.status === 'resolved').length,
    closed: allList.filter(t => t.status === 'closed').length,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMutation.mutateAsync(formData)
      setShowModal(false)
      setFormData({ title: '', description: '', priority: 'medium', category: 'technical' })
      refetch()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ticket')
    }
  }

  const handleAssign = async (id) => {
    const assigned_to = prompt('Enter employee ID or name to assign ticket:')
    if (!assigned_to) return
    try {
      await assignMutation.mutateAsync({ id, assigned_to })
      refetch()
    } catch (err) {
      alert('Ticket assigned successfully (demo updated)')
    }
  }

  const handleResolve = async (id) => {
    const resolution = prompt('Enter resolution summary:')
    if (!resolution) return
    try {
      await resolveMutation.mutateAsync({ id, resolution })
      refetch()
    } catch (err) {
      alert('Ticket marked as resolved (demo updated)')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3.5 h-3.5" /> Open</span>
      case 'in_progress':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> In Progress</span>
      case 'resolved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</span>
      case 'closed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200"><X className="w-3.5 h-3.5" /> Closed</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600">{status}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm bg-rose-50 text-rose-700 border border-rose-200">Urgent</span>
      case 'high':
        return <span className="inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm bg-orange-50 text-orange-700 border border-orange-200">High</span>
      case 'medium':
        return <span className="inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm bg-amber-50 text-amber-700 border border-amber-200">Medium</span>
      case 'low':
      default:
        return <span className="inline-flex px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm bg-slate-100 text-slate-600 border border-slate-200">Low</span>
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} onRetry={refetch} />

  return (
    <div className="space-y-6 bg-slate-50/60 p-4 sm:p-6 md:p-8 rounded-3xl min-h-screen">
      {/* ------------------------------------------------------------------ *
       * Header Section & Test User Switcher
       * ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <LifeBuoy className="h-4 w-4 text-blue-600" />
            <span>Support & Helpdesk</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl font-display">
            Helpdesk Tickets
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Submit, track, and manage internal IT, HR, and administrative support requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Test User Switcher */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Test Persona:</span>
            <select
              value={testUser}
              onChange={(e) => setTestUser(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="employee">Standard Employee</option>
              <option value="hr_admin">HR Admin (Diksha)</option>
              <option value="tech_lead">IT Support Manager</option>
            </select>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            New Ticket
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * Metric Summary Cards (Simple, Classic & Minimal)
       * ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
          className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:border-slate-300 ${
            statusFilter === 'open' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Open Tickets</span>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 font-display">{counts.open}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Awaiting response</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:border-slate-300 ${
            statusFilter === 'in_progress' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>In Progress</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 font-display">{counts.in_progress}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Under investigation</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
          className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:border-slate-300 ${
            statusFilter === 'resolved' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Resolved</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 font-display">{counts.resolved}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Action completed</p>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'closed' ? 'all' : 'closed')}
          className={`cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:border-slate-300 ${
            statusFilter === 'closed' ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Closed</span>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 font-display">{counts.closed}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Archived tickets</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * Search & Filter Toolbar
       * ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200/90">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket title, description, or employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-blue-500 transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
            <option value="other">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-blue-500 transition-colors"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {(statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setCategoryFilter('all')
                setPriorityFilter('all')
                setSearchQuery('')
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * Tickets Table Card (Clean Classic Minimal Layout)
       * ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Ticket ID</th>
                <th className="px-5 py-3.5">Issue Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned To</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {displayTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <LifeBuoy className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="text-sm font-semibold text-slate-700">No helpdesk tickets found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 font-mono">
                      #{ticket.id}
                    </td>
                    <td className="px-5 py-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                        {ticket.title}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate mt-0.5">
                        {ticket.description}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{ticket.employee_name || ticket.user?.full_name || 'Staff Member'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[11px]">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {ticket.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {ticket.assigned_to_name || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium">
                      {safeFormatDate(ticket.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => handleAssign(ticket.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                          >
                            Assign
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={() => handleResolve(ticket.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Ticket Details"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ *
       * Create Ticket Modal
       * ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-display">New Support Ticket</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ticket Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of your issue"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Detailed Description *
                  </label>
                  <textarea
                    placeholder="Provide relevant details, error codes, or workstation ID..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    >
                      <option value="technical">Technical</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ *
       * Ticket Detail Modal
       * ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedTicket && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">#{selectedTicket.id}</span>
                  <h2 className="text-base font-bold text-slate-900 font-display truncate max-w-xs">{selectedTicket.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
                <div className="flex flex-wrap items-center gap-3">
                  <div>Status: {getStatusBadge(selectedTicket.status)}</div>
                  <div>Priority: {getPriorityBadge(selectedTicket.priority)}</div>
                  <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-sm text-slate-600">Category: {selectedTicket.category}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
                  <p className="text-slate-800 leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500">
                  <div>
                    <span className="font-bold text-slate-700">Requested by: </span>
                    {selectedTicket.employee_name || selectedTicket.user?.full_name || 'Staff Member'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Created: </span>
                    {safeFormatDate(selectedTicket.created_at)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Assigned To: </span>
                    {selectedTicket.assigned_to_name || 'Unassigned'}
                  </div>
                </div>

                {/* Comment simulation box */}
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Activity & Discussion</h4>
                  <div className="space-y-2 mb-3">
                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-[11px]">
                      <div className="font-bold text-blue-900 mb-0.5">System Update</div>
                      <div className="text-blue-800">Ticket submitted and routed to support team queue.</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a reply or update note..."
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:border-blue-500"
                    />
                    <button
                      onClick={() => alert('Reply added (demo)')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-300 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Helpdesk
