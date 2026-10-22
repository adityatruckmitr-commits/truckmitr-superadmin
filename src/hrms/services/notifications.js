import api from './api'

export const notificationService = {
  getNotifications: async (page = 1, perPage = 20, extraParams = {}) => {
    try {
      const response = await api.get('/notifications', {
        params: {
          page,
          per_page: perPage,
          ...extraParams
        }
      })
      return response.data
    } catch (error) {
      console.error("Error fetching notifications:", error)
      throw error
    }
  },
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count')
      return response.data
    } catch (error) {
      console.error("Error fetching unread count:", error)
      throw error
    }
  },
  markAsRead: async (id) => {
    try {
      console.log("Marking notification as read:", id)
      const response = await api.post(`/notifications/${id}/read`, {})
      return response.data
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },
  markAllAsRead: async () => {
    try {
      console.log("Marking all notifications as read")
      const response = await api.post('/notifications/mark-all-read', {})
      return response.data
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  },
  markManyAsRead: async (ids) => {
    const response = await api.post('/notifications/mark-read', { ids })
    return response.data
  },
  deleteNotification: async (id) => {
    try {
      console.log("Deleting notification:", id)
      const response = await api.delete(`/notifications/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting notification:", error)
      throw error
    }
  }
}
