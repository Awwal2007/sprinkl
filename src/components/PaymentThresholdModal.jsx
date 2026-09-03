import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, ArrowUpRight, RefreshCw, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export default function PaymentThresholdModal({
  isOpen,
  onClose,
  targetAmount = 500000,
  currency = 'NGN',
  onSuccess,
}) {
  const { user, setUser } = useAuthStore();
  const [requestedThreshold, setRequestedThreshold] = useState(
    currency === 'NGN' ? Math.max(targetAmount, 600000) : Math.max(targetAmount, 1000)
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const currentThresholdKobo = user?.kyc?.payoutReviewThreshold ?? 50000000;
  const currentThresholdNaira = Math.round(currentThresholdKobo / 100);
  const isPending = user?.kyc?.requestStatus === 'pending' || submitted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 10) {
      setError('Please provide a descriptive reason (at least 10 characters) for the limit increase.');
      return;
    }

    const requestedKobo = currency === 'NGN'
      ? Math.round(Number(requestedThreshold) * 100)
      : Math.round(Number(requestedThreshold) * 1000000);

    if (currency === 'NGN' && requestedKobo <= currentThresholdKobo) {
      setError(`Requested threshold must be greater than your current limit of ₦${currentThresholdNaira.toLocaleString()}.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/threshold-request', {
        requestedThreshold: requestedKobo,
        reason: reason.trim(),
      });

      setSubmitted(true);
      if (user) {
        setUser({
          ...user,
          kyc: {
            ...user.kyc,
            requestStatus: 'pending',
            requestedThreshold: requestedKobo,
            requestReason: reason.trim(),
          },
        });
      }
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit Payment Threshold upgrade request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Payment Threshold Required</span>
            </h3>
            <p className="text-xs text-dark-muted">
              Security & compliance verification for high-volume payouts
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isPending ? (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-slate-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-white text-sm">Request Under Review</p>
                <p className="text-slate-300 leading-relaxed">
                  Your request for a higher Payment Threshold is currently being reviewed by the Sprinkl compliance desk.
                </p>
                <p className="text-[11px] text-dark-muted">
                  Requests are typically reviewed within 1–2 hours during business hours. You will receive an immediate update once approved.
                </p>
              </div>
            </div>

            <div className="bg-dark-bg p-3.5 rounded-xl border border-dark-border text-xs space-y-2">
              <div className="flex justify-between text-dark-muted">
                <span>Current Limit:</span>
                <span className="font-mono text-white font-bold">₦{currentThresholdNaira.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-dark-muted">
                <span>Status:</span>
                <span className="font-bold text-amber-400 uppercase text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-dark-bg hover:bg-slate-800 border border-dark-border text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border text-xs space-y-2">
              <div className="flex justify-between items-center text-dark-muted">
                <span>Current Payment Threshold:</span>
                <span className="font-mono text-white font-bold">
                  {currency === 'NGN' ? `₦${currentThresholdNaira.toLocaleString()}` : '$500 USDT'}
                </span>
              </div>
              <div className="flex justify-between items-center text-dark-muted">
                <span>Target Payout Amount:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {currency === 'NGN' ? `₦${Number(targetAmount).toLocaleString()}` : `$${Number(targetAmount).toLocaleString()} USDT`}
                </span>
              </div>
              <p className="text-[11px] text-dark-muted pt-1 border-t border-dark-border/50">
                To pay out more than ₦{currentThresholdNaira.toLocaleString()} in a single giveaway drop, please submit a quick threshold increase request below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Requested Payment Threshold ({currency === 'NGN' ? '₦' : 'USDT'})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-dark-muted font-bold font-mono">
                  {currency === 'NGN' ? '₦' : '$'}
                </span>
                <input
                  type="number"
                  min={currency === 'NGN' ? currentThresholdNaira + 1 : 501}
                  step={currency === 'NGN' ? 50000 : 50}
                  value={requestedThreshold}
                  onChange={(e) => setRequestedThreshold(e.target.value)}
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-brand-500"
                  placeholder="e.g. 1000000"
                />
              </div>
              <span className="text-[10px] text-dark-muted mt-1 block">
                Recommended: ₦{Number(targetAmount).toLocaleString()} or higher to cover upcoming campaigns
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Campaign Reason / Description
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                maxLength={500}
                placeholder="e.g., Major brand sponsorship giveaway, high-ticket creator promotion, or corporate festive reward drop..."
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
              />
              <div className="flex justify-between text-[10px] text-dark-muted mt-1">
                <span>Minimum 10 characters</span>
                <span>{reason.length}/500</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-dark-border text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || reason.trim().length < 10}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Request Increase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
