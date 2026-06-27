import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Search, ScrollText, Download, X, LogIn, LogOut, Plus, Pencil,
  Trash2, CheckCircle2, XCircle, ShieldAlert, KeyRound, Database, FileDown,
} from 'lucide-react'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './AuditLog.css'

/*
 * System Administration → Audit Log.
 * Immutable trail of every action: who, what, where, when, from which IP and
 * the outcome. Searchable / filterable, with CSV export. In-memory demo data.
 */

const TODAY = '2026-06-25'

// action → { icon, tone } for the badge
const ACTION_META = {
  Login: { icon: LogIn, tone: 'blue' },
  Logout: { icon: LogOut, tone: 'slate' },
  Create: { icon: Plus, tone: 'green' },
  Update: { icon: Pencil, tone: 'amber' },
  Delete: { icon: Trash2, tone: 'rose' },
  Approve: { icon: CheckCircle2, tone: 'green' },
  Reject: { icon: XCircle, tone: 'rose' },
  Export: { icon: FileDown, tone: 'violet' },
  Permission: { icon: KeyRound, tone: 'violet' },
  'Failed Login': { icon: ShieldAlert, tone: 'rose' },
  Backup: { icon: Database, tone: 'teal' },
}
const SEV_TONE = { Info: 'blue', Success: 'green', Warning: 'amber', Critical: 'rose' }
const ACTIONS = Object.keys(ACTION_META)

let evSeq = 1
const ev = (ts, user, role, action, module, target, ip, severity, detail) =>
  ({ id: `EV-${String(8400 + evSeq++)}`, ts, user, role, action, module, target, ip, severity, detail })

const SEED = [
  ev('2026-06-25 10:14', 'sakhawat@scpl.com', 'Administrator', 'Permission', 'System Administration', 'Role “Sales Manager” permissions updated', '10.0.2.14', 'Warning', 'Removed Accounts (view) from Sales Manager; scoped to Sales & CRM.'),
  ev('2026-06-25 10:02', 'sarah.m@scpl.com', 'Sales Manager', 'Login', 'System Administration', 'Web session', '203.0.113.42', 'Info', 'Successful login via password + 2FA.'),
  ev('2026-06-25 09:48', 'rakib@scpl.com', 'Accounts Manager', 'Approve', 'Accounts', 'JV-1182 — Depreciation June run', '10.0.2.21', 'Success', 'Journal voucher approved · $142,000.'),
  ev('2026-06-25 09:31', 'tariq.a@scpl.com', 'Operator', 'Create', 'Procurement', 'RFQ-0042 — Plant Stores', '10.0.5.66', 'Success', 'New RFQ floated to 3 suppliers.'),
  ev('2026-06-25 09:14', 'sakhawat@scpl.com', 'Administrator', 'Login', 'System Administration', 'Web session', '10.0.2.14', 'Info', 'Successful login via password + 2FA.'),
  ev('2026-06-25 08:47', 'rakib@scpl.com', 'Accounts Manager', 'Login', 'System Administration', 'Web session', '10.0.2.21', 'Info', 'Successful login.'),
  ev('2026-06-25 08:20', 'mizanur.r@scpl.com', 'Procurement Manager', 'Update', 'Procurement', 'PO-2418 — Packaging consumables', '10.0.5.31', 'Success', 'Delivery date amended to 2026-07-05.'),
  ev('2026-06-25 07:05', 'rkhan@scpl.com', 'Operator', 'Failed Login', 'System Administration', 'Web session', '198.51.100.9', 'Critical', '5th failed attempt — account locked for 30 minutes.'),
  ev('2026-06-25 06:58', 'rkhan@scpl.com', 'Operator', 'Failed Login', 'System Administration', 'Web session', '198.51.100.9', 'Warning', 'Invalid password (attempt 4 of 5).'),
  ev('2026-06-24 17:30', 'nadia.k@scpl.com', 'Accountant', 'Export', 'Accounts', 'Trial Balance — Jun 2026', '10.0.2.23', 'Info', 'Exported to PDF.'),
  ev('2026-06-24 16:40', 'kamal.u@scpl.com', 'Operator', 'Logout', 'System Administration', 'Web session', '10.0.6.12', 'Info', 'Signed out.'),
  ev('2026-06-24 15:12', 'sakhawat@scpl.com', 'Administrator', 'Create', 'System Administration', 'User “Jane Doe” created', '10.0.2.14', 'Success', 'New user provisioned with Operator role.'),
  ev('2026-06-24 14:05', 'sakhawat@scpl.com', 'Administrator', 'Delete', 'System Administration', 'Role “Branch Auditor” removed', '10.0.2.14', 'Warning', 'Custom role deleted — 4 users reassigned.'),
  ev('2026-06-24 11:10', 'nasrin.a@scpl.com', 'Auditor', 'Export', 'Fixed Asset Management', 'Asset Register', '10.0.3.7', 'Info', 'Full register exported to CSV.'),
  ev('2026-06-24 02:00', 'system', 'System', 'Backup', 'System Administration', 'Nightly backup', '127.0.0.1', 'Success', 'Full backup completed — 2.4 GB in 6m 12s.'),
  ev('2026-06-23 16:22', 'imran.h@scpl.com', 'Storekeeper', 'Update', 'Inventory', 'Goods Issue GI-0420', '10.0.5.70', 'Success', 'Issued 42 units to WO-3380.'),
  ev('2026-06-23 10:33', 'rafiq.i@scpl.com', 'Inventory Manager', 'Approve', 'Inventory', 'Stock Adjustment ADJ-118', '10.0.5.18', 'Success', 'Write-off approved · $1,240.'),
  ev('2026-06-22 13:45', 'sakhawat@scpl.com', 'Administrator', 'Permission', 'System Administration', 'Access Control — Payroll module', '10.0.2.14', 'Warning', 'Disabled Payroll module for all roles during audit.'),
]

export default function AuditLog({ onHome, onBack }) {
  const [events] = useState(SEED)
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [sevFilter, setSevFilter] = useState('All')
  const [detail, setDetail] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((e) =>
      (actionFilter === 'All' || e.action === actionFilter) &&
      (sevFilter === 'All' || e.severity === sevFilter) &&
      (!q || `${e.user} ${e.role} ${e.module} ${e.target} ${e.ip} ${e.id}`.toLowerCase().includes(q))
    )
  }, [events, query, actionFilter, sevFilter])

  const stats = useMemo(() => ({
    total: events.length,
    today: events.filter((e) => e.ts.startsWith(TODAY)).length,
    security: events.filter((e) => e.severity === 'Critical' || e.action === 'Failed Login').length,
    logins: events.filter((e) => e.action === 'Login').length,
  }), [events])

  const exportCsv = () => {
    const head = ['Event', 'Time', 'User', 'Role', 'Action', 'Module', 'Target', 'IP', 'Severity', 'Detail']
    const rows = [head, ...filtered.map((e) => [e.id, e.ts, e.user, e.role, e.action, e.module, e.target, e.ip, e.severity, e.detail])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `audit-log-${TODAY}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const detailModal = detail && (
    <div className="modal-overlay" onClick={() => setDetail(null)}>
      <div className="modal modal-wide al-detail" onClick={(e) => e.stopPropagation()}>
        <button className="al-close" onClick={() => setDetail(null)}><X size={18} /></button>
        <div className={`modal-icon tone-${SEV_TONE[detail.severity]}`}><ScrollText size={24} /></div>
        <h3>{detail.action} · {detail.id}</h3>
        <div className="al-detail-grid">
          <div><span>When</span><strong>{detail.ts}</strong></div>
          <div><span>User</span><strong>{detail.user}</strong></div>
          <div><span>Role</span><strong>{detail.role}</strong></div>
          <div><span>Module</span><strong>{detail.module}</strong></div>
          <div><span>IP Address</span><strong>{detail.ip}</strong></div>
          <div><span>Severity</span><strong><span className={`status tone-${SEV_TONE[detail.severity]}`}>{detail.severity}</span></strong></div>
          <div className="al-detail-full"><span>Target</span><strong>{detail.target}</strong></div>
          <div className="al-detail-full"><span>Detail</span><p>{detail.detail}</p></div>
        </div>
        <div className="modal-actions"><button className="btn btn-primary" onClick={() => setDetail(null)}>Close</button></div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Audit Log</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><ScrollText size={22} /></span>
          <div><h1>Audit Log</h1><p>Immutable trail of every action and change across the suite.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-ghost" onClick={exportCsv}><Download size={16} /> Export CSV</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Events</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Today</span><strong>{stats.today}</strong></div>
        <div className="rstat tone-rose"><span className="rs-label">Security Events</span><strong>{stats.security}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Logins</span><strong>{stats.logins}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user, target, module or IP…" /></div>
        <div className="al-tool-right">
          <select className="al-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="All">All actions</option>{ACTIONS.map((a) => <option key={a}>{a}</option>)}
          </select>
          <div className="req-filters">
            {['All', 'Info', 'Success', 'Warning', 'Critical'].map((s) => <button key={s} className={`chip ${sevFilter === s ? 'active' : ''}`} onClick={() => setSevFilter(s)}>{s}</button>)}
          </div>
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table al-table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Target</th><th>IP</th><th>Severity</th></tr></thead>
          <tbody>
            {filtered.map((e) => {
              const am = ACTION_META[e.action] || { icon: ScrollText, tone: 'slate' }
              const AI = am.icon
              return (
                <tr key={e.id} className="row-click" onClick={() => setDetail(e)}>
                  <td className="al-time">{e.ts}</td>
                  <td><div className="al-user"><strong>{e.user}</strong><span>{e.role}</span></div></td>
                  <td><span className={`al-action tone-${am.tone}`}><AI size={13} /> {e.action}</span></td>
                  <td className="al-mod">{e.module}</td>
                  <td className="al-target">{e.target}</td>
                  <td className="mono al-ip">{e.ip}</td>
                  <td><span className={`status tone-${SEV_TONE[e.severity]}`}>{e.severity}</span></td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="empty">No events match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <footer className="content-foot">Audit Log · System Administration · DataMart Enterprise Suite</footer>
      {detailModal}
    </div>
  )
}
