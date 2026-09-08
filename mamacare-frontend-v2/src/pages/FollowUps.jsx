import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCareData } from '../hooks/useCareData'
import { api } from '../api'
import { formatDate } from '../lib/format'

export default function FollowUps() {
  const { schedules, motherById, loading, reload } = useCareData()
  const [triggering, setTriggering] = useState(null)
  const [filter, setFilter] = useState('pending')

  async function handleTrigger(scheduleId) {
    setTriggering(scheduleId)
    try {
      await api.triggerCall(scheduleId)
      await reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setTriggering(null)
    }
  }

  const filtered = schedules
    .filter((s) => (filter === 'all' ? true : s.status === filter))
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))

  return (
    <div>
      <div className="page-header">
        <h2>Follow-ups</h2>
        <p>The automated call queue — every mother's Day 3, Day 7, and Week 6 check-in, generated automatically at registration.</p>
      </div>

      <div className="search-row">
        {['pending', 'completed', 'no_answer', 'all'].map((f) => (
          <button
            key={f}
            className="ghost"
            style={filter === f ? { background: 'var(--brand-soft)', borderColor: 'var(--brand)', color: 'var(--brand)' } : {}}
            onClick={() => setFilter(f)}
          >
            {f === 'no_answer' ? 'No answer' : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state">Loading…</div>}

      {!loading && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Mother</th>
              <th>Check-in</th>
              <th>Due date</th>
              <th>Attempts</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const mother = motherById(s.mother_id)
              return (
                <tr key={s.id}>
                  <td>
                    <Link to={`/mothers/${s.mother_id}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--ink)' }}>
                      {mother?.name || `Mother #${s.mother_id}`}
                    </Link>
                  </td>
                  <td>{s.label}</td>
                  <td>{formatDate(s.scheduled_date)}</td>
                  <td>{s.attempt_count}</td>
                  <td><span className={`tier-badge ${s.status === 'completed' ? 'routine' : 'pending'}`}>{s.status}</span></td>
                  <td>
                    {s.status === 'pending' && (
                      <button className="ghost" onClick={() => handleTrigger(s.id)} disabled={triggering === s.id}>
                        {triggering === s.id ? 'Calling…' : 'Trigger call'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="empty-state">Nothing in this view.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
