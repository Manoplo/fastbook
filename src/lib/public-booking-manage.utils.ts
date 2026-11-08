import type { Json } from './database.types'

export const BOOKING_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isBookingIdParam(value: string | undefined): value is string {
  return typeof value === 'string' && BOOKING_ID_UUID_RE.test(value)
}

export function publicBookingManagePath(
  tenantSlug: string,
  bookingId: string,
): string {
  return `/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(bookingId)}`
}

export function buildPublicBookingManageUrl(params: {
  origin: string
  tenantSlug: string
  bookingId: string
}): string {
  const origin = params.origin.replace(/\/$/, '')
  return `${origin}${publicBookingManagePath(params.tenantSlug, params.bookingId)}`
}

export type PublicBookingRecord = {
  id: string
  tenant_id: string
  service_id: string | null
  booking_date: string
  start_time: string
  end_time: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  status: string
  notes: string | null
  tenant_slug: string
  tenant_name: string
  service_name: string | null
  service_duration_minutes: number | null
}

export function parsePublicBookingRecord(value: Json): PublicBookingRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid public booking payload')
  }

  const row = value as Record<string, Json | undefined>

  return {
    id: String(row.id ?? ''),
    tenant_id: String(row.tenant_id ?? ''),
    service_id: row.service_id == null ? null : String(row.service_id),
    booking_date: String(row.booking_date ?? ''),
    start_time: String(row.start_time ?? ''),
    end_time: String(row.end_time ?? ''),
    customer_name: String(row.customer_name ?? ''),
    customer_email: String(row.customer_email ?? ''),
    customer_phone: row.customer_phone == null ? null : String(row.customer_phone),
    status: String(row.status ?? ''),
    notes: row.notes == null ? null : String(row.notes),
    tenant_slug: String(row.tenant_slug ?? ''),
    tenant_name: String(row.tenant_name ?? ''),
    service_name: row.service_name == null ? null : String(row.service_name),
    service_duration_minutes:
      typeof row.service_duration_minutes === 'number'
        ? row.service_duration_minutes
        : null,
  }
}

export function mapPublicBookingRpcError(message: string): string {
  if (message.includes('booking_not_found')) {
    return 'No encontramos esta reserva.'
  }
  if (message.includes('booking_not_modifiable')) {
    return 'Esta reserva ya no se puede modificar.'
  }
  if (message.includes('booking_slot_taken')) {
    return 'Ese horario ya está reservado. Elige otra franja.'
  }
  if (message.includes('booking_invalid_email')) {
    return 'El email no es válido.'
  }
  if (message.includes('booking_reschedule_incomplete')) {
    return 'Para reprogramar indica fecha y hora.'
  }
  if (message.includes('booking_invalid_time_range')) {
    return 'La franja horaria no es válida.'
  }
  return 'No se pudo actualizar la reserva. Inténtalo de nuevo.'
}
