import { useLocation } from '@hrms/router'

/**
 * The record a deep link points at. Notifications link as `/page?highlight=<id>` (survives a refresh or a
 * copied URL) and also pass it in router state; either works. Numeric ids come back as numbers so they
 * compare equal to the API's ids.
 */
export const useHighlightId = () => {
  const location = useLocation()
  const raw = location.state?.highlightId ?? new URLSearchParams(location.search).get('highlight')
  if (raw === null || raw === undefined || raw === '') return null
  return /^\d+$/.test(String(raw)) ? Number(raw) : String(raw)
}
