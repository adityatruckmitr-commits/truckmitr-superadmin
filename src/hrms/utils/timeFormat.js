/**
 * Convert decimal hours to formatted time string
 * @param {number|string} hours - Decimal hours (e.g., 8.50)
 * @returns {string} Formatted time (e.g., "8 hours, 30 minutes")
 */
export const formatWorkHours = (hours) => {
  if (!hours || hours === 0) return '0 hours'
  
  const totalHours = parseFloat(hours)
  const h = Math.floor(totalHours)
  const remainingMinutes = (totalHours - h) * 60
  const m = Math.floor(remainingMinutes)
  const s = Math.floor((remainingMinutes - m) * 60)
  
  const parts = []
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
  if (s > 0 && h === 0) parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`)
  
  return parts.join(', ') || '0 hours'
}

/**
 * Convert decimal hours to short format
 * @param {number|string} hours - Decimal hours (e.g., 8.50)
 * @returns {string} Short format (e.g., "8h 30m")
 */
export const formatWorkHoursShort = (hours) => {
  if (!hours || hours === 0) return '0h'
  
  const totalHours = parseFloat(hours)
  const h = Math.floor(totalHours)
  const remainingMinutes = (totalHours - h) * 60
  const m = Math.floor(remainingMinutes)
  
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  
  return parts.join(' ') || '0h'
}
