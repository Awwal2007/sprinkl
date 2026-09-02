import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    expired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const style = styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status ? status.toUpperCase() : 'UNKNOWN'}
    </span>
  );
}
