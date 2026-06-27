import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Search, Activity, Monitor, Smartphone, Tablet, MapPin,
  Clock, LogOut, ShieldCheck, X, Wifi,
} from 'lucide-react'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './ActiveSessions.css'

/*
 * System Administration → Active Sessions.
 * Live sessions across the suite; revoke individually or sign out all others.
 * The current session is protected. In-memory demo data.
 */

const DEV_ICON = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet }

let sSeq = 1
const sess = (user, role, device, agent, ip, location, loginAt, idleMin, current = false) =>
  ({ id: `S-${String(4100 + sSeq++)}`, user, role, device, agent, ip, location, loginAt, idleMin, current })

const SEED = [
  sess('sakhawat@scpl.com', 'Administrator', 'Desktop', 'Chrome 126 · Windows 11', '10.0.2.14', 'Dhaka, BD', '2026-06-25 09:14', 0, true),
  sess('sarah.m@scpl.com', 'Sales Manager', 'Desktop', 'Edge 126 · Windows 11', '203.0.113.42', 'Chattogram, BD', '2026-06-25 10:02', 3),
  sess('rakib@scpl.com', 'Accounts Manager', 'Desktop', 'Firefox 127 · macOS 14', '10.0.2.21', 'Dhaka, BD', '2026-06-25 08:47', 12),
  sess('tariq.a@scpl.com', 'Operator', 'Mobile', 'Safari · iOS 18', '10.0.5.66', 'Gazipur, BD', '2026-06-25 07:05', 24),
  sess('mizanur.r@scpl.com', 'Procurement Manager', 'Desktop', 'Chrome 126 · Windows 10', '10.0.5.31', 'Dhaka, BD', '2026-06-25 08:20', 41),
  sess('nadia.k@scpl.com', 'Accountant', 'Tablet', 'Chrome · Android 14', '10.0.2.23', 'Dhaka, BD', '2026-06-24 17:30', 7),
  sess('rafiq.i@scpl.com', 'Inventory Manager', 'Mobile', 'Chrome · Android 13', '10.0.5.18', 'Narayanganj, BD', '2026-06-25 06:58', 58),
  sess('nasrin.a@scpl.com', 'Auditor', 'Desktop', 'Chrome 125 · Ubuntu 24.04', '10.0.3.7', 'Dhaka, BD', '2026-06-24 11:10', 19),
]
const IDLE_THRESHOLD = 30 // mins

export default function ActiveSessions({ onHome, onBack }) {
  const [sessions, setSessions] = useState(SEED)
  const [query, setQuery] = useState('')
  const [revoke, setRevoke] = useState(null) // session pending revoke
  const [revokeAll, setRevokeAll] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sessions.filter((s) => !q || `${s.user} ${s.role} ${s.agent} ${s.ip} ${s.location}`.toLowerCase().includes(q))
  }, [sessions, query])

  const stats = useMemo(() => ({
    active: sessions.length,
    users: new Set(sessions.map((s) => s.user)).size,
    idle: sessions.filter((s) => s.idleMin >= IDLE_THRESHOLD).length,
    others: sessions.filter((s) => !s.current).length,
  }), [sessions])

  const doRevoke = () => { setSessions((l) => l.filter((s) => s.id !== revoke.id)); setRevoke(null) }
  const doRevokeAll = () => { setSessions((l) => l.filter((s) => s.current)); setRevokeAll(false) }

  const idleLabel = (m) => m === 0 ? 'active now' : m < 60 ? `${m}m idle` : `${Math.floor(m / 60)}h ${m % 60}m idle`

  const confirm = (revoke || revokeAll) && (
    <div className="modal-overlay" onClick={() => { setRevoke(null); setRevokeAll(false) }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-rose"><LogOut size={24} /></div>
        <h3>{revokeAll ? `Sign out all other sessions?` : `Revoke session?`}</h3>
        <p>{revokeAll
          ? <>This immediately signs out <strong>{stats.others} session{stats.others === 1 ? '' : 's'}</strong> on every other device. Your current session stays active.</>
          : <>This signs out <strong>{revoke.user}</strong> on {revoke.agent} ({revoke.ip}). They’ll need to log in again.</>}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => { setRevoke(null); setRevokeAll(false) }}>Cancel</button>
          <button className="btn btn-reject solid" onClick={revokeAll ? doRevokeAll : doRevoke} autoFocus><LogOut size={16} /> {revokeAll ? 'Sign out others' : 'Revoke'}</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Active Sessions</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Activity size={22} /></span>
          <div><h1>Active Sessions</h1><p>Monitor and revoke live sessions across all devices and branches.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-ghost" onClick={() => setRevokeAll(true)} disabled={stats.others === 0}><LogOut size={16} /> Sign out all others</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat tone-green"><span className="rs-label">Active Sessions</span><strong>{stats.active}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Unique Users</span><strong>{stats.users}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">Idle ≥ 30m</span><strong>{stats.idle}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">Other Devices</span><strong>{stats.others}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user, device, IP or location…" /></div>
      </div>

      <div className="as-grid">
        {filtered.map((s) => {
          const DI = DEV_ICON[s.device] || Monitor
          const idle = s.idleMin >= IDLE_THRESHOLD
          return (
            <div className={`as-card ${s.current ? 'current' : ''}`} key={s.id}>
              <div className="as-top">
                <span className="as-dev"><DI size={18} /></span>
                <div className="as-id">
                  <strong>{s.user}{s.current && <span className="as-badge">This device</span>}</strong>
                  <span>{s.role}</span>
                </div>
                {!s.current && <button className="as-revoke" title="Revoke session" onClick={() => setRevoke(s)}><X size={16} /></button>}
              </div>
              <div className="as-meta">
                <span><Monitor size={13} /> {s.agent}</span>
                <span><Wifi size={13} /> {s.ip}</span>
                <span><MapPin size={13} /> {s.location}</span>
                <span><Clock size={13} /> Signed in {s.loginAt}</span>
              </div>
              <div className="as-foot">
                <span className={`as-status ${s.current ? 'live' : idle ? 'idle' : 'on'}`}>{s.current ? <><ShieldCheck size={13} /> Current session</> : idleLabel(s.idleMin)}</span>
                {!s.current && <button className="btn btn-reject sm" onClick={() => setRevoke(s)}><LogOut size={14} /> Revoke</button>}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="cs-empty">No sessions match your search.</p>}
      </div>

      <footer className="content-foot">Active Sessions · System Administration · DataMart Enterprise Suite</footer>
      {confirm}
    </div>
  )
}
