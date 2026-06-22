/*
 * Shared in-memory stores for the downstream Procurement documents:
 * Goods Receipts (GRN), Purchase Invoices (Bills) and Purchase Returns.
 * Same useSyncExternalStore-friendly pattern as poStore.
 */
function makeStore(seed) {
  let data = seed
  const listeners = new Set()
  const emit = () => listeners.forEach((l) => l())
  return {
    getAll: () => data,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    add: (rec) => { data = [rec, ...data]; emit() },
    update: (no, patch) => { data = data.map((r) => (r.no === no ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)); emit() },
    nextNo: (prefix) => {
      const max = data.reduce((m, r) => Math.max(m, parseInt(String(r.no).split('-')[1], 10) || 0), 0)
      return `${prefix}-${String(max + 1).padStart(4, '0')}`
    },
  }
}

// --- Goods Receipt Notes ---
export const grnStore = makeStore([
  {
    no: 'GRN-0007', poNo: 'PO-2420', supplier: 'ACME Industrial', dept: 'Production', date: '2026-06-18', status: 'Accepted',
    lines: [{ item: 'Hardener', uom: 'Kg', ordered: 80, received: 80, accepted: 80, rejected: 0 }],
  },
  {
    no: 'GRN-0006', poNo: 'PO-2419', supplier: 'Orbit Logistics', dept: 'Production', date: '2026-06-17', status: 'Partial',
    lines: [{ item: 'Resin', uom: 'Kg', ordered: 200, received: 150, accepted: 145, rejected: 5 }],
  },
])

// --- Purchase Invoices (Bills) ---
export const invoiceStore = makeStore([
  { no: 'PINV-0031', poNo: 'PO-2420', grnNo: 'GRN-0007', supplier: 'ACME Industrial', date: '2026-06-19', dueDate: '2026-07-19', poAmount: 14400, grnOk: true, invAmount: 14400, status: 'Matched' },
  { no: 'PINV-0030', poNo: 'PO-2419', grnNo: 'GRN-0006', supplier: 'Orbit Logistics', date: '2026-06-18', dueDate: '2026-07-03', poAmount: 43000, grnOk: false, invAmount: 43000, status: 'On Hold' },
])

// --- Purchase Returns (Debit Notes) ---
export const returnStore = makeStore([
  { no: 'PRET-0009', grnNo: 'GRN-0006', poNo: 'PO-2419', supplier: 'Orbit Logistics', date: '2026-06-17', item: 'Resin', qty: 5, uom: 'Kg', rate: 215, reason: 'Damaged in transit', status: 'Issued' },
])
