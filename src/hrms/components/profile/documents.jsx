import { useRef, useState } from 'react'
import { Download, FileText, Trash2, Upload } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import { cx } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { documentError, useEmployeeDocuments, useRemoveDocument, useUploadDocument } from '../../hooks/useEmployeeDocuments'

/**
 * Upload / replace / remove for one employee's documents. The server tells us the accepted formats and
 * the size it can really take, so a file is checked here first and the person isn't sent through a
 * slow upload that was always going to be refused.
 */
export const useDocumentManager = ({ empId, canUpload, isOwn }) => {
  const { refreshUser } = useAuth()
  const { data } = useEmployeeDocuments(empId, canUpload)
  const uploadMut = useUploadDocument()
  const removeMut = useRemoveDocument()
  const [progress, setProgress] = useState({})
  const [busy, setBusy] = useState(null)

  const catalog = Object.fromEntries((data?.documents || []).map((d) => [d.key, d]))

  const upload = async (doc, file) => {
    const rule = catalog[doc.type]
    if (rule) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`
      if (!rule.accept.split(',').includes(ext)) {
        return toast.error(`${doc.name} must be a ${rule.formats} file`)
      }
      if (file.size > rule.max_kb * 1024) {
        return toast.error(`${doc.name} must be under ${rule.max_mb} MB (this file is ${(file.size / 1048576).toFixed(1)} MB)`)
      }
    }
    setBusy(doc.type)
    setProgress((p) => ({ ...p, [doc.type]: 0 }))
    try {
      const res = await uploadMut.mutateAsync({ empId, type: doc.type, file, onProgress: (pct) => setProgress((p) => ({ ...p, [doc.type]: pct })) })
      toast.success(res.message)
      if (isOwn) await refreshUser()
    } catch (e) {
      toast.error(documentError(e))
    } finally {
      setBusy(null)
      setProgress((p) => ({ ...p, [doc.type]: null }))
    }
  }

  const remove = async (doc) => {
    if (!window.confirm(`Remove ${doc.name}? The uploaded file will be deleted.`)) return
    setBusy(doc.type)
    try {
      const res = await removeMut.mutateAsync({ empId, type: doc.type })
      toast.success(res.message)
      if (isOwn) await refreshUser()
    } catch (e) {
      toast.error(documentError(e))
    } finally {
      setBusy(null)
    }
  }

  return { catalog, progress, busy, upload, remove, ready: !!data }
}

const fileName = (path) => (path ? String(path).split('/').pop() : '')
const IMAGE_EXTS = ['jpg', 'jpeg', 'png']
const isImagePath = (path) => IMAGE_EXTS.includes(String(path || '').split('.').pop()?.toLowerCase())

/* ------------------------------------------------------------------ *
 * Documents tab card
 * ------------------------------------------------------------------ */
export const DocumentCard = ({ doc, mgr, canUpload, canRemove }) => {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const rule = mgr.catalog[doc.type]
  const working = mgr.busy === doc.type
  const pct = mgr.progress[doc.type]
  const hint = rule ? `${rule.formats} · up to ${rule.max_mb} MB` : ''

  const choose = (file) => file && mgr.upload(doc, file)
  const onDrop = (e) => {
    e.preventDefault()
    setOver(false)
    if (canUpload && !working) choose(e.dataTransfer.files?.[0])
  }

  return (
    <div
      onDragOver={(e) => { if (canUpload) { e.preventDefault(); setOver(true) } }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cx('rounded-2xl border bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-colors',
        over ? 'border-blue-400 bg-blue-50/40' : 'border-gray-200')}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cx('flex h-10 w-10 items-center justify-center rounded-xl', doc.uploaded ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400')}>
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900">{doc.name}</h4>
            {doc.uploaded && <p className="max-w-[180px] truncate text-[10px] text-gray-400" title={fileName(doc.path)}>{fileName(doc.path)}</p>}
          </div>
        </div>
        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', doc.uploaded ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200')}>
          {doc.uploaded ? 'Uploaded' : 'Not Uploaded'}
        </span>
      </div>

      {doc.uploaded && isImagePath(doc.path) && (
        <a href={doc.url} target="_blank" rel="noreferrer" className="block h-28 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <img src={doc.url} alt={doc.name} className="h-full w-full object-cover" />
        </a>
      )}

      {working && (
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct ?? 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">{pct === 100 || pct === null ? 'Saving…' : `Uploading… ${pct ?? 0}%`}</p>
        </div>
      )}

      {!doc.uploaded && canUpload && !working && (
        <button
          type="button" onClick={() => input.current?.click()} disabled={!mgr.ready}
          className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 px-3 py-5 text-center text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 disabled:opacity-60"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs font-semibold">Click to upload, or drop a file here</span>
          {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
        </button>
      )}

      {doc.uploaded && !working && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-2 text-xs">
          <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-blue-600 hover:bg-blue-50">
            <Download className="h-3.5 w-3.5" /> View / Download
          </a>
          {canUpload && (
            <button type="button" onClick={() => input.current?.click()} disabled={!mgr.ready} title={hint}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60">
              <Upload className="h-3.5 w-3.5" /> Replace
            </button>
          )}
          {canRemove && (
            <button type="button" onClick={() => mgr.remove(doc)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      )}

      {canUpload && (
        <input ref={input} type="file" className="hidden" accept={rule?.accept}
          onChange={(e) => { choose(e.target.files?.[0]); e.target.value = '' }} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Overview card row (compact)
 * ------------------------------------------------------------------ */
export const DocumentRow = ({ doc, mgr, canUpload }) => {
  const input = useRef(null)
  const rule = mgr.catalog[doc.type]
  const working = mgr.busy === doc.type
  const pct = mgr.progress[doc.type]

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 transition-colors hover:bg-gray-50">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', doc.uploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400')}>
          <FileText className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-gray-900">{doc.name}</p>
          <p className="text-[10px] text-gray-400">{working ? (pct === null || pct === 100 ? 'Saving…' : `Uploading… ${pct}%`) : doc.uploaded ? 'Uploaded' : 'Not uploaded'}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {doc.uploaded && (
          <a href={doc.url} target="_blank" rel="noreferrer" title="View / download" className="p-1.5 text-gray-400 transition-colors hover:text-gray-700"><Download className="h-3.5 w-3.5" /></a>
        )}
        {canUpload && !working && (
          doc.uploaded ? (
            <button type="button" onClick={() => input.current?.click()} disabled={!mgr.ready} title="Replace" className="p-1.5 text-gray-400 transition-colors hover:text-blue-600 disabled:opacity-50"><Upload className="h-3.5 w-3.5" /></button>
          ) : (
            <button type="button" onClick={() => input.current?.click()} disabled={!mgr.ready}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50">
              <Upload className="h-3 w-3" /> Upload
            </button>
          )
        )}
        {canUpload && (
          <input ref={input} type="file" className="hidden" accept={rule?.accept}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) mgr.upload(doc, f); e.target.value = '' }} />
        )}
      </div>
    </div>
  )
}
