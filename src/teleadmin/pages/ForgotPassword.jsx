import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from '@teleadmin/router';
import authApi from '../services/api/authApi';
import { Phone, ArrowLeft, ArrowRight } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';
import logoImage from '/logoFull.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: (mobile) => authApi.forgotPassword(mobile),
    onSuccess: (data) => {
      toast.success(data.message || 'Reset token sent successfully!');
      navigate('/reset-password', { state: { mobile } });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to send reset token';
      toast.error(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!mobile) {
      toast.error('Please enter your mobile number');
      return;
    }

    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    forgotPasswordMutation.mutate(mobile);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Forgot Password Form */}
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
              Forgot Password
            </h1>
            <p className="text-gray-600 text-lg">
              Enter your mobile number to receive a reset token
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full !pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-hidden text-gray-900"
                  maxLength="10"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Token
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

export default ForgotPassword;
