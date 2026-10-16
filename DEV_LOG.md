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

## Step 2 — Orders API (FastAPI + SQLite) 🔧
**Time:** ~10:00 PM, 16 Oct
**What:** Building the Orders API backend with:
- SQLite database with seed orders (auto-created on startup)
- Endpoints: GET /orders, GET /orders/{id}, POST /orders/{id}/cancel, POST /admin/reset, POST /admin/mark-shipped/{id}
- Business rules enforced (can't cancel shipped/non-cancellable orders)
**Status:** In progress...
