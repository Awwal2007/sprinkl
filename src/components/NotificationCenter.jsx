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
        return {
          card: 'border-emerald-500/30 bg-slate-950/95 shadow-emerald-500/15 text-emerald-300',
          accent: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
        };
      case 'error':
        return {
          card: 'border-rose-500/30 bg-slate-950/95 shadow-rose-500/15 text-rose-300',
          accent: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]',
        };
      case 'warning':
        return {
          card: 'border-amber-500/30 bg-slate-950/95 shadow-amber-500/15 text-amber-300',
          accent: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
        };
      default:
        return {
          card: 'border-brand-500/30 bg-slate-950/95 shadow-brand-500/15 text-brand-300',
          accent: 'bg-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]',
        };
    }
  };

  return (
    <>
      {/* Toast Notifications Container */}
      <div
        aria-live="polite"
        className="fixed top-0 left-0 right-0 sm:top-auto sm:left-auto sm:bottom-0 sm:right-0 z-[99999] pointer-events-none"
      >
        {/* Inner flex column — anchors top-center on mobile, bottom-right on desktop */}
        <div className="flex flex-col gap-2 p-3 sm:p-5 sm:items-end">
          {toasts.map((t) => {
            const styles = getToastStyles(t.type);
            return (
              <div
                key={t.id}
                className={`pointer-events-auto w-full sm:w-auto sm:min-w-[300px] sm:max-w-sm rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 sm:slide-in-from-bottom-3 duration-300 flex items-start gap-3 relative overflow-hidden ${styles.card}`}
                role="alert"
                style={{ padding: '12px 14px 12px 18px' }}
              >
                {/* Left Accent Stripe */}
                <div className={`w-[3px] absolute left-0 top-0 bottom-0 rounded-l-2xl ${styles.accent}`} />

                <div className="shrink-0 mt-0.5">
                  {getToastIcon(t.type)}
                </div>

                <div className="flex-1 min-w-0">
                  {t.title && (
                    <p className="text-[11px] sm:text-xs font-extrabold text-white tracking-wide mb-0.5 leading-tight">
                      {t.title}
                    </p>
                  )}
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed break-words font-medium">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-white transition-colors p-1 -mr-0.5 -mt-0.5 rounded-lg shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
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
