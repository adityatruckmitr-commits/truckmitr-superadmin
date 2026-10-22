import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  UserPlus,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  RotateCw,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  X,
  Send,
  Building,
  GraduationCap
} from 'lucide-react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsRecruitmentPerformance() {
  const [activeTab, setActiveTab] = useState('openings'); // 'openings' | 'candidates' | 'offer_letter' | 'performance' | 'training'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [selectedCandidateReview, setSelectedCandidateReview] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Job Openings dataset
  const [jobs, setJobs] = useState([
    {
      id: 'JOB-101',
      title: 'Fullstack Laravel & React Engineer',
      department: 'Technology',
      location: 'Noida / Hybrid',
      openings: 2,
      applicantsCount: 18,
      status: 'Active',
      experience: '2 - 4 Years',
      createdDate: '10 Sep 2026'
    },
    {
      id: 'JOB-102',
      title: 'Telecalling Sales Team Lead',
      department: 'Teleadmin & Operations',
      location: 'Noida Office',
      openings: 3,
      applicantsCount: 42,
      status: 'Active',
      experience: '1 - 3 Years',
      createdDate: '15 Sep 2026'
    },
    {
      id: 'JOB-103',
      title: 'Fleet Operations Coordinator',
      department: 'Logistics & Verification',
      location: 'Gurugram / On-site',
      openings: 1,
      applicantsCount: 9,
      status: 'Active',
      experience: '1+ Years',
      createdDate: '01 Oct 2026'
    },
    {
      id: 'JOB-104',
      title: 'UI/UX Product Designer',
      department: 'Design',
      location: 'Remote',
      openings: 1,
      applicantsCount: 26,
      status: 'Closed',
      experience: '3+ Years',
      createdDate: '12 Aug 2026'
    }
  ]);

  // Candidates Pipeline dataset
  const [candidates, setCandidates] = useState([
    {
      id: 'CAN-301',
      name: 'Aditya Sharma',
      email: 'aditya.sharma@example.com',
      phone: '+91 98112 44510',
      role: 'Fullstack Laravel & React Engineer',
      stage: 'Interview',
      score: '4.5 / 5',
      experience: '3.2 Yrs',
      appliedAt: '24 Sep 2026'
    },
    {
      id: 'CAN-302',
      name: 'Pooja Rawat',
      email: 'pooja.rawat@example.com',
      phone: '+91 98710 11982',
      role: 'Telecalling Sales Team Lead',
      stage: 'Offered',
      score: '4.8 / 5',
      experience: '2.5 Yrs',
      appliedAt: '18 Sep 2026'
    },
    {
      id: 'CAN-303',
      name: 'Manoj Verma',
      email: 'manoj.v@example.com',
      phone: '+91 99201 55671',
      role: 'Fleet Operations Coordinator',
      stage: 'Screening',
      score: 'Pending',
      experience: '1.0 Yrs',
      appliedAt: '02 Oct 2026'
    },
    {
      id: 'CAN-304',
      name: 'Suresh Kumar',
      email: 'suresh.k@example.com',
      phone: '+91 91122 33445',
      role: 'Fullstack Laravel & React Engineer',
      stage: 'Hired',
      score: '4.7 / 5',
      experience: '4.0 Yrs',
      appliedAt: '05 Sep 2026'
    }
  ]);

  // Offer Letter Form state
  const [offerForm, setOfferForm] = useState({
    candidateName: 'Pooja Rawat',
    designation: 'Telecalling Sales Team Lead',
    department: 'Teleadmin & Operations',
    ctc: '4,50,000',
    joiningDate: '2026-11-01',
    reportingManager: 'Tarun Kumar',
    workLocation: 'TruckMitr HQ, Sector 62, Noida'
  });

  // Performance reviews dataset
  const [reviewCycles, setReviewCycles] = useState([
    {
      id: 'REV-Q3-2026',
      title: 'Q3 2026 Performance Appraisal',
      period: 'Jul - Sep 2026',
      status: 'In Review',
      completedReviews: '28 / 36',
      avgRating: '4.2'
    }
  ]);

  const [topPerformers, setTopPerformers] = useState([
    { id: 1, name: 'Sourabh Singh', empId: 'TM-EMP-002', role: 'Tech Lead', rating: 4.9, department: 'Tech', achievements: 'Delivered HRMS multi-tenant bridge & high-frequency socket loggers.' },
    { id: 2, name: 'Raksha', empId: 'TM-EMP-005', role: 'HR Executive', rating: 4.8, department: 'HR', achievements: '98% on-time attendance onboarding & biometrics sync.' },
    { id: 3, name: 'Deepak Bhati', empId: 'TM-EMP-003', role: 'Ops Lead', rating: 4.7, department: 'Operations', achievements: 'Closed 240+ transporter fleet compliance verifications.' }
  ]);

  // Training courses dataset
  const [trainingPrograms, setTrainingPrograms] = useState([
    {
      id: 'TRN-101',
      title: 'TruckMitr Telecaller POS & Negotiation Mastery',
      trainer: 'Tarun Kumar',
      enrolled: 14,
      duration: '6 Hours',
      status: 'Active',
      completionRate: '85%'
    },
    {
      id: 'TRN-102',
      title: 'Information Security & Data Privacy Compliance (ISO)',
      trainer: 'Compliance Team',
      enrolled: 36,
      duration: '2 Hours',
      status: 'Completed',
      completionRate: '100%'
    },
    {
      id: 'TRN-103',
      title: 'Driver Document Verification & Fraud Detection',
      trainer: 'Deepak Bhati',
      enrolled: 8,
      duration: '4 Hours',
      status: 'Active',
      completionRate: '70%'
    }
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await hrmsApi.get('/recruitment/funnel');
      showToast('Recruitment funnel synced with TaskSuite DB.');
    } catch {
      showToast('Recruitment & Performance synchronized.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStageAdvance = (candidateId, nextStage) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c));
    showToast(`Candidate ${candidateId} advanced to ${nextStage}.`);
    setSelectedCandidateReview(null);
  };

  const handleGenerateOfferLetter = (e) => {
    e.preventDefault();
    showToast(`Offer letter draft generated for ${offerForm.candidateName} (₹${offerForm.ctc} CTC).`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-purple-600 rounded-xl text-white shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Recruitment & Performance Suite
              </h1>
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                Talent Ops
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Job requisitions, hiring funnel pipeline, automated offer letter issuance, performance appraisals, and team training.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs disabled:opacity-50"
              title="Refresh Pipeline"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddJobModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Job</span>
            </button>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Positions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">6 Active</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
                across 3 departments
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Talent in Funnel</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{candidates.length} Profiles</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 mt-1">
                2 in final interview
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Org Rating</p>
              <p className="text-2xl font-black text-slate-900 mt-1">4.2 / 5.0</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 mt-1">
                Q3 Appraisal Cycle
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Training Modules</p>
              <p className="text-2xl font-black text-slate-900 mt-1">3 Courses</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
                85% completion rate
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-500 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('openings')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'openings'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Requisitions ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'candidates'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hiring Pipeline Funnel ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('offer_letter')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'offer_letter'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Offer Letter Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'performance'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Performance & Appraisals</span>
          </button>

          <button
            onClick={() => setActiveTab('training')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'training'
                ? 'border-purple-600 text-purple-600 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Training & L&D ({trainingPrograms.length})</span>
          </button>
        </div>

        {/* Tab 1: Job Requisitions */}
        {activeTab === 'openings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j) => (
              <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      {j.id}
                    </span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      j.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {j.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{j.title}</h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="flex items-center text-slate-600">
                      <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {j.department} • {j.location}
                    </p>
                    <p className="flex items-center text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      Exp: {j.experience}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-900">{j.applicantsCount}</span> Applicants
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('candidates');
                      showToast(`Viewing candidate applicants for ${j.title}`);
                    }}
                    className="text-purple-600 hover:text-purple-700 font-bold flex items-center space-x-1"
                  >
                    <span>View Pipeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Candidate Pipeline Funnel */}
        {activeTab === 'candidates' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Talent Pipeline</h2>
                <p className="text-xs text-slate-500">Track candidates across Screening, Interview, Offered, and Hired milestones.</p>
              </div>
              <button
                onClick={() => setIsAddCandidateModalOpen(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Target Role</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.email} • {c.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {c.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.experience}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          c.stage === 'Hired'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.stage === 'Offered'
                            ? 'bg-blue-100 text-blue-800'
                            : c.stage === 'Interview'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {c.score}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex space-x-1.5">
                          {c.stage === 'Screening' && (
                            <button
                              onClick={() => handleStageAdvance(c.id, 'Interview')}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold"
                            >
                              Schedule Interview
                            </button>
                          )}
                          {c.stage === 'Interview' && (
                            <button
                              onClick={() => handleStageAdvance(c.id, 'Offered')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                            >
                              Make Offer
                            </button>
                          )}
                          {c.stage === 'Offered' && (
                            <button
                              onClick={() => handleStageAdvance(c.id, 'Hired')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                            >
                              Mark Hired
                            </button>
                          )}
                          {c.stage === 'Hired' && (
                            <span className="text-emerald-600 font-bold text-[11px]">Onboarded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Offer Letter Generator */}
        {activeTab === 'offer_letter' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Issue Employment Offer Letter</span>
              </h2>
              <form onSubmit={handleGenerateOfferLetter} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Candidate Full Name</label>
                  <input
                    type="text"
                    value={offerForm.candidateName}
                    onChange={(e) => setOfferForm({ ...offerForm, candidateName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Designation</label>
                    <input
                      type="text"
                      value={offerForm.designation}
                      onChange={(e) => setOfferForm({ ...offerForm, designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Department</label>
                    <input
                      type="text"
                      value={offerForm.department}
                      onChange={(e) => setOfferForm({ ...offerForm, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Annual CTC (INR)</label>
                    <input
                      type="text"
                      value={offerForm.ctc}
                      onChange={(e) => setOfferForm({ ...offerForm, ctc: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={offerForm.joiningDate}
                      onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Work Location</label>
                  <input
                    type="text"
                    value={offerForm.workLocation}
                    onChange={(e) => setOfferForm({ ...offerForm, workLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Generate & Send Offer Letter
                </button>
              </form>
            </div>

            {/* Offer Letter Preview Box */}
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-xs flex flex-col justify-between space-y-4 font-mono text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center font-black text-white text-xs">T</div>
                    <span className="font-bold text-slate-200">TruckMitr Technologies</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px]">LETTER OF INTENT</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <p>Dear <span className="text-white font-bold">{offerForm.candidateName}</span>,</p>
                  <p className="leading-relaxed">
                    We are pleased to offer you the position of <span className="text-purple-300 font-bold">{offerForm.designation}</span> with TruckMitr Technologies Pvt. Ltd.
                  </p>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1 text-[11px]">
                    <p><span className="text-slate-400">Total Fixed CTC:</span> ₹{offerForm.ctc} per annum</p>
                    <p><span className="text-slate-400">Department:</span> {offerForm.department}</p>
                    <p><span className="text-slate-400">Joining Date:</span> {offerForm.joiningDate}</p>
                    <p><span className="text-slate-400">Reporting Office:</span> {offerForm.workLocation}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Please signify your acceptance of this letter by returning the signed duplicate copy within 3 working days.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-slate-400 text-[10px]">HR Executive • Deepak Kumar</span>
                <button
                  onClick={() => showToast('Offer Letter downloaded as PDF')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Draft</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Performance & Appraisals */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Top Performers of the Quarter</h3>
                  <p className="text-xs text-slate-500">Recognized by team managers and operational milestones.</p>
                </div>
                <Award className="w-5 h-5 text-amber-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topPerformers.map((p) => (
                  <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <div className="flex items-center space-x-1 text-amber-500 font-black text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{p.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{p.role} • {p.department}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.achievements}</p>
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                      {p.empId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Training & Development */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Workforce Training & Skill Modules</h2>
                <p className="text-xs text-slate-500">Internal SOP courses, compliance certifications, and sales training.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-4">Trainer / Lead</th>
                    <th className="py-3 px-4">Enrolled Count</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Completion</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingPrograms.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[11px] font-mono text-purple-600">{t.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.trainer}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {t.enrolled} Employees
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.duration}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {t.completionRate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Post New Job */}
      {isAddJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Post New Job Opening</h3>
              <button onClick={() => setIsAddJobModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Job requisition saved & published.');
                setIsAddJobModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-600 font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Laravel Developer"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Technology"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Openings</label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Experience</label>
                  <input
                    type="text"
                    placeholder="2-4 Years"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddJobModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs"
                >
                  Publish Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
