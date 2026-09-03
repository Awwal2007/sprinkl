import React, { useState } from 'react';
import { X, Building2, Copy, Check, Coins, Zap, AlertCircle, ExternalLink, RefreshCw, Clock, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

const IS_DEV = import.meta.env.DEV; // true locally, false in production build

export default function FundWalletModal({ isOpen, onClose, dva, cryptoAddresses, kycThreshold = 500000, kycRequestStatus = 'none', onFunded }) {
  const [currency, setCurrency] = useState('NGN');
  const [ngnAmount, setNgnAmount] = useState('3000');
  const [usdtAmount, setUsdtAmount] = useState('2');
  const [selectedChain, setSelectedChain] = useState('TRC20');
  const [cryptoAddr, setCryptoAddr] = useState('');
  const [copied, setCopied] = useState(null); // which text was copied
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [localDva, setLocalDva] = useState(dva);
  const [oxapayInvoice, setOxapayInvoice] = useState(null);

  if (!isOpen) return null;

  const hasDva = !!(localDva?.accountNumber);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateOxaPayInvoice = async () => {
    const amount = parseFloat(usdtAmount) || 10;
    if (amount < 1) {
      setMsg({ type: 'error', text: 'Minimum USDT deposit is $1.' });
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      setOxapayInvoice(null);
      const res = await api.post('/wallet/fund/oxapay-invoice', {
        amountUsdt: amount,
        chain: selectedChain,
      });
      setOxapayInvoice(res.data.invoice);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error || 'Failed to generate crypto payment address.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDva = async () => {
    try {
      setSetupLoading(true);
      setMsg(null);
      const res = await api.post('/wallet/setup-ngn-dva');
      setLocalDva(res.data.dva);
      setMsg({ type: 'success', text: 'Dedicated bank account set up successfully!' });
      onFunded(); // refresh wallet data
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to set up bank account. Please try again.' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleFetchCryptoAddress = async (chain) => {
    try {
      setLoading(true);
      setCryptoAddr('');
      const res = await api.post('/wallet/fund/usdt/address', { chain });
      setCryptoAddr(res.data.address);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Could not generate deposit address.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateNgnFund = async () => {
    const amount = parseFloat(ngnAmount);
    if (!amount || amount < 3000) {
      setMsg({ type: 'error', text: 'Minimum NGN deposit is ₦3,000.' });
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      const res = await api.post('/wallet/fund/ngn', { amountNaira: amount });
      setMsg({ type: 'success', text: res.data.message });
      onFunded();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUsdtFund = async () => {
    const amount = parseFloat(usdtAmount);
    if (!amount || amount < 2) {
      setMsg({ type: 'error', text: 'Minimum USDT deposit is $2.' });
      return;
    }
    try {
      setLoading(true);
      setMsg(null);
      const res = await api.post('/wallet/fund/usdt', { amountUsdt: amount, chain: selectedChain });
      setMsg({ type: 'success', text: res.data.message });
      onFunded();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-dark-card border border-dark-border rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Fund Your Wallet</h3>
        <p className="text-xs text-dark-muted mb-5">
          Top up your host balance to start creating giveaways.
        </p>

        {/* Currency Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-dark-bg p-1 rounded-xl border border-dark-border mb-5">
          <button
            onClick={() => { setCurrency('NGN'); setMsg(null); }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              currency === 'NGN'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>NGN (Naira)</span>
          </button>
          <div
            className="py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed select-none text-slate-400 bg-dark-bg/50"
            title="Crypto deposits are currently upcoming"
          >
            <Coins className="w-4 h-4" />
            <span>USDT (Crypto)</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Upcoming
            </span>
          </div>
        </div>

        {/* Alert Messages */}
        {msg && (
          <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-start gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{msg.text}</span>
          </div>
        )}

        {/* ──────────── NGN VIEW ──────────── */}
        {currency === 'NGN' && (
          <div className="space-y-4">
            {/* Primary Option: Flutterwave Instant Checkout (Card & Bank Transfer) */}
            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                  <span>Pay via Bank Transfer or Card</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  SECURE &amp; INSTANT
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-dark-muted mb-1">
                  Enter Deposit Amount (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-dark-muted font-bold font-mono">₦</span>
                  <input
                    type="number"
                    min="3000"
                    step="500"
                    value={ngnAmount}
                    onChange={(e) => setNgnAmount(e.target.value)}
                    className="w-full bg-dark-card border border-dark-border rounded-xl pl-8 pr-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-brand-500"
                    placeholder="3000"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-dark-muted">
                  <span>Minimum: ₦3,000</span>
                  <span>Instant wallet credit</span>
                </div>
              </div>

              {/* Amount Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[3000, 5000, 10000, 25000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNgnAmount(String(val))}
                    className={`py-1 text-[11px] font-mono rounded-lg border transition-all ${
                      Number(ngnAmount) === val
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-bold'
                        : 'bg-dark-card border-dark-border text-slate-400 hover:text-white'
                    }`}
                  >
                    ₦{(val / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>

              {/* Flutterwave Pay Button */}
              <button
                onClick={async () => {
                  const amt = parseFloat(ngnAmount);
                  if (!amt || amt < 3000) {
                    setMsg({ type: 'error', text: 'Minimum NGN deposit is ₦3,000.' });
                    return;
                  }
                  try {
                    setLoading(true);
                    setMsg(null);
                    const res = await api.post('/wallet/fund/flw-initialize', { amountNaira: amt });
                    if (res.data?.paymentLink) {
                      window.location.href = res.data.paymentLink;
                    } else {
                      setMsg({ type: 'error', text: 'Could not generate payment link' });
                    }
                  } catch (err) {
                    setMsg({ type: 'error', text: err.response?.data?.error || 'Payment initialization failed.' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || parseFloat(ngnAmount) < 3000}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Flutterwave...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Pay ₦{Number(ngnAmount || 0).toLocaleString()} with Flutterwave</span>
                  </>
                )}
              </button>
            </div>

            {/* Dedicated Virtual Account info (if already generated) */}
            {hasDva && (
              <div className="bg-dark-bg p-3.5 rounded-xl border border-dark-border">
                <span className="text-[10px] text-dark-muted font-medium uppercase tracking-wider block mb-1">
                  Or Direct Transfer to Your Dedicated Account:
                </span>
                <p className="text-xs font-bold text-slate-200">{localDva.bankName}</p>
                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-dark-border">
                  <span className="text-base font-mono font-black text-brand-400">
                    {localDva.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(localDva.accountNumber, 'ngn-acct')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
                  >
                    {copied === 'ngn-acct' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'ngn-acct' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dev-only sandbox simulation */}
            {IS_DEV && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-[10px] text-amber-400 font-bold mb-1">DEV SANDBOX TEST</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSimulateNgnFund}
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-brand-400" />
                    <span>Instant Sandbox Credit (₦{Number(ngnAmount || 3000).toLocaleString()})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────── USDT VIEW (OxaPay Live Gateway) ──────────── */}
        {currency === 'USDT' && (
          <div className="space-y-4 animate-in fade-in">
            {!oxapayInvoice ? (
              <div className="space-y-4">
                {/* Network Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Blockchain Network
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChain('TRC20')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        selectedChain === 'TRC20'
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm'
                          : 'border-dark-border bg-dark-bg text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-extrabold text-white">TRC20</span>
                      <span className="text-[10px] text-dark-muted">Tron Network</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChain('BEP20')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        selectedChain === 'BEP20'
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm'
                          : 'border-dark-border bg-dark-bg text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-extrabold text-white">BEP20</span>
                      <span className="text-[10px] text-dark-muted">BNB Smart Chain</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Amount to Deposit (USDT)
                    </label>
                    <span className="text-[10px] text-dark-muted">Min: $1.00 USDT</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl pl-8 pr-16 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                      placeholder="10.00"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      USDT
                    </span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex gap-2 mt-2">
                    {['5', '10', '25', '50', '100'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setUsdtAmount(amt)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                          usdtAmount === amt
                            ? 'bg-brand-500/15 border-brand-500 text-brand-400'
                            : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Address Button */}
                <button
                  type="button"
                  onClick={handleCreateOxaPayInvoice}
                  disabled={loading || parseFloat(usdtAmount) < 1}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Crypto Address...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Deposit ${parseFloat(usdtAmount || 0).toFixed(2)} USDT ({selectedChain})</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-dark-muted text-center leading-relaxed">
                  Automated deposit powered by OxaPay. Your wallet will credit automatically as soon as the transaction confirms on the blockchain.
                </p>
              </div>
            ) : (
              /* Invoice Result State */
              <div className="space-y-4">
                <div className="bg-dark-bg p-4 rounded-2xl border border-dark-border text-center space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-dark-border/60">
                    <span className="text-xs text-dark-muted font-bold">Send Exactly</span>
                    <span className="text-sm font-black text-white font-mono">
                      {oxapayInvoice.amount} USDT
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-dark-border/60">
                    <span className="text-xs text-dark-muted font-bold">Network</span>
                    <span className="text-xs font-black text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {oxapayInvoice.network || selectedChain}
                    </span>
                  </div>

                  {/* QR Code */}
                  {oxapayInvoice.qrCode && (
                    <div className="py-2 flex flex-col items-center">
                      <div className="p-2.5 bg-white rounded-xl shadow-lg inline-block">
                        <img
                          src={oxapayInvoice.qrCode}
                          alt="USDT Deposit QR"
                          className="w-40 h-40 object-contain mx-auto"
                        />
                      </div>
                      <span className="text-[10px] text-dark-muted mt-2">
                        Scan with your crypto wallet
                      </span>
                    </div>
                  )}

                  {/* Payment Address */}
                  {oxapayInvoice.payAddress && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider block">
                        Deposit Address ({oxapayInvoice.network || selectedChain}):
                      </span>
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-dark-border">
                        <span className="text-xs font-mono font-bold text-brand-400 break-all select-all">
                          {oxapayInvoice.payAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(oxapayInvoice.payAddress, 'usdt-address')}
                          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                        >
                          {copied === 'usdt-address' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copied === 'usdt-address' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hosted Checkout Link (if available) */}
                  {oxapayInvoice.payLink && (
                    <a
                      href={oxapayInvoice.payLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-dark-border mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                      <span>Open OxaPay Hosted Checkout</span>
                    </a>
                  )}

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2 text-left">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Only send <strong>USDT</strong> via <strong>{oxapayInvoice.network || selectedChain}</strong>. Sending any other asset or wrong network will result in permanent loss of funds.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOxapayInvoice(null);
                      setMsg(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline transition-colors"
                  >
                    ← Change amount or network
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFunded();
                      onClose();
                    }}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Dev-only sandbox */}
            {IS_DEV && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-[10px] text-amber-400 font-bold mb-2">⚠ DEV SANDBOX ONLY</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateUsdtFund}
                    disabled={loading || parseFloat(usdtAmount) < 2}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-brand-400" />
                    <span>Instant Sandbox Credit (${usdtAmount})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
