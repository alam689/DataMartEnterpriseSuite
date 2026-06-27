import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Lock, KeySquare, ShieldCheck, Clock, Globe, Save, RotateCcw, CheckCircle2,
} from 'lucide-react'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './SecurityPolicy.css'

/*
 * System Administration → Security Policy.
 * Org-wide password, lockout, 2FA, session and login-restriction rules.
 * Editable form with dirty-tracking; Save applies, Reset reverts. Demo state.
 */

const DEFAULTS = {
  pw: { minLength: 10, upper: true, lower: true, number: true, symbol: true, expiryDays: 90, history: 5 },
  lockout: { maxAttempts: 5, lockoutMins: 30, resetWindowMins: 15 },
  twofa: { enforce: 'Admins only', authApp: true, sms: true, email: false },
  session: { idleMins: 30, absoluteHours: 12, maxConcurrent: 3, rememberDays: 14 },
  login: { ipRestrict: false, allowlist: '10.0.0.0/8, 203.0.113.0/24', hoursRestrict: false, from: '07:00', to: '21:00' },
}
const clone = (o) => JSON.parse(JSON.stringify(o))
const ENFORCE_OPTS = ['Off', 'Admins only', 'All users']

// Toggle switch
function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled}
      className={`sp-switch ${on ? 'on' : ''}`} onClick={onChange}><span className="sp-knob" /></button>
  )
}

export default function SecurityPolicy({ onHome, onBack }) {
  const [saved, setSaved] = useState(() => clone(DEFAULTS))
  const [draft, setDraft] = useState(() => clone(DEFAULTS))
  const [flash, setFlash] = useState(false)

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft])
  const set = (section, key, val) => setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: val } }))
  const num = (section, key, val, min, max) => set(section, key, Math.max(min, Math.min(max, Number(val) || 0)))

  const save = () => { setSaved(clone(draft)); setFlash(true); setTimeout(() => setFlash(false), 1800) }
  const reset = () => setDraft(clone(saved))
  const restoreDefaults = () => setDraft(clone(DEFAULTS))

  // Password strength score (0–100) derived from the rules.
  const strength = useMemo(() => {
    const p = draft.pw
    let s = Math.min(40, p.minLength * 3)
    s += (p.upper ? 12 : 0) + (p.lower ? 8 : 0) + (p.number ? 12 : 0) + (p.symbol ? 16 : 0)
    s += p.expiryDays > 0 && p.expiryDays <= 90 ? 8 : 0
    s += p.history >= 3 ? 4 : 0
    return Math.min(100, s)
  }, [draft.pw])
  const strengthLabel = strength >= 85 ? 'Strong' : strength >= 60 ? 'Moderate' : 'Weak'
  const strengthTone = strength >= 85 ? 'green' : strength >= 60 ? 'amber' : 'rose'

  const Row = ({ label, hint, children }) => (
    <div className="sp-row"><div className="sp-row-l"><span className="sp-row-label">{label}</span>{hint && <span className="sp-row-hint">{hint}</span>}</div><div className="sp-row-c">{children}</div></div>
  )
  const NumIn = ({ section, k, min, max, suffix }) => (
    <div className="sp-num"><input type="number" min={min} max={max} value={draft[section][k]} onChange={(e) => num(section, k, e.target.value, min, max)} />{suffix && <span>{suffix}</span>}</div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Security Policy</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Lock size={22} /></span>
          <div><h1>Security Policy</h1><p>Password, lockout, two-factor, session &amp; login-access rules for all users.</p></div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost" onClick={restoreDefaults}><RotateCcw size={16} /> Restore defaults</button>
          <button className="btn btn-ghost" onClick={reset} disabled={!dirty}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!dirty}><Save size={16} /> Save Policy</button>
        </div>
      </header>

      {flash && <div className="sp-flash"><CheckCircle2 size={16} /> Security policy saved and applied to all users.</div>}
      {dirty && !flash && <div className="sp-flash dirty">You have unsaved changes.</div>}

      <div className="sp-grid">
        <section className="panel sp-panel">
          <div className="panel-head"><h2><KeySquare size={16} /> Password Policy</h2>
            <span className={`status tone-${strengthTone}`}>{strengthLabel} · {strength}%</span>
          </div>
          <div className="sp-strength"><div className={`sp-strength-fill tone-${strengthTone}`} style={{ width: `${strength}%` }} /></div>
          <div className="sp-body">
            <Row label="Minimum length"><NumIn section="pw" k="minLength" min={6} max={32} suffix="chars" /></Row>
            <Row label="Require uppercase (A–Z)"><Toggle on={draft.pw.upper} onChange={() => set('pw', 'upper', !draft.pw.upper)} /></Row>
            <Row label="Require lowercase (a–z)"><Toggle on={draft.pw.lower} onChange={() => set('pw', 'lower', !draft.pw.lower)} /></Row>
            <Row label="Require number (0–9)"><Toggle on={draft.pw.number} onChange={() => set('pw', 'number', !draft.pw.number)} /></Row>
            <Row label="Require symbol (!@#…)"><Toggle on={draft.pw.symbol} onChange={() => set('pw', 'symbol', !draft.pw.symbol)} /></Row>
            <Row label="Expire password every" hint="0 = never"><NumIn section="pw" k="expiryDays" min={0} max={365} suffix="days" /></Row>
            <Row label="Prevent reuse of last" hint="password history"><NumIn section="pw" k="history" min={0} max={24} suffix="passwords" /></Row>
          </div>
        </section>

        <section className="panel sp-panel">
          <div className="panel-head"><h2><Lock size={16} /> Account Lockout</h2></div>
          <div className="sp-body">
            <Row label="Lock after failed attempts"><NumIn section="lockout" k="maxAttempts" min={3} max={10} suffix="tries" /></Row>
            <Row label="Lockout duration"><NumIn section="lockout" k="lockoutMins" min={1} max={1440} suffix="mins" /></Row>
            <Row label="Reset attempt counter after"><NumIn section="lockout" k="resetWindowMins" min={1} max={120} suffix="mins" /></Row>
          </div>
        </section>

        <section className="panel sp-panel">
          <div className="panel-head"><h2><ShieldCheck size={16} /> Two-Factor Authentication</h2></div>
          <div className="sp-body">
            <Row label="Enforce 2FA">
              <div className="sp-seg">{ENFORCE_OPTS.map((o) => <button key={o} className={`sp-seg-btn ${draft.twofa.enforce === o ? 'on' : ''}`} onClick={() => set('twofa', 'enforce', o)}>{o}</button>)}</div>
            </Row>
            <Row label="Authenticator app" hint="TOTP (Google / Microsoft)"><Toggle on={draft.twofa.authApp} onChange={() => set('twofa', 'authApp', !draft.twofa.authApp)} /></Row>
            <Row label="SMS code"><Toggle on={draft.twofa.sms} onChange={() => set('twofa', 'sms', !draft.twofa.sms)} /></Row>
            <Row label="Email code"><Toggle on={draft.twofa.email} onChange={() => set('twofa', 'email', !draft.twofa.email)} /></Row>
          </div>
        </section>

        <section className="panel sp-panel">
          <div className="panel-head"><h2><Clock size={16} /> Session Control</h2></div>
          <div className="sp-body">
            <Row label="Idle timeout"><NumIn section="session" k="idleMins" min={5} max={240} suffix="mins" /></Row>
            <Row label="Maximum session length"><NumIn section="session" k="absoluteHours" min={1} max={72} suffix="hours" /></Row>
            <Row label="Concurrent sessions per user"><NumIn section="session" k="maxConcurrent" min={1} max={10} suffix="sessions" /></Row>
            <Row label="“Remember me” duration"><NumIn section="session" k="rememberDays" min={0} max={90} suffix="days" /></Row>
          </div>
        </section>

        <section className="panel sp-panel sp-wide">
          <div className="panel-head"><h2><Globe size={16} /> Login Restrictions</h2></div>
          <div className="sp-body">
            <Row label="Restrict by IP / CIDR"><Toggle on={draft.login.ipRestrict} onChange={() => set('login', 'ipRestrict', !draft.login.ipRestrict)} /></Row>
            <Row label="Allowed IP ranges" hint="comma-separated">
              <input className="sp-text" value={draft.login.allowlist} disabled={!draft.login.ipRestrict} onChange={(e) => set('login', 'allowlist', e.target.value)} placeholder="10.0.0.0/8, 203.0.113.0/24" />
            </Row>
            <Row label="Restrict login hours"><Toggle on={draft.login.hoursRestrict} onChange={() => set('login', 'hoursRestrict', !draft.login.hoursRestrict)} /></Row>
            <Row label="Allowed window">
              <div className="sp-hours">
                <input type="time" value={draft.login.from} disabled={!draft.login.hoursRestrict} onChange={(e) => set('login', 'from', e.target.value)} />
                <span>to</span>
                <input type="time" value={draft.login.to} disabled={!draft.login.hoursRestrict} onChange={(e) => set('login', 'to', e.target.value)} />
              </div>
            </Row>
          </div>
        </section>
      </div>

      <footer className="content-foot">Security Policy · System Administration · DataMart Enterprise Suite</footer>
    </div>
  )
}
