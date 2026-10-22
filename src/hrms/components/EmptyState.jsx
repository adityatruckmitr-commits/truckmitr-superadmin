import { motion } from 'framer-motion'

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col items-center justify-center px-6 py-14 text-center"
  >
    {Icon && (
      <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200">
        <Icon className="h-7 w-7" />
      </span>
    )}
    <h3 className="font-display text-lg font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
)

export default EmptyState
