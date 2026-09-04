import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
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

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      toast.warning('Your session has expired. Please sign in again to continue.', 'Session Expired');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendSent(false);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      const userName = res.data.user?.fullName || res.data.user?.email?.split('@')[0] || 'Host';
      toast.success(`Welcome back, ${userName}! Signed in successfully.`, 'Signed In');
      navigate('/dashboard');
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

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResendSent(true);
      toast.success('Verification link sent! Please check your email inbox.', 'Email Sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend verification email', 'Error');
    } finally {
      setResending(false);
    }
  };

  const isExpired = typeof window !== 'undefined' && window.location.search.includes('expired=true');

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <SEO
        title="Login to Sprinkl — Your Nigerian Giveaway Dashboard | NGN & USDT Payouts"
        description="Sign in to your Sprinkl account to manage your giveaways, track payouts, and view your wallet balance. Nigeria's #1 automated giveaway platform for cash and crypto."
        canonical="/login"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Sign In', path: '/login' },
        ]}
      />
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl" />
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
          <p className="mt-2 text-sm text-dark-muted">Sign in to your host account</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {isExpired && !error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Your session expired. Please sign in again for security.</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
              {unverifiedEmail && (
                <div className="pt-2.5 border-t border-rose-500/20 flex items-center justify-between gap-2">
                  <span className="text-dark-muted text-[11px]">Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending || resendSent}
                    className="text-brand-400 hover:text-brand-300 font-bold underline transition-colors disabled:opacity-50 text-xs"
                  >
                    {resending ? 'Sending…' : resendSent ? 'Verification link sent ✓' : 'Resend link'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
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
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="host@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
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
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-slate-300 transition-colors p-0.5"
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

          <p className="mt-6 text-center text-xs text-dark-muted">
            Don't have a host account?{' '}
            <Link to="/signup" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Create one in 60s
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
