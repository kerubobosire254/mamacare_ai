// Standalone demo data — the frontend runs fully on this, independent of the
// live backend, so design and demo recording never depend on CALL-E/Render
// being up. Shape matches the real API responses exactly, so switching back
// to live data later is a one-line change in api.js.

const NAMES = [
  'Jane Wanjiru', 'Mary Achieng', 'Susan Kamau', 'Anne Njoki', 'Grace Wambui',
  'Faith Cherono', 'Joyce Adhiambo', 'Mercy Nyambura', 'Esther Muthoni',
  'Lucy Wairimu', 'Naomi Chebet', 'Ruth Akinyi', 'Sarah Wangui', 'Winnie Atieno',
  'Caroline Nekesa',
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function isoDaysAgo(n, hour = 9) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, Math.floor(Math.random() * 59), 0, 0)
  return d.toISOString()
}

const SCENARIOS = [
  { tier: 'routine', reason: 'No danger signs reported', summary: 'Reported feeling well, baby feeding normally' },
  { tier: 'routine', reason: 'No danger signs reported', summary: 'Recovering well, no concerns raised' },
  { tier: 'urgent', reason: 'Fever reported', summary: 'Mild fever, advised to see a health worker today' },
  { tier: 'urgent', reason: 'Wound concern reported', summary: 'Some tenderness near C-section site' },
  { tier: 'urgent', reason: 'Newborn feeding difficulty reported', summary: 'Baby having trouble latching' },
  { tier: 'urgent', reason: 'Emotional distress reported', summary: 'Mother reported feeling overwhelmed since delivery' },
  { tier: 'emergency', reason: 'Heavy/worsening bleeding reported', summary: 'Reported heavy bleeding, nurse alerted immediately' },
  { tier: 'emergency', reason: 'Severe headache and vision changes reported', summary: 'Severe headache with blurred vision' },
]

let idCounter = 1
function nextId() { return idCounter++ }

export const mothers = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  phone: `+2547${(10000000 + i * 137).toString().slice(0, 8)}`,
  delivery_date: daysAgo(3 + i * 3),
  consent_given: true,
  created_at: isoDaysAgo(3 + i * 3),
}))

export const schedules = []
export const call_logs = []
export const escalations = []

mothers.forEach((mother) => {
  const bornDaysAgo = Math.floor((Date.now() - new Date(mother.delivery_date)) / 86400000)
  const points = [
    { offset: 3, label: 'Day 3' },
    { offset: 7, label: 'Day 7' },
    { offset: 42, label: 'Week 6' },
  ]

  points.forEach((p) => {
    const dueDaysAgo = bornDaysAgo - p.offset
    const scheduleId = nextId()
    const isDue = dueDaysAgo >= 0
    const wasAnswered = isDue && Math.random() < 0.82

    schedules.push({
      id: scheduleId,
      mother_id: mother.id,
      scheduled_date: dueDaysAgo >= 0 ? daysAgo(dueDaysAgo) : daysFromNow(-dueDaysAgo),
      label: p.label,
      status: wasAnswered ? 'completed' : isDue ? (Math.random() < 0.5 ? 'no_answer' : 'pending') : 'pending',
      attempt_count: isDue ? (wasAnswered ? 1 : Math.floor(Math.random() * 2) + 1) : 0,
    })

    if (wasAnswered) {
      const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
      const logId = nextId()
      call_logs.push({
        id: logId,
        schedule_id: scheduleId,
        call_id: `demo-${scheduleId}`,
        transcript_summary: scenario.summary,
        risk_answers: {},
        risk_tier: scenario.tier,
        risk_reason: scenario.reason,
        self_harm_flag: false,
        emotional_flag: scenario.reason.includes('Emotional'),
        called_at: isoDaysAgo(dueDaysAgo),
      })

      if (scenario.tier !== 'routine') {
        escalations.push({
          id: nextId(),
          call_log_id: logId,
          status: Math.random() < 0.7 ? 'pending' : 'resolved',
          reason: scenario.reason,
          notified_at: isoDaysAgo(dueDaysAgo),
        })
      }
    }
  })
})
