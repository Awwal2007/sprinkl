import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Building2, Coins, ArrowUpRight, ArrowDownLeft, Gift, Share2, Eye, RotateCcw } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import FundWalletModal from '../components/FundWalletModal';
import ShareModal from '../components/ShareModal';
import StatusBadge from '../components/StatusBadge';
import { toast, confirmDialog } from '../store/useNotificationStore';

export default function DashboardPage() {
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [releasingCurrency, setReleasingCurrency] = useState(null);
  const [releaseNotice, setReleaseNotice] = useState(null);

  const queryClient = useQueryClient();

  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
  });

  const { data: giveawaysData } = useQuery({
    queryKey: ['giveaways'],
    queryFn: async () => {
      const res = await api.get('/giveaways');
      return res.data.giveaways;
    },
  });

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') {
      return `₦${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${(amount / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    }
  };

  const handleReleaseReserved = async (currency) => {
    const rawAmt = walletData?.balances?.[currency]?.reserved || 0;
    if (rawAmt <= 0) return;

    const formattedAmt = formatCurrency(rawAmt, currency);
    const confirmed = await confirmDialog({
      title: `Transfer Reserved ${currency} to Main Balance?`,
      message: `This will transfer all reserved ${currency} funds (${formattedAmt}) back to your available balance. Any active/open giveaways in ${currency} will be safely closed.`,
      confirmText: 'Yes, Transfer Funds',
      cancelText: 'Keep Giveaways Active',
      confirmVariant: 'brand',
    });
    if (!confirmed) return;

    try {
      setReleasingCurrency(currency);
      setReleaseNotice(null);
      const res = await api.post('/wallet/release-reserved', { currency });
      toast.success(res.data.message, 'Funds Transferred');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['giveaways'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to transfer reserved funds', 'Transfer Failed');
    } finally {
      setReleasingCurrency(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Release Success Notice */}
        {releaseNotice && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-in fade-in">
            <span>{releaseNotice}</span>
            <button
              onClick={() => setReleaseNotice(null)}
              className="px-2 py-0.5 rounded text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Host Dashboard</h1>
            <p className="text-xs text-dark-muted">Overview of your dual-currency wallet and giveaway campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFundModalOpen(true)}
              className="px-4 py-2.5 bg-dark-card hover:bg-slate-800 border border-dark-border text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <Wallet className="w-4 h-4 text-brand-500" />
              <span>Fund Wallet</span>
            </button>
            <Link
              to="/dashboard/create"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Giveaway</span>
            </Link>
          </div>
        </div>

        {/* Dual Currency Wallet Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* NGN Card */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ₦
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nigerian Naira (NGN)</h3>
                  <p className="text-[10px] text-dark-muted">Flutterwave Rail</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1 mb-4">
              <span className="text-xs text-dark-muted font-medium">Available Balance</span>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(walletData?.balances?.NGN?.available || 0, 'NGN')}
              </p>
            </div>

            <div className="pt-4 border-t border-dark-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-dark-muted">Reserved in Giveaways: </span>
                  <span className="font-semibold text-slate-300">
                    {formatCurrency(walletData?.balances?.NGN?.reserved || 0, 'NGN')}
                  </span>
                </div>
                {(walletData?.balances?.NGN?.reserved || 0) > 0 && (
                  <button
                    onClick={() => handleReleaseReserved('NGN')}
                    disabled={releasingCurrency === 'NGN'}
                    className="px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold text-[11px] transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Transfer reserved funds back to your main available balance"
                  >
                    <RotateCcw className={`w-3 h-3 ${releasingCurrency === 'NGN' ? 'animate-spin' : ''}`} />
                    <span>{releasingCurrency === 'NGN' ? 'Transferring...' : 'Transfer to Main Balance'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-dark-muted pt-1">
                <span>DVA Account:</span>
                <span className="font-mono font-bold text-brand-400">
                  {walletData?.dva?.accountNumber || 'Assigned on Fund'}
                </span>
              </div>
            </div>
          </div>

          {/* USDT Card */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  ₮
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tether USDT (Crypto)</h3>
                  <p className="text-[10px] text-dark-muted">TRC-20 & BEP-20 Chains</p>
                </div>
              </div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-bold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1 mb-4">
              <span className="text-xs text-dark-muted font-medium">Available Balance</span>
              <p className="text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(walletData?.balances?.USDT?.available || 0, 'USDT')}
              </p>
            </div>

            <div className="pt-4 border-t border-dark-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-dark-muted">Reserved in Giveaways: </span>
                  <span className="font-semibold text-slate-300">
                    {formatCurrency(walletData?.balances?.USDT?.reserved || 0, 'USDT')}
                  </span>
                </div>
                {(walletData?.balances?.USDT?.reserved || 0) > 0 && (
                  <button
                    onClick={() => handleReleaseReserved('USDT')}
                    disabled={releasingCurrency === 'USDT'}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-[11px] transition-all flex items-center gap-1.5 disabled:opacity-50"
                    title="Transfer reserved funds back to your main available balance"
                  >
                    <RotateCcw className={`w-3 h-3 ${releasingCurrency === 'USDT' ? 'animate-spin' : ''}`} />
                    <span>{releasingCurrency === 'USDT' ? 'Transferring...' : 'Transfer to Main Balance'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-dark-muted">Top Up:</span>
                <button
                  onClick={() => setIsFundModalOpen(true)}
                  className="text-brand-400 hover:underline font-semibold"
                >
                  Deposit USDT →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Giveaways List Section */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Your Giveaways</h2>
              <p className="text-xs text-dark-muted">Manage active campaigns and inspect live payout feeds</p>
            </div>
            <Link
              to="/dashboard/create"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <span>+ Create New</span>
            </Link>
          </div>

          {giveawaysData && giveawaysData.length > 0 ? (
            <div className="grid gap-4">
              {giveawaysData.map((g) => {
                const publicUrl = `${window.location.origin}/g/${g.slug}`;
                return (
                  <div
                    key={g._id}
                    className="bg-dark-bg p-4 rounded-xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={g.status} />
                        <h3 className="text-sm font-bold text-white line-clamp-1">{g.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-dark-muted">
                        <span>
                          Amount:{' '}
                          <strong className="text-slate-200">
                            {formatCurrency(g.amountPerRecipient, g.currency)} / person
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Slots:{' '}
                          <strong className="text-brand-400">
                            {g.slotsClaimed} / {g.totalSlots} claimed
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setShareData({ publicUrl, title: g.title })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                      <Link
                        to={`/dashboard/giveaway/${g._id}`}
                        className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-bg/50 rounded-xl border border-dashed border-dark-border">
              <Gift className="w-10 h-10 text-dark-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No giveaways created yet</h3>
              <p className="text-xs text-dark-muted mb-4 max-w-sm mx-auto">
                Fund your wallet and create your first dual-currency cash or crypto giveaway.
              </p>
              <Link
                to="/dashboard/create"
                className="px-4 py-2 bg-brand-500 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Create Giveaway</span>
              </Link>
            </div>
          )}
        </section>

        {/* Ledger History Audit Table */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Immutable Ledger History</h2>
              <p className="text-xs text-dark-muted">Complete audit trail of all deposits, payouts, reservations, and cancellations</p>
            </div>
          </div>

          {walletData?.ledgerHistory && walletData.ledgerHistory.length > 0 ? (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {walletData.ledgerHistory.map((item) => {
                  const isCredit = item.direction === 'credit';
                  const itemStatus = item.status || 'paid';
                  return (
                    <div key={item._id} className="bg-dark-bg rounded-2xl border border-dark-border p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                              item.type === 'payout'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : item.type === 'fund'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.type === 'cancel'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-300 border border-dark-border'
                            }`}
                          >
                            {item.type === 'cancel' ? 'Cancelled / Refund' : item.type}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              itemStatus === 'paid' || itemStatus === 'success' || itemStatus === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : itemStatus === 'failed'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : itemStatus === 'cancelled'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                itemStatus === 'paid' || itemStatus === 'success'
                                  ? 'bg-emerald-400'
                                  : itemStatus === 'failed'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="capitalize">{itemStatus}</span>
                          </span>
                        </div>

                        <span
                          className={`text-sm font-mono font-black ${
                            isCredit ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                        </span>
                      </div>

                      {/* Beneficiary details if present */}
                      {item.beneficiaryName ? (
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-dark-border/60 text-xs">
                          <span className="text-[10px] text-dark-muted uppercase font-bold block mb-0.5">
                            Beneficiary:
                          </span>
                          <p className="font-extrabold text-white">{item.beneficiaryName}</p>
                          <p className="text-[11px] font-mono text-dark-muted">
                            {item.beneficiaryBank ? `${item.beneficiaryBank} • ` : ''}
                            {item.beneficiaryAccount || ''}
                          </p>
                        </div>
                      ) : item.note ? (
                        <p className="text-xs text-slate-300 font-medium">{item.note}</p>
                      ) : null}

                      <div className="flex items-center justify-between text-[10px] text-dark-muted pt-1 border-t border-dark-border/50">
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()}{' '}
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>Balance After: {formatCurrency(item.balanceAfter, item.currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Beneficiary / Note</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border text-xs">
                    {walletData.ledgerHistory.map((item) => {
                      const isCredit = item.direction === 'credit';
                      const itemStatus = item.status || 'paid';
                      return (
                        <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-3 text-dark-muted whitespace-nowrap">
                            <p className="text-slate-300 font-medium">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-[10px]">
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
                                item.type === 'payout'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : item.type === 'fund'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.type === 'cancel'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-300 border border-dark-border'
                              }`}
                            >
                              {item.type === 'cancel' ? 'Cancelled / Refund' : item.type}
                            </span>
                          </td>

                          {/* Beneficiary / Note */}
                          <td className="py-3.5 px-3">
                            {item.beneficiaryName ? (
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-white text-xs">{item.beneficiaryName}</p>
                                <p className="text-[11px] font-mono text-dark-muted">
                                  {item.beneficiaryBank ? `${item.beneficiaryBank} • ` : ''}
                                  {item.beneficiaryAccount || ''}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300 font-medium">
                                {item.note || (item.type === 'fund' ? 'Wallet Deposit' : 'Platform Action')}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 ${
                                itemStatus === 'paid' || itemStatus === 'success' || itemStatus === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : itemStatus === 'failed'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : itemStatus === 'cancelled'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  itemStatus === 'paid' || itemStatus === 'success'
                                    ? 'bg-emerald-400'
                                    : itemStatus === 'failed'
                                    ? 'bg-rose-400'
                                    : 'bg-amber-400'
                                }`}
                              />
                              <span className="capitalize">{itemStatus}</span>
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isCredit ? 'text-emerald-400' : 'text-slate-100'
                              }`}
                            >
                              {isCredit ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                            </span>
                          </td>

                          {/* Balance After */}
                          <td className="py-3.5 px-3 text-right font-mono text-dark-muted whitespace-nowrap">
                            {formatCurrency(item.balanceAfter, item.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-xs text-dark-muted py-4 text-center">No ledger entries recorded yet.</p>
          )}
        </section>
      </main>

      {/* Modals */}
      <FundWalletModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        dva={walletData?.dva}
        cryptoAddresses={walletData?.cryptoAddresses}
        onFunded={() => {
          refetchWallet();
        }}
      />

      {shareData && (
        <ShareModal
          isOpen={!!shareData}
          onClose={() => setShareData(null)}
          publicUrl={shareData.publicUrl}
          title={shareData.title}
        />
      )}
    </div>
  );
}
