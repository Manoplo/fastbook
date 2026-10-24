export type BookingWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: { id?: string } | null
  bookingId?: string
}

export function extractBookingId(body: BookingWebhookPayload): string | null {
  if (typeof body.bookingId === 'string' && body.bookingId.length > 0) {
    return body.bookingId
  }

  const recordId = body.record?.id
  if (
    body.type === 'INSERT' &&
    body.table === 'bookings' &&
    typeof recordId === 'string' &&
    recordId.length > 0
  ) {
    return recordId
  }

  return null
}

export function isAuthorized(
  req: Request,
  webhookSecret: string | undefined,
): boolean {
  if (!webhookSecret) {
    // Sin secret configurado no aceptamos tráfico (evita función abierta a internet).
    return false
  }

  const bearer = req.headers.get('Authorization')
  if (bearer === `Bearer ${webhookSecret}`) {
    return true
  }

  const headerSecret = req.headers.get('x-booking-webhook-secret')
  return headerSecret === webhookSecret
}

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
