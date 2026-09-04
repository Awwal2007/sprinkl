import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Mail, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import SEO from '../components/SEO';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { user, setAuth, accessToken } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No verification token provided in the link.');
      return;
    }

    const verify = async () => {
      try {
        setLoading(true);
        const res = await api.post('/auth/verify-email', { token });
        setSuccess(true);
        if (user) {
          setAuth({ ...user, emailVerified: true }, accessToken);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Verification link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <SEO
        title="Verify Email Address — Sprinkl"
        description="Verify your email address to activate your Sprinkl host account."
        canonical="/verify-email"
        noIndex={true}
      />
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        {loading && (
          <div className="space-y-4 py-8">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifying your email...</h2>
            <p className="text-xs text-dark-muted">Please wait a moment while we confirm your account.</p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Email Verified!</h2>
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

        {!loading && error && (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Verification Failed</h2>
            <p className="text-xs text-rose-400/90 leading-relaxed">{error}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
              >
                Sign In to Resend Email
              </Link>
              <Link
                to="/"
                className="text-xs text-dark-muted hover:text-slate-300 py-1"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
