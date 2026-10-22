import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  FileText,
  AlertTriangle,
  Plus,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Headphones,
  Megaphone,
  CreditCard,
  Search,
  Filter,
  ArrowUpRight,
  X,
  Printer,
  ChevronDown,
  FileCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function ExpensesControls() {
  // Controls state
  const [dateRange, setDateRange] = useState('01 Apr 2025 - 30 Apr 2025');
  const [selectedRegion, setSelectedRegion] = useState('All India');
  const [selectedUserType, setSelectedUserType] = useState('All User Types');
  const [filterMissingBillsOnly, setFilterMissingBillsOnly] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [tableTimeRange, setTableTimeRange] = useState('Last 30 Days');
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedAttentionItem, setSelectedAttentionItem] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // KPI Metrics State (populated from API with live baseline defaults)
  const [kpis, setKpis] = useState({
    total_expenses: '₹4.82L',
    total_change: '↓ 4.2% vs budget cap',
    tech_spend: '₹1.84L',
    tech_pct: '38% of total',
    mktg_spend: '₹1.45L',
    mktg_pct: '30% of total',
    admin_spend: '₹1.53L',
    admin_pct: '32% of total',
    budget_variance: '+12.4%',
    variance_status: 'healthy buffer',
    is_budget_positive: true,
    pending_count: 3,
    pending_amount: '₹14,500',
  });

  // Summary State
  const [summaryData, setSummaryData] = useState({
    total_expenses: '₹24.8L',
    growth_label: '↑ 12%',
    growth_pct: 12,
    budget: '₹36.5L',
    budget_used_pct: 68,
    avg_expense_per_txn: '₹16,400',
    total_transactions: 18,
  });

  // New expense form state
  const [newExpenseForm, setNewExpenseForm] = useState({
    department: 'Operations',
    category: 'Field Activity',
    paidBy: 'Company Card',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    billStatus: 'Uploaded',
    approvalStatus: 'Approved',
    notes: '',
    receiptFile: null
  });

  // Recent Expenses Dataset
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      date: '29 Apr 2025',
      department: 'Operations',
      category: 'Field Activity',
      paidBy: 'Company Card',
      amount: 12500,
      billStatus: 'Uploaded',
      approvalStatus: 'Approved'
    },
    {
      id: 2,
      date: '28 Apr 2025',
      department: 'Marketing',
      category: 'Marketing',
      paidBy: 'Rohit Sharma',
      amount: 8400,
      billStatus: 'Missing Document',
      approvalStatus: 'Pending'
    },
    {
      id: 3,
      date: '27 Apr 2025',
      department: 'People & HR',
      category: 'Reimbursements',
      paidBy: 'Priya Verma',
      amount: 6250,
      billStatus: 'Uploaded',
      approvalStatus: 'Pending'
    },
    {
      id: 4,
      date: '26 Apr 2025',
      department: 'Operations',
      category: 'Travel',
      paidBy: 'Company Card',
      amount: 11800,
      billStatus: 'Uploaded',
      approvalStatus: 'Approved'
    },
    {
      id: 5,
      date: '25 Apr 2025',
      department: 'Admin',
      category: 'Office Rent',
      paidBy: 'Bank Transfer',
      amount: 50000,
      billStatus: 'Uploaded',
      approvalStatus: 'Approved'
    },
    {
      id: 6,
      date: '24 Apr 2025',
      department: 'Technology',
      category: 'Software',
      paidBy: 'Company Card',
      amount: 24000,
      billStatus: 'Uploaded',
      approvalStatus: 'Approved'
    },
    {
      id: 7,
      date: '23 Apr 2025',
      department: 'Operations',
      category: 'Field Activity',
      paidBy: 'Amit Yadav',
      amount: 7340,
      billStatus: 'Missing Document',
      approvalStatus: 'Pending'
    },
    {
      id: 8,
      date: '22 Apr 2025',
      department: 'Marketing',
      category: 'Miscellaneous',
      paidBy: 'Company Card',
      amount: 3990,
      billStatus: 'Uploaded',
      approvalStatus: 'Approved'
    }
  ]);

  // Categories Breakdown Data
  const [categoryBreakdown, setCategoryBreakdown] = useState([
    { label: 'IVR & Cloud Infrastructure', amount: '₹1,84,000', percentage: 38, color: '#2563EB' },
    { label: 'Marketing & Ground Campaigns', amount: '₹1,45,000', percentage: 30, color: '#10B981' },
    { label: 'Field Agent Travel & DA', amount: '₹82,000', percentage: 17, color: '#F59E0B' },
    { label: 'Office Rent & Utilities', amount: '₹48,000', percentage: 10, color: '#8B5CF6' },
    { label: 'Software Licenses & Subscriptions', amount: '₹23,000', percentage: 5, color: '#F43F5E' }
  ]);

  // Month-end Control Checklist
  const [controlChecklist, setControlChecklist] = useState([
    {
      id: 'fin',
      title: 'Finance Closure',
      description: 'Reconcile expenses, payments & accruals',
      status: 'Completed',
      statusType: 'success'
    },
    {
      id: 'hr',
      title: 'HR Closure',
      description: 'Employee reimbursements & settlements',
      status: '70% In Progress',
      statusType: 'warning'
    },
    {
      id: 'ops',
      title: 'Operations Closure',
      description: 'Field expenses, fuel cards & trip settlements',
      status: 'Completed',
      statusType: 'success'
    },
    {
      id: 'comp',
      title: 'Compliance Closure',
      description: 'Statutory, policy & audit checks',
      status: 'Pending (3)',
      statusType: 'danger'
    }
  ]);

  // Attention Required items
  const [attentionItems, setAttentionItems] = useState([
    { id: 'missing_docs', label: 'Expenses without documents', count: 12, filterType: 'missing' },
    { id: 'overdue_bills', label: 'Bills overdue (> 7 days)', count: 5, filterType: 'all' },
    { id: 'reimburse_pending', label: 'Reimbursements pending approval', count: 4, filterType: 'pending' },
    { id: 'month_end_overdue', label: 'Month-end closure items overdue', count: 6, filterType: 'all' },
    { id: 'policy_violations', label: 'Policy violations (needs review)', count: 2, filterType: 'all' },
    { id: 'unusual_expenses', label: 'Unusual expenses (high value)', count: 3, filterType: 'all' }
  ]);

  // Department spend breakdown
  const [departmentSpend, setDepartmentSpend] = useState([
    { name: 'Operations', amount: '₹8.6L', percentage: 35, barWidth: '35%' },
    { name: 'Marketing', amount: '₹4.8L', percentage: 19, barWidth: '19%' },
    { name: 'People & HR', amount: '₹3.9L', percentage: 16, barWidth: '16%' },
    { name: 'Admin', amount: '₹3.1L', percentage: 13, barWidth: '13%' },
    { name: 'Technology', amount: '₹2.6L', percentage: 10, barWidth: '10%' }
  ]);

  // Fetch Live Expenses Data from Laravel API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/expenses', {
        params: {
          dateRange: tableTimeRange || dateRange,
          locationScope: selectedRegion,
          searchQuery: searchTableQuery,
          filterMissingBills: filterMissingBillsOnly
        }
      });
      if (res.data && res.data.status === 'success' && res.data.data) {
        const d = res.data.data;
        if (Array.isArray(d.recentExpenses) && d.recentExpenses.length > 0) {
          setExpenses(d.recentExpenses.map(item => ({
            id: item.id,
            date: item.date,
            department: item.department,
            category: item.category,
            paidBy: item.paid_by,
            amount: item.amount,
            billStatus: item.bill_status === 'Document Uploaded' ? 'Uploaded' : item.bill_status,
            approvalStatus: item.approval_status,
            vendorName: item.vendor_name,
            notes: item.notes,
            receiptUrl: item.bill_receipt_url
          })));
        }
        if (Array.isArray(d.categories) && d.categories.length > 0) {
          setCategoryBreakdown(d.categories.map(c => ({
            label: c.name,
            amount: c.amount,
            percentage: c.percentage,
            color: c.color
          })));
        }
        if (Array.isArray(d.checklist) && d.checklist.length > 0) {
          setControlChecklist(d.checklist.map(chk => ({
            id: chk.id,
            title: chk.title,
            description: chk.description,
            status: chk.status,
            statusType: chk.status === 'Completed' ? 'success' : (chk.status === 'In Progress' ? 'warning' : 'danger')
          })));
        }
        if (Array.isArray(d.attention) && d.attention.length > 0) {
          setAttentionItems(d.attention.map((a, i) => ({
            id: `att_${i}`,
            label: a.title,
            count: a.count,
            filterType: a.title.includes('document') ? 'missing' : (a.title.includes('pending') ? 'pending' : 'all')
          })));
        }
        if (Array.isArray(d.departmentSpend) && d.departmentSpend.length > 0) {
          setDepartmentSpend(d.departmentSpend.map(dep => ({
            name: dep.department,
            amount: dep.amount,
            percentage: dep.percentage,
            barWidth: `${dep.percentage}%`
          })));
        }
        if (d.expenseSummary) {
          setSummaryData({
            total_expenses: d.expenseSummary.total_expenses || '₹4.82L',
            growth_label: d.expenseSummary.growth_label || '↑ 12%',
            growth_pct: d.expenseSummary.growth_pct || 12,
            budget: d.expenseSummary.budget || '₹36.5L',
            budget_used_pct: d.expenseSummary.budget_used_pct || 68,
            avg_expense_per_txn: d.expenseSummary.avg_expense_per_txn || '₹16,400',
            total_transactions: d.expenseSummary.total_transactions || (d.recentExpenses ? d.recentExpenses.length : 0),
          });
        }
        if (Array.isArray(d.kpis) && d.kpis.length >= 6) {
          setKpis({
            total_expenses: d.kpis[0].value,
            total_change: d.kpis[0].change,
            tech_spend: d.kpis[1].value,
            tech_pct: d.kpis[1].change,
            mktg_spend: d.kpis[2].value,
            mktg_pct: d.kpis[2].change,
            admin_spend: d.kpis[3].value,
            admin_pct: d.kpis[3].change,
            budget_variance: d.kpis[4].value,
            variance_status: d.kpis[4].change,
            is_budget_positive: d.kpis[4].isPositive,
            pending_count: d.kpis[5].value,
            pending_amount: d.kpis[5].change,
          });
        }
      }
    } catch (err) {
      console.warn('Expenses API fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [dateRange, selectedRegion, filterMissingBillsOnly, tableTimeRange]);

  // Debounced Search Table Query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTableQuery]);

  // Handle Approve Status
  const handleApproveExpense = async (id) => {
    try {
      const res = await api.post(`/admin/expenses/${id}/status`, {
        approval_status: 'Approved',
        user_email: 'sachin.gupta@truckmitr.com'
      });
      showToast(res.data?.message || 'Expense approved successfully!');
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, approvalStatus: 'Approved' } : e));
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve expense');
    }
  };

  // Handle Reject Status
  const handleRejectExpense = async (id) => {
    try {
      const res = await api.post(`/admin/expenses/${id}/status`, {
        approval_status: 'Rejected',
        user_email: 'sachin.gupta@truckmitr.com'
      });
      showToast(res.data?.message || 'Expense rejected.');
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, approvalStatus: 'Rejected' } : e));
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject expense');
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await api.delete(`/admin/expenses/${id}`, {
        data: { user_email: 'sachin.gupta@truckmitr.com' }
      });
      showToast(res.data?.message || 'Expense deleted successfully!');
      setExpenses(prev => prev.filter(e => e.id !== id));
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  // Filtered expenses based on search & missing bills toggle
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const matchMissing = filterMissingBillsOnly ? item.billStatus === 'Missing Document' : true;
      const matchSearch =
        item.department.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        item.paidBy.toLowerCase().includes(searchTableQuery.toLowerCase());
      return matchMissing && matchSearch;
    });
  }, [expenses, filterMissingBillsOnly, searchTableQuery]);

  // Handle Add Expense
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpenseForm.amount) return;

    const formData = new FormData();
    formData.append('department', newExpenseForm.department);
    formData.append('category', newExpenseForm.category);
    formData.append('paid_by', newExpenseForm.paidBy);
    formData.append('amount', newExpenseForm.amount);
    formData.append('expense_date', newExpenseForm.date);
    formData.append('notes', newExpenseForm.notes || '');
    formData.append('hasBill', newExpenseForm.billStatus === 'Uploaded');
    if (newExpenseForm.receiptFile) {
      formData.append('receipt', newExpenseForm.receiptFile);
    }

    try {
      const res = await api.post('/admin/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.status === 'success') {
        showToast(`Expense of ₹${parseFloat(newExpenseForm.amount).toLocaleString('en-IN')} recorded successfully.`);
        setIsAddExpenseModalOpen(false);
        fetchExpenses();
        setNewExpenseForm({
          department: 'Operations',
          category: 'Field Activity',
          paidBy: 'Company Card',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          billStatus: 'Uploaded',
          approvalStatus: 'Approved',
          notes: '',
          receiptFile: null
        });
        return;
      }
    } catch (err) {
      console.warn('API error saving expense:', err);
    }

    // Local fallback
    const newEntry = {
      id: Date.now(),
      date: new Date(newExpenseForm.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      department: newExpenseForm.department,
      category: newExpenseForm.category,
      paidBy: newExpenseForm.paidBy,
      amount: parseFloat(newExpenseForm.amount) || 0,
      billStatus: newExpenseForm.billStatus,
      approvalStatus: 'Pending'
    };

    setExpenses([newEntry, ...expenses]);
    setIsAddExpenseModalOpen(false);
    showToast(`Expense of ₹${newEntry.amount.toLocaleString('en-IN')} added successfully.`);
    setNewExpenseForm({
      department: 'Operations',
      category: 'Field Activity',
      paidBy: 'Company Card',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      billStatus: 'Uploaded',
      approvalStatus: 'Approved',
      notes: '',
      receiptFile: null
    });
  };

  // Export Snapshot Handler
  const handleExportSnapshot = () => {
    const csvContent =
      'Date,Department,Category,Paid By,Amount,Bill Status,Approval Status\n' +
      expenses.map(e => `"${e.date}","${e.department}","${e.category}","${e.paidBy}",${e.amount},"${e.billStatus}","${e.approvalStatus}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Expenses_Snapshot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Snapshot CSV exported successfully.');
  };

  // Download Report Handler
  const handleDownloadReport = () => {
    showToast('Generating comprehensive Expense Audit Report PDF...');
    setTimeout(() => {
      window.print();
    }, 400);
  };


  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-[#F8F9FA] min-h-screen text-slate-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1680px] mx-auto w-full">
        {/* Top Filter & Export Bar (matching screenshot top bar) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:px-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All India">All India</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Haryana">Haryana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>

            {/* User Type Filter */}
            <select
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All User Types">All User Types</option>
              <option value="Internal Operations">Internal Operations</option>
              <option value="Field Agents">Field Agents</option>
              <option value="Corporate Staff">Corporate Staff</option>
            </select>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Export Snapshot Button */}
            <button
              onClick={handleExportSnapshot}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Export Snapshot</span>
            </button>

            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Title Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Expenses & Controls
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Spend visibility and closure discipline
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Refresh Button */}
            <button
              onClick={fetchExpenses}
              disabled={loading}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Refresh Expense Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Filter Missing Bills Toggle */}
            <button
              onClick={() => {
                setFilterMissingBillsOnly(!filterMissingBillsOnly);
                showToast(
                  !filterMissingBillsOnly
                    ? 'Filtering: Showing only expenses with Missing Documents'
                    : 'Showing all expenses'
                );
              }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                filterMissingBillsOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{filterMissingBillsOnly ? 'Clear Missing Bills Filter' : 'Filter Missing Bills'}</span>
            </button>

            {/* + Add Expense Button */}
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Row 1: Top 6 KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Total Expenses MTD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Expenses MTD
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.total_expenses}</div>
              <div className="flex items-center text-[11px] font-medium text-emerald-600 mt-1">
                <span>{kpis.total_change}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Telephony & Cloud Server */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Telephony & Cloud Server
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.tech_spend}</div>
              <div className="flex items-center space-x-1 text-[11px] mt-1">
                <span className="font-bold text-emerald-700">{kpis.tech_pct}</span>
                <span className="text-slate-400">IVR & AWS</span>
              </div>
            </div>
          </div>

          {/* Card 3: Driver Outreach & Banners */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Driver Outreach & Banners
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.mktg_spend}</div>
              <div className="flex items-center space-x-1 text-[11px] mt-1">
                <span className="font-bold text-emerald-700">{kpis.mktg_pct}</span>
                <span className="text-slate-400">highway campaigns</span>
              </div>
            </div>
          </div>

          {/* Card 4: Office, Travel & Payouts */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Office, Travel & Payouts
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.admin_spend}</div>
              <div className="flex items-center space-x-1 text-[11px] mt-1">
                <span className="font-bold text-emerald-700">{kpis.admin_pct}</span>
                <span className="text-slate-400">facilities & travel</span>
              </div>
            </div>
          </div>

          {/* Card 5: Runway & Budget Variance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Runway & Budget Variance
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-black tracking-tight ${kpis.is_budget_positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpis.budget_variance}
              </div>
              <div className="flex items-center space-x-1 text-[11px] mt-1">
                <span className="font-bold text-emerald-700">{kpis.variance_status}</span>
                <span className="text-slate-400">positive margin</span>
              </div>
            </div>
          </div>

          {/* Card 6: Pending Expense Claims */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending Expense Claims
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{kpis.pending_count}</div>
              <div className="flex items-center space-x-1 text-[11px] mt-1">
                <span className="font-bold text-slate-800">{kpis.pending_amount}</span>
                <span className="text-slate-400">awaiting signoff</span>
              </div>
            </div>
          </div>
        </div>


        {/* Row 2: Middle Section (3 Column Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Expense Breakdown by Category */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Expense Breakdown by Category</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total Expenses: ₹24.8L | vs. last month <span className="text-rose-500 font-bold">↑ 12%</span>
                  </p>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded-md focus:outline-none">
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>Q1 2025</option>
                </select>
              </div>

              {/* Donut Chart & Legend Display */}
              <div className="py-4 flex flex-col sm:flex-row items-center gap-6">
                {/* Donut Chart SVG */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
                    
                    {/* Segment 1: IVR & Cloud 38% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#2563EB"
                      strokeWidth="16"
                      strokeDasharray="90.7 238.7"
                      strokeDashoffset="0"
                    />
                    {/* Segment 2: Marketing 30% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="16"
                      strokeDasharray="71.6 238.7"
                      strokeDashoffset="-90.7"
                    />
                    {/* Segment 3: Travel 17% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="16"
                      strokeDasharray="40.5 238.7"
                      strokeDashoffset="-162.3"
                    />
                    {/* Segment 4: Rent 10% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8B5CF6"
                      strokeWidth="16"
                      strokeDasharray="23.8 238.7"
                      strokeDashoffset="-202.8"
                    />
                    {/* Segment 5: Software 5% */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#F43F5E"
                      strokeWidth="16"
                      strokeDasharray="12 238.7"
                      strokeDashoffset="-226.6"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-slate-900 leading-none">₹24.8L</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 flex-1 w-full text-xs">
                  {categoryBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700 font-medium truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-bold text-slate-900">{item.amount}</span>
                        <span className="text-slate-400 text-[11px] w-7 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Month-End Control Checklist */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Month-End Control Checklist</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Track closure readiness across functions</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded-md focus:outline-none">
                  <option>Apr 2025</option>
                  <option>Mar 2025</option>
                  <option>Feb 2025</option>
                </select>
              </div>

              {/* Checklist Items */}
              <div className="divide-y divide-slate-100 py-1">
                {controlChecklist.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.statusType === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.statusType === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {item.statusType === 'warning' && <Clock className="w-3 h-3 text-amber-600" />}
                      {item.statusType === 'danger' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      <span>{item.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Attention Required */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-500 text-base">⚠️</span>
                  <h3 className="font-bold text-slate-900 text-sm">Attention Required</h3>
                </div>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
                  18 items
                </span>
              </div>

              {/* Attention List Items */}
              <div className="divide-y divide-slate-100 py-1">
                {attentionItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.filterType === 'missing') {
                        setFilterMissingBillsOnly(true);
                        showToast(`Filtered: ${item.label}`);
                      } else {
                        showToast(`Selected attention item: ${item.label} (${item.count} items)`);
                      }
                    }}
                    className="w-full py-2.5 flex items-center justify-between text-xs text-slate-700 hover:text-blue-600 hover:bg-slate-50/70 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="font-medium text-left">{item.label}</span>
                    <div className="flex items-center space-x-1.5 shrink-0 font-bold text-slate-800">
                      <span>{item.count}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => showToast('Opening Attention Queue Manager...')}
              className="mt-3 text-center text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50/60 py-2 rounded-lg transition-colors w-full block cursor-pointer"
            >
              View All Attention Items →
            </button>
          </div>
        </div>

        {/* Row 3: Bottom Section (Left 2/3 and Right 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Recent Expenses Table (2 Columns Span) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Table Header Controls */}
              <div className="p-4 sm:px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Recent Expenses</h3>
                  {filterMissingBillsOnly && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      Filtered: Missing Docs
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  {/* Table Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchTableQuery}
                      onChange={(e) => setSearchTableQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                    />
                  </div>

                  <select
                    value={tableTimeRange}
                    onChange={(e) => setTableTimeRange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="This Month">This Month</option>
                    <option value="Last Quarter">Last Quarter</option>
                  </select>

                  <button
                    onClick={() => {
                      setFilterMissingBillsOnly(false);
                      setSearchTableQuery('');
                      showToast('Showing all recent expenses');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold whitespace-nowrap cursor-pointer"
                  >
                    View All Expenses &gt;
                  </button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Paid By</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Bill Status</th>
                      <th className="py-3 px-4">Approval Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-bold whitespace-nowrap">
                          {exp.department}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {exp.category}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {exp.paidBy}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                          ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              exp.billStatus === 'Uploaded'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {exp.billStatus === 'Uploaded' ? (
                              <>
                                <span>✓</span>
                                <span>Uploaded</span>
                              </>
                            ) : (
                              <>
                                <span>⚠️</span>
                                <span>Missing Document</span>
                              </>
                            )}
                          </span>
                          {exp.receiptUrl && (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 text-[10px] font-bold underline inline-flex items-center"
                            >
                              View Bill
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              exp.approvalStatus === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : exp.approvalStatus === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {exp.approvalStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                          {exp.approvalStatus !== 'Approved' && (
                            <button
                              onClick={() => handleApproveExpense(exp.id)}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Approve Bill"
                            >
                              Approve
                            </button>
                          )}
                          {exp.approvalStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleRejectExpense(exp.id)}
                              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              title="Reject Bill"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer inline-flex items-center transition-colors"
                            title="Delete Expense"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No expenses matching the selected criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Expense Summary & Top Departments Stacked */}
          <div className="space-y-5">
            {/* Top Card: Expense Summary */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Expense Summary</h3>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2 py-1 rounded-md focus:outline-none">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>

              <div className="divide-y divide-slate-100 py-1 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Expenses</span>
                  <div className="font-bold text-slate-900 flex items-center space-x-1">
                    <span>₹24.8L</span>
                    <span className="text-rose-500 text-[11px] font-bold">↑ 12%</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Budget</span>
                  <span className="font-bold text-slate-900">₹36.5L</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Budget Used</span>
                  <div className="font-bold text-emerald-600 flex items-center space-x-1">
                    <span>68%</span>
                    <span className="text-[11px] font-medium">+ 6%</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Avg. Expense / Txn</span>
                  <span className="font-bold text-slate-900">₹8,450</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Transactions</span>
                  <div className="font-bold text-blue-600 flex items-center space-x-1">
                    <span>294</span>
                    <span className="text-[11px] font-medium">↑ 6%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card: Top Departments by Spend */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Top Departments by Spend</h3>
                <button
                  onClick={() => showToast('Opening Full Departmental Ledger...')}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3.5 py-3 text-xs">
                {departmentSpend.map((dept, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span>{dept.name}</span>
                      <div className="space-x-1">
                        <span className="font-bold text-slate-900">{dept.amount}</span>
                        <span className="text-slate-400 text-[11px]">{dept.percentage}%</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: dept.barWidth }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: + Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record New Expense</h3>
                  <p className="text-xs text-slate-500">Add operational expenditure or reimbursements</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Department</label>
                  <select
                    value={newExpenseForm.department}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Operations</option>
                    <option>Marketing</option>
                    <option>People & HR</option>
                    <option>Admin</option>
                    <option>Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Expense Category</label>
                  <select
                    value={newExpenseForm.category}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>Field Activity</option>
                    <option>Marketing</option>
                    <option>Reimbursements</option>
                    <option>Travel</option>
                    <option>Office Rent</option>
                    <option>Software</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Amount (₹ INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 8500"
                    value={newExpenseForm.amount}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newExpenseForm.date}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Paid By / Payment Mode</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Company Card or Employee Name"
                    value={newExpenseForm.paidBy}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, paidBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bill / Invoice Attachment</label>
                  <select
                    value={newExpenseForm.billStatus}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, billStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Uploaded">✓ Invoice Attached</option>
                    <option value="Missing Document">⚠️ Missing Document</option>
                  </select>
                </div>
              </div>

              {newExpenseForm.billStatus === 'Uploaded' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Upload Receipt File (Image / PDF)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, receiptFile: e.target.files[0] })}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              )}


              <div>
                <label className="block text-slate-600 font-medium mb-1">Notes / Business Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Optional details regarding vendor, purpose, client visit..."
                  value={newExpenseForm.notes}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
