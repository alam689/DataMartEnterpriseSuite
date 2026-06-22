import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, ReceiptText, Building, Save, CheckCircle2,
  Banknote, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import { poStore } from '../../../data/poStore.js'
import { invoiceStore, grnStore } from '../../../data/procStores.js'
import './Rfq.css'
import './Procurement.css'

const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const INV_TONE = { Matched: 'blue', 'On Hold': 'amber', Approved: 'green', Paid: 'teal' }

// 3-way match verdict from PO amount, invoice amount and GRN acceptance.
const matchOf = (inv) => {
  if (Number(inv.invAmount) !== Number(inv.poAmount)) return { cls: 'bad', label: 'Price variance', icon: AlertTriangle }
  if (!inv.grnOk) return { cls: 'warn', label: 'GRN short', icon: AlertTriangle }
  return { cls: 'ok', label: '3-way matched', icon: ShieldCheck }
}

export default function PurchaseInvoice({ onHome, onBack }) {
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const grns = useSyncExternalStore(grnStore.subscribe, grnStore.getAll)
  const invoices = useSyncExternalStore(invoiceStore.subscribe, invoiceStore.getAll)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [add, setAdd] = useState(null) // new invoice draft

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((iv) => (statusFilter === 'All' || iv.status === statusFilter) &&
      (!q || `${iv.no} ${iv.poNo} ${iv.supplier}`.toLowerCase().includes(q)))
  }, [invoices, query, statusFilter])

  const stats = useMemo(() => ({
    total: invoices.length,
    hold: invoices.filter((iv) => iv.status === 'On Hold').length,
    approved: invoices.filter((iv) => iv.status === 'Approved').length,
    payable: invoices.filter((iv) => iv.status === 'Approved').reduce((s, iv) => s + iv.invAmount, 0),
  }), [invoices])

  // GRNs not yet invoiced → available to bill.
  const billableGrns = grns.filter((g) => !invoices.some((iv) => iv.grnNo === g.no))

  const startAdd = (grnNo) => {
    const g = grns.find((x) => x.no === grnNo)
    if (!g) return
    const po = pos.find((p) => p.no === g.poNo)
    const poAmount = po ? po.total : 0
    setAdd({ grnNo: g.no, poNo: g.poNo, supplier: g.supplier, poAmount, grnOk: g.status === 'Accepted', invAmount: poAmount, dueDate: '' })
  }
  const submitAdd = () => {
    const status = (Number(add.invAmount) === Number(add.poAmount) && add.grnOk) ? 'Matched' : 'On Hold'
    invoiceStore.add({ no: invoiceStore.nextNo('PINV'), poNo: add.poNo, grnNo: add.grnNo, supplier: add.supplier, date: new Date().toISOString().slice(0, 10), dueDate: add.dueDate || '—', poAmount: add.poAmount, grnOk: add.grnOk, invAmount: Number(add.invAmount) || 0, status })
    setAdd(null)
  }
  const approve = (iv) => invoiceStore.update(iv.no, { status: 'Approved' })
  const markPaid = (iv) => invoiceStore.update(iv.no, { status: 'Paid' })

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>Purchase Invoices</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><ReceiptText size={22} /></span>
          <div><h1>Purchase Invoices</h1><p>Three-way match (PO ↔ GRN ↔ bill) and book supplier invoices.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-primary" onClick={() => billableGrns[0] && startAdd(billableGrns[0].no)} disabled={!billableGrns.length}><Plus size={17} /> Book Invoice</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Invoices</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">On Hold</span><strong>{stats.hold}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Approved</span><strong>{stats.approved}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">Payable (BDT)</span><strong>{num(stats.payable)}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice, PO or supplier…" /></div>
        <div className="req-filters">
          {['All', 'Matched', 'On Hold', 'Approved', 'Paid'].map((s) => <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>)}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead><tr><th>Invoice No.</th><th>Date</th><th>Supplier</th><th>PO / GRN</th><th className="num">Amount</th><th>3-Way Match</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((iv) => {
              const m = matchOf(iv); const MIcon = m.icon
              return (
                <tr key={iv.no}>
                  <td className="mono">{iv.no}</td><td>{iv.date}<span className="cell-sub">due {iv.dueDate}</span></td>
                  <td><span className="cell-sup"><Building size={13} /> {iv.supplier}</span></td>
                  <td><span className="pr-badge">{iv.poNo}</span> <span className="muted">/ {iv.grnNo}</span></td>
                  <td className="num">{num(iv.invAmount)} {Number(iv.invAmount) !== Number(iv.poAmount) && <span className="cell-sub">PO {num(iv.poAmount)}</span>}</td>
                  <td><span className={`match ${m.cls}`}><MIcon size={13} /> {m.label}</span></td>
                  <td><span className={`status tone-${INV_TONE[iv.status]}`}>{iv.status}</span></td>
                  <td className="row-actions">
                    {(iv.status === 'Matched' || iv.status === 'On Hold') && <button className="row-act cs" title="Approve" onClick={() => approve(iv)}><CheckCircle2 size={15} /></button>}
                    {iv.status === 'Approved' && <button className="row-act cs" title="Mark Paid" onClick={() => markPaid(iv)}><Banknote size={15} /></button>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="empty">No invoices match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="reg-hint"><ShieldCheck size={13} /> Match compares booked amount vs PO and confirms goods were accepted on the GRN.</p>
      <footer className="content-foot">Purchase Invoices · Procurement · DataMart Enterprise Suite</footer>

      {add && (
        <div className="modal-overlay" onClick={() => setAdd(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon tone-blue"><ReceiptText size={24} /></div>
            <h3>Book Invoice</h3>
            <div className="form-grid">
              <label className="fld"><span>Against GRN</span>
                <select value={add.grnNo} onChange={(e) => startAdd(e.target.value)}>
                  {billableGrns.map((g) => <option key={g.no} value={g.no}>{g.no} · {g.supplier} ({g.poNo})</option>)}
                </select>
              </label>
              <label className="fld"><span>Supplier</span><input value={add.supplier} readOnly className="ro" /></label>
              <label className="fld"><span>PO amount (BDT)</span><input value={num(add.poAmount)} readOnly className="ro" /></label>
              <label className="fld"><span>Invoice amount (BDT)</span><input type="number" min="0" value={add.invAmount} onChange={(e) => setAdd({ ...add, invAmount: e.target.value })} /></label>
              <label className="fld"><span>Due date</span><input type="date" value={add.dueDate} onChange={(e) => setAdd({ ...add, dueDate: e.target.value })} /></label>
              <label className="fld"><span>GRN acceptance</span><input value={add.grnOk ? 'Fully accepted' : 'Partial / short'} readOnly className="ro" /></label>
            </div>
            <p className="reg-hint">{(() => { const m = matchOf(add); const MIcon = m.icon; return <span className={`match ${m.cls}`}><MIcon size={13} /> {m.label}</span> })()}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdd}><Save size={16} /> Book Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
