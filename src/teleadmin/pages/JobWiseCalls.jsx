import PageJump from '../../components/PageJump';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@teleadmin/router';
import html2canvas from 'html2canvas';
import leadsApi from '../services/api/leadsApi';
import {
    Search, Phone, Mail, Calendar, Filter, Eye, PhoneCall, Clock,
    User, Target, TrendingUp, CheckCircle2, XCircle, AlertCircle,
    Briefcase, Database, Users, MapPin, Hash, UserCircle, CreditCard,
    ChevronLeft, ChevronRight, ArrowRight, PhoneMissed, PhoneOff,
    ListTodo, RefreshCw, Copy, Check, Camera, FilterX, IdCard
} from 'lucide-react-teleadmin';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';


const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);

    const day = date.getDate();
    const year = date.getFullYear();

    const month = date
        .toLocaleString('en-GB', { month: 'long' })
        .toUpperCase();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 → 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

// Compact Simple Stat Card
const StatCard = ({ title, value, icon: Icon, gradient, onClick, isSelected }) => {
    const colorMap = {
        'bg-indigo-600': { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500 ring-2 ring-indigo-500/20' },
        'bg-emerald-600': { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500 ring-2 ring-emerald-500/20' },
        'bg-red-600': { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-500 ring-2 ring-red-500/20' },
        'bg-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500 ring-2 ring-orange-500/20' },
        'bg-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500 ring-2 ring-blue-500/20' },
    };

    const theme = colorMap[gradient] || colorMap['bg-indigo-600'];

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-200 transition-all cursor-pointer hover:shadow-xs ${isSelected ? theme.border : ''}`}
        >
            <div className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${theme.text}`} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate leading-none mb-1">{title}</p>
                <p className="text-lg font-black text-slate-900 leading-none">
                    {value}
                </p>
            </div>
        </div>
    );
};

// Clean Assignment Summary
const AssignmentSummary = ({ assignedCount, title, selectedState, onStateChange, totalUnique, totalAttempted, filteredTelechampId }) => {
    const tableRef = useRef(null);
    const [summarySort, setSummarySort] = useState('default');

    const sortedCount = useMemo(() => {
        if (!assignedCount) return [];
        const items = [...assignedCount];
        if (summarySort === 'telechamp') {
            return items.sort((a, b) => (a.admin_name || '').localeCompare(b.admin_name || ''));
        }
        if (summarySort === 'job') {
            return items.sort((a, b) => (a.job_id || '').localeCompare(b.job_id || ''));
        }
        return items; // 'default'
    }, [assignedCount, summarySort]);

    const captureScreenshot = async () => {
        if (tableRef.current) {
            try {
                const canvas = await html2canvas(tableRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2
                });
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                toast.success('Stats table copied to clipboard!');
            } catch (err) {
                console.error('Failed to capture:', err);
                toast.error('Failed to copy screenshot');
            }
        }
    };

    if (!assignedCount || assignedCount.length === 0) return null;

    const statsList = [
        { key: 'total', label: 'Unique / Attempted', selectedClasses: 'bg-indigo-50 text-indigo-700 shadow-[inset_0_-1px_0_#c7d2fe,inset_0_1px_0_#c7d2fe]', state: '' },
        { key: 'connected', label: 'Connected', selectedClasses: 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-1px_0_#a7f3d0,inset_0_1px_0_#a7f3d0]', state: 'connected' },
        { key: 'total_connected_duration', label: 'Call Duration', selectedClasses: 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-1px_0_#a7f3d0,inset_0_1px_0_#a7f3d0]', state: 'Call Duration' },
        { key: 'not_connected', label: 'Not Connected', selectedClasses: 'bg-red-50 text-red-700 shadow-[inset_0_-1px_0_#fecaca,inset_0_1px_0_#fecaca]', state: 'not_connected' },
        { key: 'callback_later', label: 'Callback', selectedClasses: 'bg-orange-50 text-orange-700 shadow-[inset_0_-1px_0_#fed7aa,inset_0_1px_0_#fed7aa]', state: 'callback_later' },
        { key: 'fresh', label: 'Feedback Pending', selectedClasses: 'bg-blue-50 text-blue-700 shadow-[inset_0_-1px_0_#bfdbfe,inset_0_1px_0_#bfdbfe]', state: 'fresh' },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4 shadow-xs" ref={tableRef}>
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        {title || "Performance Summary"}
                        {(totalUnique > 0 || totalAttempted > 0) && (
                            <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm text-[9px] font-black shadow-xs uppercase tracking-wider">
                                {totalUnique} Unique / {totalAttempted} Total
                            </span>
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                    <select
                        value={summarySort}
                        onChange={(e) => setSummarySort(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-xs"
                    >
                        <option value="default">Default Sort</option>
                        <option value="telechamp">Sort by Telechamp</option>
                        <option value="job">Sort by Job ID</option>
                    </select>
                    <button
                        onClick={captureScreenshot}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-xs"
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Copy Image
                    </button>
                </div>
            </div>
            <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-left border-collapse bg-white">
                    <thead className="bg-[#f1f5f9] sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">
                        <tr>
                            <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase">Telechamp</th>
                            {statsList.map(stat => (
                                <th key={stat.key} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase text-center border-b border-slate-200">
                                    {stat.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedCount.map((item) => {
                            const isFilteredRow = filteredTelechampId && String(filteredTelechampId) === String(item.assigned_to);
                            return (
                                <tr key={item.key || `${item.assigned_to}-${item.job_id}`} className={`hover:bg-indigo-100/50 transition-all odd:bg-white even:bg-slate-50/50 ${isFilteredRow ? 'bg-indigo-50/50' : ''}`}>
                                    <td className="px-4 py-2 font-bold text-[11px] text-slate-700 tracking-wide border-r border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="leading-tight">{item.admin_name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-70">
                                                {item.job_id ? `ID: ${item.job_id}` : (Array.isArray(item.job_ids) && item.job_ids.length > 0 ? `ID: ${item.job_ids[0]}` : 'All Jobs')}
                                            </span>
                                        </div>
                                    </td>
                                    {statsList.map(stat => {
                                        const isSelected = (selectedState === '' && stat.state === '') || (selectedState === stat.state);
                                        let displayValue = item[stat.key] || 0;

                                        if (stat.key === 'total') {
                                            const uniqueVal = Number(item.unique || item.UCA || item.unique_attempted_calls || item.unique_leads || item.lead_count || item.total || 0);
                                            const isFiltered = filteredTelechampId && String(filteredTelechampId) === String(item.assigned_to);
                                            const displayUnique = isFiltered ? (Number(totalUnique || 0) || uniqueVal) : uniqueVal;
                                            displayValue = `${displayUnique} / ${item.total || 0}`;
                                        }

                                        if (stat.key === 'connected') {
                                            const uniqueConn = item.unique_connected || item.connected || 0;
                                            const totalConn = item.connected || 0;
                                            displayValue = `${uniqueConn} / ${totalConn}`;
                                        }

                                        if (stat.key === 'total_connected_duration') {
                                            const secs = parseInt(displayValue, 10) || 0;
                                            const h = Math.floor(secs / 3600);
                                            const m = Math.floor((secs % 3600) / 60);
                                            const s = secs % 60;
                                            displayValue = h > 0 ? `${h}h ${m}m ${s}s` : (m > 0 ? `${m}m ${s}s` : `${s}s`);
                                        }

                                        return (
                                            <td
                                                key={stat.key}
                                                onClick={() => onStateChange(stat.state)}
                                                className={`px-4 py-2 text-center cursor-pointer text-[12px] tabular-nums transition-colors ${isSelected
                                                    ? `${stat.selectedClasses} font-bold`
                                                    : 'text-slate-600 font-bold hover:bg-slate-100'
                                                    }`}
                                            >
                                                {displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Copiable ID Component
const CopyableId = ({ id }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('ID Copied!');
    };
    return (
        <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100/50 hover:bg-slate-100 rounded-md text-[10px] font-medium tracking-wide text-slate-500 transition-colors uppercase w-fit font-black"
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <IdCard className="w-3.5 h-3.5 opacity-70" />}
            {id}
        </button>
    );
};


const JobWiseCalls = () => {
    const [urlSearchParams] = useSearchParams();
    const urlJobId = urlSearchParams.get('jobId') || '';
    const urlAllTime = urlSearchParams.get('all_time') || '';

    const [date, setDate] = useState(urlAllTime ? '' : format(new Date(), 'yyyy-MM-dd'));
    const [searchParams, setSearchParams] = useState({
        unique_id: '',
        name: '',
        mobile: '',
        email: '',
        state: '',
        role: '',
        concall: '',
        job_id: urlJobId,
        assigned_to: '',
        call_status: '',
        last_call_process: '',
        start_date: '',
        end_date: '',
        per_page: 50,
        page: 1,
        all_time: urlAllTime ? 1 : ''
    });
    const [selectedLeadState, setSelectedLeadState] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        if (urlJobId) {
            setSearchParams(prev => ({
                ...prev,
                job_id: urlJobId,
                all_time: urlAllTime ? 1 : '',
                page: 1
            }));
            if (urlAllTime) {
                setDate('');
            } else {
                setDate(format(new Date(), 'yyyy-MM-dd'));
            }
        } else {
            setSearchParams(prev => ({
                ...prev,
                job_id: '',
                all_time: '',
                page: 1
            }));
            setDate(format(new Date(), 'yyyy-MM-dd'));
        }
    }, [urlJobId, urlAllTime]);

    // Fetching Logic — Job Wise Dashboard
    const { data: dashboardData, isLoading: isDashboardLoading, refetch: refetchStats } = useQuery({
        queryKey: ['job-wise-dashboard', date, searchParams.start_date, searchParams.end_date, searchParams.job_id, searchParams.all_time, searchParams.role, searchParams.concall, searchParams.assigned_to, searchParams.call_status],
        queryFn: () => {
            const params = { ...searchParams };
            // If no custom range and not all-time, use the single 'date' (today's date)
            if (!params.start_date && !params.end_date && !params.all_time) {
                params.date = date;
            }
            return leadsApi.getJobWiseCalls(params);
        }
    });

    const { data: listResponse, isLoading: isListLoading, refetch: refetchList, isFetching: isListFetching } = useQuery({
        queryKey: ['job-wise-list', date, searchParams, selectedLeadState],
        queryFn: () => {
            const finalParams = { ...searchParams, call_status: selectedLeadState || searchParams.call_status };
            // Ensure single 'date' doesn't override custom range or all-time
            if (!finalParams.start_date && !finalParams.end_date && !finalParams.all_time) {
                finalParams.date = date;
            }
            return leadsApi.getJobWiseCallsList(finalParams);
        }
    });

    const { data: telechampsResponse } = useQuery({ queryKey: ['all-telechamps'], queryFn: () => leadsApi.getTelechamps(), staleTime: Infinity });

    const listDataMapped = useMemo(() => {
        // Priority to 'data' array in new format
        const payloadData = listResponse?.data || listResponse?.job_wise_rows || listResponse?.data?.job_wise_rows || listResponse?.job_wise || listResponse?.data?.job_wise;
        if (!payloadData || !Array.isArray(payloadData)) return [];

        return payloadData.map(row => {
            // Support for newer format (with 'job_ids' array)
            if (row.user_id && row.unique_id) {
                return {
                    ...row,
                    // If job_ids is an array, take the first one or join.
                    job_id: row.job_id || (Array.isArray(row.job_ids) ? row.job_ids[0] : row.job_ids),
                    process: row.last_call_process || row.process,
                    last_call_duration: row.last_call_duration || row.duration,
                    // Ensure role is capitalized correctly
                    role: row.role?.toUpperCase() || 'CANDIDATE'
                };
            }

            // Support for older `job_wise` aggregated format
            if (row.user_unique_id && !row.call_id) {
                let finalStatus = 'fresh';
                if (row.connected > 0) finalStatus = 'connected';
                else if (row.callback_later > 0) finalStatus = 'callback_later';
                else if (row.not_connected > 0) finalStatus = 'not_connected';

                let role = 'Candidate';
                if (row.user_unique_id?.includes('TR')) role = 'TRANSPORTER';
                else if (row.user_unique_id?.includes('DR')) role = 'DRIVER';

                let latestCall = row.calls && row.calls.length > 0 ? row.calls[0] : null;

                return {
                    user_id: row.user_id,
                    name: row.user_name,
                    role: role,
                    lead_type: '',
                    unique_id: row.user_unique_id,
                    registered_at: new Date().toISOString(),
                    mobile: row.user_mobile,
                    email: 'N/A',
                    telechamp_name: row.admin_name,
                    state_name: 'N/A',
                    final_status: finalStatus,
                    total_calls: row.total || row.total_calls || 1,
                    job_id: row.job_id,
                    last_call_time: latestCall ? latestCall.created_at : row.last_call_time || null,
                    last_call_duration: latestCall ? latestCall.call_duration : row.last_call_duration || null
                };
            }

            // Support for old `job_wise_rows` flat format
            let role = 'Candidate';
            if (row.process?.toLowerCase().includes('transporter')) role = 'TRANSPORTER';
            else if (row.process?.toLowerCase().includes('driver')) role = 'DRIVER';

            return {
                user_id: row.user_id,
                name: row.user_name || `User ID: ${row.user_id}`,
                role: role,
                lead_type: '',
                unique_id: row.user_unique_id || `C-${row.call_id || row.user_id}`,
                registered_at: row.created_at || new Date().toISOString(),
                mobile: row.user_mobile || 'Hidden',
                email: 'N/A',
                telechamp_name: row.admin_name,
                state_name: 'N/A',
                final_status: row.call_status || row.final_status,
                total_calls: row.total || row.total_calls || 1,
                job_id: row.job_id,
                last_call_time: row.created_at || row.last_call_time,
                last_call_duration: row.duration || row.last_call_duration,
                process: row.process || row.last_call_process
            };
        });
    }, [listResponse]);

    const listData = {
        data: listDataMapped,
        pagination: listResponse?.pagination || { total: listDataMapped.length, current_page: 1, last_page: 1 },
        status_counts: listResponse?.status_counts || {},
        assigned_wise: listResponse?.assigned_wise || [],
        today_calls: listResponse?.today_calls || {}
    };

    const statesResponse = { data: [{ id: 1, name: 'Maharashtra' }, { id: 2, name: 'Gujarat' }, { id: 3, name: 'Delhi' }, { id: 4, name: 'Punjab' }, { id: 5, name: 'Haryana' }, { id: 30, name: 'Rajasthan' }] };

    const { data: callHistoryResponse, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['call-history-by-mobile', selectedLead?.mobile],
        queryFn: () => leadsApi.getCallHistoryByMobile(selectedLead.mobile),
        enabled: !!selectedLead?.mobile
    });

    const callHistory = callHistoryResponse?.data || [];

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const overall = (listData?.today_calls?.total_calls || listData?.today_calls?.total) ? listData.today_calls : (dashboardData?.data?.today_calls || { total_calls: 0, connected: 0, callback_later: 0, not_connected: 0, feedback_pending: 0 });
    const baseAssignedWise = dashboardData?.data?.job_wise || []; // Changed from assigned_wise API response struct
    const listAssignedWise = listData?.assigned_wise || [];

    // Robust Data Mapping for Job ID in Performance Summary
    const assignedWiseRaw = baseAssignedWise;

    // Create a name-to-job map from leads as a secondary source
    const leadJobMap = new Map();
    (listData?.data || []).forEach(l => {
        const j = l.job_id || (Array.isArray(l.job_ids) ? l.job_ids[0] : null);
        if (j && !leadJobMap.has(l.telechamp_name)) leadJobMap.set(l.telechamp_name, j);
    });

    const assignedWise = assignedWiseRaw.map(item => ({
        ...item,
        job_id: item.job_id || item.job_ids?.[0] || leadJobMap.get(item.admin_name || item.telechamp_name)
    }));

    const telechampsData = telechampsResponse?.data || [];
    const activeTelechamps = telechampsData.filter(t => t.role === 'telecaller');
    const resignedTelechamps = telechampsData.filter(t => t.role === 'telecallers');
    const isResignedActive = searchParams.assigned_to === 'others' || 
        resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to);

    const telechampsComputed = useMemo(() => {
        const uniqueChamps = new Map();
        assignedWise.forEach(item => {
            if (item.assigned_to && item.admin_name) {
                uniqueChamps.set(String(item.assigned_to), item.admin_name);
            }
        });
        return Array.from(uniqueChamps.entries())
            .map(([id, name]) => ({ caller_id: id, caller_name: name }))
            .sort((a, b) => a.caller_name.localeCompare(b.caller_name));
    }, [assignedWise]);

    let leads = listData?.data || [];
    if (searchParams.last_call_process) {
        leads = leads.filter(lead => {
            const processValue = lead.last_call_process || lead.process;
            if (processValue) {
                return processValue === searchParams.last_call_process;
            }
            // Fallback heuristic if API doesn't return the exact process string yet
            const filterText = searchParams.last_call_process.toLowerCase();
            const role = (lead.role || '').toLowerCase();
            if (filterText.includes('driver') && role === 'transporter') return false;
            if (filterText.includes('transporter') && role === 'driver') return false;
            return true;
        });
    }

    // Sort leads by last_call_time in descending order (most recent first)
    leads = [...leads].sort((a, b) => {
        const timeA = a.last_call_time ? new Date(a.last_call_time).getTime() : 0;
        const timeB = b.last_call_time ? new Date(b.last_call_time).getTime() : 0;
        return timeB - timeA;
    });
    const pagination = listData?.pagination || {};
    const states = statesResponse?.data || [];
    const counts = listData?.status_counts || {};

    return (
        <div className="p-3 md:px-4 md:py-3 space-y-3 bg-slate-50/30 min-h-screen">
            {/* Simple Compact Header */}
            <div className="flex flex-col gap-0.5 pb-2">
                <h1 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                    <Target className="w-5 h-5 text-indigo-600" />
                    {searchParams.job_id ? `Job-Wise Call Analytics - Job: ${searchParams.job_id}` : "Job-Wise Call Analytics"}
                </h1>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {(listResponse?.date_range?.start || dashboardData?.date_range?.start)
                            ? `${formatDate(listResponse?.date_range?.start || dashboardData?.date_range?.start)} - ${formatDate(listResponse?.date_range?.end || dashboardData?.date_range?.end)}`
                            : "Syncing Live Activity..."}
                    </span>
                </div>
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard title="Total Calls" value={overall.total_calls} icon={Users} gradient="bg-indigo-600" isSelected={selectedLeadState === ''} onClick={() => setSelectedLeadState('')} />
                <StatCard title="Connected" value={overall.connected} icon={CheckCircle2} gradient="bg-emerald-600" isSelected={selectedLeadState === 'connected'} onClick={() => setSelectedLeadState('connected')} />
                <StatCard title="Not Connected" value={overall.not_connected} icon={PhoneMissed} gradient="bg-red-600" isSelected={selectedLeadState === 'not_connected'} onClick={() => setSelectedLeadState('not_connected')} />
                <StatCard title="Callback Later" value={overall.callback_later} icon={PhoneOff} gradient="bg-orange-600" isSelected={selectedLeadState === 'callback_later'} onClick={() => setSelectedLeadState('callback_later')} />
                <StatCard title="Feedback Pending" value={overall.feedback_pending} icon={ListTodo} gradient="bg-blue-600" isSelected={selectedLeadState === 'fresh'} onClick={() => setSelectedLeadState('fresh')} />
            </div>

            <AssignmentSummary assignedCount={assignedWise} selectedState={selectedLeadState} onStateChange={setSelectedLeadState} totalUnique={pagination.total} totalAttempted={overall.total_calls} filteredTelechampId={searchParams.assigned_to} />

            {/* Records Table Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col mb-4">
                {/* Compact List Header */}
                <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-600" />
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">All Call Records Today</span>
                        {pagination.total > 0 && (
                            <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-sm text-[9px] font-bold shadow-xs uppercase tracking-wider ml-1">
                                {pagination.total} total
                            </span>
                        )}
                    </div>
                </div>

                {/* Filter Section - More Compact */}
                <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <FilterBox
                                name="search"
                                icon={Search}
                                placeholder="Search leads..."
                                value={searchParams.search || ""}
                                onChange={handleFilterChange}
                                className="h-9 text-[12px]"
                            />
                        </div>
                        <button
                            onClick={() => setSearchParams({ unique_id: '', name: '', mobile: '', email: '', state: '', role: '', concall: '', job_id: '', assigned_to: '', call_status: '', last_call_process: '', start_date: '', end_date: '', per_page: 50, page: 1, all_time: '' })}
                            className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-[11px] font-black uppercase tracking-wider transition-all"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => { refetchStats(); refetchList(); }}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-xs"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        <FilterSelect name="state" icon={MapPin} value={searchParams.state} onChange={handleFilterChange} className="h-9 text-[12px]">
                            <option value="">All States</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </FilterSelect>

                        <FilterSelect 
                            name="assigned_to" 
                            icon={UserCircle} 
                            value={
                                resignedTelechamps.some(t => t.caller_id.toString() === searchParams.assigned_to)
                                    ? "others"
                                    : searchParams.assigned_to
                            } 
                            onChange={handleFilterChange} 
                            className="h-9 text-[12px]"
                        >
                            <option value="">Team</option>
                            {telechampsComputed.length > 0 ? (
                                [...telechampsComputed]
                                    .filter(t => !resignedTelechamps.some(r => String(r.caller_id) === String(t.caller_id)))
                                    .map(t => (
                                        <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
                                    ))
                            ) : (
                                [...activeTelechamps]
                                    .map(t => (
                                        <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
                                    ))
                            )}
                            <option value="others" style={{ fontWeight: 'bold', backgroundColor: '#fef3c7' }}>Others</option>
                        </FilterSelect>

                        {isResignedActive && (
                            <div className="relative group flex-1">
                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 z-10" />
                                <select
                                    name="assigned_to"
                                    value={searchParams.assigned_to === 'others' ? "" : searchParams.assigned_to}
                                    onChange={(e) => {
                                        const val = e.target.value || 'others';
                                        setSearchParams(prev => ({ ...prev, assigned_to: val, page: 1 }));
                                    }}
                                    className="w-full !pl-9 pr-8 py-1.5 bg-amber-50/50 border border-amber-200 rounded-lg text-[12px] font-bold text-amber-900 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-400 outline-hidden transition-all appearance-none cursor-pointer h-9"
                                >
                                    <option value="">All Others</option>
                                    {resignedTelechamps.map(t => (
                                        <option key={t.caller_id} value={t.caller_id}>{t.caller_name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 pointer-events-none text-amber-500" />
                            </div>
                        )}

                        <FilterSelect name="call_status" icon={Phone} value={searchParams.call_status} onChange={handleFilterChange} className="h-9 text-[12px]">
                            <option value="">Status ({overall.total_calls || 0})</option>
                            <option value="connected">Connected ({overall.connected || 0})</option>
                            <option value="not_connected">Not Connected ({overall.not_connected || 0})</option>
                            <option value="callback_later">Callback ({overall.callback_later || 0})</option>
                            <option value="feedback_pending">Pending Feedback ({overall.feedback_pending || 0})</option>
                            <option value="fresh">Fresh (0)</option>
                        </FilterSelect>

                        {/* Role Filter (Driver / Transporter) */}
                        <FilterSelect name="role" icon={Briefcase} value={searchParams.role} onChange={handleFilterChange} className="h-9 text-[12px]">
                            <option value="">All Roles</option>
                            <option value="driver">Driver</option>
                            <option value="transporter">Transporter</option>
                        </FilterSelect>

                        {/* Concall Filter */}
                        <FilterSelect name="concall" icon={PhoneCall} value={searchParams.concall} onChange={handleFilterChange} className="h-9 text-[12px]">
                            <option value="">All Calls</option>
                            <option value="1">Concall Only</option>
                            <option value="regular">Regular Calls</option>
                        </FilterSelect>

                        <div className="relative group flex-1">
                            <input
                                type="date"
                                name="start_date"
                                value={searchParams.start_date || ""}
                                onChange={handleFilterChange}
                                className="w-full h-9 !pl-3 pr-8 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
                                placeholder="dd-mm-yyyy"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative group flex-1">
                            <input
                                type="date"
                                name="end_date"
                                value={searchParams.end_date || ""}
                                onChange={handleFilterChange}
                                className="w-full h-9 !pl-3 pr-8 bg-[#f8fafc] border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 [&::-webkit-calendar-picker-indicator]:opacity-0 transition-all cursor-pointer"
                                placeholder="dd-mm-yyyy"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                </div>

                {/* Clean Data Table with Grid Lines */}
                <div className="overflow-x-auto min-h-[400px] w-full bg-white">
                    <table className="w-full text-left border-collapse border border-slate-200/60">
                        <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200">
                                <th className="pl-4 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Lead Info</th>
                                <th className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Contact</th>
                                <th className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Team</th>
                                <th className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Location</th>
                                <th className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider border-r border-slate-200/60">Status</th>
                                <th className="px-3 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center border-r border-slate-200/60">Calls</th>
                                <th className="pr-4 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60">
                            {isListLoading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-6 border-b border-slate-200/60"><div className="h-10 bg-slate-50 rounded-lg w-full" /></td>
                                    </tr>
                                ))
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No matching records found</p>
                                            <button
                                                onClick={() => setSearchParams({ unique_id: '', name: '', mobile: '', email: '', state: '', role: '', concall: '', job_id: '', assigned_to: '', call_status: '', last_call_process: '', start_date: '', end_date: '', per_page: 50, page: 1, all_time: '' })}
                                                className="text-indigo-600 font-black text-[10px] uppercase hover:underline"
                                            >
                                                Reset all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : leads.map((lead, index) => (
                                <tr key={lead.user_id || `${lead.mobile}-${index}`} className="hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/10">
                                    <td className="pl-4 py-2 border-r border-slate-200/60">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                <span className="font-bold text-slate-900 text-[12px] truncate max-w-[150px]" title={lead.name}>{lead.name}</span>
                                                <span
                                                    className={`px-1 py-0 rounded-[4px] text-[8px] font-black uppercase tracking-wider text-white ${
                                                        (lead.role || '').toLowerCase() === 'driver'
                                                            ? 'bg-blue-600'
                                                            : (lead.role || '').toLowerCase() === 'transporter'
                                                            ? 'bg-purple-600'
                                                            : 'bg-indigo-500'
                                                    }`}
                                                    title={`Role: ${lead.role || 'Unknown'}`}
                                                >
                                                    {lead.role?.charAt(0) || 'C'}
                                                </span>
                                                {((lead.last_call_process || lead.process || '').toLowerCase().replace(/[\s_-]/g, '').includes('concall')) && (
                                                    <span
                                                        className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200"
                                                        title={`Process: ${lead.last_call_process || lead.process}`}
                                                    >
                                                        Concall
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase truncate mb-0.5">{lead.unique_id}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase truncate mb-0.5">{formatDate(lead.registered_at)}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase truncate">{lead.job_id || '—'}</span>
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 border-r border-slate-200/60">
                                        <div className="text-slate-700 font-bold text-[12px] tabular-nums leading-none mb-1.5">{lead.mobile}</div>
                                        <div className="text-slate-400 text-[9px] font-medium truncate max-w-[120px]">{lead.email || 'No Email'}</div>
                                    </td>

                                    <td className="px-3 py-2 border-r border-slate-200/60">
                                        <span className="text-slate-700 font-semibold text-[12px] truncate max-w-[100px] block">{lead.telechamp_name || '—'}</span>
                                    </td>

                                    <td className="px-3 py-2 border-r border-slate-200/60">
                                        <span className="text-slate-500 font-semibold text-[12px] truncate max-w-[100px] block" title={lead.state_name}>{lead.state_name || 'Others'}</span>
                                    </td>

                                    <td className="px-3 py-2 border-r border-slate-200/60">
                                        <div className="flex flex-col">
                                            {(() => {
                                                const st = lead.final_status;
                                                let badgeClass = "text-slate-500";
                                                if (st === 'connected') badgeClass = "text-emerald-600";
                                                else if (st === 'not_connected') badgeClass = "text-red-500";
                                                else if (st === 'callback_later') badgeClass = "text-orange-500";
                                                else if (st === 'fresh') badgeClass = "text-blue-500";
                                                else if (st === 'feedback_pending') badgeClass = "text-amber-600";

                                                const isFeedbackPending = st === 'feedback_pending' || (lead.total_calls > 0 && st === 'fresh');
                                                if (isFeedbackPending) badgeClass = "text-amber-600";

                                                return (
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight leading-none ${badgeClass}`}>
                                                        {isFeedbackPending ? 'Pending Feedback' : (st === 'fresh' ? 'Pending' : st?.replace('_', ' '))}
                                                    </span>
                                                );
                                            })()}
                                            {lead.last_call_time && (
                                                <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">{formatDate(lead.last_call_time)}</span>
                                            )}
                                            {lead.last_call_duration !== undefined && lead.last_call_duration !== null && (
                                                <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">
                                                    Duration: {(() => {
                                                        const secs = parseInt(lead.last_call_duration, 10) || 0;
                                                        const h = Math.floor(secs / 3600);
                                                        const m = Math.floor((secs % 3600) / 60);
                                                        const s = secs % 60;
                                                        return h > 0 ? `${h}h ${m}m ${s}s` : (m > 0 ? `${m}m ${s}s` : `${s}s`);
                                                    })()}
                                                </span>
                                            )}
                                            {lead.last_call_process && (
                                                <span className="text-[8px] text-slate-500 font-semibold truncate max-w-[140px] block mt-0.5" title={lead.last_call_process}>
                                                    {lead.last_call_process}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 text-center border-r border-slate-200/60">
                                        <span className="text-[12px] font-black text-slate-700 tabular-nums">{lead.total_calls ?? 0}</span>
                                    </td>

                                    <td className="pr-4 py-2 text-center">
                                        <div className="flex items-center justify-center">
                                            <button onClick={() => setSelectedLead(lead)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Compact Pagination */}
                {pagination.last_page > 1 && (
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Total: {pagination.total} Records
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={pagination.current_page === 1}
                                onClick={() => setSearchParams(p => ({ ...p, page: p.page - 1 }))}
                                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-black text-slate-700 px-2">
                                {pagination.current_page} / {pagination.last_page}
                            </span>
                            <button
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => setSearchParams(p => ({ ...p, page: p.page + 1 }))}
                                className="p-1 bg-white border border-slate-200 rounded-sm disabled:opacity-30"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <PageJump page={pagination.current_page} totalPages={pagination.last_page} onGo={(n) => setSearchParams((p) => ({ ...p, page: n }))} />
                        </div>
                    </div>
                )}
            </div>

            {/* Compact Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
                        {/* Compact Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-lg font-black shadow-xs">
                                    {selectedLead.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                        {selectedLead.name}
                                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] rounded-sm border border-indigo-100">{selectedLead.role}</span>
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                        {selectedLead.lead_type} • {selectedLead.unique_id}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                                {/* Left Column: Info */}
                                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-0 h-fit">
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Primary Details</span>
                                        </div>
                                        <div className="p-3 space-y-3">
                                            {[
                                                { label: 'User ID', value: selectedLead.user_id, icon: Hash },
                                                { label: 'Mobile', value: selectedLead.mobile, icon: Phone },
                                                { label: 'Email', value: selectedLead.email || 'N/A', icon: Mail },
                                                { label: 'State', value: selectedLead.state_name || 'N/A', icon: MapPin },
                                                { label: 'Reg. Date', value: formatDate(selectedLead.registered_at), icon: Calendar },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <item.icon className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700 truncate text-right uppercase">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 overflow-hidden">
                                        <div className="px-3 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
                                            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Engagement</span>
                                        </div>
                                        <div className="p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Calls</span>
                                                <span className="text-[14px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-sm border border-indigo-100 shadow-xs">{selectedLead.total_calls ?? 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                                <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-sm border border-emerald-100 shadow-xs uppercase">{selectedLead.final_status?.replace('_', ' ')}</span>
                                            </div>
                                            {selectedLead.last_call_time && (
                                                <div className="flex flex-col gap-1 pt-1 border-t border-indigo-100">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Last Activity Session</span>
                                                    <span className="text-[9px] font-bold text-slate-600">{formatDate(selectedLead.last_call_time)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Details & Call Log */}
                                <div className="lg:col-span-8 space-y-4">
                                    {selectedLead.payment_history?.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                                                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Revenue Records</span>
                                            </div>
                                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedLead.payment_history.map((pay, i) => (
                                                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-xs">
                                                        <div>
                                                            <p className="text-lg font-black text-slate-800">₹{parseFloat(pay.amount).toLocaleString()}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{pay.payment_type?.replace('_', ' ')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm font-black uppercase inline-block">{pay.payment_status}</span>
                                                            <p className="text-[8px] font-bold text-slate-500 mt-1">Expires: {pay.end_at ? formatDate(pay.end_at) : 'Active'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2">
                                            <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Call Activity Log</span>
                                        </div>
                                        <div className="p-3">
                                            {isHistoryLoading ? (
                                                <div className="space-y-2">
                                                    {[1, 2].map(i => <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-lg" />)}
                                                </div>
                                            ) : callHistory.length > 0 ? (
                                                <div className="space-y-3">
                                                    {callHistory.map((call, idx) => (
                                                        <div key={call.id || idx} className="bg-slate-50/50 rounded-xl p-3 border border-slate-200 hover:border-indigo-200 transition-colors flex flex-col gap-2">
                                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-1.5 rounded-lg ${call.call_status === 'connected' || call.call_status === 'ANSWER' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                                        <Phone className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{call.call_status?.replace('_', ' ')}</p>
                                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{call.call_start_time} • {call.call_type}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[10px] sm:self-center">
                                                                    <div className="text-right">
                                                                        <span className="text-slate-400 font-bold uppercase text-[8px] block leading-none mb-1">Duration</span>
                                                                        <span className="text-slate-700 font-black bg-white px-1.5 py-0.5 rounded-sm border border-slate-200 shadow-xs">{call.call_duration}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-slate-400 font-bold uppercase text-[8px] block leading-none mb-1">Assigned</span>
                                                                        <span className="text-slate-700 font-bold">{call.assigned_name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {(call.call_feedback || call.call_remarks) && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-slate-100 text-[10px]">
                                                                    {call.call_feedback && (
                                                                        <div>
                                                                            <span className="text-indigo-500 font-bold uppercase text-[8px] block">Feedback</span>
                                                                            <p className="text-slate-600 font-medium leading-normal">{call.call_feedback}</p>
                                                                        </div>
                                                                    )}
                                                                    {call.call_remarks && (
                                                                        <div>
                                                                            <span className="text-orange-500 font-bold uppercase text-[8px] block">Remarks</span>
                                                                            <p className="text-slate-600 font-medium leading-normal">{call.call_remarks}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {call.call_recording && (
                                                                <div className="mt-1">
                                                                    <audio controls className="w-full h-8 border border-slate-200 rounded-lg">
                                                                        <source src={call.call_recording} type="audio/wav" />
                                                                        Your browser does not support the audio element.
                                                                    </audio>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No detailed call logs found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button onClick={() => setSelectedLead(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-xs">
                                Close Console
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Smaller, cleaner filter components
const FilterBox = ({ icon: Icon, placeholder, className, ...props }) => (
    <div className="relative group flex-1">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
        <input
            className={`w-full !pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-hidden transition-all shadow-xs ${className}`}
            placeholder={placeholder}
            {...props}
        />
    </div>
);

const FilterSelect = ({ icon: Icon, children, className, ...props }) => (
    <div className="relative group flex-1">
        <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 z-10" />
        <select
            className={`w-full !pl-7 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 outline-hidden transition-all appearance-none cursor-pointer shadow-xs ${className}`}
            {...props}
        >
            {children}
        </select>
        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-90 pointer-events-none text-slate-400" />
    </div>
);

export default JobWiseCalls;
