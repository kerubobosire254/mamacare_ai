export function tierLabel(tier) {
  if (tier === 'emergency') return 'Emergency'
  if (tier === 'urgent') return 'Urgent'
  if (tier === 'routine') return 'Routine'
  return 'Pending'
}

export function maskPhone(phone) {
  if (!phone) return ''
  return phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function daysSince(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

export function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}
