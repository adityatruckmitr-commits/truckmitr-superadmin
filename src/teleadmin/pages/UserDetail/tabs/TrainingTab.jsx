import React from 'react';
import { Video, Award, Target, TrendingUp, HelpCircle } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const TrainingTab = ({ trainingProgress, trainingStatus }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Video className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Training Progress</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Videos</span>
          </div>
          <span className="text-3xl font-black text-slate-700">{trainingProgress?.total_videos || 0}</span>
        </div>
        <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Completed Videos</span>
          </div>
          <span className="text-3xl font-black text-emerald-700">{trainingProgress?.completed_videos || 0}</span>
        </div>
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Quiz Completed</span>
          </div>
          <span className="text-3xl font-black text-blue-700">{trainingProgress?.quiz_completed || 0}</span>
        </div>
        <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Completion Rate</span>
          </div>
          <span className="text-3xl font-black text-indigo-700">{trainingProgress?.completion_percentage || 0}%</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">Overall Progress</span>
          <span className="text-sm font-black text-emerald-600">{trainingProgress?.completion_percentage || 0}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
          <div 
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-4 rounded-full transition-all duration-1000" 
            style={{ width: `${trainingProgress?.completion_percentage || 0}%` }}
          />
        </div>
      </div>

      {trainingStatus && trainingStatus.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200">S. No.</th>
                <th className="px-4 py-3 border-b border-slate-200">Video Title</th>
                <th className="px-4 py-3 border-b border-slate-200">Module</th>
                <th className="px-4 py-3 border-b border-slate-200">Topic</th>
                <th className="px-4 py-3 border-b border-slate-200">Video Status</th>
                <th className="px-4 py-3 border-b border-slate-200">Quiz Status</th>
                <th className="px-4 py-3 border-b border-slate-200">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainingStatus.map((training, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-600">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{training.video_title_name || `Video #${training.video_id}`}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{training.module_name || training.video_module || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{training.video_topic || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                      training.is_completed == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {training.is_completed == 1 ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                      training.quize_status == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {training.quize_status == 1 ? 'Passed' : 'Not Taken'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(training.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <Video className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No training progress found</p>
        </div>
      )}
    </div>
  );
};

export default TrainingTab;
