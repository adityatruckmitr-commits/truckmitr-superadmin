import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Users, ChevronDown, Check, X, FileText, 
  Download, CheckCircle, XCircle, AlertCircle, Info, Inbox 
} from 'lucide-react-teleadmin'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import {
  usePendingApprovals,
  useSubordinateExpenses,
  useManagementExpenses,
  useExpenseApprovalDetails,
  useCanApproveExpense,
  useApprovalHistory,
  useApproveExpense,
  useRejectExpense,
  useAddReimbursementToPayroll
} from '../hooks/useExpenses'
import { HRMS_API_BASE } from '../env'

const TERMINAL_REIMBURSEMENT_STATUSES = ['manager_rejected', 'management_rejected', 'management_approved', 'rejected']

const REIMBURSEMENT_STAGE_LABEL = {
  submitted: 'Awaiting Manager Review',
  manager_approved: 'Awaiting CEO/Management Review',
  management_approved: 'Approved — Ready for Payroll',
  manager_rejected: 'Rejected by Manager',
  management_rejected: 'Rejected by Management',
  rejected: 'Rejected',
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'submitted': return 'bg-blue-100 text-blue-800';
    case 'paid': return 'bg-teal-100 text-teal-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const getStatusCardStyle = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-50 border-green-200 text-green-800';
    case 'rejected': return 'bg-red-50 border-red-200 text-red-800';
    default: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  }
};

const formatDisplayDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMM, yyyy hh:mm a");
  } catch {
    try {
      const date = new Date(dateStr);
      return format(date, "dd MMM, yyyy hh:mm a");
    } catch {
      return dateStr;
    }
  }
};

const getAPIHost = () => {
  const base = HRMS_API_BASE;
  return base.replace('/api', '');
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
    <Icon className="h-8 w-8 text-gray-300" />
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    {description && <p className="max-w-xs text-xs text-gray-500">{description}</p>}
  </div>
)

const PendingApprovalsList = ({ data, onViewDetails }) => {
  const [expandedUsers, setExpandedUsers] = useState({});
  const displayData = Array.isArray(data) ? data : [];

  if (displayData.length === 0) {
    return <EmptyState icon={Inbox} title="No pending approvals" description="Reimbursement claims waiting on your review will show up here." />
  }

  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="space-y-4">
      {displayData.map((userGroup) => (
        <motion.div
          key={userGroup.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-gray-300 transition-all"
        >
          <button
            onClick={() => toggleUserExpand(userGroup.user_id)}
            className="w-full px-5 py-4 bg-slate-50/70 border-b border-gray-100 flex justify-between items-center hover:bg-slate-100/80 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200/60">
                {userGroup.user_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 leading-tight">{userGroup.user_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  {userGroup.department} • <span className="text-gray-400">{userGroup.user_email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Requested</p>
                <p className="font-extrabold text-base text-gray-900">{formatCurrency(userGroup.total_amount)}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedUsers[userGroup.user_id] ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {expandedUsers[userGroup.user_id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="divide-y divide-gray-100 overflow-hidden bg-white"
              >
                {userGroup.expenses?.map((expense) => (
                  <div
                    key={expense.id}
                    className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-bold text-xs text-gray-900">{expense.category_name}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] rounded-md font-semibold capitalize">
                          {(expense.approver_role || 'Manager Approval').replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{expense.description || 'No description provided'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 font-medium">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDisplayDateTime(expense.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <span className="font-extrabold text-sm text-gray-900">
                        {formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={() => onViewDetails(expense.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
                      >
                        Review Request
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

const SubordinateHistoryList = ({ data, onViewDetails }) => {
  const [expandedUsers, setExpandedUsers] = useState({});
  const displayData = Array.isArray(data) ? data : [];

  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (displayData.length === 0) {
    return <EmptyState icon={Users} title="No team reimbursements" description="Claims from your reporting employees will show up here." />
  }

  return (
    <div className="space-y-4">
      {displayData.map((userGroup) => (
        <motion.div
          key={userGroup.user_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-gray-300 transition-all"
        >
          <button
            onClick={() => toggleUserExpand(userGroup.user_id)}
            className="w-full px-5 py-4 bg-slate-50/70 border-b border-gray-100 flex justify-between items-center hover:bg-slate-100/80 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200/60">
                {userGroup.user_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">{userGroup.user_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{userGroup.department} • {userGroup.expense_count} Expense Records</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-extrabold text-base text-gray-900">
                {formatCurrency(userGroup.total_amount)}
              </p>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  expandedUsers[userGroup.user_id] ? "rotate-180 text-purple-600" : ""
                }`}
              />
            </div>
          </button>

          <AnimatePresence>
            {expandedUsers[userGroup.user_id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="divide-y divide-gray-100 overflow-hidden bg-white"
              >
                {userGroup.expenses?.map((expense) => (
                  <div
                    key={expense.id}
                    onClick={() => onViewDetails(expense.id)}
                    className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-xs text-gray-900">{expense.category_name}</p>
                      <div className="flex items-center gap-2.5 text-xs mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(expense.status)}`}>
                          {expense.status}
                        </span>
                        <span className="text-gray-400 text-[11px] flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDisplayDateTime(expense.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="font-extrabold text-sm text-gray-900 ml-4">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

const ExpenseDetailsModal = ({ expenseId, onClose }) => {
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const { user } = useAuth();

  const { data: detailsResponse, isLoading: isDetailsLoading } = useExpenseApprovalDetails(expenseId);
  const { data: canApproveResponse } = useCanApproveExpense(expenseId);
  const { data: historyResponse } = useApprovalHistory(expenseId);

  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();
  const addToPayrollMutation = useAddReimbursementToPayroll();

  const expense = detailsResponse?.data;
  const approvalFlow = expense?.approval_flow || { total_levels: 0, approvers: [] };

  const handleApprove = async () => {
    const toastId = toast.loading("Approving expense...");
    try {
      const res = await approveMutation.mutateAsync({
        id: expenseId,
        remarks: approvalRemarks
      });

      if (res.expense_status === "management_approved") {
        toast.success("Final approval completed! Ready to add to payroll.", { id: toastId });
      } else if (res.expense_status === "manager_approved") {
        toast.success("Approved — sent to CEO/Management for final sign-off.", { id: toastId });
      } else {
        toast.success(res.message || "Expense approved successfully!", { id: toastId });
      }
      setApprovalRemarks("");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to approve";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleAddToPayroll = async () => {
    const toastId = toast.loading("Adding to payroll...");
    try {
      await addToPayrollMutation.mutateAsync({ id: expenseId, month: payrollMonth });
      toast.success(`Added to ${payrollMonth} payroll`, { id: toastId });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to payroll", { id: toastId });
    }
  };

  const handleReject = async () => {
    if (!rejectionRemarks.trim()) {
      toast.error("Please provide rejection remarks");
      return;
    }
    const toastId = toast.loading("Rejecting expense...");
    try {
      await rejectMutation.mutateAsync({
        id: expenseId,
        remarks: rejectionRemarks
      });
      toast.success("Expense rejected successfully", { id: toastId });
      setRejectionRemarks("");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reject";
      toast.error(errMsg, { id: toastId });
    }
  };

  if (isDetailsLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-xl p-8 shadow-xl text-sm text-gray-600" onClick={(e) => e.stopPropagation()}>
          Couldn't load this expense. It may have been removed.
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6 overflow-hidden border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">{expense?.category_name || 'Expense Details'}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Reference ID: #{expense?.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(85vh-100px)] overflow-y-auto">
          {/* Status Alert Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200/60 bg-amber-50/60 text-amber-900 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{REIMBURSEMENT_STAGE_LABEL[expense?.status] || 'Pending Review'}</span>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold uppercase text-[10px] tracking-wider">
              {expense?.status || 'Submitted'}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-gray-200/60">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Claim Amount</label>
              <p className="text-lg font-extrabold text-gray-900 mt-1">{formatCurrency(expense?.amount)}</p>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-gray-200/60">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expense Date</label>
              <p className="text-sm font-bold text-gray-800 mt-1.5">
                {expense?.expense_date ? format(parseISO(expense.expense_date), "dd MMM yyyy") : "08 Sep 2026"}
              </p>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-gray-200/60">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approval Stage</label>
              <p className="text-sm font-bold text-blue-600 mt-1.5 capitalize">
                {expense?.status === 'submitted' ? 'Manager' : expense?.status === 'manager_approved' ? 'CEO/Management' : 'Completed'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Reason & Purpose</label>
            <div className="p-3.5 bg-slate-50/60 rounded-xl border border-gray-200/60 text-xs text-gray-700 leading-relaxed font-normal">
              {expense?.description || 'Client meeting and project consultation expenses.'}
            </div>
          </div>

          {/* Approval Flow Info */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2.5 text-xs">
            <h4 className="font-bold text-gray-900">Approval Pathway</h4>
            <div className="space-y-1.5">
              {(approvalFlow.approvers || []).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-gray-700">
                  <span className="capitalize font-semibold">{i + 1}. {a.role} {a.approver_name ? `— ${a.approver_name}` : ''}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeStyle(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          {expense?.attachments && expense.attachments.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Supported Documents</label>
              <div className="space-y-2">
                {expense.attachments.map((file) => (
                  <a
                    key={file.id}
                    href="#"
                    onClick={(e) => { e.preventDefault(); toast.success('Opening attached receipt PDF'); }}
                    className="flex items-center justify-between p-3 border border-gray-200/80 rounded-xl hover:bg-slate-50 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-gray-800">{file.file_path.split("/").pop()}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Box */}
          {expense?.status === 'management_approved' && !expense?.payroll_adjustment_id && ['ceo', 'super_admin'].includes(user?.role) && (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-emerald-900">Add to Payroll Month</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={e => setPayrollMonth(e.target.value)}
                  className="text-xs p-2 border border-emerald-200 rounded-lg bg-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  onClick={handleAddToPayroll}
                  disabled={addToPayrollMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-all active:scale-[0.98]"
                >
                  {addToPayrollMutation.isPending ? "Adding..." : `Add ₹${expense.amount} to Payroll`}
                </button>
              </div>
            </div>
          )}
          {expense?.status === 'management_approved' && expense?.payroll_adjustment_id && (
            <div className="p-3.5 rounded-xl border border-teal-200/60 bg-teal-50/60 text-teal-800 text-xs font-semibold">
              Added to {expense.payroll_month} payroll.
            </div>
          )}

          {!TERMINAL_REIMBURSEMENT_STATUSES.includes(expense?.status) && (
            <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-gray-800">
                Review Remarks (Optional for approval, required for rejection)
              </label>
              <textarea
                className="w-full text-xs p-3 border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:border-blue-500 resize-none h-16"
                placeholder="Add your comments..."
                value={approvalRemarks}
                onChange={e => {
                  setApprovalRemarks(e.target.value);
                  setRejectionRemarks(e.target.value);
                }}
              />

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  className="px-4 py-2 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 rounded-lg font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-all active:scale-[0.98]"
                >
                  {approveMutation.isPending ? "Approving..." : "Approve Expense"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ExpenseApprovals = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  const { data: pendingResponse, isLoading: isPendingLoading } = usePendingApprovals();
  const { data: subordinateResponse, isLoading: isSubordinateLoading } = useSubordinateExpenses();
  const { data: managementResponse, isLoading: isManagementLoading } = useManagementExpenses();

  const handleReview = (id) => {
    setSelectedExpenseId(id);
  };

  const handleCloseModal = () => {
    setSelectedExpenseId(null);
  };

  const isLoading = isPendingLoading || isSubordinateLoading || isManagementLoading;

  const TABS_CONFIG = [
    { id: "pending", label: "Pending Approvals", icon: Clock, count: Array.isArray(pendingResponse?.data) ? pendingResponse.data.reduce((sum, g) => sum + (Array.isArray(g?.expenses) ? g.expenses.length : 0), 0) : 0 },
    { id: "team", label: "My Team", icon: Users }
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
          <p className="text-gray-600 mt-1">Manage and review expense requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-max">
        {TABS_CONFIG.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                ${activeTab === tab.id 
                  ? "bg-white text-primary-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }
              `}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === "pending" && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lists */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "pending" && (
            <PendingApprovalsList
              data={pendingResponse?.data}
              onViewDetails={handleReview}
            />
          )}
          {activeTab === "team" && (
            <SubordinateHistoryList
              data={subordinateResponse?.data}
              onViewDetails={handleReview}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedExpenseId && (
          <ExpenseDetailsModal
            expenseId={selectedExpenseId}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseApprovals;
