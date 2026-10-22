// Endpoints for the HRMS pages inside the combined console. The HRMS API is served by the main
// backend under /api/hrms (routes/hrms.php), so the original VITE_API_BASE_URL maps to these.
export const HRMS_API_BASE = (
  import.meta.env.VITE_HRMS_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || '/api'}/hrms`
).replace(/\/$/, '')

// Backend origin used for /storage/... links (original: VITE_API_BASE_URL without /api)
export const HRMS_FILE_ORIGIN = HRMS_API_BASE.replace(/\/api(\/hrms)?$/, '')

export const HRMS_BASE_FILE_PATH =
  import.meta.env.VITE_HRMS_BASE_FILE_PATH?.trim() || 'https://truckmitr.com/storage/app/public'

export const HRMS_SELFIE_PATH = import.meta.env.VITE_HRMS_BASE_SELFIE_FILE_PATH || ''

// No separate HRMS login: HRMS requests carry the console login token (stored by the console
// login as 'token'); the backend accepts it on /api/hrms (HrmsAuthMiddleware).
export const HRMS_TOKEN_KEY = 'token'
// HRMS profile of the console user (loaded from /profile + /my-profile)
export const HRMS_USER_KEY = 'tm_hrms_user'

// Console session ended (expired/invalid token or sign-out): same clean-up as the console logout
export const endConsoleSession = () => {
  ;['token', 'prod_token', 'refresh_token', 'user', 'tm_admin_token', 'tm_admin_user', HRMS_USER_KEY].forEach((key) =>
    localStorage.removeItem(key)
  )
  window.location.href = '/login'
}

// Portals (drawers, palettes, modals) render here so they keep the HRMS palette
export const hrmsPortalRoot = () => {
  let el = document.getElementById('hrms-portal-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'hrms-portal-root'
    el.className = 'hrms-scope'
    document.body.appendChild(el)
  }
  return el
}
