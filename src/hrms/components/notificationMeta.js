// What a notification looks like and where it leads. Shared by the bell drawer and the pop-up toast so
// the two can never disagree about an icon or a link.

const EMOJI = {
  leave_request_approved: '✅',
  leave_request_rejected: '❌',
  leave_request_created: '📋',
  wfh_request_approved: '✅',
  wfh_request_rejected: '❌',
  wfh_request_created: '📋',
  birthday: '🎉',
  leave_cancellation_approved: '✅',
  leave_cancellation_rejected: '❌',
  leave_cancellation_requested: '📋',
  salary_advance_created: '💰',
  salary_advance_approved: '✅',
  salary_advance_rejected: '❌',
  resignation_withdrawn: '↩️',
  payslip_issued: '📄',
  salary_initiated: '🏦',
  salary_credited: '💰',
  salary_on_hold: '⏸️',
}

// Self-service requests: the icon says what it is, the outcome variants say how it went.
const KIND_EMOJI = {
  resignation: '📤',
  expense: '🧾',
  asset_request: '💻',
  asset_ticket: '🛠️',
  employee_request: '📄',
}
const GOOD = /_(approved|fulfilled|completed|resolved|closed|assigned|allocated|returned)$/
const BAD = /_(rejected|declined|cancelled)$/

export const notificationEmoji = (type = '') => {
  if (EMOJI[type]) return EMOJI[type]
  const kind = Object.keys(KIND_EMOJI).find((k) => type.startsWith(k))
  if (!kind) return '📢'
  if (GOOD.test(type)) return '✅'
  if (BAD.test(type)) return '❌'
  return KIND_EMOJI[kind]
}

// Stored titles already start with their emoji ("📋 New Salary Advance Request"); the icon is drawn
// separately, so show the words only rather than the emoji twice.
export const notificationTitle = (title = '') => String(title).replace(/^[^\p{L}\p{N}]+/u, '').trim()

const STAFF_ROLES = ['hr', 'admin', 'super_admin', 'ceo', 'manager', 'reporting_manager']

/**
 * Is this notification addressed to the reader as a reviewer (HR/manager/CEO) or as the employee it is
 * about? The server records it per notification (`audience` on newer types, `target_role` on older ones);
 * the reader's own role is only the fallback.
 */
const readsAsStaff = (data, role) => {
  const audience = String(data.audience || '').toLowerCase()
  if (audience) return STAFF_ROLES.includes(audience)
  const target = String(data.target_role || '').toLowerCase()
  if (target && target !== 'employee') return STAFF_ROLES.includes(target)
  if (target === 'employee') return false
  return STAFF_ROLES.includes(String(role || '').toLowerCase())
}

// The record a notification is about, whatever key that type happens to store it under.
const recordId = (data) =>
  data.request_id ?? data.leave_request_id ?? data.short_leave_id ?? data.half_day_leave_id ?? data.wfh_request_id
  ?? data.wfh_id ?? data.salary_advance_id ?? data.offer_letter_id ?? data.job_opening_id ?? data.payslip_id ?? null

/**
 * The screen a notification belongs to (no query string). Resolved from the type and who is reading it,
 * not from the `web_path` stored at send time - older rows carry stale paths (e.g. a Director's offer
 * letter approval pointing at /my-documents), and resolving here fixes them retroactively.
 */
export const notificationPath = (notification, role) => {
  const type = String(notification?.type || '')
  const data = notification?.data || {}
  const staff = readsAsStaff(data, role)

  if (type.startsWith('short_leave') || type.startsWith('half_day_leave')) return '/short-leave'
  if (type.startsWith('wfh')) return '/wfh-requests'
  if (type.startsWith('salary_advance')) return staff ? '/salary-advance' : '/my-salary-advance'
  if (type.startsWith('leave')) return '/leave-management'
  if (type.startsWith('resignation')) return '/resignation'
  if (type.startsWith('offer_letter')) return staff ? '/offer-letter' : '/my-documents'
  if (type.startsWith('hiring_requirement') || type.startsWith('job_status')) return '/recruitment'
  if (type === 'payslip_issued') return '/my-documents'
  if (type.startsWith('payslip_')) return staff ? '/payroll' : '/dashboard'
  if (type.startsWith('salary_')) return '/dashboard' // the employee's own payout breakup lives there
  if (type.startsWith('employee_request')) return staff ? '/employee-requests' : '/my-documents'
  if (type.startsWith('asset')) return staff ? '/assets-management' : '/my-assets'
  if (type === 'birthday') return null
  // Expense/reimbursement screens were removed from the app (2026-09-22) - nowhere to land.
  if (type.startsWith('expense') || type.startsWith('reimbursement')) return null
  return data.web_path || null
}

/**
 * Where a click should land: the screen plus `?highlight=<id>` so the page scrolls to and marks the exact
 * record - a real URL, so it also survives a refresh. Returns null when a notification has nowhere to go.
 */
export const notificationTarget = (notification, role) => {
  const path = notificationPath(notification, role)
  if (!path) return null
  const id = recordId(notification.data || {})
  return {
    path: id != null ? `${path}?highlight=${encodeURIComponent(id)}` : path,
    state: { highlightId: id },
  }
}
