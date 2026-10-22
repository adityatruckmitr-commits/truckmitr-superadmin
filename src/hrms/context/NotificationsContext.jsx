import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from '@hrms/router'
import { useAuth } from './AuthContext'
import { notificationService } from '../services/notifications'
import { notificationPath } from '../components/notificationMeta'

/**
 * One source of truth for the bell and the sidebar. Polls the unread count cheaply; whenever it changes,
 * pulls every unread notification so each sidebar item can show how many are waiting on that screen.
 * Opening a screen marks its notifications read, which clears its badge (and the bell's count with it).
 */
const NotificationsContext = createContext(null)

const POLL_MS = 15000

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role

  const [unreadCount, setUnreadCount] = useState(0)
  const [unread, setUnread] = useState([]) // every unread notification (for per-screen badges)
  const [loaded, setLoaded] = useState(false)
  const lastCountRef = useRef(null)
  const listeners = useRef(new Set())

  const loadUnread = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications(1, 500, { unread: 1 })
      setUnread(res?.data?.data || [])
      setLoaded(true)
    } catch {
      /* the badge is a nicety; the bell still works */
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount()
      const count = res?.unread_count || 0
      const previous = lastCountRef.current
      lastCountRef.current = count
      setUnreadCount(count)
      if (previous !== count) {
        await loadUnread()
        if (previous !== null && count > previous) listeners.current.forEach((fn) => fn())
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [loadUnread])

  // Header subscribes to pop its "new notification" toast.
  const onNewNotifications = useCallback((fn) => {
    listeners.current.add(fn)
    return () => listeners.current.delete(fn)
  }, [])

  useEffect(() => {
    lastCountRef.current = null
    refresh()
    const poll = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = setInterval(poll, POLL_MS)
    document.addEventListener('visibilitychange', poll)
    window.addEventListener('focus', poll)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', poll)
      window.removeEventListener('focus', poll)
    }
  }, [refresh, user?.id])

  // path -> [notification ids] for everything unread
  const unreadByPath = useMemo(() => {
    const map = {}
    unread.forEach((n) => {
      const path = notificationPath(n, role)
      if (!path) return
      ;(map[path] ||= []).push(n.id)
    })
    return map
  }, [unread, role])

  const markRead = useCallback(async (ids) => {
    if (!ids?.length) return
    const set = new Set(ids)
    setUnread((prev) => prev.filter((n) => !set.has(n.id)))
    setUnreadCount((c) => Math.max(0, c - ids.length))
    lastCountRef.current = Math.max(0, (lastCountRef.current ?? 0) - ids.length)
    try {
      await notificationService.markManyAsRead(ids)
    } catch {
      refresh() // fall back to the server's truth
    }
  }, [refresh])

  // Landing on a screen means its notifications have been seen. Only on arrival (or the first load):
  // something that comes in while you're already on the screen keeps its badge until you revisit.
  const unreadByPathRef = useRef(unreadByPath)
  unreadByPathRef.current = unreadByPath
  const clearedPathRef = useRef(null)
  useEffect(() => {
    if (!loaded || clearedPathRef.current === location.pathname) return
    clearedPathRef.current = location.pathname
    markRead(unreadByPathRef.current[location.pathname])
  }, [location.pathname, loaded, markRead])

  const countFor = useCallback((path) => unreadByPath[path]?.length || 0, [unreadByPath])

  const value = useMemo(
    () => ({ unreadCount, unreadByPath, countFor, refresh, markRead, onNewNotifications }),
    [unreadCount, unreadByPath, countFor, refresh, markRead, onNewNotifications]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider')
  return ctx
}
