import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCareData } from '../hooks/useCareData'
import { api } from '../api'
import { formatDateTime, tierLabel } from '../lib/format'

export default function Escalations() {
  const { escalationsWithDetail, loading, reload } = useCareData()
  const [resolving, setResolving] = useState(null)
  const [showResolved, setShowResolved] = useState(false)

  async function handleResolve(id) {
    setResolving(id)
    try {
      await api.resolveEscalation(id)
      await reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setResolving(null)
    }
  }

  const sorted = [...escalationsWithDetail].sort((a, b) => {
    const order = { emergency: 0, urgent: 1 }
    const aTier = order[a.log?.risk_tier] ?? 2
    const bTier = order[b.log?.risk_tier] ?? 2
    return aTier - bTier
  })

  const visible = sorted.filter((e) => (showResolved ? true : e.status !== 'resolved'))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Escalations</h2>
          <p>Cases flagged by the screening call for human follow-up, ranked by urgency.</p>
        </div>
        <button className="ghost" onClick={() => setShowResolved((s) => !s)}>
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </button>
      </div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && visible.length === 0 && (
        <div className="empty-state">No open escalations right now. 🎉</div>
      )}

      {visible.map((esc) => (
        <div className={`escalation-card ${esc.log?.risk_tier}`} key={esc.id}>
          <div className="esc-header">
            <div>
              <div className="esc-name">
                <Link to={`/mothers/${esc.mother?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {esc.mother?.name || 'Unknown mother'}
                </Link>
              </div>
              <div className="esc-meta">{esc.scheduleLabel} postpartum · Detected {formatDateTime(esc.log?.called_at)}</div>
            </div>
            <span className={`tier-badge ${esc.log?.risk_tier}`}>{tierLabel(esc.log?.risk_tier)}</span>
          </div>

          <div className="esc-trigger">
            <span className="label">Trigger</span>
            {esc.reason}
          </div>

          <div className="esc-actions">
            <Link to={`/mothers/${esc.mother?.id}`}><button className="ghost">View mother</button></Link>
            {esc.status !== 'resolved' ? (
              <button className="primary" onClick={() => handleResolve(esc.id)} disabled={resolving === esc.id}>
                {resolving === esc.id ? 'Resolving…' : 'Mark resolved'}
              </button>
            ) : (
              <span className="badge-pill">Resolved</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
