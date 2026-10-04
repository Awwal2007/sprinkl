import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Sun, Moon, Mail, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { toast } from '../store/useNotificationStore';
import SEO from '../components/SEO';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Manual 6-digit code verification state
  const [manualEmail, setManualEmail] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [codeLoading, setCodeLoading] = useState(false);
  const codeInputsRef = useRef([]);

  const { user, setAuth, accessToken } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        setLoading(true);
        const res = await api.post('/auth/verify-email', { token });
        setSuccess(true);
        if (res.data.accessToken && res.data.user) {
          setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        } else if (user) {
          setAuth({ ...user, emailVerified: true }, accessToken);
        }
        toast.success('Email successfully verified! Your host account is active.', 'Verified');
      } catch (err) {
        setError(err.response?.data?.error || 'Verification link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  // Handle manual 6-digit code entry
  const handleDigitChange = (index, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...codeDigits];
    next[index] = digit;
    setCodeDigits(next);

    if (digit && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== '') && manualEmail) {
      handleManualVerify(next.join(''));
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...codeDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setCodeDigits(next);
    codeInputsRef.current[Math.min(pasted.length, 5)]?.focus();

    if (pasted.length === 6 && manualEmail) {
      handleManualVerify(pasted);
    }
  };

  const handleManualVerify = async (fullCodeParam) => {
    const fullCode = fullCodeParam || codeDigits.join('');
    if (!manualEmail.trim()) {
      setError('Please enter your account email address.');
      return;
    }
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setCodeLoading(true);
    try {
      const res = await api.post('/auth/verify-email', {
        email: manualEmail.trim(),
        code: fullCode,
      });

      setSuccess(true);
      if (res.data.accessToken && res.data.user) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      } else if (user) {
        setAuth({ ...user, emailVerified: true }, accessToken);
      }
      toast.success('Email successfully verified! Your host account is active.', 'Verified');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired verification code.');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative">
      <SEO
        title="Verify Email Address — Sprinkl"
        description="Verify your email address to activate your Sprinkl host account."
        canonical="/verify-email"
        noIndex={true}
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

      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        {loading && (
          <div className="space-y-4 py-8">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verifying your email...</h2>
            <p className="text-xs text-dark-muted">Please wait a moment while we confirm your account.</p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Email Verified!</h2>
            <p className="text-xs text-dark-muted leading-relaxed">
              Your Sprinkl host account is now active. You can fund your wallet and start creating giveaways.
            </p>
            <div className="pt-4">
              <Link
                to="/dashboard"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Go to Host Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Manual 6-Digit Code Entry (if no token or token errored) */}
        {!loading && !success && (
          <div className="space-y-5 py-2 animate-in fade-in text-left">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-2.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Verify Your Account
              </h2>
              <p className="text-xs text-dark-muted">
                Enter your email address and the 6-digit verification code from your welcome email.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualVerify();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="host@example.com"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="flex items-center justify-between gap-2" onPaste={handleDigitPaste}>
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (codeInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-black rounded-xl border transition-all focus:outline-none ${
                        digit
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'border-dark-border bg-dark-bg text-slate-900 dark:text-white focus:border-brand-500'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-dark-muted text-center mt-2">
                  Copy the code directly from the email and paste it above.
                </p>
              </div>

              <button
                type="submit"
                disabled={codeLoading || !manualEmail || codeDigits.join('').length !== 6}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {codeLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Activate Host Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-dark-muted hover:text-brand-500 transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
