const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

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

export const api = {
  registerMother: (data) => request('/mothers', { method: 'POST', body: JSON.stringify(data) }),
  listMothers: () => request('/mothers'),
  listCallLogs: () => request('/call-logs'),
  listEscalations: () => request('/escalations'),
  listSchedules: (status) => request(`/schedules${status ? `?status=${status}` : ''}`),
  triggerCall: (scheduleId) => request(`/schedules/${scheduleId}/trigger-call`, { method: 'POST' }),
  resolveEscalation: (id) => request(`/escalations/${id}/resolve`, { method: 'POST' }),
}
