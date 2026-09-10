import { mothers as mockMothers, schedules as mockSchedules, call_logs as mockCallLogs, escalations as mockEscalations } from './mockData'

// MOCK_MODE runs the whole app on local demo data — no backend required.
// Flip to false and set VITE_API_BASE once the live backend is stable again.
const MOCK_MODE = true
const API_BASE = import.meta.env.VITE_API_BASE || 'https://mamacare-ai-1.onrender.com'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`${res.status}: ${detail}`)
  }
  return res.json()
}

let mockState = null
function getMockState() {
  if (!mockState) {
    mockState = {
      mothers: [...mockMothers],
      schedules: [...mockSchedules],
      call_logs: [...mockCallLogs],
      escalations: [...mockEscalations],
    }
  }
  return mockState
}

export const api = {
  async registerMother(data) {
    if (MOCK_MODE) {
      await delay()
      const state = getMockState()
      const id = Math.max(0, ...state.mothers.map((m) => m.id)) + 1
      const mother = {
        id, name: data.name, phone: data.phone, delivery_date: data.delivery_date,
        consent_given: data.consent_given, created_at: new Date().toISOString(),
      }
      state.mothers.unshift(mother)
      const points = [{ offset: 3, label: 'Day 3' }, { offset: 7, label: 'Day 7' }, { offset: 42, label: 'Week 6' }]
      points.forEach((p) => {
        const d = new Date(data.delivery_date)
        d.setDate(d.getDate() + p.offset)
        const sid = Math.max(0, ...state.schedules.map((s) => s.id)) + 1
        state.schedules.push({ id: sid, mother_id: id, scheduled_date: d.toISOString().slice(0, 10), label: p.label, status: 'pending', attempt_count: 0 })
      })
      return mother
    }
    return request('/mothers', { method: 'POST', body: JSON.stringify(data) })
  },

  async listMothers() {
    if (MOCK_MODE) { await delay(); return getMockState().mothers }
    return request('/mothers')
  },

  async motherSchedules(id) {
    if (MOCK_MODE) { await delay(); return getMockState().schedules.filter((s) => s.mother_id === id) }
    return request(`/mothers/${id}/schedules`)
  },

  async listCallLogs() {
    if (MOCK_MODE) { await delay(); return getMockState().call_logs }
    return request('/call-logs')
  },

  async listEscalations() {
    if (MOCK_MODE) { await delay(); return getMockState().escalations }
    return request('/escalations')
  },

  async listSchedules(status) {
    if (MOCK_MODE) {
      await delay()
      const all = getMockState().schedules
      return status ? all.filter((s) => s.status === status) : all
    }
    return request(`/schedules${status ? `?status=${status}` : ''}`)
  },

  async triggerCall(scheduleId) {
    if (MOCK_MODE) {
      await delay(600)
      const state = getMockState()
      const schedule = state.schedules.find((s) => s.id === scheduleId)
      if (schedule) {
        schedule.status = 'completed'
        schedule.attempt_count += 1
        const logId = Math.max(0, ...state.call_logs.map((l) => l.id)) + 1
        state.call_logs.unshift({
          id: logId, schedule_id: scheduleId, call_id: `demo-${logId}`,
          transcript_summary: 'Simulated call completed — everything reported normal',
          risk_answers: {}, risk_tier: 'routine', risk_reason: 'No danger signs reported',
          self_harm_flag: false, emotional_flag: false, called_at: new Date().toISOString(),
        })
      }
      return { status: 'call_triggered' }
    }
    return request(`/schedules/${scheduleId}/trigger-call`, { method: 'POST' })
  },

  async resolveEscalation(id) {
    if (MOCK_MODE) {
      await delay()
      const state = getMockState()
      const esc = state.escalations.find((e) => e.id === id)
      if (esc) esc.status = 'resolved'
      return esc
    }
    return request(`/escalations/${id}/resolve`, { method: 'POST' })
  },
}
