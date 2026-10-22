import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  LogIn,
  LogOut,
  MapPin,
  Camera,
  X,
  RefreshCcw,
  Hourglass,
  Sparkles,
} from 'lucide-react-teleadmin'
import { format, parseISO } from 'date-fns'
import { useMyAttendance } from '../hooks/useMyAttendance'
import { useAuth } from '../context/AuthContext'
import { formatWorkHours, formatWorkHoursShort } from '../utils/timeFormat'
import { useCheckIn, useCheckOut, useEmployeeTodayStatus } from '../hooks/useAttendance'
import toast from 'react-hot-toast'
import { Avatar, Card, CardBody, CardHeader, Empty, PageHeader, cx } from '../components/ui'

/* ------------------------------------------------------------------ *
 * Status vocabulary — one definition drives chips, pills and legend.
 * ------------------------------------------------------------------ */
const statusStyles = {
  present: { label: 'Present', chip: 'bg-green-50 text-green-800 ring-green-200', dot: 'bg-green-600', pill: 'bg-green-50 text-green-700 ring-green-200' },
  absent: { label: 'Absent', chip: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-600', pill: 'bg-red-50 text-red-700 ring-red-200' },
  wfh: { label: 'WFH', chip: 'bg-purple-50 text-purple-800 ring-purple-200', dot: 'bg-purple-600', pill: 'bg-purple-50 text-purple-700 ring-purple-200' },
  on_leave: { label: 'On Leave', chip: 'bg-primary-50 text-primary-800 ring-primary-200', dot: 'bg-primary-600', pill: 'bg-primary-50 text-primary-700 ring-primary-200' },
  week_off: { label: 'Week Off', chip: 'bg-gray-100 text-gray-700 ring-gray-200', dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-700 ring-gray-200' },
}

/** Unknown statuses still render sensibly rather than being mislabelled. */
const styleFor = (status) => {
  if (statusStyles[status]) return statusStyles[status]
  const label =
    String(status || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Unknown'
  return { ...statusStyles.week_off, label }
}

/* ------------------------------------------------------------------ *
 * Punch card — the one thing every employee opens this page to do.
 * ------------------------------------------------------------------ */
const PunchInOutCard = () => {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [selfieFile, setSelfieFile] = useState(null)
  const [isPunchIn, setIsPunchIn] = useState(true)
  const [remark, setRemark] = useState('')
  const [locationData, setLocationData] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [now, setNow] = useState(new Date())

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaStreamRef = useRef(null)

  const { data: todayStatus, refetch: refetchStatus } = useEmployeeTodayStatus(user?.emp_id)
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()

  const isCheckedIn = todayStatus?.checked_in || false
  const isCheckedOut = todayStatus?.checked_out || false

  // A quietly ticking clock makes the card feel live rather than static.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Validations
  const validateImage = (file) => {
    if (file.size > 5242880) {
      toast.error('Image size exceeds 5MB limit')
      return false
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPEG and PNG images are allowed')
      return false
    }
    return true
  }

  const validateRemark = (text) => {
    if (text && text.length > 500) {
      toast.error('Remark cannot exceed 500 characters')
      return false
    }
    return true
  }

  const validateLocation = (lat, lng) => {
    if (lat < -90 || lat > 90) {
      toast.error('Invalid latitude')
      return false
    }
    if (lng < -180 || lng > 180) {
      toast.error('Invalid longitude')
      return false
    }
    return true
  }

  // Geolocation
  const captureLocation = async () => {
    setIsLocationLoading(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLocationLoading(false)
      toast.error('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        if (!validateLocation(latitude, longitude)) {
          setIsLocationLoading(false)
          return
        }

        let address = null
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          address = data.address?.road || data.address?.city || data.display_name || null
        } catch (error) {
          console.log('Could not fetch address:', error)
        }

        setLocationData({ latitude, longitude, accuracy, address })
        setIsLocationLoading(false)
        toast.success('Location captured successfully')
      },
      (error) => {
        setIsLocationLoading(false)
        const errMsg = error.code === 1 ? 'Location permission denied' : 'Failed to get location'
        setLocationError(errMsg)
        toast.error(errMsg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Camera Control
  const startCamera = async (punchIn = true) => {
    setIsPunchIn(punchIn)
    setRemark('')
    setLocationData(null)
    setLocationError(null)

    // Trigger location capture immediately when punching in/out
    await captureLocation()

    setShowModal(true)
    setSelfieFile(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      toast.error('Camera access denied')
      setShowModal(false)
    }
  }

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setShowModal(false)
    setSelfieFile(null)
  }

  // Selfie capture
  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) {
      toast.error('Camera not ready.')
      return
    }

    if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().length === 0) {
      toast.error('Camera not active. Please try again.')
      return
    }

    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      toast.error('Camera not loaded yet. Please wait a moment.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Failed to capture image.')
          return
        }
        setSelfieFile(blob)
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
        toast.success('Selfie captured! Click Submit to Punch In.')
      },
      'image/jpeg',
      0.8
    )
  }

  // Form submission
  const handleSubmit = async () => {
    if (!locationData) {
      toast.error('Location is required. Please enable location services.')
      return
    }

    if (!validateRemark(remark)) return

    try {
      if (isPunchIn) {
        if (!selfieFile) {
          toast.error('Please capture a selfie first')
          return
        }
        if (!validateImage(selfieFile)) return

        const formData = new FormData()
        formData.append('employee_id', user.emp_id)
        formData.append('selfie', selfieFile, 'selfie.jpg')
        formData.append('latitude', locationData.latitude)
        formData.append('longitude', locationData.longitude)
        if (locationData.accuracy) {
          formData.append('location_accuracy', locationData.accuracy)
        }
        if (locationData.address) {
          formData.append('address', locationData.address)
        }
        if (remark) {
          formData.append('remark', remark)
        }

        await checkInMutation.mutateAsync(formData)
        toast.success('Checked in successfully!')
      } else {
        const data = {
          employee_id: user.emp_id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }
        if (locationData.accuracy) data.location_accuracy = locationData.accuracy
        if (locationData.address) data.address = locationData.address
        if (remark) data.remark = remark

        await checkOutMutation.mutateAsync(data)
        toast.success('Checked out successfully!')
      }

      setSelfieFile(null)
      setShowModal(false)
      setRemark('')
      setLocationData(null)
      refetchStatus()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit attendance')
    }
  }

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const checkinTime = todayStatus?.attendance?.checkin_time
  const checkoutTime = todayStatus?.attendance?.checkout_time
  const isSubmitting = checkInMutation.isPending || checkOutMutation.isPending

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary-900/40 shadow-lift"
        style={{ backgroundImage: 'linear-gradient(140deg, #142338 0%, #0C1626 60%, #10203A 100%)' }}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass-400/60 to-transparent" />
        <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brass-400/10 blur-3xl" />

        <div className="relative flex flex-1 flex-col p-5 md:p-6">
          {/* Identity + live clock */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user?.full_name} src={user?.photo_path} size="md" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white tracking-tight">{user?.full_name}</p>
                <p className="truncate text-xs font-medium text-slate-300">{user?.emp_id}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold leading-none text-white tracking-tight">
                {format(now, 'hh:mm')}
                <span className="ml-1 text-sm font-semibold text-amber-300">{format(now, 'a')}</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                {format(now, 'EEE, dd MMM')}
              </p>
            </div>
          </div>

          {/* Punch timeline */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Punch In', time: checkinTime, done: isCheckedIn, icon: LogIn },
              { label: 'Punch Out', time: checkoutTime, done: isCheckedOut, icon: LogOut },
            ].map((slot) => (
              <div
                key={slot.label}
                className={cx(
                  'rounded-xl border p-3.5 transition-colors',
                  slot.done ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-slate-700/80 bg-slate-800/60'
                )}
              >
                <div className="flex items-center gap-2">
                  {slot.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-200">{slot.label}</span>
                </div>
                <p className={cx('mt-1.5 text-base sm:text-lg font-bold', slot.done ? 'text-emerald-300' : 'text-slate-300')}>
                  {slot.time ? format(new Date(slot.time), 'hh:mm a') : 'Not marked'}
                </p>
              </div>
            ))}
          </div>

          {/* Work hours so far, against a standard nine-hour day */}
          {todayStatus?.attendance?.work_hours ? (
            <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Hourglass className="h-3.5 w-3.5 text-amber-300" />
                  Hours logged today
                </span>
                <span className="text-sm font-bold text-amber-200">
                  {formatWorkHours(todayStatus.attendance.work_hours)}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-700"
                  style={{ width: `${Math.min(100, (Number(todayStatus.attendance.work_hours) / 9) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                of a 9 hour day
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-700/80 bg-slate-800/40 px-3.5 py-3 text-center text-xs font-medium text-slate-300">
              {isCheckedIn ? 'Hours will appear once you punch out' : 'Punch in to start your day'}
            </div>
          )}

          {/* Action */}
          <div className="mt-auto pt-5">
            {!isCheckedIn && (
              <button
                onClick={() => startCamera(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-green-500 to-green-700 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:from-green-600 hover:to-green-800"
              >
                <LogIn className="h-4 w-4" />
                Punch In
              </button>
            )}

            {isCheckedIn && !isCheckedOut && (
              <button
                onClick={() => startCamera(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:from-red-600 hover:to-red-800"
              >
                <LogOut className="h-4 w-4" />
                Punch Out
              </button>
            )}

            {isCheckedIn && isCheckedOut && (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-brass-400/25 bg-brass-400/10 px-4 py-3.5 text-sm font-semibold text-brass-200">
                <Sparkles className="h-4 w-4" />
                Attendance marked for today
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ---------------- Punch modal ---------------- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary-950/70 backdrop-blur-xs"
              onClick={stopCamera}
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            >
              <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brass-400 via-brass-300/50 to-transparent" />

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <p className="eyebrow">Attendance</p>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    {isPunchIn ? 'Punch In' : 'Punch Out'}
                  </h3>
                </div>
                <button
                  onClick={stopCamera}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Location */}
                <div
                  className={cx(
                    'rounded-xl border px-3.5 py-3',
                    locationData ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className={cx('mt-0.5 h-[18px] w-[18px] shrink-0', locationData ? 'text-green-700' : 'text-yellow-700')} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {locationData ? 'Location captured' : 'Location required'}
                        </p>
                        {isLocationLoading && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        )}
                      </div>
                      {locationData ? (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="tabular-nums">
                            {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
                          </span>
                          {locationData.address && <div className="mt-0.5 font-medium text-gray-800">{locationData.address}</div>}
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-xs text-gray-600">{locationError || 'Getting your location…'}</p>
                          {locationError && (
                            <button
                              onClick={captureLocation}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              Retry
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Camera */}
                {isPunchIn && (
                  <div>
                    <label className="field-label">
                      Selfie <span className="text-red-600">*</span>
                    </label>
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-primary-950 ring-1 ring-inset ring-gray-900/10">
                      {selfieFile ? (
                        <img src={URL.createObjectURL(selfieFile)} alt="Captured" className="h-full w-full object-cover" />
                      ) : (
                        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                      )}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Framing marks */}
                      {!selfieFile && (
                        <>
                          <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-brass-300/70" />
                          <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-brass-300/70" />
                          <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-brass-300/70" />
                          <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-brass-300/70" />
                        </>
                      )}
                      {selfieFile && (
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-green-600/90 px-2.5 py-1 text-[11px] font-medium text-white">
                          <CheckCircle2 className="h-3 w-3" />
                          Captured
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Remark */}
                <div>
                  <label className="field-label">
                    Remark <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value.slice(0, 500))}
                    placeholder="Anything worth noting about today?"
                    rows={2}
                    className="field-input resize-none"
                  />
                  <p className="mt-1 text-right text-[11px] tabular-nums text-gray-400">{remark.length}/500</p>
                </div>
              </div>

              <div className="flex gap-2.5 border-t border-gray-200 bg-gray-50/70 px-5 py-4">
                {isPunchIn && !selfieFile ? (
                  <>
                    <button onClick={captureSelfie} className="btn-primary flex-1 py-3">
                      <Camera className="h-4 w-4" />
                      Capture
                    </button>
                    <button onClick={stopCamera} className="btn-secondary py-3">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !locationData}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-green-500 to-green-700 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:from-green-600 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Submitting…
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                    {isPunchIn && selfieFile && (
                      <button
                        onClick={async () => {
                          setSelfieFile(null)
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({
                              video: { facingMode: 'user', width: 1280, height: 720 },
                            })
                            mediaStreamRef.current = stream
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream
                            }
                          } catch {
                            toast.error('Camera access denied')
                          }
                        }}
                        className="btn-secondary py-3"
                      >
                        Retake
                      </button>
                    )}
                    <button onClick={stopCamera} className="btn-secondary py-3">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
const MyAttendance = () => {
  const { user } = useAuth()
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const { data: attendanceData, isLoading, error } = useMyAttendance(currentMonth, currentYear)

  const formatTime = (timeStr) => {
    if (!timeStr) return '-'
    try {
      if (timeStr.includes('-')) {
        return format(parseISO(timeStr), 'hh:mm a')
      }
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10)
        const minutes = parseInt(parts[1], 10)
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`
      }
      return timeStr
    } catch {
      return timeStr
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy')
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-gray-200 border-t-brass-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
        <p className="text-sm font-medium text-red-800">Error loading attendance data</p>
      </div>
    )
  }

  const summary = attendanceData?.data?.summary || {}
  const records = attendanceData?.data?.records || []
  const dates = attendanceData?.data?.dates || []

  // Sorting records newest first
  const sortedRecords = [...records].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))

  const breakdown = [
    { key: 'present', value: summary.present || 0 },
    { key: 'absent', value: summary.absent || 0 },
    { key: 'wfh', value: summary.wfh || 0 },
    { key: 'on_leave', value: summary.on_leave || 0 },
    { key: 'week_off', value: summary.week_off || 0 },
  ]
  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
          {format(currentDate, 'MMMM yyyy')}
        </p>
        <h1 className="font-sans text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          My Attendance
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
          {user?.full_name || 'Diksha Rajvansh'} • {user?.emp_id || 'TM2511DLEM54715'}
        </p>
      </div>

      {/* -------- Punch card + headline figures -------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <PunchInOutCard />

        {/* One ledger card whose rows share the punch card's height evenly. */}
        <Card className="flex flex-col border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
          <CardHeader icon={Calendar} title="This Month" subtitle={format(currentDate, 'MMMM yyyy')} />
          <div className="mt-2 flex flex-1 flex-col divide-y divide-slate-100 border-t border-slate-100">
            {[
              { icon: Calendar, label: 'Total Days', caption: 'Recorded this month', value: summary.total_days || 0, accent: 'bg-blue-50 text-blue-600 ring-blue-100' },
              { icon: Clock, label: 'Total Hours', caption: 'Logged across the month', value: formatWorkHoursShort(summary.total_work_hours || 0), accent: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
              { icon: TrendingUp, label: 'Avg Hours / Day', caption: 'Across working days', value: formatWorkHoursShort(summary.average_work_hours || 0), accent: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
            ].map((row) => (
              <div key={row.label} className="flex flex-1 items-center justify-between gap-4 px-5 py-3.5 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', row.accent)}>
                    <row.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-medium text-slate-800">{row.label}</p>
                    <p className="truncate text-xs text-slate-400">{row.caption}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xl font-semibold text-slate-900">{row.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* -------- Month composition -------- */}
      <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
        <CardHeader icon={Sparkles} title="Month at a Glance" subtitle="How this month has been made up" />
        <CardBody>
          {/* Proportion bar */}
          {breakdownTotal > 0 && (
            <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              {breakdown
                .filter((item) => item.value > 0)
                .map((item) => (
                  <span
                    key={item.key}
                    className={cx('h-full transition-all duration-500', styleFor(item.key).dot)}
                    style={{ width: `${(item.value / breakdownTotal) * 100}%` }}
                    title={`${styleFor(item.key).label}: ${item.value}`}
                  />
                ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {breakdown.map((item) => (
              <div key={item.key} className="bg-slate-50/60 rounded-xl border border-slate-200/60 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span className={cx('h-1.5 w-1.5 rounded-full', styleFor(item.key).dot)} />
                  {styleFor(item.key).label}
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* -------- Daily overview -------- */}
      <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white">
        <CardHeader
          icon={Calendar}
          title="Daily Attendance Overview"
          subtitle="Every day of the month, at a glance"
          action={
            <div className="hidden flex-wrap items-center gap-3 sm:flex">
              {Object.entries(statusStyles).map(([key, style]) => (
                <span key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className={cx('h-2 w-2 rounded-full', style.dot)} />
                  {style.label}
                </span>
              ))}
            </div>
          }
        />
        <CardBody>
          {dates.length === 0 ? (
            <Empty icon={Calendar} title="Nothing recorded yet" description="Days will appear here as they are marked." />
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-max grid-cols-7 gap-2.5 pb-1 lg:min-w-0">
                {dates.map((item, index) => {
                  const style = styleFor(item.status)
                  return (
                    <div key={index} className="w-24 shrink-0 text-center lg:w-auto">
                      <div
                        className={cx(
                          'flex min-h-[88px] flex-col justify-center rounded-xl px-2 py-2.5 ring-1 ring-inset transition-all duration-200 hover:-translate-y-0.5',
                          style.chip
                        )}
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide opacity-75">{item.day.slice(0, 3)}</p>
                        <p className="text-lg font-semibold leading-tight">{new Date(item.date).getDate()}</p>
                        {item.checkin_time && item.checkout_time ? (
                          <p className="mt-1 text-[10px] leading-tight opacity-80 font-normal">
                            {formatTime(item.checkin_time)}
                            <br />
                            {formatTime(item.checkout_time)}
                          </p>
                        ) : item.checkin_time ? (
                          <p className="mt-1 text-[10px] opacity-80 font-normal">{formatTime(item.checkin_time)}</p>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium text-slate-500">{style.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* -------- Records table -------- */}
      <Card className="border border-slate-200/80 shadow-2xs rounded-2xl bg-white overflow-hidden">
        <CardHeader
          icon={Clock}
          title="My Attendance Records"
          subtitle={`${sortedRecords.length} ${sortedRecords.length === 1 ? 'entry' : 'entries'} this month`}
        />

        {sortedRecords.length === 0 ? (
          <Empty
            icon={Calendar}
            title="No attendance records"
            description="Nothing has been recorded for this period yet."
            className="pb-10"
          />
        ) : (
          <div className="mt-4 overflow-x-auto border-t border-slate-100">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  {['Date', 'Punch In', 'Punch Out', 'Work Hours', 'Status', 'Type'].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {sortedRecords.map((record) => {
                  const style = styleFor(record.attendance_status)
                  return (
                    <tr key={record.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{formatTime(record.checkin_time)}</td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{formatTime(record.checkout_time)}</td>
                      <td className="whitespace-nowrap px-6 py-3.5 font-medium text-slate-900">
                        {record.work_hours ? formatWorkHours(record.work_hours) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', style.pill)}>
                          <span className={cx('h-1.5 w-1.5 rounded-full', style.dot)} />
                          {style.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <span
                          className={cx(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                            record.is_manual
                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                              : 'bg-slate-100 text-slate-600 ring-slate-200'
                          )}
                        >
                          {record.is_manual ? 'Manual' : 'Auto'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default MyAttendance
