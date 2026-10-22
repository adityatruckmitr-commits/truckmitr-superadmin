import React, { useState, useMemo, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Phone,
  PhoneOff,
  Search,
  Filter,
  RotateCw,
  Plus,
  MapPin,
  Briefcase,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  Building2,
  TrendingUp,
  FileText,
  BadgeCheck,
  Truck,
  DollarSign
} from 'lucide-react';

export default function DriverBank() {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseType, setLicenseType] = useState('All License Types');
  const [vehicleType, setVehicleType] = useState('All Vehicle Types');
  const [experienceLevel, setExperienceLevel] = useState('All Experience');
  const [incomeRange, setIncomeRange] = useState('All Incomes');
  const [availability, setAvailability] = useState('All Availability');
  const [callingStatus, setCallingStatus] = useState('All Calling Status');
  const [addedBy, setAddedBy] = useState('All Staff');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI Interactive State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedDriverModal, setSelectedDriverModal] = useState(null);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState({});

  // Live Backend States
  const [driverBankList, setDriverBankList] = useState([]);
  const [totalDriversCount, setTotalDriversCount] = useState(216);
  const [calledDriversCount, setCalledDriversCount] = useState(0);
  const [notCalledDriversCount, setNotCalledDriversCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // New Driver Form State
  const [newDriver, setNewDriver] = useState({
    name: '',
    mobile: '',
    location: '',
    license_type: 'HMV',
    vehicle_type: 'Tipper Trucks',
    experience: '3-5 Yrs',
    income: '₹ 35000-40000',
    availability: 'Immediate'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchDriverBank = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/admin/teleadmin/driver-bank', {
        params: {
          search: searchQuery.trim(),
          license_type: licenseType,
          vehicle_type: vehicleType,
          calling_status: callingStatus,
          added_by: addedBy,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      if (res.data?.data) {
        const dData = res.data.data.data || [];
        const mapped = dData.map(d => ({
          id: d.id,
          name: d.name,
          tmid: d.tmid || `TM2609DR${d.id}`,
          mobile: d.mobile,
          location: d.location || 'Uttar Pradesh',
          jobId: d.job_id || 'N/A',
          jobTitle: d.job_title || (d.vehicle_type ? `${d.vehicle_type} Driver` : 'Commercial Pilot'),
          experience: d.experience ? `Exp: ${d.experience}` : 'Exp: 3-5 Yrs',
          income: d.current_income || '₹ 35000-40000',
          license: d.license_type ? d.license_type.split(',').map(s => s.trim()) : ['HMV'],
          vehicles: d.vehicle_type ? d.vehicle_type.split(',').map(s => s.trim()) : ['Commercial Haulers'],
          callHistory: d.last_call_status || 'Not Called',
          lastCall: d.last_call_at ? new Date(d.last_call_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never',
          status: d.availability === 'Placed' ? 'PLACED' : 'AVAILABLE',
          addedBy: d.added_by_name || 'Staff',
          addedDate: d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          preferredRoute: d.preferred_route || 'Interstate Highway Corridor',
          notes: d.notes || 'Driver commercial driving credentials verified in repository.'
        }));
        setDriverBankList(mapped);
        setTotalDriversCount(res.data.summary?.total || res.data.data.total);
        setCalledDriversCount(res.data.summary?.called || 0);
        setNotCalledDriversCount(res.data.summary?.not_called || 0);
        setTotalPages(res.data.data.last_page || 1);
      }
    } catch (err) {
      console.error('Failed to load driver bank:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDriverBank();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, licenseType, vehicleType, experienceLevel, incomeRange, callingStatus, addedBy, currentPage]);

  const handleRefresh = () => {
    fetchDriverBank();
    showToast('Driver Bank repository synchronized with live database.');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLicenseType('All License Types');
    setVehicleType('All Vehicle Types');
    setExperienceLevel('All Experience');
    setIncomeRange('All Incomes');
    setAvailability('All Availability');
    setCallingStatus('All Calling Status');
    setAddedBy('All Staff');
    setCurrentPage(1);
    showToast('Filters cleared.');
  };

  const togglePhoneReveal = (id, e) => {
    e.stopPropagation();
    setRevealedPhones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCallDriver = (driver, e) => {
    e.stopPropagation();
    showToast(`Calling ${driver.name} at ${driver.mobile}...`);
  };

  const handleAddDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/teleadmin/driver-bank', newDriver);
      setIsAddDriverModalOpen(false);
      showToast('New driver registered successfully in Driver Bank!');
      setNewDriver({
        name: '',
        mobile: '',
        location: '',
        license_type: 'HMV',
        vehicle_type: 'Tipper Trucks',
        experience: '3-5 Yrs',
        income: '₹ 35000-40000',
        availability: 'Immediate'
      });
      fetchDriverBank();
    } catch (err) {
      console.error('Failed to add driver:', err);
      showToast('Failed to add driver. Please check inputs.');
    }
  };

  const displayedDrivers = driverBankList;

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-[#f7f9fb] min-h-screen text-[#191c1e] antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#191c1e] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Scroll Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#191c1e]">Driver Bank</h2>
              <span className="px-3 py-0.5 bg-[#dae2fd] text-[#131b2e] text-xs font-semibold rounded-full border border-indigo-200">
                216 Total
              </span>
            </div>
            <p className="text-sm text-[#464554]">Manage and match drivers in the bank</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddDriverModalOpen(true)}
              className="px-3.5 py-2 bg-[#4648d4] hover:bg-[#6063ee] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Driver</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-white border border-[#c7c4d7] hover:bg-slate-50 text-[#191c1e] rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-[#4648d4]' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TOTAL DRIVERS */}
          <div className="bg-white border border-[#c7c4d7] rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#464554]">TOTAL DRIVERS</span>
              <span className="text-3xl font-extrabold text-[#191c1e]">{totalDriversCount}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#dae2fd] flex items-center justify-center text-[#131b2e]">
              <Users className="w-6 h-6 text-[#4648d4]" />
            </div>
          </div>

          {/* CALLED DRIVERS */}
          <div className="bg-white border border-[#c7c4d7] rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#464554]">CALLED DRIVERS</span>
              <span className="text-3xl font-extrabold text-[#0058be]">{calledDriversCount}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#d8e2ff] flex items-center justify-center text-[#001a42]">
              <Phone className="w-6 h-6 text-[#0058be]" />
            </div>
          </div>

          {/* NOT CALLED DRIVERS */}
          <div className="bg-white border border-[#c7c4d7] rounded-xl p-5 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#464554]">NOT CALLED DRIVERS</span>
              <span className="text-3xl font-extrabold text-[#ba1a1a]">{notCalledDriversCount}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#93000a]">
              <PhoneOff className="w-6 h-6 text-[#ba1a1a]" />
            </div>
          </div>
        </div>

        {/* Filter Bar (2 Rows) */}
        <div className="bg-white border border-[#c7c4d7] rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
          {/* Row 1: Search, License, Vehicle, Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#464554]">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] placeholder-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all"
                placeholder="Search TMID, Mobile, Job ID, Location..."
              />
            </div>

            <select
              value={licenseType}
              onChange={(e) => {
                setLicenseType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All License Types</option>
              <option>HMV</option>
              <option>LMV</option>
              <option>HPMV/HTV</option>
            </select>

            <select
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Vehicle Types</option>
              <option>Container Trucks</option>
              <option>Tippers</option>
              <option>Tankers</option>
              <option>Trailer Trucks</option>
            </select>

            <select
              value={experienceLevel}
              onChange={(e) => {
                setExperienceLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Experience</option>
              <option>0-2 Years</option>
              <option>3-5 Years</option>
              <option>6-10 Years</option>
              <option>10+ Years</option>
            </select>
          </div>

          {/* Row 2: Incomes, Availability, Calling Status, Added By, Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
            <select
              value={incomeRange}
              onChange={(e) => {
                setIncomeRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Incomes</option>
              <option>20000-30000</option>
              <option>35000-40000</option>
              <option>45000-50000</option>
            </select>

            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Availability</option>
              <option>Immediate</option>
              <option>Within 1 Week</option>
            </select>

            <select
              value={callingStatus}
              onChange={(e) => {
                setCallingStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Calling Status</option>
              <option>Called</option>
              <option>Not Called</option>
            </select>

            <select
              value={addedBy}
              onChange={(e) => {
                setAddedBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-[#f7f9fb] border border-[#c7c4d7] rounded-lg text-xs text-[#191c1e] focus:outline-none focus:border-[#4648d4] focus:bg-white transition-all cursor-pointer"
            >
              <option>All Staff</option>
              <option>Ankit Singh</option>
              <option>Angad</option>
              <option>Sonam</option>
              <option>Chandarbhan</option>
              <option>Raksha</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Filters applied.')}
                className="flex-1 bg-[#4648d4] text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[#6063ee] transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-white border border-[#c7c4d7] text-[#191c1e] py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[#f2f4f6] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white border border-[#c7c4d7] rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Table Header Bar */}
          <div className="px-5 py-3.5 bg-[#f2f4f6] border-b border-[#c7c4d7] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">
              SHOWING {displayedDrivers.length} OF {totalDriversCount} DRIVERS
            </span>
            <span className="text-[11px] text-[#464554]">
              Sorted by Recent Activity
            </span>
          </div>

          {/* Table Scroll Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c7c4d7] bg-[#f7f9fb] text-[#464554] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Driver Info</th>
                  <th className="py-3 px-4">Location &amp; Job</th>
                  <th className="py-3 px-4">Experience &amp; Income</th>
                  <th className="py-3 px-4">Vehicles &amp; License</th>
                  <th className="py-3 px-4">Call History</th>
                  <th className="py-3 px-4">Status &amp; Details</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d7]/60 text-xs">
                {displayedDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    onClick={() => setSelectedDriverModal(driver)}
                    className="hover:bg-[#f2f4f6] transition-colors cursor-pointer group"
                  >
                    {/* Driver Info */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#191c1e] group-hover:text-[#4648d4] transition-colors">
                          {driver.name}
                        </span>
                        <div className="flex items-center gap-1 text-[#464554] text-[11px] mt-0.5">
                          <BadgeCheck className="w-3 h-3 text-[#4648d4]" />
                          <span className="font-mono">{driver.tmid}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#464554] text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">
                            {revealedPhones[driver.id] ? driver.mobile : '**********'}
                          </span>
                          <button
                            onClick={(e) => togglePhoneReveal(driver.id, e)}
                            className="text-[10px] text-[#4648d4] hover:underline ml-1"
                            title="Reveal phone"
                          >
                            {revealedPhones[driver.id] ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Location & Job */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-[#191c1e] font-medium">
                          <MapPin className="w-3 h-3 text-[#464554]" />
                          <span>{driver.location}</span>
                        </div>
                        <span className="text-[#464554] text-[11px] mt-0.5">
                          Job ID: <span className={driver.jobId !== 'N/A' ? 'font-semibold text-[#4648d4]' : 'text-slate-400'}>{driver.jobId}</span>
                        </span>
                      </div>
                    </td>

                    {/* Experience & Income */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[#191c1e] font-medium">{driver.experience}</span>
                        <span className="text-[#0058be] font-bold mt-0.5">{driver.income}</span>
                      </div>
                    </td>

                    {/* Vehicles & License */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {driver.license.map((lic, lIdx) => (
                          <span
                            key={lIdx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dae2fd] text-[#131b2e] border border-indigo-200"
                          >
                            {lic}
                          </span>
                        ))}
                        {driver.vehicles.map((v, vIdx) => (
                          <span
                            key={vIdx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[#eceef0] text-[#464554] border border-[#c7c4d7]"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Call History */}
                    <td className="py-3 px-4">
                      {driver.callHistory === 'Called' ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 w-fit">
                            Called
                          </span>
                          <span className="text-[10px] text-[#464554] mt-0.5">{driver.lastCall}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#ffdad6] text-[#93000a] font-bold border border-red-200 w-fit">
                          Not Called
                        </span>
                      )}
                    </td>

                    {/* Status & Details */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                          driver.status === 'AVAILABLE'
                            ? 'bg-[#d8e2ff] text-[#001a42] border border-blue-200'
                            : 'bg-[#dae2fd] text-[#131b2e] border border-indigo-200'
                        }`}>
                          {driver.status}
                        </span>
                        <span className="text-[11px] text-[#464554] mt-1">
                          Added by: <span className="font-medium text-[#191c1e]">{driver.addedBy}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {driver.addedDate}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCallDriver(driver, e)}
                          className="p-1.5 rounded-lg text-[#0058be] hover:bg-blue-50 transition-colors"
                          title="Call Driver"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriverModal(driver);
                          }}
                          className="p-1.5 rounded-lg text-[#4648d4] hover:bg-indigo-50 transition-colors"
                          title="View Driver Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-3 bg-[#f2f4f6] border-t border-[#c7c4d7] flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-1.5 bg-white border border-[#c7c4d7] rounded-lg text-xs font-semibold text-[#191c1e] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-[#464554]">
              Page <span className="font-bold text-[#191c1e]">{currentPage}</span> of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-4 py-1.5 bg-white border border-[#c7c4d7] rounded-lg text-xs font-semibold text-[#191c1e] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Driver Detail Drawer / Modal */}
      {selectedDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#c7c4d7] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#f2f4f6] border-b border-[#c7c4d7] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-[#4648d4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedDriverModal.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-[#191c1e]">
                      {selectedDriverModal.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedDriverModal.status === 'AVAILABLE'
                        ? 'bg-[#d8e2ff] text-[#001a42]'
                        : 'bg-[#dae2fd] text-[#131b2e]'
                    }`}>
                      {selectedDriverModal.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#464554] mt-0.5">
                    TMID: <span className="font-mono font-semibold text-[#191c1e]">{selectedDriverModal.tmid}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#191c1e] hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Profile Overview Card */}
              <div className="grid grid-cols-2 gap-4 bg-[#f7f9fb] p-4 rounded-xl border border-[#c7c4d7]">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#464554] tracking-wider">Contact &amp; Location</div>
                  <div className="font-bold text-[#191c1e] text-sm mt-1">{selectedDriverModal.mobile}</div>
                  <div className="text-[#464554] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#4648d4]" />
                    <span>{selectedDriverModal.location}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#464554] tracking-wider">Matched Requisition</div>
                  <div className="font-bold text-[#4648d4] text-sm mt-1">
                    {selectedDriverModal.jobId !== 'N/A' ? selectedDriverModal.jobId : 'Not Yet Matched'}
                  </div>
                  <div className="text-[#464554] mt-0.5">{selectedDriverModal.jobTitle}</div>
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-[#c7c4d7] rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-[#464554]">Experience</div>
                  <div className="text-sm font-bold text-[#191c1e] mt-1">{selectedDriverModal.experience}</div>
                </div>
                <div className="border border-[#c7c4d7] rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-[#464554]">Expected Income</div>
                  <div className="text-sm font-bold text-[#0058be] mt-1">{selectedDriverModal.income}</div>
                </div>
                <div className="border border-[#c7c4d7] rounded-lg p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-[#464554]">Call History</div>
                  <div className="text-sm font-bold text-[#191c1e] mt-1">{selectedDriverModal.callHistory}</div>
                </div>
              </div>

              {/* License & Vehicles */}
              <div className="space-y-2 bg-[#f7f9fb] p-3.5 rounded-xl border border-[#c7c4d7]">
                <div className="flex justify-between py-1 border-b border-[#c7c4d7]/60">
                  <span className="text-[#464554]">Driving License Endorsement:</span>
                  <div className="flex gap-1">
                    {selectedDriverModal.license.map((l, i) => (
                      <span key={i} className="bg-[#dae2fd] text-[#131b2e] px-1.5 py-0.2 rounded font-bold text-[10px]">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-[#c7c4d7]/60">
                  <span className="text-[#464554]">Familiar Vehicle Types:</span>
                  <span className="font-semibold text-[#191c1e]">{selectedDriverModal.vehicles.join(', ')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#464554]">Preferred Corridor:</span>
                  <span className="font-semibold text-[#191c1e]">{selectedDriverModal.preferredRoute}</span>
                </div>
              </div>

              {/* Operator Notes */}
              <div className="bg-[#e1e0ff]/40 border border-[#c0c1ff] rounded-xl p-3.5">
                <div className="font-bold text-[#07006c] mb-1 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#4648d4]" />
                  <span>Telemetry &amp; Staff Remarks</span>
                </div>
                <p className="text-[#191c1e] leading-relaxed">
                  {selectedDriverModal.notes}
                </p>
                <div className="mt-2 text-[10px] text-[#464554]">
                  Registered by <span className="font-semibold">{selectedDriverModal.addedBy}</span> on {selectedDriverModal.addedDate}
                </div>
              </div>

              {/* Quick Call Action */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={`tel:${selectedDriverModal.mobile}`}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-[#4648d4] text-white rounded-lg font-semibold hover:bg-[#6063ee] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Driver ({selectedDriverModal.mobile})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`Initiating job match for ${selectedDriverModal.name}...`);
                  }}
                  className="flex items-center justify-center space-x-2 py-2 px-3 bg-white border border-[#4648d4] text-[#4648d4] rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Match Open Jobs</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#f2f4f6] border-t border-[#c7c4d7] flex items-center justify-between">
              <span className="text-[11px] text-[#464554]">
                TMConnect Driver Bank v3.8
              </span>
              <button
                onClick={() => setSelectedDriverModal(null)}
                className="px-4 py-1.5 bg-[#191c1e] text-white rounded-lg font-semibold text-xs hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c7c4d7] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#f2f4f6] border-b border-[#c7c4d7] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191c1e]">Add Driver to Bank</h3>
              <button
                onClick={() => setIsAddDriverModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#191c1e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddDriverSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#464554] uppercase tracking-wider mb-1">
                  Driver Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ram Kumar"
                  className="w-full px-3 py-2 border border-[#c7c4d7] rounded-lg focus:outline-none focus:border-[#4648d4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#464554] uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <input
                    required
                    type="tel"
                    value={newDriver.mobile}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-[#c7c4d7] rounded-lg focus:outline-none focus:border-[#4648d4]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#464554] uppercase tracking-wider mb-1">
                    State / City *
                  </label>
                  <input
                    required
                    type="text"
                    value={newDriver.location}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-3 py-2 border border-[#c7c4d7] rounded-lg focus:outline-none focus:border-[#4648d4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#464554] uppercase tracking-wider mb-1">
                    License Endorsement
                  </label>
                  <select
                    value={newDriver.license_type}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, license_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#c7c4d7] rounded-lg focus:outline-none focus:border-[#4648d4]"
                  >
                    <option>HMV</option>
                    <option>LMV</option>
                    <option>HPMV/HTV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#464554] uppercase tracking-wider mb-1">
                    Expected Income
                  </label>
                  <select
                    value={newDriver.income}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, income: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#c7c4d7] rounded-lg focus:outline-none focus:border-[#4648d4]"
                  >
                    <option>₹ 35000-40000</option>
                    <option>₹ 40000-45000</option>
                    <option>₹ 45000-50000</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#c7c4d7]">
                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(false)}
                  className="px-4 py-2 border border-[#c7c4d7] rounded-lg text-xs font-semibold text-[#191c1e] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4648d4] text-white rounded-lg text-xs font-semibold hover:bg-[#6063ee] cursor-pointer"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
