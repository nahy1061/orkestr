import React, { useState } from 'react';

const SUGGESTIONS = [
  "Find orders pending more than 5 days and prepare a cancellation plan",
  "Review stale orders pending over 10 days for policy review",
  "Refund everything immediately" // Negative test prompt
];

export default function ChatPanel({ onSendMessage, isBusy, messages = [] }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestion = (text) => {
    if (isBusy) return;
    onSendMessage(text);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full backdrop-blur-sm">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <h2 className="text-sm font-semibold text-white">Operator Agent Console</h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Model: Tool-Calling Planner</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[180px] max-h-[320px]">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p>No operator instructions issued yet.</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Select a quick prompt below or type instructions to instruct the planner agent.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col text-xs ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">
                {msg.role === 'user' ? 'Operator (You)' : 'Planner Agent'}
              </span>
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isBusy && (
          <div className="flex flex-col items-start text-xs">
            <span className="text-[10px] text-slate-500 mb-1 font-mono uppercase">Planner Agent</span>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 rounded-bl-none flex items-center gap-2 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Calling inspection tools & validating order policies...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80">
        <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1.5 tracking-wider">
          Suggested Prompts:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              disabled={isBusy}
              onClick={() => handleSuggestion(s)}
              className="text-left text-[11px] px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-600 transition-all disabled:opacity-50 truncate max-w-full"
            >
              "{s}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/70 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isBusy}
          placeholder="e.g. Find orders pending more than 5 days and prepare plan..."
          className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isBusy}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          <span>Send</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}
