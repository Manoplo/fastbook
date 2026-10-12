import { toPostgresTime } from './create-booking.utils'
import { supabase } from './supabase-client'
import type { Tables } from './database.types'

export type TenantAvailabilityRow = Tables<'tenant_availability'>

export type TenantAvailabilityWindowInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
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
