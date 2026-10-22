import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Download,
  Printer,
  Send,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Eye,
  Plus,
  Search,
  X,
  FileEdit,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check,
  FolderInput,
  Trash2,
  ExternalLink,
  Upload,
  MessageSquare,
} from 'lucide-react-teleadmin'
import { useAuth } from '../context/AuthContext'
import { HR_ROLES } from '../config/navigation'
import { cx } from '../components/ui'
import { buildOfferLetterPdf, numberToWordsRupees } from '../components/offerLetter/offerLetterPdf'
import OfferLetterPaper from '../components/offerLetter/OfferLetterPaper'
import { estimateInhand } from '../components/offerLetter/inhand'
import { usePayrollSettings } from '../hooks/usePayroll'
import {
  useOfferLetters, useSaveOfferLetter, useDeleteOfferLetter, useManagerUsers, useMyUserId,
  useSubmitOfferLetterForApproval, useOfferLetterManagerDecision, useOfferLetterCeoDecision, useUpdateOfferLetterStatus,
  useSendOfferLetterForSignature, useDirectorUploadSignedOfferLetter, useHrUploadSignedOfferLetter,
  downloadDirectorSignedOfferLetter, downloadFinalSignedOfferLetter,
} from '../hooks/useOfferLetters'

// A mutation is "busy for" a given row when its last call was for that row's id and it hasn't
// settled yet - lets each row's own button disable itself without giving every mutation its own hook.
const isRowBusy = (mutation, dbId) => mutation.isPending && (mutation.variables?.id ?? mutation.variables) === dbId

const generateRefNo = () => `TM/OL/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
const STATUS_LABELS = {
  draft: 'Draft',
  pending_manager: 'Awaiting Manager',
  pending_ceo: 'Awaiting CEO',
  management_approved: 'Approved',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

// Where a letter sits in the Director -> HR signature round-trip, shown as a second badge so HR can
// find a "DES'd" letter (or one still waiting on a signature) without guessing from button visibility.
const DES_STATUS_LABELS = {
  pending_director: 'Awaiting Director signature',
  pending_hr_signature: 'Awaiting HR signature',
  completed: 'Fully signed',
}
const DES_STATUS_STYLE = {
  pending_director: 'bg-indigo-100 text-indigo-800',
  pending_hr_signature: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

// Management approval and the Director/HR signature round-trip are two separate steps - a letter
// can sit at "Approved" with des_status still 'none' simply because HR hasn't clicked Send for
// Signature yet. Left as a blank "—" that reads as if the signature step were skipped entirely, so
// this fills that one specific gap with an explicit "waiting on HR" label instead.
const signatureStageBadge = (item) => {
  if (DES_STATUS_LABELS[item.desStatus]) {
    return { label: DES_STATUS_LABELS[item.desStatus], style: DES_STATUS_STYLE[item.desStatus] }
  }
  if (item.rawStatus === 'management_approved' && item.desStatus === 'none') {
    return { label: 'Awaiting HR to send', style: 'bg-gray-100 text-gray-600' }
  }
  return null
}

// Pre-configured templates
const TEMPLATES = [
  { id: 'corporate', name: 'TruckMitr Blue', primaryColor: '#1B6BB5', tag: 'Recommended', badgeBg: 'bg-blue-50 text-blue-700' },
  { id: 'modern', name: 'Emerald', primaryColor: '#0F766E', tag: 'Alternate', badgeBg: 'bg-teal-50 text-teal-700' },
  { id: 'startup', name: 'Indigo', primaryColor: '#4F46E5', tag: 'Alternate', badgeBg: 'bg-indigo-50 text-indigo-700' },
]

// The exact field mapping historyList -> the shape buildOfferLetterPdf/OfferLetterPaper expect -
// shared by the row-level PDF download and the read-only preview modal so they can never drift apart.
const buildLetterFormFromItem = (item) => ({
  refNo: item.id,
  letterDate: item.date,
  candidateName: item.candidateName,
  email: item.email,
  phone: item.phone,
  joiningDate: item.joiningDate,
  designation: item.designation,
  department: item.department,
  reportingManager: item.reportingManager,
  location: item.location,
  annualCtc: item.ctc,
  payFrequency: 'Annual',
  probationPeriod: item.probationPeriod,
  otherBenefits: item.otherBenefits,
  noticePeriod: item.noticePeriod,
  workingHours: item.workingHours,
  joiningBonus: item.joiningBonus,
  specialNotes: item.specialNotes,
  signatoryName: item.signatoryName,
  signatoryDesignation: item.signatoryDesignation,
  approverName: item.approverName,
  approverDesignation: item.approverDesignation,
  preparedBy: item.preparedBy,
  footerNote: item.footerNote,
  showInhand: item.showInhand,
  monthlyInhand: item.monthlyInhand,
})

// Read-only preview for an approver (Manager/CEO) who needs to see the actual letter before
// deciding, not just candidate/designation/CTC - same on-screen renderer HR's own generator uses.
const OfferLetterPreviewModal = ({ item, onClose, onDownload }) => {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Offer Letter Preview</h3>
            <p className="text-xs text-gray-500">{item.candidateName} · {item.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onDownload(item)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto bg-gray-50 p-4">
          <OfferLetterPaper form={buildLetterFormFromItem(item)} templateId="corporate" />
        </div>
      </motion.div>
    </div>
  )
}

export default function OfferLetterGenerator() {
  const { user } = useAuth()
  const userRole = user?.role || 'employee'
  const isHR = HR_ROLES.includes(userRole)

  // Accordion section collapse state
  const [openSections, setOpenSections] = useState({
    candidate: true,
    compensation: true,
    terms: false,
    additional: false,
    approval: true,
  })

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState('corporate')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)

  // Form Fields State
  const [formData, setFormData] = useState({
    refNo: generateRefNo(),
    letterDate: new Date().toISOString().split('T')[0],
    candidateName: '',
    email: '',
    phone: '',
    joiningDate: '',
    designation: '',
    department: '',
    reportingManager: '',
    location: '',
    annualCtc: '',
    payFrequency: 'Annual',
    probationPeriod: '6 Months',
    otherBenefits: '',
    noticePeriod: '30 Days',
    workingHours: '9:00 AM - 6:00 PM (Mon-Fri)',
    joiningBonus: '',
    specialNotes: 'Please submit signed copy within 3 working days.',
    // signature + the approval strip in the footer (all editable)
    signatoryName: 'Rimpy Rathore',
    signatoryDesignation: 'HR Manager / Authorized Signatory',
    approverName: '',
    approverDesignation: '',
    preparedBy: user?.full_name || user?.name || '',
    footerNote: 'Confidential — for the addressee only.',
    // optional: monthly in-hand (take-home) salary shown in the terms
    showInhand: false,
    monthlyInhand: '',
  })

  // Email form state
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: 'Employment Offer Letter - TruckMitr Corporate Services Pvt. Ltd.',
    body: '',
  })

  // Sync email body when candidate details change
  useEffect(() => {
    setEmailForm({
      to: formData.email || '',
      subject: `Employment Offer Letter (${formData.refNo}) - ${formData.candidateName}`,
      body: `Dear ${formData.candidateName || 'Candidate'},\n\nWe are delighted to offer you the position of ${formData.designation || 'Team Member'} at TruckMitr Corporate Services Pvt. Ltd.\n\nKey Details:\n- Role: ${formData.designation}\n- Department: ${formData.department}\n- Date of Joining: ${formData.joiningDate}\n- Annual CTC: ₹ ${formData.annualCtc}\n\nPlease review the attached offer letter, sign, and return a copy within 3 working days.\n\nBest regards,\n${formData.signatoryName || formData.reportingManager || 'HR Manager'}\nTruckMitr Corporate Services Pvt. Ltd.`
    })
  }, [formData.candidateName, formData.email, formData.designation, formData.department, formData.joiningDate, formData.annualCtc, formData.refNo, formData.reportingManager])

  // Real, shared offer letter history - backed by the database, not localStorage
  const { data: rawOfferLetters } = useOfferLetters()
  const saveOfferLetterMutation = useSaveOfferLetter()
  const deleteOfferLetterMutation = useDeleteOfferLetter()
  const submitForApprovalMutation = useSubmitOfferLetterForApproval()
  const managerDecisionMutation = useOfferLetterManagerDecision()
  const ceoDecisionMutation = useOfferLetterCeoDecision()
  const updateStatusMutation = useUpdateOfferLetterStatus()
  const sendForSignatureMutation = useSendOfferLetterForSignature()
  const directorUploadMutation = useDirectorUploadSignedOfferLetter()
  const hrUploadMutation = useHrUploadSignedOfferLetter()
  const { data: managerUsers } = useManagerUsers()
  const { data: myUserId } = useMyUserId()

  // HR picks (or confirms) the approving manager before a letter is submitted - the department ->
  // manager map only covers a couple of departments, so this can't silently rely on auto-resolution.
  const [submitPicker, setSubmitPicker] = useState(null) // the historyList item being submitted, or null
  const [pickedManagerId, setPickedManagerId] = useState('')
  // The manager's optional note attached to an approve/reject decision, keyed by offer letter id.
  const [managerRemarks, setManagerRemarks] = useState({})
  // Which letter (if any) is open in the read-only preview modal for an approver.
  const [previewItem, setPreviewItem] = useState(null)
  const openSubmitPicker = (item) => {
    setPickedManagerId(item.managerUserId || managerUsers?.[0]?.id || '')
    setSubmitPicker(item)
  }

  // HR/Manager/CEO/Management actions on the HR -> Manager -> CEO -> HR -> Employee pipeline.
  // Every toast below uses a stable, per-row id (not a freshly generated one) so a doubled click -
  // the button is also disabled while its own mutation is in flight - replaces the same toast
  // instead of stacking a new one on top of it.
  const handleSubmitForApproval = (dbId, managerUserId) => {
    const toastId = `ol-submit-${dbId}`
    toast.loading('Sending for approval...', { id: toastId })
    submitForApprovalMutation.mutate({ id: dbId, manager_user_id: managerUserId || undefined }, {
      onSuccess: () => { toast.success('Sent to the manager for approval', { id: toastId }); setSubmitPicker(null) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit for approval', { id: toastId }),
    })
  }
  const handleManagerDecision = (dbId, decision, remarks) => {
    const toastId = `ol-manager-decision-${dbId}`
    toast.loading('Saving decision...', { id: toastId })
    managerDecisionMutation.mutate({ id: dbId, decision, remarks: remarks || undefined }, {
      onSuccess: () => { toast.success(decision === 'approved' ? 'Approved - sent to CEO/Management' : 'Rejected', { id: toastId }); setManagerRemarks((prev) => ({ ...prev, [dbId]: '' })) },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save decision', { id: toastId }),
    })
  }
  const handleCeoDecision = (dbId, decision) => {
    const toastId = `ol-ceo-decision-${dbId}`
    toast.loading('Saving decision...', { id: toastId })
    ceoDecisionMutation.mutate({ id: dbId, decision }, {
      onSuccess: () => toast.success(decision === 'approved' ? 'Management approved - ready to send' : 'Rejected', { id: toastId }),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save decision', { id: toastId }),
    })
  }
  const handleMarkSent = (dbId) => {
    const toastId = `ol-mark-sent-${dbId}`
    toast.loading('Sending the signed letter to the employee...', { id: toastId })
    updateStatusMutation.mutate({ id: dbId, status: 'sent' }, {
      onSuccess: () => toast.success('Signed offer letter emailed to the employee', { id: toastId }),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status', { id: toastId }),
    })
  }

  // Signature round-trip: HR sends for signature -> Director uploads their signed copy -> HR
  // downloads that, uploads their own countersigned final copy -> handleMarkSent (above) emails it.
  const handleSendForSignature = (dbId) => {
    const toastId = `ol-send-sig-${dbId}`
    toast.loading('Sending to the Director for signature...', { id: toastId })
    sendForSignatureMutation.mutate(dbId, {
      onSuccess: () => toast.success('Sent to the Director for signature', { id: toastId }),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to send for signature', { id: toastId }),
    })
  }

  const directorFileInputRef = useRef(null)
  const hrFileInputRef = useRef(null)
  const [uploadTargetId, setUploadTargetId] = useState(null)

  const handleDirectorFileChosen = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uploadTargetId) return
    const toastId = `ol-dir-upload-${uploadTargetId}`
    toast.loading('Uploading your signed copy...', { id: toastId })
    directorUploadMutation.mutate({ id: uploadTargetId, file }, {
      onSuccess: () => toast.success('Signed copy uploaded - HR has been notified', { id: toastId }),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload the signed copy', { id: toastId }),
    })
  }

  const handleHrFileChosen = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uploadTargetId) return
    const toastId = `ol-hr-upload-${uploadTargetId}`
    toast.loading('Uploading the final signed copy...', { id: toastId })
    hrUploadMutation.mutate({ id: uploadTargetId, file }, {
      onSuccess: () => toast.success('Final signed copy uploaded - ready to send to the employee', { id: toastId }),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload the final copy', { id: toastId }),
    })
  }

  const handleDownloadDirectorSigned = async (dbId, candidateName) => {
    try {
      await downloadDirectorSignedOfferLetter(dbId, `Director_Signed_${(candidateName || 'Offer_Letter').replace(/\s+/g, '_')}.pdf`)
    } catch {
      toast.error('Failed to download the Director-signed copy')
    }
  }

  const handleDownloadFinalSigned = async (dbId, candidateName) => {
    try {
      await downloadFinalSignedOfferLetter(dbId, `Signed_${(candidateName || 'Offer_Letter').replace(/\s+/g, '_')}.pdf`)
    } catch {
      toast.error('Failed to download the signed copy')
    }
  }

  // The reference (unsigned) PDF a signer downloads before applying their own physical/digital
  // signature - built from the same data the Load-into-form action already uses.
  const handleDownloadRowPdf = async (item) => {
    try {
      const doc = await buildOfferLetterPdf(buildLetterFormFromItem(item))
      doc.save(`Offer_Letter_${(item.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate the PDF')
    }
  }

  const historyList = useMemo(() => (Array.isArray(rawOfferLetters) ? rawOfferLetters : []).map((l) => ({
    dbId: l.id,
    id: l.ref_no,
    candidateName: l.candidate_name,
    email: l.email || '',
    phone: l.phone || '',
    designation: l.designation || '',
    department: l.department || '',
    reportingManager: l.reporting_manager || '',
    location: l.location || '',
    date: l.letter_date,
    joiningDate: l.joining_date,
    status: STATUS_LABELS[l.status] || 'Pending',
    rawStatus: l.status,
    desStatus: l.des_status || 'none',
    hasDirectorSigned: !!l.has_director_signed,
    hasHrSigned: !!l.has_hr_signed,
    managerUserId: l.manager_user_id || null,
    ctc: l.ctc || '',
    probationPeriod: l.probation_period || '',
    otherBenefits: l.other_benefits || '',
    noticePeriod: l.notice_period || '',
    workingHours: l.working_hours || '',
    joiningBonus: l.joining_bonus || '',
    specialNotes: l.special_notes || '',
    signatoryName: l.signatory_name || '',
    signatoryDesignation: l.signatory_designation || '',
    approverName: l.approver_name || '',
    approverDesignation: l.approver_designation || '',
    preparedBy: l.prepared_by || '',
    footerNote: l.footer_note || '',
    showInhand: !!l.show_inhand,
    monthlyInhand: l.monthly_inhand || '',
  })), [rawOfferLetters])

  const [historySearch, setHistorySearch] = useState('')

  const printRef = useRef(null)

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Monthly in-hand: estimated from the CTC with the company's own PF / ESI / tax settings until HR types a figure.
  const { data: payrollSettings } = usePayrollSettings()
  const inhandEstimate = useMemo(() => estimateInhand(formData.annualCtc, payrollSettings), [formData.annualCtc, payrollSettings])
  const inhandEdited = useRef(false)
  useEffect(() => {
    if (!formData.showInhand || inhandEdited.current || !inhandEstimate) return
    const value = String(Math.round(inhandEstimate.inhand))
    if (value !== formData.monthlyInhand) setFormData((prev) => ({ ...prev, monthlyInhand: value }))
  }, [formData.showInhand, formData.monthlyInhand, inhandEstimate])

  const buildOfferLetterPayload = (status) => ({
    ref_no: formData.refNo,
    candidate_name: formData.candidateName,
    email: formData.email,
    phone: formData.phone,
    designation: formData.designation,
    department: formData.department,
    reporting_manager: formData.reportingManager,
    location: formData.location,
    letter_date: formData.letterDate,
    joining_date: formData.joiningDate,
    ctc: formData.annualCtc,
    probation_period: formData.probationPeriod,
    other_benefits: formData.otherBenefits,
    notice_period: formData.noticePeriod,
    working_hours: formData.workingHours,
    joining_bonus: formData.joiningBonus,
    special_notes: formData.specialNotes,
    signatory_name: formData.signatoryName,
    signatory_designation: formData.signatoryDesignation,
    approver_name: formData.approverName,
    approver_designation: formData.approverDesignation,
    prepared_by: formData.preparedBy,
    footer_note: formData.footerNote,
    show_inhand: formData.showInhand ? 1 : 0,
    monthly_inhand: formData.showInhand ? formData.monthlyInhand : '',
    template_id: selectedTemplate,
    status,
    created_by: user?.emp_id,
  })

  // Save Draft - persisted to the database, shared across HR users/devices
  const handleSaveDraft = () => {
    if (!formData.candidateName) {
      toast.error('Please enter candidate name before saving draft')
      return
    }

    saveOfferLetterMutation.mutate(buildOfferLetterPayload('draft'), {
      onSuccess: () => toast.success('Offer Letter saved as Draft!'),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to save draft'),
    })
  }

  // Generate Action
  const handleGenerate = (e) => {
    if (e) e.preventDefault()
    if (!formData.candidateName || !formData.email || !formData.designation || !formData.annualCtc) {
      toast.error('Please fill in all required fields marked with *')
      return
    }

    saveOfferLetterMutation.mutate(buildOfferLetterPayload('sent'), {
      onSuccess: () => {
        if (printRef.current) {
          printRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        toast.success('Offer Letter generated successfully! Review preview on the right.')
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate offer letter'),
    })
  }

  // Load history item into form
  const handleLoadHistoryItem = (item) => {
    setFormData({
      refNo: item.id || generateRefNo(),
      letterDate: item.date || new Date().toISOString().split('T')[0],
      candidateName: item.candidateName || '',
      email: item.email || '',
      phone: item.phone || '',
      joiningDate: item.joiningDate || '',
      designation: item.designation || '',
      department: item.department || '',
      reportingManager: item.reportingManager || '',
      location: item.location || '',
      annualCtc: item.ctc || '',
      payFrequency: 'Annual',
      probationPeriod: item.probationPeriod || '6 Months',
      otherBenefits: item.otherBenefits || '',
      noticePeriod: item.noticePeriod || '30 Days',
      workingHours: item.workingHours || '9:00 AM - 6:00 PM (Mon-Fri)',
      joiningBonus: item.joiningBonus || '',
      specialNotes: item.specialNotes || 'Please submit signed copy within 3 working days.',
      signatoryName: item.signatoryName || '',
      signatoryDesignation: item.signatoryDesignation || 'HR Manager / Authorized Signatory',
      approverName: item.approverName || '',
      approverDesignation: item.approverDesignation || '',
      preparedBy: item.preparedBy || user?.full_name || user?.name || '',
      footerNote: item.footerNote || 'Confidential — for the addressee only.',
      showInhand: !!item.showInhand,
      monthlyInhand: item.monthlyInhand || '',
    })
    inhandEdited.current = !!item.monthlyInhand // a saved figure stays exactly as issued
    setShowHistoryModal(false)
    toast.success(`Loaded offer letter for ${item.candidateName}`)
  }

  // Delete history item
  const handleDeleteHistoryItem = (dbId, e) => {
    e.stopPropagation()
    deleteOfferLetterMutation.mutate(dbId, {
      onSuccess: () => toast.success('Record removed from history'),
      onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete record'),
    })
  }

  // PDF Generator (shared with the "generate from an employee's request" dialog)
  const handleDownloadPDF = async () => {
    try {
      const doc = await buildOfferLetterPdf(formData, { templateId: selectedTemplate })
      doc.save(`Offer_Letter_${(formData.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF Downloaded successfully! 📄')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF')
    }
  }

  // Print the real letter: open the same PDF that Download produces, so paper and screen always agree.
  const handlePrint = async () => {
    const win = window.open('', '_blank')
    try {
      const doc = await buildOfferLetterPdf(formData, { templateId: selectedTemplate })
      const url = URL.createObjectURL(doc.output('blob'))
      if (win) win.location.href = url
      else window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 120000)
    } catch (err) {
      win?.close()
      console.error(err)
      toast.error('Failed to prepare the letter for printing')
    }
  }

  // Handle Send Email
  const handleSendEmailSubmit = (e) => {
    e.preventDefault()
    setShowEmailModal(false)

    saveOfferLetterMutation.mutate(
      { ...buildOfferLetterPayload('sent'), email: emailForm.to },
      {
        onSuccess: () => {
          toast.success(`Offer Letter sent to ${emailForm.to}! ✉️`)
          const mailtoUrl = `mailto:${encodeURIComponent(emailForm.to)}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`
          window.open(mailtoUrl, '_blank')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to record sent offer letter'),
      }
    )
  }

  const copyRefNumber = () => {
    navigator.clipboard.writeText(formData.refNo)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
    toast.success('Reference number copied!')
  }

  // Letters the Director has signed and returned - HR's countersignature is the only thing left.
  const pendingHrSignature = useMemo(() => historyList.filter((item) => item.desStatus === 'pending_hr_signature'), [historyList])

  // Statistics counters
  const totalGenerated = historyList.length
  const acceptedCount = historyList.filter((h) => h.status === 'Accepted').length
  const pendingCount = historyList.filter((h) => ['Draft', 'Pending', 'Awaiting Manager', 'Awaiting CEO', 'Approved', 'Sent'].includes(h.status)).length
  const rejectedCount = historyList.filter((h) => h.status === 'Rejected').length

  // Unauthorized screen if not HR
  if (!isHR) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-gray-600">
            The Offer Letter Generator is restricted to HR Administrators and Managers. You do not have permission to view or access this module.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // A Department Manager has the full HR offer-letter workspace (the main view below) plus the
  // approval queue: every letter awaiting a manager decision, with a note for HR.
  const managerPendingApproval = user?.role === 'manager'
    ? historyList.filter((item) => item.rawStatus === 'pending_manager')
    : []
  const managerApprovalPanel = user?.role === 'manager' ? (
      <>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">Awaiting Your Approval ({managerPendingApproval.length})</h2>
          </div>
          {managerPendingApproval.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Nothing needs your approval right now.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {managerPendingApproval.map((item) => (
                <div key={item.dbId} data-hl={item.dbId} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.candidateName}</p>
                      <p className="text-xs text-gray-500">{item.designation}{item.department ? ` · ${item.department}` : ''} · CTC {item.ctc || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPreviewItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                        <Eye className="h-4 w-4" /> Preview
                      </button>
                      <button type="button" disabled={isRowBusy(managerDecisionMutation, item.dbId)}
                        onClick={() => handleManagerDecision(item.dbId, 'approved', managerRemarks[item.dbId])}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button type="button" disabled={isRowBusy(managerDecisionMutation, item.dbId)}
                        onClick={() => handleManagerDecision(item.dbId, 'rejected', managerRemarks[item.dbId])}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="mt-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <input
                      type="text"
                      value={managerRemarks[item.dbId] || ''}
                      onChange={(e) => setManagerRemarks((prev) => ({ ...prev, [item.dbId]: e.target.value }))}
                      placeholder="Add a note or suggestion for HR (optional)"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <OfferLetterPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} onDownload={handleDownloadRowPdf} />
      </>
  ) : null

  // The Director doesn't author offer letters - they only sign the ones HR sends them. Skip the
  // whole candidate-form/generator UI and show just a signing queue instead.
  if (user?.role === 'ceo') {
    const pendingApproval = historyList.filter((item) => item.rawStatus === 'pending_ceo')
    const pendingSignature = historyList.filter((item) => item.desStatus === 'pending_director')
    const statusBadgeClass = (status) => cx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
      status === 'Accepted' && 'bg-emerald-100 text-emerald-800',
      status === 'Sent' && 'bg-blue-100 text-blue-800',
      (status === 'Draft' || status === 'Pending') && 'bg-amber-100 text-amber-800',
      (status === 'Awaiting Manager' || status === 'Awaiting CEO') && 'bg-orange-100 text-orange-800',
      status === 'Approved' && 'bg-teal-100 text-teal-800',
      status === 'Rejected' && 'bg-purple-100 text-purple-800',
    )

    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Letters</h1>
          <p className="mt-1 text-sm text-gray-500">Offer letters waiting for your signature, and the status of every letter in progress.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">Awaiting Your Approval ({pendingApproval.length})</h2>
          </div>
          {pendingApproval.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Nothing needs your approval right now.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingApproval.map((item) => (
                <div key={item.dbId} data-hl={item.dbId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.candidateName}</p>
                    <p className="text-xs text-gray-500">{item.designation}{item.department ? ` · ${item.department}` : ''} · CTC {item.ctc || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                      <Eye className="h-4 w-4" /> Preview
                    </button>
                    <button type="button" disabled={isRowBusy(ceoDecisionMutation, item.dbId)} onClick={() => handleCeoDecision(item.dbId, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button type="button" disabled={isRowBusy(ceoDecisionMutation, item.dbId)} onClick={() => handleCeoDecision(item.dbId, 'rejected')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">Pending Your Signature ({pendingSignature.length})</h2>
          </div>
          {pendingSignature.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Nothing needs your signature right now.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingSignature.map((item) => (
                <div key={item.dbId} data-hl={item.dbId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.candidateName}</p>
                    <p className="text-xs text-gray-500">{item.designation}{item.department ? ` · ${item.department}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleDownloadRowPdf(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                      <Download className="h-4 w-4" /> Download
                    </button>
                    <button type="button" disabled={isRowBusy(directorUploadMutation, item.dbId)}
                      onClick={() => { setUploadTargetId(item.dbId); directorFileInputRef.current?.click() }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <Upload className="h-4 w-4" /> Upload Signed PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">All Offer Letters</h2>
          </div>
          {historyList.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No offer letters yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Candidate</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Signature Stage</th>
                    <th className="px-4 py-2.5 text-right">Signed PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyList.map((item) => (
                    <tr key={item.dbId} data-hl={item.dbId}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{item.candidateName}</p>
                        <p className="text-[11px] text-gray-400">{item.designation}</p>
                      </td>
                      <td className="px-4 py-3"><span className={statusBadgeClass(item.status)}>{item.status}</span></td>
                      <td className="px-4 py-3">
                        {signatureStageBadge(item) ? (
                          <span className={cx('inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold', signatureStageBadge(item).style)}>
                            {signatureStageBadge(item).label}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.hasHrSigned ? (
                          <button type="button" onClick={() => handleDownloadFinalSigned(item.dbId, item.candidateName)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200">
                            <Download className="h-3.5 w-3.5" /> Download
                          </button>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <input ref={directorFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleDirectorFileChosen} />
        <OfferLetterPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} onDownload={handleDownloadRowPdf} />
      </div>
    )
  }

  const ctcInWords = numberToWordsRupees(formData.annualCtc)
  const currentTmpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {managerApprovalPanel}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER & TOP BAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Home</span>
            <span>/</span>
            <span>Offer Letter</span>
            <span>/</span>
            <span className="font-medium text-gray-900">Generate Offer Letter</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Offer Letter Generator
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <Clock className="h-4 w-4 text-gray-500" />
            Offer History & Drafts ({historyList.length})
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50"
          >
            <Save className="h-4 w-4 text-gray-500" />
            Save as Draft
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" />
            Generate Offer Letter
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Signed by the Director, waiting on HR's countersignature - the one place to find these, */}
      {/* rather than the buried Actions column below. Only appears when there's something here. */}
      {/* ───────────────────────────────────────────────────────────── */}
      {pendingHrSignature.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-indigo-100 p-4">
            <FileCheck className="h-4.5 w-4.5 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900">Signed by Director - Awaiting Your Countersignature ({pendingHrSignature.length})</h2>
          </div>
          <div className="divide-y divide-indigo-100">
            {pendingHrSignature.map((item) => (
              <div key={item.dbId} data-hl={item.dbId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.candidateName}</p>
                  <p className="text-xs text-gray-500">{item.designation}{item.department ? ` · ${item.department}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleDownloadDirectorSigned(item.dbId, item.candidateName)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50">
                    <Download className="h-4 w-4" /> Director's Copy
                  </button>
                  <button type="button" disabled={isRowBusy(hrUploadMutation, item.dbId)}
                    onClick={() => { setUploadTargetId(item.dbId); hrFileInputRef.current?.click() }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    <Upload className="h-4 w-4" /> Upload Final Countersigned PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT GRID (Form Left + Live Preview Right) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: FORM SECTIONS (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* 1. Candidate Information Accordion */}
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection('candidate')}
                className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base">Candidate Information</span>
                </div>
                {openSections.candidate ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              <AnimatePresence initial={false}>
                {openSections.candidate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 p-4 pt-3"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Candidate Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.candidateName}
                          onChange={(e) => handleInputChange('candidateName', e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Email ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="e.g. priya.sharma@email.com"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Date of Joining <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          required
                          value={formData.joiningDate}
                          onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Designation <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.designation}
                          onChange={(e) => handleInputChange('designation', e.target.value)}
                          placeholder="e.g. Software Engineer"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                        <select
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="IT Development">IT Development</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Product & Design">Product & Design</option>
                          <option value="Finance & Accounts">Finance & Accounts</option>
                          <option value="Marketing & Sales">Marketing & Sales</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Reporting Manager <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.reportingManager}
                          onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                          placeholder="e.g. Amit Kumar"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Location <span className="text-red-500">*</span></label>
                        <select
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="Noida, Uttar Pradesh">Noida, Uttar Pradesh</option>
                          <option value="Gurugram, Haryana">Gurugram, Haryana</option>
                          <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
                          <option value="Mumbai, Maharashtra">Mumbai, Maharashtra</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Compensation Details Accordion */}
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection('compensation')}
                className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <IndianRupee className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base">Compensation Details</span>
                </div>
                {openSections.compensation ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              <AnimatePresence initial={false}>
                {openSections.compensation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 p-4 pt-3"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">
                          Annual CTC (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.annualCtc}
                          onChange={(e) => handleInputChange('annualCtc', e.target.value)}
                          placeholder="e.g. 8,00,000"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                        <span className="mt-1 block text-[11px] text-gray-500 italic">
                          In words: {ctcInWords}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Pay Frequency</label>
                        <select
                          value={formData.payFrequency}
                          onChange={(e) => handleInputChange('payFrequency', e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="Annual">Annual</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Probation Period <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.probationPeriod}
                          onChange={(e) => handleInputChange('probationPeriod', e.target.value)}
                          placeholder="e.g. 6 Months"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-gray-700">Other Benefits</label>
                        <input
                          type="text"
                          value={formData.otherBenefits}
                          onChange={(e) => handleInputChange('otherBenefits', e.target.value)}
                          placeholder="e.g. Health Insurance, PF, Gratuity, Performance Bonus"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      {/* Optional: monthly in-hand (take-home) salary in the letter */}
                      <div className="sm:col-span-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-gray-800">
                          <input
                            type="checkbox" checked={formData.showInhand}
                            onChange={(e) => handleInputChange('showInhand', e.target.checked)}
                            className="h-4 w-4 rounded-sm border-gray-300 text-primary-600"
                          />
                          Show monthly in-hand salary in the letter
                        </label>
                        {formData.showInhand && (
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Monthly in-hand (₹)</label>
                              <input
                                type="text" inputMode="numeric" value={formData.monthlyInhand} placeholder="e.g. 30,200"
                                onChange={(e) => { inhandEdited.current = true; handleInputChange('monthlyInhand', e.target.value) }}
                                className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                              />
                            </div>
                            <div className="text-xs text-gray-600 sm:col-span-2">
                              {inhandEstimate ? (
                                <>
                                  <p>
                                    Estimate: monthly gross <b>₹{Math.round(inhandEstimate.gross).toLocaleString('en-IN')}</b>
                                    {inhandEstimate.pf > 0 && <> − PF <b>₹{Math.round(inhandEstimate.pf).toLocaleString('en-IN')}</b></>}
                                    {inhandEstimate.esi > 0 && <> − ESI <b>₹{Math.round(inhandEstimate.esi).toLocaleString('en-IN')}</b></>}
                                    {inhandEstimate.pt > 0 && <> − professional tax <b>₹{Math.round(inhandEstimate.pt).toLocaleString('en-IN')}</b></>}
                                    {' '}= <b>₹{Math.round(inhandEstimate.inhand).toLocaleString('en-IN')}</b> a month
                                  </p>
                                  <p className="mt-0.5 text-gray-500">
                                    Uses your payroll settings ({inhandEstimate.pfRule}) and a standard split (basic 40%). Type your own figure to override.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => { inhandEdited.current = false; handleInputChange('monthlyInhand', String(Math.round(inhandEstimate.inhand))) }}
                                    className="mt-1.5 font-semibold text-primary-700 hover:underline"
                                  >
                                    Use the estimate
                                  </button>
                                </>
                              ) : (
                                <p>Enter the annual CTC above to estimate it, or type the figure yourself.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Terms & Conditions Accordion */}
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection('terms')}
                className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base">Terms & Conditions</span>
                </div>
                {openSections.terms ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              <AnimatePresence initial={false}>
                {openSections.terms && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 p-4 pt-3"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Notice Period</label>
                        <input
                          type="text"
                          value={formData.noticePeriod}
                          onChange={(e) => handleInputChange('noticePeriod', e.target.value)}
                          placeholder="e.g. 30 Days"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Working Hours</label>
                        <input
                          type="text"
                          value={formData.workingHours}
                          onChange={(e) => handleInputChange('workingHours', e.target.value)}
                          placeholder="e.g. 9:00 AM - 6:00 PM"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Additional Information Accordion */}
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection('additional')}
                className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base">Additional Information</span>
                </div>
                {openSections.additional ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              <AnimatePresence initial={false}>
                {openSections.additional && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 p-4 pt-3"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Joining Bonus / Perks (Optional)</label>
                        <input
                          type="text"
                          value={formData.joiningBonus}
                          onChange={(e) => handleInputChange('joiningBonus', e.target.value)}
                          placeholder="e.g. ₹ 50,000"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Special Instructions / Remarks</label>
                        <textarea
                          rows={2}
                          value={formData.specialNotes}
                          onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                          placeholder="e.g. Please submit signed copy within 3 working days."
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Signature & Approval Accordion */}
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all">
              <button
                type="button"
                onClick={() => toggleSection('approval')}
                className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-base">Signature & Approval</span>
                </div>
                {openSections.approval ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              <AnimatePresence initial={false}>
                {openSections.approval && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 p-4 pt-3"
                  >
                    <p className="mb-3 text-xs text-gray-500">
                      The signatory signs the letter. The <b>approval strip</b> in the footer shows who approved it and who prepared it.
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        ['signatoryName', 'Signatory name', 'e.g. Anil Kumar'],
                        ['signatoryDesignation', 'Signatory designation', 'HR Manager / Authorized Signatory'],
                        ['approverName', 'Approved by (name)', 'Who approves this offer'],
                        ['approverDesignation', 'Approved by (designation)', 'e.g. Chief Executive Officer'],
                        ['preparedBy', 'Prepared by', 'HR person preparing the letter'],
                        ['footerNote', 'Footer note', 'e.g. Confidential — for the addressee only.'],
                      ].map(([field, label, placeholder]) => (
                        <div key={field}>
                          <label className="block text-xs font-medium text-gray-700">{label}</label>
                          <input
                            type="text" value={formData[field]} maxLength={150}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={placeholder}
                            className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-900 shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Primary Form Submission Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-700 active:scale-[0.99]"
            >
              Generate & Save Offer Letter
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: OFFER LETTER LIVE PREVIEW (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
            {/* Live Preview Header */}
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Offer Letter Preview</h3>
                <span className={cx('px-2 py-0.5 rounded-full text-[10px] font-semibold', currentTmpl.badgeBg)}>
                  {currentTmpl.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <Layers className="h-3.5 w-3.5 text-gray-500" />
                Template
              </button>
            </div>

            {/* The letter as it will be printed: same letterhead, watermark and footer as the PDF */}
            <div ref={printRef}>
              <OfferLetterPaper form={formData} templateId={selectedTemplate} />
            </div>
            <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-gray-500">
              Reference <b className="text-gray-700">{formData.refNo}</b>
              <button type="button" onClick={copyRefNumber} className="text-gray-400 hover:text-gray-600" title="Copy reference number">
                {copiedRef ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </p>

            {/* Actions Toolbar Below Preview */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95"
              >
                <Download className="h-4 w-4 text-primary-600" />
                Download PDF
              </button>

              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95"
              >
                <Send className="h-4 w-4 text-blue-600" />
                Send Email
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition active:scale-95"
              >
                <Printer className="h-4 w-4 text-gray-600" />
                Print Letter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BOTTOM SECTION: KPI STAT CARDS (Overview Counters) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Offers */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Generated</p>
            <p className="text-lg font-bold text-gray-900">{totalGenerated} <span className="text-xs font-normal text-gray-500">Offer Letters</span></p>
          </div>
        </div>

        {/* Card 2: Accepted Offers */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-800">Accepted Offers</p>
            <p className="text-lg font-bold text-emerald-950">{acceptedCount} <span className="text-xs font-normal text-emerald-700">Confirmed</span></p>
          </div>
        </div>

        {/* Card 3: Pending / Sent */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-800">Pending / Sent</p>
            <p className="text-lg font-bold text-amber-950">{pendingCount} <span className="text-xs font-normal text-amber-700">Awaiting Signature</span></p>
          </div>
        </div>

        {/* Card 4: Rejected Offers */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-purple-100 bg-purple-50/40 p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-purple-800">Rejected Offers</p>
            <p className="text-lg font-bold text-purple-950">{rejectedCount} <span className="text-xs font-normal text-purple-700">Declined</span></p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: CHANGE TEMPLATE */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Select Offer Letter Template</h3>
                <button onClick={() => setShowTemplateModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id)
                      setShowTemplateModal(false)
                      toast.success(`Switched template to ${tmpl.name}`)
                    }}
                    className={cx(
                      'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all',
                      selectedTemplate === tmpl.id
                        ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{tmpl.name}</span>
                        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold', tmpl.badgeBg)}>{tmpl.tag}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Same TruckMitr letterhead, watermark and approval footer — only the accent colour changes.</p>
                    </div>
                    {selectedTemplate === tmpl.id && <CheckCircle2 className="h-5 w-5 text-primary-600 shrink-0" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: OFFER HISTORY & DRAFTS */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Offer Letter History & Drafts</h3>
                  <p className="text-xs text-gray-500">Track sent, accepted, and pending candidate offer letters. Click "Load" to edit any offer.</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search candidate name, designation or ref ID..."
                    className="w-full rounded-xl border border-gray-300 pl-9 pr-4 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* History Table */}
              <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Ref ID</th>
                      <th className="px-4 py-2.5">Candidate</th>
                      <th className="px-4 py-2.5">Designation</th>
                      <th className="px-4 py-2.5">CTC (₹)</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 min-w-[130px]">Status</th>
                      <th className="px-4 py-2.5 min-w-[190px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyList
                      .filter((h) =>
                        h.candidateName.toLowerCase().includes(historySearch.toLowerCase()) ||
                        h.designation.toLowerCase().includes(historySearch.toLowerCase()) ||
                        h.id.toLowerCase().includes(historySearch.toLowerCase())
                      )
                      .map((item) => (
                        <tr key={item.id} data-hl={item.dbId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-gray-900">{item.id}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{item.candidateName}</td>
                          <td className="px-4 py-3 text-gray-600">{item.designation} ({item.department})</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{item.ctc}</td>
                          <td className="px-4 py-3 text-gray-500">{item.date}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cx(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                item.status === 'Accepted' && 'bg-emerald-100 text-emerald-800',
                                item.status === 'Sent' && 'bg-blue-100 text-blue-800',
                                (item.status === 'Draft' || item.status === 'Pending') && 'bg-amber-100 text-amber-800',
                                (item.status === 'Awaiting Manager' || item.status === 'Awaiting CEO') && 'bg-orange-100 text-orange-800',
                                item.status === 'Approved' && 'bg-teal-100 text-teal-800',
                                item.status === 'Rejected' && 'bg-purple-100 text-purple-800'
                              )}
                            >
                              {item.status}
                            </span>
                            {signatureStageBadge(item) && (
                              <span className={cx('mt-1.5 block w-fit max-w-[160px] rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug', signatureStageBadge(item).style)}>
                                {signatureStageBadge(item).label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {/* One action (or action-pair) per row, each with its own row of vertical
                                breathing room - a horizontal wrap here is what made a two-line button
                                like "Send for Signature" collide with Load/Delete underneath it. */}
                            <div className="flex flex-col items-end gap-2">
                              {HR_ROLES.includes(user?.role) && ['draft', 'rejected'].includes(item.rawStatus) && (
                                <button
                                  type="button"
                                  disabled={isRowBusy(submitForApprovalMutation, item.dbId)}
                                  onClick={() => openSubmitPicker(item)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                                  title="Send to manager for approval"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Submit
                                </button>
                              )}
                              {/* Manager decisions have their own dedicated view above (role === 'manager' never reaches this table) */}
                              {['ceo', 'super_admin'].includes(user?.role) && item.rawStatus === 'pending_ceo' && (
                                <div className="flex items-center gap-1.5">
                                  <button type="button" disabled={isRowBusy(ceoDecisionMutation, item.dbId)} onClick={() => handleCeoDecision(item.dbId, 'approved')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" title="Approve">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                  </button>
                                  <button type="button" disabled={isRowBusy(ceoDecisionMutation, item.dbId)} onClick={() => handleCeoDecision(item.dbId, 'rejected')}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50" title="Reject">
                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                  </button>
                                </div>
                              )}
                              {/* Signature round-trip: HR sends -> Director signs -> HR countersigns -> Mark Sent (emails the signed PDF) */}
                              {HR_ROLES.includes(user?.role) && item.rawStatus === 'management_approved' && item.desStatus === 'none' && (
                                <button type="button" disabled={isRowBusy(sendForSignatureMutation, item.dbId)} onClick={() => handleSendForSignature(item.dbId)}
                                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50" title="Send to the Director for signature">
                                  <Send className="h-3.5 w-3.5 shrink-0" /> Send for Signature
                                </button>
                              )}
                              {['ceo', 'super_admin'].includes(user?.role) && item.desStatus === 'pending_director' && (
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={() => handleDownloadRowPdf(item)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200" title="Download to sign">
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </button>
                                  <button type="button" disabled={isRowBusy(directorUploadMutation, item.dbId)}
                                    onClick={() => { setUploadTargetId(item.dbId); directorFileInputRef.current?.click() }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" title="Upload your signed copy (PDF)">
                                    <Upload className="h-3.5 w-3.5" /> Upload Signed
                                  </button>
                                </div>
                              )}
                              {HR_ROLES.includes(user?.role) && item.desStatus === 'pending_hr_signature' && (
                                <div className="flex items-center gap-1.5">
                                  <button type="button" onClick={() => handleDownloadDirectorSigned(item.dbId, item.candidateName)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200" title="Download the Director-signed copy">
                                    <Download className="h-3.5 w-3.5" /> Director's Copy
                                  </button>
                                  <button type="button" disabled={isRowBusy(hrUploadMutation, item.dbId)}
                                    onClick={() => { setUploadTargetId(item.dbId); hrFileInputRef.current?.click() }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" title="Upload the final countersigned copy (PDF)">
                                    <Upload className="h-3.5 w-3.5" /> Upload Final
                                  </button>
                                </div>
                              )}
                              {item.hasHrSigned && (
                                <button type="button" onClick={() => handleDownloadFinalSigned(item.dbId, item.candidateName)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200" title="Download the final signed PDF">
                                  <Download className="h-3.5 w-3.5" /> Final PDF
                                </button>
                              )}
                              {HR_ROLES.includes(user?.role) && item.rawStatus === 'management_approved' && item.desStatus === 'completed' && (
                                <button type="button" disabled={isRowBusy(updateStatusMutation, item.dbId)} onClick={() => handleMarkSent(item.dbId)}
                                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50" title="Email the signed offer letter to the employee">
                                  <Send className="h-3.5 w-3.5 shrink-0" /> Send to Employee
                                </button>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleLoadHistoryItem(item)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                                  title="Load into form"
                                >
                                  <FolderInput className="h-3.5 w-3.5" />
                                  Load
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteHistoryItem(item.dbId, e)}
                                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  title="Delete record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden file pickers for the signature round-trip - a single shared input per role-step,
          targeting whichever row's Upload button was last clicked (uploadTargetId). */}
      <input ref={directorFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleDirectorFileChosen} />
      <input ref={hrFileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleHrFileChosen} />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: SEND VIA EMAIL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Send Offer Letter via Email</h3>
                <button onClick={() => setShowEmailModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSendEmailSubmit} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-gray-700">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={emailForm.to}
                    onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700">Subject Line</label>
                  <input
                    type="text"
                    required
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700">Message Body</label>
                  <textarea
                    rows={6}
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 rounded-xl border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary-700"
                  >
                    Send Offer Letter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {submitPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-bold text-gray-900">Send for Approval</h3>
                <button onClick={() => setSubmitPicker(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Choose the manager who should review <span className="font-semibold text-gray-700">{submitPicker.candidateName}</span>'s offer letter first.
                {!submitPicker.managerUserId && ' This department has no default manager configured, so pick one below.'}
              </p>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700">Approving Manager</label>
                <select
                  value={pickedManagerId}
                  onChange={(e) => setPickedManagerId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-primary-500 focus:outline-hidden"
                >
                  {(!managerUsers || managerUsers.length === 0) && <option value="">No managers configured yet</option>}
                  {(managerUsers || []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitPicker(null)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!pickedManagerId || isRowBusy(submitForApprovalMutation, submitPicker.dbId)}
                  onClick={() => handleSubmitForApproval(submitPicker.dbId, pickedManagerId)}
                  className="flex-1 rounded-xl bg-primary-600 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary-700 disabled:opacity-50"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
