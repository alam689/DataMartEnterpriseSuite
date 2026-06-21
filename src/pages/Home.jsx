import { useMemo, useState } from 'react'
import {
  Database, Search, Bell, Moon, Sun, LogOut, Menu, ChevronRight, ChevronDown,
  LayoutDashboard, Settings, HelpCircle, ArrowUpRight, CalendarDays, Grid3x3, Eye, EyeOff,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { modules } from '../data/modules.js'
import { moduleHomes } from '../data/moduleHomes.jsx'
import ModuleHome from './modules/ModuleHome.jsx'
import CommonApp from './modules/CommonApp.jsx'
import Requisition from './modules/procurement/Requisition.jsx'
import Rfq from './modules/procurement/Rfq.jsx'
import './Home.css'

// Modules rendered via the generic ModuleHome ('common' has its own hub screen).
const moduleHomeKeys = new Set(Object.keys(moduleHomes))

const summary = [
  { label: 'Revenue (MTD)', value: '$1.24M', delta: '+8.6%', up: true },
  { label: 'Open Orders', value: '316', delta: '+12', up: true },
  { label: 'Inventory Value', value: '$4.8M', delta: '-1.2%', up: false },
  { label: 'Headcount', value: '742', delta: '+9', up: true },
]

const activity = [
  { who: 'Procurement', what: 'PO #PO-2418 approved', when: '4m ago', mod: 'procurement' },
  { who: 'Sales', what: 'Invoice INV-90231 generated', when: '21m ago', mod: 'sales' },
  { who: 'HR', what: '3 leave requests pending', when: '1h ago', mod: 'hr' },
  { who: 'Accounts', what: 'Month-end voucher posted', when: '2h ago', mod: 'accounts' },
  { who: 'Fleet', what: 'Vehicle DH-1129 service due', when: '3h ago', mod: 'fleet' },
]

export default function Home({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('dashboard')
  // Sub-screen open within a module (e.g. 'requisition' inside Procurement); null = module home.
  const [sub, setSub] = useState(null)
  // Modules are hidden by default for a clean landing view; users reveal them on demand.
  const [showModules, setShowModules] = useState(false)

  // Switching modules always returns to the module's home view.
  const selectModule = (key) => { setActive(key); setSub(null) }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return modules
    return modules.filter((m) => (m.name + m.desc + m.short).toLowerCase().includes(q))
  }, [query])

  const accentOf = (m) => m.accent[theme]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      {/* ---------------- Sidebar ---------------- */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-mark"><Database size={20} /></div>
          {!collapsed && <span className="sb-name">DataMart<strong>Suite</strong></span>}
        </div>

        <button
          className={`sb-link ${active === 'dashboard' ? 'active' : ''}`}
          onClick={() => selectModule('dashboard')}
        >
          <LayoutDashboard size={19} />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <div className="sb-section">{!collapsed && 'Modules'}</div>
        <nav className="sb-nav">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.key}
                className={`sb-link ${active === m.key ? 'active' : ''}`}
                onClick={() => selectModule(m.key)}
                title={m.name}
                style={{ '--accent': accentOf(m) }}
              >
                <span className="sb-ic"><Icon size={18} /></span>
                {!collapsed && <span className="sb-text">{m.name}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sb-foot">
          <button className="sb-link"><Settings size={18} />{!collapsed && <span>Settings</span>}</button>
          <button className="sb-link"><HelpCircle size={18} />{!collapsed && <span>Help & Support</span>}</button>
        </div>
      </aside>

      {/* ---------------- Main ---------------- */}
      <div className="main">
        {/* Top bar */}
        <header className="topbar">
          <button className="icon-btn" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>

          <div className="search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules, screens, records…"
            />
            <kbd>Ctrl K</kbd>
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-btn notif" aria-label="Notifications">
              <Bell size={18} />
              <span className="dot" />
            </button>
            <div className="profile">
              <div className="avatar">{(user.name || 'A').charAt(0)}</div>
              <div className="profile-meta">
                <strong>{user.name}</strong>
                <span>{user.company}</span>
              </div>
              <button className="icon-btn logout" onClick={onLogout} aria-label="Sign out" title="Sign out">
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="content">
          {active === 'procurement' && sub === 'requisition' ? (
            <Requisition onHome={() => selectModule('dashboard')} onBack={() => setSub(null)} />
          ) : active === 'procurement' && sub === 'rfq' ? (
            <Rfq onHome={() => selectModule('dashboard')} onBack={() => setSub(null)} />
          ) : active === 'common' ? (
            <CommonApp onHome={() => selectModule('dashboard')} />
          ) : moduleHomeKeys.has(active) ? (
            <ModuleHome moduleKey={active} onHome={() => selectModule('dashboard')} onOpen={setSub} />
          ) : (
          <div className="fade-in">
          <div className="welcome">
            <div>
              <h1>Good day, {user.name.split(' ')[0]} 👋</h1>
              <p className="welcome-sub"><CalendarDays size={15} /> {today}</p>
            </div>
            <button className="btn btn-primary">Quick Actions <ChevronRight size={17} /></button>
          </div>

          {/* KPI strip */}
          <section className="kpis">
            {summary.map((k) => (
              <div key={k.label} className="kpi">
                <span className="kpi-label">{k.label}</span>
                <div className="kpi-row">
                  <span className="kpi-value">{k.value}</span>
                  <span className={`kpi-delta ${k.up ? 'up' : 'down'}`}>{k.delta}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Modules — collapsed by default for a clean landing; a search auto-reveals them */}
          {(() => {
            const modulesOpen = showModules || query.trim() !== ''
            return (
              <>
                <div className="section-head">
                  <div className="section-title">
                    <Grid3x3 size={18} />
                    <h2>Modules</h2>
                    <span className="count">{modulesOpen ? `${filtered.length} of ${modules.length}` : `${modules.length} available`}</span>
                  </div>
                  <button
                    className="toggle-modules"
                    onClick={() => setShowModules((s) => !s)}
                    aria-expanded={modulesOpen}
                  >
                    {modulesOpen ? <EyeOff size={16} /> : <Eye size={16} />}
                    {modulesOpen ? 'Hide modules' : 'Show modules'}
                    <ChevronDown size={16} className={`chev ${modulesOpen ? 'open' : ''}`} />
                  </button>
                </div>

                {modulesOpen ? (
                  <section className="grid">
                    {filtered.map((m) => {
                      const Icon = m.icon
                      return (
                        <button
                          key={m.key}
                          className="card"
                          style={{ '--accent': accentOf(m), '--accent-soft': m.accent.soft }}
                          onClick={() => selectModule(m.key)}
                        >
                          <div className="card-top">
                            <span className="card-icon"><Icon size={22} /></span>
                            <ArrowUpRight className="card-go" size={18} />
                          </div>
                          <h3>{m.name}</h3>
                          <p>{m.desc}</p>
                          <div className="card-stats">
                            {m.stats.map((s) => (
                              <div key={s.label} className="stat">
                                <strong>{s.value}</strong>
                                <span>{s.label}</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </section>
                ) : (
                  <button className="modules-collapsed" onClick={() => setShowModules(true)}>
                    <Grid3x3 size={20} />
                    <div>
                      <strong>{modules.length} modules ready</strong>
                      <span>Your workspace is set up. Click to browse all modules.</span>
                    </div>
                    <ChevronDown size={18} className="chev" />
                  </button>
                )}
              </>
            )
          })()}

          {/* Activity */}
          <div className="section-head"><h2>Recent activity</h2></div>
          <section className="activity">
            {activity.map((a, i) => {
              const m = modules.find((x) => x.key === a.mod)
              const Icon = m.icon
              return (
                <div key={i} className="act-row" style={{ '--accent': accentOf(m), '--accent-soft': m.accent.soft }}>
                  <span className="act-ic"><Icon size={17} /></span>
                  <div className="act-body">
                    <strong>{a.what}</strong>
                    <span>{a.who}</span>
                  </div>
                  <span className="act-when">{a.when}</span>
                </div>
              )
            })}
          </section>

          <footer className="content-foot">© 2026 DataMart Enterprise Suite · Designed for all-day comfort</footer>
          </div>
          )}
        </main>
      </div>
    </div>
  )
}
