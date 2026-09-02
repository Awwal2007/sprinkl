import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Share2, Sparkles, ArrowLeft, ExternalLink } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

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

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Claim Submitted!</h1>
          <p className="text-xs text-dark-muted">
            {claim?.successMessage || 'Funds transfer initiated directly to your destination.'}
          </p>
        </div>

        {/* Claim Info Box */}
        <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-muted font-medium">Claim Amount</span>
            <span className="text-base font-extrabold font-mono text-brand-400">
              {formatCurrency(claim?.amount || 0, claim?.currency || 'NGN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-dark-border">
            <span className="text-dark-muted font-medium">Payout Status</span>
            <StatusBadge status={claim?.status || 'processing'} />
          </div>

          {claim?.payoutReference && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-dark-border">
              <span className="text-dark-muted font-medium">Reference Code</span>
              <span className="font-mono text-slate-300 font-bold text-[11px] truncate max-w-[180px]">
                {claim.payoutReference}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to GiveHub Home</span>
          </Link>
        </div>

        <p className="text-[10px] text-dark-muted">
          Powered by <strong className="text-slate-300">Sprinkl.biz Platform Engine</strong>
        </p>
      </div>
    </div>
  );
}
