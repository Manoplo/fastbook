import { supabase } from './supabase-client'
import type { OccupiedBookingStart } from './occupied-booking-slots.utils'

export type {
  OccupiedBookingStart,
} from './occupied-booking-slots.utils'

export {
  filterSlotsByOccupancy,
  isStartTimeOccupied,
  normalizeTimeHhMm,
  occupiedStartTimeSet,
  occupiedStartsForDate,
} from './occupied-booking-slots.utils'

export async function listOccupiedBookingStarts(options: {
  tenantId: string
  fromDate: string
  toDate: string
  excludeBookingId?: string | null
}): Promise<OccupiedBookingStart[]> {
  const { data, error } = await supabase.rpc('list_occupied_booking_starts', {
    p_tenant_id: options.tenantId,
    p_from: options.fromDate,
    p_to: options.toDate,
    p_exclude_booking_id: options.excludeBookingId ?? undefined,
  })

  if (error) {
    throw error
  }

  return (data ?? []) as OccupiedBookingStart[]
}
