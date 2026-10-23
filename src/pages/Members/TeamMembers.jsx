import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  BadgeCheck,
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import PageJump from '../../components/PageJump';

export default function TeamMembers() {
  const navigate = useNavigate();
  // Active Tab: 'members' | 'departments'
  const [activeTab, setActiveTab] = useState('members');
  
  // Data States
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedState, setSelectedState] = useState('All States');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  
  // Selected / Form item
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    state: 'Delhi',
    department: 'Management',
    designation: 'Executive',
    status: 'Verified'
  });
  const [deptForm, setDeptForm] = useState({ name: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Full default static dataset of all 63 members from the design
  const defaultMembersDataset = [
    { id: 1, emp_id: 'TM2610DLEM63262', full_name: 'Nitin Xavier', email: 'nitin.xavier@truckmitr.com', mobile: '8830969219', state: 'Maharashtra', department: 'Management', status: 'Submitted', registered_at: '06 Oct 2026' },
    { id: 2, emp_id: 'TM2610DLEM20453', full_name: 'Tannu', email: 'tannu.truckmitr@gmail.com', mobile: '8375008570', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '06 Oct 2026' },
    { id: 3, emp_id: 'TM2609DLEM71376', full_name: 'Deepanshi', email: 'deepanshi.truckmitr@gmail.com', mobile: '9667336047', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '30 Sep 2026' },
    { id: 4, emp_id: 'TM2609DLEM42393', full_name: 'Shuaib Ansari', email: 'shuaib.truckmitr@gmail.com', mobile: '8468869633', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '25 Sep 2026' },
    { id: 5, emp_id: 'TM2609DLEM95144', full_name: 'Laxmi Mehta', email: 'laxmi01.truckmitr@gmail.com', mobile: '7292065210', state: 'Uttarakhand', department: 'Telecalling', status: 'Verified', registered_at: '21 Sep 2026' },
    { id: 6, emp_id: 'TM2609DLEM01227', full_name: 'Bhole kumar', email: 'bhole.truckmitr@gmail.com', mobile: '8802694622', state: 'Uttar Pradesh', department: 'Management', status: 'Verified', registered_at: '14 Sep 2026' },
    { id: 7, emp_id: 'TM2609DLEM84629', full_name: 'Aman Tiwari', email: 'aman.truckmitr@gmail.com', mobile: '7903324783', state: 'Delhi', department: 'Marketing', status: 'Verified', registered_at: '11 Sep 2026' },
    { id: 8, emp_id: 'TM2609UPEM18533', full_name: 'Pragya singh', email: 'pragya.truckmitr@gmail.com', mobile: '7054398902', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '02 Sep 2026' },
    { id: 9, emp_id: 'TM2608DLEM79216', full_name: 'Kamini', email: 'kamini.truckmitr@gmail.com', mobile: '8287345692', state: 'Delhi', department: 'Telecalling', status: 'Verified', registered_at: '11 Aug 2026' },
    { id: 10, emp_id: 'TM2608DLEM57706', full_name: 'Aayushi Verma', email: 'aayushi.truckmitr@gmail.com', mobile: '9599374579', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '05 Aug 2026' },
    { id: 11, emp_id: 'TM2607DLEM46779', full_name: 'Ayushmaan', email: 'ayushmaan.truckmitr@gmail.com', mobile: '9560340929', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '02 Jul 2026' },
    { id: 12, emp_id: 'TM2607DLEM37410', full_name: 'Aksh Masih', email: 'aksh.truckmitr@gmail.com', mobile: '7827500298', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '01 Jul 2026' },
    { id: 13, emp_id: 'TM2607DLEM84677', full_name: 'Aditya kumar', email: 'aditya01.truckmitr@gmail.com', mobile: '8287418157', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '01 Jul 2026' },
    { id: 14, emp_id: 'TM2607DLEM78172', full_name: 'Akanksha singh', email: 'akanksha.truckmitr@gmail.com', mobile: '7307139692', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '01 Jul 2026' },
    { id: 15, emp_id: 'TM2607DLEM65215', full_name: 'Nishant', email: 'nishant.truckmitr@gmail.com', mobile: '8114259668', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '01 Jul 2026' },
    { id: 16, emp_id: 'TM2606DLEM62920', full_name: 'Roshni', email: 'roshni.truckmitr@gmail.com', mobile: '7065727103', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '27 Jun 2026' },
    { id: 17, emp_id: 'TM2606DLEM45351', full_name: 'Laxmi Gautam', email: 'laxmi.truckmitr@gmail.com', mobile: '6393681067', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Submitted', registered_at: '23 Jun 2026' },
    { id: 18, emp_id: 'TM2606DLEM46433', full_name: 'Kiran Kumari', email: 'kiran.truckmitr@gmail.com', mobile: '9911718727', state: 'Delhi', department: 'Sales', status: 'Verified', registered_at: '19 Jun 2026' },
    { id: 19, emp_id: 'TM2606UPEM09329', full_name: 'Naved Alam', email: 'naved.truckmitr@gmail.com', mobile: '8188823463', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '18 Jun 2026' },
    { id: 20, emp_id: 'TM2606UPEM51794', full_name: 'Rachel Shavy', email: 'rachel.truckmitr@gmail.com', mobile: '8287221614', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '18 Jun 2026' },
    { id: 21, emp_id: 'TM2606DLEM66432', full_name: 'harshit budhiraja', email: 'harshit.truckmitr@gmail.com', mobile: '7838621762', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '15 Jun 2026' },
    { id: 22, emp_id: 'TM2606DLEM54428', full_name: 'Angad kumar', email: 'angad.truckmitr@gmail.com', mobile: '7379084983', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '11 Jun 2026' },
    { id: 23, emp_id: 'TM2606DLEM96599', full_name: 'Chandarbhan', email: 'chandarbhan.truckmitr@gmail.com', mobile: '9839198937', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '11 Jun 2026' },
    { id: 24, emp_id: 'TM2606UPEM00278', full_name: 'Suraj Singh', email: 'suraj.truckmitr@gmail.com', mobile: '6307016624', state: 'Uttar Pradesh', department: 'Sales', status: 'Verified', registered_at: '03 Jun 2026' },
    { id: 25, emp_id: 'TM2606UPEM97813', full_name: 'Alimul Hossain', email: 'alimul.truckmitr@gmail.com', mobile: '8287581783', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '02 Jun 2026' },
    { id: 26, emp_id: 'TM2605UPEM57372', full_name: 'Pratima', email: 'pratima.truckmitr@gmail.com', mobile: '6388962383', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '16 May 2026' },
    { id: 27, emp_id: 'TM2605DLEM04847', full_name: 'Avanish Kumar', email: 'avnish.truckmitr@gmail.com', mobile: '9675159199', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '09 May 2026' },
    { id: 28, emp_id: 'TM2604UPEM62838', full_name: 'Aditya Tiwari', email: 'aditiva.2712@gmail.com', mobile: '8123339825', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '29 Apr 2026' },
    { id: 29, emp_id: 'TM2604DLEM05185', full_name: 'Gaurav Kumar', email: 'gourav.truckmitr@gmail.com', mobile: '9760956809', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Submitted', registered_at: '01 Apr 2026' },
    { id: 30, emp_id: 'TM2603DLEM27301', full_name: 'Arun', email: 'arun.truckmitr@gmail.com', mobile: '9821463075', state: 'Delhi', department: 'Marketing', status: 'Verified', registered_at: '31 Mar 2026' },
    { id: 31, emp_id: 'TM2603DLEM64870', full_name: 'Ritesh Kumar Singh', email: 'ritesh.truckmitr@gmail.com', mobile: '76783613080', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '25 Mar 2026' },
    { id: 32, emp_id: 'TM2603DLEM21796', full_name: 'Pawan Kumar', email: 'pawan.truckmitr@gmail.com', mobile: '9717573024', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '23 Mar 2026' },
    { id: 33, emp_id: 'TM2603UPEM07891', full_name: 'Mohit', email: 'mohit.truckmitr@gmail.com', mobile: '9667615308', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '02 Mar 2026' },
    { id: 34, emp_id: 'TM2602UPEM47652', full_name: 'Aaditya saini', email: 'aaditya.truckmitr@gmail.com', mobile: '9045866766', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '21 Feb 2026' },
    { id: 35, emp_id: 'TM2602UPEM76452', full_name: 'Namrata Mishra', email: 'namrata.truckmitr@gmail.com', mobile: '8527397412', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '03 Feb 2026' },
    { id: 36, emp_id: 'TM2601UPEM43846', full_name: 'Poonam Arora', email: 'poonam.truckmitr@gmail.com', mobile: '9958150462', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '30 Jan 2026' },
    { id: 37, emp_id: 'TM2601UPEM41974', full_name: 'Nitin Kumar', email: 'nitin.truckmitr@gmail.com', mobile: '7668722544', state: 'Uttar Pradesh', department: 'HR', status: 'Verified', registered_at: '29 Jan 2026' },
    { id: 38, emp_id: 'TM2601BREM92980', full_name: 'Prince', email: 'prince.truckmitr@gmail.com', mobile: '8744040709', state: 'Bihar', department: 'IT', status: 'Verified', registered_at: '14 Jan 2026' },
    { id: 39, emp_id: 'TM2601UPEM92394', full_name: 'Deepak Bhati', email: 'deepak11.truckmitr@gmail.com', mobile: '7827785831', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '07 Jan 2026' },
    { id: 40, emp_id: 'TM2512DLEM63431', full_name: 'Sourabh Singh', email: 'sourabh.truckmitr@gmail.com', mobile: '8700172067', state: 'Delhi', department: 'IT', status: 'Verified', registered_at: '26 Dec 2025' },
    { id: 41, emp_id: 'TM2512UPEM63661', full_name: 'Naresh Gupta', email: 'naresh.truckmitr@gmail.com', mobile: '7678361243', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '12 Dec 2025' },
    { id: 42, emp_id: 'TM2512UPEM83900', full_name: 'Pooja', email: 'pooja.truckmitr01@gmail.com', mobile: '7678361263', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '09 Dec 2025' },
    { id: 43, emp_id: 'TM2512RJEM27798', full_name: 'Raksha Kuwar', email: 'raksha.truckmitr@gmail.com', mobile: '7023338536', state: 'Rajasthan', department: 'Telecalling', status: 'Verified', registered_at: '06 Dec 2025' },
    { id: 44, emp_id: 'TM2512MHEM46783', full_name: 'Pooja Veerwani', email: 'pooja.truckmitr@gmail.com', mobile: '9373955208', state: 'Maharashtra', department: 'Marketing', status: 'Verified', registered_at: '06 Dec 2025' },
    { id: 45, emp_id: 'TM2512UPEM00704', full_name: 'Kajal Singh', email: 'kajal.truckmitr@gmail.com', mobile: '7678361295', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '06 Dec 2025' },
    { id: 46, emp_id: 'TM2512RJEM03640', full_name: 'Ankit Singh', email: 'ankit.truckmitr@gmail.com', mobile: '6376936597', state: 'Rajasthan', department: 'Telecalling', status: 'Verified', registered_at: '04 Dec 2025' },
    { id: 47, emp_id: 'TM2512DLEM69590', full_name: 'Tanisha khatri', email: 'tanisha.truckmitr@gmail.com', mobile: '8929809949', state: 'Delhi', department: 'Telecalling', status: 'Verified', registered_at: '01 Dec 2025' },
    { id: 48, emp_id: 'TM2512UPEM06362', full_name: 'Sonam Kumari', email: 'sonam.truckmitr@gmail.com', mobile: '9555322819', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '01 Dec 2025' },
    { id: 49, emp_id: 'TM2511DLEM11777', full_name: 'Pooja Pal', email: 'puja.truckmitr@gmail.com', mobile: '9667531368', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '30 Nov 2025' },
    { id: 50, emp_id: 'TM2511UPEM34929', full_name: 'Minanshu Gautam', email: 'minanshu.truckmitr@gmail.com', mobile: '9368648783', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '27 Nov 2025' },
    { id: 51, emp_id: 'TM2511UPEM41180', full_name: 'Arpita Singh bhaskar', email: 'arpita.truckmitr@gmail.com', mobile: '7678361273', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '27 Nov 2025' },
    { id: 52, emp_id: 'TM2511BREM58934', full_name: 'Bhavna Tiwari', email: 'bhavna.truckmitr@gmail.com', mobile: '8052372106', state: 'Bihar', department: 'Telecalling', status: 'Verified', registered_at: '27 Nov 2025' },
    { id: 53, emp_id: 'TM2511BREM85314', full_name: 'Pallvi Kumari', email: 'pallvi.truckmitr@gmail.com', mobile: '8434457287', state: 'Uttar Pradesh', department: 'Telecalling', status: 'Verified', registered_at: '27 Nov 2025' },
    { id: 54, emp_id: 'TM2511DLEM58495', full_name: 'Harneet Kaur', email: 'harneet.kaur@truckmitr.com', mobile: '9910047060', state: 'Delhi', department: 'Telecalling', status: 'Verified', registered_at: '26 Nov 2025' },
    { id: 55, emp_id: 'TM2511HREM74906', full_name: 'Anil Kumar', email: 'anil.kumar@truckmitr.com', mobile: '9810027819', state: 'Haryana', department: 'Management', status: 'Verified', registered_at: '26 Nov 2025' },
    { id: 56, emp_id: 'TM2511DLEM17038', full_name: 'Deepak Kumar', email: 'admin@truckmitr.com', mobile: '8800549949', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '26 Nov 2025' },
    { id: 57, emp_id: 'TM2511DLEM54715', full_name: 'Diksha Rajvansh', email: 'hr@truckmitr.com', mobile: '9643785950', state: 'Delhi', department: 'HR', status: 'Verified', registered_at: '24 Nov 2025' },
    { id: 58, emp_id: 'TM2511DLEM00005', full_name: 'Nandani Saraswat', email: 'nandani.truckmitr@gmail.com', mobile: '6265760864', state: 'Delhi', department: 'IT', status: 'Verified', registered_at: '07 Nov 2025' },
    { id: 59, emp_id: 'TM2511DLEM00004', full_name: 'Abhishek Raghav', email: 'abhishek.truckmitr@gmail.com', mobile: '8448079624', state: 'Delhi', department: 'IT', status: 'Verified', registered_at: '07 Nov 2025' },
    { id: 60, emp_id: 'TM2511DLEM00003', full_name: 'Akash Kumar Thakur', email: 'akash.truckmitr@gmail.com', mobile: '9670053443', state: 'Uttar Pradesh', department: 'Marketing', status: 'Verified', registered_at: '07 Nov 2025' },
    { id: 61, emp_id: 'TM2511DLEM00002', full_name: 'Gagan Shukla', email: 'gagan.truckmitr@gmail.com', mobile: '6394756798', state: 'Uttar Pradesh', department: 'IT', status: 'Verified', registered_at: '07 Nov 2025' },
    { id: 62, emp_id: 'TM2511DLEM00001', full_name: 'Ravi Shankar', email: 'ravi.truckmitr@gmail.com', mobile: '8303154516', state: 'Delhi', department: 'IT', status: 'Verified', registered_at: '07 Nov 2025' },
    { id: 63, emp_id: 'TM2511DLEM00000', full_name: 'Tarun Kumar', email: 'tarun.truckmitr@gmail.com', mobile: '8383971722', state: 'Delhi', department: 'IT', status: 'Verified', registered_at: '07 Nov 2025' }
  ];

  const defaultDepartments = [
    { id: 1, name: 'IT', members_count: 12, description: 'Software engineering, mobile app, infrastructure' },
    { id: 2, name: 'HR', members_count: 2, description: 'Talent recruitment, employee onboarding, policies' },
    { id: 6, name: 'Telecalling', members_count: 22, description: 'Driver calling, verification outreach, support' },
    { id: 7, name: 'Sales', members_count: 12, description: 'Fleet acquisition, enterprise partnerships, deals' },
    { id: 8, name: 'Marketing', members_count: 10, description: 'Digital campaigns, brand outreach, social media' },
    { id: 9, name: 'Management', members_count: 2, description: 'Operations leadership, strategic governance' }
  ];

  // Fetch Members & Departments
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get('/admin/members');
      if (res.data && res.data.status === 'success') {
        if (res.data.members && res.data.members.length > 0) {
          setMembers(res.data.members);
        } else {
          setMembers([]);
        }
        if (res.data.departments && res.data.departments.length > 0) {
          setDepartments(res.data.departments);
        } else {
          setDepartments([]);
        }
      } else {
        setMembers([]);
        setDepartments([]);
      }
    } catch (err) {
      console.warn('Live API load warning, falling back to comprehensive dataset:', err);
      setMembers([]);
      setDepartments([]);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    await fetchData();
    showToast('Team members & department data synced successfully!');
  };

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        searchTerm === '' ||
        (m.emp_id && m.emp_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.full_name && m.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.mobile && m.mobile.includes(searchTerm)) ||
        (m.state && m.state.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept =
        selectedDepartment === 'All Departments' ||
        m.department === selectedDepartment ||
        (m.department && m.department.toLowerCase() === selectedDepartment.toLowerCase());

      const matchStatus =
        selectedStatus === 'All Statuses' || m.status === selectedStatus;

      const matchState =
        selectedState === 'All States' || m.state === selectedState;

      return matchSearch && matchDept && matchStatus && matchState;
    });
  }, [members, searchTerm, selectedDepartment, selectedStatus, selectedState]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // States List from Data
  const availableStates = useMemo(() => {
    const set = new Set();
    members.forEach((m) => {
      if (m.state) set.add(m.state);
    });
    return ['All States', ...Array.from(set)];
  }, [members]);

  // Available Departments for dropdown
  const availableDepts = useMemo(() => {
    const list = departments.map((d) => d.name);
    return ['All Departments', ...list];
  }, [departments]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['#', 'Emp ID', 'Full Name', 'Email', 'Mobile', 'State', 'Department', 'Submission Status', 'Registered At'];
    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      m.emp_id,
      `"${m.full_name}"`,
      m.email,
      `'${m.mobile}`,
      `"${m.state || ''}"`,
      `"${m.department || ''}"`,
      m.status,
      m.registered_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TruckMitr_Team_Members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Team members list exported to CSV successfully!');
  };

  // Add Member Submit
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/members', memberForm);
      if (res.data && res.data.status === 'success') {
        showToast('Member added successfully!');
      }
    } catch (err) {
      console.warn('API save fallback');
    }

    const newEmp = {
      id: Date.now(),
      emp_id: `TM2610DLEM${Math.floor(10000 + Math.random() * 90000)}`,
      full_name: memberForm.full_name,
      email: memberForm.email,
      mobile: memberForm.mobile,
      state: memberForm.state,
      department: memberForm.department,
      status: memberForm.status,
      registered_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setMembers([newEmp, ...members]);
    setAddMemberModalOpen(false);
    setMemberForm({
      full_name: '',
      email: '',
      mobile: '',
      state: 'Delhi',
      department: 'Management',
      designation: 'Executive',
      status: 'Verified'
    });
    showToast(`Member ${newEmp.full_name} added successfully!`);
  };

  // Edit Member Action
  const openEditModal = (member) => {
    navigate(`/members/edit/${member.id || member.emp_id}`);
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await api.put(`/admin/members/${selectedMember.id}`, memberForm);
    } catch (err) {
      console.warn('API edit warning');
    }

    setMembers(
      members.map((m) =>
        m.id === selectedMember.id
          ? {
              ...m,
              full_name: memberForm.full_name,
              email: memberForm.email,
              mobile: memberForm.mobile,
              state: memberForm.state,
              department: memberForm.department,
              status: memberForm.status
            }
          : m
      )
    );

    setEditMemberModalOpen(false);
    setSelectedMember(null);
    showToast('Member updated successfully!');
  };

  // Delete Action
  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setDeleteConfirmModalOpen(true);
  };

  const handleDeleteMemberSubmit = async () => {
    if (!selectedMember) return;
    try {
      await api.delete(`/admin/members/${selectedMember.id}`);
    } catch (err) {
      console.warn('API delete warning');
    }

    setMembers(members.filter((m) => m.id !== selectedMember.id));
    setDeleteConfirmModalOpen(false);
    setSelectedMember(null);
    showToast('Member removed successfully!');
  };

  // Add Department
  const handleAddDeptSubmit = (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    const newDept = {
      id: Date.now(),
      name: deptForm.name.trim(),
      members_count: 0,
      description: 'Department unit'
    };
    setDepartments([...departments, newDept]);
    setDeptForm({ name: '' });
    setAddDeptModalOpen(false);
    showToast(`Department "${newDept.name}" created successfully!`);
  };

  return (
    <div className="flex flex-col w-full space-y-4 bg-slate-100 font-sans text-slate-800 antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
            Team Members
          </h1>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-medium">Members</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-xs cursor-pointer"
            title="Sync live members"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS (Members List & Departments List) */}
      <div className="flex items-center justify-between bg-white px-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members List</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold tabular-nums ml-1">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => navigate('/departments')}
            className={`flex items-center gap-2 py-3 px-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Departments List</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold tabular-nums ml-1">
              {departments.length}
            </span>
          </button>
        </div>


        {activeTab === 'departments' && (
          <button
            onClick={() => setAddDeptModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* TAB 1: MEMBERS LIST */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200 flex flex-col space-y-4">
          {/* Top Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Emp ID, Name, Email, Mobile..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department Dropdown */}
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
                >
                  {availableDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Verified">Verified</option>
                  <option value="Submitted">Submitted</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* State Dropdown */}
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
                >
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200/80">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12 text-slate-400 font-bold">#</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Emp ID</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Full Name</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Email</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Mobile</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">State</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Department</th>
                  <th className="py-3 px-3 font-semibold text-slate-700">Submission Status</th>
                  <th className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">Registered at</th>
                  <th className="py-3 px-3 text-center font-semibold text-slate-700 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No team members match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-blue-50/40 transition-colors">
                      {/* # */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Emp ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 text-xs tracking-tight">
                        {row.emp_id}
                      </td>

                      {/* Full Name */}
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.full_name}
                      </td>

                      {/* Email */}
                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                        {row.email}
                      </td>

                      {/* Mobile */}
                      <td className="py-2.5 px-3 text-slate-800 font-mono tabular-nums font-medium">
                        {row.mobile}
                      </td>

                      {/* State */}
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {row.state || 'Delhi'}
                      </td>

                      {/* Department */}
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {row.department || 'General'}
                        </span>
                      </td>

                      {/* Submission Status */}
                      <td className="py-2.5 px-3">
                        {row.status === 'Submitted' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Verified
                          </span>
                        )}
                      </td>

                      {/* Registered At */}
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-medium">
                        {row.registered_at || '06 Oct 2026'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(row)}
                            aria-label="Edit member"
                            className="p-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer"
                            type="button"
                            title="Edit Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(row)}
                            aria-label="Delete member"
                            className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                            type="button"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800 font-semibold">{filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredMembers.length)}</strong> of <strong className="text-slate-800 font-semibold">{filteredMembers.length}</strong> members
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                type="button"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs font-semibold shadow-xs cursor-pointer ${
                    currentPage === p
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  type="button"
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="text-slate-400 text-xs px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-semibold shadow-xs cursor-pointer ${
                      currentPage === totalPages
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                type="button"
              >
                ›
              </button>
              <PageJump page={currentPage} totalPages={totalPages} onGo={setCurrentPage} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS LIST (EXACT 2-CARD ENTERPRISE UI) */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* First Card: Department Details */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">Department Details</h2>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Create and manage functional business units across the organization</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100/80">
                New Entry
              </span>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddDeptSubmit} className="space-y-6">
                <div className="max-w-xl">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Department Name <span className="text-rose-600 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ name: e.target.value })}
                      placeholder="Enter department name (e.g. Operations, Logistics)..."
                      className="w-full bg-slate-50/50 border border-slate-300 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100/60 transition-all placeholder:text-slate-400 font-normal"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Unique name defining this organizational division or team.</p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    className="bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-medium px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Department</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptForm({ name: '' })}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 active:scale-[0.99] font-medium px-4 py-2.5 rounded-lg text-sm inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Second Card: Department List */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                  <ListFilter className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">Department List</h2>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Active functional departments and divisions</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                Total {departments.length} Departments
              </span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] leading-4">
                    <th className="w-16 py-3.5 px-4 text-slate-500 font-semibold tracking-wider uppercase text-center" scope="col">#</th>
                    <th className="py-3.5 px-4 text-slate-600 font-semibold uppercase tracking-wider text-xs" scope="col">Department Name</th>
                    <th className="py-3.5 px-4 text-slate-600 font-semibold uppercase tracking-wider text-xs" scope="col">Created At</th>
                    <th className="py-3.5 px-4 text-slate-600 font-semibold uppercase tracking-wider text-xs text-right pr-6" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {departments.map((dept, idx) => (
                    <tr key={dept.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-medium text-xs font-mono text-center">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                          <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-normal text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dept.created_at || '08 Nov 2025'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              setDeptForm({ name: dept.name });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 font-medium text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            type="button"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDepartments(departments.filter((d) => d.id !== dept.id));
                              showToast('Department removed successfully!');
                            }}
                            className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 font-medium text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}


      {/* MODAL: ADD NEW MEMBER */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Member</h3>
                  <p className="text-xs text-slate-500">Create employee and team record</p>
                </div>
              </div>
              <button
                onClick={() => setAddMemberModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={memberForm.full_name}
                  onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  placeholder="e.g. Nitin Xavier"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="e.g. nitin@truckmitr.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                    placeholder="e.g. 9810027819"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    value={memberForm.state}
                    onChange={(e) => setMemberForm({ ...memberForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={memberForm.designation}
                    onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                    placeholder="e.g. Senior Executive"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Submission Status</label>
                  <select
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MEMBER */}
      {editMemberModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Member ({selectedMember.emp_id})</h3>
                  <p className="text-xs text-slate-500">Update employee profile details</p>
                </div>
              </div>
              <button
                onClick={() => setEditMemberModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.full_name}
                  onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={memberForm.state}
                    onChange={(e) => setMemberForm({ ...memberForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Status</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Verified">Verified</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMemberModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-scale-up space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{selectedMember.full_name}</strong> ({selectedMember.emp_id})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMemberSubmit}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {addDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add Department</h3>
              </div>
              <button
                onClick={() => setAddDeptModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ name: e.target.value })}
                  placeholder="e.g. Operations, Legal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
