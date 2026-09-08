const API_BASE = import.meta.env.VITE_API_BASE || 'https://mamacare-ai-1.onrender.com'

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
  motherSchedules: (id) => request(`/mothers/${id}/schedules`),
  listCallLogs: () => request('/call-logs'),
  listEscalations: () => request('/escalations'),
  listSchedules: (status) => request(`/schedules${status ? `?status=${status}` : ''}`),
  triggerCall: (scheduleId) => request(`/schedules/${scheduleId}/trigger-call`, { method: 'POST' }),
  resolveEscalation: (id) => request(`/escalations/${id}/resolve`, { method: 'POST' }),
}
