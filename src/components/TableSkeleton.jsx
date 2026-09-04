import React from 'react';

/**
 * TableSkeleton
 * Professional table skeleton loader with shimmer pulse animation.
 * Can be rendered directly inside <table> or replaces <tbody>.
 */
export function TableSkeleton({
  rows = 5,
  cols = 6,
  colWidths = [],
}) {
  const defaultWidths = ['w-36', 'w-24', 'w-20', 'w-28', 'w-24', 'w-20', 'w-24', 'w-16'];

  return (
    <tbody className="divide-y divide-dark-border/60 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-dark-border/40">
          {Array.from({ length: cols }).map((_, cIdx) => {
            const w = colWidths[cIdx] || defaultWidths[cIdx % defaultWidths.length];
            const isRight = cIdx === cols - 1;
            return (
              <td key={cIdx} className={`py-3.5 px-3 ${isRight ? 'text-right' : ''}`}>
                <div
                  className={`h-4 bg-slate-800/70 rounded-md ${w} ${isRight ? 'ml-auto' : ''}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * MobileCardSkeleton
 * Shimmer loader for responsive mobile card views of tables.
 */
export function MobileCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-dark-bg/80 rounded-xl border border-dark-border/70 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-800/80 rounded w-36" />
            <div className="h-4 bg-slate-800/80 rounded-full w-16" />
          </div>
          <div className="h-3 bg-slate-800/50 rounded w-48" />
          <div className="flex items-center justify-between pt-2 border-t border-dark-border/40 text-xs">
            <div className="h-3.5 bg-slate-800/60 rounded w-24" />
            <div className="h-3.5 bg-slate-800/60 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * GiveawayCardSkeleton
 * Shimmer loader for giveaway cards on the host dashboard.
 */
export function GiveawayCardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-dark-bg/80 border border-dark-border/70 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-800/80 rounded w-44" />
              <div className="h-4 bg-slate-800/80 rounded-full w-14" />
              <div className="h-4 bg-slate-800/80 rounded-full w-12" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-3.5 bg-slate-800/60 rounded w-28" />
              <div className="h-3.5 bg-slate-800/60 rounded w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-border/50">
            <div className="h-8 bg-slate-800/70 rounded-lg w-20" />
            <div className="h-8 bg-slate-800/70 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default TableSkeleton;
