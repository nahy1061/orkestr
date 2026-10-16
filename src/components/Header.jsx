import React from 'react';

const STATUS_CONFIG = {
  idle: { label: 'System Ready', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  planning: { label: 'Agent Planning...', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' },
  awaiting_approval: { label: 'Awaiting Human Approval', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' },
  executing: { label: 'Executing & Verifying...', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse' },
  done: { label: 'Execution Verified', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  error: { label: 'System Alert', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
};

export default function Header({
  status,
  onReset,
  onMarkShipped,
  toggleTrace,
  isTraceOpen,
  traceCount,
  isBobShipped
}) {
  const currentStatus = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Theme */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">ORKESTR</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Agentika 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Human-in-the-Loop Operations & Deterministic Enforcement</p>
          </div>
        </div>

        {/* State Pill & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium tracking-wide ${currentStatus.color}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>{currentStatus.label}</span>
          </div>

          {/* Trace Button */}
          <button
            onClick={toggleTrace}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isTraceOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Inspect Agent & MCP Tool Calls"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Live Tool Trace</span>
            {traceCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-400/20 text-indigo-300 font-mono text-[10px]">
                {traceCount}
              </span>
            )}
          </button>

          {/* Demo Stale-Order Action */}
          <button
            onClick={onMarkShipped}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isBobShipped
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Test demo trick: mark order 2 as shipped between planning and approval"
          >
            ⚡ {isBobShipped ? 'Order #2 is Shipped' : 'Demo: Mark #2 Shipped'}
          </button>

          {/* Reset Demo */}
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all"
            title="Reset to 12 clean seed orders"
          >
            🔄 Reset Seed
          </button>
        </div>

      </div>
    </header>
  );
}
