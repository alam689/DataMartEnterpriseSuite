import { useMemo, useState } from 'react'
import {
  LayoutGrid, ChevronRight, ArrowUpRight, Search, Upload, Plus, Database, Settings2,
  Boxes, Contact, Building, Truck, Users, BookOpen, Ruler, Warehouse, Percent, Coins,
  Landmark, Tag, FolderTree, CalendarClock, Building2, Globe, Network, Hash, GitBranch,
  Bell, ShieldCheck, Layers,
} from 'lucide-react'
import { modules } from '../../data/modules.js'
import { useTheme } from '../../context/ThemeContext.jsx'
import './CommonApp.css'

/*
 * Common Application — shared MASTER DATA & SETUP hub.
 * Overview only (no detail screens). Each master shows the modules that
 * consume it via "used in" chips, making cross-module reuse explicit.
 */

// Shared master tables. `usedIn` = module keys that consume this master.
const masters = [
  { key: 'item', name: 'Item Master', desc: 'Goods, products & services with units and barcodes.', icon: Boxes, accent: '#cf8a3c', count: '2,431', usedIn: ['inventory', 'sales', 'procurement', 'production'] },
  { key: 'customer', name: 'Customer Master', desc: 'Buyers, billing/shipping, credit terms & contacts.', icon: Contact, accent: '#3fae8e', count: '512', usedIn: ['sales', 'crm', 'accounts'] },
  { key: 'supplier', name: 'Supplier Master', desc: 'Vendors, payment terms, ratings & contracts.', icon: Building, accent: '#b574c2', count: '186', usedIn: ['procurement', 'accounts', 'inventory'] },
  { key: 'vehicle', name: 'Vehicle Master', desc: 'Fleet vehicles, specifications & documents.', icon: Truck, accent: '#c28f3f', count: '64', usedIn: ['fleet'] },
  { key: 'employee', name: 'Employee Master', desc: 'Staff profiles, IDs, grades & departments.', icon: Users, accent: '#5ba3c2', count: '742', usedIn: ['hr', 'payroll', 'production'] },
  { key: 'coa', name: 'Chart of Accounts', desc: 'Ledger account heads & grouping hierarchy.', icon: BookOpen, accent: '#3f8fd1', count: '420', usedIn: ['accounts', 'fixedasset', 'payroll'] },
  { key: 'uom', name: 'Unit of Measure', desc: 'Units, packs & conversion factors.', icon: Ruler, accent: '#6aa36a', count: '38', usedIn: ['inventory', 'sales', 'procurement', 'production'] },
  { key: 'warehouse', name: 'Warehouse / Location', desc: 'Stores, bins, sites & geo-locations.', icon: Warehouse, accent: '#7d8ad1', count: '9', usedIn: ['inventory', 'procurement', 'production'] },
  { key: 'tax', name: 'Tax / VAT Setup', desc: 'Tax codes, rates & applicability rules.', icon: Percent, accent: '#c66262', count: '14', usedIn: ['accounts', 'sales', 'procurement'] },
  { key: 'currency', name: 'Currency & Exchange', desc: 'Currencies and daily exchange rates.', icon: Coins, accent: '#cf8a3c', count: '12', usedIn: ['accounts', 'sales', 'procurement'] },
  { key: 'bank', name: 'Bank & Cash Master', desc: 'Bank accounts, branches & cash books.', icon: Landmark, accent: '#3f8fd1', count: '8', usedIn: ['accounts', 'payroll'] },
  { key: 'price', name: 'Price List', desc: 'Sales & purchase price lists and schemes.', icon: Tag, accent: '#d1738f', count: '6', usedIn: ['sales', 'procurement'] },
  { key: 'category', name: 'Category & Brand', desc: 'Item groups, sub-groups & brands.', icon: FolderTree, accent: '#3fae8e', count: '56', usedIn: ['inventory', 'sales'] },
  { key: 'terms', name: 'Payment Terms', desc: 'Credit days, milestones & due rules.', icon: CalendarClock, accent: '#8a6fd0', count: '10', usedIn: ['sales', 'procurement', 'accounts'] },
  { key: 'costcenter', name: 'Cost Center', desc: 'Departments & centers for cost allocation.', icon: Building2, accent: '#5ba3c2', count: '24', usedIn: ['accounts', 'production', 'hr'] },
  { key: 'geo', name: 'Geography', desc: 'Country, state, city & territory.', icon: Globe, accent: '#6aa36a', count: '180', usedIn: ['sales', 'crm', 'hr'] },
]

// Cross-cutting configuration & setup.
const setups = [
  { key: 'company', name: 'Company Setup', desc: 'Company profile, logo, address & tax IDs.', icon: Building2, accent: '#3f8fd1' },
  { key: 'branch', name: 'Branch / Division', desc: 'Multi-branch and division structure.', icon: Network, accent: '#3fae8e' },
  { key: 'fy', name: 'Financial Year', desc: 'Accounting periods & year-end control.', icon: CalendarClock, accent: '#cf8a3c' },
  { key: 'numbering', name: 'Document Numbering', desc: 'Voucher & document number series.', icon: Hash, accent: '#8a6fd0' },
  { key: 'workflow', name: 'Approval Workflow', desc: 'Multi-level approval routing & limits.', icon: GitBranch, accent: '#c2882f' },
  { key: 'locale', name: 'Localization', desc: 'Date, number, language & format.', icon: Globe, accent: '#5ba3c2' },
  { key: 'notify', name: 'Notification Templates', desc: 'Email / SMS alerts & templates.', icon: Bell, accent: '#d1738f' },
  { key: 'audit', name: 'Audit Preferences', desc: 'Logging, retention & data policy.', icon: ShieldCheck, accent: '#6aa36a' },
]

const stats = [
  { label: 'Master Tables', value: '16', icon: Database },
  { label: 'Total Records', value: '4,800+', icon: Layers },
  { label: 'Setup Areas', value: '8', icon: Settings2 },
  { label: 'Modules Served', value: '10', icon: LayoutGrid },
]

export default function CommonApp({ onHome }) {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const modByKey = useMemo(() => Object.fromEntries(modules.map((m) => [m.key, m])), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return masters
    return masters.filter((m) => (m.name + m.desc).toLowerCase().includes(q))
  }, [query])

  return (
    <div className="ca fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button>
        <ChevronRight size={14} />
        <span>Common Application</span>
      </nav>

      <header className="mh-head">
        <div className="mh-title">
          <span className="ca-mark"><LayoutGrid size={24} /></span>
          <div>
            <h1>Common Application</h1>
            <p>Shared master data &amp; setup that powers every module across the suite.</p>
          </div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-ghost"><Upload size={17} /> Import / Export</button>
          <button className="btn btn-primary"><Plus size={17} /> New Record</button>
        </div>
      </header>

      {/* Summary strip */}
      <section className="ca-stats">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="ca-stat">
              <span className="ca-stat-ic"><Icon size={19} /></span>
              <div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* Master data */}
      <div className="section-head">
        <div className="section-title"><Database size={18} /><h2>Master Data</h2>
          <span className="count">{filtered.length} of {masters.length}</span>
        </div>
        <div className="ca-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter masters…" />
        </div>
      </div>

      <section className="ca-grid">
        {filtered.map((m) => {
          const Icon = m.icon
          return (
            <button key={m.key} className="ca-card" style={{ '--accent': m.accent }}>
              <div className="ca-card-top">
                <span className="ca-icon"><Icon size={20} /></span>
                <span className="ca-count">{m.count}</span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
              <div className="ca-usedin">
                <span className="usedin-label">Used in</span>
                <div className="usedin-chips">
                  {m.usedIn.map((k) => {
                    const mod = modByKey[k]
                    if (!mod) return null
                    return (
                      <span key={k} className="usedin-chip" style={{ '--c': mod.accent[theme] }}>
                        {mod.short}
                      </span>
                    )
                  })}
                </div>
              </div>
              <ArrowUpRight className="ca-go" size={16} />
            </button>
          )
        })}
      </section>

      {/* Configuration & setup */}
      <div className="section-head">
        <div className="section-title"><Settings2 size={18} /><h2>Configuration &amp; Setup</h2></div>
      </div>
      <section className="ca-setup-grid">
        {setups.map((s) => {
          const Icon = s.icon
          return (
            <button key={s.key} className="setup-card" style={{ '--accent': s.accent }}>
              <span className="setup-icon"><Icon size={19} /></span>
              <div>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </div>
              <ChevronRight size={17} className="setup-go" />
            </button>
          )
        })}
      </section>

      <footer className="content-foot">Common Application · DataMart Enterprise Suite</footer>
    </div>
  )
}
