import { useState } from 'react'
import { Link } from '@hrms/router'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Key, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-teleadmin'
import toast from 'react-hot-toast'
import api from '../services/api'

/** Shared frame so every step of the reset flow sits on the same premium canvas. */
const AuthShell = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
    <span
      className="pointer-events-none fixed inset-x-0 top-0 h-56 opacity-[0.06]"
      style={{ backgroundImage: 'linear-gradient(180deg, #142338 0%, transparent 100%)' }}
    />
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[420px]"
    >
      <div className="mb-7 flex justify-center">
        <span className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs">
          <img src={`${import.meta.env.BASE_URL}hrms-assets/logo.png`} alt="TM-Manavsetu" className="h-8 w-auto object-contain" />
        </span>
      </div>

      <div className="card overflow-hidden">
        <span className="block h-[3px] bg-gradient-to-r from-brass-400 via-brass-300/50 to-transparent" />
        <div className="p-7 sm:p-8">{children}</div>
      </div>
    </motion.div>
  </div>
)

const ForgotPassword = () => {
  const [step, setStep] = useState('email') // 'email' | 'reset' | 'success'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/forgot-password', { email })
      toast.success(response.data.message || 'OTP sent successfully!')
      setStep('reset')
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }
    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your new password')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/reset-password', {
        email,
        token: otp,
        password_hash: password,
        password_hash_confirmation: confirmPassword,
      })
      toast.success(response.data.message || 'Password reset successfully!')
      setStep('success')
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to reset password'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <AuthShell>
        <div className="text-center">
          <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700 ring-1 ring-inset ring-green-200">
            <CheckCircle className="h-7 w-7" />
          </span>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Password reset</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">
            Your password has been changed. You can sign in with your new credentials now.
          </p>
          <Link to="/login" className="btn-primary mt-7 w-full py-3">
            Go to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-6 rounded-full ${step === 'email' ? 'bg-brass-400' : 'bg-green-500'}`} />
            <span className={`h-1.5 w-6 rounded-full ${step === 'reset' ? 'bg-brass-400' : 'bg-gray-200'}`} />
          </span>
          <span className="text-[10px] uppercase tracking-eyebrow text-gray-400">
            Step {step === 'email' ? '1' : '2'} of 2
          </span>
        </div>

        <h1 className="font-display text-[26px] font-semibold leading-tight text-gray-900">
          {step === 'email' ? 'Forgot your password?' : 'Set a new password'}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {step === 'email'
            ? "Enter your work email and we'll send you a one-time code."
            : `Enter the code sent to ${email} along with your new password.`}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@truckmitr.com"
                className="field-input pl-11"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending…
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label htmlFor="otp" className="field-label">
              One-time code
            </label>
            <div className="relative">
              <Key className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="field-input pl-11 tracking-[0.3em]"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              New password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="field-input pl-11 pr-11"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-700"
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="field-label">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="field-input pl-11 pr-11"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-700"
                tabIndex="-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Resetting…
              </>
            ) : (
              'Reset password'
            )}
          </button>
        </form>
      )}

      <div className="mt-7 border-t border-gray-200 pt-5 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}

export default ForgotPassword
