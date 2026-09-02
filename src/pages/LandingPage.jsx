import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Zap, ShieldCheck, Coins, ArrowRight, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100 selection:bg-brand-500 selection:text-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual-Currency Giveaway Distribution Platform — Powered by Sprinkl.biz</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Send Cash & Crypto Giveaways <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              With Zero Double-Claims.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-dark-muted mb-8 leading-relaxed">
            Sprinkl lets creators, brands, and communities fund an in-app wallet in <strong className="text-white">NGN</strong> or <strong className="text-white">USDT (Crypto)</strong>, configure instant payouts, and distribute money to recipients automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Launch a Giveaway Now</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-dark-card hover:bg-slate-800 border border-dark-border text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <span>Host Dashboard</span>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-dark-muted font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>Paystack Dedicated Virtual Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>USDT TRC-20 & BEP-20 Hot Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>MongoDB ACID Anti-Duplicate Ledger</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-dark-card/50 border-y border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Built for High-Trust Cash Drops</h2>
            <p className="text-sm text-dark-muted max-w-xl mx-auto">
              Everything you need to run viral giveaways on Twitter, WhatsApp, Telegram, or Instagram without getting scammed or overspending.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-card p-6 rounded-2xl border border-dark-border hover:border-brand-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automated Instant Payouts</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Money is transferred directly to recipients’ Nigerian bank accounts or crypto wallets the moment they claim — no manual approval fatigue.
              </p>
            </div>

            <div className="bg-dark-card p-6 rounded-2xl border border-dark-border hover:border-brand-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Strict 1-Claim Guarantee</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Database-level unique compound indexes enforce that the exact same bank account or wallet address can never be paid twice per giveaway.
              </p>
            </div>

            <div className="bg-dark-card p-6 rounded-2xl border border-dark-border hover:border-brand-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual Currency Rails</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                Fund host wallets seamlessly with Paystack bank transfers or USDT deposits on TRC-20 (Tron) and BEP-20 (BSC).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-dark-border text-center text-xs text-dark-muted">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-slate-300">Sprinkl.biz Platform</span>
          </div>
          <p>© 2026 Sprinkl.biz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
