import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  HardDrive,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDrive } from '../../context/DriveContext';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, verifyOtp, resendVerification, backendStatus } = useAuth();
  const { showToast } = useDrive();

  // Modes: 'login' | 'register' | 'otp' | 'success'
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowWakeWarning, setSlowWakeWarning] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Email validation regex (RFC 5322 compatible)
  const emailRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
  const isEmailValid = email.trim() === '' || emailRegex.test(email.trim());

  // OTP verification state
  const [targetEmail, setTargetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const otpInputRefs = useRef([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Show helpful status hint if request takes >5s (e.g. Render cold start)
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlowWakeWarning(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Reset errors when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen, authMode]);

  if (!isOpen) return null;

  // Handle Login & Register submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSlowWakeWarning(false);
    setLoading(true);

    if (authMode === 'login') {
      const res = await login(normalizedEmail, password);
      setLoading(false);

      if (res.success) {
        showToast('Signed in successfully', 'success');
        onClose();
      } else if (res.requiresVerification) {
        setTargetEmail(res.email || normalizedEmail);
        setAuthMode('otp');
        setError('Your email is not verified yet. Please enter the verification code sent to your inbox.');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } else if (authMode === 'register') {
      if (name.trim().length < 2) {
        setLoading(false);
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 6) {
        setLoading(false);
        setError('Password must be at least 6 characters long.');
        return;
      }

      const res = await register(name, normalizedEmail, password);
      setLoading(false);

      if (res.success) {
        setTargetEmail(res.email || normalizedEmail);
        setCooldown(res.cooldownSeconds || 60);
        setAuthMode('otp');
        setSuccessInfo(
          res.alreadySent
            ? res.message
            : 'Verification code dispatched! Please check your inbox.'
        );
        showToast(res.alreadySent ? 'Please check your inbox for the verification code.' : 'Verification email sent!', 'info');
      } else {
        setError(res.error || 'Registration failed. Please try again.');
      }
    }
  };

  // Handle OTP digit changes with auto-advance
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Auto-advance to next box if digit entered
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace and arrow keys in OTP input
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste event on OTP boxes (paste full 6 digits)
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpDigits(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setSlowWakeWarning(false);
    setLoading(true);
    const res = await verifyOtp(targetEmail, fullOtp);
    setLoading(false);

    if (res.success) {
      setAuthMode('success');
      showToast('Email verified successfully! Welcome to CloudVault.', 'success');
      setTimeout(() => {
        onClose();
        setAuthMode('login');
      }, 2200);
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  // Resend Verification Code
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setError(null);
    setResending(true);
    const res = await resendVerification(targetEmail);
    setResending(false);

    if (res.success) {
      setCooldown(res.cooldownSeconds || 60);
      setSuccessInfo('A new 6-digit verification code has been sent to your email.');
      showToast('New verification code sent!', 'info');
    } else if (res.isRateLimited) {
      setCooldown(res.cooldownSeconds || 60);
      setError(res.error);
    } else {
      setError(res.error || 'Failed to resend code. Please try again.');
    }
  };

  const handleQuickDemoFill = () => {
    setAuthMode('login');
    setEmail('naman@bitmesra.ac.in');
    setPassword('cloudvault123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header decoration */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2.5 sm:mb-3 shadow-xs">
            {authMode === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : authMode === 'otp' ? (
              <Mail className="w-6 h-6 text-white" />
            ) : (
              <HardDrive className="w-6 h-6 text-white" />
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
            {authMode === 'otp'
              ? 'Verify Your Email'
              : authMode === 'success'
              ? 'Account Activated'
              : 'CloudVault Access'}
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            {authMode === 'otp'
              ? 'Enter the 6-digit code sent to your email to activate storage.'
              : authMode === 'success'
              ? 'Your email address has been verified successfully.'
              : authMode === 'login'
              ? 'Sign in to access your encrypted document storage.'
              : 'Create an account to begin storing and managing your documents.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6">
          {/* Cloud backend cold-start notice */}
          {backendStatus === 'waking' && (authMode === 'login' || authMode === 'register') && !error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-spin" />
              <span>Cloud server is waking up from idle (~20–45s). Feel free to submit — we will connect automatically.</span>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {authMode === 'login' && error.includes('verify your email') && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetEmail(email.trim().toLowerCase());
                      setAuthMode('otp');
                      setError(null);
                    }}
                    className="block mt-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Enter Verification Code →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MODE 1 & 2: SIGN IN / REGISTER FORM */}
          {(authMode === 'login' || authMode === 'register') && (
            <>
              {/* Mode Toggle Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 sm:mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Naman Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="student@bitmesra.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                        !isEmailValid
                          ? 'border-rose-400 ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500/20 focus:border-brand-500'
                      }`}
                    />
                  </div>
                  {!isEmailValid && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">
                      Please enter a valid email format (e.g. name@domain.com)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || (!isEmailValid && email.length > 0)}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {loading
                      ? authMode === 'login' ? 'Authenticating...' : 'Sending Verification Code...'
                      : authMode === 'login' ? 'Sign In' : 'Create Account & Verify'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                {loading && slowWakeWarning && (
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    Cloud server is waking up — this first request can take up to a minute...
                  </p>
                )}
              </form>

              {/* Demo Account Quick-Fill Helper */}
              {authMode === 'login' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    <span>Fill Sample Account</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* MODE 3: 6-DIGIT OTP VERIFICATION SCREEN */}
          {authMode === 'otp' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We've sent a 6-digit confirmation code to:
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 break-all">
                  {targetEmail}
                </p>
              </div>

              {/* 6 Digit Input Boxes */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white transition-all shadow-2xs"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid for 15 minutes</span>
                  </span>
                  <span>Single-use OTP</span>
                </div>

                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Didn&apos;t see it? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                </p>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Verifying Code...' : 'Verify & Activate Account'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                {loading && slowWakeWarning && (
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                    Cloud server is waking up — this first request can take up to a minute...
                  </p>
                )}
              </form>

              {/* Resend Verification Code with Cooldown */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
                {cooldown > 0 ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-500" />
                    <span>Resend code in <strong className="font-mono text-slate-600 dark:text-slate-300">{cooldown}s</strong></span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Resend Verification Code</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 mt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email address</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: SUCCESS CONFIRMATION SCREEN */}
          {authMode === 'success' && (
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Email Verified Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Your CloudVault account is now active and protected with 256-bit AES encryption.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <span>Go to My Drive</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Security Badge Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cryptographic Identity Verification & 256-bit AES Storage</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
