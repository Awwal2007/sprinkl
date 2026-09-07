import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Zap,
  ShieldCheck,
  Coins,
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles,
  Users,
  Lock,
  Clock,
  ChevronDown,
  TrendingUp,
  Cpu,
  QrCode,
  Sliders,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Headphones,
  MessageSquare,
  Mail,
  FileText,
  Smartphone,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import { useSupportStore } from '../store/useSupportStore';
import { SprinklSocialBar } from '../components/SocialLinks';

export default function LandingPage() {
  const { openChat } = useSupportStore();

  // Calculator state
  const [calcCurrency, setCalcCurrency] = useState('NGN');
  const [recipientsCount, setRecipientsCount] = useState(50);
  const [amountPerRecipient, setAmountPerRecipient] = useState(2500);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive calculator computations
  const totalBudget = recipientsCount * amountPerRecipient;
  const formattedBudget =
    calcCurrency === 'USDT'
      ? `$${totalBudget.toLocaleString()} USDT`
      : `₦${totalBudget.toLocaleString()}${calcCurrency === 'AIRTIME' ? ' Airtime' : ''}`;

  const formattedPerRecipient =
    calcCurrency === 'USDT'
      ? `$${amountPerRecipient.toLocaleString()} USDT`
      : `₦${amountPerRecipient.toLocaleString()}${calcCurrency === 'AIRTIME' ? ' Airtime' : ''}`;

  // Pre-configured recipient presets
  const recipientPresets = [10, 25, 50, 100, 250];
  const ngnAmountPresets = [500, 1000, 2500, 5000, 10000];
  const airtimeAmountPresets = [50, 100, 200, 500, 1000];
  const usdtAmountPresets = [0.2, 0.5, 1, 5, 10];

  const isWhaleCalc =
    ((calcCurrency === 'NGN' || calcCurrency === 'AIRTIME') && totalBudget >= 1000000) ||
    (calcCurrency === 'USDT' && totalBudget >= 1000);

  let calculatedPromoFee = totalBudget * (isWhaleCalc ? 0.03 : 0.025);
  const minPromoFloor = (calcCurrency === 'NGN' || calcCurrency === 'AIRTIME') ? 150 : 0.50;
  const maxWhaleCap = isWhaleCalc ? ((calcCurrency === 'NGN' || calcCurrency === 'AIRTIME') ? 35000 : 35) : Infinity;
  const promoFee = Math.min(maxWhaleCap, Math.max(minPromoFloor, calculatedPromoFee));

  const handleCurrencyChange = (curr) => {
    setCalcCurrency(curr);
    if (curr === 'NGN') setAmountPerRecipient(2500);
    else if (curr === 'AIRTIME') setAmountPerRecipient(200);
    else setAmountPerRecipient(10);
  };

  const faqs = [
    {
      q: 'Is Sprinkl Giveaway real and legitimate in Nigeria? (Sprinkl NG)',
      a: 'Yes! Sprinkl (officially operating at https://www.sprinkl.biz, also commonly searched as Sprinkl NG or Sprinkl Nigeria) is an authentic, verified automated giveaway and reward distribution infrastructure in Nigeria. Sprinkl is not affiliated with Sproxil verification codes, SoKlin promotions, or lawn sprinklers. Verified hosts escrow real funds in advance, and winners receive instant payouts directly to their personal bank accounts (NGN via Flutterwave), VTU mobile airtime (MTN, Airtel, Glo, 9mobile), or crypto wallets (USDT) with zero fees charged to claimants.'
    },
    {
      q: 'What is Sprinkl Nigeria (Sprinkl NG)?',
      a: 'Sprinkl Nigeria is an automated multi-rail reward and giveaway platform designed for creators, brands, and influencers. It completely eliminates manual transfers, DM screenshots, and favoritism by automatically disbursing cash and airtime directly to winners the moment they claim.'
    },
    {
      q: 'How does Sprinkl guarantee zero double-claims?',
      a: 'Sprinkl enforces database-level unique compound indexes at the database engine level on recipient bank account numbers, crypto wallet addresses, and mobile phone numbers per giveaway. Once a destination has received a payout for a specific giveaway, any subsequent request targeting the same destination is rejected atomically before funds are moved.'
    },
    {
      q: 'Which currencies and payment rails are supported?',
      a: 'We support 3 primary rails: 1) Nigerian Naira (NGN) via Flutterwave automated bank transfers to all Nigerian commercial and microfinance banks (OPay, Kuda, Moniepoint, PalmPay, GTBank, Zenith, etc.), 2) Instant VTU Mobile Airtime recharge to all major Nigerian networks (MTN, Airtel, Glo, 9mobile), and 3) Tether USD (USDT) on TRC-20 (Tron) and BEP-20 (Binance Smart Chain).'
    },
    {
      q: 'How do VTU Airtime giveaways work?',
      a: 'Hosts can launch airtime giveaways starting from as low as ₦50 per recipient (funded directly from their NGN balance). Claimants simply enter their phone number and choose their network (MTN, Airtel, Glo, 9mobile), and Sprinkl automatically recharges their SIM via Flutterwave Bills in under 2 seconds. Single-claim validation prevents the same phone number from claiming multiple times.'
    },
    {
      q: 'What are the minimum amounts?',
      a: 'For VTU Airtime drops, the minimum payout is just ₦50 per winner. For NGN bank transfer giveaways, the minimum payout is ₦300 (min deposit ₦1,000). For USDT crypto giveaways, the minimum payout is $0.20 USDT (min deposit $2 USDT). These floors protect your margins and ensure transfer fees are always covered.'
    },
    {
      q: 'How fast do winners receive their funds?',
      a: 'Payouts are executed instantly via background queuing engines the moment the recipient clicks “Claim”. Nigerian bank transfers and VTU airtime recharges typically credit in under 2 seconds, and USDT on-chain payouts broadcast immediately to the network.'
    },
    {
      q: 'What happens to leftover funds if a giveaway expires?',
      a: 'Your funds are never lost. Any unspent balance from unclaimed slots is automatically and instantly returned to your Sprinkl host wallet balance as soon as the giveaway expires or is closed.'
    },
    {
      q: 'Can I restrict who can participate in my giveaway?',
      a: 'Yes! When creating a giveaway, you can configure restrictions such as first-time claimants only (admin-verified), phone number OTP verification, and optional secret passcodes.'
    },
    {
      q: 'How do I fund my host wallet to start?',
      a: 'Hosts can instantly fund their NGN balance via Flutterwave (card, USSD, or direct bank transfer with minimum ₦1,000) which powers both bank payouts and VTU airtime giveaways, as well as dedicated crypto deposit addresses for USDT (minimum $2).'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-slate-950 font-sans transition-colors duration-150">
      <SEO
        title="Sprinkl Nigeria (Sprinkl NG) — #1 Automated Giveaway Platform in Nigeria"
        description="Sprinkl Nigeria (Sprinkl NG / Sprinkl.biz) is Nigeria's official automated giveaway platform. Pay winners directly to bank accounts (NGN), crypto wallets (USDT), or instant VTU airtime (MTN, Airtel, Glo, 9mobile). Zero double-claims guaranteed."
        canonical="/"
        keywords="sprinkl, sprinkl ng, sprinkl nigeria, sprinkl giveaway, sprinkl giveaway nigeria, sprinkl giveaway ng, sprinkl.biz, sprinkl biz, sprinkl cash drop nigeria, sprinkl airtime nigeria, sprinkl legit nigeria, giveaway platform Nigeria, VTU airtime giveaway, airtime drop Nigeria, MTN airtime giveaway, Airtel airtime giveaway, Glo airtime drop, 9mobile recharge Nigeria, automated giveaway platform, cash giveaway Nigeria, crypto giveaway platform, NGN giveaway, USDT giveaway Nigeria"
        breadcrumbs={[{ name: 'Home', path: '/' }]}
      />
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-dark-border/40"
        >
          {/* Ambient Glow Effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-600 dark:text-brand-400 text-xs font-bold mb-6 tracking-wide shadow-inner">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multi-Rail Giveaway Platform: NGN Banks • VTU Airtime • USDT Crypto</span>
              </div>

              {/* Main Heading (Single H1 for SEO) */}
              <h1
                id="hero-heading"
                className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.08]"
              >
                Automated Cash, Crypto &amp; VTU Airtime Giveaways{' '}
                <br className="hidden sm:inline" />
                <span className="text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 bg-clip-text text-transparent font-extrabold inline-block drop-shadow-sm">
                  With Zero Double-Claims.
                </span>
              </h1>

              {/* Subheading */}
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-dark-muted mb-8 leading-relaxed">
                Sprinkl lets creators, brands, and communities fund an in-app vault in{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">NGN (Banks)</strong>,{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">VTU Mobile Airtime (MTN, Airtel, Glo, 9mobile)</strong>, or{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">USDT (Crypto)</strong>, generate a
                single claim link, and disburse instant payouts directly to recipient accounts or phone numbers with mathematical fraud protection.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link
                  id="hero-cta-signup"
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Launch a Giveaway Free</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </Link>
                <a
                  id="hero-cta-calculator"
                  href="#calculator"
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Sliders className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                  <span>Interactive Calculator</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-dark-muted font-medium pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  <span>Instant Flutterwave Bank Transfers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Instant VTU Airtime (All Networks)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  <span>USDT TRC-20 & BEP-20 Multi-Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  <span>ACID Anti-Duplicate Compound Lock</span>
                </div>
              </div>
            </div>

            {/* Interactive Live Giveaway Simulation Card */}
            <div className="mt-14 max-w-4xl mx-auto bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border border-slate-200 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[90px] pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-dark-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Live Campaign Demo
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Weekend Creator Cash Drop #42
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-dark-muted">
                    Created by @techbro • Direct to Bank & Airtime Payouts
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-dark-muted">Total Cash Pool</p>
                    <p className="text-xl font-black text-brand-600 dark:text-brand-400">₦250,000 NGN</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Progress and Live Stats */}
              <div className="py-6">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Slots Claimed</span>
                  <span className="text-brand-600 dark:text-brand-400">88 / 100 claimed (88%)</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-dark-border">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-1000"
                    style={{ width: '88%' }}
                  />
                </div>
              </div>

              {/* Simulated Live Claim Ticker */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-muted mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Tunde A.</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">1s ago</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">₦2,500 &bull; Kuda Bank</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Paid Instantly
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-muted mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Zainab B.</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">3s ago</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">₦500 &bull; MTN Airtime</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                    <Smartphone className="w-3 h-3" /> Recharged Instantly
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-muted mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">Chidinma O.</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">8s ago</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">₦2,500 &bull; OPay</p>
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Paid Instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section
          aria-label="Platform Statistics"
          className="py-12 bg-white/60 dark:bg-dark-card/30 border-b border-slate-200 dark:border-dark-border"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-1">₦45M+</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted font-medium">Cash & Crypto Disbursed</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-brand-600 dark:text-brand-400 mb-1">14,200+</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted font-medium">Verified Claimants</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">0%</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted font-medium">Double-Claim Incidents</p>
              </div>
              <div className="p-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-300 mb-1">&lt; 1.8s</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted font-medium">Average Payout Latency</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Calculator Section */}
        <section id="calculator" className="py-20 bg-slate-50 dark:bg-dark-bg relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold mb-3">
                <Sliders className="w-3.5 h-3.5" />
                <span>Instant Estimator</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
                Calculate Your Giveaway Budget
              </h2>
              <p className="text-sm text-slate-600 dark:text-dark-muted max-w-lg mx-auto">
                See exactly how much you can disburse, settlement speed, and how Sprinkl streamlines your distribution.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl">
              {/* Currency Selector */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted mb-2.5">
                  Select Payout Currency &amp; Rail
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('NGN')}
                    className={`py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-xs sm:text-sm ${
                      calcCurrency === 'NGN'
                        ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-300 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      ₦
                    </span>
                    <span className="truncate">NGN Bank Payout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('AIRTIME')}
                    className={`py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-xs sm:text-sm ${
                      calcCurrency === 'AIRTIME'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">VTU Mobile Airtime</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('USDT')}
                    className={`py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-xs sm:text-sm ${
                      calcCurrency === 'USDT'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs font-black shrink-0">
                      $
                    </span>
                    <span className="truncate">Tether USDT Crypto</span>
                  </button>
                </div>
              </div>

              {/* Number of Recipients Selector */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
                    Number of Winners / Slots
                  </label>
                  <span className="text-base sm:text-lg font-black text-brand-600 dark:text-brand-400">{recipientsCount} Winners</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  {recipientPresets.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRecipientsCount(num)}
                      className={`flex-1 min-w-[72px] sm:min-w-0 sm:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        recipientsCount === num
                          ? 'bg-brand-500 text-slate-950 border-brand-500'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num} Winners
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={recipientsCount}
                  onChange={(e) => setRecipientsCount(Number(e.target.value))}
                  className="w-full accent-brand-500 bg-slate-200 dark:bg-slate-900 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Amount per Winner Selector */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
                    Amount Per Winner
                  </label>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formattedPerRecipient}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(calcCurrency === 'AIRTIME' ? airtimeAmountPresets : calcCurrency === 'NGN' ? ngnAmountPresets : usdtAmountPresets).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountPerRecipient(val)}
                      className={`flex-1 min-w-[65px] sm:min-w-0 sm:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
                        amountPerRecipient === val
                          ? 'bg-brand-500 text-slate-950 border-brand-500'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {calcCurrency === 'USDT' ? `$${val} USDT` : `₦${val.toLocaleString()}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-dark-border rounded-2xl p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-dark-muted font-medium">Prize Pool</p>
                    <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{formattedBudget}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-dark-muted font-medium">Platform Fee</p>
                    <p className="text-lg sm:text-xl font-black text-brand-600 dark:text-brand-400">
                      {calcCurrency === 'USDT'
                        ? `$${promoFee.toFixed(2)}`
                        : `₦${Math.round(promoFee).toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      {isWhaleCalc ? '3.0% Whale Cap' : '2.5% New Host Promo'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-dark-muted font-medium">Payout Latency</p>
                    <p className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-300">&lt; 2 Seconds</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-muted">
                      {calcCurrency === 'AIRTIME' ? 'Direct SIM Recharge' : 'Automated Settlement'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-dark-muted font-medium">Anti-Duplicate</p>
                    <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">100% Lock</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-muted">0% Double-Claims</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-dark-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-dark-muted text-center sm:text-left">
                  <span>
                    Min payout: <strong>₦50 (Airtime) &bull; ₦300 (Bank) &bull; $0.20 (USDT)</strong> per winner &bull; Standard fee: <strong>5.0%</strong> (3% on drops &gt;₦1M / $1k)
                  </span>
                  <span className="text-brand-600 dark:text-brand-400 font-bold">Unclaimed funds automatically refunded</span>
                </div>
              </div>

              {/* Direct CTA */}
              <Link
                to="/signup"
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 text-center transition-all hover:scale-[1.01]"
              >
                <span>Launch This Giveaway Now</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>

        {/* Problem vs Solution Comparison */}
        <section id="about" className="py-20 bg-slate-100/70 dark:bg-dark-card/40 border-y border-slate-200 dark:border-dark-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                Why Creators Stop Doing Manual Giveaways
              </h2>
              <p className="text-sm text-slate-600 dark:text-dark-muted max-w-xl mx-auto">
                Running cash drops on social media manually is broken. Here is how Sprinkl upgrades your giveaways.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Old Way */}
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-bold text-rose-900 dark:text-rose-200">The Manual Way (Broken)</h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>Copy-pasting 50+ bank account numbers into your banking app one by one.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>Double-claim fraud: Sybil users submit 5 different Twitter accounts to the same OPay or Kuda number.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>Daily bank transfer limits hit, leaving followers waiting and angry.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>Zero audit trail or transparency: Followers question if winners were genuinely paid.</span>
                  </li>
                </ul>
              </div>

              {/* Sprinkl Way */}
              <div className="bg-brand-500/10 border border-brand-500/30 rounded-3xl p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900 dark:text-brand-300">The Sprinkl Engine (Automated)</h3>
                </div>

                <ul className="space-y-4 text-sm text-slate-800 dark:text-slate-200">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>Generate a single link or QR code; recipients claim and get paid automatically.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>Database compound constraints enforce 1 claim per bank account or crypto wallet per giveaway.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>Automated payment queue executes high-volume payouts concurrently in milliseconds.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>Instant return of unspent funds on expiration directly back to your host wallet.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step "How It Works" Section */}
        <section className="py-20 bg-slate-50 dark:bg-dark-bg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                How Sprinkl Works in 3 Simple Steps
              </h2>
              <p className="text-sm text-slate-600 dark:text-dark-muted max-w-xl mx-auto">
                From funding to automated disbursement in under 2 minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-dark-border relative shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-black text-xl flex items-center justify-center mb-6">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Fund Your In-App Vault</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Deposit NGN instantly via Flutterwave (powers both bank payouts and VTU airtime drops), or transfer USDT to your secure TRC-20 or BEP-20 address.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-dark-border relative shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xl flex items-center justify-center mb-6">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Set Rules &amp; Share Link</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Choose payout amounts, slot limits, and optional anti-abuse restrictions. Share your unique link or dynamic QR code anywhere.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-dark-border relative shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-300 font-black text-xl flex items-center justify-center mb-6">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Instant Automated Payouts</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Winners enter their bank details, phone number, or wallet address. The Sprinkl ledger validates single-claim rights and transfers cash or airtime in seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-20 bg-white/60 dark:bg-dark-card/50 border-y border-slate-200 dark:border-dark-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                Engineered for High-Trust Community Drops
              </h2>
              <p className="text-sm text-slate-600 dark:text-dark-muted max-w-xl mx-auto">
                Comprehensive fintech architecture protecting your capital and delighting your community.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Automated Settlement</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Real-time disbursement queues powered by Flutterwave Transfer &amp; Bills API and blockchain RPC nodes without manual interventions.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Zero Double-Claim Engine</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Database ACID transactions and compound uniqueness constraints guarantee the same recipient account or phone number can never claim twice.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Triple Payout Rails</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Deliver prizes via Nigerian Bank Transfers (NGN), Instant VTU Mobile Airtime (MTN, Airtel, Glo, 9mobile), or Crypto (USDT TRC-20 &amp; BEP-20) from one unified platform.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Dynamic QR Codes</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Project high-resolution QR codes during live streams on YouTube, Twitch, Twitter Spaces, or physical meetups for instant scanning.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Audit Trails & CSV Export</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Export claimant lists, transaction references, timestamps, and payment statuses directly to spreadsheet format for total proof.
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-brand-500/40 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Unclaimed Balance Recovery</h3>
                <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                  Expired campaigns automatically release unspent reserved funds straight back into your available balance with zero manual disputes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <section id="faq" className="py-20 bg-slate-50 dark:bg-dark-bg">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-slate-600 dark:text-dark-muted">
                Everything you need to know about Sprinkl giveaway rails, anti-fraud mechanics, and fees.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden transition-colors shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-white"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-brand-500 dark:text-brand-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-dark-muted leading-relaxed border-t border-slate-200 dark:border-dark-border/40 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* High-Impact Bottom CTA Banner */}
        <section className="py-20 bg-slate-50 dark:bg-dark-bg relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-tr from-brand-500/10 via-white to-slate-100 dark:from-brand-950/40 dark:via-dark-card dark:to-slate-900 border border-brand-500/30 rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 blur-[130px] pointer-events-none" />

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                Ready to Run Your Cleanest Giveaway Ever?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-dark-muted max-w-xl mx-auto mb-8">
                Join hundreds of creators, brands, and influencers delivering instant happiness to their communities without double-claim fraud.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  id="bottom-cta-signup"
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Create Your Free Account</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Live Support Helpdesk Section */}
        <section id="contact" className="py-20 bg-white/40 dark:bg-dark-card/20 border-t border-slate-200 dark:border-dark-border relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-tr from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-dark-card dark:to-slate-900 border border-slate-200 dark:border-dark-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>24/7 Live Support & Helpdesk</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Need Help or Have Questions?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-muted max-w-md leading-relaxed">
                    Chat with our automated assistant or connect with our human support team. Upload screenshots, report transaction inquiries, or ask anything anytime.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <a href="mailto:support@sprinkl.biz" className="hover:text-brand-600 dark:hover:text-brand-300 transition-colors font-medium">
                        support@sprinkl.biz
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Avg. response &lt; 5 mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => openChat()}
                    className="px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                    <span>Open Live Support Chat</span>
                  </button>
                  <a
                    href="mailto:support@sprinkl.biz?subject=Sprinkl%20Inquiry"
                    className="px-6 py-3.5 bg-white dark:bg-dark-bg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-slate-500 dark:text-dark-muted" />
                    <span>Send Us an Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-slate-950 text-xs text-slate-600 dark:text-dark-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-200 dark:border-dark-border/60">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/sprinkl-logo.png"
                  alt="Sprinkl Logo"
                  className="w-8 h-8 rounded-lg object-contain shadow-sm"
                />
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">Sprinkl</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-dark-muted max-w-sm mb-4 leading-relaxed">
                Automated dual-currency giveaway distribution infrastructure for creators, brands, and digital communities across Nigeria and globally.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational &bull; 99.98% Uptime</span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2">Connect with Sprinkl</p>
                <SprinklSocialBar />
              </div>
            </div>

            {/* Product Links */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-900 dark:text-white tracking-wider mb-3">Product</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/signup" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    Host Giveaways
                  </Link>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    Budget Estimator
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    Anti-Fraud Engine
                  </a>
                </li>
              </ul>
            </div>

            {/* Currency Rails */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-900 dark:text-white tracking-wider mb-3">Payout Rails</p>
              <ul className="space-y-2">
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Nigerian Naira (NGN Bank)</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">VTU Airtime (MTN, Airtel, Glo, 9mobile)</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Tether USDT (TRC-20)</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Tether USDT (BEP-20)</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Flutterwave Automated Rails</span>
                </li>
              </ul>
            </div>

            {/* Platform & Trust */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-900 dark:text-white tracking-wider mb-3">Trust & Security</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>ACID Ledger</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>256-bit SSL</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Zero Double-Claims</span>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Privacy Policy (NDPR)</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p>&copy; 2026 Sprinkl.biz. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
