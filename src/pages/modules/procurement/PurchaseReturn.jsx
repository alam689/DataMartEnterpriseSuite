import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Undo2, Building, Save, CheckCircle2, Banknote,
} from 'lucide-react'
import { returnStore, grnStore } from '../../../data/procStores.js'
import './Rfq.css'
import './Procurement.css'

const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const RET_TONE = { Issued: 'amber', Accepted: 'blue', Settled: 'green' }
const REASONS = ['Damaged in transit', 'Quality rejected', 'Wrong item', 'Excess delivery', 'Expired / near expiry']

export default function PurchaseReturn({ onHome, onBack }) {
  const grns = useSyncExternalStore(grnStore.subscribe, grnStore.getAll)
  const returns = useSyncExternalStore(returnStore.subscribe, returnStore.getAll)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [add, setAdd] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return returns.filter((r) => (statusFilter === 'All' || r.status === statusFilter) &&
      (!q || `${r.no} ${r.grnNo} ${r.supplier} ${r.item}`.toLowerCase().includes(q)))
  }, [returns, query, statusFilter])

  const stats = useMemo(() => ({
    total: returns.length,
    issued: returns.filter((r) => r.status === 'Issued').length,
    settled: returns.filter((r) => r.status === 'Settled').length,
    value: returns.reduce((s, r) => s + r.qty * r.rate, 0),
  }), [returns])

  const startAdd = (grnNo) => {
    const g = grns.find((x) => x.no === grnNo) || grns[0]
    if (!g) return
    const first = g.lines[0]
    setAdd({ grnNo: g.no, poNo: g.poNo, supplier: g.supplier, item: first.item, uom: first.uom, qty: first.rejected || 1, rate: 0, reason: REASONS[0] })
  }
  const pickGrn = (grnNo) => startAdd(grnNo)
  const submitAdd = () => {
    if (!(Number(add.qty) > 0)) return
    returnStore.add({ no: returnStore.nextNo('PRET'), grnNo: add.grnNo, poNo: add.poNo, supplier: add.supplier, date: new Date().toISOString().slice(0, 10), item: add.item, qty: Number(add.qty), uom: add.uom, rate: Number(add.rate) || 0, reason: add.reason, status: 'Issued' })
    setAdd(null)
  }
  const accept = (r) => returnStore.update(r.no, { status: 'Accepted' })
  const settle = (r) => returnStore.update(r.no, { status: 'Settled' })

  const addGrn = add && grns.find((g) => g.no === add.grnNo)

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>Purchase Returns</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Undo2 size={22} /></span>
          <div><h1>Purchase Returns</h1><p>Debit notes &amp; return-to-vendor against received goods.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-primary" onClick={() => startAdd(grns[0]?.no)} disabled={!grns.length}><Plus size={17} /> New Debit Note</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Returns</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">Issued</span><strong>{stats.issued}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Settled</span><strong>{stats.settled}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">Return Value (BDT)</span><strong>{num(stats.value)}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search debit note, GRN, supplier or item…" /></div>
        <div className="req-filters">
          {['All', 'Issued', 'Accepted', 'Settled'].map((s) => <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>)}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead><tr><th>Debit Note</th><th>Date</th><th>Supplier</th><th>Ref GRN</th><th>Item</th><th className="num">Qty</th><th className="num">Value</th><th>Reason</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.no}>
                <td className="mono">{r.no}</td><td>{r.date}</td>
                <td><span className="cell-sup"><Building size={13} /> {r.supplier}</span></td>
                <td><span className="pr-badge">{r.grnNo}</span></td>
                <td className="cell-strong">{r.item}</td>
                <td className="num">{r.qty} {r.uom}</td>
                <td className="num">{num(r.qty * r.rate)}</td>
                <td className="muted">{r.reason}</td>
                <td><span className={`status tone-${RET_TONE[r.status]}`}>{r.status}</span></td>
                <td className="row-actions">
                  {r.status === 'Issued' && <button className="row-act cs" title="Mark Accepted" onClick={() => accept(r)}><CheckCircle2 size={15} /></button>}
                  {r.status === 'Accepted' && <button className="row-act cs" title="Settle (credit received)" onClick={() => settle(r)}><Banknote size={15} /></button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="empty">No purchase returns match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="reg-hint"><Undo2 size={13} /> Debit notes are raised against a GRN line and settled when the supplier issues credit.</p>
      <footer className="content-foot">Purchase Returns · Procurement · DataMart Enterprise Suite</footer>

      {add && (
        <div className="modal-overlay" onClick={() => setAdd(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon tone-amber"><Undo2 size={24} /></div>
            <h3>New Debit Note</h3>
            <div className="form-grid">
              <label className="fld"><span>Against GRN</span>
                <select value={add.grnNo} onChange={(e) => pickGrn(e.target.value)}>
                  {grns.map((g) => <option key={g.no} value={g.no}>{g.no} · {g.supplier} ({g.poNo})</option>)}
                </select>
              </label>
              <label className="fld"><span>Item</span>
                <select value={add.item} onChange={(e) => { const l = addGrn.lines.find((x) => x.item === e.target.value); setAdd({ ...add, item: e.target.value, uom: l ? l.uom : add.uom }) }}>
                  {(addGrn ? addGrn.lines : []).map((l) => <option key={l.item} value={l.item}>{l.item}</option>)}
                </select>
              </label>
              <label className="fld"><span>Quantity</span><input type="number" min="0" value={add.qty} onChange={(e) => setAdd({ ...add, qty: e.target.value })} /></label>
              <label className="fld"><span>Rate (BDT)</span><input type="number" min="0" value={add.rate} onChange={(e) => setAdd({ ...add, rate: e.target.value })} /></label>
              <label className="fld"><span>Reason</span><select value={add.reason} onChange={(e) => setAdd({ ...add, reason: e.target.value })}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
              <label className="fld"><span>Return value</span><input value={num((Number(add.qty) || 0) * (Number(add.rate) || 0))} readOnly className="ro" /></label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitAdd} disabled={!(Number(add.qty) > 0)}><Save size={16} /> Issue Debit Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
