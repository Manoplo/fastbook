import { supabase } from './supabase-client'

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

export function addMinutesToTime(startTime: string, minutes: number): string {
  const [hoursRaw, minutesRaw] = startTime.split(':').map(Number)
  const totalMinutes = hoursRaw * 60 + minutesRaw + minutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`
}

export function toPostgresTime(timeHhMm: string): string {
  return timeHhMm.length === 5 ? `${timeHhMm}:00` : timeHhMm
}

export function formatCustomerPhone(
  countryCode: string,
  phone: string,
): string | null {
  const trimmed = phone.trim()
  if (!trimmed) {
    return null
  }
  return `${countryCode} ${trimmed}`
}

export class BookingConflictError extends Error {
  constructor() {
    super('Ese horario ya está reservado. Elige otra franja.')
    this.name = 'BookingConflictError'
  }
}

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
