import { useState } from 'react'
import { FileBadge, FileText, UserMinus, Wallet } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui'
import { useSalaryAdvanceRequests } from '../hooks/useSalaryAdvance'
import { useResignationRequests } from '../hooks/useResignation'
import { useMyAssets } from '../hooks/useAssets'
import { useMyPayout, useMyRequests } from '../hooks/useSelfService'
import {
  AdvanceCard, AssetsCard, PayoutCard, PayslipsCard, RequestsCard, ResignationCard, SalaryStatusBanner,
} from '../components/employee/cards'
import {
  AdvanceModal, DocumentRequestModal, ResignModal,
} from '../components/employee/modals'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const ACTIONS = [
  { id: 'advance', label: 'Salary advance', icon: Wallet },
  { id: 'payslip', label: 'Request payslip', icon: FileText },
  { id: 'offer_letter', label: 'Offer letter', icon: FileBadge },
  { id: 'resign', label: 'Resign', icon: UserMinus, danger: true },
]

/**
 * The employee's home: their payout, payslips and the self-service things they can do without
 * going through HR by hand - advances, expenses, document requests, resignation - in one place.
 */
const EmployeeDashboard = () => {
  const { user } = useAuth()
  const empId = user?.emp_id

  const payout = useMyPayout()
  const advances = useSalaryAdvanceRequests()
  const resignations = useResignationRequests()
  const assets = useMyAssets()
  const requests = useMyRequests()

  const [open, setOpen] = useState(null) // 'advance' | 'payslip' | 'offer_letter' | 'resign'
  const close = () => setOpen(null)
  const firstName = (user?.full_name || user?.name || '').split(' ')[0]
  const isDoc = open === 'payslip' || open === 'offer_letter'

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1.5">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h1 className="text-2xl leading-tight md:text-[28px]">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {[user?.designation, payout.data?.employee?.department_name, empId].filter(Boolean).join(' · ') || 'Your salary, requests and company items in one place.'}
        </p>
      </div>

      <SalaryStatusBanner payout={payout.data} loading={payout.isLoading} />

      {/* Quick actions */}
      <Card className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6">
        {ACTIONS.map(({ id, label, icon: Icon, danger }) => (
          <button
            key={id} type="button" onClick={() => setOpen(id)}
            className={`flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center transition-colors hover:bg-gray-50 ${danger ? 'text-red-700' : 'text-gray-700'}`}
          >
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${danger ? 'bg-red-50 ring-red-100' : 'bg-primary-50 ring-primary-100 text-primary-700'}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><PayoutCard payout={payout.data} loading={payout.isLoading} /></div>
        <PayslipsCard payout={payout.data} loading={payout.isLoading} onRequest={() => setOpen('payslip')} />
      </div>

      <AdvanceCard advances={advances.data} loading={advances.isLoading} onRequest={() => setOpen('advance')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><AssetsCard assets={assets.data} loading={assets.isLoading} /></div>
        <RequestsCard requests={requests.data} loading={requests.isLoading} onRequest={setOpen} />
      </div>

      <ResignationCard resignations={resignations.data} loading={resignations.isLoading} onResign={() => setOpen('resign')} />

      <AdvanceModal open={open === 'advance'} onClose={close} empId={empId} />
      <DocumentRequestModal open={isDoc} onClose={close} initialType={open === 'offer_letter' ? 'offer_letter' : 'payslip'} payslips={payout.data?.payslips || []} />
      <ResignModal open={open === 'resign'} onClose={close} empId={empId} />
    </div>
  )
}

export default EmployeeDashboard
