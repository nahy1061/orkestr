import React from 'react';

export default function PlanCard({ plan, onApprove, onReject, isExecuting }) {
  if (!plan) return null;

  const totalAmount = plan.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-slate-900/80 border-2 border-indigo-500/40 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header with Human Gate badge */}
      <div className="p-4 bg-indigo-950/40 border-b border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold text-xs">
            HITL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Proposed Action Plan</h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {plan.id}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">{plan.summary}</p>
          </div>
        </div>

        {/* Human Gate Alert */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs text-amber-300">
          <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Human Approval Required</span>
        </div>
      </div>

      {/* Plan Body */}
      <div className="p-5 space-y-4 text-xs">
        {/* Orders targeted for cancellation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Eligible for Cancellation ({plan.items.length})
            </h4>
            <span className="font-mono text-slate-300 font-semibold">
              Total Proposed: ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Order</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Age</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Enforcement Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {plan.items.map((item) => (
                  <tr key={item.order_id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono font-medium text-indigo-300">#{item.order_id}</td>
                    <td className="py-2 px-3 font-medium text-slate-200">{item.customer}</td>
                    <td className="py-2 px-3 font-mono text-amber-400">{item.age_days}d</td>
                    <td className="py-2 px-3 font-mono text-slate-300">${item.amount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-slate-400">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Excluded orders */}
        {plan.excluded && plan.excluded.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Excluded by Policy Constraints ({plan.excluded.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plan.excluded.map((ex) => (
                <div
                  key={ex.order_id}
                  className="p-2.5 rounded-lg bg-slate-950/30 border border-slate-800/80 flex items-start gap-2 text-slate-400"
                >
                  <span className="font-mono font-medium text-slate-300 shrink-0">#{ex.order_id}</span>
                  <div className="text-[11px] leading-tight">
                    <span className="font-medium text-slate-300">{ex.customer}: </span>
                    <span>{ex.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate Rationale & Anti Double-Click Buttons */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 max-w-md">
            <span className="text-amber-400 font-medium">Security Policy: </span>
            Single-use cryptographic approval ID. Server verifies state dynamically prior to executing each write tool call.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onReject(plan.id)}
              disabled={isExecuting || plan.used}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-all disabled:opacity-40"
            >
              Reject Plan
            </button>
            <button
              onClick={() => onApprove(plan.id)}
              disabled={isExecuting || plan.used}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Verifying & Executing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Approve & Execute Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
