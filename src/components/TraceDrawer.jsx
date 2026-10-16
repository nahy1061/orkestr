import React, { useState } from 'react';

export default function TraceDrawer({ traces = [], isOpen, onClose }) {
  const [filterWho, setFilterWho] = useState('all');

  if (!isOpen) return null;

  const filtered = traces.filter(t => {
    if (filterWho === 'all') return true;
    return t.who === filterWho;
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Agent Tool Call Trace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Judges Proof
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Chronological MCP & database invocation logs</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex gap-1">
          {['all', 'planner', 'executor'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterWho(tab)}
              className={`px-2.5 py-1 rounded capitalize text-xs transition-colors ${
                filterWho === tab
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-slate-400">{filtered.length} tool events</span>
      </div>

      {/* Trace Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No tool calls recorded for this session yet.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all font-mono text-xs space-y-2"
            >
              {/* Event Top Bar */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    Step {item.step || idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] font-bold ${
                      item.who === 'planner'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {item.who}
                  </span>
                </div>
                <span className="text-slate-500 font-medium">{item.ms}ms</span>
              </div>

              {/* Tool Name */}
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <span className="text-slate-500">tool:</span>
                <span className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 text-indigo-300">
                  {item.tool}()
                </span>
              </div>

              {/* Arguments JSON */}
              {item.args && (
                <div className="bg-slate-900/90 p-2 rounded border border-slate-800/80">
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Arguments:</div>
                  <pre className="text-[11px] text-amber-300/90 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(item.args, null, 2)}
                  </pre>
                </div>
              )}

              {/* Result */}
              {item.result && (
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Result:</div>
                  <div className="text-[11px] text-emerald-300/90 whitespace-pre-wrap font-sans">
                    {typeof item.result === 'string' ? item.result : JSON.stringify(item.result)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Deterministic Trace Verification</span>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
}
