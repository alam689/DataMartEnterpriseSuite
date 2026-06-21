/*
 * Approved Purchase Requisition lines available to pull into an RFQ.
 * (Demo data — in a real app this comes from the approved PRs in the
 * Requisition module.)
 */
export const prSource = [
  {
    no: 'PR-2025', dept: 'Plant Stores', requiredBy: '2026-06-28',
    items: [
      { item: 'Steel Coils', desc: 'CRC grade', uom: 'MT', qty: 12 },
      { item: 'Welding Rods', desc: '3.2mm', uom: 'Box', qty: 40 },
      { item: 'Cutting Discs', desc: '4 inch', uom: 'Pcs', qty: 100 },
    ],
  },
  {
    no: 'PR-2024', dept: 'IT', requiredBy: '2026-07-01',
    items: [
      { item: 'Workstation PC — i5', desc: '16GB / 512GB', uom: 'Unit', qty: 15 },
      { item: 'Monitor 24"', desc: 'IPS, FHD', uom: 'Unit', qty: 15 },
    ],
  },
  {
    no: 'PR-2022', dept: 'Production', requiredBy: '2026-06-22',
    items: [
      { item: 'Resin', desc: 'Epoxy', uom: 'Kg', qty: 200 },
      { item: 'Hardener', desc: '', uom: 'Kg', qty: 80 },
      { item: 'Pigment', desc: 'Blue', uom: 'Kg', qty: 40 },
    ],
  },
  {
    no: 'PR-2020', dept: 'Sales', requiredBy: '2026-06-24',
    items: [
      { item: 'Brochures', desc: 'A4 glossy', uom: 'Pack', qty: 200 },
      { item: 'Banners', desc: 'Roll-up', uom: 'Pcs', qty: 28 },
    ],
  },
]
