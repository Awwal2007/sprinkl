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

  if (!isOpen) return null;

  const hasDva = !!(localDva?.accountNumber);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
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
            {hasDva ? (
              /* Real DVA Account Card */
              <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-dark-muted font-medium">Your Dedicated Bank Account</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                    INSTANT CREDIT
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-200 mb-1">{localDva.bankName}</p>
                <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                  <span className="text-2xl font-mono font-black text-brand-400 tracking-wider">
                    {localDva.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(localDva.accountNumber, 'ngn-acct')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied === 'ngn-acct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'ngn-acct' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-dark-muted mt-3 leading-relaxed">
                  Transfer any amount (min ₦3,000) to this account from any Nigerian bank. Your Sprinkl wallet will be credited <strong className="text-white">instantly</strong> once payment is confirmed.
                </p>
              </div>
            ) : (
              /* No DVA yet — Setup Button */
              <div className="bg-dark-bg p-5 rounded-xl border border-dashed border-brand-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Set Up Your Dedicated Bank Account</h4>
                  <p className="text-xs text-dark-muted mt-1">
                    Get a personal Wema Bank account number for instant NGN deposits. One-time setup, takes 5 seconds.
                  </p>
                </div>
                <button
                  onClick={handleSetupDva}
                  disabled={setupLoading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {setupLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Setting up...</>
                  ) : (
                    <><Building2 className="w-4 h-4" /> Generate My Bank Account</>
                  )}
                </button>
              </div>
            )}

            {/* Dev-only sandbox deposit */}
            {IS_DEV && hasDva && (
              <div className="pt-2 border-t border-dark-border">
                <p className="text-[10px] text-amber-400 font-bold mb-2">⚠ DEV SANDBOX ONLY — Not visible in production</p>
                <label className="block text-xs font-medium text-slate-300 mb-1">Simulate NGN Deposit (₦)</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="3000"
                      step="100"
                      value={ngnAmount}
                      onChange={(e) => setNgnAmount(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                      placeholder="3000"
                    />
                    <p className="text-[10px] text-dark-muted mt-1">Minimum: ₦3,000</p>
                  </div>
                  <button
                    onClick={handleSimulateNgnFund}
                    disabled={loading || parseFloat(ngnAmount) < 3000}
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

        {/* ──────────── USDT VIEW ──────────── */}
        {currency === 'USDT' && (
          <div className="space-y-4">
            {/* Chain Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select USDT Network</label>
              <div className="grid grid-cols-2 gap-2">
                {['TRC20', 'BEP20'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedChain(c);
                      setCryptoAddr('');
                      handleFetchCryptoAddress(c);
                    }}
                    className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
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

            {/* Deposit Address Card */}
            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-dark-muted font-medium uppercase tracking-wider">
                  Your {selectedChain} Deposit Address
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-bold">
                  {selectedChain === 'TRC20' ? 'TRON' : 'BSC'}
                </span>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-dark-muted animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating deposit address...</span>
                </div>
              ) : cryptoAddr ? (
                <>
                  <p className="text-xs font-mono break-all text-brand-400 font-semibold my-2 leading-relaxed">
                    {cryptoAddr}
                  </p>
                  <button
                    onClick={() => handleCopy(cryptoAddr, 'crypto-addr')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied === 'crypto-addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'crypto-addr' ? 'Address Copied!' : 'Copy Deposit Address'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleFetchCryptoAddress(selectedChain)}
                  className="w-full py-2.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-brand-500/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate {selectedChain} Address
                </button>
              )}

              {cryptoAddr && (
                <p className="text-[10px] text-amber-400 mt-2 font-medium leading-relaxed">
                  ⚠ Send only USDT-{selectedChain} to this address. Minimum deposit: $2 USDT. Wrong network = lost funds.
                </p>
              )}
            </div>

            <p className="text-[11px] text-dark-muted leading-relaxed">
              After sending USDT to the address above, your Sprinkl wallet will be credited once the transaction receives sufficient network confirmations (usually 1–3 minutes).
            </p>

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
