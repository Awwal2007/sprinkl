import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

export default function NotificationCenter() {
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);
  const confirmModal = useNotificationStore((state) => state.confirmModal);
  const closeConfirm = useNotificationStore((state) => state.closeConfirm);

  // Close confirm modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && confirmModal.isOpen) {
        closeConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal.isOpen, closeConfirm]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-brand-400 shrink-0" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-dark-card/95 shadow-emerald-500/10 text-emerald-300';
      case 'error':
        return 'border-rose-500/30 bg-dark-card/95 shadow-rose-500/10 text-rose-300';
      case 'warning':
        return 'border-amber-500/30 bg-dark-card/95 shadow-amber-500/10 text-amber-300';
      default:
        return 'border-brand-500/30 bg-dark-card/95 shadow-brand-500/10 text-brand-300';
    }
  };

  return (
    <>
      {/* Toast Notifications Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 relative overflow-hidden ${getToastStyles(
              t.type
            )}`}
            role="alert"
          >
            {getToastIcon(t.type)}
            <div className="flex-1 min-w-0 pr-2">
              {t.title && (
                <p className="text-xs font-extrabold text-white tracking-wide mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-slate-200 leading-relaxed break-words font-medium">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : confirmModal.confirmVariant === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-brand-500/10 border border-brand-500/20 text-brand-400'
                }`}
              >
                {confirmModal.confirmVariant === 'danger' ? (
                  <AlertCircle className="w-6 h-6 stroke-[2.2]" />
                ) : confirmModal.confirmVariant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <HelpCircle className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-dark-muted mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-dark-border bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-lg transition-all ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : confirmModal.confirmVariant === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                    : 'bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-brand-500/25'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
