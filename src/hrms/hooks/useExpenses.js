import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Expenses Hooks
export const useExpenses = (params = {}) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const response = await api.get('/expenses', { params })
      return response.data
    },
    staleTime: 0
  })
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      // If data is FormData, append _method = PUT for Laravel compatibility
      if (data instanceof FormData) {
        data.append('_method', 'PUT')
      }
      const response = await api.post(`/expenses/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/expenses/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}

// Expense Approvals Hooks
export const usePendingApprovals = () => {
  return useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const response = await api.get('/approvals/pending')
      return response.data
    }
  })
}

export const useApproveExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, remarks }) => {
      const response = await api.post(`/approvals/${id}/approve`, { remarks })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}

export const useRejectExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, remarks }) => {
      const response = await api.post(`/approvals/${id}/reject`, { remarks })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })
}

// Expense Categories Hooks
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const response = await api.get('/expense-categories')
      return response.data
    }
  })
}

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expense-categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    }
  })
}

export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, data }) => {
      const response = await api.put(`/expense-categories/${categoryId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    }
  })
}

export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/expense-categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    }
  })
}

// Expense Sub Categories Hooks
export const useExpenseSubCategories = (categoryId) => {
  const isEnabled = !!(categoryId && !isNaN(categoryId))
  return useQuery({
    queryKey: ['expenseSubCategories', categoryId],
    queryFn: async () => {
      const response = await api.get(`/expense-sub-categories/${categoryId}`)
      return response.data
    },
    enabled: isEnabled
  })
}

export const useCreateExpenseSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expense-sub-categories', data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenseSubCategories', variables.category_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['expenseSubCategories']
      })
    }
  })
}

export const useUpdateExpenseSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ subCategoryId, data }) => {
      const response = await api.put(`/expense-sub-categories/${subCategoryId}`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expenseSubCategories']
      })
      queryClient.invalidateQueries({
        queryKey: ['expenseSubCategory', variables.subCategoryId]
      })
    }
  })
}

export const useDeleteExpenseSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/expense-sub-categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseSubCategories'] })
    }
  })
}

// Other Approval Lists Hooks
export const useSubordinateExpenses = () => {
  return useQuery({
    queryKey: ['subordinate-expenses'],
    queryFn: async () => {
      const response = await api.get('/approvals/subordinates/expenses')
      return response.data
    }
  })
}

export const useManagementExpenses = () => {
  return useQuery({
    queryKey: ['management-expenses'],
    queryFn: async () => {
      const response = await api.get('/management/expenses')
      return response.data
    }
  })
}

export const useExpenseApprovalDetails = (id) => {
  return useQuery({
    queryKey: ['expense-approval-details', id],
    queryFn: async () => {
      const response = await api.get(`/approvals/expense/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

export const useCanApproveExpense = (id) => {
  return useQuery({
    queryKey: ['can-approve-expense', id],
    queryFn: async () => {
      const response = await api.get(`/approvals/${id}/can-approve`)
      return response.data
    },
    enabled: !!id
  })
}

export const useApprovalHistory = (id) => {
  return useQuery({
    queryKey: ['approval-history', id],
    queryFn: async () => {
      const response = await api.get(`/approvals/${id}/history`)
      return response.data
    },
    enabled: !!id
  })
}

// CEO/Management: add a fully-approved reimbursement to a payroll month (spec's Employee
// Reimbursement flow). Guards against double-adding are enforced server-side.
export const useAddReimbursementToPayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, month }) => {
      const response = await api.post(`/reimbursements/${id}/add-to-payroll`, { month })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense-approval-details'] })
    }
  })
}
