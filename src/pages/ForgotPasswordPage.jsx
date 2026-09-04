import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import SEO from '../components/SEO';

// Step indicator component
function StepDot({ step, current, label }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
          done
            ? 'bg-brand-500 border-brand-500 text-slate-950'
            : active
            ? 'bg-brand-500/20 border-brand-500 text-brand-400'
            : 'bg-transparent border-dark-border text-dark-muted'
        }`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={`text-[10px] font-semibold ${active ? 'text-brand-400' : done ? 'text-slate-400' : 'text-dark-muted'}`}>
        {label}
      </span>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputsRef = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Step 1 — request OTP
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit input
  const handleCodeChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[index] = val;
    setCode(next);
    if (val && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...code];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setCode(next);
    codeInputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Step 2 — verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-code', { email, code: fullCode });
      setResetSessionToken(res.data.resetSessionToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetSessionToken, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please start over.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Password Reset!</h2>
          <p className="text-sm text-dark-muted mb-8">
            Your password has been successfully updated. You can now sign in with your new credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">Sprinkl</span>
          </Link>
          <p className="mt-2 text-sm text-dark-muted">Reset your password</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <StepDot step={1} current={step} label="Email" />
            <div className={`h-px flex-1 max-w-[40px] transition-all ${step > 1 ? 'bg-brand-500' : 'bg-dark-border'}`} />
            <StepDot step={2} current={step} label="Verify" />
            <div className={`h-px flex-1 max-w-[40px] transition-all ${step > 2 ? 'bg-brand-500' : 'bg-dark-border'}`} />
            <StepDot step={3} current={step} label="New Password" />
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-base font-extrabold text-white">Forgot Password?</h2>
                <p className="text-xs text-dark-muted mt-1">
                  Enter your registered email and we'll send a 6-digit code to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="fp-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="fp-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="host@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-dark-muted">
                Remembered it?{' '}
                <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300">
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP Code ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-base font-extrabold text-white">Enter Reset Code</h2>
                <p className="text-xs text-dark-muted mt-1">
                  A 6-digit code was sent to{' '}
                  <span className="text-slate-300 font-semibold">{email}</span>.
                  It expires in 15 minutes.
                </p>
              </div>

              {/* 6 OTP digit inputs */}
              <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (codeInputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-11 h-12 text-center text-xl font-extrabold bg-dark-bg border-2 border-dark-border rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || code.join('').length < 6}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-dark-muted hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-brand-400 hover:text-brand-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-base font-extrabold text-white">Set New Password</h2>
                <p className="text-xs text-dark-muted mt-1">
                  Choose a strong password. You'll be signed out of all devices.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-dark-bg border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                        : 'border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30'
                    }`}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (confirmPassword && confirmPassword !== newPassword)}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
