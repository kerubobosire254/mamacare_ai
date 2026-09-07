import { useState } from 'react'
import { api } from '../api'

export default function RegisterMother({ onRegistered }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    delivery_date: '',
    consent_given: false,
    delivery_type: 'vaginal',
  })
  const [status, setStatus] = useState(null)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
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
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Register a mother</h2>
        <p>Sets up her postnatal follow-up schedule automatically — Day 3, Day 7, and Week 6 check-ins.</p>
      </div>

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

        <div className="field checkbox-field">
          <input
            type="checkbox"
            id="consent"
            checked={form.consent_given}
            onChange={(e) => update('consent_given', e.target.checked)}
          />
          <label htmlFor="consent" style={{ marginBottom: 0 }}>
            She has consented to receive automated screening calls
          </label>
        </div>

        <button className="primary" type="submit">Register mother</button>

        {status && <div className={`status-note ${status.type}`}>{status.message}</div>}
      </form>
    </div>
  )
}
