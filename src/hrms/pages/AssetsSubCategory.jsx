import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, X, ChevronDown } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  useAssetCategories,
  useAssetSubCategories,
  useCreateAssetSubCategory,
  useUpdateAssetSubCategory,
  useDeleteAssetSubCategory
} from '../hooks/useAssets'

const AssetsSubCategory = () => {
  const { user } = useAuth();
  const { data: categoriesResponse, isLoading: isCategoriesLoading } = useAssetCategories();
  
  const categories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : categoriesResponse?.data || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    description: "",
    is_active: 1
  });

  const { data: subCategoriesResponse } = useAssetSubCategories(selectedCategoryId);
  const subCategories = Array.isArray(subCategoriesResponse)
    ? subCategoriesResponse
    : subCategoriesResponse?.data || [];

  const createMutation = useCreateAssetSubCategory();
  const updateMutation = useUpdateAssetSubCategory();
  const deleteMutation = useDeleteAssetSubCategory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.name) {
      toast.error("Please select category and enter sub-category name");
      return;
    }
    const toastId = toast.loading(editingSubCategory ? "Updating sub-category..." : "Creating sub-category...");
    try {
      if (editingSubCategory) {
        await updateMutation.mutateAsync({
          subCategoryId: editingSubCategory.sub_category_id || editingSubCategory.subcategory_id,
          data: {
            category_id: parseInt(formData.category_id),
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active
          }
        });
        toast.success("Sub-category updated successfully! ✅", { id: toastId });
      } else {
        await createMutation.mutateAsync({
          category_id: parseInt(formData.category_id),
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active
        });
        toast.success("Sub-category created successfully! ✅", { id: toastId });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save sub-category:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save sub-category";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sub-category?")) return;
    const toastId = toast.loading("Deleting sub-category...");
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Sub-category deleted successfully! ✅", { id: toastId });
    } catch (err) {
      console.error("Failed to delete sub-category:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to delete sub-category";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleEdit = (subCat) => {
    setEditingSubCategory(subCat);
    setFormData({
      category_id: subCat.category_id,
      name: subCat.name,
      description: subCat.description || "",
      is_active: subCat.is_active !== undefined ? Number(subCat.is_active) : 1
    });
    setShowModal(true);
  };

  const handleAddClick = (catId = "") => {
    setEditingSubCategory(null);
    setFormData({
      category_id: catId,
      name: "",
      description: "",
      is_active: 1
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingSubCategory(null);
    setFormData({
      category_id: "",
      name: "",
      description: "",
      is_active: 1
    });
  };

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
    if (!expandedCategories[catId]) {
      setSelectedCategoryId(catId);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCategoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const isHRorAdmin = ['super_admin', 'hr', 'manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Items</h1>
          <p className="text-gray-600 mt-1">Manage Items for asset categories</p>
        </div>
        {isHRorAdmin && (
          <button
            onClick={() => handleAddClick()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.category_id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleCategory(cat.category_id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedCategories[cat.category_id] ? "rotate-180" : ""
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      <p className="text-sm text-gray-600">{cat.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    cat.is_active === 1 || cat.is_active === true
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {cat.is_active === 1 || cat.is_active === true ? "Active" : "Inactive"}
                  </span>
                </button>

                <AnimatePresence>
                  {expandedCategories[cat.category_id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                    >
                      <div className="px-6 py-4 space-y-3">
                        {selectedCategoryId === cat.category_id && subCategories.length > 0 ? (
                          subCategories.map((sub) => (
                            <motion.div
                              key={sub.sub_category_id || sub.subcategory_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-xs transition-shadow"
                            >
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{sub.name}</h4>
                                <p className="text-sm text-gray-600">{sub.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  sub.is_active === 1 || sub.is_active === true
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {sub.is_active === 1 || sub.is_active === true ? "Active" : "Inactive"}
                                </span>
                                <button
                                  onClick={() => handleEdit(sub)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-sm transition-colors"
                                  title="Edit Item"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {isHRorAdmin && (
                                  <button
                                    onClick={() => handleDelete(sub.sub_category_id || sub.subcategory_id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          selectedCategoryId === cat.category_id && (
                            <div className="text-center py-4 text-gray-500">
                              No Items yet
                            </div>
                          )
                        )}

                        {isHRorAdmin && (
                          <button
                            onClick={() => handleAddClick(cat.category_id)}
                            className="w-full py-2 px-3 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                          >
                            + Add Item
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSubCategory ? "Edit Item" : "Add New Item"}
                </h2>
                <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-sm">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    disabled={!!editingSubCategory}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Gaming Laptops"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter sub-category description..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formData.is_active === 1 ? "Sub-category is active" : "Sub-category is inactive"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: formData.is_active === 1 ? 0 : 1 })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formData.is_active === 1 ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.is_active === 1 ? "translate-x-7" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    {editingSubCategory ? "Update Item" : "Create Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetsSubCategory;
