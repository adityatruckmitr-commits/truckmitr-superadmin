import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Loader2, Calendar, MapPin, Truck, Phone, Briefcase, FileText, IndianRupee, ShieldCheck, X, Play, Clock, User, Users, PhoneCall, PhoneMissed } from 'lucide-react-teleadmin';
import { driverBankApi } from '../services/api/driverBankApi';

const DriverBank = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        license_type: '',
        vehicle_type: '',
        experience: '',
        current_income: '',
        availability: '',
        called_status: '',
        added_by: ''
    });
    
    // To only trigger fetch when "Apply" is clicked, we maintain applied filters
    const [appliedFilters, setAppliedFilters] = useState({ ...filters });
    
    const [selectedDriverForHistory, setSelectedDriverForHistory] = useState(null);

    // Fetch filters options
    const { data: filtersResp } = useQuery({
        queryKey: ['driverBankFilters'],
        queryFn: driverBankApi.getDriverBankFilters,
    });
    const vehicleTypes = filtersResp?.data?.vehicle_types || [];
    const telecallers = filtersResp?.data?.telecallers || [];

    // Fetch driver bank data
    const { data: bankData, isLoading, isError, error } = useQuery({
        queryKey: ['driverBank', page, appliedFilters],
        queryFn: () => driverBankApi.getDriverBank({ page, per_page: 20, ...appliedFilters }),
    });

    const drivers = bankData?.data?.data || [];
    const totalPages = bankData?.data?.last_page || 1;

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setPage(1);
        setAppliedFilters({ ...filters });
    };

    const handleClearFilters = () => {
        const cleared = {
            search: '', license_type: '', vehicle_type: '',
            experience: '', current_income: '', availability: '', called_status: '', added_by: ''
        };
        setFilters(cleared);
        setAppliedFilters(cleared);
        setPage(1);
    };

    const handleCardClick = (status) => {
        setFilters(prev => ({ ...prev, called_status: status }));
        setAppliedFilters(prev => ({ ...prev, called_status: status }));
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Driver Bank
                            {bankData?.data?.total !== undefined && (
                                <span className="text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                                    {bankData.data.total} Total
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Manage and match drivers in the bank</p>
                    </div>
                </div>

                {/* Stats Cards Section */}
                {bankData?.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div 
                            onClick={() => handleCardClick('')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-between ${
                                !appliedFilters.called_status 
                                    ? 'bg-indigo-50/80 border-indigo-200 ring-2 ring-indigo-600/10' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Drivers</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{bankData.stats.total}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>

                        <div 
                            onClick={() => handleCardClick('called')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-between ${
                                appliedFilters.called_status === 'called' 
                                    ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-600/10' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Called Drivers</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{bankData.stats.called}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <PhoneCall className="w-5 h-5" />
                            </div>
                        </div>

                        <div 
                            onClick={() => handleCardClick('not_called')}
                            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-between ${
                                appliedFilters.called_status === 'not_called' 
                                    ? 'bg-red-50/80 border-red-200 ring-2 ring-red-600/10' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Not Called Drivers</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{bankData.stats.not_called}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                <PhoneMissed className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text" name="search" value={filters.search} onChange={handleFilterChange}
                        placeholder="Search TMID, Mobile, Job ID, Location..."
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 lg:col-span-2"
                    />
                    
                    <select
                        name="license_type" value={filters.license_type} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All License Types</option>
                        <option value="HPMV/HTV">HPMV/HTV</option>
                        <option value="HMV">HMV</option>
                        <option value="LMV">LMV</option>
                        <option value="HGMV">HGMV</option>
                        <option value="Others">Others</option>
                    </select>
                    
                    <select
                        name="vehicle_type" value={filters.vehicle_type} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Vehicle Types</option>
                        {vehicleTypes.map(v => (
                            <option key={v.id} value={v.id}>{v.vehicle_name}</option>
                        ))}
                    </select>

                    <select
                        name="experience" value={filters.experience} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Experience</option>
                        <option value="0_1 Yrs">0-1 Yrs</option>
                        <option value="1_2 Yrs">1-2 Yrs</option>
                        <option value="3_5 Yrs">3-5 Yrs</option>
                        <option value="6_10 Yrs">6-10 Yrs</option>
                        <option value="10+ Yrs">10+ Yrs</option>
                        <option value="Others">Others</option>
                    </select>
                    
                    <select
                        name="current_income" value={filters.current_income} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Incomes</option>
                        <option value="15000-20000">₹ 15000-20000</option>
                        <option value="20000-25000">₹ 20000-25000</option>
                        <option value="25000-30000">₹ 25000-30000</option>
                        <option value="30000-35000">₹ 30000-35000</option>
                        <option value="35000-40000">₹ 35000-40000</option>
                        <option value="40000-45000">₹ 40000-45000</option>
                        <option value="45000-50000">₹ 45000-50000</option>
                        <option value="50000-55000">₹ 50000-55000</option>
                        <option value="Others">Others</option>
                    </select>
                    
                    <select
                        name="availability" value={filters.availability} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Availability</option>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="placed">Placed</option>
                        <option value="callback">Callback</option>
                        <option value="not_interested">Not Interested</option>
                    </select>

                    <select
                        name="called_status" value={filters.called_status} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All Calling Status</option>
                        <option value="called">Called</option>
                        <option value="not_called">Not Called</option>
                    </select>
                    
                    <select
                        name="added_by" value={filters.added_by} onChange={handleFilterChange}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">Added By</option>
                        {telecallers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    
                    <div className="flex gap-2 lg:col-span-1 md:col-span-2">
                        <button
                            onClick={handleApplyFilters}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Apply
                        </button>
                        <button
                            onClick={handleClearFilters}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Showing {drivers.length} of {bankData?.data?.total || 0} Drivers
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver Info</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location & Job</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Experience & Income</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicles & License</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Call History</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                                        <p className="text-slate-500 mt-2">Loading driver bank...</p>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-red-500">
                                        Failed to load driver bank data. {error?.message}
                                    </td>
                                </tr>
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No drivers found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800">{driver.name || 'Unknown'}</div>
                                            <div className="text-slate-500 flex items-center gap-1 mt-1 text-xs">
                                                <ShieldCheck className="w-3 h-3" /> {driver.tmid || 'N/A'}
                                            </div>
                                            <div className="text-slate-500 flex items-center gap-1 mt-1 text-xs">
                                                <Phone className="w-3 h-3" /> {driver.mobile === 'Hidden' ? '**********' : driver.mobile}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {driver.location || 'N/A'}
                                            </div>
                                            <div className="text-slate-600 flex items-center gap-1 mt-1 text-xs">
                                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                Job ID: <span className="font-medium text-slate-800">{driver.job_id || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700">Exp: {driver.experience || 'N/A'}</div>
                                            <div className="text-slate-600 flex items-center gap-1 mt-1">
                                                <IndianRupee className="w-3 h-3 text-emerald-500" />
                                                {driver.current_income || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {driver.vehicle_type_names ? driver.vehicle_type_names.split(',').map((v, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        <Truck className="w-3 h-3 mr-1" />{v.trim()}
                                                    </span>
                                                )) : <span className="text-slate-400 text-xs">N/A</span>}
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-xs">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-medium text-slate-700">{driver.license_type || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span 
                                                onClick={() => driver.call_count > 0 && setSelectedDriverForHistory(driver)}
                                                className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                                                    driver.call_count > 0 ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200 transition-colors' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {driver.call_count > 0 ? `${driver.call_count} Calls` : 'Not Called'}
                                            </span>
                                            {driver.call_count > 0 && (
                                                <div className="text-xs text-slate-600 mt-2 space-y-1">
                                                    <div><span className="font-medium text-slate-800">Status:</span> {driver.last_call_status || 'N/A'}</div>
                                                    <div><span className="font-medium text-slate-800">Feedback:</span> {driver.last_feedback || 'N/A'}</div>
                                                    {driver.last_remarks && <div><span className="font-medium text-slate-800">Remarks:</span> {driver.last_remarks}</div>}
                                                    {driver.last_call_timing && (
                                                        <div className="text-slate-400 mt-1">
                                                            {new Date(driver.last_call_timing).toLocaleString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric',
                                                                hour: 'numeric', minute: '2-digit', hour12: true
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                                                    driver.availability === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                                    driver.availability === 'busy' ? 'bg-amber-100 text-amber-700' :
                                                    driver.availability === 'placed' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {driver.availability ? driver.availability.toUpperCase() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2 flex flex-col gap-1">
                                                <span>Added by: <span className="font-medium text-slate-700">{driver.added_by_admin_name || 'N/A'}</span></span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> 
                                                    {new Date(driver.created_at).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: 'numeric', minute: '2-digit', hour12: true
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-600 font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Call History Modal */}
            {selectedDriverForHistory && (
                <CallHistoryModal 
                    driver={selectedDriverForHistory} 
                    onClose={() => setSelectedDriverForHistory(null)} 
                />
            )}
        </div>
    );
};

const CallHistoryModal = ({ driver, onClose }) => {
    const { data: historyData, isLoading, isError } = useQuery({
        queryKey: ['callHistory', driver.tmid],
        queryFn: () => driverBankApi.getCallHistory({ user_tm_id: driver.tmid, process: 'driver_bank_match_making' }),
        enabled: !!driver
    });

    const calls = historyData?.data || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Call History - {driver.name || 'Unknown'}</h3>
                        <p className="text-sm text-slate-500 mt-1">TMID: {driver.tmid}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 mt-4">Loading call history...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-red-500">Failed to load call history.</div>
                    ) : calls.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No calls recorded for this driver.</div>
                    ) : (
                        <div className="space-y-4">
                            {calls.map((call, idx) => (
                                <div key={call.id || idx} className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-xs">
                                    <div className="flex flex-wrap justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    call.call_status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                                                    call.call_status === 'not_connected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {call.call_status ? call.call_status.replace('_', ' ') : 'N/A'}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-1 rounded-md">
                                                    {call.call_type ? call.call_type.toUpperCase() : 'UNKNOWN'}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-800 mt-2">
                                                Feedback: <span className="text-indigo-600 font-semibold">{call.call_feedback || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-slate-500 flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(call.call_start_time || call.created_at).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: 'numeric', minute: '2-digit', hour12: true
                                                })}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Duration: {call.call_duration || '0 secs'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                Agent: {call.assigned_name || 'System'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {call.call_remarks && (
                                        <div className="bg-white rounded-lg p-3 text-sm text-slate-600 border border-slate-100 mb-4">
                                            <span className="font-semibold text-slate-700 mr-2">Remarks:</span>
                                            {call.call_remarks}
                                        </div>
                                    )}
                                    
                                    {call.call_recording && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                                <Play className="w-3.5 h-3.5" /> Call Recording
                                            </p>
                                            <audio controls className="w-full h-10 outline-hidden rounded-lg">
                                                <source src={call.call_recording} type="audio/mpeg" />
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverBank;
