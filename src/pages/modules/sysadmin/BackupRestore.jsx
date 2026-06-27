import { useMemo, useRef, useState } from 'react'
import {
  ChevronRight, ArrowLeft, Database, Play, RotateCcw, Trash2, Download, CheckCircle2,
  Clock, HardDrive, Cloud, Loader, CalendarClock, Save, XCircle,
} from 'lucide-react'
import '../procurement/Requisition.css'
import '../procurement/Procurement.css'
import '../procurement/Rfq.css'
import './BackupRestore.css'

/*
 * System Administration → Backup & Restore.
 * Backup history, on-demand run (simulated), restore/download/delete and the
 * automatic backup schedule. In-memory demo data.
 */

const STATUS_TONE = { Completed: 'green', Failed: 'rose', Running: 'blue' }
const LOC_ICON = { Cloud, Local: HardDrive }

let bSeq = 1
const bk = (startedAt, type, sizeGB, durationSec, status, location, by) =>
  ({ id: `BK-${String(900 + bSeq++)}`, startedAt, type, sizeGB, durationSec, status, location, by })

const SEED = [
  bk('2026-06-25 02:00', 'Full', 2.4, 372, 'Completed', 'Cloud', 'Scheduler'),
  bk('2026-06-24 02:00', 'Full', 2.38, 365, 'Completed', 'Cloud', 'Scheduler'),
  bk('2026-06-23 14:18', 'Incremental', 0.21, 41, 'Completed', 'Local', 'sakhawat@scpl.com'),
  bk('2026-06-23 02:00', 'Full', 2.35, 358, 'Completed', 'Cloud', 'Scheduler'),
  bk('2026-06-22 02:00', 'Full', 2.31, 349, 'Failed', 'Cloud', 'Scheduler'),
  bk('2026-06-21 02:00', 'Full', 2.30, 351, 'Completed', 'Cloud', 'Scheduler'),
]
const FREQ = ['Daily', 'Weekly', 'Monthly']
const fmtDur = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`

export default function BackupRestore({ onHome, onBack }) {
  const [backups, setBackups] = useState(SEED)
  const [running, setRunning] = useState(false)
  const [restore, setRestore] = useState(null)
  const [del, setDel] = useState(null)
  const [schedule, setSchedule] = useState({ freq: 'Daily', time: '02:00', retentionDays: 30, destination: 'Cloud' })
  const [savedSchedule, setSavedSchedule] = useState({ freq: 'Daily', time: '02:00', retentionDays: 30, destination: 'Cloud' })
  const [flash, setFlash] = useState('')
  const timer = useRef(null)

  const scheduleDirty = JSON.stringify(schedule) !== JSON.stringify(savedSchedule)

  const stats = useMemo(() => {
    const done = backups.filter((b) => b.status === 'Completed')
    return {
      last: done[0]?.startedAt?.slice(5) || '—',
      total: backups.length,
      storage: backups.filter((b) => b.status !== 'Failed').reduce((s, b) => s + b.sizeGB, 0).toFixed(1),
      next: `${schedule.freq} · ${schedule.time}`,
    }
  }, [backups, schedule])

  // Run an on-demand backup: insert a 'Running' row, then complete it after a short delay.
  const runBackup = () => {
    if (running) return
    setRunning(true)
    const row = bk('2026-06-25 ' + 'now', 'Incremental', 0, 0, 'Running', schedule.destination, 'sakhawat@scpl.com')
    setBackups((l) => [row, ...l])
    timer.current = setTimeout(() => {
      const size = Number((0.15 + Math.random() * 0.25).toFixed(2))
      const dur = 30 + Math.floor(Math.random() * 40)
      setBackups((l) => l.map((b) => (b.id === row.id ? { ...b, status: 'Completed', sizeGB: size, durationSec: dur, startedAt: '2026-06-25 10:30' } : b)))
      setRunning(false)
      setFlash(`Backup ${row.id} completed — ${size} GB`)
      setTimeout(() => setFlash(''), 2200)
    }, 1800)
  }

  const doRestore = () => { setFlash(`Restore from ${restore.id} started — system will be read-only until complete.`); setRestore(null); setTimeout(() => setFlash(''), 2600) }
  const doDelete = () => { setBackups((l) => l.filter((b) => b.id !== del.id)); setDel(null) }
  const saveSchedule = () => { setSavedSchedule({ ...schedule }); setFlash('Backup schedule updated.'); setTimeout(() => setFlash(''), 2000) }

  const restoreModal = restore && (
    <div className="modal-overlay" onClick={() => setRestore(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-amber"><RotateCcw size={24} /></div>
        <h3>Restore from {restore.id}?</h3>
        <p>This rolls the entire system back to the <strong>{restore.type.toLowerCase()}</strong> backup taken on <strong>{restore.startedAt}</strong> ({restore.sizeGB} GB). All data entered since then will be lost and the system goes read-only during restore. This can’t be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setRestore(null)}>Cancel</button>
          <button className="btn btn-reject solid" onClick={doRestore} autoFocus><RotateCcw size={16} /> Restore now</button>
        </div>
      </div>
    </div>
  )
  const delModal = del && (
    <div className="modal-overlay" onClick={() => setDel(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon tone-rose"><Trash2 size={24} /></div>
        <h3>Delete {del.id}?</h3>
        <p>This permanently removes the backup from <strong>{del.startedAt}</strong> ({del.sizeGB} GB, {del.location}). You won’t be able to restore from it afterwards.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button>
          <button className="btn btn-reject solid" onClick={doDelete} autoFocus><Trash2 size={16} /> Delete backup</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="req fade-in">
      <nav className="crumbs">
        <button onClick={onHome}>Dashboard</button><ChevronRight size={14} />
        <button onClick={onBack}>System Administration</button><ChevronRight size={14} /><span>Backup &amp; Restore</span>
      </nav>

      <header className="req-head">
        <div className="req-title">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
          <span className="req-mark"><Database size={22} /></span>
          <div><h1>Backup &amp; Restore</h1><p>Run, schedule and restore database backups.</p></div>
        </div>
        <div className="mh-actions">
          <button className="btn btn-primary" onClick={runBackup} disabled={running}>{running ? <><Loader size={16} className="br-spin" /> Running…</> : <><Play size={16} /> Run Backup Now</>}</button>
        </div>
      </header>

      {flash && <div className="br-flash"><CheckCircle2 size={16} /> {flash}</div>}

      <section className="req-stats">
        <div className="rstat tone-teal"><span className="rs-label">Last Backup</span><strong className="br-sm">{stats.last}</strong></div>
        <div className="rstat tone-blue"><span className="rs-label">Total Backups</span><strong>{stats.total}</strong></div>
        <div className="rstat tone-violet"><span className="rs-label">Storage Used</span><strong>{stats.storage}<em className="br-unit"> GB</em></strong></div>
        <div className="rstat tone-green"><span className="rs-label">Next Scheduled</span><strong className="br-sm">{stats.next}</strong></div>
      </section>

      <section className="panel br-sched">
        <div className="panel-head"><h2><CalendarClock size={16} /> Automatic Backup Schedule</h2>
          <button className="btn btn-primary sm" onClick={saveSchedule} disabled={!scheduleDirty}><Save size={15} /> Save</button>
        </div>
        <div className="br-sched-body">
          <label className="fld"><span>Frequency</span><select value={schedule.freq} onChange={(e) => setSchedule({ ...schedule, freq: e.target.value })}>{FREQ.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label className="fld"><span>Run at</span><input type="time" value={schedule.time} onChange={(e) => setSchedule({ ...schedule, time: e.target.value })} /></label>
          <label className="fld"><span>Retention (days)</span><input type="number" min={1} max={365} value={schedule.retentionDays} onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) || 0 })} /></label>
          <label className="fld"><span>Destination</span><select value={schedule.destination} onChange={(e) => setSchedule({ ...schedule, destination: e.target.value })}><option>Cloud</option><option>Local</option></select></label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2><Database size={16} /> Backup History</h2><span className="count">{backups.length}</span></div>
        <div className="req-table-wrap br-table-wrap">
          <table className="req-table br-table">
            <thead><tr><th>Backup</th><th>Started</th><th>Type</th><th className="num">Size</th><th className="num">Duration</th><th>Destination</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {backups.map((b) => {
                const LI = LOC_ICON[b.location] || HardDrive
                const ok = b.status === 'Completed'
                return (
                  <tr key={b.id}>
                    <td className="mono">{b.id}</td>
                    <td className="br-when">{b.startedAt}</td>
                    <td>{b.type}</td>
                    <td className="num">{b.status === 'Running' ? '—' : `${b.sizeGB} GB`}</td>
                    <td className="num">{b.status === 'Running' ? '—' : fmtDur(b.durationSec)}</td>
                    <td><span className="br-loc"><LI size={13} /> {b.location}</span></td>
                    <td><span className={`status tone-${STATUS_TONE[b.status]}`}>{b.status === 'Running' && <Loader size={12} className="br-spin" />}{b.status === 'Failed' && <XCircle size={12} />}{ok && <CheckCircle2 size={12} />} {b.status}</span></td>
                    <td className="row-actions">
                      <button className="row-act" title="Download" disabled={!ok} onClick={() => { setFlash(`Downloading ${b.id}…`); setTimeout(() => setFlash(''), 1600) }}><Download size={15} /></button>
                      <button className="row-act edit" title="Restore" disabled={!ok} onClick={() => setRestore(b)}><RotateCcw size={15} /></button>
                      <button className="row-act del" title="Delete" disabled={b.status === 'Running'} onClick={() => setDel(b)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="content-foot">Backup &amp; Restore · System Administration · DataMart Enterprise Suite</footer>
      {restoreModal}{delModal}
    </div>
  )
}
