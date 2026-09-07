import { useState, useMemo } from 'react'
import { api } from '../api'

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d) {
  return d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function RegisterMother({ onRegistered }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    delivery_date: '',
    consent_given: false,
    delivery_type: 'vaginal',
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const schedule = useMemo(() => {
    if (!form.delivery_date) return null
    return [
      { label: 'Day 3 check-in', date: formatDate(addDays(form.delivery_date, 3)) },
      { label: 'Day 7 check-in', date: formatDate(addDays(form.delivery_date, 7)) },
      { label: 'Week 6 check-in', date: formatDate(addDays(form.delivery_date, 42)) },
    ]
  }, [form.delivery_date])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    setSubmitting(true)
    try {
      await api.registerMother({
        name: form.name,
        phone: form.phone,
        delivery_date: form.delivery_date,
        consent_given: form.consent_given,
        pregnancy: { delivery_type: form.delivery_type },
      })
      setStatus({ type: 'success', message: `${form.name}'s Day 3, Day 7, and Week 6 check-ins are scheduled.` })
      setForm({ name: '', phone: '', delivery_date: '', consent_given: false, delivery_type: 'vaginal' })
      onRegistered?.()
    } catch (err) {
      setStatus({ type: 'error', message: `Could not register mother: ${err.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Register a mother</h2>
        <p>Sets up her postnatal follow-up schedule automatically — Day 3, Day 7, and Week 6 check-ins.</p>
      </div>

      <div className="register-layout">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+2547XXXXXXXX"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Delivery date</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => update('delivery_date', e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Delivery type</label>
              <select value={form.delivery_type} onChange={(e) => update('delivery_type', e.target.value)}>
                <option value="vaginal">Vaginal</option>
                <option value="c_section">C-section</option>
              </select>
            </div>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.consent_given}
              onChange={(e) => update('consent_given', e.target.checked)}
            />
            <span>She has consented to receive automated screening calls</span>
          </label>

          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Registering…' : 'Register mother'}
          </button>

          {status && <div className={`status-note ${status.type}`}>{status.message}</div>}
        </form>

        <aside className="schedule-preview">
          <h3>What happens next</h3>
          {!schedule && (
            <p className="preview-empty">Enter a delivery date to see her check-in schedule.</p>
          )}
          {schedule && (
            <ol className="timeline">
              {schedule.map((item) => (
                <li key={item.label}>
                  <span className="timeline-dot" />
                  <div>
                    <div className="timeline-label">{item.label}</div>
                    <div className="timeline-date">{item.date}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="preview-note">
            CALL-E places each call automatically and screens for danger signs in mother and
            newborn. Anything concerning is escalated to a nurse with a stated reason.
          </p>
        </aside>
      </div>
    </div>
  )
}
