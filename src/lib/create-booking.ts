import { createCheckInToken } from './booking-check-in.utils'
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

export type CreateBookingResult = {
  checkInToken: string
}

export {
  BookingConflictError,
  addMinutesToTime,
  formatCustomerPhone,
  toPostgresTime,
} from './create-booking.utils'

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  // Token en cliente: no hay SELECT público en bookings, así que insert().select() fallaría.
  const checkInToken = createCheckInToken()

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
    check_in_token: checkInToken,
  })

  if (error) {
    if (error.code === '23505') {
      throw new BookingConflictError()
    }
    throw error
  }

  // No bloquea la UX si Resend falla; el QR en pantalla ya está.
  void supabase.functions
    .invoke('send-booking-confirmation', {
      body: { checkInToken },
    })
    .then(({ error: invokeError }) => {
      if (invokeError) {
        console.error('send-booking-confirmation invoke failed', invokeError)
      }
    })

  return { checkInToken }
}
