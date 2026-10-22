import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react-teleadmin'
import { cx } from '../ui'

// Shared overlay for every payroll dialog: Esc / backdrop closes, header + scroll body + optional footer.
const Modal = ({ open, onClose, title, subtitle, size = 'md', footer, children }) => {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-5xl' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8 }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl', widths[size])}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
