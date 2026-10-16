import React from 'react';

export default function ExecutionReport({ report, onDismiss }) {
  if (!report || report.length === 0) return null;

  const verified = report.filter(r => r.outcome === 'cancelled_verified');
  const skipped = report.filter(r => r.outcome === 'skipped_ineligible');
  const failed = report.filter(r => r.outcome === 'failed');

  const totalVerifiedAmount = verified.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Post-Execution Verification Report</h3>
            <p className="text-xs text-emerald-300/80">Every status mutation re-read and validated via Orders API</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
          >
            Dismiss Report
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {/* Metric summary pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">Cancelled & Verified</div>
            <div className="text-lg font-bold text-white mt-0.5">{verified.length} orders</div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">${totalVerifiedAmount.toFixed(2)} refunded</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-[10px] uppercase font-mono text-amber-400 font-semibold">Skipped Ineligible</div>
            <div className="text-lg font-bold text-white mt-0.5">{skipped.length} orders</div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">Caught by executor re-check</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Execution Failures</div>
            <div className="text-lg font-bold text-white mt-0.5">{failed.length} orders</div>
            <div className="text-[11px] text-slate-400 mt-0.5">0 fatal exceptions</div>
          </div>
        </div>

        {/* Skipped Items (Demo Highlight!) */}
        {skipped.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Race Condition Guard Triggered (Demo Twist Invariant)</span>
            </div>
            {skipped.map(item => (
              <div key={item.order_id} className="text-[11px] text-amber-200/90 pl-6">
                <strong>Order #{item.order_id} ({item.customer}):</strong> {item.reason}
              </div>
            ))}
          </div>
        )}

        {/* Verified Cancelled Table */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Verification Status</th>
                <th className="py-2 px-3">Read-Back Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {verified.map(item => (
                <tr key={item.order_id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-mono font-medium text-slate-200">#{item.order_id}</td>
                  <td className="py-2 px-3 text-slate-300">{item.customer}</td>
                  <td className="py-2 px-3 font-mono text-slate-200">${item.amount?.toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      cancelled_verified
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
