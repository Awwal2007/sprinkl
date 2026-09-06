import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, ShieldCheck, CheckCircle2, AlertCircle, Building2, Coins, ArrowRight, Sparkles, Search, Smartphone, Check } from 'lucide-react';
import api from '../api/client';
import SEO from '../components/SEO';

const detectCarrier = (phone) => {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, '');
  let prefix = '';
  if (clean.startsWith('234') && clean.length >= 6) {
    prefix = '0' + clean.slice(3, 6);
  } else {
    prefix = clean.slice(0, 4);
  }

  const mtnPrefixes = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtelPrefixes = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'];
  const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobilePrefixes = ['0809', '0817', '0818', '0909', '0908'];

  if (mtnPrefixes.includes(prefix)) return 'MTN';
  if (airtelPrefixes.includes(prefix)) return 'AIRTEL';
  if (gloPrefixes.includes(prefix)) return 'GLO';
  if (nineMobilePrefixes.includes(prefix)) return '9MOBILE';
  return null;
};

const getDeviceFingerprint = () => {
  try {
    let fp = localStorage.getItem('sprinkl_device_id');
    if (!fp) {
      fp = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('sprinkl_device_id', fp);
    }
    return fp;
  } catch {
    return 'dev_' + Math.random().toString(36).substring(2, 11);
  }
};

export default function PublicClaimPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // NGN state
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveErr, setResolveErr] = useState(null);

  // Airtime state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [detectedNetwork, setDetectedNetwork] = useState('');
  const [userSelectedNetwork, setUserSelectedNetwork] = useState(false);

  // USDT state
  const [chain, setChain] = useState('TRC20');
  const [walletAddress, setWalletAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if this browser has already claimed this specific giveaway
  const [alreadyClaimed, setAlreadyClaimed] = useState(() => {
    try {
      const saved = localStorage.getItem(`sprinkl_claimed_${slug}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const quickBanks = [
    { name: 'OPay', code: '100004' },
    { name: 'PalmPay', code: '100033' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'Moniepoint', code: '090405' },
    { name: 'GTBank', code: '058' },
    { name: 'Access Bank', code: '044' },
    { name: 'Zenith Bank', code: '057' },
  ];

  // Fetch Public Giveaway Details
  const { data: giveawayData, isLoading: loadingGiveaway } = useQuery({
    queryKey: ['publicGiveaway', slug],
    queryFn: async () => {
      const res = await api.get(`/g/${slug}`);
      return res.data.giveaway;
    },
  });

  // Check by giveaway ID as well once giveawayData is loaded
  useEffect(() => {
    if (giveawayData?.id && !alreadyClaimed) {
      try {
        const saved = localStorage.getItem(`sprinkl_claimed_${giveawayData.id}`);
        if (saved) {
          setAlreadyClaimed(JSON.parse(saved));
        }
      } catch {}
    }
  }, [giveawayData?.id, alreadyClaimed]);

  // Real-time phone carrier auto-detection
  useEffect(() => {
    if (giveawayData?.currency === 'AIRTIME' && phoneNumber) {
      const detected = detectCarrier(phoneNumber);
      setDetectedNetwork(detected || '');
      if (detected && !userSelectedNetwork) {
        setNetwork(detected);
      }
    }
  }, [phoneNumber, giveawayData?.currency, userSelectedNetwork]);

  // Dynamic SEO metadata
  const seoTitle = giveawayData
    ? `Claim "${giveawayData.title}" Giveaway — Win Cash or Airtime | Sprinkl Nigeria`
    : 'Claim Your Giveaway Prize — Instant Payout | Sprinkl Nigeria';
  const seoDescription = giveawayData
    ? `You've been invited to claim a prize from "${giveawayData.title}" on Sprinkl! ${giveawayData.currency === 'AIRTIME' ? 'Receive instant airtime recharge to your SIM line.' : giveawayData.currency === 'NGN' ? 'Receive Nigerian Naira directly to your bank account.' : 'Receive USDT crypto to your wallet.'} 100% automated. No fraud. Powered by Sprinkl Nigeria.`
    : 'Claim your giveaway prize instantly on Sprinkl. Receive Nigerian Naira to your bank account, airtime recharge, or USDT crypto. 100% automated and fraud-proof.';

  // Fetch Banks for NGN
  const { data: banks } = useQuery({
    queryKey: ['banks', slug],
    queryFn: async () => {
      const res = await api.get(`/g/${slug}/banks`);
      return res.data.banks;
    },
    enabled: giveawayData?.currency === 'NGN',
  });

  const filteredBanks = bankQuery.trim()
    ? banks?.filter((b) => b.name.toLowerCase().includes(bankQuery.toLowerCase())).slice(0, 15) || []
    : [];

  // Auto-verify bank account with Flutterwave as soon as 10 digits are typed and bank is selected
  useEffect(() => {
    let active = true;
    if (accountNumber.length === 10 && bankCode) {
      setResolving(true);
      setResolveErr(null);
      api.post(`/g/${slug}/resolve-bank`, { accountNumber, bankCode })
        .then((res) => {
          if (active) {
            setResolvedName(res.data.resolved.account_name);
            setResolveErr(null);
          }
        })
        .catch((err) => {
          if (active) {
            setResolveErr(err.response?.data?.error || 'Could not verify account name with this bank');
            setResolvedName('');
          }
        })
        .finally(() => {
          if (active) setResolving(false);
        });
    } else {
      setResolvedName('');
      setResolveErr(null);
    }
    return () => { active = false; };
  }, [accountNumber, bankCode, slug]);

  const formatCurrency = (amount, currency) => {
    if (currency === 'USDT') return `${(amount / 1000000).toLocaleString()} USDT`;
    if (currency === 'AIRTIME') return `₦${(amount / 100).toLocaleString()}`;
    return `₦${(amount / 100).toLocaleString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (alreadyClaimed) {
      setError('You have already claimed this giveaway on this browser.');
      return;
    }

    setLoading(true);

    if (giveawayData.currency === 'NGN' && !resolvedName) {
      setError('Please select your bank and enter a valid 10-digit account number to verify your bank account first.');
      setLoading(false);
      return;
    }

    if (giveawayData.currency === 'AIRTIME') {
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setError('Please enter a valid 11-digit Nigerian phone number to receive your airtime.');
        setLoading(false);
        return;
      }
    }

    try {
      let payload = {};
      if (giveawayData.currency === 'AIRTIME') {
        const finalNetwork = network || detectedNetwork || 'MTN';
        payload = {
          claimantName: `${finalNetwork} Winner`,
          phoneNumber: phoneNumber.trim(),
          network: finalNetwork,
          claimantPhone: phoneNumber.trim(),
        };
      } else if (giveawayData.currency === 'NGN') {
        payload = {
          claimantName: resolvedName || 'Sprinkl Claimant',
          bankCode,
          bankName,
          accountNumber,
          resolvedAccountName: resolvedName,
        };
      } else {
        payload = {
          claimantName: `${chain} Winner`,
          chain,
          walletAddress,
        };
      }

      payload.deviceFingerprint = getDeviceFingerprint();

      const res = await api.post(`/g/${slug}/claim`, payload);
      const claimId = res.data.claim.id;

      // Save claim record to localStorage so this browser cannot claim again
      const claimRecord = {
        claimId,
        slug,
        giveawayId: giveawayData.id,
        claimedAt: new Date().toISOString(),
        destination: resolvedName || phoneNumber || accountNumber || walletAddress,
        amount: giveawayData.amountPerRecipient,
        currency: giveawayData.currency,
      };
      try {
        localStorage.setItem(`sprinkl_claimed_${slug}`, JSON.stringify(claimRecord));
        if (giveawayData.id) {
          localStorage.setItem(`sprinkl_claimed_${giveawayData.id}`, JSON.stringify(claimRecord));
        }
      } catch {}

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
        <SEO
          title="Claim Giveaway Prize — Sprinkl"
          description="Claim your giveaway prize instantly on Sprinkl with automated cash or crypto payouts."
          canonical={`/g/${slug}`}
        />
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-dark-muted font-medium">Securing giveaway claim link...</p>
        </div>
      </div>
    );
  }

  if (!giveawayData) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 transition-colors duration-150">
        <SEO
          title="Giveaway Not Found — Sprinkl"
          description="This giveaway link is invalid or has ended."
          canonical={`/g/${slug}`}
          noIndex={true}
        />
        <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border max-w-sm w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Giveaway Not Available</h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted">This giveaway link is invalid or has ended.</p>
          </div>
          <div className="pt-2">
            <Link
              to="/signup"
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-brand-500/20"
            >
              <span>Want to create yours? Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-150">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={`/g/${slug}`}
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Claim Giveaway', path: `/g/${slug}` },
        ]}
      />
      {/* Container */}
      <div className="max-w-md w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Host Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Host: {giveawayData.hostName}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {giveawayData.title}
          </h1>

          {giveawayData.description && (
            <p className="text-xs text-slate-600 dark:text-dark-muted line-clamp-3 leading-relaxed">
              {giveawayData.description}
            </p>
          )}
        </div>

        {/* Amount Card (No slots shown as requested) */}
        <div className="bg-slate-50 dark:bg-dark-bg p-5 rounded-2xl border border-slate-200 dark:border-dark-border text-center">
          <span className="text-[10px] text-slate-500 dark:text-dark-muted uppercase font-bold tracking-wider block mb-1">
            Amount You Receive
          </span>
          <p className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400 font-mono">
            {formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* State A: Already Claimed from this browser */}
        {alreadyClaimed ? (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ALREADY CLAIMED
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-2">
                You've Already Claimed!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                This browser has already claimed from this giveaway. Each participant is limited to one claim per drop.
              </p>
            </div>
            {alreadyClaimed.claimId && (
              <Link
                to={`/g/${slug}/claim/${alreadyClaimed.claimId}/success`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>View Your Claim Receipt</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            )}
          </div>
        ) : giveawayData.isFullyClaimed || giveawayData.status === 'completed' || giveawayData.slotsClaimed >= giveawayData.totalSlots ? (
          /* State B: Fully Claim (Claimant limit reached / completed) */
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Gift className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-wider">
                FULLY CLAIM
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-2">
                Fully Claimed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                All {giveawayData.totalSlots} available slot{giveawayData.totalSlots === 1 ? '' : 's'} for this giveaway have already been claimed. Follow the host for future drops!
              </p>
            </div>
            <div className="pt-1">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Host Your Own Giveaway</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        ) : giveawayData.isCancelled ? (
          /* State C: Cancelled */
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30">
                CANCELLED
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-2">
                Giveaway Cancelled
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                This giveaway campaign has been cancelled by the host.
              </p>
            </div>
          </div>
        ) : giveawayData.isExpired ? (
          /* State D: Expired */
          <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-dark-border rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                EXPIRED
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-2">
                Giveaway Expired
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                The time limit for this giveaway has elapsed.
              </p>
            </div>
          </div>
        ) : (
          /* State E: Active Claim Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NGN Bank Destination */}
            {giveawayData.currency === 'NGN' && (
              <>
                {/* Typeable / Searchable Bank Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select or Type Bank Name
                  </label>

                  {bankName ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-dark-bg border border-brand-500/50 text-slate-900 dark:text-white shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{bankName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-dark-muted font-mono">Code: {bankCode}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBankName('');
                          setBankCode('');
                          setBankQuery('');
                          setResolvedName('');
                        }}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 dark:text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={bankQuery}
                          onChange={(e) => {
                            setBankQuery(e.target.value);
                            setShowBankDropdown(true);
                          }}
                          onFocus={() => setShowBankDropdown(true)}
                          className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl pl-10 pr-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500"
                          placeholder="Search e.g. OPay, Kuda, GTBank, Zenith..."
                        />
                      </div>

                      {/* Dropdown Results */}
                      {showBankDropdown && filteredBanks.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border/50">
                          {filteredBanks.map((b) => (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => {
                                setBankCode(b.code);
                                setBankName(b.name);
                                setShowBankDropdown(false);
                                setBankQuery('');
                              }}
                              className="w-full text-left px-4 py-3 text-xs text-slate-800 dark:text-slate-200 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-between touch-manipulation"
                            >
                              <span className="font-semibold">{b.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-dark-muted font-mono">{b.code}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Quick Bank Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {quickBanks.map((qb) => (
                          <button
                            key={qb.code}
                            type="button"
                            onClick={() => {
                              setBankCode(qb.code);
                              setBankName(qb.name);
                              setShowBankDropdown(false);
                              setBankQuery('');
                            }}
                            className="min-h-[34px] text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-semibold transition-all active:scale-95 touch-manipulation"
                          >
                            {qb.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    10-Digit Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono tracking-wider"
                    placeholder="0123456789"
                  />
                </div>

                {/* Resolving / Name Resolution Feedback */}
                {resolving && (
                  <div className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 animate-pulse">
                    <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Verifying account with bank registry...</span>
                  </div>
                )}

                {resolvedName && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs space-y-1 shadow-inner">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Account Name</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                      {resolvedName}
                    </p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                      Funds will be dispatched directly to this bank account instantly upon claim.
                    </p>
                  </div>
                )}

                {resolveErr && (
                  <div className="text-xs text-rose-500 dark:text-rose-400 font-medium p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    {resolveErr}
                  </div>
                )}
              </>
            )}

            {/* VTU Airtime Destination */}
            {giveawayData.currency === 'AIRTIME' && (
              <div className="space-y-4">
                {/* Visual VTU Card Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white border border-slate-700 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black tracking-wide">VTU AIRTIME RECHARGE</p>
                        <p className="text-[10px] text-slate-400">Instant Automated SIM Credit</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30">
                      {formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)}
                    </span>
                  </div>

                  {/* Network Selector Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-medium">Select Mobile Network:</span>
                      {detectedNetwork && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Detected: {detectedNetwork}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {[
                        { id: 'MTN', name: 'MTN', badge: 'bg-yellow-400 text-slate-950' },
                        { id: 'AIRTEL', name: 'Airtel', badge: 'bg-red-600 text-white' },
                        { id: 'GLO', name: 'Glo', badge: 'bg-emerald-600 text-white' },
                        { id: '9MOBILE', name: '9mobile', badge: 'bg-teal-700 text-white' },
                      ].map((net) => {
                        const isSelected = (network || detectedNetwork) === net.id;
                        return (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() => {
                              setNetwork(net.id);
                              setUserSelectedNetwork(true);
                            }}
                            className={`min-h-[38px] py-2 px-1 rounded-xl text-center font-black text-[11px] sm:text-xs transition-all border active:scale-95 touch-manipulation ${
                              isSelected
                                ? `${net.badge} border-white shadow-lg ring-2 ring-brand-400 scale-[1.02]`
                                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {net.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-dark-muted focus:outline-none focus:border-brand-500 font-mono tracking-wider"
                      placeholder="e.g. 08031234567 or +234..."
                    />
                    {(network || detectedNetwork) && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-700 dark:text-brand-400 border border-brand-500/30">
                          {network || detectedNetwork}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-dark-muted mt-1">
                    Airtime is credited instantly to your phone line upon claim submission.
                  </p>
                </div>
              </div>
            )}

            {/* USDT Crypto Destination */}
            {giveawayData.currency === 'USDT' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select USDT Network
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['TRC20', 'BEP20'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setChain(c)}
                        className={`min-h-[40px] py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation ${
                          chain === c
                            ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500'
                            : 'bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {chain} USDT Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-bg border border-slate-300 dark:border-dark-border rounded-xl px-4 py-3 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                    placeholder={chain === 'TRC20' ? 'T...' : '0x...'}
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-1">
                    Warning: Double check your address. Transfers are irreversible once broadcast on-chain.
                  </p>
                </div>
              </>
            )}

            {/* Guarantee Footer & Claim Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  resolving ||
                  (giveawayData.currency === 'NGN' && !resolvedName) ||
                  (giveawayData.currency === 'AIRTIME' && !phoneNumber.trim()) ||
                  (giveawayData.currency === 'USDT' && !walletAddress.trim())
                }
                className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-400 active:scale-[0.98] text-slate-950 font-black rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all disabled:opacity-50 cursor-pointer touch-manipulation border border-brand-400/50 select-none"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-center font-black leading-snug">
                  {resolving
                    ? 'Verifying Bank Account...'
                    : loading
                    ? 'Processing Claim...'
                    : giveawayData.currency === 'AIRTIME'
                    ? `⚡ Recharge ${formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)} Now`
                    : `Claim ${formatCurrency(giveawayData.amountPerRecipient, giveawayData.currency)} Now`}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-500 dark:text-dark-muted">
          Secured by <strong className="text-slate-800 dark:text-slate-300">Sprinkl Engine</strong> • 1 Claim Per Destination
        </p>
      </div>

      {/* Under-Card Viral Hook: Want to create yours? */}
      <div className="mt-4 text-center max-w-md w-full">
        <div className="p-3.5 sm:px-5 rounded-2xl bg-white/95 dark:bg-dark-card/90 border border-slate-200 dark:border-dark-border/80 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <Gift className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Want to create yours?</p>
              <p className="text-[10px] text-slate-500 dark:text-dark-muted">Host instant giveaways in NGN or USDT</p>
            </div>
          </div>
          <Link
            to="/signup"
            className="w-full sm:w-auto px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/15 hover:scale-105 active:scale-95"
          >
            <span>Create Yours Free</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
