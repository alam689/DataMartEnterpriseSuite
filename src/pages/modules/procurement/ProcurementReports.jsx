import { useMemo, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, BarChart3, Building, Layers, PieChart, TrendingUp,
} from 'lucide-react'
import { poStore } from '../../../data/poStore.js'
import { invoiceStore } from '../../../data/procStores.js'
import './Rfq.css'
import './Procurement.css'

const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const STATUS_TONE = { Open: 'var(--t-blue)', Sent: 'var(--t-amber)', Received: 'var(--t-violet)', Completed: 'var(--t-green)', Cancelled: 'var(--t-slate)' }

function groupSum(items, key, val) {
  const m = {}
  items.forEach((it) => { const k = it[key]; m[k] = (m[k] || 0) + val(it) })
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

function BarChart({ rows, tone }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span className="rep-label">{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, '--tc': r.tone || tone }} /></div>
          <span className="bar-val">{num(r.value)}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="cs-empty">No data yet.</p>}
    </div>
  )
}

export default function ProcurementReports({ onHome, onBack }) {
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const invoices = useSyncExternalStore(invoiceStore.subscribe, invoiceStore.getAll)

  const active = useMemo(() => pos.filter((p) => p.status !== 'Cancelled'), [pos])
  const bySupplier = useMemo(() => groupSum(active, 'supplier', (p) => p.total), [active])
  const byDept = useMemo(() => groupSum(active, 'dept', (p) => p.total), [active])
  const byStatus = useMemo(() => {
    const order = ['Open', 'Sent', 'Received', 'Completed', 'Cancelled']
    const m = {}
    pos.forEach((p) => { m[p.status] = (m[p.status] || 0) + 1 })
    return order.filter((s) => m[s]).map((s) => ({ label: s, value: m[s], tone: STATUS_TONE[s] }))
  }, [pos])

  const totalSpend = active.reduce((s, p) => s + p.total, 0)
  const payable = invoices.filter((iv) => iv.status === 'Approved').reduce((s, iv) => s + iv.invAmount, 0)
  const avgPo = active.length ? totalSpend / active.length : 0

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>Procurement Reports</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><BarChart3 size={22} /></span>
          <div><h1>Procurement Reports</h1><p>Spend analysis, supplier &amp; department breakdown and PO status.</p></div>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat tone-teal"><span className="rs-label">Committed Spend (BDT)</span><strong>{num(totalSpend)}</strong></div>
        <div className="rstat"><span className="rs-label">Active POs</span><strong>{active.length}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Avg PO Value</span><strong>{num(avgPo)}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Approved Payable</span><strong>{num(payable)}</strong></div>
      </section>

      <div className="rep-grid">
        <div className="rep-card">
          <h3><Building size={15} /> Spend by Supplier</h3>
          <BarChart rows={bySupplier} tone="var(--primary)" />
        </div>
        <div className="rep-card">
          <h3><Layers size={15} /> Spend by Department</h3>
          <BarChart rows={byDept} tone="var(--t-teal)" />
        </div>
        <div className="rep-card">
          <h3><PieChart size={15} /> PO Count by Status</h3>
          <BarChart rows={byStatus} tone="var(--t-blue)" />
        </div>
        <div className="rep-card">
          <h3><TrendingUp size={15} /> Top Suppliers by Spend</h3>
          <table className="line-tbl">
            <thead><tr><th>#</th><th>Supplier</th><th className="num">POs</th><th className="num">Spend (BDT)</th><th className="num">Share</th></tr></thead>
            <tbody>
              {bySupplier.slice(0, 6).map((r, i) => (
                <tr key={r.label}>
                  <td>{i + 1}</td><td className="cell-strong">{r.label}</td>
                  <td className="num">{active.filter((p) => p.supplier === r.label).length}</td>
                  <td className="num">{num(r.value)}</td>
                  <td className="num">{totalSpend ? ((r.value / totalSpend) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
              ))}
              {bySupplier.length === 0 && <tr><td colSpan={5} className="empty">No PO spend recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <p className="reg-hint"><BarChart3 size={13} /> Figures are computed live from the Purchase Order register and booked invoices.</p>
      <footer className="content-foot">Procurement Reports · Procurement · DataMart Enterprise Suite</footer>
    </div>
  )
}
