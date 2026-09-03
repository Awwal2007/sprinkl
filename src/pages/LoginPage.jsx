import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useNotificationStore';
import useSEO from '../hooks/useSEO';

export default function LoginPage() {
  useSEO({
    title: 'Login to Sprinkl — Your Nigerian Giveaway Dashboard | NGN & USDT Payouts',
    description: 'Sign in to your Sprinkl account to manage your giveaways, track payouts, and view your wallet balance. Nigeria\'s #1 automated giveaway platform for cash and crypto.',
    path: '/login',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
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
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      const userName = res.data.user?.fullName || res.data.user?.email?.split('@')[0] || 'Host';
      toast.success(`Welcome back, ${userName}! Signed in successfully.`, 'Signed In');
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(errMsg);
      toast.error(errMsg, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = typeof window !== 'undefined' && window.location.search.includes('expired=true');

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black">
            <Gift className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sign In to Sprinkl</h2>
            <p className="text-xs text-dark-muted">Manage host wallets & giveaway drops</p>
          </div>
        </div>

        {isExpired && !error && (
          <div className="p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Your session has expired. For your security, please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-dark-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="host@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-dark-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-dark-muted">
          Don't have a host account?{' '}
          <Link to="/signup" className="text-brand-400 font-semibold hover:underline">
            Create one in 60s
          </Link>
        </p>
      </div>
    </div>
  );
}
