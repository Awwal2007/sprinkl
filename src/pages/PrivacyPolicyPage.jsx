import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  FileText,
  Clock,
  EyeOff,
  Database,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import useSEO from '../hooks/useSEO';

export default function PrivacyPolicyPage() {
  useSEO({
    title: 'Privacy Policy — Sprinkl | Data Protection & Security',
    description:
      'Learn how Sprinkl protects your data. Read our NDPR-compliant privacy policy detailing data encryption, anti-fraud safeguards, and immediate file purging upon closing chat.',
    path: '/privacy',
  });

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100 selection:bg-brand-500 selection:text-slate-950 font-sans">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-dark-muted hover:text-brand-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Sprinkl Home</span>
        </Link>

        {/* Header */}
        <header className="border-b border-dark-border/80 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>NDPR &amp; GDPR Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-dark-muted max-w-2xl leading-relaxed">
            At <strong>Sprinkl</strong> (accessible via <code className="text-brand-400 font-mono">https://www.sprinkl.biz</code>),
            protecting the privacy and financial data of our giveaway hosts and winners is our highest priority.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-dark-muted mt-4 font-mono">
            <span>Last Updated: September 3, 2026</span>
            <span>&bull;</span>
            <span>Version: 2.1 (Dual-Currency Rails)</span>
          </div>
        </header>

        {/* Policy Content */}
        <article className="space-y-10 text-sm leading-relaxed text-slate-300">
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">1.</span>
              <span>Overview &amp; Scope</span>
            </h2>
            <p>
              This Privacy Policy explains what personal information Sprinkl ("we", "us", or "our") collects, how we use it, how we protect it, and your legal rights under the <strong>Nigeria Data Protection Act (NDPA)</strong>, the <strong>Nigeria Data Protection Regulation (NDPR)</strong>, and applicable international privacy standards including the <strong>General Data Protection Regulation (GDPR)</strong>.
            </p>
            <p>
              By accessing Sprinkl, hosting a giveaway, or claiming a prize via a Sprinkl link, you consent to the practices described in this policy.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">2.</span>
              <span>Information We Collect</span>
            </h2>
            <p>Depending on whether you are a Giveaway Host or a Giveaway Claimant/Winner, we collect:</p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-2">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  <span>Giveaway Hosts</span>
                </h3>
                <ul className="text-xs text-dark-muted space-y-1.5 list-disc pl-4">
                  <li>Full name and verified email address</li>
                  <li>Encrypted password hashes (bcrypt)</li>
                  <li>Dedicated virtual account numbers (DVA)</li>
                  <li>Campaign configurations and budgets</li>
                  <li>Transaction and wallet balance ledger history</li>
                </ul>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-2">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span>Giveaway Winners / Claimants</span>
                </h3>
                <ul className="text-xs text-dark-muted space-y-1.5 list-disc pl-4">
                  <li>Nigerian bank account number and bank name (for NGN)</li>
                  <li>Account beneficiary name verified via Flutterwave</li>
                  <li>Crypto public wallet address (for USDT TRC20/BEP20)</li>
                  <li>IP address and cryptographic one-way anti-fraud hashes</li>
                  <li>Optional phone number (if required by host)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Immediate File Erasure Policy */}
          <section className="space-y-3 bg-gradient-to-br from-dark-card to-rose-950/20 border border-rose-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 text-rose-400 font-extrabold text-base">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h2>3. Immediate Support File &amp; Attachment Erasure Guarantee</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When communicating with Sprinkl Support or requesting assistance with transactions, payment receipts, or KYC verification:
            </p>
            <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  <strong>Zero Permanent Attachment Storage:</strong> All files, screenshots, payment receipts, and documents uploaded during a support chat session are held in isolated temporary storage strictly for the duration of the active troubleshooting session.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  <strong>Immediate &amp; Irreversible Purge:</strong> The millisecond a chat session is closed by the user or resolved by an agent, every single uploaded file is immediately and permanently erased from storage servers. They cannot be recovered, shared, or retrieved.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p>
                  <strong>No Data Mining of Attachments:</strong> We never scan, analyze, or build behavioral profiles from any documents you attach in support inquiries.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Anti-Fraud & Single-Claim Technology */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">4.</span>
              <span>Anti-Double-Claim Technology &amp; Hashing</span>
            </h2>
            <p>
              To protect hosts from botnets, sybil attacks, and repetitive claims, Sprinkl generates normalized destination identifiers:
            </p>
            <p className="bg-dark-card border border-dark-border rounded-xl p-3.5 font-mono text-xs text-slate-300">
              Unique Index = Giveaway_ID + Normalized_Destination (e.g. BankCode:AccountNumber or ChecksummedWallet)
            </p>
            <p>
              These identifiers are stored solely to guarantee idempotency and prevent duplicate disbursements. We do not sell or cross-reference this information with external marketing databases.
            </p>
          </section>

          {/* Section 5: Payment Infrastructure & Third Parties */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">5.</span>
              <span>Payment Processors &amp; Blockchain Public Data</span>
            </h2>
            <p>
              We partner with licensed, CBN-compliant payment infrastructure providers:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-xs text-slate-300">
              <li>
                <strong>Flutterwave (Nigeria):</strong> Processes Naira (NGN) inbound wallet funding and automated bank payouts to all licensed Nigerian commercial and microfinance banks. Payments are subject to Flutterwave's PCI-DSS Level 1 certified security.
              </li>
              <li>
                <strong>Cryptocurrency Blockchains (TRON &amp; Binance Smart Chain):</strong> Payouts in USDT broadcast to public, decentralized ledgers. Transaction hashes and destination addresses on public blockchains are inherently public by the nature of distributed ledger technology.
              </li>
            </ul>
          </section>

          {/* Section 6: Data Retention */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">6.</span>
              <span>Data Retention &amp; Accounting Records</span>
            </h2>
            <p>
              In compliance with financial auditing standards and Anti-Money Laundering (AML) regulations:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-xs text-slate-300">
              <li>
                <strong>Financial Ledger Entries:</strong> Maintained on an append-only basis for the legally required period to ensure auditability and prevent balance drift.
              </li>
              <li>
                <strong>User Account Details:</strong> Retained as long as your host account remains active. You may request account closure and data deletion at any time.
              </li>
              <li>
                <strong>Support Attachments:</strong> Erased immediately upon chat conclusion.
              </li>
            </ul>
          </section>

          {/* Section 7: Your Legal Rights (NDPR & GDPR) */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">7.</span>
              <span>Your Rights Under NDPR &amp; GDPR</span>
            </h2>
            <p>As a data subject, you possess the right to:</p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border text-xs">
                <p className="font-bold text-white mb-1">Right to Access</p>
                <p className="text-dark-muted">Request a copy of all personal data held about you on Sprinkl.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border text-xs">
                <p className="font-bold text-white mb-1">Right to Erasure</p>
                <p className="text-dark-muted">Request permanent deletion of your profile and personal identifiers.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border text-xs">
                <p className="font-bold text-white mb-1">Right to Rectification</p>
                <p className="text-dark-muted">Update or correct inaccurate account details or banking records.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-dark-card border border-dark-border text-xs">
                <p className="font-bold text-white mb-1">Right to Data Portability</p>
                <p className="text-dark-muted">Export your giveaway and ledger history in standard CSV/JSON format.</p>
              </div>
            </div>
          </section>

          {/* Section 8: Contact & Data Protection Officer */}
          <section className="space-y-3 pt-4 border-t border-dark-border">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-brand-400">8.</span>
              <span>Contact Us &amp; Data Protection Officer</span>
            </h2>
            <p>
              If you have any questions about this Privacy Policy, wish to exercise your data rights, or want to submit an inquiry to our Data Protection Officer:
            </p>
            <div className="p-5 rounded-2xl bg-dark-card border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white">Sprinkl Privacy &amp; Compliance Team</p>
                <p className="text-xs text-dark-muted font-mono mt-0.5">Website: https://www.sprinkl.biz</p>
                <p className="text-xs text-dark-muted font-mono">Location: Lagos, Nigeria</p>
              </div>
              <a
                href="mailto:support@sprinkl.biz"
                className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-colors shrink-0"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Privacy Officer</span>
              </a>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 text-center text-xs text-dark-muted">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 Sprinkl.biz. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/signup" className="hover:text-white transition-colors">
              Get Started
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
