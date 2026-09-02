import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, ArrowLeft, Share2, Ban, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import ShareModal from '../components/ShareModal';
import StatusBadge from '../components/StatusBadge';

export default function GiveawayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['giveaway', id],
    queryFn: async () => {
      const res = await api.get(`/giveaways/${id}`);
      return res.data;
    },
    refetchInterval: 3000,
  });

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-4">
        <p className="text-xs text-dark-muted">Loading giveaway details...</p>
      </div>
    );
  }

  const { giveaway, claims } = data;
  const publicUrl = `${window.location.origin}/g/${giveaway.slug}`;

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') return `₦${(amount / 100).toLocaleString()}`;
    return `${(amount / 1000000).toLocaleString()} USDT`;
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this giveaway? Unclaimed funds will be returned to your wallet.')) return;
    try {
      setCancelling(true);
      await api.post(`/giveaways/${id}/cancel`);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-5 sm:space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-dark-muted hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Giveaway Header Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Title + Actions */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge status={giveaway.status} />
                <span className="text-xs font-mono font-bold text-dark-muted">ID: {giveaway.slug}</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">{giveaway.title}</h1>
              {giveaway.description && <p className="text-xs text-dark-muted mt-1">{giveaway.description}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-brand-500/20"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Share Link / QR</span>
              </button>

              {giveaway.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Giveaway'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-dark-border">
            <div className="bg-dark-bg p-3 sm:p-3.5 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted uppercase font-semibold">Amount / Person</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                {formatCurrency(giveaway.amountPerRecipient, giveaway.currency)}
              </p>
            </div>
            <div className="bg-dark-bg p-3 sm:p-3.5 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted uppercase font-semibold">Slots Claimed</span>
              <p className="text-base sm:text-lg font-bold text-brand-400 mt-0.5">
                {giveaway.slotsClaimed} / {giveaway.totalSlots}
              </p>
            </div>
            <div className="bg-dark-bg p-3 sm:p-3.5 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted uppercase font-semibold">Total Budget</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                {formatCurrency(giveaway.totalReservedAmount, giveaway.currency)}
              </p>
            </div>
            <div className="bg-dark-bg p-3 sm:p-3.5 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted uppercase font-semibold">Distributed</span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
                {formatCurrency(giveaway.stats?.totalDistributed || 0, giveaway.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Claims Feed */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Live Claim Stream</h2>
              <p className="text-xs text-dark-muted">Real-time payouts initiated to claimants</p>
            </div>
            <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded font-bold animate-pulse shrink-0">
              LIVE
            </span>
          </div>

          {claims && claims.length > 0 ? (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {claims.map((c) => (
                  <div key={c._id} className="bg-dark-bg rounded-xl border border-dark-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-white truncate">{c.claimantName}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[11px] font-mono text-dark-muted break-all">
                      {c.currency === 'NGN'
                        ? `${c.destination.bankName} — ${c.destination.accountNumber}`
                        : c.destination.walletAddress}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-brand-400 font-mono">{c.payoutReference || 'Pending...'}</span>
                      <span className="text-dark-muted">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                      <th className="py-2.5 px-3">Claimant Name</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Payout Reference</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border text-xs">
                    {claims.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-white">{c.claimantName}</td>
                        <td className="py-3 px-3 font-mono text-dark-muted max-w-[200px] truncate">
                          {c.currency === 'NGN'
                            ? `${c.destination.bankName} - ${c.destination.accountNumber}`
                            : c.destination.walletAddress}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-brand-400">
                          {c.payoutReference || 'Pending...'}
                        </td>
                        <td className="py-3 px-3 text-right text-dark-muted">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-xs text-dark-muted">
              No claims submitted yet. Share the link to start distributing funds!
            </div>
          )}
        </section>
      </main>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        publicUrl={publicUrl}
        title={giveaway.title}
      />
    </div>
  );
}
