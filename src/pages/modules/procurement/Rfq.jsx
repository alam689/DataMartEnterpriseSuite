import { Fragment, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Trash2, FileText, Save, Send, FileSearch,
  CheckCircle2, XCircle, FileEdit, Package, Printer, Eye, Database, Building, Scale, Award, ListChecks, X, Pencil, ClipboardList,
} from 'lucide-react'
import { prSource } from '../../../data/prSource.js'
import { poStore } from '../../../data/poStore.js'
import { rfqStore } from '../../../data/rfqStore.js'
import './Rfq.css'

/*
 * Request for Quotation (RFQ) + Comparative Statement (CS) with approval.
 *  - Items can be added manually OR pulled from multiple Purchase Requisitions.
 *  - Multiple suppliers are invited; quotes recorded per supplier per item.
 *  - The CS supports a SPLIT AWARD: each item is awarded to a chosen supplier,
 *    so different items can go to different suppliers.
 * In-memory demo data.
 */

const TODAY = new Date().toISOString().slice(0, 10)
const money = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const COMPANY = { name: 'DataMart Corp', address: '12 Enterprise Avenue, Dhaka 1212, Bangladesh' }
const DEPARTMENTS = ['Plant Stores', 'Production', 'Maintenance', 'IT', 'Admin', 'Sales', 'Finance', 'HR']
const SUPPLIERS = ['ACME Industrial', 'Nexus Components', 'Orbit Logistics', 'BluePeak Traders', 'Stellar Supplies']

const RFQ_META = {
  Draft: { tone: 'slate', icon: FileEdit },
  Sent: { tone: 'blue', icon: Send },
  Quoted: { tone: 'violet', icon: FileSearch },
  Closed: { tone: 'green', icon: CheckCircle2 },
}
// Comparative Statement runs a 3-stage flow: Creator submits → Verifier verifies → Approver approves.
const CS_META = {
  None: { tone: 'slate', label: 'Not started' },
  Submitted: { tone: 'amber', label: 'Pending verification' },
  Verified: { tone: 'blue', label: 'Pending approval' },
  Approved: { tone: 'green', label: 'Approved' },
  Rejected: { tone: 'rose', label: 'Rejected' },
}
const DEFAULT_CREATOR_REMARK = 'VAT & Tax as applicable. PO to lowest bidder / as per selection.'

// Blank 3-stage CS sign-off block (creator/verifier/approver remarks + who/when).
const BLANK_CS = {
  csStatus: 'None', award: [],
  csCreatorRemark: DEFAULT_CREATOR_REMARK, csVerifierRemark: '', csApproverRemark: '',
  createdBy: '', createdOn: '', verifiedBy: '', verifiedOn: '', approvedBy: '', approvedOn: '',
}

const SEED = [
  {
    no: 'RFQ-0042', date: '2026-06-18', dept: 'Plant Stores', requiredBy: '2026-06-30', status: 'Quoted', currency: 'BDT',
    remarks: 'For the upcoming production run.', ...BLANK_CS, createdBy: 'sakhawat@scpl.com', createdOn: '2026-06-16',
    items: [
      { item: 'Steel Coils', desc: 'CRC grade', uom: 'MT', qty: 12, prNo: 'PR-2025', lastPrice: 3400, lastPriceDate: '2026-05-20' },
      { item: 'Welding Rods', desc: '3.2mm', uom: 'Box', qty: 40, prNo: 'PR-2025', lastPrice: 125, lastPriceDate: '2026-05-22' },
      { item: 'Cutting Discs', desc: '4 inch', uom: 'Pcs', qty: 100, prNo: 'PR-2025', lastPrice: 13.5, lastPriceDate: '2026-06-01' },
    ],
    quotes: [
      { supplier: 'ACME Industrial', received: true, deliveryDays: 10, validityDays: 30, rates: [3500, 120, 14], brands: ['Tata Steel / India', 'Esab / Sweden', 'Bosch / Germany'], specs: ['CRC IS 513 D', 'E6013 3.2mm', 'A24 Inox 4"'], vats: [5, 5, 7.5], lineRemarks: ['Mill test cert included', '', ''] },
      { supplier: 'Nexus Components', received: true, deliveryDays: 7, validityDays: 21, rates: [3450, 130, 13], brands: ['POSCO / Korea', 'Lincoln / USA', 'Norton / India'], specs: ['CRC SPCC', 'E6013 3.2mm', 'A30 4"'], vats: [5, 5, 7.5], lineRemarks: ['', 'Fastest delivery', ''] },
      { supplier: 'Stellar Supplies', received: true, deliveryDays: 14, validityDays: 30, rates: [3600, 115, 15], brands: ['JSW / India', 'Kobelco / Japan', 'Makita / Japan'], specs: ['CRC IS 513', 'E7018 3.2mm', 'A36 4"'], vats: [5, 5, 7.5], lineRemarks: ['', '', 'Premium grade'] },
    ],
  },
  {
    no: 'RFQ-0041', date: '2026-06-17', dept: 'IT', requiredBy: '2026-07-02', status: 'Sent', currency: 'BDT',
    remarks: 'New joiner workstations.', ...BLANK_CS,
    items: [
      { item: 'Workstation PC — i5', desc: '16GB / 512GB', uom: 'Unit', qty: 15, prNo: 'PR-2024', lastPrice: 1950, lastPriceDate: '2026-04-30' },
      { item: 'Monitor 24"', desc: 'IPS, FHD', uom: 'Unit', qty: 15, prNo: 'PR-2024', lastPrice: 195, lastPriceDate: '2026-04-30' },
    ],
    quotes: [
      { supplier: 'Nexus Components', received: true, deliveryDays: 12, validityDays: 30, rates: [1900, 200] },
      { supplier: 'BluePeak Traders', received: false, deliveryDays: '', validityDays: '', rates: ['', ''] },
    ],
  },
  {
    no: 'RFQ-0040', date: '2026-06-16', dept: 'Maintenance', requiredBy: '2026-06-28', status: 'Draft', currency: 'BDT',
    remarks: '', ...BLANK_CS,
    items: [
      { item: 'Bearing 6204', desc: '', uom: 'Pcs', qty: 50, prNo: '', lastPrice: 0, lastPriceDate: '' },
      { item: 'V-Belt A-50', desc: '', uom: 'Pcs', qty: 30, prNo: '', lastPrice: 0, lastPriceDate: '' },
    ],
    quotes: [],
  },
  {
    no: 'RFQ-0039', date: '2026-06-12', dept: 'Production', requiredBy: '2026-06-22', status: 'Closed', currency: 'BDT',
    remarks: 'Resin & hardener for Q2.', ...BLANK_CS,
    csStatus: 'Approved', award: ['Orbit Logistics', 'ACME Industrial'],
    csCreatorRemark: 'VAT & Tax as applicable. PO to lowest bidder / as per selection.',
    csVerifierRemark: 'Rates & specs cross-checked against PR-2022.', csApproverRemark: 'Split awarded on lowest line price.',
    createdBy: 'sakhawat@scpl.com', createdOn: '2026-06-12', verifiedBy: 'rakib@scpl.com', verifiedOn: '2026-06-13', approvedBy: 'sakhawat@scpl.com', approvedOn: '2026-06-14',
    items: [
      { item: 'Resin', desc: 'Epoxy', uom: 'Kg', qty: 200, prNo: 'PR-2022', lastPrice: 218, lastPriceDate: '2026-03-15' },
      { item: 'Hardener', desc: '', uom: 'Kg', qty: 80, prNo: 'PR-2022', lastPrice: 182, lastPriceDate: '2026-03-15' },
    ],
    quotes: [
      { supplier: 'ACME Industrial', received: true, deliveryDays: 9, validityDays: 30, rates: [220, 180] },
      { supplier: 'Orbit Logistics', received: true, deliveryDays: 11, validityDays: 30, rates: [215, 185] },
    ],
  },
]

const supplierTotal = (rfq, q) => rfq.items.reduce((s, it, i) => s + (Number(q.rates[i]) || 0) * it.qty, 0)
const receivedCount = (rfq) => rfq.quotes.filter((q) => q.received).length
const lineAmount = (rfq, supplier, i) => {
  const q = rfq.quotes.find((x) => x.supplier === supplier)
  return q ? (Number(q.rates[i]) || 0) * rfq.items[i].qty : 0
}

// Supplier-provided per-line quote fields (besides price). Stored as parallel arrays on each quote.
const QFIELDS = [
  { key: 'brands', placeholder: 'Brand / origin' },
  { key: 'specs', placeholder: 'Specification' },
]
const qv = (q, key, i) => (q && q[key] ? (q[key][i] ?? '') : '')
const lineVatAmount = (q, it, i) => (Number(q.rates[i]) || 0) * it.qty * (Number(qv(q, 'vats', i)) || 0) / 100
const supplierVat = (rfq, q) => rfq.items.reduce((s, it, i) => s + lineVatAmount(q, it, i), 0)
// A fresh quote column with all parallel arrays sized to the item count.
const emptyQuote = (supplier, n) => ({
  supplier, received: false, deliveryDays: '', validityDays: '',
  rates: Array(n).fill(''), brands: Array(n).fill(''), specs: Array(n).fill(''), vats: Array(n).fill(''), lineRemarks: Array(n).fill(''),
})

// --- Comparative Statement figures ---
const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
// Lowest received rate for an item (0 if none quoted).
const itemBestRate = (rfq, i) => {
  const vals = rfq.quotes.filter((q) => q.received && Number(q.rates[i]) > 0).map((q) => Number(q.rates[i]))
  return vals.length ? Math.min(...vals) : 0
}
const bestPriceTotal = (rfq) => rfq.items.reduce((s, it, i) => s + itemBestRate(rfq, i) * it.qty, 0)
// Highest received rate for an item (0 if none quoted).
const itemHighRate = (rfq, i) => {
  const vals = rfq.quotes.filter((q) => q.received && Number(q.rates[i]) > 0).map((q) => Number(q.rates[i]))
  return vals.length ? Math.max(...vals) : 0
}
// Rate of the awarded ("picked") supplier for an item; falls back to the lowest received rate before any award.
const itemPickedRate = (rfq, i) => {
  const sup = rfq.award?.[i]
  if (sup) {
    const q = rfq.quotes.find((x) => x.supplier === sup)
    const r = q ? Number(q.rates[i]) || 0 : 0
    if (r > 0) return r
  }
  return itemBestRate(rfq, i)
}
// Potential saving = Σ (highest bid − picked bid) × qty over items: what the chosen bids save vs the dearest quotes.
const potentialSavingTotal = (rfq) => rfq.items.reduce((s, it, i) => {
  const hi = itemHighRate(rfq, i)
  const pick = itemPickedRate(rfq, i)
  return s + (hi > 0 && pick > 0 ? (hi - pick) * it.qty : 0)
}, 0)
const lastPoTotal = (rfq) => rfq.items.reduce((s, it) => s + (Number(it.lastPrice) || 0) * it.qty, 0)
const approvedTotal = (rfq) => rfq.items.reduce((s, it, i) => s + (rfq.award?.[i] ? lineAmount(rfq, rfq.award[i], i) : 0), 0)
const prList = (rfq) => [...new Set(rfq.items.map((it) => it.prNo).filter(Boolean))]
const awardedCount = (rfq) => rfq.items.filter((_, i) => rfq.award?.[i]).length
// % change of a rate vs the item's last purchase price (null when no last price).
const pctVsLast = (rate, lastPrice) => {
  const lp = Number(lastPrice) || 0
  if (!lp || !(Number(rate) > 0)) return null
  return ((Number(rate) - lp) / lp) * 100
}
// Deterministic pseudo supplier code (SUP-000xxx) so the CS header reads like the reference.
const supplierCode = (name) => 'SUP-' + String((([...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0)) % 999) + 1).padStart(6, '0')

// Build supplier-wise Purchase Orders from an approved RFQ's split award.
// Awarded items are grouped by their awarded supplier → one PO per supplier.
const buildPosFromRfq = (rfq, startSeq) => {
  const bySupplier = {}
  rfq.items.forEach((it, i) => {
    const sup = rfq.award?.[i]
    if (!sup) return
    const q = rfq.quotes.find((x) => x.supplier === sup)
    if (!q) return
    const rate = Number(q.rates[i]) || 0
    const amount = rate * it.qty
    const vat = Number(qv(q, 'vats', i)) || 0
    const vatAmount = (amount * vat) / 100
    ;(bySupplier[sup] = bySupplier[sup] || []).push({
      item: it.item, desc: it.desc, uom: it.uom, qty: it.qty, prNo: it.prNo || '',
      brand: qv(q, 'brands', i), spec: qv(q, 'specs', i), rate, amount, vat, vatAmount,
    })
  })
  let seq = startSeq
  return Object.entries(bySupplier).map(([supplier, lines]) => {
    const subtotal = lines.reduce((s, l) => s + l.amount, 0)
    const vatTotal = lines.reduce((s, l) => s + l.vatAmount, 0)
    return {
      no: `PO-${String(seq++).padStart(4, '0')}`, rfqNo: rfq.no, supplier, supplierCode: supplierCode(supplier),
      dept: rfq.dept, date: rfq.approvedOn || TODAY, currency: rfq.currency || 'BDT', status: 'Open',
      lines, subtotal, vatTotal, total: subtotal + vatTotal,
    }
  })
}

// Initial POs for already-approved seed RFQs (so the register is populated on first load).
export function buildInitialPos() {
  let seq = 2419
  return SEED.filter((r) => r.csStatus === 'Approved').flatMap((r) => {
    const made = buildPosFromRfq(r, seq)
    seq += made.length
    return made
  })
}
// Populate the shared PO store once, at app load, so the register is ready even before any approval.
poStore.ensureSeeded(buildInitialPos)
// Seed the RFQ mirror so the PR Status report has data before the RFQ screen is opened.
rfqStore.ensureSeeded(() => SEED)

// Award split: { supplier: { count, amount, items:[] } } over awarded items.
const awardSummary = (rfq) => {
  const map = {}
  rfq.items.forEach((it, i) => {
    const sup = rfq.award?.[i]
    if (!sup) return
    map[sup] = map[sup] || { count: 0, amount: 0, items: [] }
    map[sup].count += 1
    map[sup].amount += lineAmount(rfq, sup, i)
    map[sup].items.push(it.item)
  })
  return map
}
const awardGrand = (rfq) => Object.values(awardSummary(rfq)).reduce((s, x) => s + x.amount, 0)
const allAwarded = (rfq) => rfq.items.length > 0 && rfq.items.every((_, i) => rfq.award?.[i])
// Auto-award each item to the supplier with the lowest received rate ('' if none quoted).
const bestAward = (rfq) => rfq.items.map((_, i) => {
  const cand = rfq.quotes.filter((q) => q.received && Number(q.rates[i]) > 0)
  if (!cand.length) return ''
  return cand.reduce((a, b) => (Number(a.rates[i]) <= Number(b.rates[i]) ? a : b)).supplier
})

let itemSeq = 1
const newItem = () => ({ id: itemSeq++, item: '', desc: '', uom: '', qty: '', prNo: '' })

/* ----------------- Comparison matrix (entry + CS with split award) ----------------- */
function QuoteMatrix({ rfq, mode, award, onRate, onReceived, onMeta, onField, onAward, onRemoveSupplier }) {
  const cols = mode === 'cs' ? rfq.quotes.filter((q) => q.received) : rfq.quotes
  const totals = cols.map((q) => supplierTotal(rfq, q))
  const vatTotals = cols.map((q) => supplierVat(rfq, q))
  const grossTotals = cols.map((q, c) => totals[c] + vatTotals[c])
  const minGross = Math.min(...grossTotals.filter((t) => t > 0))
  const minRate = rfq.items.map((_, i) => {
    const vals = cols.filter((q) => q.received).map((q) => Number(q.rates[i]) || Infinity)
    return vals.length ? Math.min(...vals) : Infinity
  })
  if (!cols.length) return <p className="cs-empty">No suppliers invited yet.</p>

  return (
    <div className="cs-wrap">
      <table className="cs-table">
        <thead>
          <tr>
            <th className="cs-itemcol">Item</th>
            {cols.map((q, c) => (
              <th key={c}>
                <div className="cs-sup">
                  <Building size={14} /> {q.supplier}
                  {mode === 'entry' && onRemoveSupplier && (
                    <button className="cs-sup-del" title={`Remove ${q.supplier}`} aria-label={`Remove ${q.supplier}`} onClick={() => onRemoveSupplier(c)}><X size={16} /></button>
                  )}
                </div>
                {mode === 'entry' && (
                  <label className="cs-received"><input type="checkbox" checked={q.received} onChange={() => onReceived(c)} /> Quote received</label>
                )}
              </th>
            ))}
            {mode === 'cs' && <th className="cs-awardcol">Award to</th>}
          </tr>
        </thead>
        <tbody>
          {rfq.items.map((it, i) => {
            const cand = cols.filter((q) => q.received && Number(q.rates[i]) > 0)
            return (
              <tr key={i}>
                <td className="cs-itemcol">
                  <strong>{it.item}{it.prNo ? <span className="pr-badge sm">{it.prNo}</span> : null}</strong>
                  <span>{it.qty} {it.uom}{it.desc ? ` · ${it.desc}` : ''}</span>
                </td>
                {cols.map((q, c) => {
                  const rate = q.rates[i]
                  const amt = (Number(rate) || 0) * it.qty
                  const vat = qv(q, 'vats', i)
                  const isMin = mode === 'cs' && q.received && Number(rate) === minRate[i] && Number(rate) > 0
                  const isAward = mode === 'cs' && award?.[i] === q.supplier
                  return (
                    <td key={c} className={`${isMin ? 'cs-min' : ''} ${isAward ? 'cs-awarded' : ''}`}>
                      {mode === 'entry' ? (
                        <div className="q-entry">
                          <input className="q-price" type="number" min="0" step="0.01" value={rate} disabled={!q.received}
                            onChange={(e) => onRate(c, i, e.target.value)} placeholder="Rate" />
                          {QFIELDS.map((f) => (
                            <input key={f.key} className="q-text" value={qv(q, f.key, i)} disabled={!q.received}
                              onChange={(e) => onField(c, i, f.key, e.target.value)} placeholder={f.placeholder} />
                          ))}
                          <div className="q-vat-row">
                            <input className="q-vat" type="number" min="0" step="0.01" value={vat} disabled={!q.received}
                              onChange={(e) => onField(c, i, 'vats', e.target.value)} placeholder="VAT %" />
                            <span className="q-incl">{Number(rate) ? money(amt + (amt * (Number(vat) || 0)) / 100) : ''}</span>
                          </div>
                          <input className="q-text" value={qv(q, 'lineRemarks', i)} disabled={!q.received}
                            onChange={(e) => onField(c, i, 'lineRemarks', e.target.value)} placeholder="Remarks" />
                        </div>
                      ) : (
                        <div className="cs-cell">
                          <span className="cs-rate">{Number(rate) ? money(rate) : '—'}</span>
                          <span className="cs-amt">{Number(rate) ? money(amt) : ''}</span>
                          {Number(rate) && Number(vat) ? <span className="cs-vat">+{vat}% VAT</span> : null}
                          {qv(q, 'brands', i) && <span className="cs-spec">{qv(q, 'brands', i)}</span>}
                          {qv(q, 'specs', i) && <span className="cs-spec">{qv(q, 'specs', i)}</span>}
                          {qv(q, 'lineRemarks', i) && <span className="cs-spec rmk">“{qv(q, 'lineRemarks', i)}”</span>}
                          {isAward && <span className="cs-award-tick"><CheckCircle2 size={13} /></span>}
                        </div>
                      )}
                    </td>
                  )
                })}
                {mode === 'cs' && (
                  <td className="cs-awardcol">
                    <select value={award?.[i] || ''} onChange={(e) => onAward(i, e.target.value)} className={award?.[i] ? 'has' : ''}>
                      <option value="">— select —</option>
                      {cand.map((q) => <option key={q.supplier} value={q.supplier}>{q.supplier}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="cs-meta-row">
            <td className="cs-itemcol">Delivery (days)</td>
            {cols.map((q, c) => (
              <td key={c}>{mode === 'entry'
                ? <input type="number" min="0" value={q.deliveryDays} disabled={!q.received} onChange={(e) => onMeta(c, 'deliveryDays', e.target.value)} placeholder="0" />
                : (q.deliveryDays || '—')}</td>
            ))}
            {mode === 'cs' && <td />}
          </tr>
          <tr className="cs-meta-row">
            <td className="cs-itemcol">Validity (days)</td>
            {cols.map((q, c) => (
              <td key={c}>{mode === 'entry'
                ? <input type="number" min="0" value={q.validityDays} disabled={!q.received} onChange={(e) => onMeta(c, 'validityDays', e.target.value)} placeholder="0" />
                : (q.validityDays || '—')}</td>
            ))}
            {mode === 'cs' && <td />}
          </tr>
          <tr className="cs-meta-row">
            <td className="cs-itemcol">Subtotal (excl. VAT)</td>
            {cols.map((q, c) => <td key={c}>{totals[c] > 0 ? money(totals[c]) : '—'}</td>)}
            {mode === 'cs' && <td />}
          </tr>
          <tr className="cs-meta-row">
            <td className="cs-itemcol">VAT</td>
            {cols.map((q, c) => <td key={c}>{vatTotals[c] > 0 ? money(vatTotals[c]) : '—'}</td>)}
            {mode === 'cs' && <td />}
          </tr>
          <tr className="cs-total-row">
            <td className="cs-itemcol">Total incl. VAT</td>
            {cols.map((q, c) => (
              <td key={c} className={mode === 'cs' && grossTotals[c] === minGross && grossTotals[c] > 0 ? 'cs-min-total' : ''}>
                {grossTotals[c] > 0 ? money(grossTotals[c]) : '—'}
              </td>
            ))}
            {mode === 'cs' && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* ----------------- Comparative Statement board (reference layout) ----------------- */
function CsPct({ pct }) {
  if (pct === null) return null
  const up = pct > 0
  const flat = Math.abs(pct) < 0.05
  return <span className={`csb-pct ${flat ? 'flat' : up ? 'up' : 'down'}`}>{flat ? '■' : up ? '▲' : '▼'} {up && !flat ? '+' : ''}{pct.toFixed(1)}%</span>
}

function CsTable({ rfq, onPick }) {
  const cols = rfq.quotes.filter((q) => q.received)
  const cur = rfq.currency || 'BDT'
  // Award checkboxes are live only before the CS is verified/approved.
  const editable = rfq.csStatus === 'None' || rfq.csStatus === 'Rejected' || rfq.csStatus === 'Submitted'
  const minRate = rfq.items.map((_, i) => itemBestRate(rfq, i))
  if (!cols.length) return <p className="cs-empty">No received quotations to compare yet.</p>

  return (
    <div className="csb-wrap">
      <table className="csb">
        <thead>
          <tr className="csb-grouphead">
            <th className="csb-pr">PR NO</th>
            <th className="csb-item">ITEM / DESCRIPTION</th>
            <th className="csb-num">REQ. QTY</th>
            <th>UOM</th>
            <th className="csb-last">LAST PRICE</th>
            <th>CUR.</th>
            {cols.map((q, c) => (
              <th key={c} colSpan={3} className="csb-sup">
                <div className="csb-sup-name">{q.supplier}</div>
                <div className="csb-sup-code">{supplierCode(q.supplier)}</div>
              </th>
            ))}
            <th className="csb-appr" colSpan={2}>APPROVED</th>
          </tr>
          <tr className="csb-subhead">
            <th colSpan={6} />
            {cols.map((q, c) => (
              <Fragment key={c}>
                <th>DESCRIPTION</th><th className="csb-num">RATE</th><th className="csb-num">TOTAL ✓</th>
              </Fragment>
            ))}
            <th className="csb-num">PRICE</th><th className="csb-num">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {rfq.items.map((it, i) => {
            const awardSup = rfq.award?.[i] || ''
            const apprRate = awardSup ? (Number(rfq.quotes.find((q) => q.supplier === awardSup)?.rates[i]) || 0) : 0
            return (
              <tr key={i}>
                <td className="csb-pr">{it.prNo || '—'}</td>
                <td className="csb-item"><strong>{it.item}</strong><span>{it.desc || it.item}</span></td>
                <td className="csb-num">{it.qty}</td>
                <td>{it.uom}</td>
                <td className="csb-last">
                  {Number(it.lastPrice) ? <><strong>{num(it.lastPrice)}</strong><span>{it.lastPriceDate}</span></> : '—'}
                </td>
                <td className="csb-cur">{cur}</td>
                {cols.map((q, c) => {
                  const rate = Number(q.rates[i]) || 0
                  const total = rate * it.qty
                  const isMin = rate > 0 && rate === minRate[i]
                  const isLast = rate > 0 && Number(it.lastPrice) > 0 && rate === Number(it.lastPrice)
                  const isAward = awardSup === q.supplier
                  const desc = [qv(q, 'brands', i), qv(q, 'specs', i)].filter(Boolean).join(' · ')
                  return (
                    <Fragment key={c}>
                      <td className="csb-desc">{desc || '—'}</td>
                      <td className={`csb-num csb-rate ${isMin ? 'is-min' : ''} ${isLast ? 'is-last' : ''}`}>
                        <strong>{rate ? num(rate) : '—'}</strong>
                        <CsPct pct={pctVsLast(rate, it.lastPrice)} />
                      </td>
                      <td className={`csb-num csb-total ${isAward ? 'is-award' : ''}`}>
                        <span>{rate ? num(total) : '—'}</span>
                        {rate ? (
                          <button type="button" className={`csb-pick ${isAward ? 'picked' : ''}`} disabled={!editable}
                            onClick={() => onPick(i, q.supplier)}
                            title={isAward ? 'Awarded — click to clear' : 'Award this item to this supplier'}>
                            {isAward ? <><CheckCircle2 size={12} /> Picked</> : 'Pick'}
                          </button>
                        ) : null}
                      </td>
                    </Fragment>
                  )
                })}
                <td className="csb-num csb-appr">{apprRate ? num(apprRate) : '—'}</td>
                <td className="csb-num csb-appr-amt">{apprRate ? num(apprRate * it.qty) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="csb-foot">
            <td colSpan={6}>Quotation Total</td>
            {cols.map((q, c) => (
              <Fragment key={c}>
                <td /><td /><td className="csb-num csb-foot-total">{num(supplierTotal(rfq, q))}</td>
              </Fragment>
            ))}
            <td /><td className="csb-num csb-foot-total">{approvedTotal(rfq) ? num(approvedTotal(rfq)) : '—'}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* ----------------- Printable documents ----------------- */
function DocHead({ title, sub }) {
  return (
    <div className="doc-top">
      <div className="doc-org">
        <div className="doc-logo"><Database size={22} /></div>
        <div><strong>{COMPANY.name}</strong><span>{COMPANY.address}</span></div>
      </div>
      <div className="doc-title"><h2>{title}</h2><div className="doc-no">{sub}</div></div>
    </div>
  )
}

function RfqDocument({ rfq }) {
  return (
    <div className="doc">
      <DocHead title="REQUEST FOR QUOTATION" sub={rfq.no} />
      <div className="doc-meta">
        <div><span>Date</span><strong>{rfq.date}</strong></div>
        <div><span>Quote By</span><strong>{rfq.requiredBy}</strong></div>
        <div><span>Department</span><strong>{rfq.dept}</strong></div>
      </div>
      <p className="doc-note">Please quote your best price, delivery and validity for the items below.</p>
      <table className="doc-table">
        <thead><tr><th>#</th><th>Item</th><th>Ref PR</th><th>Description</th><th>UOM</th><th className="num">Qty</th></tr></thead>
        <tbody>
          {rfq.items.map((it, i) => (
            <tr key={i}><td>{i + 1}</td><td>{it.item}</td><td>{it.prNo || '—'}</td><td>{it.desc || '—'}</td><td>{it.uom}</td><td className="num">{it.qty}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="doc-remarks"><span>Invited Suppliers:</span> {rfq.quotes.map((q) => q.supplier).join(', ') || '—'}</div>
      <div className="doc-printed">DataMart Enterprise Suite</div>
    </div>
  )
}

function CsDocument({ rfq }) {
  const cols = rfq.quotes.filter((q) => q.received)
  const cur = rfq.currency || 'BDT'
  const minRate = rfq.items.map((_, i) => itemBestRate(rfq, i))
  return (
    <div className="doc doc-cs">
      <DocHead title="COMPARATIVE STATEMENT" sub={rfq.no} />
      <div className="doc-meta">
        <div><span>Department</span><strong>{rfq.dept}</strong></div>
        <div><span>Date</span><strong>{rfq.date}</strong></div>
        <div><span>Currency</span><strong>{cur}</strong></div>
        <div><span>Status</span><strong>{CS_META[rfq.csStatus].label}</strong></div>
      </div>
      <div className="doc-cs-cards">
        <div><span>Best-price total</span><strong>{num(bestPriceTotal(rfq))}</strong></div>
        <div><span>Last-PO total</span><strong>{num(lastPoTotal(rfq))}</strong></div>
        <div><span>Approved total</span><strong>{num(approvedTotal(rfq))}</strong></div>
        <div><span>Potential saving</span><strong>{num(potentialSavingTotal(rfq))}</strong></div>
      </div>
      <table className="doc-table doc-cs-table">
        <thead>
          <tr>
            <th>PR No</th><th>Item / Description</th><th className="num">Req. Qty</th><th>UOM</th><th className="num">Last Price</th><th>Cur.</th>
            {cols.map((q, c) => <th key={c} className="num doc-sup-start" colSpan={3}>{q.supplier}<div className="doc-supcode">{supplierCode(q.supplier)}</div></th>)}
            <th className="num doc-sup-start" colSpan={2}>Approved</th>
          </tr>
          <tr className="doc-cs-sub">
            <th colSpan={6} />
            {cols.map((q, c) => <Fragment key={c}><th className="doc-sup-start">Description</th><th className="num">Rate</th><th className="num">Total</th></Fragment>)}
            <th className="num doc-sup-start">Price</th><th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rfq.items.map((it, i) => {
            const awardSup = rfq.award?.[i] || ''
            const apprRate = awardSup ? (Number(rfq.quotes.find((q) => q.supplier === awardSup)?.rates[i]) || 0) : 0
            return (
              <tr key={i}>
                <td>{it.prNo || '—'}</td>
                <td>{it.item}{it.desc ? <div className="doc-spec">{it.desc}</div> : null}</td>
                <td className="num">{it.qty}</td><td>{it.uom}</td>
                <td className="num">{Number(it.lastPrice) ? num(it.lastPrice) : '—'}{it.lastPriceDate ? <div className="doc-spec">{it.lastPriceDate}</div> : null}</td>
                <td>{cur}</td>
                {cols.map((q, c) => {
                  const rate = Number(q.rates[i]) || 0
                  const isMin = rate > 0 && rate === minRate[i]
                  const isAward = awardSup === q.supplier
                  const spec = [qv(q, 'brands', i), qv(q, 'specs', i)].filter(Boolean).join(' · ')
                  const pct = pctVsLast(rate, it.lastPrice)
                  return (
                    <Fragment key={c}>
                      <td className="doc-desc doc-sup-start">{spec || '—'}</td>
                      <td className={`num ${isMin ? 'doc-min' : ''}`}>{rate ? num(rate) : '—'}
                        {pct !== null ? <div className={`doc-pct ${pct > 0 ? 'up' : 'down'}`}>{pct > 0 ? '▲ +' : '▼ '}{pct.toFixed(1)}%</div> : null}</td>
                      <td className={`num ${isAward ? 'doc-award' : ''}`}>{rate ? num(rate * it.qty) : '—'}{isAward ? ' ✓' : ''}</td>
                    </Fragment>
                  )
                })}
                <td className="num doc-sup-start">{apprRate ? num(apprRate) : '—'}</td>
                <td className="num strong">{apprRate ? num(apprRate * it.qty) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className="strong">Quotation Total</td>
            {cols.map((q, c) => <Fragment key={c}><td className="doc-sup-start" /><td /><td className="num strong">{num(supplierTotal(rfq, q))}</td></Fragment>)}
            <td className="doc-sup-start" /><td className="num strong">{approvedTotal(rfq) ? num(approvedTotal(rfq)) : '—'}</td>
          </tr>
        </tfoot>
      </table>
      <div className="doc-cs-rem">
        <div><span>Remarks (Creator)</span><p>{rfq.csCreatorRemark || '—'}</p><em>{rfq.createdBy || '—'}{rfq.createdOn ? ` · ${rfq.createdOn}` : ''}</em></div>
        <div><span>Remarks (Verifier)</span><p>{rfq.csVerifierRemark || '—'}</p><em>{rfq.verifiedBy || '—'}{rfq.verifiedOn ? ` · ${rfq.verifiedOn}` : ''}</em></div>
        <div><span>Remarks (Approver)</span><p>{rfq.csApproverRemark || '—'}</p><em>{rfq.approvedBy || '—'}{rfq.approvedOn ? ` · ${rfq.approvedOn}` : ''}</em></div>
      </div>
      <div className="doc-sign">
        <div><span className="sig-line" />Prepared By</div>
        <div><span className="sig-line" />Verified By</div>
        <div><span className="sig-line" />Approved By</div>
      </div>
      <div className="doc-printed">DataMart Enterprise Suite</div>
    </div>
  )
}

export function PoDocument({ po }) {
  return (
    <div className="doc">
      <DocHead title="PURCHASE ORDER" sub={po.no} />
      <div className="doc-meta">
        <div><span>Supplier</span><strong>{po.supplier}</strong></div>
        <div><span>Against RFQ</span><strong>{po.rfqNo}</strong></div>
        <div><span>Date</span><strong>{po.date}</strong></div>
        <div><span>Department</span><strong>{po.dept}</strong></div>
        <div><span>Currency</span><strong>{po.currency}</strong></div>
        <div><span>Supplier Code</span><strong>{po.supplierCode}</strong></div>
      </div>
      <p className="doc-note">Please supply the following items as per our approved comparative statement and agreed terms.</p>
      <table className="doc-table">
        <thead>
          <tr><th>#</th><th>Item / Description</th><th>Ref PR</th><th className="num">Qty</th><th>UOM</th><th className="num">Rate</th><th className="num">VAT %</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {po.lines.map((l, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{l.item}{[l.brand, l.spec, l.desc].filter(Boolean).length ? <div className="doc-spec">{[l.brand, l.spec, l.desc].filter(Boolean).join(' · ')}</div> : null}</td>
              <td>{l.prNo || '—'}</td>
              <td className="num">{l.qty}</td><td>{l.uom}</td>
              <td className="num">{num(l.rate)}</td><td className="num">{l.vat ? l.vat + '%' : '—'}</td>
              <td className="num">{num(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={7} className="num strong">Subtotal</td><td className="num strong">{num(po.subtotal)}</td></tr>
          <tr><td colSpan={7} className="num">VAT</td><td className="num">{num(po.vatTotal)}</td></tr>
          <tr><td colSpan={7} className="num strong">Total ({po.currency})</td><td className="num strong">{num(po.total)}</td></tr>
        </tfoot>
      </table>
      <div className="doc-sign">
        <div><span className="sig-line" />Prepared By</div>
        <div><span className="sig-line" />Authorised By</div>
        <div><span className="sig-line" />Supplier Acceptance</div>
      </div>
      <div className="doc-printed">DataMart Enterprise Suite</div>
    </div>
  )
}

function RfqListDocument({ items, filterLabel }) {
  return (
    <div className="doc">
      <DocHead title="RFQ REGISTER" sub={`Filter: ${filterLabel}`} />
      <table className="doc-table">
        <thead><tr><th>RFQ No.</th><th>Date</th><th>Department</th><th>Quote By</th><th className="num">Items</th><th className="num">Suppliers</th><th>Status</th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.no}><td>{r.no}</td><td>{r.date}</td><td>{r.dept}</td><td>{r.requiredBy}</td><td className="num">{r.items.length}</td><td className="num">{r.quotes.length}</td><td>{r.status}</td></tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={4} className="strong">{items.length} RFQ(s)</td><td colSpan={3}></td></tr></tfoot>
      </table>
      <div className="doc-printed">DataMart Enterprise Suite</div>
    </div>
  )
}

export default function Rfq({ onHome, onBack, user }) {
  const ME = user?.email || 'user@datamart.com'
  const [rfqs, setRfqs] = useState(SEED)
  useEffect(() => { rfqStore.set(rfqs) }, [rfqs]) // mirror live RFQs for the PR Status report
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll) // shared with the PO Register
  const [poPrint, setPoPrint] = useState(null) // PO currently in print preview
  const [mode, setMode] = useState('list')
  const [selectedNo, setSelectedNo] = useState(null)
  const [printMode, setPrintMode] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [supDel, setSupDel] = useState(null) // { idx, name } pending supplier removal
  const [decisionNote, setDecisionNote] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // form
  const [header, setHeader] = useState({ date: TODAY, dept: '', requiredBy: '' })
  const [items, setItems] = useState([newItem()])
  const [supSel, setSupSel] = useState([])
  const [customSups, setCustomSups] = useState([]) // ad-hoc suppliers added on the form (persist as chips even when unticked)
  const [supNewName, setSupNewName] = useState('') // ad-hoc supplier added on the form
  const [remarks, setRemarks] = useState('')
  const [touched, setTouched] = useState(false)
  const [editingNo, setEditingNo] = useState(null) // null = creating new
  // PR item picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSel, setPickerSel] = useState([])
  const [pickerQuery, setPickerQuery] = useState('')
  // Add-supplier (to an existing RFQ)
  const [supAddOpen, setSupAddOpen] = useState(false)
  const [supAddSel, setSupAddSel] = useState([])
  const [supAddNew, setSupAddNew] = useState('')
  const [supAddQuery, setSupAddQuery] = useState('')

  const current = rfqs.find((r) => r.no === selectedNo) || null
  const nextNo = useMemo(() => {
    const max = rfqs.reduce((m, r) => Math.max(m, parseInt(r.no.replace('RFQ-', ''), 10) || 0), 0)
    return `RFQ-${String(max + 1).padStart(4, '0')}`
  }, [rfqs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rfqs.filter((r) =>
      (statusFilter === 'All' || r.status === statusFilter) &&
      (!q || (r.no + r.dept).toLowerCase().includes(q))
    )
  }, [rfqs, query, statusFilter])

  const counts = useMemo(() => ({
    total: rfqs.length,
    sent: rfqs.filter((r) => r.status === 'Sent').length,
    quoted: rfqs.filter((r) => r.status === 'Quoted').length,
    closed: rfqs.filter((r) => r.status === 'Closed').length,
  }), [rfqs])

  // ---- updates ----
  const updateRfq = (no, updater) => setRfqs((p) => p.map((r) => (r.no === no ? updater(r) : r)))
  const setRate = (no, c, i, val) => updateRfq(no, (r) => ({ ...r, quotes: r.quotes.map((q, qi) => (qi === c ? { ...q, rates: q.rates.map((x, xi) => (xi === i ? val : x)) } : q)) }))
  const setMeta = (no, c, field, val) => updateRfq(no, (r) => ({ ...r, quotes: r.quotes.map((q, qi) => (qi === c ? { ...q, [field]: val } : q)) }))
  // Per-line supplier field (brand/origin, specification, VAT%, remarks) — stored as a parallel array sized to the items.
  const setQuoteField = (no, c, i, key, val) => updateRfq(no, (r) => ({
    ...r,
    quotes: r.quotes.map((q, qi) => {
      if (qi !== c) return q
      const arr = r.items.map((_, xi) => (q[key]?.[xi] ?? ''))
      arr[i] = val
      return { ...q, [key]: arr }
    }),
  }))
  const toggleReceived = (no, c) => updateRfq(no, (r) => {
    const quotes = r.quotes.map((q, qi) => (qi === c ? { ...q, received: !q.received } : q))
    const status = quotes.some((q) => q.received) ? (r.status === 'Closed' ? 'Closed' : 'Quoted') : r.status
    return { ...r, quotes, status }
  })
  const setAward = (no, i, sup) => updateRfq(no, (r) => {
    const base = r.award && r.award.length === r.items.length ? [...r.award] : r.items.map(() => '')
    base[i] = sup
    return { ...r, award: base }
  })
  // Award via the per-supplier checkbox: ticking awards that item to the supplier; ticking it again clears it.
  const toggleAwardPick = (no, i, sup) => updateRfq(no, (r) => {
    const base = r.award && r.award.length === r.items.length ? [...r.award] : r.items.map(() => '')
    base[i] = base[i] === sup ? '' : sup
    return { ...r, award: base }
  })
  // Invite more suppliers to an existing RFQ (new quote columns).
  const addSuppliers = (no, names) => updateRfq(no, (r) => ({
    ...r,
    quotes: [...r.quotes, ...names.map((s) => emptyQuote(s, r.items.length))],
  }))
  const removeSupplier = (no, idx) => updateRfq(no, (r) => {
    const removed = r.quotes[idx]?.supplier
    const quotes = r.quotes.filter((_, i) => i !== idx)
    const award = (r.award || []).map((a) => (a === removed ? '' : a))
    const status = quotes.some((q) => q.received) ? (r.status === 'Closed' ? 'Closed' : 'Quoted') : (r.status === 'Quoted' ? 'Sent' : r.status)
    return { ...r, quotes, award, status }
  })
  const openSupAdd = () => { setSupAddSel([]); setSupAddNew(''); setSupAddQuery(''); setSupAddOpen(true) }
  const closeSupAdd = () => { setSupAddOpen(false); setSupAddSel([]); setSupAddNew(''); setSupAddQuery('') }
  const toggleSupAdd = (name) => setSupAddSel((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))
  const confirmSupAdd = () => {
    if (!current) return
    const names = [...supAddSel, ...(supAddNew.trim() ? [supAddNew.trim()] : [])]
      .filter((s, i, arr) => s && arr.indexOf(s) === i && !current.quotes.some((q) => q.supplier === s))
    if (names.length) addSuppliers(current.no, names)
    closeSupAdd()
  }

  const openView = (no) => { setSelectedNo(no); setMode('view') }
  const openCs = (no) => {
    const r = rfqs.find((x) => x.no === no)
    if (r && (!r.award || r.award.length !== r.items.length || r.award.every((a) => !a))) {
      updateRfq(no, (x) => ({ ...x, award: bestAward(x) }))
    }
    setSelectedNo(no); setMode('cs')
  }
  // Submit recorded quotations: freshly pick the lowest price per item as the award,
  // then open the Comparative Statement (where the awarded supplier can still be changed).
  // A locked (verified/approved) CS is opened read-only without re-picking.
  const submitQuotations = (no) => {
    const r = rfqs.find((x) => x.no === no)
    if (!r) return
    if (r.csStatus !== 'Verified' && r.csStatus !== 'Approved') {
      updateRfq(no, (x) => ({ ...x, award: bestAward(x) }))
    }
    setSelectedNo(no); setMode('cs')
  }

  // form actions
  const addItem = () => setItems((l) => [...l, newItem()])
  const removeItem = (id) => setItems((l) => (l.length > 1 ? l.filter((x) => x.id !== id) : l))
  const updateItem = (id, f, v) => setItems((l) => l.map((x) => (x.id === id ? { ...x, [f]: v } : x)))
  const toggleSup = (name) => setSupSel((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))
  // Invite a supplier that isn't in the master list — it becomes a persistent chip and is selected.
  const addNewSupplier = () => {
    const name = supNewName.trim()
    if (!name) { setSupNewName(''); return }
    const known = [...SUPPLIERS, ...customSups].find((x) => x.toLowerCase() === name.toLowerCase())
    const final = known || name
    if (!known) setCustomSups((c) => [...c, name])
    setSupSel((s) => (s.includes(final) ? s : [...s, final]))
    setSupNewName('')
  }
  // Remove an ad-hoc supplier chip entirely (master suppliers are kept — just untick them).
  const removeCustomSupplier = (name) => {
    setCustomSups((c) => c.filter((x) => x !== name))
    setSupSel((s) => s.filter((x) => x !== name))
  }
  const resetForm = () => { setHeader({ date: TODAY, dept: '', requiredBy: '' }); setItems([newItem()]); setSupSel([]); setCustomSups([]); setSupNewName(''); setRemarks(''); setTouched(false); setEditingNo(null) }
  const openForm = () => { resetForm(); setMode('form') }
  const openEditForm = (rfq) => {
    setEditingNo(rfq.no)
    setHeader({ date: rfq.date, dept: rfq.dept, requiredBy: rfq.requiredBy })
    setItems(rfq.items.map((it) => ({ ...newItem(), item: it.item, desc: it.desc, uom: it.uom, qty: String(it.qty), prNo: it.prNo || '' })))
    setSupSel(rfq.quotes.map((q) => q.supplier))
    setCustomSups(rfq.quotes.map((q) => q.supplier).filter((s) => !SUPPLIERS.includes(s)))
    setSupNewName('')
    setRemarks(rfq.remarks || '')
    setTouched(false)
    setMode('form')
  }
  const closeForm = () => { resetForm(); setMode('list') }
  const formNo = editingNo || nextNo

  // PR picker
  const togglePick = (key) => setPickerSel((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]))
  const openPicker = () => { setPickerSel([]); setPickerQuery(''); setPickerOpen(true) }
  const closePicker = () => { setPickerOpen(false); setPickerSel([]); setPickerQuery('') }
  const confirmPicker = () => {
    const picks = pickerSel.map((key) => {
      const [no, idx] = key.split('#')
      const pr = prSource.find((p) => p.no === no)
      const it = pr.items[Number(idx)]
      return { ...newItem(), item: it.item, desc: it.desc, uom: it.uom, qty: String(it.qty), prNo: pr.no }
    })
    setItems((prev) => {
      const base = prev.filter((l) => l.item.trim() || l.qty) // drop the blank placeholder
      const existing = new Set(base.map((l) => `${l.prNo}|${l.item}`))
      const fresh = picks.filter((p) => !existing.has(`${p.prNo}|${p.item}`))
      return [...base, ...fresh]
    })
    closePicker()
  }

  const validItems = items.filter((l) => l.item.trim() && Number(l.qty) > 0)
  const canSend = header.dept && header.requiredBy && validItems.length > 0 && supSel.length > 0
  const itemKey = (it) => `${it.item}|${it.desc}|${it.uom}`
  const commitRfq = (status) => {
    setTouched(true)
    if (status === 'Sent' && !canSend) return
    const newItems = validItems.map((l) => ({ item: l.item, desc: l.desc, uom: l.uom, qty: Number(l.qty) || 0, prNo: l.prNo || '', lastPrice: Number(l.lastPrice) || 0, lastPriceDate: l.lastPriceDate || '' }))

    if (editingNo) {
      updateRfq(editingNo, (r) => {
        // Rebuild quotes for the chosen suppliers, preserving entered data per item.
        const quotes = supSel.map((s) => {
          const ex = r.quotes.find((q) => q.supplier === s)
          if (!ex) return emptyQuote(s, newItems.length)
          // Preserve each parallel array by matching the (possibly reordered) item.
          const remap = (key) => newItems.map((ni) => {
            const oi = r.items.findIndex((it) => itemKey(it) === itemKey(ni))
            return oi >= 0 ? (ex[key]?.[oi] ?? '') : ''
          })
          return { ...ex, rates: remap('rates'), brands: remap('brands'), specs: remap('specs'), vats: remap('vats'), lineRemarks: remap('lineRemarks') }
        })
        const anyRecv = quotes.some((q) => q.received)
        const finalStatus = anyRecv ? 'Quoted' : (status === 'Draft' ? 'Draft' : 'Sent')
        // Editing changes the basis, so any existing comparative statement is reset.
        return { ...r, ...header, items: newItems, remarks, quotes, status: finalStatus, ...BLANK_CS }
      })
      closeForm(); return
    }

    const record = {
      ...header, no: nextNo, status, remarks, currency: 'BDT', ...BLANK_CS,
      items: newItems,
      quotes: supSel.map((s) => emptyQuote(s, newItems.length)),
    }
    setRfqs((p) => [record, ...p]); closeForm()
  }

  // --- CS 3-stage workflow: Creator submits → Verifier verifies → Approver approves ---
  const csStamp = () => new Date().toISOString().slice(0, 10)
  const setCsRemark = (no, field, val) => updateRfq(no, (r) => ({ ...r, [field]: val }))
  const submitForVerification = (no) => updateRfq(no, (r) => ({
    ...r, csStatus: 'Submitted', createdBy: r.createdBy || ME, createdOn: r.createdOn || csStamp(),
  }))
  const verifyCs = (no) => updateRfq(no, (r) => ({ ...r, csStatus: 'Verified', verifiedBy: ME, verifiedOn: csStamp() }))
  const approveCs = (no) => {
    updateRfq(no, (r) => ({ ...r, csStatus: 'Approved', approvedBy: ME, approvedOn: csStamp(), status: 'Closed' }))
    // Auto-create supplier-wise Purchase Orders from the approved split award.
    const rfq = rfqs.find((r) => r.no === no)
    if (!rfq) return
    poStore.replaceForRfq(no, (startSeq) => buildPosFromRfq(rfq, startSeq))
  }
  const rejectCs = (no, stage) => updateRfq(no, (r) => ({
    ...r, csStatus: 'Rejected',
    ...(stage === 'verify' ? { verifiedBy: ME, verifiedOn: csStamp() } : { approvedBy: ME, approvedOn: csStamp() }),
  }))
  const reopenCs = (no) => updateRfq(no, (r) => ({
    ...r, csStatus: 'Submitted', status: r.status === 'Closed' ? 'Quoted' : r.status,
    verifiedBy: '', verifiedOn: '', approvedBy: '', approvedOn: '',
  }))

  const filterLabel = `${statusFilter}${query ? ` · "${query}"` : ''}`

  // ---- overlays ----
  const printOverlay = printMode && (
    <div className="print-overlay">
      <div className="print-bar no-print">
        <span><Printer size={16} /> Print Preview — {printMode === 'list' ? 'RFQ Register' : `${current?.no} ${printMode === 'cs' ? 'CS' : 'RFQ'}`}</span>
        <div className="print-bar-actions">
          <button className="btn btn-ghost" onClick={() => setPrintMode(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>
      <div className="print-scroll">
        <div className={`print-sheet ${printMode === 'cs' ? 'print-sheet-cs' : ''}`}>
          {printMode === 'rfq' && current && <RfqDocument rfq={current} />}
          {printMode === 'cs' && current && <CsDocument rfq={current} />}
          {printMode === 'list' && <RfqListDocument items={filtered} filterLabel={filterLabel} />}
        </div>
      </div>
    </div>
  )

  const poPrintOverlay = poPrint && (
    <div className="print-overlay">
      <div className="print-bar no-print">
        <span><Printer size={16} /> Print Preview — Purchase Order {poPrint.no} · {poPrint.supplier}</span>
        <div className="print-bar-actions">
          <button className="btn btn-ghost" onClick={() => setPoPrint(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>
      <div className="print-scroll">
        <div className="print-sheet"><PoDocument po={poPrint} /></div>
      </div>
    </div>
  )

  const isApprove = confirm?.action === 'Approved'
  const confirmModal = confirm && (
    <div className="modal-overlay" onClick={() => setConfirm(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon tone-${isApprove ? 'green' : 'rose'}`}>{isApprove ? <CheckCircle2 size={26} /> : <XCircle size={26} />}</div>
        <h3>{isApprove ? 'Approve' : 'Reject'} CS — {confirm.no}?</h3>
        <p>{isApprove ? 'This approves the comparative statement (split award) and closes the RFQ for PO.' : 'This rejects the comparative statement.'}</p>
        <label className="modal-field"><span>{isApprove ? 'Note (optional)' : 'Reason (optional)'}</span>
          <textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={3} autoFocus placeholder="Add a remark…" />
        </label>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
          <button className={isApprove ? 'btn btn-approve' : 'btn btn-reject solid'} onClick={applyDecision}>
            {isApprove ? <><CheckCircle2 size={16} /> Approve</> : <><XCircle size={16} /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  )

  // Remove-supplier confirmation (Record Quotations)
  const confirmRemoveSupplier = () => {
    if (!current || !supDel) return
    removeSupplier(current.no, supDel.idx)
    setSupDel(null)
  }
  const supDelModal = supDel && current && (
    <div className="modal-overlay" onClick={() => setSupDel(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-rose"><Trash2 size={24} /></div>
        <h3>Remove {supDel.name}?</h3>
        <p>This removes <strong>{supDel.name}</strong> and any quotes recorded for them from {current.no}. If they were awarded an item, that award is cleared. This can’t be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setSupDel(null)}>Cancel</button>
          <button className="btn btn-reject solid" onClick={confirmRemoveSupplier} autoFocus><Trash2 size={16} /> Remove supplier</button>
        </div>
      </div>
    </div>
  )

  // PR picker modal
  const pq = pickerQuery.trim().toLowerCase()
  const pickerGroups = prSource
    .map((pr) => {
      const prMatch = `${pr.no} ${pr.dept}`.toLowerCase().includes(pq)
      const rows = pr.items
        .map((it, idx) => ({ it, idx }))
        .filter(({ it }) => !pq || prMatch || `${it.item} ${it.desc}`.toLowerCase().includes(pq))
      return { pr, rows }
    })
    .filter((g) => g.rows.length > 0)
  const pickerModal = pickerOpen && (
    <div className="modal-overlay" onClick={closePicker}>
      <div className="modal pr-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><ListChecks size={24} /></div>
        <h3>Add Items from Purchase Requisitions</h3>
        <p>Select line items from one or more approved PRs to add to this RFQ.</p>
        <div className="pr-search">
          <Search size={16} />
          <input value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Search by PR no., department or item…" autoFocus />
          {pickerQuery && <button className="pr-search-clear" onClick={() => setPickerQuery('')}><X size={15} /></button>}
        </div>
        <div className="pr-picker-list">
          {pickerGroups.map(({ pr, rows }) => (
            <div className="pr-group" key={pr.no}>
              <div className="pr-group-head"><strong>{pr.no}</strong><span>{pr.dept} · required by {pr.requiredBy}</span></div>
              {rows.map(({ it, idx }) => {
                const key = `${pr.no}#${idx}`
                return (
                  <label className={`pr-pick-row ${pickerSel.includes(key) ? 'on' : ''}`} key={key}>
                    <input type="checkbox" checked={pickerSel.includes(key)} onChange={() => togglePick(key)} />
                    <span className="pp-item">{it.item}</span>
                    <span className="pp-meta">{it.qty} {it.uom}{it.desc ? ` · ${it.desc}` : ''}</span>
                  </label>
                )
              })}
            </div>
          ))}
          {pickerGroups.length === 0 && <p className="pr-pick-empty">No PRs or items match “{pickerQuery}”.</p>}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closePicker}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmPicker} disabled={!pickerSel.length}>
            <Plus size={16} /> Add {pickerSel.length || ''} item{pickerSel.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )

  // Add-supplier modal (used in RFQ view)
  const supRemaining = current ? SUPPLIERS.filter((s) => !current.quotes.some((q) => q.supplier === s)) : []
  const sq = supAddQuery.trim().toLowerCase()
  const supFiltered = supRemaining.filter((s) => !sq || s.toLowerCase().includes(sq))
  const supAddModal = supAddOpen && current && (
    <div className="modal-overlay" onClick={closeSupAdd}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><Building size={24} /></div>
        <h3>Add Supplier to {current.no}</h3>
        <p>Invite more suppliers to quote on this RFQ.</p>
        {supRemaining.length > 0 ? (
          <>
            <div className="pr-search">
              <Search size={16} />
              <input value={supAddQuery} onChange={(e) => setSupAddQuery(e.target.value)} placeholder="Search suppliers…" autoFocus />
              {supAddQuery && <button className="pr-search-clear" onClick={() => setSupAddQuery('')}><X size={15} /></button>}
            </div>
            <div className="sup-add-list">
              {supFiltered.map((s) => (
                <label key={s} className={`sup-add-row ${supAddSel.includes(s) ? 'on' : ''}`}>
                  <input type="checkbox" checked={supAddSel.includes(s)} onChange={() => toggleSupAdd(s)} />
                  <Building size={15} /> {s}
                </label>
              ))}
              {supFiltered.length === 0 && <p className="pr-pick-empty">No suppliers match “{supAddQuery}”.</p>}
            </div>
          </>
        ) : (
          <p className="sup-add-none">All master suppliers are already invited. Add a new one below.</p>
        )}
        <label className="modal-field"><span>Or add a new supplier</span>
          <input value={supAddNew} onChange={(e) => setSupAddNew(e.target.value)} placeholder="New supplier name…" />
        </label>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeSupAdd}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmSupAdd} disabled={!supAddSel.length && !supAddNew.trim()}><Plus size={16} /> Add</button>
        </div>
      </div>
    </div>
  )

  // Add-supplier modal for the NEW/EDIT form — same UX as the view modal, commits to supSel/customSups.
  const formSupRemaining = SUPPLIERS.filter((s) => !supSel.includes(s))
  const formSupFiltered = formSupRemaining.filter((s) => !sq || s.toLowerCase().includes(sq))
  const confirmFormSupAdd = () => {
    const raw = [...supAddSel, ...(supAddNew.trim() ? [supAddNew.trim()] : [])]
    const existing = [...SUPPLIERS, ...customSups]
    const newCustom = []
    const toSelect = []
    raw.forEach((name) => {
      const match = existing.concat(newCustom).find((x) => x.toLowerCase() === name.toLowerCase())
      const final = match || name
      if (!match) newCustom.push(final)
      if (!toSelect.includes(final)) toSelect.push(final)
    })
    if (newCustom.length) setCustomSups((c) => [...c, ...newCustom.filter((n) => !c.includes(n))])
    setSupSel((s) => [...s, ...toSelect.filter((n) => !s.includes(n))])
    closeSupAdd()
  }
  const formSupAddModal = mode === 'form' && supAddOpen && (
    <div className="modal-overlay" onClick={closeSupAdd}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><Building size={24} /></div>
        <h3>Add Supplier to {formNo}</h3>
        <p>Invite suppliers to quote on this RFQ.</p>
        {formSupRemaining.length > 0 ? (
          <>
            <div className="pr-search">
              <Search size={16} />
              <input value={supAddQuery} onChange={(e) => setSupAddQuery(e.target.value)} placeholder="Search suppliers…" autoFocus />
              {supAddQuery && <button className="pr-search-clear" onClick={() => setSupAddQuery('')}><X size={15} /></button>}
            </div>
            <div className="sup-add-list">
              {formSupFiltered.map((s) => (
                <label key={s} className={`sup-add-row ${supAddSel.includes(s) ? 'on' : ''}`}>
                  <input type="checkbox" checked={supAddSel.includes(s)} onChange={() => toggleSupAdd(s)} />
                  <Building size={15} /> {s}
                </label>
              ))}
              {formSupFiltered.length === 0 && <p className="pr-pick-empty">No suppliers match “{supAddQuery}”.</p>}
            </div>
          </>
        ) : (
          <p className="sup-add-none">All master suppliers are already invited. Add a new one below.</p>
        )}
        <label className="modal-field"><span>Or add a new supplier</span>
          <input value={supAddNew} onChange={(e) => setSupAddNew(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmFormSupAdd() } }} placeholder="New supplier name…" />
        </label>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={closeSupAdd}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmFormSupAdd} disabled={!supAddSel.length && !supAddNew.trim()}><Plus size={16} /> Add</button>
        </div>
      </div>
    </div>
  )

  const crumbBar = (extra) => (
    <nav className="crumbs">
      <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
      <button onClick={onBack}>Procurement</button><ChevronRight size={14} />
      {extra}
    </nav>
  )

  // ===================== CS =====================
  if (mode === 'cs' && current) {
    const cs = CS_META[current.csStatus]
    const cur = current.currency || 'BDT'
    const st = current.csStatus
    const canSubmit = receivedCount(current) > 0 && allAwarded(current)
    const best = bestPriceTotal(current)
    const lastPo = lastPoTotal(current)
    const approved = approvedTotal(current)
    const saving = potentialSavingTotal(current)
    const creatorEditable = st === 'None' || st === 'Rejected'
    const who = (email) => <div className="cs-who"><span className="cs-av">{String(email).slice(0, 2).toUpperCase()}</span>{email}</div>
    return (
      <div className="req fade-in cs-board">
        {crumbBar(<><button onClick={() => setMode('list')}>RFQ</button><ChevronRight size={14} /><button onClick={() => openView(current.no)}>{current.no}</button><ChevronRight size={14} /><span>Comparative Statement</span></>)}

        <header className="req-head cs-head">
          <div className="req-title">
            <button className="back-btn" onClick={() => openView(current.no)}><ArrowLeft size={18} /></button>
            <span className="req-mark"><Scale size={22} /></span>
            <div>
              <h1>Quotation No. <span className="pr-no">{current.no}</span> <span className={`status tone-${cs.tone}`}>{cs.label}</span></h1>
              <p>{current.items.length} item lines · {receivedCount(current)} suppliers · {prList(current).length} PR · {awardedCount(current)} awarded · currency {cur}</p>
            </div>
          </div>
          <div className="cs-cards">
            <div className="cs-card tone-green"><strong>{num(best)}</strong><span>Best-price total</span></div>
            <div className="cs-card tone-amber"><strong>{num(lastPo)}</strong><span>Last-PO total</span></div>
            <div className="cs-card tone-blue"><strong>{num(approved)}</strong><span>Approved total</span></div>
            <div className="cs-card tone-teal"><strong>{num(saving)}</strong><span>Potential saving</span></div>
          </div>
        </header>

        <div className="cs-actions-bar">
          <div className="cs-legend">
            <span className="lg lg-min">Lowest price</span>
            <span className="lg lg-award">Selected / Approved</span>
            <span className="lg lg-last">Last PO</span>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={() => openView(current.no)}>Back</button>
            <button className="btn btn-ghost" onClick={() => setPrintMode('cs')}><Printer size={16} /> Print</button>
            {(st === 'Approved' || st === 'Rejected') && (
              <button className="btn btn-ghost" onClick={() => reopenCs(current.no)}>Re-open</button>
            )}
          </div>
        </div>

        <section className="panel">
          <div className="panel-head"><h2><Scale size={16} /> Comparative Statement (CS)</h2>{!allAwarded(current) && <em className="req-em">— Pick a supplier per row to award</em>}</div>
          <div className="cs-pad">
            <CsTable rfq={current} onPick={(i, s) => toggleAwardPick(current.no, i, s)} />
            <p className="cs-hint">Lowest rate per item is highlighted green; press <strong>Pick</strong> in a supplier’s <strong>TOTAL</strong> column to award that item (press again to clear). % shown on each rate is vs. the item’s last purchase price.</p>
          </div>
        </section>

        <section className="panel">
          <div className="cs-remarks">
            <div className="cs-rem">
              <div className="cs-rem-h">Remarks (Creator)</div>
              <textarea value={current.csCreatorRemark} disabled={!creatorEditable}
                onChange={(e) => setCsRemark(current.no, 'csCreatorRemark', e.target.value)} rows={2} placeholder="Creator note…" />
              <div className="cs-rem-f">
                <div className="cs-rem-by"><span>Created By</span>{who(current.createdBy || ME)}<em>{current.createdOn || '—'}</em></div>
                {(st === 'None' || st === 'Rejected') && (
                  <button className="btn btn-primary sm" onClick={() => submitForVerification(current.no)} disabled={!canSubmit}><Send size={15} /> Submit for Verification</button>
                )}
              </div>
            </div>

            <div className="cs-rem">
              <div className="cs-rem-h">Remarks (Verifier)</div>
              <textarea value={current.csVerifierRemark} disabled={st !== 'Submitted'}
                onChange={(e) => setCsRemark(current.no, 'csVerifierRemark', e.target.value)} rows={2} placeholder={st === 'Submitted' ? 'Verifier note…' : 'Pending verification.'} />
              <div className="cs-rem-f">
                <div className="cs-rem-by"><span>Verified By</span>{current.verifiedBy ? who(current.verifiedBy) : <em>—</em>}{current.verifiedOn && <em>{current.verifiedOn}</em>}</div>
                {st === 'Submitted' && (
                  <div className="cs-rem-btns">
                    <button className="btn btn-reject sm" onClick={() => rejectCs(current.no, 'verify')}><XCircle size={15} /> Reject</button>
                    <button className="btn btn-approve sm" onClick={() => verifyCs(current.no)}><CheckCircle2 size={15} /> Verify</button>
                  </div>
                )}
              </div>
            </div>

            <div className="cs-rem">
              <div className="cs-rem-h">Remarks (Approver)</div>
              <textarea value={current.csApproverRemark} disabled={st !== 'Verified'}
                onChange={(e) => setCsRemark(current.no, 'csApproverRemark', e.target.value)} rows={2} placeholder={st === 'Verified' ? 'Approver note…' : 'Awaiting award selection.'} />
              <div className="cs-rem-f">
                <div className="cs-rem-by"><span>Approved By</span>{current.approvedBy ? who(current.approvedBy) : <em>—</em>}{current.approvedOn && <em>{current.approvedOn}</em>}</div>
                {st === 'Verified' && (
                  <div className="cs-rem-btns">
                    <button className="btn btn-reject sm" onClick={() => rejectCs(current.no, 'approve')}><XCircle size={15} /> Reject</button>
                    <button className="btn btn-approve sm" onClick={() => approveCs(current.no)}><CheckCircle2 size={15} /> Approve</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {st === 'Approved' && (() => {
          const myPos = pos.filter((p) => p.rfqNo === current.no)
          return (
            <section className="panel po-panel">
              <div className="panel-head"><h2><ClipboardList size={16} /> Purchase Orders <span className="po-auto">auto-created on approval — one per supplier</span></h2></div>
              <div className="po-pad">
                {myPos.length === 0
                  ? <p className="cs-empty">No awarded suppliers — nothing to order.</p>
                  : myPos.map((po) => (
                    <div className="po-row" key={po.no}>
                      <div className="po-id"><span className="po-no">{po.no}</span><span className="po-sup"><Building size={14} /> {po.supplier}</span></div>
                      <div className="po-meta"><span>{po.lines.length} item{po.lines.length === 1 ? '' : 's'}</span><strong>{num(po.total)} {po.currency}</strong></div>
                      <button className="btn btn-ghost sm" onClick={() => setPoPrint(po)}><Printer size={15} /> Print PO</button>
                    </div>
                  ))}
              </div>
            </section>
          )
        })()}

        <footer className="content-foot">Comparative Statement · {current.no} · DataMart Enterprise Suite</footer>
        {printOverlay}{poPrintOverlay}{confirmModal}
      </div>
    )
  }

  // ===================== VIEW =====================
  if (mode === 'view' && current) {
    const sm = RFQ_META[current.status]
    const SIcon = sm.icon
    const recd = receivedCount(current)
    // Suppliers can be invited / removed right up until the comparative statement is approved.
    const csApproved = current.csStatus === 'Approved'
    return (
      <div className="req fade-in">
        {crumbBar(<><button onClick={() => setMode('list')}>RFQ</button><ChevronRight size={14} /><span>{current.no}</span></>)}
        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={() => setMode('list')}><ArrowLeft size={18} /></button>
            <span className="req-mark"><FileSearch size={22} /></span>
            <div>
              <h1>{current.no} <span className={`status tone-${sm.tone}`}><SIcon size={13} /> {current.status}</span></h1>
              <p>{current.dept} · quote by {current.requiredBy} · {recd}/{current.quotes.length} received</p>
            </div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={() => setMode('list')}>Back</button>
            {current.status !== 'Closed' && <button className="btn btn-ghost" onClick={() => openEditForm(current)}><Pencil size={15} /> Edit</button>}
            <button className="btn btn-ghost" onClick={() => setPrintMode('rfq')}><Printer size={16} /> Print RFQ</button>
            <button className="btn btn-primary" onClick={() => openCs(current.no)} disabled={recd === 0}><Scale size={16} /> Comparative Statement</button>
          </div>
        </header>

        <section className="panel form-panel">
          <div className="panel-head"><h2><Package size={16} /> Items &amp; Invited Suppliers</h2></div>
          <div className="rfq-meta">
            <div><span>Date</span><strong>{current.date}</strong></div>
            <div><span>Quote By</span><strong>{current.requiredBy}</strong></div>
            <div><span>Department</span><strong>{current.dept}</strong></div>
            <div><span>Suppliers</span><strong>{current.quotes.length}</strong></div>
          </div>
          <div className="rfq-items">
            <table className="req-table mini">
              <thead><tr><th>#</th><th>Item</th><th>Ref PR</th><th>Description</th><th>UOM</th><th className="num">Qty</th></tr></thead>
              <tbody>
                {current.items.map((it, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{it.item}</td><td>{it.prNo ? <span className="pr-badge">{it.prNo}</span> : '—'}</td><td>{it.desc || '—'}</td><td>{it.uom}</td><td className="num">{it.qty}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2><FileSearch size={16} /> Record Quotations</h2>
            {!csApproved && <button className="btn btn-ghost sm" onClick={openSupAdd}><Plus size={15} /> Add Supplier</button>}
          </div>
          <div className="cs-pad">
            {current.quotes.length === 0
              ? <p className="cs-empty">No suppliers invited yet — use “Add Supplier” to invite one.</p>
              : <QuoteMatrix rfq={current} mode="entry"
                  onRate={(c, i, v) => setRate(current.no, c, i, v)}
                  onReceived={(c) => toggleReceived(current.no, c)}
                  onMeta={(c, f, v) => setMeta(current.no, c, f, v)}
                  onField={(c, i, key, v) => setQuoteField(current.no, c, i, key, v)}
                  onRemoveSupplier={csApproved ? undefined : (c) => setSupDel({ idx: c, name: current.quotes[c]?.supplier })} />}
            {csApproved
              ? <p className="cs-hint">Quotation approved — suppliers are locked. Re-open the Comparative Statement to change the supplier list.</p>
              : <p className="cs-hint">Tick “Quote received” for each supplier, then per item enter their <strong>rate, brand/origin, specification, VAT%</strong> and any remarks, plus delivery and validity. Use <strong>Add Supplier</strong> to invite more, or ✕ on a column to remove one.</p>}
            {!csApproved && current.quotes.length > 0 && (
              <div className="rq-submit">
                <button className="btn btn-primary" onClick={() => submitQuotations(current.no)} disabled={recd === 0}>
                  <Send size={16} /> Submit Quotations
                </button>
                <span className="rq-submit-hint">Picks the lowest price per item into the Comparative Statement — you can still change the awarded supplier there.</span>
              </div>
            )}
          </div>
        </section>

        <footer className="content-foot">Request for Quotation · {current.no} · DataMart Enterprise Suite</footer>
        {printOverlay}{confirmModal}{supAddModal}{supDelModal}
      </div>
    )
  }

  // ===================== FORM =====================
  if (mode === 'form') {
    return (
      <div className="req fade-in">
        {crumbBar(<><button onClick={closeForm}>RFQ</button><ChevronRight size={14} /><span>{editingNo ? 'Edit' : 'New'}</span></>)}
        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={closeForm}><ArrowLeft size={18} /></button>
            <span className="req-mark"><FileText size={22} /></span>
            <div><h1>{editingNo ? 'Edit RFQ' : 'New RFQ'} <span className="pr-no">{formNo}</span></h1><p>{editingNo ? 'Update items and suppliers — this resets any comparative statement.' : 'Pull items from PRs or add manually, then invite suppliers.'}</p></div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
            <button className="btn btn-ghost" onClick={() => commitRfq('Draft')}><Save size={16} /> Save Draft</button>
            <button className="btn btn-primary" onClick={() => commitRfq('Sent')} disabled={!canSend}><Send size={16} /> {editingNo ? 'Update' : 'Send to Suppliers'}</button>
          </div>
        </header>

        <section className="panel form-panel">
          <div className="panel-head"><h2>RFQ Details</h2></div>
          <div className="form-grid">
            <label className="fld"><span>RFQ No.</span><input value={formNo} readOnly className="ro" /></label>
            <label className="fld"><span>Date</span><input type="date" value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} /></label>
            <label className={`fld ${touched && !header.dept ? 'invalid' : ''}`}><span>Department *</span>
              <select value={header.dept} onChange={(e) => setHeader((h) => ({ ...h, dept: e.target.value }))}>
                <option value="">Select department…</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className={`fld ${touched && !header.requiredBy ? 'invalid' : ''}`}><span>Quote By *</span>
              <input type="date" value={header.requiredBy} onChange={(e) => setHeader((h) => ({ ...h, requiredBy: e.target.value }))} />
            </label>
          </div>
        </section>

        <section className="panel form-panel">
          <div className="panel-head">
            <h2><Package size={16} /> Items</h2>
            <div className="ph-actions">
              <button className="btn btn-ghost sm" onClick={openPicker}><ListChecks size={15} /> Add from PR</button>
              <button className="btn btn-ghost sm" onClick={addItem}><Plus size={15} /> Add Item</button>
            </div>
          </div>
          <div className="lines">
            <div className="rfq-line-head"><span>#</span><span>Ref PR</span><span>Item</span><span>Description</span><span>UOM</span><span className="num">Qty</span><span></span></div>
            {items.map((l, i) => {
              const missing = touched && !l.item.trim() && l.qty
              return (
                <div className="rfq-line-row" key={l.id}>
                  <span className="ln-no">{i + 1}</span>
                  <span className="ln-pr">{l.prNo ? <span className="pr-badge">{l.prNo}</span> : <span className="pr-dash">—</span>}</span>
                  <input className={missing ? 'invalid' : ''} value={l.item} onChange={(e) => updateItem(l.id, 'item', e.target.value)} placeholder="Item name…" />
                  <input value={l.desc} onChange={(e) => updateItem(l.id, 'desc', e.target.value)} placeholder="Optional notes" />
                  <input className="sm-in" value={l.uom} onChange={(e) => updateItem(l.id, 'uom', e.target.value)} placeholder="Unit" />
                  <input className="num-in" type="number" min="0" value={l.qty} onChange={(e) => updateItem(l.id, 'qty', e.target.value)} placeholder="0" />
                  <button className="ln-del" onClick={() => removeItem(l.id)} disabled={items.length === 1}><Trash2 size={15} /></button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel form-panel">
          <div className="panel-head">
            <h2><Building size={16} /> Invite Suppliers {touched && supSel.length === 0 && <em className="req-em">— select at least one</em>}</h2>
            <button type="button" className="btn btn-ghost sm" onClick={openSupAdd}><Plus size={15} /> Add Supplier</button>
          </div>
          <div className="sup-pick">
            {[...SUPPLIERS, ...customSups].map((s) => {
              const on = supSel.includes(s)
              const isCustom = !SUPPLIERS.includes(s)
              return (
                <span key={s} className={`sup-chip ${on ? 'on' : ''}`} role="button" tabIndex={0}
                  onClick={() => toggleSup(s)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSup(s) } }}>
                  <Building size={15} /> {s}
                  {isCustom && (
                    <button type="button" className="sup-chip-x" title="Remove supplier"
                      onClick={(e) => { e.stopPropagation(); removeCustomSupplier(s) }}><X size={13} /></button>
                  )}
                </span>
              )
            })}
          </div>
          <p className="sup-pick-hint">Click a supplier to invite or remove it, or use <strong>Add Supplier</strong> to search the list or add a new one.</p>
          <div className="rfq-remarks">
            <label><span>Remarks</span><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Terms, instructions…" /></label>
          </div>
        </section>

        {touched && !canSend && <p className="form-hint">Choose a department, quote-by date, at least one item with quantity, and one supplier.</p>}
        <footer className="content-foot">New RFQ · DataMart Enterprise Suite</footer>
        {pickerModal}{formSupAddModal}
      </div>
    )
  }

  // ===================== LIST =====================
  return (
    <div className="req fade-in">
      {crumbBar(<span>Request for Quotation</span>)}
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><FileSearch size={22} /></span>
          <div><h1>Request for Quotation</h1><p>Float enquiries, record quotes and make comparative statements.</p></div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost" onClick={() => setPrintMode('list')}><Printer size={16} /> Print List</button>
          <button className="btn btn-primary" onClick={openForm}><Plus size={17} /> New RFQ</button>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total RFQs</span><strong>{counts.total}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Awaiting Quotes</span><strong>{counts.sent}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">Quoted</span><strong>{counts.quoted}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Closed</span><strong>{counts.closed}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search RFQ no. or department…" /></div>
        <div className="req-filters">
          {['All', 'Draft', 'Sent', 'Quoted', 'Closed'].map((s) => (
            <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead><tr><th>RFQ No.</th><th>Date</th><th>Department</th><th>Quote By</th><th className="num">Items</th><th className="num">Suppliers</th><th>Quotes</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const sm = RFQ_META[r.status]; const SIcon = sm.icon
              return (
                <tr key={r.no} className="row-click" onClick={() => openView(r.no)}>
                  <td className="mono">{r.no}</td><td>{r.date}</td><td>{r.dept}</td><td>{r.requiredBy}</td>
                  <td className="num">{r.items.length}</td><td className="num">{r.quotes.length}</td>
                  <td><span className="quote-prog">{receivedCount(r)}/{r.quotes.length}</span></td>
                  <td><span className={`status tone-${sm.tone}`}><SIcon size={13} /> {r.status}</span></td>
                  <td className="row-actions">
                    <button className="row-act" title="View" onClick={(e) => { e.stopPropagation(); openView(r.no) }}><Eye size={16} /></button>
                    {r.status !== 'Closed' && <button className="row-act edit" title="Edit" onClick={(e) => { e.stopPropagation(); openEditForm(r) }}><Pencil size={15} /></button>}
                    {receivedCount(r) > 0 && <button className="row-act cs" title="Comparative Statement" onClick={(e) => { e.stopPropagation(); openCs(r.no) }}><Scale size={15} /></button>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="empty">No RFQs match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <footer className="content-foot">Request for Quotation · Procurement · DataMart Enterprise Suite</footer>
      {printOverlay}{confirmModal}
    </div>
  )
}
