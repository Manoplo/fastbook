/** Misma forma de path que `src/lib/booking-check-in.utils.ts`. */
export function bookingCheckInPath(
  tenantSlug: string,
  checkInToken: string,
): string {
  return `/enterprise/${encodeURIComponent(tenantSlug)}/check-in/${encodeURIComponent(checkInToken)}`
}

export function formatBookingDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) {
    return dateKey
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatBookingTimeLabel(timeValue: string): string {
  const [hours, minutes] = timeValue.split(':')
  if (!hours || !minutes) {
    return timeValue
  }
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('Authorization')
  if (!header) {
    return null
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  const token = match?.[1]?.trim()
  return token && token.length > 0 ? token : null
}
