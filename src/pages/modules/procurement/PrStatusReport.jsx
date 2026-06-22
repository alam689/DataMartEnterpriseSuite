import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Search, GitBranch, FileText, FileSearch, ClipboardList,
  PackageCheck, X, CheckCircle2,
} from 'lucide-react'
import { prSource } from '../../../data/prSource.js'
import { poStore } from '../../../data/poStore.js'
import { rfqStore } from '../../../data/rfqStore.js'
import { grnStore } from '../../../data/procStores.js'
import './Rfq.css'
import './Procurement.css'

const STAGES = ['Requisitioned', 'In RFQ', 'Ordered', 'Partially Received', 'Received']
const STAGE_TONE = { Requisitioned: 'slate', 'In RFQ': 'violet', Ordered: 'blue', 'Partially Received': 'amber', Received: 'green' }
const PIPE = [
  { key: 'pr', label: 'PR', icon: FileText },
  { key: 'rfq', label: 'RFQ', icon: FileSearch },
  { key: 'po', label: 'PO', icon: ClipboardList },
  { key: 'grn', label: 'GRN', icon: PackageCheck },
]

export default function PrStatusReport({ onHome, onBack }) {
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const rfqs = useSyncExternalStore(rfqStore.subscribe, rfqStore.getAll)
  const grns = useSyncExternalStore(grnStore.subscribe, grnStore.getAll)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [view, setView] = useState(null)

  // Trace every PR through RFQ → PO → GRN.
  const tracked = useMemo(() => prSource.map((pr) => {
    const prRfqs = rfqs.filter((r) => r.items.some((it) => it.prNo === pr.no))
    const prPos = pos.filter((p) => p.status !== 'Cancelled' && p.lines.some((l) => l.prNo === pr.no))
    const prGrns = grns.filter((g) => prPos.some((p) => p.no === g.poNo))
    const lines = pr.items.map((it) => {
      const ordered = prPos.reduce((s, p) => s + p.lines.filter((l) => l.prNo === pr.no && l.item === it.item).reduce((a, l) => a + (Number(l.qty) || 0), 0), 0)
      const received = prGrns.reduce((s, g) => s + g.lines.filter((l) => l.item === it.item).reduce((a, l) => a + (Number(l.accepted) || 0), 0), 0)
      return { ...it, ordered, received, pending: Math.max(0, it.qty - received) }
    })
    const reqTotal = lines.reduce((s, l) => s + l.qty, 0)
    const ordTotal = lines.reduce((s, l) => s + l.ordered, 0)
    const rcvTotal = lines.reduce((s, l) => s + l.received, 0)
    const hasRfq = prRfqs.length > 0
    const stage = rcvTotal >= reqTotal && reqTotal > 0 ? 'Received'
      : rcvTotal > 0 ? 'Partially Received'
      : ordTotal > 0 ? 'Ordered'
      : hasRfq ? 'In RFQ' : 'Requisitioned'
    const done = { pr: true, rfq: hasRfq, po: ordTotal > 0, grn: rcvTotal > 0 }
    return { pr, lines, reqTotal, ordTotal, rcvTotal, stage, done, rfqs: prRfqs, pos: prPos, grns: prGrns }
  }), [pos, rfqs, grns])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tracked.filter((t) => (stageFilter === 'All' || t.stage === stageFilter) &&
      (!q || `${t.pr.no} ${t.pr.dept}`.toLowerCase().includes(q)))
  }, [tracked, query, stageFilter])

  const stats = useMemo(() => ({
    total: tracked.length,
    sourcing: tracked.filter((t) => t.stage === 'Requisitioned' || t.stage === 'In RFQ').length,
    ordered: tracked.filter((t) => t.stage === 'Ordered' || t.stage === 'Partially Received').length,
    received: tracked.filter((t) => t.stage === 'Received').length,
  }), [tracked])

  const Pipe = ({ done }) => (
    <div className="pr-pipe">
      {PIPE.map((s, i) => { const Icon = s.icon; return (
        <span key={s.key} className="pr-pipe-step">
          <span className={`pr-dot ${done[s.key] ? 'on' : ''}`}><Icon size={12} /></span>
          <span className="pr-dot-lbl">{s.label}</span>
          {i < PIPE.length - 1 && <span className={`pr-line ${done[PIPE[i + 1].key] ? 'on' : ''}`} />}
        </span>
      ) })}
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>PR Status Report</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><GitBranch size={22} /></span>
          <div><h1>PR Status Report</h1><p>Trace each purchase requisition from RFQ to received goods.</p></div>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total PRs</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">Sourcing</span><strong>{stats.sourcing}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Ordered</span><strong>{stats.ordered}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Received</span><strong>{stats.received}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search PR no. or department…" /></div>
        <div className="req-filters">
          {['All', ...STAGES].map((s) => <button key={s} className={`chip ${stageFilter === s ? 'active' : ''}`} onClick={() => setStageFilter(s)}>{s}</button>)}
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table">
          <thead><tr><th>PR No.</th><th>Department</th><th>Required By</th><th>Pipeline</th><th className="num">Req</th><th className="num">Ordered</th><th className="num">Received</th><th>Stage</th><th></th></tr></thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.pr.no} className="row-click" onClick={() => setView(t)}>
                <td className="mono">{t.pr.no}</td><td>{t.pr.dept}</td><td>{t.pr.requiredBy}</td>
                <td><Pipe done={t.done} /></td>
                <td className="num">{t.reqTotal}</td><td className="num">{t.ordTotal || '—'}</td><td className="num">{t.rcvTotal || '—'}</td>
                <td><span className={`status tone-${STAGE_TONE[t.stage]}`}>{t.stage}</span></td>
                <td className="row-actions"><span className="muted">{t.rfqs[0]?.no || ''}</span></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="empty">No requisitions match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="reg-hint"><GitBranch size={13} /> Stage is derived live: a PR moves to <strong>Received</strong> once accepted GRN quantities cover the requisitioned quantity.</p>
      <footer className="content-foot">PR Status Report · Procurement · DataMart Enterprise Suite</footer>

      {view && (
        <div className="modal-overlay" onClick={() => setView(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setView(null)}><X size={18} /></button>
            <div className="modal-icon tone-blue"><GitBranch size={24} /></div>
            <h3>{view.pr.no} <span className={`status tone-${STAGE_TONE[view.stage]}`}>{view.stage}</span></h3>
            <p>{view.pr.dept} · required by {view.pr.requiredBy}</p>
            <div className="pr-docs">
              <span><FileSearch size={13} /> RFQ: {view.rfqs.map((r) => r.no).join(', ') || '—'}</span>
              <span><ClipboardList size={13} /> PO: {view.pos.map((p) => p.no).join(', ') || '—'}</span>
              <span><PackageCheck size={13} /> GRN: {view.grns.map((g) => g.no).join(', ') || '—'}</span>
            </div>
            <table className="line-tbl">
              <thead><tr><th>Item</th><th>UOM</th><th className="num">Requisitioned</th><th className="num">Ordered</th><th className="num">Received</th><th className="num">Pending</th><th></th></tr></thead>
              <tbody>
                {view.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="cell-strong">{l.item}{l.desc ? <span className="cell-sub">{l.desc}</span> : null}</td>
                    <td>{l.uom}</td><td className="num">{l.qty}</td><td className="num">{l.ordered || '—'}</td><td className="num">{l.received || '—'}</td>
                    <td className={`num ${l.pending > 0 ? '' : 'muted'}`}>{l.pending}</td>
                    <td>{l.pending === 0 && l.received > 0 ? <CheckCircle2 size={15} className="pr-ok" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setView(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
