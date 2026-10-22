import { useNavigate } from '@hrms/router'
import { Calendar, FileBadge, IndianRupee, Users, History } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Card, CardHeader, CardBody, StatTile, Badge, Empty, SkeletonRows } from '../components/ui'
import { useManagerDashboard } from '../hooks/useDashboard'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/**
 * Department Manager home: their team, and everything of theirs waiting on this manager's
 * approval across the four workflows (Leave, Offer Letter, Payslip, Reimbursement).
 */
const ManagerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useManagerDashboard()

  const firstName = (user?.full_name || user?.name || '').split(' ')[0]
  const pending = data?.pending || {}
  const team = data?.team || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), 'EEEE, d MMMM yyyy')}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Your team, and every request waiting on your approval."
      />

      {isLoading ? (
        <Card><CardBody><SkeletonRows rows={4} /></CardBody></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon={Calendar} label="Pending Leave" value={pending.leave ?? 0} accent="ink" index={0}
            onClick={() => navigate('/leave-management?stage=manager')}
          />
          <StatTile
            icon={FileBadge} label="Pending Offer Letters" value={pending.offer_letters ?? 0} accent="brass" index={1}
            onClick={() => navigate('/offer-letter?stage=manager')}
          />
          <StatTile
            icon={IndianRupee} label="Pending Payslips" value={pending.payslips ?? 0} accent="green" index={2}
            onClick={() => navigate('/payroll?stage=manager')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader icon={Users} title="My Team" subtitle={`${team.length} employee${team.length === 1 ? '' : 's'} reporting to you`} />
          <CardBody>
            {isLoading ? (
              <SkeletonRows rows={4} />
            ) : team.length === 0 ? (
              <Empty icon={Users} title="No direct reports yet" description="Employees whose reporting manager is set to you will show up here." />
            ) : (
              <div className="divide-y divide-gray-100">
                {team.map((t) => (
                  <div key={t.emp_id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.full_name}</p>
                      <p className="text-xs text-gray-500">{t.designation || t.emp_id}</p>
                    </div>
                    <Badge tone="neutral">{t.emp_id}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={History} title="Recent Activity" subtitle="Your last approval actions" />
          <CardBody>
            {isLoading ? (
              <SkeletonRows rows={4} />
            ) : (data?.recent_activity || []).length === 0 ? (
              <Empty icon={History} title="Nothing yet" description="Approvals you act on will show up here." />
            ) : (
              <div className="space-y-3">
                {data.recent_activity.map((log) => (
                  <div key={log.id} className="text-xs">
                    <p className="font-semibold text-gray-800 capitalize">{log.action.replace(/_/g, ' ')} · {log.subject_type.replace(/_/g, ' ')}</p>
                    <p className="text-gray-400">{format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default ManagerDashboard
