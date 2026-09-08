import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useCareData } from '../hooks/useCareData'
import { api } from '../api'
import { maskPhone, formatDate, formatDateTime, tierLabel } from '../lib/format'

export default function MotherProfile() {
  const { id } = useParams()
  const motherId = parseInt(id, 10)
  const { motherById, schedules, callLogsWithNames, reload } = useCareData()
  const [triggering, setTriggering] = useState(null)
  const [note, setNote] = useState(null)

  const mother = motherById(motherId)
  const motherSchedules = schedules
    .filter((s) => s.mother_id === motherId)
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
  const motherCalls = callLogsWithNames
    .filter((l) => motherSchedules.some((s) => s.id === l.schedule_id))
    .sort((a, b) => new Date(b.called_at) - new Date(a.called_at))

  const latestTier = motherCalls[0]?.risk_tier

  async function handleTrigger(scheduleId) {
    setTriggering(scheduleId)
    setNote(null)
    try {
      await api.triggerCall(scheduleId)
      setNote({ type: 'success', message: 'Call triggered.' })
      await reload()
    } catch (err) {
      setNote({ type: 'error', message: err.message })
    } finally {
      setTriggering(null)
    }
  }

  if (!mother) {
    return <div className="empty-state">Loading mother profile, or she doesn't exist.</div>
  }

  return (
    <div>
      <Link to="/mothers" style={{ fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none' }}>← Back to Mothers</Link>

      <div className="page-header-row" style={{ marginTop: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>{mother.name}</h2>
          <p>Delivered {formatDate(mother.delivery_date)}</p>
        </div>
        {latestTier && <span className={`tier-badge ${latestTier}`} style={{ fontSize: 13, padding: '5px 14px' }}>{tierLabel(latestTier)}</span>}
      </div>

      {note && <div className={`status-note ${note.type}`}>{note.message}</div>}

      <div className="profile-grid">
        <div className="profile-card">
          <h4>Mother</h4>
          <div className="profile-field">
            <span className="k">Phone</span>
            {maskPhone(mother.phone)}
          </div>
          <div className="profile-field">
            <span className="k">Delivery date</span>
            {formatDate(mother.delivery_date)}
          </div>
          <div className="profile-field">
            <span className="k">Consent</span>
            {mother.consent_given ? '✓ Given' : 'Not given'}
          </div>
        </div>

        <div className="profile-card">
          <h4>Follow-up journey</h4>
          <ul className="journey-list">
            {motherSchedules.map((s) => (
              <li key={s.id}>
                <span className={`journey-icon ${s.status === 'completed' ? 'done' : s.status === 'pending' ? 'current' : ''}`}>
                  {s.status === 'completed' ? '✓' : '○'}
                </span>
                <span style={{ flex: 1 }}>{s.label} — {formatDate(s.scheduled_date)}</span>
                {s.status === 'pending' && (
                  <button className="ghost" onClick={() => handleTrigger(s.id)} disabled={triggering === s.id}>
                    {triggering === s.id ? 'Calling…' : 'Call now'}
                  </button>
                )}
                {s.status !== 'pending' && <span className="badge-pill">{s.status}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section">
        <div className="section-title"><span>Call history</span></div>
        <div className="card-list">
          {motherCalls.length === 0 && <div className="empty-state">No calls completed yet for this mother.</div>}
          {motherCalls.map((log) => (
            <div className={`entry-card tier-${log.risk_tier}`} key={log.id}>
              <div>
                <div className="entry-title">{log.scheduleLabel} — {formatDateTime(log.called_at)}</div>
                <div className="entry-meta">{log.transcript_summary || log.risk_reason}</div>
              </div>
              <span className={`tier-badge ${log.risk_tier}`}>{tierLabel(log.risk_tier)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
