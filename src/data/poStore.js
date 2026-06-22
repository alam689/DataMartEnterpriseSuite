/*
 * Tiny external store for Purchase Orders, shared between the RFQ module
 * (which auto-creates supplier-wise POs on CS approval) and the PO Register
 * screen (which lists & tracks them). Read via React's useSyncExternalStore.
 */
let pos = []
let seeded = false
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const maxSeq = (list) => list.reduce((m, p) => Math.max(m, parseInt(String(p.no).replace('PO-', ''), 10) || 0), 2418)

export const PO_STATUSES = ['Open', 'Sent', 'Partial', 'Received', 'Completed', 'Cancelled']

export const poStore = {
  getAll: () => pos,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  // Seed once (idempotent) from a function that returns the initial PO list.
  ensureSeeded: (seeder) => {
    if (seeded) return
    seeded = true
    pos = seeder() || []
    emit()
  },
  // Replace all POs belonging to one RFQ (used on re-approval so we never duplicate).
  // builder(startSeq) returns the freshly built PO array for that RFQ.
  replaceForRfq: (rfqNo, builder) => {
    const others = pos.filter((p) => p.rfqNo !== rfqNo)
    pos = [...others, ...builder(maxSeq(others) + 1)]
    emit()
  },
  setStatus: (no, status) => {
    pos = pos.map((p) => (p.no === no ? { ...p, status } : p))
    emit()
  },
}
