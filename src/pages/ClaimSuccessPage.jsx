import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Share2, Sparkles, ArrowLeft, ExternalLink, Gift, ArrowRight } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import SEO from '../components/SEO';

export default function ClaimSuccessPage() {
  const { slug, claimId } = useParams();
  const location = useLocation();

  const [claim, setClaim] = useState(location.state?.claim || null);

  useEffect(() => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const pollStatus = async () => {
      try {
        const res = await api.get(`/g/${slug}/claim/${claimId}/status`);
        setClaim(res.data.claim);
      } catch (err) {
        console.error(err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [slug, claimId]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') return `₦${(amount / 100).toLocaleString()}`;
    return `${(amount / 1000000).toLocaleString()} USDT`;
  };

  const isFailed = claim?.status === 'failed';
  const isPaid = claim?.status === 'paid';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <SEO
        title={isPaid ? 'Claim Paid Successfully — Sprinkl' : 'Giveaway Claim Status — Sprinkl'}
        description="View the live status of your giveaway prize payout on Sprinkl."
        canonical={`/g/${slug}/claim/${claimId}/success`}
        noIndex={true}
      />
      <div className="max-w-md w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        {isFailed ? (
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5] hidden" />
            <span className="text-2xl font-bold">✕</span>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {isFailed ? 'Payout Failed' : isPaid ? 'Claim Paid!' : 'Claim Submitted!'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-dark-muted">
            {isFailed
              ? 'The payout transfer could not be completed by Flutterwave.'
              : claim?.successMessage || 'Funds transfer initiated directly to your destination.'}
          </p>
        </div>

        {/* Failure Detail Notice */}
        {isFailed && claim?.failureReason && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-left space-y-1">
            <p className="font-bold">Error Reason:</p>
            <p className="font-mono text-[11px] leading-relaxed break-words">{claim.failureReason}</p>
          </div>
        )}

        {/* Claim Info Box */}
        <div className="bg-slate-50 dark:bg-dark-bg p-4 rounded-2xl border border-slate-200 dark:border-dark-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-dark-muted font-medium">Claim Amount</span>
            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-brand-400">
              {formatCurrency(claim?.amount || 0, claim?.currency || 'NGN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-dark-border">
            <span className="text-slate-500 dark:text-dark-muted font-medium">Payout Status</span>
            <StatusBadge status={claim?.status || 'processing'} />
          </div>

          {claim?.payoutReference && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-dark-border">
              <span className="text-slate-500 dark:text-dark-muted font-medium">Reference Code</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px] truncate max-w-[180px]">
                {claim.payoutReference}
              </span>
            </div>
          )}
        </div>

        {/* Viral Growth Hook: Want to create yours? */}
        <div className="bg-gradient-to-br from-brand-500/10 via-slate-50 to-emerald-500/5 dark:from-brand-500/15 dark:via-dark-card dark:to-dark-bg border border-brand-500/20 dark:border-brand-500/30 rounded-2xl p-5 text-left space-y-3 relative overflow-hidden shadow-xl shadow-brand-500/5 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-brand-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-brand-400 block">
                Loved this instant payout?
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Want to create your own giveaway?
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
            Reward your fans, followers, or community with instant cash drops in <strong className="text-slate-900 dark:text-slate-200">Naira (NGN)</strong> or <strong className="text-slate-900 dark:text-slate-200">Crypto (USDT)</strong>. 100% automated with zero double-claims.
          </p>

          <Link
            to="/signup"
            className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Your Giveaway Free</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        <div className="pt-1">
          <Link
            to="/"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-dark-border"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sprinkl Home</span>
          </Link>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-dark-muted">
          Powered by <strong className="text-slate-600 dark:text-slate-300">Sprinkl.biz Platform Engine</strong>
        </p>
      </div>
    </div>
  );
}
