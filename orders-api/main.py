"""
Orders API — FastAPI + SQLite
Provides order management endpoints for the Orkestr agent system.
"""

import sqlite3
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Orders API", version="1.0.0")

# Allow all origins for now (will tighten for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "orders.db")

# ---------------------------------------------------------------------------
# Reference date: orders are seeded relative to this so age_days is stable.
# In the demo we use a fixed reference so the seed data always looks the same.
# ---------------------------------------------------------------------------
REFERENCE_DATE = datetime(2026, 10, 16)

SEED_ORDERS = [
    # id, customer, item, amount, status, cancellable, created_date (days before reference)
    (1, "Alice Johnson", "Wireless Headphones", 79.99, "pending", True, 8),
    (2, "Bob Smith", "USB-C Hub", 45.00, "pending", True, 12),
    (3, "Carol Davis", "Mechanical Keyboard", 129.99, "pending", True, 6),
    (4, "Dave Wilson", "Monitor Stand", 34.50, "shipped", True, 10),   # shipped — can't cancel
    (5, "Eve Martinez", "Laptop Sleeve", 22.00, "pending", False, 15), # not cancellable
    (6, "Frank Lee", "Webcam HD", 59.99, "pending", True, 3),         # only 3 days old
    (7, "Grace Kim", "Desk Lamp", 42.00, "pending", True, 7),
    (8, "Hank Brown", "Mouse Pad XL", 18.99, "cancelled", True, 20),  # already cancelled
    (9, "Iris Chen", "Phone Charger", 15.00, "pending", True, 9),
    (10, "Jack Patel", "HDMI Cable", 12.99, "pending", True, 11),
    (11, "Karen White", "Bluetooth Speaker", 65.00, "pending", True, 14),
    (12, "Leo Garcia", "Tablet Stand", 28.50, "pending", False, 7),   # not cancellable
]


def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables and seed data."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            customer TEXT NOT NULL,
            item TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            cancellable BOOLEAN NOT NULL DEFAULT 1,
            age_days INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Only seed if table is empty
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        for order in SEED_ORDERS:
            oid, customer, item, amount, status, cancellable, days_ago = order
            created_at = (REFERENCE_DATE - timedelta(days=days_ago)).isoformat()
            cursor.execute(
                "INSERT INTO orders (id, customer, item, amount, status, cancellable, age_days, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (oid, customer, item, amount, status, cancellable, days_ago, created_at),
            )

    conn.commit()
    conn.close()


def row_to_dict(row):
    """Convert a sqlite3.Row to a plain dict."""
    return dict(row)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"service": "Orders API", "status": "running"}


@app.get("/orders")
def list_orders(status: str = None, min_age_days: int = None):
    """
    List all orders. Optionally filter by status and/or minimum age in days.
    """
    conn = get_db()
    query = "SELECT * FROM orders WHERE 1=1"
    params = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if min_age_days is not None:
        query += " AND age_days >= ?"
        params.append(min_age_days)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return {"orders": [row_to_dict(r) for r in rows]}


@app.get("/orders/{order_id}")
def get_order(order_id: int):
    """Get a single order by ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return row_to_dict(row)


@app.post("/orders/{order_id}/cancel")
def cancel_order(order_id: int):
    """
    Cancel an order. Enforces business rules:
    - Order must exist
    - Order must be 'pending'
    - Order must be cancellable
    """
    conn = get_db()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order = row_to_dict(row)

    if order["status"] != "pending":
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order {order_id}: status is '{order['status']}', must be 'pending'",
        )

    if not order["cancellable"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order {order_id}: order is marked as non-cancellable",
        )

    conn.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", (order_id,))
    conn.commit()

    # Return the updated order
    updated = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return {"message": f"Order {order_id} cancelled successfully", "order": row_to_dict(updated)}


# ---------------------------------------------------------------------------
# Admin endpoints (for demo purposes)
# ---------------------------------------------------------------------------

@app.post("/admin/reset")
def reset_orders():
    """Reset all orders to seed data. Used to replay the demo."""
    conn = get_db()
    conn.execute("DELETE FROM orders")
    conn.commit()
    conn.close()

    # Re-seed
    init_db()
    return {"ok": True, "message": "All orders reset to seed data"}


@app.post("/admin/mark-shipped/{order_id}")
def mark_shipped(order_id: int):
    """
    Mark an order as shipped. Used for the demo trick:
    plan says to cancel it, but between planning and approval
    the order ships, so the executor skips it.
    """
    conn = get_db()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    conn.execute("UPDATE orders SET status = 'shipped' WHERE id = ?", (order_id,))
    conn.commit()

    updated = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return {"ok": True, "message": f"Order {order_id} marked as shipped", "order": row_to_dict(updated)}
