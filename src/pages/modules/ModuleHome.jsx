import { ChevronRight, ArrowUpRight, Clock4, BarChart3 } from 'lucide-react'
import { modules } from '../../data/modules.js'
import { moduleHomes } from '../../data/moduleHomes.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import './ModuleHome.css'

/*
 * Generic module HOME (landing) screen — overview only, no detail screens.
 * Pulls the module meta from modules.js and its content from moduleHomes.jsx.
 */
export default function ModuleHome({ moduleKey, onHome, onOpen }) {
  const { theme } = useTheme()
  const mod = modules.find((m) => m.key === moduleKey)
  const cfg = moduleHomes[moduleKey]
  if (!mod || !cfg) return null

  const accent = mod.accent[theme]

  return (
    <div className="mh fade-in" style={{ '--mod-accent': accent }}>
      {/* Breadcrumb */}
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button>
        <ChevronRight size={14} />
        <span>{mod.name}</span>
      </nav>

      {/* Header */}
      <header className="mh-head">
        <div className="mh-title">
          <span className="mh-mark"><mod.icon size={24} /></span>
          <div>
            <h1>{mod.name}</h1>
            <p>{mod.desc}</p>
          </div>
        </div>
        <div className="mh-actions">
          {cfg.actions.map((a) => {
            const Icon = a.icon
            return (
              <button key={a.label} className={`btn ${a.primary ? 'btn-primary' : 'btn-ghost'}`}>
                <Icon size={17} /> {a.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* KPI strip */}
      <section className="mh-kpis">
        {cfg.kpis.map((k) => (
          <div key={k.label} className={`mh-kpi tone-${k.tone}`}>
            <span className="mk-label">{k.label}</span>
            <span className="mk-value">{k.value}</span>
            <span className="mk-sub">{k.sub}</span>
          </div>
        ))}
      </section>

      {/* Function tiles */}
      <div className="section-head">
        <div className="section-title"><h2>What would you like to do?</h2></div>
      </div>
      <section className="mh-fn-grid">
        {cfg.functions.map((f) => {
          const Icon = f.icon
          return (
            <button
              key={f.name}
              className="fn-card"
              style={{ '--accent': f.accent }}
              onClick={() => f.screen && onOpen?.(f.screen)}
            >
              <span className="fn-icon"><Icon size={21} /></span>
              <div className="fn-body">
                <h3>{f.name}</h3>
                <p>{f.desc}</p>
              </div>
              <div className="fn-foot">
                <span className="fn-count">{f.count}</span>
                <ArrowUpRight size={16} className="fn-go" />
              </div>
            </button>
          )
        })}
      </section>

      {/* Two-column: worklist + side panels */}
      <section className="mh-cols">
        <div className="panel">
          <div className="panel-head">
            <h2><cfg.queue.icon size={17} /> {cfg.queue.title}</h2>
            <span className="count">{cfg.queue.items.length}</span>
          </div>
          <div className="queue">
            {cfg.queue.items.map((it) => (
              <div key={it.ref} className={`q-row tone-${it.tone}`}>
                <span className="q-ref">{it.ref}</span>
                <div className="q-body">
                  <strong>{it.title}</strong>
                  <span>{it.sub}</span>
                </div>
                <span className="q-val">{it.value}</span>
                <span className="q-status">{it.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mh-side">
          <div className="panel">
            <div className="panel-head"><h2><BarChart3 size={17} /> {cfg.bars.title}</h2></div>
            <div className="bars">
              {cfg.bars.items.map((b) => (
                <div key={b.name} className="bar-row">
                  <div className="bar-info"><span>{b.name}</span><strong>{b.value}</strong></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${b.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2><Clock4 size={17} /> Recent Activity</h2></div>
            <div className="act-feed">
              {cfg.feed.map((a, i) => {
                const Icon = a.icon
                return (
                  <div key={i} className={`feed-row tone-${a.tone}`}>
                    <span className="feed-ic"><Icon size={16} /></span>
                    <div className="feed-body"><span>{a.text}</span><em>{a.when}</em></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="content-foot">{mod.name} · DataMart Enterprise Suite</footer>
    </div>
  )
}
