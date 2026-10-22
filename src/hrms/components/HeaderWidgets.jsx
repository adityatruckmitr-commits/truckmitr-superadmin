import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from '@hrms/router'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, LogOut, Search, ChevronDown, CalendarDays, UserRound, X } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'
import NotificationDrawer from './NotificationDrawer'
import { notificationService } from '../services/notifications'
import { notificationEmoji, notificationTitle } from './notificationMeta'
import { titleForPath } from '../config/navigation'
import { Avatar, cx } from './ui'

const roleBadges = {
  // console users work as super_admin (see HrmsAuthMiddleware)
  super_admin: { label: 'Admin', className: 'bg-brass-50 text-brass-700 ring-brass-200' },
  hr: { label: 'HR', className: 'bg-primary-50 text-primary-700 ring-primary-200' },
  admin: { label: 'Admin', className: 'bg-primary-50 text-primary-700 ring-primary-200' },
}

/**
 * The right-hand side of the original HRMS header (search, date, notifications, profile),
 * rendered into the console header (#hrms-header-slot) so HRMS screens keep a single header.
 */
const HeaderWidgets = ({ onOpenSearch }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const queryClient = useQueryClient()
  const [slot, setSlot] = useState(null)

  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { unreadCount, refresh: refreshUnread, onNewNotifications } = useNotifications()

  const { title } = titleForPath(location.pathname)
  const badge = roleBadges[user?.role]

  useEffect(() => {
    setSlot(document.getElementById('hrms-header-slot'))
  }, [])

  // How the bell learns about new things without a page reload: NotificationsContext polls the unread
  // count; when it goes UP something new has arrived, so pull the list and pop a toast for what wasn't seen yet.
  const seenIdRef = useRef(0) // highest notification id already shown to this user
  const drawerOpenRef = useRef(false)

  useEffect(() => {
    drawerOpenRef.current = showNotifications
  }, [showNotifications])

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications(1, 20)
      const list = res?.data?.data || []
      setNotifications(list)
      return list
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return null
    }
  }

  const announceNew = async () => {
    const list = await fetchNotifications()
    if (!list) return
    // Whatever just arrived probably changed a list on screen (a new request for HR, a payslip for the employee).
    ;['employee-requests', 'my-requests', 'my-payout'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
    const fresh = list.filter((n) => !n.read_at && Number(n.id) > seenIdRef.current)
    seenIdRef.current = Math.max(seenIdRef.current, ...list.map((n) => Number(n.id) || 0))
    if (fresh.length === 0 || drawerOpenRef.current) return

    const latest = fresh[0]
    toast.custom(
      (t) => (
        <div
          className={cx(
            'pointer-events-auto flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl transition-all duration-200',
            t.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          )}
        >
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id)
              setShowNotifications(true)
            }}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <span className="text-xl leading-none">{notificationEmoji(latest.type)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-900">
                {fresh.length > 1 ? `${fresh.length} new notifications` : notificationTitle(latest.data?.title) || 'New notification'}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600">
                {fresh.length > 1 ? `Latest: ${notificationTitle(latest.data?.title)}` : latest.data?.message}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-primary-700">View</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      { id: 'new-notification', duration: 9000 }
    )
  }

  useEffect(() => {
    fetchNotifications().then((list) => {
      if (list?.length) seenIdRef.current = Math.max(seenIdRef.current, ...list.map((n) => Number(n.id) || 0))
    })
    return onNewNotifications(() => announceNew())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNewNotifications])

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications()
      refreshUnread()
    }
  }, [showNotifications])

  // Keep the browser tab in step with the screen the user is on.
  useEffect(() => {
    document.title = `${title} · TM-Manavsetu`
  }, [title])

  // Dismiss the profile menu on any outside click.
  useEffect(() => {
    if (!showProfile) return
    const handler = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProfile])

  const widgets = (
    <div className="hrms-scope flex items-center gap-1.5 md:gap-2" style={{ background: 'transparent' }}>
      <button
        onClick={onOpenSearch}
        className="group hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-2xs transition-all hover:border-gray-300 hover:text-gray-700 md:flex"
        title="Search HRMS screens (Ctrl+K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">HRMS screens…</span>
        <kbd className="ml-2 hidden rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-gray-500 xl:inline">
          Ctrl K
        </kbd>
      </button>

      <span className="mx-1 hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-2xs 2xl:flex">
        <CalendarDays className="h-4 w-4 text-brass-500" />
        {format(new Date(), 'EEE, dd MMM yyyy')}
      </span>

      <button
        id="header-notification-bell"
        onClick={() => setShowNotifications((prev) => !prev)}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200/60 hover:text-gray-900"
        aria-label="HRMS notifications"
        title="HRMS notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-gray-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setShowProfile((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-200/60"
          title="HRMS account"
        >
          <Avatar name={user?.full_name || user?.name} src={user?.photo_path} size="sm" />
          <span className="hidden max-w-[140px] flex-col items-start lg:flex">
            <span className="flex items-center gap-1.5 truncate text-sm font-medium leading-tight text-gray-800">
              {user?.full_name || user?.name || 'Team Member'}
              {badge && (
                <span className={cx('shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset', badge.className)}>
                  {badge.label}
                </span>
              )}
            </span>
            <span className="truncate text-[11px] leading-tight text-gray-500">
              {user?.designation || 'Employee'}
            </span>
          </span>
          <ChevronDown
            className={cx('hidden h-4 w-4 text-gray-400 transition-transform lg:block', showProfile && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            >
              <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50/70 px-4 py-3.5">
                <Avatar name={user?.full_name || user?.name} src={user?.photo_path} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {user?.full_name || user?.name || 'Team Member'}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user?.email || user?.official_email || '—'}</p>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 font-medium"
                >
                  <UserRound className="h-4 w-4 text-blue-600" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    navigate('/my-attendance')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  My Attendance
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    logout()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <>
      {slot && createPortal(widgets, slot)}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefresh={() => {
          fetchNotifications()
          refreshUnread()
        }}
      />
    </>
  )
}

export default HeaderWidgets
