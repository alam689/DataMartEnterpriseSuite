import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Search, PackageCheck, Building, Save, X, Eye, Truck,
  ShieldCheck, AlertTriangle, XCircle,
} from 'lucide-react'
import { poStore } from '../../../data/poStore.js'
import { grnStore } from '../../../data/procStores.js'
import './Rfq.css'
import './Procurement.css'

const GRN_TONE = { Accepted: 'green', Partial: 'amber', Rejected: 'rose' }
// QC verdict badge styling reuses the .match ok/warn/bad classes.
const QC_BADGE = { Accepted: { cls: 'ok', icon: ShieldCheck, label: 'QC Passed' }, Partial: { cls: 'warn', icon: AlertTriangle, label: 'QC Partial' }, Rejected: { cls: 'bad', icon: XCircle, label: 'QC Failed' } }

export default function GoodsReceipt({ onHome, onBack, user }) {
  const ME = user?.email || 'qc@datamart.com'
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const grns = useSyncExternalStore(grnStore.subscribe, grnStore.getAll)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [view, setView] = useState(null)
  const [receive, setReceive] = useState(null)

  // Accepted-so-far per PO line (summed across every GRN) — drives partial / multi-GRN receipt.
  const acceptedByPo = useMemo(() => {
    const m = {}
    grns.forEach((g) => { const t = (m[g.poNo] = m[g.poNo] || {}); g.lines.forEach((l) => { t[l.item] = (t[l.item] || 0) + (Number(l.accepted) || 0) }) })
    return m
  }, [grns])

  const poPending = (po) => {
    const acc = acceptedByPo[po.no] || {}
    return po.lines.map((l) => ({ item: l.item, uom: l.uom, ordered: l.qty, prevAccepted: acc[l.item] || 0, pending: Math.max(0, l.qty - (acc[l.item] || 0)) }))
  }
  const hasPending = (po) => poPending(po).some((l) => l.pending > 0)
  // A PO stays receivable (across multiple GRNs) until every line is fully accepted.
  const receivablePos = pos.filter((p) => !['Received', 'Completed', 'Cancelled'].includes(p.status) && hasPending(p))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return grns.filter((g) => (statusFilter === 'All' || g.status === statusFilter) &&
      (!q || `${g.no} ${g.poNo} ${g.supplier} ${g.inspectedBy || ''}`.toLowerCase().includes(q)))
  }, [grns, query, statusFilter])

  const stats = useMemo(() => ({
    total: grns.length,
    pending: receivablePos.length,
    partial: grns.filter((g) => g.status === 'Partial').length,
    accepted: grns.filter((g) => g.status === 'Accepted').length,
  }), [grns, receivablePos])

  const startReceive = (poNo) => {
    const po = pos.find((p) => p.no === poNo)
    if (!po) return
    const lines = poPending(po).filter((l) => l.pending > 0).map((l) => ({ ...l, received: l.pending, accepted: l.pending, rejected: 0 }))
    setReceive({ poNo: po.no, supplier: po.supplier, dept: po.dept, lines, inspectedBy: ME, qcRemark: '' })
  }
  const setLine = (i, field, val) => setReceive((r) => ({
    ...r,
    lines: r.lines.map((l, li) => {
      if (li !== i) return l
      const n = Math.max(0, Number(val) || 0)
      const next = { ...l }
      if (field === 'received') { next.received = Math.min(n, l.pending); next.accepted = Math.min(next.accepted, next.received); next.rejected = next.received - next.accepted }
      if (field === 'accepted') { next.accepted = Math.min(n, l.received); next.rejected = l.received - next.accepted }
      return next
    }),
  }))
  const submitReceive = () => {
    const lines = receive.lines.map((l) => ({ ...l, qc: l.rejected === 0 ? 'Pass' : (l.accepted === 0 ? 'Fail' : 'Partial') }))
    const totalRej = lines.reduce((s, l) => s + l.rejected, 0)
    const totalAcc = lines.reduce((s, l) => s + l.accepted, 0)
    const status = totalRej === 0 ? 'Accepted' : (totalAcc === 0 ? 'Rejected' : 'Partial')
    grnStore.add({
      no: grnStore.nextNo('GRN'), poNo: receive.poNo, supplier: receive.supplier, dept: receive.dept,
      date: new Date().toISOString().slice(0, 10), status, inspectedBy: receive.inspectedBy, qcRemark: receive.qcRemark.trim(), lines,
    })
    // Recompute PO completion including this receipt → Received (fully) or Partial.
    const po = pos.find((p) => p.no === receive.poNo)
    const acc = { ...(acceptedByPo[po.no] || {}) }
    lines.forEach((l) => { acc[l.item] = (acc[l.item] || 0) + l.accepted })
    poStore.setStatus(po.no, po.lines.every((l) => (acc[l.item] || 0) >= l.qty) ? 'Received' : 'Partial')
    setReceive(null)
  }

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>Goods Receipt</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><PackageCheck size={22} /></span>
          <div><h1>Goods Receipt (GRN)</h1><p>Receive in one or more lots per PO, with quality-control inspection.</p></div>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total GRNs</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">Awaiting / Partial</span><strong>{stats.pending}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">QC Partial</span><strong>{stats.partial}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">QC Passed</span><strong>{stats.accepted}</strong></div>
      </section>

      {receivablePos.length > 0 && (
        <section className="panel form-panel">
          <div className="panel-head"><h2><Truck size={16} /> Awaiting Receipt</h2></div>
          <div className="po-pad">
            {receivablePos.map((p) => {
              const pend = poPending(p)
              const partial = pend.some((l) => l.prevAccepted > 0)
              const pendQty = pend.reduce((s, l) => s + l.pending, 0)
              return (
                <div className="po-row" key={p.no}>
                  <div className="po-id"><span className="po-no">{p.no}{partial && <span className="grn-part-tag">part-received</span>}</span><span className="po-sup"><Building size={14} /> {p.supplier}</span></div>
                  <div className="po-meta"><span>{pend.filter((l) => l.pending > 0).length} line(s) pending</span><span className="muted">{pendQty} unit(s) to receive</span></div>
                  <button className="btn btn-primary sm" onClick={() => startReceive(p.no)}><PackageCheck size={15} /> Receive</button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search GRN, PO, supplier or inspector…" /></div>
        <div className="req-filters">
          {['All', 'Accepted', 'Partial', 'Rejected'].map((s) => <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>)}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead><tr><th>GRN No.</th><th>Date</th><th>Supplier</th><th>Ref PO</th><th className="num">Lines</th><th>QC Result</th><th>Inspector</th><th></th></tr></thead>
          <tbody>
            {filtered.map((g) => {
              const qc = QC_BADGE[g.status]; const QIcon = qc.icon
              return (
                <tr key={g.no} className="row-click" onClick={() => setView(g)}>
                  <td className="mono">{g.no}</td><td>{g.date}</td>
                  <td><span className="cell-sup"><Building size={13} /> {g.supplier}</span></td>
                  <td><span className="pr-badge">{g.poNo}</span></td>
                  <td className="num">{g.lines.length}</td>
                  <td><span className={`match ${qc.cls}`}><QIcon size={13} /> {qc.label}</span></td>
                  <td className="muted">{g.inspectedBy || '—'}</td>
                  <td className="row-actions" onClick={(e) => e.stopPropagation()}><button className="row-act" title="View" onClick={() => setView(g)}><Eye size={16} /></button></td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="empty">No goods receipts match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="reg-hint"><PackageCheck size={13} /> A PO can be received in several GRNs; it’s marked <strong>Received</strong> once all lines pass QC in full, otherwise <strong>Partial</strong>.</p>
      <footer className="content-foot">Goods Receipt &amp; QC · Procurement · DataMart Enterprise Suite</footer>

      {receive && (
        <div className="modal-overlay" onClick={() => setReceive(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon tone-green"><PackageCheck size={24} /></div>
            <h3>Receive &amp; Inspect — {receive.poNo}</h3>
            <p>{receive.supplier} · {receive.dept}. Enter received quantity, then QC pass/fail per line.</p>
            <table className="line-tbl">
              <thead><tr><th>Item</th><th>UOM</th><th className="num">Ordered</th><th className="num">Recd</th><th className="num">Pending</th><th className="num">Receiving</th><th className="num">QC Pass</th><th className="num">QC Fail</th></tr></thead>
              <tbody>
                {receive.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="cell-strong">{l.item}</td><td>{l.uom}</td>
                    <td className="num">{l.ordered}</td><td className="num muted">{l.prevAccepted}</td><td className="num">{l.pending}</td>
                    <td className="num"><input type="number" min="0" max={l.pending} value={l.received} onChange={(e) => setLine(i, 'received', e.target.value)} /></td>
                    <td className="num"><input type="number" min="0" max={l.received} value={l.accepted} onChange={(e) => setLine(i, 'accepted', e.target.value)} /></td>
                    <td className={`num ${l.rejected > 0 ? 'qc-fail' : ''}`}>{l.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="qc-foot">
              <label className="fld"><span>Inspected by</span><input value={receive.inspectedBy} onChange={(e) => setReceive({ ...receive, inspectedBy: e.target.value })} /></label>
              <label className="fld qc-rem"><span>QC remarks</span><input value={receive.qcRemark} onChange={(e) => setReceive({ ...receive, qcRemark: e.target.value })} placeholder="Inspection notes, batch / lot, defects…" /></label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setReceive(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitReceive}><Save size={16} /> Post GRN</button>
            </div>
          </div>
        </div>
      )}

      {view && (() => { const qc = QC_BADGE[view.status]; const QIcon = qc.icon; return (
        <div className="modal-overlay" onClick={() => setView(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setView(null)}><X size={18} /></button>
            <div className="modal-icon tone-blue"><PackageCheck size={24} /></div>
            <h3>{view.no} <span className={`match ${qc.cls}`}><QIcon size={13} /> {qc.label}</span></h3>
            <p>{view.supplier} · against {view.poNo} · {view.date} · inspected by {view.inspectedBy || '—'}</p>
            <table className="line-tbl">
              <thead><tr><th>Item</th><th>UOM</th><th className="num">Ordered</th><th className="num">Received</th><th className="num">QC Pass</th><th className="num">QC Fail</th><th>QC</th></tr></thead>
              <tbody>
                {view.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="cell-strong">{l.item}</td><td>{l.uom}</td><td className="num">{l.ordered}</td>
                    <td className="num">{l.received}</td><td className="num">{l.accepted}</td><td className={`num ${l.rejected > 0 ? 'qc-fail' : ''}`}>{l.rejected}</td>
                    <td>{l.qc || (l.rejected ? 'Partial' : 'Pass')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {view.qcRemark && <p className="qc-remark"><strong>QC remarks:</strong> {view.qcRemark}</p>}
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setView(null)}>Close</button></div>
          </div>
        </div>
      ) })()}
    </div>
  )
}
