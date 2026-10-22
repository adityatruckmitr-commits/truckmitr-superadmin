import { useState, useRef, useEffect } from 'react'
import { useHighlightId } from '../hooks/useHighlightId'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Eye, Trash2, Edit } from 'lucide-react-teleadmin'
import { 
  useWfhRequests, 
  useCreateWfhRequest, 
  useUpdateWfhRequest,
  useApproveWfhRequest, 
  useRejectWfhRequest,
  useDeleteWfhRequest 
} from '../hooks/useWfhRequests'
import { useEmployees } from '../hooks/useEmployees'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { getTeamMembers, getTeamMemberIds, canManageTeam, hasFullAccess } from '../utils/teamFilter'

const WfhRequests = () => {
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
    start_date: '',
    end_date: '',
    reason: '',
  })

  // Get all employees and filter by team
  const { data: employeesResponse } = useEmployees()
  const allEmployees = employeesResponse?.data || employeesResponse || []
  const teamMembers = getTeamMembers(allEmployees, user)
  const teamMemberIds = getTeamMemberIds(allEmployees, user)
  
  // Build query params - for team managers, don't filter by employee_id in API
  // We'll filter on frontend after getting all data
  const params = canManage ? {
    ...(selectedEmployee && { employee_id: selectedEmployee }),
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  } : {
    // For employees, only show their own requests
    employee_id: user?.emp_id,
    ...(selectedStatus && { status: selectedStatus }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  }

  const { data: wfhResponse, isLoading } = useWfhRequests(params)
  
  // Filter requests by team if user is a team manager (not admin/HR)
  // Team managers should see their team's requests + their own requests
  const allRequests = wfhResponse?.data || []

  useEffect(() => {
    if (highlightId && rowRefs.current[highlightId]) {
      setTimeout(() => {
        rowRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [highlightId, allRequests])
  const requests = (canManage && !isHR) 
    ? allRequests.filter(req => 
        teamMemberIds.includes(req.employee_id) || req.employee_id === user?.emp_id
      )
    : allRequests
  const employees = teamMembers
  
  const createMutation = useCreateWfhRequest()
  const updateMutation = useUpdateWfhRequest()
  const approveMutation = useApproveWfhRequest()
  const rejectMutation = useRejectWfhRequest()
  const deleteMutation = useDeleteWfhRequest()

  const resetForm = () => {
    setFormData({
      employee_id: (isHR || canManage) ? '' : user?.emp_id || '',
      start_date: '',
      end_date: '',
      reason: '',
    })
    setEditingRequest(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // For non-HR users (including team managers), always use their own emp_id
      const dataToSubmit = {
        ...formData,
        employee_id: isHR ? formData.employee_id : user?.emp_id
      }
      
      if (editingRequest) {
        await updateMutation.mutateAsync({
          id: editingRequest.id,
          data: dataToSubmit
        })
        toast.success('WFH request updated successfully')
      } else {
        await createMutation.mutateAsync(dataToSubmit)
        toast.success('WFH request created successfully')
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save request')
    }
  }

  const handleEdit = (request) => {
    setEditingRequest(request)
    setFormData({
      employee_id: request.employee_id,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
    })
    setShowModal(true)
  }
  const handleApprove = async (request) => {
    if (!window.confirm('Approve this WFH request?')) return
    try {
      await approveMutation.mutateAsync({ 
        id: request.id, 
        approved_by: user.emp_id 
      })
      toast.success('WFH request approved')
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
      toast.success('WFH request rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this WFH request?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('WFH request deleted')
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
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
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
            {isHR ? 'Work From Home Requests' : canManage ? 'Team WFH Requests' : 'My WFH Requests'}
          </h1>
          <p className="text-gray-600 mt-1">{requests.length} total requests</p>
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
                {employees.map((emp) => (
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
                {canManage && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WFH Period</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? "6" : "5"} className="px-6 py-8 text-center text-gray-500">
                    No WFH requests found
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
                            // Find employee name from employees list
                            const employee = employees.find(emp => emp.emp_id === request.employee_id)
                            return employee?.full_name || request.employee?.full_name || 'Me'
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.employee_id}
                        </div>
                      </td>
                    )}
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-600">
                      {request.request_date ? format(parseISO(request.request_date), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.start_date ? format(parseISO(request.start_date), 'MMM dd') : 'N/A'}
                        {' - '}
                        {request.end_date ? format(parseISO(request.end_date), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <div className="truncate" title={request.reason}>
                        {request.reason || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Show approve/reject buttons only for team members' requests (not own requests) */}
                        {canManage && request.status === 'pending' && request.employee_id !== user?.emp_id && (
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
                        {/* Show edit button only for own pending requests */}
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
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRequest ? 'Edit WFH Request' : 'New WFH Request'}
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
                    placeholder="Please provide a reason for WFH request..."
                    required
                  />
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
                <h2 className="text-xl font-semibold text-gray-900">Reject WFH Request</h2>
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
              {/* Fixed Header */}
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">WFH Request Details</h2>
                <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-100 rounded-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        // Find employee name from employees list
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
                  <label className="text-sm font-medium text-gray-500">Request Date</label>
                  <p className="text-gray-900">
                    {selectedRequest.request_date ? format(parseISO(selectedRequest.request_date), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
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
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRequest.reason}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>

                {selectedRequest.approved_by && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {selectedRequest.status === 'approved' ? 'Approved By' : 'Reviewed By'}
                    </label>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        // Find approver name from employees list
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

export default WfhRequests
