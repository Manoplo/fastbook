export type BookingWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: { id?: string; check_in_token?: string } | null
  bookingId?: string
  checkInToken?: string
}

export type BookingLookup =
  | { kind: 'id'; bookingId: string }
  | { kind: 'token'; checkInToken: string }

export function extractBookingLookup(
  body: BookingWebhookPayload,
): BookingLookup | null {
  if (typeof body.checkInToken === 'string' && body.checkInToken.length > 0) {
    return { kind: 'token', checkInToken: body.checkInToken }
  }

  if (typeof body.bookingId === 'string' && body.bookingId.length > 0) {
    return { kind: 'id', bookingId: body.bookingId }
  }

  const recordId = body.record?.id
  if (
    body.type === 'INSERT' &&
    body.table === 'bookings' &&
    typeof recordId === 'string' &&
    recordId.length > 0
  ) {
    return { kind: 'id', bookingId: recordId }
  }

  return null
}

/** @deprecated usar extractBookingLookup */
export function extractBookingId(body: BookingWebhookPayload): string | null {
  const lookup = extractBookingLookup(body)
  return lookup?.kind === 'id' ? lookup.bookingId : null
}

/**
 * Autoriza:
 * - Webhook / curl con `BOOKING_CONFIRMATION_WEBHOOK_SECRET`
 * - Cliente público con `checkInToken` (se valida contra BBDD después)
 */
export function isAuthorized(
  req: Request,
  webhookSecret: string | undefined,
  body: BookingWebhookPayload,
): boolean {
  if (webhookSecret) {
    const bearer = req.headers.get('Authorization')
    if (bearer === `Bearer ${webhookSecret}`) {
      return true
    }
    const headerSecret = req.headers.get('x-booking-webhook-secret')
    if (headerSecret === webhookSecret) {
      return true
    }
  }

  return (
    typeof body.checkInToken === 'string' && body.checkInToken.length >= 32
  )
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
