import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Search, ClipboardList, Printer, Eye, Send, PackageCheck,
  CheckCircle2, XCircle, Building, FileSearch,
} from 'lucide-react'
import { poStore } from '../../../data/poStore.js'
import { buildInitialPos, PoDocument } from './Rfq.jsx'
import './Rfq.css'

// Ensure the shared store is seeded even if the PO Register is the first screen opened.
poStore.ensureSeeded(buildInitialPos)

const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const PO_META = {
  Open: { tone: 'blue', icon: ClipboardList },
  Sent: { tone: 'amber', icon: Send },
  Partial: { tone: 'violet', icon: PackageCheck },
  Received: { tone: 'teal', icon: PackageCheck },
  Completed: { tone: 'green', icon: CheckCircle2 },
  Cancelled: { tone: 'slate', icon: XCircle },
}
// Forward status lifecycle.
const NEXT = { Open: 'Sent', Sent: 'Received', Received: 'Completed' }
const NEXT_LABEL = { Open: 'Send to Supplier', Sent: 'Mark Received', Received: 'Complete' }

export default function PurchaseOrder({ onHome, onBack }) {
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [poPrint, setPoPrint] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pos
      .filter((p) => (statusFilter === 'All' || p.status === statusFilter) &&
        (!q || `${p.no} ${p.supplier} ${p.rfqNo} ${p.dept}`.toLowerCase().includes(q)))
      .sort((a, b) => b.no.localeCompare(a.no))
  }, [pos, query, statusFilter])

  const stats = useMemo(() => ({
    total: pos.length,
    open: pos.filter((p) => p.status === 'Open' || p.status === 'Sent' || p.status === 'Received').length,
    completed: pos.filter((p) => p.status === 'Completed').length,
    value: pos.filter((p) => p.status !== 'Cancelled').reduce((s, p) => s + p.total, 0),
  }), [pos])

  const advance = (po) => poStore.setStatus(po.no, NEXT[po.status])
  const cancel = (po) => poStore.setStatus(po.no, 'Cancelled')

  const crumbBar = (
    <nav className="crumbs">
      <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
      <button onClick={onBack}>Procurement</button><ChevronRight size={14} />
      <span>Purchase Orders</span>
    </nav>
  )

  const printOverlay = poPrint && (
    <div className="print-overlay">
      <div className="print-bar no-print">
        <span><Printer size={16} /> Print Preview — Purchase Order {poPrint.no} · {poPrint.supplier}</span>
        <div className="print-bar-actions">
          <button className="btn btn-ghost" onClick={() => setPoPrint(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print</button>
        </div>
      </div>
      <div className="print-scroll"><div className="print-sheet"><PoDocument po={poPrint} /></div></div>
    </div>
  )

  return (
    <div className="req fade-in">
      {crumbBar}
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><ClipboardList size={22} /></span>
          <div><h1>Purchase Orders</h1><p>Supplier-wise POs auto-created from approved comparative statements.</p></div>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total POs</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">In Progress</span><strong>{stats.open}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Completed</span><strong>{stats.completed}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">Committed Value</span><strong>{num(stats.value)}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search PO no., supplier, RFQ or department…" /></div>
        <div className="req-filters">
          {['All', 'Open', 'Sent', 'Received', 'Completed', 'Cancelled'].map((s) => (
            <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead>
            <tr><th>PO No.</th><th>Date</th><th>Supplier</th><th>Ref RFQ</th><th>Department</th><th className="num">Items</th><th className="num">Total</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const sm = PO_META[p.status]; const SIcon = sm.icon
              return (
                <tr key={p.no} className="row-click" onClick={() => setPoPrint(p)}>
                  <td className="mono">{p.no}</td>
                  <td>{p.date}</td>
                  <td><span className="po-cell-sup"><Building size={13} /> {p.supplier}</span></td>
                  <td><span className="pr-badge">{p.rfqNo}</span></td>
                  <td>{p.dept}</td>
                  <td className="num">{p.lines.length}</td>
                  <td className="num">{num(p.total)} <span className="po-cur">{p.currency}</span></td>
                  <td><span className={`status tone-${sm.tone}`}><SIcon size={13} /> {p.status}</span></td>
                  <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="row-act" title="Print PO" onClick={() => setPoPrint(p)}><Printer size={16} /></button>
                    {NEXT[p.status] && <button className="row-act cs" title={NEXT_LABEL[p.status]} onClick={() => advance(p)}><Send size={15} /></button>}
                    {p.status !== 'Completed' && p.status !== 'Cancelled' && <button className="row-act edit" title="Cancel PO" onClick={() => cancel(p)}><XCircle size={15} /></button>}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="empty">{pos.length === 0 ? 'No purchase orders yet — approve a Comparative Statement to create them.' : 'No POs match your filter.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="po-reg-hint"><FileSearch size={13} /> POs are generated automatically — one per awarded supplier — when an RFQ’s Comparative Statement is approved.</p>
      <footer className="content-foot">Purchase Orders · Procurement · DataMart Enterprise Suite</footer>
      {printOverlay}
    </div>
  )
}
