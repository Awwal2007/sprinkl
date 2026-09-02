import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/signup', {
        fullName,
        email,
        phone,
        password,
      });
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-slate-950 font-black">
            <Gift className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create Host Account</h2>
            <p className="text-xs text-dark-muted">Under 60 seconds fast onboarding</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-dark-muted absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="Chinedu Okonkwo"
              />
            </div>
          </div>

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
                placeholder="chinedu@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-dark-muted absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                placeholder="+234 801 234 5678"
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
            <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-dark-muted">
          Already registered?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
