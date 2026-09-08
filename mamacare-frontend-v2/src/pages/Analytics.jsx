import { useCareData } from '../hooks/useCareData'

function Bar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="bar-value">{pct}%</span>
    </div>
  )
}

export default function Analytics() {
  const { mothers, schedules, callLogsWithNames, escalations, loading } = useCareData()

  const totalSchedules = schedules.length
  const completed = schedules.filter((s) => s.status === 'completed').length
  const noAnswer = schedules.filter((s) => s.status === 'no_answer').length
  const pending = schedules.filter((s) => s.status === 'pending').length

  const routineCount = callLogsWithNames.filter((l) => l.risk_tier === 'routine').length
  const urgentCount = callLogsWithNames.filter((l) => l.risk_tier === 'urgent').length
  const emergencyCount = callLogsWithNames.filter((l) => l.risk_tier === 'emergency').length
  const totalCalls = callLogsWithNames.length || 1

  const mothersReached = new Set(callLogsWithNames.map((l) => l.motherName)).size
  const coverage = totalSchedules > 0 ? Math.round((completed / totalSchedules) * 100) : 0
  const avgCallsPerMother = mothers.length > 0 ? (callLogsWithNames.length / mothers.length).toFixed(1) : '0.0'

  if (loading) return <div className="empty-state">Loading analytics…</div>

  return (
    <div>
      <div className="page-header">
        <h2>Follow-up analytics</h2>
        <p>Computed live from your actual registered mothers, schedules, and call outcomes.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card brand">
          <span className="stat-value">{mothersReached}</span>
          <span className="stat-label">Mothers reached</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{coverage}%</span>
          <span className="stat-label">Follow-up coverage</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{avgCallsPerMother}</span>
          <span className="stat-label">Avg calls / mother</span>
        </div>
        <div className="stat-card emergency">
          <span className="stat-value">{escalations.length}</span>
          <span className="stat-label">Total escalations</span>
        </div>
      </div>

      <div className="two-col">
        <div className="section">
          <div className="section-title"><span>Call outcomes</span></div>
          <div className="profile-card">
            <Bar label="Completed" value={completed} total={totalSchedules} color="var(--routine)" />
            <Bar label="Pending" value={pending} total={totalSchedules} color="var(--ink-faint)" />
            <Bar label="No answer" value={noAnswer} total={totalSchedules} color="var(--urgent)" />
          </div>
        </div>

        <div className="section">
          <div className="section-title"><span>Risk distribution</span></div>
          <div className="profile-card">
            <Bar label="Routine" value={routineCount} total={totalCalls} color="var(--routine)" />
            <Bar label="Urgent" value={urgentCount} total={totalCalls} color="var(--urgent)" />
            <Bar label="Emergency" value={emergencyCount} total={totalCalls} color="var(--emergency)" />
          </div>
        </div>
      </div>
    </div>
  )
}
