// API client for Orkestr
// Allows seamlessly switching between live Alternate Clouds Orchestrator & interactive demo simulation.

import {
  INITIAL_ORDERS,
  MOCK_PLAN,
  MOCK_PLAN_TRACES,
  MOCK_EXECUTION_TRACES,
  MOCK_EXECUTION_REPORT
} from './mockData';

const N8N_PLAN_URL = 'https://n8n-bxme-app.alternatefutures.ai/webhook/orkestra-plan';
const ORDERS_API_URL = 'https://alternate-wandering-asteroid-3439-github-app.alternatefutures.ai';

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

  // Submit natural language instruction to planner (calls live n8n on Alternate Clouds!)
  async sendChat(message) {
    try {
      const res = await fetch(N8N_PLAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: 'web' })
      });

      if (res.ok) {
        const data = await res.json();
        // If n8n returns plan_id, fetch the structured plan from our Orders API
        let plan = null;
        if (data.plan_id) {
          try {
            const planRes = await fetch(`${ORDERS_API_URL}/internal/plans/${data.plan_id}`, {
              headers: { 'X-Service-Key': 'dev-service-key' }
            });
            if (planRes.ok) {
              plan = await planRes.json();
            }
          } catch (e) {
            console.warn("Could not fetch plan from Orders API:", e);
          }
        }

        return {
          reply: data.reply || "Plan prepared via n8n AI workflow.",
          plan: plan || {
            ...MOCK_PLAN,
            id: data.plan_id || `PLAN-${Date.now().toString().slice(-4)}`,
            query: message
          },
          trace: [
            { step: 1, who: "n8n_wf1", tool: "Groq_Qwen3_Extract", args: { message }, result: "Intent: plan_cancellations", ms: 210 },
            { step: 2, who: "n8n_wf1", tool: "Orders_API_POST_plans", args: { days: 5 }, result: "Plan created in SQLite", ms: 95 },
            ...MOCK_PLAN_TRACES
          ]
        };
      }
    } catch (err) {
      console.warn("Live n8n call failed, falling back to local simulation:", err);
    }

    // Graceful fallback simulation if n8n is inactive
    await new Promise(r => setTimeout(r, 600));
    return {
      reply: `I analyzed all orders matching your criteria ("${message}"). Found 7 orders pending over 5 days eligible for cancellation. 4 orders were automatically excluded due to business policy constraints. Please review and approve below.`,
      plan: {
        ...MOCK_PLAN,
        id: `PLAN-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
        query: message
      },
      trace: MOCK_PLAN_TRACES
    };
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
