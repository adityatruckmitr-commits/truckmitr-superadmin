import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Award, Edit2, Check, X, Loader2, Download, Share2 } from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL, API_BASE_URL } from '../../../config/api.config';
import { userApi } from '../../../services/api/userApi';
import { toast } from 'react-hot-toast';
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleDateString('en-GB', options).replace(/am|pm/i, (m) => m.toUpperCase());
};

const ProfileTab = ({ user, planStatus, totalPayment, payments, onRefresh }) => {
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [telecallers, setTelecallers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(user.assigned_to || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isEditingAssignee && telecallers.length === 0) {
      fetchTelecallers();
    }
  }, [isEditingAssignee]);

  const fetchTelecallers = async () => {
    try {
      const response = await userApi.getAllTelecallers();
      if (response && response.data && Array.isArray(response.data)) {
        // Filter by role telecaller and exclude ids 34 and 37
        const filtered = response.data.filter(tc => 
          tc.role === 'telecaller' && tc.caller_id !== 34 && tc.caller_id !== 37
        );
        setTelecallers(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch telecallers:', error);
    }
  };

  const handleUpdateAssignee = async () => {
    if (!selectedAssignee) return;
    try {
      setIsUpdating(true);
      await userApi.updateUserAssignee(user.id, selectedAssignee);
      setIsEditingAssignee(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to update assignee:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  const fetchInvoiceUrl = async (paymentId) => {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = `${baseUrl}/invoice/${paymentId}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status && data.invoice_url) {
        return data.invoice_url;
      }
      throw new Error(data.message || 'Failed to get invoice URL');
    } catch (err) {
      console.error(err);
      toast.error('Could not fetch invoice');
      return null;
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    if (!paymentId) return;
    const toastId = toast.loading('Fetching invoice...');
    const url = await fetchInvoiceUrl(paymentId);
    toast.dismiss(toastId);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleShareInvoice = async (paymentId) => {
    if (!paymentId) return;
    const toastId = toast.loading('Preparing invoice link...');
    const url = await fetchInvoiceUrl(paymentId);
    toast.dismiss(toastId);
    if (url) {
      if (navigator.share) {
        navigator.share({
          title: 'Invoice Link',
          url: url
        }).catch(err => console.error(err));
      } else {
        navigator.clipboard.writeText(url);
        toast.success('Invoice link copied to clipboard!');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs col-span-1 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-bold text-slate-800">User Information</h5>
          {planStatus === 'active' && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Active User</span>}
          {planStatus === 'expired' && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Payment Expired</span>}
          {planStatus === 'free' && <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Free User</span>}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Unique ID</span>
            <span className="text-sm text-slate-800 font-mono">{user.unique_id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Name</span>
            <span className="text-sm text-slate-800">{user.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Mobile</span>
            <span className="text-sm text-slate-800">{user.mobile || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Email</span>
            <span className="text-sm text-slate-800">{user.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">City</span>
            <span className="text-sm text-slate-800">{user.city || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">State</span>
            <span className="text-sm text-slate-800">{user.state_name || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm whitespace-nowrap">Address</span>
            <span className="text-sm text-slate-800 text-right">{user.address || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Role</span>
            <span className="text-sm text-slate-800 capitalize">{user.role || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Assigned TeleChamp</span>
            {isEditingAssignee ? (
              <div className="flex items-center gap-2">
                <select 
                  className="text-sm border border-slate-300 rounded-sm px-2 py-1 outline-hidden focus:border-indigo-500"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="">Select Assignee</option>
                  {telecallers.map(tc => (
                    <option key={tc.caller_id} value={tc.caller_id}>{tc.caller_name}</option>
                  ))}
                </select>
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <>
                    <button onClick={handleUpdateAssignee} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-sm">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsEditingAssignee(false)} className="p-1 text-red-600 hover:bg-red-50 rounded-sm">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-indigo-600 font-medium">{user.telechamp_name || 'Not Assigned'}</span>
                <button 
                  onClick={() => {
                    setSelectedAssignee(user.assigned_to || '');
                    setIsEditingAssignee(true);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Change Assignee"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm whitespace-nowrap">Job Application Assignees</span>
            <span className="text-sm text-slate-800 text-right">{user.previous_assignees || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm">Gender</span>
            <span className="text-sm text-slate-800">{user.Sex || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-500 text-sm whitespace-nowrap">Registration Date</span>
            <span className="text-sm text-slate-800 text-right">{formatDate(user.Created_at)}</span>
          </div>



          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-slate-500 text-sm">User Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.status == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {user.status == 1 ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* PAYMENT SECTION */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs col-span-1 lg:col-span-2">
        <h5 className="font-bold text-slate-800 mb-6">Payment Summary</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <h4 className="text-2xl font-black text-slate-800 mb-1">₹ {totalPayment || 0}</h4>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Payment</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <h4 className="text-2xl font-black text-slate-800 mb-1">{payments?.length || 0}</h4>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transactions</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <h4 className={`text-2xl font-black mb-1 capitalize ${planStatus === 'active' ? 'text-emerald-600' : planStatus === 'expired' ? 'text-amber-500' : 'text-red-500'}`}>
              {planStatus}
            </h4>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription Status</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase font-black text-slate-500 tracking-wider">
                <th className="p-3 border border-slate-200">#</th>
                <th className="p-3 border border-slate-200">Amount</th>
                <th className="p-3 border border-slate-200">Payment Type</th>
                <th className="p-3 border border-slate-200">Payment Status</th>
                <th className="p-3 border border-slate-200">Start Date</th>
                <th className="p-3 border border-slate-200">End Date</th>
                <th className="p-3 border border-slate-200">Plan Status</th>
                {/* <th className="p-3 border border-slate-200 text-center">Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {payments && payments.length > 0 ? (
                payments.map((payment, index) => {
                  const eligibleTypes = ['job_ready', 'verified', 'trusted', 'standard', 'foreman_pro', 'association_pro', 'subscription'];
                  const isEligible = eligibleTypes.includes(payment.payment_type);
                  const isExpired = payment.end_at && (payment.end_at * 1000) < Date.now();
                  
                  return (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3 border border-slate-200 text-sm">{index + 1}</td>
                      <td className="p-3 border border-slate-200 text-sm font-semibold">₹ {payment.amount}</td>
                      <td className="p-3 border border-slate-200 text-sm">{payment.payment_type}</td>
                      <td className="p-3 border border-slate-200">
                        <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                          payment.payment_status === 'captured' ? 'bg-emerald-100 text-emerald-700' : 
                          payment.payment_status === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {payment.payment_status === 'captured' ? 'Success' : payment.payment_status}
                        </span>
                      </td>
                      <td className="p-3 border border-slate-200 text-sm whitespace-nowrap">
                        {payment.start_at ? formatDate(payment.start_at * 1000) : '—'}
                      </td>
                      <td className="p-3 border border-slate-200 text-sm whitespace-nowrap">
                        {payment.end_at ? formatDate(payment.end_at * 1000) : '—'}
                      </td>
                      <td className="p-3 border border-slate-200">
                        {!isEligible ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-sm uppercase">N/A</span>
                        ) : isExpired ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-sm uppercase">Expired</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-sm uppercase">Active</span>
                        )}
                      </td>
                      {/* <td className="p-3 border border-slate-200">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDownloadInvoice(payment.payment_id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Invoice">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleShareInvoice(payment.payment_id)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors" title="Share Invoice Link">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No Payment Records Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
