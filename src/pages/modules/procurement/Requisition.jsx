import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Trash2, FileText, Save, Send,
  ClipboardList, CheckCircle2, Clock, XCircle, FileEdit, Package, Printer, Eye, Database, Pencil,
} from 'lucide-react'
import './Requisition.css'

/*
 * Purchase Requisition (Procurement) — register list, single-PR view,
 * create form, and print preview for a single PR and the whole register.
 * In-memory demo data.
 */

const TODAY = new Date().toISOString().slice(0, 10)
const PRINTED_ON = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

const COMPANY = {
  name: 'DataMart Corp',
  address: '12 Enterprise Avenue, Dhaka 1212, Bangladesh',
  contact: 'Tel: +880 2 555 0100 · procurement@datamart.com',
}

const DEPARTMENTS = ['Plant Stores', 'Production', 'Maintenance', 'IT', 'Admin', 'Sales', 'Finance', 'HR']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const ITEM_CATALOG = [
  { name: 'Steel Bolt M12 — Zinc', uom: 'Pcs', rate: 2.5 },
  { name: 'Hydraulic Oil 20L', uom: 'Drum', rate: 85 },
  { name: 'Packing Tape 48mm', uom: 'Roll', rate: 1.2 },
  { name: 'Label Roll — A4', uom: 'Roll', rate: 4.5 },
  { name: 'Workstation PC — i5', uom: 'Unit', rate: 780 },
  { name: 'Safety Helmet', uom: 'Pcs', rate: 9 },
  { name: 'Cement Bag 50kg', uom: 'Bag', rate: 7.2 },
  { name: 'Copy Paper A4 (ream)', uom: 'Ream', rate: 3.8 },
]

// Each PR carries full header + line items so it can be viewed and printed.
const SEED = [
  { no: 'PR-2025', date: '2026-06-20', dept: 'Plant Stores', requiredBy: '2026-06-28', priority: 'High', status: 'Pending', requestedBy: 'Store Officer', deliverTo: 'Main Store', remarks: 'Required for the upcoming production run.', lines: [
    { item: 'Steel Coils', desc: 'CRC grade', uom: 'MT', qty: 12, rate: 3500 },
    { item: 'Welding Rods', desc: '3.2mm', uom: 'Box', qty: 40, rate: 120 },
    { item: 'Cutting Discs', desc: '4 inch', uom: 'Pcs', qty: 100, rate: 14 },
  ] },
  { no: 'PR-2024', date: '2026-06-19', dept: 'IT', requiredBy: '2026-07-01', priority: 'Medium', status: 'Approved', requestedBy: 'IT Manager', deliverTo: 'IT Dept', remarks: 'New joiner workstations.', lines: [
    { item: 'Workstation PC — i5', desc: '16GB / 512GB SSD', uom: 'Unit', qty: 15, rate: 1900 },
    { item: 'Monitor 24"', desc: 'IPS, FHD', uom: 'Unit', qty: 15, rate: 200 },
  ] },
  { no: 'PR-2023', date: '2026-06-18', dept: 'Maintenance', requiredBy: '2026-06-25', priority: 'Low', status: 'Draft', requestedBy: 'Maint. Supervisor', deliverTo: 'Workshop', remarks: 'Routine maintenance stock.', lines: [
    { item: 'Bearing 6204', desc: '', uom: 'Pcs', qty: 50, rate: 18 },
    { item: 'V-Belt A-50', desc: '', uom: 'Pcs', qty: 30, rate: 25 },
    { item: 'Grease 5kg', desc: 'Lithium', uom: 'Tin', qty: 20, rate: 60 },
    { item: 'Hydraulic Oil 20L', desc: '', uom: 'Drum', qty: 40, rate: 85 },
    { item: 'Gasket Sheet', desc: '', uom: 'Sheet', qty: 25, rate: 260 },
  ] },
  { no: 'PR-2022', date: '2026-06-17', dept: 'Production', requiredBy: '2026-06-22', priority: 'Urgent', status: 'Approved', requestedBy: 'Plant Head', deliverTo: 'Plant Store', remarks: 'Urgent — line stoppage risk.', lines: [
    { item: 'Resin', desc: 'Epoxy', uom: 'Kg', qty: 200, rate: 220 },
    { item: 'Hardener', desc: '', uom: 'Kg', qty: 80, rate: 180 },
    { item: 'Pigment', desc: 'Blue', uom: 'Kg', qty: 40, rate: 150 },
    { item: 'Mold Release', desc: '', uom: 'Ltr', qty: 40, rate: 100 },
  ] },
  { no: 'PR-2021', date: '2026-06-15', dept: 'Admin', requiredBy: '2026-06-30', priority: 'Low', status: 'Rejected', requestedBy: 'Admin Officer', deliverTo: 'Head Office', remarks: 'Rejected — use existing stock first.', lines: [
    { item: 'Copy Paper A4 (ream)', desc: '80 GSM', uom: 'Ream', qty: 1500, rate: 3.6 },
  ] },
  { no: 'PR-2020', date: '2026-06-14', dept: 'Sales', requiredBy: '2026-06-24', priority: 'Medium', status: 'Pending', requestedBy: 'Sales Lead', deliverTo: 'Sales Office', remarks: 'Trade fair collateral.', lines: [
    { item: 'Brochures', desc: 'A4 glossy', uom: 'Pack', qty: 200, rate: 35 },
    { item: 'Banners', desc: 'Roll-up', uom: 'Pcs', qty: 28, rate: 100 },
  ] },
]

const money = (n) => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const prItems = (pr) => pr.lines.length
const prValue = (pr) => pr.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0)

const STATUS_META = {
  Draft: { tone: 'slate', icon: FileEdit },
  Pending: { tone: 'amber', icon: Clock },
  Approved: { tone: 'green', icon: CheckCircle2 },
  Rejected: { tone: 'rose', icon: XCircle },
}
const PRIORITY_TONE = { Low: 'teal', Medium: 'blue', High: 'amber', Urgent: 'rose' }

let lineSeq = 1
const newLine = () => ({ id: lineSeq++, item: '', desc: '', uom: '', qty: '', rate: '' })

/* ---------- Printable single-PR document ---------- */
function PrDocument({ pr }) {
  const total = prValue(pr)
  const qty = pr.lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  return (
    <div className="doc">
      <div className="doc-top">
        <div className="doc-org">
          <div className="doc-logo"><Database size={22} /></div>
          <div>
            <strong>{COMPANY.name}</strong>
            <span>{COMPANY.address}</span>
            <span>{COMPANY.contact}</span>
          </div>
        </div>
        <div className="doc-title">
          <h2>PURCHASE REQUISITION</h2>
          <div className="doc-no">{pr.no}</div>
          <div className={`doc-status tone-${STATUS_META[pr.status].tone}`}>{pr.status}</div>
        </div>
      </div>

      <div className="doc-meta">
        <div><span>Date</span><strong>{pr.date}</strong></div>
        <div><span>Required By</span><strong>{pr.requiredBy}</strong></div>
        <div><span>Department</span><strong>{pr.dept}</strong></div>
        <div><span>Priority</span><strong>{pr.priority}</strong></div>
        <div><span>Requested By</span><strong>{pr.requestedBy}</strong></div>
        <div><span>Deliver To</span><strong>{pr.deliverTo}</strong></div>
      </div>

      <table className="doc-table">
        <thead>
          <tr><th>#</th><th>Item</th><th>Description</th><th>UOM</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {pr.lines.map((l, i) => (
            <tr key={i}>
              <td>{i + 1}</td><td>{l.item}</td><td>{l.desc || '—'}</td><td>{l.uom}</td>
              <td className="num">{l.qty}</td><td className="num">{money(l.rate)}</td>
              <td className="num">{money((Number(l.qty) || 0) * (Number(l.rate) || 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}></td><td className="num">{qty}</td><td className="num">Total</td><td className="num strong">{money(total)}</td></tr>
        </tfoot>
      </table>

      {pr.remarks && <div className="doc-remarks"><span>Remarks:</span> {pr.remarks}</div>}

      <div className="doc-sign">
        <div><span className="sig-line" />Prepared By</div>
        <div><span className="sig-line" />Checked By</div>
        <div><span className="sig-line" />Approved By</div>
      </div>
      <div className="doc-printed">Printed on {PRINTED_ON} · DataMart Enterprise Suite</div>
    </div>
  )
}

/* ---------- Printable register list document ---------- */
function PrListDocument({ items, filterLabel }) {
  const totalValue = items.reduce((s, p) => s + prValue(p), 0)
  return (
    <div className="doc">
      <div className="doc-top">
        <div className="doc-org">
          <div className="doc-logo"><Database size={22} /></div>
          <div>
            <strong>{COMPANY.name}</strong>
            <span>{COMPANY.address}</span>
          </div>
        </div>
        <div className="doc-title">
          <h2>PURCHASE REQUISITION REGISTER</h2>
          <div className="doc-no">Filter: {filterLabel}</div>
        </div>
      </div>

      <table className="doc-table">
        <thead>
          <tr><th>PR No.</th><th>Date</th><th>Department</th><th>Required By</th><th className="num">Items</th><th className="num">Est. Value</th><th>Priority</th><th>Status</th></tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.no}>
              <td>{p.no}</td><td>{p.date}</td><td>{p.dept}</td><td>{p.requiredBy}</td>
              <td className="num">{prItems(p)}</td><td className="num">{money(prValue(p))}</td>
              <td>{p.priority}</td><td>{p.status}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="strong">{items.length} requisition(s)</td><td className="num"></td><td className="num strong">{money(totalValue)}</td><td colSpan={2}></td></tr>
        </tfoot>
      </table>
      <div className="doc-printed">Printed on {PRINTED_ON} · DataMart Enterprise Suite</div>
    </div>
  )
}

export default function Requisition({ onHome, onBack }) {
  const [prs, setPrs] = useState(SEED)
  const [mode, setMode] = useState('list') // 'list' | 'form' | 'view'
  const [selected, setSelected] = useState(null)
  const [printMode, setPrintMode] = useState(null) // null | 'single' | 'list'
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // ---- form state ----
  const nextNo = useMemo(() => {
    const max = prs.reduce((m, p) => Math.max(m, parseInt(p.no.replace('PR-', ''), 10) || 0), 0)
    return `PR-${max + 1}`
  }, [prs])
  const [header, setHeader] = useState({ date: TODAY, dept: '', requiredBy: '', priority: 'Medium', requestedBy: 'Administrator', deliverTo: 'Main Store' })
  const [lines, setLines] = useState([newLine()])
  const [remarks, setRemarks] = useState('')
  const [touched, setTouched] = useState(false)
  const [editingNo, setEditingNo] = useState(null) // null = creating new
  const formNo = editingNo || nextNo

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prs.filter((p) =>
      (statusFilter === 'All' || p.status === statusFilter) &&
      (!q || (p.no + p.dept).toLowerCase().includes(q))
    )
  }, [prs, query, statusFilter])

  const counts = useMemo(() => ({
    total: prs.length,
    pending: prs.filter((p) => p.status === 'Pending').length,
    approved: prs.filter((p) => p.status === 'Approved').length,
    value: prs.reduce((s, p) => s + prValue(p), 0),
  }), [prs])

  const totals = useMemo(() => {
    const qty = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
    const amount = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0)
    const validLines = lines.filter((l) => l.item.trim() && Number(l.qty) > 0).length
    return { qty, amount, validLines }
  }, [lines])

  // ---- actions ----
  const openView = (pr) => { setSelected(pr); setMode('view') }
  const openEdit = (pr) => {
    setEditingNo(pr.no)
    setHeader({ date: pr.date, dept: pr.dept, requiredBy: pr.requiredBy, priority: pr.priority, requestedBy: pr.requestedBy, deliverTo: pr.deliverTo })
    setLines(pr.lines.map((l) => ({ id: lineSeq++, item: l.item, desc: l.desc, uom: l.uom, qty: String(l.qty), rate: String(l.rate) })))
    setRemarks(pr.remarks || '')
    setTouched(false)
    setMode('form')
  }
  const updateLine = (id, field, value) => {
    setLines((ls) => ls.map((l) => {
      if (l.id !== id) return l
      const next = { ...l, [field]: value }
      if (field === 'item') {
        const match = ITEM_CATALOG.find((c) => c.name.toLowerCase() === value.toLowerCase())
        if (match) { next.uom = match.uom; next.rate = String(match.rate) }
      }
      return next
    }))
  }
  const addLine = () => setLines((ls) => [...ls, newLine()])
  const removeLine = (id) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls))
  const resetForm = () => {
    setHeader({ date: TODAY, dept: '', requiredBy: '', priority: 'Medium', requestedBy: 'Administrator', deliverTo: 'Main Store' })
    setLines([newLine()]); setRemarks(''); setTouched(false); setEditingNo(null)
  }
  const openForm = () => { resetForm(); setMode('form') }
  const closeForm = () => { resetForm(); setMode('list') }

  const canSubmit = header.dept && header.requiredBy && totals.validLines > 0
  const commit = (status) => {
    setTouched(true)
    if (status === 'Pending' && !canSubmit) return
    const validLines = lines.filter((l) => l.item.trim()).map((l) => ({ item: l.item, desc: l.desc, uom: l.uom, qty: Number(l.qty) || 0, rate: Number(l.rate) || 0 }))
    const record = { ...header, no: formNo, status, remarks, lines: validLines.length ? validLines : [{ item: '—', desc: '', uom: '', qty: 0, rate: 0 }] }
    if (editingNo) setPrs((p) => p.map((x) => (x.no === editingNo ? record : x)))
    else setPrs((p) => [record, ...p])
    closeForm()
  }

  const filterLabel = `${statusFilter}${query ? ` · "${query}"` : ''}`

  // ===================== PRINT OVERLAY (shared) =====================
  const printOverlay = printMode && (
    <div className="print-overlay">
      <div className="print-bar no-print">
        <span><Printer size={16} /> Print Preview — {printMode === 'single' ? selected?.no : 'PR Register'}</span>
        <div className="print-bar-actions">
          <button className="btn btn-ghost" onClick={() => setPrintMode(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>
      <div className="print-scroll">
        <div className="print-sheet">
          {printMode === 'single' && selected
            ? <PrDocument pr={selected} />
            : <PrListDocument items={filtered} filterLabel={filterLabel} />}
        </div>
      </div>
    </div>
  )

  // ===================== VIEW: single PR =====================
  if (mode === 'view' && selected) {
    const sm = STATUS_META[selected.status]
    const SIcon = sm.icon
    return (
      <div className="req fade-in">
        <nav className="crumbs">
          <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
          <button onClick={onBack}>Procurement</button><ChevronRight size={14} />
          <button onClick={() => setMode('list')}>Purchase Requisition</button><ChevronRight size={14} />
          <span>{selected.no}</span>
        </nav>

        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={() => setMode('list')} title="Back to list"><ArrowLeft size={18} /></button>
            <span className="req-mark"><FileText size={22} /></span>
            <div>
              <h1>{selected.no} <span className={`status tone-${sm.tone}`}><SIcon size={13} /> {selected.status}</span></h1>
              <p>{selected.dept} · required by {selected.requiredBy}</p>
            </div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={() => setMode('list')}>Back</button>
            <button className="btn btn-ghost" onClick={() => openEdit(selected)}><Pencil size={15} /> Edit</button>
            <button className="btn btn-primary" onClick={() => setPrintMode('single')}><Printer size={16} /> Print Preview</button>
          </div>
        </header>

        <div className="doc-card">
          <PrDocument pr={selected} />
        </div>

        <footer className="content-foot">Purchase Requisition · {selected.no} · DataMart Enterprise Suite</footer>
        {printOverlay}
      </div>
    )
  }

  // ===================== FORM: new PR =====================
  if (mode === 'form') {
    return (
      <div className="req fade-in">
        <nav className="crumbs">
          <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
          <button onClick={onBack}>Procurement</button><ChevronRight size={14} />
          <button onClick={closeForm}>Purchase Requisition</button><ChevronRight size={14} />
          <span>{editingNo ? 'Edit' : 'New'}</span>
        </nav>

        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={closeForm} title="Back to list"><ArrowLeft size={18} /></button>
            <span className="req-mark"><FileText size={22} /></span>
            <div>
              <h1>{editingNo ? 'Edit Requisition' : 'New Requisition'} <span className="pr-no">{formNo}</span></h1>
              <p>{editingNo ? 'Update the details and save changes.' : 'Fill in the details and submit for approval.'}</p>
            </div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
            <button className="btn btn-ghost" onClick={() => commit('Draft')}><Save size={16} /> Save Draft</button>
            <button className="btn btn-primary" onClick={() => commit('Pending')} disabled={!canSubmit}>
              <Send size={16} /> {editingNo ? 'Update' : 'Submit'}
            </button>
          </div>
        </header>

        <section className="panel form-panel">
          <div className="panel-head"><h2>Requisition Details</h2></div>
          <div className="form-grid">
            <label className="fld"><span>PR No.</span><input value={formNo} readOnly className="ro" /></label>
            <label className="fld"><span>Date</span><input type="date" value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} /></label>
            <label className={`fld ${touched && !header.dept ? 'invalid' : ''}`}><span>Department *</span>
              <select value={header.dept} onChange={(e) => setHeader((h) => ({ ...h, dept: e.target.value }))}>
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className={`fld ${touched && !header.requiredBy ? 'invalid' : ''}`}><span>Required By *</span>
              <input type="date" value={header.requiredBy} onChange={(e) => setHeader((h) => ({ ...h, requiredBy: e.target.value }))} />
            </label>
            <label className="fld"><span>Priority</span>
              <select value={header.priority} onChange={(e) => setHeader((h) => ({ ...h, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="fld"><span>Requested By</span><input value={header.requestedBy} onChange={(e) => setHeader((h) => ({ ...h, requestedBy: e.target.value }))} /></label>
            <label className="fld"><span>Deliver To</span><input value={header.deliverTo} onChange={(e) => setHeader((h) => ({ ...h, deliverTo: e.target.value }))} /></label>
          </div>
        </section>

        <section className="panel form-panel">
          <div className="panel-head">
            <h2><Package size={16} /> Items</h2>
            <button className="btn btn-ghost sm" onClick={addLine}><Plus size={15} /> Add Item</button>
          </div>
          <div className="lines">
            <div className="line-head">
              <span>#</span><span>Item</span><span>Description</span><span>UOM</span>
              <span className="num">Qty</span><span className="num">Est. Rate</span><span className="num">Amount</span><span></span>
            </div>
            {lines.map((l, i) => {
              const amount = (Number(l.qty) || 0) * (Number(l.rate) || 0)
              const missing = touched && !l.item.trim() && (l.qty || l.rate)
              return (
                <div className="line-row" key={l.id}>
                  <span className="ln-no">{i + 1}</span>
                  <input className={missing ? 'invalid' : ''} list="item-catalog" value={l.item} onChange={(e) => updateLine(l.id, 'item', e.target.value)} placeholder="Select or type item…" />
                  <input value={l.desc} onChange={(e) => updateLine(l.id, 'desc', e.target.value)} placeholder="Optional notes" />
                  <input className="sm-in" value={l.uom} onChange={(e) => updateLine(l.id, 'uom', e.target.value)} placeholder="Unit" />
                  <input className="num-in" type="number" min="0" value={l.qty} onChange={(e) => updateLine(l.id, 'qty', e.target.value)} placeholder="0" />
                  <input className="num-in" type="number" min="0" step="0.01" value={l.rate} onChange={(e) => updateLine(l.id, 'rate', e.target.value)} placeholder="0.00" />
                  <span className="ln-amt">{money(amount)}</span>
                  <button className="ln-del" onClick={() => removeLine(l.id)} disabled={lines.length === 1} title="Remove"><Trash2 size={15} /></button>
                </div>
              )
            })}
            <datalist id="item-catalog">
              {ITEM_CATALOG.map((c) => <option key={c.name} value={c.name} />)}
            </datalist>
          </div>
          <div className="lines-foot">
            <div className="remarks">
              <label><span>Remarks</span>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Justification or special instructions…" />
              </label>
            </div>
            <div className="totals">
              <div className="tot-row"><span>Total Items</span><strong>{totals.validLines}</strong></div>
              <div className="tot-row"><span>Total Qty</span><strong>{totals.qty}</strong></div>
              <div className="tot-row grand"><span>Estimated Total</span><strong>{money(totals.amount)}</strong></div>
            </div>
          </div>
        </section>

        {touched && !canSubmit && (
          <p className="form-hint">Please choose a department, a required-by date, and add at least one item with quantity.</p>
        )}
        <footer className="content-foot">New Purchase Requisition · DataMart Enterprise Suite</footer>
      </div>
    )
  }

  // ===================== LIST: register =====================
  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} />
        <span>Purchase Requisition</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack} title="Back to Procurement"><ArrowLeft size={18} /></button>
          <span className="req-mark"><ClipboardList size={22} /></span>
          <div>
            <h1>Purchase Requisition</h1>
            <p>Raise, track and approve material &amp; service requests.</p>
          </div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost" onClick={() => setPrintMode('list')}><Printer size={16} /> Print List</button>
          <button className="btn btn-primary" onClick={openForm}><Plus size={17} /> New Requisition</button>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Requisitions</span><strong>{counts.total}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">Pending Approval</span><strong>{counts.pending}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Approved</span><strong>{counts.approved}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Total Est. Value</span><strong>{money(counts.value)}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search PR no. or department…" />
        </div>
        <div className="req-filters">
          {['All', 'Draft', 'Pending', 'Approved', 'Rejected'].map((s) => (
            <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead>
            <tr>
              <th>PR No.</th><th>Date</th><th>Department</th><th>Required By</th>
              <th className="num">Items</th><th className="num">Est. Value</th><th>Priority</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const sm = STATUS_META[p.status]
              const SIcon = sm.icon
              return (
                <tr key={p.no} className="row-click" onClick={() => openView(p)}>
                  <td className="mono">{p.no}</td>
                  <td>{p.date}</td>
                  <td>{p.dept}</td>
                  <td>{p.requiredBy}</td>
                  <td className="num">{prItems(p)}</td>
                  <td className="num strong">{money(prValue(p))}</td>
                  <td><span className={`pill tone-${PRIORITY_TONE[p.priority]}`}>{p.priority}</span></td>
                  <td><span className={`status tone-${sm.tone}`}><SIcon size={13} /> {p.status}</span></td>
                  <td className="row-actions">
                    <button className="row-act" title="View" onClick={(e) => { e.stopPropagation(); openView(p) }}><Eye size={16} /></button>
                    <button className="row-act edit" title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(p) }}><Pencil size={15} /></button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="empty">No requisitions match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="content-foot">Purchase Requisition · Procurement · DataMart Enterprise Suite</footer>
      {printOverlay}
    </div>
  )
}
