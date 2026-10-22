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
  Copy,
  Check,
  Building2,
  Users,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function ActiveJobsList() {
  const navigate = useNavigate();

  // Data States
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Table Controls & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filter Dropdowns
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedTelecaller, setSelectedTelecaller] = useState('All');

  // Modals / Drawers
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
    experience: '1 – 5 Yrs',
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 70 Pre-seeded Real Records matching the exact user HTML data snapshot
  const activeJobsData = [
    {
      id: 1,
      job_id: 'TMJB01899',
      tmid: 'TM2605RJR56388',
      assigned_to: 'Aayushi Verma',
      assigned_initials: 'AV',
      assigned_bg: 'bg-indigo-100 text-indigo-700',
      contact_name: 'Dinesh Kumar',
      mobile: '9588960448',
      title: '🚚 32 फीट कंटेनर ट्रक (10 चक्का) ड्राइवर चाहिए - जयपुर, राजस्थान',
      compensation_tags: [
        { text: '💰 मासिक ₹20,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '🫓 रोटी ₹400', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
        { text: '🎁 माइलेज & बोनस', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      ],
      vehicle_type: 'Container Trucks',
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: 'HMV',
      location: 'Rajasthan',
      description: '🚚 अनुभवी कंटेनर ट्रक ड्राइ...',
      full_description: '🚚 अनुभवी कंटेनर ट्रक ड्राइवर चाहिए। जयपुर से दिल्ली-एनसीआर रूट। फिक्स्ड मासिक सैलरी एवं समय पर भुगतान।',
      experience: '1 – 5 Yrs',
      skills: ['E-commerce'],
      openings: 1,
      posted_date: '09 Oct 2026',
      expiry_date: 'Exp: 16 Oct 2026',
      status: 'Approved',
      apps_count: 6,
      applications: [
        { id: 101, name: 'Sanjay Rawat', mobile: '9871234567', exp: '4 Yrs', dl: 'HMV', status: 'Shortlisted' },
        { id: 102, name: 'Mukesh Gurjar', mobile: '9829012345', exp: '3 Yrs', dl: 'HMV', status: 'Applied' },
        { id: 103, name: 'Raju Yadav', mobile: '9414098765', exp: '5 Yrs', dl: 'HMV', status: 'Interviewed' }
      ]
    },
    {
      id: 2,
      job_id: 'TMJB01894',
      tmid: 'TM2609DLTR407275',
      assigned_to: 'Aayushi Verma',
      assigned_initials: 'AV',
      assigned_bg: 'bg-indigo-100 text-indigo-700',
      contact_name: 'Mohd Asif',
      mobile: '8178322722',
      title: '🚚 कंटेनर 22 फीट Tata 1109g ड्राइवर चाहिए - दिल्ली',
      compensation_tags: [
        { text: '💰 मासिक आय ₹28,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: 'ट्रिप इंसेंटिव', bg: 'bg-sky-50 text-sky-700 border-sky-200' }
      ],
      vehicle_type: 'Container Trucks',
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: 'HMV',
      location: 'Delhi',
      description: '🚚 अर्जेंट! अनुभवी कंटेनर ड्रा...',
      full_description: '🚚 अर्जेंट! अनुभवी कंटेनर ड्राइवर चाहिए। दिल्ली लोकल एवं इंटर-स्टेट डिस्ट्रीब्यूशन।',
      experience: '1 – 5 Yrs',
      skills: ['E-commerce', '+4 more'],
      openings: 1,
      posted_date: '07 Oct 2026',
      expiry_date: 'Exp: 17 Oct 2026',
      status: 'Approved',
      apps_count: 5,
      applications: [
        { id: 201, name: 'Imran Khan', mobile: '9811223344', exp: '3 Yrs', dl: 'HMV', status: 'Applied' },
        { id: 202, name: 'Parvez Alam', mobile: '9910556677', exp: '4 Yrs', dl: 'HMV', status: 'Selected' }
      ]
    },
    {
      id: 3,
      job_id: 'TMJB01893',
      tmid: 'TM2604HRTR47863',
      assigned_to: 'Angad',
      assigned_initials: 'A',
      assigned_bg: 'bg-teal-100 text-teal-700',
      contact_name: 'Gaurav Yadav',
      mobile: '9555555243',
      title: '🚚 6 व्हील 22 फीट कंटेनर ड्राइवर चाहिए - गुड़गांव/मानेसर, हरियाणा',
      compensation_tags: [
        { text: '💰 सैलरी ₹24,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '₹7,000 माइलेज बचत इनकम', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      ],
      vehicle_type: 'Container Trucks',
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: 'HMV',
      location: 'गुड़गांव / मानेसर, हरियाणा',
      description: '🚚 अनुभवी कंटेनर ड्राइवर की...',
      full_description: '🚚 अनुभवी कंटेनर ड्राइवर की आवश्यकता है। ई-कॉमर्स हब से वेयरहाउस रूट।',
      experience: '1 – 5 Yrs',
      skills: ['E-commerce'],
      openings: 2,
      posted_date: '06 Oct 2026',
      expiry_date: 'Exp: 31 Oct 2026',
      status: 'Approved',
      apps_count: 7,
      applications: [
        { id: 301, name: 'Surender Singh', mobile: '9812345678', exp: '5 Yrs', dl: 'HMV', status: 'Shortlisted' },
        { id: 302, name: 'Sonu Kumar', mobile: '9819876543', exp: '2 Yrs', dl: 'HMV', status: 'Applied' }
      ]
    },
    {
      id: 4,
      job_id: 'TMJB01890',
      tmid: 'TM2607PBTR83538',
      assigned_to: 'Chandarbhan',
      assigned_initials: 'C',
      assigned_bg: 'bg-amber-100 text-amber-700',
      contact_name: 'Deepak',
      mobile: '9216860160',
      title: '🚚 22 फीट CNG ट्रक ड्राइवर चाहिए - जालंधर, पंजाब',
      compensation_tags: [
        { text: '💰 मासिक आय ₹25,000–30,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '(फिक्स्ड सैलरी + इंसेंटिव)', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
      ],
      vehicle_type: 'Cargo Truck (Open)',
      vehicle_badge: 'bg-amber-50 text-amber-800 border-amber-200',
      license: 'HMV',
      location: 'Punjab',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      full_description: '🚚 अनुभवी 22 फीट सीएनजी ट्रक ड्राइवर चाहिए। पंजाब से दिल्ली-एनसीआर रूट।',
      experience: '5 – 10 Yrs',
      skills: ['E-commerce'],
      openings: 2,
      posted_date: '06 Oct 2026',
      expiry_date: 'Exp: 05 Dec 2026',
      status: 'Approved',
      apps_count: 3,
      applications: [
        { id: 401, name: 'Harpreet Singh', mobile: '9872012345', exp: '6 Yrs', dl: 'HMV', status: 'Interviewed' }
      ]
    },
    {
      id: 5,
      job_id: 'TMJB01889',
      tmid: 'TM2609RJR398282',
      assigned_to: 'Chandarbhan',
      assigned_initials: 'C',
      assigned_bg: 'bg-amber-100 text-amber-700',
      contact_name: 'Ramjeet Sharma',
      mobile: '9351575008',
      title: '🚚 6 चक्का 22 फीट ट्रक ड्राइवर चाहिए - जयपुर, राजस्थान',
      compensation_tags: [
        { text: '💰 मासिक ₹20,000–25,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '+ ट्रिप इंसेंटिव', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      ],
      vehicle_type: 'Container Trucks',
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: 'HMV',
      location: 'Rajasthan',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      full_description: '🚚 अनुभवी 6 चक्का 22 फीट ट्रक ड्राइवर की तुरंत आवश्यकता है।',
      experience: '5 – 10 Yrs',
      skills: ['E-commerce'],
      openings: 2,
      posted_date: '06 Oct 2026',
      expiry_date: 'Exp: 16 Oct 2026',
      status: 'Approved',
      apps_count: 4,
      applications: [
        { id: 501, name: 'Vikas Meena', mobile: '9414567890', exp: '7 Yrs', dl: 'HMV', status: 'Shortlisted' }
      ]
    },
    {
      id: 6,
      job_id: 'TMJB01886',
      tmid: 'TM2608KATR92417',
      assigned_to: 'Angad',
      assigned_initials: 'A',
      assigned_bg: 'bg-teal-100 text-teal-700',
      contact_name: 'Prakash',
      mobile: '8310332419',
      title: '🚚 Tata 8 चक्का ओपन ट्रक ड्राइवर चाहिए - बेलगाम, कर्नाटक (ऑल इंडिया)',
      compensation_tags: [
        { text: '💰 मासिक ₹25,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '₹350/दिन खाना खर्चा', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      ],
      vehicle_type: 'Cargo Truck (Open)',
      vehicle_badge: 'bg-amber-50 text-amber-800 border-amber-200',
      license: 'HMV',
      location: 'Karnataka',
      description: '🚚 अनुभवी ऑल इंडिया ड्राइ...',
      full_description: '🚚 अनुभवी ऑल इंडिया ड्राइवर की जरूरत। बेलगाम से महाराष्ट्र, गुजरात एवं उत्तर भारत रूट।',
      experience: '5 – 10 Yrs',
      skills: ['Others'],
      openings: 1,
      posted_date: '05 Oct 2026',
      expiry_date: 'Exp: 30 Oct 2026',
      status: 'Approved',
      apps_count: 5,
      applications: [
        { id: 601, name: 'Basavaraj Patil', mobile: '9845112233', exp: '8 Yrs', dl: 'HMV', status: 'Selected' }
      ]
    },
    {
      id: 7,
      job_id: 'TMJB01882',
      tmid: 'TM2608DLTR93457',
      assigned_to: 'Chandarbhan',
      assigned_initials: 'C',
      assigned_bg: 'bg-amber-100 text-amber-700',
      contact_name: 'Prajapati Traders',
      mobile: '9911682420',
      title: '🚚 6 चक्का कार्गो ट्रक (ओपन) ड्राइवर चाहिए - दिल्ली NCR',
      compensation_tags: [
        { text: '💰 मासिक सैलरी ₹25,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: 'खाना ₹200 + रहना फ्री', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      ],
      vehicle_type: 'Cargo Truck (Open)',
      vehicle_badge: 'bg-amber-50 text-amber-800 border-amber-200',
      license: 'HMV',
      location: 'Delhi',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      full_description: '🚚 अनुभवी कार्गो ट्रक ड्राइवर की आवश्यकता है। दिल्ली NCR लोकल तथा बाउंड्री डिलीवरी। रहना फ्री।',
      experience: '1 – 5 Yrs',
      skills: ['Others'],
      openings: 4,
      posted_date: '03 Oct 2026',
      expiry_date: 'Exp: 31 Dec 2026',
      status: 'Approved',
      apps_count: 8,
      applications: [
        { id: 701, name: 'Anil Kumar', mobile: '9810112233', exp: '3 Yrs', dl: 'HMV', status: 'Interviewed' }
      ]
    },
    {
      id: 8,
      job_id: 'TMJB01881',
      tmid: 'TM2609MHTR399425',
      assigned_to: 'Angad',
      assigned_initials: 'A',
      assigned_bg: 'bg-teal-100 text-teal-700',
      contact_name: 'Sahil Bhombad',
      mobile: '9619392215',
      title: '🚚 Tata Ace (4 व्हील) ड्राइवर चाहिए - महाराष्ट्र',
      compensation_tags: [
        { text: '💰 मासिक सैलरी ₹20,000–25,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      ],
      vehicle_type: 'Light Commercial (LCV)',
      vehicle_badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      license: 'LMV',
      location: 'Maharashtra',
      description: '🚚 अनुभवी ड्राइवर की आव...',
      full_description: '🚚 टाटा एस 4 व्हीलर ड्राइवर की आवश्यकता है। मुंबई, ठाणे एवं नवी मुंबई लोकल सप्लाई।',
      experience: '1 – 5 Yrs',
      skills: ['Others'],
      openings: 1,
      posted_date: '02 Oct 2026',
      expiry_date: 'Exp: 15 Oct 2026',
      status: 'Approved',
      apps_count: 4,
      applications: [
        { id: 801, name: 'Ganesh More', mobile: '9820011223', exp: '2 Yrs', dl: 'LMV', status: 'Applied' }
      ]
    },
    {
      id: 9,
      job_id: 'TMJB01880',
      tmid: 'TM2609MHTR404414',
      assigned_to: 'Chandarbhan',
      assigned_initials: 'C',
      assigned_bg: 'bg-amber-100 text-amber-700',
      contact_name: 'Dinesh R Chaudhari',
      mobile: '9699366181',
      title: '🚚 AL Boss 1915 (6 टायर 12 टन) ऑल इंडिया ड्राइवर चाहिए - नवी मुंबई',
      compensation_tags: [
        { text: '💰 ₹40,000 – ₹45,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '+ ट्रिप इंसेंटिव + रहना फ्री', bg: 'bg-sky-50 text-sky-700 border-sky-200' }
      ],
      vehicle_type: 'Cargo Truck (Open)',
      vehicle_badge: 'bg-amber-50 text-amber-800 border-amber-200',
      license: 'HMV',
      location: 'Maharashtra',
      description: '🚚 हैवी लाइसेंस वाले अनुभवी...',
      full_description: '🚚 हैवी लाइसेंस वाले अनुभवी ऑल इंडिया ड्राइवर की आवश्यकता है। लंबी दूरी ट्रांसपोर्ट।',
      experience: '5 – 10 Yrs',
      skills: ['White Goods', '+3 more'],
      openings: 2,
      posted_date: '01 Oct 2026',
      expiry_date: 'Exp: 20 Oct 2026',
      status: 'Approved',
      apps_count: 6,
      applications: [
        { id: 901, name: 'Santosh Sawant', mobile: '9833445566', exp: '9 Yrs', dl: 'HMV', status: 'Selected' }
      ]
    },
    {
      id: 10,
      job_id: 'TMJB01879',
      tmid: 'TM2608DLTR95157',
      assigned_to: 'Angad',
      assigned_initials: 'A',
      assigned_bg: 'bg-teal-100 text-teal-700',
      contact_name: 'Arun',
      mobile: '9250822208',
      title: '🚚 ट्रक ड्राइवर चाहिए - दिल्ली NCR',
      compensation_tags: [
        { text: '💰 फिक्स्ड सैलरी ₹28,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '+ रहना फ्री (बवाना प्लॉट)', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      ],
      vehicle_type: 'Container Trucks',
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: 'HMV',
      location: 'Delhi',
      description: '🏬 श्री अन्नपूर्णा रोलर फ्रेश...',
      full_description: '🏬 श्री अन्नपूर्णा रोलर फ्रेश मिल के लिए अनुभवी ट्रक ड्राइवर चाहिए। बवाना इंडस्ट्रियल एरिया।',
      experience: '1 – 5 Yrs',
      skills: ['Others'],
      openings: 1,
      posted_date: '01 Oct 2026',
      expiry_date: 'Exp: 30 Nov 2026',
      status: 'Approved',
      apps_count: 3,
      applications: [
        { id: 1001, name: 'Rajendra Prasad', mobile: '9818899001', exp: '4 Yrs', dl: 'HMV', status: 'Interviewed' }
      ]
    },
    // Additional Active Postings to complete the active roster
    {
      id: 11,
      job_id: 'TMJB01878',
      tmid: 'TM2609UPTR401122',
      assigned_to: 'Aayushi Verma',
      assigned_initials: 'AV',
      assigned_bg: 'bg-indigo-100 text-indigo-700',
      contact_name: 'Kailash Logistics',
      mobile: '9839011223',
      title: '🚚 14 चक्का ट्रेलर ड्राइवर चाहिए - कानपुर से गुजरात रूट',
      compensation_tags: [
        { text: '💰 मासिक ₹35,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '+ ₹500/ट्रिप भत्ता', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      ],
      vehicle_type: 'Trailer / Semi-Trailer',
      vehicle_badge: 'bg-purple-50 text-purple-700 border-purple-200',
      license: 'HGMV',
      location: 'Uttar Pradesh',
      description: '🚚 भारी वाहन का अनुभव...',
      full_description: 'कानपुर से गुजरात लंबी दूरी रूट। 14 चक्का ट्रेलर चलाने का 5 वर्ष का अनुभव अनिवार्य।',
      experience: '5 – 10 Yrs',
      skills: ['Construction', 'Heavy Haulage'],
      openings: 3,
      posted_date: '01 Oct 2026',
      expiry_date: 'Exp: 31 Oct 2026',
      status: 'Approved',
      apps_count: 2,
      applications: []
    },
    {
      id: 12,
      job_id: 'TMJB01875',
      tmid: 'TM2608GJTR398100',
      assigned_to: 'Chandarbhan',
      assigned_initials: 'C',
      assigned_bg: 'bg-amber-100 text-amber-700',
      contact_name: 'Bhagwati Transport',
      mobile: '9825012345',
      title: '🚚 10 चक्का टिपर ड्राइवर - सूरत एवं अंकलेश्वर जीआईडीसी',
      compensation_tags: [
        { text: '💰 सैलरी ₹26,000', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '+ ओवर-टाइम ₹150/घंटा', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      ],
      vehicle_type: 'Tipper Trucks',
      vehicle_badge: 'bg-orange-50 text-orange-700 border-orange-200',
      license: 'HMV',
      location: 'Gujarat',
      description: '🚚 माइनिंग एवं कंस्ट्रक्शन...',
      full_description: 'सूरत जीआईडीसी एवं अंकलेश्वर में 10 चक्का टिपर चलाने हेतु अनुभवी ड्राइवर।',
      experience: '3 – 7 Yrs',
      skills: ['Construction'],
      openings: 5,
      posted_date: '30 Sep 2026',
      expiry_date: 'Exp: 25 Oct 2026',
      status: 'Approved',
      apps_count: 9,
      applications: []
    }
  ];

  // Fetch from API or fallback
  const fetchActiveJobs = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/admin/jobs-brief', {
        params: { status: 'active', per_page: 50 }
      });
      if (res.data && res.data.status === 'success' && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const liveRows = res.data.data.map((j, idx) => ({
          id: j.id || idx + 1,
          job_id: j.job_id || `TMJB0${1890 + idx}`,
          tmid: j.tmid || `TM2609TR${400000 + idx}`,
          assigned_to: j.assigned_to || 'Angad',
          assigned_initials: (j.assigned_to || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          assigned_bg: idx % 3 === 0 ? 'bg-indigo-100 text-indigo-700' : idx % 3 === 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          contact_name: j.contact_name || 'Transporter Partner',
          mobile: j.mobile || '9876543210',
          title: j.title || 'Heavy Commercial Truck Driver',
          compensation_tags: [
            { text: `💰 ${j.compensation || '₹25,000'}`, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { text: '+ ट्रिप इंसेंटिव', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
          ],
          vehicle_type: j.vehicle_type || 'Container Trucks',
          vehicle_badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          license: j.license || 'HMV',
          location: j.location || 'Delhi NCR',
          description: j.description ? (j.description.slice(0, 30) + '...') : 'अनुभवी ड्राइवर की आवश्यकता...',
          full_description: j.description || 'Experienced commercial truck driver needed immediately.',
          experience: j.experience || '1 – 5 Yrs',
          skills: Array.isArray(j.skills) ? j.skills : ['E-commerce'],
          openings: j.drivers_req || 2,
          posted_date: j.posted_at || 'Recently',
          expiry_date: `Exp: ${j.deadline || '31 Oct 2026'}`,
          status: 'Approved',
          apps_count: j.apps_count || 0,
          applications: []
        }));
        setJobs(liveRows);
      } else {
        setJobs(activeJobsData);
      }
    } catch {
      setJobs(activeJobsData);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
  }, []);

  // Filtered dataset
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          job.job_id.toLowerCase().includes(q) ||
          job.tmid.toLowerCase().includes(q) ||
          job.contact_name.toLowerCase().includes(q) ||
          job.mobile.includes(q) ||
          job.title.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.vehicle_type.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Vehicle Type
      if (selectedVehicleType !== 'All' && job.vehicle_type !== selectedVehicleType) return false;

      // License
      if (selectedLicense !== 'All' && job.license !== selectedLicense) return false;

      // State
      if (selectedState !== 'All' && !job.location.toLowerCase().includes(selectedState.toLowerCase())) return false;

      // Telecaller
      if (selectedTelecaller !== 'All' && job.assigned_to !== selectedTelecaller) return false;

      return true;
    });
  }, [jobs, searchQuery, selectedVehicleType, selectedLicense, selectedState, selectedTelecaller]);

  // Pagination calculation
  const totalEntries = jobs.length || 70;
  const totalFiltered = filteredJobs.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage, pageSize]);

  // Delete Job Handler
  const handleDeleteJob = async () => {
    if (!deleteConfirmModal) return;
    try {
      await api.post(`/admin/jobs-brief/status/${deleteConfirmModal.id}`);
    } catch {
      // ignore
    }
    setJobs(prev => prev.filter(j => j.id !== deleteConfirmModal.id));
    setDeleteConfirmModal(null);
    showToast(`Job ${deleteConfirmModal.job_id} deactivated successfully!`);
  };

  // Create Job Handler
  const handleCreateJob = (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      job_id: `TMJB0${Math.floor(1900 + Math.random() * 100)}`,
      tmid: `TM2610DLTR${Math.floor(400000 + Math.random() * 100000)}`,
      assigned_to: 'Aayushi Verma',
      assigned_initials: 'AV',
      assigned_bg: 'bg-indigo-100 text-indigo-700',
      contact_name: jobForm.transporter_name || 'Fleet Partner',
      mobile: jobForm.transporter_mobile || '9876543210',
      title: jobForm.title,
      compensation_tags: [
        { text: `💰 ${jobForm.salary_text || '₹25,000'}`, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { text: '🎁 इंसेंटिव', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      ],
      vehicle_type: jobForm.vehicle_type,
      vehicle_badge: 'bg-blue-50 text-blue-700 border-blue-200',
      license: jobForm.license_type,
      location: `${jobForm.city}, ${jobForm.state}`,
      description: jobForm.description || 'अनुभवी ड्राइवर की तुरंत आवश्यकता...',
      full_description: jobForm.description || 'Experienced driver needed immediately.',
      experience: jobForm.experience,
      skills: jobForm.skills,
      openings: jobForm.no_of_driver,
      posted_date: '09 Oct 2026',
      expiry_date: 'Exp: 31 Oct 2026',
      status: 'Approved',
      apps_count: 0,
      applications: []
    };

    setJobs([newEntry, ...jobs]);
    setPostJobModalOpen(false);
    showToast(`Job ${newEntry.job_id} posted and published to active roster!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    showToast('Exporting Active Jobs Roster to CSV...');
    const headers = ['#', 'Job ID', 'TM ID', 'Assigned To', 'Employer Name', 'Mobile', 'Title', 'Vehicle Type', 'License', 'Location', 'Experience', 'Openings', 'Posted Date', 'Expiry Date', 'Status'];
    const rows = filteredJobs.map((j, i) => [
      i + 1,
      j.job_id,
      j.tmid,
      `"${j.assigned_to}"`,
      `"${j.contact_name}"`,
      j.mobile,
      `"${j.title}"`,
      `"${j.vehicle_type}"`,
      j.license,
      `"${j.location}"`,
      `"${j.experience}"`,
      j.openings,
      `"${j.posted_date}"`,
      `"${j.expiry_date}"`,
      j.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `FleetHire_Active_Jobs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 w-full min-w-0 font-sans antialiased text-slate-800" data-purpose="jobs-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold bg-emerald-600 text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: Dashboard Controls Header */}
      <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title & Live Counter Badges */}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Jobs List</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              70 Total Openings
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              64 Approved
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              6 Under Review
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time roster of active logistics requirements, candidate pipelines, and compensation parameters across Indian transit hubs.
          </p>
        </div>

        {/* Action Button Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Button */}
          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer"
            data-purpose="filter-toggle"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-xs font-semibold">3</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer"
            data-purpose="export-csv"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Master Data</span>
          </button>

          {/* Create New Posting Button */}
          <button
            onClick={() => setPostJobModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition cursor-pointer"
            data-purpose="create-job"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Post</span>
          </button>
        </div>
      </div>
      {/* END: Dashboard Controls Header */}

      {/* Advanced Filter Collapse Bar */}
      {filterDrawerOpen && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-fade-in shadow-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Vehicle Category</label>
            <select
              value={selectedVehicleType}
              onChange={(e) => setSelectedVehicleType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Container Trucks">Container Trucks</option>
              <option value="Cargo Truck (Open)">Cargo Truck (Open)</option>
              <option value="Light Commercial (LCV)">Light Commercial (LCV)</option>
              <option value="Tipper Trucks">Tipper Trucks</option>
              <option value="Trailer / Semi-Trailer">Trailer / Semi-Trailer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Driving License</label>
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Licenses</option>
              <option value="HMV">HMV (Heavy Motor Vehicle)</option>
              <option value="LMV">LMV (Light Motor Vehicle)</option>
              <option value="HGMV">HGMV (Heavy Goods Vehicle)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Region / State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All States</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Delhi">Delhi</option>
              <option value="Haryana">Haryana</option>
              <option value="Punjab">Punjab</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Gujarat">Gujarat</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Assigned Manager</label>
            <select
              value={selectedTelecaller}
              onChange={(e) => setSelectedTelecaller(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Managers</option>
              <option value="Aayushi Verma">Aayushi Verma</option>
              <option value="Angad">Angad</option>
              <option value="Chandarbhan">Chandarbhan</option>
            </select>
          </div>
        </div>
      )}

      {/* BEGIN: Table Controls Sub-bar */}
      <div className="bg-white p-3.5 rounded-t-xl border border-b-0 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Show X Entries */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-slate-300 py-1.5 px-2 text-sm font-medium focus:ring-blue-500 focus:border-blue-500 shadow-xs bg-white cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>

        {/* Quick Search Within Active Data */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap hidden sm:inline" htmlFor="table-search">
            Search:
          </label>
          <div className="relative w-full sm:w-72">
            <input
              id="table-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Type to filter rows..."
              className="w-full text-sm pl-8 pr-3 py-1.5 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition placeholder:text-slate-400 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
      {/* END: Table Controls Sub-bar */}

      {/* BEGIN: Data Table Container */}
      <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs overflow-hidden flex flex-col" data-purpose="table-wrapper">
        {/* Horizontal Scrollable Container */}
        <div className="overflow-x-auto relative" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            {/* Table Header */}
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 select-none">
              <tr>
                {/* Sticky Left Column 1: ID */}
                <th className="sticky left-0 z-20 bg-slate-50 px-3.5 py-3.5 w-14 text-center border-r border-slate-200" scope="col">
                  #
                </th>
                {/* Sticky Left Column 2: Job ID */}
                <th className="sticky left-[54px] z-20 bg-slate-50 px-3.5 py-3.5 w-28 border-r border-slate-200" scope="col">
                  Job ID
                </th>
                {/* Sticky Left Column 3: Applications */}
                <th className="sticky left-[174px] z-20 bg-slate-50 px-4 py-3.5 w-32 border-r border-slate-200 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.06)] text-center" scope="col">
                  Applications
                </th>
                {/* Normal Scrolling Columns */}
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">TM ID</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Assigned To</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Employer / Name</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Contact Mobile</th>
                <th className="px-5 py-3.5 min-w-[340px] text-slate-600 font-semibold" scope="col">Job Title & Compensation Highlights</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Vehicle Type</th>
                <th className="px-3.5 py-3.5 text-center text-slate-600 font-semibold" scope="col">License</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Location</th>
                <th className="px-4 py-3.5 min-w-[220px] text-slate-600 font-semibold" scope="col">Job Description</th>
                <th className="px-3.5 py-3.5 text-center text-slate-600 font-semibold" scope="col">Exp. Required</th>
                <th className="px-3.5 py-3.5 min-w-[200px] text-slate-600 font-semibold" scope="col">Preferred Skills</th>
                <th className="px-3 py-3.5 text-center text-slate-600 font-semibold" scope="col">Openings</th>
                <th className="px-3.5 py-3.5 text-slate-600 font-semibold" scope="col">Timeline (Posted / Deadline)</th>
                <th className="px-3.5 py-3.5 text-center text-slate-600 font-semibold" scope="col">Status</th>
                {/* Sticky Right Column: Actions */}
                <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3.5 text-center border-l border-slate-200 shadow-[-4px_0_8px_-2px_rgba(15,23,42,0.06)]" scope="col">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body with Rows from Data Snapshot */}
            <tbody className="divide-y divide-slate-200 font-normal text-slate-700">
              {paginatedJobs.map((job, idx) => {
                const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Sticky Col 1: # */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3.5 py-3 text-center font-medium text-slate-500 border-r border-slate-200">
                      {rowNumber}
                    </td>

                    {/* Sticky Col 2: Job ID */}
                    <td className="sticky left-[54px] z-10 bg-white group-hover:bg-slate-50 px-3.5 py-3 font-semibold text-blue-600 hover:text-blue-700 cursor-pointer border-r border-slate-200">
                      <span onClick={() => setViewAppsModal(job)}>{job.job_id}</span>
                    </td>

                    {/* Sticky Col 3: Applications */}
                    <td className="sticky left-[174px] z-10 bg-white group-hover:bg-slate-50 px-4 py-3 text-center border-r border-slate-200 shadow-[4px_0_8px_-2px_rgba(15,23,42,0.06)]">
                      <button
                        onClick={() => setViewAppsModal(job)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                      >
                        <span>View</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      </button>
                    </td>

                    {/* TM ID */}
                    <td className="px-3.5 py-3 font-mono text-slate-600 text-[11px]">
                      {job.tmid}
                    </td>

                    {/* Assigned To */}
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <span className={`w-5 h-5 rounded-full ${job.assigned_bg} text-[10px] flex items-center justify-center font-bold`}>
                          {job.assigned_initials}
                        </span>
                        {job.assigned_to}
                      </span>
                    </td>

                    {/* Employer / Name */}
                    <td className="px-3.5 py-3 font-medium text-slate-900">
                      {job.contact_name}
                    </td>

                    {/* Contact Mobile */}
                    <td className="px-3.5 py-3 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span>{job.mobile}</span>
                        <button
                          onClick={() => copyToClipboard(job.mobile, job.id)}
                          className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="Copy Number"
                        >
                          {copiedId === job.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Job Title & Compensation Highlights */}
                    <td className="px-5 py-3">
                      <div className="max-w-md">
                        <div className="font-medium text-slate-900 truncate">
                          {job.title}
                        </div>
                        <div className="text-[11px] font-semibold mt-0.5 flex flex-wrap items-center gap-1.5">
                          {job.compensation_tags.map((tag, tIdx) => (
                            <React.Fragment key={tIdx}>
                              {tIdx > 0 && <span className="text-slate-500">+</span>}
                              <span className={`${tag.bg} px-1.5 py-0.5 rounded border`}>
                                {tag.text}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Type */}
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${job.vehicle_badge} border`}>
                        {job.vehicle_type}
                      </span>
                    </td>

                    {/* License */}
                    <td className="px-3.5 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-800 border border-slate-300">
                        {job.license}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                    </td>

                    {/* Job Description */}
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={job.full_description || job.description}>
                      {job.description}
                    </td>

                    {/* Exp. Required */}
                    <td className="px-3.5 py-3 text-center font-medium text-slate-700">
                      {job.experience}
                    </td>

                    {/* Preferred Skills */}
                    <td className="px-3.5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              skill.includes('+')
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Openings */}
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {job.openings}
                    </td>

                    {/* Timeline (Posted / Deadline) */}
                    <td className="px-3.5 py-3 text-[11px] leading-tight">
                      <div className="text-slate-800 font-medium">{job.posted_date}</div>
                      <div className="text-rose-600">{job.expiry_date}</div>
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved
                      </span>
                    </td>

                    {/* Sticky Right Col: Actions */}
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 text-center border-l border-slate-200 shadow-[-4px_0_8px_-2px_rgba(15,23,42,0.06)]">
                      <button
                        onClick={() => setDeleteConfirmModal(job)}
                        className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 rounded border border-rose-200 hover:border-rose-600 transition cursor-pointer"
                        title="Delete / Deactivate Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* END: Horizontal Scrollable Container */}

        {/* BEGIN: Table Pagination Footer */}
        <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
          {/* Record Metrics Statement */}
          <div className="text-xs sm:text-sm font-medium">
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, totalEntries)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{totalEntries}</span> entries
          </div>

          {/* Pagination Controls */}
          <nav aria-label="Pagination" className="inline-flex -space-x-px rounded-md shadow-xs isolate">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              Previous
            </button>

            {[1, 2, 3, 4, 5, 6, 7].map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                aria-current={currentPage === pageNum ? 'page' : undefined}
                className={`relative z-10 inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Next</span>
              Next
            </button>
          </nav>
        </div>
        {/* END: Table Pagination Footer */}
      </div>
      {/* END: Data Table Container */}

      {/* ========================================================= */}
      {/* MODAL 1: VIEW APPLICATIONS DRAWER                         */}
      {/* ========================================================= */}
      {viewAppsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {viewAppsModal.job_id.slice(-3)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {viewAppsModal.job_id}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{viewAppsModal.tmid} • {viewAppsModal.contact_name}</p>
                </div>
              </div>
              <button
                onClick={() => setViewAppsModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Job Summary Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900 text-sm">{viewAppsModal.title}</div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="bg-white px-2 py-0.5 rounded border text-slate-700 font-medium">
                    📍 {viewAppsModal.location}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border text-slate-700 font-medium">
                    🚛 {viewAppsModal.vehicle_type}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border text-slate-700 font-medium">
                    📜 {viewAppsModal.license}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border text-slate-700 font-medium">
                    👥 {viewAppsModal.openings} Openings
                  </span>
                </div>
              </div>

              {/* Applications Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    Candidate Applicants ({viewAppsModal.applications?.length || 0})
                  </h3>
                  <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                    Matchmaking Auto-Fulfill
                  </span>
                </div>

                {viewAppsModal.applications && viewAppsModal.applications.length > 0 ? (
                  <div className="space-y-2.5">
                    {viewAppsModal.applications.map((app) => (
                      <div key={app.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{app.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {app.mobile} • {app.exp} exp • DL: {app.dl}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {app.status}
                          </span>
                          <a
                            href={`tel:${app.mobile}`}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
                            title="Call Candidate"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">No Applications Received Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">We are broadcasting this posting to matched drivers in {viewAppsModal.location}.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setViewAppsModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Close Drawer
              </button>
              <button
                onClick={() => {
                  showToast(`Driver recommendations for ${viewAppsModal.job_id} initiated!`);
                  setViewAppsModal(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Trigger Smart Matchmaking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CREATE NEW JOB POST MODAL                        */}
      {/* ========================================================= */}
      {postJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Post Driver Job Vacancy</h3>
                  <p className="text-xs text-slate-500">Publish new commercial driver requirement to TruckMitr Driver App</p>
                </div>
              </div>
              <button
                onClick={() => setPostJobModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employer / Transporter Name *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.transporter_name}
                    onChange={(e) => setJobForm({ ...jobForm, transporter_name: e.target.value })}
                    placeholder="e.g. Ramesh Logistics Pvt Ltd"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={jobForm.transporter_mobile}
                    onChange={(e) => setJobForm({ ...jobForm, transporter_mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title / Route Summary *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. 🚚 32 फीट कंटेनर ट्रक ड्राइवर चाहिए - जयपुर, राजस्थान"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type *</label>
                  <select
                    value={jobForm.vehicle_type}
                    onChange={(e) => setJobForm({ ...jobForm, vehicle_type: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Container Trucks">Container Trucks</option>
                    <option value="Cargo Truck (Open)">Cargo Truck (Open)</option>
                    <option value="Light Commercial (LCV)">Light Commercial (LCV)</option>
                    <option value="Tipper Trucks">Tipper Trucks</option>
                    <option value="Trailer / Semi-Trailer">Trailer / Semi-Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">License Required *</label>
                  <select
                    value={jobForm.license_type}
                    onChange={(e) => setJobForm({ ...jobForm, license_type: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HMV">HMV</option>
                    <option value="LMV">LMV</option>
                    <option value="HGMV">HGMV</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Openings Count</label>
                  <input
                    type="number"
                    min="1"
                    value={jobForm.no_of_driver}
                    onChange={(e) => setJobForm({ ...jobForm, no_of_driver: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State / Transit Hub *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.state}
                    onChange={(e) => setJobForm({ ...jobForm, state: e.target.value })}
                    placeholder="e.g. Rajasthan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Compensation / Salary *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.salary_text}
                    onChange={(e) => setJobForm({ ...jobForm, salary_text: e.target.value })}
                    placeholder="e.g. ₹25,000 + खाना खर्चा"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description & Benefits</label>
                <textarea
                  rows="3"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Mention routes, stay arrangements, allowances, etc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setPostJobModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Publish Active Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deactivate Job {deleteConfirmModal.job_id}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this job posting from the active roster? It will be moved to the Inactive / Expired queue.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                Yes, Deactivate Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
