import { startOfDay, toDateKey } from '@components/calendar/calendar.utils'

export type BookingWindowDraft = {
  opensOn: string
  closesOn: string
}

export function emptyBookingWindowDraft(): BookingWindowDraft {
  return { opensOn: '', closesOn: '' }
}

export function bookingWindowFromTenant(tenant: {
  booking_opens_on: string | null
  booking_closes_on: string | null
}): BookingWindowDraft {
  return {
    opensOn: tenant.booking_opens_on ?? '',
    closesOn: tenant.booking_closes_on ?? '',
  }
}

export function bookingWindowToRowValues(draft: BookingWindowDraft): {
  booking_opens_on: string | null
  booking_closes_on: string | null
} {
  const opensOn = draft.opensOn.trim() || null
  const closesOn = draft.closesOn.trim() || null
  return {
    booking_opens_on: opensOn,
    booking_closes_on: closesOn,
  }
}

export function validateBookingWindowDraft(
  draft: BookingWindowDraft,
): string | null {
  const { booking_opens_on, booking_closes_on } = bookingWindowToRowValues(draft)
  if (booking_opens_on && booking_closes_on && booking_closes_on < booking_opens_on) {
    return 'La fecha máxima debe ser igual o posterior a la fecha mínima.'
  }
  return null
}

/** Interpreta `YYYY-MM-DD` (o timestamptz date prefix) como Date local a medianoche. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }
  const datePart = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return startOfDay(new Date(year, month - 1, day))
}

export function resolveBookingRange(options: {
  today: Date
  opensOn: string | null | undefined
  closesOn: string | null | undefined
  defaultDaysAhead?: number
}): { from: Date; to: Date; minDate: Date; maxDate: Date | null } {
  const today = startOfDay(options.today)
  const opens = parseDateOnly(options.opensOn)
  const closes = parseDateOnly(options.closesOn)
  const defaultDaysAhead = options.defaultDaysAhead ?? 90

  const from = opens && opens > today ? opens : today
  const maxDate = closes
  const to = maxDate
    ? maxDate
    : new Date(from.getFullYear(), from.getMonth(), from.getDate() + defaultDaysAhead - 1)

  return {
    from,
    to: to < from ? from : to,
    minDate: from,
    maxDate,
  }
}

export function inclusiveDayCount(from: Date, to: Date): number {
  const start = startOfDay(from)
  const end = startOfDay(to)
  const ms = end.getTime() - start.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

export function dateKeyOrEmpty(date: Date | null): string {
  return date ? toDateKey(date) : ''
}
