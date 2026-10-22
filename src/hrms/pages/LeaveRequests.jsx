import { useState, useRef, useEffect } from 'react'
import { useHighlightId } from '../hooks/useHighlightId'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Eye, Trash2, Edit, XCircle, Download } from 'lucide-react-teleadmin'
import FileUpload from '../components/FileUpload'
import { 
  useLeaveRequests, 
  useCreateLeaveRequest, 
  useUpdateLeaveRequest,
  useApproveLeaveRequest, 
  useRejectLeaveRequest,
  useCancelLeaveRequest,
  useDeleteLeaveRequest,
  useLeaveBalance,
  useRequestCancellation,
  useApproveCancellation,
  useRejectCancellation
} from '../hooks/useLeaveRequests'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { getTeamMembers, getTeamMemberIds, canManageTeam, hasFullAccess } from '../utils/teamFilter'
import { HRMS_FILE_ORIGIN } from '../env'

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' },
]

const LeaveRequests = () => {
  const { user } = useAuth()
  const isHR = hasFullAccess(user) // HR, admin, super admin, CEO and manager see everyone's records
  const canManage = canManageTeam(user)

  const highlightId = useHighlightId()
  const rowRefs = useRef({})
  
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [showCancellationRejectModal, setShowCancellationRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationRejectionReason, setCancellationRejectionReason] = useState('')
  const [selectedEmployeeForBalance, setSelectedEmployeeForBalance] = useState('')
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedLeaveType, setSelectedLeaveType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [attachmentFile, setAttachmentFile] = useState(null)

  // Get all employees and filter by team
  const { data: employeesResponse } = useEmployees()
  const allEmployees = employeesResponse?.data || employeesResponse || []
  const teamMembers = getTeamMembers(allEmployees, user)
  const teamMemberIds = getTeamMemberIds(allEmployees, user)
  
  // Build query params - for team managers, don't filter by employee_id in API
  // We'll filter on frontend after getting all data
  const params = canManage ? {
    ...(selectedEmployee && { employee_id: selectedEmployee }),
    ...(selectedLeaveType && { leave_type: selectedLeaveType }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  } : {
    employee_id: user?.emp_id,
    ...(selectedLeaveType && { leave_type: selectedLeaveType }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  }

  const { data: leaveResponse, isLoading } = useLeaveRequests(params)
  const { data: balanceResponse } = useLeaveBalance(
    selectedEmployeeForBalance || user?.emp_id, 
    new Date().getFullYear()
  )
  
  // Filter requests by team if user is a team manager (not admin/HR)
  // Team managers should see their team's requests + their own requests
  const allRequests = leaveResponse?.data || []
  const requests = (canManage && !isHR) 
    ? allRequests.filter(req => 
        teamMemberIds.includes(req.employee_id) || req.employee_id === user?.emp_id
      )
    : allRequests
  const employees = teamMembers

  useEffect(() => {
    if (highlightId && rowRefs.current[highlightId]) {
      setTimeout(() => {
        rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [highlightId, requests])
  const balances = balanceResponse?.data || []
  
  const createMutation = useCreateLeaveRequest()
  const updateMutation = useUpdateLeaveRequest()
  const approveMutation = useApproveLeaveRequest()
  const rejectMutation = useRejectLeaveRequest()
  const cancelMutation = useCancelLeaveRequest()
  const deleteMutation = useDeleteLeaveRequest()
  const requestCancellationMutation = useRequestCancellation()
  const approveCancellationMutation = useApproveCancellation()
  const rejectCancellationMutation = useRejectCancellation()

  const resetForm = () => {
    setFormData({
      employee_id: (isHR || canManage) ? '' : user?.emp_id || '',
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: '',
    })
    setAttachmentFile(null)
    setEditingRequest(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // For non-HR users (including team managers), always use their own emp_id
      const dataToSubmit = {
        ...formData,
        employee_id: isHR ? formData.employee_id : user?.emp_id
      }
      
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key]) {
          submitData.append(key, dataToSubmit[key])
        }
      })
      
      if (attachmentFile) {
        submitData.append('attachment', attachmentFile)
      }

      if (editingRequest) {
        await updateMutation.mutateAsync({
          id: editingRequest.id,
          data: submitData
        })
        toast.success('Leave request updated successfully')
      } else {
        await createMutation.mutateAsync(submitData)
        toast.success('Leave request created successfully')
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save request'
      toast.error(errorMsg)
    }
  }

  const handleEdit = (request) => {
    setEditingRequest(request)
    setFormData({
      employee_id: request.employee_id,
      leave_type: request.leave_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
    })
    setAttachmentFile(null)
    setShowModal(true)
  }

  const handleApprove = async (request) => {
    if (!window.confirm('Approve this leave request?')) return
    try {
      await approveMutation.mutateAsync({ 
        id: request.id, 
        approved_by: user.emp_id 
      })
      toast.success('Leave request approved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = (request) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
  }

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      await rejectMutation.mutateAsync({ 
        id: selectedRequest.id, 
        approved_by: user.emp_id,
        rejection_reason: rejectionReason
      })
      toast.success('Leave request rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request? If approved, balance will be restored.')) return
    try {
      await cancelMutation.mutateAsync(id)
      toast.success('Leave request cancelled')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Leave request deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request')
    }
  }

  const handleRequestCancellation = (request) => {
    console.log('Request cancellation for:', request)
    console.log('Cancellation status:', request.cancellation_status)
    setSelectedRequest(request)
    setShowCancellationModal(true)
  }

  const submitCancellationRequest = async () => {
    if (!cancellationReason.trim() || cancellationReason.trim().length < 10) {
      toast.error('Please provide a cancellation reason (minimum 10 characters)')
      return
    }
    try {
      await requestCancellationMutation.mutateAsync({ 
        id: selectedRequest.id, 
        cancellation_reason: cancellationReason
      })
      toast.success('Cancellation request submitted. Waiting for HR approval.')
      setShowCancellationModal(false)
      setCancellationReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit cancellation request')
    }
  }

  const handleApproveCancellation = async (request) => {
    if (!window.confirm('Approve this cancellation request? The leave will be cancelled and balance will be restored.')) return
    try {
      await approveCancellationMutation.mutateAsync({ 
        id: request.id, 
        approved_by: user.emp_id 
      })
      toast.success('Cancellation approved. Leave has been cancelled.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve cancellation')
    }
  }

  const handleRejectCancellation = (request) => {
    setSelectedRequest(request)
    setShowCancellationRejectModal(true)
  }

  const submitCancellationRejection = async () => {
    if (!cancellationRejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      await rejectCancellationMutation.mutateAsync({ 
        id: selectedRequest.id, 
        approved_by: user.emp_id,
        cancellation_rejection_reason: cancellationRejectionReason
      })
      toast.success('Cancellation request rejected')
      setShowCancellationRejectModal(false)
      setCancellationRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject cancellation request')
    }
  }

  const clearFilters = () => {
    setSelectedEmployee('')
    setSelectedLeaveType('')
    setSelectedStatus('')
    setStartDate('')
    setEndDate('')
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      pending_hr: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getLeaveTypeLabel = (type) => {
    return LEAVE_TYPES.find(t => t.value === type)?.label || type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHR ? 'Leave Requests' : canManage ? 'Team Leave Requests' : 'My Leave Requests'}
          </h1>
          <p className="text-gray-600 mt-1">{requests.length} total requests</p>
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={() => setShowBalanceModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Leave Balance
          </button> */}
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${canManage ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          {canManage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{isHR ? 'All Employees' : 'All Team Members'}</option>
                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.full_name} ({emp.emp_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {canManage && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Period</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? "7" : "6"} className="px-6 py-8 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <motion.tr
                    key={request.id}
                    ref={(el) => (rowRefs.current[request.id] = el)}
                    data-hl={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`transition-colors ${highlightId === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    {canManage && (
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            const employee = employees.find(emp => emp.emp_id === request.employee_id)
                            return employee?.full_name || request.employee?.full_name || 'Me'
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.employee_id}
                        </div>
                      </td>
                    )}
                    <td className="px-4 md:px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {getLeaveTypeLabel(request.leave_type)}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.start_date ? format(parseISO(request.start_date), 'MMM dd') : 'N/A'}
                        {' - '}
                        {request.end_date ? format(parseISO(request.end_date), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 font-medium">
                      {parseInt(request.total_days) || 0} days
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="truncate" title={request.reason}>
                        {request.reason || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status === 'pending_hr' ? 'Awaiting HR' : request.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Show approve/reject buttons only for team members' requests (not own requests).
                            'pending' = awaiting the manager stage, 'pending_hr' = manager cleared it and it's
                            awaiting HR's final review - the backend enforces who may actually act on each. */}
                        {canManage && ['pending', 'pending_hr'].includes(request.status) && request.employee_id !== user?.emp_id && (
                          <>
                            <button
                              onClick={() => handleApprove(request)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-sm transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Show edit/cancel buttons for own requests or if it's pending */}
                        {request.status === 'pending' && request.employee_id === user?.emp_id && (
                          <>
                            <button
                              onClick={() => handleEdit(request)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(request.id)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded-sm transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Request cancellation for own approved requests */}
                        {request.status === 'approved' && request.employee_id === user?.emp_id && (!request.cancellation_status || request.cancellation_status === 'none') && (
                          <button
                            onClick={() => handleRequestCancellation(request)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded-sm transition-colors"
                            title="Request Cancellation"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Show cancellation pending status and approve/reject for managers */}
                        {request.status === 'approved' && request.cancellation_status === 'pending' && (
                          <>
                            <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 rounded-sm">
                              Cancellation Pending
                            </span>
                            {canManage && request.employee_id !== user?.emp_id && (
                              <>
                                <button
                                  onClick={() => handleApproveCancellation(request)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-sm transition-colors"
                                  title="Approve Cancellation"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectCancellation(request)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                                  title="Reject Cancellation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded-sm transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Delete button only for own pending requests */}
                        {request.status === 'pending' && request.employee_id === user?.emp_id && (
                          <button
                            onClick={() => handleDelete(request.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
                </h2>
                <button 
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {isHR && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      disabled={!!editingRequest}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.full_name} ({emp.emp_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                  <select
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {LEAVE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    min={formData.start_date}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="Please provide a reason for leave..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
                  <FileUpload
                    file={attachmentFile}
                    onFileChange={setAttachmentFile}
                    onFileRemove={() => setAttachmentFile(null)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    maxSize={5}
                  />
                  {editingRequest?.attachment && !attachmentFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Current file: <span className="font-medium">{editingRequest.attachment.split('/').pop()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? 'Saving...' 
                      : editingRequest ? 'Update Request' : 'Create Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowRejectModal(false)
              setRejectionReason('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Reject Leave Request</h2>
                <button 
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="4"
                    placeholder="Please provide a reason for rejection..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={submitRejection}
                    disabled={rejectMutation.isPending}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Request Modal */}
      <AnimatePresence>
        {showCancellationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCancellationModal(false)
              setCancellationReason('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Request Leave Cancellation</h2>
                <button 
                  onClick={() => {
                    setShowCancellationModal(false)
                    setCancellationReason('')
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Your approved leave will require HR approval to cancel. Please provide a reason for the cancellation request.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason * (min 10 characters)</label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="4"
                    placeholder="Please provide a detailed reason for cancellation..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={submitCancellationRequest}
                    disabled={requestCancellationMutation.isPending}
                    className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {requestCancellationMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancellationModal(false)
                      setCancellationReason('')
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Rejection Modal (HR Only) */}
      <AnimatePresence>
        {showCancellationRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCancellationRejectModal(false)
              setCancellationRejectionReason('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Reject Cancellation Request</h2>
                <button 
                  onClick={() => {
                    setShowCancellationRejectModal(false)
                    setCancellationRejectionReason('')
                  }} 
                  className="p-1 hover:bg-gray-100 rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {selectedRequest && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                    <p className="text-sm"><span className="font-medium">Employee:</span> {selectedRequest.employee?.full_name}</p>
                    <p className="text-sm"><span className="font-medium">Leave Type:</span> {getLeaveTypeLabel(selectedRequest.leave_type)}</p>
                    <p className="text-sm"><span className="font-medium">Dates:</span> {format(parseISO(selectedRequest.start_date), 'MMM dd')} - {format(parseISO(selectedRequest.end_date), 'MMM dd, yyyy')}</p>
                    <p className="text-sm"><span className="font-medium">Cancellation Reason:</span> {selectedRequest.cancellation_reason}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea
                    value={cancellationRejectionReason}
                    onChange={(e) => setCancellationRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="4"
                    placeholder="Please provide a reason for rejecting the cancellation request..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={submitCancellationRejection}
                    disabled={rejectCancellationMutation.isPending}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {rejectCancellationMutation.isPending ? 'Rejecting...' : 'Reject Cancellation'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCancellationRejectModal(false)
                      setCancellationRejectionReason('')
                    }}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Balance Modal */}
      <AnimatePresence>
        {showBalanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBalanceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Leave Balance</h2>
                <button onClick={() => setShowBalanceModal(false)} className="p-1 hover:bg-gray-100 rounded-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {isHR && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                    <select
                      value={selectedEmployeeForBalance}
                      onChange={(e) => setSelectedEmployeeForBalance(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.full_name} ({emp.emp_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {balances.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {balances.map((balance) => (
                      <div key={balance.id} className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-100">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                          {getLeaveTypeLabel(balance.leave_type)}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Allocated:</span>
                            <span className="font-semibold text-gray-900">{balance.total_allocated} days</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-semibold text-red-600">{balance.used} days</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-primary-200">
                            <span className="text-gray-700 font-medium">Remaining:</span>
                            <span className="font-bold text-green-600">{balance.remaining} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {isHR && !selectedEmployeeForBalance 
                      ? 'Please select an employee to view their leave balance'
                      : 'No leave balance data available'}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRequest && !showRejectModal && !showCancellationModal && !showCancellationRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">Leave Request Details</h2>
                <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-100 rounded-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        const employee = employees.find(emp => emp.emp_id === selectedRequest.employee_id)
                        return employee?.full_name || selectedRequest.employee?.full_name || 'N/A'
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900">{selectedRequest.employee_id}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Leave Type</label>
                  <p className="text-gray-900 font-medium">{getLeaveTypeLabel(selectedRequest.leave_type)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">
                      {selectedRequest.start_date ? format(parseISO(selectedRequest.start_date), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">
                      {selectedRequest.end_date ? format(parseISO(selectedRequest.end_date), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Total Days</label>
                  <p className="text-gray-900 font-semibold text-lg">{selectedRequest.total_days || 0} days</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.attachment && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Attachment</label>
                    <a
                      href={`${HRMS_FILE_ORIGIN}/storage/${selectedRequest.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline mt-1"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{selectedRequest.attachment.split('/').pop()}</span>
                    </a>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status === 'pending_hr' ? 'Awaiting HR' : selectedRequest.status}
                    </span>
                  </div>
                </div>

                {/* Manager stage - visible here to HR, the manager themself, and CEO/Management alike */}
                {selectedRequest.manager_id && (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">Manager Decision</label>
                    <p className="text-gray-900 font-medium">
                      {selectedRequest.manager?.full_name || `ID: ${selectedRequest.manager_id}`}
                      {selectedRequest.manager_status && (
                        <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusColor(selectedRequest.manager_status)}`}>
                          {selectedRequest.manager_status}
                        </span>
                      )}
                    </p>
                    {selectedRequest.manager_acted_at && (
                      <p className="text-xs text-gray-500">{format(parseISO(selectedRequest.manager_acted_at), 'MMMM dd, yyyy hh:mm a')}</p>
                    )}
                    {selectedRequest.manager_remarks && (
                      <p className="text-xs text-gray-600 italic">"{selectedRequest.manager_remarks}"</p>
                    )}
                  </div>
                )}

                {selectedRequest.approved_by && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {selectedRequest.status === 'approved' ? 'Approved By (HR/Final)' : 'Reviewed By (HR/Final)'}
                    </label>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        const approver = employees.find(emp => emp.emp_id === selectedRequest.approved_by)
                        return approver?.full_name || selectedRequest.approver?.full_name || `ID: ${selectedRequest.approved_by}`
                      })()}
                    </p>
                  </div>
                )}

                {selectedRequest.approved_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {selectedRequest.status === 'approved' ? 'Approved At' : 'Reviewed At'}
                    </label>
                    <p className="text-gray-900">
                      {format(parseISO(selectedRequest.approved_at), 'MMMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                    <p className="text-red-700 bg-red-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.rejection_reason}</p>
                  </div>
                )}

                {/* Cancellation Information */}
                {selectedRequest.cancellation_status && selectedRequest.cancellation_status !== 'none' && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Cancellation Request</h3>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cancellation Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${
                          selectedRequest.cancellation_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          selectedRequest.cancellation_status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedRequest.cancellation_status}
                        </span>
                      </div>
                    </div>

                    {selectedRequest.cancellation_reason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cancellation Reason</label>
                        <p className="text-gray-900 bg-orange-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.cancellation_reason}</p>
                      </div>
                    )}

                    {selectedRequest.cancellation_requested_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Requested At</label>
                        <p className="text-gray-900">
                          {format(parseISO(selectedRequest.cancellation_requested_at), 'MMMM dd, yyyy hh:mm a')}
                        </p>
                      </div>
                    )}

                    {selectedRequest.cancellation_approved_by && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reviewed By</label>
                        <p className="text-gray-900 font-medium">
                          {(() => {
                            const approver = employees.find(emp => emp.emp_id === selectedRequest.cancellation_approved_by)
                            return approver?.full_name || `ID: ${selectedRequest.cancellation_approved_by}`
                          })()}
                        </p>
                      </div>
                    )}

                    {selectedRequest.cancellation_approved_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reviewed At</label>
                        <p className="text-gray-900">
                          {format(parseISO(selectedRequest.cancellation_approved_at), 'MMMM dd, yyyy hh:mm a')}
                        </p>
                      </div>
                    )}

                    {selectedRequest.cancellation_rejection_reason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                        <p className="text-red-700 bg-red-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.cancellation_rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Created: {format(parseISO(selectedRequest.created_at), 'MMM dd, yyyy hh:mm a')}</p>
                  <p>Updated: {format(parseISO(selectedRequest.updated_at), 'MMM dd, yyyy hh:mm a')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LeaveRequests