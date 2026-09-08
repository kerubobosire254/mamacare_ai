import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCareData } from '../hooks/useCareData'
import { maskPhone, formatDate } from '../lib/format'

export default function Mothers() {
  const { mothers, callLogsWithNames, schedules, loading } = useCareData()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const latestTierFor = (motherId) => {
    const motherSchedules = schedules.filter((s) => s.mother_id === motherId).map((s) => s.id)
    const logs = callLogsWithNames.filter((l) => motherSchedules.includes(l.schedule_id))
    if (logs.length === 0) return null
    return [...logs].sort((a, b) => new Date(b.called_at) - new Date(a.called_at))[0].risk_tier
  }

  const nextDueFor = (motherId) => {
    const pending = schedules
      .filter((s) => s.mother_id === motherId && s.status === 'pending')
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    return pending[0]
  }

  const filtered = mothers.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Mothers</h2>
          <p>Everyone currently enrolled in postnatal follow-up.</p>
        </div>
        <Link to="/register"><button className="primary">+ Register mother</button></Link>
      </div>

      <div className="search-row">
        <input placeholder="Search mothers…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Delivery</th>
              <th>Next follow-up</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const tier = latestTierFor(m.id)
              const nextDue = nextDueFor(m.id)
              return (
                <tr key={m.id} className="clickable" onClick={() => navigate(`/mothers/${m.id}`)}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td className="mono-phone">{maskPhone(m.phone)}</td>
                  <td>{formatDate(m.delivery_date)}</td>
                  <td>{nextDue ? `${nextDue.label} — ${formatDate(nextDue.scheduled_date)}` : 'Programme complete'}</td>
                  <td>
                    {tier ? (
                      <span><span className={`dot ${tier}`}></span>{tier === 'emergency' ? 'Emergency' : tier === 'urgent' ? 'Urgent' : 'Routine'}</span>
                    ) : (
                      <span style={{ color: 'var(--ink-faint)' }}>Not yet called</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="empty-state">No mothers match that search.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
