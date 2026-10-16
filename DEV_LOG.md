# Orkestr Development Log

## Project: Order-Operations Agent (Human-in-the-Loop)
**Hackathon:** Agentika 2.0, NaSCon 2026
**Deadline:** 17 Oct 2026, 12:45 PM PKT

---

## Step 1 — Deploy empty Vite app ✅
**Time:** ~5:30 PM, 16 Oct
**What:** Added Dockerfile (node build + nginx), nginx.conf, .dockerignore
**Issue:** 502 Bad Gateway — platform expected port 5173, nginx was on 80
**Fix:** Changed nginx and Dockerfile to use port 5173
**Commit:** `b526666` — "Fix port to 5173 to match platform"
**Status:** Live at https://alternate-lunar-falls-656-github-app.alternatefutures.ai/

---

## Step 2 — Orders API (FastAPI + SQLite) ✅
**Time:** 10:04 PM, 16 Oct
**What:** Built Orders API service with:
- SQLite database with 12 seed orders
- Endpoints: `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel`, `POST /admin/reset`, `POST /admin/mark-shipped/{id}`
- Rule enforcement: rejects non-pending or non-cancellable cancellations
- Tested locally with PowerShell `Invoke-RestMethod` and verified 100% working
**Commits:** `1398b1b`, `1c908e1`
**Status:** Tested locally & ready for deployment/integration

---

## Step 3 — React Frontend UI (Human-in-the-Loop Order Desk) ✅
**Time:** 10:13 PM, 16 Oct
**What:** Built complete interactive frontend UI conforming to theme & rubric:
- `src/components/Header.jsx`: Branding, dynamic state indicator (`idle` -> `planning` -> `awaiting_approval` -> `executing` -> `done`), Live Tool Trace button, demo triggers (Mark #2 Shipped, Reset)
- `src/components/OrdersTable.jsx`: Full orders table with status badges (pending/shipped/cancelled), policy indicator (cancellable vs locked), age in days, and real-time active plan highlighting
- `src/components/ChatPanel.jsx`: Natural language prompt console with one-click demo presets & chat history
- `src/components/PlanCard.jsx`: Core Human-in-the-Loop approval gate. Shows target orders, policy exclusions, total amounts, single-use approval, anti-double-click protection, and Approve / Reject buttons
- `src/components/ExecutionReport.jsx`: Audit report separating verified cancellations (`cancelled_verified`), race condition skips (`skipped_ineligible`), and failures
- `src/components/TraceDrawer.jsx`: Proof for judges showing chronological MCP/tool call traces, arguments JSON, output preview, and latency
- `src/api.js`: Seamless API client handling live backend or autonomous local simulation
- `src/mockData.js`: Realistic seed state matching project brief contract
- Verified production build: `npm.cmd run build` passed with 0 errors
**Status:** Ready for local testing and live deployment


