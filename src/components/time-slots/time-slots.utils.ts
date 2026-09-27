export type AvailabilityWindow = {
  day_of_week: number
  start_time: string
  end_time: string
}

export type TimeSlotPeriod = 'morning' | 'afternoon'

export type TimeSlot = {
  startTime: string
  period: TimeSlotPeriod
}

/** Hora local de corte mañana / tarde (14:00). */
const AFTERNOON_START_MINUTES = 14 * 60

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function periodForStartMinutes(startMinutes: number): TimeSlotPeriod {
  return startMinutes < AFTERNOON_START_MINUTES ? 'morning' : 'afternoon'
}

/**
 * Genera huecos de `durationMinutes` dentro de las ventanas del día.
 * Las ventanas se deduplican por (start, end).
 */
export function buildSlotsForDay(options: {
  dayOfWeek: number
  windows: AvailabilityWindow[]
  durationMinutes: number
}): TimeSlot[] {
  const { dayOfWeek, windows, durationMinutes } = options

  if (durationMinutes <= 0) {
    return []
  }

  const dayWindows = windows.filter((window) => window.day_of_week === dayOfWeek)
  const uniqueKeys = new Set<string>()
  const slots: TimeSlot[] = []

  for (const window of dayWindows) {
    const key = `${window.start_time}-${window.end_time}`
    if (uniqueKeys.has(key)) {
      continue
    }
    uniqueKeys.add(key)

    const start = timeToMinutes(window.start_time)
    const end = timeToMinutes(window.end_time)

    for (
      let cursor = start;
      cursor + durationMinutes <= end;
      cursor += durationMinutes
    ) {
      slots.push({
        startTime: minutesToTime(cursor),
        period: periodForStartMinutes(cursor),
      })
    }
  }

  slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  return slots
}

/** Fechas futuras (incl. hoy) con al menos una ventana semanal. */
export function buildAvailableDates(options: {
  windows: AvailabilityWindow[]
  from: Date
  daysAhead?: number
}): Date[] {
  const { windows, from, daysAhead = 90 } = options
  const openWeekdays = new Set(windows.map((window) => window.day_of_week))
  const dates: Date[] = []

  for (let offset = 0; offset < daysAhead; offset++) {
    const date = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset,
    )
    if (openWeekdays.has(date.getDay())) {
      dates.push(date)
    }
  }

  return dates
}
