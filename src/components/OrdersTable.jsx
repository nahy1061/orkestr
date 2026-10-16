import React, { useState } from 'react';

export default function OrdersTable({ orders, plannedOrderIds = [] }) {
  const [filter, setFilter] = useState('all');

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Pending
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Shipped
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Orders Database</span>
            <span className="text-xs font-normal text-slate-400">({orders.length} total records)</span>
          </h2>
          <p className="text-xs text-slate-400">Real-time state in SQLite orders table</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
          {['all', 'pending', 'shipped', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded capitalize transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-medium">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Item Details</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Age (Days)</th>
              <th className="py-3 px-4">Policy</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.map(order => {
              const isTargeted = plannedOrderIds.includes(order.id);
              return (
                <tr
                  key={order.id}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    isTargeted ? 'bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/30' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      {isTargeted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" title="Targeted in active plan"></span>
                      )}
                      <span>#{order.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{order.customer}</td>
                  <td className="py-3 px-4 text-slate-300">{order.item}</td>
                  <td className="py-3 px-4 font-mono text-slate-200">${order.amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`font-mono ${order.age_days >= 5 ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                      {order.age_days}d
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {order.cancellable ? (
                      <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Cancellable
                      </span>
                    ) : (
                      <span className="text-[11px] text-rose-400/90 flex items-center gap-1 font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Locked Policy
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
