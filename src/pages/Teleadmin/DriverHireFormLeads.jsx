import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  RotateCw,
  Search,
  RotateCcw,
  MapPin,
  User,
  ChevronDown,
  Phone,
  CheckCircle2,
  Briefcase,
  Truck,
  IndianRupee,
  FileText,
  X,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Loader2
} from 'lucide-react';

export default function DriverHireFormLeads() {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const itemsPerPage = 6;

  // UI State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);

  // Available Telechamps
  const teamMembers = ['Angad', 'Kamini', 'Sonam', 'Pratima', 'Aditya Kumar', 'Chandarbhan', 'Raksha'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchDriverHireLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/driver-hire-leads', {
        params: {
          search: searchQuery.trim(),
          location: locationQuery.trim(),
          team_member: selectedTeamMember,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data?.leads?.data) {
        const mapped = res.data.data.leads.data.map(l => ({
          id: `#${l.id}`,
          numId: l.id,
          date: l.created_at ? new Date(l.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '12 Oct 2026',
          customerName: l.transporter_name || l.driver_name || 'Customer',
          company: l.code || '',
          phone: l.transporter_mobile || l.driver_mobile || '--',
          tmid: l.transporter_tmid || l.driver_tmid || `TM${l.id}`,
          registeredDate: 'Recent',
          jobsPosted: 1,
          driversNeeded: 1,
          vehicle: l.vehicle || 'Trailer Trucks',
          salary: l.salary || '—',
          location: l.job_location || 'India',
          notes: `${l.driver_name || 'Driver'} applied for ${l.job_title || 'Driver Job'}`,
          assignedTo: l.assigned_to || 'Angad'
        }));
        setLeads(mapped);
        setTotalLeadsCount(res.data.data.leads.total);
        setApiTotalPages(res.data.data.leads.last_page);
      }
    } catch (err) {
      console.error('Failed to load driver hire leads:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDriverHireLeads();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, selectedTeamMember, currentPage]);

  const handleRefresh = () => {
    fetchDriverHireLeads();
    showToast('Driver hire form leads refreshed successfully!');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedTeamMember('');
    setCurrentPage(1);
    showToast('Filters reset.');
  };

  // Driver Hire Form Leads Dataset (Faithfully matching the user's screenshot)
  const [leads, setLeads] = useState([
    {
      id: '#373',
      numId: 373,
      date: '12 OCT 2026, 02:00 PM',
      customerName: 'Sachin mishra',
      company: '',
      phone: '7828930880',
      tmid: 'TM2610CGTR408876',
      registeredDate: '04 Oct 2026, 03:46 PM',
      jobsPosted: 1,
      driversNeeded: 1,
      vehicle: 'Trailer Trucks',
      salary: '50000-55000',
      location: 'Chhattisgarh',
      notes: 'Contact me -7828930880',
      assignedTo: 'Angad'
    },
    {
      id: '#372',
      numId: 372,
      date: '12 OCT 2026, 01:59 PM',
      customerName: 'Sachin mishra',
      company: '',
      phone: '7828930880',
      tmid: 'TM2610CGTR408876',
      registeredDate: '04 Oct 2026, 03:46 PM',
      jobsPosted: 1,
      driversNeeded: 1,
      vehicle: 'Trailer Trucks',
      salary: '45000-50000',
      location: 'Chhattisgarh',
      notes: 'Contact me -7828930880',
      assignedTo: 'Angad'
    },
    {
      id: '#371',
      numId: 371,
      date: '11 OCT 2026, 11:50 PM',
      customerName: 'Dilip',
      company: 'A transport',
      phone: '9881966454',
      tmid: 'TM2605MHTR54519',
      registeredDate: '21 May 2026, 02:19 PM',
      jobsPosted: 1,
      driversNeeded: 1,
      vehicle: 'Light Open Body Trucks',
      salary: '20000-25000',
      location: 'Maharashtra',
      notes: 'Call me 9881966454',
      assignedTo: 'Angad'
    },
    {
      id: '#370',
      numId: 370,
      date: '11 OCT 2026, 06:51 PM',
      customerName: 'Sachin mishra',
      company: '',
      phone: '7828930880',
      tmid: 'TM2610CGTR408876',
      registeredDate: '04 Oct 2026, 03:46 PM',
      jobsPosted: 1,
      driversNeeded: 1,
      vehicle: 'Trailer Trucks',
      salary: '55000-60000',
      location: 'Chhattisgarh',
      notes: 'Contact me -7828930880',
      assignedTo: 'Angad'
    },
    {
      id: '#369',
      numId: 369,
      date: '11 OCT 2026, 04:30 PM',
      customerName: 'Rajesh Chawla',
      company: 'Om Logistics Fleet',
      phone: '9811234567',
      tmid: 'TM2609DLTR39011',
      registeredDate: '15 Sep 2026, 11:20 AM',
      jobsPosted: 3,
      driversNeeded: 2,
      vehicle: 'Container Trucks',
      salary: '35000-40000',
      location: 'Delhi NCR',
      notes: 'Urgent requirement for Delhi-Mumbai route container driver',
      assignedTo: 'Kamini'
    },
    {
      id: '#368',
      numId: 368,
      date: '11 OCT 2026, 01:15 PM',
      customerName: 'Mahendra Patel',
      company: 'Patel Roadways',
      phone: '9825012345',
      tmid: 'TM2608GJTR28901',
      registeredDate: '22 Aug 2026, 04:10 PM',
      jobsPosted: 2,
      driversNeeded: 3,
      vehicle: 'Multi-Axle Commercial Trucks',
      salary: '40000-45000',
      location: 'Gujarat',
      notes: 'Looking for verified and experienced heavy trailer drivers',
      assignedTo: 'Sonam'
    },
    {
      id: '#367',
      numId: 367,
      date: '10 OCT 2026, 05:40 PM',
      customerName: 'Balbir Singh',
      company: 'Khalsa Freight Logistics',
      phone: '9876098765',
      tmid: 'TM2607PBTR18920',
      registeredDate: '10 Jul 2026, 09:45 AM',
      jobsPosted: 4,
      driversNeeded: 1,
      vehicle: 'Heavy Trailer 18-Wheeler',
      salary: '48000-52000',
      location: 'Punjab',
      notes: 'Immediate joining required. Clean driving history mandatory',
      assignedTo: 'Pratima'
    }
  ]);

  // Handle In-Table Telechamp Reassignment
  const handleAssigneeChange = (leadId, newAssignee) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, assignedTo: newAssignee } : l))
    );
    showToast(`Lead ${leadId} assigned to ${newAssignee}!`);
  };

  // Filter Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search by Name or Mobile
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.customerName.toLowerCase().includes(query);
        const matchesPhone = lead.phone.includes(query);
        const matchesTmid = lead.tmid.toLowerCase().includes(query);
        const matchesId = lead.id.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesTmid && !matchesId) {
          return false;
        }
      }

      // Filter by Location
      if (locationQuery.trim()) {
        const locQuery = locationQuery.toLowerCase().trim();
        if (!lead.location.toLowerCase().includes(locQuery)) {
          return false;
        }
      }

      // Filter by Team Member
      if (selectedTeamMember && lead.assignedTo !== selectedTeamMember) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, locationQuery, selectedTeamMember]);

  // Pagination
  const totalPages = apiTotalPages > 1 ? apiTotalPages : (Math.ceil(filteredLeads.length / itemsPerPage) || 1);
  const paginatedLeads = filteredLeads;

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Title & Top Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Driver Hire Form Leads</h1>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              MANAGE REQUIREMENTS SUBMITTED FROM THE PUBLIC WEBSITE
            </p>
          </div>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={handleRefresh}
          title="Refresh Leads"
          className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors active:scale-95 cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search by Name or Mobile */}
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name or mobile..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Location */}
          <div className="relative w-full md:w-56">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => { setLocationQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Filter by location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {locationQuery && (
              <button
                onClick={() => setLocationQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Team Member Dropdown */}
          <div className="relative w-full md:w-60">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-3.5 h-3.5" />
            </span>
            <select
              value={selectedTeamMember}
              onChange={(e) => { setSelectedTeamMember(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">Filter by Team Member</option>
              {teamMembers.map((member, idx) => (
                <option key={idx} value={member}>{member}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="w-full md:w-auto px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Driver Hire Form Leads Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6 font-bold w-40">ID & DATE</th>
                <th className="py-3.5 px-6 font-bold w-80">CUSTOMER</th>
                <th className="py-3.5 px-6 font-bold w-64">REQUIREMENT</th>
                <th className="py-3.5 px-6 font-bold">LOCATION / NOTES</th>
                <th className="py-3.5 px-6 font-bold text-center w-48">ASSIGNED TO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No driver hire form leads found matching criteria.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-blue-600 hover:underline font-bold mt-1 cursor-pointer"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID & DATE */}
                    <td className="py-5 px-6 align-top">
                      <div className="font-bold text-slate-800 text-sm">{lead.id}</div>
                      <div className="text-[11px] text-slate-400 uppercase font-medium mt-1">
                        {lead.date}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="py-5 px-6 align-top space-y-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{lead.customerName}</div>
                        {lead.company && (
                          <div className="text-xs text-slate-500 font-medium">{lead.company}</div>
                        )}
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-semibold mt-1"
                        >
                          <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{lead.phone}</span>
                        </a>
                      </div>

                      {/* Registered User Box */}
                      <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-2.5 space-y-0.5">
                        <div className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          <span>Registered User (TMID: {lead.tmid})</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Reg: {lead.registeredDate}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Jobs Posted: {lead.jobsPosted}
                        </div>
                      </div>
                    </td>

                    {/* REQUIREMENT */}
                    <td className="py-5 px-6 align-top space-y-1">
                      <div className="font-bold text-slate-900 text-xs">
                        Drivers Needed: {lead.driversNeeded}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Vehicle: {lead.vehicle}
                      </div>
                      <div className="font-bold text-emerald-600 text-xs mt-1">
                        Salary: {lead.salary}
                      </div>
                    </td>

                    {/* LOCATION / NOTES */}
                    <td className="py-5 px-6 align-top space-y-1">
                      <div className="font-bold text-slate-800 text-xs">
                        {lead.location}
                      </div>
                      {lead.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                          "{lead.notes}"
                        </div>
                      )}
                    </td>

                    {/* ASSIGNED TO */}
                    <td className="py-5 px-6 align-top text-center">
                      <div className="inline-block relative">
                        <select
                          value={lead.assignedTo}
                          onChange={(e) => handleAssigneeChange(lead.id, e.target.value)}
                          className="w-36 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 text-center shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                        >
                          {teamMembers.map((member, idx) => (
                            <option key={idx} value={member}>
                              {member}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLeads.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
            <div>
              Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
              </span> of <span className="font-semibold text-slate-800">{filteredLeads.length}</span> leads
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
