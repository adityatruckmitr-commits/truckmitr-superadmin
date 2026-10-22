import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, ChevronDown, Edit, Trash2, 
  X, Check, AlertCircle, FileText, Download, Receipt, Calendar,
  TrendingUp, BarChart3, CreditCard, Building2, Sparkles, User,
  Paperclip, Clock, Plane, Coffee, Laptop, Tag, RefreshCw
} from 'lucide-react-teleadmin'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  useExpenses,
  useExpenseCategories,
  useExpenseSubCategories,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense
} from '../hooks/useExpenses'
import { HRMS_API_BASE } from '../env'

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" }
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-600 border border-slate-200" },
  { value: "submitted", label: "Submitted", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  { value: "approved", label: "Approved", color: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  { value: "rejected", label: "Rejected", color: "bg-rose-50 text-rose-600 border border-rose-200" },
  { value: "paid", label: "Paid", color: "bg-teal-50 text-teal-600 border border-teal-200" }
];

const SAMPLE_CATEGORIES = [
  { id: 1, name: "Travel & Conveyance" },
  { id: 2, name: "Office Supplies & Hardware" },
  { id: 3, name: "Team Meals & Entertainment" },
  { id: 4, name: "Software & Subscriptions" },
  { id: 5, name: "Medical & Health" }
];

const SAMPLE_SUBCATEGORIES = {
  1: [{ id: 11, name: "Client Onsite Flight" }, { id: 12, name: "Local Taxi Fare" }, { id: 13, name: "Hotel Accommodation" }],
  2: [{ id: 21, name: "Ergonomic Accessories" }, { id: 22, name: "Stationery & Cables" }, { id: 23, name: "Monitor & Peripheral" }],
  3: [{ id: 31, name: "Project Sprint Celebration" }, { id: 32, name: "Client Working Lunch" }, { id: 33, name: "Coffee & Snacks" }],
  4: [{ id: 41, name: "Cloud Infrastructure" }, { id: 42, name: "SaaS Tools & Licenses" }],
  5: [{ id: 51, name: "Annual Health Checkup" }, { id: 52, name: "First Aid & Wellness" }]
};

const SAMPLE_EXPENSES = [
  {
    category_id: 1,
    category_name: "Travel & Conveyance",
    expenses: [
      {
        id: 101,
        category_id: 1,
        category_name: "Travel & Conveyance",
        sub_category_name: "Client Onsite Flight",
        vendor_name: "IndiGo Airlines",
        user_name: "Aditya Sharma",
        amount: 8500,
        expense_date: format(new Date(), "yyyy-MM-dd"),
        created_at: format(new Date(), "yyyy-MM-dd'T'10:30:00"),
        status: "approved",
        payment_method: "card",
        description: "Flight booking for quarterly client presentation in Bengaluru.",
        attachments: []
      },
      {
        id: 102,
        category_id: 1,
        category_name: "Travel & Conveyance",
        sub_category_name: "Local Taxi Fare",
        vendor_name: "Uber India",
        user_name: "Aditya Sharma",
        amount: 620,
        expense_date: format(new Date(), "yyyy-MM-dd"),
        created_at: format(new Date(), "yyyy-MM-dd'T'14:15:00"),
        status: "submitted",
        payment_method: "upi",
        description: "Cab fare to client office and return to hotel.",
        attachments: []
      }
    ]
  },
  {
    category_id: 2,
    category_name: "Office Supplies & Hardware",
    expenses: [
      {
        id: 201,
        category_id: 2,
        category_name: "Office Supplies & Hardware",
        sub_category_name: "Ergonomic Accessories",
        vendor_name: "Logitech",
        user_name: "Aditya Sharma",
        amount: 3499,
        expense_date: format(new Date(Date.now() - 86400000 * 2), "yyyy-MM-dd"),
        created_at: format(new Date(Date.now() - 86400000 * 2), "yyyy-MM-dd'T'11:00:00"),
        status: "paid",
        payment_method: "card",
        description: "Wireless MX Master mouse for development workstation.",
        attachments: []
      }
    ]
  },
  {
    category_id: 3,
    category_name: "Team Meals & Entertainment",
    expenses: [
      {
        id: 301,
        category_id: 3,
        category_name: "Team Meals & Entertainment",
        sub_category_name: "Project Sprint Celebration",
        vendor_name: "Swiggy Corporate",
        user_name: "Aditya Sharma",
        amount: 2150,
        expense_date: format(new Date(Date.now() - 86400000 * 5), "yyyy-MM-dd"),
        created_at: format(new Date(Date.now() - 86400000 * 5), "yyyy-MM-dd'T'19:45:00"),
        status: "draft",
        payment_method: "cash",
        description: "Team dinner post successful HRMS phase 1 deployment.",
        attachments: []
      }
    ]
  }
];

const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val || 0);
};

const getStatusColor = (status) => {
  const option = STATUS_OPTIONS.find(item => item.value === status);
  return option?.color || "bg-slate-100 text-slate-600 border border-slate-200";
};

const getCategoryIcon = (categoryName = "") => {
  const name = categoryName.toLowerCase();
  if (name.includes("travel") || name.includes("conveyance") || name.includes("cab") || name.includes("flight")) {
    return <Plane className="w-4 h-4 text-blue-600" />;
  }
  if (name.includes("office") || name.includes("supplies") || name.includes("hardware") || name.includes("stationery")) {
    return <Building2 className="w-4 h-4 text-indigo-600" />;
  }
  if (name.includes("meal") || name.includes("food") || name.includes("entertainment") || name.includes("dinner")) {
    return <Coffee className="w-4 h-4 text-amber-600" />;
  }
  if (name.includes("software") || name.includes("tech") || name.includes("subscription")) {
    return <Laptop className="w-4 h-4 text-purple-600" />;
  }
  return <Receipt className="w-4 h-4 text-emerald-600" />;
};

const Expenses = () => {
  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSubCategories, setExpandedSubCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showDemoData, setShowDemoData] = useState(false);
  
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    startDate: "",
    endDate: ""
  });

  const [formData, setFormData] = useState({
    category_id: "",
    sub_category_id: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    vendor_name: "",
    payment_method: "card",
    expense_type: ""
  });
  
  const [attachmentFile, setAttachmentFile] = useState(null);

  // Fetch hook queries
  const { data: expensesResponse, isLoading: isExpensesLoading } = useExpenses();
  const { data: categoriesResponse } = useExpenseCategories();

  let selectedCategoryIdForSub = null;
  if (formData.category_id) {
    const val = String(formData.category_id).trim();
    if (val !== "") {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        selectedCategoryIdForSub = parsed;
      }
    }
  }

  const { data: subCategoriesResponse } = useExpenseSubCategories(selectedCategoryIdForSub);

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const fetchedCategories = Array.isArray(categoriesResponse) 
    ? categoriesResponse 
    : Array.isArray(categoriesResponse?.data)
      ? categoriesResponse.data
      : [];

  const categories = fetchedCategories.length > 0 ? fetchedCategories : SAMPLE_CATEGORIES;

  const fetchedSubCategories = Array.isArray(subCategoriesResponse) 
    ? subCategoriesResponse 
    : Array.isArray(subCategoriesResponse?.data)
      ? subCategoriesResponse.data
      : [];

  const subCategories = fetchedSubCategories.length > 0
    ? fetchedSubCategories
    : (selectedCategoryIdForSub && SAMPLE_SUBCATEGORIES[selectedCategoryIdForSub]) || [];

  const rawExpensesData = Array.isArray(expensesResponse)
    ? expensesResponse
    : Array.isArray(expensesResponse?.data)
      ? expensesResponse.data
      : Array.isArray(expensesResponse?.data?.data)
        ? expensesResponse.data.data
        : Array.isArray(expensesResponse?.expenses)
          ? expensesResponse.expenses
          : Array.isArray(expensesResponse?.data?.expenses)
            ? expensesResponse.data.expenses
            : [];

  const allExpensesData = (() => {
    if (showDemoData) {
      return SAMPLE_EXPENSES;
    }

    if (!Array.isArray(rawExpensesData) || rawExpensesData.length === 0) {
      return SAMPLE_EXPENSES; // Default to sample demo expenses for rich initial experience
    }

    const isGrouped = rawExpensesData.some(item => item && Array.isArray(item?.expenses));
    if (isGrouped) {
      return rawExpensesData;
    }

    const categoryMap = {};
    rawExpensesData.forEach(exp => {
      if (!exp) return;
      const catId = exp.category_id || exp.category?.id || 'uncategorized';
      const catName = exp.category_name || exp.category?.name || exp.category?.category_name || 'General';

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          category_id: catId,
          category_name: catName,
          expenses: []
        };
      }
      categoryMap[catId].expenses.push(exp);
    });

    return Object.values(categoryMap);
  })();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      category_id: "",
      sub_category_id: "",
      amount: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      vendor_name: "",
      payment_method: "card",
      expense_type: ""
    });
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const toastId = toast.loading(editingExpense ? "Updating expense..." : "Creating expense...");
    try {
      const dataToSubmit = new FormData();
      dataToSubmit.append("category_id", formData.category_id);
      dataToSubmit.append("sub_category_id", formData.sub_category_id || "");
      dataToSubmit.append("amount", formData.amount);
      dataToSubmit.append("expense_date", formData.expense_date);
      dataToSubmit.append("description", formData.description);
      dataToSubmit.append("vendor_name", formData.vendor_name || "");
      dataToSubmit.append("payment_method", formData.payment_method);
      dataToSubmit.append("expense_type", formData.expense_type || "");

      if (attachmentFile) {
        dataToSubmit.append("attachments", attachmentFile);
      }

      if (editingExpense) {
        await updateMutation.mutateAsync({
          id: editingExpense.id,
          data: dataToSubmit
        });
        toast.success("Expense updated successfully! ✅", { id: toastId });
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        toast.success("Expense created successfully! ✅", { id: toastId });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save expense:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save expense";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category_id: expense.category_id || "",
      sub_category_id: expense.sub_category_id || "",
      amount: expense.amount || "",
      expense_date: expense.expense_date || format(new Date(), "yyyy-MM-dd"),
      description: expense.description || "",
      vendor_name: expense.vendor_name || "",
      payment_method: expense.payment_method || "card",
      expense_type: expense.expense_type || ""
    });
    setAttachmentFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    const toastId = toast.loading("Deleting expense...");
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Expense deleted successfully! ✅", { id: toastId });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete expense";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      category: "",
      startDate: "",
      endDate: ""
    });
    setSearchTerm("");
  };

  const isAnyFilterActive = Object.values(filters).some(v => v !== "") || searchTerm.trim() !== "";

  const filteredExpensesByCategory = allExpensesData.map(catGroup => {
    return {
      ...catGroup,
      expenses: (catGroup.expenses || []).filter(exp => {
        if (!exp) return false;
        const matchesSearch = 
          !searchTerm ||
          (exp.description?.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (exp.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (exp.sub_category_name?.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesStatus = !filters.status || exp.status === filters.status;
        const matchesCategory = !filters.category || String(exp.category_id) === filters.category;
        
        let matchesDates = true;
        if (filters.startDate || filters.endDate) {
          const expDate = exp.expense_date ? new Date(exp.expense_date) : null;
          if (filters.startDate && expDate) {
            matchesDates = matchesDates && expDate >= new Date(filters.startDate + "T00:00:00");
          }
          if (filters.endDate && expDate) {
            matchesDates = matchesDates && expDate <= new Date(filters.endDate + "T23:59:59");
          }
        }
        
        return matchesSearch && matchesStatus && matchesCategory && matchesDates;
      })
    };
  }).filter(catGroup => catGroup.expenses && catGroup.expenses.length > 0);

  const toggleSubCategoryExpand = (id) => {
    setExpandedSubCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCategoryExpand = (id) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = filteredExpensesByCategory.every(cg => expandedCategories[cg.category_id]);
    const nextState = {};
    filteredExpensesByCategory.forEach(cg => {
      nextState[cg.category_id] = !allExpanded;
    });
    setExpandedCategories(nextState);
  };

  const getFinancialYearDates = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
    const start = new Date(startYear, 3, 1); // April 1st
    const end = new Date(startYear + 1, 2, 31); // March 31st
    return { start, end };
  };

  const allFlatExpenses = allExpensesData.flatMap(catGroup => catGroup.expenses || []);
  
  const stats = (() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Week calculations
    const sundayIndex = 0;
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === sundayIndex ? 6 : currentDay - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday + 6, 23, 59, 59);

    // Month calculations
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // FY calculations
    const { start: fyStart, end: fyEnd } = getFinancialYearDates();

    const todayExpenses = allFlatExpenses.filter(e => {
      if (!e?.expense_date) return false;
      const d = new Date(e.expense_date);
      return !isNaN(d) && d >= todayStart && d <= todayEnd;
    });

    const weekExpenses = allFlatExpenses.filter(e => {
      if (!e?.expense_date) return false;
      const d = new Date(e.expense_date);
      return !isNaN(d) && d >= monday && d <= nextSunday;
    });

    const monthExpenses = allFlatExpenses.filter(e => {
      if (!e?.expense_date) return false;
      const d = new Date(e.expense_date);
      return !isNaN(d) && d >= monthStart && d <= monthEnd;
    });

    const fyExpenses = allFlatExpenses.filter(e => {
      if (!e?.expense_date) return false;
      const d = new Date(e.expense_date);
      return !isNaN(d) && d >= fyStart && d <= fyEnd;
    });

    return {
      today: todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
      week: weekExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
      month: monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
      year: fyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    };
  })();

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

  if (isExpensesLoading) {
    return <LoadingSpinner />;
  }

  const totalExpenseCount = filteredExpensesByCategory.reduce((sum, catGroup) => sum + catGroup.expenses.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="font-sans text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-blue-600" />
            Expenses Management
          </h1>
          <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1 flex items-center gap-2">
            <span>Track, manage and process employee expense claims</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs font-medium">
              {totalExpenseCount} Records Listed
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-medium text-xs sm:text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Expense Stats Summary Grid - Minimal Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Today's Expense", 
            value: stats.today, 
            subtitle: "Recorded today",
            icon: Calendar,
            accentBg: "bg-blue-50/70 text-blue-600 border-blue-100" 
          },
          { 
            label: "This Week", 
            value: stats.week, 
            subtitle: "Mon - Sun cycle",
            icon: TrendingUp,
            accentBg: "bg-purple-50/70 text-purple-600 border-purple-100" 
          },
          { 
            label: "This Month", 
            value: stats.month, 
            subtitle: "Current calendar month",
            icon: BarChart3,
            accentBg: "bg-emerald-50/70 text-emerald-600 border-emerald-100" 
          },
          { 
            label: "Financial Year", 
            value: stats.year, 
            subtitle: "April - March cycle",
            icon: CreditCard,
            accentBg: "bg-amber-50/70 text-amber-600 border-amber-100" 
          }
        ].map((item, index) => {
          const IconComp = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200/70 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1.5">{formatCurrency(item.value)}</p>
                <p className="text-[11px] text-slate-400 mt-1">{item.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl border ${item.accentBg}`}>
                <IconComp className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search and Filters Container */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/70 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by description, vendor name, or subcategory..."
                className="w-full pl-10 pr-10 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {filteredExpensesByCategory.length > 0 && (
                <button
                  onClick={toggleExpandAll}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Expand / Collapse All"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Toggle All</span>
                </button>
              )}

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
                  showFilters || isAnyFilterActive 
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs" 
                    : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {isAnyFilterActive && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-semibold">
                    {Object.values(filters).filter(v => v !== "").length + (searchTerm ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 overflow-hidden"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-normal border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-normal border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-normal border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-normal border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>

                {isAnyFilterActive && (
                  <div className="col-span-full flex justify-end">
                    <button
                      onClick={handleResetFilters}
                      className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expenses Categorized Accordions */}
        <div className="divide-y divide-slate-100">
          {filteredExpensesByCategory.length > 0 ? (
            filteredExpensesByCategory.map((catGroup) => {
              const categoryTotal = catGroup.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
              const latestExpense = catGroup.expenses.reduce((latest, current) => {
                const curDate = new Date(current.created_at || current.expense_date);
                const latDate = new Date(latest.created_at || latest.expense_date);
                return curDate > latDate ? current : latest;
              }, catGroup.expenses[0]);

              const isExpanded = expandedCategories[catGroup.category_id];

              return (
                <div key={catGroup.category_id} className="transition-colors">
                  {/* Category Header Bar */}
                  <button
                    onClick={() => toggleCategoryExpand(catGroup.category_id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2.5 bg-slate-100/80 rounded-xl flex items-center justify-center border border-slate-200/50">
                        {getCategoryIcon(catGroup.category_name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{catGroup.category_name}</h3>
                        <p className="text-xs font-normal text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{catGroup.expenses.length} claims</span>
                          <span>•</span>
                          <span>Latest: {formatDisplayDateTime(latestExpense.created_at || latestExpense.expense_date)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wide">Total</span>
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {formatCurrency(categoryTotal)}
                        </span>
                      </div>
                      <div className={`p-1 rounded-lg text-slate-400 bg-slate-100 transition-transform ${isExpanded ? "rotate-180 text-blue-600" : ""}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* Category Expenses Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
                      >
                        <div className="p-4 space-y-2.5">
                          {catGroup.expenses.map((expense) => {
                            const isSubExpanded = expandedSubCategories[expense.id];
                            return (
                              <div
                                key={expense.id}
                                className="bg-white rounded-xl border border-slate-200/70 overflow-hidden shadow-2xs hover:border-blue-200 transition-all"
                              >
                                <button
                                  onClick={() => toggleSubCategoryExpand(expense.id)}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-1 rounded-md text-slate-400 transition-transform ${isSubExpanded ? "rotate-180 text-blue-600" : ""}`}>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-slate-800 text-sm">
                                          {expense.sub_category_name || "General Expense"}
                                        </span>
                                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md capitalize ${getStatusColor(expense.status)}`}>
                                          {expense.status}
                                        </span>
                                        {expense.vendor_name && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-normal border border-slate-200/60">
                                            <Building2 className="w-3 h-3 text-slate-400" />
                                            {expense.vendor_name}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-normal text-slate-500 flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3 text-slate-400" />
                                          {expense.user_name || "Aditya Sharma"}
                                        </span>
                                        <span>•</span>
                                        <span>{expense.expense_date ? format(new Date(expense.expense_date), "dd MMM yyyy") : "N/A"}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right pl-4">
                                    <p className="font-semibold text-slate-900 text-sm sm:text-base">
                                      {formatCurrency(expense.amount)}
                                    </p>
                                    <p className="text-[11px] font-normal text-slate-400 capitalize">
                                      {expense.payment_method?.replace(/_/g, ' ') || "Card"}
                                    </p>
                                  </div>
                                </button>

                                {/* Expanded Expense Detail Drawer */}
                                <AnimatePresence>
                                  {isSubExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="bg-slate-50/80 border-t border-slate-100 overflow-hidden"
                                    >
                                      <div className="p-4 space-y-3 text-xs">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                                            <span className="text-slate-400 font-medium block text-[10px]">Sub Category</span>
                                            <span className="font-medium text-slate-800 mt-0.5 block">
                                              {expense.sub_category_name || "N/A"}
                                            </span>
                                          </div>
                                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                                            <span className="text-slate-400 font-medium block text-[10px]">Payment Method</span>
                                            <span className="font-medium text-slate-800 mt-0.5 block capitalize">
                                              {expense.payment_method?.replace(/_/g, ' ') || "N/A"}
                                            </span>
                                          </div>
                                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                                            <span className="text-slate-400 font-medium block text-[10px]">Created Date</span>
                                            <span className="font-medium text-slate-800 mt-0.5 block">
                                              {formatDisplayDateTime(expense.created_at || expense.expense_date)}
                                            </span>
                                          </div>
                                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                                            <span className="text-slate-400 font-medium block text-[10px]">Vendor</span>
                                            <span className="font-medium text-slate-800 mt-0.5 block">
                                              {expense.vendor_name || "N/A"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                                          <span className="text-slate-400 font-medium block text-[10px] mb-1">Description</span>
                                          <p className="text-slate-700 font-normal whitespace-pre-wrap leading-normal">
                                            {expense.description || "No description provided."}
                                          </p>
                                        </div>

                                        {expense.attachments && expense.attachments.length > 0 && (
                                          <div>
                                            <span className="text-slate-400 font-medium block text-[10px] mb-1.5">Attachments</span>
                                            <div className="flex flex-wrap gap-2">
                                              {expense.attachments.map((file) => (
                                                <a
                                                  key={file.id}
                                                  href={`${getAPIHost()}/storage/${file.file_path}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs"
                                                >
                                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                                  <span>{file.file_path.split('/').pop()}</span>
                                                  <Download className="w-3 h-3 text-blue-500" />
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {(expense.status !== "approved" && expense.status !== "paid") && (
                                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                                            <button
                                              onClick={() => handleEdit(expense)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium text-xs"
                                            >
                                              <Edit className="w-3 h-3" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              onClick={() => handleDelete(expense.id)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors font-medium text-xs"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            /* Empty State Container */
            <div className="p-10 text-center bg-white rounded-2xl space-y-3">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No Expenses Found</h3>
              <p className="text-slate-500 text-xs max-w-xs mx-auto font-normal">
                {isAnyFilterActive 
                  ? "No expenses match your search or filter settings. Try clearing your filters."
                  : "You don't have any recorded expenses yet. Create your first expense claim or toggle demo data."}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                {isAnyFilterActive ? (
                  <button
                    onClick={handleResetFilters}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 transition-all shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create First Expense
                    </button>
                    <button
                      onClick={() => setShowDemoData(!showDemoData)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 font-medium text-xs rounded-xl hover:bg-purple-100 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      {showDemoData ? "Hide Demo Data" : "Load Test / Demo Data"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-100 my-auto"
            >
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    {editingExpense ? "Edit Expense Request" : "New Expense Request"}
                  </h2>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Fill in the details to submit your expense for approval</p>
                </div>
                <button onClick={resetForm} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={e => {
                        setFormData({
                          ...formData,
                          category_id: e.target.value,
                          sub_category_id: ""
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sub Category</label>
                    <select
                      name="sub_category_id"
                      value={formData.sub_category_id}
                      onChange={handleFormChange}
                      disabled={!formData.category_id}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs">₹</span>
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleFormChange}
                        className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Expense Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expense_date"
                      value={formData.expense_date}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      name="vendor_name"
                      value={formData.vendor_name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      placeholder="e.g. Uber, IndiGo, Amazon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      required
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Description / Purpose <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                    placeholder="Enter reason for the expense claim..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Attachment (Receipt / Invoice)</label>
                  <div className="border border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3.5 text-center bg-slate-50/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="expense-attachment-input"
                    />
                    <label htmlFor="expense-attachment-input" className="cursor-pointer space-y-0.5 block">
                      <Paperclip className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-medium text-blue-600">Click to upload receipt or drag file here</p>
                      <p className="text-[10px] text-slate-400 font-normal">PNG, JPG or PDF up to 5MB</p>
                    </label>
                  </div>
                  {attachmentFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs font-medium text-blue-700">
                      <span className="truncate">{attachmentFile.name} ({(attachmentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button type="button" onClick={() => setAttachmentFile(null)} className="text-blue-500 hover:text-blue-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all text-xs sm:text-sm disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Expense"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
