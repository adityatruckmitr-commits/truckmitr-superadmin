import React from 'react';
import { Calendar, User, Briefcase, Clock, FileText, MessageSquare, Tag } from 'lucide-react-teleadmin';
import { format } from 'date-fns';

const InterviewTab = ({ interviews }) => {
  if (!interviews || interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200">
        <FileText className="w-12 h-12 mb-3 text-slate-300" />
        <p className="text-lg font-medium text-slate-700">No Interviews Found</p>
        <p className="text-sm">There are no interview records for this user.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <h3 className="text-base font-bold text-slate-800">Interview History</h3>
        <p className="text-sm text-slate-500">Record of interviews conducted for job matching</p>
      </div>
      
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Job ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Assigned Telechamp</th>
                <th className="px-6 py-4">Call Feedback</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4 whitespace-nowrap">Call Timing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map((interview, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">{interview.job_id || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700">{interview.assigned_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-xs">
                      <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 truncate whitespace-normal" title={interview.call_feedback}>
                        {interview.call_feedback || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2 max-w-xs">
                      <Tag className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 truncate whitespace-normal" title={interview.call_remarks}>
                        {interview.call_remarks || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-slate-600">
                        {interview.call_start_time 
                          ? format(new Date(interview.call_start_time), 'PPp') 
                          : (interview.created_at ? format(new Date(interview.created_at), 'PPp') : 'N/A')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InterviewTab;
