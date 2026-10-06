import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Sun, Moon, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { toast } from '../store/useNotificationStore';
import SEO from '../components/SEO';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA / Login Verification Code Step
  const [otpStep, setOtpStep] = useState(false);
  const [tempLoginToken, setTempLoginToken] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef([]);

  const setAuth = useAuthStore((state) => state.setAuth);
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      toast.warning('Your session has expired. Please sign in again to continue.', 'Session Expired');
    }
  }, []);

  // Cooldown countdown for resending login OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (otpStep) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [otpStep]);

  // Step 1: Submit Credentials
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendSent(false);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      // If 2FA OTP is required
      if (res.data?.requireOtp) {
        setOtpStep(true);
        setTempLoginToken(res.data.tempLoginToken || '');
        setResendCooldown(60);
        toast.success('Verification code sent! Please check your email inbox.', 'Code Sent');
        return;
      }

      // Direct login fallback (if no OTP requested)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      const userName = res.data.user?.fullName || res.data.user?.email?.split('@')[0] || 'Host';
      toast.success(`Welcome back, ${userName}! Signed in successfully.`, 'Signed In');
      if (res.data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      const isUnverified = err.response?.status === 403 && err.response?.data?.emailVerified === false;
      if (isUnverified) {
        setUnverifiedEmail(err.response?.data?.email || email);
      }
      setError(errMsg);
      toast.error(errMsg, isUnverified ? 'Email Verification Required' : 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, val) => {
    // Only accept numeric digit
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    // Auto-advance to next box if digit entered
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically trigger verification
    const full = next.join('');
    if (full.length === 6 && next.every((d) => d !== '')) {
      submitOtpVerification(full);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setOtpDigits(next);

    // Focus last filled index or first unfilled
    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();

    // If full 6 digits pasted, trigger submit
    if (pasted.length === 6) {
      submitOtpVerification(pasted);
    }
  };

  // Submit OTP Verification
  const submitOtpVerification = async (codeToVerify) => {
    const fullCode = codeToVerify || otpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-login-otp', {
        email,
        code: fullCode,
        tempLoginToken,
      });

      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      const userName = res.data.user?.fullName || res.data.user?.email?.split('@')[0] || 'Host';
      toast.success(`Welcome back, ${userName}! Signed in successfully.`, 'Signed In');
      if (res.data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Invalid or expired verification code.';
      setError(errMsg);
      toast.error(errMsg, 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await api.post('/auth/resend-login-otp', { email, tempLoginToken });
      if (res.data?.tempLoginToken) {
        setTempLoginToken(res.data.tempLoginToken);
      }
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      toast.success('A new 6-digit verification code has been sent to your email.', 'Code Resent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend code', 'Error');
    } finally {
      setResending(false);
    }
  };

  // Resend Account Activation link (if unverified email)
  const handleResendVerification = async () => {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResendSent(true);
      toast.success('Verification link & code sent! Please check your email inbox.', 'Email Sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend verification email', 'Error');
    } finally {
      setResending(false);
    }
  };

  const isExpired = typeof window !== 'undefined' && window.location.search.includes('expired=true');

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative">
      <SEO
        title="Login to Sprinkl — Your Nigerian Giveaway Dashboard | NGN & USDT Payouts"
        description="Sign in to your Sprinkl account to manage your giveaways, track payouts, and view your wallet balance. Nigeria's #1 automated giveaway platform for cash and crypto."
        canonical="/login"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Sign In', path: '/login' },
        ]}
      />

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white/90 dark:bg-dark-card/90 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow transition-all backdrop-blur-md"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <img
              src="/sprinkl-logo.png"
              alt="Sprinkl Logo"
              className="w-11 h-11 rounded-2xl object-contain shadow-xl shadow-brand-500/30 group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sprinkl</span>
          </Link>
          <p className="mt-2 text-sm text-dark-muted">
            {otpStep ? 'Two-Factor Authentication' : 'Sign in to your host account'}
          </p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {isExpired && !error && !otpStep && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-medium">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Your session expired. Please sign in again for security.</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
              {unverifiedEmail && (
                <div className="pt-2.5 border-t border-rose-500/20 flex items-center justify-between gap-2">
                  <span className="text-dark-muted text-[11px]">Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending || resendSent}
                    className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-bold underline transition-colors disabled:opacity-50 text-xs"
                  >
                    {resending ? 'Sending…' : resendSent ? 'Verification link sent ✓' : 'Resend link'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 2: VERIFICATION CODE ENTRY ──────────────── */}
          {otpStep ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Enter Verification Code
                </h3>
                <p className="text-xs text-dark-muted leading-relaxed">
                  We've sent a 6-digit security code to <br />
                  <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                </p>
              </div>

              {/* 6 Digit Inputs */}
              <div>
                <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-black rounded-xl border transition-all focus:outline-none ${
                        digit
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'border-dark-border bg-dark-bg text-slate-900 dark:text-white focus:border-brand-500'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-dark-muted text-center mt-2.5">
                  Tip: You can copy the code directly in your email and paste it here.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => submitOtpVerification()}
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Resend Code & Back */}
              <div className="flex flex-col items-center gap-3 pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendLoginOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending new code…</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span className="text-dark-muted">Resend code in {resendCooldown}s</span>
                  ) : (
                    <span>Didn't receive code? Resend Code</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setError(null);
                    setOtpDigits(['', '', '', '', '', '']);
                  }}
                  className="text-dark-muted hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email or password</span>
                </button>
              </div>
            </div>
          ) : (
            /* ──────────────── STEP 1: CREDENTIALS ──────────────── */
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="host@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="login-password">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-muted hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {!otpStep && (
            <p className="mt-6 text-center text-xs text-dark-muted">
              Don't have a host account?{' '}
              <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Create one in 60s
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
