import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from '@teleadmin/router';
import { userApi } from '../../services/api/userApi';
import { 
  User, Loader2, ArrowLeft, ShieldCheck, Video, PhoneCall, 
  Briefcase, CheckCircle2, Truck, Users, Award, FileText,
  Calendar, MapPin, Phone, Mail, Activity, CheckCircle, AlertCircle
} from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL } from '../../config/api.config';
import ProfileTab from './tabs/ProfileTab';
import TrainingTab from './tabs/TrainingTab';
import VerificationTab from './tabs/VerificationTab';
import CallsTab from './tabs/CallsTab';
import JobsTab from './tabs/JobsTab';
import PlacementTab from './tabs/PlacementTab';
import TransporterJobsTab from './tabs/TransporterJobsTab';
import TotalHiredTab from './tabs/TotalHiredTab';
import ReferralsTab from './tabs/ReferralsTab';
import InterviewTab from './tabs/InterviewTab';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams(location.search);
      const params = Object.fromEntries(searchParams.entries());
      const response = await userApi.getUserDetail(id, params);
      if (response?.data) {
        setData(response.data);
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, location.search]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">{error || 'User not found'}</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const {
    user, planStatus, totalPayment, trainingProgress, documentVerification,
    jobApplications, placementDetails, jobs, hiredDrivers, referralStats
  } = data;

  const allTabs = [
    { id: 'profile', label: 'Profile & Payments', icon: User, showFor: ['all'] },
    { id: 'training', label: 'Training Status', icon: Video, showFor: ['driver'] },
    { id: 'verification', label: 'Verification Status', icon: ShieldCheck, showFor: ['driver', 'transporter'] },
    { id: 'calls', label: 'Driver/Transporter Calls', icon: PhoneCall, showFor: ['driver', 'transporter'] },
    { id: 'jobs', label: 'Job Applications', icon: Briefcase, showFor: ['driver'] },
    { id: 'placement', label: 'Placement Details', icon: CheckCircle, showFor: ['driver'] },
    { id: 'interview', label: 'Interview Done', icon: CheckCircle2, showFor: ['driver'] },
    { id: 'transporter_jobs', label: 'Job Listings', icon: Briefcase, showFor: ['transporter'] },
    { id: 'total_hired', label: 'Total Hired', icon: Users, showFor: ['transporter'] },
    { id: 'referrals', label: 'Refer & Earn Details', icon: Award, showFor: ['all'] }
  ];

  const tabs = allTabs.filter(tab => tab.showFor.includes('all') || tab.showFor.includes(user.role));

  const renderProfile = () => (
    <ProfileTab 
      user={user} 
      planStatus={planStatus} 
      totalPayment={totalPayment} 
      payments={data.payments}
      onRefresh={fetchData}
    />
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">User Details</h1>
            <p className="text-xs text-slate-500 mt-0.5">View comprehensive information across all modules</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto custom-scrollbar border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-slate-50/50 min-h-[400px]">
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'training' && <TrainingTab trainingProgress={trainingProgress} trainingStatus={data.trainingStatus} />}
          {activeTab === 'verification' && <VerificationTab documentVerification={documentVerification} courtCheck={data.courtCheck} courtCheckApiData={data.courtCheckApiData} davStatus={data.davStatus} springVerifyStatus={data.springVerifyStatus} role={user.role} />}
          {activeTab === 'calls' && <CallsTab callLogs={data.callLogs} user={user} />}
          {activeTab === 'jobs' && <JobsTab jobApplications={jobApplications} driverId={user.id} onRefresh={fetchData} />}
          {activeTab === 'placement' && <PlacementTab placementDetails={placementDetails} />}
          {activeTab === 'interview' && <InterviewTab interviews={data.interviews} />}
          {activeTab === 'transporter_jobs' && <TransporterJobsTab jobs={jobs} user={user} highlightJobId={new URLSearchParams(location.search).get('highlightJobId')} />}
          {activeTab === 'total_hired' && <TotalHiredTab hiredDrivers={hiredDrivers} />}
          {activeTab === 'referrals' && <ReferralsTab referralStats={referralStats} referredUsers={data.referredUsers} referralPayments={data.referralPayments} />}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
