import { useMemo, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Plus, Search, Users, Mail, Phone, Pencil, Trash2,
  KeyRound, Lock, Unlock, CheckCircle2, Ban, Shield, ShieldCheck, Copy, X,
} from 'lucide-react'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './UserManagement.css'

/*
 * System Administration → User Management.
 * Full CRUD over application users: create, edit, deactivate/activate,
 * lock/unlock, reset password and delete. In-memory demo data, matching the
 * convention of the procurement master screens (local state seeded once).
 */

const TODAY = new Date().toISOString().slice(0, 10)

// Managers are department-scoped (a Sales Manager has no Accounts access, etc.) — see Roles & Permissions.
const ROLES = ['Administrator', 'Sales Manager', 'Accounts Manager', 'Procurement Manager', 'Production Manager', 'Inventory Manager', 'HR Manager', 'Accountant', 'Operator', 'Storekeeper', 'Auditor']
const DEPARTMENTS = ['IT', 'Finance', 'HR', 'Sales', 'Procurement', 'Production', 'Plant Stores', 'Inventory', 'Maintenance', 'Admin']
const STATUSES = ['Active', 'Inactive', 'Locked']

// Role → colour tone (reuses the shared .status tone palette).
const ROLE_TONE = {
  Administrator: 'rose',
  'Sales Manager': 'blue', 'Accounts Manager': 'teal', 'Procurement Manager': 'violet',
  'Production Manager': 'amber', 'Inventory Manager': 'green', 'HR Manager': 'slate',
  Accountant: 'teal', Operator: 'green', Storekeeper: 'amber', Auditor: 'violet',
}
const STATUS_TONE = { Active: 'green', Inactive: 'slate', Locked: 'rose' }

const SEED = [
  { name: 'Sakhawat Hossain', username: 'sakhawat', email: 'sakhawat@scpl.com', phone: '+880 17 1000 0001', role: 'Administrator', dept: 'IT', status: 'Active', lastLogin: '2026-06-25 09:14', created: '2021-02-10', twoFA: true, mustReset: false },
  { name: 'Rakib Khan', username: 'rakib', email: 'rakib@scpl.com', phone: '+880 18 2000 0002', role: 'Accounts Manager', dept: 'Finance', status: 'Active', lastLogin: '2026-06-25 08:47', created: '2021-06-22', twoFA: true, mustReset: false },
  { name: 'Nadia Karim', username: 'nadiak', email: 'nadia.k@scpl.com', phone: '+880 19 3000 0003', role: 'Accountant', dept: 'Finance', status: 'Active', lastLogin: '2026-06-24 17:30', created: '2022-01-15', twoFA: false, mustReset: false },
  { name: 'Tariq Ahmed', username: 'tariqa', email: 'tariq.a@scpl.com', phone: '+880 16 4000 0004', role: 'Operator', dept: 'Plant Stores', status: 'Active', lastLogin: '2026-06-25 07:05', created: '2022-09-03', twoFA: false, mustReset: true },
  { name: 'Imran Hossain', username: 'imranh', email: 'imran.h@scpl.com', phone: '+880 13 5000 0005', role: 'Storekeeper', dept: 'Plant Stores', status: 'Active', lastLogin: '2026-06-23 14:22', created: '2023-03-19', twoFA: false, mustReset: false },
  { name: 'Sarah Mahmud', username: 'sarahm', email: 'sarah.m@scpl.com', phone: '+880 17 6000 0006', role: 'Sales Manager', dept: 'Sales', status: 'Active', lastLogin: '2026-06-25 10:02', created: '2021-11-28', twoFA: true, mustReset: false },
  { name: 'R. Khan', username: 'rkhan', email: 'r.khan@scpl.com', phone: '+880 18 7000 0007', role: 'Operator', dept: 'Production', status: 'Locked', lastLogin: '2026-06-25 06:48', created: '2023-07-11', twoFA: false, mustReset: false },
  { name: 'Nasrin Akter', username: 'nasrina', email: 'nasrin.a@scpl.com', phone: '+880 19 8000 0008', role: 'Auditor', dept: 'Admin', status: 'Active', lastLogin: '2026-06-22 11:10', created: '2022-05-30', twoFA: true, mustReset: false },
  { name: 'Kamal Uddin', username: 'kamalu', email: 'kamal.u@scpl.com', phone: '+880 16 9000 0009', role: 'Operator', dept: 'Maintenance', status: 'Inactive', lastLogin: '2026-04-30 16:40', created: '2023-10-02', twoFA: false, mustReset: false },
  { name: 'Farzana Yasmin', username: 'farzanay', email: 'farzana.y@scpl.com', phone: '+880 13 1100 0010', role: 'Accountant', dept: 'Finance', status: 'Active', lastLogin: '2026-06-24 09:55', created: '2024-01-08', twoFA: false, mustReset: false },
  { name: 'Mizanur Rahman', username: 'mizanurr', email: 'mizanur.r@scpl.com', phone: '+880 17 1200 0011', role: 'Procurement Manager', dept: 'Procurement', status: 'Active', lastLogin: '2026-06-25 08:20', created: '2022-07-12', twoFA: true, mustReset: false },
  { name: 'Shahed Ali', username: 'shaheda', email: 'shahed.a@scpl.com', phone: '+880 18 1300 0012', role: 'Production Manager', dept: 'Production', status: 'Active', lastLogin: '2026-06-25 07:48', created: '2022-10-05', twoFA: false, mustReset: false },
  { name: 'Tania Sultana', username: 'tanias', email: 'tania.s@scpl.com', phone: '+880 19 1400 0013', role: 'HR Manager', dept: 'HR', status: 'Active', lastLogin: '2026-06-24 16:12', created: '2023-02-20', twoFA: true, mustReset: false },
  { name: 'Rafiq Islam', username: 'rafiqi', email: 'rafiq.i@scpl.com', phone: '+880 16 1500 0014', role: 'Inventory Manager', dept: 'Inventory', status: 'Active', lastLogin: '2026-06-23 10:33', created: '2023-05-14', twoFA: false, mustReset: false },
]

let uidSeq = 1
const blankUser = () => ({
  name: '', username: '', email: '', phone: '', role: 'Operator', dept: 'IT',
  status: 'Active', lastLogin: '—', created: TODAY, twoFA: false, mustReset: true,
})
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
const suggestUsername = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14)
const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
// Readable temporary password for the reset flow.
const genPassword = () => {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ', a = 'abcdefghijkmnpqrstuvwxyz', d = '23456789', s = '@#$%&*'
  const pick = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('')
  return pick(A, 2) + pick(a, 4) + pick(d, 3) + pick(s, 1)
}

export default function UserManagement({ onHome, onBack }) {
  const [users, setUsers] = useState(() => SEED.map((u, i) => ({ ...u, _id: `u${i}` })))
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [edit, setEdit] = useState(null)        // user form (add/edit)
  const [reset, setReset] = useState(null)       // { user, pw, copied }
  const [del, setDel] = useState(null)           // user pending delete

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) =>
      (statusFilter === 'All' || u.status === statusFilter) &&
      (roleFilter === 'All' || u.role === roleFilter) &&
      (!q || `${u.name} ${u.username} ${u.email} ${u.role} ${u.dept}`.toLowerCase().includes(q))
    )
  }, [users, query, statusFilter, roleFilter])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    locked: users.filter((u) => u.status === 'Locked').length,
    admins: users.filter((u) => u.role === 'Administrator').length,
  }), [users])

  // ---- mutations ----
  const openNew = () => setEdit({ ...blankUser(), _id: `new-${uidSeq++}`, _new: true })
  const openEdit = (u) => setEdit({ ...u })
  const isNew = edit && (edit._new || !users.some((u) => u._id === edit._id))
  const canSave = edit && edit.name.trim() && edit.username.trim() && emailValid(edit.email || '') &&
    !users.some((u) => u._id !== edit._id && u.username.toLowerCase() === edit.username.trim().toLowerCase())

  const save = () => {
    if (!canSave) return
    const clean = { ...edit, name: edit.name.trim(), username: edit.username.trim(), email: edit.email.trim() }
    delete clean._new
    setUsers((list) => (list.some((u) => u._id === clean._id)
      ? list.map((u) => (u._id === clean._id ? clean : u))
      : [...list, clean]))
    setEdit(null)
  }
  const setStatus = (u, status) => setUsers((list) => list.map((x) => (x._id === u._id ? { ...x, status } : x)))
  const toggleActive = (u) => setStatus(u, u.status === 'Active' ? 'Inactive' : 'Active')
  const toggleLock = (u) => setStatus(u, u.status === 'Locked' ? 'Active' : 'Locked')
  const confirmDelete = () => { setUsers((list) => list.filter((u) => u._id !== del._id)); setDel(null) }

  const openReset = (u) => setReset({ user: u, pw: genPassword(), copied: false })
  const applyReset = () => {
    setUsers((list) => list.map((u) => (u._id === reset.user._id ? { ...u, mustReset: true } : u)))
    setReset(null)
  }
  const copyPw = async () => {
    try { await navigator.clipboard.writeText(reset.pw); setReset((r) => ({ ...r, copied: true })) } catch { /* clipboard blocked */ }
  }

  // ---- modals ----
  const editModal = edit && (
    <div className="modal-overlay" onClick={() => setEdit(null)}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-blue"><Users size={24} /></div>
        <h3>{isNew ? 'Add User' : 'Edit User'}</h3>
        <p>{isNew ? 'Create a new application user and assign their role & access.' : `Update ${edit.name || 'this user'}'s profile and access.`}</p>
        <div className="form-grid">
          <label className="fld"><span>Full name *</span>
            <input value={edit.name} autoFocus
              onChange={(e) => setEdit({ ...edit, name: e.target.value, username: isNew && (!edit.username || edit.username === suggestUsername(edit.name)) ? suggestUsername(e.target.value) : edit.username })}
              placeholder="e.g. Jane Doe" />
          </label>
          <label className={`fld ${edit.username.trim() && users.some((u) => u._id !== edit._id && u.username.toLowerCase() === edit.username.trim().toLowerCase()) ? 'invalid' : ''}`}>
            <span>Username *</span>
            <input value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} placeholder="login id" />
          </label>
          <label className={`fld ${edit.email && !emailValid(edit.email) ? 'invalid' : ''}`}><span>Email *</span>
            <input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} placeholder="name@company.com" />
          </label>
          <label className="fld"><span>Phone</span>
            <input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+880 …" />
          </label>
          <label className="fld"><span>Role</span>
            <select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label className="fld"><span>Department</span>
            <select value={edit.dept} onChange={(e) => setEdit({ ...edit, dept: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
          </label>
          <label className="fld"><span>Status</span>
            <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <div className="fld um-checks">
            <label className="um-check"><input type="checkbox" checked={edit.twoFA} onChange={(e) => setEdit({ ...edit, twoFA: e.target.checked })} /> Enable two-factor (2FA)</label>
            <label className="um-check"><input type="checkbox" checked={edit.mustReset} onChange={(e) => setEdit({ ...edit, mustReset: e.target.checked })} /> Require password reset at next login</label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!canSave}><CheckCircle2 size={16} /> {isNew ? 'Create User' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )

  const resetModal = reset && (
    <div className="modal-overlay" onClick={() => setReset(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-amber"><KeyRound size={24} /></div>
        <h3>Reset Password — {reset.user.name}</h3>
        <p>A temporary password has been generated. Share it securely; the user must change it at next login.</p>
        <div className="um-pw">
          <code>{reset.pw}</code>
          <button className="btn btn-ghost sm" onClick={copyPw}>{reset.copied ? <><CheckCircle2 size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</button>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setReset(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={applyReset}><KeyRound size={16} /> Apply Reset</button>
        </div>
      </div>
    </div>
  )

  const delModal = del && (
    <div className="modal-overlay" onClick={() => setDel(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-rose"><Trash2 size={24} /></div>
        <h3>Delete {del.name}?</h3>
        <p>This permanently removes the user <strong>{del.username}</strong> ({del.email}) and their access. This can’t be undone — consider deactivating instead.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button>
          <button className="btn btn-reject solid" onClick={confirmDelete} autoFocus><Trash2 size={16} /> Delete user</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>User Management</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Users size={22} /></span>
          <div><h1>User Management</h1><p>Create, edit, deactivate &amp; reset application users and their access.</p></div>
        </div>
        <div className="mh-actions"><button className="btn btn-primary" onClick={openNew}><Plus size={17} /> Add User</button></div>
      </header>

      <section className="req-stats">
        <div className="rstat"><span className="rs-label">Total Users</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-green"><span className="rs-label">Active</span><strong>{stats.active}</strong></div>
        <div className="rstat tone-rose"><span className="rs-label">Locked</span><strong>{stats.locked}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">Administrators</span><strong>{stats.admins}</strong></div>
      </section>

      <div className="req-toolbar">
        <div className="req-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, username, email, role…" /></div>
        <div className="um-tool-right">
          <select className="um-role-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="req-filters">
            {['All', ...STATUSES].map((s) => <button key={s} className={`chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>)}
          </div>
        </div>
      </div>

      <div className="req-table-wrap">
        <table className="req-table um-table">
          <thead>
            <tr><th>User</th><th>Username</th><th>Role</th><th>Department</th><th>Status</th><th>2FA</th><th>Last Login</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} className="row-click" onClick={() => openEdit(u)}>
                <td>
                  <div className="um-user">
                    <span className={`um-av tone-${ROLE_TONE[u.role] || 'slate'}`}>{initials(u.name)}</span>
                    <div className="um-user-meta">
                      <strong>{u.name}{u.mustReset && <span className="um-flag" title="Must reset password at next login"><KeyRound size={11} /></span>}</strong>
                      <span><Mail size={11} /> {u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="mono">{u.username}</td>
                <td><span className={`status tone-${ROLE_TONE[u.role] || 'slate'}`}>{u.role}</span></td>
                <td>{u.dept}</td>
                <td><span className={`status tone-${STATUS_TONE[u.status]}`}>{u.status === 'Locked' && <Lock size={12} />} {u.status}</span></td>
                <td>{u.twoFA ? <ShieldCheck size={16} className="um-2fa-on" /> : <Shield size={16} className="um-2fa-off" />}</td>
                <td className="um-login">{u.lastLogin}</td>
                <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="row-act edit" title="Edit user" onClick={() => openEdit(u)}><Pencil size={15} /></button>
                  <button className="row-act" title="Reset password" onClick={() => openReset(u)}><KeyRound size={15} /></button>
                  <button className="row-act" title={u.status === 'Locked' ? 'Unlock' : 'Lock'} onClick={() => toggleLock(u)}>{u.status === 'Locked' ? <Unlock size={15} /> : <Lock size={15} />}</button>
                  <button className="row-act" title={u.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(u)}>{u.status === 'Active' ? <Ban size={15} /> : <CheckCircle2 size={15} />}</button>
                  <button className="row-act del" title="Delete user" onClick={() => setDel(u)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="empty">No users match your filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <footer className="content-foot">User Management · System Administration · DataMart Enterprise Suite</footer>
      {editModal}{resetModal}{delModal}
    </div>
  )
}
