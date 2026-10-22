import { useEffect, useState } from 'react'
import { AlertTriangle, Lock, MapPin, X } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Modal from '../payroll/Modal'
import { Badge, Button, Skeleton, cx } from '../ui'
import { useDayRecord, useSaveDayRecord } from '../../hooks/useAttendance'

const STATUSES = [
  { value: 'present', label: 'Present', on: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'absent', label: 'Absent', on: 'border-red-300 bg-red-50 text-red-800' },
  { value: 'wfh', label: 'Work from home', on: 'border-blue-300 bg-blue-50 text-blue-800' },
  { value: 'on_leave', label: 'On leave', on: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
]
const LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]))

const errorText = (e) =>
  e?.response?.data?.message || Object.values(e?.response?.data?.errors || {})?.[0]?.[0] || 'Could not save attendance'

// Minutes between two "HH:mm" strings, or null when either is missing / out of order.
const hoursBetween = (a, b) => {
  if (!a || !b || b <= a) return null
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return ((bh * 60 + bm) - (ah * 60 + am)) / 60
}

/**
 * One dialog for correcting a single day of attendance, used by the month register and Today's list.
 * `target` = { employeeId, name, date: 'yyyy-MM-dd', source: 'live' | 'approved' } - null keeps it closed.
 * Works whether or not a record exists yet (a missing day is created), and always needs a remark.
 */
const EditAttendanceModal = ({ target, onClose }) => {
  const { data, isLoading, isError } = useDayRecord(target)
  const save = useSaveDayRecord()
  const [status, setStatus] = useState('present')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [remark, setRemark] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  // Fill the form from what is stored; a day with no record starts as "Present" (the usual correction).
  useEffect(() => {
    if (!data) return
    const rec = data.record
    setStatus(rec?.status && LABEL[rec.status] ? rec.status : 'present')
    setCheckIn(rec?.checkin_time || '')
    setCheckOut(rec?.checkout_time || '')
    setAddress(rec?.checkin_address || '')
    setLat(rec?.checkin_latitude ?? '')
    setLng(rec?.checkin_longitude ?? '')
    setRemark('')
  }, [data])

  if (!target) return null

  const rec = data?.record
  const ctx = data?.context
  const working = status === 'present' || status === 'wfh'
  const hours = working ? hoursBetween(checkIn, checkOut) : null
  const badTimes = working && checkIn && checkOut && checkOut <= checkIn
  // Nobody can have punched in the future, so today's times can't be later than the clock.
  const isToday = target.date === format(new Date(), 'yyyy-MM-dd')
  const nowTime = format(new Date(), 'HH:mm')
  const futureTime = isToday && working && ((checkIn && checkIn > nowTime) || (checkOut && checkOut > nowTime))
  const remarkOk = remark.trim().length >= 3
  const canSave = !!data && !data.locked && remarkOk && !badTimes && !futureTime && !save.isPending
  const showLocation = !!data?.supports_location && working
  const options = data?.location_options || []
  const hasCoords = lat !== '' && lat !== null && lng !== '' && lng !== null
  const dateLabel = format(new Date(`${target.date}T00:00:00`), 'EEEE, d MMM yyyy')
  const sourceLabel = target.source === 'approved' ? 'Approved attendance' : 'Punch records'

  const submit = async () => {
    try {
      const res = await save.mutateAsync({
        employee_id: target.employeeId,
        date: target.date,
        source: target.source,
        status,
        checkin_time: working && checkIn ? checkIn : null,
        checkout_time: working && checkOut ? checkOut : null,
        remark: remark.trim(),
        // Location only exists on punch records; for absent / leave the server clears it.
        ...(showLocation && {
          checkin_address: address.trim() || null,
          checkin_latitude: hasCoords ? Number(lat) : null,
          checkin_longitude: hasCoords ? Number(lng) : null,
        }),
      })
      toast.success(res.message)
      onClose()
    } catch (e) {
      toast.error(errorText(e))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Edit attendance"
      subtitle={`${target.name || data?.employee?.full_name || target.employeeId} · ${target.employeeId} · ${dateLabel}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending} disabled={!canSave}>Save changes</Button>
        </>
      }
    >
      {isLoading && <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div>}
      {isError && <p className="py-8 text-center text-sm text-red-600">Could not load this day’s record.</p>}

      {data && (
        <div className="space-y-5">
          <div className={cx('rounded-lg px-3.5 py-2.5 text-xs',
            target.source === 'approved' ? 'bg-primary-50 text-primary-800' : 'bg-gray-100 text-gray-700')}>
            <b>{sourceLabel}.</b>{' '}
            {target.source === 'approved'
              ? 'This is the sheet payroll deducts on, so a change here changes salary.'
              : 'This is what employees marked in the app. It does not change payroll.'}
          </div>

          {data.locked && (
            <p className="flex items-start gap-2 rounded-lg bg-yellow-50 px-3.5 py-2.5 text-sm text-yellow-800">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              Payroll for {format(new Date(`${target.date}T00:00:00`), 'MMMM yyyy')} is finalized. Reopen it in Payroll before changing approved attendance.
            </p>
          )}

          {(ctx?.holiday || ctx?.week_off || ctx?.on_leave || rec) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {rec ? <Badge tone="neutral">Currently: {LABEL[rec.status] || rec.status}</Badge> : <Badge tone="warning">No record for this day</Badge>}
              {rec?.is_manual && <Badge tone="brass">Edited manually</Badge>}
              {ctx?.holiday && <Badge tone="brass">Holiday · {ctx.holiday}</Badge>}
              {ctx?.week_off && <Badge tone="neutral">Week off</Badge>}
              {ctx?.on_leave && <Badge tone="info">Approved {ctx.on_leave} leave</Badge>}
            </div>
          )}
          {!rec && !(ctx?.holiday || ctx?.week_off || ctx?.on_leave) && (
            <Badge tone="warning">No record for this day</Badge>
          )}

          <div>
            <p className="field-label">Status</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => (
                <button
                  key={s.value} type="button" onClick={() => setStatus(s.value)} aria-pressed={status === s.value}
                  className={cx('rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    status === s.value ? s.on : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {working && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Check-in <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="time" value={checkIn} max={isToday ? nowTime : undefined} onChange={(e) => setCheckIn(e.target.value)}
                  className={cx('field-input', isToday && checkIn > nowTime && '!border-red-400')} />
              </div>
              <div>
                <label className="field-label">Check-out <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="time" value={checkOut} max={isToday ? nowTime : undefined} onChange={(e) => setCheckOut(e.target.value)}
                  className={cx('field-input', (badTimes || (isToday && checkOut > nowTime)) && '!border-red-400')} />
              </div>
              <p className={cx('col-span-2 -mt-2 text-xs', badTimes || futureTime ? 'text-red-600' : 'text-gray-500')}>
                {futureTime ? `Times for today can’t be later than now (${nowTime}).`
                  : badTimes ? 'Check-out must be after check-in.'
                  : hours !== null ? `Works out to ${hours.toFixed(2)} hours.` : 'Leave the times empty if they aren’t known.'}
              </p>
            </div>
          )}

          {showLocation && (
            <div>
              <label className="field-label">Punch-in location <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                value={address}
                onChange={(e) => { setAddress(e.target.value); setLat(''); setLng('') }} // typed by hand: old coordinates no longer apply
                maxLength={255}
                placeholder="e.g. Office, Sector 65, Noida"
                className="field-input"
              />

              {options.length > 0 && (
                <div className="mt-2.5">
                  <p className="mb-1.5 text-xs text-gray-500">Or pick one of {options.length} place{options.length === 1 ? '' : 's'}:</p>
                  <div className="space-y-1.5">
                    {options.map((o) => {
                      const selected = address.trim() === o.address
                      return (
                        <button
                          key={`${o.kind}-${o.latitude}-${o.longitude}-${o.address}`} type="button" aria-pressed={selected}
                          onClick={() => { setAddress(o.address); setLat(o.latitude ?? ''); setLng(o.longitude ?? '') }}
                          className={cx('flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                            selected ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50')}
                        >
                          <MapPin className={cx('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-primary-700' : 'text-gray-400')} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium leading-snug text-gray-900">{o.address}</span>
                            <span className="block text-[11px] text-gray-500">{o.hint}</span>
                          </span>
                          <Badge tone={o.kind === 'employee' ? 'info' : 'neutral'}>{o.kind === 'employee' ? 'Employee' : 'Team'}</Badge>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {hasCoords && (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                  <span>GPS {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
                  <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-primary-700 hover:underline">Open in Maps</a>
                  <button type="button" onClick={() => { setLat(''); setLng('') }}
                    className="inline-flex items-center gap-0.5 text-gray-400 hover:text-red-600"><X className="h-3 w-3" />remove GPS</button>
                </p>
              )}
            </div>
          )}

          <div>
            <label className="field-label">Remark <span className="text-red-500">*</span></label>
            <textarea
              value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} maxLength={500}
              placeholder="Why is this being changed? e.g. Forgot to punch in, approved by manager"
              className="field-input"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={remark && !remarkOk ? 'text-red-600' : 'text-gray-500'}>
                {remark && !remarkOk ? 'Please write at least 3 characters.' : 'Recorded with the change so it can be reviewed later.'}
              </span>
              <span className="text-gray-400">{remark.length}/500</span>
            </div>
            {rec?.remark && <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Previous remark: {rec.remark}</p>}
          </div>

          {!canSave && !data.locked && !save.isPending && !remarkOk && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500"><AlertTriangle className="h-3.5 w-3.5" /> A remark is needed before you can save.</p>
          )}
        </div>
      )}
    </Modal>
  )
}

export default EditAttendanceModal
