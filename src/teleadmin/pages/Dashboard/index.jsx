import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from '@teleadmin/router';
import dashboardApi from '../../services/api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import axiosInstance from '../../services/api/axiosInstance';
import { API_ENDPOINTS } from '../../config/api.config';
import { Download, Copy, TrendingUp, BarChart3, Phone, PhoneOutgoing, Clock, Trophy, Target, Zap, Activity, RefreshCw, Search, User, CheckCircle2, CreditCard, UserCircle, Database, Users, ArrowRight, Megaphone, Video, BadgeCheck, MessageCircle, Facebook, Headphones, ClipboardList, PlaySquare, AlertCircle, XCircle, TrendingDown } from 'lucide-react-teleadmin';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [exportingType, setExportingType] = useState(null);

  const handleExportExcel = async (title, type) => {
    if (!type) return;
    try {
      setExportingType(type);
      
      let allData = [];
      let headings = [];
      let currentPage = 1;
      let lastPage = 1;

      // Initial toast
      toast.loading(
        <div className="flex flex-col w-full min-w-[200px]">
          <div className="font-semibold text-sm mb-1">Downloading {title}...</div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
            <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
          </div>
          <div className="text-xs text-slate-500 text-right">0%</div>
        </div>,
        { id: `export-${type}` }
      );

      // Loop over chunks
      while (currentPage <= lastPage) {
        const response = await axiosInstance.get(API_ENDPOINTS.DASHBOARD_DATA_EXPORT, {
          params: { type, paginate: 'true', page: currentPage }
        });

        const resData = response.data;
        if (!resData.status) {
          throw new Error('Export failed from server');
        }

        if (currentPage === 1) {
          headings = resData.headings;
          lastPage = resData.last_page || 1;
        }

        allData = [...allData, ...resData.data];
        
        let progress = Math.round((currentPage / lastPage) * 100);
        
        toast.loading(
          <div className="flex flex-col w-full min-w-[200px]">
            <div className="font-semibold text-sm mb-1">Downloading {title}...</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
              <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-xs text-slate-500 text-right">{progress}%</div>
          </div>,
          { id: `export-${type}` }
        );

        currentPage++;
      }

      toast.loading(
        <div className="flex flex-col w-full min-w-[200px]">
          <div className="font-semibold text-sm mb-1">Assembling {title} CSV...</div>
          <div className="text-xs text-slate-500 text-left">Almost done!</div>
        </div>,
        { id: `export-${type}` }
      );

      // Build CSV
      const csvRows = [
        headings.join(','),
        ...allData.map(row => 
          row.map(value => {
            if (value === null || value === undefined) return '""';
            const strValue = String(value).replace(/"/g, '""');
            return `"${strValue}"`;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Detailed_Export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${title} export downloaded!`, { id: `export-${type}` });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${title}`, { id: `export-${type}` });
    } finally {
      setExportingType(null);
    }
  };

  // Set today's date as default
  // Set today's date as default (YYYY-MM-DD for input and API)
  const todayDate = new Date().toISOString().split('T')[0];
  const [agentRevenueDate, setAgentRevenueDate] = useState(todayDate);
  const [matchMakingDate, setMatchMakingDate] = useState(todayDate);

  // Helper for display formatting only
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30000,
  });

  const { data: processResponse } = useQuery({
    queryKey: ['process-snapshot'],
    queryFn: () => dashboardApi.getProcessSnapshot(),
    refetchInterval: 30000,
  });

  const { data: agentRevenueResponse } = useQuery({
    queryKey: ['agent-revenue4', agentRevenueDate],
    queryFn: () => dashboardApi.getAgentRevenue(agentRevenueDate || null),
    refetchInterval: 30000,
  });

  const { data: agentLiveViewResponse } = useQuery({
    queryKey: ['agent-live-view'],
    queryFn: () => dashboardApi.getAgentLiveView(),
    refetchInterval: 5000,
  });

  const { data: todayStatsResponse, isLoading: todayStatsIsLoading } = useQuery({
    queryKey: ['today-stats'],
    queryFn: () => dashboardApi.getTodayStats(),
    refetchInterval: 30000,
  });

  const { data: totalPendingResponse } = useQuery({
    queryKey: ['total-pending'],
    queryFn: () => dashboardApi.getTotalPending(),
    refetchInterval: 30000,
  });

  const { data: statsCardsResponse } = useQuery({
    queryKey: ['dashboard-stats-cards'],
    queryFn: () => dashboardApi.getStatsCards(),
    refetchInterval: 30000,
  });

  const { data: callReportResponse } = useQuery({
    queryKey: ['call-report', agentRevenueDate],
    queryFn: () => dashboardApi.getCallReport(agentRevenueDate || null),
    refetchInterval: 30000,
  });

  const { data: matchMakingResponse } = useQuery({
    queryKey: ['match-making-reports', matchMakingDate],
    queryFn: () => dashboardApi.getMatchMakingReports(matchMakingDate || null),
    refetchInterval: 30000,
  });

  const agentLiveData = agentLiveViewResponse?.data || [];


  const dashboardData = response?.data || response;
  const processData = processResponse?.data || [];
  const statsCards = statsCardsResponse?.data?.data || statsCardsResponse?.data || statsCardsResponse || {};
  if (import.meta.env.DEV) {
    console.log('Dashboard stats cards response:', statsCardsResponse, 'Resolved cards:', statsCards);
  }
  const driverKiAwazStats = statsCards.driver_ki_awaz || {};
  const outboundLeadStats = statsCards.outbound_leads || {};
  const blueTickStats = statsCards.blue_tick_video_accounts || {};
  const leadSourceStats = [
    { label: 'WhatsApp', count: Number(outboundLeadStats.whatsapp_leads || 0) },
    { label: 'Facebook', count: Number(outboundLeadStats.facebook_leads || 0) },
    { label: 'OBD', count: Number(outboundLeadStats.obd_leads || 0) },
    { label: 'Toll Free', count: Number(outboundLeadStats.toll_free_leads || 0) },
    { label: 'Others', count: Number(outboundLeadStats.other_leads || 0) },
  ].map((item, _index, list) => {
    const total = list.reduce((sum, source) => sum + source.count, 0);
    return {
      ...item,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    };
  });
  // Removed unused driverVideoStats line chart helper
  const jobStatusStats = {
    active: Number(todayStatsResponse?.data?.active_jobs || 0),
    pending: Number(todayStatsResponse?.data?.pending_jobs || 0),
    completed: 0,
    cancelled: 0,
    other: 0,
  };
  jobStatusStats.total = Object.values(jobStatusStats).reduce((sum, value) => sum + Number(value || 0), 0);

  // Access telecaller_summary correctly handling baseApi wrapper and potential direct array response
  const rawData = agentRevenueResponse?.data;
  const rawAgentRevenueData = Array.isArray(rawData) ? rawData : (rawData?.telecaller_summary || []);
  // Handle callReportData safely (API returns array directly or {data: []})
  const callReportDataRaw = callReportResponse?.data || callReportResponse;
  const callReportData = Array.isArray(callReportDataRaw) ? callReportDataRaw : [];
  const matchMakingData = matchMakingResponse?.data || [];

  // Sort by Conversion % (highest first)
  const agentRevenueData = Array.isArray(rawAgentRevenueData)
    ? [...rawAgentRevenueData].map(agent => {
      const report = callReportData.find(r => r.assigned_to == agent.id);
      return {
        ...agent,
        total_billsec: report ? parseInt(report.total_billsec) : 0
      };
    }).sort((a, b) => {
      // Calculate conversion % for agent a
      const freshCCa = a.backlogData?.yesterday1830_to_today1830?.CC || 0;
      const backlogCCa = a.backlogData?.before_day_before_yesterday_1830?.CC || 0;
      const totalCCa = freshCCa + backlogCCa;
      const freshUCAa = a.backlogData?.yesterday1830_to_today1830?.UCA || 0;
      const backlogUCAa = a.backlogData?.before_day_before_yesterday_1830?.UCA || 0;
      const totalUCAa = freshUCAa + backlogUCAa;
      const convA = totalUCAa > 0 ? (totalCCa / totalUCAa) * 100 : 0;

      // Calculate conversion % for agent b
      const freshCCb = b.backlogData?.yesterday1830_to_today1830?.CC || 0;
      const backlogCCb = b.backlogData?.before_day_before_yesterday_1830?.CC || 0;
      const totalCCb = freshCCb + backlogCCb;
      const freshUCAb = b.backlogData?.yesterday1830_to_today1830?.UCA || 0;
      const backlogUCAb = b.backlogData?.before_day_before_yesterday_1830?.UCA || 0;
      const totalUCAb = freshUCAb + backlogUCAb;
      const convB = totalUCAb > 0 ? (totalCCb / totalUCAb) * 100 : 0;

      return convB - convA; // Descending order
    })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return `₹ ${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Convert time string (HH:MM:SS) to seconds
  const timeStringToSeconds = (timeString) => {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const employeeDetails = user?.employee_details;

  // const dummyUsers = [
  //   { name: "User 1", assigned: 20, connected: 12 },
  //   { name: "User 2", assigned: 18, connected: 10 },
  //   { name: "User 3", assigned: 15, connected: 9 },
  //   { name: "User 4", assigned: 22, connected: 16 },
  //   { name: "User 5", assigned: 25, connected: 20 },
  //   { name: "User 6", assigned: 17, connected: 11 },
  //   { name: "User 7", assigned: 30, connected: 21 },
  //   { name: "User 8", assigned: 28, connected: 19 },
  //   { name: "User 9", assigned: 24, connected: 14 },
  //   { name: "User 10", assigned: 26, connected: 18 },
  // ];

  const teamPerformance = dashboardData?.team_performance || [];

  const barData = {
    labels: teamPerformance.map(agent => agent.name || 'Unknown'),

    datasets: [
      {
        label: "Attempts",
        data: teamPerformance.map(agent => agent.attempts || 0),
        backgroundColor: "#2563eb", // Royal Blue
        borderRadius: 4,
        barThickness: 12,
        grouped: true,
      },
      {
        label: "Connected",
        data: teamPerformance.map(agent => agent.connected || 0),
        backgroundColor: "#10b981", // Emerald Green
        borderRadius: 4,
        barThickness: 12,
        grouped: true,
      }
    ]
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Using custom legend
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: '600' }, color: '#94a3b8' }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    }
  };

  const totals = agentRevenueData?.reduce(
    (acc, agent) => {
      acc.CA += Number(agent.CA || 0);
      acc.UCA += Number(agent.UCA || 0);
      acc.CC += Number(agent.CC || 0);
      acc.UCC += Number(agent.UCC || 0);
      acc.NC += Number(agent.NC || 0);
      acc.UNC += Number(agent.UNC || 0);
      acc.CB += Number(agent.CB || 0);
      acc.UCB += Number(agent.UCB || 0);
      acc.Pending += Number(agent.Pending || 0);
      acc.Unique_Pending += Number(agent.Unique_Pending || 0);

      acc.revenue += Number(agent.revenue || 0);
      acc.revenue_count += Number(agent.revenue_count || 0);
      acc.total_active_time += Number(agent.total_active_time || 0);

      // Helper to accumulate backlog stats
      const accBacklog = (key, data) => {
        if (!acc[key]) acc[key] = { AU: 0, CA: 0, UCA: 0, CC: 0, UCC: 0, NC: 0, UNC: 0, CB: 0, UCB: 0, Pending: 0, Unique_Pending: 0 };
        if (data) {
          acc[key].AU += Number(data.AU || 0);
          acc[key].CA += Number(data.CA || 0);
          acc[key].UCA += Number(data.UCA || 0);
          acc[key].CC += Number(data.CC || 0);
          acc[key].UCC += Number(data.UCC || 0);
          acc[key].NC += Number(data.NC || 0);
          acc[key].UNC += Number(data.UNC || 0);
          acc[key].CB += Number(data.CB || 0);
          acc[key].UCB += Number(data.UCB || 0);
          acc[key].Pending += Number(data.Pending || 0);
          acc[key].Unique_Pending += Number(data.Unique_Pending || 0);
        }
      };

      accBacklog('fresh_leads_data', agent.backlogData?.yesterday1830_to_today1830);
      accBacklog('prev_backlog_data', agent.backlogData?.day_before_yesterday_1830_to_yesterday_1830);
      accBacklog('overall_backlog_data', agent.backlogData?.before_day_before_yesterday_1830);

      // Accumulate for Today Total Calls column
      accBacklog('today_total_calls', agent);
      // Ensure specific fields map correctly if 'agent' structure differs slightly or if we need specific accumulation logic not covered by generic helper
      // The generic helper works fine for AU, CA, UCA, etc. present in agent root.

      return acc;
    },
    {
      Pending: 0, Unique_Pending: 0,
      revenue: 0,
      revenue_count: 0,
      total_active_time: 0,
      active_time_rows: 0,
      fresh_leads_data: { AU: 0, CA: 0, UCA: 0, CC: 0, UCC: 0, NC: 0, UNC: 0, CB: 0, UCB: 0, Pending: 0, Unique_Pending: 0 },
      prev_backlog_data: { AU: 0, CA: 0, UCA: 0, CC: 0, UCC: 0, NC: 0, UNC: 0, CB: 0, UCB: 0, Pending: 0, Unique_Pending: 0 },
      overall_backlog_data: { AU: 0, CA: 0, UCA: 0, CC: 0, UCC: 0, NC: 0, UNC: 0, CB: 0, UCB: 0, Pending: 0, Unique_Pending: 0 },
      today_total_calls: { AU: 0, CA: 0, UCA: 0, CC: 0, UCC: 0, NC: 0, UNC: 0, CB: 0, UCB: 0, Pending: 0, Unique_Pending: 0 },
    }
  );
  console.log(totals)

  const matchMakingTotals = matchMakingData.reduce(
    (acc, agent) => {
      acc.total_pending_jobs += Number(agent.total_pending_jobs || 0);
      acc.total_live_jobs += Number(agent.total_live_jobs || 0);
      acc.average_job_approval_tat += Number(agent.average_job_approval_tat || 0);
      acc.new_jobs_last_48_hours += Number(agent.new_jobs_last_48_hours || 0);
      acc.total_applicants += Number(agent.total_applicants || 0);
      acc.call_attempts += Number(agent.call_attempts || 0);
      acc.connected_calls += Number(agent.connected_calls || 0);
      acc.not_connected_calls += Number(agent.not_connected_calls || 0);
      acc.pending_calls += Number(agent.pending_calls || 0);
      acc.callback_calls += Number(agent.callback_calls || 0);
      acc.unique_connected_calls += Number(agent.unique_connected_calls || 0);
      acc.unique_not_connected_calls += Number(agent.unique_not_connected_calls || 0);
      acc.unique_callback_calls += Number(agent.unique_callback_calls || 0);
      acc.unique_pending_calls += Number(agent.unique_pending_calls || 0);
      acc.unique_attempted_calls += Number(agent.unique_attempted_calls || 0);

      return acc;
    },
    {
      today_jobs: 0, total_pending_jobs: 0, total_live_jobs: 0, average_job_approval_tat: 0, new_jobs_last_48_hours: 0, total_applicants: 0, call_attempts: 0,
      connected_calls: 0, not_connected_calls: 0, pending_calls: 0,
      callback_calls: 0, unique_connected_calls: 0,
      unique_not_connected_calls: 0, unique_callback_calls: 0, unique_pending_calls: 0, unique_attempted_calls: 0
    }
  );

  const captureSnapshot = async () => {
    try {
      const canvas = await generateSnapshotCanvas();
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = "TeleChamps_Revenue_Snapshot.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error capturing snapshot:", err);
    }
  };

  const copySnapshotToClipboard = async () => {
    try {
      const canvas = await generateSnapshotCanvas();
      if (!canvas) return;

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      alert("Snapshot copied to clipboard ✅");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("Clipboard copy not supported or permission denied ❌");
    }
  };


  const generateSnapshotCanvas = async () => {
    const element = document.getElementById("revenueSnapshot");
    if (!element) return null;

    element.classList.add("snapshot-fix");

    await document.fonts.ready;

    const canvas = await html2canvas(element, {
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      backgroundColor: null,
      logging: false,
    });

    element.classList.remove("snapshot-fix");

    return canvas;
  };

  // const RenderBacklogCell = ({ data, isToday = false }) => {
  //   if (!data) return <div className="text-center text-gray-500">-</div>;
  //   return (
  //     <div className="flex flex-col text-xs text-left min-w-[140px] m-auto bg-white p-2 rounded-lg border border-gray-200 shadow-xs">
  //       {!isToday && (
  //         <div className="font-bold border-b border-gray-200 pb-1 mb-1 text-center bg-gray-50 rounded-t-sm text-gray-800">
  //           Asgn: <span className="text-gray-900">{data.AU || 0}</span>
  //         </div>
  //       )}
  //       <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
  //         <div title="Attempts">
  //           <span className="font-semibold text-gray-700">CA:</span> <span className="font-bold text-gray-900">{data.CA || 0}</span>
  //           <span className="text-[10px] text-gray-500 ml-1">({data.UCA || 0})</span>
  //         </div>
  //         <div title="Connected">
  //           <span className="font-semibold text-green-700">CC:</span> <span className="font-bold text-gray-900">{data.CC || 0}</span>
  //           <span className="text-[10px] text-gray-500 ml-1">({data.UCC || 0})</span>
  //         </div>
  //         <div title="Not Connected">
  //           <span className="font-semibold text-red-700">NC:</span> <span className="font-bold text-gray-900">{data.NC || 0}</span>
  //           <span className="text-[10px] text-gray-500 ml-1">({data.UNC || 0})</span>
  //         </div>
  //         <div title="Callbacks">
  //           <span className="font-semibold text-orange-700">CB:</span> <span className="font-bold text-gray-900">{data.CB || 0}</span>
  //           <span className="text-[10px] text-gray-500 ml-1">({data.UCB || 0})</span>
  //         </div>
  //         <div title="Pending" className="col-span-2 text-center bg-gray-50 rounded-sm border border-gray-200 mt-1 py-0.5">
  //           <span className="font-semibold text-gray-700">Pend:</span> <span className="font-bold text-gray-900">{data.Pending || 0}</span>
  //           <span className="text-[10px] text-gray-500 ml-1">({isToday ? (data.Unique_Pending || 0) : ((data.AU - data.UCA) || 0)})</span>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const RenderBacklogCell = ({ data, isToday = false }) => {
    if (!data) return <div className="text-center text-slate-300 font-medium py-10">—</div>;
    return (
      <div className="flex flex-col text-sm text-left w-full h-full bg-white/60 p-4 rounded-xl border border-slate-200/50 shadow-xs backdrop-blur-xs transition-all hover:border-blue-200/50 justify-center">
        {!isToday && (
          <div className="font-black border-b border-slate-200/70 pb-2 mb-3 text-center text-blue-600 text-[13px] tracking-tight">
            ASSIGNED: <span className="text-slate-900 text-[15px]">{data.AU || 0}</span>
          </div>
        )}
        <div className="grid grid-cols-6 gap-2">
          <div className="text-center" title="Attempts">
            <p className="text-[10px] font-black text-slate-400 leading-none mb-1">CA</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{data.CA || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">({data.UCA || 0})</p>
          </div>
          <div className="text-center" title="Connected">
            <p className="text-[10px] font-black text-blue-500 leading-none mb-1">CC</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{data.CC || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">({data.UCC || 0})</p>
          </div>
          <div className="text-center" title="Not Connected">
            <p className="text-[10px] font-black text-rose-500 leading-none mb-1">NC</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{data.NC || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">({data.UNC || 0})</p>
          </div>
          <div className="text-center" title="Callbacks">
            <p className="text-[10px] font-black text-amber-500 leading-none mb-1">CB</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{data.CB || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">({data.UCB || 0})</p>
          </div>
          <div className="text-center" title="Pending">
            <p className="text-[10px] font-black text-slate-400 leading-none mb-1">PND</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{data.Pending || 0}</p>
            <p className="text-[9px] text-slate-400 mt-1 font-medium">({data.Unique_Pending || 0})</p>
          </div>
          <div className="text-center" title="TBC">
            <p className="text-[10px] font-black text-slate-400 leading-none mb-1">TBC</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{((data.AU - data.UCA) > 0 ? (data.AU - data.UCA) : 0) || 0}</p>
          </div>
        </div>
      </div>
    );
  };



  const SectionHeader = ({ icon: Icon, title, colorClass }) => (
    <div className="flex items-center gap-3 mb-2 mt-0">
      <div className={`w-10 h-10 rounded-xl ${colorClass} bg-opacity-10 flex items-center justify-center shadow-xs border border-blue-50 transition-transform hover:scale-110 duration-500`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-slate-100 ml-4"></div>
    </div>
  );

  const CompactInfoPanel = ({ title, icon: Icon, gradient, badge, items, actions = [] }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      <div className={`px-4 py-3 bg-gradient-to-r ${gradient} flex items-center justify-between`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center text-white">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3 flex-grow">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.color}`} />
              <span className="text-xs font-semibold text-slate-600 truncate">{item.label}</span>
            </div>
            <span className="text-sm font-black text-slate-900 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-1.5 mt-auto">
        {actions.map((action) => (
          <button
            key={typeof action === 'string' ? action : action.label}
            onClick={() => action.to && navigate(action.to)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-white transition-colors"
          >
            {typeof action === 'string' ? action : action.label}
          </button>
        ))}
      </div>
    </div>
  );

  const DonutAnalyticsCard = ({ title, legend, colors }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-black text-slate-800">{title}</h3>
        {/* <span className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-500">This Month</span> */}
      </div>
      <div className="grid grid-cols-[130px_1fr] gap-5 items-center flex-grow">
        <div
          className="w-32 h-32 rounded-full flex-shrink-0"
          style={{
            background: `conic-gradient(${legend.reduce((parts, item, index) => {
              const start = index === 0 ? 0 : parts.total;
              const end = start + Number(item.percent || 0);
              parts.segments.push(`${colors[index]} ${start}% ${end}%`);
              parts.total = end;
              return parts;
            }, { total: 0, segments: [] }).segments.join(', ') || '#e2e8f0 0% 100%'})`
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white relative top-8 left-8"></div>
        </div>
        <div className="space-y-2">
          {legend.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              className={`flex w-full items-center justify-between gap-3 text-left ${item.to ? 'rounded-md px-1 py-1 hover:bg-slate-50' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-xs flex-shrink-0" style={{ backgroundColor: colors[index] }}></span>
                <span className="text-xs font-semibold text-slate-600 truncate">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900">{item.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const DriverKiAwazAnalyticsCard = () => {
    const total = Number(driverKiAwazStats.video_count || 0) + Number(driverKiAwazStats.image_count || 0) + Number(driverKiAwazStats.text_count || 0);
    const videoPercent = total > 0 ? Math.round((Number(driverKiAwazStats.video_count || 0) / total) * 100) : 0;
    const imagePercent = total > 0 ? Math.round((Number(driverKiAwazStats.image_count || 0) / total) * 100) : 0;
    const textPercent = total > 0 ? Math.round((Number(driverKiAwazStats.text_count || 0) / total) * 100) : 0;

    const segments = [
      `#8b5cf6 0% ${videoPercent}%`,
      `#3b82f6 ${videoPercent}% ${videoPercent + imagePercent}%`,
      `#ec4899 ${videoPercent + imagePercent}% 100%`
    ];

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-sm font-black text-slate-800">Driver Ki Awaz Posts Analytics</h3>
        </div>
        <div className="grid grid-cols-[130px_1fr] gap-5 items-center flex-grow">
          <div
            className="w-32 h-32 rounded-full flex-shrink-0"
            style={{
              background: `conic-gradient(${total > 0 ? segments.join(', ') : '#e2e8f0 0% 100%'})`
            }}
          >
            <div className="w-16 h-16 rounded-full bg-white relative top-8 left-8"></div>
          </div>
          <div className="space-y-2.5">
            {/* Media type breakdown */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Media Type</span>
                <span>Count</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#8b5cf6]"></span>
                  <span>Videos</span>
                </div>
                <span className="text-slate-900 font-bold">{videoPercent}% ({driverKiAwazStats.video_count || 0})</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#3b82f6]"></span>
                  <span>Images</span>
                </div>
                <span className="text-slate-900 font-bold">{imagePercent}% ({driverKiAwazStats.image_count || 0})</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#ec4899]"></span>
                  <span>Text</span>
                </div>
                <span className="text-slate-900 font-bold">{textPercent}% ({driverKiAwazStats.text_count || 0})</span>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Status</span>
                <span>Count</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Published (Active)</span>
                </div>
                <span className="text-emerald-600 font-black">{driverKiAwazStats.active_count || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Pending Approval</span>
                </div>
                <span className="text-amber-600 font-black">{driverKiAwazStats.inactive_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const monthlyTarget = todayStatsResponse?.data?.monthly_target || dashboardData?.Target || 500000;
  const monthAchieved = dashboardData?.month_achieved || 0;
  const remainingTarget = Math.max(0, monthlyTarget - monthAchieved);
  const achievementPercent = monthlyTarget > 0 ? ((monthAchieved / monthlyTarget) * 100).toFixed(2) : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = daysInMonth - currentDay + 1; // including today
  const requiredPerDay = daysLeft > 0 ? (remainingTarget / daysLeft) : 0;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">

      {/* User Info Bar */}
      {/* <div className="bg-white border-b border-gray-200 px-6 py-3">
        <p className="text-gray-700">
          
        </p>
      </div> */}

      <div className="px-2 pb-6 pt-2 bg-white overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shadow-xs border border-blue-50 transition-transform hover:scale-110 duration-500">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live Performance Overview</h2>
          <div className="flex-1 h-px bg-slate-100 ml-4"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Drivers",
              type: "driver",
              icon: "🚚",
              gradient: "from-blue-600 to-blue-400",
              detailPath: "/registered-users?role=driver",
              detailLabel: "View Driver Leads",
              metrics: [
                { label: "Today Drivers", value: todayStatsResponse?.data.drivers_registered || 0, icon: <User className="w-3 h-3 text-blue-500" /> },
                { label: "Today Called Drivers", value: todayStatsResponse?.data.driver_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.drivers_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Drivers", value: todayStatsResponse?.data.total_drivers || 0, icon: <Users className="w-3 h-3 text-blue-600" /> }
              ]
            },
            {
              title: "Transporters",
              type: "transporter",
              icon: "🚚",
              gradient: "from-orange-500 to-orange-400",
              detailPath: "/registered-users?role=transporter",
              detailLabel: "View Transporters",
              metrics: [
                { label: "Today Transporters", value: todayStatsResponse?.data.transporters_registered || 0, icon: <CreditCard className="w-3 h-3 text-orange-400" /> },
                { label: "Today Called Transporters", value: todayStatsResponse?.data.transporter_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.transporters_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Transporters", value: todayStatsResponse?.data.total_transporters || 0, icon: <Users className="w-3 h-3 text-orange-600" /> }
              ]
            },
            {
              title: "Driver Foremen",
              type: "foreman",
              icon: "👷",
              gradient: "from-purple-600 to-indigo-500",
              detailPath: "/registered-users?role=foreman",
              detailLabel: "View Foremen",
              metrics: [
                { label: "Today Foremen", value: todayStatsResponse?.data.foreman_registered || 0, icon: <UserCircle className="w-3 h-3 text-purple-500" /> },
                { label: "Today Called Foremen", value: todayStatsResponse?.data.foreman_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.foreman_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Foremen", value: todayStatsResponse?.data.total_foremen || 0, icon: <Users className="w-3 h-3 text-purple-600" /> }
              ]
            },
            {
              title: "Active Jobs",
              type: "active_jobs",
              icon: "📋",
              gradient: "from-blue-800 to-indigo-700",
              detailPath: "/job-matching?job_type=active_jobs",
              detailLabel: "View Active Jobs",
              metrics: [
                { label: "Total Jobs Posted", value: todayStatsResponse?.data.total_jobs || 0, icon: <Database className="w-3 h-3 text-blue-600" /> },
                { label: "Total Active Jobs", value: todayStatsResponse?.data.active_jobs || 0, icon: <Activity className="w-3 h-3 text-blue-500" /> },
                { label: "Drivers Required", value: todayStatsResponse?.data.drivers_required || 0, icon: <Users className="w-3 h-3 text-blue-500" /> },
                { label: "Applicants / Applications", value: `${todayStatsResponse?.data.active_jobs_applicants || 0} / ${todayStatsResponse?.data.active_jobs_applications || 0}`, icon: <User className="w-3 h-3 text-blue-500" /> }
              ]
            },
            {
              title: "Pending & Closed Jobs",
              type: "pending_closed_jobs",
              icon: "⏳",
              gradient: "from-orange-500 to-yellow-500",
              detailPath: "/job-matching?job_type=pending_jobs",
              detailLabel: "View Pending Jobs",
              metrics: [
                { label: "Total Pending Jobs", value: todayStatsResponse?.data.pending_jobs || 0, icon: <Clock className="w-3 h-3 text-orange-500" /> },
                { label: "Total Inactive Jobs", value: todayStatsResponse?.data.inactive_jobs || 0, icon: <AlertCircle className="w-3 h-3 text-slate-500" /> },
                { label: "Total Expired Jobs", value: todayStatsResponse?.data.expired_jobs || 0, icon: <XCircle className="w-3 h-3 text-rose-500" /> },
                { label: "Total Closed Jobs", value: todayStatsResponse?.data.closed_jobs || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Closed Breakdown", value: `Exp: ${todayStatsResponse?.data.closed_expired_jobs || 0} | Pend: ${todayStatsResponse?.data.closed_pending_jobs || 0} | Inact: ${todayStatsResponse?.data.closed_inactive_jobs || 0}`, icon: <TrendingDown className="w-3 h-3 text-slate-400" />, valueColor: "text-[10px] text-slate-500 font-semibold" }
              ]
            },
            {
              title: "Driver Associations",
              type: "association",
              icon: "🏢",
              gradient: "from-blue-700 to-indigo-600",
              detailPath: "/registered-users?role=association",
              detailLabel: "View Associations",
              metrics: [
                { label: "Today Associations", value: todayStatsResponse?.data.association_registered || 0, icon: <Database className="w-3 h-3 text-blue-500" /> },
                { label: "Today Called Associations", value: todayStatsResponse?.data.association_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.association_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Associations", value: todayStatsResponse?.data.total_associations || 0, icon: <Users className="w-3 h-3 text-blue-600" /> }
              ]
            },
            {
              title: "Dhaba Sathi",
              type: "dhaba",
              icon: "🍲",
              gradient: "from-teal-600 to-emerald-500",
              detailPath: "/registered-users?role=dhaba",
              detailLabel: "View Dhabas",
              metrics: [
                { label: "Today's Dhabas", value: todayStatsResponse?.data.dhaba_sathi_registered || 0, icon: <Database className="w-3 h-3 text-teal-500" /> },
                { label: "Today Called Dhabas", value: todayStatsResponse?.data.dhaba_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.dhaba_sathi_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Dhabas", value: todayStatsResponse?.data.total_dhabas || 0, icon: <Users className="w-3 h-3 text-teal-600" /> }
              ]
            },
            {
              title: "Puncture Point",
              type: "puncture",
              icon: "🛠️",
              gradient: "from-rose-600 to-red-500",
              detailPath: "/registered-users?role=puncture",
              detailLabel: "View Puncture Points",
              metrics: [
                { label: "Today Puncture Points", value: todayStatsResponse?.data.puncture_registered || 0, icon: <Zap className="w-3 h-3 text-rose-500" /> },
                { label: "Today Called Puncture Points", value: todayStatsResponse?.data.puncture_today_called_registered || 0, icon: <Phone className="w-3 h-3 text-orange-500" />, valueColor: "text-orange-600" },
                { label: "Today Subscribed", value: todayStatsResponse?.data.puncture_subscriptions || 0, icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
                { label: "Total Puncture Points", value: todayStatsResponse?.data.total_punctures || 0, icon: <Users className="w-3 h-3 text-rose-600" /> }
              ]
            }
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200/70 flex flex-col transition-all duration-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-slate-300">
              {/* Card Header with Gradient */}
              <div className={`p-2.5 px-3 bg-gradient-to-r ${card.gradient} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-base shadow-inner border border-white/10">
                    {card.icon}
                  </div>
                  <span className="text-white font-black text-[11px] uppercase tracking-wider">{card.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {card.mainMetric && (
                    <span className="text-white text-lg font-black tabular-nums">{card.mainMetric.value}</span>
                  )}
                  {/* <button 
                    onClick={() => handleExportExcel(card.title, card.type)}
                    disabled={exportingType === card.type}
                    className={`p-1 rounded-md transition-colors ${exportingType === card.type ? 'text-white/50 cursor-not-allowed' : 'hover:bg-white/20 text-white'}`}
                    title={`Export ${card.title} Detailed Data to Excel`}
                  >
                    {exportingType === card.type ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button> */}
                </div>
              </div>

              {/* Card Body with Metrics */}
              <div className="p-3 flex-1 flex flex-col gap-2">
                {card.metrics.map((metric, mIdx) => (
                  <div key={mIdx} className="flex items-center justify-between group/item py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center group-hover/item:bg-white transition-colors">
                        {metric.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 group-hover/item:text-slate-700 transition-colors">{metric.label}</span>
                    </div>
                    <span className={`text-xs font-black tabular-nums tracking-tight ${metric.valueColor || "text-slate-800"}`}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(card.detailPath)}
                className="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[10px] font-black text-blue-600 hover:text-blue-800 hover:bg-slate-50/50 transition-colors text-left"
              >
                {card.detailLabel || 'View Details'} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
          <CompactInfoPanel
            title="Driver Ki Awaz"
            icon={Megaphone}
            gradient="from-violet-600 to-purple-500"
            badge="New"
            items={[
              { label: "Uploaded Posts", value: driverKiAwazStats.uploaded_videos || 0, icon: PlaySquare, color: "text-violet-500" },
              { label: "Pending Posts", value: driverKiAwazStats.pending_videos || 0, icon: Clock, color: "text-purple-500" },
              { label: "Approved Posts", value: driverKiAwazStats.approved_videos || 0, icon: CheckCircle2, color: "text-slate-500" },
              { label: "Today's Uploads", value: driverKiAwazStats.today_uploads || 0, icon: Video, color: "text-violet-500" },
            ]}
            actions={[
              { label: "View Posts", to: "/driver-ki-awaz" },
              { label: "Pending Approval", to: "/driver-ki-awaz?status=0" },
              { label: "Analytics", to: "/driver-ki-awaz" },
            ]}
          />
          <CompactInfoPanel
            title="Outbound Leads"
            icon={Users}
            gradient="from-emerald-600 to-green-500"
            badge="New"
            items={[
              { label: "WhatsApp Leads", value: Number(outboundLeadStats.whatsapp_leads || 0).toLocaleString('en-IN'), icon: MessageCircle, color: "text-emerald-500" },
              { label: "Facebook Leads", value: Number(outboundLeadStats.facebook_leads || 0).toLocaleString('en-IN'), icon: Facebook, color: "text-blue-500" },
              { label: "Toll Free Leads", value: Number(outboundLeadStats.toll_free_leads || 0).toLocaleString('en-IN'), icon: Headphones, color: "text-slate-500" },
              { label: "OBD Leads", value: Number(outboundLeadStats.obd_leads || 0).toLocaleString('en-IN'), icon: PhoneOutgoing, color: "text-slate-500" },
              { label: "Other Leads", value: Number(outboundLeadStats.other_leads || 0).toLocaleString('en-IN'), icon: ClipboardList, color: "text-slate-500" },
            ]}
            actions={[
              { label: "View All Leads", to: "/social-media-leads" },
              // { label: "Lead Source Report", to: "/social-media-leads" },
            ]}
          />
          <CompactInfoPanel
            title="Blue Tick Media Accounts"
            icon={BadgeCheck}
            gradient="from-blue-600 to-sky-500"
            badge="New"
            items={[
              { label: "Uploaded Posts", value: blueTickStats.uploaded_videos || 0, icon: Video, color: "text-blue-500" },
              { label: "Pending Posts", value: blueTickStats.pending_videos || 0, icon: Clock, color: "text-slate-500" },
              { label: "Approved Posts", value: blueTickStats.approved_videos || 0, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Accounts Active", value: blueTickStats.accounts_active || 0, icon: BadgeCheck, color: "text-emerald-500" },
            ]}
            actions={[
              { label: "View Accounts", to: "/driver-ki-awaz?blue_tick=1" },
              { label: "View Posts", to: "/driver-ki-awaz?blue_tick=1" },
              { label: "Pending Posts", to: "/driver-ki-awaz?blue_tick=1&status=0" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
          <DonutAnalyticsCard
            title="Lead Source Analytics"
            colors={["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#64748b"]}
            legend={(leadSourceStats.length ? leadSourceStats : [
              { label: "WhatsApp", percent: 0, count: 0 },
              { label: "Facebook", percent: 0, count: 0 },
              { label: "OBD", percent: 0, count: 0 },
              { label: "Toll Free", percent: 0, count: 0 },
              { label: "Others", percent: 0, count: 0 },
            ]).map((item) => ({
              label: item.label,
              percent: item.percent || 0,
              value: `${item.percent || 0}% (${Number(item.count || 0).toLocaleString('en-IN')})`,
            }))}
          />
          <DriverKiAwazAnalyticsCard />
          <DonutAnalyticsCard
            title="Job Status Analytics"
            colors={["#3b82f6", "#f97316"]}
            legend={[
              { label: "Active Jobs", count: jobStatusStats.active || 0, to: "/job-matching?job_type=active_jobs" },
              { label: "Pending Jobs", count: jobStatusStats.pending || 0, to: "/job-matching?job_type=pending_jobs" },
            ].map((item) => {
              const total = Number(jobStatusStats.active || 0) + Number(jobStatusStats.pending || 0);
              const percent = total > 0 ? Math.round((Number(item.count || 0) / total) * 100) : 0;
              return {
                label: item.label,
                percent,
                to: item.to,
                value: `${percent}% (${Number(item.count || 0).toLocaleString('en-IN')})`,
              };
            })}
          />
        </div>
      </div>
      {/* Main Content */}
      <div className="px-2 py-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 font-medium">Performance and Revenue Overview</p>
        </div>

        {/* Top Row: Revenue & Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Motivational Target Tracker */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 border border-blue-700/50 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500">
            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4 border-b border-white/10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                      <Target className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-[12px] font-bold text-teal-400 tracking-widest uppercase">Monthly Target</span>
                  </div>
                  <div className="mt-2">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tighter drop-shadow-md">
                      {todayStatsIsLoading ? (
                        <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse my-1"></div>
                      ) : (
                        formatCurrency(monthlyTarget)
                      )}
                    </h2>
                    <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold tracking-tight mt-2">
                      <span>Currently Achieved:</span>
                      {todayStatsIsLoading ? (
                        <div className="h-5 w-24 bg-white/20 rounded-md animate-pulse"></div>
                      ) : (
                        <span className="text-white px-2 py-0.5 bg-indigo-800/50 rounded-md border border-indigo-700/50">
                          {formatCurrency(monthAchieved)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end min-w-[45%] md:pt-4">
                  <div className="flex items-end gap-2 mb-2">
                    {todayStatsIsLoading ? (
                      <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse"></div>
                    ) : (
                      <span className="text-4xl font-black text-emerald-400 tabular-nums leading-none drop-shadow-md">{achievementPercent}%</span>
                    )}
                    <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1">Completed</span>
                  </div>
                  <div className="w-full h-2.5 bg-indigo-950/50 rounded-full overflow-hidden mb-3 relative shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      style={{ width: `${Math.min(achievementPercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-2">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Remaining to Target</p>
                  {todayStatsIsLoading ? (
                    <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-2xl font-black text-white">{formatCurrency(remainingTarget)}</p>
                  )}
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1">Required Per Day ({daysLeft} days left)</p>
                  <div className="flex items-center gap-2">
                    {todayStatsIsLoading ? (
                      <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse mt-1"></div>
                    ) : (
                      <p className="text-2xl font-black text-white">{formatCurrency(requiredPerDay)}</p>
                    )}
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Card */}
          <div className="bg-blue-600 rounded-2xl p-5 border border-blue-700/50 flex flex-col justify-between items-start text-white relative overflow-hidden transition-all duration-500">
            <div className="absolute -top-10 -right-10 p-8 opacity-10 rotate-12">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l4.71-4.71c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
            </div>

            <div className="relative z-10 w-full">
              <p className="text-blue-100/70 text-[8px] font-black uppercase tracking-widest mb-2">Total Subscriptions</p>
              <h2 className="text-5xl font-black mb-3 tracking-tighter leading-none">
                {String(dashboardData?.this_month_subscriptions || 0).padStart(2, '0')}
              </h2>
              <div className="flex items-center justify-between w-full">
                <span className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold backdrop-blur-md border border-white/20">This Month</span>
                <Activity className="w-4 h-4 text-blue-200/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Call Metrics & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Today's Call Metrics Card */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Today's Call Metrics</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
              {[
                { 
                  label: "Total Calls", 
                  value: `${dashboardData?.total_today_unique_calls || 0} / ${dashboardData?.total_today_calls || 0}`, 
                  subLabel: "Unique / Attempted", 
                  icon: Phone, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" 
                },
                { 
                  label: "Connected", 
                  value: `${dashboardData?.total_today_unique_connected || 0} / ${dashboardData?.total_today_Average_Calls || 0}`, 
                  subLabel: "Unique / Connected", 
                  icon: Target, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" 
                },
                {
                  label: "Avg Duration", 
                  value: dashboardData?.avg_call_duration || "0s", 
                  subLabel: "Overall Avg Handling", 
                  icon: Clock, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-100"
                }
              ].map((item, idx) => (
                <div key={idx} className={`bg-white rounded-2xl p-4 flex flex-col items-start gap-3 border border-gray-200 transition-all duration-300 hover:border-gray-300 group ${idx === 2 ? 'col-span-2' : ''}`}>
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center transition-transform`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start w-full">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2 tabular-nums">
                      {item.value}
                    </p>
                    <p className={`text-[10px] font-bold tracking-wide ${item.color}`}>{item.subLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-2 px-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Team Performance</h3>
              </div>
              <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-slate-50 shadow-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Attempt</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Connected</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/60 flex flex-col transition-all duration-700">
              <div className="flex-1 min-h-[450px] w-full">
                <Bar data={barData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: { display: false }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Processwise Snapshot */}
          {/* <div className="bg-white rounded-lg shadow-sm">
            <div className="bg-blue-200 px-4 py-3 rounded-t-lg">
              <h3 className="text-lg font-bold text-gray-900">Today Processwise Snapshot</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border-r border-gray-300">Name</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Tele Champ</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Quota</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Call Attempt</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Call Connected</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Conversion %</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">Revenue</th>
                    <th className="px-3 py-2 text-center text-sm font-semibold text-gray-900">Not Intrested</th>
                  </tr>
                </thead>
                <tbody>
                  {processData.length > 0 ? (
                    processData.map((process, index) => (
                      <tr key={index} className={index < processData.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-300 capitalize">
                          {process.name.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900 border-r border-gray-300">
                          {process.tele || 0}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900 border-r border-gray-300">
                          {process.Q || 0}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900 border-r border-gray-300">
                          {process.CA || 0}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900 border-r border-gray-300">
                          {process.CC || 0}
                        </td>
                        <td className="px-3 py-3 text-center text-sm bg-yellow-200 font-semibold border-r border-gray-300">
                          {parseFloat(process.Conv || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900 border-r border-gray-300">
                          ₹{parseFloat(process.Revenue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-900">
                          {process.NI || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-3 py-6 text-center text-sm text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div> */}
        </div>

        <div className="flex flex-col gap-12 mt-12">
          {/* Agent Live View Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-xs shadow-slate-200/20">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3.5 h-3.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Agent Live View</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Real-time status monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Feed
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Call End Time</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Call Result</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Idle Time (Since Last Call)</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">Overall Idle Time</th>
                    <th className="px-8 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest border-r-0">Overall Active Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentLiveData?.length > 0 ? (
                    agentLiveData.map((agent) => {
                      const isOnCall = agent.call_status === 'Active';
                      const isConnected = agent.disposition === 'connected';

                      return (
                        <tr key={agent.admin_id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-8 py-5 font-bold text-slate-800 text-sm">
                            {agent.admin_name}
                          </td>
                          <td className="px-8 py-5 text-center text-sm min-w-[100px]">
                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] uppercase font-black tracking-widest ${isOnCall
                              ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                              : 'bg-slate-50 text-slate-500 border border-slate-100'
                              }`}>
                              {isOnCall ? 'Active' : 'Idle Now'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center text-slate-600 font-medium text-sm">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span>{agent.last_call_end_time?.split(" ")[1] || '—'}</span>
                              {agent.last_call_end_time && (
                                (() => {
                                  const callDate = agent.last_call_end_time.split(" ")[0];
                                  const today = new Date();
                                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                  
                                  const yesterday = new Date(today);
                                  yesterday.setDate(yesterday.getDate() - 1);
                                  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                                  if (callDate === yesterdayStr) {
                                    return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[9px] font-bold tracking-wider uppercase shadow-xs">Yesterday</span>;
                                  } else if (callDate < yesterdayStr) {
                                     const formattedDate = new Date(callDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                     return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[9px] font-bold tracking-wider uppercase shadow-xs">{formattedDate}</span>;
                                  }
                                  return null;
                                })()
                              )}
                            </div>
                          </td>

                          <td className="px-8 py-5 text-center text-sm min-w-[150px]">
                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] uppercase font-black tracking-widest ${isConnected
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                              {isConnected ? 'Success' : 'No Conn'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center font-black text-slate-900 text-sm">
                            {agent.last_call_idle_time || '0s'}
                          </td>
                          <td className="px-8 py-5 text-center font-black text-slate-900 text-sm">
                            {agent.overall_idle_time || '0s'}
                          </td>
                          <td className="px-8 py-5 text-center font-black text-slate-900 text-sm">
                            {agent.overall_active_time || '0s'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                            <Search className="w-10 h-10 text-slate-400" />
                          </div>
                          <p className="text-xl font-bold text-slate-500 tracking-tight">No active agents found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Welcome Calls Card */}
          {/* <div id="revenueSnapshot" className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-xs">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"></div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {agentRevenueDate ? `Welcome Calls (${formatDate(agentRevenueDate)})` : 'Welcome Calls Overview'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={captureSnapshot}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-colors"
                >
                  Download Snapshot
                </button>
                <button
                  onClick={copySnapshotToClipboard}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">
                      TeleChamp
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 w-1/4">
                      Fresh Leads
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50 w-1/4">
                      Backlog Leads
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">
                      Conv %
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {Array.isArray(agentRevenueData) && agentRevenueData.length > 0 && (
                    <>
                      {agentRevenueData.map((agent, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors duration-150">
                          <td className="px-6 py-5 text-sm font-medium text-slate-900 border-r border-slate-100/50">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 tracking-tight">{agent.name}</span>
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{agent.emp_id}</span>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {agent.process
                                  ? agent.process.split(',').map((tc, idx) => {
                                    const formatted = tc.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());
                                    return (
                                      <span key={idx} className="px-2 py-0.5 text-[9px] rounded-lg font-black uppercase tracking-tighter bg-blue-50 text-blue-600 border border-blue-100/50">
                                        {formatted}
                                      </span>
                                    );
                                  })
                                  : <span className="px-2 py-0.5 text-[9px] rounded-lg bg-slate-100 text-slate-400 font-bold uppercase tracking-tighter">N/A</span>
                                }
                              </div>
                            </div>
                          </td>

                          <td className="p-1.5 bg-blue-50/20 border-r border-slate-100/50 align-stretch">
                            <RenderBacklogCell data={agent.backlogData?.yesterday1830_to_today1830} />
                          </td>
                          <td className="p-1.5 bg-slate-50/40 border-r border-slate-100/50 align-stretch">
                            <RenderBacklogCell data={agent.backlogData?.before_day_before_yesterday_1830} />
                          </td>

                          <td className="px-6 py-5 text-center border-r border-slate-100/50">
                            {(() => {
                              const freshCC = agent.backlogData?.yesterday1830_to_today1830?.UCC || 0;
                              const backlogCC = agent.backlogData?.before_day_before_yesterday_1830?.UCC || 0;
                              const totalCC = freshCC + backlogCC;

                              const freshUCA = agent.backlogData?.yesterday1830_to_today1830?.UCA || 0;
                              const backlogUCA = agent.backlogData?.before_day_before_yesterday_1830?.UCA || 0;
                              const totalUCA = freshUCA + backlogUCA;
                              const conversionPercent = totalUCA > 0 ? ((totalCC / totalUCA) * 100).toFixed(2) : 0;

                              return (
                                <div className={`text-sm font-black tracking-tight ${parseFloat(conversionPercent) > 20 ? 'text-blue-600' : 'text-slate-400'}`}>
                                  {conversionPercent}%
                                </div>
                              );
                            })()}
                          </td>

                          <td className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-slate-900 font-black text-sm tracking-tight">
                                ₹{parseFloat(agent.revenue || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-2 py-1 rounded-lg mt-1.5 uppercase tracking-tighter">
                                {agent.revenue_count || 0} SUCCESS
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}

                      
                      <tr className="bg-blue-50/50 backdrop-blur-md shadow-xl text-slate-800 font-semibold border-t-2 border-blue-200">
                        <td className="px-6 py-6 text-center border-r border-slate-200/50">
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">GRAND TOTAL</span>
                        </td>

                        <td className="p-1.5 text-center border-r border-slate-200/50 align-stretch bg-white/40">
                          <RenderBacklogCell data={totals.fresh_leads_data} />
                        </td>
                        <td className="p-1.5 text-center border-r border-slate-200/50 align-stretch bg-white/40">
                          <RenderBacklogCell data={totals.overall_backlog_data} />
                        </td>

                        <td className="px-6 py-6 text-center border-r border-slate-200/50">
                          <span className="text-slate-400 font-black">—</span>
                        </td>

                        <td className="px-6 py-6 text-center">
                          <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-blue-700">₹{(totals.revenue || 0).toLocaleString("en-IN")}</span>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-1">{totals.revenue_count || 0} TOTAL SUBS</span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>

              </table>
            </div>
          </div> */}

          {/* Job Match Making Card */}
          {/* <div id="matchMakingReports" className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  {matchMakingDate ? `Job Match Making (${formatDate(matchMakingDate)})` : 'Job Match Making Overview'}
                </h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Agent</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Pending</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Live</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Avg TAT</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">New (48h)</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Apps</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Attempts</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Conn</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">NC</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">CB</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100/50">Unique</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Conv %</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {matchMakingData.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-4 py-8 text-center text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100/50">
                        No job matching data available
                      </td>
                    </tr>
                  ) : (
                    <>
                      {matchMakingData.map((agent) => (
                        <tr key={agent.agent_id} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors duration-150">
                          <td className="px-3 py-4 text-sm font-black text-slate-800 border-r border-slate-100/50">
                            {agent.agent_name}
                          </td>
                          <td className="px-3 py-4 text-center text-sm text-slate-600 border-r border-slate-100/50 font-bold">
                            {agent.total_pending_jobs}
                          </td>
                          <td className="px-3 py-4 text-center text-sm text-slate-600 border-r border-slate-100/50 font-bold">
                            {agent.total_live_jobs}
                          </td>
                          <td className="px-3 py-4 text-center text-sm text-slate-600 border-r border-slate-100/50 font-bold">
                            {agent.average_job_approval_tat}
                          </td>
                          <td className="px-3 py-4 text-center text-sm text-slate-600 border-r border-slate-100/50 font-bold">
                            {agent.new_jobs_last_48_hours}
                          </td>
                          <td className="px-3 py-4 text-center text-sm text-slate-600 border-r border-slate-100/50 font-bold">
                            {agent.total_applicants}
                          </td>
                          <td className="px-3 py-4 text-center border-r border-slate-100/50 bg-slate-50/30">
                            <span className="font-black text-slate-900">{agent.call_attempts}</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-slate-500 font-bold">{agent.unique_attempted_calls}</span>
                          </td>
                          <td className="px-3 py-4 text-center border-r border-slate-100/50 bg-blue-50/40">
                            <span className="font-black text-blue-700">{agent.connected_calls}</span>
                            <span className="text-blue-300 mx-1">/</span>
                            <span className="text-blue-500 font-bold">{agent.unique_connected_calls}</span>
                          </td>
                          <td className="px-3 py-4 text-center border-r border-slate-100/50 bg-rose-50/40">
                            <span className="font-bold text-rose-700">{agent.not_connected_calls}</span>
                            <span className="text-rose-300 mx-1">/</span>
                            <span className="text-rose-500 font-medium">{agent.unique_not_connected_calls}</span>
                          </td>
                          <td className="px-3 py-4 text-center border-r border-slate-100/50 bg-amber-50/40">
                            <span className="font-bold text-amber-700">{agent.callback_calls}</span>
                            <span className="text-amber-300 mx-1">/</span>
                            <span className="text-amber-500 font-medium">{agent.unique_callback_calls}</span>
                          </td>
                          <td className="px-3 py-4 text-center border-r border-slate-100/50 bg-violet-50/40">
                            <span className="font-bold text-violet-700">{agent.pending_calls}</span>
                            <span className="text-violet-300 mx-1">/</span>
                            <span className="text-violet-500 font-medium">{agent.unique_pending_calls}</span>
                          </td>
                          <td className="px-3 py-4 text-center font-black text-blue-600 border-r-0 antialiased tracking-tight">
                            {agent.unique_attempted_calls > 0
                              ? ((agent.unique_connected_calls / agent.unique_attempted_calls) * 100).toFixed(2)
                              : 0}%
                          </td>
                        </tr>
                      ))}                        <tr className="bg-blue-50/50 backdrop-blur-md shadow-xl text-slate-800 font-semibold border-t-2 border-blue-200">
                        <td className="px-3 py-6 text-center border-r border-slate-200/50">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-black">TOTAL</span>
                        </td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 font-bold">{matchMakingTotals.total_pending_jobs}</td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 font-bold">{matchMakingTotals.total_live_jobs}</td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 font-bold">-</td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 font-bold">{matchMakingTotals.new_jobs_last_48_hours}</td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 font-bold">{matchMakingTotals.total_applicants}</td>

                        <td className="px-3 py-6 text-center border-r border-slate-200/50 bg-slate-100/40">
                          <span className="font-bold">{matchMakingTotals.call_attempts}</span>
                          <span className="text-slate-400 mx-0.5">/</span>
                          <span className="text-slate-500 font-medium">{matchMakingTotals.unique_attempted_calls}</span>
                        </td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 bg-blue-100/50">
                          <span className="text-blue-700 font-black">{matchMakingTotals.connected_calls}</span>
                          <span className="text-blue-400 mx-0.5">/</span>
                          <span className="text-blue-600 font-bold">{matchMakingTotals.unique_connected_calls}</span>
                        </td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 bg-rose-100/50">
                          <span className="text-rose-700 font-black">{matchMakingTotals.not_connected_calls}</span>
                          <span className="text-rose-400 mx-0.5">/</span>
                          <span className="text-rose-600 font-bold">{matchMakingTotals.unique_not_connected_calls}</span>
                        </td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 bg-amber-100/50">
                          <span className="text-amber-700 font-black">{matchMakingTotals.callback_calls}</span>
                          <span className="text-amber-400 mx-0.5">/</span>
                          <span className="text-amber-600 font-bold">{matchMakingTotals.unique_callback_calls}</span>
                        </td>
                        <td className="px-3 py-6 text-center border-r border-slate-200/50 bg-violet-100/50">
                          <span className="text-violet-700 font-black">{matchMakingTotals.pending_calls}</span>
                          <span className="text-violet-400 mx-0.5">/</span>
                          <span className="text-violet-600 font-bold">{matchMakingTotals.unique_pending_calls}</span>
                        </td>
                        <td className="px-3 py-6 text-center text-blue-600 font-black tracking-tighter">
                          {matchMakingTotals.unique_attempted_calls > 0
                            ? ((matchMakingTotals.unique_connected_calls / matchMakingTotals.unique_attempted_calls) * 100).toFixed(2)
                            : 0}%
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
