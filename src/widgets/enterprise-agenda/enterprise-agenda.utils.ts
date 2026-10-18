import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  startOfDay,
  toDateKey,
} from '@components/calendar/calendar.utils'
import type { TenantBookingRow } from '@src/lib/tenant-bookings'
import type {
  AgendaBookingCardModel,
  AgendaBookingUiStatus,
  AgendaStatusFilter,
  AgendaStatusFilterOption,
} from './enterprise-agenda.types'

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const WEEKDAY_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const

export { WEEKDAY_LABELS, addMonths, buildMonthGrid, formatMonthYear, startOfDay, toDateKey }

export function formatAgendaDateLabel(date: Date): string {
  const weekday = WEEKDAY_LONG[date.getDay()]
  const month = MONTH_NAMES[date.getMonth()]
  return `${weekday}, ${date.getDate()} de ${month} de ${date.getFullYear()}`
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const AGENDA_STATUS_FILTERS: AgendaStatusFilterOption[] = [
  { id: 'all', label: 'Todas las citas', tone: 'all' },
  { id: 'confirmed', label: 'Confirmadas', tone: 'confirmed' },
  { id: 'in_progress', label: 'En curso', tone: 'in-progress' },
  { id: 'completed', label: 'Completadas', tone: 'completed' },
  { id: 'cancelled', label: 'Canceladas', tone: 'cancelled' },
]

export function formatTimeHhMm(time: string): string {
  return time.slice(0, 5)
}

export function parseTimeToMinutes(time: string): number {
  const [hoursRaw, minutesRaw] = time.split(':').map(Number)
  return hoursRaw * 60 + minutesRaw
}

export function durationMinutesBetween(startTime: string, endTime: string): number {
  return Math.max(0, parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime))
}

export function combineDateAndTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

export function deriveAgendaUiStatus(
  booking: Pick<TenantBookingRow, 'status' | 'booking_date' | 'start_time' | 'end_time'>,
  now: Date,
): AgendaBookingUiStatus {
  if (booking.status === 'cancelled') {
    return 'cancelled'
  }

  const start = combineDateAndTime(booking.booking_date, booking.start_time)
  const end = combineDateAndTime(booking.booking_date, booking.end_time)

  if (now >= end) {
    return 'completed'
  }
  if (now >= start && now < end) {
    return 'in_progress'
  }
  return 'confirmed'
}

export function formatBookingRef(id: string): string {
  return `#FB-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
}

export function formatAgendaPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price)
}

export function toAgendaBookingCard(
  booking: TenantBookingRow,
  now: Date,
): AgendaBookingCardModel {
  const durationFromTimes = durationMinutesBetween(booking.start_time, booking.end_time)
  const durationMinutes =
    durationFromTimes > 0
      ? durationFromTimes
      : (booking.service?.duration_minutes ?? 60)

  return {
    id: booking.id,
    bookingDate: booking.booking_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
    durationMinutes,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    notes: booking.notes,
    serviceName: booking.service?.name ?? 'Servicio',
    price: Number(booking.service?.price ?? 0),
    dbStatus: booking.status,
    uiStatus: deriveAgendaUiStatus(booking, now),
    refLabel: formatBookingRef(booking.id),
  }
}

export function bookingMatchesSearch(
  booking: AgendaBookingCardModel,
  search: string,
): boolean {
  const query = search.trim().toLowerCase()
  if (!query) {
    return true
  }

  const haystack = [
    booking.customerName,
    booking.customerEmail,
    booking.customerPhone ?? '',
    booking.refLabel,
    booking.serviceName,
    booking.id,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

export function filterAgendaBookings(
  bookings: AgendaBookingCardModel[],
  options: { statusFilter: AgendaStatusFilter; search: string },
): AgendaBookingCardModel[] {
  return bookings.filter((booking) => {
    if (!bookingMatchesSearch(booking, options.search)) {
      return false
    }
    if (options.statusFilter === 'all') {
      return true
    }
    return booking.uiStatus === options.statusFilter
  })
}

export function countAgendaByStatus(
  bookings: AgendaBookingCardModel[],
): Record<AgendaStatusFilter, number> {
  const counts: Record<AgendaStatusFilter, number> = {
    all: bookings.length,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  }

  for (const booking of bookings) {
    counts[booking.uiStatus] += 1
  }

  return counts
}

/** Ingresos previstos del día: citas no canceladas. */
export function sumProjectedRevenue(bookings: AgendaBookingCardModel[]): number {
  return bookings
    .filter((booking) => booking.uiStatus !== 'cancelled')
    .reduce((sum, booking) => sum + booking.price, 0)
}

export function countActiveBookings(bookings: AgendaBookingCardModel[]): number {
  return bookings.filter((booking) => booking.uiStatus !== 'cancelled').length
}

export function collectBookingDateKeys(bookings: TenantBookingRow[]): Set<string> {
  return new Set(bookings.map((booking) => booking.booking_date))
}

export function monthRangeKeys(viewMonth: Date): { fromDate: string; toDate: string } {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0)
  return {
    fromDate: toDateKey(from),
    toDate: toDateKey(to),
  }
}

/** Rango de consulta: mes del calendario + día seleccionado (por si no coincide). */
export function resolveBookingsQueryRange(
  viewMonth: Date,
  selectedDate: Date,
): { fromDate: string; toDate: string } {
  const month = monthRangeKeys(viewMonth)
  const selected = toDateKey(selectedDate)
  return {
    fromDate: selected < month.fromDate ? selected : month.fromDate,
    toDate: selected > month.toDate ? selected : month.toDate,
  }
}

export function formatActiveRangeLabel(
  windows: Array<{ start_time: string; end_time: string }>,
): string {
  if (windows.length === 0) {
    return 'Sin horario'
  }

  const starts = windows.map((window) => window.start_time).sort()
  const ends = windows.map((window) => window.end_time).sort()
  return `${formatTimeHhMm(starts[0]!)} – ${formatTimeHhMm(ends[ends.length - 1]!)}`
}

export function getWindowsForWeekday(
  windows: Array<{ day_of_week: number; start_time: string; end_time: string }>,
  date: Date,
): Array<{ start_time: string; end_time: string }> {
  const dayOfWeek = date.getDay()
  return windows
    .filter((window) => window.day_of_week === dayOfWeek)
    .map((window) => ({
      start_time: window.start_time,
      end_time: window.end_time,
    }))
}

export function statusBadgeLabel(status: AgendaBookingUiStatus): string {
  switch (status) {
    case 'in_progress':
      return 'En Curso (Ahora)'
    case 'completed':
      return 'Completada'
    case 'cancelled':
      return 'Cancelada'
    case 'confirmed':
    default:
      return 'Confirmada'
  }
}

export function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) {
    return null
  }
  return `https://wa.me/${digits}`
}
