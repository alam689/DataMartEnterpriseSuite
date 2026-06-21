import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Trash2, FileText, Save, Send, FileSearch,
  CheckCircle2, XCircle, FileEdit, Package, Printer, Eye, Database, Building, Scale, Award, ListChecks, X,
} from 'lucide-react'
import { prSource } from '../../../data/prSource.js'
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
const CS_META = {
  None: { tone: 'slate', label: 'Not started' },
  Pending: { tone: 'amber', label: 'Pending approval' },
  Approved: { tone: 'green', label: 'Approved' },
  Rejected: { tone: 'rose', label: 'Rejected' },
}

const SEED = [
  {
    no: 'RFQ-0042', date: '2026-06-18', dept: 'Plant Stores', requiredBy: '2026-06-30', status: 'Quoted',
    remarks: 'For the upcoming production run.', csStatus: 'None', award: [], csDecisionNote: '', csDecidedOn: '',
    items: [
      { item: 'Steel Coils', desc: 'CRC grade', uom: 'MT', qty: 12, prNo: 'PR-2025' },
      { item: 'Welding Rods', desc: '3.2mm', uom: 'Box', qty: 40, prNo: 'PR-2025' },
      { item: 'Cutting Discs', desc: '4 inch', uom: 'Pcs', qty: 100, prNo: 'PR-2025' },
    ],
    quotes: [
      { supplier: 'ACME Industrial', received: true, deliveryDays: 10, validityDays: 30, rates: [3500, 120, 14] },
      { supplier: 'Nexus Components', received: true, deliveryDays: 7, validityDays: 21, rates: [3450, 130, 13] },
      { supplier: 'Stellar Supplies', received: true, deliveryDays: 14, validityDays: 30, rates: [3600, 115, 15] },
    ],
  },
  {
    no: 'RFQ-0041', date: '2026-06-17', dept: 'IT', requiredBy: '2026-07-02', status: 'Sent',
    remarks: 'New joiner workstations.', csStatus: 'None', award: [], csDecisionNote: '', csDecidedOn: '',
    items: [
      { item: 'Workstation PC — i5', desc: '16GB / 512GB', uom: 'Unit', qty: 15, prNo: 'PR-2024' },
      { item: 'Monitor 24"', desc: 'IPS, FHD', uom: 'Unit', qty: 15, prNo: 'PR-2024' },
    ],
    quotes: [
      { supplier: 'Nexus Components', received: true, deliveryDays: 12, validityDays: 30, rates: [1900, 200] },
      { supplier: 'BluePeak Traders', received: false, deliveryDays: '', validityDays: '', rates: ['', ''] },
    ],
  },
  {
    no: 'RFQ-0040', date: '2026-06-16', dept: 'Maintenance', requiredBy: '2026-06-28', status: 'Draft',
    remarks: '', csStatus: 'None', award: [], csDecisionNote: '', csDecidedOn: '',
    items: [
      { item: 'Bearing 6204', desc: '', uom: 'Pcs', qty: 50, prNo: '' },
      { item: 'V-Belt A-50', desc: '', uom: 'Pcs', qty: 30, prNo: '' },
    ],
    quotes: [],
  },
  {
    no: 'RFQ-0039', date: '2026-06-12', dept: 'Production', requiredBy: '2026-06-22', status: 'Closed',
    remarks: 'Resin & hardener for Q2.', csStatus: 'Approved', award: ['Orbit Logistics', 'ACME Industrial'],
    csDecisionNote: 'Split awarded on lowest line price.', csDecidedOn: 'Jun 14, 2026, 10:00 AM',
    items: [
      { item: 'Resin', desc: 'Epoxy', uom: 'Kg', qty: 200, prNo: 'PR-2022' },
      { item: 'Hardener', desc: '', uom: 'Kg', qty: 80, prNo: 'PR-2022' },
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

let itemSeq = 1
const newItem = () => ({ id: itemSeq++, item: '', desc: '', uom: '', qty: '', prNo: '' })

/* ----------------- Comparison matrix (entry + CS with split award) ----------------- */
function QuoteMatrix({ rfq, mode, award, onRate, onReceived, onMeta, onAward, onRemoveSupplier }) {
  const cols = mode === 'cs' ? rfq.quotes.filter((q) => q.received) : rfq.quotes
  const totals = cols.map((q) => supplierTotal(rfq, q))
  const minTotal = Math.min(...totals.filter((t) => t > 0))
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
                    <button className="cs-sup-del" title="Remove supplier" onClick={() => onRemoveSupplier(c)}><X size={13} /></button>
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
                  const isMin = mode === 'cs' && q.received && Number(rate) === minRate[i] && Number(rate) > 0
                  const isAward = mode === 'cs' && award?.[i] === q.supplier
                  return (
                    <td key={c} className={`${isMin ? 'cs-min' : ''} ${isAward ? 'cs-awarded' : ''}`}>
                      {mode === 'entry' ? (
                        <input type="number" min="0" step="0.01" value={rate} disabled={!q.received}
                          onChange={(e) => onRate(c, i, e.target.value)} placeholder="0.00" />
                      ) : (
                        <div className="cs-cell">
                          <span className="cs-rate">{Number(rate) ? money(rate) : '—'}</span>
                          <span className="cs-amt">{Number(rate) ? money(amt) : ''}</span>
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
          <tr className="cs-total-row">
            <td className="cs-itemcol">Full Basket Total</td>
            {cols.map((q, c) => (
              <td key={c} className={mode === 'cs' && totals[c] === minTotal && totals[c] > 0 ? 'cs-min-total' : ''}>
                {totals[c] > 0 ? money(totals[c]) : '—'}
              </td>
            ))}
            {mode === 'cs' && <td />}
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
  const summary = awardSummary(rfq)
  return (
    <div className="doc">
      <DocHead title="COMPARATIVE STATEMENT" sub={rfq.no} />
      <div className="doc-meta">
        <div><span>Department</span><strong>{rfq.dept}</strong></div>
        <div><span>Date</span><strong>{rfq.date}</strong></div>
        <div><span>Status</span><strong>{CS_META[rfq.csStatus].label}</strong></div>
      </div>
      <table className="doc-table">
        <thead>
          <tr><th>Item</th><th className="num">Qty</th>{cols.map((q, c) => <th key={c} className="num">{q.supplier}</th>)}<th>Awarded To</th></tr>
        </thead>
        <tbody>
          {rfq.items.map((it, i) => (
            <tr key={i}>
              <td>{it.item}</td><td className="num">{it.qty} {it.uom}</td>
              {cols.map((q, c) => <td key={c} className={`num ${rfq.award?.[i] === q.supplier ? 'doc-min' : ''}`}>{Number(q.rates[i]) ? money((Number(q.rates[i]) || 0) * it.qty) : '—'}</td>)}
              <td className="strong">{rfq.award?.[i] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="doc-remarks"><span>Award Summary:</span> {Object.entries(summary).map(([s, v]) => `${s} — ${v.count} item(s), ${money(v.amount)}`).join('  ·  ') || '—'}; Total {money(awardGrand(rfq))}{rfq.csDecisionNote ? `. ${rfq.csDecisionNote}` : ''}</div>
      <div className="doc-sign">
        <div><span className="sig-line" />Prepared By</div>
        <div><span className="sig-line" />Checked By</div>
        <div><span className="sig-line" />Approved By</div>
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

export default function Rfq({ onHome, onBack }) {
  const [rfqs, setRfqs] = useState(SEED)
  const [mode, setMode] = useState('list')
  const [selectedNo, setSelectedNo] = useState(null)
  const [printMode, setPrintMode] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // form
  const [header, setHeader] = useState({ date: TODAY, dept: '', requiredBy: '' })
  const [items, setItems] = useState([newItem()])
  const [supSel, setSupSel] = useState([])
  const [remarks, setRemarks] = useState('')
  const [touched, setTouched] = useState(false)
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
  // Invite more suppliers to an existing RFQ (new quote columns).
  const addSuppliers = (no, names) => updateRfq(no, (r) => ({
    ...r,
    quotes: [...r.quotes, ...names.map((s) => ({ supplier: s, received: false, deliveryDays: '', validityDays: '', rates: r.items.map(() => '') }))],
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
      const award = r.items.map((_, i) => {
        const cand = r.quotes.filter((q) => q.received && Number(q.rates[i]) > 0)
        if (!cand.length) return ''
        return cand.reduce((a, b) => (Number(a.rates[i]) <= Number(b.rates[i]) ? a : b)).supplier
      })
      updateRfq(no, (x) => ({ ...x, award }))
    }
    setSelectedNo(no); setMode('cs')
  }

  // form actions
  const addItem = () => setItems((l) => [...l, newItem()])
  const removeItem = (id) => setItems((l) => (l.length > 1 ? l.filter((x) => x.id !== id) : l))
  const updateItem = (id, f, v) => setItems((l) => l.map((x) => (x.id === id ? { ...x, [f]: v } : x)))
  const toggleSup = (name) => setSupSel((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))
  const resetForm = () => { setHeader({ date: TODAY, dept: '', requiredBy: '' }); setItems([newItem()]); setSupSel([]); setRemarks(''); setTouched(false) }
  const openForm = () => { resetForm(); setMode('form') }
  const closeForm = () => { resetForm(); setMode('list') }

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
  const commitRfq = (status) => {
    setTouched(true)
    if (status === 'Sent' && !canSend) return
    const record = {
      ...header, no: nextNo, status, remarks, csStatus: 'None', award: [], csDecisionNote: '', csDecidedOn: '',
      items: validItems.map((l) => ({ item: l.item, desc: l.desc, uom: l.uom, qty: Number(l.qty) || 0, prNo: l.prNo || '' })),
      quotes: supSel.map((s) => ({ supplier: s, received: false, deliveryDays: '', validityDays: '', rates: validItems.map(() => '') })),
    }
    setRfqs((p) => [record, ...p]); closeForm()
  }

  // CS approval
  const submitCs = (no) => updateRfq(no, (r) => ({ ...r, csStatus: 'Pending' }))
  const askDecision = (no, action) => { setDecisionNote(''); setConfirm({ no, action }) }
  const applyDecision = () => {
    if (!confirm) return
    const stamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    updateRfq(confirm.no, (r) => ({
      ...r, csStatus: confirm.action, csDecisionNote: decisionNote.trim(), csDecidedOn: stamp,
      status: confirm.action === 'Approved' ? 'Closed' : r.status,
    }))
    setConfirm(null); setDecisionNote('')
  }

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
        <div className="print-sheet">
          {printMode === 'rfq' && current && <RfqDocument rfq={current} />}
          {printMode === 'cs' && current && <CsDocument rfq={current} />}
          {printMode === 'list' && <RfqListDocument items={filtered} filterLabel={filterLabel} />}
        </div>
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
    const summary = awardSummary(current)
    const canSubmit = receivedCount(current) > 0 && allAwarded(current)
    return (
      <div className="req fade-in">
        {crumbBar(<><button onClick={() => setMode('list')}>RFQ</button><ChevronRight size={14} /><button onClick={() => openView(current.no)}>{current.no}</button><ChevronRight size={14} /><span>Comparative Statement</span></>)}
        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={() => openView(current.no)}><ArrowLeft size={18} /></button>
            <span className="req-mark"><Scale size={22} /></span>
            <div>
              <h1>Comparative Statement <span className="pr-no">{current.no}</span></h1>
              <p>{current.dept} · {receivedCount(current)} of {current.quotes.length} quotes received</p>
            </div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={() => openView(current.no)}>Back</button>
            <button className="btn btn-ghost" onClick={() => setPrintMode('cs')}><Printer size={16} /> Print</button>
            {(current.csStatus === 'None' || current.csStatus === 'Rejected') && (
              <button className="btn btn-primary" onClick={() => submitCs(current.no)} disabled={!canSubmit}><Send size={16} /> Submit for Approval</button>
            )}
            {current.csStatus === 'Pending' && (
              <>
                <button className="btn btn-reject" onClick={() => askDecision(current.no, 'Rejected')}><XCircle size={16} /> Reject</button>
                <button className="btn btn-approve" onClick={() => askDecision(current.no, 'Approved')}><CheckCircle2 size={16} /> Approve</button>
              </>
            )}
          </div>
        </header>

        <div className={`cs-status-banner tone-${cs.tone}`}>
          <span>Status: <strong>{cs.label}</strong></span>
          {current.csDecidedOn && <span className="cs-decided">{current.csDecidedOn}{current.csDecisionNote ? ` — “${current.csDecisionNote}”` : ''}</span>}
          {(current.csStatus === 'Approved' || current.csStatus === 'Rejected') && (
            <button className="reopen" onClick={() => updateRfq(current.no, (r) => ({ ...r, csStatus: 'Pending', status: 'Quoted' }))}>Re-open</button>
          )}
        </div>

        <section className="panel">
          <div className="panel-head"><h2><Scale size={16} /> Supplier Comparison &amp; Award</h2></div>
          <div className="cs-pad">
            <QuoteMatrix rfq={current} mode="cs" award={current.award} onAward={(i, s) => setAward(current.no, i, s)} />
            <p className="cs-hint">Lowest rate per item is highlighted. Use <strong>Award to</strong> on each row to split items across suppliers — different items can go to different suppliers.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2><Award size={16} /> Award Summary</h2>{!allAwarded(current) && <em className="req-em">— award every item to submit</em>}</div>
          <div className="award-summary">
            {Object.keys(summary).length === 0 && <p className="cs-empty">No items awarded yet.</p>}
            {Object.entries(summary).map(([sup, v]) => (
              <div className="award-card" key={sup}>
                <div className="aw-top"><Building size={16} /><strong>{sup}</strong></div>
                <div className="aw-items">{v.items.join(', ')}</div>
                <div className="aw-foot"><span>{v.count} item{v.count === 1 ? '' : 's'}</span><strong>{money(v.amount)}</strong></div>
              </div>
            ))}
            {Object.keys(summary).length > 0 && (
              <div className="award-grand"><span>Total Award Value</span><strong>{money(awardGrand(current))}</strong></div>
            )}
          </div>
        </section>

        <footer className="content-foot">Comparative Statement · {current.no} · DataMart Enterprise Suite</footer>
        {printOverlay}{confirmModal}
      </div>
    )
  }

  // ===================== VIEW =====================
  if (mode === 'view' && current) {
    const sm = RFQ_META[current.status]
    const SIcon = sm.icon
    const recd = receivedCount(current)
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
            <button className="btn btn-ghost sm" onClick={openSupAdd}><Plus size={15} /> Add Supplier</button>
          </div>
          <div className="cs-pad">
            {current.quotes.length === 0
              ? <p className="cs-empty">No suppliers invited yet — use “Add Supplier” to invite one.</p>
              : <QuoteMatrix rfq={current} mode="entry"
                  onRate={(c, i, v) => setRate(current.no, c, i, v)}
                  onReceived={(c) => toggleReceived(current.no, c)}
                  onMeta={(c, f, v) => setMeta(current.no, c, f, v)}
                  onRemoveSupplier={(c) => removeSupplier(current.no, c)} />}
            <p className="cs-hint">Tick “Quote received” for each supplier, then enter their rates, delivery and validity. Use <strong>Add Supplier</strong> to invite more, or ✕ on a column to remove one.</p>
          </div>
        </section>

        <footer className="content-foot">Request for Quotation · {current.no} · DataMart Enterprise Suite</footer>
        {printOverlay}{confirmModal}{supAddModal}
      </div>
    )
  }

  // ===================== FORM =====================
  if (mode === 'form') {
    return (
      <div className="req fade-in">
        {crumbBar(<><button onClick={closeForm}>RFQ</button><ChevronRight size={14} /><span>New</span></>)}
        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={closeForm}><ArrowLeft size={18} /></button>
            <span className="req-mark"><FileText size={22} /></span>
            <div><h1>New RFQ <span className="pr-no">{nextNo}</span></h1><p>Pull items from PRs or add manually, then invite suppliers.</p></div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
            <button className="btn btn-ghost" onClick={() => commitRfq('Draft')}><Save size={16} /> Save Draft</button>
            <button className="btn btn-primary" onClick={() => commitRfq('Sent')} disabled={!canSend}><Send size={16} /> Send to Suppliers</button>
          </div>
        </header>

        <section className="panel form-panel">
          <div className="panel-head"><h2>RFQ Details</h2></div>
          <div className="form-grid">
            <label className="fld"><span>RFQ No.</span><input value={nextNo} readOnly className="ro" /></label>
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
          <div className="panel-head"><h2><Building size={16} /> Invite Suppliers {touched && supSel.length === 0 && <em className="req-em">— select at least one</em>}</h2></div>
          <div className="sup-pick">
            {SUPPLIERS.map((s) => (
              <label key={s} className={`sup-chip ${supSel.includes(s) ? 'on' : ''}`}>
                <input type="checkbox" checked={supSel.includes(s)} onChange={() => toggleSup(s)} />
                <Building size={15} /> {s}
              </label>
            ))}
          </div>
          <div className="rfq-remarks">
            <label><span>Remarks</span><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Terms, instructions…" /></label>
          </div>
        </section>

        {touched && !canSend && <p className="form-hint">Choose a department, quote-by date, at least one item with quantity, and one supplier.</p>}
        <footer className="content-foot">New RFQ · DataMart Enterprise Suite</footer>
        {pickerModal}
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
