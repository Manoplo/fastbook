import { supabase } from './supabase-client'
import {
  BookingConflictError,
  addMinutesToTime,
  toPostgresTime,
} from './create-booking.utils'

export type CreateBookingInput = {
  tenantId: string
  serviceId: string
  bookingDate: string
  startTime: string
  durationMinutes: number
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  notes?: string | null
}

export {
  BookingConflictError,
  addMinutesToTime,
  formatCustomerPhone,
  toPostgresTime,
} from './create-booking.utils'

export async function createBooking(input: CreateBookingInput): Promise<void> {
  const { error } = await supabase.from('bookings').insert({
    tenant_id: input.tenantId,
    service_id: input.serviceId,
    booking_date: input.bookingDate,
    start_time: toPostgresTime(input.startTime),
    end_time: addMinutesToTime(input.startTime, input.durationMinutes),
    customer_name: input.customerName.trim(),
    customer_email: input.customerEmail.trim().toLowerCase(),
    customer_phone: input.customerPhone?.trim() || null,
    notes: input.notes?.trim() || null,
    status: 'confirmed',
  })

  if (!error) {
    return
  }

  if (error.code === '23505') {
    throw new BookingConflictError()
  }

  throw error
}
