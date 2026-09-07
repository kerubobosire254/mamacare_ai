import { useEffect, useState } from 'react'
import { api } from '../api'

function tierLabel(tier) {
  if (tier === 'emergency') return 'Emergency'
  if (tier === 'urgent') return 'Urgent'
  if (tier === 'routine') return 'Routine'
  return 'Pending'
}

export default function Dashboard({ refreshKey }) {
  const [mothers, setMothers] = useState([])
  const [callLogs, setCallLogs] = useState([])
  const [schedules, setSchedules] = useState([])
  const [error, setError] = useState(null)
  const [triggering, setTriggering] = useState(null)

  async function loadAll() {
    try {
      const [m, c, s] = await Promise.all([
        api.listMothers(),
        api.listCallLogs(),
        api.listSchedules('pending'),
      ])
      setMothers(m)
      setCallLogs(c)
      setSchedules(s)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { loadAll() }, [refreshKey])

  const motherName = (motherId) => mothers.find((m) => m.id === motherId)?.name || `Mother #${motherId}`

  const counts = callLogs.reduce(
    (acc, log) => {
      acc[log.risk_tier] = (acc[log.risk_tier] || 0) + 1
      return acc
    },
    { emergency: 0, urgent: 0, routine: 0 }
  )

  async function handleTrigger(scheduleId) {
    setTriggering(scheduleId)
    try {
      await api.triggerCall(scheduleId)
      await loadAll()
    } catch (err) {
      setError(`Call trigger failed: ${err.message}`)
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Care dashboard</h2>
        <p>Live view of postnatal check-ins, risk tiering, and escalations across registered mothers.</p>
      </div>

      {error && <div className="status-note error">{error}</div>}

      <div className="summary-row">
        <div className="summary-pill emergency">
          <span className="count">{counts.emergency}</span>
          <span className="label">Emergency</span>
        </div>
        <div className="summary-pill urgent">
          <span className="count">{counts.urgent}</span>
          <span className="label">Urgent</span>
        </div>
        <div className="summary-pill routine">
          <span className="count">{counts.routine}</span>
          <span className="label">Routine</span>
        </div>
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Pending check-ins</h3>
      <div className="card-list" style={{ marginBottom: 32 }}>
        {schedules.length === 0 && <div className="empty-state">No pending check-ins.</div>}
        {schedules.map((s) => (
          <div className="entry-card" key={s.id}>
            <div>
              <div className="entry-title">{motherName(s.mother_id)} — {s.label}</div>
              <div className="entry-meta">Due {s.scheduled_date} · Attempts: {s.attempt_count}</div>
            </div>
            <button
              className="ghost"
              onClick={() => handleTrigger(s.id)}
              disabled={triggering === s.id}
            >
              {triggering === s.id ? 'Calling…' : 'Trigger call'}
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Recent call outcomes</h3>
      <div className="card-list">
        {callLogs.length === 0 && <div className="empty-state">No calls completed yet.</div>}
        {callLogs.map((log) => (
          <div className={`entry-card tier-${log.risk_tier}`} key={log.id}>
            <div>
              <div className="entry-title">{log.transcript_summary || 'Call completed'}</div>
              <div className="entry-meta">{log.risk_reason}</div>
            </div>
            <span className={`tier-badge ${log.risk_tier}`}>{tierLabel(log.risk_tier)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
