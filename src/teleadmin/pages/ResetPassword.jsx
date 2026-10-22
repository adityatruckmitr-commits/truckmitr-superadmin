import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from '@teleadmin/router';
import authApi from '../services/api/authApi';
import { Lock, Key, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';
import logoImage from '/logoFull.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileFromState = location.state?.mobile || '';

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: ({ mobile, token, password, password_confirmation }) =>
      authApi.resetPassword(mobile, token, password, password_confirmation),
    onSuccess: (data) => {
      toast.success(data.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to reset password';
      toast.error(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Please enter the reset token');
      return;
    }

    if (!password) {
      toast.error('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }


    resetPasswordMutation.mutate({
      mobile: mobileFromState,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Reset Password Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <img
              src={logoImage}
              alt="TruckMitr Logo"
              className="h-28 w-auto mb-8"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Reset Password
            </h1>
            <p className="text-gray-600 text-lg">
              Enter the token and your new password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Token Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reset Token
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter reset token"
                  className="w-full !pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-hidden text-gray-900 uppercase"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your SMS for the reset token
              </p>
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full !pl-10 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-hidden text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full !pl-10 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-hidden text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Video Background */}
      <div className="hidden lg:block lg:w-3/5 relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '120%',
            objectFit: 'cover',
            position: 'absolute',
            top: '-10%',
            left: '0',
            filter: 'none'
          }}
        >
          <source src="/teleadmin/Indian_Truck_Driver_Receives_Keys.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#1B69B3] opacity-15"></div>
      </div>
    </div>
  );
};

export default ResetPassword;
