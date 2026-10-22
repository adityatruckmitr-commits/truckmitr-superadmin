import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Edit, Eye, Trash2, Download } from 'lucide-react-teleadmin'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  useShortLeaves, 
  useShortLeave, 
  useCreateShortLeave, 
  useUpdateShortLeave, 
  useApproveShortLeave, 
  useRejectShortLeave, 
  useDeleteShortLeave 
} from '../hooks/useShortLeave'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { useHighlightId } from '../hooks/useHighlightId'
import { format, parseISO, isPast, isToday } from 'date-fns'
import toast from 'react-hot-toast'
import { getTeamMembers, getTeamMemberIds, canManageTeam, hasFullAccess } from '../utils/teamFilter'
import { HRMS_FILE_ORIGIN } from '../env'

const ShortLeave = () => {
  const { user } = useAuth()
  const isHR = hasFullAccess(user) // HR, admin, super admin, CEO and manager see everyone's records
  const canManage = canManageTeam(user)
  
  const highlightId = useHighlightId()
  const rowRefs = useRef({})
  
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_date: '',
    from_time: '',
    to_time: '',
    total_hours: '',
    reason: ''
  })
  const [attachmentFile, setAttachmentFile] = useState(null)

  // Fetch all employees for dropdown
  const { data: employeesResponse } = useEmployees()
  const allEmployees = employeesResponse?.data || employeesResponse || []
  const teamMembers = getTeamMembers(allEmployees, user)
  const teamMemberIds = getTeamMemberIds(allEmployees, user)
  
  // Build query params
  const params = canManage ? {
    ...(selectedEmployee && { employee_id: selectedEmployee }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate })
  } : {
    employee_id: user?.emp_id,
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate })
  }

  const { data: shortLeaveResponse, isLoading } = useShortLeaves(params)
  const { data: singleRequestResponse } = useShortLeave(selectedRequest?.id)
  
  const allRequests = shortLeaveResponse?.data || []
  
  // Filter by team if user is manager (and not admin/HR)
  const teamRequests = (canManage && !isHR) 
    ? allRequests.filter(req => teamMemberIds.includes(req.employee_id) || req.employee_id === user?.emp_id)
    : allRequests

  // Filter out pending requests that are in the past
  const filteredRequests = useMemo(() => {
    return teamRequests.filter(req => {
      if (req.status === 'pending' && req.leave_date && !isHR) {
        const leaveDate = parseISO(req.leave_date)
        return !isPast(leaveDate) || isToday(leaveDate)
      }
      return true
    })
  }, [teamRequests, isHR])

  useEffect(() => {
    if (highlightId && rowRefs.current[highlightId]) {
      setTimeout(() => {
        rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [highlightId, filteredRequests])

  const createMutation = useCreateShortLeave()
  const updateMutation = useUpdateShortLeave()
  const approveMutation = useApproveShortLeave()
  const rejectMutation = useRejectShortLeave()
  const deleteMutation = useDeleteShortLeave()

  const resetForm = () => {
    setFormData({
      employee_id: (isHR || canManage) ? '' : user?.emp_id || '',
      leave_date: '',
      from_time: '',
      to_time: '',
      total_hours: '',
      reason: ''
    })
    setAttachmentFile(null)
    setEditingRequest(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = new FormData()
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
        toast.success('Short leave request updated successfully')
      } else {
        await createMutation.mutateAsync(submitData)
        toast.success('Short leave request created successfully')
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
      leave_date: request.leave_date,
      from_time: request.from_time,
      to_time: request.to_time,
      total_hours: request.total_hours,
      reason: request.reason
    })
    setAttachmentFile(null)
    setShowModal(true)
  }

  const handleApprove = async (request) => {
    if (!window.confirm('Approve this short leave request?')) return
    try {
      await approveMutation.mutateAsync({
        id: request.id,
        action_by: user.emp_id
      })
      toast.success('Short leave request approved')
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
        action_by: user.emp_id,
        rejection_reason: rejectionReason
      })
      toast.success('Short leave request rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short leave request?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Short leave request deleted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request')
    }
  }

  const clearFilters = () => {
    setSelectedEmployee('')
    setSelectedStatus('')
    setStartDate('')
    setEndDate('')
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      pending_hr: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isHR ? 'Short Leave Requests' : canManage ? 'Team Short Leave Requests' : 'My Short Leave Requests'}
          </h1>
          <p className="text-gray-600 mt-1">{filteredRequests.length} total requests</p>
        </div>
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${canManage ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {canManage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{isHR ? 'All Employees' : 'All Team Members'}</option>
                {teamMembers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.full_name} ({emp.emp_id})
                  </option>
                ))}
              </select>
            </div>
          )}

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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                {canManage && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? "8" : "7"} className="px-6 py-8 text-center text-gray-500">
                    No short leave requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request, idx) => (
                  <motion.tr
                    key={request.id}
                    ref={(el) => (rowRefs.current[request.id] = el)}
                    data-hl={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`transition-colors ${highlightId === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{idx + 1}</td>
                    {canManage && (
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {(() => {
                            const employee = teamMembers.find(emp => emp.emp_id === request.employee_id)
                            return employee?.full_name || 'N/A'
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">{request.employee_id}</div>
                      </td>
                    )}
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.leave_date ? format(parseISO(request.leave_date), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.from_time} - {request.to_time}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 font-medium">
                      {request.total_hours} hrs
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
                        {request.status === 'pending' && request.employee_id === user?.emp_id && (
                          <button
                            onClick={() => handleEdit(request)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded-sm transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                  {editingRequest ? 'Edit Short Leave Request' : 'New Short Leave Request'}
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
                      {teamMembers.map((emp) => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.full_name} ({emp.emp_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Date *</label>
                  <input
                    type="date"
                    value={formData.leave_date}
                    onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Time *</label>
                    <input
                      type="time"
                      value={formData.from_time}
                      onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Time *</label>
                    <input
                      type="time"
                      value={formData.to_time}
                      onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder="Please provide a reason for short leave..."
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
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingRequest ? 'Update Request' : 'Create Request'}
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
                <h2 className="text-xl font-semibold text-gray-900">Reject Short Leave Request</h2>
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

      {/* Details Modal */}
      <AnimatePresence>
        {selectedRequest && !showRejectModal && (
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
                <h2 className="text-xl font-semibold text-gray-900">Short Leave Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 hover:bg-gray-100 rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        const employee = teamMembers.find(emp => emp.emp_id === selectedRequest.employee_id)
                        return employee?.full_name || 'N/A'
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900">{selectedRequest.employee_id}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Short Leave Date</label>
                  <p className="text-gray-900 font-medium">
                    {selectedRequest.leave_date ? format(parseISO(selectedRequest.leave_date), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">From Time</label>
                    <p className="text-gray-900">{selectedRequest.from_time}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">To Time</label>
                    <p className="text-gray-900">{selectedRequest.to_time}</p>
                  </div>
                  {selectedRequest.action_by && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Approved By</label>
                      <p className="text-gray-900 font-semibold text-lg">
                        {selectedRequest.action_by?.full_name || 'N/A'}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Hours</label>
                    <p className="text-gray-900 font-semibold text-lg">{selectedRequest.total_hours} hours</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.rejection_reason && (
                  <div>
                    <label className="text-sm font-medium text-red-500">Rejection Reason</label>
                    <p className="text-red-900 bg-red-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.rejection_reason}</p>
                  </div>
                )}

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
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                {selectedRequest.approval_flow && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">Approval Flow</h3>
                    {selectedRequest.approval_flow.employee && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Employee</p>
                        <p className="text-sm font-medium text-gray-900">{selectedRequest.approval_flow.employee.name}</p>
                        <p className="text-xs text-gray-600">{selectedRequest.approval_flow.employee.department}</p>
                      </div>
                    )}
                    {selectedRequest.approval_flow.approvers && selectedRequest.approval_flow.approvers.length > 0 && (
                      <div className="space-y-2">
                        {selectedRequest.approval_flow.approvers.map((approver, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-600">
                                {approver.role === 'manager_level_1' ? 'Manager Level 1' : 'HR Admin'}
                              </p>
                              <p className="text-sm font-medium text-gray-900">{approver.approver_name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              approver.status === 'approved' ? 'bg-green-100 text-green-700' :
                              approver.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {approver.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Created: {selectedRequest.created_at ? format(parseISO(selectedRequest.created_at), 'MMM dd, yyyy hh:mm a') : 'N/A'}</p>
                  <p>Updated: {selectedRequest.updated_at ? format(parseISO(selectedRequest.updated_at), 'MMM dd, yyyy hh:mm a') : 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShortLeave
