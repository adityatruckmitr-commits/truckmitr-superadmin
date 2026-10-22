import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Trash2, ArrowRight } from 'lucide-react-teleadmin'
import { useNavigate } from '@hrms/router'
import { createPortal } from 'react-dom'
import { notificationService } from '../services/notifications'
import { useAuth } from '../context/AuthContext'
import { notificationEmoji, notificationTarget, notificationTitle } from './notificationMeta'
import { hrmsPortalRoot } from '../env'

const NotificationDrawer = ({ isOpen, onClose, notifications, unreadCount, onRefresh }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      onRefresh()
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      alert("Failed to mark notification as read. Please try again.")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      onRefresh()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      alert("Failed to mark all notifications as read. Please try again.")
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      onRefresh()
    } catch (error) {
      console.error("Failed to delete notification:", error)
      alert("Failed to delete notification. Please try again.")
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    } catch {
      return dateString
    }
  }

  const handleItemClick = async (notification) => {
    const navData = notificationTarget(notification, user?.role)
    if (navData) {
      if (!notification.read_at) {
        try {
          await handleMarkAsRead(notification.id)
        } catch (error) {
          console.error("Failed to mark as read on click:", error)
        }
      }
      navigate(navData.path, { state: navData.state })
      onClose()
    }
  }

  const isClickable = (notification) => {
    return !!notificationTarget(notification, user?.role)
  }

  // Rendered on <body>, not inside the header: the header's backdrop blur makes it the containing block for
  // `position: fixed` children, which squeezed this panel into the 64px header bar and hid the whole list.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 "
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full flex-col bg-white shadow-lg md:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">{unreadCount} unread</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm text-left text-primary-600 hover:bg-primary-50 transition-colors border-b border-gray-200 w-full"
              >
                Mark all as read
              </button>
            )}

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.map((item) => {
                    const clickable = isClickable(item)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => clickable && handleItemClick(item)}
                        className={`p-4 transition-all ${
                          item.read_at ? "bg-white" : "bg-blue-50 border-l-4 border-blue-500"
                        } ${clickable ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      >
                        <div className="flex gap-3">
                          <span className="text-2xl flex-shrink-0">
                            {notificationEmoji(item.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {notificationTitle(item.data?.title)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.data?.message}
                            </p>

                            {/* Dynamic details for Leave/WFH */}
                            {(item.type.includes("leave") || item.type.includes("wfh")) && (
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {item.data?.start_date && (
                                  <p>
                                    <span className="font-medium">From:</span>{" "}
                                    {formatDate(item.data.start_date)}
                                  </p>
                                )}
                                {item.data?.end_date && (
                                  <p>
                                    <span className="font-medium">To:</span>{" "}
                                    {formatDate(item.data.end_date)}
                                  </p>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          {clickable && (
                            <div className="flex-shrink-0 flex items-center">
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                            </div>
                          )}
                        </div>

                        {/* Item Footer Buttons */}
                        <div className="flex gap-2 mt-3">
                          {!item.read_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(item.id)
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-100 rounded-sm transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(item.id)
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded-sm transition-colors ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    hrmsPortalRoot()
  )
}

export default NotificationDrawer
