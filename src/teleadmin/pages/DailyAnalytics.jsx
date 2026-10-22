import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';
import leadsApi from '../services/api/leadsApi';

const DailyAnalytics = () => {
  const [date, setDate] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await leadsApi.getDailyAnalytics({ date });
      if (res.status) {
        setData(res.data);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50/50 min-h-[calc(100vh-64px)]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Daily Analytics
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Telecaller performance metrics & conversion rates
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="relative flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200 transition-colors shadow-xs min-w-[150px]">
            <Calendar className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 cursor-pointer w-full outline-none p-0 relative z-10 
              [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center justify-center p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Performance Overview
            {date && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider ml-2">{formatDate(date)}</span>}
          </h2>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {data.length} Records Found
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading Analytics...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold">No analytics data available</p>
              <p className="text-xs mt-1">Try selecting a different date range</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse bg-white">
              <thead className="bg-slate-100/50">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">Telecaller ID</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">Assigned Name</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">Process</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Total Assigned Users</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Connected</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Not Connected</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Callback Later</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Unattempted</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider text-center">Connected Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">
                        {row.telecaller_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{row.assigned_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
                        {row.process || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-black text-slate-700 text-sm">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        {row.total_assigned_users}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-600 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {row.connected}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-rose-600 text-sm">
                        <XCircle className="w-3.5 h-3.5" />
                        {row.not_connected}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-amber-600 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {row.callback_later}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-slate-500 text-sm">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {row.unattempted}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              row.connected_rate_percentage >= 50 ? 'bg-emerald-500' : 
                              row.connected_rate_percentage >= 20 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, row.connected_rate_percentage)}%` }}
                          />
                        </div>
                        <span className="font-black text-[11px] text-slate-700 w-8">
                          {row.connected_rate_percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyAnalytics;
