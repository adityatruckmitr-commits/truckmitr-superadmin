import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { HRMS_BASE_FILE_PATH } from '../../env'

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */
export const cx = (...classes) => classes.filter(Boolean).join(' ')

export const fileUrl = (path) => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = HRMS_BASE_FILE_PATH
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`
}

export const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '—'

/* ------------------------------------------------------------------ *
 * Avatar
 * ------------------------------------------------------------------ */
const avatarSizes = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
}

export const Avatar = ({ name, src, size = 'md', className = '', ring = true }) => {
  const [hasError, setHasError] = useState(false)
  const url = fileUrl(src)
  const showImg = url && !hasError

  return (
    <span
      className={cx(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-primary-800 font-semibold uppercase tracking-wide text-brass-200',
        ring && 'ring-1 ring-inset ring-brass-400/35',
        avatarSizes[size],
        className
      )}
      title={name}
    >
      {showImg ? (
        <img
          src={url}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */
export const Card = ({ as: Tag = 'div', className = '', interactive = false, children, ...rest }) => (
  <Tag className={cx(interactive ? 'card-interactive' : 'card', className)} {...rest}>
    {children}
  </Tag>
)

export const CardHeader = ({ icon: Icon, title, subtitle, action, className = '' }) => (
  <div className={cx('flex flex-wrap items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6', className)}>
    <div className="flex min-w-0 items-start gap-3">
      {Icon && (
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="panel-title truncate">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
  </div>
)

export const CardBody = ({ className = '', children }) => (
  <div className={cx('px-5 pb-5 pt-4 md:px-6 md:pb-6', className)}>{children}</div>
)

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */
const buttonVariants = {
  primary: 'btn-primary',
  brass: 'btn-brass',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', icon: Icon, loading = false, className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx(buttonVariants[variant] || buttonVariants.primary, size === 'sm' && 'btn-sm', className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

/* ------------------------------------------------------------------ *
 * Badges & status pills
 * ------------------------------------------------------------------ */
const badgeTones = {
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  brass: 'badge-brass',
}

export const Badge = ({ tone = 'neutral', icon: Icon, className = '', children }) => (
  <span className={cx(badgeTones[tone] || badgeTones.neutral, className)}>
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </span>
)

const statusTone = (status = '') => {
  const value = String(status).toLowerCase()
  if (['approved', 'present', 'active', 'paid', 'settled', 'completed', 'resolved'].includes(value)) return 'success'
  if (['pending', 'in progress', 'in_progress', 'partial', 'on hold'].includes(value)) return 'warning'
  if (['rejected', 'absent', 'inactive', 'cancelled', 'declined', 'failed'].includes(value)) return 'danger'
  return 'neutral'
}

export const StatusPill = ({ status, className = '' }) => (
  <Badge tone={statusTone(status)} className={cx('capitalize', className)}>
    <span
      className={cx(
        'h-1.5 w-1.5 rounded-full',
        {
          success: 'bg-green-500',
          warning: 'bg-yellow-500',
          danger: 'bg-red-500',
          neutral: 'bg-gray-400',
        }[statusTone(status)]
      )}
    />
    {status || 'Unknown'}
  </Badge>
)

/* ------------------------------------------------------------------ *
 * Page header
 * ------------------------------------------------------------------ */
export const PageHeader = ({ eyebrow, title, description, actions, className = '' }) => (
  <div className={cx('flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      <h1 className="text-2xl leading-tight md:text-[28px]">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-gray-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

/* ------------------------------------------------------------------ *
 * Stat tile
 * ------------------------------------------------------------------ */
const tileAccents = {
  ink: 'text-primary-700 bg-primary-50 ring-primary-100',
  brass: 'text-brass-700 bg-brass-50 ring-brass-200',
  green: 'text-green-700 bg-green-50 ring-green-200',
  red: 'text-red-700 bg-red-50 ring-red-200',
  purple: 'text-purple-700 bg-purple-50 ring-purple-200',
  orange: 'text-orange-700 bg-orange-50 ring-orange-200',
}

export const StatTile = ({
  icon: Icon,
  label,
  value,
  secondValue,
  secondLabel,
  valueLabel,
  caption,
  accent = 'ink',
  onClick,
  index = 0,
}) => {
  const clickable = typeof onClick === 'function'
  const Tag = clickable ? motion.button : motion.div
  return (
    <Tag
      {...(clickable ? { type: 'button', onClick } : {})}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cx(
        'group relative w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 text-left shadow-card',
        'transition-all duration-200',
        clickable && 'cursor-pointer hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lift'
      )}
    >
      {/* brass hairline that warms up on hover */}
      <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brass-400/70 via-brass-300/25 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        {/* Reserve two lines so values stay on one baseline whether or not the label wraps. */}
        <p className="min-h-[28px] text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.1em] text-gray-500">
          {label}
        </p>
        {Icon && (
          <span className={cx('inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset', tileAccents[accent])}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        {secondValue !== undefined && secondValue !== null ? (
          <div className="flex items-baseline gap-2.5">
            <span className="numeral text-3xl font-semibold text-green-700">{value}</span>
            <span className="text-lg text-gray-300">/</span>
            <span className="numeral text-3xl font-semibold text-red-600">{secondValue}</span>
          </div>
        ) : (
          <span className="numeral text-3xl font-semibold text-gray-900">{value}</span>
        )}
        {valueLabel && <span className="text-xs font-medium text-gray-500">{valueLabel}</span>}
      </div>

      {(caption || secondLabel) && (
        <p className="mt-1.5 text-xs text-gray-500">{caption || secondLabel}</p>
      )}
    </Tag>
  )
}

/* ------------------------------------------------------------------ *
 * Skeletons
 * ------------------------------------------------------------------ */
export const Skeleton = ({ className = '' }) => <div className={cx('skeleton', className)} />

export const SkeletonRows = ({ rows = 4, className = '' }) => (
  <div className={cx('space-y-3', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

/* ------------------------------------------------------------------ *
 * Segmented control — compact filter switcher
 * ------------------------------------------------------------------ */
export const Segmented = ({ options, value, onChange, className = '' }) => (
  <div className={cx('inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-100/70 p-0.5', className)}>
    {options.map((option) => {
      const active = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          title={option.hint}
          className={cx(
            'rounded-[7px] px-3 py-1.5 text-xs font-medium transition-all duration-200',
            active ? 'bg-white text-primary-800 shadow-2xs ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800'
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

/* ------------------------------------------------------------------ *
 * Empty state
 * ------------------------------------------------------------------ */
export const Empty = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
    {Icon && (
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-1 ring-inset ring-gray-200">
        <Icon className="h-6 w-6" />
      </span>
    )}
    <p className="font-display text-base font-semibold text-gray-800">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
