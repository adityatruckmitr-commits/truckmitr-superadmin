export const STAGES = ['applied', 'screening', 'shortlisted', 'interview', 'hired', 'rejected']

export const stageLabel = {
  applied: 'Applied',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
}

export const stageBadge = {
  applied: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  screening: 'bg-slate-100/80 text-slate-700 border-slate-200',
  shortlisted: 'bg-purple-100/80 text-purple-700 border-purple-200',
  interview: 'bg-blue-100/80 text-blue-700 border-blue-200',
  hired: 'bg-teal-100/80 text-teal-700 border-teal-200',
  rejected: 'bg-rose-100/80 text-rose-700 border-rose-200',
}

export const modeLabel = { in_person: 'In person', phone: 'Phone', video: 'Video call' }

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

/** `<input type="datetime-local">` wants local "YYYY-MM-DDTHH:mm", not ISO/UTC. */
export const toLocalInput = (d) => {
  const date = d ? new Date(d) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Open the Add Employee form prefilled for a hired candidate. The Employees page links the new employee
 * back to this candidate once it's created.
 */
export const openCreateEmployee = (navigate, candidate) =>
  navigate('/employees', {
    state: {
      openAdd: true,
      prefill: {
        full_name: candidate.name,
        mobile: candidate.phone,
        personal_email: candidate.email,
        department: candidate.department,
      },
      candidate: { id: candidate.id, name: candidate.name },
    },
  })

export const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 bg-white'
export const labelCls = 'block text-gray-600 font-semibold mb-1'
