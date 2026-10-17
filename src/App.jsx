import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OrdersTable from './components/OrdersTable';
import ChatPanel from './components/ChatPanel';
import PlanCard from './components/PlanCard';
import ExecutionReport from './components/ExecutionReport';
import TraceDrawer from './components/TraceDrawer';
import { api } from './api';

export default function App() {
  // Application State Machine: 'idle' | 'planning' | 'awaiting_approval' | 'executing' | 'done' | 'error'
  const [status, setStatus] = useState('idle');
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [executionReport, setExecutionReport] = useState(null);
  const [traces, setTraces] = useState([]);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Load orders on startup
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setStatus('error');
      setFeedback({ type: 'error', text: 'Failed to connect to Orders API.' });
    }
  };

  // Human operator submits natural language instruction
  const handleSendMessage = async (userPrompt) => {
    setStatus('planning');
    setExecutionReport(null);
    setFeedback(null);
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);

    try {
      const res = await api.sendChat(userPrompt);

      setMessages(prev => [...prev, { role: 'agent', content: res.reply }]);

      if (res.plan) {
        setActivePlan(res.plan);
        setStatus('awaiting_approval');
      } else {
        setStatus('idle');
      }

      if (res.trace) {
        setTraces(prev => [...prev, ...res.trace]);
      }
    } catch (err) {
      console.error("Chat planning error:", err);
      setStatus('error');
      setFeedback({ type: 'error', text: `Planning failed: ${err.message}` });
      setMessages(prev => [...prev, { role: 'agent', content: `Error: Unable to process request. ${err.message}` }]);
    }
  };

  // Human Operator clicks "Approve Plan"
  const handleApprovePlan = async (planId) => {
    setStatus('executing');
    setFeedback(null);

    try {
      const selectedIds = activePlan?.items?.filter(i => i.bucket === 'recommended').map(i => i.order_id) || [];
      const res = await api.approvePlan(planId, orders, selectedIds);

      // Append executor tool traces (proof of recheck, cancel, and read-back verify)
      if (res.trace) {
        setTraces(prev => [...prev, ...res.trace]);
      }

      setExecutionReport(res.report);
      setStatus('done');

      // Refresh orders table with updated database states
      if (res.updatedOrders) {
        setOrders(res.updatedOrders);
      } else {
        await loadOrders();
      }

      // Mark plan as used
      setActivePlan(prev => prev ? { ...prev, used: true } : null);
    } catch (err) {
      console.error("Plan execution error:", err);
      setStatus('error');
      setFeedback({ type: 'error', text: `Execution failed: ${err.message}` });
    }
  };

  // Human Operator clicks "Reject Plan"
  const handleRejectPlan = async (planId) => {
    try {
      await api.rejectPlan(planId);
      setActivePlan(null);
      setStatus('idle');
      setFeedback({
        type: 'info',
        text: `Plan ${planId} rejected by human operator. Zero database writes were performed.`
      });
      setMessages(prev => [
        ...prev,
        { role: 'agent', content: `Plan ${planId} was cancelled by operator request. System returned to ready state.` }
      ]);
    } catch (err) {
      console.error("Plan rejection error:", err);
    }
  };

  // Demo Trick: simulate an order turning to 'shipped' between planning and approval!
  const handleMarkShipped = async () => {
    try {
      const updated = await api.markShipped(2);
      setOrders(updated);
      setFeedback({
        type: 'warning',
        text: 'Demo Triggered: Order #2 (Bob Smith) marked as SHIPPED in database. Now click "Approve Plan" to see the executor safety guard skip it!'
      });
    } catch (err) {
      console.error("Failed to mark shipped:", err);
    }
  };

  // Reset demo state
  const handleResetDemo = async () => {
    try {
      const initial = await api.resetDemo();
      setOrders(initial);
      setActivePlan(null);
      setExecutionReport(null);
      setTraces([]);
      setMessages([]);
      setStatus('idle');
      setFeedback({ type: 'success', text: 'Demo reset to initial 12 seed orders and clean state.' });
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const isBobShipped = orders.find(o => o.id === 2)?.status === 'shipped';
  const plannedOrderIds = activePlan ? activePlan.items.map(i => i.order_id) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        status={status}
        onReset={handleResetDemo}
        onMarkShipped={handleMarkShipped}
        toggleTrace={() => setIsTraceOpen(!isTraceOpen)}
        isTraceOpen={isTraceOpen}
        traceCount={traces.length}
        isBobShipped={isBobShipped}
      />

      {/* Global Toast / Feedback banner */}
      {feedback && (
        <div
          className={`px-6 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : feedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : feedback.type === 'info'
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white ml-4 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Top Grid: Chat Console + Orders Database */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Operator Chat (5 cols) */}
          <div className="lg:col-span-5 h-[480px]">
            <ChatPanel
              onSendMessage={handleSendMessage}
              isBusy={status === 'planning'}
              messages={messages}
            />
          </div>

          {/* Real-time Orders Table (7 cols) */}
          <div className="lg:col-span-7">
            <OrdersTable
              orders={orders}
              plannedOrderIds={plannedOrderIds}
            />
          </div>

        </div>

        {/* Middle: Active Plan & Human Approval Gate */}
        {activePlan && (
          <section id="plan-section">
            <PlanCard
              plan={activePlan}
              onApprove={handleApprovePlan}
              onReject={handleRejectPlan}
              isExecuting={status === 'executing'}
            />
          </section>
        )}

        {/* Bottom: Post-Execution Verification Audit Report */}
        {executionReport && (
          <section id="report-section">
            <ExecutionReport
              report={executionReport}
              onDismiss={() => setExecutionReport(null)}
            />
          </section>
        )}

      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LessHelpless • Agentika 2.0 Hackathon • FAST University Islamabad</span>
          <span className="font-mono text-[11px]">Human + AI: Better Together</span>
          <span>Deploy Target: Alternate Clouds</span>
        </div>
      </footer>

      {/* Slide-out Tool Call Trace Drawer */}
      <TraceDrawer
        traces={traces}
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
      />
    </div>
  );
}
