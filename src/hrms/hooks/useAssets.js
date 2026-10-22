import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

// Assigning, returning or editing an asset changes several views at once.
const ASSET_VIEW_KEYS = ['assets', 'myAssets', 'assetHistory', 'assetLoans', 'assetScan']
const invalidateAssetViews = (queryClient) =>
  ASSET_VIEW_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))

// Asset Categories Hooks
export const useAssetCategories = () => {
  return useQuery({
    queryKey: ['assetCategories'],
    queryFn: async () => {
      const response = await api.get('/asset-categories')
      return response.data
    }
  })
}

export const useCreateAssetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/asset-categories', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
    }
  })
}

export const useUpdateAssetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, data }) => {
      const response = await api.put(`/asset-categories/${categoryId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
    }
  })
}

export const useDeleteAssetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/asset-categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] })
    }
  })
}

// Asset Sub Categories Hooks
export const useAssetSubCategories = (categoryId) => {
  return useQuery({
    queryKey: ['assetSubCategories', categoryId],
    queryFn: async () => {
      const response = await api.get(`/asset-sub-categories/${categoryId}`)
      return response.data
    },
    enabled: !!categoryId
  })
}

export const useCreateAssetSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/asset-sub-categories', data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assetSubCategories', variables.category_id]
      })
    }
  })
}

export const useUpdateAssetSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ subCategoryId, data }) => {
      const response = await api.put(`/asset-sub-categories/${subCategoryId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetSubCategories'] })
    }
  })
}

export const useDeleteAssetSubCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/asset-sub-categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetSubCategories'] })
    }
  })
}

// Assets Hooks
export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets')
      return response.data
    }
  })
}

export const useCreateAsset = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/assets', data)
      return response.data
    },
    onSuccess: () => invalidateAssetViews(queryClient)
  })
}

export const useUpdateAsset = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assetId, data }) => {
      const response = await api.put(`/assets/${assetId}`, data)
      return response.data
    },
    onSuccess: () => invalidateAssetViews(queryClient)
  })
}

export const useAssignAsset = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/assets/assign', data)
      return response.data
    },
    onSuccess: () => invalidateAssetViews(queryClient)
  })
}

export const useReturnAsset = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/assets/return', data)
      return response.data
    },
    onSuccess: () => invalidateAssetViews(queryClient)
  })
}

// Combined assignment/return audit trail across all assets
export const useAssetHistory = () => {
  return useQuery({
    queryKey: ['assetHistory'],
    queryFn: async () => {
      const response = await api.get('/assets/history/all')
      return response.data?.data || []
    }
  })
}

// Asset Management's Loan module: every asset currently out on a temporary loan, flagged overdue
export const useAssetLoans = () => {
  return useQuery({
    queryKey: ['assetLoans'],
    queryFn: async () => {
      const response = await api.get('/assets/loans/all')
      return response.data?.data || []
    }
  })
}

// Current employee's own assigned assets
export const useMyAssets = () => {
  return useQuery({
    queryKey: ['myAssets'],
    queryFn: async () => {
      const response = await api.get('/assets/my')
      return response.data?.data || []
    }
  })
}

// Asset Requests (employee self-service, HR review)
export const useAssetRequests = (params = {}) => {
  return useQuery({
    queryKey: ['assetRequests', params],
    queryFn: async () => {
      const response = await api.get('/asset-requests', { params })
      return response.data?.data || []
    }
  })
}

export const useCreateAssetRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/asset-requests', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetRequests'] })
    }
  })
}

export const useUpdateAssetRequestStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await api.put(`/asset-requests/${id}/status`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetRequests'] })
    }
  })
}

// Asset Tickets (issue reporting)
export const useAssetTickets = (params = {}) => {
  return useQuery({
    queryKey: ['assetTickets', params],
    queryFn: async () => {
      const response = await api.get('/asset-tickets', { params })
      return response.data?.data || []
    }
  })
}

export const useCreateAssetTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/asset-tickets', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTickets'] })
      queryClient.invalidateQueries({ queryKey: ['assetScan'] })
    }
  })
}

export const useUpdateAssetTicketStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await api.put(`/asset-tickets/${id}/status`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetTickets'] })
      queryClient.invalidateQueries({ queryKey: ['assetScan'] })
    }
  })
}

// What a phone shows after scanning an asset's QR label (looked up by asset tag)
export const useAssetScan = (tag) => {
  return useQuery({
    queryKey: ['assetScan', tag],
    enabled: !!tag,
    retry: false,
    queryFn: async () => {
      const response = await api.get(`/assets/scan/${encodeURIComponent(tag)}`)
      return response.data?.data
    }
  })
}

// Download the asset register (CSV) through the signed-in API connection
export const downloadAssetReport = async () => {
  const response = await api.get('/assets/export/excel', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `asset-register-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
