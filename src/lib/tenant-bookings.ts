import { supabase } from './supabase-client'
import type { Tables, TablesUpdate } from './database.types'
import { addMinutesToTime, toPostgresTime } from './create-booking.utils'

export type TenantBookingService = Pick<
  Tables<'services'>,
  'id' | 'name' | 'price' | 'duration_minutes'
>

export type TenantBookingRow = Tables<'bookings'> & {
  service: TenantBookingService | null
}

const BOOKING_SELECT = `
  id,
  tenant_id,
  service_id,
  booking_date,
  start_time,
  end_time,
  customer_name,
  customer_email,
  customer_phone,
  status,
  created_at,
  notes,
  service:services (
    id,
    name,
    price,
    duration_minutes
  )
`

export async function listTenantBookingsInRange(
  tenantId: string,
  fromDate: string,
  toDate: string,
): Promise<TenantBookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('tenant_id', tenantId)
    .gte('booking_date', fromDate)
    .lte('booking_date', toDate)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as TenantBookingRow[]
}

export async function getTenantBookingById(
  tenantId: string,
  bookingId: string,
): Promise<TenantBookingRow | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('tenant_id', tenantId)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as TenantBookingRow | null) ?? null
}

export type UpdateTenantBookingInput = {
  customerName?: string
  customerEmail?: string
  customerPhone?: string | null
  bookingDate?: string
  startTime?: string
  durationMinutes?: number
  status?: 'confirmed' | 'cancelled'
}

export async function updateTenantBooking(
  bookingId: string,
  input: UpdateTenantBookingInput,
): Promise<void> {
  const patch: TablesUpdate<'bookings'> = {}

  if (input.customerName !== undefined) {
    patch.customer_name = input.customerName.trim()
  }
  if (input.customerEmail !== undefined) {
    patch.customer_email = input.customerEmail.trim().toLowerCase()
  }
  if (input.customerPhone !== undefined) {
    patch.customer_phone = input.customerPhone?.trim() || null
  }
  if (input.status !== undefined) {
    patch.status = input.status
  }
  if (
    input.bookingDate !== undefined &&
    input.startTime !== undefined &&
    input.durationMinutes !== undefined
  ) {
    patch.booking_date = input.bookingDate
    patch.start_time = toPostgresTime(input.startTime)
    patch.end_time = addMinutesToTime(input.startTime, input.durationMinutes)
  }

  const { error } = await supabase.from('bookings').update(patch).eq('id', bookingId)

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese horario ya está reservado. Elige otra franja.')
    }
    throw error
  }
}
