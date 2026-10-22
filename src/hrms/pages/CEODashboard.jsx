import { useNavigate } from '@hrms/router'
import { Calendar, FileBadge, IndianRupee, Building2, History, Users, Briefcase, ShieldCheck } from 'lucide-react-teleadmin'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Card, CardHeader, CardBody, StatTile, Empty, SkeletonRows } from '../components/ui'
import { useManagementDashboard } from '../hooks/useDashboard'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/**
 * CEO/Management home: company-wide headcount and every item waiting on final management
 * approval across Leave, Offer Letter, Payslip and Reimbursement - the top of every workflow.
 */
const CEODashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useManagementDashboard()

  const firstName = (user?.full_name || user?.name || '').split(' ')[0]
  const pending = data?.pending || {}
  const departments = data?.department_breakdown || []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), 'EEEE, d MMMM yyyy')}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Company-wide visibility and everything waiting on your final approval."
      />

      {isLoading ? (
        <Card><CardBody><SkeletonRows rows={4} /></CardBody></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatTile icon={Users} label="Headcount" value={data?.company_headcount ?? 0} accent="ink" index={0} />
          <StatTile
            icon={Briefcase} label="Hiring Requirements" value={pending.hiring_requirements ?? 0} accent="orange" index={5}
            onClick={() => navigate('/recruitment')}
          />
          <StatTile
            icon={ShieldCheck} label="Verification Pending" value={pending.employee_verifications ?? 0} accent="green" index={6}
            onClick={() => navigate('/employee-verification')}
          />
          <StatTile
            icon={Calendar} label="Leave Awaiting HR" value={pending.leave_awaiting_hr ?? 0} accent="purple" index={1}
            onClick={() => navigate('/leave-management?stage=hr')}
          />
          <StatTile
            icon={FileBadge} label="Offer Letters" value={pending.offer_letters ?? 0} accent="brass" index={2}
            onClick={() => navigate('/offer-letter?stage=ceo')}
          />
          <StatTile
            icon={IndianRupee} label="Payslips" value={pending.payslips ?? 0} accent="green" index={3}
            onClick={() => navigate('/payroll?stage=ceo')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader icon={Building2} title="Department Breakdown" subtitle="Active employees by department" />
          <CardBody>
            {isLoading ? (
              <SkeletonRows rows={4} />
            ) : departments.length === 0 ? (
              <Empty icon={Building2} title="No data" description="Department headcounts will show up here." />
            ) : (
              <div className="divide-y divide-gray-100">
                {departments.map((d) => (
                  <div key={d.department_id} className="flex items-center justify-between py-3">
                    <p className="text-sm font-semibold text-gray-900">{d.department_name || `Department ${d.department_id}`}</p>
                    <p className="numeral text-sm font-semibold text-gray-700">{d.count}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={History} title="Recent Activity" subtitle="Latest approvals company-wide" />
          <CardBody>
            {isLoading ? (
              <SkeletonRows rows={4} />
            ) : (data?.recent_activity || []).length === 0 ? (
              <Empty icon={History} title="Nothing yet" description="Approval actions across the company will show up here." />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recent_activity.map((log) => (
                  <div key={log.id} className="text-xs">
                    <p className="font-semibold text-gray-800 capitalize">
                      {log.action.replace(/_/g, ' ')} · {log.subject_type.replace(/_/g, ' ')}
                      {log.actor_name ? ` · ${log.actor_name}` : ''}
                    </p>
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

export default CEODashboard
