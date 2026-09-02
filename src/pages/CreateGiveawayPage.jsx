import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, ArrowLeft, ArrowRight, ShieldCheck, Wallet, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function CreateGiveawayPage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('NGN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountPerRecipient, setAmountPerRecipient] = useState(1000);
  const [totalSlots, setTotalSlots] = useState(5);
  const [restrictFirstTime, setRestrictFirstTime] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Thank you for claiming! Hope this brightens your day.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
  });

  const availableBalance = currency === 'NGN'
    ? (walletData?.balances?.NGN?.available || 0) / 100
    : (walletData?.balances?.USDT?.available || 0) / 1000000;

  const isPromo = walletData?.feeTier ? walletData.feeTier.isPromo : true;
  const remainingPromoCount = walletData?.feeTier ? walletData.feeTier.remainingPromoCount : 3;
  const feeRate = isPromo ? 0.025 : 0.05;

  const giftPool = (parseFloat(amountPerRecipient) || 0) * (parseInt(totalSlots) || 0);
  const platformFee = Math.round(giftPool * feeRate * 100) / 100;
  const totalCost = giftPool + platformFee;
  const isInsufficient = totalCost > availableBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInsufficient) {
      setError(
        `Insufficient ${currency} wallet balance. You need ${totalCost.toLocaleString()} ${currency} (Gift: ${giftPool.toLocaleString()} + Fee: ${platformFee.toLocaleString()})`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/giveaways', {
        title,
        description,
        currency,
        amountPerRecipient: parseFloat(amountPerRecipient),
        totalSlots: parseInt(totalSlots),
        settings: {
          restrictFirstTimeClaimantsOnly: restrictFirstTime,
          successMessage: successMsg,
        },
      });

      navigate(`/dashboard/giveaway/${res.data.giveaway.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create giveaway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-dark-muted hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Create New Giveaway</h1>
              <p className="text-xs text-dark-muted">Funds will be locked from your wallet immediately upon creation</p>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Giveaway Currency</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('NGN');
                    setAmountPerRecipient(1000);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currency === 'NGN'
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-md'
                      : 'bg-dark-bg border-dark-border text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">Nigerian Naira (NGN)</div>
                  <div className="text-xs text-dark-muted">Paid via Paystack Transfers to NG Bank Accounts</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USDT');
                    setAmountPerRecipient(10);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currency === 'USDT'
                      ? 'bg-brand-500/10 border-brand-500 text-white shadow-md'
                      : 'bg-dark-bg border-dark-border text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">Tether USDT (Crypto)</div>
                  <div className="text-xs text-dark-muted">Paid via TRC-20 / BEP-20 Hot Wallet</div>
                </button>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Giveaway Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  placeholder="e.g. ₦10,000 Weekend Cash Drop 🚀"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Rules (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                  placeholder="Add instructions (e.g. Retweet & follow @handle on Twitter before claiming)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount per Person ({currency})</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amountPerRecipient}
                    onChange={(e) => setAmountPerRecipient(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Winners (Slots)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalSlots}
                    onChange={(e) => setTotalSlots(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Anti-abuse settings */}
            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                <span>Anti-Abuse Safeguards</span>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictFirstTime}
                  onChange={(e) => setRestrictFirstTime(e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-card border-dark-border text-brand-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">
                  Restrict to first-time claimants only (prevents serial claims across platform)
                </span>
              </label>
            </div>

            {/* Fee Privilege Status */}
            {isPromo ? (
              <div className="bg-gradient-to-r from-brand-500/10 via-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-brand-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">New Creator Privilege Active</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500 text-slate-950">
                      2.5% Fee
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-0.5">
                    Enjoy a discounted 2.5% platform fee for your first 3 giveaways ({remainingPromoCount} promo giveaway{remainingPromoCount === 1 ? '' : 's'} remaining). Standard rate is 5.0%.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-dark-border flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Platform Fee:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-dark-border">
                  5.0% Standard
                </span>
              </div>
            )}

            {/* Total Calculation Box */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-dark-border space-y-2">
              <div className="flex justify-between text-xs text-dark-muted">
                <span>Available Host Balance:</span>
                <span className="font-semibold text-slate-200">
                  {availableBalance.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-xs text-dark-muted">
                <span>Prize Pool (to {totalSlots} winners):</span>
                <span className="font-semibold text-slate-200">
                  {giftPool.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-xs text-dark-muted">
                <span>
                  Platform Fee ({isPromo ? '2.5% Promo' : '5.0%'}):
                </span>
                <span className="font-semibold text-brand-400 font-mono">
                  {platformFee.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-dark-border">
                <span>Total Deducted from Wallet:</span>
                <span className={`font-mono ${isInsufficient ? 'text-rose-400' : 'text-brand-400'}`}>
                  {totalCost.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isInsufficient}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Reserving Balance...' : `Confirm & Launch ${currency} Giveaway`}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
