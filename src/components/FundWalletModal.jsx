import React, { useState } from 'react';
import { X, Building2, Copy, Check, Coins, Zap, AlertCircle, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import api from '../api/client';

const IS_DEV = import.meta.env.DEV; // true locally, false in production build

export default function FundWalletModal({ isOpen, onClose, dva, cryptoAddresses, onFunded }) {
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
          <button
            onClick={() => {
              setCurrency('USDT');
              setMsg(null);
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              currency === 'USDT'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>USDT (Crypto)</span>
            <span
              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                currency === 'USDT'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              Upcoming
            </span>
          </button>
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

        {/* ──────────── USDT VIEW ──────────── */}
        {currency === 'USDT' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Upcoming Update Card */}
            <div className="bg-dark-bg p-5 rounded-2xl border border-amber-500/30 text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/5">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5">
                  Upcoming Update
                </span>
                <h4 className="text-sm font-bold text-white">USDT Deposits Launching Shortly</h4>
              </div>

              <p className="text-xs text-dark-muted leading-relaxed max-w-xs mx-auto">
                Automated multi-user crypto deposits (TRC20 & BEP20) via our payment gateway are currently undergoing merchant verification. We will activate this feature once verification is complete!
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('NGN');
                    setMsg(null);
                  }}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Use NGN Instant Bank Deposit Instead</span>
                </button>
              </div>
            </div>

            {/* Dev-only sandbox */}
            {IS_DEV && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-[10px] text-amber-400 font-bold mb-2">⚠ DEV SANDBOX ONLY</p>
                <label className="block text-xs font-medium text-slate-300 mb-1">Simulate USDT Deposit</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="2"
                      step="0.5"
                      value={usdtAmount}
                      onChange={(e) => setUsdtAmount(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                      placeholder="2"
                    />
                  </div>
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
