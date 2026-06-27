import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Server, BadgeCheck, Copy, Eye, EyeOff, RefreshCw, KeyRound,
  CheckCircle2, Cpu, Database, HardDrive, Clock, Globe, Users, Boxes,
} from 'lucide-react'
import { modules } from '../../../data/modules.js'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './LicenseSystem.css'

/*
 * System Administration → License & System.
 * License entitlement, system health and module activation. Mostly read-only,
 * with reveal/copy key, check-for-updates and re-activate. In-memory demo data.
 */

const LICENSE = {
  product: 'DataMart Enterprise Suite',
  edition: 'Enterprise',
  key: 'DMES-ENTP-7K4Q-9XR2-1F8C-2026',
  licensedTo: 'DataMart Corp',
  seatsUsed: 128, seatsTotal: 150,
  issued: '2026-01-01', expires: '2026-12-31',
}
const SYSTEM = [
  { label: 'Version', value: 'v1.0.4', icon: Server, tone: 'blue' },
  { label: 'Environment', value: 'Production', icon: Globe, tone: 'violet' },
  { label: 'Database', value: 'Online · PostgreSQL 16', icon: Database, tone: 'green' },
  { label: 'Uptime', value: '42d 06h 18m', icon: Clock, tone: 'teal' },
  { label: 'Storage', value: '128 / 512 GB', icon: HardDrive, tone: 'amber' },
  { label: 'Server time', value: '2026-06-25 10:31 (+06)', icon: Cpu, tone: 'slate' },
]

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

export default function LicenseSystem({ onHome, onBack }) {
  const [reveal, setReveal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const [activate, setActivate] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  const daysLeft = useMemo(() => daysBetween('2026-06-25', LICENSE.expires), [])
  const seatPct = Math.round((LICENSE.seatsUsed / LICENSE.seatsTotal) * 100)
  // Show only the first and last groups; mask the middle.
  const maskedKey = useMemo(() => {
    const p = LICENSE.key.split('-')
    return [p[0], ...p.slice(1, -1).map((g) => '•'.repeat(g.length)), p[p.length - 1]].join('-')
  }, [])

  const copyKey = async () => {
    try { await navigator.clipboard.writeText(LICENSE.key); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* blocked */ }
  }
  const checkUpdates = () => {
    setChecking(true); setUpdateMsg('')
    setTimeout(() => { setChecking(false); setUpdateMsg('You’re on the latest version (v1.0.4).') }, 1400)
  }

  const activateModal = activate && (
    <div className="modal-overlay" onClick={() => setActivate(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><KeyRound size={24} /></div>
        <h3>Activate / Update License</h3>
        <p>Paste a new license key to extend seats or renew your subscription.</p>
        <label className="modal-field"><span>License key</span>
          <input value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="DMES-XXXX-XXXX-XXXX-XXXX-XXXX" autoFocus />
        </label>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setActivate(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { setActivate(false); setUpdateMsg('License key accepted — entitlements refreshed.'); setKeyInput('') }} disabled={keyInput.trim().length < 8}><CheckCircle2 size={16} /> Activate</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>License &amp; System</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Server size={22} /></span>
          <div><h1>License &amp; System</h1><p>Subscription entitlement, system health and module activation.</p></div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost" onClick={checkUpdates} disabled={checking}>{checking ? <><RefreshCw size={16} className="ls-spin" /> Checking…</> : <><RefreshCw size={16} /> Check for updates</>}</button>
          <button className="btn btn-primary" onClick={() => setActivate(true)}><KeyRound size={16} /> Activate License</button>
        </div>
      </header>

      {updateMsg && <div className="ls-flash"><CheckCircle2 size={16} /> {updateMsg}</div>}

      <div className="ls-top">
        <section className="panel ls-license">
          <div className="panel-head"><h2><BadgeCheck size={16} /> License</h2>
            <span className={`status tone-${daysLeft > 30 ? 'green' : 'amber'}`}>Active · {daysLeft} days left</span>
          </div>
          <div className="ls-lic-body">
            <div className="ls-lic-row"><span>Product</span><strong>{LICENSE.product} <em className="ls-edition">{LICENSE.edition}</em></strong></div>
            <div className="ls-lic-row"><span>Licensed to</span><strong>{LICENSE.licensedTo}</strong></div>
            <div className="ls-lic-row"><span>License key</span>
              <div className="ls-key">
                <code>{reveal ? LICENSE.key : maskedKey}</code>
                <button className="ls-key-btn" title={reveal ? 'Hide' : 'Reveal'} onClick={() => setReveal((r) => !r)}>{reveal ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button className="ls-key-btn" title="Copy" onClick={copyKey}>{copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}</button>
              </div>
            </div>
            <div className="ls-lic-row"><span>Valid</span><strong>{LICENSE.issued} → {LICENSE.expires}</strong></div>
            <div className="ls-lic-row ls-seats"><span><Users size={13} /> Seats</span>
              <div className="ls-seat-wrap">
                <div className="ls-seat-bar"><div className="ls-seat-fill" style={{ width: `${seatPct}%` }} /></div>
                <strong>{LICENSE.seatsUsed} / {LICENSE.seatsTotal} <em>({seatPct}%)</em></strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel ls-health">
          <div className="panel-head"><h2><Cpu size={16} /> System Health</h2></div>
          <div className="ls-health-grid">
            {SYSTEM.map((s) => { const I = s.icon; return (
              <div className="ls-health-card" key={s.label}>
                <span className={`ls-health-ic tone-${s.tone}`}><I size={17} /></span>
                <div><span>{s.label}</span><strong>{s.value}</strong></div>
              </div>
            ) })}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2><Boxes size={16} /> Licensed Modules</h2><span className="count">{modules.length} of {modules.length}</span></div>
        <div className="ls-mods">
          {modules.map((m) => { const I = m.icon; return (
            <div className="ls-mod" key={m.key}>
              <span className="ls-mod-ic" style={{ '--c': m.accent.light }}><I size={15} /></span>
              <span className="ls-mod-name">{m.name}</span>
              <span className="ls-mod-on"><CheckCircle2 size={14} /> Licensed</span>
            </div>
          ) })}
        </div>
      </section>

      <footer className="content-foot">License &amp; System · System Administration · DataMart Enterprise Suite</footer>
      {activateModal}
    </div>
  )
}
