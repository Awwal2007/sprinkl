import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, ShieldCheck, CheckCircle2, AlertCircle, Building2, Coins, ArrowRight, Sparkles, Search } from 'lucide-react';
import api from '../api/client';

export default function PublicClaimPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Form State
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  // NGN state
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveErr, setResolveErr] = useState(null);

  // USDT state
  const [chain, setChain] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Public Giveaway Details
  const { data: giveawayData, isLoading: loadingGiveaway } = useQuery({
    queryKey: ['publicGiveaway', slug],
    queryFn: async () => {
      const res = await api.get(`/g/${slug}`);
      return res.data.giveaway;
    },
  });

  // Fetch Banks for NGN
  const { data: banks } = useQuery({
    queryKey: ['banks', slug],
    queryFn: async () => {
      const res = await api.get(`/g/${slug}/banks`);
      return res.data.banks;
    },
    enabled: giveawayData?.currency === 'NGN',
  });

  // Handle Account Resolution for NGN
  const handleAccountBlur = async () => {
    if (accountNumber.length === 10 && bankCode) {
      try {
        setResolving(true);
        setResolveErr(null);
        const res = await api.post(`/g/${slug}/resolve-bank`, { accountNumber, bankCode });
        setResolvedName(res.data.resolved.account_name);
      } catch (err) {
        setResolveErr(err.response?.data?.error || 'Could not verify account name');
        setResolvedName('');
      } finally {
        setResolving(false);
      }
    }
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'NGN') return `₦${(amount / 100).toLocaleString()}`;
    return `${(amount / 1000000).toLocaleString()} USDT`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        claimantName,
        claimantEmail,
        bankCode,
        bankName,
        accountNumber,
        resolvedAccountName: resolvedName || claimantName,
        chain,
        walletAddress,
      };

      const res = await api.post(`/g/${slug}/claim`, payload);
      const claimId = res.data.claim.id;
      navigate(`/g/${slug}/claim/${claimId}/success`, { state: { claim: res.data.claim } });
    } catch (err) {
      setError(err.response?.data?.error || 'Claim submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadingGiveaway) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-muted font-medium">Securing giveaway claim link...</p>
        </div>
      </div>
    );
  }

  if (!giveawayData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card p-6 rounded-2xl border border-dark-border max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Giveaway Not Available</h2>
          <p className="text-xs text-dark-muted">This giveaway link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Container */}
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Host Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Host: {giveawayData.hostName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {giveawayData.title}
          </h1>

          {giveawayData.description && (
            <p className="text-xs text-dark-muted line-clamp-3 leading-relaxed">
              {giveawayData.description}
            </p>
          )}
        </div>

        {/* Amount & Slots Card */}
        <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider">Amount You Receive</span>
            <p className="text-2xl font-black text-brand-400 font-mono">
              {formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider">Slots Left</span>
            <p className="text-base font-bold text-white">
              <span className="text-brand-400">{giveawayData.slotsRemaining}</span> / {giveawayData.totalSlots}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Claim Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
            <input
              type="text"
              required
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              placeholder="e.g. Blessing Nwosu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (for confirmation receipt)</label>
            <input
              type="email"
              value={claimantEmail}
              onChange={(e) => setClaimantEmail(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
              placeholder="blessing@example.com"
            />
          </div>

          {/* NGN Bank Destination */}
          {giveawayData.currency === 'NGN' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Your Bank</label>
                <select
                  required
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    const selected = banks?.find((b) => b.code === e.target.value);
                    setBankName(selected ? selected.name : '');
                  }}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Nigerian Bank --</option>
                  {banks?.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Account Number (10 Digits)</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  onBlur={handleAccountBlur}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono tracking-wider"
                  placeholder="0123456789"
                />
              </div>

              {/* Resolved Name Box */}
              {resolving && (
                <div className="text-xs text-brand-400 flex items-center gap-1.5 animate-pulse">
                  <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying bank account name with Paystack...</span>
                </div>
              )}

              {resolvedName && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between">
                  <span>Verified Name: <strong>{resolvedName}</strong></span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              {resolveErr && (
                <div className="text-xs text-rose-400 font-medium">{resolveErr}</div>
              )}
            </>
          )}

          {/* USDT Crypto Destination */}
          {giveawayData.currency === 'USDT' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select USDT Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {['TRC20', 'BEP20'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setChain(c)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        chain === c
                          ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                          : 'bg-dark-bg border-dark-border text-slate-400'
                      }`}
                    >
                      USDT-{c} {c === 'TRC20' ? '(Tron)' : '(BSC)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your USDT-{chain} Wallet Address
                </label>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder={chain === 'TRC20' ? 'TNPn8Z4L1v9XQZpXqJzV5vK8xQZ9...' : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                />
                <p className="text-[10px] text-dark-muted mt-1">
                  Warning: Double check your address. Transfers are irreversible once broadcast on-chain.
                </p>
              </div>
            </>
          )}

          {/* Guarantee Footer */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || giveawayData.slotsRemaining <= 0}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Processing Claim...' : `Claim ${formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)} Now`}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        <p className="text-center text-[10px] text-dark-muted">
          Secured by <strong className="text-slate-300">Sprinkl.biz GiveHub Engine</strong> • 1 Claim Per Destination
        </p>
      </div>
    </div>
  );
}
