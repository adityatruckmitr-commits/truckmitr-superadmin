import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  useAssetCategories,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory
} from '../hooks/useAssets'

const AssetsCategory = () => {
  const { user } = useAuth();
  const { data: categoriesResponse, isLoading } = useAssetCategories();
  
  const createMutation = useCreateAssetCategory();
  const updateMutation = useUpdateAssetCategory();
  const deleteMutation = useDeleteAssetCategory();

  const categories = Array.isArray(categoriesResponse) 
    ? categoriesResponse 
    : categoriesResponse?.data || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please enter category name");
      return;
    }
    const toastId = toast.loading(editingCategory ? "Updating category..." : "Creating category...");
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          categoryId: editingCategory.category_id,
          data: formData
        });
        toast.success("Category updated successfully! ✅", { id: toastId });
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Category created successfully! ✅", { id: toastId });
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save category:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save category";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    const toastId = toast.loading("Deleting category...");
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Category deleted successfully! ✅", { id: toastId });
    } catch (err) {
      console.error("Failed to delete category:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to delete category";
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active !== undefined ? Number(category.is_active) : 1
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      is_active: 1
    });
  };

  const filteredCategories = categories.filter(cat => {
    return (
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Asset Categories</h1>
          <p className="text-gray-600 mt-1">{categories.length} total categories</p>
        </div>
        {isHRorAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Category
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <motion.div
                key={cat.category_id || cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{cat.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        cat.is_active === 1 || cat.is_active === true
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {cat.is_active === 1 || cat.is_active === true ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-600">Assets: </span>
                    <span className="font-semibold text-gray-900">{cat.count}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-sm transition-colors"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isHRorAdmin && (
                      <button
                        onClick={() => handleDelete(cat.category_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
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
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h2>
                <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-sm">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Laptop"
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
                    placeholder="Enter category description..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formData.is_active === 1 ? "Category is active" : "Category is inactive"}
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
                    {editingCategory ? "Update Category" : "Create Category"}
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

export default AssetsCategory;
