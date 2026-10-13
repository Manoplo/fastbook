import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantBookingService = Pick<
  Tables<'services'>,
  'id' | 'name' | 'price' | 'duration_minutes'
>

export type TenantBookingRow = Tables<'bookings'> & {
  service: TenantBookingService | null
}

export async function listTenantBookingsInRange(
  tenantId: string,
  fromDate: string,
  toDate: string,
): Promise<TenantBookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
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
    `,
    )
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
