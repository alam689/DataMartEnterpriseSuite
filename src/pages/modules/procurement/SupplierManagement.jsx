import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Building, Mail, Phone, MapPin, Star,
  CreditCard, Pencil, X, CheckCircle2, Ban,
} from 'lucide-react'
import { poStore } from '../../../data/poStore.js'
import './Rfq.css'
import './Procurement.css'

const num = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const supCode = (name) => 'SUP-' + String((([...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0)) % 999) + 1).padStart(6, '0')

const CATEGORIES = ['Raw Material', 'Consumables', 'IT & Hardware', 'Services', 'Logistics', 'Packaging']
const TERMS = ['Advance', 'Net 15', 'Net 30', 'Net 45', 'Net 60']

const SEED = [
  { name: 'ACME Industrial', category: 'Raw Material', contact: 'A. Karim', email: 'sales@acme-ind.com', phone: '+880 17 1122 3344', address: 'Tongi, Gazipur', terms: 'Net 30', rating: 4, status: 'Active', since: '2022-03-10' },
  { name: 'Nexus Components', category: 'IT & Hardware', contact: 'S. Rahman', email: 'info@nexus.com', phone: '+880 18 2233 4455', address: 'Banani, Dhaka', terms: 'Net 45', rating: 5, status: 'Active', since: '2021-08-22' },
  { name: 'Orbit Logistics', category: 'Logistics', contact: 'M. Hasan', email: 'ops@orbit-log.com', phone: '+880 19 3344 5566', address: 'Chattogram Port', terms: 'Net 15', rating: 4, status: 'Active', since: '2023-01-05' },
  { name: 'BluePeak Traders', category: 'Consumables', contact: 'T. Ahmed', email: 'desk@bluepeak.com', phone: '+880 16 4455 6677', address: 'Mirpur, Dhaka', terms: 'Net 30', rating: 3, status: 'Active', since: '2023-06-18' },
  { name: 'Stellar Supplies', category: 'Packaging', contact: 'R. Chowdhury', email: 'sales@stellar.com', phone: '+880 13 5566 7788', address: 'Narayanganj', terms: 'Advance', rating: 4, status: 'Active', since: '2022-11-30' },
  { name: 'Delta Hardware', category: 'IT & Hardware', contact: 'N. Islam', email: 'hello@deltahw.com', phone: '+880 17 6677 8899', address: 'Uttara, Dhaka', terms: 'Net 30', rating: 3, status: 'On Hold', since: '2024-02-14' },
]

const Stars = ({ n }) => (
  <span className="rating">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= n ? '' : 'off'} fill={i <= n ? 'currentColor' : 'none'} />)}</span>
)

let seq = 1
const blank = () => ({ name: '', category: CATEGORIES[0], contact: '', email: '', phone: '', address: '', terms: 'Net 30', rating: 3, status: 'Active', since: new Date().toISOString().slice(0, 10) })

export default function SupplierManagement({ onHome, onBack }) {
  const pos = useSyncExternalStore(poStore.subscribe, poStore.getAll)
  const [vendors, setVendors] = useState(() => SEED.map((v, i) => ({ ...v, _id: `v${i}` })))
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [edit, setEdit] = useState(null) // vendor being added/edited (form)

  // Live PO spend per supplier from the shared store.
  const spend = useMemo(() => {
    const m = {}
    pos.forEach((p) => { if (p.status !== 'Cancelled') { m[p.supplier] = m[p.supplier] || { count: 0, value: 0 }; m[p.supplier].count += 1; m[p.supplier].value += p.total } })
    return m
  }, [pos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vendors.filter((v) => (catFilter === 'All' || v.category === catFilter) &&
      (!q || `${v.name} ${v.contact} ${v.email} ${v.category}`.toLowerCase().includes(q)))
  }, [vendors, query, catFilter])

  const stats = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter((v) => v.status === 'Active').length,
    hold: vendors.filter((v) => v.status === 'On Hold').length,
    spend: Object.values(spend).reduce((s, x) => s + x.value, 0),
  }), [vendors, spend])

  const save = () => {
    if (!edit.name.trim()) return
    setVendors((list) => {
      const exists = list.some((v) => v._id === edit._id)
      return exists ? list.map((v) => (v._id === edit._id ? edit : v)) : [...list, { ...edit, _id: edit._id }]
    })
    setEdit(null)
  }
  const openNew = () => setEdit({ ...blank(), _id: `new-${seq++}` })
  const openEdit = (v) => setEdit({ ...v })
  const toggleStatus = (v) => setVendors((list) => list.map((x) => (x._id === v._id ? { ...x, status: x.status === 'Active' ? 'On Hold' : 'Active' } : x)))

  const form = edit && (
    <div className="modal-overlay" onClick={() => setEdit(null)}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><Building size={24} /></div>
        <h3>{vendors.some((v) => v._id === edit._id) ? 'Edit Supplier' : 'New Supplier'}</h3>
        <div className="form-grid">
          <label className="fld"><span>Supplier name *</span><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Company name" /></label>
          <label className="fld"><span>Category</span><select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="fld"><span>Contact person</span><input value={edit.contact} onChange={(e) => setEdit({ ...edit, contact: e.target.value })} placeholder="Name" /></label>
          <label className="fld"><span>Payment terms</span><select value={edit.terms} onChange={(e) => setEdit({ ...edit, terms: e.target.value })}>{TERMS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="fld"><span>Email</span><input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} placeholder="email@company.com" /></label>
          <label className="fld"><span>Phone</span><input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+880 …" /></label>
          <label className="fld"><span>Address</span><input value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} placeholder="City / area" /></label>
          <label className="fld"><span>Rating</span><select value={edit.rating} onChange={(e) => setEdit({ ...edit, rating: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}</select></label>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!edit.name.trim()}><CheckCircle2 size={16} /> Save</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>Procurement</button><ChevronRight size={14} /><span>Supplier Management</span>
      </nav>
      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Building size={22} /></span>
          <div><h1>Supplier Management</h1><p>Vendor master — contacts, terms, ratings and live spend.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-primary" onClick={openNew}><Plus size={17} /> New Supplier</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Vendors</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Active</span><strong>{stats.active}</strong></div>
        <div className="rstat tone-amber"><span className="rs-label">On Hold</span><strong>{stats.hold}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">PO Spend (BDT)</span><strong>{num(stats.spend)}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search supplier, contact or email…" /></div>
        <div className="req-filters">
          {['All', ...CATEGORIES].map((c) => <button key={c} className={`chip ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>
      </div>

      <div className="vendor-grid">
        {filtered.map((v) => {
          const sp = spend[v.name] || { count: 0, value: 0 }
          return (
            <div className="vendor-card" key={v._id || v.name} onClick={() => openEdit(v)}>
              <div className="vc-top">
                <div>
                  <div className="vc-name"><Building size={15} /> {v.name}</div>
                  <div className="vc-code">{supCode(v.name)} · {v.category}</div>
                </div>
                <span className={`status tone-${v.status === 'Active' ? 'green' : 'amber'}`}>{v.status}</span>
              </div>
              <div className="vc-row"><Stars n={v.rating} /> <span className="muted">· since {v.since}</span></div>
              <div className="vc-row"><Mail size={13} /> {v.email || '—'}</div>
              <div className="vc-row"><Phone size={13} /> {v.phone || '—'}</div>
              <div className="vc-row"><MapPin size={13} /> {v.address || '—'}</div>
              <div className="vc-row"><CreditCard size={13} /> Terms: {v.terms}</div>
              <div className="vc-foot">
                <span>{sp.count} PO{sp.count === 1 ? '' : 's'} · <strong>{num(sp.value)}</strong> BDT</span>
                <span className="vc-acts" onClick={(e) => e.stopPropagation()}>
                  <button className="row-act edit" title="Edit" onClick={() => openEdit(v)}><Pencil size={15} /></button>
                  <button className="row-act" title={v.status === 'Active' ? 'Put on hold' : 'Activate'} onClick={() => toggleStatus(v)}>{v.status === 'Active' ? <Ban size={15} /> : <CheckCircle2 size={15} />}</button>
                </span>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="cs-empty">No suppliers match your filter.</p>}
      </div>

      <footer className="content-foot">Supplier Management · Procurement · DataMart Enterprise Suite</footer>
      {form}
    </div>
  )
}
