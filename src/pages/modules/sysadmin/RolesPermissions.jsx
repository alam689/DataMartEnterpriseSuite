import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, ShieldCheck, Shield, Pencil, Copy, Trash2,
  CheckCircle2, Lock, Users, Save, KeyRound,
} from 'lucide-react'
import { modules } from '../../../data/modules.js'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './RolesPermissions.css'

/*
 * System Administration → Roles & Permissions.
 * Define roles and grant access rights via a module × action permission
 * matrix. System roles are locked (clone to customise); custom roles are
 * fully editable. In-memory demo data, matching the other admin screens.
 *   mode 'list'   → role cards
 *   mode 'editor' → permission matrix for one role
 */

// Permission scopes = the suite's modules (icon + name come straight from modules.js).
const MODULES = modules
const MODULE_KEYS = MODULES.map((m) => m.key)
const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' },
]
const ACTION_KEYS = ACTIONS.map((a) => a.key)

// Grant levels expand to a set of action keys.
const LVL = {
  full: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  noDelete: ['view', 'create', 'edit', 'approve', 'export'],
  write: ['view', 'create', 'edit'],
  viewExport: ['view', 'export'],
  view: ['view'],
}
// Build a perms map { moduleKey: [actions] } from a { moduleKey: levelName } spec.
const perm = (map) => {
  const out = {}
  MODULE_KEYS.forEach((k) => { if (map[k]) out[k] = [...LVL[map[k]]] })
  return out
}
const allLevel = (level) => { const m = {}; MODULE_KEYS.forEach((k) => { m[k] = level }); return m }

let roleSeq = 100
const SEED = [
  { id: 'r-admin', name: 'Administrator', type: 'System', desc: 'Full, unrestricted access to every module and setting.', users: 8, perms: perm(allLevel('full')) },
  { id: 'r-accountant', name: 'Accountant', type: 'System', desc: 'Finance data entry — books vouchers and runs ledgers.', users: 16,
    perms: perm({ common: 'view', accounts: 'noDelete', payroll: 'viewExport', fixedasset: 'viewExport' }) },
  { id: 'r-operator', name: 'Operator', type: 'System', desc: 'Day-to-day operational data entry across stores, purchase, production & sales.', users: 72,
    perms: perm({ common: 'view', inventory: 'write', procurement: 'write', production: 'write', sales: 'write', fleet: 'write' }) },
  { id: 'r-store', name: 'Storekeeper', type: 'System', desc: 'Inventory & goods movement; raises procurement requests.', users: 18,
    perms: perm({ common: 'view', inventory: 'write', procurement: 'noDelete', production: 'view' }) },
  // ----- Department managers: each scoped to its OWN department's module(s) + Common. No cross-department access. -----
  { id: 'r-salesmgr', name: 'Sales Manager', type: 'Custom', desc: 'Heads Sales — pipeline, orders, quotations & customers. No finance or other-department access.', users: 6,
    perms: perm({ common: 'view', sales: 'noDelete', crm: 'noDelete' }) },
  { id: 'r-acctmgr', name: 'Accounts Manager', type: 'Custom', desc: 'Heads Finance — full Accounts, plus Payroll & Fixed Assets. No sales/operations access.', users: 4,
    perms: perm({ common: 'view', accounts: 'full', payroll: 'noDelete', fixedasset: 'noDelete' }) },
  { id: 'r-procmgr', name: 'Procurement Manager', type: 'Custom', desc: 'Heads Purchase — requisitions, RFQs, POs & suppliers; stores visibility.', users: 5,
    perms: perm({ common: 'view', procurement: 'noDelete', inventory: 'noDelete' }) },
  { id: 'r-prodmgr', name: 'Production Manager', type: 'Custom', desc: 'Heads Production — work orders, BOM & shop floor; reads stock.', users: 5,
    perms: perm({ common: 'view', production: 'noDelete', inventory: 'view' }) },
  { id: 'r-invmgr', name: 'Inventory Manager', type: 'Custom', desc: 'Heads Stores — stock, warehouses & valuation; reads purchase.', users: 4,
    perms: perm({ common: 'view', inventory: 'noDelete', procurement: 'view' }) },
  { id: 'r-hrmgr', name: 'HR Manager', type: 'Custom', desc: 'Heads HR — employees, attendance, leave & recruitment; reads payroll.', users: 4,
    perms: perm({ common: 'view', hr: 'noDelete', payroll: 'view' }) },
  // ----- Cross-cutting -----
  { id: 'r-auditor', name: 'Auditor', type: 'Custom', desc: 'Read-only and export across all modules for review & compliance.', users: 6,
    perms: perm(allLevel('viewExport')) },
  { id: 'r-branchaudit', name: 'Branch Auditor', type: 'Custom', desc: 'Branch-level read & export on finance and stock.', users: 4,
    perms: perm({ accounts: 'viewExport', inventory: 'viewExport', procurement: 'viewExport', sales: 'viewExport' }) },
]

const permsCount = (role) => Object.values(role.perms).reduce((s, a) => s + a.length, 0)
const modulesCount = (role) => Object.keys(role.perms).filter((k) => role.perms[k].length).length
const deepClone = (role) => ({ ...role, perms: JSON.parse(JSON.stringify(role.perms)) })

// Checkbox that supports an indeterminate (partial) state via a ref.
function Check({ checked, indeterminate, disabled, onChange, title }) {
  return (
    <input type="checkbox" title={title} disabled={disabled} checked={checked} onChange={onChange}
      ref={(el) => { if (el) el.indeterminate = !checked && !!indeterminate }} />
  )
}

export default function RolesPermissions({ onHome, onBack }) {
  const [roles, setRoles] = useState(() => SEED)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [mode, setMode] = useState('list')
  const [draft, setDraft] = useState(null) // working copy in the editor
  const [del, setDel] = useState(null)

  const editable = draft?.type === 'Custom'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roles.filter((r) =>
      (typeFilter === 'All' || r.type === typeFilter) &&
      (!q || `${r.name} ${r.desc}`.toLowerCase().includes(q))
    )
  }, [roles, query, typeFilter])

  const stats = useMemo(() => ({
    total: roles.length,
    system: roles.filter((r) => r.type === 'System').length,
    custom: roles.filter((r) => r.type === 'Custom').length,
    users: roles.reduce((s, r) => s + r.users, 0),
  }), [roles])

  // ---- open / clone / new ----
  const openEdit = (role) => { setDraft(deepClone(role)); setMode('editor') }
  const openNew = () => { setDraft({ id: `r-new-${roleSeq++}`, name: '', type: 'Custom', desc: '', users: 0, perms: {} }); setMode('editor') }
  const uniqueName = (base) => {
    let n = base, i = 2
    while (roles.some((r) => r.name.toLowerCase() === n.toLowerCase())) { n = `${base} ${i++}` }
    return n
  }
  const cloneRole = (role) => {
    setDraft({ ...deepClone(role), id: `r-new-${roleSeq++}`, type: 'Custom', name: uniqueName(`${role.name} (Copy)`), users: 0 })
    setMode('editor')
  }
  const closeEditor = () => { setDraft(null); setMode('list') }

  // ---- matrix mutations (operate on draft.perms) ----
  const has = (mk, ak) => (draft.perms[mk] || []).includes(ak)
  const orderActions = (set) => ACTION_KEYS.filter((k) => set.has(k))
  const setPerms = (updater) => setDraft((d) => ({ ...d, perms: updater(d.perms) }))
  const togglePerm = (mk, ak) => setPerms((p) => {
    const cur = new Set(p[mk] || [])
    cur.has(ak) ? cur.delete(ak) : cur.add(ak)
    const arr = orderActions(cur)
    const np = { ...p }
    if (arr.length) np[mk] = arr; else delete np[mk]
    return np
  })
  const toggleModuleAll = (mk) => setPerms((p) => {
    const np = { ...p }
    if (ACTION_KEYS.every((k) => (p[mk] || []).includes(k))) delete np[mk]
    else np[mk] = [...ACTION_KEYS]
    return np
  })
  const toggleColumn = (ak) => setPerms((p) => {
    const every = MODULE_KEYS.every((mk) => (p[mk] || []).includes(ak))
    const np = { ...p }
    MODULE_KEYS.forEach((mk) => {
      const cur = new Set(np[mk] || [])
      every ? cur.delete(ak) : cur.add(ak)
      const arr = orderActions(cur)
      if (arr.length) np[mk] = arr; else delete np[mk]
    })
    return np
  })

  // ---- save / delete ----
  const nameTrim = draft?.name.trim() || ''
  const dupName = draft && roles.some((r) => r.id !== draft.id && r.name.toLowerCase() === nameTrim.toLowerCase())
  const canSave = editable && nameTrim && !dupName
  const save = () => {
    if (!canSave) return
    const clean = { ...draft, name: nameTrim }
    setRoles((list) => (list.some((r) => r.id === clean.id) ? list.map((r) => (r.id === clean.id ? clean : r)) : [...list, clean]))
    closeEditor()
  }
  const confirmDelete = () => { setRoles((list) => list.filter((r) => r.id !== del.id)); setDel(null) }

  // ===================== EDITOR =====================
  if (mode === 'editor' && draft) {
    const isNew = !roles.some((r) => r.id === draft.id)
    return (
      <div className="req fade-in">
        <nav className="crumbs">
          <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
          <button onClick={onBack}>System Administration</button><ChevronRight size={14} />
          <button onClick={closeEditor}>Roles &amp; Permissions</button><ChevronRight size={14} />
          <span>{isNew ? 'New Role' : draft.name}</span>
        </nav>

        <header className="req-head">
          <div className="req-title">
            <button className="back-btn" onClick={closeEditor}><ArrowLeft size={18} /></button>
            <span className="req-mark"><ShieldCheck size={22} /></span>
            <div>
              <h1>{isNew ? 'New Role' : draft.name} <span className={`status tone-${draft.type === 'System' ? 'blue' : 'teal'}`}>{draft.type === 'System' ? <Lock size={12} /> : null} {draft.type}</span></h1>
              <p>{permsCount(draft)} permissions across {modulesCount(draft)} module{modulesCount(draft) === 1 ? '' : 's'}{draft.users ? ` · ${draft.users} user${draft.users === 1 ? '' : 's'}` : ''}</p>
            </div>
          </div>
          <div className="mh-actions">
            <button className="btn btn-ghost" onClick={closeEditor}>Cancel</button>
            {!editable
              ? <button className="btn btn-primary" onClick={() => cloneRole(draft)}><Copy size={16} /> Clone to edit</button>
              : <button className="btn btn-primary" onClick={save} disabled={!canSave}><Save size={16} /> {isNew ? 'Create Role' : 'Save Changes'}</button>}
          </div>
        </header>

        {!editable && <p className="rp-lock-note"><Lock size={14} /> This is a built-in system role and can’t be edited. Use <strong>Clone to edit</strong> to create a customisable copy.</p>}

        <section className="panel form-panel">
          <div className="panel-head"><h2>Role Details</h2></div>
          <div className="form-grid rp-detail-grid">
            <label className={`fld ${editable && dupName ? 'invalid' : ''}`}><span>Role name *</span>
              <input value={draft.name} disabled={!editable} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Warehouse Supervisor" />
            </label>
            <label className="fld rp-desc"><span>Description</span>
              <input value={draft.desc} disabled={!editable} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="What this role is for…" />
            </label>
          </div>
          {editable && dupName && <p className="form-hint">A role named “{nameTrim}” already exists.</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2><KeyRound size={16} /> Permission Matrix</h2>
            {editable && <em className="req-em">— tick to grant; click a column or “All” to bulk-toggle</em>}
          </div>
          <div className="req-table-wrap">
            <table className="req-table perm-table">
              <thead>
                <tr>
                  <th className="perm-mod-h">Module</th>
                  <th className="perm-all-h">All</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className={`perm-act-h ${editable ? 'clickable' : ''}`}
                      onClick={() => editable && toggleColumn(a.key)} title={editable ? `Toggle ${a.label} for all modules` : a.label}>
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => {
                  const Icon = m.icon
                  const granted = ACTION_KEYS.filter((k) => has(m.key, k)).length
                  const allOn = granted === ACTION_KEYS.length
                  return (
                    <tr key={m.key} className={granted ? 'perm-on' : ''}>
                      <td className="perm-mod">
                        <span className="perm-mod-ic" style={{ '--c': m.accent.light }}><Icon size={15} /></span>
                        <span className="perm-mod-name">{m.name}<em>{granted ? `${granted}/${ACTION_KEYS.length}` : 'no access'}</em></span>
                      </td>
                      <td className="perm-cell perm-all">
                        <Check checked={allOn} indeterminate={granted > 0} disabled={!editable} onChange={() => toggleModuleAll(m.key)} title="Full access to this module" />
                      </td>
                      {ACTIONS.map((a) => (
                        <td key={a.key} className="perm-cell">
                          <Check checked={has(m.key, a.key)} disabled={!editable} onChange={() => togglePerm(m.key, a.key)} title={`${a.label} — ${m.name}`} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="content-foot">Roles &amp; Permissions · System Administration · DataMart Enterprise Suite</footer>
      </div>
    )
  }

  // ===================== LIST =====================
  const delModal = del && (
    <div className="modal-overlay" onClick={() => setDel(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-rose"><Trash2 size={24} /></div>
        <h3>Delete {del.name}?</h3>
        <p>This removes the role <strong>{del.name}</strong>{del.users ? <> currently assigned to <strong>{del.users} user{del.users === 1 ? '' : 's'}</strong></> : ''}. Affected users keep their accounts but lose this role’s access. This can’t be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button>
          <button className="btn btn-reject solid" onClick={confirmDelete} autoFocus><Trash2 size={16} /> Delete role</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Roles &amp; Permissions</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><ShieldCheck size={22} /></span>
          <div><h1>Roles &amp; Permissions</h1><p>Define roles and grant module &amp; action-level access rights.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-primary" onClick={openNew}><Plus size={17} /> New Role</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Roles</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">System Roles</span><strong>{stats.system}</strong></div>
        <div className="rstat tone-teal"><span className="rs-label">Custom Roles</span><strong>{stats.custom}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Users Assigned</span><strong>{stats.users}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles…" /></div>
        <div className="req-filters">
          {['All', 'System', 'Custom'].map((t) => <button key={t} className={`chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>)}
        </div>
      </div>

      <div className="role-grid">
        {filtered.map((r) => (
          <div className="role-card" key={r.id} onClick={() => openEdit(r)}>
            <div className="rc-top">
              <div className="rc-name">
                <span className={`rc-ic tone-${r.type === 'System' ? 'blue' : 'teal'}`}>{r.type === 'System' ? <Shield size={16} /> : <ShieldCheck size={16} />}</span>
                <strong>{r.name}</strong>
              </div>
              <span className={`status tone-${r.type === 'System' ? 'blue' : 'teal'}`}>{r.type === 'System' && <Lock size={11} />} {r.type}</span>
            </div>
            <p className="rc-desc">{r.desc}</p>
            <div className="rc-meta">
              <span><Users size={13} /> {r.users} user{r.users === 1 ? '' : 's'}</span>
              <span><KeyRound size={13} /> {permsCount(r)} permission{permsCount(r) === 1 ? '' : 's'}</span>
              <span><ShieldCheck size={13} /> {modulesCount(r)} module{modulesCount(r) === 1 ? '' : 's'}</span>
            </div>
            <div className="rc-foot" onClick={(e) => e.stopPropagation()}>
              <button className="row-act edit" title={r.type === 'System' ? 'View permissions' : 'Edit role'} onClick={() => openEdit(r)}><Pencil size={15} /></button>
              <button className="row-act" title="Clone role" onClick={() => cloneRole(r)}><Copy size={15} /></button>
              <button className="row-act del" title={r.type === 'System' ? 'System roles can’t be deleted' : 'Delete role'} disabled={r.type === 'System'} onClick={() => setDel(r)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="cs-empty">No roles match your filter.</p>}
      </div>

      <footer className="content-foot">Roles &amp; Permissions · System Administration · DataMart Enterprise Suite</footer>
      {delModal}
    </div>
  )
}
