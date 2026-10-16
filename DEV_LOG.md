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
**Time:** 1:53 AM, 17 Oct
**What:** Built and deployed complete interactive Human-in-the-Loop dashboard on Alternate Clouds:
- `src/components/Header.jsx`: Branding, dynamic state machine, live tool trace drawer toggle, demo triggers
- `src/components/OrdersTable.jsx`: Full orders table with status badges, policy indicator, age in days, and real-time active plan highlighting
- `src/components/ChatPanel.jsx`: Natural language prompt console with one-click demo presets & chat history
- `src/components/PlanCard.jsx`: Core Human-in-the-Loop approval gate (single-use approval, anti-double-click, Approve / Reject buttons)
- `src/components/ExecutionReport.jsx`: Audit report separating verified cancellations (`cancelled_verified`), race condition skips (`skipped_ineligible`), and failures
- `src/components/TraceDrawer.jsx`: Judges proof showing tool calls, arguments JSON, output preview, and latency
- `src/api.js`: Seamless API client handling live backend or autonomous local simulation
- `src/mockData.js`: Realistic seed state matching project brief contract
- **Live URL:** `https://alternate-lunar-falls-656-github-app.alternatefutures.ai/`
- Verified end-to-end: prompt generation, plan review, trace drawer inspection, demo race-condition invariant (#2 marked shipped), approval execution, and read-back verified audit reporting all working live!
**Commits:** `3bf27fb`, `8445b09`, `13883a1`
**Status:** 100% working live on Alternate Clouds!

---

## Step 4 — Orders API Deployment on Alternate Clouds ✅
**Time:** 2:02 AM, 17 Oct
**What:** Deployed Service 2 (`orders-api`) on Alternate Clouds:
- Python 3.11 + FastAPI + SQLite
- Exposing port 8000 via container settings
- Live endpoint verified via curl: `GET /orders` returns all 12 seed records cleanly
- **Live Orders API URL:** `https://alternate-wandering-asteroid-3439-github-app.alternatefutures.ai/`
**Status:** 100% live and ready for Afza's MCP tools & Orchestrator!

---

## Current Architecture Status
- **Service 1 (React Frontend):** `https://alternate-lunar-falls-656-github-app.alternatefutures.ai/` ✅
- **Service 2 (Orders API):** `https://alternate-wandering-asteroid-3439-github-app.alternatefutures.ai/` ✅
- **Service 3 (Afza's Orchestrator):** Awaiting Afza's URL to connect `VITE_API_URL` ⏳




