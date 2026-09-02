import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareModal({ isOpen, onClose, publicUrl, title }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-3">
          <Share2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Share Giveaway</h3>
        <p className="text-xs text-dark-muted mb-5 line-clamp-1">{title}</p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-5">
          <QRCodeSVG value={publicUrl} size={160} level="H" includeMargin={false} />
        </div>

        {/* URL Box */}
        <div className="bg-dark-bg p-2.5 rounded-xl border border-dark-border flex items-center gap-2 mb-4 text-left">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Public Claim Page</span>
        </a>
      </div>
    </div>
  );
}
