export function addMinutesToTime(startTime: string, minutes: number): string {
  const [hoursRaw, minutesRaw] = startTime.split(':').map(Number)
  const totalMinutes = hoursRaw * 60 + minutesRaw + minutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`
}

export function toPostgresTime(timeHhMm: string): string {
  return timeHhMm.length === 5 ? `${timeHhMm}:00` : timeHhMm
}

export function formatCustomerPhone(
  countryCode: string,
  phone: string,
): string | null {
  const trimmed = phone.trim()
  if (!trimmed) {
    return null
  }
  return `${countryCode} ${trimmed}`
}

export class BookingConflictError extends Error {
  constructor() {
    super('Ese horario ya está reservado. Elige otra franja.')
    this.name = 'BookingConflictError'
  }
}
