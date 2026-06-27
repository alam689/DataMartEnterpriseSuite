import {
  BookOpen, ArrowDownCircle, ArrowUpCircle, Repeat, Scale, FileBarChart, Landmark,
  FileText, FileSearch, ClipboardList, PackageCheck, ReceiptText, Undo2, Building, BarChart3,
  Boxes, PackageMinus, ArrowLeftRight, ClipboardCheck, Warehouse, Tag,
  Truck, Send, Users, UserPlus, CalendarCheck, Award, GraduationCap, Clock4,
  Factory, Wrench, Cog, Hammer, Gauge, Wallet, Banknote, Calculator, Percent, Gift, Building2,
  Target, Phone, Megaphone, LifeBuoy, TrendingUp, Fuel, MapPin, ShieldCheck,
  CircleDollarSign, CheckCircle2, AlertTriangle, PackageSearch, CalendarDays,
  KeyRound, Lock, ScrollText, Activity, Database, Server,
} from 'lucide-react'

/*
 * Per-module HOME (landing) configuration. Overview only — function tiles are
 * entry points, no detail/transaction screens. Shared by <ModuleHome/>.
 *   kpis      : 6 headline figures with a soft status tone
 *   functions : 8 entry tiles (icon + accent + live count)
 *   queue     : the module's primary worklist (ref / title / sub / value / status)
 *   bars      : a small "top N" comparison panel
 *   feed      : recent activity
 */

export const moduleHomes = {
  /* ----------------------------- SYSTEM ADMINISTRATION ----------------------------- */
  sysadmin: {
    actions: [
      { label: 'Audit Log', icon: ScrollText },
      { label: 'Add User', icon: UserPlus, primary: true, screen: 'users' },
    ],
    kpis: [
      { label: 'Active Users', value: '128', tone: 'teal', sub: '14 online now' },
      { label: 'Roles Defined', value: '24', tone: 'blue', sub: '6 custom' },
      { label: 'Pending Requests', value: '7', tone: 'amber', sub: 'access approvals' },
      { label: 'Failed Logins (24h)', value: '23', tone: 'rose', sub: '3 accounts locked' },
      { label: 'Active Sessions', value: '41', tone: 'green', sub: 'across 9 branches' },
      { label: 'Last Backup', value: '02:00', tone: 'violet', sub: 'completed · 2.4 GB' },
    ],
    functions: [
      { name: 'User Management', desc: 'Create, edit, deactivate & reset users.', icon: Users, accent: '#3f8fd1', count: '128 users', screen: 'users' },
      { name: 'Roles & Permissions', desc: 'Define roles and grant access rights.', icon: ShieldCheck, accent: '#8a6fd0', count: '24 roles', screen: 'roles' },
      { name: 'Access Control', desc: 'Module & feature-level permissions.', icon: KeyRound, accent: '#2f8f8a', count: '12 modules', screen: 'access' },
      { name: 'Audit Log', desc: 'Track every action and change.', icon: ScrollText, accent: '#c2882f', count: '8.4K events', screen: 'audit' },
      { name: 'Security Policy', desc: 'Password, 2FA & lockout rules.', icon: Lock, accent: '#c66262', count: '5 policies', screen: 'security' },
      { name: 'Active Sessions', desc: 'Monitor and revoke live sessions.', icon: Activity, accent: '#3fae8e', count: '41 live', screen: 'sessions' },
      { name: 'Backup & Restore', desc: 'Schedule, run & restore backups.', icon: Database, accent: '#7d8ad1', count: 'Daily 02:00', screen: 'backup' },
      { name: 'License & System', desc: 'Version, license & system health.', icon: Server, accent: '#6aa36a', count: 'v1.0', screen: 'license' },
    ],
    queue: {
      title: 'Pending Access Requests', icon: Clock4,
      items: [
        { ref: 'REQ-118', title: 'Tariq A. — Procurement access', sub: 'IT · 20m ago', value: 'Approver: You', status: 'Pending', tone: 'amber' },
        { ref: 'REQ-115', title: 'Nadia K. — Payroll (view only)', sub: 'HR · 1h ago', value: 'Sensitive', status: 'Review', tone: 'violet' },
        { ref: 'SEC-042', title: 'Account locked — 5 failed logins', sub: 'user: rkhan · 2h ago', value: 'Security', status: 'Locked', tone: 'rose' },
        { ref: 'REQ-112', title: 'New role: Branch Auditor', sub: 'Admin · 3h ago', value: '4 rights', status: 'Pending', tone: 'amber' },
      ],
    },
    bars: { title: 'Users by Role', items: [
      { name: 'Operators', value: '72', pct: 88 },
      { name: 'Managers', value: '28', pct: 34 },
      { name: 'Accountants', value: '16', pct: 20 },
      { name: 'Administrators', value: '12', pct: 15 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'Role "Sales Manager" permissions updated', when: '18m ago', tone: 'green' },
      { icon: Lock, text: 'Password policy enforced for all users', when: '1h ago', tone: 'blue' },
      { icon: AlertTriangle, text: '3 failed login attempts blocked', when: '2h ago', tone: 'rose' },
      { icon: Database, text: 'Nightly backup completed — 2.4 GB', when: '6h ago', tone: 'teal' },
    ],
  },

  /* ----------------------------- ACCOUNTS ----------------------------- */
  accounts: {
    actions: [
      { label: 'New Voucher', icon: FileText },
      { label: 'Post Journal', icon: BookOpen, primary: true },
    ],
    kpis: [
      { label: 'Cash & Bank', value: '$2.41M', tone: 'teal', sub: 'across 6 accounts' },
      { label: 'Receivables', value: '$1.82M', tone: 'green', sub: '$0.4M overdue' },
      { label: 'Payables', value: '$1.07M', tone: 'amber', sub: 'due in 30 days' },
      { label: 'Open Vouchers', value: '37', tone: 'violet', sub: '9 to approve' },
      { label: 'Unreconciled', value: '12', tone: 'rose', sub: '2 banks' },
      { label: 'Net Profit (MTD)', value: '$312K', tone: 'blue', sub: '+5.1% vs LM' },
    ],
    functions: [
      { name: 'Journal Voucher', desc: 'Record manual & adjustment entries.', icon: BookOpen, accent: '#3f8fd1', count: '18 this month' },
      { name: 'Payment Voucher', desc: 'Pay suppliers, expenses & advances.', icon: ArrowUpCircle, accent: '#c66262', count: '24 posted' },
      { name: 'Receipt Voucher', desc: 'Record customer & other receipts.', icon: ArrowDownCircle, accent: '#3fae8e', count: '31 posted' },
      { name: 'Contra Voucher', desc: 'Bank-to-cash & inter-account moves.', icon: Repeat, accent: '#8a6fd0', count: '5 this month' },
      { name: 'General Ledger', desc: 'Browse account-wise transactions.', icon: BookOpen, accent: '#5ba3c2', count: '420 accounts' },
      { name: 'Trial Balance', desc: 'Verify debits & credits balance.', icon: Scale, accent: '#c2882f', count: 'Jun 2026' },
      { name: 'Financial Statements', desc: 'P&L, balance sheet & cash flow.', icon: FileBarChart, accent: '#6aa36a', count: '3 reports' },
      { name: 'Bank Reconciliation', desc: 'Match book vs bank statements.', icon: Landmark, accent: '#d1738f', count: '12 pending' },
    ],
    queue: {
      title: 'Vouchers Awaiting Approval', icon: Clock4,
      items: [
        { ref: 'JV-1182', title: 'Depreciation — June run', sub: 'Finance · 15m ago', value: '$142,000', status: 'Pending', tone: 'amber' },
        { ref: 'PV-3391', title: 'Supplier payment — ACME', sub: 'A. Karim · 1h ago', value: '$48,200', status: 'Pending', tone: 'amber' },
        { ref: 'JV-1180', title: 'Accrual — utilities', sub: 'Finance · 2h ago', value: '$6,300', status: 'Review', tone: 'violet' },
        { ref: 'PV-3388', title: 'Rent — Q3 advance', sub: 'Admin · 3h ago', value: '$30,000', status: 'Pending', tone: 'amber' },
      ],
    },
    bars: { title: 'Top Expense Heads (MTD)', items: [
      { name: 'Salaries & Wages', value: '$0.9M', pct: 88 },
      { name: 'Raw Materials', value: '$0.6M', pct: 60 },
      { name: 'Utilities', value: '$0.2M', pct: 22 },
      { name: 'Logistics', value: '$0.1M', pct: 14 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'Receipt RV-2204 posted — $18,500', when: '20m ago', tone: 'green' },
      { icon: Landmark, text: 'City Bank statement reconciled', when: '1h ago', tone: 'teal' },
      { icon: AlertTriangle, text: 'Trial balance variance flagged — $120', when: '2h ago', tone: 'rose' },
      { icon: BookOpen, text: 'Period Jun-2026 opened for posting', when: '5h ago', tone: 'blue' },
    ],
  },

  /* ----------------------------- INVENTORY ----------------------------- */
  inventory: {
    actions: [
      { label: 'Stock Adjustment', icon: ClipboardCheck },
      { label: 'New Goods Issue', icon: PackageMinus, primary: true },
    ],
    kpis: [
      { label: 'Active SKUs', value: '2,431', tone: 'blue', sub: 'across 9 stores' },
      { label: 'Stock Value', value: '$4.81M', tone: 'teal', sub: 'avg cost basis' },
      { label: 'Low Stock', value: '18', tone: 'amber', sub: 'below reorder' },
      { label: 'Out of Stock', value: '5', tone: 'rose', sub: 'action needed' },
      { label: 'Pending Transfers', value: '9', tone: 'violet', sub: '3 in transit' },
      { label: 'Expiring ≤30d', value: '7', tone: 'green', sub: 'batch tracked' },
    ],
    functions: [
      { name: 'Goods Issue', desc: 'Issue stock to jobs, sales or use.', icon: PackageMinus, accent: '#cf8a3c', count: '12 today' },
      { name: 'Stock Transfer', desc: 'Move stock between warehouses.', icon: ArrowLeftRight, accent: '#3f8fd1', count: '9 pending' },
      { name: 'Stock Adjustment', desc: 'Write-off, gain & correction entries.', icon: ClipboardCheck, accent: '#c66262', count: '4 drafts' },
      { name: 'Physical Count', desc: 'Cycle & full stock-take sheets.', icon: ClipboardList, accent: '#8a6fd0', count: '2 open' },
      { name: 'Item Master', desc: 'Items, units, barcodes & categories.', icon: Boxes, accent: '#3fae8e', count: '2,431 items' },
      { name: 'Warehouses', desc: 'Locations, bins & store setup.', icon: Warehouse, accent: '#5ba3c2', count: '9 stores' },
      { name: 'Valuation', desc: 'FIFO / weighted-avg stock value.', icon: BarChart3, accent: '#6aa36a', count: '$4.8M' },
      { name: 'Reorder Report', desc: 'Items below minimum level.', icon: PackageSearch, accent: '#c2882f', count: '18 flagged' },
    ],
    queue: {
      title: 'Low Stock Alerts', icon: AlertTriangle,
      items: [
        { ref: 'IT-0420', title: 'Steel Bolt M12 — Zinc', sub: 'Main Store · reorder 500', value: '42 left', status: 'Critical', tone: 'rose' },
        { ref: 'IT-1185', title: 'Packing Tape 48mm', sub: 'Dispatch · reorder 200', value: '63 left', status: 'Low', tone: 'amber' },
        { ref: 'IT-0911', title: 'Hydraulic Oil 20L', sub: 'Plant Store · reorder 30', value: '8 left', status: 'Critical', tone: 'rose' },
        { ref: 'IT-2240', title: 'Label Roll — A4', sub: 'Office · reorder 100', value: '55 left', status: 'Low', tone: 'amber' },
      ],
    },
    bars: { title: 'Stock Value by Warehouse', items: [
      { name: 'Main Store', value: '$2.1M', pct: 88 },
      { name: 'Plant Store', value: '$1.4M', pct: 58 },
      { name: 'Dispatch', value: '$0.8M', pct: 33 },
      { name: 'Returns', value: '$0.5M', pct: 21 },
    ] },
    feed: [
      { icon: PackageCheck, text: 'GRN-0902 received into Main Store', when: '18m ago', tone: 'teal' },
      { icon: ArrowLeftRight, text: 'Transfer TR-118 dispatched to Plant', when: '55m ago', tone: 'blue' },
      { icon: AlertTriangle, text: 'Item IT-0911 hit critical level', when: '2h ago', tone: 'rose' },
      { icon: ClipboardCheck, text: 'Cycle count CC-44 completed', when: '4h ago', tone: 'green' },
    ],
  },

  /* ----------------------------- PROCUREMENT ----------------------------- */
  procurement: {
    actions: [
      { label: 'New Requisition', icon: FileText },
      { label: 'New Purchase Order', icon: ClipboardList, primary: true },
    ],
    kpis: [
      { label: 'Open Requisitions', value: '14', tone: 'amber', sub: '3 to approve' },
      { label: 'RFQs in Progress', value: '6', tone: 'violet', sub: '2 closing soon' },
      { label: 'Open Purchase Orders', value: '42', tone: 'teal', sub: '$486K committed' },
      { label: 'Pending GRN', value: '7', tone: 'blue', sub: '4 in transit' },
      { label: 'Invoices to Match', value: '11', tone: 'rose', sub: '2 over tolerance' },
      { label: 'Spend (MTD)', value: '$486K', tone: 'green', sub: '+6.4% vs LM' },
    ],
    functions: [
      { name: 'Purchase Requisition', desc: 'Raise & approve material requests.', icon: FileText, accent: '#cf8a3c', count: '14 open', screen: 'requisition' },
      { name: 'Request for Quotation', desc: 'Float enquiries & compare quotes.', icon: FileSearch, accent: '#b574c2', count: '6 active', screen: 'rfq' },
      { name: 'Purchase Orders', desc: 'Issue, amend & track orders.', icon: ClipboardList, accent: '#3f8fd1', count: '42 open', screen: 'po' },
      { name: 'Goods Receipt (GRN)', desc: 'Receive, inspect & accept goods.', icon: PackageCheck, accent: '#3fae8e', count: '7 pending', screen: 'grn' },
      { name: 'Purchase Invoices', desc: 'Three-way match & book bills.', icon: ReceiptText, accent: '#d1738f', count: '11 to match', screen: 'invoice' },
      { name: 'Purchase Returns', desc: 'Debit notes & return to vendor.', icon: Undo2, accent: '#c9743f', count: '2 drafts', screen: 'return' },
      { name: 'Supplier Management', desc: 'Vendor master, ratings & terms.', icon: Building, accent: '#5ba3c2', count: '186 vendors', screen: 'supplier' },
      { name: 'Procurement Reports', desc: 'Spend analysis & PO ageing.', icon: BarChart3, accent: '#6aa36a', count: '24 reports', screen: 'reports' },
      { name: 'PR Status Report', desc: 'Trace PR → RFQ → PO → receipt.', icon: ClipboardCheck, accent: '#8a6fd0', count: 'live', screen: 'prstatus' },
    ],
    queue: {
      title: 'Pending Approvals', icon: Clock4,
      items: [
        { ref: 'PR-2025', title: 'Raw material — Steel coils (12T)', sub: 'Plant Stores · 15m ago', value: '$48,200', status: 'Pending', tone: 'amber' },
        { ref: 'PO-2418', title: 'Packaging consumables — Q3', sub: 'A. Rahman · 1h ago', value: '$22,750', status: 'Review', tone: 'teal' },
        { ref: 'PR-2019', title: 'IT — 15 workstations', sub: 'IT Dept · 2h ago', value: '$31,500', status: 'Pending', tone: 'amber' },
        { ref: 'RFQ-118', title: 'Logistics services — 6 month', sub: 'Procurement · 3h ago', value: '—', status: 'Open', tone: 'violet' },
      ],
    },
    bars: { title: 'Top Suppliers (MTD)', items: [
      { name: 'ACME Industrial', value: '$142K', pct: 86 },
      { name: 'Nexus Components', value: '$98K', pct: 60 },
      { name: 'Orbit Logistics', value: '$71K', pct: 44 },
      { name: 'BluePeak Traders', value: '$53K', pct: 33 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'PO-2416 approved & sent to ACME', when: '22m ago', tone: 'green' },
      { icon: PackageCheck, text: 'GRN-0902 posted against PO-2401', when: '48m ago', tone: 'teal' },
      { icon: FileSearch, text: '3 quotations received for RFQ-117', when: '1h ago', tone: 'violet' },
      { icon: AlertTriangle, text: 'Invoice INV-S-7741 over tolerance', when: '2h ago', tone: 'rose' },
    ],
  },

  /* ----------------------------- SALES ----------------------------- */
  sales: {
    actions: [
      { label: 'New Quotation', icon: FileText },
      { label: 'New Sales Order', icon: ClipboardList, primary: true },
    ],
    kpis: [
      { label: 'Revenue (MTD)', value: '$1.24M', tone: 'green', sub: '+8.6% vs LM' },
      { label: 'Orders', value: '316', tone: 'teal', sub: '22 to deliver' },
      { label: 'Open Quotations', value: '48', tone: 'violet', sub: '$0.7M value' },
      { label: 'Pending Delivery', value: '22', tone: 'amber', sub: '5 overdue' },
      { label: 'Receivables', value: '$1.82M', tone: 'blue', sub: '$0.4M overdue' },
      { label: 'Returns (MTD)', value: '4', tone: 'rose', sub: '0.8% of orders' },
    ],
    functions: [
      { name: 'Quotation', desc: 'Prepare & send customer quotes.', icon: FileText, accent: '#8a6fd0', count: '48 open' },
      { name: 'Sales Order', desc: 'Confirm & schedule customer orders.', icon: ClipboardList, accent: '#3fae8e', count: '316 MTD' },
      { name: 'Delivery / Dispatch', desc: 'Pick, pack & ship orders.', icon: Send, accent: '#3f8fd1', count: '22 pending' },
      { name: 'Sales Invoice', desc: 'Bill customers & post revenue.', icon: ReceiptText, accent: '#cf8a3c', count: '198 MTD' },
      { name: 'Sales Return', desc: 'Credit notes & returned goods.', icon: Undo2, accent: '#c66262', count: '4 drafts' },
      { name: 'Customers', desc: 'Customer master, terms & credit.', icon: Users, accent: '#5ba3c2', count: '512 active' },
      { name: 'Price List', desc: 'Price lists, discounts & schemes.', icon: Tag, accent: '#c2882f', count: '6 lists' },
      { name: 'Sales Reports', desc: 'Sales by item, customer & region.', icon: BarChart3, accent: '#6aa36a', count: '20 reports' },
    ],
    queue: {
      title: 'Orders Awaiting Action', icon: Clock4,
      items: [
        { ref: 'SO-7741', title: 'Skyline Retail — bulk order', sub: 'Credit hold · 12m ago', value: '$84,200', status: 'On Hold', tone: 'rose' },
        { ref: 'SO-7738', title: 'GreenMart — weekly resupply', sub: 'Ready to ship · 40m ago', value: '$18,750', status: 'Pack', tone: 'teal' },
        { ref: 'QT-1190', title: 'Vertex Corp — annual contract', sub: 'Quote sent · 2h ago', value: '$240,000', status: 'Quoted', tone: 'violet' },
        { ref: 'SO-7730', title: 'BluePeak — express order', sub: 'Overdue 1d · 3h ago', value: '$9,400', status: 'Overdue', tone: 'amber' },
      ],
    },
    bars: { title: 'Top Customers (MTD)', items: [
      { name: 'Skyline Retail', value: '$210K', pct: 90 },
      { name: 'GreenMart', value: '$148K', pct: 63 },
      { name: 'Vertex Corp', value: '$96K', pct: 41 },
      { name: 'BluePeak', value: '$62K', pct: 26 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'Invoice INV-90231 generated — $18,500', when: '15m ago', tone: 'green' },
      { icon: Send, text: 'SO-7735 dispatched via Orbit Logistics', when: '1h ago', tone: 'blue' },
      { icon: TrendingUp, text: 'Quotation QT-1188 converted to order', when: '2h ago', tone: 'teal' },
      { icon: Undo2, text: 'Return SR-0042 credit note issued', when: '4h ago', tone: 'rose' },
    ],
  },

  /* ----------------------------- PRODUCTION ----------------------------- */
  production: {
    actions: [
      { label: 'New BOM', icon: FileText },
      { label: 'New Work Order', icon: Factory, primary: true },
    ],
    kpis: [
      { label: 'Work Orders', value: '54', tone: 'teal', sub: '21 in progress' },
      { label: 'In Progress', value: '21', tone: 'amber', sub: '6 due today' },
      { label: 'Completed (MTD)', value: '33', tone: 'green', sub: 'on schedule' },
      { label: 'Active BOMs', value: '128', tone: 'blue', sub: '4 revisions' },
      { label: 'Material Shortage', value: '6', tone: 'rose', sub: 'blocking 3 WOs' },
      { label: 'OEE', value: '82%', tone: 'violet', sub: '+3 pts vs LM' },
    ],
    functions: [
      { name: 'Bill of Materials', desc: 'Define recipes, routes & yields.', icon: FileText, accent: '#3f8fd1', count: '128 BOMs' },
      { name: 'Work Order', desc: 'Plan & release production orders.', icon: Factory, accent: '#c9743f', count: '54 open' },
      { name: 'Job Card', desc: 'Track operations on the shop floor.', icon: ClipboardList, accent: '#8a6fd0', count: '21 active' },
      { name: 'Material Issue', desc: 'Issue components to work orders.', icon: PackageMinus, accent: '#cf8a3c', count: '17 today' },
      { name: 'Production Entry', desc: 'Record output, scrap & rework.', icon: Hammer, accent: '#3fae8e', count: '33 MTD' },
      { name: 'Routing', desc: 'Operation sequence & timings.', icon: Cog, accent: '#5ba3c2', count: '42 routes' },
      { name: 'Work Centers', desc: 'Machines, capacity & calendars.', icon: Wrench, accent: '#c2882f', count: '16 centers' },
      { name: 'Production Reports', desc: 'Output, efficiency & WIP.', icon: BarChart3, accent: '#6aa36a', count: '18 reports' },
    ],
    queue: {
      title: 'Active Work Orders', icon: Gauge,
      items: [
        { ref: 'WO-3380', title: 'Assembly — Pump Series A', sub: 'Line 1 · due today', value: '68%', status: 'Running', tone: 'teal' },
        { ref: 'WO-3377', title: 'Casting — Bracket B12', sub: 'Line 3 · material short', value: '24%', status: 'Blocked', tone: 'rose' },
        { ref: 'WO-3375', title: 'Packing — Retail kit', sub: 'Line 2 · ahead', value: '91%', status: 'Running', tone: 'green' },
        { ref: 'WO-3372', title: 'Machining — Shaft S40', sub: 'Line 4 · queued', value: '0%', status: 'Planned', tone: 'violet' },
      ],
    },
    bars: { title: 'Output by Line (MTD)', items: [
      { name: 'Line 1 — Assembly', value: '4,200 u', pct: 84 },
      { name: 'Line 2 — Packing', value: '3,650 u', pct: 73 },
      { name: 'Line 3 — Casting', value: '2,100 u', pct: 42 },
      { name: 'Line 4 — Machining', value: '1,480 u', pct: 30 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'WO-3368 completed — 1,200 units', when: '25m ago', tone: 'green' },
      { icon: PackageMinus, text: 'Material issued to WO-3380', when: '1h ago', tone: 'amber' },
      { icon: AlertTriangle, text: 'WO-3377 blocked — bracket shortage', when: '2h ago', tone: 'rose' },
      { icon: Gauge, text: 'Line 1 OEE reached 88% this shift', when: '3h ago', tone: 'teal' },
    ],
  },

  /* ----------------------------- HUMAN RESOURCES ----------------------------- */
  hr: {
    actions: [
      { label: 'Add Employee', icon: UserPlus },
      { label: 'Mark Attendance', icon: CalendarCheck, primary: true },
    ],
    kpis: [
      { label: 'Headcount', value: '742', tone: 'blue', sub: '+9 this month' },
      { label: 'Present Today', value: '698', tone: 'green', sub: '94% of staff' },
      { label: 'On Leave', value: '23', tone: 'amber', sub: '8 requests pending' },
      { label: 'Open Positions', value: '11', tone: 'violet', sub: '34 applicants' },
      { label: 'Pending Leave', value: '8', tone: 'teal', sub: 'awaiting approval' },
      { label: 'Attrition (YTD)', value: '3.2%', tone: 'rose', sub: '-0.4 pts vs LY' },
    ],
    functions: [
      { name: 'Employee Master', desc: 'Profiles, documents & history.', icon: Users, accent: '#5ba3c2', count: '742 staff' },
      { name: 'Attendance', desc: 'Daily in/out, overtime & regularize.', icon: CalendarCheck, accent: '#3fae8e', count: '698 today' },
      { name: 'Leave Management', desc: 'Apply, approve & track balances.', icon: CalendarDays, accent: '#cf8a3c', count: '8 pending' },
      { name: 'Recruitment', desc: 'Requisitions, applicants & offers.', icon: UserPlus, accent: '#8a6fd0', count: '11 open' },
      { name: 'Appraisal', desc: 'Goals, reviews & ratings.', icon: Award, accent: '#3f8fd1', count: 'Q2 cycle' },
      { name: 'Training', desc: 'Programs, sessions & records.', icon: GraduationCap, accent: '#6aa36a', count: '5 scheduled' },
      { name: 'Shift & Roster', desc: 'Shifts, rosters & calendars.', icon: Clock4, accent: '#c2882f', count: '12 shifts' },
      { name: 'HR Reports', desc: 'Headcount, attendance & turnover.', icon: BarChart3, accent: '#d1738f', count: '16 reports' },
    ],
    queue: {
      title: 'Leave Requests', icon: Clock4,
      items: [
        { ref: 'LV-2208', title: 'Sarah M. — Annual leave', sub: 'Sales · Jun 24–28', value: '5 days', status: 'Pending', tone: 'amber' },
        { ref: 'LV-2206', title: 'Imran H. — Sick leave', sub: 'Plant · Jun 20', value: '1 day', status: 'Pending', tone: 'amber' },
        { ref: 'LV-2203', title: 'Nadia K. — Casual leave', sub: 'Finance · Jun 22', value: '2 days', status: 'Review', tone: 'violet' },
        { ref: 'LV-2199', title: 'Tariq A. — Annual leave', sub: 'IT · Jul 01–05', value: '5 days', status: 'Pending', tone: 'amber' },
      ],
    },
    bars: { title: 'Headcount by Department', items: [
      { name: 'Production', value: '312', pct: 92 },
      { name: 'Sales', value: '148', pct: 44 },
      { name: 'Admin & Finance', value: '96', pct: 28 },
      { name: 'IT & Others', value: '186', pct: 55 },
    ] },
    feed: [
      { icon: UserPlus, text: '2 offers accepted — Production roles', when: '30m ago', tone: 'green' },
      { icon: CalendarCheck, text: 'Attendance locked for yesterday', when: '1h ago', tone: 'blue' },
      { icon: Award, text: 'Q2 appraisal cycle opened', when: '3h ago', tone: 'violet' },
      { icon: AlertTriangle, text: '3 staff approaching leave limit', when: '5h ago', tone: 'amber' },
    ],
  },

  /* ----------------------------- PAYROLL ----------------------------- */
  payroll: {
    actions: [
      { label: 'View Payslips', icon: ReceiptText },
      { label: 'Process Payroll', icon: Wallet, primary: true },
    ],
    kpis: [
      { label: 'Net Payable', value: '$0.91M', tone: 'teal', sub: 'June cycle' },
      { label: 'Employees', value: '742', tone: 'blue', sub: '12 new joiners' },
      { label: 'Gross Salary', value: '$1.10M', tone: 'green', sub: 'before deductions' },
      { label: 'Deductions', value: '$186K', tone: 'amber', sub: 'tax + benefits' },
      { label: 'Pending Approvals', value: '5', tone: 'rose', sub: 'before run' },
      { label: 'Pay Date', value: 'Jun 28', tone: 'violet', sub: '8 days away' },
    ],
    functions: [
      { name: 'Salary Structure', desc: 'Define earnings & deduction heads.', icon: Calculator, accent: '#7d8ad1', count: '14 grades' },
      { name: 'Process Payroll', desc: 'Run monthly payroll & validate.', icon: Wallet, accent: '#3fae8e', count: 'June ready' },
      { name: 'Payslips', desc: 'Generate & distribute payslips.', icon: ReceiptText, accent: '#3f8fd1', count: '742 staff' },
      { name: 'Loans & Advances', desc: 'Issue & recover staff loans.', icon: CircleDollarSign, accent: '#cf8a3c', count: '38 active' },
      { name: 'Tax & Deductions', desc: 'Statutory tax, PF & insurance.', icon: Percent, accent: '#c66262', count: '$186K' },
      { name: 'Bonus & Incentive', desc: 'Festival bonus & performance pay.', icon: Gift, accent: '#d1738f', count: '2 schemes' },
      { name: 'Bank Disbursement', desc: 'Generate bank transfer files.', icon: Banknote, accent: '#6aa36a', count: '5 banks' },
      { name: 'Payroll Reports', desc: 'Register, cost & statutory.', icon: BarChart3, accent: '#c2882f', count: '12 reports' },
    ],
    queue: {
      title: 'Payroll Approvals', icon: Clock4,
      items: [
        { ref: 'PR-JUN', title: 'June payroll run — all staff', sub: 'HR · awaiting CFO', value: '$0.91M', status: 'Pending', tone: 'rose' },
        { ref: 'LN-0145', title: 'Loan — Imran H. (advance)', sub: 'Plant · 1h ago', value: '$2,000', status: 'Pending', tone: 'amber' },
        { ref: 'BN-0012', title: 'Festival bonus — Production', sub: 'HR · 2h ago', value: '$58,000', status: 'Review', tone: 'violet' },
        { ref: 'OT-0331', title: 'Overtime — Line 2 (May)', sub: 'Plant · 4h ago', value: '$6,400', status: 'Pending', tone: 'amber' },
      ],
    },
    bars: { title: 'Payroll Cost by Department', items: [
      { name: 'Production', value: '$0.42M', pct: 92 },
      { name: 'Sales', value: '$0.21M', pct: 46 },
      { name: 'Admin & Finance', value: '$0.16M', pct: 35 },
      { name: 'IT & Others', value: '$0.12M', pct: 26 },
    ] },
    feed: [
      { icon: Wallet, text: 'May payroll disbursed — $0.89M', when: '1d ago', tone: 'green' },
      { icon: CircleDollarSign, text: 'Loan LN-0142 fully recovered', when: '2h ago', tone: 'teal' },
      { icon: Percent, text: 'Tax slab updated for FY26', when: '5h ago', tone: 'blue' },
      { icon: AlertTriangle, text: '5 approvals pending before run', when: '6h ago', tone: 'rose' },
    ],
  },

  /* ----------------------------- CRM ----------------------------- */
  crm: {
    actions: [
      { label: 'Log Activity', icon: Phone },
      { label: 'New Lead', icon: Target, primary: true },
    ],
    kpis: [
      { label: 'Open Leads', value: '189', tone: 'rose', sub: '34 new this week' },
      { label: 'Opportunities', value: '64', tone: 'violet', sub: '$3.2M pipeline' },
      { label: 'Pipeline Value', value: '$3.2M', tone: 'teal', sub: 'weighted $1.4M' },
      { label: 'Win Rate', value: '34%', tone: 'green', sub: '+2 pts vs LM' },
      { label: 'Activities Due', value: '27', tone: 'amber', sub: '6 overdue' },
      { label: 'Open Tickets', value: '18', tone: 'blue', sub: '3 escalated' },
    ],
    functions: [
      { name: 'Leads', desc: 'Capture, qualify & assign leads.', icon: Target, accent: '#d1738f', count: '189 open' },
      { name: 'Opportunities', desc: 'Track deals through the pipeline.', icon: TrendingUp, accent: '#8a6fd0', count: '64 active' },
      { name: 'Accounts & Contacts', desc: 'Companies & people you sell to.', icon: Users, accent: '#5ba3c2', count: '512 accounts' },
      { name: 'Activities', desc: 'Calls, meetings & tasks.', icon: Phone, accent: '#3fae8e', count: '27 due' },
      { name: 'Campaigns', desc: 'Run & measure marketing reach.', icon: Megaphone, accent: '#cf8a3c', count: '4 live' },
      { name: 'Quotes', desc: 'Build & send sales quotes.', icon: FileText, accent: '#3f8fd1', count: '22 sent' },
      { name: 'Support Tickets', desc: 'Resolve customer issues.', icon: LifeBuoy, accent: '#c66262', count: '18 open' },
      { name: 'CRM Reports', desc: 'Funnel, conversion & SLA.', icon: BarChart3, accent: '#6aa36a', count: '14 reports' },
    ],
    queue: {
      title: 'Hot Opportunities', icon: TrendingUp,
      items: [
        { ref: 'OP-0512', title: 'Vertex Corp — annual contract', sub: 'Negotiation · 80%', value: '$240,000', status: 'Hot', tone: 'rose' },
        { ref: 'OP-0508', title: 'Skyline — store rollout', sub: 'Proposal · 60%', value: '$120,000', status: 'Warm', tone: 'amber' },
        { ref: 'OP-0501', title: 'GreenMart — supply deal', sub: 'Qualified · 40%', value: '$74,000', status: 'Open', tone: 'violet' },
        { ref: 'LD-1180', title: 'NorthStar Inc — inbound', sub: 'New · unassigned', value: '—', status: 'New', tone: 'teal' },
      ],
    },
    bars: { title: 'Pipeline by Stage', items: [
      { name: 'Qualification', value: '$1.1M', pct: 70 },
      { name: 'Proposal', value: '$0.9M', pct: 56 },
      { name: 'Negotiation', value: '$0.7M', pct: 44 },
      { name: 'Closing', value: '$0.5M', pct: 31 },
    ] },
    feed: [
      { icon: CheckCircle2, text: 'OP-0498 won — Acme renewal $86K', when: '40m ago', tone: 'green' },
      { icon: Phone, text: 'Call logged with Vertex Corp', when: '1h ago', tone: 'blue' },
      { icon: Megaphone, text: 'Summer campaign reached 12K contacts', when: '3h ago', tone: 'violet' },
      { icon: LifeBuoy, text: 'Ticket TK-2291 escalated to L2', when: '4h ago', tone: 'rose' },
    ],
  },

  /* ----------------------------- FIXED ASSET MANAGEMENT ----------------------------- */
  fixedasset: {
    actions: [
      { label: 'Run Depreciation', icon: TrendingUp },
      { label: 'Add Asset', icon: Building2, primary: true },
    ],
    kpis: [
      { label: 'Total Assets', value: '1,068', tone: 'green', sub: '12 categories' },
      { label: 'Net Book Value', value: '$8.41M', tone: 'teal', sub: 'gross $12.6M' },
      { label: 'Depreciation (MTD)', value: '$142K', tone: 'blue', sub: 'straight-line' },
      { label: 'Under Maintenance', value: '9', tone: 'amber', sub: '2 critical' },
      { label: 'Disposals (YTD)', value: '14', tone: 'rose', sub: '$0.3M proceeds' },
      { label: 'CWIP', value: '$0.61M', tone: 'violet', sub: '4 projects' },
    ],
    functions: [
      { name: 'Asset Register', desc: 'Full PPE register & tagging.', icon: Building2, accent: '#6aa36a', count: '1,068 assets' },
      { name: 'Acquisition', desc: 'Capitalize purchases & CWIP.', icon: PackageCheck, accent: '#3fae8e', count: '8 this month' },
      { name: 'Depreciation Run', desc: 'Monthly depreciation posting.', icon: TrendingUp, accent: '#3f8fd1', count: 'June due' },
      { name: 'Transfer', desc: 'Move assets across locations.', icon: ArrowLeftRight, accent: '#8a6fd0', count: '5 pending' },
      { name: 'Revaluation', desc: 'Revalue & impair asset values.', icon: Scale, accent: '#c2882f', count: '2 due' },
      { name: 'Maintenance', desc: 'Schedule & log asset upkeep.', icon: Wrench, accent: '#cf8a3c', count: '9 active' },
      { name: 'Disposal', desc: 'Sale, scrap & write-off flow.', icon: Undo2, accent: '#c66262', count: '3 drafts' },
      { name: 'Asset Reports', desc: 'Register, depreciation & NBV.', icon: BarChart3, accent: '#d1738f', count: '15 reports' },
    ],
    queue: {
      title: 'Pending Actions', icon: Clock4,
      items: [
        { ref: 'CAP-0188', title: 'Capitalize — CNC Machine', sub: 'CWIP · ready', value: '$215,000', status: 'Pending', tone: 'amber' },
        { ref: 'MNT-0421', title: 'Generator — overhaul', sub: 'Plant · critical', value: '$12,400', status: 'Critical', tone: 'rose' },
        { ref: 'TRF-0093', title: 'Transfer 8 laptops → Branch B', sub: 'IT · 2h ago', value: '$9,600', status: 'Review', tone: 'violet' },
        { ref: 'DSP-0044', title: 'Scrap — old forklift', sub: 'Stores · approval', value: '$3,200', status: 'Pending', tone: 'amber' },
      ],
    },
    bars: { title: 'Net Book Value by Category', items: [
      { name: 'Plant & Machinery', value: '$4.2M', pct: 90 },
      { name: 'Buildings', value: '$2.3M', pct: 49 },
      { name: 'Vehicles', value: '$1.1M', pct: 23 },
      { name: 'IT Equipment', value: '$0.8M', pct: 17 },
    ] },
    feed: [
      { icon: TrendingUp, text: 'May depreciation posted — $140K', when: '1d ago', tone: 'blue' },
      { icon: PackageCheck, text: 'Asset FA-1066 capitalized', when: '2h ago', tone: 'green' },
      { icon: Wrench, text: 'Maintenance MNT-0418 closed', when: '4h ago', tone: 'teal' },
      { icon: AlertTriangle, text: 'Generator flagged for overhaul', when: '6h ago', tone: 'rose' },
    ],
  },

  /* ----------------------------- FLEET MANAGEMENT ----------------------------- */
  fleet: {
    actions: [
      { label: 'Log Trip', icon: MapPin },
      { label: 'Add Vehicle', icon: Truck, primary: true },
    ],
    kpis: [
      { label: 'Vehicles', value: '64', tone: 'teal', sub: '6 types' },
      { label: 'In Service', value: '58', tone: 'green', sub: '91% available' },
      { label: 'Under Maintenance', value: '6', tone: 'amber', sub: '2 overdue' },
      { label: 'Trips (MTD)', value: '412', tone: 'blue', sub: '38,200 km' },
      { label: 'Fuel Cost (MTD)', value: '$38K', tone: 'rose', sub: '+4% vs LM' },
      { label: 'Service Due', value: '7', tone: 'violet', sub: 'next 7 days' },
    ],
    functions: [
      { name: 'Vehicle Master', desc: 'Fleet register, specs & docs.', icon: Truck, accent: '#c28f3f', count: '64 vehicles' },
      { name: 'Trip Management', desc: 'Plan, assign & close trips.', icon: MapPin, accent: '#3f8fd1', count: '412 MTD' },
      { name: 'Fuel Log', desc: 'Record refuels & mileage.', icon: Fuel, accent: '#c66262', count: '$38K MTD' },
      { name: 'Maintenance', desc: 'Service schedules & repairs.', icon: Wrench, accent: '#cf8a3c', count: '6 active' },
      { name: 'Driver Management', desc: 'Drivers, licenses & duty.', icon: Users, accent: '#5ba3c2', count: '71 drivers' },
      { name: 'GPS Tracking', desc: 'Live location & route history.', icon: MapPin, accent: '#3fae8e', count: '58 live' },
      { name: 'Insurance & Docs', desc: 'Insurance, tax & fitness.', icon: ShieldCheck, accent: '#8a6fd0', count: '7 expiring' },
      { name: 'Fleet Reports', desc: 'Utilization, fuel & cost.', icon: BarChart3, accent: '#6aa36a', count: '14 reports' },
    ],
    queue: {
      title: 'Service & Trip Alerts', icon: Clock4,
      items: [
        { ref: 'DH-1129', title: 'Truck — 90,000 km service', sub: 'Overdue 400 km', value: 'Service', status: 'Overdue', tone: 'rose' },
        { ref: 'TRP-2204', title: 'Dhaka → Chittagong delivery', sub: 'Driver: Kamal · awaiting', value: '264 km', status: 'Pending', tone: 'amber' },
        { ref: 'DOC-0188', title: 'Van DH-0912 — insurance', sub: 'Expires in 5 days', value: 'Renew', status: 'Expiring', tone: 'violet' },
        { ref: 'TRP-2201', title: 'Plant shuttle — morning', sub: 'Ready to dispatch', value: '42 km', status: 'Ready', tone: 'teal' },
      ],
    },
    bars: { title: 'Fuel Cost by Vehicle Type', items: [
      { name: 'Trucks', value: '$18K', pct: 88 },
      { name: 'Vans', value: '$9K', pct: 44 },
      { name: 'Cars', value: '$7K', pct: 34 },
      { name: 'Forklifts', value: '$4K', pct: 20 },
    ] },
    feed: [
      { icon: MapPin, text: 'Trip TRP-2198 completed — 312 km', when: '35m ago', tone: 'green' },
      { icon: Fuel, text: 'Refuel logged — DH-1102, 80 L', when: '1h ago', tone: 'blue' },
      { icon: Wrench, text: 'Service done — Van DH-0907', when: '3h ago', tone: 'teal' },
      { icon: AlertTriangle, text: 'DH-1129 service overdue', when: '5h ago', tone: 'rose' },
    ],
  },
}
