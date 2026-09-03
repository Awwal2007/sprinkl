import React, { useState } from 'react';
import { X, Building2, Copy, Check, Coins, Zap, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
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
              if (!cryptoAddr) handleFetchCryptoAddress(selectedChain);
            }}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              currency === 'USDT'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>USDT (Crypto)</span>
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
          <div className="space-y-4">
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Deposit Amount (USDT)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={usdtAmount}
                  onChange={(e) => {
                    setUsdtAmount(e.target.value);
                    setOxapayInvoice(null);
                  }}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-brand-500"
                  placeholder="e.g. 50"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-dark-muted">USDT</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setUsdtAmount(String(preset));
                      setOxapayInvoice(null);
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      usdtAmount === String(preset)
                        ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                        : 'bg-dark-bg border-dark-border text-dark-muted hover:text-white'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Chain Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select USDT Network</label>
              <div className="grid grid-cols-2 gap-2">
                {['TRC20', 'BEP20'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedChain(c);
                      setCryptoAddr('');
                      setOxapayInvoice(null);
                    }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      selectedChain === c
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                        : 'bg-dark-bg border-dark-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    USDT-{c} {c === 'TRC20' ? '(Tron)' : '(BSC)'}
                  </button>
                ))}
              </div>
            </div>

            {/* OxaPay Dynamic Invoice Display */}
            {oxapayInvoice ? (
              <div className="bg-dark-bg p-4 rounded-2xl border border-brand-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                    Auto-Credited Deposit
                  </span>
                  <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded font-bold">
                    ${oxapayInvoice.amount} USDT • {oxapayInvoice.network}
                  </span>
                </div>

                {oxapayInvoice.qrCode && (
                  <div className="flex justify-center my-2">
                    <img
                      src={oxapayInvoice.qrCode}
                      alt="Deposit QR Code"
                      className="w-36 h-36 rounded-xl border border-dark-border bg-white p-2"
                    />
                  </div>
                )}

                {oxapayInvoice.payAddress && (
                  <div>
                    <label className="block text-[10px] text-dark-muted mb-1 font-medium">
                      Single-Use {selectedChain} Payment Address:
                    </label>
                    <p className="text-xs font-mono break-all text-brand-400 font-semibold mb-2 p-2 bg-slate-900 rounded-lg border border-dark-border">
                      {oxapayInvoice.payAddress}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(oxapayInvoice.payAddress, 'oxapay-addr')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      {copied === 'oxapay-addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'oxapay-addr' ? 'Address Copied!' : 'Copy Payment Address'}</span>
                    </button>
                  </div>
                )}

                {oxapayInvoice.payLink && (
                  <a
                    href={oxapayInvoice.payLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20"
                  >
                    <span>Open OxaPay Gateway Checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <p className="text-[10px] text-emerald-400 font-medium text-center">
                  ⚡ Funds sent to this address will be automatically detected and credited to your wallet in 1–3 minutes.
                </p>

                <button
                  type="button"
                  onClick={() => setOxapayInvoice(null)}
                  className="w-full py-1 text-[11px] text-dark-muted hover:text-slate-300 transition-colors"
                >
                  ← Change Amount or Network
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCreateOxaPayInvoice}
                  disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Coins className="w-4 h-4" />
                  )}
                  <span>Generate {selectedChain} Deposit Address (${usdtAmount || 10} USDT)</span>
                </button>

                {/* Direct Hot Wallet Fallback */}
                <div className="bg-dark-bg p-3.5 rounded-xl border border-dark-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-dark-muted font-medium uppercase tracking-wider">
                      Master Hot Wallet ({selectedChain})
                    </span>
                    <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold">
                      {selectedChain === 'TRC20' ? 'TRON' : 'BSC'}
                    </span>
                  </div>

                  {cryptoAddr ? (
                    <>
                      <p className="text-xs font-mono break-all text-slate-300 font-semibold my-1.5 leading-relaxed">
                        {cryptoAddr}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(cryptoAddr, 'crypto-addr')}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        {copied === 'crypto-addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'crypto-addr' ? 'Copied!' : 'Copy Master Address'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFetchCryptoAddress(selectedChain)}
                      className="w-full py-1.5 text-xs text-dark-muted hover:text-brand-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Show Master Deposit Address</span>
                    </button>
                  )}
                </div>
              </div>
            )}

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
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      placeholder="2"
                    />
                    <p className="text-[10px] text-dark-muted mt-1">Min: $2.00 USDT</p>
                  </div>
                  <button
                    onClick={handleSimulateUsdtFund}
                    disabled={loading || parseFloat(usdtAmount) < 2}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 self-start"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{loading ? '...' : 'Simulate'}</span>
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
