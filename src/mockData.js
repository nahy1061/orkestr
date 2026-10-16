// Mock data matching the exact contract in AGENTIKA_PROJECT_BRIEF.md

export const INITIAL_ORDERS = [
  { id: 1, customer: "Alice Johnson", item: "Wireless Headphones", amount: 79.99, status: "pending", cancellable: true, age_days: 8 },
  { id: 2, customer: "Bob Smith", item: "USB-C Hub", amount: 45.00, status: "pending", cancellable: true, age_days: 12 },
  { id: 3, customer: "Carol Davis", item: "Mechanical Keyboard", amount: 129.99, status: "pending", cancellable: true, age_days: 6 },
  { id: 4, customer: "Dave Wilson", item: "Monitor Stand", amount: 34.50, status: "shipped", cancellable: true, age_days: 10 },
  { id: 5, customer: "Eve Martinez", item: "Laptop Sleeve", amount: 22.00, status: "pending", cancellable: false, age_days: 15 },
  { id: 6, customer: "Frank Lee", item: "Webcam HD", amount: 59.99, status: "pending", cancellable: true, age_days: 3 },
  { id: 7, customer: "Grace Kim", item: "Desk Lamp", amount: 42.00, status: "pending", cancellable: true, age_days: 7 },
  { id: 8, customer: "Hank Brown", item: "Mouse Pad XL", amount: 18.99, status: "cancelled", cancellable: true, age_days: 20 },
  { id: 9, customer: "Iris Chen", item: "Phone Charger", amount: 15.00, status: "pending", cancellable: true, age_days: 9 },
  { id: 10, customer: "Jack Patel", item: "HDMI Cable", amount: 12.99, status: "pending", cancellable: true, age_days: 11 },
  { id: 11, customer: "Karen White", item: "Bluetooth Speaker", amount: 65.00, status: "pending", cancellable: true, age_days: 14 },
  { id: 12, customer: "Leo Garcia", item: "Tablet Stand", amount: 28.50, status: "pending", cancellable: false, age_days: 7 },
];

export const MOCK_PLAN = {
  id: "plan-nascon-804",
  status: "awaiting_approval",
  created_at: new Date().toISOString(),
  query: "Find orders pending more than 5 days and prepare a cancellation plan",
  summary: "Identified 8 orders pending > 5 days. 6 qualify for immediate cancellation. 2 excluded due to policy constraints.",
  items: [
    { order_id: 1, customer: "Alice Johnson", item: "Wireless Headphones", amount: 79.99, age_days: 8, reason: "Pending 8 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 2, customer: "Bob Smith", item: "USB-C Hub", amount: 45.00, age_days: 12, reason: "Pending 12 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 3, customer: "Carol Davis", item: "Mechanical Keyboard", amount: 129.99, age_days: 6, reason: "Pending 6 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 7, customer: "Grace Kim", item: "Desk Lamp", amount: 42.00, age_days: 7, reason: "Pending 7 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 9, customer: "Iris Chen", item: "Phone Charger", amount: 15.00, age_days: 9, reason: "Pending 9 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 10, customer: "Jack Patel", item: "HDMI Cable", amount: 12.99, age_days: 11, reason: "Pending 11 days (> 5 days threshold), eligible for automated cancellation" },
    { order_id: 11, customer: "Karen White", item: "Bluetooth Speaker", amount: 65.00, age_days: 14, reason: "Pending 14 days (> 5 days threshold), eligible for automated cancellation" },
  ],
  excluded: [
    { order_id: 4, customer: "Dave Wilson", reason: "Order is already marked as 'shipped' (cannot cancel fulfillment)" },
    { order_id: 5, customer: "Eve Martinez", reason: "Policy constraint: marked as non-cancellable by vendor (custom order)" },
    { order_id: 8, customer: "Hank Brown", reason: "Already cancelled on previous run" },
    { order_id: 12, customer: "Leo Garcia", reason: "Policy constraint: marked as non-cancellable" },
  ],
  used: false
};

export const MOCK_PLAN_TRACES = [
  {
    step: 1,
    who: "planner",
    tool: "search_orders",
    args: { status: "pending", min_age_days: 5 },
    result: "Found 9 pending orders with age >= 5 days",
    ms: 142
  },
  {
    step: 2,
    who: "planner",
    tool: "get_order",
    args: { order_id: 5 },
    result: "Order #5 verified: cancellable=false. Excluded from cancellation plan.",
    ms: 58
  },
  {
    step: 3,
    who: "planner",
    tool: "get_order",
    args: { order_id: 12 },
    result: "Order #12 verified: cancellable=false. Excluded from cancellation plan.",
    ms: 61
  }
];

export const MOCK_EXECUTION_TRACES = [
  {
    step: 4,
    who: "executor",
    tool: "get_order",
    args: { order_id: 1 },
    result: "Pre-execution check: Order #1 still pending & cancellable",
    ms: 45
  },
  {
    step: 5,
    who: "executor",
    tool: "cancel_order",
    args: { order_id: 1 },
    result: "Order #1 cancelled successfully in database",
    ms: 88
  },
  {
    step: 6,
    who: "executor",
    tool: "get_order",
    args: { order_id: 1 },
    result: "Read-back verification: Order #1 verified as 'cancelled'",
    ms: 52
  },
  {
    step: 7,
    who: "executor",
    tool: "get_order",
    args: { order_id: 2 },
    result: "Pre-execution check: Order #2 has transitioned to 'shipped'! Skipping.",
    ms: 41
  }
];

export const MOCK_EXECUTION_REPORT = [
  { order_id: 1, customer: "Alice Johnson", outcome: "cancelled_verified", amount: 79.99, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 3, customer: "Carol Davis", outcome: "cancelled_verified", amount: 129.99, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 7, customer: "Grace Kim", outcome: "cancelled_verified", amount: 42.00, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 9, customer: "Iris Chen", outcome: "cancelled_verified", amount: 15.00, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 10, customer: "Jack Patel", outcome: "cancelled_verified", amount: 12.99, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 11, customer: "Karen White", outcome: "cancelled_verified", amount: 65.00, reason: "Cancelled and read-back confirmed via Orders API" },
  { order_id: 2, customer: "Bob Smith", outcome: "skipped_ineligible", amount: 45.00, reason: "Order status transitioned to 'shipped' between planning and approval" },
];
