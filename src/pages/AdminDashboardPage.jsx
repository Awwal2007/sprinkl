import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, AlertTriangle, ArrowDownLeft, ArrowUpRight, CheckCircle2, User } from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function AdminDashboardPage() {
  const { data: txData } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: async () => {
      const res = await api.get('/admin/transactions');
      return res.data.transactions;
    },
  });

  const { data: flagData } = useQuery({
    queryKey: ['adminFlags'],
    queryFn: async () => {
      const res = await api.get('/admin/flags');
      return res.data.flagged;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => {
      const res = await api.get('/admin/revenue');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              Internal Admin &amp; Platform Revenue
            </h1>
            <p className="text-xs text-dark-muted mt-0.5">Transaction monitoring, fee profits &amp; AML compliance</p>
          </div>
        </div>

        {/* Platform Revenue Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
            <p className="text-xs uppercase tracking-wider text-dark-muted font-bold mb-1">
              NGN Platform Profit
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              ₦{((revenueData?.revenue?.NGN || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-dark-muted mt-2">
              From 2.5% promo & 5.0% standard fees
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none" />
            <p className="text-xs uppercase tracking-wider text-dark-muted font-bold mb-1">
              USDT Platform Profit
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300">
              ${((revenueData?.revenue?.USDT || 0) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
            </p>
            <p className="text-[11px] text-dark-muted mt-2">TRC-20 &amp; BEP-20 crypto fee revenue</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl pointer-events-none" />
            <p className="text-xs uppercase tracking-wider text-dark-muted font-bold mb-1">
              Platform Campaigns
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {revenueData?.stats?.totalGiveaways || 0}
            </p>
            <p className="text-[11px] text-brand-400 mt-2 font-medium">
              {revenueData?.stats?.activeGiveaways || 0} currently active
            </p>
          </div>
        </section>

        {/* Flagged Accounts Card */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Flagged High-Volume Host Accounts</span>
            </h2>
            <span className="text-xs text-dark-muted font-medium">
              Threshold: ₦500,000 / $1,000 USDT
            </span>
          </div>

          {flagData && flagData.length > 0 ? (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {flagData.map((f) => (
                  <div key={f.user._id} className="bg-dark-bg rounded-xl border border-dark-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{f.user.fullName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        f.isFlagged
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {f.isFlagged ? 'FLAGGED' : 'OK'}
                      </span>
                    </div>
                    <p className="text-xs text-dark-muted">{f.user.email}</p>
                    <div className="flex gap-4 text-xs">
                      <span>NGN: <strong className="text-slate-200">₦{(f.stats.totalNgnPaid / 100).toLocaleString()}</strong></span>
                      <span>USDT: <strong className="text-slate-200">{(f.stats.totalUsdtPaid / 1000000).toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                      <th className="py-2.5 px-3">Host Name</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">NGN Paid</th>
                      <th className="py-2.5 px-3">USDT Paid</th>
                      <th className="py-2.5 px-3 text-right">KYC Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border text-xs">
                    {flagData.map((f) => (
                      <tr key={f.user._id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-white">{f.user.fullName}</td>
                        <td className="py-3 px-3 text-dark-muted">{f.user.email}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          ₦{(f.stats.totalNgnPaid / 100).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          {(f.stats.totalUsdtPaid / 1000000).toLocaleString()} USDT
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            f.isFlagged
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {f.isFlagged ? 'FLAGGED FOR MANUAL REVIEW' : 'NORMAL VOLUME'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-xs text-dark-muted py-4 text-center">No host accounts flagged.</p>
          )}
        </section>

        {/* Global Transactions Audit */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">System External Provider Audit Log</h2>

          {txData && txData.length > 0 ? (
            <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {txData.map((t) => (
                  <div key={t._id} className="bg-dark-bg rounded-xl border border-dark-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-400 uppercase">{t.provider}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold capitalize ${t.direction === 'inbound' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.direction}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {t.currency === 'NGN' ? `₦${(t.amount / 100).toLocaleString()}` : `${(t.amount / 1000000).toLocaleString()} USDT`}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-muted font-mono truncate">{t.providerReference}</p>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-dark-muted">
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border text-xs">
                    {txData.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 uppercase font-bold text-brand-400">{t.provider}</td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-300">{t.providerReference}</td>
                        <td className="py-3 px-3 capitalize font-semibold">
                          <span className={t.direction === 'inbound' ? 'text-emerald-400' : 'text-rose-400'}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {t.currency === 'NGN' ? `₦${(t.amount / 100).toLocaleString()}` : `${(t.amount / 1000000).toLocaleString()} USDT`}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-xs text-dark-muted py-4 text-center">No provider transactions logged yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}
