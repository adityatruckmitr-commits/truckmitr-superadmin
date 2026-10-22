import React from 'react';
import { Award, Users, CreditCard, ShieldCheck } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const ReferralsTab = ({ referralStats, referredUsers, referralPayments }) => {
  return (
    <div className="space-y-6">
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Referrals</span>
          </div>
          <span className="text-3xl font-black text-slate-700">{referralStats?.total_referrals || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Eligible Blocks (5 Users)</span>
          </div>
          <span className="text-3xl font-black text-indigo-700">{referralStats?.eligible_blocks || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid Blocks</span>
          </div>
          <span className="text-3xl font-black text-emerald-700">{referralStats?.paid_blocks || 0}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Blocks</span>
          </div>
          <span className="text-3xl font-black text-amber-700">{referralStats?.pending || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referred Users List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h5 className="font-bold text-slate-800">Referred Users</h5>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">{referredUsers?.length || 0}</span>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200">User Details</th>
                  <th className="px-4 py-3 border-b border-slate-200">Status</th>
                  <th className="px-4 py-3 border-b border-slate-200">Joined On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referredUsers && referredUsers.length > 0 ? (
                  referredUsers.map((user, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.unique_id} | {user.mobile}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.status == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status == 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(user.Created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-500 text-sm">No referred users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral Payments List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h5 className="font-bold text-slate-800">Referral Payments</h5>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">{referralPayments?.length || 0}</span>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200">Amount</th>
                  <th className="px-4 py-3 border-b border-slate-200">Transaction ID</th>
                  <th className="px-4 py-3 border-b border-slate-200">Status</th>
                  <th className="px-4 py-3 border-b border-slate-200">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referralPayments && referralPayments.length > 0 ? (
                  referralPayments.map((payment, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-bold text-slate-800">₹{payment.amount}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{payment.transaction_id || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                          payment.status === 'completed' || payment.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                          payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(payment.payment_date || payment.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">No payment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralsTab;
