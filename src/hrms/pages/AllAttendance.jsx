import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CalendarCheck2, ChevronDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Search, Upload, UserCheck, UserX, Users } from 'lucide-react-teleadmin'
import { format, addMonths, parse } from 'date-fns'
import toast from 'react-hot-toast'
import { Avatar, Badge, Button, Card, Empty, Segmented, SkeletonRows, StatTile, cx } from '../components/ui'
import { downloadAttendanceSheet, readBlobError, useAttendanceSheet } from '../hooks/useAttendance'
import { useDepartments } from '../hooks/useEmployees'
import EditAttendanceModal from '../components/attendance/EditAttendanceModal'
import BulkUploadModal from '../components/attendance/BulkUploadModal'

// Letter + colour for each day status. Same letters the Excel/CSV export uses.
const STATUS = {
  present: { letter: 'P', label: 'Present', chip: 'bg-green-100 text-green-800' },
  wfh: { letter: 'WFH', label: 'Work from home', chip: 'bg-blue-100 text-blue-800' },
  absent: { letter: 'A', label: 'Absent', chip: 'bg-red-100 text-red-800' },
  // No punch on a working day that has already passed: counted as absent, shown lighter so HR can tell it was not recorded.
  absent_inferred: { letter: 'A', label: 'Absent — no punch recorded', chip: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200' },
  on_leave: { letter: 'L', label: 'On leave', chip: 'bg-yellow-100 text-yellow-800' },
  holiday: { letter: 'H', label: 'Holiday', chip: 'bg-brass-100 text-brass-800' },
  week_off: { letter: 'WO', label: 'Week off', chip: 'bg-gray-100 text-gray-500' },
  pending: { letter: 'PD', label: 'Pending approval', chip: 'bg-orange-100 text-orange-700' },
  none: { letter: '–', label: 'No record', chip: 'text-gray-300' },
  not_joined: { letter: 'NJ', label: 'Before joining', chip: 'text-gray-300' },
  upcoming: { letter: '', label: 'Upcoming', chip: '' },
}
const LEGEND = ['present', 'wfh', 'absent', 'absent_inferred', 'on_leave', 'holiday', 'week_off', 'pending', 'none', 'not_joined']

const monthKey = (d = new Date()) => format(d, 'yyyy-MM')
const shift = (key, n) => monthKey(addMonths(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), n))
const label = (key) => format(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), 'MMMM yyyy')

const Th = ({ children, className = '', ...rest }) => (
  <th className={cx('border-b border-gray-200 bg-gray-50 px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500', className)} {...rest}>
    {children}
  </th>
)

// v2: only an explicit pick is stored (v1 also stored the untouched default, which made "Punch records" stick).
const SOURCE_KEY = 'hrms.allAttendance.source.v2'
const storedSource = () => {
  try {
    const v = localStorage.getItem(SOURCE_KEY)
    return v === 'approved' || v === 'live' ? v : null
  } catch {
    return null
  }
}

const AllAttendance = () => {
  const [month, setMonth] = useState(monthKey())
  const [filter, setFilter] = useState('active')
  // Punch records vs Approved (payroll) are separate tables. Live punch records are the real, authoritative
  // attendance and stay the default even if the approved (payroll) table happens to hold more rows for the
  // month - HR is told via a banner below and can switch to Approved deliberately, but it's never silent.
  const [source, setSource] = useState(() => storedSource() || 'live')
  const chooseSource = (value) => {
    try { localStorage.setItem(SOURCE_KEY, value) } catch { /* private mode: it just won't be remembered */ }
    setSource(value)
  }
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [jumped, setJumped] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const touched = useRef(false)

  const params = useMemo(() => ({ month, filter, source, department }), [month, filter, source, department])
  const { data, isLoading, isFetching, isError, error } = useAttendanceSheet(params)
  const { data: deptData } = useDepartments()
  const departments = Array.isArray(deptData) ? deptData : deptData?.departments || []

  // First visit lands on this month; if it has no attendance yet, open the latest month that does.
  useEffect(() => {
    if (touched.current || !data || data.month !== month) return
    if (data.summary.records === 0 && data.available_months?.length && data.available_months[0] !== month) {
      setMonth(data.available_months[0])
      setJumped(true)
    }
  }, [data, month])

  const pick = (setter) => (value) => { touched.current = true; setJumped(false); setter(value) }
  const changeMonth = pick(setMonth)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const all = data?.employees || []
    return q ? all.filter((r) => r.full_name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q)) : all
  }, [data, search])

  const s = data?.summary
  const days = data?.days || []
  const currentMonth = monthKey()

  const onExport = async (fmt) => {
    setMenuOpen(false)
    setExporting(true)
    try {
      const name = await downloadAttendanceSheet(params, fmt)
      toast.success(`Downloaded ${name}`)
    } catch (e) {
      toast.error((await readBlobError(e)) || 'Could not export the attendance sheet')
    } finally {
      setExporting(false)
    }
  }

  const accessDenied = isError && error?.response?.status === 403

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-tight md:text-[28px]">All Attendance</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
            Month-wise attendance of every employee — one row per person, one column per day.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="secondary" icon={Upload} onClick={() => setBulkOpen(true)}>Bulk upload</Button>
        <div className="relative">
          <Button icon={Download} loading={exporting} disabled={!data || isLoading} onClick={() => setMenuOpen((v) => !v)}>
            Export sheet <ChevronDown className="h-4 w-4" />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lift">
                <p className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                  {label(month)} · {filter === 'active' ? 'Active' : 'All'} employees
                  {department ? ' · one department' : ''}
                </p>
                <button onClick={() => onExport('xlsx')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50">
                  <FileSpreadsheet className="h-4 w-4 text-green-700" />
                  <span><b className="block font-medium text-gray-900">Excel (.xlsx)</b><span className="text-xs text-gray-500">Coloured sheet, frozen headers</span></span>
                </button>
                <button onClick={() => onExport('csv')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span><b className="block font-medium text-gray-900">CSV</b><span className="text-xs text-gray-500">Plain text, opens anywhere</span></span>
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Controls */}
      <Card className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button onClick={() => changeMonth(shift(month, -1))} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="month" value={month} max={currentMonth} aria-label="Month"
            onChange={(e) => e.target.value && changeMonth(e.target.value)}
            className="field-input !w-auto !py-1.5 text-sm"
          />
          <button onClick={() => changeMonth(shift(month, 1))} disabled={month >= currentMonth}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <Segmented
          value={filter} onChange={pick(setFilter)}
          options={[{ value: 'all', label: 'All employees', hint: 'Every employee record' }, { value: 'active', label: 'Active employees', hint: 'Only currently active employees' }]}
        />

        <Segmented
          value={source} onChange={pick(chooseSource)}
          options={[
            { value: 'live', label: 'Punch records', hint: 'What employees marked in the app' },
            { value: 'approved', label: 'Approved (payroll)', hint: 'The revised sheet uploaded for payroll' },
          ]}
        />

        <select value={department} onChange={(e) => pick(setDepartment)(e.target.value)} className="field-input !w-auto !py-1.5 text-sm" aria-label="Department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or ID…"
            className="field-input !w-56 !py-1.5 !pl-8 text-sm" aria-label="Search employees" />
        </div>
      </Card>

      {data?.month === month && data.other_source?.records > (s?.records ?? 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <span className="flex items-start gap-2">
            <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {label(month)} has <b>{data.other_source.records}</b> entries under <b>{data.other_source.source === 'approved' ? 'Approved (payroll)' : 'Punch records'}</b>
              {data.other_source.source === 'approved' ? ' — what a bulk upload saves and payroll uses' : ''}, but this view ({source === 'approved' ? 'Approved (payroll)' : 'Punch records'}) has only {s?.records ?? 0}.
            </span>
          </span>
          <Button size="sm" variant="secondary" onClick={() => pick(chooseSource)(data.other_source.source)}>
            View {data.other_source.source === 'approved' ? 'Approved (payroll)' : 'Punch records'}
          </Button>
        </div>
      )}

      {jumped && (
        <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
          There is no {source === 'approved' ? 'approved' : 'recorded'} attendance for {label(currentMonth)} yet, so this shows {label(month)} — the latest month with data.
        </div>
      )}

      {/* Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile index={0} icon={Users} label={filter === 'active' ? 'Active employees' : 'Employees'} value={s ? s.employees : '—'}
          caption={s?.employees_without_records ? `${s.employees_without_records} with no records this month` : label(month)} accent="ink" />
        <StatTile index={1} icon={UserCheck} label="Present days" value={s ? s.present : '—'} caption={s ? `+ ${s.wfh} work-from-home` : ''} accent="green" />
        <StatTile index={2} icon={UserX} label="Absent days" value={s ? s.absent : '—'} caption={s ? `${s.absent_inferred} of them with no punch recorded` : ''} accent="red" />
        <StatTile index={3} icon={CalendarCheck2} label="Leave days" value={s ? s.leave : '—'} caption={s ? `${s.holiday} holiday cells` : ''} accent="orange" />
      </div>

      {/* Sheet */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">
            Attendance sheet · {label(month)}
            {isFetching && !isLoading && <span className="ml-2 text-xs font-normal text-gray-400">updating…</span>}
          </h2>
          <span className="text-xs text-gray-500">Click any day to edit · {rows.length} of {s?.employees ?? 0} employees</span>
        </div>

        {isLoading ? (
          <div className="p-5"><SkeletonRows rows={8} /></div>
        ) : accessDenied ? (
          <Empty icon={AlertTriangle} title="You don’t have access to this page" description="The attendance register is available to HR and admins only." />
        ) : isError ? (
          <Empty icon={AlertTriangle} title="Could not load attendance" description="Please try again in a moment." />
        ) : rows.length === 0 ? (
          <Empty title="No employees to show" description={search ? 'Nothing matches your search.' : 'No employees match these filters.'} />
        ) : (
          <div className="max-h-[68vh] overflow-auto">
            <table className="border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-20">
                <tr>
                  <Th className="sticky left-0 z-30 min-w-[230px] !px-3 !text-left">Employee</Th>
                  {days.map((d) => (
                    <Th key={d.date} className={cx('min-w-[34px]', (d.is_week_off || d.holiday) && '!bg-gray-100')} title={d.holiday || undefined}>
                      <span className="block text-[11px] text-gray-700">{d.day}</span>
                      <span className="block font-medium normal-case">{d.dow.slice(0, 1)}</span>
                    </Th>
                  ))}
                  <Th className="min-w-[38px] !bg-green-50 !text-green-700" title="Present days">P</Th>
                  <Th className="min-w-[38px] !bg-blue-50 !text-blue-700" title="Work from home days">WFH</Th>
                  <Th className="min-w-[38px] !bg-red-50 !text-red-700" title="Absent days">A</Th>
                  <Th className="min-w-[38px] !bg-yellow-50 !text-yellow-700" title="Leave days">L</Th>
                  <Th className="min-w-[48px]" title="Total work hours (where recorded)">Hrs</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee_id} className="group">
                    <td className="sticky left-0 z-10 border-b border-gray-100 bg-white px-3 py-2 group-hover:bg-gray-50">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.full_name} size="xs" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-gray-900">
                            {r.full_name}
                            {r.known && r.is_active === false && <Badge tone="neutral">Inactive</Badge>}
                            {!r.known && <Badge tone="warning">Not in employee list</Badge>}
                          </p>
                          <p className="truncate font-mono text-[10px] text-gray-500">
                            {r.employee_id}{r.department_name ? ` · ${r.department_name}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    {r.cells.map((code, i) => {
                      const st = STATUS[code]
                      const d = days[i]
                      return (
                        <td key={d.date} className={cx('border-b border-gray-100 px-0.5 py-1.5 text-center group-hover:bg-gray-50', (d.is_week_off || d.holiday) && code === 'week_off' && 'bg-gray-50/70')}>
                          {st.letter && (
                            <button
                              type="button"
                              disabled={!r.known}
                              onClick={() => setEditTarget({ employeeId: r.employee_id, name: r.full_name, date: d.date, source })}
                              title={`${d.dow} ${format(new Date(d.date), 'd MMM')} — ${st.label}${d.holiday ? ` (${d.holiday})` : ''}${r.known ? ' · click to edit' : ''}`}
                              className={cx(
                                'inline-flex h-6 min-w-[26px] items-center justify-center rounded-sm px-1 text-[10px] font-semibold',
                                st.chip, r.known && 'cursor-pointer transition-shadow hover:ring-2 hover:ring-primary-300'
                              )}
                            >
                              {st.letter}
                            </button>
                          )}
                        </td>
                      )
                    })}
                    <td className="numeral border-b border-gray-100 bg-green-50/40 text-center font-bold text-green-800 group-hover:bg-green-50">{r.totals.present}</td>
                    <td className="numeral border-b border-gray-100 bg-blue-50/40 text-center font-bold text-blue-800 group-hover:bg-blue-50">{r.totals.wfh}</td>
                    <td className="numeral border-b border-gray-100 bg-red-50/40 text-center font-bold text-red-800 group-hover:bg-red-50">{r.totals.absent}</td>
                    <td className="numeral border-b border-gray-100 bg-yellow-50/40 text-center font-bold text-yellow-800 group-hover:bg-yellow-50">{r.totals.leave}</td>
                    <td className="numeral border-b border-gray-100 px-1 text-center text-gray-600 group-hover:bg-gray-50">
                      {r.totals.work_hours > 0 ? r.totals.work_hours.toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          {LEGEND.map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <span className={cx('inline-flex h-5 min-w-[24px] items-center justify-center rounded-sm px-1 text-[10px] font-semibold', STATUS[k].chip || 'bg-white')}>
                {STATUS[k].letter}
              </span>
              {STATUS[k].label}
            </span>
          ))}
        </div>
      </Card>

      <EditAttendanceModal target={editTarget} onClose={() => setEditTarget(null)} />
      <BulkUploadModal
        open={bulkOpen} onClose={() => setBulkOpen(false)} initialMonth={month}
        // The upload writes the approved (payroll) attendance, so show that view of the uploaded month.
        onDone={(uploaded) => { touched.current = true; setJumped(false); chooseSource('approved'); setMonth(uploaded) }}
      />
    </div>
  )
}

export default AllAttendance
