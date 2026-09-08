import { Link } from 'react-router-dom'
import { useCareData } from '../hooks/useCareData'
import { tierLabel, formatDateTime, maskPhone } from '../lib/format'

export default function Dashboard() {
  const { mothers, callLogsWithNames, escalationsWithDetail, schedules, loading, error, reload } = useCareData()

  const dueToday = schedules.filter((s) => s.status === 'pending')
  const completed = schedules.filter((s) => s.status === 'completed')
  const urgentCount = callLogsWithNames.filter((l) => l.risk_tier === 'urgent').length
  const emergencyCount = callLogsWithNames.filter((l) => l.risk_tier === 'emergency').length

  const recentCalls = [...callLogsWithNames]
    .sort((a, b) => new Date(b.called_at) - new Date(a.called_at))
    .slice(0, 6)

  const openEscalations = escalationsWithDetail.filter((e) => e.status !== 'resolved').slice(0, 3)

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Good morning, Grace 👋🏾</h2>
          <p>Here's what needs your attention today.</p>
        </div>
        <button className="ghost" onClick={reload}>Refresh</button>
      </div>

      {error && <div className="status-note error">{error}</div>}
      {loading && <div className="empty-state">Loading care data…</div>}

      <div className="stat-grid">
        <div className="stat-card brand">
          <span className="stat-value">{mothers.length}</span>
          <span className="stat-label">Mothers enrolled</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{dueToday.length}</span>
          <span className="stat-label">Follow-ups due</span>
        </div>
        <div className="stat-card urgent">
          <span className="stat-value">{urgentCount}</span>
          <span className="stat-label">Urgent this period</span>
        </div>
        <div className="stat-card emergency">
          <span className="stat-value">{emergencyCount}</span>
          <span className="stat-label">Emergency this period</span>
        </div>
      </div>

      <div className="two-col">
        <div className="section">
          <div className="section-title">
            <span>Recent call outcomes</span>
            <Link className="view-all" to="/follow-ups">View all</Link>
          </div>
          <div className="card-list">
            {recentCalls.length === 0 && <div className="empty-state">No calls completed yet.</div>}
            {recentCalls.map((log) => (
              <div className={`entry-card tier-${log.risk_tier}`} key={log.id}>
                <div>
                  <div className="entry-title">{log.motherName} — {log.scheduleLabel}</div>
                  <div className="entry-meta">{log.transcript_summary || log.risk_reason}</div>
                </div>
                <span className={`tier-badge ${log.risk_tier}`}>{tierLabel(log.risk_tier)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <span>Open escalations</span>
            <Link className="view-all" to="/escalations">View all</Link>
          </div>
          <div className="card-list">
            {openEscalations.length === 0 && <div className="empty-state">No open escalations. 🎉</div>}
            {openEscalations.map((esc) => (
              <div className={`entry-card tier-${esc.log?.risk_tier}`} key={esc.id}>
                <div>
                  <div className="entry-title">{esc.mother?.name || 'Unknown mother'}</div>
                  <div className="entry-meta">{esc.reason}</div>
                </div>
                <span className={`tier-badge ${esc.log?.risk_tier}`}>{tierLabel(esc.log?.risk_tier)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
