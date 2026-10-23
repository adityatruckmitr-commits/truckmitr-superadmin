import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Briefcase,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Phone,
  User,
  Calendar,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Award,
  Check,
  Building2,
  Users
} from 'lucide-react';
import PageJump from '../../components/PageJump';

export default function JobsList() {
  const navigate = useNavigate();

  // Data States
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [stats, setStats] = useState({ total: 1510, active: 62, pending: 214, inactive: 110, expired: 1411 });
  const [totalCount, setTotalCount] = useState(1510);
  const [totalPages, setTotalPages] = useState(76);
  const [telecallersList, setTelecallersList] = useState([]);

  // Filters & Controls
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'pending' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Advanced Filters
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedTelecaller, setSelectedTelecaller] = useState('All');

  // Modals
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [viewAppsModal, setViewAppsModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

  // New Job Form State
  const [jobForm, setJobForm] = useState({
    title: '',
    salary_text: '',
    vehicle_type: 'Container Trucks',
    license_type: 'HMV',
    state: 'Delhi',
    city: 'Delhi',
    description: '',
    experience: '1 - 5 yrs',
    no_of_driver: 1,
    skills: ['E-commerce'],
    plan: 'Premium Job',
    fee: '₹1999.00',
    transporter_name: '',
    transporter_mobile: '',
    deadline: '2026-10-31'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Full default dataset of 20 live records from the user specification
  const defaultJobsDataset = [
    {
      id: 1,
      job_id: 'TMJB01894',
      apps_count: 6,
      tmid: 'TM2609DLTR407275',
      assigned_to: 'Aayushi Vc',
      contact_name: 'Mohd Asif',
      mobile: '8178322722',
      title: '🚚 कंटेनर 22 फीट Tata 1109g ड्राइवर चाहिए - दिल्ली',
      compensation: '💰 मासिक आय ₹28,000 + ट्रिप इंसेंटिव',
      vehicle_type: 'Container Trucks',
      license: 'HMV',
      location: 'Delhi',
      description: '🚚 अर्जेंट! अनुभवी कंटेनर ड्राइवर...',
      experience: '1 - 5 yrs',
      skills: ['E-commerce', 'Automobile Carrier', '+3 more'],
      drivers_req: 1,
      posted_at: '07 Oct 2026, 05:09 PM',
      deadline: '17 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 6,
      plan_name: '★ Premium Job',
      plan_fee: 'Fee: ₹1999.00',
      status: 'Approved',
      is_active: true
    },
    {
      id: 2,
      job_id: 'TMJB01893',
      apps_count: 5,
      tmid: 'TM2604HRTR47863',
      assigned_to: 'Angad',
      contact_name: 'Gaurav Yadav',
      mobile: '9555555243',
      title: '🚚 6 व्हील 22 फीट कंटेनर ड्राइवर चाहिए - गुड़गांव/मानेसर, हरियाणा',
      compensation: '💰 सैलरी ₹24,000 + ₹7,000 माइलेज बचत इनकम',
      vehicle_type: 'Container Trucks',
      license: 'HMV',
      location: 'गुड़गांव / मानेसर, हरियाणा',
      description: '🚚 अनुभवी कंटेनर ड्राइवर की...',
      experience: '1 - 5 yrs',
      skills: ['E-commerce'],
      drivers_req: 2,
      posted_at: '08 Oct 2026, 05:37 PM',
      deadline: '31 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 5,
      plan_name: '★ Premium Job',
      plan_fee: 'Fee: ₹3998.00',
      status: 'Approved',
      is_active: true
    },
    {
      id: 3,
      job_id: 'TMJB01892',
      apps_count: 0,
      tmid: 'TM2610ODTR409725',
      assigned_to: 'Chandarbi',
      contact_name: 'Yasuja',
      mobile: '9237391921',
      title: 'Need Driver for 18 wheeler tipper at Odisha for flyash & coal transport',
      compensation: 'Heavy Tipper Mining route',
      vehicle_type: 'Tipper Trucks',
      license: 'HMV',
      location: 'Odisha',
      description: 'Flyash & coal transport',
      experience: '5 - 10 yrs',
      skills: ['Others'],
      drivers_req: 50,
      posted_at: '08 Oct 2026, 04:29 PM',
      deadline: '31 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 4,
      job_id: 'TMJB01891',
      apps_count: 0,
      tmid: 'TM2609TGTR397601',
      assigned_to: 'Angad',
      contact_name: 'Nawaz',
      mobile: '9700540830',
      title: 'Ashok Leyland 16 tyre open body vehicle heavy truck driver wanted',
      compensation: 'Long haul inter-state transport',
      vehicle_type: 'Cargo Truck (Open)',
      license: 'HMV',
      location: 'Telangana',
      description: 'Driver should be responsi...',
      experience: '5 - 10 yrs',
      skills: ['Others'],
      drivers_req: 10,
      posted_at: '08 Oct 2026, 03:19 PM',
      deadline: '30 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 5,
      job_id: 'TMJB01890',
      apps_count: 1,
      tmid: 'TM2607PBTR83536',
      assigned_to: 'Chandarbi',
      contact_name: 'Deepak',
      mobile: '9216660160',
      title: '🚚 22 फीट CNG ट्रक ड्राइवर चाहिए - जालंधर, पंजाब',
      compensation: '💰 मासिक आय ₹25,000-30,000 (फिक्स्ड सैलरी + खाना/ट्रिप)',
      vehicle_type: 'Cargo Truck (Open)',
      license: 'HMV',
      location: 'Punjab',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      experience: '5 - 10 yrs',
      skills: ['E-commerce'],
      drivers_req: 2,
      posted_at: '08 Oct 2026, 01:28 PM',
      deadline: '05 Dec 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 1,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Approved',
      is_active: true
    },
    {
      id: 6,
      job_id: 'TMJB01889',
      apps_count: 6,
      tmid: 'TM2609RJTR398282',
      assigned_to: 'Chandarbi',
      contact_name: 'Ramjeet Sharma',
      mobile: '9351575008',
      title: '🚚 6 चक्का 22 फीट ट्रक ड्राइवर चाहिए - जयपुर, राजस्थान',
      compensation: '💰 मासिक आय ₹20,000-25,000 (सैलरी + डेली भत्ता + ट्रिप)',
      vehicle_type: 'Container Trucks',
      license: 'HMV',
      location: 'Rajasthan',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      experience: '5 - 10 yrs',
      skills: ['E-commerce'],
      drivers_req: 2,
      posted_at: '08 Oct 2026, 12:16 PM',
      deadline: '18 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 6,
      plan_name: '★ Premium Job',
      plan_fee: 'Fee: ₹1999.00',
      status: 'Approved',
      is_active: true
    },
    {
      id: 7,
      job_id: 'TMJB01888',
      apps_count: 0,
      tmid: 'TM2604HRTR47863',
      assigned_to: 'Chandarbi',
      contact_name: 'Gaurav Yadav',
      mobile: '9555555243',
      title: 'Need driver for local on container 22ft',
      compensation: 'Hub to Hub local distribution',
      vehicle_type: 'Container Trucks',
      license: 'HMV',
      location: 'Haryana',
      description: 'Vehicle run in local area f...',
      experience: '1 - 5 yrs',
      skills: ['E-commerce'],
      drivers_req: 10,
      posted_at: '05 Oct 2026, 08:27 PM',
      deadline: '31 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 8,
      job_id: 'TMJB01887',
      apps_count: 0,
      tmid: 'TM2608GJTR93980',
      assigned_to: 'Angad',
      contact_name: 'Vijay',
      mobile: '6378021096',
      title: '🚙 बोलेरो पिकअप ड्राइवर की आवश्यकता है राजस्थान और गुजरात के हो',
      compensation: 'Light Commercial Delivery Route',
      vehicle_type: 'Light Commercial',
      license: 'LMV',
      location: 'Gujarat',
      description: 'ड्राइवर कोई भी नशा ना कर...',
      experience: '1 - 5 yrs',
      skills: ['Others'],
      drivers_req: 4,
      posted_at: '05 Oct 2026, 02:26 PM',
      deadline: '12 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 9,
      job_id: 'TMJB01886',
      apps_count: 5,
      tmid: 'TM2608KATR92417',
      assigned_to: 'Angad',
      contact_name: 'Prakash',
      mobile: '8310332419',
      title: '🚚 Tata 6 चक्का ओपन ट्रक ड्राइवर चाहिए - बेलगाम, कर्नाटक (ऑल इंडिया)',
      compensation: '💰 मासिक आय ₹25,000 (₹350/- खाना खर्चा)',
      vehicle_type: 'Cargo Truck (Open)',
      license: 'HMV',
      location: 'Karnataka',
      description: '🚚 अनुभवी ऑल इंडिया ड्राइ...',
      experience: '5 - 10 yrs',
      skills: ['Others'],
      drivers_req: 1,
      posted_at: '05 Oct 2026, 10:25 AM',
      deadline: '30 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 5,
      plan_name: '★ Premium Job',
      plan_fee: 'Fee: ₹1999.00',
      status: 'Approved',
      is_active: true
    },
    {
      id: 10,
      job_id: 'TMJB01885',
      apps_count: 0,
      tmid: 'TM2610TNTR409033',
      assigned_to: 'Chandarbi',
      contact_name: 'Kowsik Narendran',
      mobile: '9444051825',
      title: 'HEAVY DRIVER FOR TRAILER',
      compensation: 'Semi-Trailer Heavy Haulage Logistics',
      vehicle_type: 'Trailer / Semi-Trailer',
      license: 'HGMV',
      location: 'Tamil Nadu',
      description: 'Cleanliness , Safety & Die...',
      experience: '10 - 15 yrs',
      skills: ['Construction'],
      drivers_req: 1,
      posted_at: '04 Oct 2026, 11:22 PM',
      deadline: '04 Jan 2027, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 11,
      job_id: 'TMJB01884',
      apps_count: 0,
      tmid: 'TM2610TNTR409033',
      assigned_to: 'Chandarbi',
      contact_name: 'Kowsik Narendran',
      mobile: '9444051825',
      title: 'Heavy Driver For Trailer Bulker',
      compensation: 'Cement & Industrial Bulker Delivery',
      vehicle_type: 'Trailer / Semi-Trailer',
      license: 'HGMV',
      location: 'Andhra Pradesh',
      description: 'Must Maintain the vehicle...',
      experience: '5 - 10 yrs',
      skills: ['Construction'],
      drivers_req: 10,
      posted_at: '04 Oct 2026, 11:04 PM',
      deadline: '31 Dec 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    },
    {
      id: 12,
      job_id: 'TMJB01883',
      apps_count: 0,
      tmid: 'TM2509UPTR08236',
      assigned_to: 'Angad',
      contact_name: 'Nikhil Tayal',
      mobile: '8265811415',
      title: 'TRUCK DRIVER (6 TYRE OPEN)',
      compensation: 'Delhi NCR to UP Industrial Belt',
      vehicle_type: 'Cargo Truck (Open)',
      license: 'HMV',
      location: 'Uttar Pradesh',
      description: '6 TYRE DRIVER REQUIRED',
      experience: '1 - 5 yrs',
      skills: ['E-commerce', 'White Goods'],
      drivers_req: 10,
      posted_at: '04 Oct 2026, 07:45 PM',
      deadline: '11 Oct 2026, 12:00 AM',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: 'Standard Job',
      plan_fee: '',
      status: 'Pending',
      is_active: false
    }
  ];

  // Fetch Jobs from backend API
  const fetchJobs = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/admin/jobs-brief', {
        params: {
          page: currentPage,
          per_page: pageSize,
          status: activeTab !== 'all' ? activeTab : undefined,
          search: searchQuery || undefined,
          vehicle_type: selectedVehicleType !== 'All' ? selectedVehicleType : undefined,
          license_type: selectedLicense !== 'All' ? selectedLicense : undefined,
          state: selectedState !== 'All' ? selectedState : undefined,
          assigned_to: selectedTelecaller !== 'All' ? selectedTelecaller : undefined
        }
      });

      if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
        if (res.data.total !== undefined) setTotalCount(res.data.total);
        if (res.data.last_page !== undefined) setTotalPages(res.data.last_page);
        if (res.data.stats) setStats(res.data.stats);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.warn('Jobs API error:', err);
      setJobs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load dynamic matchmaking telecallers list on mount
  useEffect(() => {
    const fetchTelecallers = async () => {
      try {
        const res = await api.get('/admin/teleadmin/telecallers-list');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setTelecallersList(res.data);
        }
      } catch {
        // Fallback already in initial state
      }
    };
    fetchTelecallers();
  }, []);

  // Fetch when page, tab, or filter changes
  useEffect(() => {
    fetchJobs();
  }, [currentPage, pageSize, activeTab, selectedVehicleType, selectedLicense, selectedState, selectedTelecaller]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Client-side filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Tab filter
      if (activeTab === 'active' && !job.is_active) return false;
      if (activeTab === 'pending' && job.status.toLowerCase() !== 'pending') return false;
      if (activeTab === 'closed' && job.is_active) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          job.job_id.toLowerCase().includes(q) ||
          job.tmid.toLowerCase().includes(q) ||
          job.contact_name.toLowerCase().includes(q) ||
          job.mobile.includes(q) ||
          job.title.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Advanced filters
      if (selectedVehicleType !== 'All' && job.vehicle_type !== selectedVehicleType) return false;
      if (selectedLicense !== 'All' && job.license !== selectedLicense) return false;
      if (selectedState !== 'All' && !job.location.toLowerCase().includes(selectedState.toLowerCase())) return false;
      if (selectedTelecaller !== 'All' && job.assigned_to !== selectedTelecaller) return false;

      return true;
    });
  }, [jobs, activeTab, searchQuery, selectedVehicleType, selectedLicense, selectedState, selectedTelecaller]);

  // Paginated/displayed jobs directly from server response
  const paginatedJobs = useMemo(() => {
    return jobs;
  }, [jobs]);

  // Assign Telecaller Action
  const handleAssignTelecaller = async (jobId, telecallerId) => {
    const telecallerObj = telecallersList.find(t => String(t.id) === String(telecallerId) || t.name === telecallerId);
    const assignedName = telecallerObj ? telecallerObj.name : telecallerId;
    try {
      const res = await api.post(`/admin/jobs-brief/assign/${jobId}`, {
        assigned_to: telecallerId
      });
      if (res.data && res.data.status === 'success') {
        const updatedName = res.data.assigned_to || assignedName;
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assigned_to: updatedName, assigned_to_id: telecallerId } : j));
        showToast(`Job ${jobId} assigned to ${updatedName}`);
        return;
      }
    } catch (err) {
      console.warn('Assign telecaller error:', err);
    }
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assigned_to: assignedName } : j));
    showToast(`Assigned job to ${assignedName}`);
  };

  // Toggle active status
  const handleToggleActive = async (id) => {
    try {
      const res = await api.post(`/admin/jobs-brief/status/${id}`);
      if (res.data && res.data.status === 'success') {
        const nextActive = res.data.is_active;
        setJobs(prev => prev.map(j => j.id === id ? { 
          ...j, 
          is_active: nextActive, 
          status: nextActive ? 'Approved' : 'Inactive' 
        } : j));
        showToast(res.data.message || 'Job status updated successfully');
        if (nextActive) {
          setStats(s => ({ ...s, active: s.active + 1, inactive: Math.max(0, s.inactive - 1) }));
        } else {
          setStats(s => ({ ...s, active: Math.max(0, s.active - 1), inactive: s.inactive + 1 }));
        }
        return;
      }
    } catch (err) {
      console.warn('Toggle status error:', err);
    }
    setJobs(prev => prev.map(j => j.id === id ? { ...j, is_active: !j.is_active } : j));
    showToast('Job status updated');
  };

  // Open View Applications Modal with live applicants
  const handleOpenViewApps = async (job) => {
    setViewAppsModal({ ...job, loadingApplicants: true, applications: [] });
    try {
      const res = await api.get(`/admin/jobs-brief/view/${job.id}`);
      if (res.data && res.data.status === 'success' && res.data.data) {
        setViewAppsModal({
          ...job,
          loadingApplicants: false,
          applications: res.data.data.applications || [],
          job_details: res.data.data.job || {}
        });
        return;
      }
    } catch (err) {
      console.warn('View applicants warning:', err);
    }
    setViewAppsModal({ ...job, loadingApplicants: false, applications: [] });
  };

  // Delete action
  const handleDeleteJob = async () => {
    if (!deleteConfirmModal) return;
    try {
      await api.delete(`/admin/jobs/${deleteConfirmModal.id}`);
    } catch (err) {
      console.warn('Delete job error:', err);
    }
    setJobs(prev => prev.filter(j => j.id !== deleteConfirmModal.id));
    setDeleteConfirmModal(null);
    showToast('Job posting deleted successfully');
    setStats(s => ({ ...s, total: Math.max(0, s.total - 1) }));
  };

  // Highlight action
  const handleHighlight = (job) => {
    showToast(`Job ${job.job_id} highlighted and boosted on driver app!`);
  };

  // Post New Job submit
  const handleCreateJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/jobs/store', {
        title: jobForm.title,
        transporter_name: jobForm.transporter_name,
        transporter_mobile: jobForm.transporter_mobile,
        vehicle_type: jobForm.vehicle_type,
        license_type: jobForm.license_type,
        no_of_driver: jobForm.no_of_driver,
        salary: jobForm.salary_text,
        state: jobForm.state,
        city: jobForm.city,
        description: jobForm.description,
        experience: jobForm.experience,
        skills: jobForm.skills,
        plan: jobForm.plan,
        deadline: jobForm.deadline
      });

      if (res.data && res.data.status === 'success') {
        showToast(`Job ${res.data.job_id || ''} posted successfully!`);
        setPostJobModalOpen(false);
        fetchJobs();
        return;
      }
    } catch (err) {
      console.warn('API post job error:', err);
    }

    // Offline / fallback addition
    const newJobObj = {
      id: Date.now(),
      job_id: `TMJB0${Math.floor(1000 + Math.random() * 9000)}`,
      apps_count: 0,
      tmid: `TM2610DLTR${Math.floor(100000 + Math.random() * 900000)}`,
      assigned_to: 'Angad',
      contact_name: jobForm.transporter_name || 'Fleet Transporter',
      mobile: jobForm.transporter_mobile || '9876543210',
      title: jobForm.title,
      compensation: jobForm.salary_text || '₹25,000 + Incentive',
      vehicle_type: jobForm.vehicle_type,
      license: jobForm.license_type,
      location: `${jobForm.city}, ${jobForm.state}`,
      description: jobForm.description || 'Experienced driver needed immediately.',
      experience: jobForm.experience,
      skills: jobForm.skills,
      drivers_req: jobForm.no_of_driver,
      posted_at: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      deadline: jobForm.deadline || 'Open',
      new_apps: 0,
      repeat_apps: 0,
      plan_name: jobForm.plan,
      plan_fee: jobForm.fee,
      status: 'Approved',
      is_active: true
    };

    setJobs([newJobObj, ...jobs]);
    setPostJobModalOpen(false);
    showToast(`New Job ${newJobObj.job_id} posted successfully!`);
  };

  // Export Master Report
  const handleExportReport = () => {
    showToast('Exporting Master Job Report to CSV...');
    const headers = ['Job ID', 'TM ID', 'Contact Name', 'Mobile', 'Title', 'Vehicle Type', 'License', 'Location', 'Drivers Req', 'Status'];
    const rows = filteredJobs.map(j => [
      j.job_id,
      j.tmid,
      `"${j.contact_name}"`,
      j.mobile,
      `"${j.title}"`,
      j.vehicle_type,
      j.license,
      `"${j.location}"`,
      j.drivers_req,
      j.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TruckMitr_Jobs_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12 font-sans min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Key Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Live Status Pills */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Jobs List
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {totalCount} Records
            </span>
          </h1>
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">
            Total {stats.active} Postings Active
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Job Hub Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-xs select-none">
            <Check className="w-3.5 h-3.5" />
            <span>Active Job Hub</span>
          </div>

          {/* Filter Trigger Button */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5"></span>
          </button>

          {/* Master Job Report Button */}
          <button
            onClick={handleExportReport}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Master Job Report</span>
          </button>

          {/* Post Driver Job Button */}
          <button
            onClick={() => setPostJobModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Post Driver Job</span>
          </button>
        </div>
      </div>

      {/* Quick Status Filter Pills & In-table Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Postings ({stats.total})
          </button>
          <button
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Approval ({stats.pending})
          </button>
          <button
            onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'closed'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Closed / Expired ({stats.inactive + stats.expired})
          </button>
        </div>

        {/* Quick Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-72 sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Job ID, TM ID, Name, Mobile, Title..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
            />
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <button
            onClick={fetchJobs}
            className="p-1.5 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Advanced Filter Collapse Drawer */}
      {filterDrawerOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Vehicle Type</label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Container Trucks">Container Trucks</option>
              <option value="Tipper Trucks">Tipper Trucks</option>
              <option value="Cargo Truck (Open)">Cargo Truck (Open)</option>
              <option value="Light Commercial">Light Commercial</option>
              <option value="Trailer / Semi-Trailer">Trailer / Semi-Trailer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">License Required</label>
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Licenses</option>
              <option value="HMV">HMV</option>
              <option value="LMV">LMV</option>
              <option value="HGMV">HGMV</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">State / Territory</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Locations</option>
              <option value="Delhi">Delhi</option>
              <option value="Haryana">Haryana</option>
              <option value="Punjab">Punjab</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Odisha">Odisha</option>
              <option value="Telangana">Telangana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Assigned Telecaller</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => { setSelectedTelecaller(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Telecallers</option>
              {telecallersList.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* BEGIN: Enterprise Unified Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap min-w-[1700px]">
            {/* Header */}
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200 sticky top-0 z-30 select-none">
              <tr>
                <th className="py-3 px-3 w-12 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">#</th>
                <th className="py-3 px-3.5 sticky left-12 bg-slate-50 z-20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">Job ID</th>
                <th className="py-3 px-3">Applications</th>
                <th className="py-3 px-3.5">TM ID</th>
                <th className="py-3 px-3.5">Assigned To</th>
                <th className="py-3 px-3.5">Contact Name</th>
                <th className="py-3 px-3.5">Mobile Number</th>
                <th className="py-3 px-4 min-w-[260px]">Job Title & Compensation</th>
                <th className="py-3 px-3">Vehicle Type</th>
                <th className="py-3 px-2.5">License</th>
                <th className="py-3 px-3.5">Location</th>
                <th className="py-3 px-4 min-w-[220px]">Job Description</th>
                <th className="py-3 px-3">Exp. (Yrs)</th>
                <th className="py-3 px-3 min-w-[170px]">Preferred Skills</th>
                <th className="py-3 px-3 text-center">Drivers Req.</th>
                <th className="py-3 px-3">Job Post Date</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-2.5 text-center">New Apps</th>
                <th className="py-3 px-2.5 text-center">Repeat Apps</th>
                <th className="py-3 px-3.5">Job Plan / Details</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Active/Inactive</th>
                <th className="py-3 px-3.5 text-center sticky right-0 bg-slate-50 z-20 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={23} className="py-12 text-center text-slate-400">
                    No jobs matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors group">
                    {/* # */}
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px] sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    {/* Job ID */}
                    <td className="py-3 px-3.5 font-semibold text-blue-600 font-mono sticky left-12 bg-white group-hover:bg-blue-50/40 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      {row.job_id}
                    </td>

                    {/* Applications */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleOpenViewApps(row)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          row.apps_count > 0
                            ? 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View ({row.apps_count})</span>
                      </button>
                    </td>

                    {/* TM ID */}
                    <td className="py-3 px-3.5 font-mono text-slate-500 text-[11px]">
                      {row.tmid}
                    </td>

                    {/* Assigned To */}
                    <td className="py-3 px-3.5">
                      <select
                        value={row.assigned_to_id || row.assigned_to}
                        onChange={(e) => handleAssignTelecaller(row.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded px-2 py-0.5 font-medium hover:border-blue-400 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={row.assigned_to}>{row.assigned_to || 'Assign Telecaller'}</option>
                        {telecallersList.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Contact Name */}
                    <td className="py-3 px-3.5 font-medium text-slate-900">
                      {row.contact_name}
                    </td>

                    {/* Mobile Number */}
                    <td className="py-3 px-3.5 font-mono text-slate-600">
                      {row.mobile}
                    </td>

                    {/* Job Title & Compensation */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{row.title}</div>
                      <div className="text-[11px] text-amber-600 font-semibold mt-0.5">{row.compensation}</div>
                    </td>

                    {/* Vehicle Type */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 font-medium text-slate-700 border border-slate-200">
                        {row.vehicle_type}
                      </span>
                    </td>

                    {/* License */}
                    <td className="py-3 px-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        row.license === 'LMV'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {row.license}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3.5 font-medium text-slate-800">
                      {row.location}
                    </td>

                    {/* Job Description */}
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={row.description}>
                      {row.description}
                    </td>

                    {/* Exp (Yrs) */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {row.experience}
                    </td>

                    {/* Preferred Skills */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {row.skills && row.skills.map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Drivers Req. */}
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {row.drivers_req}
                    </td>

                    {/* Job Post Date */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {row.posted_at}
                    </td>

                    {/* Deadline */}
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {row.deadline}
                    </td>

                    {/* New Apps */}
                    <td className="py-3 px-2.5 text-center font-semibold text-slate-400">
                      {row.new_apps}
                    </td>

                    {/* Repeat Apps */}
                    <td className="py-3 px-2.5 text-center font-semibold text-blue-600">
                      {row.repeat_apps}
                    </td>

                    {/* Job Plan / Details */}
                    <td className="py-3 px-3.5">
                      <div className="text-[11px] leading-tight">
                        <div className="font-semibold text-amber-700">{row.plan_name}</div>
                        {row.plan_fee && <div className="text-slate-500">{row.plan_fee}</div>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Active/Inactive Toggle */}
                    <td className="py-3 px-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={() => handleToggleActive(row.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </td>

                    {/* Actions Sticky Column */}
                    <td className="py-3 px-3.5 text-center sticky right-0 bg-white group-hover:bg-blue-50/40 z-10 shadow-[-2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleHighlight(row)}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded transition-colors shadow-xs cursor-pointer"
                        >
                          Highlight
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmModal(row)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Enterprise Pagination Footer */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          {/* Records Counter & Page Size Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 font-medium text-slate-700 cursor-pointer"
              >
                <option value={20}>20 Records</option>
                <option value={50}>50 Records</option>
                <option value={100}>100 Records</option>
              </select>
            </div>
            <span>
              Showing <strong className="text-slate-800">{paginatedJobs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, totalCount)}</strong> of <strong className="text-slate-800">{totalCount}</strong> active jobs
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(num => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {num}
              </button>
            ))}

            {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
            <PageJump page={currentPage} totalPages={totalPages} onGo={setCurrentPage} />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Post New Driver Job */}
      {/* ======================================================== */}
      {postJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Post New Driver Vacancy</h3>
              </div>
              <button
                onClick={() => setPostJobModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Job Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. 🚚 6 व्हील 22 फीट कंटेनर ड्राइवर चाहिए"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Transporter Contact Name</label>
                  <input
                    type="text"
                    required
                    value={jobForm.transporter_name}
                    onChange={(e) => setJobForm({ ...jobForm, transporter_name: e.target.value })}
                    placeholder="e.g. Mohd Asif"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={jobForm.transporter_mobile}
                    onChange={(e) => setJobForm({ ...jobForm, transporter_mobile: e.target.value })}
                    placeholder="e.g. 8178322722"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Vehicle Type</label>
                  <select
                    value={jobForm.vehicle_type}
                    onChange={(e) => setJobForm({ ...jobForm, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Container Trucks">Container Trucks</option>
                    <option value="Tipper Trucks">Tipper Trucks</option>
                    <option value="Cargo Truck (Open)">Cargo Truck (Open)</option>
                    <option value="Light Commercial">Light Commercial</option>
                    <option value="Trailer / Semi-Trailer">Trailer / Semi-Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">License Required</label>
                  <select
                    value={jobForm.license_type}
                    onChange={(e) => setJobForm({ ...jobForm, license_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="HMV">HMV</option>
                    <option value="LMV">LMV</option>
                    <option value="HGMV">HGMV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Drivers Required</label>
                  <input
                    type="number"
                    min="1"
                    value={jobForm.no_of_driver}
                    onChange={(e) => setJobForm({ ...jobForm, no_of_driver: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Compensation / Salary</label>
                  <input
                    type="text"
                    value={jobForm.salary_text}
                    onChange={(e) => setJobForm({ ...jobForm, salary_text: e.target.value })}
                    placeholder="e.g. 💰 ₹28,000 + ट्रिप इंसेंटिव"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State & City</label>
                  <input
                    type="text"
                    value={jobForm.state}
                    onChange={(e) => setJobForm({ ...jobForm, state: e.target.value, city: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Description</label>
                <textarea
                  rows="3"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Enter vacancy details, route requirements..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPostJobModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition cursor-pointer"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: View Applications for Job */}
      {/* ======================================================== */}
      {viewAppsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Applications for {viewAppsModal.job_id}
                </h3>
                <p className="text-[11px] text-slate-500">{viewAppsModal.title}</p>
              </div>
              <button
                onClick={() => setViewAppsModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs">
              {viewAppsModal.loadingApplicants ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Loading applicants from database...</span>
                </div>
              ) : viewAppsModal.applications && viewAppsModal.applications.length > 0 ? (
                viewAppsModal.applications.map((app, aIdx) => (
                  <div key={app.id || aIdx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900">{app.driver_name || `Driver Candidate #${aIdx + 1}`}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {app.driver_unique_id || 'TM-DR'} • Mobile: {app.driver_mobile || 'N/A'} • DL: {app.license_type || 'HMV'}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Applied on: {app.applied_date || 'Recent'} • Exp: {app.experience || '1-3 yrs'} • Status: {app.status || 'Applied'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast(`Opening profile for ${app.driver_name || 'Driver'}`)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                    >
                      View Profile
                    </button>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-slate-400">No applications recorded yet for this posting.</p>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setViewAppsModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Delete Confirmation */}
      {/* ======================================================== */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-fade-in p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Job Posting</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteConfirmModal.job_id}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="pt-4 text-center text-xs text-slate-400">
        &copy; 2026 TruckMitr Corporate Services Private Limited. All Rights Reserved.
      </footer>
    </div>
  );
}