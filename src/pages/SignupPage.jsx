import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, User, Phone, ArrowRight, CheckCircle2, Eye, EyeOff, Sun, Moon, AlertCircle, Home } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import SEO from '../components/SEO';

export default function SignupPage() {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState(null);

  const { resolvedTheme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', { fullName, email, phone, password });
      // Security: Ensure any lingering auth session is cleared. User must verify email before logging in.
      useAuthStore.getState().logout();
      setEmailSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendError(null);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendSent(true);
    } catch (err) {
      setResendError(err.response?.data?.error || 'Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative">
        <SEO
          title="Verify Email — Sprinkl Nigeria"
          description="Please verify your email address to activate your Sprinkl account."
          canonical="/signup"
          noIndex={true}
        />

        {/* Theme Toggle Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white/90 dark:bg-dark-card/90 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow transition-all backdrop-blur-md cursor-pointer"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Verify Your Email Address</h2>
          <p className="text-sm text-dark-muted leading-relaxed mb-4">
            We sent an account activation link to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs rounded-xl p-3.5 mb-6 text-left space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Verification Required to Log In</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-dark-muted">
              For security, your account cannot be accessed or logged into until you confirm your email. Please check your inbox and click the verification link.
            </p>
          </div>

          {resendError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-left">
              {resendError}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 bg-brand-500 hover:bg-brand-400 active:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>Go to Home</span>
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendSent}
              className="w-full py-2.5 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending…' : resendSent ? 'Verification link sent ✓' : "Didn't receive the email? Resend"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-dark-muted">
            Already verified your email?{' '}
            <Link to="/" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
              Go Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative">
      <SEO
        title="Sign Up Free — Start Your First Giveaway on Sprinkl Nigeria | NGN & USDT"
        description="Create a free Sprinkl account and launch your first giveaway in 60 seconds. Instantly pay winners to Nigerian bank accounts (NGN) or crypto wallets (USDT). No fraud. No double-claims. Nigeria's #1 giveaway platform."
        canonical="/signup"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Sign Up', path: '/signup' },
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
          <p className="mt-2 text-sm text-dark-muted">Create your free host account</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="signup-name">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="Chinedu Okonkwo"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="signup-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="chinedu@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="signup-phone">
                Phone Number{' '}
                <span className="font-normal text-dark-muted">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="+234 801 234 5678"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="Min. 8 characters"
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
              {/* Password strength hint */}
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= i * 3
                        ? password.length >= 12
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : password.length >= 8
                          ? 'bg-brand-500 dark:bg-brand-400'
                          : 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-slate-200 dark:bg-dark-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-dark-muted mt-1">At least 8 characters required</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Creating Account…</span>
                </>
              ) : (
                <>
                  <span>Get Started — It's Free</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-dark-muted">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
