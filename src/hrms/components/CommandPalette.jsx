import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@hrms/router'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CornerDownLeft, ArrowUp, ArrowDown, LogOut } from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { visibleGroups, settingsGroups, auxiliaryRoutes, canSee, HR_ROLES } from '../config/navigation'
import { cx } from './ui'
import { hrmsPortalRoot } from '../env'

/**
 * Cmd/Ctrl+K jump bar. HR staff live in this app all day and the fastest route
 * to any screen should never be more than a few keystrokes.
 */
const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const role = user?.role || 'employee'
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  const commands = useMemo(() => {
    const entries = []
    visibleGroups(role).forEach((group) =>
      group.items.forEach((item) =>
        entries.push({ ...item, group: group.label, keywords: `${item.label} ${group.label} ${item.hint || ''}` })
      )
    )
    if (HR_ROLES.includes(role)) {
      settingsGroups.forEach((group) =>
        group.items.forEach((item) =>
          entries.push({
            ...item,
            group: 'Settings',
            hint: `${group.label} configuration`,
            keywords: `${item.label} settings ${group.label}`,
          })
        )
      )
    }
    auxiliaryRoutes.filter((item) => canSee(item, role)).forEach((item) =>
      entries.push({ ...item, icon: Search, group: 'More', keywords: item.label })
    )
    entries.push({
      to: '__logout',
      label: 'Sign out',
      icon: LogOut,
      group: 'Session',
      hint: 'End this session',
      keywords: 'logout sign out exit',
      danger: true,
    })
    return entries
  }, [role])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return commands
    return commands
      .map((command) => {
        const haystack = command.keywords.toLowerCase()
        const label = command.label.toLowerCase()
        let score = 0
        if (label.startsWith(needle)) score = 3
        else if (label.includes(needle)) score = 2
        else if (haystack.includes(needle)) score = 1
        return { command, score }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.command)
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      // Focus after the entry animation has begun, so the caret lands cleanly.
      const timer = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const run = (command) => {
    if (!command) return
    onClose()
    if (command.to === '__logout') {
      logout()
      navigate('/login')
      return
    }
    navigate(command.to)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((prev) => (results.length ? (prev + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((prev) => (results.length ? (prev - 1 + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(results[cursor])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary-950/45 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brass-400 via-brass-300/40 to-transparent" />

            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3.5">
              <Search className="h-[18px] w-[18px] shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search screens — employees, payroll, leave…"
                className="w-full border-0 bg-transparent p-0 text-[15px] text-gray-900 placeholder:text-gray-400 focus:ring-0"
                style={{ boxShadow: 'none' }}
              />
              <kbd className="hidden rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-gray-500">
                  Nothing matches “{query}”.
                </p>
              ) : (
                results.map((command, index) => {
                  const active = index === cursor
                  return (
                    <button
                      key={`${command.to}-${command.label}`}
                      data-active={active}
                      type="button"
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => run(command)}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100',
                        active ? 'bg-primary-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <span
                        className={cx(
                          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors',
                          command.danger
                            ? 'bg-red-50 text-red-600 ring-red-200'
                            : active
                            ? 'bg-white text-primary-700 ring-primary-200'
                            : 'bg-gray-50 text-gray-500 ring-gray-200'
                        )}
                      >
                        {command.icon && <command.icon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cx('block truncate text-sm font-medium', command.danger ? 'text-red-700' : 'text-gray-900')}>
                          {command.label}
                        </span>
                        {command.hint && <span className="block truncate text-xs text-gray-500">{command.hint}</span>}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-eyebrow text-gray-400">{command.group}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/70 px-4 py-2.5 text-[11px] text-gray-500">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" />
                  open
                </span>
              </span>
              <span className="font-medium tracking-wide text-gray-400">TM-Manavsetu</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    hrmsPortalRoot()
  )
}

export default CommandPalette
