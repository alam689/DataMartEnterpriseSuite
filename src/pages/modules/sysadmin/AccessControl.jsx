import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Search, KeyRound, ChevronDown, Lock, Database, Settings2, Upload,
  ShieldCheck, ChevronsDownUp, ChevronsUpDown,
} from 'lucide-react'
import { modules } from '../../../data/modules.js'
import { moduleHomes } from '../../../data/moduleHomes.jsx'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './AccessControl.css'

/*
 * System Administration → Access Control.
 * Module & feature-level access governance. For every module you can:
 *   - switch the whole module on/off (system-wide kill switch), and
 *   - grant each feature (sub-screen) to specific roles.
 * The Administrator role always retains access (locked). In-memory demo data.
 */

// Roles that access can be granted to (mirrors Roles & Permissions).
// Managers are department-scoped — a Sales Manager has no Accounts access, etc.
const ROLES = ['Administrator', 'Sales Manager', 'Accounts Manager', 'Procurement Manager', 'Production Manager', 'Inventory Manager', 'HR Manager', 'Accountant', 'Operator', 'Storekeeper', 'Auditor']
const ADMIN = 'Administrator'

// Sensible default role set per module — every feature inherits this initially.
// Each department manager appears ONLY in their own department's module(s) (+ Common).
const MODULE_DEFAULTS = {
  sysadmin: ['Administrator'],
  common: ['Administrator', 'Sales Manager', 'Accounts Manager', 'Procurement Manager', 'Production Manager', 'Inventory Manager', 'HR Manager', 'Accountant', 'Operator', 'Storekeeper', 'Auditor'],
  accounts: ['Administrator', 'Accounts Manager', 'Accountant', 'Auditor'],
  inventory: ['Administrator', 'Procurement Manager', 'Production Manager', 'Inventory Manager', 'Operator', 'Storekeeper', 'Auditor'],
  procurement: ['Administrator', 'Procurement Manager', 'Inventory Manager', 'Operator', 'Storekeeper', 'Auditor'],
  sales: ['Administrator', 'Sales Manager', 'Operator', 'Auditor'],
  production: ['Administrator', 'Production Manager', 'Operator', 'Storekeeper', 'Auditor'],
  hr: ['Administrator', 'HR Manager', 'Auditor'],
  payroll: ['Administrator', 'Accounts Manager', 'HR Manager', 'Accountant', 'Auditor'],
  crm: ['Administrator', 'Sales Manager', 'Auditor'],
  fixedasset: ['Administrator', 'Accounts Manager', 'Accountant', 'Auditor'],
  fleet: ['Administrator', 'Operator', 'Auditor'],
}
// 'common' has its own hub (no function tiles) — give it a representative feature set.
const COMMON_FEATURES = [
  { name: 'Master Data', icon: Database },
  { name: 'Configuration & Setup', icon: Settings2 },
  { name: 'Import / Export', icon: Upload },
]
const featuresFor = (key) =>
  moduleHomes[key]?.functions?.map((f) => ({ name: f.name, icon: f.icon })) ||
  (key === 'common' ? COMMON_FEATURES : [])

// Build the initial access map: { [moduleKey]: { enabled, features: { [name]: [roles] } } }.
const buildAccess = () => {
  const acc = {}
  modules.forEach((m) => {
    const def = [...new Set([ADMIN, ...(MODULE_DEFAULTS[m.key] || ['Manager'])])]
    acc[m.key] = { enabled: true, features: Object.fromEntries(featuresFor(m.key).map((f) => [f.name, [...def]])) }
  })
  return acc
}

export default function AccessControl({ onHome, onBack }) {
  const [access, setAccess] = useState(buildAccess)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All') // All | Enabled | Disabled
  const [open, setOpen] = useState(() => new Set()) // expanded module keys

  const rolesWithAccess = (key) => {
    const fs = access[key]?.features || {}
    return new Set(Object.values(fs).flat())
  }
  const featureRoles = (key, name) => access[key]?.features?.[name] || []

  // ---- derived list (search + filter) ----
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return modules.filter((m) => {
      const en = access[m.key]?.enabled
      if (filter === 'Enabled' && !en) return false
      if (filter === 'Disabled' && en) return false
      if (!q) return true
      const inName = m.name.toLowerCase().includes(q)
      const inFeat = featuresFor(m.key).some((f) => f.name.toLowerCase().includes(q))
      return inName || inFeat
    })
  }, [query, filter, access])

  const stats = useMemo(() => {
    const allFeatures = modules.flatMap((m) => featuresFor(m.key).map((f) => ({ key: m.key, name: f.name })))
    const restricted = allFeatures.filter((f) => (access[f.key]?.features?.[f.name] || []).length < ROLES.length).length
    return {
      enabled: modules.filter((m) => access[m.key]?.enabled).length,
      features: allFeatures.length,
      restricted,
      roles: ROLES.length,
    }
  }, [access])

  // ---- mutations ----
  const toggleModule = (key) => setAccess((a) => ({ ...a, [key]: { ...a[key], enabled: !a[key].enabled } }))
  const toggleExpand = (key) => setOpen((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
  const expandAll = () => setOpen(new Set(list.map((m) => m.key)))
  const collapseAll = () => setOpen(new Set())

  const setFeatureRoles = (key, name, updater) => setAccess((a) => ({
    ...a, [key]: { ...a[key], features: { ...a[key].features, [name]: updater(a[key].features[name] || []) } },
  }))
  const toggleFeatureRole = (key, name, role) => {
    if (role === ADMIN) return
    setFeatureRoles(key, name, (roles) => (roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]))
  }
  // Bulk: apply/remove a role across every feature in the module.
  const toggleModuleRole = (key, role) => {
    if (role === ADMIN) return
    setAccess((a) => {
      const feats = a[key].features
      const everyOn = Object.values(feats).every((roles) => roles.includes(role))
      const next = Object.fromEntries(Object.entries(feats).map(([n, roles]) => [
        n, everyOn ? roles.filter((r) => r !== role) : [...new Set([...roles, role])],
      ]))
      return { ...a, [key]: { ...a[key], features: next } }
    })
  }

  const Switch = ({ on, onClick, label }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`ac-switch ${on ? 'on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick() }}><span className="ac-knob" /></button>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Access Control</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><KeyRound size={22} /></span>
          <div><h1>Access Control</h1><p>Enable modules and grant feature-level access to roles.</p></div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost" onClick={open.size ? collapseAll : expandAll}>
            {open.size ? <><ChevronsDownUp size={16} /> Collapse all</> : <><ChevronsUpDown size={16} /> Expand all</>}
          </button>
        </div>
      </header>

      <section className="req-stats">
        <div className="rstat tone-green"><span className="rs-label">Enabled Modules</span><strong>{stats.enabled}<em className="ac-of">/ {modules.length}</em></strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Features</span><strong>{stats.features}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">Restricted Features</span><strong>{stats.restricted}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">Roles</span><strong>{stats.roles}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search module or feature…" /></div>
        <div className="req-filters">
          {['All', 'Enabled', 'Disabled'].map((f) => <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      </div>

      <div className="ac-list">
        {list.map((m) => {
          const Icon = m.icon
          const en = access[m.key].enabled
          const feats = featuresFor(m.key)
          const accessRoles = rolesWithAccess(m.key)
          const isOpen = open.has(m.key)
          return (
            <div className={`ac-mod ${en ? '' : 'off'} ${isOpen ? 'open' : ''}`} key={m.key}>
              <div className="ac-mod-head" onClick={() => toggleExpand(m.key)}>
                <ChevronDown size={17} className="ac-chev" />
                <span className="ac-mod-ic" style={{ '--c': m.accent.light }}><Icon size={17} /></span>
                <div className="ac-mod-title">
                  <strong>{m.name}{!en && <span className="status tone-slate ac-off-badge"><Lock size={11} /> Disabled</span>}</strong>
                  <span>{feats.length} feature{feats.length === 1 ? '' : 's'} · {accessRoles.size} role{accessRoles.size === 1 ? '' : 's'} with access</span>
                </div>
                <div className="ac-mod-spacer" />
                <span className="ac-switch-label">{en ? 'Enabled' : 'Off'}</span>
                <Switch on={en} onClick={() => toggleModule(m.key)} label={`Enable ${m.name}`} />
              </div>

              {isOpen && (
                <div className="ac-body">
                  <div className="ac-bulk">
                    <span className="ac-bulk-label"><ShieldCheck size={13} /> Apply to all features:</span>
                    <div className="ac-chips">
                      {ROLES.map((role) => {
                        const everyOn = feats.length > 0 && feats.every((f) => featureRoles(m.key, f.name).includes(role))
                        const someOn = feats.some((f) => featureRoles(m.key, f.name).includes(role))
                        const locked = role === ADMIN
                        return (
                          <button key={role} disabled={!en || locked}
                            className={`ac-chip ${everyOn ? 'on' : someOn ? 'part' : ''} ${locked ? 'locked' : ''}`}
                            onClick={() => toggleModuleRole(m.key, role)} title={locked ? 'Administrators always have access' : `Toggle ${role} for all features`}>
                            {locked && <Lock size={11} />} {role}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="ac-feat-list">
                    {feats.map((f) => {
                      const FIcon = f.icon
                      const roles = featureRoles(m.key, f.name)
                      return (
                        <div className="ac-feat" key={f.name}>
                          <span className="ac-feat-name"><FIcon size={15} /> {f.name}</span>
                          <span className="ac-feat-count">{roles.length === ROLES.length ? 'All roles' : `${roles.length} role${roles.length === 1 ? '' : 's'}`}</span>
                          <div className="ac-chips">
                            {ROLES.map((role) => {
                              const on = roles.includes(role)
                              const locked = role === ADMIN
                              return (
                                <button key={role} disabled={!en || locked}
                                  className={`ac-chip ${on ? 'on' : ''} ${locked ? 'locked' : ''}`}
                                  onClick={() => toggleFeatureRole(m.key, f.name, role)} title={locked ? 'Administrators always have access' : `${on ? 'Revoke' : 'Grant'} ${role}`}>
                                  {locked && <Lock size={11} />} {role}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    {feats.length === 0 && <p className="cs-empty">No features defined for this module.</p>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {list.length === 0 && <p className="cs-empty">No modules match your filter.</p>}
      </div>

      <footer className="content-foot">Access Control · System Administration · DataMart Enterprise Suite</footer>
    </div>
  )
}
