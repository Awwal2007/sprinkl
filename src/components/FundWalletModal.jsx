import React, { useState } from 'react';
import { X, Building2, Copy, Check, QrCode, Zap, Coins } from 'lucide-react';
import api from '../api/client';

export default function FundWalletModal({ isOpen, onClose, dva, cryptoAddresses, onFunded }) {
  const [currency, setCurrency] = useState('NGN');
  const [ngnAmount, setNgnAmount] = useState('10000');
  const [usdtAmount, setUsdtAmount] = useState('50');
  const [selectedChain, setSelectedChain] = useState('TRC20');
  const [cryptoAddr, setCryptoAddr] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchCryptoAddress = async (chain) => {
    try {
      setLoading(true);
      const res = await api.post('/wallet/fund/usdt/address', { chain });
      setCryptoAddr(res.data.address);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateNgnFund = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await api.post('/wallet/fund/ngn', { amountNaira: parseFloat(ngnAmount) });
      setMsg({ type: 'success', text: res.data.message });
      onFunded();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUsdtFund = async () => {
    try {
      setLoading(true);
      setMsg(null);
      const res = await api.post('/wallet/fund/usdt', {
        amountUsdt: parseFloat(usdtAmount),
        chain: selectedChain,
      });
      setMsg({ type: 'success', text: res.data.message });
      onFunded();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Funding failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">Fund Your Wallet</h3>
        <p className="text-xs text-dark-muted mb-5">
          Select your preferred payment rail to top up your host balance.
        </p>

        {/* Currency Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-dark-bg p-1 rounded-xl border border-dark-border mb-6">
          <button
            onClick={() => setCurrency('NGN')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              currency === 'NGN'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>NGN (Flutterwave)</span>
          </button>
          <button
            onClick={() => {
              setCurrency('USDT');
              handleFetchCryptoAddress(selectedChain);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              currency === 'USDT'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>USDT (Crypto)</span>
          </button>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium mb-4 ${
              msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* NGN View */}
        {currency === 'NGN' && (
          <div className="space-y-4">
            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-muted font-medium">Dedicated Bank Account</span>
                <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded font-bold">
                  INSTANT CREDIT
                </span>
              </div>
              <p className="text-sm font-bold text-slate-200">{dva?.bankName || 'Wema Bank (GiveHub DVA)'}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-border">
                <span className="text-lg font-mono font-black text-brand-400 tracking-wider">
                  {dva?.accountNumber || '9928471092'}
                </span>
                <button
                  onClick={() => handleCopy(dva?.accountNumber || '9928471092')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-dark-border">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quick Dev Sandbox Deposit (₦)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={ngnAmount}
                  onChange={(e) => setNgnAmount(e.target.value)}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  placeholder="10000"
                />
                <button
                  onClick={handleSimulateNgnFund}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{loading ? 'Processing...' : 'Deposit'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USDT View */}
        {currency === 'USDT' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Network</label>
              <div className="grid grid-cols-2 gap-2">
                {['TRC20', 'BEP20'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedChain(c);
                      handleFetchCryptoAddress(c);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
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

            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted font-medium uppercase tracking-wider block mb-1">
                Your Deposit Address ({selectedChain})
              </span>
              <p className="text-xs font-mono break-all text-brand-400 font-semibold mb-3">
                {cryptoAddr || 'Generating deposit address...'}
              </p>
              <button
                onClick={() => handleCopy(cryptoAddr)}
                disabled={!cryptoAddr}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Address Copied!' : 'Copy Deposit Address'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-dark-border">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quick Dev Sandbox Deposit (USDT)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  placeholder="50"
                />
                <button
                  onClick={handleSimulateUsdtFund}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{loading ? 'Processing...' : 'Deposit'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
