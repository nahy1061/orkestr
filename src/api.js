// API client for Orkestr
// Allows seamlessly switching between live Alternate Clouds Orchestrator & interactive demo simulation.

import {
  INITIAL_ORDERS,
  MOCK_PLAN,
  MOCK_PLAN_TRACES,
  MOCK_EXECUTION_TRACES,
  MOCK_EXECUTION_REPORT
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  // Fetch orders list
  async getOrders() {
    if (!BASE_URL) {
      // Mock mode: read from localStorage or return default
      const saved = localStorage.getItem('orkestr_orders');
      if (saved) return JSON.parse(saved);
      return INITIAL_ORDERS;
    }
    const res = await fetch(`${BASE_URL}/orders`);
    if (!res.ok) throw new Error(`Orders fetch failed: ${res.statusText}`);
    const data = await res.json();
    return data.orders || [];
  },

  // Submit natural language instruction to planner
  async sendChat(message) {
    if (!BASE_URL) {
      // Realistic 800ms delay to simulate agent thinking & MCP tool inspection
      await new Promise(r => setTimeout(r, 800));
      return {
        reply: `I analyzed all orders matching your criteria ("${message}"). Found 7 orders pending over 5 days eligible for cancellation. 4 orders were automatically excluded due to business policy constraints (shipped or non-cancellable). Please review and approve the cancellation plan below.`,
        plan: {
          ...MOCK_PLAN,
          id: `plan-${Date.now().toString().slice(-4)}`,
          created_at: new Date().toISOString(),
          query: message
        },
        trace: MOCK_PLAN_TRACES
      };
    }

    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error(`Chat error: ${res.statusText}`);
    return await res.json();
  },

  // Approve a pending plan
  async approvePlan(planId, currentOrders = []) {
    if (!BASE_URL) {
      // Simulate executor checking each order, cancelling in SQLite, read-back verification
      await new Promise(r => setTimeout(r, 1000));
      
      // Update local storage orders based on the outcome
      const isBobShipped = currentOrders.find(o => o.id === 2)?.status === 'shipped';
      
      const updatedOrders = currentOrders.map(order => {
        if ([1, 3, 7, 9, 10, 11].includes(order.id)) {
          return { ...order, status: 'cancelled' };
        }
        return order;
      });
      localStorage.setItem('orkestr_orders', JSON.stringify(updatedOrders));

      const report = MOCK_EXECUTION_REPORT.map(item => {
        if (item.order_id === 2) {
          return isBobShipped
            ? { ...item, outcome: 'skipped_ineligible', reason: "Order #2 shipped between planning & approval. Cancel prevented." }
            : { ...item, outcome: 'cancelled_verified', reason: "Cancelled and read-back confirmed via Orders API" };
        }
        return item;
      });

      return {
        report,
        trace: MOCK_EXECUTION_TRACES,
        updatedOrders
      };
    }

    const res = await fetch(`${BASE_URL}/plans/${planId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Approve failed: ${res.statusText}`);
    return await res.json();
  },

  // Reject a pending plan
  async rejectPlan(planId) {
    if (!BASE_URL) {
      await new Promise(r => setTimeout(r, 300));
      return { status: 'rejected', message: `Plan ${planId} rejected by operator. Zero modifications made.` };
    }
    const res = await fetch(`${BASE_URL}/plans/${planId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Reject failed: ${res.statusText}`);
    return await res.json();
  },

  // Reset database for demo
  async resetDemo() {
    localStorage.removeItem('orkestr_orders');
    if (BASE_URL) {
      try {
        await fetch(`${BASE_URL}/admin/reset`, { method: 'POST' });
      } catch (e) {
        console.warn("Backend reset error", e);
      }
    }
    return INITIAL_ORDERS;
  },

  // Demo trick: mark order 2 as shipped
  async markShipped(orderId) {
    if (!BASE_URL) {
      const orders = (JSON.parse(localStorage.getItem('orkestr_orders')) || INITIAL_ORDERS).map(o =>
        o.id === orderId ? { ...o, status: 'shipped' } : o
      );
      localStorage.setItem('orkestr_orders', JSON.stringify(orders));
      return orders;
    }
    await fetch(`${BASE_URL}/admin/mark-shipped/${orderId}`, { method: 'POST' });
    const ordersRes = await fetch(`${BASE_URL}/orders`);
    const data = await ordersRes.json();
    return data.orders;
  }
};
