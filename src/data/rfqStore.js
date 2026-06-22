/*
 * Read-only mirror of the RFQ module's live list, so downstream views
 * (e.g. the PR Status report) can trace a requisition through its RFQ.
 * The RFQ screen owns the data and publishes into this store on change.
 */
let rfqs = []
let seeded = false
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

export const rfqStore = {
  getAll: () => rfqs,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
  ensureSeeded: (seeder) => { if (seeded) return; seeded = true; rfqs = seeder() || []; emit() },
  set: (next) => { rfqs = next; emit() },
}
