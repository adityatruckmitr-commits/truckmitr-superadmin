import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { endConsoleSession } from '../services/api/axiosInstance';
import { useNavigate } from '@teleadmin/router';
import {
  User, LogOut, ChevronDown, Mail, Phone, Briefcase,
  MapPin, Calendar, CreditCard, Shield, Lock, ShieldCheck
} from 'lucide-react-teleadmin';
import axiosInstance from '../services/api/axiosInstance';
import { toast } from 'react-hot-toast';

const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowPasswordForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // Signing out of teleadmin signs out of the whole console
    await logout();
    endConsoleSession();
    window.location.href = '/login';
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSetPassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/telehead/set-password', passwordData);

      if (response.data?.status) {
        toast.success(response.data?.message || 'Password updated successfully');
        setShowPasswordForm(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        toast.error(response.data?.message || 'Error updating password');
      }
    } catch (err) {
      console.error('Set password error:', err);
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeDetails = user?.employee_details;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-1.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 focus:outline-hidden focus-visible:outline-hidden"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 overflow-hidden shadow-xs flex-shrink-0">
          <img
            src={`https://truckmitr.com/storage/app/public/${user?.employee_details?.photo_path}`}
            alt={user?.name}
            className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all"
            onError={(e) => {
              e.target.src = "https://ui-avatars.com/api/?name=" + (user?.name || 'Admin') + "&background=6366f1&color=fff";
            }}
          />
        </div>

        <div className="hidden lg:block text-left mr-1">
          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
            {user?.name || 'User'}
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              {user?.role || 'Root Admin'}
            </p>
          </div>
        </div>

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Modern & Compact */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-1">
                {employeeDetails?.full_name || user?.name}
              </h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
                {employeeDetails?.designation || user?.role || 'Administrator'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Info Items */}
            <div className="space-y-2 pb-2">
              {employeeDetails?.email && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</span>
                  <span className="text-slate-700 font-black truncate max-w-[140px]">{employeeDetails.email}</span>
                </div>
              )}
              {user?.mobile && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3 h-3" /> Mobile</span>
                  <span className="text-slate-700 font-black">{user.mobile}</span>
                </div>
              )}
            </div>

            {/* Set Password Toggle */}
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus:outline-hidden focus-visible:outline-hidden ${showPasswordForm ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                <span>Security Console</span>
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} />
            </button>

            {/* Password Form */}
            {showPasswordForm && (
              <div className="space-y-2 pt-1 animate-in zoom-in-95 duration-200">
                <input
                  type="password"
                  name="current_password"
                  placeholder="CURRENT PASSWORD"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
                />
                <input
                  type="password"
                  name="new_password"
                  placeholder="NEW PASSWORD"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
                />
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="CONFIRM NEW PASSWORD"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
                />
                <button
                  onClick={handleSetPassword}
                  disabled={isSubmitting}
                  className={`w-full bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] focus:outline-hidden focus-visible:outline-hidden ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-black active:scale-[0.98]'
                    } transition-all`}
                >
                  {isSubmitting ? 'SAVING...' : 'SAVE CREDENTIALS'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-500 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200 hover:border-red-200 transition-all shadow-xs focus:outline-hidden focus-visible:outline-hidden"
            >
              <LogOut className="w-3.5 h-3.5" />
              LOGOUT SESSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;