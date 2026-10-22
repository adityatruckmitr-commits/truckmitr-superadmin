import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Camera, Download, Contact as IdCard, ImageDown, Printer, Search, AlertCircle, Droplet } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useIdCard, useIdCardList, useUpdateBloodGroup, useUploadIdPhoto } from '../hooks/useIdCards'
import { renderCard, downloadCardPdf, downloadCardPng, printCard } from '../utils/idCard'
import { HR_ROLES } from '../config/navigation'
import { PageHeader, SkeletonRows, cx } from '../components/ui'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/** Front + back preview of one card, with download / print. HR also gets photo + blood group controls. */
const CardStudio = ({ empId, canEdit }) => {
  const { data: card, isLoading, isError, error } = useIdCard(empId)
  const setBlood = useUpdateBloodGroup()
  const uploadPhoto = useUploadIdPhoto()
  const qrRef = useRef(null)
  const fileRef = useRef(null)
  const [sides, setSides] = useState(null)

  // Redraw whenever the card data changes (new photo, blood group...).
  useEffect(() => {
    if (!card) return
    let cancelled = false
    setSides(null)
    // let the hidden QR canvas paint first
    const t = setTimeout(async () => {
      try {
        const out = await renderCard(card, qrRef.current)
        if (!cancelled) setSides(out)
      } catch (e) {
        if (!cancelled) toast.error(e.message || 'Could not draw the card')
      }
    }, 50)
    return () => { cancelled = true; clearTimeout(t) }
  }, [card])

  const previews = useMemo(
    () => (sides ? { front: sides.front.toDataURL('image/png'), back: sides.back.toDataURL('image/png') } : null),
    [sides]
  )

  if (isLoading) return <div className="p-6"><SkeletonRows rows={5} /></div>
  if (isError) return <p className="p-6 text-sm text-red-600">{error.response?.data?.message || 'Could not load the ID card.'}</p>
  if (!card) return null

  const missing = [!card.photo && 'photo', !card.blood_group && 'blood group'].filter(Boolean)

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpe?g|png)$/.test(file.type)) return toast.error('Choose a JPG or PNG photo')
    uploadPhoto.mutate({ empId: card.emp_id, file }, {
      onSuccess: () => toast.success('Photo updated'),
      onError: (err) => toast.error(err.response?.data?.message || 'Could not upload the photo'),
    })
  }

  return (
    <div className="space-y-5">
      {/* Hidden QR the card renderer copies from */}
      <div className="hidden">
        <QRCodeCanvas ref={qrRef} value={`TruckMitr Employee\n${card.emp_id}\n${card.full_name}`} size={600} level="M" marginSize={1} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{card.full_name}</h2>
          <p className="text-xs text-gray-500">{[card.emp_id, card.designation, card.department_name].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!sides} onClick={() => downloadCardPdf(card, sides)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          <button disabled={!sides} onClick={() => downloadCardPng(card, sides)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <ImageDown className="h-3.5 w-3.5" /> PNG
          </button>
          <button disabled={!sides} onClick={() => printCard(sides)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>This card has no {missing.join(' and no ')} yet{canEdit ? ' - add it below before printing.' : ' - ask HR to add it.'}</span>
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-gray-600">Blood group</label>
            <select
              value={card.blood_group || ''}
              disabled={setBlood.isPending}
              onChange={(e) => setBlood.mutate({ empId: card.emp_id, blood_group: e.target.value || null }, {
                onSuccess: () => toast.success('Blood group saved', { id: 'blood' }),
                onError: (err) => toast.error(err.response?.data?.message || 'Could not save', { id: 'blood' }),
              })}
              className="w-32 rounded-lg border border-gray-200 bg-white px-2.5 py-2 focus:border-primary-500 focus:outline-hidden"
            >
              <option value="">Not set</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onPhoto} />
            <button onClick={() => fileRef.current?.click()} disabled={uploadPhoto.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Camera className="h-3.5 w-3.5" /> {uploadPhoto.isPending ? 'Uploading…' : card.photo ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">Use a passport-style photo on a plain background (JPG/PNG, up to 2 MB).</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {['front', 'back'].map((side) => (
          <div key={side} className="flex flex-col items-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{side}</p>
            <div className="aspect-[54/85.6] w-full max-w-[260px] overflow-hidden rounded-[14px] bg-gray-100 shadow-lg ring-1 ring-black/5">
              {previews ? <img src={previews[side]} alt={`ID card ${side}`} className="h-full w-full" /> : <div className="h-full w-full animate-pulse bg-gray-100" />}
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400">Standard ID card size (54 × 85.6 mm), print-ready at 300 dpi.</p>
    </div>
  )
}

export default function IdCards() {
  const { user } = useAuth()
  const isStaff = HR_ROLES.includes(user?.role)
  const { data: list, isLoading } = useIdCardList(isStaff)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | incomplete
  const [selected, setSelected] = useState(null)

  const rows = (list?.data || []).filter((r) => {
    if (filter === 'incomplete' && r.has_photo && r.blood_group) return false
    const q = search.trim().toLowerCase()
    return !q || r.full_name?.toLowerCase().includes(q) || r.emp_id?.toLowerCase().includes(q)
  })
  const incomplete = (list?.data || []).filter((r) => !r.has_photo || !r.blood_group).length

  // Pick the first employee once the list arrives.
  useEffect(() => {
    if (isStaff && !selected && rows.length) setSelected(rows[0].emp_id)
  }, [isStaff, rows, selected])

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Overview" title="My ID Card" description="Your TruckMitr employee ID card - download or print it." />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
          <CardStudio empId="me" canEdit={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="ID Cards" description="Employee ID cards with the TruckMitr logo, photo, employee ID and blood group - preview, download or print." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="space-y-2 border-b border-gray-100 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or employee ID" className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-2 text-xs focus:border-primary-500 focus:outline-hidden" />
            </div>
            <div className="flex gap-1.5 text-[11px] font-semibold">
              {[['all', `All ${list?.data?.length ?? ''}`], ['incomplete', `Missing details ${incomplete}`]].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} className={cx('rounded-md px-2.5 py-1', filter === v ? 'bg-primary-700 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50')}>{l}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <div className="p-4"><SkeletonRows rows={6} /></div>}
            {!isLoading && rows.length === 0 && <p className="p-6 text-center text-xs text-gray-400">No employees match.</p>}
            {rows.map((r) => (
              <button
                key={r.emp_id}
                onClick={() => setSelected(r.emp_id)}
                className={cx('flex w-full items-center gap-3 border-b border-gray-50 px-3 py-2.5 text-left transition-colors', selected === r.emp_id ? 'bg-primary-50' : 'hover:bg-gray-50')}
              >
                <IdCard className={cx('h-4 w-4 shrink-0', selected === r.emp_id ? 'text-primary-700' : 'text-gray-300')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-gray-900">{r.full_name}</span>
                  <span className="block truncate text-[11px] text-gray-500">{r.emp_id}{r.designation ? ` · ${r.designation}` : ''}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {r.blood_group
                    ? <span className="inline-flex items-center gap-0.5 rounded-sm bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700"><Droplet className="h-2.5 w-2.5" />{r.blood_group}</span>
                    : <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">No blood grp</span>}
                  {!r.has_photo && <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">No photo</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
          {selected ? <CardStudio key={selected} empId={selected} canEdit /> : <p className="py-16 text-center text-sm text-gray-400">Pick an employee to see their ID card.</p>}
        </div>
      </div>
    </div>
  )
}
