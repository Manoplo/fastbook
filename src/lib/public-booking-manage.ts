import { supabase } from './supabase-client'
import {
  mapPublicBookingRpcError,
  parsePublicBookingRecord,
  type PublicBookingRecord,
} from './public-booking-manage.utils'
import { toPostgresTime } from './create-booking.utils'

export type { PublicBookingRecord } from './public-booking-manage.utils'

export {
  buildPublicBookingManageUrl,
  isBookingIdParam,
  mapPublicBookingRpcError,
  publicBookingManagePath,
} from './public-booking-manage.utils'

export class PublicBookingManageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicBookingManageError'
  }
}

function throwMappedRpcError(error: { message: string }): never {
  throw new PublicBookingManageError(mapPublicBookingRpcError(error.message))
}

export async function getPublicBooking(
  tenantSlug: string,
  bookingId: string,
): Promise<PublicBookingRecord> {
  const { data, error } = await supabase.rpc('get_public_booking', {
    p_tenant_slug: tenantSlug,
    p_booking_id: bookingId,
  })

  if (error) {
    throwMappedRpcError(error)
  }

  return parsePublicBookingRecord(data)
}

export async function updatePublicBookingContact(options: {
  tenantSlug: string
  bookingId: string
  customerEmail: string
  customerPhone: string | null
}): Promise<PublicBookingRecord> {
  const { data, error } = await supabase.rpc('update_public_booking', {
    p_tenant_slug: options.tenantSlug,
    p_booking_id: options.bookingId,
    p_customer_email: options.customerEmail,
    p_customer_phone: options.customerPhone ?? '',
  })

  if (error) {
    throwMappedRpcError(error)
  }

  return parsePublicBookingRecord(data)
}

export async function reschedulePublicBooking(options: {
  tenantSlug: string
  bookingId: string
  bookingDate: string
  startTime: string
  endTime: string
}): Promise<PublicBookingRecord> {
  const { data, error } = await supabase.rpc('update_public_booking', {
    p_tenant_slug: options.tenantSlug,
    p_booking_id: options.bookingId,
    p_booking_date: options.bookingDate,
    p_start_time: toPostgresTime(options.startTime),
    p_end_time: toPostgresTime(options.endTime),
  })

  if (error) {
    throwMappedRpcError(error)
  }

  return parsePublicBookingRecord(data)
}

export async function cancelPublicBooking(
  tenantSlug: string,
  bookingId: string,
): Promise<PublicBookingRecord> {
  const { data, error } = await supabase.rpc('cancel_public_booking', {
    p_tenant_slug: tenantSlug,
    p_booking_id: bookingId,
  })

  if (error) {
    throwMappedRpcError(error)
  }

  return parsePublicBookingRecord(data)
}
