import { toPostgresTime } from './create-booking.utils'
import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantAvailabilityRow = Tables<'tenant_availability'>

export type TenantAvailabilityWindowInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type TenantBookingWindowPatch = {
  booking_opens_on: string | null
  booking_closes_on: string | null
}

export async function updateTenantBookingWindow(
  tenantId: string,
  patch: TenantBookingWindowPatch,
): Promise<TenantBookingWindowPatch> {
  const { data, error } = await supabase
    .from('tenants')
    .update(patch)
    .eq('id', tenantId)
    .select('booking_opens_on, booking_closes_on')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listTenantAvailability(
  tenantId: string,
): Promise<TenantAvailabilityRow[]> {
  const { data, error } = await supabase
    .from('tenant_availability')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

/** Reemplaza el set semanal completo (delete + insert). */
export async function replaceTenantAvailability(
  tenantId: string,
  windows: TenantAvailabilityWindowInput[],
): Promise<TenantAvailabilityRow[]> {
  const { error: deleteError } = await supabase
    .from('tenant_availability')
    .delete()
    .eq('tenant_id', tenantId)

  if (deleteError) {
    throw deleteError
  }

  if (windows.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('tenant_availability')
    .insert(
      windows.map((window) => ({
        tenant_id: tenantId,
        day_of_week: window.dayOfWeek,
        start_time: toPostgresTime(window.startTime),
        end_time: toPostgresTime(window.endTime),
      })),
    )
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}
