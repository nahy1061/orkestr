"""
Orders API — FastAPI + SQLite
Dual-compatible backend supporting both the Agentika Project Brief & Afza's Blueprint specifications.
Includes /internal/* endpoints for n8n workflows with X-Service-Key authentication,
seed orders ORD-1001 to ORD-1015, and 3-bucket safety plan classification.
"""

import os
import uuid
import json
import sqlite3
import datetime as dt
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Order Desk Orders API", version="2.0.0")

# CORS middleware for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "orders.db")
SERVICE_KEY = os.environ.get("SERVICE_KEY", "dev-service-key")
HIGH_VALUE = float(os.environ.get("HIGH_VALUE", "300"))

# ---------------------------------------------------------------------------
# Seed Orders (15 orders from Blueprint, mapped to exact test cases)
# ---------------------------------------------------------------------------
SEED_ORDERS = [
    # id, customer, status, days_old, amount, paid, cancellable, flag
    ("ORD-1001", "Ayesha K.", "pending", 9, 48.00, 0, 1, "none"),
    ("ORD-1002", "Bilal R.", "pending", 8, 120.00, 0, 1, "none"),
    ("ORD-1003", "Sara M.", "pending", 7, 75.50, 0, 1, "none"),
    ("ORD-1004", "Hamza T.", "pending", 6, 32.00, 0, 1, "none"),
    ("ORD-1005", "Noor F.", "pending", 10, 420.00, 0, 1, "none"),        # high value (>300)
    ("ORD-1006", "Omar S.", "pending", 7, 90.00, 1, 1, "none"),           # paid (refund)
    ("ORD-1007", "Zainab A.", "pending", 8, 60.00, 0, 1, "disputed"),      # disputed
    ("ORD-1008", "Ali H.", "pending", 6, 150.00, 0, 0, "none"),           # not cancellable
    ("ORD-1009", "Maria J.", "shipped", 11, 85.00, 1, 0, "none"),         # shipped
    ("ORD-1010", "Usman D.", "cancelled", 9, 40.00, 0, 0, "none"),       # already cancelled
    ("ORD-1011", "Hira N.", "pending", 3, 55.00, 0, 1, "none"),           # age 3d
    ("ORD-1012", "Faizan Q.", "pending", 2, 25.00, 0, 1, "none"),         # age 2d
    ("ORD-1013", "Iqra B.", "pending", 1, 200.00, 0, 1, "none"),          # age 1d
    ("ORD-1014", "Talha P.", "pending", 12, 70.00, 0, 1, "vip"),          # VIP
    ("ORD-1015", "Mehak L.", "pending", 9, 38.00, 0, 1, "none"),
]


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            amount REAL NOT NULL,
            paid INTEGER NOT NULL DEFAULT 0,
            cancellable INTEGER NOT NULL DEFAULT 1,
            flag TEXT NOT NULL DEFAULT 'none'
        );
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            days INTEGER NOT NULL,
            items TEXT NOT NULL,
            selected TEXT NOT NULL DEFAULT '[]',
            report TEXT
        );
        CREATE TABLE IF NOT EXISTS audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            event TEXT NOT NULL,
            detail TEXT
        );
    """)

    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        now = dt.datetime.now(dt.timezone.utc)
        for oid, cust, status, days_ago, amt, paid, canc, flag in SEED_ORDERS:
            # +0.5 day keeps calculated age_days stable
            created = (now - dt.timedelta(days=days_ago + 0.5)).isoformat()
            cursor.execute(
                "INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (oid, cust, status, created, amt, paid, canc, flag),
            )

    conn.commit()
    conn.close()


def log_event(event: str, detail: str = ""):
    conn = get_db()
    conn.execute(
        "INSERT INTO audit (ts, event, detail) VALUES (?, ?, ?)",
        (dt.datetime.now(dt.timezone.utc).isoformat(), event, str(detail)),
    )
    conn.commit()
    conn.close()


def order_dict(r):
    created = dt.datetime.fromisoformat(r["created_at"])
    age = int((dt.datetime.now(dt.timezone.utc) - created).total_seconds() // 86400)
    return {
        "id": r["id"],
        "customer": r["customer"],
        "status": r["status"],
        "created_at": r["created_at"],
        "age_days": age,
        "amount": r["amount"],
        "paid": bool(r["paid"]),
        "cancellable": bool(r["cancellable"]),
        "flag": r["flag"],
    }


def normalize_id(oid: str | int) -> str:
    """Normalize numeric 1 or '1' to 'ORD-1001' if needed."""
    s = str(oid).strip()
    if s.isdigit():
        num = int(s)
        if 1 <= num <= 15:
            return f"ORD-{1000 + num}"
    return s


def get_order_row(oid: str):
    norm_id = normalize_id(oid)
    conn = get_db()
    r = conn.execute("SELECT * FROM orders WHERE id = ?", (norm_id,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, f"Order {oid} not found")
    return order_dict(r)


def hard_blocked(o):
    """Reasons an order may NEVER be cancelled, no matter who approves."""
    if o["status"] != "pending":
        return f"status is {o['status']}"
    if not o["cancellable"]:
        return "order is marked not cancellable"
    return None


def classify(o, days: int):
    """Sort an order into one of the 3 safety buckets: recommended, needs_decision, excluded."""
    if o["age_days"] < days:
        return None
    blocked = hard_blocked(o)
    if blocked:
        return ("excluded", blocked)

    why = []
    if o["paid"]:
        why.append("already paid, so cancelling means a refund")
    if o["flag"] != "none":
        why.append(f"customer is flagged: {o['flag']}")
    if o["amount"] >= HIGH_VALUE:
        why.append(f"high value (${o['amount']:.0f})")

    if why:
        return ("needs_decision", "; ".join(why))
    return ("recommended", f"pending {o['age_days']} days, unpaid, no flags")


def build_plan(days: int):
    conn = get_db()
    rows = conn.execute("SELECT * FROM orders ORDER BY id").fetchall()
    items = []
    for r in rows:
        o = order_dict(r)
        c = classify(o, days)
        if c:
            items.append({
                "order_id": o["id"],
                "customer": o["customer"],
                "amount": o["amount"],
                "age_days": o["age_days"],
                "bucket": c[0],
                "reason": c[1],
            })

    pid = "PLAN-" + uuid.uuid4().hex[:6].upper()
    now_str = dt.datetime.now(dt.timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO plans VALUES (?, ?, ?, ?, ?, ?, ?)",
        (pid, "awaiting_approval", now_str, days, json.dumps(items), "[]", None),
    )
    conn.commit()
    conn.close()

    log_event("plan_created", f"{pid} days={days} items={len(items)}")
    return get_plan(pid)


def get_plan(pid: str):
    conn = get_db()
    r = conn.execute("SELECT * FROM plans WHERE id = ?", (pid,)).fetchone()
    conn.close()
    if not r:
        raise HTTPException(404, f"Plan {pid} not found")
    return {
        "id": r["id"],
        "status": r["status"],
        "created_at": r["created_at"],
        "days": r["days"],
        "items": json.loads(r["items"]),
        "selected": json.loads(r["selected"]),
        "report": json.loads(r["report"]) if r["report"] else None,
    }


# ---------------------------------------------------------------------------
# Auth Dependencies
# ---------------------------------------------------------------------------
def service_auth(x_service_key: str = Header(None)):
    """Validates X-Service-Key for n8n internal calls. Accepts SERVICE_KEY or dev defaults."""
    if x_service_key and x_service_key in [SERVICE_KEY, "dev-service-key", "dev-service-key-nascon2026"]:
        return True
    # If no SERVICE_KEY configured or matches, permit in dev
    if not os.environ.get("SERVICE_KEY"):
        return True
    raise HTTPException(401, "Invalid or missing X-Service-Key header")


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# Public Health Check
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"service": "Orders API", "status": "running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"ok": True, "service": "Orders API"}


# ---------------------------------------------------------------------------
# Orders Endpoints (Dual routes: /orders and /api/orders)
# ---------------------------------------------------------------------------
@app.get("/orders")
@app.get("/api/orders")
def list_orders(status: str = None, min_age_days: int = None):
    conn = get_db()
    rows = conn.execute("SELECT * FROM orders ORDER BY id").fetchall()
    conn.close()
    orders = [order_dict(r) for r in rows]
    if status:
        orders = [o for o in orders if o["status"] == status]
    if min_age_days is not None:
        orders = [o for o in orders if o["age_days"] >= min_age_days]
    return {"orders": orders}


@app.get("/orders/{order_id}")
@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    return get_order_row(order_id)


@app.post("/orders/{order_id}/cancel")
@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: str):
    o = get_order_row(order_id)
    blocked = hard_blocked(o)
    if blocked:
        raise HTTPException(400, f"Cannot cancel {order_id}: {blocked}")

    conn = get_db()
    conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (o["id"],))
    conn.commit()
    conn.close()

    log_event("order_cancelled", o["id"])
    updated = get_order_row(o["id"])
    return {"message": f"Order {o['id']} cancelled successfully", "order": updated}


# ---------------------------------------------------------------------------
# n8n / Internal Endpoints (Called by Afza's WF1 and WF2 workflows)
# ---------------------------------------------------------------------------
class NewPlan(BaseModel):
    days: int
    session_id: str = "demo"


@app.post("/internal/plans", dependencies=[Depends(service_auth)])
def internal_create_plan(body: NewPlan):
    """
    Called by n8n WF1 'Create Plan' HTTP Request node.
    Accepts: { 'days': 5, 'session_id': 'demo-session-1' }
    Builds plan with 3 buckets (recommended, needs_decision, excluded) and saves it.
    """
    if not (1 <= body.days <= 365):
        raise HTTPException(400, "days must be between 1 and 365")
    return build_plan(body.days)


@app.get("/internal/plans/{pid}", dependencies=[Depends(service_auth)])
def internal_get_plan(pid: str):
    return get_plan(pid)


@app.get("/internal/orders", dependencies=[Depends(service_auth)])
def internal_orders(status: str = "", older_than_days: int = 0):
    conn = get_db()
    rows = conn.execute("SELECT * FROM orders ORDER BY id").fetchall()
    conn.close()
    out = [order_dict(r) for r in rows]
    return [o for o in out if (not status or o["status"] == status) and o["age_days"] >= older_than_days]


@app.get("/internal/orders/{oid}", dependencies=[Depends(service_auth)])
def internal_get_order(oid: str):
    return get_order_row(oid)


@app.post("/internal/orders/{oid}/cancel", dependencies=[Depends(service_auth)])
def internal_cancel(oid: str):
    o = get_order_row(oid)
    blocked = hard_blocked(o)
    if blocked:
        raise HTTPException(409, blocked)

    conn = get_db()
    conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (o["id"],))
    conn.commit()
    conn.close()

    log_event("order_cancelled", o["id"])
    return get_order_row(o["id"])


# ---------------------------------------------------------------------------
# Admin Endpoints (Demo reset and stale-order demo trick)
# ---------------------------------------------------------------------------
@app.post("/admin/reset")
@app.post("/api/admin/reset")
def reset_orders():
    conn = get_db()
    conn.execute("DELETE FROM orders")
    conn.execute("DELETE FROM plans")
    conn.commit()
    conn.close()

    init_db()
    log_event("admin_reset", "All orders and plans restored to seed")
    return {"ok": True, "message": "All orders and plans reset to initial seed data"}


@app.post("/admin/mark-shipped/{order_id}")
@app.post("/api/admin/simulate-ship/{order_id}")
def mark_shipped(order_id: str):
    o = get_order_row(order_id)
    conn = get_db()
    conn.execute("UPDATE orders SET status = 'shipped' WHERE id = ?", (o["id"],))
    conn.commit()
    conn.close()

    log_event("demo_order_shipped", o["id"])
    updated = get_order_row(o["id"])
    return {"ok": True, "message": f"Order {o['id']} marked as shipped", "order": updated}


@app.get("/api/audit")
def get_audit():
    conn = get_db()
    rows = conn.execute("SELECT * FROM audit ORDER BY id DESC LIMIT 100").fetchall()
    conn.close()
    return [dict(r) for r in rows]
