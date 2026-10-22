import { AlertTriangle, RotateCcw } from 'lucide-react-teleadmin'
import { motion } from 'framer-motion'

const ErrorMessage = ({ message, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col items-center justify-center px-6 py-12 text-center"
  >
    <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-inset ring-red-200">
      <AlertTriangle className="h-7 w-7" />
    </span>
    <h3 className="font-display text-lg font-semibold text-gray-900">Something went wrong</h3>
    <p className="mt-1.5 max-w-sm text-sm text-gray-500">{message || 'We could not load this data.'}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary mt-5">
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    )}
  </motion.div>
)

export default ErrorMessage
