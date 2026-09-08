import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'

export function useCareData() {
  const [mothers, setMothers] = useState([])
  const [callLogs, setCallLogs] = useState([])
  const [escalations, setEscalations] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, c, e, s] = await Promise.all([
        api.listMothers(),
        api.listCallLogs(),
        api.listEscalations(),
        api.listSchedules(),
      ])
      setMothers(m)
      setCallLogs(c)
      setEscalations(e)
      setSchedules(s)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const motherById = (id) => mothers.find((m) => m.id === id)

  // schedule -> mother lookup requires schedule.mother_id, already present
  const scheduleById = (id) => schedules.find((s) => s.id === id)

  const callLogsWithNames = callLogs.map((log) => {
    const schedule = scheduleById(log.schedule_id)
    const mother = schedule ? motherById(schedule.mother_id) : null
    return { ...log, motherName: mother?.name || 'Unknown', scheduleLabel: schedule?.label || '' }
  })

  const escalationsWithDetail = escalations.map((esc) => {
    const log = callLogs.find((l) => l.id === esc.call_log_id)
    const schedule = log ? scheduleById(log.schedule_id) : null
    const mother = schedule ? motherById(schedule.mother_id) : null
    return { ...esc, mother, log, scheduleLabel: schedule?.label || '' }
  })

  return {
    mothers, callLogs, escalations, schedules,
    callLogsWithNames, escalationsWithDetail,
    motherById, scheduleById,
    loading, error, reload,
  }
}
