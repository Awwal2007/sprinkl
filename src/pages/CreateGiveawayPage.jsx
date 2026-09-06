import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, ArrowLeft, ArrowRight, ShieldCheck, Wallet, Sparkles, CheckCircle2, ShieldAlert, ArrowUpRight, AlertCircle } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';
import PaymentThresholdModal from '../components/PaymentThresholdModal';
import FundWalletModal from '../components/FundWalletModal';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useNotificationStore';
import SEO from '../components/SEO';

export default function CreateGiveawayPage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('NGN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountPerRecipient, setAmountPerRecipient] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [restrictFirstTime, setRestrictFirstTime] = useState(false);
  const [successMsg, setSuccessMsg] = useState('Thank you for claiming! Hope this brightens your day.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);

  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
  });

  const availableBalance = (currency === 'NGN' || currency === 'AIRTIME')
    ? (walletData?.balances?.NGN?.available || 0) / 100
    : (walletData?.balances?.USDT?.available || 0) / 1000000;

  const isPromo = walletData?.feeTier ? walletData.feeTier.isPromo : true;
  const remainingPromoCount = walletData?.feeTier ? walletData.feeTier.remainingPromoCount : 3;

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const minPayout = currency === 'AIRTIME' ? 50 : (currency === 'NGN' ? (isAdmin ? 100 : 300) : (isAdmin ? 0.1 : 0.2));
  const giftPool = (parseFloat(amountPerRecipient) || 0) * (parseInt(totalSlots) || 0);

  // Payment Threshold check (default ₦500,000 / $500 USDT)
  const userThresholdKobo = user?.kyc?.payoutReviewThreshold ?? 50000000;
  const userThresholdNaira = Math.round(userThresholdKobo / 100);
  const exceedsThreshold = !isAdmin && (
    (currency === 'NGN' || currency === 'AIRTIME') ? (giftPool > userThresholdNaira) : (giftPool > 500)
  );

  // Check Whale Tier: >= ₦1,000,000 NGN or >= $1,000 USDT
  const isWhale = ((currency === 'NGN' || currency === 'AIRTIME') && giftPool >= 1000000) || (currency === 'USDT' && giftPool >= 1000);

  let feeRate = isWhale ? 0.03 : (isPromo ? 0.025 : 0.05);
  const minFloor = (currency === 'NGN' || currency === 'AIRTIME') ? (isPromo ? 150 : 300) : (isPromo ? 0.50 : 1.00);
  const maxCap = isWhale ? ((currency === 'NGN' || currency === 'AIRTIME') ? 35000 : 35) : Infinity;

  let calculatedFee = giftPool * feeRate;
  const isFloorApplied = giftPool > 0 && calculatedFee < minFloor;
  calculatedFee = Math.max(minFloor, calculatedFee);
  calculatedFee = Math.min(maxCap, calculatedFee);

  const platformFee = giftPool > 0 ? Math.round(calculatedFee * 100) / 100 : 0;
  const totalCost = giftPool + platformFee;
  const isInsufficient = giftPool > 0 && Math.round(totalCost * 100) > Math.round(availableBalance * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amountPerRecipient || parseFloat(amountPerRecipient) <= 0) {
      setError('Please enter a valid amount per person.');
      return;
    }
    if (!totalSlots || parseInt(totalSlots) <= 0) {
      setError('Please enter the number of winners (at least 1).');
      return;
    }

    if (currency === 'AIRTIME' && parseFloat(amountPerRecipient) < 50) {
      setError('Minimum airtime payout per recipient is ₦50.');
      return;
    }
    if (currency === 'NGN' && parseFloat(amountPerRecipient) < (isAdmin ? 100 : 300)) {
      setError(isAdmin ? 'Minimum payout per winner is ₦100 NGN (admin mode).' : 'Minimum payout per winner is ₦300 NGN.');
      return;
    }
    if (currency === 'USDT' && parseFloat(amountPerRecipient) < (isAdmin ? 0.1 : 0.2)) {
      setError(isAdmin ? 'Minimum payout per winner is $0.10 USDT (admin mode).' : 'Minimum payout per winner is $0.20 USDT to cover blockchain transfer gas.');
      return;
    }

    const walletLabel = currency === 'AIRTIME' ? 'NGN' : currency;

    if (availableBalance <= 0) {
      const msg = `Your ${walletLabel} wallet has no funds. Please fund your wallet first before creating a giveaway.`;
      setError(msg);
      toast.info(msg, 'Fund Wallet Required');
      setShowFundModal(true);
      return;
    }

    if (isInsufficient) {
      const msg = `Insufficient ${walletLabel} balance. Please fund your wallet first to launch this giveaway! Total required: ${totalCost.toLocaleString()} ${walletLabel} (Prize pool: ${giftPool.toLocaleString()} + Fee: ${platformFee.toLocaleString()}), Available: ${availableBalance.toLocaleString()} ${walletLabel}.`;
      setError(msg);
      toast.info(`Please add at least ${(totalCost - availableBalance).toLocaleString()} ${walletLabel} to your wallet.`, 'Fund Wallet Required');
      setShowFundModal(true);
      return;
    }

    if (exceedsThreshold) {
      setShowThresholdModal(true);
      setError(`Your giveaway payout of ${currency === 'USDT' ? `$${giftPool.toLocaleString()} USDT` : `₦${giftPool.toLocaleString()}`} exceeds your Payment Threshold limit of ${currency === 'USDT' ? '$500 USDT' : `₦${userThresholdNaira.toLocaleString()}`}. Please request a Payment Threshold increase.`);
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
      if (err.response?.data?.code === 'PAYMENT_THRESHOLD_EXCEEDED') {
        setShowThresholdModal(true);
      } else if (err.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        setShowFundModal(true);
      }
      setError(err.response?.data?.error || 'Failed to create giveaway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <SEO
        title="Create Giveaway — Sprinkl Host"
        description="Create a new automated dual-currency giveaway with instant bank or crypto payouts."
        canonical="/dashboard/create"
        noIndex={true}
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-12 flex-1 w-full space-y-5 sm:space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-muted hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Create New Giveaway</h1>
              <p className="text-xs text-slate-500 dark:text-dark-muted">Funds will be locked from your wallet immediately upon creation</p>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Choose Giveaway Currency & Payout Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('NGN');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all active:scale-[0.99] touch-manipulation ${
                    currency === 'NGN'
                      ? 'bg-brand-500/10 border-brand-500 text-slate-900 dark:text-white shadow-md ring-1 ring-brand-500'
                      : 'bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm mb-1 text-slate-900 dark:text-white">🏦 Naira Cash (NGN)</div>
                  <div className="text-xs text-slate-500 dark:text-dark-muted leading-relaxed">Direct transfer to Nigerian bank accounts</div>
                  <div className="mt-2 text-[10px] font-bold text-brand-600 dark:text-brand-400">Min ₦{isAdmin ? '100' : '300'} / person</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrency('AIRTIME');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden active:scale-[0.99] touch-manipulation ${
                    currency === 'AIRTIME'
                      ? 'bg-brand-500/10 border-brand-500 text-slate-900 dark:text-white shadow-md ring-1 ring-brand-500'
                      : 'bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">📱 VTU Airtime Card</div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                      Popular
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-dark-muted leading-relaxed">Instant recharge for MTN, Airtel, Glo & 9mobile</div>
                  <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Low floor: Min ₦50 / person</div>
                </button>

                <div className="relative p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-left opacity-60 cursor-not-allowed select-none">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm mb-1 text-slate-500 dark:text-slate-400">💎 USDT (Crypto)</div>
                      <div className="text-xs text-slate-400 dark:text-dark-muted leading-relaxed">TRC-20 / BEP-20 Hot Wallet transfers</div>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                      Upcoming
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-slate-400">Min $0.20 USDT</div>
                </div>
              </div>

              {currency === 'AIRTIME' && (
                <div className="mt-3 p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">VTU Mobile Recharge Card</p>
                    <p className="text-slate-600 dark:text-dark-muted text-[11px] leading-relaxed">
                      Claimants enter their phone number and network. Airtime is dispatched immediately and funded directly from your existing <strong>NGN wallet balance</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Giveaway Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                placeholder={currency === 'AIRTIME' ? 'e.g. ₦500 MTN & Airtel Airtime Drop ⚡' : 'e.g. ₦10,000 Weekend Cash Drop 🚀'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Rules (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                placeholder="Add instructions (e.g. Retweet & follow @handle on Twitter before claiming)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount per Person ({currency === 'AIRTIME' ? '₦ Airtime' : currency})
                </label>
                <input
                  type="number"
                  min={minPayout}
                  step="any"
                  required
                  value={amountPerRecipient}
                  onChange={(e) => setAmountPerRecipient(e.target.value)}
                  placeholder={currency === 'AIRTIME' ? 'e.g. 100' : currency === 'NGN' ? (isAdmin ? 'e.g. 100' : 'e.g. 500') : 'e.g. 1'}
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500 font-mono font-bold"
                />
                
                {/* Quick preset buttons */}
                {currency === 'AIRTIME' ? (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountPerRecipient(amt)}
                        className={`min-h-[38px] px-3.5 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 touch-manipulation ${
                          Number(amountPerRecipient) === amt
                            ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm ring-1 ring-brand-500'
                            : 'bg-slate-100 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        ₦{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                ) : currency === 'NGN' ? (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {(isAdmin ? [100, 200, 300, 500, 1000, 2000] : [300, 500, 1000, 2000, 5000]).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountPerRecipient(amt)}
                        className={`min-h-[38px] px-3.5 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 touch-manipulation ${
                          Number(amountPerRecipient) === amt
                            ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm ring-1 ring-brand-500'
                            : 'bg-slate-100 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        ₦{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {(isAdmin ? [0.1, 0.5, 1, 5, 10, 25] : [1, 5, 10, 25, 50]).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountPerRecipient(amt)}
                        className={`min-h-[38px] px-3.5 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 touch-manipulation ${
                          Number(amountPerRecipient) === amt
                            ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-400 shadow-sm ring-1 ring-brand-500'
                            : 'bg-slate-100 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 dark:text-dark-muted mt-1.5">
                  Min: {currency === 'AIRTIME'
                    ? '₦50'
                    : currency === 'NGN'
                    ? (isAdmin ? '₦100 (admin)' : '₦300')
                    : (isAdmin ? '$0.10 USDT (admin)' : '$0.20 USDT')
                  } per winner
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of Winners</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-500 dark:text-dark-muted mt-1.5">Minimum: 1 slot</p>
              </div>
            </div>

            {/* Anti-abuse settings */}
            <div className="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-brand-500" />
                <span>Anti-Abuse Safeguards</span>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={restrictFirstTime}
                  onChange={(e) => setRestrictFirstTime(e.target.checked)}
                  className="w-4 h-4 rounded bg-white dark:bg-dark-card border-slate-300 dark:border-dark-border text-brand-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Restrict to first-time claimants only (prevents serial claims across platform)
                </span>
              </label>
            </div>

            {/* Fee Privilege Status */}
            {isWhale ? (
              <div className="bg-gradient-to-r from-purple-500/10 via-brand-500/10 to-teal-500/10 p-4 rounded-xl border border-purple-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Whale Tier Activated</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500 text-white">
                      3.0% Reduced Fee
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      (Capped at {currency === 'NGN' || currency === 'AIRTIME' ? '₦35,000' : '$35 USDT'} max)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-dark-muted mt-0.5">
                    For giveaways of ₦1,000,000+ ($1,000+ USDT), your fee drops to 3.0% and is strictly capped.
                  </p>
                </div>
              </div>
            ) : isPromo ? (
              <div className="bg-gradient-to-r from-brand-500/10 via-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-brand-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">New Creator Privilege Active</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500 text-slate-950">
                      2.5% Fee
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-dark-muted mt-0.5">
                    Enjoy a discounted 2.5% platform fee for your first 3 giveaways ({remainingPromoCount} promo giveaway{remainingPromoCount === 1 ? '' : 's'} remaining). Standard rate is 5.0%.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-dark-border flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Platform Fee:</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-dark-border">
                  5.0% Standard
                </span>
              </div>
            )}

            {/* Total Calculation Box */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-dark-border space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-dark-muted">
                <span>Available Host Balance:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-right">
                  {availableBalance.toLocaleString()} {currency === 'AIRTIME' ? 'NGN' : currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-dark-muted">
                <span>Prize Pool{totalSlots ? ` (${totalSlots} ${Number(totalSlots) === 1 ? 'winner' : 'winners'})` : ''}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-right">
                  {giftPool.toLocaleString()} {currency === 'AIRTIME' ? 'NGN' : currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-dark-muted">
                <span>
                  Platform Fee ({isWhale ? '3% Whale Cap' : isPromo ? '2.5% Promo' : '5% Standard'}):
                  {isFloorApplied && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-1.5">
                      (Min floor)
                    </span>
                  )}
                </span>
                <span className="font-semibold text-brand-600 dark:text-brand-400 font-mono text-right">
                  {platformFee.toLocaleString()} {currency === 'AIRTIME' ? 'NGN' : currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm font-bold text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-dark-border">
                <span>Total Deducted from {currency === 'AIRTIME' ? 'NGN Wallet' : 'Wallet'}:</span>
                <span className={`font-mono text-base text-right font-black ${isInsufficient ? 'text-rose-500 dark:text-rose-400' : 'text-brand-600 dark:text-brand-400'}`}>
                  {totalCost.toLocaleString()} {currency === 'AIRTIME' ? 'NGN' : currency}
                </span>
              </div>
            </div>

            {/* Payment Threshold Alert Banner */}
            {exceedsThreshold && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Payment Threshold Exceeded</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Limit: {currency === 'USDT' ? '$500 USDT' : `₦${userThresholdNaira.toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed text-[11px]">
                    This giveaway payout ({currency === 'USDT' ? `$${giftPool.toLocaleString()} USDT` : `₦${giftPool.toLocaleString()}`}) exceeds your current Payment Threshold limit. You can submit a quick limit increase request with our compliance team to proceed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowThresholdModal(true)}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors shadow-md active:scale-95 touch-manipulation"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Request Payment Threshold Increase
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Mobile / Prominent Desktop Action Button Container */}
            <div className="pt-2 sticky bottom-3 z-30 sm:static">
              <div className="bg-white/95 dark:bg-dark-card/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-1.5 sm:p-0 rounded-2xl sm:rounded-none border border-slate-200/80 dark:border-dark-border/80 sm:border-0 shadow-2xl sm:shadow-none">
                {isInsufficient ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowFundModal(true);
                    }}
                    className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 active:scale-[0.98] text-slate-950 font-black rounded-xl sm:rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all cursor-pointer border border-brand-400/50 touch-manipulation"
                  >
                    <Wallet className="w-5 h-5 shrink-0" />
                    <span>Fund {currency === 'USDT' ? 'USDT' : 'NGN'} Wallet to Proceed</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 active:scale-[0.98] text-slate-950 font-black rounded-xl sm:rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all disabled:opacity-50 cursor-pointer border border-brand-400/50 select-none touch-manipulation"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Creating Giveaway...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
                        <span className="text-center font-black leading-snug">
                          Confirm &amp; Create {currency === 'AIRTIME' ? 'Airtime' : currency} Giveaway
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <PaymentThresholdModal
        isOpen={showThresholdModal}
        onClose={() => setShowThresholdModal(false)}
        targetAmount={giftPool}
        currency={currency}
      />

      <FundWalletModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        dva={walletData?.dva}
        cryptoAddresses={walletData?.cryptoAddresses}
        kycThreshold={userThresholdNaira}
        initialAmount={totalCost}
        defaultCurrency={currency}
        onFunded={() => {
          refetchWallet();
          setShowFundModal(false);
        }}
      />
    </div>
  );
}
