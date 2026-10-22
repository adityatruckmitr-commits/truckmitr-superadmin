const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-9 w-9 border-[3px]',
  lg: 'h-14 w-14 border-4',
}

/**
 * A brass arc turning over an ink ring — quieter than a full spinner and it
 * matches the rest of the chrome.
 */
const LoadingSpinner = ({ size = 'md', label, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    <div
      className={`animate-spin rounded-full border-gray-200 border-t-brass-500 ${sizeClasses[size] || sizeClasses.md}`}
      role="status"
      aria-label={label || 'Loading'}
    />
    {label && <p className="text-sm text-gray-500">{label}</p>}
  </div>
)

export default LoadingSpinner
