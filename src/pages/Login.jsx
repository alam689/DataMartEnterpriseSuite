import { useState } from 'react'
import {
  Database, Eye, EyeOff, Mail, Lock, Building2, Moon, Sun, ArrowRight, ShieldCheck,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { modules } from '../data/modules.js'
import './Login.css'

export default function Login({ onLogin }) {
  const { theme, toggleTheme } = useTheme()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ company: 'DataMart Corp', email: 'admin@datamart.com', password: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulated auth — wire to your API here.
    setTimeout(() => {
      onLogin({ name: 'Administrator', email: form.email, company: form.company })
    }, 650)
  }

  return (
    <div className="login-wrap">
      {/* ---------- Brand / showcase panel ---------- */}
      <aside className="login-brand">
        <div className="brand-overlay" />
        <div className="brand-top">
          <div className="brand-logo">
            <Database size={22} />
            <span>DataMart<strong> Enterprise Suite</strong></span>
          </div>
        </div>

        <div className="brand-mid">
          <h1>One platform.<br />Every part of your business.</h1>
          <p>
            A unified, eye-comfortable ERP — from finance and inventory to
            production, HR, CRM and fleet. Designed to be calm to work in, all day.
          </p>

          <div className="brand-modules">
            {modules.slice(0, 12).map((m) => {
              const Icon = m.icon
              return (
                <span key={m.key} className="brand-chip" style={{ '--c': m.accent[theme] }}>
                  <Icon size={15} /> {m.short}
                </span>
              )
            })}
          </div>
        </div>

        <div className="brand-foot">
          <ShieldCheck size={15} /> Bank-grade security · Role-based access · Full audit trail
        </div>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="login-form-panel">
        <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <form className="login-card fade-in" onSubmit={submit}>
          <div className="lc-head">
            <div className="lc-mark"><Database size={20} /></div>
            <h2>Welcome back</h2>
            <p>Sign in to your enterprise workspace</p>
          </div>

          <label className="field">
            <span>Company</span>
            <div className="field-input">
              <Building2 size={17} />
              <input value={form.company} onChange={update('company')} placeholder="Your company" />
            </div>
          </label>

          <label className="field">
            <span>Email address</span>
            <div className="field-input">
              <Mail size={17} />
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@company.com"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="field-input">
              <Lock size={17} />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label="Show password">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <div className="lc-row">
            <label className="remember">
              <input type="checkbox" defaultChecked /> <span>Remember me</span>
            </label>
            <a className="link" href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </div>

          <button className="btn btn-primary lc-submit" disabled={loading}>
            {loading ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}
          </button>

          <p className="lc-hint">Demo build — any password signs you in.</p>
        </form>

        <footer className="login-foot">© 2026 DataMart Enterprise Suite · v1.0</footer>
      </main>
    </div>
  )
}
